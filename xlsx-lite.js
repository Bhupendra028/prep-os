/* Offline, dependency-free reader/writer for ordinary .xlsx workbooks.
 * Uses browser-native ZIP DEFLATE decompression, supports shared/inline strings,
 * numeric cells, dates-as-serials, and OOXML uncompressed (STORE) exports.
 * Does not evaluate arbitrary Excel formulas or support binary .xls files. */
(function(){'use strict';
const enc=new TextEncoder(),dec=new TextDecoder();
function decode(bytes){return dec.decode(bytes)}
function parseXML(xml){const p=new DOMParser(),d=p.parseFromString(xml,'application/xml');if(d.querySelector('parsererror'))throw Error('Excel XML could not be parsed');return d}
function elements(root,name){return Array.from(root.getElementsByTagNameNS('*',name))}
function first(root,name){return elements(root,name)[0]}
function attr(el,k){return el?el.getAttribute(k):null}
function unzip(ab){
 const data=new Uint8Array(ab),v=new DataView(ab);let e=-1;
 for(let i=data.length-22;i>=Math.max(0,data.length-65560);i--)if(v.getUint32(i,true)===0x06054b50){e=i;break}
 if(e<0)throw Error('This does not look like a valid .xlsx ZIP archive');
 const n=v.getUint16(e+10,true),offset=v.getUint32(e+16,true),files={};let p=offset;
 for(let i=0;i<n;i++){
  if(v.getUint32(p,true)!==0x02014b50)throw Error('Invalid ZIP directory');
  let method=v.getUint16(p+10,true),size=v.getUint32(p+20,true),namelen=v.getUint16(p+28,true),ex=v.getUint16(p+30,true),comment=v.getUint16(p+32,true),local=v.getUint32(p+42,true);
  let name=decode(data.slice(p+46,p+46+namelen)),d0=local+30+v.getUint16(local+26,true)+v.getUint16(local+28,true);
  files[name]={method,payload:data.slice(d0,d0+size)};p+=46+namelen+ex+comment;
 }
 return files;
}
async function unzipText(files,path){let f=files[path];if(!f)return null;let arr=f.payload;
 if(f.method===8){if(typeof DecompressionStream==='undefined')throw Error('Your browser does not support Excel ZIP decompression. Use recent Chrome or Edge.');
 const stream=new Blob([arr]).stream().pipeThrough(new DecompressionStream('deflate-raw'));arr=new Uint8Array(await new Response(stream).arrayBuffer());
 }else if(f.method!==0)throw Error('Unsupported Excel ZIP compression type: '+f.method);
 return decode(arr);
}
function colNum(ref){let letters=(ref||'').match(/^[A-Z]+/i);if(!letters)return 0;let n=0;for(let c of letters[0].toUpperCase())n=n*26+c.charCodeAt(0)-64;return n-1}
function rowFrom(el,shared){let vals=[];
 for(const c of elements(el,'c')){
  const typ=attr(c,'t'),v=first(c,'v'),inline=first(c,'is');let raw=v?v.textContent:(inline?inline.textContent:'');let value=raw;
  if(typ==='s')value=shared[Number(raw)]||'';
  else if(typ==='b')value=raw==='1';
  else if(typ==='n'||(!typ&&v&&raw!==''))value=isFinite(Number(raw))?Number(raw):raw;
  if(raw!==''||inline)vals[colNum(attr(c,'r'))]=value;
 }
 return vals.map(x=>x===undefined?'':x);
}
async function read(arrayBuffer){let files=unzip(arrayBuffer);let workbook=await unzipText(files,'xl/workbook.xml');if(!workbook)throw Error('Excel workbook.xml is missing');
 let rels=await unzipText(files,'xl/_rels/workbook.xml.rels'),sharedText=await unzipText(files,'xl/sharedStrings.xml'),shared=[];
 if(sharedText)shared=elements(parseXML(sharedText),'si').map(si=>si.textContent||'');
 let targets={};if(rels)for(let r of elements(parseXML(rels),'Relationship'))targets[attr(r,'Id')]=attr(r,'Target');
 let out={};for(let sh of elements(parseXML(workbook),'sheet')){
  let id=attr(sh,'r:id')||attr(sh,'id'),target=targets[id];
  if(!target)continue;target=target.replace(/^\//,'');if(!target.startsWith('xl/'))target='xl/'+target.replace(/^\.\.\//,'');
  let xml=await unzipText(files,target);if(!xml)continue;
  let rows=elements(parseXML(xml),'row').map(r=>rowFrom(r,shared));out[attr(sh,'name')]=rows;
 }
 return out;
}
const crcTable=(()=>{let t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc(a){let c=0xffffffff;for(const b of a)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0}
function xmlEsc(x){return String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')}
function colName(n){let r='';for(n++;n;n=Math.floor((n-1)/26))r=String.fromCharCode(65+(n-1)%26)+r;return r}
function sheetXml(rows){let out=['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>','<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/><sheetData>'];
 rows.forEach((row,ri)=>{if(!Array.isArray(row))return;out.push('<row r="'+(ri+1)+'">');row.forEach((v,ci)=>{if(v===null||v===undefined||v==='')return;let cell=colName(ci)+(ri+1),style=ri===0?' s="1"':'';
 if(typeof v==='number'&&isFinite(v))out.push(`<c r="${cell}"${style}><v>${v}</v></c>`);
 else if(typeof v==='boolean')out.push(`<c r="${cell}" t="b"${style}><v>${v?1:0}</v></c>`);
 else out.push(`<c r="${cell}" t="inlineStr"${style}><is><t xml:space="preserve">${xmlEsc(v)}</t></is></c>`)
 });out.push('</row>')});out.push('</sheetData></worksheet>');return out.join('')}
function toZip(files){let locals=[],centrals=[],offset=0;for(let [name,body] of files){let nam=enc.encode(name),bytes=enc.encode(body),c=crc(bytes);let local=new Uint8Array(30+nam.length+bytes.length),d=new DataView(local.buffer);d.setUint32(0,0x04034b50,true);d.setUint16(4,20,true);d.setUint32(14,c,true);d.setUint32(18,bytes.length,true);d.setUint32(22,bytes.length,true);d.setUint16(26,nam.length,true);local.set(nam,30);local.set(bytes,30+nam.length);locals.push(local);
 let central=new Uint8Array(46+nam.length),h=new DataView(central.buffer);h.setUint32(0,0x02014b50,true);h.setUint16(4,20,true);h.setUint16(6,20,true);h.setUint32(16,c,true);h.setUint32(20,bytes.length,true);h.setUint32(24,bytes.length,true);h.setUint16(28,nam.length,true);h.setUint32(42,offset,true);central.set(nam,46);centrals.push(central);offset+=local.length;
 }let csize=centrals.reduce((a,x)=>a+x.length,0),end=new Uint8Array(22),ev=new DataView(end.buffer);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,csize,true);ev.setUint32(16,offset,true);return new Blob([...locals,...centrals,end],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})}
function write(sheets){let names=Object.keys(sheets);if(!names.length)throw Error('No data to export');let ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main',relns='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
 let workbook=`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="${ns}" xmlns:r="${relns}"><sheets>`+names.map((x,i)=>`<sheet name="${xmlEsc(x)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')+'</sheets></workbook>';
 let workbookRels='<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+names.map((x,i)=>`<Relationship Id="rId${i+1}" Type="${relns}/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')+`<Relationship Id="rId${names.length+1}" Type="${relns}/styles" Target="styles.xml"/></Relationships>`;
 let types='<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+names.map((x,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')+'</Types>';
 let styles='<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="'+ns+'"><fonts count="2"><font><sz val="11"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF142637"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf xfId="0" fontId="0" fillId="0" borderId="0"/><xf xfId="0" fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>';
 let files=[['[Content_Types].xml',types],['_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="'+relns+'/officeDocument" Target="xl/workbook.xml"/></Relationships>'],['xl/workbook.xml',workbook],['xl/_rels/workbook.xml.rels',workbookRels],['xl/styles.xml',styles]];
 names.forEach((x,i)=>files.push([`xl/worksheets/sheet${i+1}.xml`,sheetXml(sheets[x])]));return toZip(files);
}
window.FitXLSX={read,write};
})();
