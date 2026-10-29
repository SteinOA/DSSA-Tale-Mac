const { test } = require("node:test");
const assert = require("node:assert/strict");
const { validateCleanup, validateQuotedMinutes } = require("../../src/helpers/nbTextIntegrity");
const source = "eg meiner at vi ikkje skal endre fristen vi har ein plan og eg vil òg høyre kva dei andre meiner møtet er tysdag klokka ni Kari sender ut referatet innan fredag budsjettet er 25000 kroner";
const good = "Eg meiner at vi ikkje skal endre fristen. Vi har ein plan, og eg vil òg høyre kva dei andre meiner. Møtet er tysdag klokka ni. Kari sender ut referatet innan fredag. Budsjettet er 25 000 kroner.";

test("actual NN cleanup: accept 4B/8B punctuation, reject 1.5B corruption and translation", () => {
  for (const output of [good, good.replace("25 000", "25000"), source]) assert.equal(validateCleanup(source, output, {language:"nn"}).accepted, true);
  for (const output of [source.replace("meiner", "myrger"),source.replace("eg", "jeg"),source.replace("ikkje", "ikke"),source.replace("tysdag", "torsdag"),"",source+" Takk."]) {
    assert.deepEqual(validateCleanup(source,output,{language:"nn"}).text,source);
    assert.equal(validateCleanup(source,output).accepted,false);
  }
});
test("protect numeric signs, decimals, dates, ranges and negation while permitting thousand grouping", () => {
  for (const [a,b] of [["Renta er 2%.","Renta er 2."],["Pris €25.","Pris 25."],["Beløpet er -25000.","Beløpet er 25000."],["Temperaturen er −2.","Temperaturen er 2."],["Renta er +2,5.","Renta er 2,5."],["Renta er 2,5.","Renta er 2.5."],["Dato 01/02/2026","Dato 01.02.2026"],["Frå 12-14","Frå 12 14"],["Vi skal ikkje sende.","Vi skal sende."]]) assert.equal(validateCleanup(a,b).accepted,false,`${a} -> ${b}`);
  assert.equal(validateCleanup("Sum -25000 kroner.","Sum -25 000 kroner.").accepted,true);
  assert.equal(validateCleanup("Tal 1234.","Tal 12 34.").accepted,false);
});
test("fenced and inline code must remain byte-identical", () => {
  for (const [a,b] of [["Bruk `a-b`.","Bruk `a b`."],["```js\nx = -1\n```","```js\nx=-1\n```"],["~~~\nfoo\n~~~","~~~\nFoo\n~~~"],["```\nfoo","```\nFoo"]]) assert.equal(validateCleanup(a,b).accepted,false);
  assert.equal(validateCleanup("Hei.\n```\nx=-1\n```","Hei!\n```\nx=-1\n```").accepted,true);
});
test("quoted minutes keep exact text and downgrade opinions, implied tasks and cropped negation", () => {
  const text="Eg meiner at fristen bør stå. Styret vedtok planen. Kari skal sende referatet fredag. Vi vedtok ikkje å endre fristen.";
  const result=validateQuotedMinutes(text,[{type:"decision",quote:"Eg meiner at fristen bør stå."},{type:"decision",quote:"Styret vedtok planen."},{type:"task",quote:"Kari skal sende referatet fredag."},{type:"decision",quote:"Vi vedtok"},{type:"task",quote:"sende referatet fredag"}]);
  assert.equal(result.accepted,true);
  assert.deepEqual(result.items.map(x=>x.type),["note","decision","task","note","note"]);
  assert.equal(result.reason,"downgraded_to_note");
  assert.ok(result.text.includes("Eg meiner"));
});
test("unverified generated facts, translated quotes and metadata fall back to raw source", () => {
  for(const items of [[],null,[{type:"decision",quote:"Fristen skal ikkje endrast."}],[{type:"note",quote:"Eg meiner",owner:"Kari"}],[{type:"summary",quote:"eg meiner"}],[{type:"note",quote:"Jeg mener"}]]) {
    const result=validateQuotedMinutes(source,items,{language:"nn"});assert.equal(result.accepted,false);assert.equal(result.text,source);
  }
  const result=validateQuotedMinutes(source,[{type:"decision",quote:source}],{language:"nn"});
  assert.equal(result.items[0].type,"note");assert.equal(result.text,source);
});
