import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeDefaultState,gradeCard,accuracy,isoDay,topicStats} from '../js/engine.js';
import {QUESTIONS} from '../js/questions.js';
const curriculum=JSON.parse(readFileSync(new URL('../curriculum.json',import.meta.url),'utf8'));
test('imported study planner has 102 complete reading titles',()=>{
 assert.equal(curriculum.readings.length,102);
 assert.equal(new Set(curriculum.readings.map(r=>r.id)).size,102);
 assert.equal(curriculum.readings.filter(r=>r.subject==='Quantitative Methods').length,11);
 assert.equal(curriculum.readings.filter(r=>r.subject==='Ethical and Professional Standards').length,10);
 assert.ok(curriculum.readings.every(r=>r.title&&r.id&&r.coverage==='unverified'));
});
test('study progress counts only mastered readings',()=>{
 const s=makeDefaultState();s.statuses['los-001']='mastered';s.statuses['los-002']='learning';
 const result=topicStats(s,curriculum); assert.equal(result.done,1);assert.equal(result.seen,2);assert.equal(result.total,102);
});
test('local date renders as date and not previous timezone date',()=>{
 const date=new Date(2027,4,10,11,0);assert.equal(isoDay(date),'2027-05-10');
});
test('spaced recall ratings change due interval',()=>{
 const c={id:'x',front:'F',back:'B',ease:2.5,interval:0,repetitions:0,reviews:0};
 const after=gradeCard(c,'good');assert.equal(after.interval,1);assert.equal(after.reviews,1);
 const again=gradeCard(after,'again');assert.equal(again.interval,1);assert.equal(again.repetitions,0);
});
test('accuracy and question structure',()=>{
 assert.equal(QUESTIONS.length,12);
 assert.ok(QUESTIONS.every(q=>q.o.length===3&&q.a>=0&&q.a<3&&q.e));
 assert.equal(accuracy([{correct:true},{correct:false},{correct:true}]),67);
 assert.equal(accuracy([]),null);
});
