import {
  LogoVersion,
  LogoVariant,
  LogoAuditLog,
  BrandSystemSettings,
  Product,
  ProductCategory,
  CategoryAttribute,
  SubCategory,
  ProductVariant,
  Order,
  Customer,
  Coupon,
  LogoConfig,
  ProductReview,
  AdminStaff,
  AdminAuditLogEntry,
  SystemNotification,
  StaticPage,
  HomepageBanner,
  SiteConfig,
  CurrencyCode,
  CurrencyInfo,
  SiteThemePreset
} from '../types/logo';

// Complete MySQL DDL Schema Definition representing production enterprise architecture
export const MYSQL_DDL_SCHEMA = `-- ==============================================================
-- HAVN BRAND & LOGO TECHNICAL REFRESH RELATIONAL SCHEMA
-- Database Engine: MySQL 8.0+ / InnoDB / utf8mb4_unicode_ci
-- Compliant with BRD/SRS REQ-ADM & SOP Brand Asset Architecture
-- ==============================================================

CREATE DATABASE IF NOT EXISTS havn_brand_catalog 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE havn_brand_catalog;

-- 1. Core Brand Entity
CREATE TABLE IF NOT EXISTS brand_logos (
  id VARCHAR(64) PRIMARY KEY,
  brand_name VARCHAR(120) NOT NULL DEFAULT 'Havn',
  slug VARCHAR(80) NOT NULL UNIQUE,
  current_version_id VARCHAR(64) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_brand_active (is_active)
) ENGINE=InnoDB;

-- 2. Version History & Status Tracking
CREATE TABLE IF NOT EXISTS logo_versions (
  id VARCHAR(64) PRIMARY KEY,
  logo_id VARCHAR(64) NOT NULL,
  version_tag VARCHAR(32) NOT NULL, -- e.g. 'v2.0.0-refresh'
  semantic_major INT UNSIGNED NOT NULL DEFAULT 1,
  semantic_minor INT UNSIGNED NOT NULL DEFAULT 0,
  semantic_patch INT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('draft', 'in_review', 'approved', 'published', 'archived') NOT NULL DEFAULT 'draft',
  changelog TEXT NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  author_email VARCHAR(120) NOT NULL,
  review_notes TEXT NULL,
  approved_by VARCHAR(100) NULL,
  approved_at DATETIME NULL,
  published_at DATETIME NULL,
  checksum CHAR(64) NOT NULL, -- SHA-256 integrity hash
  config_json JSON NOT NULL, -- Visual design tokens & geometry
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_logo_id FOREIGN KEY (logo_id) REFERENCES brand_logos(id) ON DELETE CASCADE,
  INDEX idx_version_status (status),
  INDEX idx_version_tag (version_tag)
) ENGINE=InnoDB;

-- 3. Multi-Format Asset Variants
CREATE TABLE IF NOT EXISTS logo_variants (
  id VARCHAR(64) PRIMARY KEY,
  version_id VARCHAR(64) NOT NULL,
  variant_type ENUM(
    'horizontal_full', 
    'stacked_crest', 
    'icon_mark', 
    'monochrome_dark', 
    'monochrome_light', 
    'favicon_32x32', 
    'invoice_monochrome'
  ) NOT NULL,
  label VARCHAR(80) NOT NULL,
  file_format ENUM('svg', 'png', 'webp') NOT NULL DEFAULT 'svg',
  width INT UNSIGNED NOT NULL,
  height INT UNSIGNED NOT NULL,
  file_size_kb DECIMAL(8,2) NOT NULL,
  recommended_use VARCHAR(255) NOT NULL,
  asset_svg_payload MEDIUMTEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_variant_version FOREIGN KEY (version_id) REFERENCES logo_versions(id) ON DELETE CASCADE,
  INDEX idx_variant_type (variant_type)
) ENGINE=InnoDB;

-- 4. Audit Trail & Governance (SOP Phase 5 & BRD REQ-ADM-002)
CREATE TABLE IF NOT EXISTS logo_audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  version_id VARCHAR(64) NOT NULL,
  version_tag VARCHAR(32) NOT NULL,
  action ENUM('create', 'update_draft', 'submit_review', 'approve', 'publish_refresh', 'rollback', 'archive') NOT NULL,
  performed_by VARCHAR(120) NOT NULL,
  role VARCHAR(60) NOT NULL DEFAULT 'Super Admin',
  summary VARCHAR(255) NOT NULL,
  diff_payload JSON NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_action (action),
  INDEX idx_audit_time (timestamp)
) ENGINE=InnoDB;

-- 5. Storefront & Cache Synchronization
CREATE TABLE IF NOT EXISTS brand_system_settings (
  id VARCHAR(64) PRIMARY KEY,
  active_logo_id VARCHAR(64) NOT NULL,
  active_version_id VARCHAR(64) NOT NULL,
  storefront_sync_enabled TINYINT(1) NOT NULL DEFAULT 1,
  cache_bust_hash CHAR(32) NOT NULL,
  last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sys_version FOREIGN KEY (active_version_id) REFERENCES logo_versions(id)
) ENGINE=InnoDB;`;

// Seed Data
const initialLogoConfigTRS: LogoConfig = {
  brandName: 'TECH REFRESH SOLUTION',
  tagline: 'ENTERPRISE IT & HARDWARE REFRESH',
  showTagline: true,
  fontFamily: 'Inter',
  fontWeight: 700,
  letterSpacing: 2,
  fontSize: 22,
  markShape: 'trs_badge',
  markPosition: 'left',
  markScale: 1.0,
  primaryColor: '#48B065',       // Authentic Vibrant Tech Refresh Solution Green
  accentColor: '#E6EAED',        // Soft Circuit Stems
  stemColor: '#E6EAED',          // Complementary Circuit Columns
  badgeBorderColor: '#E8EDF1',   // Squircle Outer Frame
  darkPrimaryColor: '#52B76D',
  darkAccentColor: '#CBD5E1',
  safeAreaPadding: 16,
  aspectRatio: '3.6:1'
};

const initialLogoConfigV2Havn: LogoConfig = {
  brandName: 'TECH REFRESH SOLUTION',
  tagline: 'CONSIDERED LIVING & HARDWARE',
  showTagline: true,
  fontFamily: 'Fraunces',
  fontWeight: 700,
  letterSpacing: 2,
  fontSize: 22,
  markShape: 'trs_minimal',
  markPosition: 'left',
  markScale: 1.0,
  primaryColor: '#48B065',
  accentColor: '#E6EAED',
  stemColor: '#E6EAED',
  darkPrimaryColor: '#52B76D',
  darkAccentColor: '#CBD5E1',
  safeAreaPadding: 16,
  aspectRatio: '3.6:1'
};

const initialLogoConfigV1Legacy: LogoConfig = {
  brandName: 'TECH REFRESH SOLUTION',
  tagline: 'HARDWARE LOGISTICS',
  showTagline: false,
  fontFamily: 'Playfair Display',
  fontWeight: 600,
  letterSpacing: 3,
  fontSize: 20,
  markShape: 'nordic_h',
  markPosition: 'left',
  markScale: 0.9,
  primaryColor: '#20241F',
  accentColor: '#666B62',
  darkPrimaryColor: '#FFFFFF',
  darkAccentColor: '#AAAAAA',
  safeAreaPadding: 12,
  aspectRatio: '3.2:1'
};

const INITIAL_VERSIONS: LogoVersion[] = [
  {
    id: 'ver_trs_v200',
    logoId: 'logo_trs_main',
    versionTag: 'v2.0.0-tech-refresh',
    semanticMajor: 2,
    semanticMinor: 0,
    semanticPatch: 0,
    status: 'published',
    changelog: 'Company Logo Technical Refresh: Configured official Tech Refresh Solution squircle badge with vibrant green wave path (#48B065), dual circuit columns, and geometric uppercase typography.',
    authorName: 'Abdullah Khan',
    authorEmail: 'abdullahkhan9305@gmail.com',
    approvedBy: 'Brand Governance Council',
    approvedAt: '2026-09-27 18:00:00',
    publishedAt: '2026-09-28 00:00:00',
    createdAt: '2026-09-25 10:15:00',
    updatedAt: '2026-09-28 00:00:00',
    checksum: 'a9b2c34498fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b711',
    config: initialLogoConfigTRS
  },
  {
    id: 'ver_v210_rc',
    logoId: 'logo_trs_main',
    versionTag: 'v2.1.0-RC-glow',
    semanticMajor: 2,
    semanticMinor: 1,
    semanticPatch: 0,
    status: 'in_review',
    changelog: 'Proposed candidate: Minimalist circuit flow mark with high-contrast inverted dark mode styling.',
    authorName: 'Asha Verma',
    authorEmail: 'asha.verma@techrefresh.com',
    reviewNotes: 'Pending accessibility review on high-contrast inverted packaging.',
    createdAt: '2026-09-27 11:20:00',
    updatedAt: '2026-09-27 16:45:00',
    checksum: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    config: initialLogoConfigV2Havn
  },
  {
    id: 'ver_v100',
    logoId: 'logo_trs_main',
    versionTag: 'v1.0.0-legacy',
    semanticMajor: 1,
    semanticMinor: 0,
    semanticPatch: 0,
    status: 'archived',
    changelog: 'Original launch legacy typography lockup.',
    authorName: 'Founding Team',
    authorEmail: 'founders@techrefresh.com',
    approvedBy: 'Founders',
    approvedAt: '2024-06-01 12:00:00',
    publishedAt: '2024-06-01 14:00:00',
    createdAt: '2024-05-15 08:00:00',
    updatedAt: '2025-11-04 09:00:00',
    checksum: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    config: initialLogoConfigV1Legacy
  }
];

const INITIAL_AUDIT_LOGS: LogoAuditLog[] = [
  {
    id: 'aud_001',
    versionId: 'ver_trs_v200',
    versionTag: 'v2.0.0-tech-refresh',
    action: 'publish_refresh',
    performedBy: 'Abdullah Khan',
    role: 'Technical Lead',
    summary: 'Executed production technical refresh deployment with official Tech Refresh Solution brand asset.',
    timestamp: '2026-09-28 00:00:00'
  },
  {
    id: 'aud_002',
    versionId: 'ver_trs_v200',
    versionTag: 'v2.0.0-tech-refresh',
    action: 'approve',
    performedBy: 'Brand Governance Council',
    role: 'Stakeholder',
    summary: 'Formal sign-off granted for Tech Refresh Solution official squircle emblem lockup.',
    timestamp: '2026-09-27 18:00:00'
  }
];

// ==============================================================
// GLOBAL INTERNATIONALIZATION & SITE CONFIGURATION ARCHITECTURE
// ==============================================================
export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateAgainstUSD: 1.0, flag: '🇺🇸' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rateAgainstUSD: 0.92, flag: '🇪🇺' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateAgainstUSD: 0.79, flag: '🇬🇧' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rateAgainstUSD: 152.0, flag: '🇯🇵' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateAgainstUSD: 83.5, flag: '🇮🇳' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rateAgainstUSD: 1.54, flag: '🇦🇺' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rateAgainstUSD: 1.38, flag: '🇨🇦' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rateAgainstUSD: 1.35, flag: '🇸🇬' },
};

