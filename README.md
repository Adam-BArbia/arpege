# Arpege – Angular E-Boutique (Deep-Dive Guide)

## What this is
An Angular 17 app using **standalone components** for a musical-instrument e-boutique. It provides:
- Public catalog (list/search/filter, client-side on the fetched list)
- Product detail pages resolved by route `:id`
- Shopping cart with reactive state
- Admin/manage screen for full CRUD
Data is served from a mock REST API powered by `json-server` reading `db.json`.

---

## How to run (dev)
1) Install deps: `npm install`  
2) Start mock API (json-server):  
   - Quick: `npx json-server db.json --port 3000`  
   - Or via the helper in `server.ts` (add a package script to call it)  
3) Start Angular app: `npm start` (or `ng serve`)  
4) Open: `http://localhost:4200`  

Assumed ports: frontend 4200, API 3000. If the API port changes, update the base URL in `ApiService` (hardcoded `http://localhost:3000` if not using environments).

---

## Angular CLI basics (original notes)
- Dev server: `ng serve` → http://localhost:4200/ (live reload).
- Scaffolding: `ng generate component|directive|pipe|service|class|guard|interface|enum|module`.
- Build: `ng build` → outputs to `dist/`.
- Unit tests: `ng test` (Karma).
- E2E: `ng e2e` (add an e2e runner first).
- Help: `ng help` or Angular CLI docs.

---

## High-level architecture
- **Framework**: Angular 17, **standalone components** (no NgModules).
- **Routing**: `src/app/app.routes.ts`, lazy-loading each standalone component via `loadComponent: () => import('...').then(c => c.YourComponent)`.
- **HTTP/Data**: `HttpClient` → `json-server` (`/instruments` endpoints; base URL hardcoded).
- **State**: Cart state in-memory with RxJS `BehaviorSubject` (`CartService`), no persistence on reload.
- **Styling**: Global `src/styles.css` + per-component CSS; catalog uses responsive grid/card layout.
- **Configs**: `angular.json`, `tsconfig*.json`, `.editorconfig`.
- **Backend mock**: `json-server` with `db.json`.

---

## Project structure (key files)
- `src/main.ts` – SPA bootstrap (`bootstrapApplication`).
- `src/main.server.ts` – SSR entry (optional here).
- `src/app/app.routes.ts` – route definitions.
- `src/app/app.component.*` – root shell with `<router-outlet>`.
- `src/app/core/models/instrument.model.ts` – Instrument interface.
- `src/app/core/services/api.service.ts` – REST API wrapper.
- `src/app/core/services/cart.service.ts` – Cart state & operations.
- Feature folders:
  - `home/*` – landing page.
  - `catalog/*` – list/search/filter + add-to-cart.
  - `product-detail/*` – product by ID + add-to-cart.
  - `cart/*` – cart view/manage.
  - `instrument-manage/*` – admin CRUD.
- `db.json` – mock data.
- `server.ts` – helper to start json-server.

---

## Data model
`src/app/core/models/instrument.model.ts`
```ts
export interface Instrument {
  id: number;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  category: string;
  stock: number;
}
```
`id` is managed by json-server. All API payloads conform to this shape.

---

## Services (core logic and specifics)

### ApiService — `src/app/core/services/api.service.ts`
Purpose: Single place for HTTP calls to the mock API (base URL typically `http://localhost:3000`).
- `getInstruments()` → GET `/instruments`
- `getInstrumentById(id)` → GET `/instruments/:id`
- `addInstrument(instrument)` → POST `/instruments`
- `updateInstrument(instrument)` → PUT `/instruments/:id`
- `deleteInstrument(id)` → DELETE `/instruments/:id`
Uses `HttpClient`, returns Observables. Error handling is minimal (subscribe error callbacks/console); no retry/backoff by default.

### CartService — `src/app/core/services/cart.service.ts`
Purpose: Keep cart state reactive and shareable.
- Internal cart item type: `{ instrument: Instrument; quantity: number }`
- Private `BehaviorSubject<CartItem[]>`; public `cart$` observable
- `addToCart(instrument)`: increment if exists, else add (no stock cap enforcement; can add beyond `stock` unless you add a guard)
- `removeFromCart(id)`: remove line
- `clearCart()`: empty cart
- `getTotal()`: sum of `price * quantity`
Why `BehaviorSubject`? It always holds/emits the latest value—ideal for header badges and cart page to stay in sync. Cart is in-memory; it resets on full page reload (no `localStorage` rehydrate).

---

## Routing
`src/app/app.routes.ts`
- `/` → Home
- `/catalog` → Catalog
- `/product/:id` → Product Detail (reads route param via `ActivatedRoute`; if id is invalid/missing, the fetch will fail—no explicit redirect)
- `/cart` → Cart
- `/manage` → Instrument Manage (CRUD)
- `**` → redirect to `/`
All routes lazy-load standalone components to keep bundles smaller.

---

## Feature components (behavior and implementation details)

### Home (`features/home/*`)
- Simple hero/landing with calls-to-action linking to catalog/cart.
- No data fetching.

