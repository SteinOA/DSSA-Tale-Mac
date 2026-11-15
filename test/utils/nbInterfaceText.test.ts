import test from 'node:test';
import assert from 'node:assert/strict';
import {nbInterfaceText} from '../../src/utils/nbInterfaceText';

test('interface localization uses explicit resources and leaves arbitrary source text unchanged',()=>{
 assert.equal(nbInterfaceText('nn','Velg hvordan du vil skrive'),'Vel korleis du vil skrive');
 assert.equal(nbInterfaceText('en','Velg hvordan du vil skrive'),'Choose how you want to write');
 assert.equal(nbInterfaceText('nb','Velg hvordan du vil skrive'),'Velg hvordan du vil skrive');
 const original='Eg heiter Kari. Eg vil ikkje endre målforma. Æ Ø Å – «møte».';
 assert.equal(nbInterfaceText('nn',original),original);
 assert.equal(nbInterfaceText('en',original),original);
});
