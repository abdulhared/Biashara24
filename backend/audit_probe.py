"""Readiness probes. Uses a disposable database; never the business database."""
import base64
import json
import os
import sys
import tempfile
from pathlib import Path
from uuid import uuid4

def main():
    with tempfile.TemporaryDirectory(prefix="b360-audit-") as folder:
        os.environ["DATABASE_URL"] = "sqlite:///" + str(Path(folder) / "audit.db")
        os.environ["ENVIRONMENT"] = "development"
        from fastapi.testclient import TestClient
        from app.main import app
        from app.database import engine
        sys.path.insert(0, str(Path(__file__).parent / "tests"))
        from test_integration import login, new_menu, new_table
        findings = {}
        try:
            with TestClient(app, raise_server_exceptions=False) as c:
                h = login(c)
                item = new_menu(c,h,116)
                payload = {"table_id":new_table(c,h),"items":[{"menu_item_id":item['id'],"quantity":1}]}
                bill = c.post('/api/orders',headers={**h,'Idempotency-Key':uuid4().hex},json=payload).json()
                path = '/api/orders/'+str(bill['id'])
                before = bill['items'][0]['name']
                c.put('/api/admin/menu/'+str(item['id']),headers=h,json={'name':'Renamed audit dish'})
                after = c.get(path,headers=h).json()
                findings['historical_name_changes']={'before':before,'after':after['items'][0]['name'],'batch_name':after['batches'][0]['items'][0]['name']}
                ingredient=c.post('/api/stock/ingredients',headers=h,json={'name':'Audit rice','unit':'kg','min_level':1,'current_stock':0}).json()
                stock={'ingredient_id':ingredient['id'],'quantity':5,'reason':'Same receiving request retried'}
                first=c.post('/api/stock/add',headers=h,json=stock).json()
                second=c.post('/api/stock/add',headers=h,json=stock).json()
                findings['stock_retry']={'first_balance':first['current_stock'],'retry_balance':second['current_stock']}
                pending=c.post(path+'/clear',headers=h,json={'expected_version':after['version'],'method':'m-pesa','amount':116,'reference':'AUDIT-REFERENCE'}).json()
                findings['pending_payment']={'payment_status':pending['status'],'bill_locked':c.get(path,headers=h).json()['locked'],'cancel_payment_endpoint_status':c.delete('/api/payments/'+str(pending['id']),headers=h).status_code}
                photo=c.post('/api/admin/menu-images',headers=h,json={'data':'data:image/png;base64,'+base64.b64encode(b'\x89PNG\r\n\x1a\nnot-a-valid-image').decode()})
                findings['invalid_image_with_png_signature']={'status':photo.status_code}
                bay=c.post('/api/carwash/bays',headers=h,json={'bay_number':1,'name':'Audit bay'}).json()
                service=c.post('/api/carwash/services',headers=h,json={'name':'Audit wash','price':116}).json()
                wash={'vehicle_plate':'KAA 001A','bay_id':bay['id'],'service_id':service['id'],'amount':116,'payment_method':'m-pesa','mpesa_reference':'AUDIT-REFERENCE'}
                r1=c.post('/api/carwash/transaction',headers=h,json=wash)
                r2=c.post('/api/carwash/transaction',headers=h,json=wash)
                findings['duplicate_wash_reference_and_bay']={'first_status':r1.status_code,'second_status':r2.status_code,'same_reference_as_restaurant':True}
            output=Path(__file__).with_name('backend-audit-probes.json')
            output.write_text(json.dumps(findings,indent=2),encoding='utf-8')
            print(json.dumps(findings,indent=2))
        finally:
            engine.dispose()

if __name__=='__main__':
    main()