export function formatCurrency(amountUSD: number, targetCurrency: CurrencyCode = 'USD'): string {
  const curr = SUPPORTED_CURRENCIES[targetCurrency] || SUPPORTED_CURRENCIES.USD;
  const converted = amountUSD * curr.rateAgainstUSD;
  if (targetCurrency === 'JPY') {
    return `${curr.symbol}${Math.round(converted).toLocaleString()}`;
  }
  return `${curr.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const THEME_PRESETS: Record<SiteThemePreset, Partial<SiteConfig> & { label: string; description: string; previewBadge: string }> = {
  international_slate: {
    label: 'International Slate & Emerald',
    description: 'Crisp global enterprise flagship with deep slate typography, emerald accents, and ultra-high contrast.',
    previewBadge: 'Global Standard',
    primaryColor: '#0F172A',
    primaryHoverColor: '#1E293B',
    accentColor: '#10B981',
    surfaceBgColor: '#F8FAFC',
    cardBgColor: '#FFFFFF',
    headingFont: 'Plus Jakarta Sans',
    bodyFont: 'Inter',
    fontContrastLevel: 'high_contrast',
    borderRadius: 'lg'
  },
  trs_corporate: {
    label: 'Tech Refresh Official Green',
    description: 'Official Tech Refresh Solution visual identity with deep forest pine and circuit green.',
    previewBadge: 'TRS Official',
    primaryColor: '#0F5257',
    primaryHoverColor: '#0B3D3F',
    accentColor: '#48B065',
    surfaceBgColor: '#F7F5EF',
    cardBgColor: '#FFFFFF',
    headingFont: 'Inter',
    bodyFont: 'Inter',
    fontContrastLevel: 'high_contrast',
    borderRadius: 'lg'
  },
  nordic_warm: {
    label: 'Nordic Warm Minimalist',
    description: 'Earthy organic tones, warm linen canvas, and amber highlights inspired by Scandinavian design.',
    previewBadge: 'Artisanal',
    primaryColor: '#20241F',
    primaryHoverColor: '#0F5257',
    accentColor: '#D9A441',
    surfaceBgColor: '#F7F5EF',
    cardBgColor: '#FFFFFF',
    headingFont: 'Fraunces',
    bodyFont: 'Inter',
    fontContrastLevel: 'balanced',
    borderRadius: 'xl'
  },
  cyber_indigo: {
    label: 'Cyber Tech Enterprise',
    description: 'High-density tech data look with deep indigo chassis, bright cyan data nodes, and clean precision lines.',
    previewBadge: 'High-Tech',
    primaryColor: '#1E1B4B',
    primaryHoverColor: '#312E81',
    accentColor: '#06B6D4',
    surfaceBgColor: '#F1F5F9',
    cardBgColor: '#FFFFFF',
    headingFont: 'Outfit',
    bodyFont: 'Plus Jakarta Sans',
    fontContrastLevel: 'high_contrast',
    borderRadius: 'md'
  },
  luxury_monochrome: {
    label: 'Luxury Monochrome Studio',
    description: 'Timeless Swiss international typographic style: stark black, pure whites, and champagne gold touches.',
    previewBadge: 'Haute Horlogerie',
    primaryColor: '#18181B',
    primaryHoverColor: '#27272A',
    accentColor: '#CA8A04',
    surfaceBgColor: '#FAFAFA',
    cardBgColor: '#FFFFFF',
    headingFont: 'Playfair Display',
    bodyFont: 'Inter',
    fontContrastLevel: 'high_contrast',
    borderRadius: 'sm'
  }
};

export const INITIAL_SITE_CONFIG: SiteConfig = {
  id: 'cfg_global_v1',
  storeName: 'TECH REFRESH SOLUTION',
  storeTagline: 'ENTERPRISE IT REFRESH & CURATED HARDWARE',
  announcementText: '🌍 Global Express Shipping Enabled: DHL & FedEx DDP Worldwide · Certified Refurbished with 2-Year Enterprise Warranty',
  showAnnouncement: true,
  announcementLinkText: 'Learn About Global Standards',
  themePreset: 'international_slate',
  primaryColor: '#0F172A',
  primaryHoverColor: '#1E293B',
  accentColor: '#10B981',
  surfaceBgColor: '#F8FAFC',
  cardBgColor: '#FFFFFF',
  headingFont: 'Plus Jakarta Sans',
  bodyFont: 'Inter',
  fontContrastLevel: 'high_contrast',
  borderRadius: 'lg',
  activeCurrency: 'USD',
  selectedRegion: 'United States',
  internationalShippingNote: 'All international shipments include customs duties and local taxes prepaid (DDP).',
  freeShippingThresholdUSD: 150,
  standardShippingCostUSD: 19,
  vatTaxRatePercent: 8.5,
  catalogColumns: 4,
  imageAspectRatio: 'landscape_4_3',
  showStockBadges: true,
  showRatingStars: true,
  showDiscountSavings: true,
  enableWishlist: true,
  enableQuickView: true,
  enableCustomerReviews: true,
  heroBadge: 'ISO 9001 Certified · 30-Point Diagnostics',
  heroTitle: 'Enterprise Hardware Refreshed with Precision.',
  heroSubtitle: 'Direct-from-enterprise workstations, high-density switches, precision displays, and considered modern workspace objects with full international warranty.',
  heroCtaText: 'Explore Certified Inventory',
  heroImageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=80',
  secondaryBannerActive: true,
  lastModified: '2026-09-28 00:45:00',
  modifiedBy: 'Abdullah Khan (Lead Architect)',
  configVersion: 1
};

export const INITIAL_CATEGORIES: ProductCategory[] = [
  {
    id: 'cat_enterprise_it',
    name: 'Enterprise IT & Laptops',
    slug: 'enterprise-it-laptops',
    description: 'Factory-refreshed enterprise workstations, ultrabooks, and desktop computing with multi-year warranty.',
    productCount: 3,
    isActive: true,
    subcategories: [
      { id: 'sub_laptops', name: 'Refurbished Ultrabooks', slug: 'refurbished-ultrabooks', productCount: 2 },
      { id: 'sub_workstations', name: 'Mobile & Tower Workstations', slug: 'mobile-workstations', productCount: 1 }
    ],
    attributes: [
      { id: 'att_grade', categoryId: 'cat_enterprise_it', name: 'Refurbished Grade', key: 'grade', type: 'dropdown', options: ['Grade A+ (Pristine)', 'Grade A (Minor cosmetic)', 'Grade B+ (Value)'], isMandatory: true, isFilterable: true },
      { id: 'att_proc', categoryId: 'cat_enterprise_it', name: 'Processor', key: 'processor', type: 'dropdown', options: ['Intel Core i7 12th Gen', 'Intel Core i9 vPro', 'Apple M2 Max', 'AMD Ryzen 7 PRO'], isMandatory: true, isFilterable: true },
      { id: 'att_ram', categoryId: 'cat_enterprise_it', name: 'RAM Memory', key: 'ram', type: 'dropdown', options: ['16GB DDR5', '32GB DDR5', '64GB Unified / ECC'], isMandatory: true, isFilterable: true },
      { id: 'att_ssd', categoryId: 'cat_enterprise_it', name: 'Storage SSD', key: 'storage', type: 'dropdown', options: ['512GB NVMe M.2', '1TB PCIe 4.0 SSD', '2TB Enterprise NVMe'], isMandatory: true, isFilterable: true },
      { id: 'att_war', categoryId: 'cat_enterprise_it', name: 'Warranty Coverage', key: 'warranty', type: 'dropdown', options: ['1-Year Comprehensive TRS Warranty', '2-Year Next-Business-Day Replacement', '3-Year Enterprise Carepack'], isMandatory: true, isFilterable: true }
    ]
  },
  {
    id: 'cat_networking',
    name: 'Networking & Infrastructure',
    slug: 'networking-infrastructure',
    description: 'Managed Gigabit switches, dual-band APs, and 1U enterprise rackmount security gateways.',
    productCount: 2,
    isActive: true,
    subcategories: [
      { id: 'sub_switches', name: 'Managed PoE+ Switches', slug: 'managed-poe-switches', productCount: 1 },
      { id: 'sub_routers', name: 'Security Firewalls & Gateways', slug: 'security-firewalls', productCount: 1 }
    ],
    attributes: [
      { id: 'att_ports', categoryId: 'cat_networking', name: 'Port Density', key: 'port_density', type: 'dropdown', options: ['24-Port Gigabit PoE+', '48-Port 10G SFP+', '8-Port Managed Desktop'], isMandatory: true, isFilterable: true },
      { id: 'att_rack', categoryId: 'cat_networking', name: 'Form Factor', key: 'form_factor', type: 'dropdown', options: ['1U Rackmount', 'Desktop / Wallmount'], isMandatory: true, isFilterable: true },
      { id: 'att_psu', categoryId: 'cat_networking', name: 'Power Supply', key: 'power_supply', type: 'dropdown', options: ['Single Internal PSU', 'Dual Hot-Swap Redundant'], isMandatory: false, isFilterable: true }
    ]
  },
  {
    id: 'cat_displays',
    name: 'Precision Displays & Monitors',
    slug: 'precision-displays-monitors',
    description: 'Calibrated 4K and 5K professional color-accurate displays, USB-C hubs, and monitor arms.',
    productCount: 2,
    isActive: true,
    subcategories: [
      { id: 'sub_4k_monitors', name: '4K HDR USB-C Hubs', slug: '4k-hdr-usb-c-hubs', productCount: 1 },
      { id: 'sub_5k_monitors', name: '5K Retina Studio Displays', slug: '5k-retina-studio-displays', productCount: 1 }
    ],
    attributes: [
      { id: 'att_res', categoryId: 'cat_displays', name: 'Resolution', key: 'resolution', type: 'dropdown', options: ['4K UHD (3840x2160)', '5K Retina (5120x2880)', 'QHD 144Hz'], isMandatory: true, isFilterable: true },
      { id: 'att_pan', categoryId: 'cat_displays', name: 'Panel Technology', key: 'panel', type: 'dropdown', options: ['IPS Black (2000:1 Contrast)', 'Retina 600 Nits Wide Color', 'OLED Pro'], isMandatory: true, isFilterable: true },
      { id: 'att_hub', categoryId: 'cat_displays', name: 'USB-C Power Delivery', key: 'power_delivery', type: 'dropdown', options: ['90W USB-C PD with Ethernet', '96W Thunderbolt 4', 'None'], isMandatory: true, isFilterable: true }
    ]
  },
  {
    id: 'cat_home',
    name: 'Home & Modern Workspace',
    slug: 'home-and-living',
    description: 'Sculptural solid wood furniture, ergonomic task chairs, and tactile objects for considered work environments.',
    productCount: 2,
    isActive: true,
    subcategories: [
      { id: 'sub_furniture', name: 'Solid Wood Shelving', slug: 'living-furniture', productCount: 1 },
      { id: 'sub_seating', name: 'Ergonomic Task Seating', slug: 'ergonomic-task-seating', productCount: 1 }
    ],
    attributes: [
      { id: 'att_mat', categoryId: 'cat_home', name: 'Material', key: 'material', type: 'text', isMandatory: true, isFilterable: true },
      { id: 'att_fin', categoryId: 'cat_home', name: 'Finish', key: 'finish', type: 'dropdown', options: ['Natural Oak', 'Smoked Walnut', 'Matte Black', 'Brushed Aluminum'], isMandatory: true, isFilterable: true },
      { id: 'att_dim', categoryId: 'cat_home', name: 'Dimensions', key: 'dimensions', type: 'text', isMandatory: true, isFilterable: false },
      { id: 'att_asm', categoryId: 'cat_home', name: 'Assembly Required', key: 'assembly_required', type: 'dropdown', options: ['Yes', 'No', 'Tool-free'], isMandatory: false, isFilterable: true }
    ]
  },
  {
    id: 'cat_kitchen',
    name: 'Kitchen & Artisanal Coffee',
    slug: 'kitchen',
    description: 'Artisanal pour-over sets, stoneware carafes, and precision digital gooseneck kettles.',
    productCount: 2,
    isActive: true,
    subcategories: [
      { id: 'sub_coffee', name: 'Brew & Pour-Over', slug: 'brew-and-pourover', productCount: 1 },
      { id: 'sub_kettles', name: 'Precision Kettles', slug: 'precision-kettles', productCount: 1 }
    ],
    attributes: [
      { id: 'att_kmat', categoryId: 'cat_kitchen', name: 'Ceramic / Metal Type', key: 'ceramic_type', type: 'text', isMandatory: true, isFilterable: true },
      { id: 'att_cap', categoryId: 'cat_kitchen', name: 'Capacity', key: 'capacity', type: 'text', isMandatory: true, isFilterable: true },
      { id: 'att_dw', categoryId: 'cat_kitchen', name: 'Dishwasher Safe', key: 'dishwasher_safe', type: 'dropdown', options: ['Yes', 'Hand wash recommended'], isMandatory: true, isFilterable: true }
    ]
  },
  {
    id: 'cat_electronics',
    name: 'Electronics & Studio Audio',
    slug: 'electronics',
    description: 'Minimalist tech accessories, Qi2 MagSafe wireless charging, and precision desktop studio audio.',
    productCount: 2,
    isActive: true,
    subcategories: [
      { id: 'sub_chargers', name: 'Wireless Charging', slug: 'wireless-charging', productCount: 1 },
      { id: 'sub_audio', name: 'Desktop Studio Audio', slug: 'desktop-audio', productCount: 1 }
    ],
    attributes: [
      { id: 'att_pow', categoryId: 'cat_electronics', name: 'Output Power', key: 'power_output', type: 'text', isMandatory: true, isFilterable: true },
      { id: 'att_conn', categoryId: 'cat_electronics', name: 'Interface', key: 'interface', type: 'dropdown', options: ['USB-C Qi2 Fast Charge', 'MagSafe 3-in-1', 'Bluetooth 5.3 + Optical'], isMandatory: true, isFilterable: true }
    ]
  },
  {
    id: 'cat_apparel',
    name: 'Apparel & Workwear',
    slug: 'apparel',
    description: 'Organic heavy combed cotton essentials, relaxed boxy silhouettes, and technical utility canvas overshirts.',
    productCount: 2,
    isActive: true,
    subcategories: [
      { id: 'sub_tees', name: 'Heavyweight Tees', slug: 'heavyweight-tees', productCount: 1 },
      { id: 'sub_outer', name: 'Utility Canvas Overshirts', slug: 'overshirts-jackets', productCount: 1 }
    ],
    attributes: [
      { id: 'att_fab', categoryId: 'cat_apparel', name: 'Fabric Composition', key: 'fabric', type: 'text', isMandatory: true, isFilterable: true },
      { id: 'att_sz', categoryId: 'cat_apparel', name: 'Size', key: 'size', type: 'dropdown', options: ['XS', 'S', 'M', 'L', 'XL'], isMandatory: true, isFilterable: true },
      { id: 'att_col', categoryId: 'cat_apparel', name: 'Colorway', key: 'colorway', type: 'dropdown', options: ['Ecru Sand', 'Clay Umber', 'Forest Deep', 'Charcoal Slate'], isMandatory: true, isFilterable: true }
    ]
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  // 1. ThinkPad X1 Carbon Gen 10
  {
    id: 'prd_trs_001',
    name: 'ThinkPad X1 Carbon Gen 10 (Refurbished Grade A+)',
    slug: 'thinkpad-x1-carbon-gen-10',
    categoryId: 'cat_enterprise_it',
    categoryName: 'Enterprise IT & Laptops',
    subCategoryId: 'sub_laptops',
    subCategoryName: 'Refurbished Ultrabooks',
    sku: 'TRS-NB-0081',
    mrp: 1499.0,
    price: 849.0,
    stock: 24,
    status: 'Published',
    description: 'Enterprise flagship 14" ultrabook refreshed and certified through 30-point Tech Refresh diagnostic testing. Intel Core i7 12th Gen, 32GB LPDDR5, 1TB NVMe Gen4, and 2.8K OLED display with carbon-weave lid.',
    images: [
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1000&q=80'
    ],
    dynamicAttributes: {
      grade: 'Grade A+ (Pristine)',
      processor: 'Intel Core i7 12th Gen',
      ram: '32GB DDR5',
      storage: '1TB PCIe 4.0 SSD',
      warranty: '2-Year Next-Business-Day Replacement'
    },
    variants: [
      { id: 'var_x1_16', sku: 'TRS-NB-0081-16G', title: '16GB RAM / 512GB SSD', attributes: { RAM: '16GB', SSD: '512GB' }, price: 749.0, mrp: 1299.0, stock: 10 },
      { id: 'var_x1_32', sku: 'TRS-NB-0081-32G', title: '32GB RAM / 1TB SSD', attributes: { RAM: '32GB', SSD: '1TB' }, price: 849.0, mrp: 1499.0, stock: 14 }
    ],
    rating: 4.95,
    reviewCount: 88,
    isFeatured: true
  },

  // 2. Apple MacBook Pro 16" M2 Max
  {
    id: 'prd_trs_002',
    name: 'Apple MacBook Pro 16" M2 Max (Certified Refurbished)',
    slug: 'apple-macbook-pro-16-m2-max',
    categoryId: 'cat_enterprise_it',
    categoryName: 'Enterprise IT & Laptops',
    subCategoryId: 'sub_laptops',
    subCategoryName: 'Refurbished Ultrabooks',
    sku: 'TRS-APL-0094',
    mrp: 3499.0,
    price: 2499.0,
    stock: 12,
    status: 'Published',
    description: 'Apple Certified Refurbished 16-inch Liquid Retina XDR display, Apple M2 Max 12-core CPU / 38-core GPU, 64GB Unified Memory, and 2TB high-speed SSD. 100% OEM battery health guaranteed.',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1000&q=80'
    ],
    dynamicAttributes: {
      grade: 'Grade A+ (Pristine)',
      processor: 'Apple M2 Max',
      ram: '64GB Unified / ECC',
      storage: '2TB Enterprise NVMe',
      warranty: '2-Year Next-Business-Day Replacement'
    },
    variants: [
      { id: 'var_mbp_32', sku: 'TRS-APL-0094-32G', title: '32GB RAM / 1TB SSD', attributes: { RAM: '32GB', SSD: '1TB' }, price: 2199.0, mrp: 2999.0, stock: 5 },
      { id: 'var_mbp_64', sku: 'TRS-APL-0094-64G', title: '64GB RAM / 2TB SSD', attributes: { RAM: '64GB', SSD: '2TB' }, price: 2499.0, mrp: 3499.0, stock: 7 }
    ],
    rating: 4.98,
    reviewCount: 112,
    isFeatured: true
  },

  // 3. Dell Precision 5570 Mobile Workstation
  {
    id: 'prd_trs_003',
    name: 'Dell Precision 5570 Mobile Workstation (Grade A+)',
    slug: 'dell-precision-5570-workstation',
    categoryId: 'cat_enterprise_it',
    categoryName: 'Enterprise IT & Laptops',
    subCategoryId: 'sub_workstations',
    subCategoryName: 'Mobile & Tower Workstations',
    sku: 'TRS-WS-0052',
    mrp: 2399.0,
    price: 1399.0,
    stock: 16,
    status: 'Published',
    description: 'Precision engineering laptop with 15.6" UHD+ 4K InfinityEdge touch screen, Intel Core i9 vPro, NVIDIA RTX A2000 graphics, 32GB DDR5, and carbon-fiber palmrest. ISV Certified for CAD & 3D.',
    images: [
      'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1593642634367-d91a135587b5?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=1000&q=80'
    ],
    dynamicAttributes: {
      grade: 'Grade A+ (Pristine)',
      processor: 'Intel Core i9 vPro',
      ram: '32GB DDR5',
      storage: '1TB PCIe 4.0 SSD',
      warranty: '3-Year Enterprise Carepack'
    },
    variants: [],
    rating: 4.88,
    reviewCount: 47,
    isFeatured: true
  },

  // 4. Cisco Catalyst 24-Port Gigabit Managed PoE+ Switch
  {
    id: 'prd_net_001',
    name: 'Cisco Catalyst 24-Port Gigabit Managed PoE+ Switch',
    slug: 'cisco-catalyst-24p-switch',
    categoryId: 'cat_networking',
    categoryName: 'Networking & Infrastructure',
    subCategoryId: 'sub_switches',
    subCategoryName: 'Managed PoE+ Switches',
    sku: 'TRS-NET-0029',
    mrp: 780.0,
    price: 395.0,
    stock: 18,
    status: 'Published',
    description: 'Enterprise Layer 3 managed Ethernet switch with 24x 1GbE PoE+ ports (370W power budget) and 4x 10G SFP+ uplinks. Full Tech Refresh burn-in bench certified with redundant power supply.',
    images: [
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=1000&q=80'
    ],
    dynamicAttributes: {
      port_density: '24-Port Gigabit PoE+',
      form_factor: '1U Rackmount',
      power_supply: 'Dual Hot-Swap Redundant'
    },
    variants: [],
    rating: 4.9,
    reviewCount: 31,
    isFeatured: true
  },

  // 5. Ubiquiti UniFi Dream Machine Pro Gateway
  {
    id: 'prd_net_002',
    name: 'Ubiquiti UniFi Dream Machine Pro Gateway & Router',
    slug: 'ubiquiti-unifi-dream-machine-pro',
    categoryId: 'cat_networking',
    categoryName: 'Networking & Infrastructure',
    subCategoryId: 'sub_routers',
    subCategoryName: 'Security Firewalls & Gateways',
    sku: 'TRS-NET-0077',
    mrp: 499.0,
    price: 379.0,
    stock: 22,
    status: 'Published',
    description: 'All-in-one 1U enterprise security gateway, network router, and NVR with 10G SFP+ WAN/LAN ports, dual HDD bays for UniFi Protect, and 3.5 Gbps full IDS/IPS throughput.',
    images: [
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1000&q=80'
    ],
    dynamicAttributes: {
      port_density: '8-Port Managed Desktop',
      form_factor: '1U Rackmount',
      power_supply: 'Single Internal PSU'
    },
    variants: [],
    rating: 4.92,
    reviewCount: 54,
    isFeatured: true
  },

  // 6. Dell UltraSharp 32" 4K HDR USB-C Hub Monitor
  {
    id: 'prd_dsp_001',
    name: 'Dell UltraSharp 32" 4K HDR USB-C Hub Monitor (U3223QE)',
    slug: 'dell-ultrasharp-32-4k-hdr-monitor',
    categoryId: 'cat_displays',
    categoryName: 'Precision Displays & Monitors',
    subCategoryId: 'sub_4k_monitors',
    subCategoryName: '4K HDR USB-C Hubs',
    sku: 'TRS-DSP-0032',
    mrp: 999.0,
    price: 649.0,
    stock: 15,
    status: 'Published',
    description: 'Groundbreaking IPS Black technology with 2000:1 contrast ratio, 98% DCI-P3 color gamut, 4K UHD clarity, and built-in USB-C hub with 90W Power Delivery and RJ45 Ethernet.',
    images: [
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?auto=format&fit=crop&w=1000&q=80'
    ],
    dynamicAttributes: {
      resolution: '4K UHD (3840x2160)',
      panel: 'IPS Black (2000:1 Contrast)',
      power_delivery: '90W USB-C PD with Ethernet'
    },
    variants: [],
    rating: 4.94,
    reviewCount: 78,
    isFeatured: true
  },

  // 7. Apple Studio Display 27" 5K Retina
  {
    id: 'prd_dsp_002',
    name: 'Apple Studio Display 27" 5K Retina (Tilt-Adjustable)',
    slug: 'apple-studio-display-27-5k',
    categoryId: 'cat_displays',
    categoryName: 'Precision Displays & Monitors',
    subCategoryId: 'sub_5k_monitors',
    subCategoryName: '5K Retina Studio Displays',
    sku: 'TRS-DSP-0027',
    mrp: 1599.0,
    price: 1249.0,
    stock: 9,
    status: 'Published',
    description: '27-inch 5K Retina display with 600 nits brightness, P3 wide color, 12MP Ultra Wide camera with Center Stage, studio-quality three-mic array, and six-speaker sound system with Spatial Audio.',
    images: [
      'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1000&q=80'
    ],
    dynamicAttributes: {
      resolution: '5K Retina (5120x2880)',
      panel: 'Retina 600 Nits Wide Color',
      power_delivery: '96W Thunderbolt 4'
    },
    variants: [],
    rating: 4.96,
    reviewCount: 63,
    isFeatured: true
  },

  // 8. Solid European White Oak Bookshelf
  {
    id: 'prd_hom_001',
    name: 'Solid European White Oak Bookshelf',
    slug: 'solid-oak-bookshelf',
    categoryId: 'cat_home',
    categoryName: 'Home & Modern Workspace',
    subCategoryId: 'sub_furniture',
    subCategoryName: 'Solid Wood Shelving',
    sku: 'HVN-FUR-0042',
    mrp: 279.0,
    price: 249.0,
    stock: 36,
    status: 'Published',
    description: 'Solid European white oak, five open display tiers, gently rounded organic chamfers. Ships flat-packed with tool-free precision joinery.',
    images: [
      '/src/assets/images/havn_oak_bookshelf_1790578552146.jpg',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1000&q=80'
    ],
    dynamicAttributes: {
      material: 'Solid European White Oak, Natural Matte Oil Finish',
      finish: 'Natural Oak',
      dimensions: '80 × 30 × 180 cm',
      assembly_required: 'Tool-free, ~15 minutes'
    },
    variants: [
      { id: 'var_01a', sku: 'HVN-FUR-0042-S', title: 'Small (60cm)', attributes: { Size: 'Small', Finish: 'Natural Oak' }, price: 199.0, mrp: 229.0, stock: 14 },
      { id: 'var_01b', sku: 'HVN-FUR-0042-M', title: 'Medium (80cm)', attributes: { Size: 'Medium', Finish: 'Natural Oak' }, price: 249.0, mrp: 279.0, stock: 16 },
      { id: 'var_01c', sku: 'HVN-FUR-0042-L', title: 'Large (100cm)', attributes: { Size: 'Large', Finish: 'Natural Oak' }, price: 299.0, mrp: 339.0, stock: 6 }
    ],
    rating: 4.9,
    reviewCount: 128,
    isFeatured: true
  },

  // 9. Aeron-Style Ergonomic Mesh Task Chair
  {
    id: 'prd_hom_002',
    name: 'Aeron-Style Ergonomic Mesh Task Chair',
    slug: 'aeron-ergonomic-mesh-task-chair',
    categoryId: 'cat_home',
    categoryName: 'Home & Modern Workspace',
    subCategoryId: 'sub_seating',
    subCategoryName: 'Ergonomic Task Seating',
    sku: 'HVN-CHR-0089',
    mrp: 680.0,
    price: 495.0,
    stock: 28,
    status: 'Published',
    description: 'Engineered breathable elastomeric pellicle mesh, dynamic dual-posture lumbar support, fully adjustable 4D armrests, and forward-tilt kinematic mechanism for 12+ hour focus.',
    images: [
      'https://images.unsplash.com/photo-1580481077195-c3a821a58875?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1589384267710-7a251d02c462?auto=format&fit=crop&w=1000&q=80'
    ],
    dynamicAttributes: {
      material: 'Elastomeric Mesh & Die-Cast Anodized Aluminum',
      finish: 'Matte Black',
      dimensions: '68 × 68 × 104 cm',
      assembly_required: 'No'
    },
    variants: [],
    rating: 4.95,
    reviewCount: 94,
    isFeatured: true
  },

  // 10. Artisanal Sand Stoneware Pour-Over Set
  {
    id: 'prd_kit_001',
    name: 'Artisanal Sand Stoneware Pour-Over Set',
    slug: 'ceramic-pour-over-set',
    categoryId: 'cat_kitchen',
    categoryName: 'Kitchen & Artisanal Coffee',
    subCategoryId: 'sub_coffee',
    subCategoryName: 'Brew & Pour-Over',
    sku: 'HVN-KIT-0018',
    mrp: 45.0,
    price: 38.0,
    stock: 52,
    status: 'Published',
    description: 'Artisanal sand-textured stoneware pour-over dripper with custom brass support collar, spiral extraction ribs, and 500ml borosilicate glass heatproof carafe.',
    images: [
      '/src/assets/images/havn_ceramic_pourover_1790578568017.jpg',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=80'
    ],
    dynamicAttributes: {
      ceramic_type: 'High-fire Sand Stoneware',
      capacity: '500 ml (1–2 cups)',
      dishwasher_safe: 'Yes'
    },
    variants: [],
    rating: 4.85,
    reviewCount: 64,
    isFeatured: true
  },

  // 11. Precision Temperature Electric Gooseneck Kettle
  {
    id: 'prd_kit_002',
    name: 'Precision Temperature Electric Gooseneck Kettle (1.0L)',
    slug: 'precision-electric-gooseneck-kettle',
    categoryId: 'cat_kitchen',
    categoryName: 'Kitchen & Artisanal Coffee',
    subCategoryId: 'sub_kettles',
    subCategoryName: 'Precision Kettles',
    sku: 'HVN-KIT-0072',
    mrp: 145.0,
    price: 119.0,
    stock: 34,
    status: 'Published',
    description: 'Matte black food-grade 304 stainless steel body with precision pour spout, variable degree-by-degree PID temperature control, 60-minute hold mode, and built-in brew stopwatch.',
    images: [
      'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1520038410233-7141be7e6f97?auto=format&fit=crop&w=1000&q=80'
    ],
    dynamicAttributes: {
      ceramic_type: 'Matte 304 Stainless Steel & Walnut Handle',
      capacity: '1000 ml (1.0 L)',
      dishwasher_safe: 'Hand wash recommended'
    },
    variants: [],
    rating: 4.93,
    reviewCount: 48,
    isFeatured: true
  },

  // 12. MagSafe 3-in-1 Fast Wireless Charging Stand
  {
    id: 'prd_elc_001',
    name: 'MagSafe 3-in-1 Fast Wireless Charging Stand',
    slug: 'wireless-charging-pad',
    categoryId: 'cat_electronics',
    categoryName: 'Electronics & Studio Audio',
    subCategoryId: 'sub_chargers',
    subCategoryName: 'Wireless Charging',
    sku: 'HVN-ELC-0091',
    mrp: 75.0,
    price: 59.0,
    stock: 74,
    status: 'Published',
    description: 'Natural solid walnut top surface embedded in a precision CNC-machined aerospace aluminum casing with 15W Qi2 MagSafe fast charging for iPhone, Apple Watch fast-charger, and AirPods tray.',
    images: [
      '/src/assets/images/havn_wireless_charger_1790578580677.jpg',
      'https://images.unsplash.com/photo-1622445262464-84b14e32452e?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1616469829941-c7200edec809?auto=format&fit=crop&w=1000&q=80'
    ],
    dynamicAttributes: {
      power_output: '15W Fast Charge (Qi2 Standard)',
      interface: 'MagSafe 3-in-1'
    },
    variants: [],
    rating: 4.88,
    reviewCount: 52,
    isFeatured: true
  },

  // 13. Studio Reference Active Desktop Audio Monitors
  {
    id: 'prd_elc_002',
    name: 'Studio Reference Active Desktop Audio Monitors (Pair)',
    slug: 'studio-reference-active-desktop-audio',
    categoryId: 'cat_electronics',
    categoryName: 'Electronics & Studio Audio',
    subCategoryId: 'sub_audio',
    subCategoryName: 'Desktop Studio Audio',
    sku: 'HVN-AUD-0065',
    mrp: 320.0,
    price: 249.0,
    stock: 20,
    status: 'Published',
    description: 'Acoustic-grade MDF enclosure with real walnut side panels, 4" woven Kevlar woofers, 1" silk dome tweeters, Class-D 70W RMS bi-amplification, Bluetooth 5.3 aptX HD, and optical inputs.',
    images: [
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1000&q=80'
    ],
    dynamicAttributes: {
      power_output: '70W RMS (Bi-Amplified Active Class-D)',
      interface: 'Bluetooth 5.3 + Optical'
    },
    variants: [],
    rating: 4.97,
    reviewCount: 89,
    isFeatured: true
  },

  // 14. Organic Cotton Heavyweight Boxy Tee
  {
    id: 'prd_app_001',
    name: 'Organic Cotton Heavyweight Boxy Tee (280 GSM)',
    slug: 'organic-cotton-tee',
    categoryId: 'cat_apparel',
    categoryName: 'Apparel & Workwear',
    subCategoryId: 'sub_tees',
    subCategoryName: 'Heavyweight Tees',
    sku: 'HVN-APP-0033',
    mrp: 42.0,
    price: 32.0,
    stock: 85,
    status: 'Published',
    description: '280 GSM combed organic cotton, relaxed boxy cut with drop shoulder, reinforced ribbed crew neck, double-stitched hems, and non-toxic earthen garment dye.',
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1000&q=80'
    ],
    dynamicAttributes: {
      fabric: '100% GOTS Certified Organic Cotton (280 GSM)',
      size: 'Medium',
      colorway: 'Ecru Sand'
    },
    variants: [
      { id: 'var_04s', sku: 'HVN-APP-0033-S', title: 'Small', attributes: { Size: 'Small' }, price: 32.0, mrp: 42.0, stock: 20 },
      { id: 'var_04m', sku: 'HVN-APP-0033-M', title: 'Medium', attributes: { Size: 'Medium' }, price: 32.0, mrp: 42.0, stock: 35 },
      { id: 'var_04l', sku: 'HVN-APP-0033-L', title: 'Large', attributes: { Size: 'Large' }, price: 32.0, mrp: 42.0, stock: 30 }
    ],
    rating: 4.91,
    reviewCount: 91,
    isFeatured: true
  },

  // 15. Technical Canvas Utility Overshirt
  {
    id: 'prd_app_002',
    name: 'Technical Canvas Utility Overshirt',
    slug: 'technical-canvas-overshirt',
    categoryId: 'cat_apparel',
    categoryName: 'Apparel & Workwear',
    subCategoryId: 'sub_outer',
    subCategoryName: 'Utility Canvas Overshirts',
    sku: 'HVN-APP-0088',
    mrp: 140.0,
    price: 110.0,
    stock: 45,
    status: 'Published',
    description: '340 GSM organic duck canvas with light water-repellent wax finish, gunmetal snap-button closure, interior zip passport pocket, and twin gusset chest utility pockets.',
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=1000&q=80'
    ],
    dynamicAttributes: {
      fabric: '340 GSM Heavy Duck Canvas with Wax Finish',
      size: 'Large',
      colorway: 'Charcoal Slate'
    },
    variants: [
      { id: 'var_05m', sku: 'HVN-APP-0088-M', title: 'Medium', attributes: { Size: 'Medium' }, price: 110.0, mrp: 140.0, stock: 20 },
      { id: 'var_05l', sku: 'HVN-APP-0088-L', title: 'Large', attributes: { Size: 'Large' }, price: 110.0, mrp: 140.0, stock: 25 }
    ],
    rating: 4.95,
    reviewCount: 38,
    isFeatured: true
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord_3021',
    orderNumber: '#3021',
    customerName: 'Asha Verma',
    customerEmail: 'asha.v@mail.com',
    date: '24 Sep 2026',
    items: [
      { productId: 'prd_001', productName: 'Oak Bookshelf', price: 249.0, quantity: 1, image: '/src/assets/images/havn_oak_bookshelf_1790578552146.jpg' },
      { productId: 'prd_002', productName: 'Ceramic Pour-Over Set', price: 38.0, quantity: 1, image: '/src/assets/images/havn_ceramic_pourover_1790578568017.jpg' }
    ],
    subtotal: 287.0,
    shipping: 12.0,
    tax: 18.6,
    discount: 0,
    total: 317.6,
    paymentMethod: 'Card',
    paymentStatus: 'Paid',
    orderStatus: 'Shipped',
    shippingAddress: {
      firstName: 'Asha',
      lastName: 'Verma',
      address: '14 Residency Road',
      city: 'Lucknow',
      pincode: '226001'
    }
  },
  {
    id: 'ord_3020',
    orderNumber: '#3020',
    customerName: 'Rahul Iyer',
    customerEmail: 'rahul.i@mail.com',
    date: '24 Sep 2026',
    items: [
      { productId: 'prd_003', productName: 'Wireless Charging Pad', price: 29.0, quantity: 1, image: '/src/assets/images/havn_wireless_charger_1790578580677.jpg' }
    ],
    subtotal: 29.0,
    shipping: 0,
    tax: 0,
    discount: 0,
    total: 29.0,
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    orderStatus: 'Processing',
    shippingAddress: {
      firstName: 'Rahul',
      lastName: 'Iyer',
      address: '88 Indiranagar, 12th Main',
      city: 'Bengaluru',
      pincode: '560038'
    }
  },
  {
    id: 'ord_3019',
    orderNumber: '#3019',
    customerName: 'Sara Khan',
    customerEmail: 'sara.k@mail.com',
    date: '23 Sep 2026',
    items: [
      { productId: 'prd_004', productName: 'Organic Cotton Heavyweight Tee', price: 24.0, quantity: 3, image: '/src/assets/images/havn_hero_furniture_1790578538197.jpg' }
    ],
    subtotal: 72.0,
    shipping: 10.0,
    tax: 9.5,
    discount: 0,
    total: 91.5,
    paymentMethod: 'Card',
    paymentStatus: 'Paid',
    orderStatus: 'Delivered',
    shippingAddress: {
      firstName: 'Sara',
      lastName: 'Khan',
      address: 'Flat 402, Sea Green Apts',
      city: 'Mumbai',
      pincode: '400050'
    }
  },
  {
    id: 'ord_3018',
    orderNumber: '#3018',
    customerName: 'Manav Patel',
    customerEmail: 'manav.p@mail.com',
    date: '23 Sep 2026',
    items: [
      { productId: 'prd_001', productName: 'Oak Bookshelf', price: 249.0, quantity: 1, image: '/src/assets/images/havn_oak_bookshelf_1790578552146.jpg' }
    ],
    subtotal: 249.0,
    shipping: 0,
    tax: 0,
    discount: 0,
    total: 249.0,
    paymentMethod: 'Net Banking',
    paymentStatus: 'Paid',
    orderStatus: 'Processing',
    shippingAddress: {
      firstName: 'Manav',
      lastName: 'Patel',
      address: '22 Riverfront Drive',
      city: 'Ahmedabad',
      pincode: '380009'
    }
  },
  {
    id: 'ord_3017',
    orderNumber: '#3017',
    customerName: 'Kiran Rao',
    customerEmail: 'kiran.r@mail.com',
    date: '22 Sep 2026',
    items: [
      { productId: 'prd_002', productName: 'Ceramic Pour-Over Set', price: 38.0, quantity: 1, image: '/src/assets/images/havn_ceramic_pourover_1790578568017.jpg' },
      { productId: 'prd_004', productName: 'Organic Cotton Heavyweight Tee', price: 24.0, quantity: 1, image: '/src/assets/images/havn_hero_furniture_1790578538197.jpg' }
    ],
    subtotal: 62.0,
    shipping: 0,
    tax: 0,
    discount: 0,
    total: 62.0,
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'Pending',
    orderStatus: 'Cancelled',
    shippingAddress: {
      firstName: 'Kiran',
      lastName: 'Rao',
      address: '5th Cross, Malleshwaram',
      city: 'Bengaluru',
      pincode: '560003'
    }
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'cst_1', name: 'Asha Verma', email: 'asha.v@mail.com', ordersCount: 8, totalSpent: 1240.0, joinedDate: 'Jan 2026', status: 'Active' },
  { id: 'cst_2', name: 'Rahul Iyer', email: 'rahul.i@mail.com', ordersCount: 3, totalSpent: 210.0, joinedDate: 'Mar 2026', status: 'Active' },
  { id: 'cst_3', name: 'Sara Khan', email: 'sara.k@mail.com', ordersCount: 1, totalSpent: 91.5, joinedDate: 'Sep 2026', status: 'Active' },
  { id: 'cst_4', name: 'Manav Patel', email: 'manav.p@mail.com', ordersCount: 0, totalSpent: 0.0, joinedDate: 'Sep 2026', status: 'Inactive' }
];

export const INITIAL_COUPONS: Coupon[] = [
  { id: 'cpn_1', code: 'WELCOME10', discountType: 'percentage', value: 10, usedCount: 412, usageLimit: 1000, validTill: '31 Dec 2026', status: 'Active' },
  { id: 'cpn_2', code: 'FESTIVE250', discountType: 'flat', value: 25, usedCount: 88, usageLimit: 500, validTill: '10 Oct 2026', status: 'Active' },
  { id: 'cpn_3', code: 'SUMMER15', discountType: 'percentage', value: 15, usedCount: 1000, usageLimit: 1000, validTill: '31 Aug 2026', status: 'Expired' }
];

export const INITIAL_REVIEWS: ProductReview[] = [
  {
    id: 'rev_01',
    productId: 'prd_trs_001',
    productName: 'ThinkPad X1 Carbon Gen 10 (Refurbished Grade A+)',
    customerName: 'Asha Verma',
    customerEmail: 'asha.v@techrefresh.com',
    rating: 5,
    comment: 'Exceptional condition! Zero cosmetic scratches, battery life tests at 98% OEM health, and boots instantly. TRS certification report was included in the box.',
    date: '25 Sep 2026',
    status: 'Approved',
    verifiedPurchase: true
  },
  {
    id: 'rev_02',
    productId: 'prd_trs_001',
    productName: 'ThinkPad X1 Carbon Gen 10 (Refurbished Grade A+)',
    customerName: 'Devraj Sen',
    customerEmail: 'dev.sen@enterprise.in',
    rating: 5,
    comment: 'Procured 5 units for our dev sprint. All passed thermal stress testing without thermal throttling. Highly recommended enterprise vendor.',
    date: '22 Sep 2026',
    status: 'Approved',
    verifiedPurchase: true
  },
  {
    id: 'rev_03',
    productId: 'prd_001',
    productName: 'Oak Bookshelf',
    customerName: 'Pooja Hegde',
    customerEmail: 'pooja.h@mail.com',
    rating: 5,
    comment: 'Solid wood craftsmanship is remarkable. Tool-free assembly took under 15 minutes. Very sturdy.',
    date: '20 Sep 2026',
    status: 'Approved',
    verifiedPurchase: true
  },
  {
    id: 'rev_04',
    productId: 'prd_trs_002',
    productName: 'Cisco Catalyst 24-Port Gigabit Managed PoE+ Switch',
    customerName: 'Vikram Joshi',
    customerEmail: 'v.joshi@infra.org',
    rating: 4,
    comment: 'Fan is whisper quiet after burn-in. Dual power supplies worked seamlessly on failover tests.',
    date: '18 Sep 2026',
    status: 'Approved',
    verifiedPurchase: true
  },
  {
    id: 'rev_05',
    productId: 'prd_003',
    productName: 'Wireless Charging Pad',
    customerName: 'Sneha Roy',
    customerEmail: 'sneha.r@mail.com',
    rating: 4,
    comment: 'Beautiful matte finish and fast Qi2 charging. Cord length is generous.',
    date: '15 Sep 2026',
    status: 'Pending',
    verifiedPurchase: false
  }
];

export const INITIAL_STAFF: AdminStaff[] = [
  {
    id: 'stf_01',
    name: 'Abdullah Khan',
    email: 'abdullahkhan9305@gmail.com',
    role: 'Super Admin',
    permissions: ['all_permissions', 'manage_catalog', 'manage_orders', 'manage_categories', 'logo_governance', 'audit_logs', 'system_settings'],
    lastActive: 'Just now'
  },
  {
    id: 'stf_02',
    name: 'Priya Sharma',
    email: 'priya.s@techrefresh.com',
    role: 'Catalog Manager',
    permissions: ['manage_catalog', 'manage_categories', 'moderate_reviews', 'export_import_csv'],
    lastActive: '20 mins ago'
  },
  {
    id: 'stf_03',
    name: 'Rohan Mehra',
    email: 'rohan.m@techrefresh.com',
    role: 'Order Fulfillment',
    permissions: ['manage_orders', 'process_refunds', 'update_inventory', 'print_invoices'],
    lastActive: '1 hour ago'
  },
  {
    id: 'stf_04',
    name: 'Kavita Nair',
    email: 'kavita.n@techrefresh.com',
    role: 'Customer Support',
    permissions: ['view_orders', 'view_customers', 'moderate_reviews'],
    lastActive: '3 hours ago'
  }
];

export const INITIAL_ADMIN_AUDIT_LOGS: AdminAuditLogEntry[] = [
  {
    id: 'aal_01',
    module: 'Brand',
    action: 'PUBLISH_REFRESH',
    performedBy: 'Abdullah Khan',
    role: 'Super Admin',
    details: 'Published official Tech Refresh Solution Squircle Badge (v2.0.0-tech-refresh) to public storefront.',
    timestamp: '2026-09-28 01:15:00'
  },
  {
    id: 'aal_02',
    module: 'Category',
    action: 'CREATE_CATEGORY',
    performedBy: 'Priya Sharma',
    role: 'Catalog Manager',
    details: 'Provisioned category: Enterprise IT & Laptops with 5 dynamic technical attributes (Grade, Processor, RAM, Storage, Warranty).',
    timestamp: '2026-09-27 16:30:00'
  },
  {
    id: 'aal_03',
    module: 'Order',
    action: 'UPDATE_STATUS',
    performedBy: 'Rohan Mehra',
    role: 'Order Fulfillment',
    details: 'Transitioned order #3021 from Processing to Shipped. Courier tracking assigned: TRS-TRK-992144.',
    timestamp: '2026-09-26 14:10:00'
  },
  {
    id: 'aal_04',
    module: 'Inventory',
    action: 'STOCK_RESTOCK',
    performedBy: 'Rohan Mehra',
    role: 'Order Fulfillment',
    details: 'Restocked 10 units of Cisco Catalyst 24-Port Switch into Central Logistics Hub - BLR.',
    timestamp: '2026-09-25 11:20:00'
  }
];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif_01',
    type: 'Email',
    recipient: 'asha.v@techrefresh.com',
    subject: 'Order Confirmation — TRS-ORD-8829',
    message: 'Your order has been received and logged into MySQL inventory. Diagnostic bench testing is underway.',
    status: 'Delivered',
    timestamp: 'Today at 09:30 AM'
  },
  {
    id: 'notif_02',
    type: 'SMS',
    recipient: '+91 98765 43210',
    subject: 'Shipment Dispatched',
    message: 'TRS Shipment #TRS-TRK-992144 is out for delivery via FedEx Express. Expected delivery today by 6 PM.',
    status: 'Delivered',
    timestamp: 'Yesterday at 04:15 PM'
  }
];

export const INITIAL_STATIC_PAGES: StaticPage[] = [
  {
    id: 'pg_about',
    slug: 'about-us',
    title: 'About Tech Refresh Solution',
    content: 'Tech Refresh Solution is an ISO-certified enterprise IT procurement and hardware lifecycle partner. We bridge sustainable circular electronics and commercial computing, delivering factory-refreshed tier-1 hardware tested across 48 diagnostic parameters.',
    lastUpdated: 'September 2026'
  },
  {
    id: 'pg_policies',
    slug: 'policies',
    title: 'Shipping, Warranty & Return Policies',
    content: 'All orders qualify for our 30-Day Hassle-Free Enterprise Replacement Guarantee. Certified refurbished computing includes standard 1-Year or 2-Year comprehensive warranty with next-business-day swap.',
    lastUpdated: 'September 2026'
  },
  {
    id: 'pg_faq',
    slug: 'faq',
    title: 'Frequently Asked Questions (FAQ)',
    content: 'Q: What is the 48-Point Diagnostic Process?\nA: Each refreshed workstation undergoes CPU thermal profiling, RAM parity checks, NVMe SMART cycle verification, display luminance calibration, and cleanroom sanitization.\n\nQ: Are products covered under warranty?\nA: Yes, every item includes a minimum 12-month TRS Comprehensive Warranty with live claim tracking.',
    lastUpdated: 'September 2026'
  }
];

export const INITIAL_BANNERS: HomepageBanner[] = [
  {
    id: 'bnr_01',
    badge: 'Enterprise Certified Refresh',
    title: 'Precision Refurbished Computing & Workstations',
    subtitle: 'Tested through rigorous 48-point diagnostic benchmarking. Backed by up to 3 years comprehensive hardware carepack.',
    buttonText: 'Explore Certified IT',
    imageUrl: '/src/assets/images/havn_hero_furniture_1790578538197.jpg',
    categoryFilter: 'cat_enterprise_it',
    active: true
  },
  {
    id: 'bnr_02',
    badge: 'Limited Stock Refresh',
    title: 'Managed Layer-3 Network Infrastructure',
    subtitle: 'Cisco, Juniper, and Aruba high-throughput switches burn-in tested for zero packet loss.',
    buttonText: 'View Networking',
    imageUrl: '/src/assets/images/havn_wireless_charger_1790578580677.jpg',
    categoryFilter: 'cat_networking',
    active: true
  }
];

// Helper to generate dynamic variants for a version
export function generateLogoVariants(version: LogoVersion): LogoVariant[] {
  return [
    {
      id: `${version.id}_var_horiz`,
      versionId: version.id,
      variantType: 'horizontal_full',
      label: 'Primary Horizontal Lockup',
      format: 'svg',
      width: 280,
      height: 64,
      fileSizeKb: 4.2,
      recommendedUse: 'Storefront Desktop Navigation, Checkout Header, Marketing Banners'
    },
    {
      id: `${version.id}_var_stacked`,
      versionId: version.id,
      variantType: 'stacked_crest',
      label: 'Stacked Crest & Tagline',
      format: 'svg',
      width: 180,
      height: 120,
      fileSizeKb: 5.6,
      recommendedUse: 'Footer Brand Showcase, Packaging Collateral, Gift Cards'
    },
    {
      id: `${version.id}_var_icon`,
      versionId: version.id,
      variantType: 'icon_mark',
      label: 'Monogram Symbol Mark',
      format: 'svg',
      width: 48,
      height: 48,
      fileSizeKb: 1.8,
      recommendedUse: 'Mobile Compact Nav, Applet Badges, Avatar Watermarks'
    },
    {
      id: `${version.id}_var_dark`,
      versionId: version.id,
      variantType: 'monochrome_dark',
      label: 'Inverted Dark Surface Mode',
      format: 'svg',
      width: 280,
      height: 64,
      fileSizeKb: 4.4,
      recommendedUse: 'Dark Mode Storefront, Admin Sidebar, Dark Background Footers'
    },
    {
      id: `${version.id}_var_fav`,
      versionId: version.id,
      variantType: 'favicon_32x32',
      label: 'Standard Favicon & App Icon',
      format: 'png',
      width: 32,
      height: 32,
      fileSizeKb: 0.9,
      recommendedUse: 'Browser Tab Icon, PWA Manifest Icon, Bookmarks'
    },
    {
      id: `${version.id}_var_inv`,
      versionId: version.id,
      variantType: 'invoice_monochrome',
      label: 'High-Contrast Monochrome Ink',
      format: 'svg',
      width: 200,
      height: 50,
      fileSizeKb: 2.1,
      recommendedUse: 'PDF Order Receipts, Thermal Shipping Labels, Invoices'
    }
  ];
}

export interface MySQLDatabaseSnapshot {
  versions: LogoVersion[];
  auditLogs: LogoAuditLog[];
  settings: BrandSystemSettings;
  products: Product[];
  categories: ProductCategory[];
  orders: Order[];
  customers: Customer[];
  coupons: Coupon[];
  reviews: ProductReview[];
  staff: AdminStaff[];
  currentStaffId: string;
  adminAuditLogs: AdminAuditLogEntry[];
  notifications: SystemNotification[];
  staticPages: StaticPage[];
  banners: HomepageBanner[];
  lowStockThreshold: number;
  siteConfig: SiteConfig;
}

// In-Memory Database Controller (simulates full MySQL relational query & transactional state)
class MySQLBrandDatabase {
  private versions: LogoVersion[] = [...INITIAL_VERSIONS];
  private auditLogs: LogoAuditLog[] = [...INITIAL_AUDIT_LOGS];
  private settings: BrandSystemSettings = {
    id: 'sys_01',
    activeLogoId: 'logo_trs_main',
    activeVersionId: 'ver_trs_v200',
    storefrontSyncEnabled: true,
    cacheBustHash: 'b78a9c20e1f',
    lastRefreshedAt: new Date().toISOString()
  };
  private products: Product[] = [...INITIAL_PRODUCTS];
  private categories: ProductCategory[] = [...INITIAL_CATEGORIES];
  private orders: Order[] = [...INITIAL_ORDERS];
  private customers: Customer[] = [...INITIAL_CUSTOMERS];
  private coupons: Coupon[] = [...INITIAL_COUPONS];
  private reviews: ProductReview[] = [...INITIAL_REVIEWS];
  private staff: AdminStaff[] = [...INITIAL_STAFF];
  private currentStaffId: string = 'stf_01';
  private adminAuditLogs: AdminAuditLogEntry[] = [...INITIAL_ADMIN_AUDIT_LOGS];
  private notifications: SystemNotification[] = [...INITIAL_NOTIFICATIONS];
  private staticPages: StaticPage[] = [...INITIAL_STATIC_PAGES];
  private banners: HomepageBanner[] = [...INITIAL_BANNERS];
  private lowStockThreshold: number = 10;
  private listeners: (() => void)[] = [];
  private siteConfig: SiteConfig = (() => {
    try {
      const saved = localStorage.getItem('trs_site_config_v2');
      if (saved) {
        return { ...INITIAL_SITE_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      // fallback
    }
    return { ...INITIAL_SITE_CONFIG };
  })();

  public subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  public exportSnapshot(): MySQLDatabaseSnapshot {
    return structuredClone({
      versions: this.versions,
      auditLogs: this.auditLogs,
      settings: this.settings,
      products: this.products,
      categories: this.categories,
      orders: this.orders,
      customers: this.customers,
      coupons: this.coupons,
      reviews: this.reviews,
      staff: this.staff,
      currentStaffId: this.currentStaffId,
      adminAuditLogs: this.adminAuditLogs,
      notifications: this.notifications,
      staticPages: this.staticPages,
      banners: this.banners,
      lowStockThreshold: this.lowStockThreshold,
      siteConfig: this.siteConfig,
    });
  }

  public importSnapshot(snapshot: MySQLDatabaseSnapshot): void {
    this.versions = structuredClone(snapshot.versions);
    this.auditLogs = structuredClone(snapshot.auditLogs);
    this.settings = structuredClone(snapshot.settings);
    this.products = structuredClone(snapshot.products);
    this.categories = structuredClone(snapshot.categories);
    this.orders = structuredClone(snapshot.orders);
    this.customers = structuredClone(snapshot.customers);
    this.coupons = structuredClone(snapshot.coupons);
    this.reviews = structuredClone(snapshot.reviews);
    this.staff = structuredClone(snapshot.staff);
    this.currentStaffId = snapshot.currentStaffId;
    this.adminAuditLogs = structuredClone(snapshot.adminAuditLogs);
    this.notifications = structuredClone(snapshot.notifications);
    this.staticPages = structuredClone(snapshot.staticPages);
    this.banners = structuredClone(snapshot.banners);
    this.lowStockThreshold = snapshot.lowStockThreshold;
    this.siteConfig = structuredClone(snapshot.siteConfig);
    this.notify();
  }

  public importPublicSnapshot(snapshot: Partial<MySQLDatabaseSnapshot>): void {
    if (snapshot.versions) this.versions = structuredClone(snapshot.versions);
    if (snapshot.settings) this.settings = structuredClone(snapshot.settings);
    if (snapshot.products) this.products = structuredClone(snapshot.products);
    if (snapshot.categories) this.categories = structuredClone(snapshot.categories);
    if (snapshot.reviews) this.reviews = structuredClone(snapshot.reviews);
    if (snapshot.staticPages) this.staticPages = structuredClone(snapshot.staticPages);
    if (snapshot.banners) this.banners = structuredClone(snapshot.banners);
    if (snapshot.siteConfig) this.siteConfig = structuredClone(snapshot.siteConfig);
    this.notify();
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public getSettings(): BrandSystemSettings {
    return { ...this.settings };
  }

  public getActiveVersion(): LogoVersion {
    const active = this.versions.find(v => v.id === this.settings.activeVersionId);
    return active || this.versions[0];
  }

  public getAllVersions(): LogoVersion[] {
    return [...this.versions];
  }

  public getVersionById(id: string): LogoVersion | undefined {
    return this.versions.find(v => v.id === id);
  }

  public getAuditLogs(): LogoAuditLog[] {
    return [...this.auditLogs];
  }

  public getVariants(versionId?: string): LogoVariant[] {
    const target = versionId ? this.getVersionById(versionId) : this.getActiveVersion();
    if (!target) return [];
    return generateLogoVariants(target);
  }

  // E-Commerce Data Getters
  public getProducts(): Product[] {
    return [...this.products];
  }

  public getCategories(): ProductCategory[] {
    return [...this.categories];
  }

  public getOrders(): Order[] {
    return [...this.orders];
  }

  public getCustomers(): Customer[] {
    return [...this.customers];
  }

  public getCoupons(): Coupon[] {
    return [...this.coupons];
  }

  // Mutation: Create or Update Draft
  public saveDraft(config: LogoConfig, versionTag: string, changelog: string, authorName: string, authorEmail: string): LogoVersion {
    const existing = this.versions.find(v => v.versionTag === versionTag && v.status === 'draft');
    const now = new Date().toISOString();

    if (existing) {
      existing.config = { ...config };
      existing.changelog = changelog;
      existing.updatedAt = now;
      this.addAuditLog(existing.id, existing.versionTag, 'update_draft', authorName, 'Updated draft visual tokens and geometry.');
      this.notify();
      return existing;
    } else {
      const newVersion: LogoVersion = {
        id: `ver_${Date.now()}`,
        logoId: 'logo_havn_main',
        versionTag: versionTag || `v2.2.${this.versions.length}-draft`,
        semanticMajor: 2,
        semanticMinor: 2,
        semanticPatch: this.versions.length,
        status: 'draft',
        changelog: changelog || 'Draft version with customized brand geometry and typography.',
        authorName: authorName || 'Current Admin',
        authorEmail: authorEmail || 'admin@havn.store',
        createdAt: now,
        updatedAt: now,
        config: { ...config },
        checksum: Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2)
      };
      this.versions.unshift(newVersion);
      this.addAuditLog(newVersion.id, newVersion.versionTag, 'create', authorName, 'Created new logo draft version in MySQL schema.');
      this.notify();
      return newVersion;
    }
  }

  // Mutation: Submit for Review
  public submitForReview(versionId: string, notes: string, submitter: string): boolean {
    const v = this.versions.find(ver => ver.id === versionId);
    if (!v) return false;
    v.status = 'in_review';
    v.reviewNotes = notes;
    v.updatedAt = new Date().toISOString();
    this.addAuditLog(v.id, v.versionTag, 'submit_review', submitter, `Submitted version for formal brand governance review: ${notes}`);
    this.notify();
    return true;
  }

  // Mutation: Approve
  public approveVersion(versionId: string, approverName: string): boolean {
    const v = this.versions.find(ver => ver.id === versionId);
    if (!v) return false;
    v.status = 'approved';
    v.approvedBy = approverName;
    v.approvedAt = new Date().toISOString();
    v.updatedAt = new Date().toISOString();
    this.addAuditLog(v.id, v.versionTag, 'approve', approverName, 'Brand Governance Council granted production approval.');
    this.notify();
    return true;
  }

  // Mutation: Publish Technical Refresh to Storefront
  public publishVersion(versionId: string, publisherName: string = 'Abdullah Khan'): boolean {
    const v = this.versions.find(ver => ver.id === versionId);
    if (!v) return false;

    // Archive previously published versions
    this.versions.forEach(ver => {
      if (ver.status === 'published' && ver.id !== versionId) {
        ver.status = 'archived';
      }
    });

    v.status = 'published';
    v.publishedAt = new Date().toISOString();
    v.updatedAt = new Date().toISOString();

    this.settings.activeVersionId = v.id;
    this.settings.cacheBustHash = Math.random().toString(36).substring(2, 10);
    this.settings.lastRefreshedAt = new Date().toISOString();

    this.addAuditLog(v.id, v.versionTag, 'publish_refresh', publisherName, `Executed Technical Refresh: published ${v.versionTag} to storefront.`);
    this.notify();
    return true;
  }

  // Mutation: One-Click Rollback (SOP Phase 7 Safety Requirement)
  public rollbackToVersion(targetVersionId: string, reason: string, performer: string): boolean {
    const target = this.versions.find(v => v.id === targetVersionId);
    if (!target) return false;

    const previousActive = this.getActiveVersion();
    
    // Set current active to archived
    if (previousActive && previousActive.id !== target.id) {
      previousActive.status = 'archived';
    }

    target.status = 'published';
    target.updatedAt = new Date().toISOString();

    this.settings.activeVersionId = target.id;
    this.settings.cacheBustHash = Math.random().toString(36).substring(2, 10);
    this.settings.lastRefreshedAt = new Date().toISOString();

    this.addAuditLog(
      target.id,
      target.versionTag,
      'rollback',
      performer,
      `Rolled back active brand logo from ${previousActive?.versionTag || 'unknown'} to ${target.versionTag}. Reason: ${reason}`
    );
    this.notify();
    return true;
  }

  // Update live configuration on current active (Direct Admin Configuration)
  public updateActiveConfigDirectly(config: Partial<LogoConfig>, editor: string = 'Admin'): void {
    const active = this.getActiveVersion();
    if (!active) return;
    active.config = { ...active.config, ...config };
    active.updatedAt = new Date().toISOString();
    this.settings.cacheBustHash = Math.random().toString(36).substring(2, 10);
    this.settings.lastRefreshedAt = new Date().toISOString();
    this.addAuditLog(active.id, active.versionTag, 'update_draft', editor, 'Admin dynamically adjusted live logo tokens/configuration.');
    this.notify();
  }

  // ==========================================
  // MODULE 4.2: PRODUCT MANAGEMENT (REQ-PRD-001..007)
  // ==========================================
  public addProduct(productData: Omit<Product, 'id' | 'slug' | 'rating' | 'reviewCount'>): Product {
    const slug = productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newProduct: Product = {
      ...productData,
      id: `prd_${Date.now()}`,
      slug,
      rating: 5.0,
      reviewCount: 0,
      lowStockThreshold: productData.lowStockThreshold || 10,
      taxClass: productData.taxClass || 'Standard (18% GST)',
      warehouseStock: productData.warehouseStock || {
        'Central Hub - BLR': Math.round(productData.stock * 0.6),
        'North Logistics - DEL': Math.round(productData.stock * 0.4)
      }
    };
    this.products.unshift(newProduct);
    const cat = this.categories.find(c => c.id === productData.categoryId);
    if (cat) cat.productCount += 1;
    this.addAdminAuditLog('Catalog', 'CREATE_PRODUCT', `Published new product "${newProduct.name}" (SKU: ${newProduct.sku}) in category "${newProduct.categoryName}".`);
    this.notify();
    return newProduct;
  }

  public updateProduct(productId: string, updates: Partial<Product>): boolean {
    const p = this.products.find(prod => prod.id === productId);
    if (!p) return false;
    Object.assign(p, updates);
    this.addAdminAuditLog('Catalog', 'UPDATE_PRODUCT', `Updated specifications and pricing for product "${p.name}" (SKU: ${p.sku}).`);
    this.notify();
    return true;
  }

  public cloneProduct(productId: string): Product | null {
    const source = this.products.find(p => p.id === productId);
    if (!source) return null;
    const cloned: Product = {
      ...source,
      id: `prd_${Date.now()}`,
      name: `${source.name} [Clone]`,
      slug: `${source.slug}-clone-${Date.now().toString().slice(-4)}`,
      sku: `${source.sku}-CLONE`,
      status: 'Draft',
      reviewCount: 0,
      rating: 5.0
    };
    this.products.unshift(cloned);
    const cat = this.categories.find(c => c.id === cloned.categoryId);
    if (cat) cat.productCount += 1;
    this.addAdminAuditLog('Catalog', 'CLONE_PRODUCT', `Cloned product "${source.name}" to create draft SKU "${cloned.sku}".`);
    this.notify();
    return cloned;
  }

  public deleteProduct(productId: string): boolean {
    const idx = this.products.findIndex(p => p.id === productId);
    if (idx === -1) return false;
    const deleted = this.products[idx];
    this.products.splice(idx, 1);
    const cat = this.categories.find(c => c.id === deleted.categoryId);
    if (cat && cat.productCount > 0) cat.productCount -= 1;
    this.addAdminAuditLog('Catalog', 'DELETE_PRODUCT', `Permanently deleted product "${deleted.name}" (SKU: ${deleted.sku}).`);
    this.notify();
    return true;
  }

  public updateProductStatus(productId: string, status: Product['status']): boolean {
    const p = this.products.find(prod => prod.id === productId);
    if (!p) return false;
    p.status = status;
    this.addAdminAuditLog('Catalog', 'UPDATE_STATUS', `Set product "${p.name}" status to "${status}".`);
    this.notify();
    return true;
  }

  // REQ-PRD-004: Bulk Import & Export Products via CSV
  public exportProductsCsv(): string {
    const headers = ['id', 'name', 'sku', 'categoryId', 'categoryName', 'mrp', 'price', 'stock', 'status', 'description'];
    const rows = this.products.map(p => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      p.categoryId,
      `"${p.categoryName}"`,
      p.mrp,
      p.price,
      p.stock,
      p.status,
      `"${(p.description || '').replace(/"/g, '""')}"`
    ].join(','));
    return [headers.join(','), ...rows].join('\n');
  }

  public importProductsCsv(csvString: string): { importedCount: number; errors: string[] } {
    const lines = csvString.trim().split('\n');
    if (lines.length < 2) return { importedCount: 0, errors: ['CSV file is empty or missing headers'] };

    let count = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',');
      if (parts.length >= 6) {
        const name = parts[1]?.replace(/^"|"$/g, '').trim() || `Imported Item ${i}`;
        const sku = parts[2]?.trim() || `TRS-IMP-${Date.now().toString().slice(-4)}-${i}`;
        const price = parseFloat(parts[6]) || 99.0;
        const mrp = parseFloat(parts[5]) || (price * 1.2);
        const stock = parseInt(parts[7], 10) || 20;

        const newPrd: Product = {
          id: `prd_imp_${Date.now()}_${i}`,
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          categoryId: 'cat_enterprise_it',
          categoryName: 'Enterprise IT & Laptops',
          sku,
          mrp,
          price,
          stock,
          status: 'Published',
          description: parts[9]?.replace(/^"|"$/g, '').trim() || 'Bulk imported enterprise item.',
          images: ['/src/assets/images/havn_wireless_charger_1790578580677.jpg'],
          dynamicAttributes: { grade: 'Grade A (Minor cosmetic)' },
          variants: [],
          rating: 5.0,
          reviewCount: 0
        };
        this.products.unshift(newPrd);
        count++;
      } else {
        errors.push(`Line ${i + 1}: Insufficient column fields.`);
      }
    }

    if (count > 0) {
      this.addAdminAuditLog('Catalog', 'BULK_CSV_IMPORT', `Bulk imported ${count} products from CSV batch.`);
      this.notify();
    }
    return { importedCount: count, errors };
  }

  // REQ-INV-002 & REQ-INV-003: Restock & Multi-Warehouse Tracking
  public restockProduct(productId: string, quantity: number, warehouse: string = 'Central Hub - BLR'): boolean {
    const p = this.products.find(prod => prod.id === productId);
    if (!p) return false;
    p.stock += quantity;
    if (!p.warehouseStock) p.warehouseStock = {};
    p.warehouseStock[warehouse] = (p.warehouseStock[warehouse] || 0) + quantity;
    if (p.stock > 0 && p.status === 'Out of Stock') {
      p.status = 'Published';
    }
    this.addAdminAuditLog('Inventory', 'RESTOCK', `Restocked +${quantity} units for "${p.name}" at location ${warehouse}. Current total: ${p.stock}`);
    this.notify();
    return true;
  }

  public getLowStockAlerts(): Product[] {
    return this.products.filter(p => p.stock <= (p.lowStockThreshold || this.lowStockThreshold));
  }

  // ==========================================
  // MODULE 4.1: CATEGORY & ATTRIBUTE MANAGEMENT (REQ-CAT-001..004)
  // ==========================================
  public addCategory(catData: Omit<ProductCategory, 'id' | 'productCount'>): ProductCategory {
    const newCat: ProductCategory = {
      ...catData,
      id: `cat_${Date.now()}`,
      productCount: 0,
      isActive: true,
      subcategories: catData.subcategories || [],
      attributes: catData.attributes || []
    };
    this.categories.push(newCat);
    this.addAdminAuditLog('Category', 'CREATE_CATEGORY', `Created new product category "${newCat.name}" with ${newCat.attributes.length} initial attributes.`);
    this.notify();
    return newCat;
  }

  public updateCategory(catId: string, updates: Partial<ProductCategory>): boolean {
    const cat = this.categories.find(c => c.id === catId);
    if (!cat) return false;
    Object.assign(cat, updates);
    this.addAdminAuditLog('Category', 'UPDATE_CATEGORY', `Updated category "${cat.name}".`);
    this.notify();
    return true;
  }

  public toggleCategoryActive(catId: string): boolean {
    const cat = this.categories.find(c => c.id === catId);
    if (!cat) return false;
    cat.isActive = !cat.isActive;
    this.addAdminAuditLog('Category', 'TOGGLE_STATUS', `Toggled category "${cat.name}" status to ${cat.isActive ? 'Active' : 'Deactivated'}.`);
    this.notify();
    return true;
  }

  public deleteCategory(catId: string): boolean {
    const idx = this.categories.findIndex(c => c.id === catId);
    if (idx === -1) return false;
    const cat = this.categories[idx];
    this.categories.splice(idx, 1);
    this.addAdminAuditLog('Category', 'DELETE_CATEGORY', `Deactivated and removed category "${cat.name}".`);
    this.notify();
    return true;
  }

  public addSubCategory(catId: string, name: string): SubCategory | null {
    const cat = this.categories.find(c => c.id === catId);
    if (!cat) return null;
    if (!cat.subcategories) cat.subcategories = [];
    const sub: SubCategory = {
      id: `sub_${Date.now()}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      productCount: 0
    };
    cat.subcategories.push(sub);
    this.addAdminAuditLog('Category', 'ADD_SUBCATEGORY', `Added subcategory "${name}" to category "${cat.name}".`);
    this.notify();
    return sub;
  }

  public addCategoryAttribute(catId: string, attr: Omit<CategoryAttribute, 'id' | 'categoryId'>): CategoryAttribute | null {
    const cat = this.categories.find(c => c.id === catId);
    if (!cat) return null;
    const newAttr: CategoryAttribute = {
      ...attr,
      id: `att_${Date.now()}`,
      categoryId: catId
    };
    cat.attributes.push(newAttr);
    this.addAdminAuditLog('Category', 'ADD_ATTRIBUTE', `Added custom dynamic attribute "${newAttr.name}" (${newAttr.type}) to category "${cat.name}".`);
    this.notify();
    return newAttr;
  }

  public deleteCategoryAttribute(catId: string, attrId: string): boolean {
    const cat = this.categories.find(c => c.id === catId);
    if (!cat) return false;
    const attr = cat.attributes.find(a => a.id === attrId);
    cat.attributes = cat.attributes.filter(a => a.id !== attrId);
    this.addAdminAuditLog('Category', 'DELETE_ATTRIBUTE', `Removed attribute "${attr?.name || attrId}" from category "${cat.name}".`);
    this.notify();
    return true;
  }

  // ==========================================
  // MODULE 4.3 & 4.8: ORDERS & INVENTORY (REQ-INV-001, REQ-ORD-001..004)
  // ==========================================
  // Place Customer Order: Decrements inventory automatically (REQ-INV-001)
  public placeOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'date' | 'orderStatus'>): Order {
    const num = `TRS-ORD-${8830 + this.orders.length + 1}`;
    const newOrder: Order = {
      ...orderData,
      id: `ord_${Date.now()}`,
      orderNumber: num,
      date: 'Today',
      orderStatus: 'Processing',
      shippingMethod: orderData.shippingMethod || 'Standard Shipping (Free)',
      trackingNumber: `TRS-TRK-${Math.floor(100000 + Math.random() * 900000)}`
    };

    // REQ-INV-001: Automatic stock decrement upon order confirmation
    newOrder.items.forEach(item => {
      const p = this.products.find(prod => prod.id === item.productId);
      if (p) {
        p.stock = Math.max(0, p.stock - item.quantity);
        if (p.stock === 0) p.status = 'Out of Stock';

        // Decrement variant stock if specified
        if (item.variantTitle && p.variants && p.variants.length > 0) {
          const v = p.variants.find(vr => vr.title === item.variantTitle);
          if (v) v.stock = Math.max(0, v.stock - item.quantity);
        }
      }
    });

    this.orders.unshift(newOrder);

    // REQ-ORD-004: Automated transactional notification simulation
    this.notifications.unshift({
      id: `notif_${Date.now()}`,
      type: 'Email',
      recipient: newOrder.customerEmail,
      subject: `Order Confirmation — ${newOrder.orderNumber}`,
      message: `Dear ${newOrder.customerName}, your payment of $${newOrder.total.toFixed(2)} was received. Refurbish bench inspection has begun. Tracking # ${newOrder.trackingNumber}`,
      status: 'Delivered',
      timestamp: 'Just now'
    });

    this.addAdminAuditLog('Order', 'PLACE_ORDER', `New customer order ${newOrder.orderNumber} placed by ${newOrder.customerName} ($${newOrder.total.toFixed(2)}). Stock decremented.`);
    this.notify();
    return newOrder;
  }

  // Update Order Status (REQ-ORD-002 & REQ-INV-001 stock restoration on cancel/return)
  public updateOrderStatus(orderId: string, newStatus: Order['orderStatus']): boolean {
    const o = this.orders.find(ord => ord.id === orderId);
    if (!o) return false;
    const oldStatus = o.orderStatus;
    o.orderStatus = newStatus;

    // REQ-INV-001: Restore stock on order cancellation or return
    if ((newStatus === 'Cancelled' || newStatus === 'Returned') && oldStatus !== 'Cancelled' && oldStatus !== 'Returned') {
      o.items.forEach(item => {
        const p = this.products.find(prod => prod.id === item.productId);
        if (p) {
          p.stock += item.quantity;
          if (p.status === 'Out of Stock' && p.stock > 0) {
            p.status = 'Published';
          }
          if (item.variantTitle && p.variants && p.variants.length > 0) {
            const v = p.variants.find(vr => vr.title === item.variantTitle);
            if (v) v.stock += item.quantity;
          }
        }
      });
      this.addAdminAuditLog('Inventory', 'RESTORE_STOCK', `Restored inventory stock for cancelled/returned order ${o.orderNumber}.`);
    }

    // REQ-ORD-004: Transactional notification
    this.notifications.unshift({
      id: `notif_${Date.now()}`,
      type: 'SMS',
      recipient: o.customerEmail,
      subject: `Order Status Update: ${newStatus}`,
      message: `Your Tech Refresh Solution order ${o.orderNumber} is now marked as ${newStatus}.`,
      status: 'Delivered',
      timestamp: 'Just now'
    });

    this.addAdminAuditLog('Order', 'UPDATE_STATUS', `Order ${o.orderNumber} status transitioned from ${oldStatus} to ${newStatus}.`);
    this.notify();
    return true;
  }

  // REQ-ORD-003: Process Refund & Manage Returns
  public processRefund(orderId: string, amount: number, reason: string): boolean {
    const o = this.orders.find(ord => ord.id === orderId);
    if (!o) return false;
    o.paymentStatus = 'Refunded';
    o.refundAmount = amount;
    o.refundReason = reason;
    this.updateOrderStatus(orderId, 'Cancelled');
    this.addAdminAuditLog('Order', 'PROCESS_REFUND', `Processed refund of $${amount.toFixed(2)} for order ${o.orderNumber}. Reason: ${reason}`);
    this.notify();
    return true;
  }

  public requestReturn(orderId: string, reason: string): boolean {
    const o = this.orders.find(ord => ord.id === orderId);
    if (!o) return false;
    o.returnRequested = true;
    o.returnReason = reason;
    this.addAdminAuditLog('Order', 'RETURN_REQUESTED', `Return request initiated for order ${o.orderNumber}. Reason: ${reason}`);
    this.notify();
    return true;
  }

  // ==========================================
  // MODULE 4.9: REVIEWS & RATINGS (REQ-REV-001 & REQ-REV-002)
  // ==========================================
  public getAllReviews(): ProductReview[] {
    return [...this.reviews];
  }

  public getProductReviews(productId: string): ProductReview[] {
    return this.reviews.filter(r => r.productId === productId && r.status === 'Approved');
  }

  public addReview(reviewData: Omit<ProductReview, 'id' | 'date' | 'status'>): ProductReview {
    const newRev: ProductReview = {
      ...reviewData,
      id: `rev_${Date.now()}`,
      date: 'Today',
      status: reviewData.verifiedPurchase ? 'Approved' : 'Pending'
    };
    this.reviews.unshift(newRev);

    // Recalculate product rating
    const approvedReviews = this.reviews.filter(r => r.productId === reviewData.productId && r.status === 'Approved');
    const p = this.products.find(prod => prod.id === reviewData.productId);
    if (p && approvedReviews.length > 0) {
      const avg = approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length;
      p.rating = Math.round(avg * 10) / 10;
      p.reviewCount = approvedReviews.length;
    }

    this.addAdminAuditLog('Reviews', 'SUBMIT_REVIEW', `Customer ${newRev.customerName} submitted a ${newRev.rating}-star review for "${newRev.productName}".`);
    this.notify();
    return newRev;
  }

  public moderateReview(reviewId: string, status: 'Approved' | 'Rejected'): boolean {
    const r = this.reviews.find(rev => rev.id === reviewId);
    if (!r) return false;
    r.status = status;

    // Recalculate product rating
    const approvedReviews = this.reviews.filter(rev => rev.productId === r.productId && rev.status === 'Approved');
    const p = this.products.find(prod => prod.id === r.productId);
    if (p) {
      if (approvedReviews.length > 0) {
        const avg = approvedReviews.reduce((sum, rev) => sum + rev.rating, 0) / approvedReviews.length;
        p.rating = Math.round(avg * 10) / 10;
        p.reviewCount = approvedReviews.length;
      } else {
        p.reviewCount = 0;
      }
    }

    this.addAdminAuditLog('Reviews', 'MODERATE_REVIEW', `Review #${r.id} for "${r.productName}" was marked as ${status}.`);
    this.notify();
    return true;
  }

  // ==========================================
  // MODULE 4.10: PROMOTIONS & CONTENT (REQ-PRM-001..003)
  // ==========================================
  public addCoupon(coupon: Omit<Coupon, 'id' | 'usedCount'>): Coupon {
    const newCpn: Coupon = {
      ...coupon,
      id: `cpn_${Date.now()}`,
      usedCount: 0
    };
    this.coupons.push(newCpn);
    this.addAdminAuditLog('Marketing', 'CREATE_COUPON', `Created promotion coupon ${newCpn.code} (${newCpn.value}${newCpn.discountType === 'percentage' ? '%' : '$'} off).`);
    this.notify();
    return newCpn;
  }

  public getBanners(): HomepageBanner[] {
    return [...this.banners];
  }

  public toggleBanner(bannerId: string): boolean {
    const b = this.banners.find(bnr => bnr.id === bannerId);
    if (!b) return false;
    b.active = !b.active;
    this.notify();
    return true;
  }

  public getStaticPages(): StaticPage[] {
    return [...this.staticPages];
  }

  public updateStaticPage(slug: string, content: string): boolean {
    const pg = this.staticPages.find(p => p.slug === slug);
    if (!pg) return false;
    pg.content = content;
    pg.lastUpdated = 'Just now';
    this.addAdminAuditLog('Brand', 'UPDATE_STATIC_PAGE', `Updated content for static page "${pg.title}".`);
    this.notify();
    return true;
  }

  // ==========================================
  // MODULE 4.12: ADMINISTRATION & RBAC (REQ-ADM-001 & REQ-ADM-002)
  // ==========================================
  public getStaffMembers(): AdminStaff[] {
    return [...this.staff];
  }

  public getCurrentStaff(): AdminStaff {
    return this.staff.find(s => s.id === this.currentStaffId) || this.staff[0];
  }

  public setCurrentStaff(staffId: string): void {
    const s = this.staff.find(stf => stf.id === staffId);
    if (s) {
      this.currentStaffId = staffId;
      s.lastActive = 'Just now';
      this.notify();
    }
  }

  public getAdminAuditLogs(): AdminAuditLogEntry[] {
    return [...this.adminAuditLogs];
  }

  public addAdminAuditLog(module: AdminAuditLogEntry['module'], action: string, details: string): void {
    const staff = this.getCurrentStaff();
    const entry: AdminAuditLogEntry = {
      id: `aal_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      module,
      action,
      performedBy: staff.name,
      role: staff.role,
      details,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    this.adminAuditLogs.unshift(entry);
  }

  public getNotifications(): SystemNotification[] {
    return [...this.notifications];
  }

  private addAuditLog(versionId: string, versionTag: string, action: LogoAuditLog['action'], performedBy: string, summary: string) {
    const log: LogoAuditLog = {
      id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      versionId,
      versionTag,
      action,
      performedBy: performedBy || 'Admin',
      role: 'Brand Operations',
      summary,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    this.auditLogs.unshift(log);
  }

  // Interactive SQL Query Engine for Admin MySQL Inspector
  public executeSqlQuery(rawQuery: string): { columns: string[]; rows: any[]; affectedRows?: number; executionTimeMs: number; error?: string } {
    const start = performance.now();
    const clean = rawQuery.trim().replace(/;$/, '');
    const lower = clean.toLowerCase();

    try {
      if (lower.startsWith('show tables')) {
        return {
          columns: ['Tables_in_havn_brand_catalog'],
          rows: [
            ['brand_logos'],
            ['logo_versions'],
            ['logo_variants'],
            ['logo_audit_logs'],
            ['brand_system_settings'],
            ['products'],
            ['product_categories'],
            ['orders'],
            ['coupons']
          ],
          executionTimeMs: Math.round(performance.now() - start + 4)
        };
      }

      if (lower.startsWith('describe') || lower.startsWith('desc')) {
        const tableName = lower.split(' ')[1];
        if (tableName.includes('version')) {
          return {
            columns: ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'],
            rows: [
              ['id', 'varchar(64)', 'NO', 'PRI', null, ''],
              ['logo_id', 'varchar(64)', 'NO', 'MUL', null, ''],
              ['version_tag', 'varchar(32)', 'NO', 'MUL', null, ''],
              ['semantic_major', 'int unsigned', 'NO', '', '1', ''],
              ['semantic_minor', 'int unsigned', 'NO', '', '0', ''],
              ['semantic_patch', 'int unsigned', 'NO', '', '0', ''],
              ['status', "enum('draft','in_review','approved','published','archived')", 'NO', 'MUL', 'draft', ''],
              ['changelog', 'text', 'NO', '', null, ''],
              ['author_name', 'varchar(100)', 'NO', '', null, ''],
              ['author_email', 'varchar(120)', 'NO', '', null, ''],
              ['approved_by', 'varchar(100)', 'YES', '', null, ''],
              ['checksum', 'char(64)', 'NO', '', null, ''],
              ['config_json', 'json', 'NO', '', null, '']
            ],
            executionTimeMs: Math.round(performance.now() - start + 2)
          };
        }
      }

      if (lower.includes('from logo_versions') || lower.includes('from `logo_versions`')) {
        const rows = this.versions.map(v => ({
          id: v.id,
          version_tag: v.versionTag,
          status: v.status,
          author_name: v.authorName,
          brand_name: v.config.brandName,
          font_family: v.config.fontFamily,
          primary_color: v.config.primaryColor,
          accent_color: v.config.accentColor,
          created_at: v.createdAt,
          published_at: v.publishedAt || 'NULL'
        }));
        return {
          columns: Object.keys(rows[0] || {}),
          rows: rows.map(r => Object.values(r)),
          executionTimeMs: Math.round(performance.now() - start + 3)
        };
      }

      if (lower.includes('from logo_audit_logs') || lower.includes('from `logo_audit_logs`')) {
        const rows = this.auditLogs.map(a => ({
          id: a.id,
          version_tag: a.versionTag,
          action: a.action,
          performed_by: a.performedBy,
          summary: a.summary,
          timestamp: a.timestamp
        }));
        return {
          columns: Object.keys(rows[0] || {}),
          rows: rows.map(r => Object.values(r)),
          executionTimeMs: Math.round(performance.now() - start + 2)
        };
      }

      if (lower.includes('from logo_variants') || lower.includes('from `logo_variants`')) {
        const vars = this.getVariants();
        const rows = vars.map(v => ({
          id: v.id,
          variant_type: v.variantType,
          label: v.label,
          file_format: v.format,
          dimensions: `${v.width}x${v.height}`,
          file_size_kb: v.fileSizeKb,
          recommended_use: v.recommendedUse
        }));
        return {
          columns: Object.keys(rows[0] || {}),
          rows: rows.map(r => Object.values(r)),
          executionTimeMs: Math.round(performance.now() - start + 2)
        };
      }

      if (lower.includes('from brand_system_settings')) {
        const active = this.getActiveVersion();
        return {
          columns: ['id', 'active_logo_id', 'active_version_id', 'version_tag', 'storefront_sync', 'last_refreshed_at'],
          rows: [[
            this.settings.id,
            this.settings.activeLogoId,
            this.settings.activeVersionId,
            active.versionTag,
            this.settings.storefrontSyncEnabled ? 'TRUE' : 'FALSE',
            this.settings.lastRefreshedAt
          ]],
          executionTimeMs: Math.round(performance.now() - start + 1)
        };
      }

      if (lower.includes('from products')) {
        const rows = this.products.map(p => ({
          id: p.id,
          name: p.name,
          category: p.categoryName,
          sku: p.sku,
          mrp: `$${p.mrp.toFixed(2)}`,
          selling_price: `$${p.price.toFixed(2)}`,
          stock: p.stock,
          status: p.status
        }));
        return {
          columns: Object.keys(rows[0] || {}),
          rows: rows.map(r => Object.values(r)),
          executionTimeMs: Math.round(performance.now() - start + 2)
        };
      }

      // Fallback response for custom queries
      return {
        columns: ['Query Status', 'Statement Executed', 'Message'],
        rows: [['OK', clean, 'Query executed successfully against Havn MySQL Database Engine. 1 row affected.']],
        executionTimeMs: Math.round(performance.now() - start + 4)
      };
    } catch (err: any) {
      return {
        columns: ['Error'],
        rows: [[err.message || 'SQL execution failed']],
        error: err.message,
        executionTimeMs: Math.round(performance.now() - start)
      };
    }
  }
}

export const db = new MySQLBrandDatabase();
