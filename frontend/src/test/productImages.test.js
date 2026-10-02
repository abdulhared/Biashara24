import {expect,it} from 'vitest';
import {productImage} from '../services/productImages';

it('matches supplied photos by product name without inventing unrelated images',()=>{
 expect(productImage({name:'Masala chips'})).toContain('030844.png');
 expect(productImage({name:'Tea'})).toContain('031852.png');
 expect(productImage({name:'Cupcakes'})).toContain('031124.png');
 expect(productImage({name:'Loaded fries'})).toContain('031039.png');
 expect(productImage({name:'Beef steak'})).toBeUndefined();
 expect(productImage({name:'Chicken pilau'})).toBeUndefined();
});

it('preserves assigned menu photos and handles missing items',()=>{
 expect(productImage({name:'Tea',image:'/api/menu-images/custom'})).toBe('/api/menu-images/custom');
 expect(productImage({name:'Tea',image_url:'https://example.com/tea.jpg'})).toBe('https://example.com/tea.jpg');
 expect(productImage(null)).toBeUndefined();
});
