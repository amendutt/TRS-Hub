import React, { useState, useEffect } from 'react';
import { db } from '../../services/mysqlMockDb';
import {
  Product,
  Order,
  ProductCategory,
  CategoryAttribute,
  ProductVariant,
  ProductReview,
  AdminStaff,
  AdminAuditLogEntry,
  SystemNotification,
  Coupon,
  StaticPage,
  HomepageBanner
} from '../../types/logo';
import { BrandLogo } from '../logo/BrandLogo';
import { LogoTechnicalRefreshStudio } from '../logo/LogoTechnicalRefreshStudio';
import {
  LayoutDashboard,
  Sparkles,
  ShoppingBag,
  Package,
  Users,
  Tag,
  BarChart3,
  Settings,
  LogOut,
  ExternalLink,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  RotateCcw,
  Check,
  ChevronDown,
  Upload,
  FolderTree,
  Trash2,
  ListFilter,
  Copy,
  Download,
  Star,
  ShieldCheck,
  FileText,
  X,
  RefreshCw,
  SlidersHorizontal,
  Eye,
  AlertTriangle,
  Mail,
  Smartphone,
  Layers,
  ArrowRight
} from 'lucide-react';

interface AdminPortalProps {
  onBackToStorefront: () => void;
  initialTab?: 'dashboard' | 'logo_studio' | 'catalog' | 'categories' | 'orders' | 'reviews' | 'customers' | 'marketing' | 'reports' | 'audit_logs' | 'settings';
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onBackToStorefront,
  initialTab = 'dashboard'
}) => {
  const [activeNav, setActiveNav] = useState<'dashboard' | 'logo_studio' | 'catalog' | 'categories' | 'orders' | 'reviews' | 'customers' | 'marketing' | 'reports' | 'audit_logs' | 'settings'>(initialTab);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);

  // Synced Live State from MySQL Mock DB
  const [products, setProducts] = useState<Product[]>(db.getProducts());
  const [categories, setCategories] = useState<ProductCategory[]>(db.getCategories());
  const [orders, setOrders] = useState<Order[]>(db.getOrders());
  const [customers] = useState(db.getCustomers());
  const [coupons, setCoupons] = useState<Coupon[]>(db.getCoupons());
  const [reviews, setReviews] = useState<ProductReview[]>(db.getAllReviews());
  const [staff, setStaff] = useState<AdminStaff[]>(db.getStaffMembers());
  const [currentStaff, setCurrentStaff] = useState<AdminStaff>(db.getCurrentStaff());
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogEntry[]>(db.getAdminAuditLogs());
  const [notifications, setNotifications] = useState<SystemNotification[]>(db.getNotifications());
  const [banners, setBanners] = useState<HomepageBanner[]>(db.getBanners());
  const [staticPages, setStaticPages] = useState<StaticPage[]>(db.getStaticPages());

  // Listen to DB mutations
  useEffect(() => {
    const unsub = db.subscribe(() => {
      setProducts(db.getProducts());
      setCategories(db.getCategories());
      setOrders(db.getOrders());
      setCoupons(db.getCoupons());
      setReviews(db.getAllReviews());
      setStaff(db.getStaffMembers());
      setCurrentStaff(db.getCurrentStaff());
      setAuditLogs(db.getAdminAuditLogs());
      setNotifications(db.getNotifications());
      setBanners(db.getBanners());
      setStaticPages(db.getStaticPages());
    });
    return unsub;
  }, []);

  const activeLogo = db.getActiveVersion();
  const lowStockProducts = db.getLowStockAlerts();

  // ==========================================
  // MODULE 4.1: CATEGORY & ATTRIBUTE MANAGEMENT
  // ==========================================
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatDesc, setNewCatDesc] = useState<string>('');
  const [newCatSubcategories, setNewCatSubcategories] = useState<string>('');
  const [selectedCatForAttr, setSelectedCatForAttr] = useState<string>('cat_enterprise_it');
  const [newAttrName, setNewAttrName] = useState<string>('');
  const [newAttrType, setNewAttrType] = useState<CategoryAttribute['type']>('dropdown');
  const [newAttrOptions, setNewAttrOptions] = useState<string>('');
  const [newAttrMandatory, setNewAttrMandatory] = useState<boolean>(true);
  const [newAttrFilterable, setNewAttrFilterable] = useState<boolean>(true);

  // ==========================================
  // MODULE 4.2: PRODUCT MANAGEMENT & FORM STATE
  // ==========================================
  const [isAddingProduct, setIsAddingProduct] = useState<boolean>(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cat_enterprise_it');
  const [newProductName, setNewProductName] = useState<string>('');
  const [newProductDesc, setNewProductDesc] = useState<string>('');
  const [newProductMrp, setNewProductMrp] = useState<number>(1499);
  const [newProductPrice, setNewProductPrice] = useState<number>(849);
  const [newProductSku, setNewProductSku] = useState<string>('TRS-NB-0099');
  const [newProductStock, setNewProductStock] = useState<number>(30);
  const [newProductTaxClass, setNewProductTaxClass] = useState<'Standard (18% GST)' | 'Reduced (12%)' | 'Zero Rated (0%)'>('Standard (18% GST)');
  const [newProductSeoTitle, setNewProductSeoTitle] = useState<string>('');
  const [newProductSeoDesc, setNewProductSeoDesc] = useState<string>('');
  const [newProductUrlSlug, setNewProductUrlSlug] = useState<string>('');
  const [newProductImage, setNewProductImage] = useState<string>('/src/assets/images/havn_wireless_charger_1790578580677.jpg');
  const [productSearch, setProductSearch] = useState<string>('');

  // Configurable Variants state for Add Product
  const [hasVariants, setHasVariants] = useState<boolean>(false);
  const [variantsList, setVariantsList] = useState<{ title: string; sku: string; price: number; stock: number }[]>([
    { title: '16GB RAM / 512GB SSD', sku: 'TRS-NB-0099-16G', price: 749, stock: 12 },
    { title: '32GB RAM / 1TB SSD', sku: 'TRS-NB-0099-32G', price: 849, stock: 18 }
  ]);
  const [newVariantTitle, setNewVariantTitle] = useState<string>('');
  const [newVariantPrice, setNewVariantPrice] = useState<number>(799);
  const [newVariantStock, setNewVariantStock] = useState<number>(15);

  const [dynamicAttrValues, setDynamicAttrValues] = useState<Record<string, any>>({
    grade: 'Grade A+ (Pristine)',
    processor: 'Intel Core i7 12th Gen',
    ram: '32GB DDR5',
    storage: '1TB PCIe 4.0 SSD',
    warranty: '2-Year Next-Business-Day Replacement'
  });

  // Modal Dialogs
  const [showCsvModal, setShowCsvModal] = useState<boolean>(false);
  const [csvInput, setCsvInput] = useState<string>(`id,name,sku,categoryId,categoryName,mrp,price,stock,status,description
prd_bulk_01,Dell Latitude 7420 (Grade A+),TRS-NB-0044,cat_enterprise_it,Enterprise IT & Laptops,1199,649,20,Published,14" FHD Core i7 16GB RAM 512GB SSD
prd_bulk_02,HP EliteBook 840 G8,TRS-NB-0055,cat_enterprise_it,Enterprise IT & Laptops,1099,589,15,Published,Refurbished corporate flagship laptop`);
  
  const [restockModalItem, setRestockModalItem] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<number>(20);
  const [restockLocation, setRestockLocation] = useState<string>('Central Hub - BLR');

  const [refundModalOrder, setRefundModalOrder] = useState<Order | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState<string>('Customer RMA return accepted / passed diagnostic');

  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);

  // Orders Filter State
  const [orderFilter, setOrderFilter] = useState<'All' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'>('All');
  const [orderSearch, setOrderSearch] = useState<string>('');

  // Reviews Filter
  const [reviewFilter, setReviewFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');

  // New Coupon Form
  const [isAddingCoupon, setIsAddingCoupon] = useState<boolean>(false);
  const [newCouponCode, setNewCouponCode] = useState<string>('PROMO20');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'flat'>('percentage');
  const [newCouponVal, setNewCouponVal] = useState<number>(20);
  const [newCouponLimit, setNewCouponLimit] = useState<number>(200);

  // Dynamic Category Change
  const handleCategoryChange = (catId: string) => {
    setSelectedCategoryId(catId);
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;
    const initialAttrs: Record<string, any> = {};
    cat.attributes.forEach(attr => {
      initialAttrs[attr.key] = attr.options ? attr.options[0] : '';
    });
    setDynamicAttrValues(initialAttrs);
  };

  // Submit New Product (REQ-PRD-001 & REQ-PRD-002)
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = categories.find(c => c.id === selectedCategoryId);
    if (!cat || !newProductName) return;

    const formattedVariants: ProductVariant[] = hasVariants
      ? variantsList.map((v, i) => ({
          id: `var_${Date.now()}_${i}`,
          sku: v.sku || `${newProductSku}-${i + 1}`,
          title: v.title,
          attributes: { Option: v.title },
          price: Number(v.price),
          mrp: Number(newProductMrp),
          stock: Number(v.stock)
        }))
      : [];

    db.addProduct({
      name: newProductName,
      categoryId: cat.id,
      categoryName: cat.name,
      sku: newProductSku,
      mrp: Number(newProductMrp),
      price: Number(newProductPrice),
      stock: Number(newProductStock),
      status: 'Published',
      description: newProductDesc || `${newProductName} certified by Tech Refresh Solution.`,
      images: [newProductImage],
      dynamicAttributes: dynamicAttrValues,
      variants: formattedVariants,
      taxClass: newProductTaxClass,
      seoTitle: newProductSeoTitle || `${newProductName} | Tech Refresh Solution`,
      seoDescription: newProductSeoDesc || `Buy ${newProductName} certified with multi-point warranty.`,
      urlSlug: newProductUrlSlug || newProductName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    });

    setIsAddingProduct(false);
    setNewProductName('');
    setNewProductDesc('');
  };

  // Category & Dynamic Attribute Handlers (REQ-CAT-001..004)
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    const slug = newCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const subs = newCatSubcategories
      ? newCatSubcategories.split(',').map((s, idx) => ({
          id: `sub_${Date.now()}_${idx}`,
          name: s.trim(),
          slug: s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          productCount: 0
        }))
      : [];

    db.addCategory({
      name: newCatName,
      slug,
      description: newCatDesc || `${newCatName} hardware catalog.`,
      attributes: [],
      subcategories: subs,
      isActive: true
    });
    setNewCatName('');
    setNewCatDesc('');
    setNewCatSubcategories('');
    setIsAddingCategory(false);
  };

  const handleAddAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttrName || !selectedCatForAttr) return;
    const key = newAttrName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const options = newAttrOptions ? newAttrOptions.split(',').map(s => s.trim()).filter(Boolean) : undefined;
    db.addCategoryAttribute(selectedCatForAttr, {
      name: newAttrName,
      key,
      type: newAttrType,
      options,
      isMandatory: newAttrMandatory,
      isFilterable: newAttrFilterable
    });
    setNewAttrName('');
    setNewAttrOptions('');
  };

  // Bulk CSV Import (REQ-PRD-004)
  const handleRunCsvImport = () => {
    const res = db.importProductsCsv(csvInput);
    if (res.errors.length > 0) {
      alert(`Import completed: ${res.importedCount} products added. Errors: \n${res.errors.join('\n')}`);
    } else {
      alert(`Success! Successfully imported ${res.importedCount} products into the catalog.`);
    }
    setShowCsvModal(false);
  };

  // Bulk CSV Export (REQ-PRD-004)
  const handleExportCsv = () => {
    const csvData = db.exportProductsCsv();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TRS_Catalog_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Restock Submit (REQ-INV-002 & REQ-INV-003)
  const handleConfirmRestock = () => {
    if (!restockModalItem) return;
    db.restockProduct(restockModalItem.id, Number(restockQty), restockLocation);
    setRestockModalItem(null);
  };

  // Refund Submit (REQ-ORD-003)
  const handleConfirmRefund = () => {
    if (!refundModalOrder) return;
    db.processRefund(refundModalOrder.id, Number(refundAmount), refundReason);
    setRefundModalOrder(null);
  };

  // Create Coupon (REQ-PRM-001)
  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode) return;
    db.addCoupon({
      code: newCouponCode.toUpperCase().trim(),
      discountType: newCouponType,
      value: Number(newCouponVal),
      usageLimit: Number(newCouponLimit),
      validTill: '31 Dec 2026',
      status: 'Active'
    });
    setIsAddingCoupon(false);
    setNewCouponCode('');
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    if (!productSearch) return true;
    const term = productSearch.toLowerCase();
    return p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term) || p.categoryName.toLowerCase().includes(term);
  });

  // Filtered Orders
  const filteredOrders = orders.filter(o => {
    const matchStatus = orderFilter === 'All' || o.orderStatus === orderFilter;
    const matchSearch = !orderSearch || o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) || o.customerName.toLowerCase().includes(orderSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Filtered Reviews
  const filteredReviews = reviews.filter(r => {
    if (reviewFilter === 'All') return true;
    return r.status === reviewFilter;
  });

  // Admin Login Screen view if logged out
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center p-4">
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl border border-[#E4E1D6] overflow-hidden grid grid-cols-1 md:grid-cols-2">
          <div className="bg-gradient-to-br from-[#0B3D3F] to-[#0F5257] text-white p-10 flex flex-col justify-between">
            <BrandLogo config={activeLogo.config} themeMode="dark" size="lg" />
            <div className="space-y-3">
              <h2 className="font-serif text-2xl font-bold">{activeLogo.config.brandName} Back-Office</h2>
              <p className="text-xs text-[#B0C6C3] leading-relaxed">
                Enterprise control portal for multi-category dynamic catalog, order fulfillment, and the Logo Technical Refresh engine.
              </p>
            </div>
            <div className="text-[11px] text-[#A4BFBC]">
              Powered by MySQL 8.0 &amp; TRS Governance Engine
            </div>
          </div>

          <div className="p-10 flex flex-col justify-center space-y-6">
            <div>
              <h3 className="font-serif text-2xl font-bold text-[#20241F]">Log in to Admin</h3>
              <p className="text-xs text-[#666B62]">Enter credentials to access back-office modules.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#666B62] mb-1">Email</label>
                <input
                  type="email"
                  defaultValue="admin@techrefresh.com"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#E4E1D6] bg-[#F7F5EF]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#666B62] mb-1">Password</label>
                <input
                  type="password"
                  defaultValue="••••••••••••"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#E4E1D6] bg-[#F7F5EF]"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsLoggedIn(true)}
                className="w-full py-2.5 bg-[#0F5257] hover:bg-[#0B3D3F] text-white rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] flex font-sans">
      {/* Sidebar matching visual design shell */}
      <aside className="w-64 bg-[#0B3D3F] text-[#CFE3E0] p-5 shrink-0 flex flex-col justify-between hidden md:flex border-r border-[#0F5257]">
        <div className="space-y-6">
          {/* Brand Wordmark in Sidebar using Refreshed Logo (Dark mode) */}
          <div className="pb-4 border-b border-[#0F5257]/60">
            <BrandLogo config={activeLogo.config} themeMode="dark" size="md" />
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[#A4BFBC]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Active Brand Version:</span>
              <strong className="text-white font-mono">{activeLogo.versionTag}</strong>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'logo_studio', label: 'Logo Refresh Studio', icon: Sparkles, highlight: true },
              { id: 'catalog', label: 'Dynamic Catalog', icon: Package, count: products.length },
              { id: 'categories', label: 'Categories & Attributes', icon: FolderTree, count: categories.length },
              { id: 'orders', label: 'Orders & Fulfillment', icon: ShoppingBag, count: orders.length },
              { id: 'reviews', label: 'Customer Reviews', icon: Star, count: reviews.filter(r => r.status === 'Pending').length || undefined },
              { id: 'customers', label: 'Customers', icon: Users, count: customers.length },
              { id: 'marketing', label: 'Marketing & Content', icon: Tag },
              { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
              { id: 'audit_logs', label: 'Audit Logs & RBAC', icon: ShieldCheck },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-white/10 text-white font-semibold border-l-3 border-[#48B065] pl-2.5'
                      : 'text-[#AECAC5] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${item.highlight ? 'text-[#48B065]' : ''}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span className="px-1.5 py-0.2 text-[10px] rounded bg-white/20 text-white font-mono">
                      {item.count}
                    </span>
                  )}
                  {item.highlight && !isActive && (
                    <span className="w-2 h-2 rounded-full bg-[#48B065] animate-pulse"></span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-[#0F5257]/60 space-y-2">
          {/* Low Stock Indicator */}
          {lowStockProducts.length > 0 && (
            <div
              onClick={() => setActiveNav('catalog')}
              className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2 cursor-pointer hover:bg-amber-500/20"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="truncate">
                <span className="font-semibold block">{lowStockProducts.length} low-stock alerts</span>
                <span className="text-[10px] opacity-80">Click to restock</span>
              </div>
            </div>
          )}

          <button
            onClick={onBackToStorefront}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#AECAC5] hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Public Storefront</span>
          </button>
          <button
            onClick={() => setIsLoggedIn(false)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-300 hover:bg-red-900/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-[#E4E1D6] px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-lg font-bold text-[#20241F] capitalize">
              {activeNav.replace('_', ' ')}
            </h2>
            <span className="hidden sm:inline-flex text-[11px] font-semibold text-[#0F5257] bg-[#EAF1F0] px-2.5 py-0.5 rounded-full border border-[#0F5257]/20">
              MySQL Relational Engine
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* RBAC Quick Role Switcher (REQ-ADM-001) */}
            <div className="flex items-center gap-1.5 bg-[#F7F5EF] px-2.5 py-1 rounded-lg border border-[#E4E1D6]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0F5257]" />
              <span className="text-[11px] text-[#666B62] hidden lg:inline">Role:</span>
              <select
                value={currentStaff.id}
                onChange={(e) => db.setCurrentStaff(e.target.value)}
                className="text-xs font-semibold text-[#0F5257] bg-transparent focus:outline-none cursor-pointer"
              >
                {staff.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Notification logs drawer button (REQ-ORD-004) */}
            <button
              onClick={() => setShowNotificationsModal(true)}
              className="p-1.5 text-[#666B62] hover:text-[#0F5257] hover:bg-[#F7F5EF] rounded-lg transition-colors cursor-pointer relative"
              title="Automated Email & SMS Notifications Log"
            >
              <Mail className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1 right-1"></span>
            </button>

            <button
              onClick={onBackToStorefront}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F5257] bg-[#EAF1F0] hover:bg-[#d9e7e5] rounded-lg transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>🛍️ Storefront</span>
            </button>
          </div>
        </header>

        {/* View Routing */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* TAB: LOGO TECHNICAL REFRESH STUDIO */}
          {activeNav === 'logo_studio' && (
            <LogoTechnicalRefreshStudio />
          )}

          {/* TAB: DASHBOARD */}
          {activeNav === 'dashboard' && (
            <div className="space-y-6">
              {/* Stat Cards matching visual design mockup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-[#E4E1D6] shadow-xs">
                  <span className="text-xs text-[#666B62] block mb-1">Revenue (30d)</span>
                  <div className="font-serif text-2xl font-bold text-[#20241F]">
                    ${orders.reduce((sum, o) => sum + (o.orderStatus !== 'Cancelled' ? o.total : 0), 48230).toFixed(2)}
                  </div>
                  <span className="text-xs text-emerald-700 font-medium">↑ 14.8% vs last month</span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#E4E1D6] shadow-xs">
                  <span className="text-xs text-[#666B62] block mb-1">Total Orders</span>
                  <div className="font-serif text-2xl font-bold text-[#20241F]">{1284 + orders.length}</div>
                  <span className="text-xs text-emerald-700 font-medium">↑ 8.2% vs last month</span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#E4E1D6] shadow-xs">
                  <span className="text-xs text-[#666B62] block mb-1">Catalog SKUs</span>
                  <div className="font-serif text-2xl font-bold text-[#20241F]">{products.length} Products</div>
                  <span className="text-xs text-[#0F5257] font-medium">{categories.length} Categories Active</span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#E4E1D6] shadow-xs">
                  <span className="text-xs text-[#666B62] block mb-1">Low-Stock Warnings</span>
                  <div className="font-serif text-2xl font-bold text-amber-700">{lowStockProducts.length} Items</div>
                  <span className="text-xs text-amber-800 font-medium">Threshold: &le; 10 units</span>
                </div>
              </div>

              {/* Grid: Sales Chart & Recent Orders */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Sales Chart (7 cols) */}
                <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-[#E4E1D6] shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-base font-bold text-[#20241F]">Revenue Pipeline &amp; Fulfillment</h3>
                      <p className="text-xs text-[#666B62]">Real-time transactional gross merchandise value</p>
                    </div>
                    <span className="text-xs text-[#666B62]">September 2026</span>
                  </div>

                  <svg viewBox="0 0 400 120" width="100%" height="160" className="overflow-visible">
                    <polyline
                      fill="none"
                      stroke="#0F5257"
                      strokeWidth="3"
                      points="0,90 50,80 100,85 150,55 200,65 250,35 300,45 350,20 400,25"
                    />
                    <polyline
                      fill="rgba(15,82,87,0.12)"
                      stroke="none"
                      points="0,90 50,80 100,85 150,55 200,65 250,35 300,45 350,20 400,25 400,120 0,120"
                    />
                  </svg>
                </div>

                {/* Recent Orders (5 cols) */}
                <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-[#E4E1D6] shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-base font-bold text-[#20241F]">Recent Orders</h3>
                    <button onClick={() => setActiveNav('orders')} className="text-xs text-[#0F5257] hover:underline cursor-pointer">
                      View all ({orders.length}) →
                    </button>
                  </div>

                  <div className="space-y-3 divide-y divide-[#E4E1D6]">
                    {orders.slice(0, 4).map(o => (
                      <div key={o.id} className="pt-2.5 flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-[#20241F] block">{o.orderNumber} — {o.customerName}</strong>
                          <span className="text-[#666B62] font-mono">${o.total.toFixed(2)} · {o.items.length} item(s)</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          o.orderStatus === 'Shipped' ? 'bg-[#EAF1F0] text-[#0F5257]' :
                          o.orderStatus === 'Delivered' ? 'bg-emerald-50 text-emerald-800' :
                          o.orderStatus === 'Processing' ? 'bg-amber-50 text-amber-800' :
                          'bg-red-50 text-red-800'
                        }`}>
                          {o.orderStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DYNAMIC CATALOG (BRD/SRS REQ-PRD-001..007) */}
          {activeNav === 'catalog' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 border border-[#E4E1D6] shadow-xs space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E1D6] pb-4">
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-[#20241F]">
                      Dynamic Product Catalog &amp; Configurable Attribute Engine
                    </h3>
                    <p className="text-xs text-[#666B62]">
                      Category-agnostic system (REQ-PRD-001). Admin adds simple or variant products with dynamic attributes, multi-warehouse stock, and time-bound pricing.
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleExportCsv}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F3] hover:bg-[#EAE6D8] text-[#20241F] border border-[#E4E1D6] rounded-lg text-xs font-semibold transition-all cursor-pointer"
                      title="Download catalog as CSV/Excel"
                    >
                      <Download className="w-3.5 h-3.5 text-[#0F5257]" />
                      <span>Export CSV</span>
                    </button>

                    <button
                      onClick={() => setShowCsvModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F3] hover:bg-[#EAE6D8] text-[#20241F] border border-[#E4E1D6] rounded-lg text-xs font-semibold transition-all cursor-pointer"
                      title="Bulk import products from CSV"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#0F5257]" />
                      <span>Import CSV</span>
                    </button>

                    <button
                      onClick={() => setIsAddingProduct(!isAddingProduct)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#0F5257] hover:bg-[#0B3D3F] text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-[#D9A441]" />
                      <span>{isAddingProduct ? 'Close Form' : '+ Add Dynamic Product'}</span>
                    </button>
                  </div>
                </div>

                {/* Add Product Form Modal / Section (REQ-PRD-001, 002, 003, 005, 007) */}
                {isAddingProduct && (
                  <form onSubmit={handleCreateProduct} className="p-6 bg-[#FAF8F3] rounded-xl border border-[#E4E1D6] space-y-6 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-[#E4E1D6] pb-3">
                      <div>
                        <h4 className="font-serif text-base font-bold text-[#20241F]">
                          Add Dynamic Product (EAV Schema + Configurable Variants)
                        </h4>
                        <span className="text-xs text-[#0F5257]">Select category to automatically populate required attributes</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddingProduct(false)}
                        className="p-1 rounded-md text-[#666B62] hover:text-[#20241F]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Column: Basic Info & Dynamic Attributes */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-[#666B62] mb-1">
                            Category Target (Triggers Dynamic EAV Schema)
                          </label>
                          <select
                            value={selectedCategoryId}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-[#E4E1D6] bg-white font-medium"
                          >
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>{c.name} ({c.attributes.length} custom attributes)</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#666B62] mb-1">Product Title</label>
                          <input
                            type="text"
                            value={newProductName}
                            onChange={(e) => setNewProductName(e.target.value)}
                            placeholder="e.g. ThinkPad X1 Carbon Gen 11 (Refurbished Grade A+)"
                            className="w-full px-3 py-2 text-xs rounded-lg border border-[#E4E1D6] bg-white font-semibold"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#666B62] mb-1">Product Description</label>
                          <textarea
                            value={newProductDesc}
                            onChange={(e) => setNewProductDesc(e.target.value)}
                            rows={3}
                            placeholder="Engineering diagnostics, certifications, hardware provenance..."
                            className="w-full px-3 py-2 text-xs rounded-lg border border-[#E4E1D6] bg-white"
                          />
                        </div>

                        {/* Dynamic Category Attributes (REQ-CAT-004) */}
                        <div className="p-4 bg-white rounded-lg border border-[#E4E1D6] space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#0F5257] block">
                              Dynamic Attributes for {categories.find(c => c.id === selectedCategoryId)?.name}
                            </span>
                            <span className="text-[10px] text-[#666B62]">Auto-rendered from category EAV schema</span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {categories.find(c => c.id === selectedCategoryId)?.attributes.map(attr => (
                              <div key={attr.id}>
                                <label className="block text-[11px] text-[#666B62] mb-1">
                                  {attr.name} {attr.isMandatory && <span className="text-red-500">*</span>}
                                </label>
                                {attr.options ? (
                                  <select
                                    value={dynamicAttrValues[attr.key] || attr.options[0]}
                                    onChange={(e) => setDynamicAttrValues({ ...dynamicAttrValues, [attr.key]: e.target.value })}
                                    className="w-full px-2.5 py-1.5 text-xs rounded border border-[#E4E1D6] bg-[#F7F5EF]"
                                  >
                                    {attr.options.map(opt => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type={attr.type === 'number' ? 'number' : 'text'}
                                    value={dynamicAttrValues[attr.key] || ''}
                                    onChange={(e) => setDynamicAttrValues({ ...dynamicAttrValues, [attr.key]: e.target.value })}
                                    className="w-full px-2.5 py-1.5 text-xs rounded border border-[#E4E1D6] bg-[#F7F5EF]"
                                    placeholder={`Enter ${attr.name}`}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* SEO Fields (REQ-PRD-007) */}
                        <div className="p-4 bg-white rounded-lg border border-[#E4E1D6] space-y-2">
                          <span className="text-xs font-semibold text-[#20241F] block">SEO Fields (REQ-PRD-007)</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <input
                              type="text"
                              placeholder="Meta Title"
                              value={newProductSeoTitle}
                              onChange={(e) => setNewProductSeoTitle(e.target.value)}
                              className="px-2.5 py-1.5 border border-[#E4E1D6] rounded bg-[#F7F5EF]"
                            />
                            <input
                              type="text"
                              placeholder="URL Slug (e.g. thinkpad-x1-gen11)"
                              value={newProductUrlSlug}
                              onChange={(e) => setNewProductUrlSlug(e.target.value)}
                              className="px-2.5 py-1.5 border border-[#E4E1D6] rounded bg-[#F7F5EF]"
                            />
                          </div>
                          <input
                            type="text"
                            placeholder="Meta Description"
                            value={newProductSeoDesc}
                            onChange={(e) => setNewProductSeoDesc(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-[#E4E1D6] rounded bg-[#F7F5EF] text-xs"
                          />
                        </div>
                      </div>

                      {/* Right Column: Pricing, Inventory & Variants */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-[#666B62] mb-1">MRP ($)</label>
                            <input
                              type="number"
                              value={newProductMrp}
                              onChange={(e) => setNewProductMrp(Number(e.target.value))}
                              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E4E1D6] bg-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[#666B62] mb-1">Selling Price ($)</label>
                            <input
                              type="number"
                              value={newProductPrice}
                              onChange={(e) => setNewProductPrice(Number(e.target.value))}
                              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E4E1D6] bg-white font-mono font-bold text-[#0F5257]"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-[#666B62] mb-1">Master SKU</label>
                            <input
                              type="text"
                              value={newProductSku}
                              onChange={(e) => setNewProductSku(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E4E1D6] bg-white font-mono"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[#666B62] mb-1">Initial Total Stock</label>
                            <input
                              type="number"
                              value={newProductStock}
                              onChange={(e) => setNewProductStock(Number(e.target.value))}
                              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E4E1D6] bg-white font-mono"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-[#666B62] mb-1">Tax Class</label>
                            <select
                              value={newProductTaxClass}
                              onChange={(e) => setNewProductTaxClass(e.target.value as any)}
                              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E4E1D6] bg-white"
                            >
                              <option value="Standard (18% GST)">Standard (18% GST)</option>
                              <option value="Reduced (12%)">Reduced (12%)</option>
                              <option value="Zero Rated (0%)">Zero Rated (0%)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[#666B62] mb-1">Primary Image URL</label>
                            <input
                              type="text"
                              value={newProductImage}
                              onChange={(e) => setNewProductImage(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E4E1D6] bg-white text-[11px]"
                            />
                          </div>
                        </div>

                        {/* Configurable Variants Builder (REQ-PRD-002) */}
                        <div className="p-4 bg-white rounded-lg border border-[#E4E1D6] space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-xs font-semibold text-[#20241F] cursor-pointer">
                              <input
                                type="checkbox"
                                checked={hasVariants}
                                onChange={(e) => setHasVariants(e.target.checked)}
                                className="rounded text-[#0F5257] focus:ring-[#0F5257]"
                              />
                              <span>Configurable Product with Variants (REQ-PRD-002)</span>
                            </label>
                            <span className="text-[10px] text-[#666B62]">RAM / Storage / Size</span>
                          </div>

                          {hasVariants && (
                            <div className="space-y-3 pt-2 border-t border-[#E4E1D6]">
                              <div className="space-y-2">
                                {variantsList.map((v, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-xs bg-[#FAF8F3] p-2 rounded border border-[#E4E1D6]">
                                    <div>
                                      <strong className="text-[#20241F]">{v.title}</strong>
                                      <span className="text-[#666B62] font-mono ml-2">SKU: {v.sku} · ${v.price} · Stock: {v.stock}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setVariantsList(variantsList.filter((_, i) => i !== idx))}
                                      className="text-red-500 hover:text-red-700 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>

                              <div className="grid grid-cols-3 gap-2">
                                <input
                                  type="text"
                                  placeholder="Variant Title (e.g. 64GB / 2TB)"
                                  value={newVariantTitle}
                                  onChange={(e) => setNewVariantTitle(e.target.value)}
                                  className="px-2 py-1.5 text-xs rounded border border-[#E4E1D6]"
                                />
                                <input
                                  type="number"
                                  placeholder="Price ($)"
                                  value={newVariantPrice}
                                  onChange={(e) => setNewVariantPrice(Number(e.target.value))}
                                  className="px-2 py-1.5 text-xs rounded border border-[#E4E1D6]"
                                />
                                <div className="flex gap-1">
                                  <input
                                    type="number"
                                    placeholder="Stock"
                                    value={newVariantStock}
                                    onChange={(e) => setNewVariantStock(Number(e.target.value))}
                                    className="w-16 px-2 py-1.5 text-xs rounded border border-[#E4E1D6]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!newVariantTitle) return;
                                      setVariantsList([...variantsList, {
                                        title: newVariantTitle,
                                        sku: `${newProductSku}-${newVariantTitle.replace(/[^a-zA-Z0-9]/g, '')}`,
                                        price: newVariantPrice,
                                        stock: newVariantStock
                                      }]);
                                      setNewVariantTitle('');
                                    }}
                                    className="px-2 py-1.5 bg-[#0F5257] text-white text-xs rounded font-semibold"
                                  >
                                    Add
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end gap-3 pt-3">
                          <button
                            type="button"
                            onClick={() => setIsAddingProduct(false)}
                            className="px-4 py-2 text-xs font-medium text-[#666B62] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-6 py-2 bg-[#0F5257] hover:bg-[#0B3D3F] text-white rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
                          >
                            Publish Product to Storefront
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                )}

                {/* Search Bar for Catalog */}
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-3.5 h-3.5 text-[#666B62] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by title, SKU, or category..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E4E1D6] bg-[#F7F5EF] focus:bg-white"
                    />
                  </div>
                  <span className="text-xs text-[#666B62]">Showing {filteredProducts.length} items</span>
                </div>

                {/* Product Catalog Table with Clone, Restock, Status Controls */}
                <div className="overflow-x-auto border border-[#E4E1D6] rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#FAF8F3] border-b border-[#E4E1D6] text-[#666B62]">
                      <tr>
                        <th className="p-3.5 font-medium">Product</th>
                        <th className="p-3.5 font-medium">Category</th>
                        <th className="p-3.5 font-medium">SKU</th>
                        <th className="p-3.5 font-medium">Price</th>
                        <th className="p-3.5 font-medium">Stock &amp; Location</th>
                        <th className="p-3.5 font-medium">Status</th>
                        <th className="p-3.5 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E1D6] bg-white">
                      {filteredProducts.map(p => (
                        <tr key={p.id} className="hover:bg-[#FAF8F3]/50">
                          <td className="p-3.5 flex items-center gap-3">
                            <img src={p.images[0]} alt={p.name} className="w-10 h-10 object-cover rounded bg-[#F7F5EF] border border-[#E4E1D6]" referrerPolicy="no-referrer" />
                            <div>
                              <strong className="text-[#20241F] block">{p.name}</strong>
                              <span className="text-[11px] text-[#666B62]">★ {p.rating} ({p.reviewCount} reviews) · {p.variants?.length || 0} variants</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-[#666B62]">{p.categoryName}</td>
                          <td className="p-3.5 font-mono text-[#666B62]">{p.sku}</td>
                          <td className="p-3.5 font-mono font-semibold text-[#0F5257]">${p.price.toFixed(2)}</td>
                          <td className="p-3.5 font-mono">
                            <div className="flex items-center gap-2">
                              <span className={p.stock <= 10 ? 'text-amber-700 font-bold' : ''}>
                                {p.stock} units
                              </span>
                              {p.stock <= 10 && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                                  Low
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#666B62] block">Central Hub / North</span>
                          </td>
                          <td className="p-3.5">
                            <select
                              value={p.status}
                              onChange={(e) => db.updateProductStatus(p.id, e.target.value as any)}
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                                p.status === 'Published' ? 'bg-[#EAF1F0] text-[#0F5257] border-[#0F5257]/30' :
                                p.status === 'Draft' ? 'bg-neutral-100 text-neutral-700 border-neutral-300' :
                                p.status === 'Out of Stock' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                'bg-red-100 text-red-800 border-red-300'
                              }`}
                            >
                              <option value="Published">Published</option>
                              <option value="Draft">Draft</option>
                              <option value="Out of Stock">Out of Stock</option>
                              <option value="Discontinued">Discontinued</option>
                            </select>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Restock Button (REQ-INV-002) */}
                              <button
                                onClick={() => {
                                  setRestockModalItem(p);
                                  setRestockQty(25);
                                }}
                                className="p-1.5 rounded hover:bg-[#F7F5EF] text-[#0F5257] cursor-pointer"
                                title="Restock inventory (REQ-INV-002)"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>

                              {/* Clone Product Button (REQ-PRD-001) */}
                              <button
                                onClick={() => db.cloneProduct(p.id)}
                                className="p-1.5 rounded hover:bg-[#F7F5EF] text-[#666B62] hover:text-[#20241F] cursor-pointer"
                                title="Clone Product (REQ-PRD-001)"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Product Button (REQ-PRD-001) */}
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete ${p.name}?`)) {
                                    db.deleteProduct(p.id);
                                  }
                                }}
                                className="p-1.5 rounded hover:bg-red-50 text-red-600 cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CATEGORIES & ATTRIBUTES MANAGEMENT (BRD/SRS REQ-CAT-001..004) */}
          {activeNav === 'categories' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 border border-[#E4E1D6] shadow-xs space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E1D6] pb-4">
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-[#20241F]">
                      Category &amp; Custom Attribute Architecture (REQ-CAT-001..004)
                    </h3>
                    <p className="text-xs text-[#666B62]">
                      Create unlimited categories &amp; subcategories. Attach custom dynamic attributes (text, number, dropdown, multi-select, checkbox, date, image) marked as mandatory/optional and filterable.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddingCategory(!isAddingCategory)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#0F5257] hover:bg-[#0B3D3F] text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#D9A441]" />
                    <span>{isAddingCategory ? 'Close Form' : '+ Add New Category'}</span>
                  </button>
                </div>

                {/* Add Category Form (REQ-CAT-001) */}
                {isAddingCategory && (
                  <form onSubmit={handleCreateCategory} className="p-5 bg-[#FAF8F3] rounded-xl border border-[#E4E1D6] space-y-4 animate-in fade-in duration-200">
                    <h4 className="font-serif text-sm font-bold text-[#20241F]">Create Category &amp; Subcategories</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[#666B62] mb-1">Category Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Server Storage &amp; SAN"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded border border-[#E4E1D6] bg-white font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#666B62] mb-1">Description</label>
                        <input
                          type="text"
                          placeholder="e.g. SAS/SATA SAN storage arrays and enclosures"
                          value={newCatDesc}
                          onChange={(e) => setNewCatDesc(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded border border-[#E4E1D6] bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#666B62] mb-1">Subcategories (comma-separated)</label>
                        <input
                          type="text"
                          placeholder="e.g. Rackmount SAN, All-Flash Arrays, JBOD"
                          value={newCatSubcategories}
                          onChange={(e) => setNewCatSubcategories(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded border border-[#E4E1D6] bg-white"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingCategory(false)}
                        className="px-3 py-1.5 text-xs font-medium text-[#666B62]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-[#0F5257] text-white text-xs font-semibold rounded"
                      >
                        Save Category
                      </button>
                    </div>
                  </form>
                )}

                {/* Add Custom Attribute Builder Section (REQ-CAT-002 & REQ-CAT-003) */}
                <div className="p-5 bg-[#FAF8F3] rounded-xl border border-[#E4E1D6] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E4E1D6] pb-2">
                    <div>
                      <h4 className="font-serif text-sm font-bold text-[#20241F]">
                        Add Custom Dynamic Attribute (EAV Builder)
                      </h4>
                      <p className="text-[11px] text-[#666B62]">
                        Attributes dynamically configure product entry forms and public storefront filters.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleAddAttribute} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
                    <div>
                      <label className="block text-[11px] text-[#666B62] mb-1">Target Category</label>
                      <select
                        value={selectedCatForAttr}
                        onChange={(e) => setSelectedCatForAttr(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-[#E4E1D6] bg-white"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#666B62] mb-1">Attribute Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Form Factor / Screen Size"
                        value={newAttrName}
                        onChange={(e) => setNewAttrName(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-[#E4E1D6] bg-white font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#666B62] mb-1">Data Type (REQ-CAT-002)</label>
                      <select
                        value={newAttrType}
                        onChange={(e) => setNewAttrType(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-[#E4E1D6] bg-white"
                      >
                        <option value="dropdown">Dropdown (Select)</option>
                        <option value="text">Text Field</option>
                        <option value="number">Numeric</option>
                        <option value="multi-select">Multi-Select</option>
                        <option value="checkbox">Boolean Checkbox</option>
                        <option value="date">Date</option>
                        <option value="image">Image Spec</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#666B62] mb-1">Options (comma-separated)</label>
                      <input
                        type="text"
                        placeholder="14 inch, 15.6 inch, 16 inch"
                        value={newAttrOptions}
                        onChange={(e) => setNewAttrOptions(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-[#E4E1D6] bg-white"
                        disabled={newAttrType !== 'dropdown' && newAttrType !== 'multi-select'}
                      />
                    </div>

                    <div className="flex items-center gap-3 py-2">
                      <label className="flex items-center gap-1 text-[11px] text-[#666B62] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newAttrMandatory}
                          onChange={(e) => setNewAttrMandatory(e.target.checked)}
                          className="rounded text-[#0F5257]"
                        />
                        <span>Mandatory</span>
                      </label>

                      <label className="flex items-center gap-1 text-[11px] text-[#666B62] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newAttrFilterable}
                          onChange={(e) => setNewAttrFilterable(e.target.checked)}
                          className="rounded text-[#0F5257]"
                        />
                        <span>Filterable</span>
                      </label>
                    </div>

                    <div>
                      <button
                        type="submit"
                        className="w-full py-1.5 bg-[#0F5257] hover:bg-[#0B3D3F] text-white text-xs font-semibold rounded cursor-pointer"
                      >
                        + Add Attribute
                      </button>
                    </div>
                  </form>
                </div>

                {/* Categories & Attributes Inspection Accordion */}
                <div className="space-y-4">
                  <h4 className="font-serif text-sm font-bold text-[#20241F]">Registered Category Schemas</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {categories.map(cat => (
                      <div key={cat.id} className="bg-white rounded-xl border border-[#E4E1D6] p-5 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-[#E4E1D6] pb-3">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-[#EAF1F0] text-[#0F5257] font-bold flex items-center justify-center text-xs">
                              {cat.name.substring(0, 2).toUpperCase()}
                            </span>
                            <div>
                              <strong className="text-sm text-[#20241F] font-serif block">{cat.name}</strong>
                              <span className="text-xs text-[#666B62] font-mono">{cat.slug} · {cat.productCount} products</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => db.toggleCategoryActive(cat.id)}
                              className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                                cat.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                              }`}
                            >
                              {cat.isActive ? 'Active' : 'Deactivated'}
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Remove category ${cat.name}?`)) db.deleteCategory(cat.id);
                              }}
                              className="p-1 rounded text-red-500 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Subcategories */}
                        {cat.subcategories && cat.subcategories.length > 0 && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-[#666B62] font-semibold">Subcategories:</span>
                            {cat.subcategories.map(s => (
                              <span key={s.id} className="px-2 py-0.5 rounded bg-[#F7F5EF] border border-[#E4E1D6] text-[#20241F]">
                                {s.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Attributes Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-[#FAF8F3] text-[#666B62] border-b border-[#E4E1D6]">
                              <tr>
                                <th className="p-2 font-medium">Attribute Name</th>
                                <th className="p-2 font-medium">Key</th>
                                <th className="p-2 font-medium">Data Type</th>
                                <th className="p-2 font-medium">Configured Options</th>
                                <th className="p-2 font-medium">Flags</th>
                                <th className="p-2 font-medium text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E4E1D6]">
                              {cat.attributes.map(att => (
                                <tr key={att.id} className="hover:bg-[#FAF8F3]/50">
                                  <td className="p-2 font-semibold text-[#20241F]">{att.name}</td>
                                  <td className="p-2 font-mono text-[#666B62]">{att.key}</td>
                                  <td className="p-2 capitalize">{att.type}</td>
                                  <td className="p-2 text-[#666B62]">{att.options?.join(', ') || '—'}</td>
                                  <td className="p-2">
                                    <span className="flex items-center gap-1.5">
                                      {att.isMandatory && <span className="px-1.5 py-0.2 bg-red-100 text-red-700 rounded text-[10px] font-semibold">Required</span>}
                                      {att.isFilterable && <span className="px-1.5 py-0.2 bg-[#EAF1F0] text-[#0F5257] rounded text-[10px] font-semibold">Filterable</span>}
                                    </span>
                                  </td>
                                  <td className="p-2 text-right">
                                    <button
                                      onClick={() => db.deleteCategoryAttribute(cat.id, att.id)}
                                      className="text-red-500 hover:text-red-700 p-1"
                                      title="Delete Attribute"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ORDERS & FULFILLMENT (BRD/SRS REQ-ORD-001..004) */}
          {activeNav === 'orders' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 border border-[#E4E1D6] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4E1D6] pb-4">
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-[#20241F]">Customer Orders &amp; Fulfillment</h3>
                    <p className="text-xs text-[#666B62]">Manage order transitions: Processing &rarr; Shipped &rarr; Delivered &rarr; Refunded / Cancelled (Stock auto-restores on cancel)</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search order or customer..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-[#E4E1D6] bg-[#F7F5EF] w-48"
                    />
                  </div>
                </div>

                {/* Filter Chips */}
                <div className="flex gap-2">
                  {(['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setOrderFilter(tab)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                        orderFilter === tab ? 'bg-[#0F5257] text-white' : 'bg-[#F7F5EF] text-[#666B62] hover:text-black'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Orders Table */}
                <div className="overflow-x-auto border border-[#E4E1D6] rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#FAF8F3] border-b border-[#E4E1D6] text-[#666B62]">
                      <tr>
                        <th className="p-3.5 font-medium">Order</th>
                        <th className="p-3.5 font-medium">Customer</th>
                        <th className="p-3.5 font-medium">Date</th>
                        <th className="p-3.5 font-medium">Items</th>
                        <th className="p-3.5 font-medium">Total</th>
                        <th className="p-3.5 font-medium">Payment</th>
                        <th className="p-3.5 font-medium">Status</th>
                        <th className="p-3.5 font-medium text-right">Fulfillment Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E1D6] bg-white">
                      {filteredOrders.map(o => (
                        <tr key={o.id} className="hover:bg-[#FAF8F3]/50">
                          <td className="p-3.5 font-mono font-semibold text-[#0F5257]">
                            {o.orderNumber}
                            {o.trackingNumber && <span className="block text-[10px] text-[#666B62] font-mono">{o.trackingNumber}</span>}
                          </td>
                          <td className="p-3.5">
                            <strong className="text-[#20241F] block">{o.customerName}</strong>
                            <span className="text-[11px] text-[#666B62]">{o.customerEmail}</span>
                          </td>
                          <td className="p-3.5 text-[#666B62]">{o.date}</td>
                          <td className="p-3.5 font-mono">{o.items.length} item(s)</td>
                          <td className="p-3.5 font-mono font-semibold">${o.total.toFixed(2)}</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              o.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                              o.paymentStatus === 'Refunded' ? 'bg-purple-100 text-purple-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {o.paymentMethod} ({o.paymentStatus})
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                              o.orderStatus === 'Shipped' ? 'bg-[#EAF1F0] text-[#0F5257]' :
                              o.orderStatus === 'Delivered' ? 'bg-emerald-50 text-emerald-800' :
                              o.orderStatus === 'Processing' ? 'bg-amber-50 text-amber-800' :
                              'bg-red-50 text-red-800'
                            }`}>
                              {o.orderStatus}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {o.orderStatus === 'Processing' && (
                                <button
                                  onClick={() => db.updateOrderStatus(o.id, 'Shipped')}
                                  className="px-2.5 py-1 bg-[#0F5257] hover:bg-[#0B3D3F] text-white text-[11px] font-semibold rounded cursor-pointer"
                                >
                                  Ship
                                </button>
                              )}
                              {o.orderStatus === 'Shipped' && (
                                <button
                                  onClick={() => db.updateOrderStatus(o.id, 'Delivered')}
                                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold rounded cursor-pointer"
                                >
                                  Deliver
                                </button>
                              )}
                              {o.orderStatus !== 'Cancelled' && (
                                <button
                                  onClick={() => {
                                    setRefundModalOrder(o);
                                    setRefundAmount(o.total);
                                  }}
                                  className="px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 text-[11px] font-semibold rounded cursor-pointer"
                                  title="Process Refund (REQ-ORD-003)"
                                >
                                  Refund
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: REVIEWS MODERATION (BRD/SRS REQ-REV-001 & REQ-REV-002) */}
          {activeNav === 'reviews' && (
            <div className="bg-white rounded-xl p-6 border border-[#E4E1D6] shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4E1D6] pb-4">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#20241F]">Customer Reviews &amp; Moderation (REQ-REV-001/002)</h3>
                  <p className="text-xs text-[#666B62]">Admin moderates ratings and written reviews before public storefront display.</p>
                </div>

                <div className="flex gap-2">
                  {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setReviewFilter(tab)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                        reviewFilter === tab ? 'bg-[#0F5257] text-white' : 'bg-[#F7F5EF] text-[#666B62] hover:text-black'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredReviews.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#666B62]">No reviews matching filter.</div>
                ) : (
                  filteredReviews.map(r => (
                    <div key={r.id} className="p-4 rounded-xl border border-[#E4E1D6] bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <strong className="text-xs text-[#20241F]">{r.customerName}</strong>
                          {r.verifiedPurchase && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              ✓ Verified Purchase
                            </span>
                          )}
                          <span className="text-[11px] text-[#666B62]">on <span className="font-medium text-[#0F5257]">{r.productName}</span></span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-500 text-xs">{'★'.repeat(r.rating)}</span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            r.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                            r.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {r.status}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-[#20241F] bg-[#FAF8F3] p-3 rounded-lg border border-[#E4E1D6]/60">
                        &ldquo;{r.comment}&rdquo;
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-[#666B62] pt-1">
                        <span>Submitted on {r.date}</span>
                        <div className="flex gap-2">
                          {r.status !== 'Approved' && (
                            <button
                              onClick={() => db.moderateReview(r.id, 'Approved')}
                              className="px-3 py-1 bg-emerald-700 text-white rounded font-semibold cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                          {r.status !== 'Rejected' && (
                            <button
                              onClick={() => db.moderateReview(r.id, 'Rejected')}
                              className="px-3 py-1 bg-red-600 text-white rounded font-semibold cursor-pointer"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: AUDIT LOGS & STAFF RBAC (REQ-ADM-001 & REQ-ADM-002) */}
          {activeNav === 'audit_logs' && (
            <div className="space-y-6">
              {/* Staff Directory & Role Matrix */}
              <div className="bg-white rounded-xl p-6 border border-[#E4E1D6] shadow-xs space-y-4">
                <div className="border-b border-[#E4E1D6] pb-3">
                  <h3 className="font-serif text-lg font-semibold text-[#20241F]">Role-Based Access Control (RBAC) (REQ-ADM-001)</h3>
                  <p className="text-xs text-[#666B62]">Configured staff roles with assigned operational permissions.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {staff.map(s => (
                    <div
                      key={s.id}
                      onClick={() => db.setCurrentStaff(s.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        currentStaff.id === s.id ? 'border-[#0F5257] bg-[#EAF1F0]/50 shadow-xs' : 'border-[#E4E1D6] bg-white hover:border-[#0F5257]/40'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <strong className="text-xs font-bold text-[#20241F]">{s.name}</strong>
                        {currentStaff.id === s.id && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-[#0F5257] block">{s.role}</span>
                      <span className="text-[10px] text-[#666B62] block mb-2">{s.email}</span>
                      <div className="flex flex-wrap gap-1">
                        {s.permissions.slice(0, 3).map(p => (
                          <span key={p} className="text-[9px] bg-white px-1.5 py-0.5 rounded border border-[#E4E1D6]">
                            {p.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Immutable Audit Log Table (REQ-ADM-002) */}
              <div className="bg-white rounded-xl p-6 border border-[#E4E1D6] shadow-xs space-y-4">
                <div className="border-b border-[#E4E1D6] pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-[#20241F]">Immutable Admin Audit Logs (REQ-ADM-002)</h3>
                    <p className="text-xs text-[#666B62]">Complete chronological trace of catalog updates, status transitions, refunds, and brand versions.</p>
                  </div>
                  <span className="text-xs font-mono text-[#666B62]">{auditLogs.length} events logged</span>
                </div>

                <div className="overflow-x-auto border border-[#E4E1D6] rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#FAF8F3] border-b border-[#E4E1D6] text-[#666B62]">
                      <tr>
                        <th className="p-3 font-medium">Timestamp</th>
                        <th className="p-3 font-medium">Module</th>
                        <th className="p-3 font-medium">Action</th>
                        <th className="p-3 font-medium">Staff User</th>
                        <th className="p-3 font-medium">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E1D6]">
                      {auditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-[#FAF8F3]/50">
                          <td className="p-3 font-mono text-[11px] text-[#666B62] whitespace-nowrap">{log.timestamp}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-[#EAF1F0] text-[#0F5257] rounded text-[10px] font-bold">
                              {log.module}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] font-semibold text-[#20241F]">{log.action}</td>
                          <td className="p-3 text-[11px]">
                            <strong className="block text-[#20241F]">{log.performedBy}</strong>
                            <span className="text-[10px] text-[#666B62]">{log.role}</span>
                          </td>
                          <td className="p-3 text-xs text-[#20241F]">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CUSTOMERS */}
          {activeNav === 'customers' && (
            <div className="bg-white rounded-xl p-6 border border-[#E4E1D6] shadow-xs space-y-4">
              <h3 className="font-serif text-lg font-semibold text-[#20241F]">Customer Directory</h3>
              <div className="overflow-x-auto border border-[#E4E1D6] rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#FAF8F3] border-b border-[#E4E1D6] text-[#666B62]">
                    <tr>
                      <th className="p-3.5 font-medium">Customer</th>
                      <th className="p-3.5 font-medium">Email</th>
                      <th className="p-3.5 font-medium">Orders</th>
                      <th className="p-3.5 font-medium">Total Spent</th>
                      <th className="p-3.5 font-medium">Joined</th>
                      <th className="p-3.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E1D6] bg-white">
                    {customers.map(c => (
                      <tr key={c.id}>
                        <td className="p-3.5 font-semibold text-[#20241F] flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#D9A441] text-[#26210F] text-[10px] flex items-center justify-center font-bold">
                            {c.name.substring(0, 1)}
                          </span>
                          {c.name}
                        </td>
                        <td className="p-3.5 text-[#666B62]">{c.email}</td>
                        <td className="p-3.5 font-mono">{c.ordersCount}</td>
                        <td className="p-3.5 font-mono font-semibold">${c.totalSpent.toFixed(2)}</td>
                        <td className="p-3.5 text-[#666B62]">{c.joinedDate}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#EAF1F0] text-[#0F5257]">
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: MARKETING & CONTENT (REQ-PRM-001..003) */}
          {activeNav === 'marketing' && (
            <div className="space-y-6">
              {/* Coupons Section */}
              <div className="bg-white rounded-xl p-6 border border-[#E4E1D6] shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E4E1D6] pb-3">
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-[#20241F]">Promotions &amp; Coupons (REQ-PRM-001)</h3>
                    <p className="text-xs text-[#666B62]">Create percentage or flat discount coupon codes with usage limits.</p>
                  </div>
                  <button
                    onClick={() => setIsAddingCoupon(!isAddingCoupon)}
                    className="px-3 py-1.5 bg-[#0F5257] text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    + Add Coupon
                  </button>
                </div>

                {isAddingCoupon && (
                  <form onSubmit={handleCreateCoupon} className="p-4 bg-[#FAF8F3] rounded-lg border border-[#E4E1D6] grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                    <div>
                      <label className="block text-[11px] text-[#666B62] mb-1">Coupon Code</label>
                      <input
                        type="text"
                        value={newCouponCode}
                        onChange={(e) => setNewCouponCode(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-[#E4E1D6] bg-white font-mono font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#666B62] mb-1">Discount Type</label>
                      <select
                        value={newCouponType}
                        onChange={(e) => setNewCouponType(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-[#E4E1D6] bg-white"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="flat">Flat ($)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#666B62] mb-1">Discount Value</label>
                      <input
                        type="number"
                        value={newCouponVal}
                        onChange={(e) => setNewCouponVal(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-[#E4E1D6] bg-white font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#666B62] mb-1">Max Redemptions</label>
                      <input
                        type="number"
                        value={newCouponLimit}
                        onChange={(e) => setNewCouponLimit(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-[#E4E1D6] bg-white font-mono"
                        required
                      />
                    </div>
                    <div>
                      <button type="submit" className="w-full py-1.5 bg-[#0F5257] text-white text-xs font-semibold rounded cursor-pointer">
                        Create
                      </button>
                    </div>
                  </form>
                )}

                <div className="overflow-x-auto border border-[#E4E1D6] rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#FAF8F3] border-b border-[#E4E1D6] text-[#666B62]">
                      <tr>
                        <th className="p-3.5 font-medium">Coupon Code</th>
                        <th className="p-3.5 font-medium">Discount</th>
                        <th className="p-3.5 font-medium">Usage</th>
                        <th className="p-3.5 font-medium">Valid Till</th>
                        <th className="p-3.5 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E1D6] bg-white">
                      {coupons.map(cpn => (
                        <tr key={cpn.id}>
                          <td className="p-3.5 font-mono font-bold text-[#0F5257]">{cpn.code}</td>
                          <td className="p-3.5">{cpn.discountType === 'percentage' ? `${cpn.value}% off` : `$${cpn.value} off`}</td>
                          <td className="p-3.5 font-mono">{cpn.usedCount} / {cpn.usageLimit}</td>
                          <td className="p-3.5 text-[#666B62]">{cpn.validTill}</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              cpn.status === 'Active' ? 'bg-[#EAF1F0] text-[#0F5257]' : 'bg-neutral-100 text-neutral-600'
                            }`}>
                              {cpn.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Homepage Banners (REQ-PRM-002) */}
              <div className="bg-white rounded-xl p-6 border border-[#E4E1D6] shadow-xs space-y-4">
                <h3 className="font-serif text-lg font-semibold text-[#20241F]">Storefront Banners (REQ-PRM-002)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {banners.map(b => (
                    <div key={b.id} className="p-4 rounded-xl border border-[#E4E1D6] bg-[#FAF8F3] space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#D9A441]">{b.badge}</span>
                        <button
                          onClick={() => db.toggleBanner(b.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            b.active ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'
                          }`}
                        >
                          {b.active ? 'Active' : 'Disabled'}
                        </button>
                      </div>
                      <strong className="text-sm font-serif text-[#20241F] block">{b.title}</strong>
                      <p className="text-xs text-[#666B62] line-clamp-2">{b.subtitle}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Static Content Pages (REQ-PRM-003) */}
              <div className="bg-white rounded-xl p-6 border border-[#E4E1D6] shadow-xs space-y-4">
                <h3 className="font-serif text-lg font-semibold text-[#20241F]">Static Pages &amp; SOP Policies (REQ-PRM-003)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {staticPages.map(pg => (
                    <div key={pg.id} className="p-4 rounded-xl border border-[#E4E1D6] bg-[#FAF8F3] space-y-2">
                      <strong className="text-sm font-serif text-[#20241F] block">{pg.title}</strong>
                      <p className="text-xs text-[#666B62] line-clamp-3 font-mono">{pg.content}</p>
                      <span className="text-[10px] text-[#666B62] block">Updated: {pg.lastUpdated}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: REPORTS */}
          {activeNav === 'reports' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 border border-[#E4E1D6] shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-[#E4E1D6] pb-4">
                  <h3 className="font-serif text-lg font-semibold text-[#20241F]">Reports &amp; Analytics (REQ-RPT-001..003)</h3>
                  <span className="text-xs text-[#666B62] bg-[#F7F5EF] px-3 py-1.5 rounded-lg border border-[#E4E1D6]">
                    Period: Last 30 Days
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-[#FAF8F3] rounded-lg border border-[#E4E1D6]">
                    <span className="text-xs text-[#666B62] block">Best-Selling Category</span>
                    <strong className="font-serif text-base text-[#0B3D3F] block mt-1">Enterprise IT &amp; Laptops</strong>
                  </div>
                  <div className="p-4 bg-[#FAF8F3] rounded-lg border border-[#E4E1D6]">
                    <span className="text-xs text-[#666B62] block">Top Performer SKU</span>
                    <strong className="font-serif text-base text-[#0B3D3F] block mt-1">ThinkPad X1 ($18,678)</strong>
                  </div>
                  <div className="p-4 bg-[#FAF8F3] rounded-lg border border-[#E4E1D6]">
                    <span className="text-xs text-[#666B62] block">Low-Stock Alert</span>
                    <strong className="font-serif text-base text-amber-700 block mt-1">{lowStockProducts.length} items warning</strong>
                  </div>
                  <div className="p-4 bg-[#FAF8F3] rounded-lg border border-[#E4E1D6]">
                    <span className="text-xs text-[#666B62] block">Cart Abandonment Rate</span>
                    <strong className="font-serif text-base text-[#20241F] block mt-1">14.2%</strong>
                  </div>
                </div>

                <div className="p-5 bg-[#FAF8F3] rounded-xl border border-[#E4E1D6] space-y-3">
                  <h4 className="font-serif text-sm font-bold text-[#20241F]">Revenue by Category Segment</h4>
                  <div className="space-y-2">
                    {[
                      { name: 'Enterprise IT & Laptops', val: 62, color: '#48B065' },
                      { name: 'Networking & Infrastructure', val: 22, color: '#0F5257' },
                      { name: 'Home & Living', val: 10, color: '#0B3D3F' },
                      { name: 'Electronics & Accessories', val: 6, color: '#D9A441' }
                    ].map(bar => (
                      <div key={bar.name} className="space-y-1">
                        <div className="flex justify-between text-xs text-[#666B62]">
                          <span>{bar.name}</span>
                          <span className="font-mono font-semibold">{bar.val}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#E4E1D6] overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${bar.val}%`, backgroundColor: bar.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeNav === 'settings' && (
            <div className="bg-white rounded-xl p-6 border border-[#E4E1D6] shadow-xs space-y-6">
              <h3 className="font-serif text-lg font-semibold text-[#20241F]">Store &amp; System Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-serif text-sm font-bold text-[#20241F]">General Configuration</h4>
                  <div>
                    <label className="block text-xs text-[#666B62] mb-1">Company / Brand Name</label>
                    <input type="text" defaultValue={activeLogo.config.brandName} className="w-full p-2 text-xs rounded border border-[#E4E1D6] bg-[#F7F5EF] font-semibold" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#666B62] mb-1">Currency</label>
                    <input type="text" defaultValue="USD ($)" className="w-full p-2 text-xs rounded border border-[#E4E1D6] bg-[#F7F5EF]" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#666B62] mb-1">Primary Warehouse</label>
                    <input type="text" defaultValue="Central Logistics Hub - Bengaluru" className="w-full p-2 text-xs rounded border border-[#E4E1D6] bg-[#F7F5EF]" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-serif text-sm font-bold text-[#20241F]">Brand &amp; Technical Refresh</h4>
                  <div className="p-4 bg-[#FAF8F3] rounded-lg border border-[#E4E1D6] space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#666B62]">Active Logo Version:</span>
                      <strong className="font-mono text-[#0F5257]">{activeLogo.versionTag}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666B62]">Storefront Sync:</span>
                      <strong className="text-emerald-700">Enabled (Automatic)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666B62]">Checksum (SHA-256):</span>
                      <span className="font-mono text-[10px] text-[#666B62] truncate w-32">{activeLogo.checksum}</span>
                    </div>
                    <button
                      onClick={() => setActiveNav('logo_studio')}
                      className="w-full mt-2 py-2 bg-[#0F5257] text-white rounded font-semibold text-xs hover:bg-[#0B3D3F] cursor-pointer"
                    >
                      Open Logo Refresh Studio &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: Bulk CSV Import (REQ-PRD-004) */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#E4E1D6] space-y-4">
            <div className="flex justify-between items-center border-b border-[#E4E1D6] pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#0F5257]" />
                <h3 className="font-serif text-base font-bold text-[#20241F]">Bulk Import Products via CSV</h3>
              </div>
              <button onClick={() => setShowCsvModal(false)} className="p-1 text-[#666B62] hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#666B62]">
              Paste comma-separated product records with column headers: <code>id,name,sku,categoryId,categoryName,mrp,price,stock,status,description</code>
            </p>

            <textarea
              rows={8}
              value={csvInput}
              onChange={(e) => setCsvInput(e.target.value)}
              className="w-full p-3 font-mono text-xs rounded-lg border border-[#E4E1D6] bg-[#FAF8F3] focus:bg-white"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCsvModal(false)}
                className="px-4 py-2 text-xs text-[#666B62] font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRunCsvImport}
                className="px-5 py-2 bg-[#0F5257] hover:bg-[#0B3D3F] text-white text-xs font-semibold rounded-lg"
              >
                Import Batch into MySQL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Quick Restock with Multi-Warehouse (REQ-INV-002 & REQ-INV-003) */}
      {restockModalItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E4E1D6] space-y-4">
            <div className="flex justify-between items-center border-b border-[#E4E1D6] pb-3">
              <h3 className="font-serif text-base font-bold text-[#20241F]">Restock Inventory (REQ-INV-002)</h3>
              <button onClick={() => setRestockModalItem(null)} className="p-1 text-[#666B62] hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-1">
              <strong className="block text-[#20241F]">{restockModalItem.name}</strong>
              <span className="text-[#666B62]">Current Stock: <span className="font-mono font-bold text-[#0F5257]">{restockModalItem.stock}</span> units</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#666B62] mb-1">Additional Quantity to Add</label>
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded border border-[#E4E1D6] bg-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#666B62] mb-1">Warehouse Location (REQ-INV-003)</label>
                <select
                  value={restockLocation}
                  onChange={(e) => setRestockLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-[#E4E1D6] bg-white"
                >
                  <option value="Central Hub - BLR">Central Hub - Bengaluru (Primary)</option>
                  <option value="North Logistics - DEL">North Logistics - Gurgaon / NCR</option>
                  <option value="West Fulfillment - BOM">West Fulfillment - Mumbai</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setRestockModalItem(null)} className="px-4 py-2 text-xs text-[#666B62]">
                Cancel
              </button>
              <button
                onClick={handleConfirmRestock}
                className="px-5 py-2 bg-[#0F5257] text-white text-xs font-semibold rounded-lg"
              >
                Confirm Restock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Refund Order (REQ-ORD-003) */}
      {refundModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E4E1D6] space-y-4">
            <div className="flex justify-between items-center border-b border-[#E4E1D6] pb-3">
              <h3 className="font-serif text-base font-bold text-[#20241F]">Process Refund (REQ-ORD-003)</h3>
              <button onClick={() => setRefundModalOrder(null)} className="p-1 text-[#666B62] hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-1 bg-[#FAF8F3] p-3 rounded border border-[#E4E1D6]">
              <div className="flex justify-between">
                <span>Order Reference:</span>
                <strong className="font-mono text-[#0F5257]">{refundModalOrder.orderNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span>{refundModalOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid Total:</span>
                <span className="font-mono font-bold">${refundModalOrder.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#666B62] mb-1">Refund Amount ($)</label>
                <input
                  type="number"
                  max={refundModalOrder.total}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded border border-[#E4E1D6] bg-white font-mono font-bold text-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#666B62] mb-1">Reason for Refund</label>
                <textarea
                  rows={2}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-[#E4E1D6] bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setRefundModalOrder(null)} className="px-4 py-2 text-xs text-[#666B62]">
                Cancel
              </button>
              <button
                onClick={handleConfirmRefund}
                className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-lg"
              >
                Execute Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Automated Email & SMS Notifications Log (REQ-ORD-004) */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#E4E1D6] space-y-4">
            <div className="flex justify-between items-center border-b border-[#E4E1D6] pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#0F5257]" />
                <h3 className="font-serif text-base font-bold text-[#20241F]">Transactional Notifications Dispatch (REQ-ORD-004)</h3>
              </div>
              <button onClick={() => setShowNotificationsModal(false)} className="p-1 text-[#666B62] hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#666B62]">
              Automated notifications generated on order confirmation, shipment milestones, and refund events.
            </p>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {notifications.map(n => (
                <div key={n.id} className="p-3 bg-[#FAF8F3] rounded-lg border border-[#E4E1D6] text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#20241F] flex items-center gap-1.5">
                      {n.type === 'Email' ? <Mail className="w-3 h-3 text-[#0F5257]" /> : <Smartphone className="w-3 h-3 text-sky-600" />}
                      {n.type} &rarr; {n.recipient}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                      {n.status}
                    </span>
                  </div>
                  <strong className="block text-[11px] text-[#0F5257]">{n.subject}</strong>
                  <p className="text-[#666B62] text-[11px] leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-[#666B62] block opacity-70">{n.timestamp}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowNotificationsModal(false)}
                className="px-4 py-2 bg-[#0F5257] text-white text-xs font-semibold rounded-lg"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
