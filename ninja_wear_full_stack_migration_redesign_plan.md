# Project Transformation Specification: From "Ninja Skins" to "Ninja Wear" (Custom Streetwear & Apparel Storefront)

## 1. Executive Context & Objective

You are acting as a **Senior Full-Stack Engineer and Product Designer**. Your task is to systematically refactor and transform an existing React + Vite + Tailwind CSS + Supabase web application (formerly **"Ninja Skins"**, a laptop skin storefront) into **"Ninja Wear"** (brand mark: **NINJA**), a modern custom streetwear and print-on-demand apparel storefront (Oversized T-Shirts, Boxy Tees, Heavyweight Hoodies, and B2B/Team Bulk Custom Apparel).

### Core Mandate

1. **Zero Laptop Legacy:** Completely remove every UI copy, route name, TypeScript interface, variable name, and database query referencing laptops, skins, coverage, or logo cuts.

2. **100% Database-Driven Configuration:** Eliminate all hardcoded pricing and customization arrays. All apparel items, sizes, colors, collections, print placements, and logo/branding options must be dynamically fetched from the newly migrated Supabase schema.

3. **Logical Apparel UX:** Adapt the user journey so it makes complete physical and commercial sense for clothing (e.g., selecting **Garment Fit + Color + Size + Quantity**, viewing a **Size Guide**, choosing **Print Placement** like Left Chest / Full Front / Oversized Back, and adding **Sleeve/Nape Branding**).

4. **Full Bilingual Parity (EN / AR RTL):** Maintain and upgrade the existing English (LTR) and Arabic (RTL) localization system so every new label, option, modal, and admin screen works seamlessly in both languages.

5. **Enforced Role-Based Access Control (RBAC):** Secure the `/admin` workspace using the new `public.user_roles` table (`super_admin`, `designer`, `order_manager`).

## 2. Visual Identity & Design System Guidelines

Retain the high-contrast dark luxury streetwear aesthetic established in the original UI while elevating it for fashion/apparel:

* **Color Palette:**

  * Primary Background: `#0A0A0A` (Deep Obsidian Black)

  * Elevated Surface / Cards: `#121214` with subtle `1px solid #222226` borders

  * Primary Brand Accent: `#FF5A36` (Fiery Coral/Orange) for primary CTAs, active highlights, and step badges

  * Secondary CTA / Contrast Surface: `#FFFFFF` background with `#0A0A0A` bold text for primary action buttons (`Add to Cart`, `See Collections`)

  * Text Hierarchy: `#FFFFFF` (Headings), `#A1A1AA` (Body/Subtitles), `#71717A` (Muted metadata)

* **Typography & Layout:**

  * Clean bold uppercase display headings in English (e.g., `WEAR YOUR IDENTITY.`), paired with crisp modern Arabic typography (`Cairo` or `Tajawal` / `IBM Plex Sans Arabic`) when `dir="rtl"` is active.

  * Maintain generous whitespace, rounded corners (`rounded-xl` / `rounded-2xl`), and smooth hover transitions.

## 3. Supabase Architecture Reference (Already Deployed)

Do **not** alter the database schema. Connect the frontend directly to these exact tables and storage buckets:

### 3.1 Database Tables

1. **`public.apparel_products`** *(Replaces `AVL_Laptops`)*

   * `id`: `uuid` (PK)

   * `category`: `text` (e.g., `'T-Shirts'`, `'Hoodies'`, `'Bulk & Teams'`)

   * `fit_type`: `text` (e.g., `'Oversized Drop-Shoulder (100% Cotton 240gsm)'`)

   * `sizes`: `text[]` (e.g., `['S', 'M', 'L', 'XL', 'XXL']`)

   * `colors`: `text[]` (e.g., `['Jet Black', 'Off-White', 'Charcoal Grey', 'Sage Green']`)

   * `base_price`: `numeric(10,2)`

   * `image_url`: `text` (Public URL from `apparel-mockups` bucket)

   * `is_active`: `boolean`

   * `is_custom_request`: `boolean` (True for B2B / Bulk / Team custom manufacturing requests)

   * `created_at`: `timestamptz`

