# Manager dashboard layout

The manager landing route previously displayed the generic order form/table. It now renders a dedicated live operations dashboard matching the supplied reference structure: four summary cards, four order stages, kitchen attention, menu availability, staff activity and printer delivery status. The manager sidebar has Dashboard, Orders, Menu, Staff, Printers and Reports. Kitchen, tables, approvals and departments remain accessible.

Data comes from the existing authorized orders, menu, staff and departments APIs and refreshes every 15 seconds/on focus. The pipeline displays the oldest 100 open restaurant bills and identifies the cap. Links lead to the existing operational pages. No business records are changed by the dashboard.

Reference metrics without underlying tracking are not simulated: prep time displays unavailable; staff counts are enabled accounts rather than shifts; staff activity counts loaded open bills rather than ratings; printer configuration and delivery records are shown rather than unsupported online/device health claims. Kitchen attention uses bills opened over 15 minutes ago, clearly labelled. Car-wash service tickets are not included in the restaurant bill pipeline.

Validation: 65 frontend tests and production build passed. Chrome checked the dashboard at 1536x1024 and 390x844, confirming four stages, four cards, functional route links and no page overflow. Existing waiter and menu browser checks passed too. Screenshots use test fixtures and are in frontend/artifacts/manager-dashboard-*.png.
