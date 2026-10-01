# Manager food menu and inclusive VAT

Completed locally on 27 September 2026. This follows PHASE2_HANDOVER.md.

- Manager > Menu Management now creates and edits food names, descriptions, categories, kitchen departments, availability, photos and VAT-inclusive prices. Directors can use their menu configuration page too.
- Upload JPEG, PNG or WebP photos up to 2 MB, or supply an HTTP(S) image URL. Uploaded photos persist in the database and are served by the API. Waiters cannot upload or modify menu items.
- The live waiter menu uses the same saved food records. It refreshes on focus and every 15 seconds. Unavailable items are excluded. Images remain bounded on phones and tablets.
- Manage tables remains a separate linked screen: the waiter chooses the table for the order, not for individual foods.
- Prices include 16% VAT as requested. VAT is extracted as gross * 16 / 116, rounded per order line to cents. KES 116 remains KES 116 payable, with KES 16 included VAT. Order additions and approved removals preserve price/tax snapshots and update the breakdown.
- VAT breakdowns appear in the manager price preview, waiter cart/review/bill and cashier checkout/receipt. Historical order lines lacking a tax snapshot are not retrospectively assigned a tax breakdown.
- SQLite migration 3 backs up an existing database before adding description/tax fields and photo storage. Menu prices are unchanged. Restart the backend to run the migration; refresh/restart the frontend for the new interface. Existing non-SQLite databases still need a reviewed migration.
- Tax calculation does not add an eTIMS integration. KRA general-rate reference: https://www.kra.go.ke/individual/filing-paying/types-of-taxes/value-added-tax

Verification: 48 backend tests passed, 95.28% coverage; 63 frontend tests passed; production build passed. Chrome checks passed for waiter phone/portrait/landscape views and manager phone/tablet forms. Browser checks use API fixtures; backend tests use a temporary database. Existing dependency warnings remain.

Commands: backend `.venv/Scripts/python.exe -m pytest -q --cov=app --cov-report=term --cov-fail-under=80`; frontend `npm.cmd test`, `npm.cmd run build`, and (with Vite on port 5178) `node scripts/tablet-smoke.mjs`.
