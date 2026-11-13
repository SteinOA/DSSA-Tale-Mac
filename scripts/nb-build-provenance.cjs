// Generate after committing source, before packaging. Never copies profiles or model weights.
const fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const git=(...args)=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
if(git('status','--porcelain'))throw Error('Commit reviewed source changes before packaging');
const manifest={product:'DSSA Tale Test',version:require('../package.json').version,sourceCommit:git('rev-parse','HEAD'),sourceTree:git('rev-parse','HEAD^{tree}'),sourceBranch:git('branch','--show-current'),builtAt:new Date().toISOString(),platform:process.platform,arch:process.arch,modelWeightsBundled:false,profileFolder:'OpenWhispr-NB-Test',testEvidence:'docs/COMMUNITY-1-MAC.md',testStatus:{communityCPU:'tested on M4 with public Nynorsk multi-speaker audio',communityMPS:'tested on M4 with public Nynorsk multi-speaker audio',whisperxCPU:'tested with separate Norwegian Bokmal and Nynorsk models; text unchanged',longMeeting:'not tested on Mac',manySpeakers:'13 known public voices in artificial Nynorsk concatenation tested on M4; natural meeting not validated',automaticPaste:'macOS authorization pending; not verified in ChatGPT'}};
const artifact=process.argv[2];
if(artifact){manifest.installer={name:path.basename(artifact),sha256:crypto.createHash('sha256').update(fs.readFileSync(artifact)).digest('hex')};process.stdout.write(JSON.stringify(manifest,null,2)+'\n');}
else fs.writeFileSync(path.join(root,'resources/nb-build-provenance.json'),JSON.stringify(manifest,null,2)+'\n');
