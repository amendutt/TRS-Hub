export type LogoStatus = 'draft' | 'in_review' | 'approved' | 'published' | 'archived';

export type LogoMarkShape = 
  | 'trs_badge'           // Official Tech Refresh Solution squircle emblem from user's PNG
  | 'trs_minimal'         // Minimalist green wave circuit mark
  | 'haven_arch' 
  | 'minimal_sail' 
  | 'nordic_h' 
  | 'organic_leaf' 
  | 'geometric_crest' 
  | 'none';

export type FontChoice = 'Inter' | 'Syne' | 'Fraunces' | 'Cormorant Garamond' | 'Playfair Display' | 'JetBrains Mono';

export interface LogoConfig {
  brandName: string;
  tagline: string;
  showTagline: boolean;
  fontFamily: FontChoice;
  fontWeight: number;
  letterSpacing: number; // in px
  fontSize: number; // base em or px
  markShape: LogoMarkShape;
  markPosition: 'left' | 'top' | 'mark_only' | 'text_only';
  markScale: number; // 0.6 - 1.5
  primaryColor: string; // e.g. #48B065 (Tech Refresh Solution Green)
  accentColor: string; // e.g. #E6EAED / #94A3B8 (Stem pathway color)
  darkPrimaryColor: string; // e.g. #52B76D
  darkAccentColor: string; // e.g. #DFE3E8
  badgeBorderColor?: string; // e.g. #EAEFF2
  badgeFillColor?: string; // e.g. #FFFFFF or transparent
  stemColor?: string; // secondary circuit stem color
  safeAreaPadding: number;
  aspectRatio: string;
  customSvgData?: string | null;
  customImageUrl?: string | null;
}

export interface LogoVersion {
  id: string;
  logoId: string;
  versionTag: string;
  semanticMajor: number;
  semanticMinor: number;
  semanticPatch: number;
  status: LogoStatus;
  changelog: string;
  authorName: string;
  authorEmail: string;
  reviewNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  config: LogoConfig;
  checksum: string;
}

export type VariantType = 
  | 'horizontal_full' 
  | 'stacked_crest' 
  | 'icon_mark' 
  | 'monochrome_dark' 
  | 'monochrome_light' 
  | 'favicon_32x32' 
  | 'invoice_monochrome';

export interface LogoVariant {
  id: string;
  versionId: string;
  variantType: VariantType;
  label: string;
  format: 'svg' | 'png' | 'webp';
  width: number;
  height: number;
  fileSizeKb: number;
  recommendedUse: string;
}

export interface LogoAuditLog {
  id: string;
  versionId: string;
  versionTag: string;
  action: 'create' | 'update_draft' | 'submit_review' | 'approve' | 'publish_refresh' | 'rollback' | 'archive';
  performedBy: string;
  role: string;
  summary: string;
  diffPayload?: Record<string, any>;
  timestamp: string;
}

export interface BrandSystemSettings {
  id: string;
  activeLogoId: string;
  activeVersionId: string;
  storefrontSyncEnabled: boolean;
  cacheBustHash: string;
  lastRefreshedAt: string;
}

// Dynamic E-Commerce Catalog Models (as per BRD/SRS REQ-CAT and REQ-PRD)
export type AttributeType = 'text' | 'number' | 'dropdown' | 'multi-select' | 'checkbox' | 'date' | 'image';

export interface CategoryAttribute {
  id: string;
  categoryId: string;
  name: string;
  key: string;
  type: AttributeType;
  options?: string[]; // for dropdown/multi-select
  isMandatory: boolean;
  isFilterable: boolean;
}

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  parentCategoryId?: string | null;
  description: string;
  attributes: CategoryAttribute[];
  subcategories?: SubCategory[];
  isActive: boolean;
  productCount: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  title: string;
  attributes: Record<string, string>; // e.g. { Finish: 'Walnut', Size: 'Medium' }
  price: number;
  mrp: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  subCategoryId?: string;
  subCategoryName?: string;
  sku: string;
  mrp: number;
  price: number;
  stock: number;
  lowStockThreshold?: number;
  warehouseStock?: Record<string, number>; // e.g. { 'Central Logistics - BLR': 20, 'North Hub - DEL': 15 }
  status: 'Draft' | 'Published' | 'Out of Stock' | 'Discontinued';
  description: string;
  images: string[];
  dynamicAttributes: Record<string, any>;
  variants: ProductVariant[];
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  taxClass?: 'Standard (18% GST)' | 'Reduced (12%)' | 'Zero Rated (0%)';
  seoTitle?: string;
  seoDescription?: string;
  urlSlug?: string;
  discountScheduled?: {
    percentage: number;
    startDate: string;
    endDate: string;
    active: boolean;
  };
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  variantTitle?: string;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  shippingMethod?: 'Standard Shipping (Free)' | 'Express Courier ($25)' | 'Same-Day Metro Dispatch ($40)';
  trackingNumber?: string;
  paymentMethod: 'Card' | 'UPI' | 'Net Banking' | 'Cash on Delivery';
  paymentStatus: 'Paid' | 'Pending' | 'Refunded';
  orderStatus: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned';
  refundAmount?: number;
  refundReason?: string;
  returnRequested?: boolean;
  returnReason?: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    pincode: string;
  };
}

