# Ninja Wear — Sprint 2 Specification: Security Hardening, Customer Account Dashboard & UX Polish

## 1. Context & Current Architecture State

You are acting as a **Senior Full-Stack Engineer and Product Designer** working on **Ninja Wear** (`/projects/projects/React/my-website`), a React 19 + Vite 8 + Tailwind CSS v4 + React Router v7 + Supabase streetwear Print-on-Demand storefront.

A recent comprehensive technical audit verified that Phases 1–7 of the initial migration are complete, including unified authentication (`src/context/AuthContext.jsx`), granular RBAC (`src/data/permissions.js` + `supabase/migrations/20261117000000_auth_rbac_customer_accounts.sql`), the interactive 4-step studio (`/custom`), and the admin workspace (`/admin`).

**Your objective in this sprint** is to execute 5 high-impact upgrades that close all remaining security/functional gaps (P0 & P1), introduce a full **Customer Account Dashboard (`/account`)**, upgrade checkout address handling in `/cart`, and elevate visual typography and code hygiene.

### Key Architectural Constraints to Respect
1. **Unified Auth & RBAC (`src/context/AuthContext.jsx`):**
   - Roles are `'super_admin' | 'admin' | 'user'`.
   - Account statuses are `'active' | 'frozen' | 'banned'`.
   - `banned` users are signed out immediately upon profile fetch.
   - `frozen` users can browse and view their account, but cannot place new orders (enforced both in UI and via Supabase RLS `public.is_account_active(auth.uid())`).
2. **Bilingual Parity (EN LTR / AR RTL):**
   - Every new page, modal, label, validation error, and toast message MUST be added to both `en` and `ar` dictionaries in `src/data/translations.js` and render cleanly in both `dir="ltr"` and `dir="rtl"`.
3. **Zero Regressions:**
   - Ensure `npm run lint` passes with **0 errors and 0 warnings**, and `npm run build` succeeds cleanly.

---

## 2. Phase 1: Critical Security Hardening & Repository Hygiene (P0)

### 2.1 Remove `SUPABASE_API_` Prefix Leak Risk
* **File:** `vite.config.js`
* **Action:** Change `envPrefix: ['VITE_', 'SUPABASE_API_']` to `envPrefix: ['VITE_']`. Never expose non-`VITE_` environment variables to the client bundle.

### 2.2 Create `.env.example` & Update `README.md`
* **Create `.env.example`:**
  ```env
  VITE_SUPABASE_URL=https://your-project-ref.supabase.co
  VITE_SUPABASE_API_KEY=your-supabase-anon-public-key
  VITE_WHATSAPP_NUMBER=201000000000
  ```
* **Update `README.md`:** Document the current Ninja Wear architecture, the 3 RBAC roles (`super_admin`, `admin`, `user`), granular permissions (`orders.view`, `orders.edit`, `pricing.manage`, `catalog.manage`, `collections.manage`, `customers.view`, `customers.manage`, `team.manage`), and note that authenticated active accounts are required for checkout and custom file uploads.

### 2.3 Database Migration for Catalog RLS, Secondary Phone & Server-Side Order Pricing
* **Create Migration File:** `supabase/migrations/20261118000000_catalog_rls_and_customer_profile.sql`
* Include the following SQL definitions:
  1. Enable RLS and add `public_read` (`FOR SELECT USING (true)`) and permission-gated `staff_write` policies on `apparel_products` (`catalog.manage`), `design_collections` (`collections.manage`), `print_options` (`pricing.manage`), and `logo_options` (`pricing.manage`).
  2. Add `secondary_phone TEXT` column to `public.profiles` (`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS secondary_phone TEXT;`).
  3. Create a `SECURITY INVOKER` (or `SECURITY DEFINER` with strict `auth.uid()` check) RPC function `public.submit_customer_order` that:
     - Verifies `auth.uid() IS NOT NULL` and `public.is_account_active(auth.uid())`.
     - Validates each cart item against live prices in `apparel_products`, `print_options`, and `logo_options` (computing `unit_price = base_price + print_price + logo_price` and `total_price = unit_price * quantity` server-side for standard items so `total_price` cannot be spoofed via browser DevTools).
     - Inserts all order rows with a shared `cart_group_id` and returns the created `cart_group_id`.
