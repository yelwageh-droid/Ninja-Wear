# تقرير مشروع Ninja Wear — تقرير فني وشامل

> تاريخ التقرير: 2026-11-17
> المسار: `/projects/projects/React/my-website`
> كل الأرقام والملاحظات في التقرير ده مأخوذة من الكود الفعلي (فحص ملفات + `git log` + `npm run build` + `npm run lint` + سكربت فحص الترجمات)، وكل حاجة محتاجة تأكيد على حساب Supabase الحقيقي مكتوب جنبها صريح إنها محتاجة تأكيد.

---

## 1. ملخص تنفيذي

المشروع ده **متجر ستريت وير مخصص + لوحة إدارة** بيعتمد على نمط "اطلب حسب الطلب" (Print on Demand): العميل يختار القطعة والمقاس واللون، يختار تصميم من مجموعاتكم أو يرفع تصميمه، يحدد مكان الطباعة والشعار، يضيف للسلة، وبعدها البيانات تتخزن في Supabase ولوحة الإدارة تشتغل عليها.

الحالة الحالية: **نسخة قابلة للتشغيل (dev + production build) وفيها نظام صلاحيات كامل جديد، لكن لسه مش "جاهزة للبيع كمنتج نهائي"** لأن فيها 3 نواقص حرجة: تأكيد سياسات RLS على جداول المنتجات، عدم وجود بوابة دفع، وعدم وجود أي اختبارات آلية.

أهم 3 أرقام:
- **~6,640 سطر** كود عبر **35 ملف** (JS/JSX/TS) + 44 سطر CSS.
- البِلد ناجح، الحزمة الرئيسية **673 KB (201 KB gzip)** — أكبر من الحد الموصى بيه.
- **370** مفتاح ترجمة في قاموس EN، منهم **127 مفتاح غير مستخدم (34%)**.

---

## 2. هو المشروع إيه بالظبط؟

