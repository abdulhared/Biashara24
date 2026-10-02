import {Printer} from 'lucide-react';
import {createPortal} from 'react-dom';
import {money} from './LiveUI';
import TaxSummary from '../components/TaxSummary';
import './cashier-payments.css';

export function paymentDate(value){if(!value)return 'Date unavailable';const d=new Date(/(?:Z|[+-]\d{2}:\d{2})$/.test(value)?value:value+'Z');return Number.isNaN(d.getTime())?'Date unavailable':d.toLocaleString('en-KE',{timeZone:'Africa/Nairobi',dateStyle:'medium',timeStyle:'short'})+' EAT'}
export default function Receipt({receipt}){
 const snapshot=receipt.snapshot,items=snapshot?.items||receipt.items,business=snapshot?.business||{},paid=receipt.status==='completed';
 const paper=<article className="receipt-paper" aria-label="Saved receipt">
  <header><span className="receipt-mark">{paid?'PAYMENT RECEIPT':'PAYMENT RECORD'}</span><h2>{business.business_name||'Biashara360'}</h2>{business.address&&<p>{business.address}</p>}{business.phone&&<p>{business.phone}</p>}<strong className={'payment-status '+receipt.status}>{paid?'PAID':'PENDING MANUAL CONFIRMATION'}</strong></header>
  <dl className="payment-facts"><div><dt>{paid?'Receipt':'Entry'}</dt><dd>{receipt.receipt||'#'+receipt.id}</dd></div><div><dt>Bill</dt><dd>{snapshot?.order_number||receipt.order_number}</dd></div>{(snapshot?.table_number||receipt.table_number)&&<div><dt>Table</dt><dd>{snapshot?.table_number||receipt.table_number}</dd></div>}<div><dt>Date</dt><dd>{paymentDate(receipt.completed_at||receipt.created_at)}</dd></div></dl>
  {items?<ul className="receipt-lines">{items.filter(i=>i.quantity>0).map((i,n)=><li key={i.id??n}><span>{i.quantity} × {i.name}</span><strong>{money(i.subtotal)}</strong></li>)}</ul>:<p className="receipt-note">Saved item details are unavailable for this older payment.</p>}
  <TaxSummary summary={snapshot?.tax_summary||receipt.tax_summary}/><div className="receipt-total"><span>Total {paid?'paid':'recorded'}</span><strong>{money(receipt.amount)}</strong></div>
  <dl className="payment-facts"><div><dt>Method</dt><dd>{receipt.method==='cash'?'Cash':'M-Pesa'}</dd></div>{receipt.reference&&<div><dt>Reference</dt><dd>{receipt.reference}</dd></div>}{receipt.tendered_amount!=null&&<div><dt>Cash received</dt><dd>{money(receipt.tendered_amount)}</dd></div>}{receipt.change_amount!=null&&<div><dt>Change returned</dt><dd>{money(receipt.change_amount)}</dd></div>}</dl>
  <footer>{paid?'Thank you for your visit.':'Awaiting external confirmation. This is not proof of payment.'}</footer>
 </article>;
 return <section className="receipt-document">{paper}<button className="btn receipt-print" onClick={()=>window.print()}><Printer size={16}/>{paid?'Print receipt':'Print pending record'}</button>{createPortal(<div className="receipt-print-root" aria-hidden="true">{paper}</div>,document.body)}</section>;
}
