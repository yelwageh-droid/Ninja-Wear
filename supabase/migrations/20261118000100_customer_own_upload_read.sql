-- ============================================================================
-- Ninja Wear — let customers read the artwork they uploaded with their own
-- orders, so /account can render signed thumbnails of their pieces.
-- Staff already read the whole bucket via custom_uploads_staff_select.
--
-- تمكين العميل من قراءة التصميمات التي رفعها مع طلباته ليظهر مصغّر القطعة
-- في صفحة الحساب، مع بقاء بقية الملفات خاصة. السياسة إضافية ومقيّدة بطلباته.
-- ============================================================================

drop policy if exists custom_uploads_customer_select on storage.objects;
create policy custom_uploads_customer_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'custom_design_uploads'
    and exists (
      select 1
        from public.orders o
       where o.customer_id = auth.uid()
         and (
           o.order_details->>'design_image_path' = name
           or o.order_details->>'logo_image_path' = name
         )
    )
  );
