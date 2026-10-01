import {createContext,useContext,useMemo,useReducer} from 'react';

const initialState={orders:[],payments:[],ingredients:[],bays:[],menu:[],staff:[],stockTransactions:[],notifications:[],toast:null};
function reducer(state,action){
  switch(action.type){
    case 'ADD': return {...state,[action.resource]:[action.payload,...(state[action.resource]||[])],toast:{type:'success',message:'Record saved successfully'}};
    case 'UPDATE': return {...state,[action.resource]:(state[action.resource]||[]).map(x=>(x.id||x.name)==action.id?{...x,...action.payload}:x),toast:{type:'success',message:'Record updated'}};
    case 'REMOVE': return {...state,[action.resource]:(state[action.resource]||[]).filter(x=>(x.id||x.name)!=action.id),toast:{type:'success',message:'Record removed'}};
    case 'TOAST': return {...state,toast:action.payload};
    case 'CLEAR_TOAST': return {...state,toast:null};
    default:return state;
  }
}
const StoreContext=createContext(null);
export function AppStore({children}){const [state,dispatch]=useReducer(reducer,initialState);const value=useMemo(()=>({state,dispatch}),[state]);return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>}
export function useAppStore(){const store=useContext(StoreContext);if(!store)throw new Error('useAppStore must be used inside AppStore');return store}
