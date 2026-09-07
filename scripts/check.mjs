import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadManifest} from '../node_modules/ue-mcp/dist/plugin/manifest.js';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const {manifest,dropped}=loadManifest(root);
if(dropped.length)throw new Error('Manifest units were dropped: '+JSON.stringify(dropped));
const nativeRoot=path.join(root,manifest.nativeModule.source);
const descriptor=JSON.parse(fs.readFileSync(path.join(nativeRoot,'FabEditor.uplugin'),'utf8'));
if(descriptor.Modules[0].Name!=='FabEditor'||descriptor.Modules[0].Type!=='Editor'||descriptor.EnabledByDefault!==false)throw new Error('Invalid native module descriptor');
for(const file of ['README.md','SECURITY.md','LICENSE','knowledge/fab_editor.md','ue/Plugins/FabEditor/Resources/FabEditor.js','ue/Plugins/FabEditor/Resources/FabLibrary.js'])if(!fs.existsSync(path.join(root,file)))throw new Error('Missing publish file: '+file);
for(const resource of ['FabEditor.js','FabLibrary.js']){
  const source=fs.readFileSync(path.join(nativeRoot,'Resources',resource),'utf8');
  new Function('return ('+source+')');
  if(/performance\.getEntries|__ueMcpFabSnapshot|args\.nonce/.test(source))throw new Error('Legacy unsafe browser state/telemetry remains');
}
const cpp=fs.readFileSync(path.join(nativeRoot,'Source/FabEditor/Private/Handlers/FabEditorService.cpp'),'utf8');
if(cpp.includes('FindPlugin(TEXT("UE_MCP_Bridge"))')||cpp.includes('#include "HandlerUtils.h"'))throw new Error('Native module still depends on bridge-private implementation');
console.log(JSON.stringify({manifest:'valid',nativeModule:'FabEditor',category:manifest.nativeModule.category,handler:Object.keys(manifest.nativeModule.handlers),nativeCompile:'not performed by this structural check'}));
