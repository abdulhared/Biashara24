import {http} from './http';
import {retryablePost} from './retryableWrite';
const endpoints={orders:'/api/orders',payments:'/api/payments',ingredients:'/api/stock/ingredients',carwash:'/api/carwash/history',menu:'/api/admin/menu',users:'/api/admin/users',categories:'/api/admin/categories',departments:'/api/admin/departments',bays:'/api/carwash/bays',services:'/api/carwash/services',audits:'/api/admin/audit-logs',stockTransactions:'/api/stock/history'};
export function endpointFor(resource){if(!endpoints[resource])throw new Error('This workflow is not available yet.');return endpoints[resource]}
export const resourceService={
 list:(resource,query='')=>http.get(endpointFor(resource)+query),
 create:(resource,payload)=>{if(resource==='payments'){const {order_id,...payment}=payload;if(!order_id)throw new Error('Select an order.');return retryablePost('/api/orders/'+order_id+'/clear',payment)}if(resource==='carwash')return retryablePost('/api/carwash/transaction',payload);return http.post(endpointFor(resource),payload)},
 update:(resource,id,payload)=>http.put(endpointFor(resource)+'/'+id,payload),
 remove:(resource,id)=>http.delete(endpointFor(resource)+'/'+id),
 verifyPayment:id=>http.put('/api/payments/'+id+'/verify',{}),
 completeWash:id=>http.post('/api/carwash/'+id+'/complete',{}),
 stock:(action,payload)=>retryablePost('/api/stock/'+action,payload)
};