2. **`public.design_collections`** *(Replaces `COLLECTIONS_INFO`)*

   * `id`: `uuid` (PK)

   * `collection_name`: `text` (Unique; maps 1:1 to folder names in `designs` bucket, e.g., `'Anime'`, `'Coding_Humor'`, `'Arabic_Calligraphy'`)

   * `display_name`: `text`

   * `description`: `text`

   * `badge`: `text` (e.g., `'الأكثر مبيعاً'`, `'جديد'`, `'تراث أصيل'`)

   * `is_active`: `boolean`

   * `created_at`: `timestamptz`

3. **`public.print_options`** *(Replaces hardcoded coverage options)*

   * `id`: `uuid` (PK)

   * `name`: `text` (e.g., `'طباعة أمامية صغيرة (Left Chest)'`, `'طباعة خلفية كبيرة (Oversized Back)'`)

   * `description`: `text`

   * `additional_price`: `numeric(10,2)`

   * `sort_order`: `int`

   * `is_active`: `boolean`

4. **`public.logo_options`** *(Replaces hardcoded logo cut options)*

   * `id`: `uuid` (PK)

   * `option_type`: `'none' | 'brand_logo' | 'custom_upload'`

   * `label`: `text`

   * `allowed_placements`: `text[]` (e.g., `['الكم الأيمن', 'أسفل الياقة من الخلف', 'طرف التيشيرت السفلي']`)

   * `additional_price`: `numeric(10,2)`

   * `is_active`: `boolean`

5. **`public.orders`** *(Updated schema)*

   * `id`: `uuid` (PK)

   * `cart_group_id`: `uuid` (Groups items from a single checkout session)

   * `customer_name`: `text`

   * `customer_email`: `text`

   * `customer_phone`: `text`

   * `customer_address`: `text`

   * `product_info`: `text` (Formatted summary: e.g., `"T-Shirts - Oversized Drop-Shoulder | Color: Jet Black | Size: L | Qty: 2"`)

   * `design_name`: `text` (Collection design filename or `"Custom Upload"`)

   * `print_option`: `text` (Selected `print_options.name`)

   * `logo_option`: `text` (Selected `logo_options.label` + placement if applicable)

   * `order_details`: `jsonb` (Structured metadata: `{ quantity, unit_price, color, size, custom_design_path, custom_logo_path, customer_notes, bulk_details }`)

   * `total_price`: `numeric(10,2)`

   * `status`: `'Pending' | 'Confirmed' | 'Printing' | 'Shipped' | 'Completed' | 'Cancelled'`

   * `created_at`: `timestamptz`

6. **`public.user_roles`** *(New RBAC table)*

   * `user_id`: `uuid` (PK, references `auth.users`)

   * `role`: `'super_admin' | 'designer' | 'order_manager'`

   * `created_at`: `timestamptz`

### 3.2 Storage Buckets

* **`apparel-mockups` (Public):** Base blank garment photography (T-shirts, Hoodies).

* **`designs` (Public):** Folder-based design collections (`Anime/`, `Coding_Humor/`, `Arabic_Calligraphy/`, etc.).

* **`custom_design_uploads` (Private):** Customer-uploaded artwork stored under `designs/{uuid}-{filename}` and customer logos under `logos/{uuid}-{filename}`. Admin views these via 10-minute signed URLs.

## 4. Phased Execution Roadmap

Execute the transformation sequentially across **7 logical phases**. Verify TypeScript compilation (`npm run build`) and UI responsiveness after each phase before proceeding to the next.

### Phase 1: Data Layer, TypeScript Models & Supabase Services Refactor

**Goal:** Establish clean TypeScript types and centralized API service functions aligned with the new Supabase tables and buckets.

