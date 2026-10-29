const test=require('node:test');const assert=require('node:assert/strict');
const {getNbDialogLabels}=require('../../src/helpers/nbDialogLabels');
test('native export dialogs have NB NN EN labels without changing file contents',()=>{
 const nb=getNbDialogLabels('nb');const nn=getNbDialogLabels('nn_NO');const en=getNbDialogLabels('en-US');
 assert.deepEqual(Object.keys(nn),Object.keys(nb));assert.deepEqual(Object.keys(en),Object.keys(nb));
 assert.equal(nn.storageTitle,'Vel mappe for dokument');assert.match(nn.missingConversation,/enno/);assert.equal(en.documentTitle,'Save document');assert.equal(getNbDialogLabels(null).storageTitle,nb.storageTitle);
 nn.storageTitle='changed';assert.equal(getNbDialogLabels('nn').storageTitle,'Vel mappe for dokument');
});
