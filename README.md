# Rakhi — Thread of Love (MERN Stack + Admin Panel)

A full-featured MERN e‑commerce app: storefront (browsing, cart, wishlist, guest &
account checkout, order history) plus a secure, role-based **Admin Panel** for
running the store.

## Admin Panel feature checklist

| Section | Status |
|---|---|
| Dashboard (all metrics: products, categories, orders, customers, order-status breakdown, revenue, low stock, recent orders, best sellers) | ✅ |
| Category management (CRUD, enable/disable, image, description, SEO, display order) | ✅ |
| Product management (CRUD, duplicate, enable/disable, featured/new/best-seller flags, SKU/brand, pricing, tax, images with reorder + featured image, variants, sizes with per-size stock, display toggles) | ✅ |
| Customer management (view/search, edit, disable, order history, addresses) | ✅ |
| Order management (view/search/filter by status/payment/date/customer, full status lifecycle, accept/reject, tracking/courier, print invoice/label, manual refund) | ✅ |
| Inventory management (stock levels, low-stock alerts, manual stock adjustment with history) | ✅ |
| Coupons & discounts (percentage/fixed, dates, usage limits, min purchase) | ✅ |
| Banner management (hero slider/promo, desktop+mobile images, scheduling fields, ordering) | ✅ |
| Reviews management (approve/reject/delete/reply) | ✅ |
| Reports & analytics (sales, best sellers, inventory, customers — JSON + CSV export) | ✅ |
| Website settings (store info, logo/favicon, socials, footer, policies) | ✅ |
| User & role management (Super Admin/Admin/Store Manager/Order Manager, per-section permission overrides) | ✅ |
| Notifications (new order, low/out of stock, cancelled/returned) | ✅ |
| Security (JWT auth, bcrypt password hashing, RBAC, activity log, account disabling) | ✅ |

