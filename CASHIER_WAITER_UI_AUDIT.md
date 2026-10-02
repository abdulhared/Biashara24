# Cashier and waiter UI audit

1 October 2026. Scope: current React source and saved browser screenshots under `frontend/artifacts`. Screenshots use test fixtures; they are evidence of layout, not actual business activity. This review does not change application behavior.

## Assessment

### Payments and receipts redesign delivered

Cashier Payments, Cash payments, M-Pesa confirmations and Receipts now share a dedicated responsive transaction workspace. It provides server-side date/method/status filters, explicitly page-local search/export, daily confirmed-payment metrics, status badges and a selected transaction panel. Cashless confirmation requires checking the displayed external reference and amount. Receipts default to confirmed entries and use the saved business/item/tax snapshot, tender and change; older entries without item snapshots say so instead of substituting a current bill. Pending entries remain clearly labelled as unconfirmed records.

Receipt printing uses an isolated print layout. Browser checks cover 1366, 820 and 390 pixel widths, populated lists, selected previews and receipt-only print media. Screenshots are saved as `frontend/artifacts/cashier-payment-ledger-{width}.png` and `cashier-receipts-{width}.png`; `cashier-receipt-print.pdf` is a test-fixture print sample. Frontend regression suite: 96 tests passing. Waiter redesign remains separate work.

### Checkout redesign delivered

Checkout and Pending Bills now use a dedicated dark green workspace with an active-bill queue, selected itemized bill and payment panel. The queue and selected bill refresh automatically; changed bill versions require another review. Cash includes quick tender amounts and change calculation. M-Pesa retains manual external confirmation, and uncertain submissions can retry with the original idempotency key. Shift state and expected drawer cash are visible above checkout. Search is explicitly limited to the current page; server-wide search remains future work.

Selected checkout layouts were checked at 1366, 820 and 390 pixels without document or panel horizontal overflow. Screenshots: `frontend/artifacts/cashier-checkout-selected-{width}.png`. Cash, cashless, changed-bill and uncertain-payment retry flows have automated coverage. This delivery covers checkout; waiter redesign and receipt enhancements below remain separate work.

The cashier needs a dedicated checkout workstation. The waiter needs a clearer service dashboard and a denser order composer. Dark green branding, readable typography, touch-friendly controls and backend validation should be retained. Making every element smaller would not solve the information hierarchy problems.

## Prioritized findings

| Priority | Finding and evidence | Effect on staff | Recommended change |
|---|---|---|---|
| High | Checkout uses the generic Orders table with order number, table, customer, waiter, all items, total, status, payment hold and actions. The desktop and phone screenshots show internal horizontal scrolling. | The cashier cannot see the bill identity, amount and payment action together. | Replace checkout's wide table with a compact selectable bill queue: table/bill, waiter, amount, age and status. Move item details into the selected bill. Keep the ledger as a table. |
| High | An empty payment panel occupies a large part of checkout. Once a bill is chosen, item detail, VAT, tender and payment action share a vertical form. | Space is poorly used before selection; the most important amounts compete with secondary information afterwards. | Use three desktop areas: bill queue, selected bill, payment controls. Keep amount due, tender, change and confirmation visible. Show a small purposeful selection prompt before a bill is chosen. |
| High | Cashier order data uses `useData` without polling. `selected` holds the clicked order object rather than following the refreshed order. | New waiter submissions and bill changes may not appear promptly; checkout can show stale detail until the server rejects an outdated version. | Refresh the queue periodically and on focus; track selection by ID and refetch it. If a bill changes, show the difference and require renewed confirmation. Retain server version checks. |
| High | Checkout fetches a paginated general order list and then filters closed bills locally. Search also covers only the fetched page. | A cashier may see an empty or sparse queue despite open bills elsewhere, or assume a bill does not exist. | Query active bills on the server before pagination. Provide server-side bill/table search, with clear result counts. |
| High | Waiter bill cards emphasize the bill, amount and printer delivery, while pickup and notifications are separate pages. | Ready food and outstanding service tasks are harder to prioritize. Printer delivery does not communicate preparation progress. | Make My tables/My bills the service home, with separate indicators for preparation, payment and exceptions. Include ready-item alerts with a direct pickup action. |
| High | Review eligibility depends on table availability, cart items, bill locks and pending submission state. The recent fix now explains these conditions. | Previously, a disabled button could look broken; long carts can still separate explanations from the action. | Retain the new explanations and recovery actions. Anchor total, blocking reason and Review together in the cart footer. On mobile, provide a clear path back to table selection. |
| Medium | Waiter menu cards devote substantial height to photos/placeholders, description/category text and buttons. At tablet width only a few items are visible. | Finding frequently ordered food requires scrolling. | Use shorter food cards or compact rows, smaller photos, name and price as primary text, and category chips. Keep adequate touch targets. Avoid repeating category as description. |
| Medium | Waiter page heading, table context and menu search occupy substantial vertical space. | Less space remains for food and the cart on tablets. | Combine table, bill mode and waiter in one compact context bar; keep search/categories close to the menu and visible while browsing. |
| Medium | Cashier navigation splits Checkout, Pending Bills, Payments, Cash Payment, M-Pesa Confirmation, Receipts, Reconciliation and Shift Summary across pages and Workspace tools. Some use the same components with filters. | Staff must remember where closely related tasks live. | Consolidate to Checkout, Transactions, Cashless confirmation and Shift. Use tabs/filters for cash and receipt searches. Keep car-wash payment access where required. |
| Medium | Shift information exists on a separate screen but is absent from the checkout header. | Cashier cannot quickly confirm the active drawer, shift owner or opening state while collecting money. | Show active shift, cashier, opening time and drawer status above checkout, with a direct Open shift or Shift details action. Fetch real shift data. |
| Medium | Cash and cashless inputs appear as a generic form; cash confirmation lacks a strong final summary. Receipt rendering does not show the saved business name or recorded tender/change. | The interface makes payment verification and customer handover less clear. | Use prominent Cash/M-Pesa selectors. Show cash due/tender/change or cashless reference/verification state. Render saved receipt business details and tender/change. Label pending entries as awaiting confirmation. |
| Medium | Mobile checkout retains the desktop table and stacks the payment panel underneath. | Cashier scrolls horizontally to find actions and vertically to reach payment. | Use a queue → bill → payment sequence on narrow screens, preserving the selected bill and a sticky amount/action footer. |
| Medium | Generic copy such as “Orders saved in the database,” raw status values and technical delivery wording compete with operational information. | Users have to interpret system terms rather than act on a clear task. | Prefer “Bills awaiting payment,” “Preparing,” “Ready for pickup,” and clear printer exception actions. Never label an uncertain printer send as successful. |