1. **Create/Update `src/types/store.ts`:**

   * Define strict interfaces for `ApparelProduct`, `DesignCollection`, `PrintOption`, `LogoOption`, `CartItem`, `OrderRow`, `OrderGroup`, and `UserRole`.

   * Remove all `Laptop` and `Skin` interfaces.

2. **Refactor Supabase Data Services (`src/services/` or `src/lib/`):**

   * **Products Service:** Fetch active rows from `apparel_products` ordered by `is_custom_request ASC, base_price ASC`.

   * **Collections Service:** Fetch active rows from `design_collections` and list folders/files from the `designs` storage bucket (filtering out `.emptyFolderPlaceholder`). Merge folder images with `design_collections` metadata (`display_name`, `description`, `badge`).

   * **Customization Options Service:** Fetch active rows from `print_options` (ordered by `sort_order ASC`) and `logo_options` (ordered by `additional_price ASC`).

   * **Checkout Service:**

     * Upload any custom design file to `custom_design_uploads` under `designs/` and custom logo file under `logos/`.

     * Insert one row per cart item into `public.orders` with a shared `cart_group_id` (`crypto.randomUUID()`), `status: 'Pending'`, and rich `order_details` JSONB.

     * Rollback/cleanup uploaded storage files if the database insert fails.

3. **Update Routing (`src/App.tsx`):**

   * Rename `/laptops` route to `/apparel` (add a `<Navigate to="/apparel" replace />` redirect from `/laptops` for safety).

   * Keep `/`, `/collections`, `/collections/:collectionName`, `/custom`, `/cart`, `/contact-us`, and `/admin/*`.

### Phase 2: Global Navigation, Footer & Bilingual Copywriting (`i18n`)

**Goal:** Rebrand the shell of the application to **Ninja Wear** and translate all UI strings across English and Arabic.

1. **Brand Identity & Logo:**

   * Update Navbar logo text from `NINJA SKINS` to `NINJA WEAR` (keeping the signature minimalist ninja emblem).

   * Update HTML `<title>` and meta tags in `index.html` to `Ninja Wear | Custom Streetwear & Apparel`.

2. **Navbar Links & Actions:**

   * Update links to:

     * `Home` / `الرئيسية` (`/`)

     * `Apparel` / `المنتجات` (`/apparel`)

     * `Collections` / `التصميمات` (`/collections`)

     * `Custom Design` / `صمّم تيشيرتك` (`/custom`)

     * `Cart` (with live item count badge) / `السلة` (`/cart`)

     * `Contact Us` / `تواصل معنا` (`/contact-us`)

   * Keep the primary white CTA button (`See collections` / `تصفح التصميمات`) and the `AR` / `EN` language toggle button.

3. **Footer Refactor:**

   * Update brand description: *"Heavyweight streetwear crafted for everyday wear and finished with artwork that speaks your identity."* / *"ملابس ستريت وير بخامات ثقيلة وتصميمات مطبوعة تعبّر عن شخصيتك."*

   * Update quick links (`Apparel`, `Collections`, `Custom Design`, `Cart`, `Contact Us`) and dynamically render collection links from `design_collections`.

   * Update bottom CTA banner: `CUSTOM MERCH & TEAMS` -> `Need help with sizing or bulk orders?` -> `Talk to our team`.

   * Update copyright: `© 2026 Ninja Wear` | `Streetwear, made personal.`

### Phase 3: Landing Page (`/`) & Apparel Catalog Page (`/apparel`)

**Goal:** Replace all laptop-centric marketing and product cards with compelling streetwear storytelling and clear garment specifications.

