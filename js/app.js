import * as cloud from './cloud.js';
import * as drive from './drive.js';
import * as sync from './sync.js';
import {getItem,putItem,delItem,allKeys,clearStore} from './db.js';
import {safe,makeDefaultState,dueCards,gradeCard,uid,isoDay,shortDate,weeklyHours,topicStats,accuracy,describeExam,blobToBase64,base64ToBlob} from './engine.js';
import {QUESTIONS} from './questions.js';

const viewNames={dashboard:'Overview',curriculum:'Curriculum',reader:'Reading Studio',flashcards:'Flashcards',practice:'Practice Lab',planner:'Study Planner',library:'Knowledge Library',settings:'Settings & Backup'};
const $=id=>document.getElementById(id);
const V=id=>`view-${id}`;
const KEYS=['Quantitative Methods','Economics','Corporate Issuers','Financial Statement Analysis','Equity Investments','Fixed Income','Derivatives','Alternative Investments','Portfolio Management','Ethical and Professional Standards'];
let cloudBooks=[], cloudBusy=false;
let syncAccount=null;
let cloudUploadMessage='';
let state=makeDefaultState(), curriculum={readings:[]}, activeRoute='dashboard',pageNumber=1,zoom=1.15,readerTool='pen', pdfjsLib=null,pdfInstance=null,pdfDocId=null,rendering=false,activeStroke=null;
let currentPracticeIndex=0, currentChoice=null, practiceRevealed=false, practiceQuestions=[...QUESTIONS],flashReviewId=null,flashRevealed=false, curriculumPage=0,docSearchResult=[],toastTimer=null,stateTimer=null;
const readerStage=()=> $('pdf-stage');
const rgba='rgba(255,206,64,.34)';
const PEN_COLORS=['#1e293b','#e76e4d','#2563eb','#15803d','#7c3aed','#ec4899','#d97706','#ffffff'];
const HIGHLIGHT_COLORS=['#ffce40','#86efac','#93c5fd','#f9a8d4','#c4b5fd','#fdba74','#fef08a','#67e8f9'];
let penColor='#e76e4d',highlightColor='#ffce40';
function colorPalette(tool){const colors=tool==='pen'?PEN_COLORS:HIGHLIGHT_COLORS,selected=tool==='pen'?penColor:highlightColor;return `<div class="ink-color-group" role="group" aria-label="${tool==='pen'?'Pen':'Highlighter'} colors"><span class="ink-color-label">${tool==='pen'?'Pen':'Highlight'}</span>${colors.map(c=>`<button type="button" class="ink-swatch ${selected===c?'active':''}" data-action="color-${tool}-${c.slice(1)}" style="--swatch:${c}" aria-label="${tool} color ${c}" aria-pressed="${selected===c}" title="${tool} ${c}"></button>`).join('')}</div>`;}
try{const stored=JSON.parse(localStorage.getItem('prep-os-ink-colors')||'{}');if(PEN_COLORS.includes(stored.penColor))penColor=stored.penColor;if(HIGHLIGHT_COLORS.includes(stored.highlightColor))highlightColor=stored.highlightColor;}catch(_){}
function strokeColor(stroke){if(stroke.color&&/^#[0-9a-f]{6}$/i.test(stroke.color))return stroke.color;return stroke.tool==='highlighter'?'#ffce40':'#e76e4d';}
const lastPart=filename=>filename.length>66?filename.slice(0,63)+'…':filename;

function toast(msg){let el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),4000);}
function save(){clearTimeout(stateTimer);stateTimer=setTimeout(async()=>{try {await putItem('kv','appstate',state);sync.markDirty();}catch(e){toast('Save failed: local browser storage may be full. Export a backup.');console.error(e);}},180);}
async function saveNow(){clearTimeout(stateTimer);await putItem('kv','appstate',state);sync.markDirty();}
function button(label,action,variant='',extra=''){return `<button type="button" class="btn ${variant}" data-action="${action}" ${extra}>${label}</button>`;}
function heading(eyebrow,title,caption='',actions=''){return `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p>${caption}</p></div>${actions?`<div class="header-actions">${actions}</div>`:''}</div>`;}
function stat(label,value,desc='',glyph='◈'){return `<div class="card stat"><span class="glyph">${glyph}</span><div class="k">${safe(label)}</div><div class="v">${safe(value)}</div><div class="desc">${safe(desc)}</div></div>`;}
function statusLabel(st){return ({not_started:'Not started',learning:'Learning',practiced:'Practicing',mastered:'Mastered'})[st]||'Not started';}
function statusSelector(reading){const st=state.statuses[reading.id]||'not_started';return `<select class="status-select" data-status-id="${reading.id}" aria-label="Status for ${safe(reading.title)}">${['not_started','learning','practiced','mastered'].map(v=>`<option ${v===st?'selected':''} value="${v}">${statusLabel(v)}</option>`).join('')}</select>`;}
function startReading(id){state.lastOpenedReading=id;state.statuses[id]=state.statuses[id]||'learning';save();location.hash='#reader';}
function rememberPage(){if(!state.currentDocId)return;state.readingPositions=state.readingPositions||{};const doc=currentDoc();const key=doc?.cloudId?'cloud:'+doc.cloudId:state.currentDocId;state.readingPositions[key]={page:pageNumber,at:Date.now()};save();}
function resumePage(doc){const key=doc?.cloudId?'cloud:'+doc.cloudId:doc?.id;return Math.max(1,Number(state.readingPositions?.[key]?.page)||1);}
function currentDoc(){return state.documents.find(d=>d.id===state.currentDocId);}
function safeFilename(name){return safe(name||'Untitled PDF');}
const dayTasks=[['Concept study','Read a learning module and make notes','55 min'],['Numerical practice','Solve focused CFA-style questions','55 min'],['Spaced revision','Recall earlier concepts and formulas','25 min'],['Formula / ethics','Write a formula or review an Ethics rule','15 min']];
function renderDashboard(){
  const stats=topicStats(state,curriculum),hrs=weeklyHours(state),due=dueCards(state.flashcards).length,acc=accuracy(state.answers),today=new Date();
  const selected=curriculum.readings.find(r=>r.id===state.lastOpenedReading)||curriculum.readings[0];
  const taskDone=state.dailyTasks[isoDay()]||[];
  const subjects=KEYS.map(sub=>{const subReads=curriculum.readings.filter(x=>x.subject===sub);const mastered=subReads.filter(x=>state.statuses[x.id]==='mastered').length;return {sub,total:subReads.length,mastered};});
  $(V('dashboard')).innerHTML=heading('YOUR PERSONAL LEARNING COMMAND CENTER','Good '+(today.getHours()<12?'morning':today.getHours()<17?'afternoon':'evening')+'.','Your progress is measured by real study work, not pages opened.',button('Open today’s lesson','dashboard-start','primary'))+
  `<div class="stat-grid">${stat('Syllabus mastered',`${stats.done} / ${stats.total}`,'2027 planner reading checklist','▤')}${stat('Weekly study hours',`${hrs.toFixed(1)} / ${state.weeklyHours}h`,'Logged this week','◷')}${stat('Practice accuracy',acc===null?'—':acc+'%',`${state.answers.length} attempts recorded`,'◎')}${stat('Flashcards due',due,'Ready for recall','▱')}</div>
  <div class="dash-grid"><div class="card hero-card"><div class="hero-top"><div><div class="hero-label">CURRENT EXAM</div><h2>CFA Level I · May 2027</h2><p>Target: ${safe(state.examDate)} · Your exam date is editable.</p></div><div class="count-circle"><b>${describeExam(state.examDate)}</b><small>DAYS LEFT</small></div></div><div class="hero-progress"><div style="display:flex;justify-content:space-between;margin-bottom:9px"><span style="font-size:12px">Reading mastery</span><strong>${stats.percent}%</strong></div><div class="progress-line"><span style="width:${stats.percent}%"></span></div></div></div>
  <div class="card"><div class="card-head"><div><h2 class="section-title">Continue learning</h2><p class="subtle">Your next source-linked reading</p></div><span class="pill">CURRENT</span></div><div class="eyebrow">${safe(selected?.subject||'Quantitative Methods')}</div><h3 style="font:800 18px Manrope;margin:9px 0 12px">${safe(selected?.title||'Returns of Financial Assets and Instruments')}</h3><p class="subtle">You can add your 2026 Schweser PDFs in the Reading Studio and link your page notes to this learning module.</p><div class="workspace-actions" style="margin-top:18px">${button('Start / resume','dashboard-start','primary')}${button('Open reader','reader','')}</div></div></div>
  <div class="split-grid"><div class="card"><div class="card-head"><div><h2 class="section-title">Today’s learning routine</h2><p class="subtle">2.5 hours on weekdays • adjustable</p></div><span class="pill">${taskDone.length}/4 complete</span></div><div class="activity-list">${dayTasks.map((task,i)=>`<div class="activity-row"><div class="number-circle">${taskDone.includes(i)?'✓':i+1}</div><div class="grow"><strong>${task[0]}</strong><small>${task[1]} · ${task[2]}</small></div>${button(taskDone.includes(i)?'Done':'Mark done',`task-${i}`,'sm')}</div>`).join('')}</div></div>
  <div class="card"><div class="card-head"><h2 class="section-title">Subject coverage</h2>${button('All readings','curriculum','sm')}</div><div class="mini-list">${subjects.map(t=>`<div class="topic-mini"><b>${safe(t.sub.length>20?t.sub.slice(0,19)+'…':t.sub)}</b><div class="progress-line"><span style="width:${t.total?t.mastered/t.total*100:0}%"></span></div><span>${t.mastered}/${t.total}</span></div>`).join('')}</div></div></div>
  <p class="footer-note">Course data comes from your uploaded 2027 study planner. It is a reading-title checklist, not a verified full 2027 LOS text corpus. No old 2023 Schweser books are included.</p>`;
}
function renderCurriculum(){
  const search=(state.curriculumSearch||'').toLowerCase(),sub=state.selectedSubject;
  const arr=curriculum.readings.filter(r=>(sub==='All subjects'||r.subject===sub)&&(`${r.title} ${r.subject}`.toLowerCase().includes(search)));
  const pageCount=Math.max(1,Math.ceil(arr.length/18));curriculumPage=Math.min(curriculumPage,pageCount-1);
  const page=arr.slice(curriculumPage*18,curriculumPage*18+18);
  $(V('curriculum')).innerHTML=heading('SYLLABUS INTELLIGENCE','Your 2027 curriculum','102 reading titles imported from your study planner. Individual LOS coverage still requires source verification.',button('Continue lesson','dashboard-start','primary'))+
  `<div class="filters"><input id="curriculum-search" class="input" placeholder="Search reading title…" value="${safe(state.curriculumSearch||'')}"/><select id="subject-filter" class="select"><option>All subjects</option>${KEYS.map(x=>`<option ${x===sub?'selected':''}>${safe(x)}</option>`).join('')}</select><span class="tag">${arr.length} readings</span></div><div class="card list-card"><table class="list-table"><thead><tr><th>#</th><th>Subject</th><th>Learning module / reading</th><th>Progress</th><th>Open</th></tr></thead><tbody>${page.map(r=>`<tr><td class="row-num">${r.index}</td><td><span class="tag">${safe(r.subject)}</span></td><td><strong>${safe(r.title)}</strong><div class="tiny">${safe(r.id)} · Source verification pending</div></td><td>${statusSelector(r)}</td><td>${button('Study',`study-${r.id}`,'sm')}</td></tr>`).join('')}</tbody></table></div><div class="pagination">${button('← Previous','curriculum-prev','sm',curriculumPage===0?'disabled':'')}<span class="subtle">Page ${curriculumPage+1} of ${pageCount}</span>${button('Next →','curriculum-next','sm',curriculumPage===pageCount-1?'disabled':'')}</div>`;
}
function readerDocOptions(){return state.documents.map(d=>`<option value="${safe(d.id)}" ${state.currentDocId===d.id?'selected':''}>${safe(lastPart(d.name))}</option>`).join('');}
let readerFullscreen=false;
function toggleReaderFullscreen(){
 readerFullscreen=!readerFullscreen;
 const card=document.querySelector(".reader-card");
 if(card)card.classList.toggle("reader-fullscreen",readerFullscreen);
 const btn=document.querySelector("[data-action=reader-fullscreen]");
 if(btn){btn.textContent=readerFullscreen?"⤢ Exit full screen":"⛶ Full screen";btn.setAttribute("aria-pressed",String(readerFullscreen));}
 document.body.classList.toggle("reader-fullscreen-open",readerFullscreen);
 // Re-render PDF at the new viewport width without clearing annotations.
 if(currentDoc())setTimeout(()=>loadPDFPage(state.currentDocId,pageNumber),80);
}
function renderReader(){
  const doc=currentDoc(),read=curriculum.readings.find(r=>r.id===state.lastOpenedReading),key=doc?`${doc.id}:${pageNumber}`:'',text=state.readingNotes[key]||'';
  document.body.classList.toggle('reader-fullscreen-open',readerFullscreen);
  $(V('reader')).innerHTML=heading('INTERACTIVE BOOK STUDIO','Read, write, and remember','Draw on PDF pages with a stylus, create page-linked notes, and turn concepts into flashcards.',button('+ Import PDF','upload','primary'))+
  `<div class="reader-grid"><div class="card reader-card ${readerFullscreen?'reader-fullscreen':''}"><div class="reader-toolbar"><button class="tool-btn reader-fullscreen-btn" data-action="reader-fullscreen" aria-pressed="${readerFullscreen}" title="Toggle full-screen reading">${readerFullscreen?'⤢ Exit full screen':'⛶ Full screen'}</button><select id="reader-document" class="select" style="max-width:250px;flex:1"><option value="">${state.documents.length?'Select a book':'No PDFs imported yet'}</option>${readerDocOptions()}</select><span class="separator"></span><button class="tool-btn ${readerTool==='pen'?'selected':''}" data-action="tool-pen" title="Freehand pen">✎ Pen</button><button class="tool-btn ${readerTool==='highlighter'?'selected':''}" data-action="tool-highlighter" title="Freehand highlighter">▰ Highlight</button>${colorPalette('pen')}${colorPalette('highlighter')}<button class="tool-btn ${readerTool==='eraser'?'selected':''}" data-action="tool-eraser" title="Tap a stroke to erase it">⌫ Erase</button><button class="tool-btn" data-action="undo-stroke" title="Undo last stroke">↶</button><span class="separator"></span><button class="tool-btn" data-action="page-prev">‹</button><input id="page-number" class="page-input" inputmode="numeric" value="${pageNumber}" aria-label="PDF page number"><span class="subtle">/ <span id="pdf-pagecount">${doc?.pages||'?'}</span></span><button class="tool-btn" data-action="page-next">›</button><button class="tool-btn" data-action="zoom-out">−</button><button class="tool-btn" data-action="zoom-in">+</button></div>
  <div class="doc-viewport" id="doc-viewport">${doc&&(!doc.missing||doc.cloudId)?`<div id="pdf-stage" class="pdf-stage"><canvas id="pdf-canvas"></canvas><canvas id="annotation-canvas" class="ink-layer" aria-label="Draw annotation layer"></canvas></div>`:doc?.missing?`<div class="reader-blank"><h3>Re-import your PDF</h3><p>The notes and annotations were restored, but PDF bytes were not included. Import a file named <strong>${safe(doc.name)}</strong> to relink it.</p>${button('Relink PDF','upload','primary')}</div>`:`<div class="reader-blank"><div style="font-size:55px">▣</div><h3>Your annotated study books belong here</h3><p>Import a PDF locally. To make it available on other devices, sign in and use Upload PDF to cloud under Knowledge Library.</p>${button('Import my book','upload','primary')}</div>`}</div><div class="statusbar" id="pdf-status">${doc?.missing?'PDF missing — please re-import the same file name to relink.':doc?'Loading your PDF…':'PDFs remain private and are not included in the project download.'}</div></div>
  <aside class="reader-panel"><div class="card"><div class="card-head" style="margin-bottom:10px"><h2 class="section-title">Page notebook</h2><span class="pill">PAGE ${pageNumber}</span></div><label class="form-label" for="page-notes">Write your own notes</label><textarea class="textarea" id="page-notes" placeholder="Explain this concept in your own words…" ${doc?'':'disabled'}>${safe(text)}</textarea><div class="workspace-actions" style="margin-top:10px">${button('Save note','save-note','sm')}${button('+ Flashcard','add-page-flashcard','sm')}</div></div>
  <div class="card"><h2 class="section-title" style="margin-bottom:10px">Linked syllabus topic</h2><select id="reader-reading" class="select" aria-label="Link current reading">${curriculum.readings.map(r=>`<option value="${r.id}" ${r.id===state.lastOpenedReading?'selected':''}>${safe(r.title)}</option>`).join('')}</select><p class="help">This is a manual topic link in v1. It does not yet prove that a PDF page matches the 2027 LOS.</p></div>
  <div class="card"><div class="card-head"><h2 class="section-title">Annotations & source</h2><span class="pill grey">${doc?'LOCAL':'NONE'}</span></div><p class="subtle">Current book: ${doc?safe(lastPart(doc.name)):'None'}</p><p class="subtle">Freehand strokes are saved as page coordinates, so they remain aligned after zooming.</p><div class="workspace-actions">${button('Search PDFs','library','sm')}${button('Create card','add-page-flashcard','sm')}</div></div></aside></div>`;
  if(doc&&(!doc.missing||doc.cloudId))setTimeout(()=>loadPDFPage(doc.id,pageNumber),0);
}
function renderFlashcards(){
  const cards=state.flashcards,due=dueCards(cards),current=flashReviewId?cards.find(c=>c.id===flashReviewId):null;
  if(current){$(V('flashcards')).innerHTML=heading('SPACED REPETITION','Active recall','Reveal the answer, then rate how well you remembered it.',button('← All flashcards','close-review'))+
    `<div class="card" style="max-width:840px;margin:auto"><div class="card-head"><span class="pill">${safe(current.subject||'Source-linked card')}</span><span class="subtle">${current.reviews||0} previous reviews</span></div><div class="flashcard-review"><div class="front">${safe(current.front)}</div>${flashRevealed?`<div class="back">${safe(current.back)}</div>`:button('Reveal answer','reveal-card','primary')}</div>${flashRevealed?`<div class="workspace-actions" style="justify-content:center;margin-top:18px">${button('Again · 1 day','grade-again','warn')}${button('I remembered · schedule next','grade-good','primary')}</div>`:''}<p class="source-tag" style="text-align:center;margin-top:14px">${safe(current.sourceLabel||'Personal card')} ${current.page?` · PDF page ${current.page}`:''}</p></div>`;return;}
  $(V('flashcards')).innerHTML=heading('RECALL ENGINE','Your flashcards','Make a card from any PDF page or create your own, then revise based on recall.',button('+ Create flashcard','create-card','primary')+button('Review due cards','review-cards'))+
   `<div class="stat-grid">${stat('Total flashcards',cards.length,'Stored on this device','▱')}${stat('Ready to review',due.length,'Due today or overdue','◎')}${stat('Reviewed at least once',cards.filter(c=>c.reviews).length,'Recall progress','✓')}${stat('Source linked',cards.filter(c=>c.docId).length,'Return to a PDF page','▣')}</div>${cards.length?`<div class="flash-grid">${cards.map(c=>`<article class="flash-item"><div><span class="tag">${safe(c.subject||'General')}</span><h3 style="margin-top:13px">${safe(c.front)}</h3><p>${safe(c.back)}</p></div><div><div class="subtle">${c.docId?`${safe(c.sourceLabel||'Book')} • Page ${c.page}`:'Personal card'} ${c.nextDue?'· Due '+shortDate(c.nextDue):'· New'}</div><div class="flash-actions" style="margin-top:12px">${button('Review',`review-${c.id}`,'sm')}${c.docId?button('Source',`source-${c.id}`,'sm'):''}${button('Edit',`edit-${c.id}`,'sm')}${button('Delete',`delete-${c.id}`,'sm warn')}</div></div></article>`).join('')}</div>`:`<div class="empty"><div class="empty-icon">▱</div><h3>No flashcards yet</h3><p>Create your first card from a concept you want to memorize. Page-linked cards will include their source document and page number.</p>${button('Create first card','create-card','primary')}</div>`}`;
}
function currentQuestion(){return practiceQuestions[currentPracticeIndex%practiceQuestions.length];}
function renderPractice(){const q=currentQuestion(),selected=currentChoice,read=curriculum.readings.find(x=>x.id===q.readingId);$(V('practice')).innerHTML=heading('ORIGINAL PRACTICE LAB','Learn by solving','These are newly written warm-up questions, not copied CFA Institute or Schweser questions.',button('Start new set','reset-quiz',''))+
`<div class="stat-grid">${stat('Question bank',QUESTIONS.length,'Original starter exercises','◎')}${stat('Attempted',state.answers.length,'All logged attempts','✓')}${stat('Accuracy',accuracy(state.answers)===null?'—':accuracy(state.answers)+'%','Across completed attempts','◈')}${stat('Needs review',state.answers.filter(a=>!a.correct).length,'Incorrect attempts recorded','↻')}</div>
<div class="card test-frame"><div class="card-head"><span class="pill">${safe(q.topic)}</span><span class="subtle">Question ${currentPracticeIndex%practiceQuestions.length+1} / ${practiceQuestions.length}</span></div><div class="progress-line" style="margin:0 0 23px"><span style="width:${(currentPracticeIndex%practiceQuestions.length+1)/practiceQuestions.length*100}%"></span></div><div class="eyebrow">${safe(read?.subject||'Quantitative Methods')}</div><h2 style="font:800 19px/1.55 Manrope;margin:10px 0 22px">${safe(q.q)}</h2>${q.o.map((o,i)=>`<button class="option ${selected===i?'selected':''} ${practiceRevealed?(i===q.a?'correct':selected===i?'incorrect':''):''}" data-action="choice-${i}" ${practiceRevealed?'disabled':''}><b>${'ABC'[i]}</b>${safe(o)}</button>`).join('')}${practiceRevealed?`<div class="explanation"><strong>${selected===q.a?'Correct!':'Correct answer: '+ 'ABC'[q.a]}</strong><div style="margin-top:8px">${safe(q.e)}</div></div>`:''}<div style="display:flex;justify-content:space-between;gap:9px;margin-top:22px;flex-wrap:wrap"><span class="subtle">Original practice · ${safe(q.readingId)}</span>${practiceRevealed?button('Next question →','next-question','primary'):button('Check answer','check-answer','primary',selected===null?'disabled':'')}</div></div>`;}
function renderPlanner(){
 const hrs=weeklyHours(state),goal=state.weeklyHours,now=new Date(),dayIndex=(now.getDay()+6)%7;
 const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
 const sumByDay=days.map((d,i)=>{let dt=new Date(now);dt.setDate(now.getDate()+i-dayIndex);return {day:d,date:isoDay(dt),target:i<5?2.5:5,actual:state.sessions.filter(s=>s.date===isoDay(dt)).reduce((v,x)=>v+x.minutes/60,0)};});
 $(V('planner')).innerHTML=heading('YOUR 22.5-HOUR ROUTINE','Study planner','2.5 hours on weekdays and 5 hours on weekend days. Log actual study time to track consistency.',button('+ Log study session','log-session','primary'))+
 `<div class="stat-grid">${stat('Weekly target',goal+'h','Editable in settings','◷')}${stat('Logged this week',hrs.toFixed(1)+'h','Across all sessions','✓')}${stat('Remaining',Math.max(0,goal-hrs).toFixed(1)+'h','To hit your weekly target','↗')}${stat('Sessions',state.sessions.length,'All-time recorded','▦')}</div><div class="card"><div class="card-head"><h2 class="section-title">This week</h2><span class="pill">${Math.round(hrs/goal*100)}% of weekly goal</span></div><div class="schedule-grid">${sumByDay.map(d=>`<div class="day-card"><b>${d.day}</b><strong>${d.actual.toFixed(1)}h</strong><small>${d.target}h suggested</small><div class="progress-line" style="margin-top:12px"><span style="width:${Math.min(100,d.actual/d.target*100)}%"></span></div></div>`).join('')}</div><p class="help" style="margin-top:18px">Study hours are based on your manually logged sessions; there is no passive activity tracking in this release.</p></div><div class="card" style="margin-top:18px"><div class="card-head"><h2 class="section-title">Recent study sessions</h2>${button('Log session','log-session','sm')}</div>${state.sessions.length?`<div class="activity-list">${state.sessions.slice().sort((a,b)=>b.created-a.created).slice(0,12).map(session=>`<div class="activity-row"><div class="number-circle">◷</div><div class="grow"><strong>${safe(session.subject)}</strong><small>${safe(session.date)} · ${safe(session.note||'No note')}</small></div><span class="pill">${session.minutes} min</span></div>`).join('')}</div>`:'<div class="empty-state">No study sessions logged yet.</div>'}</div>`;
}
function renderLibrary(){
 const searched=docSearchResult;
 $(V('library')).innerHTML=heading('SOURCE KNOWLEDGE LIBRARY','Your books, privately stored','Your private cloud books, page-linked notes, and local source search.',button('Upload PDF to cloud','cloud-upload','primary')+button('Sync cloud library','cloud-books'))+
 `<div class="info-banner" style="margin-bottom:18px"><strong>Private cloud library:</strong> Connect Google Drive under Settings. Upload PDF to cloud makes a book available on your other signed-in devices. Already imported books stay local until you select Upload existing local PDFs. Cloud books are downloaded to the device when first opened. <span id="cloud-upload-status">${safe(cloudUploadMessage)}</span></div><div class="workspace-actions" style="margin-bottom:16px">${button(drive.connected()?'Drive connected':'Connect Google Drive','drive-connect','primary')}${drive.connected()?button('Disconnect Drive','drive-disconnect'):''}${button('Upload existing local PDFs','cloud-upload-existing')}${button('Upload a new PDF to cloud','cloud-upload','primary')}</div><div class="card" style="margin-bottom:16px"><div class="card-head"><h2 class="section-title">Search uploaded documents</h2><span class="pill grey">Exact keyword search · offline after indexing</span></div><div class="form-row"><div class="field"><label class="form-label" for="library-query">Word, formula name or concept</label><input id="library-query" class="input" placeholder="e.g., holding period return" value="${safe(state.libraryQuery||'')}"></div>${button('Find in library','library-search','primary')}</div>${searched.length?`<div class="activity-list" style="margin-top:14px">${searched.map(r=>`<div class="activity-row"><div class="number-circle">${r.page}</div><div class="grow"><strong>${safe(r.docName)}</strong><small>${safe(r.snippet)}</small></div>${button('Open page',`searchopen-${r.docId}-${r.page}`,'sm')}</div>`).join('')}</div>`:''}</div><div class="card"><div class="card-head"><h2 class="section-title">Imported PDFs</h2><span class="pill">${state.documents.length} files</span></div>${state.documents.length?`<div class="doc-list">${state.documents.map(d=>`<div class="doc-row"><div class="doc-badge">PDF</div><div class="grow"><b>${safeFilename(d.name)}</b><small>${(d.size/1024/1024).toFixed(1)} MB • ${d.pages||'?'} pages • ${d.cloudId?'Google Drive book · ':''}${d.missing?'Not cached on this device':d.indexed?'Locally indexed':'Not indexed'}</small></div><div class="doc-actions">${button('Read',`open-${d.id}`,'sm primary')}${!d.cloudId?button('Upload to cloud',`cloud-one-${d.id}`,'sm'):''}${button('Index text',`index-${d.id}`,'sm')}${button('Remove',`remove-${d.id}`,'sm warn')}</div></div>`).join('')}</div>`:`<div class="empty"><div class="empty-icon">▣</div><h3>No books available on this device</h3><p>Connect Google Drive under Settings, then sync your private library. You can still import your own PDF manually.</p>${button('Sync private books','cloud-books','primary')}</div>`}</div><p class="footer-note">Current source search is exact text matching, not AI semantic search. Scanned PDFs with no extractable text may produce no search results.</p>`;
}
async function startStudySync(){const user=cloud.currentUser();if(!user){sync.stop();syncAccount=null;return;}if(syncAccount===user.uid)return;syncAccount=user.uid;await sync.start(user,()=>structuredClone(state),async incoming=>{state={...state,...incoming};await putItem('kv','appstate',state);if(activeRoute!=='reader')render();},()=>{if(activeRoute==='settings')renderSettings();});}
function renderSettings(){
 $(V('settings')).innerHTML=heading('PRIVATE BY DESIGN','Settings & backup','Control the exam date, study schedule and local data. Export before clearing browser storage.',button('Export backup','backup','primary'))+
 `<div class="settings-grid"><div class="card"><h2 class="section-title">Universal study sync (v6.2)</h2><p class="subtle">${safe(sync.status())}. Syncs notes, flashcards, practice attempts, curriculum, sessions and reading positions. Offline edits are kept locally and retried. Conflicting versions are preserved in local conflict history.</p>${button('Check sync conflicts','sync-conflicts')}</div><div class="card"><h2 class="section-title">Private cloud account</h2><p class="subtle">${cloud.configured()?'Firebase configured':'Firebase not configured yet — follow CLOUD-SETUP.md'}. ${cloud.currentUser()?'Signed in: '+safe(cloud.currentUser().email):'Sign in to access your private book collection across devices.'}</p><div class="workspace-actions">${button(cloud.currentUser()?'Choose Google account':'Continue with Google','cloud-google','primary')}${button(drive.connected()?'Reconnect Google Drive':'Connect Google Drive','drive-connect','primary')}${button('Sync Drive books','cloud-books')}${button('Upload PDF to Drive','cloud-upload')}${cloud.currentUser()?button('Sign out','cloud-logout'):''}</div><details class="cloud-legacy-login" style="margin-top:16px"><summary style="cursor:pointer;color:#47616b;font-size:13px">Already created an Email/Password account? Link it to Google once</summary><p class="help">To retain the same Firebase user ID and existing cloud records, sign in with the original account, then choose Link Google. After linking, use the Google button above on all devices.</p><div class="field"><label class="form-label" for="cloud-email">Existing account email</label><input id="cloud-email" class="input" type="email" autocomplete="username"></div><div class="field"><label class="form-label" for="cloud-password">Existing account password</label><input id="cloud-password" class="input" type="password" autocomplete="current-password"></div><div class="workspace-actions">${button('Sign in to existing account','cloud-login')}${button('Link Google to this account','cloud-link-google','primary')}</div></details><p class="help">PDF uploads use your private Google Drive (separate authorization from Firebase sign-in). Reconnect Drive after reloading each device. Study progress sync runs automatically after Firebase sign-in. Keep independent JSON backups. PDFs are cached locally when opened.</p></div><div class="card"><h2 class="section-title">Preparation preferences</h2><div class="field"><label class="form-label" for="exam-date">Exam appointment date</label><input type="date" id="exam-date" class="input" value="${safe(state.examDate)}"></div><div class="field"><label class="form-label" for="weekly-target">Weekly study hours</label><input type="number" min="1" max="70" step="0.5" id="weekly-target" class="input" value="${state.weeklyHours}"></div>${button('Save preferences','save-settings','primary')}<p class="help">May 11 is only an initial planning date; enter your actual booked exam date when confirmed.</p></div><div class="card"><h2 class="section-title">Backups and restore</h2><p class="subtle">Export annotations, flashcards, study logs, answers, and settings as JSON. Optionally include PDF file data for a complete (larger) backup.</p><label style="display:flex;gap:8px;align-items:center;margin-bottom:17px"><input type="checkbox" id="backup-pdfs"> Include imported PDF bytes in the backup</label><div class="workspace-actions">${button('Export JSON backup','backup','primary')}${button('Restore JSON backup','restore')}</div><p class="help">Restoring replaces current records. If the backup excludes PDFs, re-import the same filenames to relink saved annotations.</p></div><div class="card"><h2 class="section-title">Privacy and limitations</h2><p class="subtle">Prep OS stores study work locally; uploaded PDFs can also be stored in your private Google Drive. Notes, annotations and study progress synchronize after Firebase sign-in, subject to network availability and Firestore limits. Avoid incognito mode and browser data-clearing tools.</p><p class="subtle">AI tutor, semantic retrieval, PDF annotation export and verified LOS-level audits are not present in this release.</p></div><div class="card"><h2 class="section-title">Danger zone</h2><p class="subtle">Clearing local data permanently erases your imported PDFs, notes, flashcards, activity and questions answered from this browser profile.</p>${button('Clear all local data','clear-data','warn')}</div></div>`;
}
function render(){const route=location.hash.slice(1)||'dashboard';activeRoute=viewNames[route]?route:'dashboard';document.querySelectorAll('.view').forEach(v=>v.hidden=(v.id!==V(activeRoute)));document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===activeRoute));$('breadcrumb').textContent=viewNames[activeRoute];$('sidebar').classList.remove('open');$('due-count').textContent=dueCards(state.flashcards).length||'';const map={dashboard:renderDashboard,curriculum:renderCurriculum,reader:renderReader,flashcards:renderFlashcards,practice:renderPractice,planner:renderPlanner,library:renderLibrary,settings:renderSettings};map[activeRoute]();}
function showModal(content){$('modal-content').innerHTML=content;$('modal').showModal();}
function closeModal(){$('modal').close();}
function newFlashcard(existing=null,docLink=null){const c=existing||{front:'',back:'',docId:docLink?.docId||null,page:docLink?.page||null,readingId:state.lastOpenedReading,subject:curriculum.readings.find(r=>r.id===state.lastOpenedReading)?.subject||'General'};
 showModal(`<h2>${existing?'Edit flashcard':'Create a flashcard'}</h2><p class="subtle">Write one focused recall question and a short, unambiguous answer.</p><div class="field"><label class="form-label">Front · question</label><textarea class="textarea" id="modal-front">${safe(c.front)}</textarea></div><div class="field"><label class="form-label">Back · answer</label><textarea class="textarea" id="modal-back">${safe(c.back)}</textarea></div><p class="help">${c.docId?`Source: ${safe(state.documents.find(d=>d.id===c.docId)?.name||'PDF')} · page ${c.page}`:'No PDF source linked'}</p><div class="modal-actions">${button('Cancel','close-modal')}${button('Save flashcard','save-card','primary')}</div>`);
 $('modal').dataset.cardId=existing?.id||'';$('modal').dataset.docId=c.docId||'';$('modal').dataset.page=c.page||'';}
