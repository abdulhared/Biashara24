import {describe,expect,it} from 'vitest';
import {render,screen} from '@testing-library/react';
import {AppStore,useAppStore} from '../state/AppStore';

function Probe(){const {state}=useAppStore();return <span>{state.orders.length} orders</span>}
describe('application state',()=>{
  it('does not seed sample business data',()=>{render(<AppStore><Probe/></AppStore>);expect(screen.getByText('0 orders')).toBeInTheDocument()});
});
