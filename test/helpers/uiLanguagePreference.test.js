const test=require("node:test");
const assert=require("node:assert/strict");
const {createRendererServer,installBrowserGlobals}=require("../lib/rendererTestHarness");

test("explicit NB UI language, nynorsk and q5 survive startup hydration",async(t)=>{
  installBrowserGlobals(t,{
    initialStorage:{customDictionary:JSON.stringify(["OpenWhispr"]),nbEditionInitialized:"true",nbUiLanguageInitialized:"true",uiLanguage:"en",preferredLanguage:"nn",whisperModel:"nb-large"},
    window:{electronAPI:{getDictionary:async()=>["OpenWhispr"],getUiLanguage:async()=>"",setDictionary:async()=>({success:true})}},
  });
  const vite=await createRendererServer(t,{cachePrefix:"nb-language-preference-test-"});
  const {default:i18n}=await vite.ssrLoadModule("/i18n.ts");
  const {initializeSettings,useSettingsStore}=await vite.ssrLoadModule("/stores/settingsStore.ts");
  assert.equal(useSettingsStore.getState().uiLanguage,"en","explicit startup preference is not replaced by Norwegian defaults");
  const language="en";
  {
    await initializeSettings();
    assert.equal(useSettingsStore.getState().uiLanguage,language);
    assert.equal(i18n.language,language);
    assert.equal(localStorage.getItem("uiLanguage"),language);
    assert.equal(useSettingsStore.getState().preferredLanguage,"nn");
    assert.equal(useSettingsStore.getState().whisperModel,"nb-large");
  }
});
