import {request} from './http';

// Keep the original key across navigation/reloads after an uncertain response.
// The server scopes keys to the authenticated user and checks the full payload.
export async function retryablePost(path, payload) {
 const body=JSON.stringify(payload),slot='b360_pending_write:'+path+':'+body;
 let key=sessionStorage.getItem(slot);
 if(!key){key=crypto.randomUUID();sessionStorage.setItem(slot,key)}
 try {
  const result=await request(path,{method:'POST',headers:{'Idempotency-Key':key},body});
  sessionStorage.removeItem(slot);
  return result;
 } catch(error) {
  if(error.status&&error.status<500&&error.status!==409)sessionStorage.removeItem(slot);
  throw error;
 }
}
