from pathlib import Path
p=Path("frontend/src/pages/WaiterWorkspace.jsx");s=p.read_text(encoding="utf-8")
s=s.replace("import WaiterOrderComposer from './WaiterOrderComposer';","import WaiterOrderComposer from './WaiterOrderComposer';\nimport WaiterDemoOrdering from './WaiterDemoOrdering';")
s=s.replace(" const storage=", " const demo=editing&&!billId&&!draftPending()&&(params.get('demo')==='1'||(!menu.error&&!tables.error&&menu.data?.length===0&&tables.data?.length===0));\n function draftPending(){try{return !!JSON.parse(localStorage.getItem('b360_waiter_drafts:'+user.id+':new'))?.pending}catch{return false}}\n const storage=")
s=s.replace("if(editing)localStorage.setItem(storage,JSON.stringify(draft))","if(editing&&!demo)localStorage.setItem(storage,JSON.stringify(draft))").replace("[draft,storage,editing]);","[draft,storage,editing,demo]);")
s=s.replace(" {editing&&<WaiterOrderComposer", " {editing&&!demo&&((menu.data?.length===0)||(tables.data?.length===0))&&<p className=\"demo-order-invite\">Your live menu or tables are not configured yet. <Link to=\"/waiter/new-order?demo=1\">Try the sample food menu</Link></p>}\n {demo&&<WaiterDemoOrdering user={user}/>}\n {editing&&!demo&&<WaiterOrderComposer")
p.write_text(s,encoding="utf-8")
p=Path("frontend/src/pages/WaiterOrderComposer.jsx");s=p.read_text(encoding="utf-8")
s=s.replace("submit,LiveState})","submit,LiveState,demo=false})")
s=s.replace("<div className=\"cart-line-title\"><strong>","{i.menu?.image&&<img className=\"cart-food-photo\" src={i.menu.image} alt=\"\"/>}<div className=\"cart-line-title\"><strong>")
s=s.replace("!billId?'","!billId?'")
s=s.replace("{billId&&<Link className=\"btn\"","{billId&&!demo&&<Link className=\"btn\"")
s=s.replace("<h2>Where are you serving?</h2><span>Select an available table</span>","<h2>Select a table</h2><span>Tap a number to start</span>")
s=s.replace("<small>TAKE AN ORDER</small><h2>Find something delicious</h2>","<small>FRESH FROM THE KITCHEN</small><h2>Find the best food</h2>")
old='<div className="menu-item-category"><span className="food-symbol" aria-hidden="true"><UtensilsCrossed size={25}/></span><small>{m.category||\'Menu\'}</small>{quantity>0&&<span className="menu-selected"><Check size={14}/> In cart</span>}</div><h3>{m.name}</h3><p className="menu-price">{money(m.price)}</p>'
new='<div className="food-photo-wrap">{m.image?<img className="menu-food-photo" src={m.image} alt={m.name} loading="lazy"/>:<div className="food-photo-placeholder"><UtensilsCrossed size={36}/></div>}{quantity>0&&<span className="menu-selected"><Check size={14}/> {quantity} in cart</span>}</div><div className="food-card-title"><h3>{m.name}</h3><p className="menu-price">{money(m.price)}</p></div><p className="food-description">{m.description||m.category||\'Prepared to order\'}</p><small className="food-category-label">{m.category||\'Menu\'}</small>'
assert old in s
s=s.replace(old,new)
s=s.replace("{busy?'Sending…':billId?'Send additional items':'Submit order'}","{busy?'Sending…':demo?'Simulate order':billId?'Send additional items':'Submit order'}")
p.write_text(s,encoding="utf-8")