1. **Landing Page (`src/pages/Home.tsx`) Redesign:**

   * **Hero Section:**

     * Eyebrow Badge: `HEAVYWEIGHT STREETWEAR • PRINTED TO ORDER` / `خامات ثقيلة • طباعة حسب الطلب`

     * Headline: `WEAR YOUR` (in `#FF5A36`) + `IDENTITY.` (in `#FFFFFF`) | Arabic: `البس ستايلك` / `على مزاجك.`

     * Subheadline: *"Premium 100% cotton oversized tees and heavy fleece hoodies. Pick from our curated graphic drops or upload your own artwork."*

     * Primary CTAs: `Explore collections ->` (`/collections`) & `Design your piece` (`/custom`).

     * Hero Visual: Showcase high-contrast streetwear T-shirt/hoodie mockups with the signature warm radial glow backdrop.

   * **Value Proposition Section (`THE NINJA STANDARD` / `جودة تفرق من أول لبسة`):**

     * Headline: `BUILT FOR THE STREETS`

     * 4 Feature Cards:

       1. `HEAVYWEIGHT COTTON`: *"240gsm–400gsm combed cotton and fleece engineered for a structured oversized drape."*

       2. `DTF & SCREEN GRADE`: *"High-density, crack-resistant prints that stay vibrant wash after wash."*

       3. `CUSTOM PLACEMENT`: *"Choose front chest, full front, oversized back prints, plus custom sleeve branding."*

       4. `SINGLE OR BULK`: *"Order a single 1-of-1 piece for yourself or custom merch drops for your team."*

   * **Collections Showcase (`CHOOSE YOUR VIBE`):**

     * Dynamically render the top 3 active collections from `design_collections` + `designs` bucket previews.

   * **How It Works (`CUSTOM APPAREL, MADE SIMPLE`):**

     * 3 Numbered Steps (`01`, `02`, `03`):

       * `01 PICK YOUR FIT & SIZE`: *"Choose between oversized tees, boxy fits, or heavy hoodies in your exact size and color."*

       * `02 CHOOSE OR UPLOAD ART`: *"Select an exclusive Ninja Wear graphic or upload your own high-res design."*

       * `03 PRINT & DELIVER`: *"We custom-print your garment to order and ship it straight to your door."*

2. **Apparel Catalog Page (`src/pages/Apparel.tsx` - replaces `Laptops.tsx`):**

   * Header: `THE BLANK CANVAS` -> `CHOOSE YOUR GARMENT` -> *"Select a heavyweight base garment to start customizing your print and placement."*

   * **Standard Garment Cards (`is_custom_request === false`):**

     * Top Category Badge (e.g., `T-SHIRTS`, `HOODIES`).

     * Garment Mockup Image (`image_url`).

     * Title (`fit_type`, e.g., *Oversized Drop-Shoulder 240gsm*).

     * Available Sizes Pills (`S`, `M`, `L`, `XL`, `XXL`) and Color Dots/Labels (`Jet Black`, `Off-White`, etc.).

     * Footer: `STARTING AT EGP {base_price}` + circular `#FF5A36` arrow button navigating to `/custom?productId={id}`.

   * **B2B / Team Bulk Request Card (`is_custom_request === true`):**

     * Highlighted special card (`TEAMS & BRANDS`): *"Ordering for a team, event, or graduation? Get custom bulk pricing and dedicated design support."* -> Button: `Request bulk quote` navigating to `/custom?productId={id}`.

### Phase 4: Collections (`/collections`) & Collection Details (`/collections/:slug`)

**Goal:** Connect the design gallery to the `designs` bucket and `design_collections` table with seamless handoff to the apparel customizer.

1. **Collections Index (`/collections`):**

   * Fetch all active records from `design_collections`.

   * For each collection, fetch its preview image from the corresponding folder in the `designs` bucket.

   * Display badge (`badge`), `display_name`, `description`, design count, and `Explore collection ->`.

2. **Collection Details (`/collections/:collectionName`):**

   * Display breadcrumb `Collections / {display_name}`, `<- BACK TO COLLECTIONS`, description, and subtitle `PICK AN ARTWORK TO PRINT ON YOUR TEE OR HOODIE.`

   * Render responsive grid of all graphic designs in that folder.

   * Clicking any design navigates to `/custom?collection={collectionName}&design={fileName}` so the artwork is immediately loaded into the Apparel Customizer.

### Phase 5: The Interactive Apparel Customizer (`/custom`) — Core UX Overhaul

