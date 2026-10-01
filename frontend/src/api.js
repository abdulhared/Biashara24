import {request} from './services/http';
export const setToken=value=>{value?localStorage.setItem('b360_token',value):localStorage.removeItem('b360_token')};
export const api=request;
export const get=path=>api(path);
export const post=(path,data)=>api(path,{method:'POST',body:JSON.stringify(data)});
export const put=(path,data)=>api(path,{method:'PUT',body:JSON.stringify(data)});