Things intentionally **not** built (flagged in the spec as "Future Enhancements", or
needing a third-party account this sandbox can't provision): live payment gateway
integration, shipping-partner APIs, GST invoice generation, product comparison, gift
cards, loyalty program, push notifications, a native mobile admin app, and AI
recommendations. Email/SMS notifications on order-status change are stubbed with a
code comment showing exactly where to wire in a provider (SendGrid/Twilio/etc).

## Project structure

```
rakhi-mern/
├── backend/
│   ├── middleware/
│   │   ├── auth.js         protect / optionalAuth (JWT)
│   │   ├── adminAuth.js     requireAdmin / requirePermission (RBAC) / logActivity
│   │   └── upload.js         multer image uploads -> /uploads
│   ├── models/               User(+role/permissions), Product(+variants/images),
│   │                          Category(+SEO), Order(+status lifecycle), Address,
│   │                          Coupon, Banner, Review, Setting, Notification,
│   │                          ActivityLog, StockHistory, Newsletter
│   ├── routes/                storefront: products, categories, auth, addresses,
│   │                          orders, users, newsletter, upload
│   │   └── admin/              dashboard, categories, products, customers, orders,
│   │                          coupons, banners, reviews, settings, reports,
│   │                          notifications, staff
│   ├── seed/                  seed.js (catalog), seedAdmin.js (first admin login)
│   └── server.js
└── frontend/
    └── src/
        ├── context/            AuthContext, CartContext (storefront)
        ├── pages/               storefront pages
        ├── components/          storefront components + StorefrontLayout
        └── admin/
            ├── context/AdminAuthContext.jsx   separate admin login/session + can()
            ├── api/adminApi.js                 every admin endpoint
            ├── components/                     AdminLayout, Modal, Badge, etc.
            └── pages/                          Dashboard, Categories, Products
                                                  (+ ProductFormPage), Customers,
                                                  Orders (+ OrderDetailPage), Coupons,
                                                  Banners, Reviews, Reports, Settings,
                                                  Staff (+ activity log)
```

## 1. Docker setup

This repo is already configured for Docker Compose. It starts three containers:

- `mongo` for the database
- `backend` for the API
- `frontend` for the built React app served by nginx

### Prerequisites

- Install Docker Desktop
- Make sure `docker` and `docker compose` work in your terminal
- Create a root `.env` file from [`.env.example`](/E:/Project/rakhi-mern/.env.example)

At minimum, set:

```env
JWT_SECRET=your_long_random_secret
CLIENT_URL=http://localhost:8080
```

### Start the project

Run this from the project root:

```bash
docker compose down
docker compose up --build --force-recreate
```

If this is the first time you are starting it, seed the database after the
containers are up:

```bash
docker compose exec backend npm run seed
docker compose exec backend npm run seed:admin
docker compose exec backend npm run seed:extras
```

### Important Docker notes

- In Docker, MongoDB must use `mongodb://mongo:27017/rakhi_store`
- Do not use `127.0.0.1` for `MONGO_URI` inside `docker-compose.yml`
- If you change Docker config, recreate the containers
- If the site loads but shows empty categories/products/banners, seed the database
- `304` in the browser network tab is usually cache, not an API failure

### URLs

- Storefront: `http://localhost:8080`
- Admin panel: `http://localhost:8080/admin/login`
- Backend API: `http://localhost:5000`

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# set MONGO_URI, a real JWT_SECRET, and optionally SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD
npm run seed          # storefront categories & products
npm run seed:admin     # creates your first Super Admin login
npm run seed:extras     # dummy coupons, banners, reviews, and a few sized/variant products
npm run dev             # http://localhost:5000
```

`seed:extras` layers on top of `seed` (it doesn't wipe your catalog) and gives you
something to actually click through: 7 coupons covering every validation path
(percentage/fixed, category-restricted, min-purchase, expired, not-yet-active,
usage-limit-maxed-out), 4 banners (2 hero slider + 2 promo, using inline SVG
placeholders so there's no external image dependency), a handful of reviews in
different moderation states, and sizes/variants added to 3 existing products
(including one out-of-stock size and one variant with a price override) so you
can actually exercise per-size stock limits and live variant pricing in the UI.
Coupon codes: `WELCOME10`, `FLAT100`, `JEWELS15`, `RAKHI2026`, `VIP500` (maxed
out on purpose), `EXPIRED10`, `COMINGSOON25` (not active yet).

`npm run seed:admin` prints the admin email/password it created (defaults to
`admin@rakhi.com` / `Admin@123` unless overridden in `.env`) — **change this password
after your first login.**

Uploaded images are written to `backend/uploads/` and served at `/uploads/<file>`.

## 2. Frontend setup

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

- Storefront: `http://localhost:5173/`
- Admin Panel: `http://localhost:5173/admin/login`

## 3. Roles & permissions

| Role | Default access |
|---|---|
| Super Admin | Everything, including Staff & Roles and the activity log |
| Admin | Products, Categories, Orders, Customers, Reports, Settings |
| Store Manager | Products, Categories, Reports (no Orders/Customers) |
| Order Manager | Orders, Customers only |

A Super Admin can override any staff member's per-section permissions individually
from **Staff & Roles**. The sidebar, route guards, and the backend's
`requirePermission` middleware all read from the same permission set, so hiding a
link in the UI is backed by an actual 403 on the API if bypassed.

## 4. Manual test checklist (admin panel)

1. Log in at `/admin/login` with your seeded Super Admin account
2. **Dashboard** — confirm the metric cards and recent orders/best sellers populate
3. **Categories** — add one, edit its SEO fields, disable it, confirm it disappears from the storefront's category grid
4. **Products** — add a product with a couple of uploaded images, a variant, and a size list with stock; enable "Show Size Dropdown" in Display and confirm the storefront product page shows size buttons that respect per-size stock
5. **Inventory** — use "Quick Stock Adjustment" on a product, then check its stock history
6. **Orders** — place an order from the storefront, then find it in the admin Orders list, accept it, update its status, add tracking, and try "Print Invoice"
7. **Coupons / Banners / Reviews / Settings / Reports** — create/edit an entry in each and confirm it persists after a refresh
8. **Staff & Roles** (Super Admin only) — create a Store Manager account, log in as them in a separate browser/incognito session, and confirm they can't reach Customers or Orders

## 5. Per-size stock enforcement, coupons at checkout, and automated tests

Three additions on top of the admin panel:

- **Per-size stock enforcement.** Previously stock was only tracked/decremented at
  the product level, so a size marked "0 left" could still be ordered. Order
  creation (`backend/routes/orders.js`) now validates and atomically decrements
  `product.sizes[].stock` for sized items (via `$elemMatch` + conditional `$inc`,
  so concurrent orders can't oversell), with automatic rollback of every item
  already decremented in the same order if a later item in the cart fails.
- **Coupons at checkout.** Admin could always create coupon codes, but there was
  nowhere for a customer to enter one. `CheckoutPage` now has a coupon input;
  `POST /api/coupons/validate` previews the discount (category/product
  restrictions, min purchase, expiry, usage limit all enforced), and
  `POST /api/orders` re-validates and atomically claims a usage slot server-side
  at the moment the order is actually placed — a discount amount is never trusted
  from the client.
- **Automated tests.** `backend/server.js` was split into `app.js` (the Express
  app + all routes, importable with no DB connection or `.listen()`) and a thin
  `server.js` runtime entrypoint, so the app can be driven directly with
  `supertest` in tests. Test suite uses **Vitest + Supertest + mongodb-memory-server**
  (an isolated in-memory MongoDB per test file, wiped between tests):

  ```bash
  cd backend
  npm install
  npm test          # or `npm run test:watch`
  ```

  Coverage focuses on the bugs this project actually hit, since those are the
  ones worth guarding against regressing:
  - `tests/categories.test.js` — the public `/api/categories*` routes must never
    require auth (direct regression test for the day these got accidentally
    swapped with the admin-protected version and the storefront nav started
    401'ing)
  - `tests/order-variants.test.js` — two different sizes/colors of the same
    product must stay as separate order line items, not silently merge
  - `tests/stock.test.js` — per-size stock is enforced, and a real concurrency
    test (two orders racing for the same limited stock via `Promise.all`)
    confirms the atomic decrement actually prevents overselling
  - `tests/coupons.test.js` — discount calculation, expiry/usage-limit/min-purchase
    rejection, and that an invalid coupon blocks order creation entirely
  - `tests/auth.test.js` — register/login/disabled-account/unauthenticated-access

  **I could not execute this suite in the sandbox I built it in** — `mongodb-memory-server`
  needs to download a real MongoDB binary from `fastdl.mongodb.org` on first run,
  and that domain isn't reachable from this environment (confirmed: the test
  runner itself works fine — all 5 files load and Vitest correctly discovers every
  test — the failure is specifically the binary download, a 403 from a domain
  this sandbox can't reach). This should work without any changes on a normal dev
  machine with internet access; the first `npm test` run will take longer while
  it downloads and caches the MongoDB binary (subsequent runs are fast). Please
  run it and let me know if anything actually fails once it can run for real.



- **Category hierarchy / submenus (new):** Categories now support a `parent` field, so
  you can sell multiple product lines from one store (e.g. Rakhi, Jewellery, Ladies
  Wear, Gents Wear, Kids Wear) with subcategories nested underneath each. In
  **Admin → Categories**, leave "Parent Category" as "None" for a main menu item, or
  pick a parent to nest it as a submenu item. The storefront header reads
  `GET /api/categories/tree` and renders top-level categories with a hover dropdown
  (desktop) / accordion (mobile) showing their subcategories. Filtering by a
  parent category on the shop page automatically includes products from all of its
  subcategories too (see `Category.getSelfAndDescendantIds` in
  `backend/models/Category.js`).
  - **Existing data is unaffected** — `parent` defaults to `null`, so categories you
    already created stay exactly as top-level items. You don't need to re-seed; you
    can restructure live via the admin panel by adding new parent categories and
    reassigning existing ones under them.
  - Re-running `npm run seed` is destructive (it wipes categories/products) but now
    seeds a worked example: a "Rakhi" parent wrapping the original rakhi
    subcategories, plus new Jewellery / Ladies Wear / Gents Wear / Kids Wear parents
    with their own subcategories and sample products — useful as a reference for
    building out your own hierarchy.
- **No live payment gateway** — payment method is recorded, not charged.
- **Email/SMS on order-status change is stubbed** — see the comment in
  `backend/routes/admin/orders.js` for where to plug in a provider.
- **This project was built and syntax/import-checked in a sandbox with no MongoDB
  available**, so admin routes haven't been exercised against a live database.
  During review I found and fixed one real bug this way: a permission-check helper
  compared object key counts instead of checking for a `true` value, which would
  have silently blocked non-Super-Admin roles from any section. Please run the
  manual test checklist above against your own MongoDB before treating this as
  production-ready, and let me know what turns up.

## 6. Deploying to production

The project is set up for two deployment paths — pick whichever fits.

### Option A: Docker Compose (simplest — one command, works on any VPS/server)

```bash
cp .env.example .env
# edit .env — set a real JWT_SECRET at minimum

docker compose up -d --build

# one-time: seed the catalog and create your first admin login
docker compose exec backend npm run seed
docker compose exec backend npm run seed:admin
```

Visit `http://localhost:8080` (storefront) and `http://localhost:8080/admin/login`
(admin panel). This setup runs three containers — MongoDB, the API, and an nginx
container serving the built frontend that also reverse-proxies `/api` and
`/uploads` to the backend — so everything is same-origin and there's nothing
else to configure. `backend/uploads` is a named Docker volume, so uploaded
images survive container restarts and redeploys.

To actually go live, put this behind a real reverse proxy (Caddy, nginx, or
your cloud provider's load balancer) for TLS/HTTPS, point your domain at it,
and set `CLIENT_URL` in `.env` to that real domain.

### Option B: Separate platform deploys (backend on Render/Railway, frontend on Vercel/Netlify, DB on Atlas)

1. **MongoDB Atlas** — create a free cluster, grab the connection string for `MONGO_URI`.
2. **Backend** (Render, Railway, Fly.io, etc.) — deploy the `backend/` folder.
   Set the environment variables from `backend/.env.example` (`MONGO_URI`,
   `JWT_SECRET`, `CLIENT_URL` = your frontend's deployed URL, and the `S3_*`
   variables — see below on why those matter here specifically). Build
   command: `npm install`. Start command: `npm start`.
3. **Frontend** (Vercel, Netlify, Cloudflare Pages, etc.) — deploy the
   `frontend/` folder. Build command: `npm run build`, output directory:
   `dist`. Set `VITE_API_URL` to your backend's deployed URL + `/api`
   (e.g. `https://rakhi-api.onrender.com/api`) as a build-time environment
   variable — the frontend and backend are on different origins here, so the
   dev-mode relative `/api` path won't resolve.
4. **File uploads matter here.** Most PaaS hosts (Render, Railway, Heroku, Fly)
   use an ephemeral filesystem — anything `multer` writes to `backend/uploads/`
   disappears on the next deploy or restart. Set the `S3_*` environment
   variables (works with real AWS S3 or any S3-compatible provider — Cloudflare
   R2 and DigitalOcean Spaces both have generous free tiers) so uploaded
   product/banner images actually persist. Local disk without a persistent
   volume will silently lose every uploaded image on your next deploy.

### Environment variable reference

All variables are documented inline in `backend/.env.example`,
`frontend/.env.example`, and the root `.env.example` (used by Docker Compose).
The only two the backend refuses to start without are `MONGO_URI` and
`JWT_SECRET` — everything else (SMTP, S3) degrades gracefully when unset
(emails/cloud uploads just silently no-op / fall back to local disk).

### What's already hardened for production

- **Security headers** via `helmet`
- **Rate limiting** — tighter limits specifically on `/api/auth/login` and
  `/api/auth/register` (brute-force protection), a gentler global limit on
  everything else
- **NoSQL injection protection** via `express-mongo-sanitize`
- **Response compression** via `compression`
- **CORS locked to explicit origin(s)** from `CLIENT_URL` (comma-separated if
  you need more than one) — no wildcard in a real deployment
- **`GET /api/health`** — returns 200/`{status:"ok"}` when the DB is connected,
  503 otherwise; wire this into your platform's health check / Docker's
  `HEALTHCHECK` / a k8s liveness probe
- **Graceful shutdown** — `SIGTERM`/`SIGINT` close the HTTP server and the
  MongoDB connection cleanly instead of dropping in-flight requests; uncaught
  exceptions and unhandled promise rejections are logged and trigger a clean
  shutdown instead of leaving the process in an unknown state
- **Fail-fast startup** — refuses to boot at all if `MONGO_URI`/`JWT_SECRET`
  are missing, rather than starting and failing mysteriously on the first
  request that needs them
- **No stack traces or internal error details leak to clients** when
  `NODE_ENV=production`
- **CI** (`.github/workflows/ci.yml`) — runs the backend test suite and builds
  both frontend and backend on every push/PR to `main`. Note: this only works
  once pushed to GitHub — GitHub-hosted runners have normal internet access,
  so `mongodb-memory-server`'s binary download (which is blocked in the
  sandbox this project was built in) will work fine there.

### What's still on you before a real launch

- **A real payment gateway** — Card/UPI/COD are currently just labels; nothing
  is actually charged (Razorpay is the standard choice for an India-based
  store like this)
- **A production SMTP provider** for order invoice emails (SendGrid, Postmark,
  Amazon SES, etc. — anything that supports plain SMTP works with the existing
  `SMTP_*` config)
- **Monitoring/error tracking** (Sentry or similar) — errors are currently only
  `console.error`'d, which most platforms capture in their log viewer, but
  nothing alerts you proactively
- **A real domain + TLS certificate** in front of whichever hosting option you pick

## 7. Forgot / reset password

Both customer and admin accounts (same `User` model, same login endpoint) now
have a full password recovery flow:

- `/forgot-password` — enter an email, get a reset link. The API always
  returns the same generic response whether or not the account exists, so
  this can't be used to check which emails are registered.
- The reset link (`/reset-password/:token`) is valid for **1 hour** and can
  only be used **once** — the token is stored server-side as a SHA-256 hash
  (never the raw token) and cleared immediately after a successful reset.
- A successful reset logs the user straight back in. Since customer and admin
  sessions are stored under different `localStorage` keys and read by two
  independent auth contexts, `ResetPasswordPage` checks the account's role
  and routes a successful admin reset to `/admin`, everyone else to `/`.
- **Requires SMTP to be configured** (`SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` in
  `backend/.env`) — without it, `sendMail` silently no-ops (same behavior as
  order invoice emails), so the reset token gets generated but the email
  never actually arrives. Worth testing this end-to-end with real SMTP
  credentials before relying on it.

## 8. Customer review submission

Admin has always been able to moderate reviews (approve/reject/reply), but
there was never anywhere for a customer to actually write one — that gap is
closed:

- `ProductDetailPage` now has a full reviews section: a star-rating +
  comment form for logged-in customers (guests are prompted to log in first
  — this ties reviews to an accountable identity and prevents anonymous
  spam), and a list of approved reviews below it.
- **One review per customer per product** — resubmitting updates their
  existing review instead of creating a duplicate, and always re-queues it
  for moderation, even if the previous version was already approved (so an
  edit can't silently bypass review after the fact).
- **Verified Purchase badge** — computed automatically by checking whether
  the reviewer has an order containing this product, not just self-reported.
- **`Product.rating`/`reviewCount` are now actually real**, computed live from
  approved reviews (`backend/utils/reviewStats.js`) any time a review is
  approved, rejected, or deleted — previously these were static numbers set
  once in seed data and never updated again regardless of what reviews
  existed.
- **Migration for existing data**: `npm run recalculate-ratings` reconciles
  any products whose `rating`/`reviewCount` still reflect the old fake seeded
  values rather than real approved reviews. Run this once after pulling this
  change if you have an existing database.

## 9. Guest order tracking

Building this surfaced a real gap flagged earlier in this project: guest
orders were viewable by anyone who had the order ID, with **no verification
at all**. That's fixed as part of this feature, not left as a side issue:

- `GET /api/orders/:id` now requires the requester to also supply the email
  used at checkout (`?email=...`) for any order that isn't tied to a logged-in
  account. Logged-in customers viewing their own orders are unaffected;
  authenticated admin/staff can still look up any order without the email
  param (they're already fully authenticated).
- New `/track-order` page — guest customers enter their Order ID + email to
  look up status, items, shipping address, and tracking info, reusing the
  same `OrderSummaryDetail` component the logged-in order page uses (so the
  two views can't quietly drift apart).
- The checkout confirmation screen now actually shows the Order ID (it
  previously only linked logged-in users to their order — guests had **no way
  at all** to find their order again after leaving the confirmation page)
  and points guests to `/track-order` instead.
- Fixed the Footer's "Track Order" link, which — like the rest of the footer's
  Quick Links — was a dead `href="#"` with no routing behind it at all.
- While extracting the shared `OrderSummaryDetail` component, also surfaced
  two things the original `OrderDetailPage` silently never displayed: applied
  coupon discounts and courier/tracking number, even though the `Order` model
  has carried both for a while.

7 new tests cover the access-control change specifically, since that's the
security-relevant part: no email → rejected, wrong email → rejected, correct
email (including case-insensitive matching) → allowed, admin bypass works,
and the existing logged-in-customer behavior is unchanged.