**Goal:** Build an intuitive, logical, real-time apparel customization studio powered 100% by Supabase data.

#### Left Column: 4-Step Logical Configuration Flow

1. **Step 1: `CHOOSE YOUR GARMENT & FIT` (`1`)**

   * Dropdown / Card Selector populated from `apparel_products`.

   * **When a Standard Garment (`is_custom_request === false`) is selected:**

     * Display `Starting garment price: EGP {base_price}`.

     * **Color Selector:** Render interactive color pills/swatches from `selectedProduct.colors` (default to the first color).

     * **Size Selector:** Render interactive size buttons (`S`, `M`, `L`, `XL`, `XXL`) from `selectedProduct.sizes` (default to `'L'` or first available) + a subtle **`Size Guide` / `دليل المقاسات`** button that opens a clean modal showing Chest Width & Length in cm for Oversized Tees and Hoodies.

     * **Quantity Stepper:** `- 1 +` control (minimum `1`) so users can order multiple pieces of the same configuration.

   * **When Bulk / Teams Request (`is_custom_request === true`) is selected:**

     * Reveal structured B2B/Team fields:

       * `Organization / Team Name` (e.g., *IEEE Alex Student Branch*)

       * `Estimated Quantity` (e.g., *25 Hoodies*)

       * `Color & Size Breakdown / Notes` (e.g., *15 Black (L/XL), 10 Navy (M)*)

2. **Step 2: `CHOOSE YOUR ARTWORK` (`2`)**

   * Two tabs: `Ninja Designs` (`تصميماتنا`) | `Upload Your Design` (`ارفع تصميمك`).

   * **Under `Ninja Designs`:**

     * Collection filter tabs populated dynamically from `design_collections` (`display_name`).

     * Grid of design thumbnails from the selected folder in `designs` bucket with active `#FF5A36` border.

   * **Under `Upload Your Design`:**

     * Drag-and-drop / file picker (`PNG, JPG, WEBP, SVG` up to 15MB) with tip: *"For best DTF print results, use a transparent PNG at 300 DPI."*

     * Show local preview thumbnail, filename, and `Remove` button.

3. **Step 3: `CHOOSE PRINT PLACEMENT` (`3`)**

   * Dynamically render radio cards from **`public.print_options`** (sorted by `sort_order`).

   * Each card displays:

     * `option.name` (e.g., *طباعة خلفية كبيرة (Oversized Back)*)

     * `option.description`

     * Price delta badge on the right: `+EGP {option.additional_price}` (or `Included` / `مشمول` if `0`).

4. **Step 4: `BRANDING & LOGO DETAILS` (`4`)**

   * Dynamically render radio cards from **`public.logo_options`**.

   * Each card shows `option.label` and `+EGP {option.additional_price}` (if `> 0`).

   * **Conditional UI based on selected `logo_option`:**

     * If `option.option_type === 'custom_upload'`: Reveal `Upload Your Logo` file picker (`image/*`) with filename & remove button.

     * If `option.allowed_placements.length > 0`: Reveal `Logo Placement` dropdown populated dynamically from `option.allowed_placements` (e.g., `الكم الأيمن`, `أسفل الياقة من الخلف`, `طرف التيشيرت السفلي`).

   * **Optional Print Notes Input:** Add a clean collapsible or compact text input (`Special Print Instructions / ملاحظات إضافية للطباعة`, e.g., *"Print graphic 3cm below collar"*).

#### Right Column: Sticky Live Preview & Order Summary (`YOUR PIECE`)

1. **Visual Preview Box:**

   * Provide a toggle or layered preview showing:

     * The selected artwork in high contrast, AND/OR a composite garment mockup preview showing the selected design overlaid onto the chosen garment image (`selectedProduct.image_url`) with a visual placement indicator badge (e.g., `Back Print Preview` / `Front Chest Preview`).

