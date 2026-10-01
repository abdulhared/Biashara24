import {useState} from 'react';
import {Search, Plus, Download, Filter, MoreHorizontal, Inbox} from 'lucide-react';
import {validate} from '../validation/validate';

export const money = value => `KES ${new Intl.NumberFormat('en-KE',{maximumFractionDigits:2}).format(Number(value||0))}`;

export function PageHeader({title,subtitle,action='Add record',onAction}){
  return <div className="page-head"><div><h1>{title}</h1><p>{subtitle}</p></div>{action&&<button className="btn primary" onClick={onAction}><Plus/> {action}</button>}</div>;
}
export function Toolbar({placeholder='Search records...',action}){
  return <div className="toolbar"><label className="search-box"><Search/><input placeholder={placeholder}/></label><button className="btn"><Filter/> Filter</button><button className="btn"><Download/> Export</button>{action}</div>;
}
export function StatGrid({items}){
  return <div className="stats-grid">{items.map(({label,value,meta,icon:Icon,tone='blue'})=><article className="stat" key={label}><div className={`stat-icon ${tone}`}>{Icon&&<Icon/>}</div><div><span>{label}</span><strong>{value}</strong><small>{meta}</small></div></article>)}</div>;
}
export function Panel({title,subtitle,action,children,className=''}){
  return <section className={`panel ${className}`}><div className="panel-head"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>{action}</div>{children}</section>;
}
export function Status({children}){const key=String(children).toLowerCase().replaceAll(' ','-');return <span className={`status status-${key}`}>{children}</span>}
export function DataTable({columns,rows}){
  return <div className="table-scroll"><table><thead><tr>{columns.map(c=><th key={c.key}>{c.label}</th>)}<th/></tr></thead><tbody>{rows.map((row,i)=><tr key={row.id||row.name||i}>{columns.map(c=><td key={c.key}>{c.render?c.render(row[c.key],row):row[c.key]}</td>)}<td><button className="icon-button" aria-label="More options"><MoreHorizontal/></button></td></tr>)}</tbody></table>{!rows.length&&<div className="empty"><Inbox/><span>No records found</span></div>}</div>
}
export function Modal({open,title,onClose,children}){if(!open)return null;return <div className="modal-layer"><button className="modal-backdrop" onClick={onClose} aria-label="Close modal"/><div className="modal-card"><div className="panel-head"><h2>{title}</h2><button className="icon-button" onClick={onClose}>×</button></div>{children}</div></div>}
export function FormGrid({fields,onClose,onSubmit}){
  const initial=Object.fromEntries(fields.map(f=>[f.name,f.value??'']));
  const [values,setValues]=useState(initial);
  const [errors,setErrors]=useState({});
  const submit=e=>{e.preventDefault();const next=validate(values,fields);setErrors(next);if(!Object.keys(next).length){onSubmit?.(values);onClose?.()}};
  const update=(name,value)=>setValues(current=>({...current,[name]:value}));
  return <form className="form-grid" onSubmit={submit} noValidate>{fields.map(f=><label key={f.name}>{f.label}{f.type==='select'?<select value={values[f.name]} onChange={e=>update(f.name,e.target.value)}><option value="">Select option</option>{(f.options||[]).map(o=><option key={o}>{o}</option>)}</select>:f.type==='textarea'?<textarea value={values[f.name]} onChange={e=>update(f.name,e.target.value)} placeholder={f.placeholder}/>:<input type={f.type||'text'} value={values[f.name]} onChange={e=>update(f.name,e.target.value)} placeholder={f.placeholder}/>} {errors[f.name]&&<span className="field-error">{errors[f.name]}</span>}</label>)}<div className="form-actions"><button type="button" className="btn" onClick={onClose}>Cancel</button><button className="btn primary">Save record</button></div></form>
}
