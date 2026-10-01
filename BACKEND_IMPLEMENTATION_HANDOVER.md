# Restaurant implementation handover

Updated 1 October 2026. This describes the implementation following `BACKEND_SYSTEM_ANALYSIS.md`; the original audit and probe results are historical evidence, not the current implementation status.

## Live ordering integration correction

The waiter page previously switched to a local simulation automatically when menu and table lists were empty, or when opened with `?demo=1`. That fallback and the simulation component have now been removed. Every order submission uses the live order API, including old demo bookmarks. Missing configuration shows real empty states and keeps submission disabled; inactive tables cannot be selected.

The default local business database was inspected read-only and contained **zero menu items, zero tables and zero orders**. Configure the restaurant's actual foods in **Manager → Menu** and its tables in **Manager → Tables**. Sample menu data has not been inserted into business records.

Verification after this correction: **89 frontend tests passed** and the production build passed. `frontend/scripts/live-order-smoke.mjs` also passed using a real Chrome browser, Vite, FastAPI and an isolated SQLite database, with no fetch interception. It verifies browser submission, persistence after reload, kitchen receipt and progress, waiter ready notification, tax-inclusive payment, change and table release. Results are in `frontend/artifacts/live-order-check.json`. Temporary test services are stopped by the script.

## Five implementation phases

| Phase | Delivered and connected | Operating details |
|---|---|---|
| 1. Protect transactions | Manager rejection of pending payments with retained history; separate replacement payments; shared restaurant/car-wash receipt-reference reservation; persisted retry results for payments, stock and wash submissions; historical food/department snapshots; receipt snapshots; configuration audit events; decoded image validation | Rejection does not delete the original payment or confirm money. Confirmed money requires a refund. New frontend writes retain submission keys after uncertain responses. Older API clients must supply `Idempotency-Key` to obtain retry protection. One external receipt funds one transaction; split allocations are not supported. |
| 2. Kitchen and service | Department-scoped kitchen accounts; independent line preparation/ready/served states; waiter pickup and notification pages; pipeline aggregation; controlled table/waiter transfer; durable printer tickets and explicit operator reprints | New courses have new lines and do not reset served food. Kitchen progress checks versions. Reprint requests commit their identity before network I/O; replaying a request does not send again. Physical delivery remains uncertain after a network interruption. |
| 3. Connect sales to stock | Versioned recipes, ingredient reservation, preparation-time consumption, prepared-food waste, suppliers, purchase approval and partial delivery, receiving/wastage documents, separately reviewed stock counts | Recipe quantities are per portion in the ingredient's stock unit. Submitting food reserves stock; starting preparation deducts it once. Pre-preparation cancellation releases reservations. Prepared-food cancellation records waste without deducting again or restoring stock. Counts fail if stock has moved since drafting. |
| 4. Cashier accountability | Cashier shifts and opening float, tender/change amounts, supervisor till movements, recorded refunds and credit-note numbers, counted close and supervisor review, receipt snapshots | Expected cash = float + restaurant/wash cash receipts + till movements − cash refunds. Differences require a reason. Closed shifts cannot be edited or self-reviewed. Refunds record money returned externally; they do not initiate a provider transfer. |
| 5. Management integration | Live settings, personal notification/read state, live recipe/supplier/purchasing/count/reconciliation screens, live category/department edits, refund-aware net receipt reports, database readiness | Director and manager can find the modules in Workspace tools. Settings are version checked, and new receipt snapshots retain the business details at payment time. `/ready` checks database access and schema version; `/health` remains a liveness check. |

## Where to use the workflows

- Manager/director: **Workspace tools → Kitchen Operations, Recipes, Suppliers, Purchasing, Stock Documents, Stock Counts, Cash Reconciliation, Refunds, Printer Recovery, Business Settings**. Open **Tables** to transfer an unpaid bill.
- Staff administration: create a **Kitchen** account and assign its preparation department. Kitchen users cannot read or update another department's lines.
- Waiter: **Food pickup** and **Notifications**. Only the owning waiter can confirm service through the waiter workflow. Kitchen and notification screens refresh periodically.
- Store manager: **Recipes, Suppliers, Reorder Planning, Deliveries, Stock Counts** now persist business records. Purchase approval and count approval require management; a count needs a different reviewer from its creator.
- Cashier: **Reconciliation / Shift Summary** opens and closes shifts. Managers review them and approve refunds.
- Pending incorrect cashless entries: manager/director opens the payment ledger, selects **Reject entry**, and records a reason. Record a new payment after refreshing the bill.

