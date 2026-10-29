const test=require('node:test');const assert=require('node:assert/strict');
const {localizeNativeMenu}=require('../../src/helpers/nbNativeMenuLabels');
test('native Nynorsk menus preserve actions, roles and accelerators',()=>{
 const click=()=>{};const input=[{label:'Edit',submenu:[{role:'redo',accelerator:'Command+Z',click},{role:'paste'}]}];
 const out=localizeNativeMenu(input,'nn');
 assert.equal(out[0].label,'Rediger');assert.equal(out[0].submenu[0].label,'Gjer om');assert.equal(out[0].submenu[0].click,click);assert.equal(out[0].submenu[0].role,'redo');assert.equal(out[0].submenu[0].accelerator,'Command+Z');assert.equal(input[0].submenu[0].label,undefined);assert.equal(localizeNativeMenu(input,'en'),input);
});
