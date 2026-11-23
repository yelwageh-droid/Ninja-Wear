// Granular staff permissions for Ninja Wear / صلاحيات مفصّلة لفريق الإدارة
//
// IMPORTANT / مهم: the database is the source of truth. These keys must match the
// strings used by public.has_permission(...) inside Supabase RLS policies.
// Everything here only drives UI visibility and route guards, never real security.

export const PERMISSIONS = {
  ordersView: 'orders.view',
  ordersEdit: 'orders.edit',
  pricingManage: 'pricing.manage',
  catalogManage: 'catalog.manage',
  collectionsManage: 'collections.manage',
  customersView: 'customers.view',
  customersManage: 'customers.manage',
  teamManage: 'team.manage',
};

// Ordered definition list shared by the Team manager and admin navigation / قائمة مشتركة بين إدارة الفريق ولوحة الإدارة
export const PERMISSION_DEFINITIONS = [
  { key: PERMISSIONS.ordersView, labelKey: 'team.permOrdersView', hintKey: 'team.permOrdersViewHint' },
  { key: PERMISSIONS.ordersEdit, labelKey: 'team.permOrdersEdit', hintKey: 'team.permOrdersEditHint' },
  { key: PERMISSIONS.pricingManage, labelKey: 'team.permPricingManage', hintKey: 'team.permPricingManageHint' },
  { key: PERMISSIONS.catalogManage, labelKey: 'team.permCatalogManage', hintKey: 'team.permCatalogManageHint' },
  { key: PERMISSIONS.collectionsManage, labelKey: 'team.permCollectionsManage', hintKey: 'team.permCollectionsManageHint' },
  { key: PERMISSIONS.customersView, labelKey: 'team.permCustomersView', hintKey: 'team.permCustomersViewHint' },
  { key: PERMISSIONS.customersManage, labelKey: 'team.permCustomersManage', hintKey: 'team.permCustomersManageHint' },
  { key: PERMISSIONS.teamManage, labelKey: 'team.permTeamManage', hintKey: 'team.permTeamManageHint' },
];

export const PERMISSION_KEYS = PERMISSION_DEFINITIONS.map((definition) => definition.key);

// Keep only values the database recognizes and drop duplicates / إبقاء القيم المعروفة فقط وإزالة المكرّر
export function sanitizePermissions(permissions) {
  const unique = new Set(Array.isArray(permissions) ? permissions : []);
  return PERMISSION_KEYS.filter((key) => unique.has(key));
}

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  user: 'Customer',
};

export function roleLabel(role) {
  return ROLE_LABELS[role] || 'Admin';
}