function confirmModal(text,yesAction){showModal(`<h2>Confirm action</h2><p class="subtle">${safe(text)}</p><div class="modal-actions">${button('Cancel','close-modal')}${button('Confirm',yesAction,'warn')}</div>`);}

async function initialize(){
 try{const response=await fetch('./curriculum.json');curriculum=await response.json();const saved=await getItem('kv','appstate');if(saved&&saved.version===1)state={...makeDefaultState(),...saved};if(!state.documents)state.documents=[];if(!state.flashcards)state.flashcards=[];if(!state.annotations)state.annotations={};if(!state.readingNotes)state.readingNotes={};if(!state.dailyTasks)state.dailyTasks={};if(!state.answers)state.answers=[];if(!state.sessions)state.sessions=[];if(!state.readingPositions)state.readingPositions={};}
 catch(error){console.error(error);toast('Local storage unavailable. Some data may not persist.');}
 $('today-date').textContent=new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
 window.addEventListener('hashchange',render);
 $('menu-toggle').addEventListener('click',()=> $('sidebar').classList.toggle('open'));
 $('pdf-upload').addEventListener('change',uploadPDFs);
 $('cloud-pdf-upload').addEventListener('change',uploadCloudPDFs);
 $('backup-import').addEventListener('change',importBackup);
 document.addEventListener('click',clickDispatcher);
 document.addEventListener('change',changeDispatcher);
 document.addEventListener('input',inputDispatcher);
 if('serviceWorker' in navigator && location.protocol!=='file:')navigator.serviceWorker.register('./sw.js?v=20261108-cloudlibrary', {updateViaCache:'none'}).catch(console.warn);
 drive.preload();
 render();
 if(cloud.configured())cloud.initialize().then(async()=>{/* Drive authorization requires a separate user gesture. */if(activeRoute==='settings'||activeRoute==='library')render();await startStudySync();}).catch(err=>console.warn('Firebase cloud session not yet available:',err));
}

