# 🛠️ Ninja Skins - Frontend Refactoring, UX Optimization & i18n Tasks

**Role & Instructions for AI Agent:**
You are a Senior React Developer. Your task is to refactor specific parts of the provided React/Vite project based on the exact instructions below. 
- DO NOT change the global styling, primary colors, or Tailwind configuration unless required for RTL (Right-to-Left) support.
- Work step-by-step and maintain strict Clean Code principles.
- Apply bilingual comments (English / Arabic) to any modified logic to explain the changes.
- **CRITICAL:** Process these tasks sequentially. Ask for confirmation or show git diffs after completing each major task if possible.

---

## Task 1: Bilingual Support (English / Arabic) & RTL Layout (دعم اللغتين وتغيير الاتجاه)
**Objective:** Make the website support both English and Arabic with a simple toggle, without heavily over-engineering it.
**Files to modify/create:** `src/context/LanguageContext.jsx` (New), `src/App.jsx`, `src/components/NavBar.jsx`, `index.html`
- **Action 1 (Context):** Create a simple `LanguageContext` that holds the `language` state ('en' or 'ar') and a `toggleLanguage` function. 
- **Action 2 (HTML Dir):** In the `toggleLanguage` function (or a `useEffect` in the provider), dynamically update `document.documentElement.dir` to `'rtl'` for Arabic and `'ltr'` for English, and update the `lang` attribute on the `<html>` tag.
- **Action 3 (App Provider):** Wrap the `LayoutGroup` in `App.jsx` with the new `LanguageProvider`.
- **Action 4 (Navbar Toggle):** In `NavBar.jsx`, add a simple language toggle button (e.g., `EN / AR` or a globe icon) next to the mobile menu button and inside the desktop menu.
- **Action 5 (Tailwind RTL):** Ensure that you utilize standard Tailwind logical properties (like `ms-`, `me-`, `ps-`, `pe-` instead of `ml-`, `mr-`, etc.) in the `NavBar.jsx` and `HeroHome.jsx` as a starting point so the UI flips correctly. 
  *(Note for Agent: You don't need to translate all hardcoded text right now, just set up the infrastructure and toggle).*

## Task 2: Navigation & Routing Cleanup (تنظيف مسارات التنقل)
**Files to modify:** `src/components/HeroHome.jsx`, `src/components/NavBar.jsx`, `src/pages/public/Home.jsx`
- **Issue:** `NavLink` is being used for standard buttons and CTA links, which is bad practice since `NavLink` is meant for active navigation menu items.
- **Action 1:** In `HeroHome.jsx`, import `Link` from `react-router-dom` and replace the `NavLink` wrapper for "SEE OUR COLLECTIONS" and "DESIGN YOUR OWN SKIN" with a standard `<Link>`.
- **Action 2:** In `NavBar.jsx`, keep `NavLink` for the main `links` array mapping, but change the "See Collections" CTA button to `<Link to="/collections">`.
- **Action 3:** In `Home.jsx`, change the "ASK OUR TEAM" `NavLink` to a standard `<Link to="/contact-us">`.

## Task 3: Custom Design Page Logic Optimization (تحسين صفحة التصميم والتخصيص)
**File to modify:** `src/pages/public/Custom.jsx`
- **Action 1 (Hardcoded Data Commenting):**
  - Locate the `coverageOptions` array (Top cover, Top + palm rest, Full body).
  - Wrap it with a clear descriptive comment indicating it needs to be fetched from Supabase in the future.
  - *Example:* `// TODO: Fetch from Supabase 'AVL_Coverage' table later. / سيتم جلب هذه البيانات من قاعدة البيانات لاحقاً`
- **Action 2 (Logo Logic Simplification):**
  - Verify that `logoChoice` (`with-cut`, `without-cut`, `custom-logo`, `our-logo`) acts strictly as a data flag without triggering unnecessary UI image renders for the laptop preview. Ensure the state only saves the boolean/string value to `localStorage`.
- **Action 3 (Cart/Draft UX Update):**
  - Change the submit button text from `"Save design draft"` to `"Add to Cart (Save Draft)"`.
  - Update the helper text below it to: `"Saving adds this configuration to your local cart. / سيتم حفظ هذا التصميم في سلة مشترياتك المحلية."`
  - Rename the storage variable `draftStorageKey` from `'ninja-skins-custom-draft'` to `'ninja-skins-cart-draft'` to logically align with a future cart flow.

## Task 4: Cross-Page State Integrity (تأكيد سلامة انتقال البيانات)
**Files to modify:** `src/pages/public/Collections.jsx`, `src/pages/public/Custom.jsx`
- **Action:**
  - In `Collections.jsx`, you are using `navigate` with both `search params` and `state: { selectedSkin: skin }`. 
  - In `Custom.jsx`, add a fallback in the `useEffect`: if `searchParams` has a `laptop` or `collection` ID in the URL, ensure that specific data is fetched and set properly, even if `location.state` is empty (e.g., when a user shares the link directly).

## Task 5: Footer Data Fetching Safety (تحديث الفوتر)
**File to modify:** `src/components/Footer.jsx`
- **Action:** 
  - Wrap the `getCollections()` call inside the `useEffect` in a `try/catch` block.
  - Set the state to an empty array `[]` if it fails to prevent UI crashes if Supabase is unreachable.

## Task 6: Contact Us Enhancements (تحسين صفحة التواصل)
**File to modify:** `src/pages/public/ContactUs.jsx`
- **Action:**
  - Add a `required` attribute to the `select` element (Topic).
  - Add a bilingual comment above `window.open(url, '_blank')`:
    `// Redirects user to WhatsApp with a prefilled message / توجيه المستخدم لواتساب برسالة مجهزة`

## Task 7: Data Fetching Edge Cases (معالجة أخطاء جلب البيانات)
**File to modify:** `src/data/catalog.js`
- **Action:**
  - Inside `getLaptops()`, `getCollections()`, and `getCollectionSkins()`, ensure that if `supabase` fails to initialize (e.g., missing ENV variables), it catches the error gracefully and returns `{ data: [], error: 'Supabase client not initialized' }` instead of throwing an unhandled exception.