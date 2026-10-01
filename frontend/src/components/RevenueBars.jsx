import {money} from './UI';
export default function RevenueBars({points=[]}){
 const max=Math.max(1,...points.map(p=>Number(p.total)||0));
 return points.length?<div className="revenue-bars" role="img" aria-label="Revenue by day. Exact values are listed in the table below.">{points.slice(-14).map(p=><div key={p.date} title={p.date+': '+money(p.total)}><span>{money(p.total)}</span><div className="revenue-bar-track"><i style={{height:Math.max(2,(Number(p.total)||0)/max*100)+'%'}}/></div><small>{String(p.date).slice(5)}</small></div>)}</div>:<p className="preview-empty">No revenue recorded for this period.</p>;
}
