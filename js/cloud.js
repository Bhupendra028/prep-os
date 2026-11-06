// Private Firebase integration. Uses Firebase Web SDK and public browser config.
// Never place service-account credentials or private API keys in public source.
import {firebaseConfig} from '../cloud-config.js';
let auth, storage, db, sdk, user, initPromise;
const base='https://www.gstatic.com/firebasejs/11.10.0/';
export function configured(){return Boolean(firebaseConfig?.apiKey && firebaseConfig?.projectId && firebaseConfig?.storageBucket);}
export function currentUser(){return user;}
export function hasGoogleProvider(){return Boolean(user?.providerData?.some(p=>p.providerId==='google.com'));}
export async function initialize(){
 if(!configured())throw Error('Firebase is not configured. See CLOUD-SETUP.md.');
 if(initPromise)return initPromise;
 initPromise=(async()=>{
  const [app,a,s,f]=await Promise.all([
   import(base+'firebase-app.js'),import(base+'firebase-auth.js'),
   import(base+'firebase-storage.js'),import(base+'firebase-firestore.js')
  ]);
  const instance=app.initializeApp(firebaseConfig);
  auth=a.getAuth(instance); storage=s.getStorage(instance);db=f.getFirestore(instance);
  sdk={a,s,f};
  a.onAuthStateChanged(auth,nextUser=>{user=nextUser;});
  // Restore the previous sign-in on reload before showing account status.
  if(typeof auth.authStateReady==='function')await auth.authStateReady();
  user=auth.currentUser;
  return user;
 })().catch(e=>{initPromise=null;throw e;});
 return initPromise;
}
function googleProvider(){const p=new sdk.a.GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});return p;}
export async function connectGoogle(){
 await initialize();
 // Trigger from a direct button click; browsers may block unsolicited popups.
 const result=await sdk.a.signInWithPopup(auth,googleProvider());
 user=result.user;return user;
}
export async function connect(email,password){
 await initialize();if(!email||!password)throw Error('Enter your existing email and password.');
 const result=await sdk.a.signInWithEmailAndPassword(auth,email,password);
 user=result.user;return user;
}
export async function linkGoogle(){
 await initialize();required();
 if(hasGoogleProvider())return user;
 const result=await sdk.a.linkWithPopup(user,googleProvider());
 user=result.user;return user;
}
export async function disconnect(){await initialize();await sdk.a.signOut(auth);user=null;}
function required(){if(!user)throw Error('Sign in with Google to access the private cloud library.');}
export async function listBooks(){await initialize();required();const ref=sdk.f.doc(db,'users',user.uid);const snap=await sdk.f.getDoc(ref);return snap.exists()?(snap.data().books||[]):[];}
export async function fetchBook(book){await initialize();required();if(!book?.id||!/^[a-z0-9-]+$/.test(book.id))throw Error('Invalid book identifier');
 const ref=sdk.s.ref(storage,`users/${user.uid}/books/${book.id}.pdf`);
 return sdk.s.getBlob(ref);
}
export async function uploadProgress(progress){await initialize();required();await sdk.f.setDoc(sdk.f.doc(db,'users',user.uid,'progress','latest'),{payload:JSON.stringify(progress),updatedAt:sdk.f.serverTimestamp()});}
export async function downloadProgress(){await initialize();required();const snap=await sdk.f.getDoc(sdk.f.doc(db,'users',user.uid,'progress','latest'));return snap.exists()?JSON.parse(snap.data().payload):null;}
