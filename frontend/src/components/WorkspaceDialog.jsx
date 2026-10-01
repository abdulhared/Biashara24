import {useEffect,useId,useRef} from 'react';
import {X} from 'lucide-react';

export default function WorkspaceDialog({title,onClose,children}){
 const ref=useRef(null),id=useId();
 useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close()},[]);
 return <dialog ref={ref} className="workspace-dialog" aria-labelledby={id} onCancel={onClose} onClose={onClose}><div className="dialog-title"><h2 id={id}>{title}</h2><button className="btn" type="button" onClick={onClose} aria-label="Close dialog"><X/></button></div>{children}</dialog>;
}

export function exportRows(name,columns,rows){
 const cell=value=>'"'+String(value??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';
 const csv=[columns.map(([,label])=>cell(label)).join(','),...rows.map(row=>columns.map(([key])=>cell(row[key])).join(','))].join('\r\n');
 const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
