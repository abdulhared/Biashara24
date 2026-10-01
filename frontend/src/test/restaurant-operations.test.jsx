import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {KitchenOperations,CashOffice,LiveNotifications} from '../pages/RestaurantOperations';
import {retryablePost} from '../services/retryableWrite';

vi.mock('../auth/AuthContext',()=>({useAuth:()=>({user:{id:7,role:'manager'}})}));
const response=data=>({ok:true,status:200,headers:{get:()=> 'application/json'},json:async()=>data});
beforeEach(()=>{sessionStorage.clear();localStorage.clear()});
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.restoreAllMocks()});

it('sends the kitchen line version and leaves other lines independent',async()=>{
 const mock=vi.fn(async(url,options)=>response(options.method==='PUT'?{status:'preparing'}:[
  {id:10,order_item_id:10,order_number:'B-1',name:'Pilau',quantity:2,department:'Kitchen',status:'pending',version:4,recipe_configured:true},
  {id:11,order_item_id:11,order_number:'B-1',name:'Tea',quantity:1,department:'Barista',status:'ready',version:2,recipe_configured:false}
 ]));vi.stubGlobal('fetch',mock);
 render(<KitchenOperations/>);
 fireEvent.click(await screen.findByRole('button',{name:'Mark preparing'}));
 await waitFor(()=>expect(mock).toHaveBeenCalledWith(expect.stringContaining('/api/kitchen/lines/10'),expect.objectContaining({method:'PUT',body:JSON.stringify({expected_version:4,status:'preparing'})})));
 expect(screen.getByText('Tea')).toBeInTheDocument();
});

it('opens a shift with a durable submission key',async()=>{
 const mock=vi.fn(async(url,options)=>response(options.method==='POST'?{id:1,status:'open'}:[]));vi.stubGlobal('fetch',mock);
 render(<CashOffice/>);
 await screen.findByText('No records found.');
 fireEvent.change(screen.getByLabelText('Opening cash float (KES)'),{target:{value:'1000'}});
 fireEvent.click(screen.getByRole('button',{name:'Save record'}));
 await waitFor(()=>expect(mock).toHaveBeenCalledWith(expect.stringContaining('/api/cashier/shifts'),expect.objectContaining({method:'POST',body:JSON.stringify({opening_float:1000}),headers:expect.objectContaining({'Idempotency-Key':expect.any(String)})})));
});

it('acknowledges a persisted notification',async()=>{
 const mock=vi.fn(async(url,options)=>response(options.method==='PUT'?{}:[{id:3,message:'Tea is ready',read_at:null}]));vi.stubGlobal('fetch',mock);
 render(<LiveNotifications/>);
 fireEvent.click(await screen.findByRole('button',{name:'Mark read'}));
 await waitFor(()=>expect(mock).toHaveBeenCalledWith(expect.stringContaining('/api/notifications/3/read'),expect.objectContaining({method:'PUT'})));
});

it('reuses the original key after an uncertain network failure',async()=>{
 const mock=vi.fn().mockRejectedValueOnce(new TypeError('Disconnected')).mockResolvedValue(response({id:8}));vi.stubGlobal('fetch',mock);
 await expect(retryablePost('/api/stock/add',{ingredient_id:1,quantity:5})).rejects.toThrow('Disconnected');
 await expect(retryablePost('/api/stock/add',{ingredient_id:1,quantity:5})).resolves.toEqual({id:8});
 expect(mock.mock.calls[0][1].headers['Idempotency-Key']).toBe(mock.mock.calls[1][1].headers['Idempotency-Key']);
 expect(sessionStorage.length).toBe(0);
});