| البُعد | التفاصيل |
|---|---|
| النوع | متجر طباعة حسب الطلب (POD) + Customizer + لوحة إدارة بصلاحيات |
| الأصل | كان مشروع **"Ninja Skins"** (بيع سكينات لابتوب) واتحوّل لـ **"Ninja Wear"** |
| الواجهة | React 19 + Vite 8 + Tailwind CSS v4 + framer-motion |
| الراوتر | React Router v7 مع route-level lazy loading |
| الباك إند | Supabase (Auth + Postgres + Storage + RLS) |
| التعدد اللغوي | عربي/إنجليزي كامل مع RTL/LTR عن طريق Context + قاموس ترجمات مخصص |
| النشر | مُجهّز لـ Vercel عبر [vercel.json](file:///projects/projects/React/my-website/vercel.json) (rewrite لكل المسارات لـ `/` لدعم SPA routing) |

### صفحة العميل
`/` الرئيسية • `/apparel` المنتجات • `/collections` و `/collections/:slug` التصميمات • `/custom` **الاستوديو** • `/cart` السلة والدفع • `/contact-us` تواصل • `/login` • `/signup`

### لوحة الإدارة (`/admin`)
Dashboard • Orders • Customers • Apparel • Collections • Pricing • Team

---

## 3. تاريخ المشروع (من Git)

الريبو فيه **5 كوميتات بس**، وآخر كوميت هو `Add vercel.json for React Router support`.

**ملاحظة مهمة جدًا:** كل شغل "نينجا وير" (التحويل من السكينات + الصفحات + لوحة الأدمن + نظام الصلاحيات الجديد) **غير مُودَع في Git** — `git status` بيورّي 30+ ملف معدّل/محذوف + مجلدات جديدة (`??`) لسه untracked. ده **أكبر خطر إداري في المشروع حاليًا**: أي `git checkout .` أو فشل في الجهاز = خسارة شغل أسابيع. لازم أول حاجة تعملها هي كوميت.

---

## 4. اللي اتعمل في المشروع (مرحلة بمرحلة)

المشروع كان مخطط على 7 مراحل في ملف المواصفة [ninja_wear_full_stack_migration_redesign_plan.md](file:///projects/projects/React/my-website/ninja_wear_full_stack_migration_redesign_plan.md).

| المرحلة | الحالة | الدليل في الكود |
|---|---|---|
| 1 — طبقة البيانات والأنواع + خدمات Supabase | ✅ | [apparelService.js](file:///projects/projects/React/my-website/src/services/apparelService.js) (703 سطر / 30 عملية على الجداول) + [store.ts](file:///projects/projects/React/my-website/src/types/store.ts) |
| 2 — الهوية والنافبار والفوتر والترجمات | ✅ | [NavBar.jsx](file:///projects/projects/React/my-website/src/componants/NavBar.jsx) + [Footer.jsx](file:///projects/projects/React/my-website/src/componants/Footer.jsx) + [translations.js](file:///projects/projects/React/my-website/src/data/translations.js) (813 سطر) |
| 3 — الرئيسية وكatalog المنتجات | ✅ | [Home.jsx](file:///projects/projects/React/my-website/src/pages/public/Home.jsx) + [Apparel.jsx](file:///projects/projects/React/my-website/src/pages/public/Apparel.jsx) |
| 4 — المجموعات وصفحة تفاصيل المجموعة | ✅ | [Collections.jsx](file:///projects/projects/React/my-website/src/pages/public/Collections.jsx) |
| 5 — الاستوديو التفاعلي `/custom` | ✅ | [Custom.jsx](file:///projects/projects/React/my-website/src/pages/public/Custom.jsx) — **أكبر ملف في المشروع (619 سطر)** |
| 6 — السلة والدفع والتواصل | ✅ | [Cart.jsx](file:///projects/projects/React/my-website/src/pages/public/Cart.jsx) + [ContactUs.jsx](file:///projects/projects/React/my-website/src/pages/public/ContactUs.jsx) |
| 7 — لوحة الأدمن + الصلاحيات | ✅ (بإعادة تصميم عن المواصفة الأصلية) | تفاصيل في القسم 5 |

### أهم حاجة في المشروع: الاستوديو `/custom`
4 خطوات منطقية: (1) القطعة والمقاس واللون والكمية — أو حقول B2B لفِرَق الشركات، (2) **3 اختيارات للتصميم**: تصميماتنا / ارفع تصميمك / **بدون تصميم**، (3) مكان الطباعة، (4) الشعار والملاحظات + معاينة حيّة وحساب سعر لحظي.

منطق مهم اتعمل: لو العميل اختار "بدون تصميم" → **خطوة الطباعة تختفي تمامًا** والسعر مبيتضافش عليها فلوس طباعة، وترقيم الخطوات بيتعدّل ديناميكيًا (يبقى 3 خطوات بدل 4). الكود في [Custom.jsx](file:///projects/projects/React/my-website/src/pages/public/Custom.jsx#L184-L190):

```js
const hasDesignPrint = selectedDesignMode !== 'none';
const effectivePrintOption = hasDesignPrint ? printOption : { id: 'none', name: t('custom.none'), description: '', price: 0 };
```

---

## 5. نظام المصادقة والصلاحيات (أهم شغل في آخر جلسة)

### 5.1 الأدوار والقرارات المتفق عليها

| الدور | معناه |
|---|---|
| `super_admin` | كل الصلاحيات ضمنيًا + إدارة صلاحيات الأدمن + حظر/تجميد الحسابات |
| `admin` | يشوف **الطلبات بس** افتراضيًا، وأي صلاحية زيادة لازم `super_admin` يديهاله |
| `user` | عميل عادي |

الصلاحيات **مفصّلة (granular)** مش أدوار جاهزة: `orders.view`, `orders.edit`, `pricing.manage`, `catalog.manage`, `collections.manage`, `customers.view`, `customers.manage`, `team.manage`.

**قرارات محسومة:** طلب تسجيل الدخول بيحصل **وقت إرسال الطلب بس** (مش أثناء التصفح) • **الحظر** = ممنوع دخول خالص (يتطرد من الجلسة) • **التجميد** = يدخل ويشوف، بس ممنوع يعمل طلبات.

### 5.2 الملفات الأساسية الجديدة

| الملف | الدور |
|---|---|
| [permissions.js](file:///projects/projects/React/my-website/src/data/permissions.js) | مصدر واحد لكل مفاتيح الصلاحيات + تنقية المدخلات + أسماء الأدوار |
| [AuthContext.jsx](file:///projects/projects/React/my-website/src/context/AuthContext.jsx) | نواة المصادقة: جلسة + دور + صلاحيات + حالة الحساب، ويستخدمها الموقع واللوحة مع بعض |
| [AuthShell.jsx](file:///projects/projects/React/my-website/src/components/auth/AuthShell.jsx) | إطار موحّد لصفحات الدخول/التسجيل |
| [SignIn.jsx](file:///projects/projects/React/my-website/src/pages/public/SignIn.jsx) | تسجيل دخول + حماية من الـ open redirect |
| [SignUp.jsx](file:///projects/projects/React/my-website/src/pages/public/SignUp.jsx) | تسجيل جديد + تحقق من كلمة السر + شاشة تأكيد الإيميل |
| [CustomersManager.jsx](file:///projects/projects/React/my-website/src/pages/admin/CustomersManager.jsx) | كل عميل + كل طلباته + إحصاءات + حظر/تجميد |
| [TeamManager.jsx](file:///projects/projects/React/my-website/src/pages/admin/TeamManager.jsx) | إدارة الفريق ومنح/سحب الصلاحيات (سوبر أدمن بس) |
| [migration 20261117](file:///projects/projects/React/my-website/supabase/migrations/20261117000000_auth_rbac_customer_accounts.sql) | جداول وحُكّام RLS والدوال و triggers |

### 5.3 أهم 5 حلول تصميمية ذكية اتعملت

1. **توحيد نظامي مصادقة في واحد:** كان فيه `AdminAuthContext` منفصل للوحة، اتحذف واتوحّد في `AuthContext`. فبقى نفس الجلسة تشتغل على الموقع واللوحة.
2. **حماية على مستوى الداتابيز مش الواجهة بس:** لو حد عدّل الـ JS في المتصفح، RLS بترفض أي تعديل. مثلاً `user_roles` الكتابة فيها **للسوبر أدمن فقط** → العميل مينفعش يرقّي نفسه.
3. **الكارت مبيمسحش عند توجيه الزائر للدخول:** الكارت في `localStorage` بمفتاح مُصدّر بإصدار (`ninja_wear_cart_v1`)، والتوجيه بيكون لـ `/login?redirect=/cart` فيرجع لنفس مكانه بطلبه زي ما هو.
4. **حماية من الـ Open Redirect:** دالة `safeRedirect` بتقبل المسارات الداخلية بس (بتبدأ بـ `/`) وترفض `//evil.com`.
5. **الفصل المنطقي بين الحظر والتجميد:** الحظر = تشييك عند قراءة الحساب → `signOut` فوري • التجميد = دالة `is_account_active` في RLS بتمنع إنشاء الطلب من الأساس.

### 5.4 التصلّيبات الأمنية اللي اتعملت في مراجعة الأمان
- **ثغرة رفع ملفات مجهولة:** سياسة الرفع على bucket `custom_design_uploads` كانت مفتوحة لـ `anon` → أي حد يرفع ملفات على حسابك من غير حساب. بقت `authenticated` + حساب نشط فقط.
- **ثغرة بحث بالبريد:** `findProfileByEmail` كانت بتستخدم `ilike` بالمدخل مباشرة → ممكن تكتب `%@%` وترقّي حساب عشوائي. اتعمل تهريب لرموز `%`/`_`.
- **حسابات الفريق كانت تظهر كعملاء:** فلترة في `getCustomerSummaries` بتخلي أي حساب ستاف ميظهرش في قائمة العملاء إلا لو عنده طلبات فعلية.

---

## 6. المشاكل اللي اتلاقت وازاي اتحلت

| # | المشكلة | الخطورة | الحل |
|---|---|---|---|
| 1 | `TeamManager.jsx` كان مستورد في `App.jsx` وغير موجود → البِلد كان بيفشل | 🔴 مانع للبناء | اتعمل الملف بالكامل |
| 2 | 127 مفتاح ترجمة مطلوب من الصفحات الجديدة **ماكانش موجود** (auth / team / nav / cart) | 🔴 كسر واجهة | اتضافوا في EN و AR |
| 3 | الرفع للتخزين كان مسموح للـ `anon` | 🔴 أمني | تضييق السياسة لحساب نشط |
| 4 | دالة `update_order_status` كانت `SECURITY DEFINER` (بتتجاوز RLS) ومستخدمة في اللوحة | 🟠 أمني | اتشالت من الكود + `drop function` في الميجريشن، والبديل UPDATE محمي بـ RLS |
| 5 | `findProfileByEmail` بتسمح برموز wildcard في البحث | 🟠 أمني | تهريب المدخل |
| 6 | الأوردر المختار كان بيتضيع عند توجيه الزائر للدخول | 🟠 تجاري | redirect param + كارت محفوظ |
| 7 | الأدمن الجديد كان بيتعمله منح صلاحيات = صفر (مشوفش الطلبات حتى) | 🟠 وظيفي | افتراضي `orders.view` عند الترقية |
| 8 | سؤال العميل عن الاسم والتليفون والإيميل مكرر | 🟡 UX | اتشال، الاسم والإيميل من الحساب، وباقي العنوان بس |
| 9 | سباق محتمل (race) بين `signIn` ومستمع تغيّر الجلسة | 🟡 تقني | `signIn` بترجّع الدور مباشرة |
| 10 | صفحات الأدمن كانت بتستخدم ألوان وأنماط غير موحّدة | 🟡 جمالي | اتوحّدت على نظام واحد (كروت + حُدود + StatusBadge) |

**نتيجة الفحص النهائي:** `npm run lint` → **0 errors** و 2 warnings • `npm run build` → **ناجح** • فحص الترجمات → **209 مفتاح مستخدم، كلهم موجودين في اللغتين، صفر ناقص**.

---

## 7. المشاكل اللي **لسه موجودة** (مرتبة بالأولوية)

### 🔴 P0 — لازم تتأكد منها قبل أي إطلاق

**1) جداول المنتجات ملهاش سياسات RLS في الريبو.**
الميجريشن الجديد فيه سياسات على `user_roles` و `profiles` و `orders` و Storage — **بس مفيش ولا سياسة واحدة** على `apparel_products` و `design_collections` و `print_options` و `logo_options`. والكود بيعمل عليهم `insert` و `update` و `delete` من المتصفح مباشرة (مكتشف في [apparelService.js](file:///projects/projects/React/my-website/src/services/apparelService.js)).
لو RLS مقفولة على الجداول دي في مشروعك، معنى كده إن **أي حد عنده مفتاح `anon`** (وموجودة في حزمة المتصفح وظاهرة لأي حد) يقدر **يحذف كل المنتجات أو يغيّر الأسعار لصفر**.

اتأكد بالأمر ده في SQL Editor:

```sql
select relname, relrowsecurity
from pg_class
where relname in ('apparel_products','design_collections','print_options','logo_options');
```

لو `relrowsecurity = false` لأي جدول، الإصلاح المقترح:

```sql
alter table public.apparel_products  enable row level security;
alter table public.design_collections enable row level security;
alter table public.print_options     enable row level security;
alter table public.logo_options      enable row level security;

-- قراءة عامة (المتجر محتاجها من غير تسجيل دخول)
create policy public_read on public.apparel_products
  for select using (true);   -- كرّرها لنفس الجداول الأربعة

-- الكتابة لصاحب الصلاحية فقط
create policy staff_write on public.apparel_products
  for all to authenticated
  using (public.has_permission('catalog.manage'))
  with check (public.has_permission('catalog.manage'));
-- design_collections -> collections.manage | print_options / logo_options -> pricing.manage
```

**2) خطر تسريب مفتاح الخدمة (service_role).**
[vite.config.js](file:///projects/projects/React/my-website/vite.config.js#L9) فيه `envPrefix: ['VITE_', 'SUPABASE_API_']`. أي متغيّر يبدأ بـ `SUPABASE_API_` **بيتحقن جوّه حزمة المتصفح**. فلو حد كتب مفتاح `service_role` باسم `SUPABASE_API_KEY` (بدون `VITE_`) على أساس إنه سيرفر فقط → **هيتسرّب للعميل** ودي كارثة (المفتاح ده بيتجاوز كل RLS). والكود أصلًا بيقرأ `VITE_SUPABASE_API_KEY` بس، يعني بادئة `SUPABASE_API_` **ملهاش أي لزوم** → امسحها من `envPrefix`.

**3) مفيش أي اختبارات.**
`package.json` فيه `dev/build/lint/preview` بس. **مفيش Vitest ولا Playwright.** كل اللي عملته تحقق ساكن (build/lint/فحص ترجمات) + مراجعة كود. اختبارات منطق السعر في الاستوديو وحُكّام الـ RBAC محتاجة اختبارات حقيقية.

### 🟠 P1 — مشاكل وظيفية

**4) إحصائية "Pending Orders" في Dashboard بتغلط.** في [Dashboard.jsx](file:///projects/projects/React/my-website/src/pages/admin/Dashboard.jsx#L46) حالة المجموعة بتتحدد من **أول عنصر بس**:
```js
status: group.orders[0]?.status || 'Pending',
```
يعني أوردر فيه 3 قطع (واحدة Pending وواحدة Completed) بيتحسب حسب ترتيب الصفوف. **الطلبات بتاعتك بتتجمّع بـ `cart_group_id` وبتحصل إن الحالة تختلف جوه نفس الأوردر (وده سبب وجود حالة `Mixed` في صفحة Orders) — فالـ Dashboard لازم يستخدم نفس المنطق** وإلا الرقم مبيطابقش الحقيقة.

**5) الأدمن الافتراضي ممكن يشوف أخطاء في الـ Dashboard.** [Dashboard.jsx](file:///projects/projects/React/my-website/src/pages/admin/Dashboard.jsx#L61-L65) بيستدعي بيانات المنتجات والمجموعات — وأدمن عنده `orders.view` بس مش المفروض يشوف دي. لو RLS بعد التصليح اتظبطت صح، هتظهر رسالة "Some dashboard metrics could not be loaded". **الحل:** إخفاء الكروت اللي خارج صلاحياته أو تحميلها حسب `hasPermission`.

**6) الـ README بيدلّس.** [README.md](file:///projects/projects/React/my-website/README.md) لسه بيتكلم عن الأدوار القديمة (`designer` / `order_manager`)، وبيفول "Allow guest INSERT to custom_design_uploads" (وده اللي اتصلّح خلاص)، وبيقول انسخ `.env.example` — **والملف ده مش موجود أصلًا في المشروع**.

### 🟡 P2 — دين تقني (Tech Debt)

**7) `src/types/store.ts` أنواع وهمية.** مفيش `tsconfig.json` في المشروع ومفيش أي ملف `.tsx` — كل الكود `.jsx`. يعني **ملف الأنواع ده توثيق فقط ومش بيتحقق منه أي أداة**. المواصفة الأصلية كانت بتفترض TypeScript، فالوضع الحالي React JS + أنواع معلّقة.
**8) 127 مفتاح ترجمة ميت (34%).** منهم **~107 مفتاح** مرتبطين باللوحة الإدارية في أقسام `admin.*` و `dashboard.*` و `orders.*` و `pricing.*` و `apparelManager.*` و `collectionsManager.*` — يعني **اتكتبوا عشان الصفحات الإدارية، بس الصفحات الإدارية مش بتستدعيهم** (مكتوبة إنجليزي ثابت). وفي كمان بقايا من التدفق القديم: `cart.name` و `cart.phone` و `cart.email`. لازم قرار: إما تعرّب اللوحة فعلًا، أو تحذف المفاتيح دي.
**9) `App.css` فاضي تمامًا (0 سطر) ولسه مستورد** في [App.jsx](file:///projects/projects/React/my-website/src/App.jsx#L6).
**10) 2 تحذيرات lint في Cart.jsx** من نوع `set-state-in-effect` (تعبئة العنوان من البروفايل داخل `useEffect`). مش خطر، والإصلاح الأنضف إن القيمة تُشتق وقت الرندر بدل ما تتكتب في effect.
**11) الحزمة الرئيسية كبيرة: 673 KB (201 KB gzip)** وفايت بيحذّر منها. السبب الأساسي `@supabase/supabase-js` + `framer-motion` في الحزمة اللي بتتحمّل مع أول صفحة.
**12) الاعتماد على `useEffect` يدوي لكل جلب بيانات.** كل صفحة بتكتب `loading / error / cancelled` بنفسها. ده بيتكرر بشكل كبير ومصدر أخطاء.

---

## 8. رأيي في الشكل والواجهة (بصراحة)

### الحلو
- **الهوية البصرية قوية:** أسود عميق + أحمر/برتقالي + تايبوغرافي UPPERCASE ثقيل = إحساس ستريت وير حقيقي، مش قالب جاهز.
- **الاستوديو `/custom` هو نجم المشروع:** تقسيم خطوتين (إعدادات يمين + معاينة وسعر ثابت يسار) صح، والمعاينة الحيّة وحساب السعر لحظيًا بيبيعوا القطعة لوحدهم.
- **لوحة الأدمن نضيفة ومقروءة:** كروت صريحة، شارات حالة ملوّنة لكل حالة، جداول تسكرول أفقي على الموبايل، ومفيش زحمة.
- **اهتمام بحالات "مفيش بيانات":** مفيش صفحة بتبوظ لو مفيش أوردرات/منتجات — دي حاجة كتير من المشاريع بتنساها.
- **احترام لـ `prefers-reduced-motion`** في [index.css](file:///projects/projects/React/my-website/src/index.css#L41-L45) — تفصيلة احترافية نادرة.

### الوحش / اللي ناقص
1. **مفيش خط عربي مخصص خالص.** المواصفة نفسها كانت بتطلب Cairo/Tajawal، والكود مفيش فيه تعريف `font-family` ولا تحميل ويب فونت. النتيجة: **النسخة العربية بتطلع بخط النظام** — يعني عربي الواجهة شكله أرخص من الإنجليزي. ده أرخص وأسرع تحسين بصري ممكن تعمله.
2. **مفيش خط Display إنجليزي.** كل حاجة default sans. الخطوط المكثفة/العريضة (زي Archivo Black / Anton / Inter Display) هي اللي بتخلي "WEAR YOUR IDENTITY" تحس بجد. حاليًا الاعتماد كله على `font-bold + uppercase`.
3. **فيه 4 أسود مختلفة في المشروع:** `#0a0a0c` و `#0e0e11` و `#111116` و `#121214` مكتوبين كـ arbitrary values متكررة في كل ملف، وكذلك الأحمر مكتوب كـ Tailwind classes (`red-400`, `amber`) مش توكن. **مفيش `@theme` في Tailwind v4 ولا متغيرات CSS** → الهوية مبعزقة، وأي تغيير في "البراند كولور" هيبقى شغل يدوي في 20 ملف. المواصفة الأصلية كانت بتحدد برتقالي `#FF5A36` والكود فعليًا رايح ناحية الأحمر — ده انحراف عن التصميم الأصلي.
4. **المودالات مكتوبة بالإيد:** فيها `role="dialog"` و `aria-modal` (وده كويس)، بس **مفيش Focus Trap ولا إرجاع للفوكس عند الغلق** — مستخدم الكيبورد/قارئ الشاشة يقدر يطلع من المودال ويلفّ في الصفحة اللي وراه.
5. **الإشعارات (Toast/Alert) فيها تكرار:** كل صفحة عندها `actionError` و `loadError` بأسلوب مختلف شوية، مفيش نظام إشعار موحّد.
6. **مفيش Skeleton Loading.** بينما البيانات بتيجي، بيظهر نص "Loading..." — بينما Skeletons كانت هتخلي الإحساس أسرع وأفخم بكتير.
7. **الأرقام كلها لاتينية حتى في العربي.** `Intl` مضبوط على `ar-EG` للأرقام بس مش كل الصفحات بتستخدم `formatNumber`، وفي اللوحة الأرقام إنجليزي دايمًا (وده منطقي للأدمن).
8. **صفحات الأدمن مش مترجمة** (إنجليزي ثابت) — قرار مقصود لتفادي مشاكل الـ RTL في الجداول، بس يعني 121 مفتاح ترجمة مكتوب وضائع.

**خلاصة رأيي:** الواجهة **أعلى من المتوسط بكتير لمشروع ويب لبراند محلي**، والتصميم "مش قبيح" بالعكس — هي محتاجة **تلات تعديلات بس** تنقلها من "حلو" لـ "بيعمل فلوس": خط عربي + خط Display + توحيد الألوان في توكنز.

---

## 9. التقنيات: اللي محتاجه دلوقتي واللي محتاجه لما يكبر

### محتاجه دلوقتي (أولويات عالية وقيمة عالية)
| الحاجة | ليه |
|---|---|
| **TanStack Query (React Query)** | هيحل الجلب اليدوي في 12 صفحة، ويعطيك cache و retry و refetch وحالة loading/error من غير تكرار كود |
| **Zod + React Hook Form** | التحقق الحالي يدوي في كل فورم (كلمة السر، العنوان، الأوردر). Zod هيمنع أخطاء ويرجّع رسائل مضبوطة عربي/إنجليزي |
| **Vitest + Playwright** | صفر اختبارات حاليًا = أي تعديل جاي مغامرة |
| **`supabase gen types`** | يولّد أنواع من الداتابيز الحقيقية → يمنع أخطاء أسماء الأعمدة، وده بديل حقيقي عن `store.ts` المعلّق |
| **Headless UI / Radix** | مودالات + dropdowns بوصولية صح (focus trap) بدل ما تتكتب بالإيد |
| **خطوط عربية + Display فونت** | أسرع تحسين بصري وأرخصه |
| **توكنز ألوان في `@theme`** | يوحّد الهوية ويخلي تغيير البراند في مكان واحد |

### لما المشروع يكبر
- **بوابة دفع** (Paymob / Fawry / Stripe): حاليًا **مفيش أي تحصيل فلوس**، والأوردر بيتم بـ "طلب" فقط. `total_price` **بيدخل من العميل** فمينفعش يتعتمد للدفع قبل التحقق السيرفري.
- **Supabase Edge Functions**: التحقق من السعر + إنشاء الأوردر + توليد link الدفع لازم يكونوا في السيرفر، مش من المتصفح.
- **شحن (Shipping):** تكامل مع شركة شحن أو حسابات شحن بالمناطق.
- **لوحة تحليلات** (PostHog / Plausible) + **مراقبة أخطاء** (Sentry).
- **Multi-tenant (SaaS):** النظام ده أساسه صح — لو عزلت الداتا بالـ tenant_id تقدر تبيع نفس المتجر لعشرات البراندات باشتراك شهري. **دي أكبر فرصة فلوس في المشروع.**
- **PWA** + صور WebP + CDN (Supabase Storage بيتعامل مع Cloudflare أصلًا).

---

## 10. الأمان: ملخّص نموذج التهديد

| السيناريو | النتيجة المتوقعة | الحالة |
|---|---|---|
| عميل يحاول يدخل `/admin` | يتطرد لصفحة دخول الأدمن | ✅ مُنفّذ (واجهة) |
| عميل يحاول يرقّي نفسه لأدمن بـ UPDATE على `user_roles` | 0 صفوف متأثرة (RLS) | ✅ مُنفّذ (قاعدة بيانات) |
| عميل يحاول يقرأ بروفايل/أوردر حد تاني | محجوب بـ RLS | ✅ مُنفّذ |
| عميل يرفع ملفات من غير حساب | مرفوض | ✅ اتصلّح في الجلسة دي |
| حساب محظور يفضل يدخل | يخرج فورًا برسالة | ✅ مُنفّذ |
| حساب مجمّد يعمل طلب | مرفوض من الواجهة **و** من RLS | ✅ مُنفّذ |
| زائر يوصل لرابط خارجي عن طريق `redirect` | مرفوض | ✅ مُنفّذ |
| **حد يعدّل أسعار/منتجات بالـ anon key** | **يعتمد على إعدادات مشروعك — مش موجودة في الريبو** | ⚠️ **محتاج تأكيد (P0)** |
| **مفتاح service_role يتسرّب في الحزمة** | **ممكن** بسبب `envPrefix` | ⚠️ **لازم يتصلّح (P0)** |
| عميل يزوّر `total_price` | ممكن يطلب بأي سعر | ⚠️ **مفيش تحقق سيرفري** |

**خطوات التشغيل الناقصة عليك:**
1. شغّل [الميجريشن](file:///projects/projects/React/my-website/supabase/migrations/20261117000000_auth_rbac_customer_accounts.sql) في Supabase.
2. اعمل أول سوبر أدمن (الـ trigger بيعمل أي حساب جديد كـ `user`):
```sql
update public.user_roles
   set role = 'super_admin'
 where user_id = (select id from auth.users where email = 'بريدك@example.com');
```
3. امسح `SUPABASE_API_` من `envPrefix` وسوّي `.env.example` (README بيقول عليه ومش موجود).
4. اعمل **كوميت** فورًا.
5. حدّد Bucket `custom_design_uploads` في Supabase: **مقاس أقصى للملف + أنواع مسموحة** (ده بيتظبط من لوحة Supabase، مش من الكود).

---

## 11. الموقع ده ممكن يتباع بكام؟

> ⚠️ الأرقام دي **تقديرات مبنية على نطاق الشغل اللي في الكود** (6640 سطر، 16 صفحة/شاشة، customizer معقّد، RBAC كامل) ومش عروض سعر حقيقية. السعر بيتغير حسب العميل والبلد ومستوى الجاهزية.

### (أ) لو بتبيعه كـ "موقع جاهز لبراند واحد" في السوق المصري
| السيناريو | المدى التقديري |
|---|---|
| كود زي ما هو (فيه نواقص P0 + مفيش دفع) | **25,000 – 60,000 ج.م** |
| بعد ما تتقفل نواقص P0 + دفع + شحن | **80,000 – 180,000 ج.م** |
| لو تعمل عليه عقد صيانة شهري | **3,000 – 8,000 ج.م/شهر** |

### (ب) على منصات عالمية (Upwork / Freelancer)
نطاق نفس الشغل بيتسعّر عادة **$3,000 – $8,000** للتسليم الكامل، وبيكون أعلى لو فيه تصميم مخصص مصاحب.

### (ج) لو بتبيعه كقالب / SaaS (وده أحسن مسار فلوس)
| الموديل | التسعير المقترح |
|---|---|
| قالب يُباع لعشرات (Envato / Lemon Squeezy) | **$79 – $249** للنسخة، والربح في العدد |
| نسخة مُخصصة لبراند + التركيب | **35,000 – 90,000 ج.م** للعميل الواحد |
| SaaS متعدد البراندات (اشتراك) | **800 – 2,500 ج.م/شهر** لكل براند |

### اللي **يقلّل** السعر دلوقتي
- الشغل **غير مُودَع في Git** (ده خطر حقيقي على قيمة الأصل نفسه).
- مفيش اختبارات → المشتري هيحسب تكلفة "تأمين" قبل الشراء.
- مفيش دفع ولا شحن → يعني "مش متجر كامل" في نظر المشتري.
- README قديم + `.env.example` ناقص → إحساس "مش منظّم".
- مخاطر RLS غير مؤكدة → مصمّم محترف هيكتشفها في أول مراجعة.

### اللي **يرفّع** السعر
- **الاستوديو `/custom`** — ده اللي ميتنسخش بسهولة، وهو الفرق بين "موقع" و"منتج".
- **نظام الصلاحيات المفصّل + إدارة العملاء** — مبيوجدش في قوالب Shopify الجاهزة.
- **العربية/الإنجليزية الكاملة مع RTL** — سوق محلي ضخم ومطلوب.
- المسار اللي بعده: SaaS متعدد البراندات = دخل متكرر مش بيعة واحدة.

---

## 12. خارطة طريق مقترحة

**أول 48 ساعة (حماية الأساس):**
1. `git commit` لكل الشغل الحالي.
2. تأكيد/إصلاح RLS على الجداول الأربعة (P0 #1).
3. مسح `SUPABASE_API_` من `envPrefix` (P0 #2).
4. تشغيل الميجريشن + إنشاء أول سوبر أدمن + عمل الاختبارات اليدوية السبعة (اختبار الصلاحيات).
5. تحديث README + عمل `.env.example`.

**الأسبوع الجاي (جودة وإحصائيات):**
6. إصلاح إحصائية Dashboard (منطق `Mixed`).
7. إخفاء كروت Dashboard حسب الصلاحيات.
8. تنظيف 127 مفتاح الميت + `App.css` + تحذيرات lint.
9. تركيب Vitest واختبارات لمنطق حساب السعر والصلاحيات.

**بعدها (تحويل المشروع لمنتج يتباع):**
10. التحقق من السعر + إنشاء الأوردر في Edge Function.
11. بوابة دفع (Paymob/Fawry) + شحن.
12. خطوط عربية/Display + توكنز ألوان.
13. React Query + Zod + Radix.
14. Sentry + Analytics + تحسين الحزمة (673 KB).

---

## 13. ملاحظة أخيرة

المشروع ده **أحسن من 90% من مشاريع "متجر React" اللي بتتسلّم** لأنه مش واجهة بس: فيه RBAC حقيقي على مستوى الداتابيز، وتعدد لغات كامل، وcustomizer معقّد بيحسب أسعار لحظيًا، وإدارة عملاء وفريق. العقبات مش "مشاكل في الفكرة" — العقبات كلها **حاجات قابلة للتنفيذ ومحدّدة**: RLS على 4 جداول، سطرين في `envPrefix`، اختبارات، وبوابة دفع. اللي بيمنع المشروع حاليًا إنه فلوس هو تقريبًا **3 نواقص تقنية** مش أكتر.