async function uploadPDFs(event){const files=[...event.target.files];event.target.value='';if(!files.length)return;
 for(const file of files){if(!file.name.toLowerCase().endsWith('.pdf')){toast('Only PDF files are supported.');continue;}
  try{const linked=state.documents.find(d=>d.name===file.name&&d.missing);const id=linked?.id||uid();await putItem('pdfs',id,file);if(linked){linked.missing=false;linked.size=file.size;linked.added=Date.now();}else{state.documents.push({id,name:file.name,size:file.size,added:Date.now(),pages:null,indexed:false,missing:false});}state.currentDocId=id;pageNumber=1;await saveNow();toast(linked?`Relinked ${lastPart(file.name)} to saved notes.`:`Imported ${lastPart(file.name)}`);}catch(err){console.error(err);toast('Import failed; check available device storage.');}}
 if(activeRoute==='reader'){pdfDocId=null;pdfInstance=null;}render();}


// Cloud books are linked by stable IDs. This never clears or replaces local PDFs.
async function syncCloudBooks(notify=true){
 const books=await drive.listBooks();let added=0;
 for(const book of books){
  if(!book?.id||!/^[a-zA-Z0-9_-]+$/.test(book.id))continue;
  let doc=state.documents.find(d=>d.cloudId===book.id||(book.localId&&d.id===book.localId)||d.id==='cloud-'+book.id);
  if(doc){doc.cloudId=book.id;doc.name=doc.name||book.name;doc.size=doc.size||book.size||0;}
  else{state.documents.push({id:'cloud-'+book.id,cloudId:book.id,name:book.name||'Private book.pdf',size:book.size||0,added:Date.now(),pages:book.pages||null,indexed:false,missing:true});added++;}
 }
 await saveNow();
 if(notify)toast(`${books.length} cloud books found; ${added} new on this device.`);
 render();return {total:books.length,added};
}
function cloudStatus(message){cloudUploadMessage=message;const el=$('cloud-upload-status');if(el)el.textContent=message;}
async function uploadExistingBook(doc){
 if(!drive.connected())throw Error('Connect Google Drive under Settings first.');
 if(doc.cloudId)return false;
 const pdf=await getItem('pdfs',doc.id);
 if(!pdf)throw Error(`Local PDF unavailable: ${doc.name}. Re-import this book first.`);
 cloudStatus(`Uploading ${doc.name}…`);
 const meta=await drive.uploadBook(pdf,{id:doc.id,name:doc.name,onProgress:p=>cloudStatus(`Uploading ${doc.name}: ${p}%`)});
 doc.cloudId=meta.id;doc.size=meta.size;await saveNow();
 cloudStatus(`Saved ${doc.name} to your private cloud.`);return true;
}
async function uploadCloudPDFs(event){
 const files=[...event.target.files];event.target.value='';if(!files.length)return;
 if(!drive.connected()){toast('Connect Google Drive under Settings first.');navigate('settings');return;}
 if(cloudBusy){toast('Another cloud upload is in progress.');return;}
 cloudBusy=true;let succeeded=0;let failed=[];
 try{
  for(const file of files){
   if(!file.name.toLowerCase().endsWith('.pdf')||!file.size||file.size>80*1024*1024){failed.push(`${file.name}: PDF must be 1 byte–80 MB`);continue;}
   try{
    let doc=state.documents.find(d=>d.name===file.name&&d.size===file.size&&!d.cloudId);
    if(!doc){doc={id:uid(),name:file.name,size:file.size,added:Date.now(),pages:null,indexed:false,missing:false};state.documents.push(doc);}
    await putItem('pdfs',doc.id,file);doc.missing=false;await saveNow();
    if(await uploadExistingBook(doc))succeeded++;
   }catch(e){console.error('Cloud upload failed',e);failed.push(`${file.name}: ${e.message}`);}
  }
  await syncCloudBooks(false);
  toast(`${succeeded} PDFs uploaded to cloud${failed.length?`; ${failed.length} failed`:''}.`);
  if(failed.length)cloudStatus(failed.join(' | '));
 }finally{cloudBusy=false;render();}
}
async function uploadLocalBooks(){
 if(!drive.connected()){toast('Connect Google Drive under Settings first.');navigate('settings');return;}
 if(cloudBusy){toast('Another cloud upload is in progress.');return;}
 const pending=state.documents.filter(d=>!d.cloudId);
 if(!pending.length){toast('All local books are already linked to the cloud.');return;}
 if(!confirm(`Upload ${pending.length} local PDFs to your private Google Drive? Your local copies will remain on this device.`))return;
 cloudBusy=true;let done=0;let failed=[];
 try{
  for(const doc of pending){try{if(await uploadExistingBook(doc))done++;}catch(e){console.error(e);failed.push(`${doc.name}: ${e.message}`);}}
  await syncCloudBooks(false);
  toast(`${done} PDFs uploaded to cloud${failed.length?`; ${failed.length} failed`:''}.`);
  if(failed.length)cloudStatus(failed.join(' | '));
 }finally{cloudBusy=false;render();}
}