## Proposed working layouts

### Cashier: desktop/tablet landscape

Top bar: cashier identity · active shift · open bill count · pending cashless count · refresh state.

| Bill queue (~28%) | Selected bill (~40%) | Payment (~32%) |
|---|---|---|
| Search table/bill, queue filters, table, waiter, amount, age, status | Table and bill identity, item quantities and prices, total and included VAT, bill hold/change notices | Amount due, Cash/M-Pesa, tender/change or reference, clear confirmation action |

Ratios are starting points, not fixed pixel requirements. When space is insufficient, switch to a deliberate two-step layout instead of compressing everything into unreadable columns. Successful payment should show the receipt and a clear Next bill action.

### Waiter: service and ordering

Service home: compact counts for active tables, preparing food, ready food and requests awaiting approval. Table/bill cards show table number, elapsed time, bill amount and distinct preparation/payment states. Actions: Open bill, Add items and Collect ready food.

Ordering: compact table context at top; searchable categorized menu in the main area; cart on the right on wide screens. Cart items scroll independently where practical. The cart footer keeps total, included VAT, any blocker and Review visible. Narrow screens use the existing View order pattern with a clear cart → review → submit sequence.

## Implementation order

1. Build a cashier-specific queue and checkout layout; correct active-bill filtering, refresh and selection handling.
2. Connect checkout shift status and improve cash/cashless confirmation and receipt handover.
3. Improve waiter service-home status visibility and pickup shortcuts.
4. Compact the waiter menu and make cart actions consistently reachable.
5. Consolidate navigation and validate desktop, tablet and phone workflows with realistic data volumes.

## Acceptance checks

- Cashier sees table/bill, amount and its action without horizontal scrolling.
- A newly submitted waiter bill appears without a manual page reload.
- An updated bill cannot silently retain an old amount in the payment panel.
- A queue containing many closed historical bills still lists active bills correctly.
- Selected bill and amount remain obvious throughout cash/cashless payment.
- A waiter can identify ready food from the service home without opening each bill.
- Long carts keep the total and next action reachable; unavailable tables and items explain recovery.
- Verify empty configuration, 30+ open bills, 50+ menu items, long names, a 15-line bill, slow requests, failures and repeated submission attempts.
- Confirm keyboard focus, readable contrast and touch targets. Preserve dark green styling and tax-inclusive pricing.

## Source and visual evidence

- `frontend/src/pages/LiveOrders.jsx`: checkout, bill filtering, selection, payments and receipt rendering.
- `frontend/src/pages/WaiterWorkspace.jsx`: bill list/detail, polling, drafts and order submission.
- `frontend/src/pages/WaiterOrderComposer.jsx`: menu, table selection, cart, review and blocking explanations.
- `frontend/src/pages/RestaurantOperations.jsx`: pickup, notifications and shift workflows.
- `frontend/src/pages/LiveUI.jsx`: generic tables and data hooks.
- `frontend/src/config/navigation.js`: cashier/waiter navigation.
- `frontend/artifacts/compact--cashier-checkout-1366.png` and `compact--cashier-checkout-390.png`.
- `frontend/artifacts/waiter-landscape.png` and `waiter-portrait.png`.

Earlier browser checks establish that the outer page fits the viewport. They do not establish that internal tables avoid scrolling, that important actions stay visible, or that staff can complete tasks efficiently.