* **Update `src/services/apparelService.js`:** Update `submitCartOrder` to call `supabase.rpc('submit_customer_order', ...)` (with graceful fallback/error handling) and update `AuthContext.jsx` profile type/queries to include `secondary_phone`.

---

## 3. Phase 2: Customer Account Dashboard (`/account`)

Build a comprehensive, high-craft **Customer Dashboard** so every registered user can track their orders in real time and manage their personal info, phones, address, and password.

### 3.1 Routing & Navigation Integration
* **Create Page:** `src/pages/public/Account.jsx` (lazy-loaded in `src/App.tsx` / `src/App.jsx` under `/account`).
* **Route Protection:** If `!loading && !user`, redirect to `/login?redirect=/account`.
* **Navbar (`src/componants/NavBar.jsx`):**
  * When `user` is authenticated, display a clear **`My Account` / `حسابي`** link (with user icon) in both desktop and mobile navigation menus, next to the Logout button.
  * If `isStaff` (`admin` or `super_admin`), keep a quick link to `/admin` alongside `/account`.

### 3.2 Account Page Layout & 3 Core Sections
Design `/account` using the Ninja Wear dark obsidian card aesthetic (`#0A0A0A` background, `#121214` cards, `1px solid #222226` borders, `#FF5A36` / coral-red accents). Include a top profile summary header (Avatar initial badge, Full Name, Email, Account Status badge: `Active` or `Frozen` warning banner if frozen) and 3 clean tabs/sections:

#### Tab 1: `My Orders & Production Tracker` (`طلباتي ومتابعة التنفيذ`)
* Fetch all orders for the current user (`user_id = user.id`), grouped by `cart_group_id`, ordered by `created_at DESC`.
* For each Order Group card, display:
  * **Header:** Short Order Reference (`#XXXXXXXX`), Order Date (formatted via `Intl.DateTimeFormat`), Total Price (`EGP {sum}`), and Overall Status Badge.
  * **Visual 5-Step Production Progress Bar:**
    Render a horizontal step tracker (responsive vertical/compact on mobile) so the customer immediately knows whether work has started on their piece:
    1. `Pending` — **Order Received** / **تم استلام الطلب** *(Waiting for confirmation)*
    2. `Confirmed` — **Confirmed** / **تم التأكيد** *(Queued for production)*
    3. `Printing` — **In Production** / **جاري التنفيذ والطباعة** *(Our team is printing your piece)*
    4. `Shipped` — **Shipped** / **خرج مع المندوب** *(On the way to your address)*
    5. `Completed` — **Delivered** / **تم التسليم**
    * *Special States:* If status is `Cancelled`, show a clear cancelled notice instead of the progress bar. If items in the same order group have different statuses (`Mixed`), show individual status pills per item.
  * **Itemized Garment List:** Show each item's thumbnail, Design Name, Garment Category & Fit, Color, Size, Quantity, Print Placement, Branding/Logo Option, and Subtotal.
  * **Delivery Snapshot:** Show the phone number(s) and delivery address used for that order.
  * **Customer Quick Actions on Each Order:**
    1. **`Order Again` (`اطلب مرة أخرى`):** Reconstructs the cart items from that order group (using current active catalog/option IDs where available), appends them to `ninja_wear_cart_v1` in `localStorage`, and navigates to `/cart` with a confirmation toast.
    2. **`Inquire on WhatsApp` (`استفسر عن الطلب`):** Opens `https://wa.me/${VITE_WHATSAPP_NUMBER}?text=...` prefilled with the Order ID (`#XXXXXXXX`) and customer name.

#### Tab 2: `Profile, Phones & Delivery Address` (`بياناتي وأرقام التواصل والعنوان`)
* Allow the customer to view and edit their `public.profiles` fields in a clean, validated form:
  * **Full Name (`full_name`):** Required text input.
  * **Email Address:** Read-only disabled input showing `user.email` with a subtle `"Verified Account"` note.
  * **Primary Phone Number (`phone`):** Required input with Egyptian/international mobile validation (`^(\+20|0)?1[0125][0-9]{8}$` or international `^\+?[0-9]{10,15}$`).
  * **Backup / Secondary Phone Number (`secondary_phone`):** Optional input (same validation if non-empty) with helper text: *"Optional second number in case the courier cannot reach your primary line."*
  * **Saved Delivery Address (`address`):** Multi-line textarea (Governorate, City, District, Street, Building, Floor/Apartment).
