// Electron roles keep their behavior; only their visible names are localized.
const labels = {
  nb: { Edit:"Rediger", View:"Vis", Window:"Vindu", about:"Om DSSA Tale", services:"Tjenester", hide:"Skjul DSSA Tale", hideOthers:"Skjul andre", unhide:"Vis alle", undo:"Angre", redo:"Gjør om", cut:"Klipp ut", copy:"Kopier", paste:"Lim inn", pasteAndMatchStyle:"Lim inn og tilpass stil", delete:"Slett", selectAll:"Marker alt", startSpeaking:"Start opplesning", stopSpeaking:"Stopp opplesning", reload:"Last inn på nytt", forceReload:"Tving ny innlasting", toggleDevTools:"Utviklerverktøy", resetZoom:"Faktisk størrelse", zoomIn:"Zoom inn", zoomOut:"Zoom ut", togglefullscreen:"Fullskjerm", minimize:"Minimer", close:"Lukk vinduet", front:"Vis alle foran", window:"Vindu" },
  nn: { Edit:"Rediger", View:"Vis", Window:"Vindauge", about:"Om DSSA Tale", services:"Tenester", hide:"Gøym DSSA Tale", hideOthers:"Gøym andre", unhide:"Vis alle", undo:"Angre", redo:"Gjer om", cut:"Klipp ut", copy:"Kopier", paste:"Lim inn", pasteAndMatchStyle:"Lim inn og tilpass stil", delete:"Slett", selectAll:"Marker alt", startSpeaking:"Start opplesing", stopSpeaking:"Stopp opplesing", reload:"Last inn på nytt", forceReload:"Tving ny innlasting", toggleDevTools:"Utviklarverktøy", resetZoom:"Faktisk storleik", zoomIn:"Zoom inn", zoomOut:"Zoom ut", togglefullscreen:"Fullskjerm", minimize:"Minimer", close:"Lukk vindauget", front:"Vis alle fremst", window:"Vindauge" },
};
function localizeNativeMenu(template, language) {
  const strings = labels[language];
  if (!strings) return template;
  return template.map(item => ({ ...item,
    ...(strings[item.role || item.label] ? {label:strings[item.role || item.label]} : {}),
    ...(Array.isArray(item.submenu) ? {submenu:localizeNativeMenu(item.submenu,language)} : {}),
  }));
}
module.exports={localizeNativeMenu};
