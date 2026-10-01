import {money} from './UI';

export function estimateTax(items){
 const grossCents=items.reduce((sum,i)=>sum+Math.round(i.price*100)*i.quantity,0);
 const taxCents=items.reduce((sum,i)=>sum+Math.round(Math.round(i.price*100)*i.quantity*16/116),0);
 return {tax_amount:taxCents/100,net_amount:(grossCents-taxCents)/100,gross_amount:grossCents/100};
}

export default function TaxSummary({summary}){
 if(!summary)return null;
 return <div className="tax-summary"><span>Before VAT <strong>{money(summary.net_amount)}</strong></span><span>VAT (16%, included) <strong>{money(summary.tax_amount)}</strong></span></div>;
}
