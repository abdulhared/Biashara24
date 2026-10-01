import {useEffect,useState} from 'react';
import {UtensilsCrossed} from 'lucide-react';
import {menuImageUrl} from '../services/http';
export default function FoodPhoto({src,alt='',className=''}){
 const [failed,setFailed]=useState(false);useEffect(()=>setFailed(false),[src]);
 if(!src||failed)return <span className={className+' food-photo-fallback'} role={alt?'img':undefined} aria-label={alt?alt+' photo unavailable':undefined}><UtensilsCrossed/></span>;
 return <img className={className} src={menuImageUrl(src)} alt={alt} loading="lazy" onError={()=>setFailed(true)}/>;
}
