import {useCallback,useEffect,useRef,useState} from 'react';
import {http} from '../services/http';
export {money,PageHeader,Panel,StatGrid,Status} from '../components/UI';

export function useData(path,refreshMs=0){
 const [state,setState]=useState({data:null,loading:true,error:''}),[revision,setRevision]=useState(0);
 const reload=useCallback(()=>setRevision(n=>n+1),[]);
 useEffect(()=>{if(!refreshMs)return;const timer=setInterval(reload,refreshMs);return()=>clearInterval(timer)},[reload,refreshMs]);
 useEffect(()=>{let active=true;setState({data:null,loading:true,error:''});
 http.get(path).then(data=>{if(active)setState({data,loading:false,error:''})}).catch(e=>{if(active)setState({data:null,loading:false,error:e.message||'Unable to connect to the server.'})});
 return()=>{active=false}},[path,revision]);
 return {...state,reload};
}
export function Feedback({query}){return query.loading?<p role="status">Loading records…</p>:query.error?<div role="alert">{query.error} <button className="btn" onClick={query.reload}>Retry</button></div>:null}
export function useAction(reload){
 const lock=useRef(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 async function run(action){if(lock.current)return false;lock.current=true;setBusy(true);setError('');setMessage('');
 try{await action();setMessage('Saved successfully.');reload?.();return true}catch(e){setError(e.message||'Unable to save.');return false}finally{lock.current=false;setBusy(false)}}
 return {run,busy,error,message};
}
export function ActionFeedback({action}){return <>{action.error&&<p role="alert">{action.error}</p>}{action.message&&<p role="status">{action.message}</p>}</>}
export function Table({columns,rows,actions}){return <div className="table-scroll"><table><thead><tr>{columns.map(([key,label])=><th key={key}>{label}</th>)}{actions&&<th>Actions</th>}</tr></thead><tbody>{rows.map((row,i)=><tr key={row.id??i}>{columns.map(([key,,render])=><td key={key}>{render?render(row[key],row):String(row[key]??'—')}</td>)}{actions&&<td className="live-actions">{actions(row)}</td>}</tr>)}</tbody></table>{!rows.length&&<p className="empty">No records found.</p>}</div>}
export function Field({label,children}){return <label className="field">{label}{children}</label>}
export function Search({value,onChange,label='Search records'}){return <Field label={label}><input type="search" value={value} onChange={e=>onChange(e.target.value)}/></Field>}
export const matching=(rows,term)=>rows.filter(row=>JSON.stringify(row).toLowerCase().includes(term.toLowerCase()));
export const number=(name,label,value=0)=>({name,label,type:'number',min:0,value});
export const options=rows=>(Array.isArray(rows)?rows:[]).map(x=>({value:x.id,label:x.name}));
export function EntryForm({fields,onSave,action}){
 async function submit(e){e.preventDefault();const form=e.currentTarget,values=Object.fromEntries(new FormData(form));fields.forEach(f=>{if(f.type==='number')values[f.name]=Number(values[f.name])});if(await onSave(values))form.reset()}
 return <form className="live-form" onSubmit={submit}><fieldset disabled={action.busy}>{fields.map(f=><Field key={f.name} label={f.label}>{f.options?<select name={f.name} required={f.required!==false} defaultValue=""><option value="">Select…</option>{f.options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}</select>:<input name={f.name} type={f.type||'text'} min={f.min} step={f.type==='number'?'any':undefined} defaultValue={f.value??''} required={f.required!==false}/>}</Field>)}<button className="btn primary" type="submit">{action.busy?'Saving…':'Save record'}</button></fieldset><ActionFeedback action={action}/></form>
}
