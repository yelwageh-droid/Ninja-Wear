# Ninja Wear

A React and Vite storefront for browsing custom streetwear collections, designing print-on-demand apparel, and checking out bulk/team orders.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and add the Supabase project credentials and WhatsApp number.
3. Start the dev server with `npm run dev`.
4. Check a production bundle with `npm run build`.
5. Preview the production build with `npm run preview`.

Never commit `.env` or service-role credentials. The browser uses only the Supabase anon/public key; protect database rows with Supabase Row Level Security and storage policies.

## Supabase data

The storefront reads active rows from `public.apparel_products`, ordered by `is_custom_request` then `base_price`. It uses `id`, `category`, `fit_type`, `sizes` (`text[]`), `colors` (`text[]`), `base_price`, `image_url`, `is_active`, and `is_custom_request`. Rows marked as custom requests render as a bulk/team request card that reveals organization, estimated quantity, and color/size breakdown fields.

Design collections are driven by the public `designs` storage bucket. Filtered folders are merged with metadata from `public.design_collections` (`collection_name`, `display_name`, `description`, `badge`, `is_active`). The admin collections manager creates folders, uploads/renames/removes artwork, and edits the matching `design_collections` row. New collections require at least one uploaded image because Storage does not retain empty folders.

Print placements and branding come from `public.print_options` (ordered by `sort_order`) and `public.logo_options` (ordered by `additional_price`). Both tables expose `is_active`, and `logo_options` also carries `option_type` and `allowed_placements` (`text[]`). Unit price is calculated as `base_price + print_option.additional_price + logo_option.additional_price`, multiplied by quantity.

Checkout writes to `public.orders`, one row per item, sharing a `cart_group_id`. Orders are created through the `public.submit_customer_order` RPC, which requires an authenticated **active** account, recomputes `unit_price`/`total_price` from live catalog prices, and inserts every row in one transaction. Customers can read their own orders; staff with `orders.edit` may update `status`. Never trust a client-submitted `total_price`.

Run these migrations in the Supabase SQL Editor before checkout:
1. `supabase/migrations/20261101000000_cart_order_fields.sql` — adds `customer_address`, `cart_group_id`, `order_details`, and `created_at`.
2. `supabase/migrations/20261117000000_auth_rbac_customer_accounts.sql` — customers, profiles, order RLS, and the RBAC functions (`is_staff`, `has_permission`, `is_account_active`).
3. `supabase/migrations/20261118000000_catalog_rls_and_customer_profile.sql` — catalog RLS, `profiles.secondary_phone`, and the `submit_customer_order` RPC.
4. `supabase/migrations/20261118000100_customer_own_upload_read.sql` — lets customers read the artwork attached to their own orders in `/account`.
5. `supabase/migrations/20261123000000_checkout_and_storage_hardening.sql` — backfills legacy accounts, fixes server-side logo pricing, makes the RPC the only order writer, and scopes private artwork uploads to the signed-in user's UID.

Custom cart artwork uploads go to the private `custom_design_uploads` bucket under `designs/<user-id>/`; custom logos go under `logos/<user-id>/`. The order row stores only their storage paths in `order_details`. The admin order-details modal creates 10-minute signed URLs for previews. Only **authenticated active** accounts may upload to their own folder; staff with `orders.view` and the customer who owns the order may read or sign those objects.

Garment mockups live in the public `apparel-mockups` bucket and their public URLs are stored on `apparel_products.image_url`.

## Accounts, roles and admin access

Customers sign up at `/signup`, sign in at `/login`, and manage orders, contact numbers, address, and password at `/account`. Guests can browse, design, and build a cart; the cart is kept in `localStorage` so nothing is lost when they are sent to `/login?redirect=/cart`. Checkout and custom file uploads require an authenticated **active** account.

Account status lives on `public.profiles.account_status`: `active`, `frozen`, or `banned`.
- `banned`: the account is signed out immediately on profile load and cannot sign back in.
- `frozen`: the customer can still sign in and view `/account`, but cannot create orders (enforced in the UI and by `is_account_active` inside RLS and the order RPC).

The `/admin` workspace is protected by Supabase Auth plus the `public.user_roles` table. Staff roles are `super_admin` and `admin`. Any other role is signed out with `This account does not have admin access.` Permissions are granular strings stored in `user_roles.permissions`; `super_admin` implicitly holds every one of them.

| Permission | Unlocks |
| --- | --- |
| `orders.view` | Orders board, order details, signed artwork previews |
| `orders.edit` | Changing order status |
| `pricing.manage` | Print placements and logo/branding pricing |
| `catalog.manage` | Apparel catalog CRUD |
| `collections.manage` | Design collections and artwork |
| `customers.view` | Customer list and order history |
| `customers.manage` | Freezing and banning accounts |
| `team.manage` | Granting/revoking admin permissions (super admin only) |

A newly promoted admin starts with `orders.view` only. `super_admin` can grant the rest from `/admin/team`, where a customer account is promoted by email. Client-side route protection is not an authorization boundary on its own; keep RLS policies on `user_roles` and every admin-managed table.

## Cart and checkout

The Cart keeps selected items and customer details in `localStorage` under the versioned key `ninja_wear_cart_v1`. Name, email, and phone come from the signed-in profile, so checkout only asks for the delivery address (with an optional backup phone). An address can be saved back to `public.profiles` for future orders. Submitting uploads any custom artwork/logos, calls the `submit_customer_order` RPC, and clears the local cart after Supabase accepts the batch. If the RPC fails, uploaded files are removed where Storage permissions allow cleanup. No payment is collected in this flow.

## WhatsApp

Set `VITE_WHATSAPP_NUMBER` to the team's international number using digits only, including the country code. The contact form opens a prefilled WhatsApp support message. The custom builder does not use WhatsApp as a checkout or order channel.
