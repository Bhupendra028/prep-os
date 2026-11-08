// Prep OS v6.2: conservative, account-scoped Firestore sync. Never uploads PDF bytes.
import {firebaseConfig} from '../cloud-config.js';
import {getItem,putItem} from './db.js';
const base='https://www.gstatic.com/firebasejs/11.10.0/';
const fields=['statuses','readingNotes','annotations','flashcards','sessions','answers','dailyTasks','documents','lastOpenedReading','currentDocId','readingPositions','examDate','weeklyHours'];
const maps=new Set(['statuses','readingNotes','annotations','dailyTasks','readingPositions']);
const arrays=new Set(['flashcards','sessions','answers','documents']);
const localOnly=new Set(['libraryQuery','selectedSubject','curriculumSearch']);
let f,db,auth,uid=null,unsubscribe=null,interval=null,busy=false,dirty=false,notice='Not connected',onUpdate=()=>{};
const clone=v=>structuredClone(v);
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const key=(u)=>'sync-v62-'+u;
const conflictKey=(u)=>'sync-v62-conflicts-'+u;
function identity(x){return x?.cloudId?`cloud:${x.cloudId}`:x?.id?`id:${x.id}`:null;}
function mergeArray(base,local,remote,field,conflicts){
 const b=new Map((base||[]).map(x=>[identity(x),x])),l=new Map((local||[]).map(x=>[identity(x),x])),r=new Map((remote||[]).map(x=>[identity(x),x]));
 const result=[];for(const id of new Set([...b.keys(),...l.keys(),...r.keys()])){
  if(!id)continue;const old=b.get(id),a=l.get(id),z=r.get(id);
  let selected;
  if(eq(a,z))selected=a;
  else if(eq(a,old))selected=z;
  else if(eq(z,old))selected=a;
  else if(field==='documents'&&a&&z){selected={...z,...a,cloudId:a.cloudId||z.cloudId,missing:a.missing??true,indexed:a.indexed??false};}
  else {conflicts.push({field,id,local:a??null,cloud:z??null,at:Date.now()});selected=a??z;}
  if(selected)result.push(selected);
 }return result;
}
function merge(base,local,remote){const conflicts=[],out={...local};
 for(const field of fields){const b=base?.[field],a=local[field],z=remote?.[field];if(z===undefined)continue;
  if(maps.has(field)){
   const merged={...a};for(const k of new Set([...Object.keys(b||{}),...Object.keys(a||{}),...Object.keys(z||{})])){
    const old=b?.[k],lv=a?.[k],rv=z?.[k];
    if(eq(lv,rv)){if(lv===undefined)delete merged[k];else merged[k]=lv;}
    else if(eq(lv,old)){if(rv===undefined)delete merged[k];else merged[k]=rv;}
    else if(eq(rv,old)){if(lv===undefined)delete merged[k];else merged[k]=lv;}
    else{conflicts.push({field,id:k,local:lv??null,cloud:rv??null,at:Date.now()});}
   }out[field]=merged;
  }else if(arrays.has(field))out[field]=mergeArray(b,a,z,field,conflicts);
  else if(eq(a,z))out[field]=a;
  else if(eq(a,b))out[field]=z;
  else if(eq(z,b))out[field]=a;
  else {conflicts.push({field,id:'value',local:a??null,cloud:z??null,at:Date.now()});out[field]=a;}
 }
 return {state:out,conflicts};
}
export function status(){return notice;}
export async function conflicts(){return uid?(await getItem('kv',conflictKey(uid)))||[]:[];}
export function markDirty(){dirty=true;}
export async function start(user,getState,applyState,notify){stop();if(!user)return;uid=user.uid;onUpdate=notify||(()=>{});notice='Connecting';onUpdate();
 const [app,fs,au]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-firestore.js'),import(base+'firebase-auth.js')]);
 const instance=app.getApps().length?app.getApp():app.initializeApp(firebaseConfig);f=fs;db=fs.getFirestore(instance);auth=au.getAuth(instance);
 const ref=fs.doc(db,'users',uid,'sync','v62');
 const run=async()=>{if(busy||!uid||auth.currentUser?.uid!==uid)return;busy=true;try{
  const local=getState(),baseline=(await getItem('kv',key(uid)))||null;
  const snap=await fs.getDocFromServer(ref);const remote=snap.exists()?snap.data().payload:null;
  const merged=remote?merge(baseline,local,remote):{state:clone(local),conflicts:[]};
  if(merged.conflicts.length){const prev=(await getItem('kv',conflictKey(uid)))||[];await putItem('kv',conflictKey(uid),[...prev,...merged.conflicts].slice(-250));notice=`${merged.conflicts.length} new conflict(s) saved locally`;}
  const canonical={};for(const field of fields)if(merged.state[field]!==undefined)canonical[field]=merged.state[field];
  // Guard against concurrent writes with a Firestore transaction. Retry on races.
  await fs.runTransaction(db,async tx=>{
   const latest=await tx.get(ref);const current=latest.exists()?latest.data().payload:null;
   if(!eq(current,remote))throw Error('Cloud changed during sync; retrying next cycle');
   tx.set(ref,{payload:canonical,updatedAt:fs.serverTimestamp(),schema:2});
  });
  await putItem('kv',key(uid),clone(canonical));
  // applyState persists locally; never replaces local PDF bytes.
  await applyState(merged.state);dirty=false;
  if(!merged.conflicts.length)notice='Synced';
 }catch(e){notice=navigator.onLine?'Sync pending: '+e.message:'Offline — changes saved locally';console.warn('Prep OS sync',e);}finally{busy=false;onUpdate();}};
 await run();interval=setInterval(run,12000);
 document.addEventListener('visibilitychange',visibilityHandler);
 function visibilityHandler(){if(!document.hidden)run();}
 unsubscribe=()=>document.removeEventListener('visibilitychange',visibilityHandler);
}
export function stop(){if(interval)clearInterval(interval);interval=null;if(unsubscribe)unsubscribe();unsubscribe=null;uid=null;notice='Not connected';}
export {merge};
