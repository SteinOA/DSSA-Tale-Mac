const { execFile } = require("child_process");
const { promisify } = require("util");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const run = promisify(execFile);
async function getLocalProfile(cacheDirectory) {
  const username = os.userInfo().username;
  const profile = { name: username, image: null };
  if(process.platform !== "darwin") return profile;
  try {
    const {stdout} = await run("/usr/bin/dscl",["-plist",".","-read","/Users/"+username,"RealName","Picture"],{maxBuffer:1024*1024});
    const text=(key)=>stdout.match(new RegExp("<key>dsAttrTypeStandard:"+key+"</key>\\s*<array>\\s*<string>(.*?)</string>","s"))?.[1]?.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">");
    profile.name=text("RealName") || username;
    // macOS's directory service may hold a custom JPEG instead of a picture path.
    try {
      const photo=await run("/usr/bin/dscl",["-plist",".","-read","/Users/"+username,"JPEGPhoto"],{maxBuffer:4*1024*1024});
      const data=photo.stdout.match(/<data>([\s\S]*?)<\/data>/)?.[1]?.replace(/\s/g,"");
      if(data) profile.image="data:image/jpeg;base64,"+data;
    } catch {}
    if(!profile.image && text("Picture")) {
      await fs.mkdir(cacheDirectory,{recursive:true});
      const destination=path.join(cacheDirectory,"mac-profile.png");
      await run("/usr/bin/sips",["-s","format","png","--resampleHeightWidthMax","128",text("Picture"),"--out",destination]);
      profile.image="data:image/png;base64,"+(await fs.readFile(destination)).toString("base64");
    }
  } catch {}
  return profile;
}
module.exports={getLocalProfile};
