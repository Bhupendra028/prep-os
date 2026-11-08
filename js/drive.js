// Prep OS personal Drive library. OAuth tokens remain in memory, not localStorage.
import {DRIVE_CLIENT_ID} from '../drive-config.js';
const SCOPE='https://www.googleapis.com/auth/drive.file';
const BASE='https://www.googleapis.com/drive/v3/files';
const UPLOAD='https://www.googleapis.com/upload/drive/v3/files';
let token=null, expiry=0, client=null, scriptPromise=null;
export const connected=()=>Boolean(token&&Date.now()<expiry-60000);
export function disconnect(){token=null;expiry=0;client=null;}
function loadGIS(){
 if(window.google?.accounts?.oauth2)return Promise.resolve();
 if(scriptPromise)return scriptPromise;
 scriptPromise=new Promise((resolve,reject)=>{
  const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;
  s.onload=()=>resolve();s.onerror=()=>reject(Error('Google Identity Services could not load.'));
  document.head.appendChild(s);
 });return scriptPromise;
}
// Preload early so connectDrive() can request a token directly from a user click.
export function preload(){return loadGIS().catch(console.warn);}
export function connectDrive(){
 if(!window.google?.accounts?.oauth2)throw Error('Google Drive authorization is loading. Wait a moment and try again.');
 return new Promise((resolve,reject)=>{
  client=window.google.accounts.oauth2.initTokenClient({client_id:DRIVE_CLIENT_ID,scope:SCOPE,callback:r=>{
   if(r.error){reject(Error(r.error_description||r.error));return;}
   token=r.access_token;expiry=Date.now()+(Number(r.expires_in)||3500)*1000;resolve(true);
  },error_callback:e=>reject(Error(e.message||e.type||'Drive authorization cancelled'))});
  client.requestAccessToken({prompt:'consent'});
 });
}
function required(){if(!connected())throw Error('Connect Google Drive first in Settings. Drive authorization may expire; reconnect if needed.');}
async function request(url,options={}){
 required();const headers=new Headers(options.headers||{});headers.set('Authorization','Bearer '+token);
 const response=await fetch(url,{...options,headers});
 if(!response.ok && response.status!==308){let info='';try{const obj=await response.json();info=obj.error?.message||'';}catch{};
  if(response.status===401){disconnect();throw Error('Google Drive session expired. Reconnect Google Drive.');}
  throw Error(`Google Drive HTTP ${response.status}${info?': '+info:''}`);
 }return response;
}
export async function listBooks(){
 const books=[];let pageToken='';
 do{
  const query=new URLSearchParams({q:"trashed = false and mimeType = 'application/pdf' and appProperties has { key='prepOsBook' and value='true' }",fields:'nextPageToken,files(id,name,size,appProperties)',page_size:'100'});
  // Google Drive uses pageSize, not page_size.
  query.delete('page_size');query.set('pageSize','100');if(pageToken)query.set('pageToken',pageToken);
  const result=await (await request(BASE+'?'+query)).json();
  for(const f of result.files||[])books.push({id:f.id,name:f.name,size:Number(f.size||0),localId:f.appProperties?.prepOsLocalId||null});
  pageToken=result.nextPageToken||'';
 }while(pageToken);
 return books.sort((a,b)=>a.name.localeCompare(b.name));
}
export async function uploadBook(blob,{id,name,onProgress}={}){
 required();if(!(blob instanceof Blob)||!blob.size)throw Error('Select a nonempty PDF.');
 if(!name?.toLowerCase().endsWith('.pdf'))throw Error('Only PDF files are supported.');
 const metadata={name,mimeType:'application/pdf',appProperties:{prepOsBook:'true',prepOsLocalId:String(id||'')}};
 // Resumable upload works for large textbooks and supports upload progress.
 const start=await request(UPLOAD+'?uploadType=resumable&fields=id,name,size,appProperties',{
  method:'POST',headers:{'Content-Type':'application/json; charset=UTF-8','X-Upload-Content-Type':'application/pdf','X-Upload-Content-Length':String(blob.size)},body:JSON.stringify(metadata)
 });
 const url=start.headers.get('Location');if(!url)throw Error('Google Drive did not provide an upload session URL.');
 // Chunk uploads support retry after interruption; each chunk except final is 8 MiB.
 const CHUNK=8*1024*1024;let offset=0;let file=null;
 while(offset<blob.size){const end=Math.min(offset+CHUNK,blob.size);const part=blob.slice(offset,end);
  const response=await request(url,{method:'PUT',headers:{'Content-Type':'application/pdf','Content-Range':`bytes ${offset}-${end-1}/${blob.size}`},body:part});
  if(response.status===308){const range=response.headers.get('Range');offset=range?Number(range.split('-').pop())+1:end;}
  else {file=await response.json();offset=end;}
  onProgress?.(Math.round(offset/blob.size*100));
 }
 if(!file?.id)throw Error('Upload did not return a Google Drive file ID.');
 return {id:file.id,name:file.name||name,size:Number(file.size||blob.size)};
}
export async function fetchBook(book){
 if(!book?.id)throw Error('Missing Google Drive file ID.');
 const response=await request(BASE+'/'+encodeURIComponent(book.id)+'?alt=media');
 return response.blob();
}
