/* Fit OS cloud bridge 2.0 — safety-first sync with explicit activation.
   Local browser data is always authoritative until the user chooses Upload or Restore.
   Writes use a transaction to avoid silently overwriting a newer cloud revision.
   Existing Firestore path is retained: users/{uid}/documents/fit-os-state.
   Full-state document remains subject to Firestore's 1 MiB document limit. */
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore, doc, getDocFromServer, onSnapshot, runTransaction, serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
const config={apiKey:'AIzaSyBRw7TF0kFktFi4Jbj8ntOBeKeUnA957dE',authDomain:'fit-os-private.firebaseapp.com',projectId:'fit-os-private',storageBucket:'fit-os-private.firebasestorage.app',messagingSenderId:'93982135112',appId:'1:93982135112:web:51906eecfdb06107edd97d',measurementId:'G-GLG5KLWM47'};
const app=initializeApp(config),auth=getAuth(app),db=getFirestore(app),provider=new GoogleAuthProvider();
const status=document.getElementById('cloudStatus'),login=document.getElementById('cloudLogin'),upload=document.getElementById('cloudUpload'),download=document.getElementById('cloudDownload');
let user=null,unsubscribe=null,ready=false,busy=false,dirty=false,timer=null,knownRevision=null,ignoreLocal=false,sessionSerial=0,retryWait=1200;
const local=()=>window.FitOSBridge?.getState();
const path=()=>doc(db,'users',user.uid,'documents','fit-os-state');
const key=uid=>'fit-os-sync-v2-'+uid;
// Fingerprint is a change detector, not cryptographic integrity verification.
function fingerprint(obj){const str=JSON.stringify(obj);let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return str.length+':'+(h>>>0).toString(16)}
function savedMeta(){try{return JSON.parse(localStorage.getItem(key(user.uid))||'null')}catch{return null}}
function recordMeta(rev,state){try{localStorage.setItem(key(user.uid),JSON.stringify({revision:rev,hash:fingerprint(state),savedAt:new Date().toISOString()}))}catch(e){console.warn('Unable to save sync metadata',e)}}
function message(s){status.textContent=s;status.title=s}
function error(e){console.error('Fit OS cloud:',e);const label=e?.code||e?.message||'Unknown error';message('Cloud error: '+label+' · local data safe')}
function apply(remote){ignoreLocal=true;try{window.FitOSBridge?.applyState(remote)}finally{ignoreLocal=false}}
async function getRemote(){const snap=await getDocFromServer(path());return snap.exists()?snap.data():null}
function clearTimer(){if(timer!==null){clearTimeout(timer);timer=null}}
function schedule(){if(!ready||!user||!dirty||busy)return;clearTimer();if(!navigator.onLine){message('Offline · changes saved locally (pending sync)');return}timer=setTimeout(()=>{timer=null;uploadNow()},retryWait)}
window.FitOSCloud={localChanged:()=>{if(ignoreLocal)return;dirty=true;retryWait=1200;if(!ready||!user)return;schedule()},state:()=>({signedIn:!!user,active:ready,pending:dirty,busy})};
async function uploadNow(){if(!user||!ready||busy||!dirty)return;if(!navigator.onLine){message('Offline · changes saved locally (pending sync)');return}const serial=sessionSerial,me=user.uid,snapshot=local();if(!snapshot)return;
 const bytes=new TextEncoder().encode(JSON.stringify(snapshot)).length;
 // Firestore document limit is 1 MiB INCLUDING field/index metadata; guard conservatively.
 if(bytes>840000){ready=false;message('Cloud paused · JSON exceeds safe single-document size. Export a backup.');return}
 busy=true;message('Uploading changes…');const newRevision=crypto.randomUUID?.()||Date.now().toString(36),expected=knownRevision;
 try{await runTransaction(db,async trx=>{const snap=await trx.get(path());const actual=snap.exists()?(snap.data().revision??null):null;
   if(actual!==expected)throw new Error('CONFLICT: Cloud changed on another device');
   trx.set(path(),{state:snapshot,revision:newRevision,updatedAt:serverTimestamp(),schema:2});
 });
 if(serial!==sessionSerial||!user||user.uid!==me)return;
 knownRevision=newRevision;retryWait=1200;recordMeta(newRevision,snapshot);dirty=fingerprint(local())!==fingerprint(snapshot);
 message(dirty?'New local edits waiting to sync…':'Cloud synced ✓');
 }catch(e){if(serial!==sessionSerial)return;
 if(String(e?.message||'').includes('CONFLICT')){ready=false;message('Cloud conflict · download backups, then choose Upload local or Restore cloud');}
 else if(e?.code==='unavailable'||!navigator.onLine){retryWait=Math.min(60000,retryWait*2);message('Network unavailable · local changes queued for retry');}
 else{ready=false;error(e);}
 }finally{busy=false;if(serial===sessionSerial&&dirty&&ready&&navigator.onLine)schedule()}
}
function listen(){unsubscribe?.();unsubscribe=onSnapshot(path(),{includeMetadataChanges:true},snap=>{
 if(!user||!ready||snap.metadata.fromCache||snap.metadata.hasPendingWrites||!snap.exists())return;
 const remote=snap.data(),rev=remote.revision??null;
 if(rev===knownRevision)return;
 // A changed cloud must never overwrite unsynced local work.
 if(dirty){ready=false;clearTimer();message('Cloud conflict · newer cloud data and unsynced local edits. Choose explicitly.');return}
 if(remote.state){apply(remote.state);knownRevision=rev;recordMeta(rev,remote.state);message('Cloud synced ✓')}
 },error)}