export interface CustomerAddress {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  ordersCount: number;
  totalSpent: number;
  joinedDate: string;
  status: 'Active' | 'Inactive';
  savedAddresses?: CustomerAddress[];
  wishlist?: string[];
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  value: number;
  usedCount: number;
  usageLimit: number;
  minOrderValue?: number;
  validTill: string;
  status: 'Active' | 'Expired';
}

export interface ProductReview {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment: string;
  date: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  verifiedPurchase: boolean;
}

export interface AdminStaff {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Catalog Manager' | 'Order Fulfillment' | 'Customer Support';
  permissions: string[];
  lastActive: string;
}

export interface AdminAuditLogEntry {
  id: string;
  action: string;
  module: 'Catalog' | 'Category' | 'Order' | 'Inventory' | 'Reviews' | 'Marketing' | 'Brand' | 'Customer';
  performedBy: string;
  role: string;
  details: string;
  timestamp: string;
}

export interface SystemNotification {
  id: string;
  type: 'Email' | 'SMS';
  recipient: string;
  subject: string;
  message: string;
  status: 'Sent' | 'Delivered';
  timestamp: string;
}

export interface StaticPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  lastUpdated: string;
}

export interface HomepageBanner {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  buttonText: string;
  imageUrl: string;
  categoryFilter: string;
  active: boolean;
}

// ==========================================
// SITE CONFIGURATION & FUTURE EXTENSIBILITY
// ==========================================
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'INR' | 'AUD' | 'CAD' | 'SGD';

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateAgainstUSD: number; // e.g. 1.0 for USD, 0.92 for EUR, etc.
  flag: string;
}

export type SiteThemePreset = 
  | 'international_slate'   // Modern high-end international flagship (Slate, Emerald, Clean Light)
  | 'trs_corporate'         // Official Tech Refresh Solution corporate branding (#48B065 Green & Crisp Slate)
  | 'nordic_warm'           // Havn original warm organic sand & deep forest
  | 'cyber_indigo'          // High-tech enterprise indigo & electric cyan
  | 'luxury_monochrome';    // Swiss minimalist stark black, white & champagne gold

export interface SiteConfig {
  id: string;
  storeName: string;
  storeTagline: string;
  announcementText: string;
  showAnnouncement: boolean;
  announcementLinkText: string;
  
  // Theme & Visual Identity
  themePreset: SiteThemePreset;
  primaryColor: string;
  primaryHoverColor: string;
  accentColor: string;
  surfaceBgColor: string;
  cardBgColor: string;
  headingFont: 'Inter' | 'Plus Jakarta Sans' | 'Fraunces' | 'Outfit' | 'Playfair Display' | 'JetBrains Mono';
  bodyFont: 'Inter' | 'Plus Jakarta Sans' | 'System' | 'JetBrains Mono';
  fontContrastLevel: 'high_contrast' | 'balanced' | 'soft';
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

  // Internationalization Defaults
  activeCurrency: CurrencyCode;
  selectedRegion: string;
  internationalShippingNote: string;
  freeShippingThresholdUSD: number;
  standardShippingCostUSD: number;
  vatTaxRatePercent: number;

  // Catalog & Product Presentation
  catalogColumns: 3 | 4;
  imageAspectRatio: 'square' | 'landscape_4_3' | 'portrait_4_5';
  showStockBadges: boolean;
  showRatingStars: boolean;
  showDiscountSavings: boolean;
  enableWishlist: boolean;
  enableQuickView: boolean;
  enableCustomerReviews: boolean;

  // Hero & Promotional Banner
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroImageUrl: string;
  secondaryBannerActive: boolean;

  // Version & Change Tracking
  lastModified: string;
  modifiedBy: string;
  configVersion: number;
}
