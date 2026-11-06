import admin from 'firebase-admin';
import {readdir,readFile,stat} from 'node:fs/promises';
import {join} from 'node:path';
const [dir]=process.argv.slice(2);const uid=process.env.PREP_OS_UID;const bucket=process.env.FIREBASE_STORAGE_BUCKET;
if(!dir||!uid||!bucket||!process.env.GOOGLE_APPLICATION_CREDENTIALS){console.error('Missing folder or PREP_OS_UID / FIREBASE_STORAGE_BUCKET / GOOGLE_APPLICATION_CREDENTIALS');process.exit(1);}
admin.initializeApp({credential:admin.credential.applicationDefault(),storageBucket:bucket});
const names=(await readdir(dir)).filter(n=>n.toLowerCase().endsWith('.pdf')).sort();
if(!names.length)throw Error('No PDF files found in directory');
const books=[];for(let i=0;i<names.length;i++){
 const name=names[i];const id='book-'+String(i+1).padStart(3,'0');const path=join(dir,name);const size=(await stat(path)).size;
 await admin.storage().bucket().upload(path,{destination:`users/${uid}/books/${id}.pdf`,metadata:{contentType:'application/pdf',cacheControl:'private, max-age=3600'}});
 books.push({id,name,size});console.log(`Private upload ${i+1}/${names.length}: ${name}`);
}
await admin.firestore().doc(`users/${uid}`).set({books,updatedAt:admin.firestore.FieldValue.serverTimestamp()},{merge:true});
console.log(`Uploaded ${books.length} private books. No public links created.`);