async function ensurePDFLib(){if(pdfjsLib)return pdfjsLib;try{pdfjsLib=await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';return pdfjsLib;}catch(e){console.error('PDF.js unavailable',e);throw new Error('PDF rendering library unavailable. Check internet connection for the first load.');}}
async function loadDoc(id){if(pdfInstance&&pdfDocId===id)return pdfInstance;const lib=await ensurePDFLib();let file=await getItem('pdfs',id);if(!file){const meta=state.documents.find(d=>d.id===id);if(meta?.cloudId && drive.connected()){file=await drive.fetchBook({id:meta.cloudId});await putItem('pdfs',id,file);meta.missing=false;save();}}if(!file)throw new Error('This PDF is not cached on this device. Connect Google Drive under Settings, then sync your library.');const bytes=new Uint8Array(await file.arrayBuffer());pdfInstance=await lib.getDocument({data:bytes}).promise;pdfDocId=id;const meta=state.documents.find(d=>d.id===id);if(meta&&meta.pages!==pdfInstance.numPages){meta.pages=pdfInstance.numPages;save();}return pdfInstance;}
async function loadPDFPage(id,p){if(rendering)return;const status=$('pdf-status');if(!status || !currentDoc() || activeRoute!=='reader')return;
 try{rendering=true;status.textContent='Rendering PDF page…';const doc=await loadDoc(id);if(activeRoute!=='reader'||currentDoc()?.id!==id)return;
  pageNumber=Math.max(1,Math.min(doc.numPages,p));const page=await doc.getPage(pageNumber);const base=page.getViewport({scale:1});const width=Math.min(920,Math.max(320,($('doc-viewport')?.clientWidth||850)-44));const actualZoom=zoom*width/base.width;const viewport=page.getViewport({scale:actualZoom});
  const canvas=$('pdf-canvas'),ink=$('annotation-canvas'),stage=readerStage();if(!canvas||!ink||!stage)return;
  const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(viewport.width*dpr);canvas.height=Math.round(viewport.height*dpr);canvas.style.width=`${viewport.width}px`;canvas.style.height=`${viewport.height}px`;
  stage.style.width=`${viewport.width}px`;stage.style.height=`${viewport.height}px`;ink.width=Math.round(viewport.width*dpr);ink.height=Math.round(viewport.height*dpr);ink.style.width=`${viewport.width}px`;ink.style.height=`${viewport.height}px`;ink.style.touchAction='none';stage.style.touchAction='none';
  await page.render({canvasContext:canvas.getContext('2d'),viewport,transform:dpr!==1?[dpr,0,0,dpr,0,0]:null}).promise;
  $('pdf-pagecount').textContent=doc.numPages;$('page-number').value=pageNumber;
  const key=`${id}:${pageNumber}`;$('page-notes').value=state.readingNotes[key]||'';drawAnnotations();bindDrawing(ink);
  status.textContent=`Page ${pageNumber} of ${doc.numPages} · ${readerTool} tool · annotations saved locally`;
 }catch(err){console.error(err);status.textContent=err.message||'Unable to load PDF.';const stage=readerStage();if(stage){stage.innerHTML=`<div style="width:min(600px,70vw);padding:22px;color:#586f75">PDF.js is not available in this browser right now. The PDF is still stored locally. Enable internet access and reload Prep OS to enable pen/highlighter annotations.</div>`;}}
 finally{rendering=false;}}
function annotationKey(){return `${state.currentDocId}:${pageNumber}`;}
function canvasCoords(event,canvas){let rect=canvas.getBoundingClientRect();return {x:Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)),y:Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height))};}
// Stylus draws; touch pointers navigate. touch-action:none prevents Android
// from converting a stylus stroke into a native scroll and cancelling it.
function bindDrawing(canvas){
 const touches=new Map();
 let activePointerId=null, eraserChanged=false, touchStart=null, pinchStart=null;
 const viewport=$('doc-viewport');
 const distance=()=>{const pts=[...touches.values()];return pts.length<2?0:Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);};
 const eraseAt=(event)=>{
  const pt=canvasCoords(event,canvas),key=annotationKey(),strokes=state.annotations[key]||[];
  let best=-1,min=.045;
  strokes.forEach((stroke,i)=>{
   const pts=stroke.points||[];
   for(let j=0;j<pts.length;j++){
    const p=pts[j],d=Math.hypot((p.x-pt.x)*1.2,p.y-pt.y);
    if(d<min){min=d;best=i;}
    if(j>0){
     const a=pts[j-1],dx=(p.x-a.x)*1.2,dy=p.y-a.y;
     const t=Math.max(0,Math.min(1,(((pt.x-a.x)*1.2)*dx+(pt.y-a.y)*dy)/(dx*dx+dy*dy||1)));
     const d2=Math.hypot((pt.x-a.x)*1.2-t*dx,pt.y-a.y-t*dy);
     if(d2<min){min=d2;best=i;}
    }
   }
  });
  if(best>=0){strokes.splice(best,1);eraserChanged=true;drawAnnotations();}
 };
 canvas.onpointerdown=event=>{
  if(event.pointerType==='touch'){
   event.preventDefault();
   touches.set(event.pointerId,{x:event.clientX,y:event.clientY});
   if(touches.size===1)touchStart={x:event.clientX,y:event.clientY,moved:false};
   if(touches.size===2){pinchStart={distance:distance(),zoom};touchStart=null;}
   try{canvas.setPointerCapture(event.pointerId);}catch(_){}
   return;
  }
  if(event.pointerType!=='pen'||!state.currentDocId||activePointerId!==null)return;
  event.preventDefault();
  activePointerId=event.pointerId;eraserChanged=false;
  if(readerTool==='eraser')eraseAt(event);
  else{
   activeStroke={tool:readerTool,color:readerTool==='highlighter'?highlightColor:penColor,points:[canvasCoords(event,canvas)],id:uid()};
   drawAnnotations();
  }
  try{canvas.setPointerCapture(event.pointerId);}catch(_){}
 };
 canvas.onpointermove=event=>{
  if(event.pointerType==='touch'){
   if(!touches.has(event.pointerId))return;
   event.preventDefault();
   const prev=touches.get(event.pointerId);
   touches.set(event.pointerId,{x:event.clientX,y:event.clientY});
   if(touches.size===2&&pinchStart?.distance){pinchStart.zoom=Math.max(.65,Math.min(2.5,zoom*distance()/pinchStart.distance));}
   if(touches.size===1&&viewport){
    viewport.scrollLeft-=event.clientX-prev.x;
    viewport.scrollTop-=event.clientY-prev.y;
    if(touchStart&&Math.hypot(event.clientX-touchStart.x,event.clientY-touchStart.y)>12)touchStart.moved=true;
   }
   return;
  }
  if(event.pointerType!=='pen'||event.pointerId!==activePointerId)return;
  event.preventDefault();
  if(readerTool==='eraser')eraseAt(event);
  else if(activeStroke){activeStroke.points.push(canvasCoords(event,canvas));drawAnnotations();}
 };
 const complete=event=>{
  if(event.pointerType==='touch'){
   if(!touches.has(event.pointerId))return;
   event.preventDefault();
   const wasSingle=touches.size===1;
   touches.delete(event.pointerId);
   if(touches.size===0){
    if(pinchStart&&pinchStart.distance>0){
     const newZoom=Math.max(.65,Math.min(2.5,pinchStart.zoom));
     if(Math.abs(newZoom-zoom)>.04){zoom=newZoom;renderReader();}
    }else if(wasSingle&&touchStart&&viewport&&viewport.scrollWidth<=viewport.clientWidth+8){
     const dx=event.clientX-touchStart.x,dy=event.clientY-touchStart.y;
     if(Math.abs(dx)>90&&Math.abs(dy)<65&&currentDoc()){
      pageNumber=Math.max(1,Math.min(currentDoc().pages||Infinity,pageNumber+(dx<0?1:-1)));
      rememberPage();renderReader();
     }
    }
    pinchStart=null;touchStart=null;
   }
   return;
  }
  if(event.pointerType!=='pen'||event.pointerId!==activePointerId)return;
  event.preventDefault();activePointerId=null;
  if(readerTool==='eraser'){if(eraserChanged)save();eraserChanged=false;}
  else if(activeStroke){
   if(event.type==='pointerup'){
    const key=annotationKey();state.annotations[key]=state.annotations[key]||[];
    state.annotations[key].push(activeStroke);save();
   }
   activeStroke=null;drawAnnotations();
  }
 };
 // Pinch preview tracks finger distance; commit zoom on gesture completion.
 canvas.onpointerup=complete;
 canvas.onpointercancel=event=>{
  if(event.pointerType==='pen'&&event.pointerId===activePointerId){
   activePointerId=null;activeStroke=null;if(eraserChanged)save();eraserChanged=false;drawAnnotations();
  }else complete(event);
 };
 canvas.onlostpointercapture=event=>{
  if(event.pointerType==='pen'&&event.pointerId===activePointerId){
   activePointerId=null;activeStroke=null;if(eraserChanged)save();eraserChanged=false;drawAnnotations();
  }
 };
}
function drawAnnotations(){const canvas=$('annotation-canvas');if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;const bounds=canvas.getBoundingClientRect(),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);const lines=[...(state.annotations[annotationKey()]||[]),...(activeStroke?[activeStroke]:[])];
 lines.forEach(s=>{if(!s.points.length)return;ctx.save();ctx.beginPath();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=strokeColor(s);ctx.globalAlpha=s.tool==='highlighter'?.34:1;ctx.lineWidth=s.tool==='highlighter'?Math.max(13,w*.022):Math.max(2,w*.004);ctx.globalCompositeOperation='source-over';ctx.moveTo(s.points[0].x*w,s.points[0].y*h);if(s.points.length===1)ctx.lineTo(s.points[0].x*w+.01,s.points[0].y*h+.01);s.points.slice(1).forEach(p=>ctx.lineTo(p.x*w,p.y*h));ctx.stroke();ctx.restore();});}

