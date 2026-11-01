# 🛠️ Ninja Skins - Admin Dashboard Implementation Plan

**Role & Instructions for AI Agent:**
You are a Lead Frontend Engineer. Your task is to build a complete, professional Admin Dashboard for the "Ninja Skins" e-commerce project using React, Tailwind CSS (v4), and Framer Motion.
- Keep the design aligned with the existing dark theme (`#050505`, `#0a0a0c`, white text, red/amber accents).
- Store all admin pages in `src/pages/admin/` and admin components in `src/components/admin/`.
- Provide bilingual comments (English/Arabic) for all major logic blocks.
- **CRITICAL:** Do this step-by-step. Ask for confirmation before moving to the next phase.

---

## Phase 1: Admin Layout & Routing Architecture (هيكلة المسارات والواجهة)
**Goal:** Create a protected layout for the admin area, separate from the public storefront.

1. **Create `AdminLayout.jsx` (in `src/components/admin/`):**
   - Must contain a sticky Sidebar (for navigation) and a Topbar (for page title and logout button).
   - Sidebar Links: Dashboard, Orders, Laptops Catalog, Collections.
   - Use Lucide-react icons or standard SVG icons for the menu.
2. **Create `AdminProtectedRoute.jsx`:**
   - A wrapper component that checks if an admin user is logged in (use a mock state for now: `const isAuthenticated = true;`). If false, redirect to `/admin/login`.
3. **Update `App.jsx`:**
   - Add a new route group under `/admin/*` wrapped in `AdminProtectedRoute` and `AdminLayout`.

## Phase 2: Authentication (تسجيل دخول الإدارة)
1. **Create `AdminLogin.jsx` (in `src/pages/admin/`):**
   - A clean, dark-themed login form (Email & Password).
   - Must be outside the `AdminLayout` (no sidebar).
   - *Logic:* Wire it up to Supabase Auth (`supabase.auth.signInWithPassword`).

## Phase 3: Dashboard Overview Page (الصفحة الرئيسية للإحصائيات)
1. **Create `Dashboard.jsx` (in `src/pages/admin/`):**
   - **Stats Grid:** 4 Cards at the top showing: Total Revenue, Pending Orders, Active Laptops, Total Collections. (Use mock data).
   - **Recent Orders Table:** A clean Tailwind table showing the last 5 orders (Order ID, Customer, Date, Status, Total). 
   - Add status badges (e.g., Green for 'Completed', Yellow for 'Pending').

## Phase 4: Orders Management (إدارة الطلبات)
1. **Create `OrdersManager.jsx`:**
   - A full-page table displaying all orders.
   - Add a dropdown for the "Status" column to allow the admin to change an order's status (`Pending`, `Processing`, `Shipped`, `Completed`, `Cancelled`).
   - Add a "View Details" button that opens a Modal showing exactly what the user selected (Laptop Model, Skin Design, Coverage type, Logo Cutout preferences).

## Phase 5: Catalog Management (إدارة المنتجات - اللابتوبات)
1. **Create `LaptopsManager.jsx`:**
   - A table listing all items from `AVL_Laptops`.
   - **Actions:** 
     - "Toggle Visibility" switch (updates `is_active`).
     - "Add New Laptop" button that opens a form (Brand, Series, Models array, Base Price, Image URL, is_custom_request flag).
   - *Logic:* Wire these actions to Supabase insert/update functions.

## Phase 6: Collections & Skins Management (إدارة التصميمات)
1. **Create `CollectionsManager.jsx`:**
   - A grid layout displaying current folders in the `Skins` bucket.
   - A form to insert/update `COLLECTIONS_INFO` (Set the display name, description, and badge for a specific folder).

---
**Execution Instructions:**
Start with **Phase 1** and provide the code for `AdminLayout.jsx` and the `App.jsx` modifications. Wait for my approval before proceeding to Phase 2.