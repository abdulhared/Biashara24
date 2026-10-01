# Phase 2: waiter workspace and bill management

Implemented locally. Restart the backend and frontend to load the changes. No production deployment or payment gateway integration was performed.

## First use

1. Sign in as a manager or director and open **Tables**, above the page content. Add the actual table numbers. No table numbers are inferred from customer text.
2. Confirm that menu items, categories and departments are active. Configure department printers only when the real devices are available.
3. Sign in as a waiter. The landing screen is **My open bills**. Choose **New order**, select a free table, browse category buttons or search, and tap **Add**. Adjust the unsent cart, choose **Review order**, confirm the table/items/notes, then submit. In portrait, the persistent **View order** button opens the cart without scrolling through the menu.
4. Open the bill and choose **Add items** for another submission. The original opening time and FIFO position remain unchanged.
5. Request quantity reductions or cancellation with a reason. Managers/directors review these through **Bill approvals**. Payment is blocked until requests are resolved.
6. Cashiers record money received externally. Cash closes the bill and releases the table. A pending cashless receipt locks the bill but retains the table until manual confirmation.

The waiter sidebar contains My bills, New order and History. The director's six primary links are unchanged.

## Persistence and safety

- Migration version 2 runs at backend startup. Existing SQLite databases are backed up beside the database as `<database>.pre-v2-<timestamp>.bak` before an upgrade. It adds columns/tables; it does not remove orders or rewrite existing prices. Existing orders without a structured table display **Unassigned**.
- A database reservation primary key prevents two active reservations for one table. SQLite bill writes use `BEGIN IMMEDIATE`; expected bill versions reject stale additions, decisions and payment submissions.
- Bill creation/additions require an `Idempotency-Key` header (8–100 characters). Retrying the same key and payload returns the saved bill without new charges or tickets. Reusing a key with a different payload returns 409.
- Each new submission stores its own lines, timestamp and department delivery results. Totals use Decimal arithmetic at currency precision; old line prices stay unchanged.
- A bill is committed before printer network I/O. A destination is marked uncertain before sending; an ambiguous send is never automatically resent. **Sent to printer** confirms network delivery only, not paper printing or kitchen preparation.
- Removal approvals record voided quantities and correction batches. Audit entries preserve requests and decisions; submitted lines are retained.
- Local drafts are isolated by authenticated account and bill. Logout clears drafts. An uncertain submission freezes its payload and key until a safe retry resolves it. There is no offline submission.
- Legacy original lines remain visible separately from subsequent additions. Their historical printer delivery is not inferred.

Existing non-SQLite databases with missing columns still require a separately reviewed schema migration; the automatic legacy migration and concurrency tests cover SQLite.

## API additions

| Endpoint | Purpose |
| --- | --- |
| GET /api/tables | Table availability; other waiters see owner names but no bill details |
| POST /api/tables | Manager/director creates a positive, unique table number |
| PUT /api/tables/{id} | Activate/deactivate; occupied tables cannot be deactivated |
| GET /api/orders?active=true&sort=oldest&limit=100&offset=0 | Owned active bills, sorted before pagination |
| POST /api/orders | Create with table_id, items, notes and Idempotency-Key |
| POST /api/orders/{id}/items | Add items with expected_version and Idempotency-Key |
| POST /api/orders/{id}/change-requests | Request remove/cancel with expected_version and reason |
| GET /api/order-change-requests | Manager/director review queue |
| PUT /api/order-change-requests/{id} | Approve/reject with expected_version |
| POST /api/orders/{id}/clear | Existing cashier endpoint; include expected_version |

Each item uses `menu_item_id` and `quantity`. Removal request items use `order_item_id` and `quantity`. Responses include table, version, batches, delivery results, change requests and payment/addition block reasons. A 409 requires refreshing the bill before a new mutation. For an uncertain create/add response, retry the original payload/key first.

## Verification

Final local results: **45 backend tests passed, 95.06% backend coverage; 60 frontend tests passed after the ordering UI refinement; production build passed; both tablet browser layouts passed**. Existing dependency deprecation/build warnings remain non-blocking.

- Backend: full regression suite, SQLite migration/backup preservation, ownership and direct API denial, table reservation race, concurrent additions, duplicate submissions, price snapshots, FIFO pagination, payment/addition and payment/approval races, cancellation/rejection, partial removals, audit persistence and printer failure/replay behavior.
- Frontend: navigation, account-isolated drafts, uncertain submission replay across remount, required table/items, unavailable tables, category filtering, empty addition carts, polling/focus refresh, connection recovery and logout cleanup.
- Browser smoke: installed headless Chrome, 1180×820 landscape and 820×1180 portrait. Verified no horizontal or sidebar overflow, a landscape menu/cart layout, persistent portrait cart access after scrolling, 48px controls, keyboard activation, review dialogs, Escape dismissal and manager review rendering. Browser smoke uses API fixtures; backend integration tests exercise the real database.
- Physical printer output has not been tested on hardware.

Run from `backend`:

```powershell
.\.venv\Scripts\python.exe -m pytest -q --cov=app --cov-report=term-missing --cov-fail-under=80
```

Run from `frontend`:

```powershell
npm.cmd test
npm.cmd run build
```

For repeatable tablet screenshots, start `npm.cmd run dev -- --host 127.0.0.1 --port 5178 --strictPort`, then in another frontend terminal run `node scripts/tablet-smoke.mjs`. Set CHROME_PATH if Chrome is installed elsewhere. Screenshots and measured layout checks are saved in `frontend/artifacts/`.