* **Save Action:** Updates `public.profiles` via Supabase, refreshes `profile` in `AuthContext`, and triggers a success toast (`"Profile updated successfully"` / `"تم تحديث بياناتك بنجاح"`).

#### Tab 3: `Security & Password` (`الأمان وتغيير كلمة المرور`)
* Provide a dedicated password update card:
  * **New Password:** Password input with show/hide eye toggle (minimum 8 characters).
  * **Confirm New Password:** Must match New Password.
  * **Action:** Calls `supabase.auth.updateUser({ password: newPassword })`. Displays clear localized success toast or error message, and clears the inputs upon success.

---

## 4. Phase 3: Smart Checkout Address & Phone Integration (`/cart`)

Upgrade `src/pages/public/Cart.jsx` to create a frictionless checkout experience tied directly to the customer's profile while fixing the existing `set-state-in-effect` ESLint warnings.

### 4.1 Fix ESLint `set-state-in-effect` Warnings
* Do **not** synchronize `profile.address` or `profile.phone` into local state inside a `useEffect` that triggers cascading renders.
* Instead, initialize form state cleanly when `profile` loads (e.g., via a keyed sub-component `<CheckoutForm key={profile?.id || 'guest'} profile={profile} ... />` or derived initial state).

### 4.2 Smart Address Auto-Fill & "Save Address" Checkbox
1. **When the customer HAS a saved `profile.address`:**
   * Automatically populate the `Delivery Address` textarea with `profile.address`.
   * Show a subtle helper pill/note: `"Loaded from your saved profile"` / `"تم تعبئة عنوانك المحفوظ"`.
   * If the user edits the address text to something different from `profile.address`, dynamically reveal the checkbox:
     * EN: `"Update my saved profile address with this new address"`
     * AR: `"تحديث عنواني المحفوظ في ملفي الشخصي بهذا العنوان الجديد"`
2. **When the customer does NOT have a saved `profile.address` (`!profile?.address?.trim()`):**
   * Render an empty `Delivery Address` textarea with clear placeholder (`"Governorate, City, Street, Building, Apartment"`).
   * Directly below the textarea, display a prominent, styled checkbox:
     * EN: **`Save this address to my profile for future orders`**
     * AR: **`هل تريد حفظ هذا العنوان في ملفك الشخصي للطلبات القادمة؟`**
   * Default this checkbox to `checked = true` for convenience.
3. **Phone Number Handling at Checkout:**
   * Display `Primary Phone` prefilled from `profile.phone` (required; editable if missing).
   * If `profile.secondary_phone` exists, display a checkbox/pill: `"Also share backup number ({profile.secondary_phone}) with courier"` (checked by default), or allow entering an alternate contact number. Include both numbers cleanly in `customer_phone` (e.g., `"010xxxx / 011xxxx"`) and `order_details.secondary_phone`.
4. **Profile Persistence on Order Submit:**
   * Before or immediately after creating the order, if `saveAddressToProfile` is checked (or if `profile.phone` was empty and newly entered), update `public.profiles` (`address`, `phone`) and refresh `AuthContext` profile state so `/account` immediately reflects the saved address.

---

## 5. Phase 4: Admin Dashboard Bugfixes & Permission Gating (P1)

### 5.1 Fix `Dashboard.jsx` Order Group Status Calculation
* **File:** `src/pages/admin/Dashboard.jsx`
* **Bug:** Currently derives group status from `group.orders[0]?.status || 'Pending'`, causing multi-item orders with differing row statuses to miscount `Pending Orders`.
* **Fix:** Extract a shared helper function `computeOrderGroupStatus(orders)` (used by both `Dashboard.jsx` and `OrdersManager.jsx`):
  * Collect unique statuses across `group.orders`.
  * If `uniqueStatuses.length === 1`, return `uniqueStatuses[0]`.
  * Otherwise, return `'Mixed'` (and count a group as pending/active if any item is `'Pending'`, or match `OrdersManager` badge logic consistently).

