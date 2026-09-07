import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const script = fs.readFileSync(new URL('../ue/Plugins/FabEditor/Resources/FabEditor.js', import.meta.url), 'utf8');

function fixture(label='My Library', tag='BUTTON', extras={}) {
  const attributes={...extras}, replies=[];
  const node={tagName:tag,innerText:label,isConnected:true,disabled:false,clicked:0,
    getAttribute:key=>attributes[key]??null,getClientRects:()=>[1],click(){this.clicked++;},dispatchEvent(){},attributes};
  const location=new URL('https://www.fab.com/plugins/ue5/listings/example');
  const window={ue:{test_binding:{complete(nonce,json){replies.push({nonce,...JSON.parse(json)});}}}};
  const document={querySelectorAll:selector=>selector.startsWith('[role="progressbar"')?[]:[node],querySelector:()=>({innerText:'Example product'}),body:{innerText:''}};
  const run=vm.runInContext(`(${script})`,vm.createContext({window,document,location,URL,setTimeout,Date,
    getComputedStyle:()=>({visibility:'visible'}),Event:class{},KeyboardEvent:class{}}));
  let captured;
  const request={bindingName:'test_binding',replyNonce:'private-reply-nonce',requestId:'public-operation'};
  return {node,window,replies,location,run,
    async inspect(){await run({...request,operation:'inspect',newSnapshotId:'snapshot-id'});captured=structuredClone(replies.at(-1));return captured;},
    async act(operation='activate',override={}){await run({...request,operation,snapshotId:'snapshot-id',elementId:'0',expectedElement:captured?.elements[0],expectedUrl:captured?'https://www.fab.com/plugins/ue5/listings/example':undefined,value:'',...override});return replies.at(-1);}};
}
test('inspection publishes no nonce, page-global snapshot or endpoint telemetry',async()=>{
  const f=fixture(),r=await f.inspect();
  assert.equal(r.success,true);assert.equal(r.snapshotId,'snapshot-id');
  assert.equal(f.node.clicked,0);assert.equal('requests' in r,false);
  assert.equal('__ueMcpFabSnapshot' in f.window,false);
  const {nonce,...body}=r;assert.ok(!JSON.stringify(body).includes('private-reply-nonce'));
});
test('navigation uses native-supplied fingerprint',async()=>{const f=fixture();await f.inspect();assert.equal((await f.act()).success,true);assert.equal(f.node.clicked,1);});
for(const label of ['Buy now','Install to engine','Add to My Library','Checkout','Sign out','+','']) {
  test(`unsafe download label rejected: ${JSON.stringify(label)}`,async()=>{const f=fixture(label);await f.inspect();assert.equal((await f.act('download')).success,false);assert.equal(f.node.clicked,0);});
}
test('unlabeled dropdown cannot bypass activation policy',async()=>{const f=fixture('', 'BUTTON',{role:'combobox','aria-haspopup':'listbox'});await f.inspect();assert.equal((await f.act()).success,false);});
test('normal activation does not submit downloads',async()=>{const f=fixture('Add to Project');await f.inspect();assert.equal((await f.act()).success,false);});
test('download reports submission only',async()=>{const f=fixture('Add to Project');await f.inspect();const r=await f.act('download');assert.equal(r.success,true);assert.equal(r.downloadCompleted,false);});
test('changed control is rejected despite forged page-global snapshot',async()=>{const f=fixture();await f.inspect();f.node.innerText='Next';f.window.__ueMcpFabSnapshot={fingerprints:['forged']};assert.equal((await f.act()).success,false);});
test('disabled control is rejected',async()=>{const f=fixture();await f.inspect();f.node.disabled=true;assert.equal((await f.act()).success,false);});
test('changed URL is rejected',async()=>{const f=fixture();await f.inspect();f.location.pathname='/plugins/ue5/library';assert.equal((await f.act()).success,false);});
test('off-origin page is rejected',async()=>{const f=fixture();await f.inspect();f.location.hostname='example.com';assert.equal((await f.act()).success,false);});
test('native expected element is mandatory',async()=>{const f=fixture();await f.inspect();assert.equal((await f.act('activate',{expectedElement:null})).success,false);});
test('real Purchases navigation is allowed',async()=>{const f=fixture('Purchases','A',{href:'https://www.fab.com/plugins/ue5/library'});await f.inspect();assert.equal((await f.act()).success,true);});
test('an unknown button is not activated',async()=>{const f=fixture('Do something');await f.inspect();assert.equal((await f.act()).success,false);});