2. **Real-Time Spec Breakdown Table:**

   * `Garment`: `{category} — {fit_type}` (or `Bulk & Teams Custom Request`)

   * `Color & Size`: `{selectedColor} · Size {selectedSize}` (or bulk breakdown)

   * `Artwork`: `{selectedDesignName}` (or uploaded filename)

   * `Print Placement`: `{selectedPrintOption.name}`

   * `Logo / Branding`: `{selectedLogoOption.label}` + `({selectedPlacement})`

   * `Quantity`: `{quantity}`

3. **Dynamic Price Calculation:**

   * `Unit Price = base_price + print_option.additional_price + logo_option.additional_price`

   * `Estimated Total = Unit Price * quantity`

   * Display `Estimated Total: EGP {total}` prominently above the full-width **`ADD TO CART`** button.

   * Support **Edit Mode**: When a user clicks `Edit Item` from `/cart`, pre-populate all Step 1–4 states and update the existing cart item upon saving.

### Phase 6: Shopping Cart (`/cart`), Checkout & Contact Us (`/contact-us`)

**Goal:** Ensure frictionless cart management, secure file uploads, structured database order creation, and WhatsApp support.

1. **Cart Page (`src/pages/Cart.tsx`):**

   * Persist cart items in `localStorage` under a new versioned key (e.g., `ninja_wear_cart_v1`) so old laptop cart items do not crash the UI.

   * Display each item card with:

     * Design/Garment thumbnail, Design Name, Collection Name.

     * Structured badges/rows: `Garment`, `Color & Size`, `Print`, `Branding`, and an inline `Quantity` adjuster (`- / +`) that recalculates item subtotal and cart total automatically.

     * `Edit Item` and `Remove` actions.

   * **Customer Checkout Form (`How can we reach you?`):**

     * `Full name` (required)

     * `Mobile number` (required, Egyptian phone validation `01[0125]xxxxxxxx` or international format)

     * `Email address` (optional)

     * `Delivery address` (required: Governorate, city, street, building, apartment)

   * **Order Submission Flow:**

     * Generate a single `cart_group_id = crypto.randomUUID()`.

     * Upload any pending `File` objects (custom design or custom logo) to `custom_design_uploads` (`designs/` and `logos/`).

     * Insert rows into `public.orders` with `status: 'Pending'`, formatted `product_info`, `design_name`, `print_option`, `logo_option`, `total_price`, and `order_details` JSONB containing `{ quantity, unit_price, color, size, custom_design_path, custom_logo_path, notes, bulk_details }`.

     * Clear `localStorage` cart and render the `REQUEST RECEIVED` confirmation screen with order reference ID and `Browse Apparel` CTA.

2. **Contact Us Page (`src/pages/ContactUs.tsx`):**

   * Update left-hand guide (`HOW CAN WE HELP?`):

     * `01 Sizing & Fabric Fit`: *"Ask about oversized measurements, cotton GSM weights, or hoodie fits."*

     * `02 Custom Artwork & Print`: *"Check file resolution or get advice on DTF vs. screen print placements."*

     * `03 Bulk & Team Orders`: *"Get custom quotes for graduation hoodies, company merch, and events."*

   * Update topic dropdown (`What can we help with?`):

     * `Sizing & fit advice`

     * `Custom design / file check`

     * `Bulk & team order quote`

     * `Track my order`

     * `Something else`

   * Keep the prefilled `Send on WhatsApp` action using `VITE_WHATSAPP_NUMBER`.

### Phase 7: Role-Based Admin Workspace (`/admin`)

**Goal:** Upgrade the Admin Dashboard to enforce Supabase `user_roles`, manage the new apparel/options tables, and streamline order fulfillment.

1. **Authentication & RBAC Guard (`src/context/AdminAuthContext.tsx`):**

   * Upon login via Supabase Auth, query `public.user_roles` for `auth.uid()`.

   * If no role row exists, immediately sign out and display an `"Unauthorized: Admin role required"` error.

   * Store `role` (`'super_admin' | 'designer' | 'order_manager'`) in context and filter sidebar navigation & routes:

     * **`super_admin`:** Full access to all tabs (`Dashboard`, `Orders`, `Apparel Catalog`, `Collections & Designs`, `Print & Logo Pricing`).

     * **`order_manager`:** Access to `Dashboard` and `Orders`.

     * **`designer`:** Access to `Collections & Designs` and `Apparel Catalog`.

