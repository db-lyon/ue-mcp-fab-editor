import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadManifest} from '../node_modules/ue-mcp/dist/plugin/manifest.js';
import {mutationScope} from '../node_modules/ue-mcp/dist/flow/guard.js';
const root=new URL('../',import.meta.url);
const native=fs.readFileSync(new URL('ue/Plugins/FabEditor/Source/FabEditor/Private/Handlers/FabEditorService.cpp',root),'utf8');
test('native module is a separate plugin with no task shim',()=>{
  const {manifest,dropped}=loadManifest(root.pathname.replace(/^\/(\w:)/,'$1'));
  assert.deepEqual(dropped,[]);assert.equal(manifest.nativeModule.uePluginName,'FabEditor');
  assert.equal(manifest.nativeModule.category,'fab_editor');assert.equal(manifest.minServerVersion,'1.3.7');
  assert.ok(manifest.nativeModule.handlers.fab_editor_request);assert.equal(Object.keys(manifest.tasks ?? {}).length,0);
  assert.equal(manifest.uePluginDependency,'Fab');
});
test('uplugin is a project plugin, not a launcher install',()=>{
  const descriptor=JSON.parse(fs.readFileSync(new URL('ue/Plugins/FabEditor/FabEditor.uplugin',root),'utf8'));
  assert.equal(descriptor.Installed,undefined);
  assert.ok(descriptor.Plugins.some(p=>p.Name==='Fab'&&p.Enabled!==false));
});
test('host mutation guard covers the actual external method',()=>{
  assert.equal(mutationScope({method:'fab_editor_request',params:{operation:'download'}}),true);
});
test('native reply correlation is separate from public IDs',()=>{
  assert.match(native,/Nonce != \(\*Found\)->ReplyNonce/);assert.match(native,/Reply\.Get\(\) != Sender/);
  assert.doesNotMatch(native,/Nonce != OperationId/);assert.doesNotMatch(native,/SetStringField\(TEXT\("nonce"\), Op->Id/);
});
test('native snapshot is scoped, expiring and single use',()=>{
  for(const pattern of [/Snapshot->SnapshotConsumed/,/Snapshot->Browser\.Pin\(\) != Browser/,/Snapshot->Started > 120/,/Snapshot->SnapshotConsumed = true/])assert.match(native,pattern);
});
test('raw control fingerprints remain native-private',()=>{
  assert.match(native,/SnapshotElements\.Add\(PrivateElement\)/);
  assert.match(native,/RemoveField\(TEXT\("fingerprint"\)\)/);
});
test('page claims are never labeled verified ownership',()=>{
  assert.doesNotMatch(native,/SetBoolField\(TEXT\("owned"\), true/);
  assert.match(native,/SetBoolField\(TEXT\("reportedOwned"\), true/);
  assert.match(native,/SetBoolField\(TEXT\("ownershipVerified"\), false/);
});
test('experimental network access is disabled by default before authentication',()=>{
  assert.match(native,/bool Enabled = false/);
  assert.ok(native.indexOf('if (!ExperimentalAccessEnabled())') < native.indexOf('const bool HasSession = Auth'));
  assert.match(native,/acknowledgeBrowserReportedOwnership/);
});