async function indexPDF(id){try{const doc=await loadDoc(id),entries=[];for(let i=1;i<=doc.numPages;i++){const pg=await doc.getPage(i);const content=await pg.getTextContent();let text=content.items.map(x=>x.str||'').join(' ').replace(/\s+/g,' ').trim();entries.push({page:i,text});if(i%15===0||i===doc.numPages)toast(`Indexed ${i}/${doc.numPages} pages`);}
 await putItem('indexes',id,entries);const meta=state.documents.find(d=>d.id===id);if(meta)meta.indexed=true;save();render();toast('Local text index is ready.');}catch(e){console.error(e);toast('Indexing failed: '+e.message);}}
async function searchPDFs(){let needle=(state.libraryQuery||'').trim().toLowerCase();if(needle.length<2){toast('Enter at least two characters.');return;}docSearchResult=[];for(const d of state.documents){const pages=await getItem('indexes',d.id);if(!pages)continue;for(const p of pages){const at=p.text.toLowerCase().indexOf(needle);if(at>=0){docSearchResult.push({docId:d.id,docName:d.name,page:p.page,snippet:p.text.slice(Math.max(0,at-65),Math.min(p.text.length,at+needle.length+125))});if(docSearchResult.length>=50)break;}}if(docSearchResult.length>=50)break;}
 if(!docSearchResult.length)toast('No matches found in indexed PDFs. Index each PDF first.');renderLibrary();}

