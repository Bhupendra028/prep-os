const DAY = 86400000;
export const isoDay = (date=new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
export const safe = value => String(value??'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const shortDate = time => new Date(time).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
export function makeDefaultState(){return {version:1, created:new Date().toISOString(), examDate:'2027-05-11', weeklyHours:22.5, statuses:{}, readingNotes:{}, documents:[], annotations:{}, flashcards:[], sessions:[], answers:[], dailyTasks:{}, selectedSubject:'All subjects', lastOpenedReading:'los-001'};}
export function dueCards(cards){return cards.filter(c=>!c.nextDue || c.nextDue<=Date.now());}
export function gradeCard(card, quality){
  const out={...card,lastReviewed:Date.now(),reviews:(card.reviews||0)+1};
  if(quality==='again') {out.interval=1;out.repetitions=0;out.ease=Math.max(1.3,(card.ease||2.5)-.2);} 
  else {out.repetitions=(card.repetitions||0)+1;out.ease=Math.max(1.3,(card.ease||2.5)+(.1-(5-4)*(.08+(5-4)*.02)));out.interval=out.repetitions===1?1:out.repetitions===2?3:Math.round((card.interval||3)*out.ease);}
  out.nextDue=startOfDay(new Date()) + out.interval*DAY;
  return out;
}
export const uid=()=>globalThis.crypto?.randomUUID?.()||`id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function todaysCompleted(state){return (state.dailyTasks[isoDay()]||[]).length;}
export function weeklyHours(state){let now=new Date(),start=new Date(now);start.setDate(now.getDate()-((now.getDay()+6)%7));start.setHours(0,0,0,0);return (state.sessions||[]).filter(s=>new Date(s.date)>=start).reduce((v,s)=>v+Number(s.minutes||0)/60,0);}
export function topicStats(state, curriculum){const readings=curriculum.readings;const done=readings.filter(r=>state.statuses[r.id]==='mastered').length;const seen=readings.filter(r=>state.statuses[r.id] && state.statuses[r.id]!=='not_started').length;return {done,seen,total:readings.length,percent:Math.round(done/readings.length*100)};}
export function accuracy(answers,readingId=null){const arr=readingId?answers.filter(a=>a.readingId===readingId):answers;return arr.length?Math.round(arr.filter(a=>a.correct).length/arr.length*100):null;}
export function describeExam(date){const target=new Date(date+'T00:00:00');const diff=Math.ceil((target-startOfDay(new Date()))/DAY);return Math.max(0,diff);}
export async function blobToBase64(blob){const bytes=new Uint8Array(await blob.arrayBuffer());let out='';for(let i=0;i<bytes.length;i+=0x8000)out+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(out);}
export function base64ToBlob(text,type='application/pdf'){const raw=atob(text);const arr=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)arr[i]=raw.charCodeAt(i);return new Blob([arr],{type});}
