// Headless tablet smoke test using installed Chrome and its DevTools protocol.
// Run with the frontend dev server on http://127.0.0.1:5178.
import {spawn} from 'node:child_process';
import {roles} from '../src/config/navigation.js';
import {mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const profile=mkdtempSync(join(tmpdir(),'b360-tablet-'));
const chrome=spawn(process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',
 ['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=9337','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let ws;
try{
 let target;
 for(let i=0;i<100;i++){try{target=(await(await fetch('http://127.0.0.1:9337/json')).json()).find(x=>x.type==='page');if(target)break}catch{}await sleep(100)}
 if(!target)throw new Error('Chrome DevTools did not start');
 ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
 let serial=0;const pending=new Map();
 ws.onclose=e=>{for(const entry of pending.values())entry.reject(new Error('DevTools closed: '+e.code+' '+e.reason))};
 ws.onmessage=e=>{const message=JSON.parse(e.data);if(message.id){const entry=pending.get(message.id);pending.delete(message.id);message.error?entry.reject(message.error):entry.resolve(message.result)}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value};
 await send('Page.enable');
 const setup=`if(location.origin==='http://127.0.0.1:5178'){
 const role=location.pathname.split('/')[1]||'waiter';
 const token='header.'+btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600}))+'.signature';
 if(['kitchen','manager','director','waiter','cashier','store_manager','carwash_manager'].includes(role))localStorage.setItem('b360_token',token);else localStorage.removeItem('b360_token');
 const bill={id:1,order_number:'B-2026-001',table_id:1,table_number:1,version:1,total:450,created_at:new Date(Date.now()-3600000).toISOString(),status:'pending',waiter:'Amina Hassan',items:[{id:1,name:'Chicken pilau',quantity:2,unit_price:200,subtotal:400},{id:2,name:'Tea',quantity:1,unit_price:50,subtotal:50}],batches:[],change_requests:[]};
 const original=window.fetch;window.fetch=async(url,options={})=>{
 const path=new URL(url,location.origin).pathname;let data;
 if(path==='/auth/me')data={id:7,role,username:'waiter@example.com',full_name:'Amina Hassan',active:true};
 else if(path==='/api/admin/menu')data=[{id:1,name:'Chicken pilau',price:116,category_id:1,department_id:1,category:'Meals',department:'Kitchen',description:'Spiced rice with chicken.',image_url:'/images/food/chicken-pilau.png',tax_rate:16,active:true}];
 else if(path==='/api/admin/categories')data=[{id:1,name:'Meals'}];
 else if(path==='/api/admin/departments')data=[{id:1,name:'Kitchen'}];
 else if(path==='/api/admin/users')data=[{id:7,full_name:'Amina Hassan',role:'waiter',active:true}];
 else if(path==='/api/menu')data=[{id:1,name:'Chicken pilau',price:200,category:'Meals'},{id:2,name:'Tea',price:50,category:'Drinks'},{id:3,name:'Mandazi',price:30,category:'Snacks'},{id:4,name:'Beef stew',price:250,category:'Meals'},{id:5,name:'Fresh juice',price:120,category:'Drinks'},{id:6,name:'Chapati',price:40,category:'Snacks'}].map(m=>({...m,image:'/images/food/chicken-pilau.png',tax_rate:16}));
 else if(path==='/api/tables')data=[{id:1,number:1,is_active:true,occupied:true,owner:'Amina Hassan',mine:true,order_id:1},{id:2,number:2,is_active:true,occupied:false},{id:3,number:3,is_active:true,occupied:true,owner:'Other waiter',mine:false},{id:4,number:4,is_active:true,occupied:false}];
 else if(path==='/api/orders')data=role==='manager'?['pending','printed','ready','payment_pending'].map((status,i)=>({...bill,id:i+1,order_number:'B-2026-00'+(i+1),table_number:i+1,waiter_id:7,status})):[bill];
 else if(path==='/api/orders/1')data=bill;
 else if(path==='/api/order-change-requests')data=[{id:1,kind:'remove',items:[{order_item_id:1,quantity:1}],reason:'Customer requested one portion',resulting_total:250,order:bill}];
 else if(path==='/api/dashboard')data={revenue:{restaurant:{total:0},carwash:{total:0},combined:0},stock_alerts:{count:0,items:[]},top_items:[]};
 else if(path==='/api/dashboard/trends')data={points:[]};
 else if(path.startsWith('/api/reports/'))data={start:'2026-09-28',end:'2026-09-28',totals:{restaurant:0,carwash:0,combined:0},days:[],top_items:[],stock:{low_items:[]}};
 else if(path==='/api/carwash/history')data={transactions:[],total:0};
 else if(path==='/api/carwash/today')data={transactions:[],summary:{total_washes:0,cash_total:0,mpesa_total:0,total_revenue:0}};
 else if(path==='/api/payments/daily-summary')data={cash_total:0,mpesa_total:0,total_revenue:0,orders_cleared:0};
 else if(path==='/health')data={status:'ok'};
 else if(path==='/api/settings')data={version:1,business_name:'Biashara360',address:'Nairobi',phone:'',require_cashier_shift:false};
 else if(path==='/api/kitchen/lines')data=[{id:1,order_item_id:1,order_number:'B-2026-001',name:'Chicken pilau',quantity:2,department:'Kitchen',status:'pending',version:1,recipe_configured:true}];
 else if(path==='/api/notifications')data=[{id:1,message:'Tea is ready for B-2026-001',created_at:new Date().toISOString(),read_at:null}];
 else if(path==='/api/cashier/shifts')data=[{id:1,cashier_id:7,status:'open',opening_float:1000,expected_cash:1450,counted_cash:null,variance:null}];
 else if(path.startsWith('/api/'))data=[];
 else return original(url,options);
 return new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'},status:200});
 };
 }`;
 await send('Page.addScriptToEvaluateOnNewDocument',{source:setup});
 mkdirSync('artifacts',{recursive:true});
 const results=[];
 for(const [width,height,label] of [[1180,820,'landscape'],[820,1180,'portrait']]){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'http://127.0.0.1:5178/waiter/new-order'});
 for(let i=0;i<100;i++){if(await evaluate("!!document.querySelector('.menu-tile')"))break;await sleep(100)}
 if(!await evaluate("!!document.querySelector('.sidebar')"))throw new Error('Waiter startup: '+await evaluate("document.body.innerText.slice(0,2500)"));
 const checks=await evaluate(`(()=>{
 const sidebar=document.querySelector('.sidebar'),nav=sidebar.querySelector('nav'),compose=document.querySelector('.waiter-compose');
 const grid=getComputedStyle(compose).gridTemplateColumns.split(' ').length;
 const buttons=[...document.querySelectorAll('.quantity-controls button,.table-target,.menu-add')];
 return {width:innerWidth,horizontalOverflow:document.documentElement.scrollWidth>innerWidth,sidebarOverflow:sidebar.scrollHeight>sidebar.clientHeight,navOverflow:nav.scrollHeight>nav.clientHeight,sidebarOverflowStyle:getComputedStyle(nav).overflowY,columns:grid,minTouchHeight:Math.min(...buttons.map(b=>b.getBoundingClientRect().height)),links:[...nav.querySelectorAll('a')].map(a=>a.textContent)};
 })()`);
 if(checks.horizontalOverflow||checks.sidebarOverflow||checks.navOverflow||checks.minTouchHeight<44||checks.columns!==(label==='landscape'?2:1))throw new Error(label+': '+JSON.stringify(checks));
 // Real keyboard focus and button activation.
 await evaluate("document.querySelector('[aria-label=\"Add one Tea\"]').focus()");
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});
 await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
 await sleep(100);
 const keyboard=await evaluate("({quantity:document.querySelector('[aria-label=\"Tea quantity\"]').textContent,focused:document.activeElement.outerHTML})");
 if(keyboard.quantity!=='1')throw new Error('Keyboard quantity control failed: '+JSON.stringify(keyboard));
 await evaluate("[...document.querySelectorAll('.table-target')].find(b=>b.textContent.includes('Table 2')).click()");
 await sleep(100);
 await evaluate('window.scrollTo(0,0)');
 const shot=await send('Page.captureScreenshot',{format:'png'});
 writeFileSync('artifacts/waiter-'+label+'.png',Buffer.from(shot.data,'base64'));
 if(label==='portrait'){
  await evaluate('window.scrollTo(0,document.body.scrollHeight)');
  const visible=await evaluate("(()=>{const b=document.querySelector('.portrait-cart-button'),r=b.getBoundingClientRect();return getComputedStyle(b).display!=='none'&&r.bottom<=innerHeight&&r.top>0})()");
  if(!visible)throw new Error('Portrait cart button is not visible after scrolling');
  await evaluate("document.querySelector('.portrait-cart-button').click()");await sleep(100);
  if(!await evaluate("document.querySelector('dialog').open"))throw new Error('Cart panel did not open');
  await evaluate("document.querySelector('dialog .review-order').click()");
 }else{await evaluate("document.querySelector('.order-cart .review-order').click()")}
 await sleep(100);
 if(!await evaluate("document.querySelector('dialog').open&&document.querySelector('dialog').textContent.includes('Table 2')&&document.querySelector('#order-dialog-title').textContent==='Review order'"))throw new Error('Review did not show the selected table');
 const review=await send('Page.captureScreenshot',{format:'png'});
 writeFileSync('artifacts/waiter-review-'+label+'.png',Buffer.from(review.data,'base64'));
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await sleep(100);
 if(await evaluate("document.querySelector('dialog').open"))throw new Error('Escape did not close review');
 results.push({label,...checks});
 await evaluate("Object.keys(localStorage).filter(k=>k.startsWith('b360_waiter_drafts:')).forEach(k=>localStorage.removeItem(k))");
 }
 // Exercise actual food assets, including the cart thumbnail, at phone and tablet sizes.
 for(const [width,height] of [[1180,820],[820,1180],[390,844]]){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'http://127.0.0.1:5178/waiter/new-order'});
 for(let i=0;i<100;i++){if(await evaluate("!!document.querySelector('.menu-food-photo')"))break;await sleep(100)}
 await evaluate("Promise.all([...document.querySelectorAll('.menu-food-photo')].map(i=>i.decode()))");
 await evaluate("document.querySelector('.menu-add').click()");await sleep(100);
 if(width<=1000){await evaluate("document.querySelector('.portrait-cart-button').click()");await sleep(100)}
 const photos=await evaluate(`(()=>{
 const images=[...document.querySelectorAll('.menu-food-photo')];
 const cart=[...document.querySelectorAll('.cart-food-photo')].find(i=>i.getBoundingClientRect().width>0);
 return {width:innerWidth,horizontalOverflow:document.documentElement.scrollWidth>innerWidth,images:images.length,photosFit:images.every(i=>{const r=i.getBoundingClientRect(),p=i.closest('.menu-tile').getBoundingClientRect();return i.naturalWidth>0&&r.height<=132&&r.width<=p.width}),cartFits:!!cart&&cart.getBoundingClientRect().width===52&&cart.getBoundingClientRect().height===52};
 })()`);
 if(photos.horizontalOverflow||photos.images!==6||!photos.photosFit||!photos.cartFits)throw new Error('Food image layout: '+JSON.stringify(photos));
 if(width<=1000){await evaluate("document.querySelector('[aria-label=\"Close order\"]').click()");await sleep(100)}
 const photoShot=await send('Page.captureScreenshot',{format:'png'});
 writeFileSync('artifacts/waiter-food-'+width+'.png',Buffer.from(photoShot.data,'base64'));
 results.push(photos);
 await evaluate("Object.keys(localStorage).filter(k=>k.startsWith('b360_waiter_drafts:')).forEach(k=>localStorage.removeItem(k))");
 }
 for(const [width,height] of [[1180,820],[390,844]]){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'http://127.0.0.1:5178/manager/menu'});
 for(let i=0;i<100;i++){if(await evaluate("[...document.querySelectorAll('button')].some(b=>b.textContent==='Edit Chicken pilau')"))break;await sleep(100)}
 await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent==='Edit Chicken pilau').click()");await sleep(150);
 const menuChecks=await evaluate("({width:innerWidth,managerMenu:true,horizontalOverflow:document.documentElement.scrollWidth>innerWidth,taxPreview:document.querySelector('.tax-summary')?.textContent,description:document.querySelector('textarea')?.value})");
 if(menuChecks.horizontalOverflow||!menuChecks.taxPreview?.includes('KES 16')||!menuChecks.taxPreview?.includes('KES 100')||menuChecks.description!=='Spiced rice with chicken.')throw new Error('Manager menu: '+JSON.stringify(menuChecks));
 const menuShot=await send('Page.captureScreenshot',{format:'png'});writeFileSync('artifacts/manager-menu-'+width+'.png',Buffer.from(menuShot.data,'base64'));
 results.push(menuChecks);
 }
 for(const [width,height] of [[1536,1024],[1366,768],[390,844]]){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'http://127.0.0.1:5178/manager/manager-dashboard'});
 for(let i=0;i<100;i++){if(await evaluate("document.querySelectorAll('.operations-ticket').length===4"))break;await sleep(100)}
 const dashboard=await evaluate("({width:innerWidth,managerDashboard:true,horizontalOverflow:document.documentElement.scrollWidth>innerWidth,tickets:document.querySelectorAll('.operations-ticket').length,stages:document.querySelectorAll('.operations-stage').length,metrics:document.querySelectorAll('.operations-metrics article').length,sidebarWidth:document.querySelector('.sidebar').getBoundingClientRect().width,sidebarBackground:getComputedStyle(document.querySelector('.sidebar')).backgroundImage,headingSize:getComputedStyle(document.querySelector('.operations-heading h1')).fontSize,metricHeight:document.querySelector('.operations-metrics article').getBoundingClientRect().height,dashboardHeight:document.querySelector('.operations-dashboard').getBoundingClientRect().height,createForm:!!document.querySelector('form'),links:[...document.querySelectorAll('.sidebar nav a')].map(a=>a.textContent)})");
 if(dashboard.horizontalOverflow||dashboard.tickets!==4||dashboard.stages!==4||dashboard.metrics!==4||dashboard.createForm)throw new Error('Manager dashboard: '+JSON.stringify(dashboard));
 const dashboardShot=await send('Page.captureScreenshot',{format:'png'});writeFileSync('artifacts/manager-dashboard-'+width+'.png',Buffer.from(dashboardShot.data,'base64'));
 results.push(dashboard);
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1180,height:820,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'http://127.0.0.1:5178/manager/bill-changes'});
 for(let i=0;i<100;i++){if(await evaluate("document.body.textContent.includes('Customer requested one portion')"))break;await sleep(100)}
 if(!await evaluate("document.body.textContent.includes('Resulting total: KES 250')"))throw new Error('Manager review did not render');
 const shot=await send('Page.captureScreenshot',{format:'png'});writeFileSync('artifacts/bill-review.png',Buffer.from(shot.data,'base64'));
 const densityRoutes=['/','/login','/login/manager','/director/overview','/director/reports','/director/management','/director/departments','/manager/menu','/manager/tables','/manager/bill-changes','/manager/printers','/manager/order-pipeline','/cashier/checkout','/cashier/payment-ledger','/store_manager/store-overview','/store_manager/stock-history','/carwash_manager/wash-overview','/carwash_manager/service-types','/waiter/bills','/waiter/history'];
 for(const [role,value] of Object.entries(roles)){for(const id of [...value.nav.map(n=>n[0]),...(value.extraPages||[])]){const route='/'+role+'/'+id;if(!densityRoutes.includes(route))densityRoutes.push(route)}}
 for(const width of [1366,390]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:width===390?844:768,deviceScaleFactor:1,mobile:false});
 for(const route of densityRoutes){
 await send('Page.navigate',{url:'http://127.0.0.1:5178'+route});
 for(let i=0;i<70;i++){if(await evaluate("document.readyState==='complete'&&!!document.querySelector('h1,h2')&&!document.body.textContent.includes('Checking your session')"))break;await sleep(100)}
 await sleep(120);
 const density=await evaluate("({path:location.pathname,width:innerWidth,horizontalOverflow:document.documentElement.scrollWidth>innerWidth,heading:document.querySelector('h1,h2')?.textContent,placeholder:document.body.textContent.includes('This module has not been implemented'),sidebarOverflow:!!document.querySelector('.sidebar')&&document.querySelector('.sidebar').scrollHeight>document.querySelector('.sidebar').clientHeight})");
 if(density.path!==route||!density.heading||density.placeholder||density.horizontalOverflow||(width>760&&density.sidebarOverflow))throw new Error('Route density: '+JSON.stringify(density));
 results.push(density);
 if(['/director/overview','/cashier/checkout','/store_manager/store-overview','/login/manager'].includes(route)){
 const capture=await send('Page.captureScreenshot',{format:'png'});writeFileSync('artifacts/compact-'+route.replaceAll('/','-')+'-'+width+'.png',Buffer.from(capture.data,'base64'));
 }
 }
 }
 writeFileSync('artifacts/tablet-checks.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
 await send('Browser.close');
}finally{ws?.close();chrome.kill()}
