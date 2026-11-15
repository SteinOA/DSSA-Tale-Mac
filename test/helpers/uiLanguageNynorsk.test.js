const test=require('node:test');
const assert=require('node:assert/strict');
const {createRendererServer,installBrowserGlobals}=require('../lib/rendererTestHarness');

test('Nynorsk UI survives restart hydration independently of Bokmål transcription',async(t)=>{
 installBrowserGlobals(t,{
  initialStorage:{customDictionary:JSON.stringify(['OpenWhispr']),nbEditionInitialized:'true',nbUiLanguageInitialized:'true',uiLanguage:'nn',preferredLanguage:'no',whisperModel:'nb-large-full'},
  window:{electronAPI:{getDictionary:async()=>['OpenWhispr'],getUiLanguage:async()=>'',setDictionary:async()=>({success:true})}},
 });
 const vite=await createRendererServer(t,{cachePrefix:'nn-language-preference-test-'});
 const {default:i18n,normalizeUiLanguage}=await vite.ssrLoadModule('/i18n.ts');
 const {initializeSettings,useSettingsStore}=await vite.ssrLoadModule('/stores/settingsStore.ts');
 await initializeSettings();
 assert.equal(normalizeUiLanguage('nn_NO'),'nn');
 assert.equal(i18n.language,'nn');
 assert.equal(i18n.t('sidebar.home'),'Heim');
 assert.equal(i18n.t('sidebar.settings'),'Innstillingar');
 assert.equal(useSettingsStore.getState().uiLanguage,'nn');
 assert.equal(localStorage.getItem('uiLanguage'),'nn');
 assert.equal(useSettingsStore.getState().preferredLanguage,'no');
 useSettingsStore.getState().setUiLanguage('en');
 assert.equal(useSettingsStore.getState().preferredLanguage,'no');
 useSettingsStore.getState().setUiLanguage('nn');
 assert.equal(localStorage.getItem('uiLanguage'),'nn');
 assert.equal(useSettingsStore.getState().whisperModel,'nb-large-full');
 const main=require('../../src/helpers/i18nMain');
 assert.equal(main.normalizeUiLanguage('nn-NO'),'nn');
 main.changeLanguage('nn');
 assert.equal(main.i18nMain.t('menu.settings'),'Innstillingar …');
});
