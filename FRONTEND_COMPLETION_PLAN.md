# Frontend completion audit

Scope: finish screens, navigation, reusable components and interaction states before adding backend business logic. Existing working API flows should remain connected. New unsupported workflows should be available in an explicitly labelled preview mode with isolated sample data; never show simulated saves as real transactions.

## Current findings

The shared compact styling is implemented, but visual consistency is not feature completion. The route mapping in frontend/src/pages/RolePages.jsx still maps many different destinations to the same generic page. Older reference dashboards in Dashboards.jsx are not the active role dashboards and contain sample data; they are visual references, not finished operational screens.

Ten destinations currently resolve to the not-implemented screen:
- Director: branches, notifications, settings.
- Manager: manager-notifications.
- Cashier: reconciliation.
- Store manager: recipes, suppliers, deliveries, reorder.
- Car wash manager: attendants.

Other destinations have a screen but lack their own focused workflow:
- Manager orders and kitchen share the orders form/table.
- Cashier payment ledger, cash payment, M-Pesa, receipts and shift summary share Payments.
- Stock overview, ingredients, receiving, adjustments, low-stock, stock counts and reports share Inventory, with history as its one separate variant.
- Car wash overview, new wash, active bays, payments, history, pending confirmations, summary and reports share Carwash.
- Generic staff/configuration pages mainly provide add forms and tables; they need detail/edit interactions appropriate to each resource.

## Account checklist

### Director
- Refine executive overview into revenue trends, business-unit comparisons and actionable alerts using the established visual design.
- Staff directory with search, role filters, staff details and edit/deactivate states.
- Branch list/detail and branch settings UI.
- Notifications inbox, filters and read/unread states.
- Business, receipt, tax and account settings sections; represent the agreed 16% inclusive VAT accurately.
- Audit filters and readable before/after record detail.
- Make secondary administration screens discoverable without changing the six primary sidebar destinations.

### Manager
- Dedicated order pipeline and kitchen queue, with ticket detail, notes, elapsed-time presentation and status-action UI.
- Staff directory/detail and clearly separated optional shift/performance preview.
- Printer cards/details with setup validation and test/retry result states; do not claim physical connectivity from configuration alone.
- Menu search/category filters, photo preview/fallback and food detail/edit polish.
- Notification inbox and approval detail states.

### Waiter
- Table availability overview and clearer selected-table state.
- Open-bill search/filter, bill detail and order progress presentation.
- Compact menu/cart/review refinements and missing/broken-photo fallbacks.
- History search/date filters and receipt/bill detail access.
- Clear request-pending, rejected, offline, retry and submission-confirmed states.

### Cashier
- Dedicated checkout layout: bill selection, item/tax detail and payment panel.
- Cash received/change preview with validation.
- Separate cashless confirmation queue and reference detail.
- Receipts browser, preview, reprint and print stylesheet.
- Shift summary and cash reconciliation UI with counted/expected/difference states.

### Store manager
- Dedicated stock overview: levels, low-stock, recent movements and quick actions.
- Separate ingredient catalog, receiving form, adjustment/wastage form and stock-count worksheet.
- Supplier directory/details, delivery list/details, recipe editor and reorder worksheet.
- Inventory report screens with filters and export states.

### Car wash manager
- Dedicated overview and bay board with available/occupied states.
- New wash flow for vehicle, service, bay and attendant.
- Separate active jobs, history, payments and pending confirmations.
- Attendant directory and service/bay edit details.
- Daily summary and car-wash-specific report layouts.

## Shared completion criteria

- Every navigation destination renders a purposeful screen; intentional aliases are documented.
- Main actions open the correct form/detail/dialog and support cancel, validation and success/error feedback.
- Loading, empty, failed-request, unavailable and permission-denied states are designed.
- Consistent titles, spacing, tables, pagination, search, filters, status labels and confirmations.
- Keyboard access, focus management, labelled controls and readable contrast; retain waiter touch targets.
- Mobile layouts and local table scrolling without page overflow; receipt printing remains usable.
- Preview-only interactions are visibly labelled and separate from real records. Existing working operations remain live.
- Review representative populated and empty screens at 390, 820, 1366 and 1536 pixels.
- Final route audit, interaction tests and production build pass before backend expansion.

## Recommended implementation sequence

1. Manager + waiter + cashier: finish the restaurant journey from menu/table setup through ordering, kitchen, checkout and receipt.
2. Store manager: complete stock screens and their distinct navigation.
3. Car wash manager: complete the bay/job/payment journey.
4. Director: finish management/configuration screens and consolidate reporting views.
5. Shared notifications/settings where appropriate, accessibility, responsive/print checks and final acceptance review.

Deliver each phase as reviewable screens with a written list of required future API fields/actions. No backend expansion is part of this frontend-only plan.

## Verification and theme update — 1 October 2026

The original dark-green theme is restored at the user's request. Compact spacing and the new frontend screens are retained. Removed light-theme overrides; shared dialog, board and preview styles now live in frontend/src/workspace-components.css.

Completed verification: 81 frontend tests passed, production build passed, and Chrome checked all 71 routes at laptop and phone widths (142 route checks) without page overflow or not-implemented screens. Waiter image sizing, touch targets, cart/review and manager dashboard checks passed as well. Browser data is fixture-based, not a production acceptance test.

Existing supported workflows remain connected to their APIs. Branches, notifications, settings, suppliers, deliveries, recipes, reorders, attendants, reconciliation, stock counts and the bay-assignment board are explicitly labelled frontend previews. Unsupported configuration edits are kept in a separate preview section. Preview data resets when leaving the page and does not change business records. Backend expansion was not performed in this pass.