### 5.2 Permission-Gate `Dashboard.jsx` Queries & Cards
* **File:** `src/pages/admin/Dashboard.jsx`
* **Bug:** An `admin` user who only holds `orders.view` triggers catalog/collection fetches and sees partial load warnings.
* **Fix:** Use `hasPermission` from `useAuth()`:
  * Conditionally fetch and render `Total Revenue` and `Pending Orders` KPI cards and `Recent Orders` table only when `hasPermission('orders.view')`.
  * Conditionally fetch and render `Active Apparel` KPI card only when `hasPermission('catalog.manage')`.
  * Conditionally fetch and render `Design Collections` KPI card only when `hasPermission('collections.manage')`.

---

## 6. Phase 5: Typography, Color Tokens, Skeletons & Code Hygiene (P2)

### 6.1 Typography System (`index.html` & `src/index.css`)
* **Load Google Fonts in `index.html`:**
  * Arabic UI & Display: **`Cairo`** (weights `400`, `500`, `600`, `700`, `800`).
  * English Display: **`Archivo Black`** (weight `400`) for bold uppercase streetwear headings.
  * English Body/UI: **`Plus Jakarta Sans`** (weights `400`, `500`, `600`, `700`).
* **Configure `src/index.css`:**
  * Set default English font to `'Plus Jakarta Sans', sans-serif`, and display headings (`h1, h2, .font-display`) to `'Archivo Black', 'Plus Jakarta Sans', sans-serif`.
  * When `[dir="rtl"]` is active on `<html>`, apply `'Cairo', sans-serif` globally across headings and body text with tuned line-heights (`1.6` for body, `1.25` for headings).

### 6.2 Tailwind v4 `@theme` Design Tokens (`src/index.css`)
* Consolidate scattered dark hex values (`#0a0a0c`, `#0e0e11`, `#111116`, `#121214`) into a clean `@theme` block in `src/index.css`:
  * `--color-obsidian: #0A0A0A;`
  * `--color-surface: #121214;`
  * `--color-surface-elevated: #18181B;`
  * `--color-border-subtle: #222226;`
  * `--color-brand: #FF5A36;`
  * `--color-brand-hover: #E04826;`

### 6.3 Unified Toast Notifications & Skeleton Loaders
* **Create `src/components/ui/ToastProvider.jsx`:** Provide a lightweight `useToast()` hook (`toast.success()`, `toast.error()`, `toast.info()`) rendered in the bottom-end corner (`bottom-6 end-6`, RTL-aware) so all actions (Add to Cart, Save Profile, Change Password, Order Again, Admin Updates) share one polished notification system.
* **Create `src/components/ui/Skeleton.jsx`:** Replace plain `"Loading..."` text states in `/apparel`, `/collections`, `/custom`, `/account`, and `/admin` with dark pulsing skeleton placeholders (`animate-pulse bg-[#18181B] rounded-xl`).

### 6.4 Dead Code & Translation Cleanup
* **Delete `src/App.css`** (currently 0 lines) and remove `import './App.css'` from `src/App.jsx`.
* **Clean `src/data/translations.js`:**
  * Add all new translation keys required for `/account` (tabs, 5-step order progress tracker, profile/secondary phone/address form, password form, `Order Again`, `WhatsApp Inquiry`), `/cart` (`saveAddressCheckbox`, `loadedSavedAddress`, `backupPhone`), and toast messages in both `en` and `ar`.
  * Remove obsolete/dead translation keys (`cart.name`, `cart.phone`, `cart.email`, and unused legacy keys) so a translation audit reports **0 missing keys and 0 unused keys**.

---

## 7. Verification Checklist Before Finishing

1. Run `npm run lint` -> Must pass with **0 errors and 0 warnings**.
2. Run `npm run build` -> Must complete cleanly with zero bundling errors.
3. Verify `/account` in both **English (LTR)** and **Arabic (RTL)**:
   - Order progress stepper displays accurately for `Pending`, `Confirmed`, `Printing`, `Shipped`, `Completed`, and `Cancelled`.
   - `Order Again` populates cart and redirects to `/cart`.
   - Editing `full_name`, `phone`, `secondary_phone`, and `address` persists to `public.profiles`.
   - Password change updates credentials cleanly.
4. Verify `/cart` checkout flow:
   - First-time user without saved address sees `"Save this address to my profile for future orders"` checkbox; submitting saves address to `profiles` and creates the order.
   - Returning user with saved address sees their address auto-filled automatically.
5. Verify `/admin` Dashboard shows accurate `Pending Orders` count (handling `Mixed` groups) and hides unauthorized KPI cards for restricted admin roles.