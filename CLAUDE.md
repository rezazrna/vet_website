# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`vet_website` is a **Frappe (v12/13-era) custom app** implementing a veterinary clinic management system (reception, medical records, pharmacy, inventory, POS/cashier, purchasing, accounting). UI language is Indonesian; code identifiers mix English and Indonesian (`kasir` = cashier, `penerimaan` = reception, `hutang`/`piutang` = payable/receivable, `tindakan` = treatment, `rawat inap` = inpatient, `gudang` = warehouse, `racikan` = compounded medicine).

This repo is only the app — it must live inside a Frappe bench at `apps/vet_website` with a site that has it installed. All commands below are run from the **bench directory**, not this repo.

## Commands

```bash
bench start                                  # dev server (all workers)
bench --site <site> install-app vet_website
bench --site <site> migrate                  # apply doctype json changes to DB
bench --site <site> clear-cache              # after touching templates/hooks/www
bench build --app vet_website                # rebuild assets (rarely needed; see Assets)
bench --site <site> console                  # interactive python w/ frappe loaded
bench --site <site> mariadb                  # SQL shell

bench --site <site> run-tests --app vet_website
bench --site <site> run-tests --doctype "VetCustomerInvoice"
bench --site <site> run-tests --module vet_website.vet_website.doctype.vetcustomerinvoice.test_vetcustomerinvoice
```

There is no linter, formatter, or JS build config. Every `test_*.py` is an empty `unittest.TestCase` stub — there is effectively **no test coverage**; verify changes by exercising the UI.

## Architecture

Three layers, all inside `vet_website/`:

**1. Doctypes** — `vet_website/vet_website/doctype/<lowercasename>/` (~86 doctypes, all prefixed `Vet*`). Each has `.json` (schema), `.py`, `.js`, `test_*.py`.

The `Document` subclass in each `.py` is almost always `pass`. **All business logic lives in module-level `@frappe.whitelist()` functions in the same file**, called directly from the browser. There are no `doc_events`/controller hooks in `hooks.py`. Consequence: creating a record via `frappe.get_doc(...).insert()` bypasses all business logic (journal entries, stock moves, totals) — always go through the module functions.

Cross-doctype logic is wired by direct Python imports between doctype modules, e.g. `vetcustomerinvoice.py` imports from `vetoperation` (stock), `vetjournalentry` (accounting), `vetpetowner` (deposit/credit balance), `vetproductpack` (pricing). The biggest files (`vetcustomerinvoice.py` ~97KB, `vetpossessions.py`, `vetpetowner.py`, `vetpurchase.py`) are where the money/stock rules live — read the relevant function before editing, and grep for callers, since one action commonly fans out into invoice + journal + stock updates.

**2. Web pages** — `vet_website/www/main/<section>/<page>/` mapped 1:1 to URLs (`/main/kasir/pos-order`). Each page dir has:
- `index.py` — `get_context()`; near-universally just `no_cache = True` + redirect Guests to `/login`
- `index.html` — extends `templates/main.html`, sets `page_title`, renders one empty `<div id="...">` and `<script type="text/babel">` tags
- `*-babel.js` — the actual page: React class components, **transpiled in the browser by babel-standalone at runtime**

`www/pos/` is a separate full-screen POS SPA (extends `templates/main_pos.html`), gated on an in-progress `VetPosSessions` for the current user.

**3. Shared assets** — `vet_website/www/static/src/`: `js/vet.js` (jQuery helpers + `checkPermission`), `js/sidebar.js`, and shared babel components (`filter-babel.js`, `search-bar-babel.js`, `pagination-babel.js`, `record-navigator-babel.js`). Loaded via `web_include_css`/`web_include_js` in `hooks.py`, which also pulls React 16, babel-standalone, moment, Chart.js, xlsx, html2canvas, jspdf from CDNs.

### Assets are not built

`*-babel.js` files are served as-is and compiled client-side. Editing one takes effect on reload with no build step — but syntax errors are silent-ish (check the browser console), and the CDN dependency means the app needs internet access. `www/static/src/js/html2pdf.js` is vendored.

