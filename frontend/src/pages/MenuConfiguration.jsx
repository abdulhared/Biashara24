import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {http,menuImageUrl} from '../services/http';
import {useAuth} from '../auth/AuthContext';
import {useData,useAction,Feedback,ActionFeedback,Field,Table,Panel,PageHeader,money,Search} from './LiveUI';
import TaxSummary,{estimateTax} from '../components/TaxSummary';

const blank=()=>({name:'',price:'',category_id:'',department_id:'',description:'',image_url:'',active:true});
export default function MenuConfiguration(){
 const {user}=useAuth(),menu=useData('/api/admin/menu'),categories=useData('/api/admin/categories'),departments=useData('/api/admin/departments');
 const action=useAction(menu.reload),[draft,setDraft]=useState(blank),[editing,setEditing]=useState(null),[photo,setPhoto]=useState(null),[photoError,setPhotoError]=useState(''),[fileVersion,setFileVersion]=useState(0);
 const [photoPreview,setPhotoPreview]=useState('');
 useEffect(()=>{setPhotoPreview('');if(!photo)return;let active=true;const reader=new FileReader();reader.onload=()=>{if(active)setPhotoPreview(reader.result)};reader.readAsDataURL(photo);return()=>{active=false}},[photo]);
 const [search,setSearch]=useState(''),[category,setCategory]=useState('');
 const visible=(menu.data||[]).filter(m=>m.name.toLowerCase().includes(search.toLowerCase())&&(!category||String(m.category_id)===category));
 const update=(key,value)=>setDraft(d=>({...d,[key]:value}));
 function reset(){setDraft(blank());setEditing(null);setPhoto(null);setPhotoError('');setFileVersion(v=>v+1)}
 async function save(e){
  e.preventDefault();
  const ok=await action.run(async()=>{
   let image_url=draft.image_url;
   if(photo){
    const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Unable to read photo'));reader.readAsDataURL(photo)});
    image_url=(await http.post('/api/admin/menu-images',{data})).image_url;
    setDraft(d=>({...d,image_url}));setPhoto(null);setFileVersion(v=>v+1);
   }
   const payload={...draft,price:Number(draft.price),category_id:Number(draft.category_id),department_id:Number(draft.department_id),image_url:image_url||null,description:draft.description||null,tax_rate:16};
   if(editing)await http.put('/api/admin/menu/'+editing,payload);else await http.post('/api/admin/menu',payload);
  });
  if(ok)reset();
 }
 return <><PageHeader title="Food menu" subtitle="Manage the menu shown to waiters" action="Refresh" onAction={menu.reload}/>
 <div className="live-actions"><Link className="btn" to={'/'+user.role+'/categories'}>Manage categories</Link><Link className="btn" to={'/'+user.role+'/departments'}>Manage departments</Link><Link className="btn" to={'/'+user.role+'/tables'}>Manage tables</Link></div>
 <Feedback query={menu}/><Feedback query={categories}/><Feedback query={departments}/>
 <Panel title={editing?'Edit food item':'Add food item'}><form className="live-form food-menu-form" onSubmit={save}><fieldset disabled={action.busy}>
 <Field label="Food name"><input required maxLength={120} value={draft.name} onChange={e=>update('name',e.target.value)}/></Field>
 <Field label="Price including VAT (KES)"><input required type="number" min="0.01" step="0.01" value={draft.price} onChange={e=>update('price',e.target.value)}/></Field>
 <p>Includes 16% VAT. The entered price is the full amount the customer pays.</p>
 {Number(draft.price)>0&&<TaxSummary summary={estimateTax([{price:Number(draft.price),quantity:1}])}/>}
 <Field label="Category"><select required value={draft.category_id} onChange={e=>update('category_id',e.target.value)}><option value="">Select category</option>{categories.data?.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
 <Field label="Department"><select required value={draft.department_id} onChange={e=>update('department_id',e.target.value)}><option value="">Select department</option>{departments.data?.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
 <Field label="Brief description"><textarea maxLength={500} value={draft.description} onChange={e=>update('description',e.target.value)}/></Field>
 <Field label="Food photo"><input key={fileVersion} type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const f=e.target.files?.[0];setPhotoError('');if(f&&(f.size>2*1024*1024||!['image/jpeg','image/png','image/webp'].includes(f.type))){setPhoto(null);setPhotoError('Choose a JPEG, PNG or WebP photo up to 2 MB.');e.target.value=''}else setPhoto(f||null)}}/></Field>
 <small>JPEG, PNG or WebP, up to 2 MB. Alternatively, paste an image URL below.</small>
 {photoPreview&&<img className="selected-food-photo" src={photoPreview} alt="Selected food preview"/>}
 {photoError&&<p role="alert">{photoError}</p>}
 <Field label="Image URL"><input type={draft.image_url.startsWith('/api/menu-images/')?'text':'url'} maxLength={500} disabled={!!photo} value={draft.image_url} onChange={e=>update('image_url',e.target.value)}/></Field>
 {draft.image_url&&!photo&&<img className="menu-admin-photo" src={menuImageUrl(draft.image_url)} alt="Current food"/>}
 <Field label="Available to waiters"><input type="checkbox" checked={draft.active} onChange={e=>update('active',e.target.checked)}/></Field>
 <div className="live-actions"><button className="btn primary" disabled={!!photoError||!categories.data?.length||!departments.data?.length}>{action.busy?'Saving…':editing?'Save changes':'Add food'}</button><button className="btn" type="button" onClick={reset}>Cancel / clear</button></div>
 </fieldset><ActionFeedback action={action}/></form></Panel>
 <Panel title="Menu items"><div className="live-actions"><Search label="Search foods" value={search} onChange={setSearch}/><Field label="Filter category"><select value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{categories.data?.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field></div><Table rows={visible} columns={[
 ['image_url','Photo',v=>v?<img className="menu-admin-photo" src={menuImageUrl(v)} alt=""/>:'No photo'],['name','Food'],['description','Description'],['price','Price incl. VAT',money],['tax_rate','VAT',v=>v+'% included'],['category','Category'],['department','Department'],['active','Available',v=>v?'Yes':'No']
 ]} actions={item=><button className="btn" disabled={action.busy} onClick={()=>{setEditing(item.id);setDraft({...item,description:item.description||'',image_url:item.image_url||''});setPhoto(null);setPhotoError('');setFileVersion(v=>v+1);window.scrollTo({top:0,behavior:'smooth'})}}>Edit {item.name}</button>}/></Panel></>;
}
