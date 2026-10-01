import {describe,expect,it} from 'vitest';
import {validate,validators} from '../validation/validate';

describe('form validation',()=>{
  it('rejects missing required values',()=>{
    expect(validate({name:''},[{name:'name',label:'Name',required:true}])).toEqual({name:'Name is required'});
  });
  it('checks minimum numeric values',()=>{
    expect(validate({amount:0},[{name:'amount',label:'Amount',type:'number',min:1}]).amount).toContain('at least 1');
  });
  it('validates Kenyan plates and M-Pesa references',()=>{
    expect(validators.plate.test('KDA 482M')).toBe(true);
    expect(validators.plate.test('invalid')).toBe(false);
    expect(validators.mpesa.test('QJ21A8K7')).toBe(true);
  });
});