2. **Admin Dashboard (`/admin`):**

   * Update the 4 KPI Cards:

     1. `Total Revenue`: Sum of `total_price` where `status === 'Completed'`.

     2. `Pending Orders`: Count of distinct `cart_group_id` where `status === 'Pending'`.

     3. `Active Apparel`: Count of active rows in `public.apparel_products`.

     4. `Design Collections`: Count of active collections in `public.design_collections` / folders in `designs` bucket.

3. **Orders Management (`/admin/orders`):**

   * Group rows by `cart_group_id`.

   * Support all 6 new database statuses in the inline status dropdown with distinct color badges:

     * `Pending` (Amber), `Confirmed` (Blue), `Printing` (Purple), `Shipped` (Cyan), `Completed` (Emerald Green), `Cancelled` (Red).

   * **Order Details Modal:**

     * Display Customer Name, Phone (with quick WhatsApp link button!), Email, Delivery Address, Order Date, and Total.

     * For each item in the group, display `product_info` (Garment, Color, Size, Qty), `design_name`, `print_option`, `logo_option`, and any `order_details.notes` or `bulk_details`.

     * Generate 10-minute signed URLs from `custom_design_uploads` for `order_details.custom_design_path` and `order_details.custom_logo_path` so staff can preview and download print-ready customer files.

4. **Apparel Catalog Manager (`/admin/apparel` - replaces `LaptopsCatalog`):**

   * CRUD interface for `public.apparel_products`:

     * Toggle `is_active` visibility switch.

     * Add/Edit Modal with fields: `Category` (e.g., T-Shirts, Hoodies), `Fit Type`, `Sizes` (comma-separated or tag input -> saved as `text[]`), `Colors` (comma-separated or tag input -> saved as `text[]`), `Base Price (EGP)`, `Image URL` (plus optional direct upload to `apparel-mockups` bucket!), and `Is Custom / Bulk Request` checkbox.

5. **Collections & Designs Manager (`/admin/collections`):**

   * Point storage operations from `Skins` bucket to **`designs`** bucket, and metadata operations from `COLLECTIONS_INFO` to **`public.design_collections`**.

   * Allow creating new collection folders (uploading initial graphic files), editing `display_name`, `description`, `badge`, `is_active`, and uploading/renaming/deleting artwork inside each folder.

6. **Print & Logo Options Manager (`/admin/pricing` - New Tab for `super_admin`):**

   * Simple, clean CRUD interface allowing the `super_admin` to manage:

     * **`public.print_options`:** Add/edit print placements, descriptions, `additional_price`, `sort_order`, and `is_active`.

     * **`public.logo_options`:** Edit `label`, `additional_price`, `allowed_placements` (`text[]`), and `is_active`.

## 5. Final Verification Checklist for the Agent

Before concluding your work, verify every item below:

* \[ \] Zero occurrences of `AVL_Laptops`, `COLLECTIONS_INFO`, `Skins` bucket, or laptop-related UI strings remain in the codebase (`grep` check).

* \[ \] All Supabase queries target `apparel_products`, `design_collections`, `print_options`, `logo_options`, `orders`, and `user_roles`.

* \[ \] Storage operations target `apparel-mockups`, `designs`, and `custom_design_uploads`.

* \[ \] Customizer accurately calculates `Unit Price * Quantity` using live prices from `apparel_products`, `print_options`, and `logo_options`.

* \[ \] Switching between `EN` (LTR) and `AR` (RTL) renders cleanly across all pages, modals, and the admin panel without layout overflow.

* \[ \] `npm run build` succeeds with zero TypeScript or Vite bundling errors.