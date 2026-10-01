import React, { useEffect, useState } from 'react';
import { Product, Order, LogoConfig, StaticPage, ProductReview, CustomerAddress } from '../../types/logo';
import { db } from '../../services/mysqlMockDb';
import { confirmStripePayment, createCheckout, loadAccountProfile, loadCustomerOrders, saveAccountProfile } from '../../services/api';
import { registerWithEmail, signInWithEmail, signOut, observeAuthSession } from '../../services/auth';
import { updateAuthSessionUser, type AuthSession } from '../../services/authSession';
import logoImage from '../../assets/images/logo.png.png';
import {
  Search,
  Heart,
  User,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Check,
  Star,
  ChevronRight,
  X,
  Plus,
  Minus,
  Truck,
  CreditCard,
  Printer,
  Smartphone,
  Lock,
  Mail,
  HelpCircle,
  FileText,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface StorefrontProps {
  onOpenAdminPortal?: () => void;
}

export const Storefront: React.FC<StorefrontProps> = ({
  onOpenAdminPortal
}) => {
  // Screen flow matching visual design text file
  const [currentView, setCurrentView] = useState<'home' | 'product_detail' | 'checkout' | 'order_success'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product>(db.getProducts()[0]);
  
  // Dynamic products & categories from MySQL DB
  const [products] = useState<Product[]>(db.getProducts());
  const [categories] = useState(db.getCategories());
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedAttrFilters, setSelectedAttrFilters] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'rating'>('featured');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  // Wishlist state (REQ-CRT-002)
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState<boolean>(false);

  // Customer Account & Authentication state (REQ-USR-001..004)
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState<string>('');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerUser, setCustomerUser] = useState<AuthSession | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string>('');
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddressFormOpen, setIsAddressFormOpen] = useState<boolean>(false);
  const [isProfileSaving, setIsProfileSaving] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string>('');
  const [addressDraft, setAddressDraft] = useState({
    label: 'Home', firstName: '', lastName: '', address: '', city: '', pincode: '', phone: ''
  });

  useEffect(() => observeAuthSession(session => {
    setCustomerUser(session);
    setIsCustomerLoggedIn(Boolean(session));
    setCustomerName(session?.user.displayName || session?.user.email || '');
    setAuthEmail(session?.user.email ?? '');
    setSavedAddresses([]);
    setSelectedAddressId('');
    setWishlist([]);
    if (session) {
      void loadAccountProfile(session).then(profile => {
        updateAuthSessionUser(profile);
        setSavedAddresses(profile.savedAddresses ?? []);
        setWishlist(products.filter(product => profile.wishlist.includes(product.id)));
        setSelectedAddressId(profile.savedAddresses.find(address => address.isDefault)?.id ?? '');
      }).catch(error => {
        setProfileError(error instanceof Error ? error.message : 'Unable to load your saved profile.');
        void signOut();
      });
      void loadCustomerOrders(session).then(setCustomerOrders).catch(() => setCustomerOrders([]));
    } else {
      setCustomerOrders([]);
    }
  }), []);

  const persistCustomerProfile = async (addresses: CustomerAddress[], wishlistProducts: Product[] = wishlist): Promise<boolean> => {
    if (!customerUser) return false;
    setIsProfileSaving(true);
    setProfileError('');
    try {
      const savedProfile = await saveAccountProfile(customerUser, {
        savedAddresses: addresses,
        wishlist: wishlistProducts.map(product => product.id)
      });
      setSavedAddresses(savedProfile.savedAddresses);
      setWishlist(products.filter(product => savedProfile.wishlist.includes(product.id)));
      return true;
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Unable to save your profile.');
      return false;
    } finally {
      setIsProfileSaving(false);
    }
  };

  const toggleWishlist = (product: Product) => {
    if (!customerUser) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    const nextWishlist = wishlist.some(item => item.id === product.id)
      ? wishlist.filter(item => item.id !== product.id)
      : [...wishlist, product];
    void persistCustomerProfile(savedAddresses, nextWishlist);
  };

  const handleSaveAddress = async (event: React.FormEvent) => {
    event.preventDefault();
    const address: CustomerAddress = {
      ...addressDraft,
      id: crypto.randomUUID(),
      isDefault: savedAddresses.length === 0
    };
    if (await persistCustomerProfile([...savedAddresses, address])) {
      setSelectedAddressId(address.isDefault ? address.id : selectedAddressId);
      setAddressDraft({ label: 'Home', firstName: '', lastName: '', address: '', city: '', pincode: '', phone: '' });
      setIsAddressFormOpen(false);
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    const nextAddresses = savedAddresses.map(address => ({ ...address, isDefault: address.id === addressId }));
    if (await persistCustomerProfile(nextAddresses)) setSelectedAddressId(addressId);
  };

  const handleRemoveAddress = async (addressId: string) => {
    const nextAddresses = savedAddresses.filter(address => address.id !== addressId);
    if (nextAddresses.length && !nextAddresses.some(address => address.isDefault)) {
      nextAddresses[0] = { ...nextAddresses[0], isDefault: true };
    }
    if (await persistCustomerProfile(nextAddresses)) {
      setSelectedAddressId(nextAddresses.find(address => address.isDefault)?.id ?? '');
    }
  };

  // Static Content Pages Modal (REQ-PRM-003)
  const [showStaticModal, setShowStaticModal] = useState<boolean>(false);
  const [activeStaticPage, setActiveStaticPage] = useState<StaticPage | null>(db.getStaticPages()[0]);

  // Shipping Method at Checkout (REQ-CHK001)
  const [shippingMethod, setShippingMethod] = useState<'Standard Shipping (Free)' | 'Express Courier ($25)' | 'Same-Day Metro Dispatch ($40)'>('Standard Shipping (Free)');

  // PDP Review Submission state (REQ-REV-001)
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewAuthor, setReviewAuthor] = useState<string>('Asha Verma');
  const [reviewEmail, setReviewEmail] = useState<string>('asha.v@techrefresh.com');
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string>('');

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    db.addReview({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      customerName: reviewAuthor || 'Verified Customer',
      customerEmail: reviewEmail || 'asha.v@techrefresh.com',
      rating: reviewRating,
      comment: reviewComment.trim(),
      verifiedPurchase: true
    });
    setReviewSuccessMsg('Thank you! Your verified purchase review has been submitted and published.');
    setReviewComment('');
    setTimeout(() => setReviewSuccessMsg(''), 5000);
  };

  // Cart state
  const [cart, setCart] = useState<{ product: Product; quantity: number; selectedVariant?: string }[]>(() => {
    try {
      const savedItems = JSON.parse(localStorage.getItem('trs_cart_v1') ?? '[]');
      if (!Array.isArray(savedItems)) return [];
      return savedItems.reduce((items, savedItem) => {
        const product = db.getProducts().find(candidate => candidate.id === savedItem.productId);
        if (product && Number.isInteger(savedItem.quantity) && savedItem.quantity > 0) {
          items.push({ product, quantity: savedItem.quantity, selectedVariant: savedItem.selectedVariant });
        }
        return items;
      }, [] as { product: Product; quantity: number; selectedVariant?: string }[]);
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('trs_cart_v1', JSON.stringify(cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        selectedVariant: item.selectedVariant
      }))));
    } catch {
      setCheckoutError('Your cart could not be saved in this browser.');
    }
  }, [cart]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string>('');
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponInput, setCouponInput] = useState<string>('');

  // PDP Selection state
  const [pdpSelectedVariant, setPdpSelectedVariant] = useState<string>('');
  const [pdpSelectedFinish, setPdpSelectedFinish] = useState<string>('Natural Oak');
  const [pdpQuantity, setPdpQuantity] = useState<number>(1);
  const [pdpActiveImageIdx, setPdpActiveImageIdx] = useState<number>(0);

  // Order Tracking Modal State (SRS REQ-ORD-003)
  const [showOrderTracker, setShowOrderTracker] = useState<boolean>(false);
  const [trackedOrderNumber, setTrackedOrderNumber] = useState<string>('TRS-ORD-8829');

  // Checkout Form state
  const [checkoutData, setCheckoutData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    pincode: '',
    paymentMethod: 'Card' as 'Card' | 'Cash on Delivery'
  });
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const address = savedAddresses.find(item => item.id === selectedAddressId);
    if (!address) return;
    setCheckoutData(current => ({
      ...current,
      firstName: address.firstName,
      lastName: address.lastName,
      address: address.address,
      city: address.city,
      pincode: address.pincode
    }));
  }, [savedAddresses, selectedAddressId]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('checkout') === 'cancelled') {
      setCheckoutError('Payment was cancelled. Your cart is still available to try again.');
      setCurrentView('checkout');
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }
    const orderId = query.get('order');
    const sessionId = query.get('session');
    if (query.get('checkout') !== 'success' || !orderId || !sessionId) return;

    let isMounted = true;
    const unsubscribe = observeAuthSession(session => {
      if (!session || !isMounted) return;
      void confirmStripePayment(session, orderId, sessionId)
        .then(async order => {
          if (!isMounted) return;
          setCheckoutError('');
          setPlacedOrder(order);
          setTrackedOrderNumber(order.orderNumber);
          setCart([]);
          setCurrentView('order_success');
          setCustomerOrders(await loadCustomerOrders(session));
        })
        .catch(error => {
          if (isMounted) {
            setCheckoutError(error instanceof Error ? error.message : 'Payment could not be verified.');
            setCurrentView('checkout');
          }
        })
        .finally(() => window.history.replaceState({}, '', window.location.pathname));
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Shared storefront brand config
  const activeLogo = db.getActiveVersion();

  // Price calculations (REQ-CHK002)
  const getCartUnitPrice = (item: { product: Product; selectedVariant?: string }) =>
    item.selectedVariant
      ? item.product.variants.find(variant => variant.title === item.selectedVariant)?.price ?? item.product.price
      : item.product.price;
  const cartSubtotal = cart.reduce((sum, item) => sum + getCartUnitPrice(item) * item.quantity, 0);
  const cartShipping = shippingMethod === 'Standard Shipping (Free)'
    ? (cartSubtotal > 150 ? 0 : 12.0)
    : shippingMethod === 'Express Courier ($25)'
    ? 25.0
    : 40.0;
  const cartTax = Math.round(cartSubtotal * 0.18 * 100) / 100;
  const cartTotal = Math.max(0, cartSubtotal + cartShipping + cartTax - couponDiscount);

  // Handle Add to Cart
  const handleAddToCart = (product: Product, qty: number = 1, variant?: string) => {
    const effectiveVariant = variant || (product.variants && product.variants.length > 0 ? product.variants[0].title : undefined);
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.selectedVariant === effectiveVariant);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id && item.selectedVariant === effectiveVariant
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prev, { product, quantity: qty, selectedVariant: effectiveVariant }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQty = (productId: string, delta: number, variant?: string) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id === productId && (!variant || item.selectedVariant === variant)) {
            const newQ = item.quantity + delta;
            return newQ > 0 ? { ...item, quantity: newQ } : null;
          }
          return item;
        })
        .filter(Boolean) as any
    );
  };

  const handleApplyCoupon = () => {
    const code = couponInput.toUpperCase().trim();
    const existingCoupon = db.getCoupons().find(c => c.code === code && c.status === 'Active');

    if (existingCoupon) {
      setAppliedCoupon(existingCoupon.code);
      if (existingCoupon.discountType === 'percentage') {
        setCouponDiscount(Math.round(cartSubtotal * (existingCoupon.value / 100)));
      } else {
        setCouponDiscount(existingCoupon.value);
      }
    } else if (code === 'WELCOME10') {
      setAppliedCoupon('WELCOME10');
      setCouponDiscount(Math.round(cartSubtotal * 0.1));
    } else if (code === 'FESTIVE250' && cartSubtotal >= 200) {
      setAppliedCoupon('FESTIVE250');
      setCouponDiscount(25.0);
    } else {
      alert('Invalid coupon code or promotional limit reached.');
    }
  };

  const handlePlaceOrder = async () => {
    if (!customerUser) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }

    setCheckoutError('');
    setIsCheckoutLoading(true);
    try {
      const result = await createCheckout(customerUser, {
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          variantTitle: item.selectedVariant
        })),
        shippingMethod,
        paymentMethod: checkoutData.paymentMethod,
        couponCode: appliedCoupon || undefined,
        shippingAddress: {
          firstName: checkoutData.firstName,
          lastName: checkoutData.lastName,
          address: checkoutData.address,
          city: checkoutData.city,
          pincode: checkoutData.pincode
        }
      });

      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }
      if (!result.order) throw new Error('The server did not return an order.');
      setPlacedOrder(result.order);
      setTrackedOrderNumber(result.order.orderNumber);
      setCart([]);
      setCurrentView('order_success');
      setCustomerOrders(await loadCustomerOrders(customerUser));
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Unable to place your order.');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  // Filtered & Sorted products (REQ-BRW001, REQ-BRW002, REQ-BRW003)
  const currentCategory = categories.find(c => c.id === activeCategoryFilter);

  const filteredProducts = products
    .filter(p => {
      const matchesCat = activeCategoryFilter === 'all' || p.categoryId === activeCategoryFilter;
      const matchesSubcat = !selectedSubcategory || 
        p.subCategoryId === selectedSubcategory || 
        p.name.toLowerCase().includes(selectedSubcategory.toLowerCase()) ||
        p.description.toLowerCase().includes(selectedSubcategory.toLowerCase());
      const matchesSearch = !searchQuery || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStock = inStockOnly ? p.stock > 0 : true;

      // Dynamic category attribute filters check
      let matchesAttrs = true;
      for (const [attrKey, attrVal] of Object.entries(selectedAttrFilters)) {
        if (attrVal && attrVal !== 'All') {
          const productAttrVal = p.dynamicAttributes[attrKey];
          if (productAttrVal !== undefined && String(productAttrVal) !== attrVal) {
            matchesAttrs = false;
            break;
          }
        }
      }

      return matchesCat && matchesSubcat && matchesSearch && matchesStock && matchesAttrs;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return 0; // default featured
    });

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#20241F] flex flex-col font-sans">
      {/* Top service notice */}
      <div className="bg-[#073F45] text-[#E6F2F0] px-4 py-2 text-xs flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#E1A84B] font-semibold">TRS Hub:</span>
            <span className="hidden sm:inline">Professionally checked technology, ready for its next chapter.</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => {
                const pg = db.getStaticPages().find(p => p.slug === 'about-us') || db.getStaticPages()[0];
                setActiveStaticPage(pg);
                setShowStaticModal(true);
              }}
              className="text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              About
            </button>
            <span className="text-white/30">|</span>
            <button
              onClick={() => {
                const pg = db.getStaticPages().find(p => p.slug === 'faq') || db.getStaticPages()[1];
                setActiveStaticPage(pg);
                setShowStaticModal(true);
              }}
              className="text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              FAQ
            </button>
            <span className="text-white/30">|</span>
            <button
              onClick={() => {
                const pg = db.getStaticPages().find(p => p.slug === 'policies') || db.getStaticPages()[2];
                setActiveStaticPage(pg);
                setShowStaticModal(true);
              }}
              className="text-white/80 hover:text-white transition-colors cursor-pointer hidden md:inline"
            >
              Warranty &amp; SOP
            </button>
            <span className="text-white/40">|</span>
            <button
              onClick={() => setShowOrderTracker(true)}
              className="text-white hover:text-[#D9A441] transition-colors cursor-pointer flex items-center gap-1"
            >
              <Truck className="w-3.5 h-3.5 text-[#D9A441]" />
              <span className="hidden sm:inline">Live</span> Order Tracking
            </button>
            <button
              onClick={onOpenAdminPortal}
              className="text-white hover:text-[#D9A441] transition-colors cursor-pointer"
            >
              Admin Back-Office
            </button>
          </div>
        </div>
      </div>

      {/* Shared Site Navigation (Strictly adhering to Top Bar Contract: 1. Brand single text/lockup, 2. Nav links, 3. Actions) */}
      <header className="bg-white border-b border-[#E4E1D6] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Zone 1: Single element Brand Zone using Refreshed Logo */}
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center text-left focus:outline-none cursor-pointer"
          >
            <img src={logoImage} alt={activeLogo.config.brandName || 'HAVN'} className="h-10 max-w-[180px] object-contain" />
          </button>

          {/* Zone 2: Dynamic category navigation links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-[#666B62]">
            <button
              onClick={() => { setActiveCategoryFilter('all'); setSelectedSubcategory(null); setSelectedAttrFilters({}); setCurrentView('home'); }}
              className={`hover:text-[#20241F] transition-colors cursor-pointer ${activeCategoryFilter === 'all' && currentView === 'home' ? 'text-[#0F5257] font-semibold' : ''}`}
            >
              All Goods
            </button>
            {categories.slice(0, 5).map(cat => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategoryFilter(cat.id); setSelectedSubcategory(null); setSelectedAttrFilters({}); setCurrentView('home'); }}
                className={`hover:text-[#20241F] transition-colors cursor-pointer ${activeCategoryFilter === cat.id && currentView === 'home' ? 'text-[#0F5257] font-semibold' : ''}`}
              >
                {cat.name}
              </button>
            ))}
          </nav>

          {/* Zone 3: Search & Actions */}
          <div className="flex items-center gap-3">
            <div className="relative hidden lg:block w-52">
              <Search className="w-3.5 h-3.5 text-[#666B62] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search catalog…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full border border-[#E4E1D6] bg-[#F7F5EF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F5257]"
              />
            </div>

            <button
              onClick={() => setShowOrderTracker(true)}
              className="p-2 text-[#666B62] hover:text-[#20241F] cursor-pointer"
              title="Track Shipment / Orders"
            >
              <Truck className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsWishlistOpen(true)}
              className="p-2 text-[#666B62] hover:text-[#20241F] relative cursor-pointer"
              title="Saved Wishlist (REQ-CRT-002)"
            >
              <Heart className="w-4 h-4" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#D9A441]"></span>
              )}
            </button>

            <button
              onClick={() => setShowAuthModal(true)}
              className="p-2 text-[#666B62] hover:text-[#20241F] cursor-pointer flex items-center gap-1.5"
              title="Customer Account &amp; Auth (REQ-USR-001)"
            >
              <User className="w-4 h-4 text-[#0F5257]" />
              {isCustomerLoggedIn && (
                <span className="text-[11px] font-semibold text-[#0F5257] hidden md:inline">{customerName.split(' ')[0]}</span>
              )}
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F5257] text-white rounded-lg text-xs font-semibold hover:bg-[#0B3D3F] transition-all cursor-pointer shadow-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#D9A441]" />
              <span>Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN VIEW CONTENT */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* VIEW 1: HOME PAGE */}
        {currentView === 'home' && (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#E1EFED] rounded-2xl p-6 sm:p-10 border border-[#C9DEDB] shadow-sm">
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#0B6268]">
                  Refreshed technology · ready to work
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#142426] leading-[1.08] text-balance">
                  Better tech for the work ahead.
                </h1>
                <p className="text-[#5C6D6E] text-sm sm:text-base max-w-md leading-relaxed">
                  Reliable laptops, workstations, displays, and network equipment, professionally inspected and backed by practical support.
                </p>
                <div className="pt-2 flex items-center gap-4">
                  <button
                    onClick={() => {
                      setSelectedProduct(products[0]);
                      setCurrentView('product_detail');
                    }}
                    className="px-5 py-2.5 bg-[#E1A84B] text-[#2E2515] rounded-lg text-sm font-semibold hover:bg-[#d39836] transition-all cursor-pointer shadow-sm"
                  >
                    Browse refreshed tech
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProduct(products[1]);
                      setCurrentView('product_detail');
                    }}
                    className="px-4 py-2.5 text-sm font-semibold text-[#20241F] hover:text-[#0F5257] transition-colors"
                  >
                    Explore business essentials →
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="relative rounded-xl overflow-hidden h-[280px] sm:h-[340px] bg-[#C9DEDB]">
                  <img
                    src="/src/assets/images/havn_hero_furniture_1790578538197.jpg"
                    alt="Modern workspace with technology and furniture"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {/* Floating Price Card */}
                  <div
                    onClick={() => {
                      setSelectedProduct(products[0]);
                      setCurrentView('product_detail');
                    }}
                    className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-xs rounded-xl p-3.5 shadow-lg border border-[#E4E1D6] cursor-pointer hover:scale-102 transition-transform"
                  >
                    <span className="text-[11px] text-[#5C6D6E] block">Featured system</span>
                    <strong className="font-serif text-sm sm:text-base text-[#073F45] block">Work-ready hardware</strong>
                    <span className="font-serif text-xs font-bold text-[#B47A21]">Inspected &amp; ready</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Filter Strip & Catalog Controls */}
            <div className="space-y-3 border-b border-[#E4E1D6] pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => { setActiveCategoryFilter('all'); setSelectedSubcategory(null); setSelectedAttrFilters({}); }}
                    className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      activeCategoryFilter === 'all'
                        ? 'bg-[#0F5257] text-white shadow-xs'
                        : 'bg-white text-[#666B62] border border-[#E4E1D6] hover:border-[#0F5257]'
                    }`}
                  >
                    All Goods ({products.length})
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { setActiveCategoryFilter(cat.id); setSelectedSubcategory(null); setSelectedAttrFilters({}); }}
                      className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        activeCategoryFilter === cat.id
                          ? 'bg-[#0F5257] text-white shadow-xs'
                          : 'bg-white text-[#666B62] border border-[#E4E1D6] hover:border-[#0F5257]'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Sorting and In-Stock Filter */}
                <div className="flex items-center gap-3 shrink-0">
                  <label className="flex items-center gap-1.5 text-xs text-[#666B62] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="rounded text-[#0F5257] focus:ring-[#0F5257]"
                    />
                    <span>In stock only</span>
                  </label>

                  <div className="flex items-center gap-1.5 text-xs text-[#666B62]">
                    <span>Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-[#E4E1D6] bg-white text-[#20241F] focus:outline-none focus:ring-1 focus:ring-[#0F5257]"
                    >
                      <option value="featured">Featured Refresh</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="rating">Top Customer Rated</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Subcategories Strip (REQ-BRW001) */}
              {currentCategory?.subcategories && currentCategory.subcategories.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto text-xs pt-1">
                  <span className="text-[#666B62] font-semibold shrink-0">Subcategories:</span>
                  <button
                    onClick={() => setSelectedSubcategory(null)}
                    className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                      selectedSubcategory === null
                        ? 'bg-[#0F5257] text-white'
                        : 'bg-[#FAF8F3] text-[#666B62] border border-[#E4E1D6] hover:text-[#20241F]'
                    }`}
                  >
                    All Subcategories
                  </button>
                  {currentCategory.subcategories.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubcategory(sub.name)}
                      className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                        selectedSubcategory === sub.name
                          ? 'bg-[#0F5257] text-white'
                          : 'bg-[#FAF8F3] text-[#666B62] border border-[#E4E1D6] hover:text-[#20241F]'
                      }`}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Dynamic Category Custom Attribute Filters (REQ-BRW003) */}
              {currentCategory?.attributes && currentCategory.attributes.filter(a => a.isFilterable && a.options && a.options.length > 0).length > 0 && (
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <span className="text-[#666B62] font-semibold">Attribute Filters:</span>
                  {currentCategory.attributes.filter(a => a.isFilterable && a.options && a.options.length > 0).map(attr => (
                    <div key={attr.id} className="flex items-center gap-1.5">
                      <span className="text-[11px] text-[#666B62]">{attr.name}:</span>
                      <select
                        value={selectedAttrFilters[attr.key] || 'All'}
                        onChange={(e) => setSelectedAttrFilters({ ...selectedAttrFilters, [attr.key]: e.target.value })}
                        className="px-2 py-1 text-[11px] rounded border border-[#E4E1D6] bg-white text-[#20241F]"
                      >
                        <option value="All">All {attr.name}</option>
                        {attr.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  {Object.keys(selectedAttrFilters).length > 0 && (
                    <button
                      onClick={() => setSelectedAttrFilters({})}
                      className="text-[11px] text-[#0F5257] hover:underline"
                    >
                      Clear Attribute Filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Product Grid ("Just added" section per visual design) */}
            <div>
              <div className="flex items-baseline justify-between mb-6">
                <h2 className="font-serif text-2xl font-bold text-[#20241F]">
                  Curated Catalog
                </h2>
                <span className="text-xs text-[#666B62]">
                  Showing {filteredProducts.length} items
                </span>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-[#E4E1D6] space-y-3">
                  <p className="text-sm text-[#666B62]">No items found matching your search or filters.</p>
                  <button
                    onClick={() => {
                      setActiveCategoryFilter('all');
                      setSelectedSubcategory(null);
                      setSelectedAttrFilters({});
                      setSearchQuery('');
                      setInStockOnly(false);
                    }}
                    className="px-4 py-2 bg-[#0F5257] text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredProducts.map(product => {
                    const isWishlisted = wishlist.some(w => w.id === product.id);

                    return (
                      <div
                        key={product.id}
                        className="bg-white rounded-xl border border-[#E4E1D6] overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group relative"
                      >
                        {/* Wishlist Toggle Button (REQ-CRT-002) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(product);
                          }}
                          className={`absolute top-2 right-2 z-10 p-2 rounded-full backdrop-blur-xs transition-colors cursor-pointer ${
                            isWishlisted ? 'bg-red-50 text-red-600 shadow-sm' : 'bg-white/80 text-[#666B62] hover:text-red-600'
                          }`}
                          title={isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
                        >
                          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                        </button>

                        <div
                          onClick={() => {
                            setSelectedProduct(product);
                            setPdpSelectedVariant(product.variants && product.variants.length > 0 ? product.variants[0].title : '');
                            setCurrentView('product_detail');
                          }}
                          className="cursor-pointer"
                        >
                          <div className="h-48 bg-[#FAF8F3] overflow-hidden relative">
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                            {product.mrp > product.price && (
                              <span className="absolute top-2 left-2 bg-[#D9A441] text-[#26210F] text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                                Save ${(product.mrp - product.price).toFixed(0)}
                              </span>
                            )}
                            {product.stock <= 10 && product.stock > 0 && (
                              <span className="absolute bottom-2 left-2 bg-red-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                                Only {product.stock} left
                              </span>
                            )}
                          </div>

                          <div className="p-4 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-[#666B62] uppercase tracking-wider block font-semibold truncate max-w-[150px]">
                                {product.categoryName}
                              </span>
                              <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-0.5">
                                ★ {product.rating}
                              </span>
                            </div>
                            <h3 className="font-serif text-sm font-semibold text-[#20241F] line-clamp-1 group-hover:text-[#0F5257] transition-colors">
                              {product.name}
                            </h3>
                            <div className="flex items-center gap-1.5 pt-1">
                              <span className="font-serif font-bold text-sm text-[#0B3D3F]">
                                ${product.price.toFixed(2)}
                              </span>
                              {product.mrp > product.price && (
                                <span className="text-xs text-[#666B62] line-through font-mono">
                                  ${product.mrp.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="p-4 pt-0">
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="w-full py-2 bg-[#F7F5EF] hover:bg-[#0F5257] text-[#20241F] hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add to cart</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: PRODUCT DETAIL PAGE (PDP) */}
        {currentView === 'product_detail' && selectedProduct && (
          <div className="space-y-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-[#666B62]">
              <button onClick={() => setCurrentView('home')} className="hover:underline">Home</button>
              <span>/</span>
              <span>{selectedProduct.categoryName}</span>
              <span>/</span>
              <strong className="text-[#20241F]">{selectedProduct.name}</strong>
            </div>

            {/* Product Detail Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white rounded-2xl p-6 sm:p-10 border border-[#E4E1D6] shadow-sm">
              {/* Gallery Column (6 cols) */}
              <div className="lg:col-span-6 space-y-4">
                <div className="rounded-xl overflow-hidden h-[360px] sm:h-[420px] bg-[#FAF8F3] border border-[#E4E1D6]">
                  <img
                    src={selectedProduct.images[pdpActiveImageIdx] || selectedProduct.images[0]}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Thumbnails */}
                <div className="flex gap-3">
                  {selectedProduct.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPdpActiveImageIdx(idx)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        pdpActiveImageIdx === idx ? 'border-[#0F5257]' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Purchase Module Column (6 cols) */}
              <div className="lg:col-span-6 space-y-5">
                <div>
                  <span className="text-xs uppercase font-semibold tracking-wider text-[#0F5257]">
                    {selectedProduct.categoryName} · SKU: {selectedProduct.sku}
                  </span>
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#20241F] mt-1">
                    {selectedProduct.name}
                  </h1>

                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex text-[#D9A441]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs text-[#666B62]">
                      ({selectedProduct.reviewCount} customer reviews)
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline gap-3 border-y border-[#E4E1D6] py-3">
                  <span className="font-serif text-2xl font-bold text-[#0B3D3F]">
                    ${selectedProduct.price.toFixed(2)}
                  </span>
                  {selectedProduct.mrp > selectedProduct.price && (
                    <span className="text-sm text-[#666B62] line-through font-mono">
                      ${selectedProduct.mrp.toFixed(2)}
                    </span>
                  )}
                  <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold ml-auto">
                    In Stock ({selectedProduct.stock} units)
                  </span>
                </div>

                <p className="text-sm text-[#666B62] leading-relaxed">
                  {selectedProduct.description}
                </p>

                {/* Dynamic Attributes: Finish Swatches */}
                {selectedProduct.dynamicAttributes.finish && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#666B62]">Finish: <span className="text-[#20241F]">{pdpSelectedFinish}</span></label>
                    <div className="flex gap-2.5">
                      {[
                        { name: 'Natural Oak', color: '#CAA877' },
                        { name: 'Smoked Walnut', color: '#6B4A33' },
                        { name: 'Matte Black', color: '#2B2B2B' }
                      ].map(swatch => (
                        <button
                          key={swatch.name}
                          type="button"
                          onClick={() => setPdpSelectedFinish(swatch.name)}
                          className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                            pdpSelectedFinish === swatch.name ? 'ring-2 ring-[#0F5257] border-white' : 'border-[#E4E1D6]'
                          }`}
                          style={{ backgroundColor: swatch.color }}
                          title={swatch.name}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Dynamic Attributes: Product Variants Selector (REQ-PRD-001) */}
                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#666B62]">
                      Configuration / Variant: <span className="text-[#20241F] font-bold">{pdpSelectedVariant || selectedProduct.variants[0].title}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.variants.map(v => {
                        const isSelected = (pdpSelectedVariant || selectedProduct.variants[0].title) === v.title;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setPdpSelectedVariant(v.title)}
                            className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#EAF1F0] text-[#0F5257] border-[#0F5257] font-semibold ring-1 ring-[#0F5257]'
                                : 'bg-white text-[#666B62] border-[#E4E1D6] hover:border-[#0F5257]'
                            }`}
                          >
                            <span>{v.title}</span>
                            <span className="ml-1.5 opacity-70 font-mono">${v.price.toFixed(2)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity & CTA Buttons */}
                <div className="pt-2 space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-[#E4E1D6] rounded-lg bg-[#F7F5EF]">
                      <button
                        type="button"
                        onClick={() => setPdpQuantity(Math.max(1, pdpQuantity - 1))}
                        className="px-3 py-2 text-[#666B62] hover:text-black cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 py-2 text-xs font-mono font-semibold">{pdpQuantity}</span>
                      <button
                        type="button"
                        onClick={() => setPdpQuantity(pdpQuantity + 1)}
                        className="px-3 py-2 text-[#666B62] hover:text-black cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleAddToCart(
                        selectedProduct, 
                        pdpQuantity, 
                        pdpSelectedVariant || (selectedProduct.variants && selectedProduct.variants.length > 0 ? selectedProduct.variants[0].title : pdpSelectedFinish)
                      )}
                      className="flex-1 py-2.5 px-6 bg-[#0F5257] hover:bg-[#0B3D3F] text-white rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4 text-[#D9A441]" />
                      <span>Add to cart — ${(selectedProduct.price * pdpQuantity).toFixed(2)}</span>
                    </button>

                    <button
                      onClick={() => toggleWishlist(selectedProduct)}
                      className={`p-2.5 border rounded-lg cursor-pointer transition-colors ${
                        wishlist.some(w => w.id === selectedProduct.id)
                          ? 'border-red-300 bg-red-50 text-red-600'
                          : 'border-[#E4E1D6] hover:bg-[#F7F5EF] text-[#666B62]'
                      }`}
                      title={wishlist.some(w => w.id === selectedProduct.id) ? 'Remove from Wishlist' : 'Save to Wishlist (REQ-CRT-002)'}
                    >
                      <Heart className={`w-4 h-4 ${wishlist.some(w => w.id === selectedProduct.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Technical Specifications Table (EAV dynamic attributes per BRD REQ-CAT-002) */}
                <div className="border-t border-[#E4E1D6] pt-4 space-y-2">
                  <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#20241F]">
                    Technical Specifications
                  </h4>
                  <table className="w-full text-xs border-collapse">
                    <tbody>
                      {Object.entries(selectedProduct.dynamicAttributes).map(([key, value]) => (
                        <tr key={key} className="border-b border-[#E4E1D6]/60">
                          <td className="py-2 text-[#20241F] font-medium w-40 capitalize">
                            {key.replace('_', ' ')}
                          </td>
                          <td className="py-2 text-[#666B62]">
                            {String(value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Customer Reviews & Moderated Ratings (BRD/SRS REQ-REV-001 & REQ-BRW004) */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E4E1D6] shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4E1D6] pb-4">
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#20241F]">Customer Reviews &amp; Ratings</h3>
                  <p className="text-xs text-[#666B62]">
                    Verified technical refresh feedback on {selectedProduct.name}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center text-amber-500">
                    {[1, 2, 3, 4, 5].map(st => (
                      <Star key={st} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                  <div className="text-right">
                    <strong className="font-serif text-lg font-bold text-[#0B3D3F]">{selectedProduct.rating} out of 5</strong>
                    <span className="text-[11px] text-[#666B62] block">Based on {selectedProduct.reviewCount} customer ratings</span>
                  </div>
                </div>
              </div>

              {/* Reviews List & Write Review Form Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Reviews List Column (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <h4 className="font-serif text-sm font-semibold text-[#20241F]">
                    Customer Feedback ({db.getProductReviews(selectedProduct.id).length})
                  </h4>

                  {db.getProductReviews(selectedProduct.id).length === 0 ? (
                    <div className="p-6 bg-[#FAF8F3] rounded-xl border border-[#E4E1D6] text-center text-xs text-[#666B62]">
                      No reviews posted yet. Be the first verified customer to review this certified unit!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {db.getProductReviews(selectedProduct.id).map(rev => (
                        <div key={rev.id} className="p-4 rounded-xl border border-[#E4E1D6] bg-[#FAF8F3] space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <strong className="text-xs text-[#20241F]">{rev.customerName}</strong>
                              {rev.verifiedPurchase && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                  <Check className="w-3 h-3" />
                                  Verified Purchase
                                </span>
                              )}
                            </div>
                            <div className="flex items-center text-amber-500">
                              {[...Array(rev.rating)].map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-current" />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-[#666B62] leading-relaxed italic">
                            &ldquo;{rev.comment}&rdquo;
                          </p>
                          <span className="text-[10px] text-[#666B62] block opacity-70">
                            Posted {rev.date}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Write Review Column (5 cols) */}
                <div className="lg:col-span-5">
                  <form onSubmit={handleSubmitReview} className="bg-[#FAF8F3] p-5 rounded-xl border border-[#E4E1D6] space-y-4">
                    <h4 className="font-serif text-sm font-semibold text-[#20241F]">
                      Submit a Customer Review (REQ-REV-001)
                    </h4>

                    {reviewSuccessMsg && (
                      <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{reviewSuccessMsg}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-[#666B62] mb-1">Rating</label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="p-1 text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star className={`w-5 h-5 ${star <= reviewRating ? 'fill-current' : 'text-neutral-300'}`} />
                          </button>
                        ))}
                        <span className="text-xs font-semibold ml-2 text-[#0F5257]">{reviewRating} Stars</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#666B62] mb-1">Your Name</label>
                      <input
                        type="text"
                        value={reviewAuthor}
                        onChange={(e) => setReviewAuthor(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E4E1D6] bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#666B62] mb-1">Email (For Purchase Verification)</label>
                      <input
                        type="email"
                        value={reviewEmail}
                        onChange={(e) => setReviewEmail(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E4E1D6] bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#666B62] mb-1">Your Review &amp; Experience</label>
                      <textarea
                        rows={3}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Describe device condition, packaging, performance, and battery health..."
                        className="w-full p-2.5 text-xs rounded-lg border border-[#E4E1D6] bg-white"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-[#0F5257] hover:bg-[#0B3D3F] text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer transition-all"
                    >
                      Publish Verified Review
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: CHECKOUT FLOW */}
        {currentView === 'checkout' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-[#E4E1D6] pb-4">
              <div>
                <button onClick={() => setCurrentView('home')} className="text-xs text-[#0F5257] hover:underline mb-1">
                  ← Return to Storefront
                </button>
                <h1 className="font-serif text-2xl font-bold text-[#20241F]">Checkout</h1>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <ShieldCheck className="w-4 h-4" />
                <span>256-bit Encrypted Checkout</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Checkout Form (7 cols) */}
              <div className="md:col-span-7 space-y-6">
                <div className="bg-white rounded-xl p-6 border border-[#E4E1D6] shadow-sm space-y-4">
                  <div className="text-xs text-[#666B62] font-semibold">
                    <strong className="text-[#0F5257]">1. Address</strong> → 2. Shipping → <strong className="text-[#0F5257]">3. Payment</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-base font-bold text-[#20241F]">1. Shipping Address</h3>
                    <span className="text-[11px] text-[#0F5257] font-semibold">REQ-CHK001</span>
                  </div>

                  {/* Saved Address Quick Select (REQ-USR-003) */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-[#666B62]">Select Saved Profile Address:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {savedAddresses.map(addr => (
                        <div
                          key={addr.id}
                          onClick={() => {
                            setSelectedAddressId(addr.id);
                            setCheckoutData({
                              ...checkoutData,
                              firstName: addr.firstName,
                              lastName: addr.lastName,
                              address: addr.address,
                              city: addr.city,
                              pincode: addr.pincode
                            });
                          }}
                          className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                            selectedAddressId === addr.id
                              ? 'border-[#0F5257] bg-[#EAF1F0] ring-1 ring-[#0F5257]'
                              : 'border-[#E4E1D6] bg-white hover:border-[#0F5257]/50'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <strong className="text-[#20241F] font-semibold">{addr.label}</strong>
                            {selectedAddressId === addr.id && (
                              <span className="text-[10px] text-[#0F5257] font-bold">✓ Selected</span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#666B62] line-clamp-1">{addr.address}, {addr.city}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] text-[#666B62] mb-1">First name</label>
                      <input
                        type="text"
                        value={checkoutData.firstName}
                        onChange={(e) => setCheckoutData({ ...checkoutData, firstName: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#E4E1D6] bg-[#F7F5EF]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#666B62] mb-1">Last name</label>
                      <input
                        type="text"
                        value={checkoutData.lastName}
                        onChange={(e) => setCheckoutData({ ...checkoutData, lastName: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#E4E1D6] bg-[#F7F5EF]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#666B62] mb-1">Address</label>
                    <input
                      type="text"
                      value={checkoutData.address}
                      onChange={(e) => setCheckoutData({ ...checkoutData, address: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#E4E1D6] bg-[#F7F5EF]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#666B62] mb-1">City</label>
                      <input
                        type="text"
                        value={checkoutData.city}
                        onChange={(e) => setCheckoutData({ ...checkoutData, city: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#E4E1D6] bg-[#F7F5EF]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#666B62] mb-1">Pincode</label>
                      <input
                        type="text"
                        value={checkoutData.pincode}
                        onChange={(e) => setCheckoutData({ ...checkoutData, pincode: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#E4E1D6] bg-[#F7F5EF]"
                      />
                    </div>
                  </div>

                  {/* 2. Shipping Method Selection (REQ-CHK001) */}
                  <h3 className="font-serif text-base font-bold text-[#20241F] pt-3">2. Shipping Method</h3>
                  <div className="space-y-2">
                    {[
                      { id: 'Standard Shipping (Free)', title: 'Standard Courier Delivery', time: '3-5 Business Days', cost: cartSubtotal > 150 ? 'FREE' : '$12.00' },
                      { id: 'Express Courier ($25)', title: 'Priority Air Freight (BlueDart/FedEx)', time: '1-2 Business Days', cost: '$25.00' },
                      { id: 'Same-Day Metro Dispatch ($40)', title: 'Same-Day Dedicated Metro Dispatch', time: 'Within 6 Hours', cost: '$40.00' }
                    ].map(method => (
                      <label
                        key={method.id}
                        onClick={() => setShippingMethod(method.id as any)}
                        className={`flex items-center justify-between p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                          shippingMethod === method.id ? 'border-[#0F5257] bg-[#EAF1F0]' : 'border-[#E4E1D6] bg-white hover:border-[#0F5257]/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="shippingMethod"
                            checked={shippingMethod === method.id}
                            onChange={() => setShippingMethod(method.id as any)}
                            className="text-[#0F5257] focus:ring-[#0F5257]"
                          />
                          <div>
                            <strong className="text-[#20241F] block">{method.title}</strong>
                            <span className="text-[11px] text-[#666B62]">{method.time}</span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-[#0F5257]">{method.cost}</span>
                      </label>
                    ))}
                  </div>

                  <h3 className="font-serif text-base font-bold text-[#20241F] pt-3">3. Payment Method</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['Card', 'Cash on Delivery'] as const).map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setCheckoutData({ ...checkoutData, paymentMethod: method })}
                        className={`p-3 text-xs rounded-lg border text-center transition-all cursor-pointer ${
                          checkoutData.paymentMethod === method
                            ? 'bg-[#EAF1F0] text-[#0F5257] border-[#0F5257] font-semibold'
                            : 'bg-white text-[#666B62] border-[#E4E1D6]'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order Summary (5 cols) */}
              <div className="md:col-span-5 space-y-4">
                <div className="bg-white rounded-xl p-6 border border-[#E4E1D6] shadow-sm space-y-4">
                  <h3 className="font-serif text-base font-bold text-[#20241F] border-b border-[#E4E1D6] pb-3">
                    Order Summary
                  </h3>

                  <div className="space-y-3 max-h-52 overflow-y-auto divide-y divide-[#E4E1D6]">
                    {cart.map((item, idx) => (
                      <div key={idx} className="pt-2 flex justify-between items-center text-xs">
                        <div>
                          <strong className="text-[#20241F] block">{item.product.name}</strong>
                          <span className="text-[#666B62]">Qty: {item.quantity} {item.selectedVariant ? `· ${item.selectedVariant}` : ''}</span>
                        </div>
                        <span className="font-mono font-semibold">${(getCartUnitPrice(item) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Coupon Input */}
                  <div className="pt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon code (e.g. WELCOME10)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E4E1D6] bg-[#F7F5EF]"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="px-3 py-1.5 bg-[#0F5257] text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>

                  <div className="border-t border-[#E4E1D6] pt-3 space-y-1.5 text-xs text-[#666B62]">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-mono">${cartSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Shipping</span>
                      <span className="font-mono">{cartShipping === 0 ? 'FREE' : `$${cartShipping.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (GST/VAT)</span>
                      <span className="font-mono">${cartTax.toFixed(2)}</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Discount ({appliedCoupon})</span>
                        <span className="font-mono">-${couponDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold text-[#20241F] border-t border-[#E4E1D6] pt-2">
                      <span>Total</span>
                      <span className="font-serif text-[#0F5257]">${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {checkoutError && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3" role="alert">{checkoutError}</p>}
                  <button
                    onClick={handlePlaceOrder}
                    disabled={cart.length === 0 || isCheckoutLoading}
                    className="w-full py-3 bg-[#0F5257] hover:bg-[#0B3D3F] text-white rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isCheckoutLoading ? 'Processing...' : checkoutData.paymentMethod === 'Card' ? `Continue to secure payment ($${cartTotal.toFixed(2)})` : `Place COD order ($${cartTotal.toFixed(2)})`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: ORDER SUCCESS & PRINTABLE RECEIPT */}
        {currentView === 'order_success' && placedOrder && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl p-8 border border-[#E4E1D6] shadow-sm text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#0F5257] border border-[#0F5257]/30 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 text-[#0F5257]" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#20241F]">
                Thank you! Order Confirmed.
              </h2>
              <p className="text-xs text-[#666B62]">
                Order <strong>{placedOrder.orderNumber}</strong> has been logged in the MySQL database and dispatched to operations.
              </p>

              {/* Printable Invoice Header displaying Refreshed Logo */}
              <div className="bg-[#FAF8F3] p-6 rounded-xl border border-[#E4E1D6] text-left space-y-4 mt-6">
                <div className="flex items-center justify-between border-b border-[#E4E1D6] pb-4">
                  <div>
                    <img src={logoImage} alt={activeLogo.config.brandName || 'HAVN'} className="h-8 max-w-[160px] object-contain" />
                    <span className="text-[11px] text-[#666B62] block mt-1">Official Packing Slip &amp; Tax Invoice</span>
                  </div>
                  <div className="text-right text-xs">
                    <strong className="block text-[#0F5257]">{placedOrder.orderNumber}</strong>
                    <span className="text-[#666B62]">Date: {placedOrder.date}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#666B62] block">Billed &amp; Shipped To:</span>
                    <strong className="text-[#20241F]">{placedOrder.customerName}</strong>
                    <p className="text-[#666B62]">
                      {placedOrder.shippingAddress.address}<br />
                      {placedOrder.shippingAddress.city}, {placedOrder.shippingAddress.pincode}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#666B62] block">Payment Details:</span>
                    <strong className="text-[#20241F]">{placedOrder.paymentMethod}</strong>
                    <p className="text-[#666B62]">
                      Status: <span className="text-emerald-700 font-semibold">{placedOrder.paymentStatus}</span><br />
                      Total Paid: <strong>${placedOrder.total.toFixed(2)}</strong>
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#E4E1D6] pt-3">
                  <div className="flex justify-between items-center text-xs">
                    <span>Items Ordered ({placedOrder.items.length})</span>
                    <span className="font-bold text-[#0F5257]">${placedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-4">
                <button
                  onClick={() => setCurrentView('home')}
                  className="px-5 py-2.5 bg-[#0F5257] text-white rounded-lg text-xs font-semibold hover:bg-[#0B3D3F]"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 border border-[#E4E1D6] rounded-lg text-xs font-semibold hover:bg-[#F7F5EF] flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  Print Invoice
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Cart Slide-Over Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col justify-between border-l border-[#E4E1D6]">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#E4E1D6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#0F5257]" />
                <h3 className="font-serif text-base font-bold text-[#20241F]">
                  Your Bag ({cart.reduce((s, i) => s + i.quantity, 0)})
                </h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 text-[#666B62] hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="p-5 overflow-y-auto divide-y divide-[#E4E1D6] flex-1">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-[#666B62] space-y-2">
                  <ShoppingBag className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-sm">Your shopping bag is empty.</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="py-4 flex gap-4 items-start">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg bg-[#F7F5EF] border border-[#E4E1D6]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 space-y-1">
                      <h4 className="font-serif text-xs font-semibold text-[#20241F]">
                        {item.product.name}
                      </h4>
                      {item.selectedVariant && (
                        <span className="text-[11px] text-[#666B62] block">{item.selectedVariant}</span>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center border border-[#E4E1D6] rounded bg-[#F7F5EF]">
                          <button
                            onClick={() => handleUpdateCartQty(item.product.id, -1)}
                            className="px-2 py-0.5 text-xs text-[#666B62]"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-mono">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateCartQty(item.product.id, 1)}
                            className="px-2 py-0.5 text-xs text-[#666B62]"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-mono text-xs font-semibold text-[#0B3D3F]">
                          ${(getCartUnitPrice(item) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-[#E4E1D6] bg-[#FAF8F3] space-y-3">
                <div className="flex justify-between text-xs text-[#666B62]">
                  <span>Subtotal</span>
                  <span className="font-mono font-semibold">${cartSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-[#666B62]">
                  <span>Shipping</span>
                  <span>{cartShipping === 0 ? 'FREE' : `$${cartShipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#20241F] border-t border-[#E4E1D6] pt-2">
                  <span>Estimated Total</span>
                  <span className="font-serif text-[#0F5257]">${(cartSubtotal + cartShipping).toFixed(2)}</span>
                </div>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setCurrentView('checkout');
                  }}
                  className="w-full py-3 bg-[#0F5257] hover:bg-[#0B3D3F] text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer matching Havn design system */}
      <footer className="bg-[#1E2320] text-[#EDEFEA] border-t border-neutral-800 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <img src={logoImage} alt={activeLogo.config.brandName || 'HAVN'} className="h-10 max-w-[180px] object-contain" />
            <p className="text-xs text-[#9AA39B] max-w-xs leading-relaxed">
              {activeLogo.config.brandName} — Professional refurbished hardware, responsive service, and reliable procurement for modern teams.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-[#D9A441] uppercase tracking-wider">Catalog</h4>
            <ul className="text-xs text-[#9AA39B] space-y-1.5">
              {categories.slice(0, 4).map(cat => (
                <li key={cat.id}>
                  <button onClick={() => { setActiveCategoryFilter(cat.id); setCurrentView('home'); }} className="hover:text-white cursor-pointer">
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-[#D9A441] uppercase tracking-wider">Support</h4>
            <ul className="text-xs text-[#9AA39B] space-y-1.5">
              <li><button onClick={() => setCurrentView('home')} className="hover:text-white cursor-pointer">Latest inventory</button></li>
              <li><button onClick={() => setCurrentView('checkout')} className="hover:text-white cursor-pointer">Checkout support</button></li>
              <li><button onClick={onOpenAdminPortal} className="hover:text-white cursor-pointer">Back-Office Admin Portal</button></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-[#D9A441] uppercase tracking-wider">Why TRS Hub</h4>
            <p className="text-xs text-[#9AA39B] leading-relaxed">
              Every item is inspected, clearly graded, and prepared for dependable daily use.<br />
              Practical warranties. Thoughtful support. Less waste.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-neutral-800 text-xs text-[#666B62] flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>&copy; 2026 {activeLogo.config.brandName}. All rights reserved.</span>
          <span>Inspected technology for modern teams</span>
        </div>
      </footer>

      {/* SRS REQ-ORD-003: Live Order Tracking Modal */}
      {showOrderTracker && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#E4E1D6] space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#E4E1D6] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EAF1F0] flex items-center justify-center text-[#0F5257]">
                  <Truck className="w-4 h-4 text-[#0F5257]" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#20241F]">
                    Live Order &amp; Shipment Tracking
                  </h3>
                  <p className="text-xs text-[#666B62]">
                    Track order milestones directly synchronized with MySQL back-office
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOrderTracker(false)}
                className="p-1 rounded-md text-[#666B62] hover:text-[#20241F] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order lookup input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Order # (e.g. TRS-ORD-8829)"
                value={trackedOrderNumber}
                onChange={(e) => setTrackedOrderNumber(e.target.value)}
                className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-[#E4E1D6] bg-[#F7F5EF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F5257]"
              />
              <button
                onClick={() => {
                  const ord = customerOrders.find(o => o.orderNumber.toLowerCase() === trackedOrderNumber.trim().toLowerCase());
                  if (!ord) alert('Order not found in your account.');
                }}
                className="px-4 py-2 bg-[#0F5257] hover:bg-[#0B3D3F] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Track
              </button>
            </div>

            {/* Order details display */}
            {(() => {
              const matchedOrder = customerOrders.find(o => o.orderNumber.toLowerCase() === trackedOrderNumber.trim().toLowerCase());
              if (!matchedOrder) {
                return (
                  <div className="text-center py-6 text-xs text-[#666B62]">
                    Please enter a valid order number to view live shipment progress.
                  </div>
                );
              }

              const statusStages = ['Processing', 'Shipped', 'Delivered'];
              const currentStageIdx = statusStages.indexOf(matchedOrder.orderStatus);

              return (
                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className="bg-[#FAF8F3] p-4 rounded-xl border border-[#E4E1D6] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-[#666B62] block">Order Reference</span>
                      <strong className="font-mono text-sm text-[#0F5257]">{matchedOrder.orderNumber}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-[#666B62] block">Current Status</span>
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                        matchedOrder.orderStatus === 'Delivered' 
                          ? 'bg-emerald-100 text-emerald-800'
                          : matchedOrder.orderStatus === 'Shipped'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {matchedOrder.orderStatus}
                      </span>
                    </div>
                  </div>

                  {/* Visual Timeline Pipeline */}
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E4E1D6]">
                    {/* Stage 1: Order Placed */}
                    <div className="relative flex items-start gap-3">
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] ring-4 ring-white">
                        ✓
                      </div>
                      <div>
                        <strong className="text-xs font-semibold text-[#20241F] block">Order Placed &amp; Payment Confirmed</strong>
                        <span className="text-[11px] text-[#666B62]">Logged in MySQL · {matchedOrder.date}</span>
                      </div>
                    </div>

                    {/* Stage 2: Technical Refresh Quality Inspection */}
                    <div className="relative flex items-start gap-3">
                      <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ring-4 ring-white ${
                        currentStageIdx >= 0 ? 'bg-emerald-600 text-white' : 'bg-neutral-300 text-neutral-600'
                      }`}>
                        {currentStageIdx >= 0 ? '✓' : '2'}
                      </div>
                      <div>
                        <strong className="text-xs font-semibold text-[#20241F] block">Technical Refresh &amp; Burn-In Testing</strong>
                        <span className="text-[11px] text-[#666B62]">48-point hardware diagnostic &amp; packaging passed</span>
                      </div>
                    </div>

                    {/* Stage 3: Dispatched & In Transit */}
                    <div className="relative flex items-start gap-3">
                      <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ring-4 ring-white ${
                        currentStageIdx >= 1 ? 'bg-emerald-600 text-white' : 'bg-neutral-300 text-neutral-600'
                      }`}>
                        {currentStageIdx >= 1 ? '✓' : '3'}
                      </div>
                      <div>
                        <strong className="text-xs font-semibold text-[#20241F] block">Dispatched via Express Courier</strong>
                        <span className="text-[11px] text-[#666B62]">Carrier: BlueDart / FedEx Express · Tracking # TRS-TRK-992144</span>
                      </div>
                    </div>

                    {/* Stage 4: Delivered */}
                    <div className="relative flex items-start gap-3">
                      <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ring-4 ring-white ${
                        currentStageIdx >= 2 ? 'bg-emerald-600 text-white' : 'bg-neutral-300 text-neutral-600'
                      }`}>
                        {currentStageIdx >= 2 ? '✓' : '4'}
                      </div>
                      <div>
                        <strong className="text-xs font-semibold text-[#20241F] block">Delivered to Consignee</strong>
                        <span className="text-[11px] text-[#666B62]">Signed delivery to {matchedOrder.shippingAddress.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="border-t border-[#E4E1D6] pt-3 space-y-2">
                    <span className="text-[11px] font-semibold text-[#666B62] uppercase tracking-wider block">Items in this package</span>
                    {matchedOrder.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-[#20241F] font-medium">{it.productName} ({it.quantity}x)</span>
                        <span className="font-mono text-[#666B62]">${(it.price * it.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="border-t border-[#E4E1D6] pt-4 flex justify-end">
              <button
                onClick={() => setShowOrderTracker(false)}
                className="px-4 py-2 bg-[#F7F5EF] hover:bg-[#EAE6D8] text-[#20241F] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQ-CRT-002: Wishlist Slide-Over Drawer */}
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsWishlistOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col justify-between border-l border-[#E4E1D6]">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#E4E1D6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500 fill-current" />
                <h3 className="font-serif text-base font-bold text-[#20241F]">
                  Saved Wishlist ({wishlist.length})
                </h3>
              </div>
              <button
                onClick={() => setIsWishlistOpen(false)}
                className="p-1 text-[#666B62] hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Wishlist Items List */}
            <div className="p-5 overflow-y-auto divide-y divide-[#E4E1D6] flex-1">
              {wishlist.length === 0 ? (
                <div className="text-center py-16 text-[#666B62] space-y-3">
                  <Heart className="w-10 h-10 mx-auto opacity-30 text-red-400" />
                  <p className="text-sm">Your wishlist is empty.</p>
                  <p className="text-xs">Browse the certified catalog and tap the heart icon to save products for later purchase.</p>
                </div>
              ) : (
                wishlist.map(item => (
                  <div key={item.id} className="py-4 flex gap-4 items-center">
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg bg-[#F7F5EF] border border-[#E4E1D6]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] text-[#666B62] uppercase tracking-wider block font-semibold">{item.categoryName}</span>
                      <h4 className="font-serif text-xs font-semibold text-[#20241F] line-clamp-1">{item.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#0F5257]">${item.price.toFixed(2)}</span>
                        {item.mrp > item.price && (
                          <span className="text-[11px] text-[#666B62] line-through font-mono">${item.mrp.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => {
                          handleAddToCart(item, 1);
                          setWishlist(wishlist.filter(w => w.id !== item.id));
                        }}
                        className="px-2.5 py-1.5 bg-[#0F5257] hover:bg-[#0B3D3F] text-white text-[11px] font-semibold rounded cursor-pointer transition-colors"
                      >
                        Move to Bag
                      </button>
                      <button
                        onClick={() => setWishlist(wishlist.filter(w => w.id !== item.id))}
                        className="p-1 text-red-500 hover:text-red-700 text-xs text-center cursor-pointer"
                        title="Remove from Wishlist"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Wishlist Footer */}
            {wishlist.length > 0 && (
              <div className="p-5 border-t border-[#E4E1D6] bg-[#FAF8F3] space-y-2">
                <button
                  onClick={() => {
                    wishlist.forEach(item => handleAddToCart(item, 1));
                    setWishlist([]);
                    setIsWishlistOpen(false);
                    setIsCartOpen(true);
                  }}
                  className="w-full py-2.5 bg-[#0F5257] hover:bg-[#0B3D3F] text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  Move All Items to Cart
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REQ-USR-001..004: Customer Account & Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#E4E1D6] space-y-6">
            <div className="flex items-center justify-between border-b border-[#E4E1D6] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#EAF1F0] flex items-center justify-center text-[#0F5257]">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#20241F]">
                    {isCustomerLoggedIn ? 'Customer Account & Addresses' : 'Customer Sign In'}
                  </h3>
                  <span className="text-[11px] text-[#666B62]">
                    {isCustomerLoggedIn ? `Signed in as ${customerName}` : 'Access your order history, certified warranties, and wishlist'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="p-1 text-[#666B62] hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Authenticated View: Profile & Multiple Shipping Addresses (REQ-USR-003) */}
            {isCustomerLoggedIn ? (
              <div className="space-y-6">
                {/* Profile Summary Card */}
                <div className="p-4 bg-[#FAF8F3] rounded-xl border border-[#E4E1D6] flex justify-between items-center text-xs">
                  <div>
                    <strong className="text-sm font-serif text-[#20241F] block">{customerName}</strong>
                    <span className="text-[#666B62]">{authEmail}</span>
                    <span className="text-emerald-700 font-semibold block mt-1">Authenticated account</span>
                  </div>
                  <button
                    onClick={() => {
                      void signOut();
                    }}
                    className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Sign Out
                  </button>
                </div>

                {/* Multiple Shipping Addresses Manager (REQ-USR-003) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif text-sm font-bold text-[#20241F]">
                      Manage Shipping Addresses (REQ-USR-003)
                    </h4>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-[#0F5257] font-semibold">{savedAddresses.length} Addresses Saved</span>
                      <button
                        type="button"
                        onClick={() => setIsAddressFormOpen(value => !value)}
                        className="text-[11px] font-semibold text-[#0F5257] hover:underline"
                      >
                        {isAddressFormOpen ? 'Cancel' : 'Add address'}
                      </button>
                    </div>
                  </div>

                  {profileError && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2" role="alert">{profileError}</p>}

                  {isAddressFormOpen && (
                    <form onSubmit={handleSaveAddress} className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border border-[#E4E1D6] rounded-lg bg-[#FAF8F3]">
                      <input aria-label="Address label" placeholder="Label (Home, Work)" value={addressDraft.label} onChange={event => setAddressDraft({ ...addressDraft, label: event.target.value })} required maxLength={80} className="px-3 py-2 text-xs rounded border border-[#E4E1D6] bg-white" />
                      <input aria-label="Phone number" type="tel" placeholder="Phone number" value={addressDraft.phone} onChange={event => setAddressDraft({ ...addressDraft, phone: event.target.value })} required maxLength={32} className="px-3 py-2 text-xs rounded border border-[#E4E1D6] bg-white" />
                      <input aria-label="First name" placeholder="First name" value={addressDraft.firstName} onChange={event => setAddressDraft({ ...addressDraft, firstName: event.target.value })} required maxLength={100} className="px-3 py-2 text-xs rounded border border-[#E4E1D6] bg-white" />
                      <input aria-label="Last name" placeholder="Last name" value={addressDraft.lastName} onChange={event => setAddressDraft({ ...addressDraft, lastName: event.target.value })} required maxLength={100} className="px-3 py-2 text-xs rounded border border-[#E4E1D6] bg-white" />
                      <input aria-label="Street address" placeholder="Street address" value={addressDraft.address} onChange={event => setAddressDraft({ ...addressDraft, address: event.target.value })} required maxLength={300} className="sm:col-span-2 px-3 py-2 text-xs rounded border border-[#E4E1D6] bg-white" />
                      <input aria-label="City" placeholder="City" value={addressDraft.city} onChange={event => setAddressDraft({ ...addressDraft, city: event.target.value })} required maxLength={120} className="px-3 py-2 text-xs rounded border border-[#E4E1D6] bg-white" />
                      <input aria-label="ZIP or postal code" placeholder="ZIP / postal code" value={addressDraft.pincode} onChange={event => setAddressDraft({ ...addressDraft, pincode: event.target.value })} required minLength={2} maxLength={20} className="px-3 py-2 text-xs rounded border border-[#E4E1D6] bg-white" />
                      <button type="submit" disabled={isProfileSaving} className="sm:col-span-2 py-2 bg-[#0F5257] text-white text-xs font-semibold rounded disabled:opacity-50">
                        {isProfileSaving ? 'Saving...' : 'Save address'}
                      </button>
                    </form>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedAddresses.length === 0 && (
                      <p className="text-xs text-[#666B62]">No saved addresses yet. Add delivery details during checkout.</p>
                    )}
                    {savedAddresses.map(addr => (
                      <div key={addr.id} className="p-3.5 rounded-xl border border-[#E4E1D6] bg-white text-xs space-y-1.5 relative">
                        <div className="flex justify-between items-center">
                          <strong className="text-[#20241F]">{addr.label}</strong>
                          {selectedAddressId === addr.id && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-[#666B62] leading-tight">
                          {addr.firstName} {addr.lastName}<br />
                          {addr.address}<br />
                          {addr.city}, {addr.pincode}<br />
                          {addr.phone}
                        </p>
                        <div className="pt-1 flex gap-2">
                          <button
                            disabled={isProfileSaving}
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-[11px] text-[#0F5257] font-semibold hover:underline cursor-pointer"
                          >
                            Set as Default
                          </button>
                          <button
                            type="button"
                            disabled={isProfileSaving}
                            aria-label={`Delete ${addr.label} address`}
                            title={`Delete ${addr.label} address`}
                            onClick={() => handleRemoveAddress(addr.id)}
                            className="text-[11px] text-red-700 hover:underline cursor-pointer disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Orders Overview (REQ-ORD001) */}
                <div className="space-y-3">
                  <h4 className="font-serif text-sm font-bold text-[#20241F]">
                    Recent Order History &amp; Tracking (REQ-ORD001)
                  </h4>
                  <div className="divide-y divide-[#E4E1D6] border border-[#E4E1D6] rounded-xl overflow-hidden text-xs">
                    {customerOrders.slice(0, 3).map(ord => (
                      <div key={ord.id} className="p-3 bg-white hover:bg-[#FAF8F3] flex justify-between items-center">
                        <div>
                          <strong className="font-mono text-[#0F5257] block">{ord.orderNumber}</strong>
                          <span className="text-[11px] text-[#666B62]">{ord.date} · {ord.items.length} items · ${ord.total.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ord.orderStatus === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                            ord.orderStatus === 'Shipped' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ord.orderStatus}
                          </span>
                          <button
                            onClick={() => {
                              setShowAuthModal(false);
                              setTrackedOrderNumber(ord.orderNumber);
                              setShowOrderTracker(true);
                            }}
                            className="px-2.5 py-1 bg-[#0F5257] text-white text-[11px] font-semibold rounded cursor-pointer"
                          >
                            Track
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Unauthenticated account access */
              <div className="space-y-4">
                <div className="flex border-b border-[#E4E1D6] gap-2">
                  {(['login', 'register'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => { setAuthMode(mode); setAuthError(''); }}
                      className={`pb-2 px-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                        authMode === mode ? 'border-[#0F5257] text-[#0F5257]' : 'border-transparent text-[#666B62]'
                      }`}
                    >
                      {mode === 'login' ? 'Sign in' : 'Create account'}
                    </button>
                  ))}
                </div>

                {authError && <div role="alert" className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg">{authError}</div>}
                <form
                  onSubmit={event => {
                    event.preventDefault();
                    setAuthError('');
                    setIsAuthLoading(true);
                    const action = authMode === 'register'
                      ? registerWithEmail(authName, authEmail, authPassword)
                      : signInWithEmail(authEmail, authPassword);
                    void action.then(() => setShowAuthModal(false))
                      .catch(error => setAuthError(error instanceof Error ? error.message : 'Account access failed.'))
                      .finally(() => setIsAuthLoading(false));
                  }}
                  className="space-y-3"
                >
                  {authMode === 'register' && (
                    <label className="block text-xs font-medium text-[#666B62]">
                      Name
                      <input value={authName} onChange={event => setAuthName(event.target.value)} autoComplete="name" maxLength={160} required className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-[#E4E1D6] bg-[#F7F5EF]" />
                    </label>
                  )}
                  <label className="block text-xs font-medium text-[#666B62]">
                    Email address
                    <input type="email" value={authEmail} onChange={event => setAuthEmail(event.target.value)} autoComplete="email" required className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-[#E4E1D6] bg-[#F7F5EF]" />
                  </label>
                  <label className="block text-xs font-medium text-[#666B62]">
                    Password
                    <input type="password" value={authPassword} onChange={event => setAuthPassword(event.target.value)} autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} minLength={authMode === 'register' ? 12 : 1} maxLength={128} required className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-[#E4E1D6] bg-[#F7F5EF]" />
                  </label>
                  <button type="submit" disabled={isAuthLoading} className="w-full py-2.5 bg-[#0F5257] hover:bg-[#0B3D3F] disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed">
                    {isAuthLoading ? 'Please wait...' : authMode === 'register' ? 'Create account' : 'Sign in'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REQ-PRM-003: Static Content Pages Modal (About Us, Policies, FAQ) */}
      {showStaticModal && activeStaticPage && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#E4E1D6] space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E4E1D6] pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#20241F]">{activeStaticPage.title}</h3>
                <span className="text-[11px] text-[#666B62]">Last Updated: {activeStaticPage.lastUpdated}</span>
              </div>
              <button
                onClick={() => setShowStaticModal(false)}
                className="p-1 text-[#666B62] hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 text-xs text-[#20241F] leading-relaxed whitespace-pre-line p-2 bg-[#FAF8F3] rounded-xl border border-[#E4E1D6]">
              {activeStaticPage.content}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#b09c57]">
              <button
                onClick={() => setShowStaticModal(false)}
                className="px-4 py-2 bg-[#0F5257] text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Close Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
