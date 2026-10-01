import {validators} from '../validation/validate';

const text=(name,label,required=true)=>({name,label,required});
const number=(name,label,min=0)=>({name,label,type:'number',required:true,min});
const select=(name,label,options)=>({name,label,type:'select',required:true,options});

export const workflows={
  orders:{resource:'orders',action:'Create order',fields:[select('table','Table',['Table 1','Table 2','Table 6','Takeaway']),text('customer','Customer',false),text('items','Menu items'),number('total','Order total',1)]},
  payments:{resource:'payments',action:'Record payment',fields:[text('order','Order number'),number('amount','Amount',1),select('method','Method',['Cash','M-Pesa']),text('reference','Reference',false)]},
  inventory:{resource:'ingredients',action:'Add ingredient',fields:[text('name','Ingredient'),select('category','Category',['Dry Goods','Fresh Produce','Dairy','Beverages']),select('unit','Unit',['kg','L','pieces']),number('current','Opening quantity'),number('min','Minimum level')]},
  'car-wash':{resource:'bays',action:'New wash',fields:[{...text('plate','Vehicle plate'),pattern:validators.plate,patternMessage:'Use a plate such as KDA 482M'},select('service','Service',['Standard Wash','Full Wash','Full Wash + Vacuum']),select('bay','Bay',['Bay 1','Bay 2','Bay 3','Bay 4']),number('amount','Amount',1)]},
  menu:{resource:'menu',action:'Add menu item',fields:[text('name','Item name'),select('category','Category',['Food','Drinks','Pastry']),select('department','Department',['Kitchen','Barista','Pastry']),number('price','Price',1)]},
  staff:{resource:'staff',action:'Add staff member',fields:[text('name','Full name'),select('role','Role',['Waiter','Cashier','Kitchen Staff','Manager']),text('phone','Phone number'),select('shift','Shift',['Morning','Evening'])]},
  printers:{resource:'printers',action:'Configure printer',fields:[text('name','Printer name'),select('department','Department',['Kitchen','Barista','Pastry','Cashier']),text('ip_address','IP address'),number('port','Port',1)]},
  departments:{resource:'departments',action:'Add department',fields:[text('name','Department name'),text('description','Description',false)]},
  branches:{resource:'branches',action:'Add branch',fields:[text('name','Branch name'),text('location','Location'),text('timezone','Timezone')]},
  'cash-payment':{resource:'payments',action:'Take cash payment',fields:[text('order','Order number'),number('amount','Amount due',1),number('received','Cash received',1)]},
  mpesa:{resource:'payments',action:'Confirm M-Pesa',fields:[text('order','Order number'),number('amount','Amount',1),{...text('reference','M-Pesa reference'),pattern:validators.mpesa,patternMessage:'Enter a valid M-Pesa reference'}]},
  receipts:{resource:'payments',action:'Issue receipt',fields:[text('order','Order number'),text('receipt','Receipt number')]},
  reconciliation:{resource:'payments',action:'Start reconciliation',fields:[number('expected_cash','Expected cash'),number('counted_cash','Counted cash'),number('mpesa_total','M-Pesa total')]},
  'receive-stock':{resource:'deliveries',action:'Receive stock',fields:[select('supplier','Supplier',['FreshFoods Ltd','FarmGate Suppliers']),text('invoice','Invoice number'),text('ingredient','Ingredient'),number('quantity','Quantity',0.01),number('unit_cost','Unit cost',0)]},
  adjustments:{resource:'stockTransactions',action:'New adjustment',fields:[select('item','Ingredient',['Flour','Cooking Oil','Tomatoes','Rice','Milk']),select('type','Type',['Adjustment','Wastage','Deduction']),number('quantity','Quantity',0.01),text('reason','Reason')]},
  recipes:{resource:'recipes',action:'Create recipe',fields:[select('menu_item','Menu item',['Chapati','Pilau','Coffee','Beef Stew']),text('ingredient','Ingredient'),number('quantity','Quantity required',0.01),select('unit','Unit',['kg','L','pieces'])]},
  suppliers:{resource:'suppliers',action:'Add supplier',fields:[text('name','Supplier name'),text('contact','Contact person'),{...text('phone','Phone'),pattern:validators.phone,patternMessage:'Use a Kenyan phone number'},text('address','Address',false)]},
  deliveries:{resource:'deliveries',action:'New delivery',fields:[select('supplier','Supplier',['FreshFoods Ltd','FarmGate Suppliers']),text('invoice','Invoice number'),number('total','Total cost',0),select('status','Status',['Expected','Delivered','Checked'])]},
  'stock-counts':{resource:'stockCounts',action:'Start stock count',fields:[text('count_number','Count number'),select('scope','Scope',['All inventory','Kitchen store','Beverage store']),text('notes','Notes',false)]},
  reorder:{resource:'reorders',action:'Create purchase request',fields:[select('ingredient','Ingredient',['Cooking Oil','Tomatoes','Milk']),number('quantity','Order quantity',0.01),select('supplier','Supplier',['FreshFoods Ltd','FarmGate Suppliers'])]},
  'new-wash':{resource:'bays',action:'Start transaction',fields:[{...text('plate','Vehicle plate'),pattern:validators.plate,patternMessage:'Use a plate such as KDA 482M'},select('service','Service',['Standard Wash','Full Wash','Full Wash + Vacuum']),select('bay','Bay',['Bay 1','Bay 2','Bay 3','Bay 4']),select('attendant','Attendant',['James','Moses','Alice'])]},
  'wash-payments':{resource:'payments',action:'Record wash payment',fields:[text('plate','Vehicle plate'),number('amount','Amount',1),select('method','Method',['Cash','M-Pesa']),text('reference','Reference',false)]},
  attendants:{resource:'staff',action:'Add attendant',fields:[text('name','Full name'),text('phone','Phone'),select('shift','Shift',['Morning','Evening'])]},
  'service-types':{resource:'services',action:'Add service',fields:[text('name','Service name'),number('price','Price',1),number('estimated_minutes','Estimated minutes',1)]},
  'bay-config':{resource:'bays',action:'Configure bay',fields:[text('bay','Bay name'),select('status','Status',['Available','Maintenance','Closed']),text('notes','Notes',false)]},
  management:{resource:'users',action:'Create user',fields:[text('name','Full name'),text('username','Username'),select('role','Role',['Director','Manager','Cashier','Store Manager','Car Wash Manager']),text('password','Temporary password')]},
  settings:{resource:'settings',action:'Save settings',fields:[text('business_name','Business name'),text('timezone','Timezone'),select('currency','Currency',['KES']),select('backup','Backup frequency',['Daily','Weekly'])]}
};

export function workflowFor(id){return workflows[id]||{resource:id.replaceAll('-','_'),action:'Add record',fields:[text('name','Name'),text('description','Description',false)]}}
