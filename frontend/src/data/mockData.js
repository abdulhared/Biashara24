export const orders = [
  {id:'ODR-1047',table:'Table 6',waiter:'James Kariuki',items:4,total:1150,status:'awaiting payment',time:'12:31',elapsed:'21 min'},
  {id:'ODR-1046',table:'Table 3',waiter:'Grace Njeri',items:3,total:2400,status:'ready',time:'12:25',elapsed:'27 min'},
  {id:'ODR-1045',table:'Table 8',waiter:'Peter Maina',items:5,total:980,status:'in kitchen',time:'12:18',elapsed:'34 min'},
  {id:'ODR-1044',table:'Table 2',waiter:'Sarah Wambui',items:2,total:1750,status:'new',time:'12:12',elapsed:'40 min'},
  {id:'ODR-1043',table:'Takeaway',waiter:'Amina Yusuf',items:3,total:850,status:'completed',time:'11:58',elapsed:'54 min'}
];
export const ingredients = [
  {name:'Flour',category:'Dry Goods',current:25,min:10,unit:'kg',usage:4,status:'in stock'},
  {name:'Cooking Oil',category:'Oils & Fats',current:2,min:3,unit:'L',usage:1.5,status:'low stock'},
  {name:'Tomatoes',category:'Fresh Produce',current:3.5,min:4,unit:'kg',usage:2,status:'low stock'},
  {name:'Rice',category:'Grains',current:20,min:10,unit:'kg',usage:3,status:'in stock'},
  {name:'Coffee Beans',category:'Beverages',current:5,min:2,unit:'kg',usage:1,status:'in stock'},
  {name:'Milk',category:'Dairy',current:12,min:6,unit:'L',usage:4,status:'in stock'}
];
export const payments = [
  {receipt:'RCP-001842',order:'ODR-1043',method:'M-Pesa',amount:850,reference:'QJ21A8K7',cashier:'Hassan',status:'confirmed',time:'11:59'},
  {receipt:'RCP-001841',order:'ODR-1042',method:'Cash',amount:1250,reference:'—',cashier:'Hassan',status:'confirmed',time:'11:47'},
  {receipt:'RCP-001840',order:'ODR-1041',method:'M-Pesa',amount:2100,reference:'QJ21B9M4',cashier:'Hassan',status:'pending',time:'11:35'},
  {receipt:'RCP-001839',order:'ODR-1040',method:'Cash',amount:650,reference:'—',cashier:'Asha',status:'confirmed',time:'11:22'}
];
export const bays = [
  {bay:'Bay 1',plate:'KDA 482M',service:'Full Wash',attendant:'James',elapsed:'19 min',progress:65,status:'in progress'},
  {bay:'Bay 2',plate:'KBL 119P',service:'Standard Wash',attendant:'Moses',elapsed:'24 min',progress:100,status:'ready'},
  {bay:'Bay 3',plate:'KCY 707A',service:'Full Wash + Vacuum',attendant:'Alice',elapsed:'12 min',progress:40,status:'in progress'},
  {bay:'Bay 4',plate:'—',service:'Available',attendant:'—',elapsed:'—',progress:0,status:'available'}
];
export const menuItems = [
  {name:'Chapati',category:'Food',department:'Kitchen',price:150,available:true,sold:120},
  {name:'Pilau',category:'Food',department:'Kitchen',price:450,available:true,sold:85},
  {name:'Coffee',category:'Drinks',department:'Barista',price:175,available:true,sold:75},
  {name:'Samosa',category:'Pastry',department:'Pastry',price:100,available:true,sold:64},
  {name:'Chocolate Cake',category:'Pastry',department:'Pastry',price:300,available:false,sold:32}
];
export const staff = [
  {name:'Grace Njeri',role:'Waiter',shift:'Morning',orders:18,avg:'14 min',status:'on shift'},
  {name:'Kevin Otieno',role:'Waiter',shift:'Morning',orders:16,avg:'15 min',status:'on shift'},
  {name:'Hassan Ali',role:'Cashier',shift:'Morning',orders:73,avg:'2 min',status:'on shift'},
  {name:'Alice Naliaka',role:'Car Wash Attendant',shift:'Morning',orders:9,avg:'22 min',status:'on shift'}
];
export const stockTransactions = [
  {time:'12:03',type:'deduction',item:'Tomatoes',qty:'−2 kg',reason:'Beef Stew recipes',user:'System'},
  {time:'09:12',type:'addition',item:'Flour',qty:'+50 kg',reason:'FreshFoods delivery',user:'Faith'},
  {time:'08:41',type:'addition',item:'Cooking Oil',qty:'+10 L',reason:'FarmGate delivery',user:'Faith'},
  {time:'Yesterday',type:'adjustment',item:'Milk',qty:'−1 L',reason:'Spillage',user:'Faith'}
];
export const notifications = [
  {title:'Cooking oil below minimum',detail:'2 L remaining; minimum is 3 L',type:'warning',time:'3 min ago'},
  {title:'M-Pesa confirmation pending',detail:'KES 2,100 for order ODR-1041',type:'info',time:'8 min ago'},
  {title:'Kitchen printer queue',detail:'Two jobs awaiting confirmation',type:'warning',time:'12 min ago'},
  {title:'Daily backup completed',detail:'Main Branch synchronized successfully',type:'success',time:'1 hour ago'}
];
export const kpis = {
  revenue:60000, restaurant:45000, carwash:15000, openOrders:12, prep:'13 min', staff:8,
  stockValue:184600, stockUsage:21400, vehicles:30, washTime:'24 min'
};
