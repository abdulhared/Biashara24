import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import MenuConfiguration from '../pages/MenuConfiguration';
import {estimateTax} from '../components/TaxSummary';
vi.mock('../auth/AuthContext',()=>({useAuth:()=>({user:{id:1,role:'manager'}})}));
const reply=(data,status=200)=>({ok:status<400,status,headers:{get:()=> 'application/json'},json:async()=>data});
let items,calls,fail;
beforeEach(()=>{
 items=[];calls=[];fail=false;
 vi.stubGlobal('fetch',vi.fn(async(url,opts)=>{
  const path=new URL(url).pathname;calls.push({path,...opts});
  if(path==='/api/admin/categories')return reply([{id:1,name:'Meals'}]);
  if(path==='/api/admin/departments')return reply([{id:2,name:'Kitchen'}]);
  if(path==='/api/admin/menu-images')return reply({image_url:'/api/menu-images/'+'a'.repeat(32)},201);
  if(opts.method==='POST'||opts.method==='PUT'){
   if(fail)return reply({detail:'Save failed'},500);
   const item={...JSON.parse(opts.body),id:1,category:'Meals',department:'Kitchen'};items=[item];return reply(item,201);
  }
  return reply([...items]);
 }));
 vi.spyOn(window,'scrollTo').mockImplementation(()=>{});
});
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.restoreAllMocks()});
function open(){return render(<MemoryRouter><MenuConfiguration/></MemoryRouter>)}
async function fill(){
 await screen.findByRole('option',{name:'Kitchen'});
 for(const [label,value] of [['Food name','Pilau'],['Price including VAT (KES)','116'],['Category','1'],['Department','2'],['Brief description','Spiced rice']])fireEvent.change(screen.getByLabelText(label),{target:{value}});
}
it('saves uploaded food details, edits availability, and restores them after remount',async()=>{
 const view=open();await fill();
 expect(screen.getByText('KES 100')).toBeInTheDocument();expect(screen.getByText('KES 16')).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Food photo'),{target:{files:[new File(['photo'],'pilau.png',{type:'image/png'})]}});
 fireEvent.click(screen.getByRole('button',{name:'Add food'}));
 await screen.findByRole('button',{name:'Edit Pilau'});
 const save=calls.find(c=>c.path==='/api/admin/menu'&&c.method==='POST');
 expect(JSON.parse(save.body)).toMatchObject({name:'Pilau',price:116,tax_rate:16,description:'Spiced rice',image_url:'/api/menu-images/'+'a'.repeat(32),category_id:1,department_id:2});
 expect(calls.some(c=>c.path==='/api/admin/menu-images'&&JSON.parse(c.body).data.startsWith('data:image/png;base64,'))).toBe(true);
 fireEvent.click(screen.getByRole('button',{name:'Edit Pilau'}));
 expect(screen.getByLabelText('Brief description')).toHaveValue('Spiced rice');
 fireEvent.click(screen.getByLabelText('Available to waiters'));
 fireEvent.click(screen.getByRole('button',{name:'Save changes'}));
 await waitFor(()=>expect(items[0].active).toBe(false));
 view.unmount();open();await screen.findByRole('button',{name:'Edit Pilau'});expect(screen.getByText('No')).toBeInTheDocument();
});
it('preserves entered details on save failure and rejects oversized photos',async()=>{
 open();await fill();fail=true;
 fireEvent.click(screen.getByRole('button',{name:'Add food'}));
 await screen.findByText('Save failed');expect(screen.getByLabelText('Food name')).toHaveValue('Pilau');
 fireEvent.change(screen.getByLabelText('Food photo'),{target:{files:[new File([new Uint8Array(2*1024*1024+1)],'large.png',{type:'image/png'})]}});
 expect(screen.getByRole('button',{name:'Add food'})).toBeDisabled();
});
it('extracts inclusive VAT per line without increasing the payable price',()=>{
 expect(estimateTax([{price:116,quantity:2},{price:58,quantity:1}])).toEqual({gross_amount:290,net_amount:250,tax_amount:40});
 expect(estimateTax([{price:10.15,quantity:3}])).toEqual({gross_amount:30.45,net_amount:26.25,tax_amount:4.2});
 expect(estimateTax([{price:0.04,quantity:1}])).toEqual({gross_amount:0.04,net_amount:0.03,tax_amount:0.01});
});
