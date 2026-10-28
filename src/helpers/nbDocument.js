// Minimal, standards-based OOXML document writer. No external runtime required.
// MIT, DSSA Tale contributors.
function crc32(buffer) {
 let crc=0xffffffff;
 for(const byte of buffer){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
 return (crc^0xffffffff)>>>0;
}
function zip(files){
 const chunks=[],directory=[];let offset=0;
 for(const [name,source] of Object.entries(files)){
  const filename=Buffer.from(name),data=Buffer.from(source),crc=crc32(data);
  const head=Buffer.alloc(30);head.writeUInt32LE(0x04034b50,0);head.writeUInt16LE(20,4);head.writeUInt16LE(0x800,6);head.writeUInt32LE(crc,14);head.writeUInt32LE(data.length,18);head.writeUInt32LE(data.length,22);head.writeUInt16LE(filename.length,26);
  const central=Buffer.alloc(46);central.writeUInt32LE(0x02014b50,0);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(0x800,8);central.writeUInt32LE(crc,16);central.writeUInt32LE(data.length,20);central.writeUInt32LE(data.length,24);central.writeUInt16LE(filename.length,28);central.writeUInt32LE(offset,42);
  chunks.push(head,filename,data);directory.push(central,filename);offset+=head.length+filename.length+data.length;
 }
 const index=Buffer.concat(directory),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(Object.keys(files).length,8);end.writeUInt16LE(Object.keys(files).length,10);end.writeUInt32LE(index.length,12);end.writeUInt32LE(offset,16);
 return Buffer.concat([...chunks,index,end]);
}
function createDocx(text){
 const escape=(s)=>s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
 return zip({
  "[Content_Types].xml":'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  "_rels/.rels":'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  "word/document.xml":'<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+text.split(/\r?\n/).map(line=>'<w:p><w:r><w:t xml:space="preserve">'+escape(line)+'</w:t></w:r></w:p>').join("")+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>'
 });
}
module.exports={createDocx};
function exportText(text, options={}) {
 return text.split(/\r?\n/).map(line=>{
  const stamp=line.match(/^\s*(\[(?:\d{1,3}:)?\d{1,2}:\d{2}(?:\.\d+)?\])\s*/);
  let rest=stamp ? line.slice(stamp[0].length) : line;
  const speaker=rest.match(stamp ? /^([^:\n]{1,80}:)\s*/ : /^((?:Taler|Speaker)\s+\d+:)\s*/i);
  if(speaker)rest=rest.slice(speaker[0].length);
  return (stamp && options.includeTimestamps ? stamp[1]+" " : "")+(speaker && options.includeSpeakers ? speaker[1]+" " : "")+rest;
 }).join("\n");
}
async function createPdf(text) {
 const {BrowserWindow}=require("electron");
 const win=new BrowserWindow({show:false,webPreferences:{sandbox:true,nodeIntegration:false,contextIsolation:true,javascript:false}});
 try {
  const escaped=text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  await win.loadURL("data:text/html;charset=utf-8,"+encodeURIComponent('<!doctype html><html lang="nb"><title>DSSA Tale – samtaledokument</title><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'"><style>@page{size:A4;margin:20mm}body{font-family:Arial,sans-serif;font-size:11pt;line-height:1.5}p{white-space:pre-wrap;overflow-wrap:anywhere;margin:0 0 8pt}</style><body>'+escaped.split(/\r?\n/).map(line=>'<p>'+(line||'&#160;')+'</p>').join('')+'</body></html>'));
  return await win.webContents.printToPDF({printBackground:true,pageSize:"A4",preferCSSPageSize:true});
 } finally {win.destroy();}
}
module.exports.exportText=exportText;
module.exports.createPdf=createPdf;
