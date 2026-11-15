const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const nn=require('../../src/locales/nn/translation.json');const panel=require('../../src/locales/nn/nbPanel.json');
test('local Mac panel, onboarding and integrations have explicit Nynorsk copy',()=>{
 for(const name of ['NBControlPanel.tsx','NBOnboarding.tsx','NBIntegrations.tsx','notes/NBConversationExport.tsx']){
  const source=fs.readFileSync(path.join(__dirname,'../../src/components',name),'utf8');
  for(const match of source.matchAll(/(?:ui|tr|setMessage)\(["']([^"'\n]+)["']/g)){
   assert.ok(Object.hasOwn(panel,match[1]),`${name}: missing explicit nn copy: ${match[1]}`);
  }
 }
 assert.equal(panel['Originalteksten er beholdt fordi modellen endret ord eller fakta.'],'Originalteksten er teken vare på fordi modellen endra ord eller fakta.');
 assert.match(panel['Referatutkast med kontrollerte kildesitater. Kontroller sammenhengen før bruk.'],/kjeldesitat/);
 assert.equal(panel['Utseende og språk'],'Utsjånad og språk');
 assert.equal(panel['Innstillinger'],'Innstillingar');
 assert.equal(panel['Valgt mikrofon'],'Vald mikrofon');
});
test('reachable local interface sections contain real Nynorsk values',()=>{
 assert.equal(nn.sidebar.home,'Heim');assert.equal(nn.sidebar.settings,'Innstillingar');
 assert.equal(nn.notes.editor.untitled,'Utan tittel');
 assert.equal(nn.noteEditor.saved,'Lagra');
 assert.equal(nn.transcript.speaker.you,'Du');
 assert.equal(nn.transcriptionPreview.waitingForInput,'Si noko …');
 assert.match(nn.hooks.clipboard.pasteFailed.description,/ikkje/);
 assert.match(nn.menu.settings,/Innstillingar/);
});

test('dynamic import phases have explicit Nynorsk and English resources',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../../src/components/NBControlPanel.tsx'),'utf8');
 const phases=source.match(/const importPhaseText[^=]*= \{([^}]+)\}/);
 assert.ok(phases,'import phase mapping exists');
 const english=source.slice(source.indexOf('const NB_ENGLISH'));
 for(const match of phases[1].matchAll(/:\s*"([^"\n]+)"/g)){
  assert.ok(Object.hasOwn(panel,match[1]),'nn import phase: '+match[1]);
  assert.ok(english.includes('"'+match[1]+'"'),'en import phase: '+match[1]);
 }
 assert.equal(panel['Lydfilen behandles'],'Lydfila vert handsama');
});
