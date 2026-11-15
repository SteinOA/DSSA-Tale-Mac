const fs=require("fs"),path=require("path"),{app}=require("electron");
function read(){try{return JSON.parse(fs.readFileSync(path.join(app.getPath("userData"),"nb-preferences.json"),"utf8"));}catch{return {};}}
function update(values){const next={...read(),...values};fs.mkdirSync(app.getPath("userData"),{recursive:true});fs.writeFileSync(path.join(app.getPath("userData"),"nb-preferences.json"),JSON.stringify(next));return next;}
module.exports={read,update};
