import {describe,expect,it} from 'vitest';
import {roles} from '../config/navigation';
import {workflowFor} from '../config/workflows';

describe('role navigation',()=>{
  it('defines all operational workspaces',()=>expect(Object.keys(roles)).toEqual(['kitchen','director','manager','cashier','store_manager','waiter','carwash_manager']));
  it('gives every navigation destination a workflow contract',()=>{
    for(const role of Object.values(roles))for(const [id] of role.nav){
      const workflow=workflowFor(id);
      expect(workflow.resource).toBeTruthy();
      expect(workflow.action).toBeTruthy();
      expect(workflow.fields.length).toBeGreaterThan(0);
    }
  });
  it('keeps navigation identifiers unique inside each role',()=>{
    for(const role of Object.values(roles)){const ids=role.nav.map(([id])=>id);expect(new Set(ids).size).toBe(ids.length)}
  });
});