### Frontend ⇄ backend convention

The frontend calls whitelisted functions by full dotted path:

```js
frappe.call({
  method: "vet_website.vet_website.doctype.vetproduct.vetproduct.get_product_list",
  args: { filters: JSON.stringify(filters) },
  callback: r => { ... }
})
```

Most doctypes expose the same function family: `get_<x>_list(filters)`, `get_name_list(filters)`, `get_<x>_form(name)`, `new_<x>(data)`, `edit_<x>(data)`, `delete_<x>(data)`. `filters` and `data` arrive as **JSON strings** and are `json.loads`-ed inside. The list functions take `{filters: [...], sorts: [...], currentpage: n, search: "..."}`, hardcode `page_length=10`, and return `{'<items>': [...], 'datalength': n}`. They return `{'error': ...}` dicts rather than raising. Follow this shape for new endpoints — the shared pagination/filter/search components depend on it.

### Permissions

Frappe's own doctype permissions are minimal (`System Manager` only). Real access control is a custom layer: `VetRole` → `VetRolePermission` (per-`doctype_table` read/write/create/delete plus a comma-separated `extra_permission` string) → `VetRoleUser`. Enforced **client-side** in `vet.js` (`checkPermission(doctype, user, access)`) and `sidebar.js` (`checkAvailableMenu` hides menu items), with `System Manager` short-circuiting to allow-all. Treat this as UI gating, not a security boundary.

### Navigation

The sidebar is hardcoded HTML in `vet_website/templates/main.html`; each link carries `data-doctype="Vet..."` used for permission-based hiding. **A new page must be added there manually** or it will be unreachable.

### Server-rendered fragments

Some forms build HTML on the server: `frappe.render_template('templates/customer_invoice/invoice_line_list2.html', {...})` returns a `{'render': html}` string the frontend injects. Those templates live in `vet_website/templates/{customer_invoice,grooming,reception,rekam_medis}/`. Note the `*2.html` variants (`customer_invoice_form2.html`, `invoice_line_list2.html`) are the newer live ones — check which is actually referenced before editing.

### Accounting & stock

Journals: `VetCoa` (chart of accounts) → `VetJournal` → `VetJournalEntry` → `VetJournalItem`. Invoices/purchases/POS call `new_journal_entry(...)` and `set_journal_item_total(...)` as side effects; report pages (trial balance, balance sheet, P&L, general ledger) aggregate these.

Stock: `VetOperation` + `VetOperationMove` are the movement documents; `VetProductQuantity` holds per-warehouse quantity and valuation. `action_receive` / `action_send` / `increase_product_valuation` / `decrease_product_valuation` in `vetoperation.py` are the only correct ways to change stock.

### Document naming is runtime-mutable

Settings lets users change autoname formats. `methods.edit_doctype_autoname()` writes the new `autoname` to both the DB and **the doctype's `.json` file on disk**, then reloads the doctype. So `autoname` diffs in doctype JSON can be produced by the running app, not by a developer.

### Migration/import

`vet_website/www/static/migration/*.csv` are seed/import fixtures driven from the Settings → Migration page via Frappe's `start_import` (imported with a try/except fallback between `data_import_beta` and `data_import` for version compatibility).

## Gotchas

- `patches.txt` is empty and `hooks.py` has no scheduler events, doc events, or overrides — nearly everything is commented-out boilerplate. The only active hooks are `web_include_css`, `web_include_js`, `get_website_user_home_page`.
- `vetcustomerinvoice.py` contains references to ERPNext's `Sales Invoice` (`frappe.get_doc("Sales Invoice", ...)`) alongside `VetCustomerInvoice` — a partial, inconsistent migration. Check which one a given code path uses.
- `__pycache__` directories are committed throughout, and there are stray editor backup files (e.g. `.~c9_invoke_*.py` next to `vetcustomerinvoice.py`). Don't treat them as source; don't add new ones.
- Timezone is hardcoded `Asia/Jakarta` in several places (`methods.get_current_datetime`).
- Indentation in Python files is inconsistent (tabs in some functions, 4 spaces in others, sometimes within one file). Match the surrounding function.
