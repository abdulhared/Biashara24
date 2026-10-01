// Real browser -> Vite -> FastAPI -> isolated SQLite order acceptance test.
// No fetch interception and no writes to the business database.
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const frontend=resolve(fileURLToPath(new URL('..',import.meta.url))),backend=resolve(frontend,'../backend');
const directory=mkdtempSync(join(tmpdir(),'b360-live-order-')),children=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function port(){const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const number=server.address().port;await new Promise(r=>server.close(r));return number}
const apiPort=await port(),uiPort=await port(),chromePort=await port();
const api=`http://127.0.0.1:${apiPort}`,ui=`http://127.0.0.1:${uiPort}`;
let socket,logs='';
function launch(command,args,cwd,env={}){const child=spawn(command,args,{cwd,env:{...process.env,...env},windowsHide:true,stdio:['ignore','pipe','pipe']});children.push(child);child.stdout.on('data',d=>logs+=d);child.stderr.on('data',d=>logs+=d);return child}
async function ready(url){for(let n=0;n<150;n++){try{if((await fetch(url)).ok)return}catch{}await sleep(150)}throw new Error('Server did not start: '+url+'\n'+logs)}
async function call(path,token,body,method=body?'POST':'GET',key){const r=await fetch(api+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...(key?{'Idempotency-Key':key}:{})},...(body?{body:JSON.stringify(body)}:{})});const result=await r.json();if(!r.ok)throw new Error(path+': '+JSON.stringify(result));return result}
function assert(condition,message){if(!condition)throw new Error(message)}
try{
 launch(join(backend,'.venv/Scripts/python.exe'),['-m','uvicorn','app.main:app','--host','127.0.0.1','--port',String(apiPort)],backend,{
  DATABASE_URL:'sqlite:///'+join(directory,'orders.db').replaceAll('\\','/'),ENVIRONMENT:'development',ALLOWED_ORIGINS:ui
 });
 await ready(api+'/ready');
 launch(process.execPath,[join(frontend,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port',String(uiPort),'--strictPort'],frontend,{VITE_API_URL:api});
 await ready(ui);
 const manager=(await call('/auth/login',null,{username:'manager@gmail.com',password:'manager123'})).access_token;
 const waiter=(await call('/auth/login',null,{username:'waiter@gmail.com',password:'waiter123'})).access_token;
 const cashier=(await call('/auth/login',null,{username:'cashier@gmail.com',password:'cashier123'})).access_token;
 const category=await call('/api/admin/categories',manager,{name:'Acceptance meals'});
 const department=await call('/api/admin/departments',manager,{name:'Acceptance kitchen'});
 await call('/api/admin/menu',manager,{name:'Acceptance pilau',price:116,category_id:category.id,department_id:department.id});
 await call('/api/tables',manager,{number:99});
 launch(process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',[
  '--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${chromePort}`,'--user-data-dir='+join(directory,'chrome'),'about:blank'
 ],frontend);
 await ready(`http://127.0.0.1:${chromePort}/json`);
 const target=(await(await fetch(`http://127.0.0.1:${chromePort}/json`)).json()).find(t=>t.type==='page');
 socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j});
 let serial=0;const pending=new Map();socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value};
 async function until(expression){for(let n=0;n<120;n++){if(await evaluate(expression))return;await sleep(100)}throw new Error('Browser timeout: '+expression+'\n'+await evaluate('document.body.innerText'))}
 await send('Page.enable');await send('Page.navigate',{url:ui});await until('document.readyState === "complete"');
 await evaluate(`localStorage.setItem('b360_token',${JSON.stringify(waiter)})`);
 // Old bookmarks must now submit real orders too.
 await send('Page.navigate',{url:ui+'/waiter/new-order?demo=1'});
 await until("!!document.querySelector('.menu-add')");
 assert(!await evaluate("document.body.innerText.includes('Demo ordering')"),'Demo ordering is still exposed');
 await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Table 99')).click()");
 await evaluate("document.querySelector('.menu-add').click()");
 await until("!document.querySelector('.review-order').disabled");
 await evaluate("document.querySelector('.review-order').click()");
 await until("!!document.querySelector('dialog[open]')");
 await evaluate("[...document.querySelectorAll('dialog button')].find(b=>b.textContent==='Submit order').click()");
 await until("location.pathname==='/waiter/bills' && document.querySelector('h1')?.textContent.startsWith('Bill ')");
 const orderId=Number(await evaluate("new URLSearchParams(location.search).get('bill')"));
 let order=await call('/api/orders/'+orderId,waiter);
 assert(order.total===116&&order.tax_summary.tax_amount===16,'Incorrect persisted tax-inclusive bill');
 assert(order.batches.length===1&&order.items[0].name==='Acceptance pilau','Order or kitchen batch was not persisted');
 await send('Page.reload');await until("document.body.innerText.includes('Acceptance pilau')");
 const kitchen=await call('/api/kitchen/lines',manager),line=kitchen.find(l=>l.order_id===orderId);
 assert(line,'Manager kitchen queue did not receive the order');
 await call('/api/kitchen/lines/'+line.order_item_id,manager,{status:'preparing',expected_version:line.version},'PUT');
 await call('/api/kitchen/lines/'+line.order_item_id,manager,{status:'ready',expected_version:line.version+1},'PUT');
 const notifications=await call('/api/notifications',waiter);assert(notifications.some(n=>n.order_id===orderId),'Ready notification missing');
 order=await call('/api/orders/'+orderId,cashier);
 const payment=await call('/api/orders/'+orderId+'/clear',cashier,{expected_version:order.version,amount:116,method:'cash',tendered_amount:200},'POST',crypto.randomUUID());
 assert(payment.status==='completed'&&payment.change_amount===84,'Cashier settlement failed');
 const tables=await call('/api/tables',manager);assert(!tables.find(t=>t.number===99).occupied,'Paid table was not released');
 const result={passed:true,realBrowserSubmission:true,persistedAfterReload:true,orderId,orderNumber:order.order_number,total:116,includedTax:16,kitchenReceived:true,readyNotification:true,cashierSettlement:true,change:84,tableReleased:true,businessDatabaseTouched:false};
 mkdirSync(join(frontend,'artifacts'),{recursive:true});writeFileSync(join(frontend,'artifacts/live-order-check.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 await send('Browser.close');
}finally{socket?.close();for(const child of children.reverse())child.kill()}
