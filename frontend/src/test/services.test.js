import {describe,expect,it} from 'vitest';
import {endpointFor} from '../services/resourceService';

describe('API resource mapping',()=>{
  it('maps operational resources to backend endpoints',()=>{
    expect(endpointFor('orders')).toBe('/api/orders');
    expect(endpointFor('ingredients')).toBe('/api/stock/ingredients');
    expect(endpointFor('carwash')).toBe('/api/carwash/history');
  });
  it('rejects unavailable workflows instead of posting to invented endpoints',()=>expect(()=>endpointFor('suppliers_archive')).toThrow('not available'));
});