async function start(u){const serial=++sessionSerial;unsubscribe?.();unsubscribe=null;clearTimer();user=u;ready=false;dirty=false;busy=false;knownRevision=null;retryWait=1200;
 upload.hidden=!u;download.hidden=!u;login.textContent=u?'Sign out':'Google sign-in';
 if(!u){message('Local only · sign in to sync');return}
 if(!navigator.onLine){message('Offline · records saved locally. Sign-in sync resumes online.');return}
 message('Checking cloud data…');
 try{const remote=await getRemote();if(serial!==sessionSerial)return;const meta=savedMeta(),current=local();
 if(meta?.revision&&remote?.state){knownRevision=meta.revision;dirty=fingerprint(current)!==meta.hash;
  if(remote.revision===meta.revision){ready=true;listen();if(dirty){message('Local changes pending sync…');schedule()}else message('Cloud synced ✓');return}
  if(!dirty){apply(remote.state);knownRevision=remote.revision??null;recordMeta(knownRevision,remote.state);ready=true;listen();message('Newer cloud records loaded ✓');return}
  message('Cloud conflict · local & cloud changes; export backup, then choose');return;
 }
 message(remote?.state?'Cloud found · choose Restore cloud or Upload local':'Cloud is empty · click Upload local to start sync');
 }catch(e){if(serial===sessionSerial)error(e)}
}
login.addEventListener('click',async()=>{if(user){try{await signOut(auth)}catch(e){error(e)}return}try{await signInWithPopup(auth,provider)}catch(e){if(e.code==='auth/popup-blocked'){try{await signInWithRedirect(auth,provider)}catch(r){error(r)}}else error(e)}});
upload.addEventListener('click',async()=>{if(!user)return;if(!navigator.onLine)return message('Offline · connect to internet before initial cloud upload');
 try{const remote=await getRemote();if(remote?.state&&!confirm('This will REPLACE the cloud copy with this device’s records. Export JSON backups of both devices first. Continue?'))return;
 if(!confirm('Upload this device’s saved records to your private cloud and enable automatic synchronization?'))return;
 knownRevision=remote?.revision??null;ready=true;dirty=true;await uploadNow();if(ready)listen();
 }catch(e){error(e)}});
download.addEventListener('click',async()=>{if(!user)return;if(!navigator.onLine)return message('Offline · connect to internet before restoring cloud');
 try{const remote=await getRemote();if(!remote?.state){message('No cloud backup available');return}
 if(!confirm('Replace this device’s LOCAL records with the cloud copy? Save a JSON backup first.'))return;
 apply(remote.state);knownRevision=remote.revision??null;dirty=false;ready=true;recordMeta(knownRevision,remote.state);listen();message('Restored cloud records · auto-sync enabled ✓');
 }catch(e){error(e)}});
window.addEventListener('online',()=>{if(user&&ready&&dirty){message('Online · resuming sync…');schedule()}else if(user&&!ready)message('Online · open Account & Sync to activate or resolve sync')});
window.addEventListener('offline',()=>{if(user&&ready)message('Offline · edits are saved on this device')});
getRedirectResult(auth).catch(error);onAuthStateChanged(auth,start,error);
