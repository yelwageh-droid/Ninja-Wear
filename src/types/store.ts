// TypeScript interfaces for Ninja Wear - Apparel Storefront
// Shared data models for products, designs, options, cart, orders, and roles

export interface ApparelProduct {
  id: string;
  category: string;
  fit_type: string;
  sizes: string[];
  colors: string[];
  base_price: number;
  image_url: string;
  is_active: boolean;
  is_custom_request: boolean;
  created_at: string;
}

export interface DesignCollection {
  id: string;
  collection_name: string;
  display_name: string;
  description: string;
  badge: string | null;
  is_active: boolean;
  created_at: string;
  coverImage?: string;
  designCount?: number;
}

export interface Design {
  id: string;
  name: string;
  fileName: string;
  image: string;
  collectionName: string;
}

export interface PrintOption {
  id: string;
  name: string;
  description: string;
  additional_price: number;
  sort_order: number;
  is_active: boolean;
}

export interface LogoOption {
  id: string;
  option_type: 'none' | 'brand_logo' | 'custom_upload';
  label: string;
  allowed_placements: string[];
  additional_price: number;
  is_active: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  category: string;
  fit_type: string;
  color: string;
  size: string;
  quantity: number;
  base_price: number;
  designMode: 'our' | 'custom' | 'none';
  collectionName?: string;
  collectionDisplayName?: string;
  designName?: string;
  designFileName?: string;
  customArtwork?: { name: string; dataUrl: string } | null;
  printOption: PrintOption;
  logoOption: LogoOption;
  logoPlacement?: string;
  customLogo?: { name: string; dataUrl: string } | null;
  printNotes?: string;
  bulkDetails?: { organization?: string; estimatedQuantity?: number; breakdown?: string };
  unitPrice: number;
  totalPrice: number;
  isCustomRequest?: boolean;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
  address: string;
}

export type AccountStatus = 'active' | 'frozen' | 'banned';

// One row per auth user (customers + staff) / صف لكل مستخدم في Supabase
export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  secondary_phone: string;
  address: string;
  account_status: AccountStatus;
  created_at: string;
  updated_at: string;
}

// A customer with aggregated order counts for the admin customers list / عميل مع إحصاءات طلباته
export interface CustomerSummary {
  profile: Profile;
  email: string | null;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  lastOrderAt: string | null;
}

export interface OrderRow {
  id: string;
  cart_group_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  product_info: string;
  design_name: string;
  print_option: string;
  logo_option: string;
  order_details: any;
  total_price: number;
  status: 'Pending' | 'Confirmed' | 'Printing' | 'Shipped' | 'Completed' | 'Cancelled';
  created_at: string;
}

export interface OrderGroup {
  id: string;
  cartGroupId: string | null;
  key: string | null;
  latestTimestamp: number | null;
  orders: OrderRow[];
  itemCount: number;
  totalPrice: number;
  status: string;
  primaryOrder: OrderRow;
}

export type StaffRole = 'super_admin' | 'admin';
export type UserRoleName = StaffRole | 'user';

export interface UserRole {
  user_id: string;
  role: UserRoleName;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

// A staff member with their role row joined for the Team manager / عضو فريق مع دوره لإدارة الفريق
export interface TeamMember {
  user_id: string;
  role: UserRoleName;
  permissions: string[];
  full_name: string;
  email: string | null;
  account_status: AccountStatus;
}
