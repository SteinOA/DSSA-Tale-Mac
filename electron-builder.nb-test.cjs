const base = require("./electron-builder.nb.json");
module.exports = {
  ...base,
  appId: "no.steinoa.openwhispr.nb.test",
  productName: "DSSA Tale Test",
  protocols:{name:"DSSA Tale local test",schemes:["dssa-tale-test"]},
  artifactName: "DSSA-Tale-Test-${version}-Apple-Silicon.${ext}",
  extraResources: [...base.extraResources, {from:"resources/nb-test-build.json",to:"nb-test-build.json"}],
  dmg: {...base.dmg,title:"DSSA Tale Test ${version} – lokal prøve"},
};