### Catalog (`features/catalog/*`)
- On init: `api.getInstruments()` loads all instruments (client-side list kept in component).
- Search/filter: done client-side on the loaded array (string matching in component/template).
- Renders cards (name, image, price, category, stock); images bound via `[src]="instrument.imageUrl"` with alt text.
- Action: “Add to cart” → `cartService.addToCart(instr)`.

### Product Detail (`features/product-detail/*`)
- Reads `id` from route via `ActivatedRoute` (`paramMap`/`snapshot`).
- Loads item: `api.getInstrumentById(id)`; minimal error handling if not found.
- Displays image, description, price, category, stock.
- Action: add to cart.

### Cart (`features/cart/*`)
- Subscribes to `cartService.cart$` (reactive). Often uses manual subscribe & local array; totals from `cartService.getTotal()`.
- Shows lines with qty, line totals (`instrument.price * quantity`); grand total via service.
- Actions: remove line, clear cart, checkout placeholder.
- Quantity changes: add-to-cart increments; no direct quantity input.

### Instrument Manage (CRUD) (`features/instrument-manage/*`)
- Admin-like page to manage instruments.
- Loads list: `api.getInstruments()`.
- Add: `api.addInstrument`.
- Edit/Update: `api.updateInstrument`.
- Delete: `api.deleteInstrument`.
- After mutations, refreshes list (refetch) rather than optimistic local update.
- Form uses two-way binding for fields; basic validation (required) only; numeric fields rely on HTML input types.

---

## Global styles
- `src/styles.css` for base styling.
- Per-component `.css` for layout, cards, grids, buttons, responsiveness. Catalog uses responsive grid; cards use box shadows/borders.

---

## Mock backend (`json-server`)
- DB file: `db.json`.
- Run: `npx json-server db.json --port 3000`
- Endpoints:
  - GET `/instruments`
  - GET `/instruments/:id`
  - POST `/instruments`
  - PUT `/instruments/:id`
  - DELETE `/instruments/:id`
json-server auto-manages `id` and persists changes to `db.json`. `server.ts` can start it programmatically.

---

## Application data flow
1) Router navigates to a page.  
2) Component calls `ApiService` → HTTP → Observable emits data.  
3) Component binds data; template renders (`*ngFor`, property binding).  
4) User adds to cart → `CartService.addToCart` updates array + `BehaviorSubject`.  
5) Subscribers to `cart$` (cart page, header badge) re-render automatically.  
6) Admin CRUD → ApiService → json-server writes to `db.json`; catalog/manage can refetch.

---

## Configuration files
- `angular.json` – build/serve config (assets, budgets, output paths).
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json` – TypeScript configs.
- `.editorconfig` – formatting defaults.
- `.gitignore` – ignored files.

---

## Entry points
- `src/main.ts`: `bootstrapApplication(...)` for the browser SPA.
- `src/main.server.ts`: server entry (SSR support; optional for dev).

---

## Operational nuances and current gaps
- No cart persistence: a full reload clears cart state. To persist, sync `cart$` to `localStorage` and rehydrate on init.
- No stock guard: cart can exceed available `stock`; add checks in `addToCart`.
- Error handling is minimal (console/subscribe errors). Add UI toasts/spinners and `catchError`.
- No trackBy in `*ngFor`; add `trackBy` for large lists.
- No currency/locale pipe is applied; add `| currency` for prices if desired.
- No quantity adjuster in cart; only add/remove/clear.
- CRUD feedback is minimal; add success/error toasts and disable buttons while saving.
- Forms rely on basic HTML validation; add Angular validators for price/stock (min/required).

---

## Possible improvements
- Persist cart to `localStorage`.
- Add loading and error states; toasts/snackbars.
- Category filters, pagination, sorting.
- Route guard for `/manage`.
- Strong form validation (required, min/max) for manage forms.
- Unit tests for `ApiService`, `CartService`, and feature components (mock HttpClient).
- Skeleton loaders for catalog/detail.
- Extract API base URL to environment configs.

---

## File-by-file quick reference
- `src/app/core/models/instrument.model.ts` — data shape.
- `src/app/core/services/api.service.ts` — REST calls (base URL, CRUD).
- `src/app/core/services/cart.service.ts` — cart state, `cart$`, add/remove/clear, total; cart item shape `{ instrument, quantity }`.
- `src/app/app.routes.ts` — route map with lazy `loadComponent`.
- `src/app/app.component.*` — shell + router outlet.
- `features/home` — landing.
- `features/catalog` — list/filter + add-to-cart (client-side filter).
- `features/product-detail` — load by `:id`, show, add-to-cart.
- `features/cart` — reactive cart view, remove, clear, total.
- `features/instrument-manage` — CRUD via ApiService, refetch after mutations.
- `db.json` — mock data for json-server.
- `server.ts` — helper to start json-server.

---

## Architectural rationale (extra detail)
- **Standalone components** reduce NgModule boilerplate and simplify per-route lazy loading.  
- **BehaviorSubject for cart** gives immediate current state and broadcasts every change—keeps header badges and cart view consistent without extra state libs.  
- **json-server** mirrors a typical REST backend quickly; CRUD maps directly to HTTP verbs.  
- **Separation of concerns**: ApiService encapsulates HTTP; CartService encapsulates state; feature components focus on UI/UX.