## Initial configuration

1. Confirm active ingredients and stock units; enter opening stock or post receiving documents.
2. Create recipes before taking new recipe-managed orders. Food without a recipe remains available but is explicitly shown as having no recipe; it does not automatically consume stock.
3. Create department-assigned kitchen accounts and configure printer addresses where physical printing is used.
4. Open cashier shifts. When the team is ready, enable **Require an open shift for payments** in Business Settings. This is initially optional to preserve operation for existing clients during transition.
5. Set business name/address/phone for future receipt snapshots.

Prices remain tax-inclusive with the requested 16% arithmetic. No extra 16% is added at checkout.

## Data upgrade

- Schema version: **6**. Normal backend startup invokes the upgrade.
- Existing SQLite databases receive a `.pre-v6-*.bak` backup before changes. Payment-table rebuilding preserves IDs and records while replacing the old one-payment-ever-per-order constraint with an active-payment uniqueness constraint.
- Food-name history is recovered only from saved original/addition batches. Missing historical names and tax snapshots are not invented.
- Existing open food lines enter the kitchen queue without retroactive recipe deductions. Operators must review these transition bills: prior physical preparation cannot be established from the old data.
- Existing receipts without saved receipt snapshots use the legacy display fallback; they are not represented as newly captured immutable receipts.
- Tests use temporary databases. No test sales, refunds, recipes or supplier records were inserted into the business database.
- Existing non-SQLite upgrades still require a separately reviewed migration. PostgreSQL concurrency has not been certified by these SQLite tests.

## Verification

- **61 backend tests passed**, **93.92% statement coverage**, exceeding the configured 80% gate. Evidence: `backend/implementation-test-results.txt`.
- **87 frontend tests passed**; production build passed.
- Browser checks exercise **92 routes at desktop and phone widths**, plus tablet menu and dashboard checks. Evidence: `frontend/artifacts/tablet-checks.json` and `frontend/artifacts/implementation-browser-results.txt`.
- The restaurant-day test covers reservation, preparation, ready notification, service, prepared-food removal, retained consumption, cash tender/change, refund replay, counted close and independent review.
- Additional tests cover concurrent preparation, shared external references, rejected payment replacement, stock replay, partial receiving and over-receiving, pre-preparation cancellation, printer retry suppression, department access, transfers, decoded images, historical migrations and backup/restore helpers.

## Remaining scope and production acceptance

The five core restaurant workflows above are implemented. This is not certification of every enhancement in the original audit.

- Live printer/hardware rehearsal, actual provider settlement, peak-load testing on the deployment database, scheduled backup operations and a deployment restore drill still need the target environment. Printer recovery is operator-driven; there is no unattended background retry worker.
- M-Pesa confirmation remains manual. eTIMS and provider APIs are not integrated.
- Multi-branch data isolation, car-wash bay occupancy/attendant operations, and car-wash bay/service edit previews remain outside this restaurant implementation. Those preview screens are still labelled as previews.
- Stock uses ingredient base units. Automatic pack/unit conversion, lot/expiry tracking, supplier returns and full purchasing accounts payable are not implemented.
- Kitchen progression is per submitted line, not partial portions of a line. Seat/course modifiers and takeaway/delivery-specific workflows remain extensions.
- Split tenders/bills, reopening closed shifts, itemised tax credit-note allocation, profit accounting and comprehensive tax reporting remain extensions. Reports show receipt totals net of recorded refunds; top-item sales remain before payment-level refunds.
- Image decoding/size checks are implemented. Metadata stripping, image resizing and orphan-image retention cleanup remain storage enhancements.

The earlier dependency-installation approval-service failure was resolved on retry; Pillow 12.3.0 is installed in the backend virtual environment and pinned in requirements.
