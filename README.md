# Ninja Skins

A React and Vite storefront for browsing laptop skin collections, configuring designs, and contacting the support team.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and add the project credentials and WhatsApp number.
3. Start the dev server with `npm run dev`.
4. Check a production bundle with `npm run build`.

Never commit `.env` or service-role credentials. The browser uses only the Supabase anon/public key; protect database rows with Supabase Row Level Security and storage policies.

## Supabase data

The laptop catalog reads active rows from `AVL_Laptops`. It uses `id`, `brand`, `series`, `models`, `base_price`, `image_url`, `is_active`, and `is_custom_request`. Rows marked as custom requests appear as a request card and let the visitor enter their laptop brand and model.

The admin laptop manager reads all `AVL_Laptops` rows and writes inserts, edits, image URL changes, and `is_active` updates through the browser Supabase client. Admin sign-in currently checks for an authenticated Supabase session but does not verify an admin role. Enforce admin-only reads and writes with Row Level Security policies tied to a trusted admin claim before using these mutations in production; client-side route protection is not an authorization boundary.

Collection names come from folders in the public `Skins` storage bucket. Images inside each folder are treated as designs. `COLLECTIONS_INFO` is optional and can provide `collection_name` (or `name`), `description`, and `badge` values.

The admin collections manager reads folders and previews from `Skins`, inserts or updates `COLLECTIONS_INFO`, and uploads, renames, and removes images in each folder. New collections require at least one uploaded image because Storage does not retain empty folders. To persist a separate public display label without changing a storage folder's identity, configure `collection_name` (matching the folder), `display_name`, `description`, and `badge` columns. Grant the authenticated admin SELECT, INSERT, and UPDATE access to `COLLECTIONS_INFO` and the required list/upload/move/delete permissions on the `Skins` bucket through Row Level Security; the current client-side session check does not verify an admin role.

The cart writes each checkout to `public.orders`, one row per item, sharing a `cart_group_id`. Run `supabase/migrations/20261101000000_cart_order_fields.sql` in the Supabase SQL Editor before checkout; it adds `customer_address`, `cart_group_id`, `order_details`, and `created_at`. The base table must have a generated `id` column and the existing customer, laptop, design, coverage, logo, total, and status columns. Grant guest (`anon`) INSERT only for valid `Pending` orders, and grant SELECT/UPDATE only to a trusted admin role through Row Level Security. Do not grant guest SELECT or UPDATE. Admin login currently checks for an authenticated session but does not yet verify an admin role, and `total_price` is client-submitted; treat these as pending requests and verify the details before fulfillment or payment.

Custom cart artwork uploads go to the private `custom_design_uploads` bucket under `designs/`; custom logos go under `logos/`. The order row stores only their storage paths in `order_details`. The admin order-details modal creates 10-minute signed URLs for previews. Allow guest INSERT to `storage.objects` for this bucket's `designs/` and `logos/` paths, and restrict SELECT/signing access to trusted admins. The application does not store signed URL tokens.

Dashboard revenue is summed from `Completed` order rows and pending orders are counted by checkout group. The Orders Manager groups new rows by `cart_group_id`; legacy rows are grouped only when customer name, email, phone, and timestamps match within 24 hours. The dashboard also reads active laptop and collection counts from the live catalog and Storage bucket.

Coverage choices and their additional prices are currently hard-coded in the custom builder until a Supabase table is created for them. Visitors can choose one of our collection designs or attach their own design image. Logo preferences include with/without a logo cut, a custom uploaded logo, or our logo, with placement for the latter two.

The Cart keeps selected items and customer details in local storage until checkout. Submitting uploads any custom artwork/logos, creates one `Pending` order row per cart item, and clears the local cart after Supabase accepts the batch. Uploads are removed if inserting the order rows fails, where Storage permissions allow cleanup. No payment is collected in this flow.

## WhatsApp

Set `VITE_WHATSAPP_NUMBER` to the team's international number using digits only, including the country code. The contact form opens a prefilled WhatsApp support message. The custom builder does not use WhatsApp as a checkout or order channel.