async function exportBackup(){try{const includePDF=$('backup-pdfs')?.checked||false;const exportObject={format:'prep-os-backup',version:1,created:new Date().toISOString(),state,documents:{},indexes:{}};
 for(const d of state.documents){const index=await getItem('indexes',d.id);if(index)exportObject.indexes[d.id]=index;if(includePDF){let file=await getItem('pdfs',d.id);if(file)exportObject.documents[d.id]={name:d.name,mime:'application/pdf',base64:await blobToBase64(file)};}}
 const blob=new Blob([JSON.stringify(exportObject)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`prep-os-backup-${isoDay()}${includePDF?'-with-pdfs':''}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);toast(includePDF?'Full backup exported.':'Study-data backup exported (without PDFs).');}catch(e){console.error(e);toast('Backup failed: '+e.message);}}
async function importBackup(event){const file=event.target.files?.[0];event.target.value='';if(!file)return;try{const raw=JSON.parse(await file.text());if(raw.format!=='prep-os-backup'||raw.version!==1||!raw.state||!Array.isArray(raw.state.documents)||!Array.isArray(raw.state.flashcards))throw Error('Invalid or unsupported Prep OS backup.');
 if(!confirm('Restore this backup? It will replace current Prep OS data, including documents and annotations. Export your current data first.'))return;
 await clearStore('pdfs');await clearStore('indexes');await clearStore('kv');for(const [id,item] of Object.entries(raw.documents||{})){await putItem('pdfs',id,base64ToBlob(item.base64,item.mime));}for(const [id,index] of Object.entries(raw.indexes||{})){await putItem('indexes',id,index);}state={...makeDefaultState(),...raw.state};state.documents=state.documents.map(d=>({...d,missing:!raw.documents?.[d.id]})); // Retain stable IDs so re-importing a matching PDF can relink saved page notes and annotations.
 await saveNow();pdfInstance=null;pdfDocId=null;docSearchResult=[];toast('Backup restored. Missing PDFs can be relinked by re-importing the same filenames.');render();}
 catch(e){console.error(e);toast('Restore failed: '+e.message);}}

function navigate(route){location.hash='#'+route;if((location.hash.slice(1)||'dashboard')===route)render();}
function newSession(){showModal(`<h2>Log a study session</h2><p class="subtle">Record actual work completed, not planned time.</p><div class="field"><label class="form-label">Date</label><input class="input" type="date" id="session-date" value="${isoDay()}"></div><div class="field"><label class="form-label">Subject</label><select id="session-subject" class="select">${KEYS.map(k=>`<option>${safe(k)}</option>`).join('')}</select></div><div class="field"><label class="form-label">Minutes studied</label><input class="input" type="number" min="1" max="900" id="session-minutes" value="45"></div><div class="field"><label class="form-label">What did you complete?</label><input class="input" id="session-note" placeholder="e.g., TVM practice 12 MCQs"></div><div class="modal-actions">${button('Cancel','close-modal')}${button('Save session','save-session','primary')}</div>`);}

async function clickDispatcher(event){let btn=event.target.closest('[data-action]');if(!btn)return;const action=btn.dataset.action;
 if(action==='upload'){$('pdf-upload').click();return;}
 if(action==='cloud-google'){try{await cloud.connectGoogle();toast('Google sign-in successful.');await startStudySync();try{await syncCloudBooks(false);}catch(e){console.error('Cloud library sync issue',e);toast('Signed in; cloud library needs setup: '+e.message);}render();}catch(e){console.error(e);toast(e.code==='auth/unauthorized-domain'?'Add bhupendra028.github.io to Firebase Authentication authorized domains.':e.code==='auth/account-exists-with-different-credential'?'This email already has an account. Use the existing-account section to sign in and link Google.':'Google sign-in failed: '+e.message);}return;}
 if(action==='cloud-link-google'){try{if(!cloud.currentUser())throw Error('Sign in with your existing email and password first.');await cloud.linkGoogle();toast('Google linked to your existing Prep OS account.');await startStudySync();render();}catch(e){toast('Could not link Google: '+e.message);}return;}
 if(action==='cloud-login'){try{const email=$('cloud-email')?.value?.trim(),password=$('cloud-password')?.value;await cloud.connect(email,password);toast('Existing account signed in. Select Link Google now.');await startStudySync();render();}catch(e){toast('Sign-in failed: '+e.message);}return;}
 if(action==='cloud-logout'){sync.stop();syncAccount=null;await cloud.disconnect();toast('Signed out. Locally cached books remain on this device.');render();return;}
 if(action==='sync-conflicts'){const items=await sync.conflicts();showModal(`<h2>Sync conflict history</h2><p>${items.length} saved conflict(s). Local versions are preserved. Export your backup before resolving manually.</p><pre style="max-height:45vh;overflow:auto;white-space:pre-wrap;font-size:11px">${safe(JSON.stringify(items.slice(-20),null,2))}</pre>${button('Close','close-modal')}`);return;}
 if(action==='drive-connect'){try{await drive.connectDrive();toast('Google Drive connected.');await syncCloudBooks(false);render();}catch(e){console.error(e);toast('Google Drive: '+e.message);}return;}
 if(action==='drive-disconnect'){drive.disconnect();toast('Google Drive disconnected on this device. Local PDFs remain.');render();return;}
 if(action==='cloud-books'){try{await syncCloudBooks();}catch(e){console.error(e);toast('Cloud library: '+e.message);}return;}
 if(action==='cloud-upload'){if(!drive.connected()){toast('Connect Google Drive first.');navigate('settings');return;}$('cloud-pdf-upload').click();return;}
 if(action==='cloud-upload-existing'){await uploadLocalBooks();return;}
 if(action.startsWith('cloud-one-')){const id=action.slice('cloud-one-'.length);const doc=state.documents.find(d=>d.id===id);if(!doc)return;try{if(await uploadExistingBook(doc)){toast('Book uploaded to private cloud.');render();}}catch(e){console.error(e);toast('Upload failed: '+e.message);}return;}
 if(action==='cloud-save'){toast('Automatic sync is enabled; manual backup remains available.');return;}
 if(action==='legacy-cloud-save'){try{await saveNow();await cloud.uploadProgress(state);toast('Study progress uploaded to your private cloud account.');}catch(e){toast('Cloud backup failed: '+e.message);}return;}
 if(action==='cloud-restore'){toast('Legacy cloud restore disabled to prevent overwriting automatic sync data. Use JSON backup restore if needed.');return;}
 if(action==='legacy-cloud-restore'){try{const incoming=await cloud.downloadProgress();if(!incoming){toast('No cloud progress backup found.');return;}if(!confirm('Replace local study progress with your cloud backup? Export local backup first.'))return;const localDocs=state.documents;state={...makeDefaultState(),...incoming};for(const doc of localDocs){if(!state.documents.some(d=>d.id===doc.id))state.documents.push(doc);}await saveNow();pdfInstance=null;pdfDocId=null;render();toast('Cloud progress restored.');}catch(e){toast('Restore failed: '+e.message);}return;}

 if(viewNames[action]){navigate(action);return;}
 if(action==='dashboard-start'){startReading(state.lastOpenedReading||'los-001');return;}
 if(action.startsWith('study-')){startReading(action.slice(6));return;}
 if(action.startsWith('task-')){const k=+action.slice(5),d=isoDay(),arr=state.dailyTasks[d]||[];state.dailyTasks[d]=arr.includes(k)?arr.filter(x=>x!==k):[...arr,k];save();render();return;}
 if(action==='curriculum-prev'){curriculumPage=Math.max(0,curriculumPage-1);renderCurriculum();return;}
 if(action==='curriculum-next'){curriculumPage++;renderCurriculum();return;}
 if(action==='reader-fullscreen'){toggleReaderFullscreen();return;}
 if(action.startsWith('color-')){const m=/^color-(pen|highlighter)-([0-9a-f]{6})$/i.exec(action);if(m){if(m[1]==='pen')penColor='#'+m[2];else highlightColor='#'+m[2];readerTool=m[1];localStorage.setItem('prep-os-ink-colors',JSON.stringify({penColor,highlightColor}));renderReader();}return;}
 if(action.startsWith('tool-')){readerTool=action.slice(5);renderReader();return;}
 if(action.startsWith('page-')){let doc=currentDoc();if(!doc)return;pageNumber=Math.max(1,pageNumber+(action==='page-next'?1:-1));rememberPage();renderReader();return;}
 if(action==='zoom-in'||action==='zoom-out'){zoom=Math.max(.65,Math.min(2.5,zoom+(action==='zoom-in'?.2:-.2)));renderReader();return;}
 if(action==='undo-stroke'){const key=annotationKey();state.annotations[key]?.pop();save();drawAnnotations();return;}
 if(action==='save-note'){const doc=currentDoc();if(!doc){toast('Import a PDF first.');return;}state.readingNotes[annotationKey()]=$('page-notes').value;save();toast('Page note saved.');return;}
 if(action==='add-page-flashcard'){const doc=currentDoc();newFlashcard(null,doc?{docId:doc.id,page:pageNumber}:null);return;}
 if(action==='create-card'){newFlashcard();return;}
 if(action.startsWith('edit-')){newFlashcard(state.flashcards.find(c=>c.id===action.slice(5)));return;}
 if(action.startsWith('delete-')){confirmModal('Delete this flashcard and its review history?',`confirmdelete-${action.slice(7)}`);return;}
 if(action.startsWith('confirmdelete-')){state.flashcards=state.flashcards.filter(c=>c.id!==action.slice(14));save();closeModal();render();return;}
 if(action==='save-card'){const front=$('modal-front').value.trim(),back=$('modal-back').value.trim();if(!front||!back){toast('Both sides of the card are required.');return;}
  const existingId=$('modal').dataset.cardId,linkedDoc=$('modal').dataset.docId,page=Number($('modal').dataset.page||0),existing=state.flashcards.find(x=>x.id===existingId),reading=curriculum.readings.find(x=>x.id===state.lastOpenedReading);
  if(existing){existing.front=front;existing.back=back;}else{state.flashcards.push({id:uid(),front,back,created:Date.now(),nextDue:0,interval:0,reviews:0,ease:2.5,repetitions:0,docId:linkedDoc||null,page:page||null,sourceLabel:linkedDoc?state.documents.find(d=>d.id===linkedDoc)?.name:null,readingId:reading?.id,subject:reading?.subject||'General'});}
  save();closeModal();render();toast('Flashcard saved.');return;}
 if(action==='review-cards'){const due=dueCards(state.flashcards);if(!due.length){toast('No flashcards due. Create one or review any saved card.');return;}flashReviewId=due[0].id;flashRevealed=false;renderFlashcards();return;}
 if(action.startsWith('review-')){flashReviewId=action.slice(7);flashRevealed=false;renderFlashcards();return;}
 if(action==='close-review'){flashReviewId=null;flashRevealed=false;renderFlashcards();return;}
 if(action==='reveal-card'){flashRevealed=true;renderFlashcards();return;}
 if(action.startsWith('grade-')){const id=flashReviewId,ix=state.flashcards.findIndex(c=>c.id===id);if(ix===-1)return;state.flashcards[ix]=gradeCard(state.flashcards[ix],action==='grade-again'?'again':'good');save();const next=dueCards(state.flashcards).find(c=>c.id!==id);flashReviewId=next?.id||null;flashRevealed=false;renderFlashcards();toast(next?'Review recorded. Next card ready.':'Review recorded. You are caught up.');return;}
 if(action.startsWith('source-')){const card=state.flashcards.find(x=>x.id===action.slice(7));if(!card?.docId)return;state.currentDocId=card.docId;pageNumber=card.page||1;rememberPage();pdfDocId=null;pdfInstance=null;save();navigate('reader');return;}
 if(action.startsWith('choice-')){currentChoice=Number(action.slice(7));renderPractice();return;}
 if(action==='check-answer'){if(currentChoice===null)return;const q=currentQuestion();state.answers.push({id:uid(),questionId:q.id,readingId:q.readingId,correct:currentChoice===q.a,choice:currentChoice,date:Date.now()});practiceRevealed=true;save();renderPractice();return;}
 if(action==='next-question'){currentPracticeIndex=(currentPracticeIndex+1)%practiceQuestions.length;currentChoice=null;practiceRevealed=false;renderPractice();return;}
 if(action==='reset-quiz'){currentPracticeIndex=0;currentChoice=null;practiceRevealed=false;renderPractice();return;}
 if(action==='log-session'){newSession();return;}
 if(action==='save-session'){const minutes=Number($('session-minutes').value),date=$('session-date').value;if(!(minutes>0&&minutes<=900)||!date){toast('Enter a valid date and minutes.');return;}state.sessions.push({id:uid(),date,minutes,subject:$('session-subject').value,note:$('session-note').value.trim(),created:Date.now()});save();closeModal();render();toast('Study session logged.');return;}
 if(action.startsWith('open-')){const id=action.slice(5);state.currentDocId=id;pageNumber=resumePage(state.documents.find(d=>d.id===id));pdfDocId=null;pdfInstance=null;save();navigate('reader');return;}
 if(action.startsWith('index-')){const id=action.slice(6);btn.disabled=true;btn.textContent='Indexing…';await indexPDF(id);return;}
 if(action.startsWith('remove-')){const id=action.slice(7);confirmModal('Remove this device’s PDF and its local annotations/index? If it is in your cloud library, the cloud copy remains available to re-sync. Flashcard source links might break.',`confirmremove-${id}`);return;}
 if(action.startsWith('confirmremove-')){const id=action.slice(14);await delItem('pdfs',id);await delItem('indexes',id);state.documents=state.documents.filter(d=>d.id!==id);Object.keys(state.annotations).filter(k=>k.startsWith(id+':')).forEach(k=>delete state.annotations[k]);Object.keys(state.readingNotes).filter(k=>k.startsWith(id+':')).forEach(k=>delete state.readingNotes[k]);if(state.currentDocId===id)state.currentDocId=null;pdfDocId=null;pdfInstance=null;save();closeModal();render();return;}
 if(action==='library-search'){state.libraryQuery=$('library-query')?.value||state.libraryQuery||'';await searchPDFs();return;}
 if(action.startsWith('searchopen-')){const chunks=action.slice(11).split('-');const page=Number(chunks.pop());const docId=chunks.join('-');state.currentDocId=docId;pageNumber=page;rememberPage();pdfDocId=null;pdfInstance=null;save();navigate('reader');return;}
 if(action==='save-settings'){const v=Number($('weekly-target').value);if(!(v>0&&v<=70)){toast('Weekly target must be between 1 and 70 hours.');return;}state.weeklyHours=v;state.examDate=$('exam-date').value||state.examDate;save();toast('Preferences saved.');render();return;}
 if(action==='backup'){await exportBackup();return;}
 if(action==='restore'){$('backup-import').click();return;}
 if(action==='clear-data'){confirmModal('This permanently erases everything stored in this browser profile. Export a backup first.', 'confirm-clear');return;}
 if(action==='confirm-clear'){await clearStore('kv');await clearStore('pdfs');await clearStore('indexes');state=makeDefaultState();pdfInstance=null;pdfDocId=null;pageNumber=1;flashReviewId=null;docSearchResult=[];save();closeModal();navigate('dashboard');toast('Local data cleared.');return;}
 if(action==='close-modal'){closeModal();return;}
}
function inputDispatcher(e){if(e.target.id==='page-notes'&&currentDoc()){state.readingNotes[annotationKey()]=e.target.value;save();}if(e.target.id==='curriculum-search'){state.curriculumSearch=e.target.value;curriculumPage=0;save();renderCurriculum();const input=$('curriculum-search');input?.focus();input?.setSelectionRange(input.value.length,input.value.length);}if(e.target.id==='library-query'){state.libraryQuery=e.target.value;save();}}
function changeDispatcher(e){if(e.target.dataset.statusId){state.statuses[e.target.dataset.statusId]=e.target.value;save();return;}if(e.target.id==='subject-filter'){state.selectedSubject=e.target.value;curriculumPage=0;save();renderCurriculum();return;}if(e.target.id==='reader-reading'){state.lastOpenedReading=e.target.value;save();return;}if(e.target.id==='reader-document'){state.currentDocId=e.target.value||null;pageNumber=resumePage(currentDoc());pdfDocId=null;pdfInstance=null;save();renderReader();return;}if(e.target.id==='page-number'){pageNumber=Math.max(1,Math.floor(Number(e.target.value)||1));rememberPage();renderReader();return;}}
initialize();
