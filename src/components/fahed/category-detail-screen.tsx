'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Search, ChevronLeft, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { productIcons, getProductIcon } from '@/lib/product-icons';
import { serviceIcons } from '@/lib/service-icons';

// ─── Category display names ─────────────────────────────────────────
const categoryNames: Record<string, string> = {
  entertainment: 'خدمات ترفيهية',
  cards: 'بطاقات رقمية',
  telecom: 'خدمات الاتصالات',
  electricity: 'الكهرباء والماء',
  government: 'خدمات حكومية',
  internet: 'الإنترنت',
};

// ─── Sub-section icon keys (maps to productIcons or serviceIcons) ───
const subSectionIcons: Record<string, string> = {
  shooting: 'pubg',
  strategy: 'clash-royale',
  adventure: 'roblox',
  platforms: 'steam',
  streaming: 'netflix',
  'store-cards': 'google-play',
  'gaming-cards': 'psn-card',
  'payment-cards': 'visa-virtual',
  recharge: 'yemen-mobile',
  'internet-packages': 'yemen-net',
  elec: 'electricity',
  water: 'water',
  identity: 'civil-registry',
  'traffic-municipal': 'traffic',
  providers: 'yemen-net',
};

// ─── Sub-sections with provider IDs ─────────────────────────────────
interface SubSection {
  id: string;
  name: string;
  description: string;
  providerIds: string[];
  iconKey: string;
  color: string;
}

const categorySubSections: Record<string, SubSection[]> = {
  entertainment: [
    { id: 'shooting', name: 'ألعاب إطلاق النار', description: 'ببجي، فري فاير، فالورانت والمزيد', providerIds: ['pubg', 'freefire', 'call-of-duty', 'fortnite', 'valorant', 'apex-legends'], iconKey: 'pubg', color: '#F59E0B' },
    { id: 'strategy', name: 'ألعاب الاستراتيجية', description: 'كلاش رويال، كلاش اوف كلانس والمزيد', providerIds: ['clash-royale', 'clash-of-clans', 'league-legends'], iconKey: 'clash-royale', color: '#3B82F6' },
    { id: 'adventure', name: 'ألعاب المغامرات', description: 'روبلوكس، ماينكرافت، جينشين والمزيد', providerIds: ['roblox', 'minecraft', 'genshin-impact', 'honkai-star'], iconKey: 'roblox', color: '#E60000' },
    { id: 'platforms', name: 'منصات الألعاب', description: 'ستيم، EA FC والمزيد', providerIds: ['steam', 'ea-fc'], iconKey: 'steam', color: '#1B2838' },
    { id: 'streaming', name: 'خدمات البث', description: 'نتفلكس، سبوتيفاي، يوتيوب بريميوم', providerIds: ['netflix', 'spotify', 'youtube-premium'], iconKey: 'netflix', color: '#E50914' },
  ],
  cards: [
    { id: 'store-cards', name: 'بطاقات المتاجر', description: 'جوجل بلاي، آيتونز، امازون', providerIds: ['google-play', 'apple-itunes', 'amazon-gift'], iconKey: 'google-play', color: '#34A853' },
    { id: 'gaming-cards', name: 'بطاقات الألعاب', description: 'بلايستيشن، اكسبوكس، نينتندو', providerIds: ['psn-card', 'xbox-card', 'nintendo-card'], iconKey: 'psn-card', color: '#00439C' },
    { id: 'payment-cards', name: 'بطاقات الدفع', description: 'فيزا، ماستركارد، بايبال', providerIds: ['visa-virtual', 'mastercard-virtual', 'paypal'], iconKey: 'visa-virtual', color: '#1A1F71' },
  ],
  telecom: [
    { id: 'recharge', name: 'شحن رصيد', description: 'يمن موبايل، يو، سبأفون، واي', providerIds: ['yemen-mobile', 'yo', 'sabafon', 'y'], iconKey: 'yemen-mobile', color: '#C41E3A' },
    { id: 'internet-packages', name: 'باقات الإنترنت', description: 'يمن نت، واي نت، سبأفون نت', providerIds: ['yemen-net', 'y-net-internet', 'sabafon-internet'], iconKey: 'yemen-net', color: '#8B5CF6' },
  ],
  electricity: [
    { id: 'elec', name: 'الكهرباء', description: 'دفع فواتير الكهرباء', providerIds: ['elec-sanaa', 'elec-aden'], iconKey: 'electricity', color: '#F59E0B' },
    { id: 'water', name: 'المياه', description: 'دفع فواتير المياه', providerIds: ['water-sanaa', 'water-aden'], iconKey: 'water', color: '#06B6D4' },
  ],
  government: [
    { id: 'identity', name: 'الأوراق الثبوتية', description: 'السجل المدني، جواز السفر', providerIds: ['civil-registry', 'passport'], iconKey: 'civil-registry', color: '#6B7280' },
    { id: 'traffic-municipal', name: 'المرور والبلدية', description: 'خدمات المرور والبلدية', providerIds: ['traffic', 'municipal'], iconKey: 'traffic', color: '#DC2626' },
  ],
  internet: [
    { id: 'providers', name: 'مزودي الإنترنت', description: 'يمن نت، واي نت، سبأفون نت', providerIds: ['yemen-net', 'y-net-internet', 'sabafon-internet'], iconKey: 'yemen-net', color: '#8B5CF6' },
  ],
};

// ─── Product image URLs from real service providers (Codashop, SEAGM, Jollymax) ──
const PRODUCT_IMAGES: Record<string, string> = {
  // Gaming - Shooting
  'pubg': 'https://cdn1.codashop.com/S/content/mobile/images/product-tiles/pubgm_tile_aug2024.jpg',
  'freefire': 'https://cdn1.codashop.com/S/content/mobile/images/product-tiles/free_fire_new_tile.png',
  'call-of-duty': 'https://cdn1.codashop.com/S/content/mobile/images/product-tiles/codm-wl_178x178.jpg',
  'fortnite': 'https://cdn1.codashop.com/S/content/mobile/images/product-tiles/fortnite_usa_tile.png',
  'valorant': 'https://cdn1.codashop.com/S/content/mobile/images/product-tiles/valorant_tile.jpg',
  'apex-legends': 'https://seagm-media.seagmcdn.com/game_480/3116.jpg',
  // Gaming - Strategy
  'clash-royale': 'https://img-cdn-sg.payermax.com/shoplay365/prod/upload/picture/20240412094815705_CLASH_ROYALE_icon.jpg',
  'clash-of-clans': 'https://img-cdn-sg.payermax.com/shoplay365/prod/upload/picture/20240418072604722_clashofclans_appicon.jpg',
  'league-legends': 'https://cdn1.codashop.com/S/content/mobile/images/product-tiles/LOL_tile.jpg',
  // Gaming - Adventure
  'roblox': 'https://cdn1.codashop.com/S/content/mobile/images/product-tiles/Roblox-tiles-178x178-new.jpg',
  'minecraft': 'https://cdn1.codashop.com/S/content/mobile/images/product-tiles/Minecraft-Java-Bedrock-tile_update_178x178.jpg',
  'genshin-impact': 'https://cdn1.codashop.com/S/content/mobile/images/product-tiles/genshinimpact_tile.jpg',
  'honkai-star': 'https://cdn1.codashop.com/S/content/mobile/images/product-tiles/hsr_tile.jpg',
  // Gaming - Platforms
  'steam': 'https://cdn1.codashop.com/S/content/mobile/images/product-tiles/steam_us_tile.jpg',
  'ea-fc': 'https://cdn1.codashop.com/S/content/mobile/images/product-tiles/FCMNewUpdate/new-en.jpg',
  // Streaming
  'netflix': 'https://cdn1.codashop.com/S/content/mobile/images/product-tiles/Netflix_rebrand2_tile.png',
  'spotify': 'https://cdn1.codashop.com/S/content/mobile/images/product-tiles/spotify_usa_tile.png',
  'youtube-premium': 'https://static.eneba.games/84fba7421ae9417ec36c.jpg',
  // Digital Cards - Store Cards
  'google-play': 'https://cdn1.codashop.com/S/content/mobile/images/product-tiles/gp_usa_tile.png',
  'apple-itunes': 'https://cdn1.codashop.com/S/content/mobile/images/product-tiles/itunes_us_tile.jpg',
  'amazon-gift': 'https://cdn1.codashop.com/S/content/mobile/images/product-tiles-plain/GC_Amazon_ae_178x178.png',
  // Digital Cards - Gaming Cards
  'psn-card': 'https://cdn1.codashop.com/S/content/mobile/images/product-tiles/psn_store_tile.jpg',
  'xbox-card': 'https://cdn1.codashop.com/S/content/mobile/images/product-tiles/xboxgiftcard_tile.jpg',
  'nintendo-card': 'https://cdn1.codashop.com/S/content/mobile/images/product-tiles/US_Nintendo-eShop.jpg',
  // Digital Cards - Payment Cards
  'visa-virtual': 'https://seagm-media.seagmcdn.com/icon_400/2211.jpg',
  'mastercard-virtual': 'https://seagm-media.seagmcdn.com/icon_400/2858.jpg',
  'paypal': 'https://seagm-media.seagmcdn.com/icon_400/1818.jpg',
};

// ─── Starting prices (lowest package price per provider) ────────────
const STARTING_PRICES: Record<string, number> = {
  'pubg': 1200, 'freefire': 800, 'call-of-duty': 1500, 'fortnite': 2000,
  'valorant': 1800, 'apex-legends': 1500, 'clash-royale': 1000, 'clash-of-clans': 1000,
  'league-legends': 2000, 'roblox': 900, 'minecraft': 2500, 'genshin-impact': 1500,
  'honkai-star': 1500, 'steam': 5000, 'ea-fc': 3000,
  'netflix': 3500, 'spotify': 2500, 'youtube-premium': 3000,
  'google-play': 3000, 'apple-itunes': 3500, 'amazon-gift': 3000,
  'psn-card': 6000, 'xbox-card': 6000, 'nintendo-card': 6000,
  'visa-virtual': 5000, 'mastercard-virtual': 5000, 'paypal': 5000,
  'yemen-mobile': 100, 'yo': 100, 'sabafon': 100, 'y': 100,
  'yemen-net': 150, 'y-net-internet': 250, 'sabafon-internet': 400,
  'elec-sanaa': 500, 'elec-aden': 500, 'water-sanaa': 300, 'water-aden': 300,
  'civil-registry': 1000, 'passport': 5000, 'traffic': 500, 'municipal': 500,
};

// ─── Icon fallback mapping ──────────────────────────────────────────
const iconFallbackMap: Record<string, string> = {
  'elec-sanaa': 'electricity', 'elec-aden': 'electricity',
  'water-sanaa': 'water', 'water-aden': 'water',
  'y-net-internet': 'y-net-internet', 'sabafon-internet': 'sabafon-internet',
};

// Telecom provider IDs that navigate to recharge screen
const telecomProviderIds = ['yemen-mobile', 'yo', 'sabafon', 'y'];

// ─── Helper: get icon for provider ──────────────────────────────────
function getIconForProvider(providerId: string): string {
  if (productIcons[providerId]) return productIcons[providerId];
  const fallbackKey = iconFallbackMap[providerId];
  if (fallbackKey && productIcons[fallbackKey]) return productIcons[fallbackKey];
  if (serviceIcons[providerId]) return serviceIcons[providerId];
  if (fallbackKey && serviceIcons[fallbackKey]) return serviceIcons[fallbackKey];
  return serviceIcons['instant-pay'] || '';
}

// ─── Helper: get product image with fallback ────────────────────────
function getProductImage(providerId: string): { src: string; isExternal: boolean } {
  const externalUrl = PRODUCT_IMAGES[providerId];
  if (externalUrl) return { src: externalUrl, isExternal: true };
  return { src: getIconForProvider(providerId), isExternal: false };
}

// ─── Helper: format price ───────────────────────────────────────────
function formatPrice(price: number): string {
  return price.toLocaleString('ar-SA');
}

// ─── Product image component with fallback ──────────────────────────
function ProductImage({ providerId, providerName, size = 'sm' }: { providerId: string; providerName: string; size?: 'sm' | 'md' | 'lg' }) {
  const { src, isExternal } = getProductImage(providerId);
  const [imgError, setImgError] = useState(false);
  const fallbackIcon = getIconForProvider(providerId);

  const sizeClass = size === 'lg' ? 'w-16 h-16' : size === 'md' ? 'w-12 h-12' : 'w-9 h-9';
  const imgSizeClass = size === 'lg' ? 'w-12 h-12' : size === 'md' ? 'w-9 h-9' : 'w-7 h-7';

  if (!isExternal || imgError) {
    return (
      <img src={fallbackIcon} alt={providerName} className={`${imgSizeClass} object-contain`} draggable={false} />
    );
  }

  return (
    <img src={src} alt={providerName} className={`${imgSizeClass} object-contain`} draggable={false} onError={() => setImgError(true)} />
  );
}

// ─── Sub-section image component ────────────────────────────────────
function SubSectionImage({ iconKey, color }: { iconKey: string; color: string }) {
  const iconSrc = productIcons[iconKey] || serviceIcons[iconKey] || productIcons['pubg'];
  const externalUrl = PRODUCT_IMAGES[iconKey];
  const [imgError, setImgError] = useState(false);

  if (externalUrl && !imgError) {
    return (
      <img src={externalUrl} alt="" className="w-10 h-10 object-contain" draggable={false} onError={() => setImgError(true)} />
    );
  }

  return (
    <img src={iconSrc} alt="" className="w-10 h-10 object-contain" draggable={false} />
  );
}

// ─── Main Component ─────────────────────────────────────────────────
export default function CategoryDetailScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const {
    selectedCategory,
    setSelectedCategory,
    providers,
    setSelectedProvider,
    setOrderOpen,
    setActiveScreen,
  } = useAppStore();

  // Navigation state: 'subsections' shows grid, 'products' shows product list
  const [viewMode, setViewMode] = useState<'subsections' | 'products'>('subsections');
  const [selectedSubSection, setSelectedSubSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Reset to subsections view when category changes
  useEffect(() => {
    setViewMode('subsections');
    setSelectedSubSection(null);
    setSearchQuery('');
    setSearchOpen(false);
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [selectedCategory]);

  // If no category selected, don't render
  if (!selectedCategory) return null;

  const categoryId = selectedCategory;
  const categoryName = categoryNames[categoryId] || categoryId;
  const subSections = categorySubSections[categoryId] || [];

  // Get providers for this category
  const categoryProviders = providers.filter(p => p.categoryId === categoryId && p.isActive);

  // Build sub-section data with resolved providers
  const resolvedSubSections = subSections.map(sub => {
    const subProviders = sub.providerIds
      .map(pid => categoryProviders.find(p => p.id === pid))
      .filter((p): p is NonNullable<typeof p> => !!p);
    return { ...sub, providers: subProviders };
  }).filter(sub => sub.providers.length > 0);

  // Get the currently selected sub-section
  const currentSubSection = resolvedSubSections.find(s => s.id === selectedSubSection);
  const currentProviders = currentSubSection?.providers || [];

  // Filter by search query
  const filteredProviders = searchQuery.trim()
    ? currentProviders.filter(p => p.name.includes(searchQuery.trim()))
    : currentProviders;

  // For categories without sub-sections, show flat grid
  const flatProviders = categoryProviders;
  const hasSubSections = resolvedSubSections.length > 1;

  // Handle provider click
  const handleProviderClick = (providerId: string) => {
    if (telecomProviderIds.includes(providerId)) {
      setActiveScreen('recharge');
      return;
    }
    const provider = providers.find(p => p.id === providerId);
    if (provider) {
      setSelectedProvider(provider);
      setOrderOpen(true);
    }
  };

  // Handle back button
  const handleBack = () => {
    if (viewMode === 'products' && hasSubSections) {
      setViewMode('subsections');
      setSelectedSubSection(null);
      setSearchQuery('');
      if (contentRef.current) contentRef.current.scrollTop = 0;
    } else {
      setSelectedCategory(null);
      setActiveScreen('main');
    }
  };

  // Handle sub-section card click
  const handleSubSectionClick = (subId: string) => {
    setSelectedSubSection(subId);
    setViewMode('products');
    setSearchQuery('');
    if (contentRef.current) contentRef.current.scrollTop = 0;
  };

  // Colors
  const cardBg = isDark ? '#1A1A1A' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? '#FFF' : '#1a1a1a';
  const secondaryTextColor = isDark ? '#AAA' : '#666';
  const subtleTextColor = isDark ? '#666' : '#999';
  const bgColor = isDark ? '#0A0A0A' : '#F5F5F5';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bgColor }}>
      {/* ─── Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-30"
        style={{
          background: bgColor,
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          {/* Back button - Right side (RTL) */}
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
          >
            <ChevronRight size={20} strokeWidth={1.5} color={isDark ? '#FFF' : '#666'} />
          </button>

          {/* Category/Sub-section name - Center */}
          <div className="text-center">
            <h1 className="text-lg font-bold" style={{ color: textColor }}>
              {viewMode === 'products' && currentSubSection ? currentSubSection.name : categoryName}
            </h1>
            {viewMode === 'products' && currentSubSection && (
              <p className="text-[10px]" style={{ color: subtleTextColor }}>{categoryName}</p>
            )}
          </div>

          {/* Search icon - Left side (RTL) */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
          >
            <Search size={20} strokeWidth={1.5} color={isDark ? '#CCC' : '#666'} />
          </button>
        </div>

        {/* Search Bar - Collapsible */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden px-4 pb-3"
            >
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                style={{
                  background: isDark ? '#1A1A1A' : '#FFFFFF',
                  border: `1px solid ${borderColor}`,
                }}
              >
                <Search size={16} strokeWidth={1.5} color={subtleTextColor} />
                <input
                  type="text"
                  placeholder="ابحث عن خدمة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: textColor }}
                  autoFocus
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-xs font-medium" style={{ color: '#E60000' }}>
                    مسح
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ─── Content ─── */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto pb-6"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <AnimatePresence mode="wait">
          {hasSubSections && viewMode === 'subsections' ? (
            /* ═══════════════════════════════════════════════
                LEVEL 1: Sub-sections Grid
                Shows sub-section cards like the home screen categories
            ═══════════════════════════════════════════════ */
            <motion.div
              key="subsections"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="px-4 pt-4"
            >
              {/* Category description */}
              <div className="mb-4">
                <p className="text-sm" style={{ color: secondaryTextColor }}>
                  اختر القسم الفرعي لعرض الخدمات المتاحة
                </p>
              </div>

              {/* Sub-sections Grid - 2 columns on small screens */}
              <div className="grid grid-cols-2 gap-3">
                {resolvedSubSections.map((sub, index) => (
                  <motion.button
                    key={sub.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.06 * index, duration: 0.35 }}
                    onClick={() => handleSubSectionClick(sub.id)}
                    whileTap={{ scale: 0.95 }}
                    className="relative overflow-hidden rounded-2xl text-right active:scale-[0.97] transition-transform"
                    style={{
                      background: cardBg,
                      border: `1px solid ${borderColor}`,
                      boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                  >
                    {/* Color accent top border */}
                    <div className="absolute top-0 right-0 left-0 h-1 rounded-t-2xl" style={{ background: sub.color }} />

                    {/* Decorative background circle */}
                    <div
                      className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-[0.06]"
                      style={{ background: sub.color }}
                    />

                    <div className="relative z-10 p-4">
                      {/* Icon */}
                      <div
                        className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center mb-3"
                        style={{
                          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        }}
                      >
                        <SubSectionImage iconKey={sub.iconKey} color={sub.color} />
                      </div>

                      {/* Name */}
                      <h3 className="text-sm font-bold mb-1" style={{ color: textColor }}>
                        {sub.name}
                      </h3>

                      {/* Description */}
                      <p
                        className="text-[10px] leading-relaxed mb-2"
                        style={{
                          color: subtleTextColor,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {sub.description}
                      </p>

                      {/* Provider count badge */}
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: `${sub.color}15`,
                            color: sub.color,
                          }}
                        >
                          {sub.providers.length} خدمة
                        </span>
                        <ChevronLeft size={14} strokeWidth={1.5} color={subtleTextColor} />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : hasSubSections && viewMode === 'products' ? (
            /* ═══════════════════════════════════════════════
                LEVEL 2: Products in selected sub-section
            ═══════════════════════════════════════════════ */
            <motion.div
              key={`products-${selectedSubSection}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Sub-section quick tabs at top (for switching between sub-sections) */}
              <div className="px-4 pt-3 pb-2">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                  {resolvedSubSections.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setSelectedSubSection(sub.id);
                        setSearchQuery('');
                        if (contentRef.current) contentRef.current.scrollTop = 0;
                      }}
                      className="shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95"
                      style={{
                        background: selectedSubSection === sub.id ? '#E60000' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        color: selectedSubSection === sub.id ? '#FFFFFF' : secondaryTextColor,
                        boxShadow: selectedSubSection === sub.id ? '0 2px 8px rgba(230,0,0,0.3)' : 'none',
                      }}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product grid */}
              {filteredProviders.length > 0 ? (
                <div className="px-4 mt-2">
                  <div
                    className="rounded-2xl p-3"
                    style={{
                      background: cardBg,
                      border: `1px solid ${borderColor}`,
                      boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div className="grid grid-cols-3 gap-2">
                      {filteredProviders.map((provider, pIndex) => {
                        const startingPrice = STARTING_PRICES[provider.id] || 0;
                        return (
                          <motion.button
                            key={provider.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.03 * pIndex, duration: 0.25 }}
                            onClick={() => handleProviderClick(provider.id)}
                            whileTap={{ scale: 0.93 }}
                            className="flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl transition-colors"
                            style={{
                              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                            }}
                          >
                            {/* Icon Container - Larger for better image display */}
                            <div
                              className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center shrink-0"
                              style={{
                                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                              }}
                            >
                              <ProductImage providerId={provider.id} providerName={provider.name} size="lg" />
                            </div>

                            {/* Provider Name */}
                            <span
                              className="text-[11px] font-semibold text-center leading-tight max-w-[90px]"
                              style={{
                                color: textColor,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {provider.name}
                            </span>

                            {/* Starting Price */}
                            {startingPrice > 0 && (
                              <span
                                className="text-[10px] font-bold"
                                style={{ color: '#E60000' }}
                              >
                                من {formatPrice(startingPrice)} ر.ي
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty state for search */
                <div className="px-4 mt-8">
                  <div
                    className="rounded-2xl p-8 flex flex-col items-center"
                    style={{ background: cardBg, border: `1px solid ${borderColor}` }}
                  >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: isDark ? '#222' : '#F5F5F5' }}>
                      <Search size={24} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} />
                    </div>
                    <p className="text-sm font-medium" style={{ color: isDark ? '#555' : '#AAA' }}>لا توجد نتائج</p>
                    <p className="text-[11px] mt-1" style={{ color: isDark ? '#444' : '#CCC' }}>جرب البحث بكلمات مختلفة</p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            /* ═══════════════════════════════════════════════
                Flat grid for categories without sub-sections
            ═══════════════════════════════════════════════ */
            <motion.div
              key="flat"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.35 }}
              className="px-4 mt-4"
            >
              {(() => {
                const displayProviders = searchQuery.trim()
                  ? flatProviders.filter(p => p.name.includes(searchQuery.trim()))
                  : flatProviders;
                return displayProviders.length > 0 ? (
                  <div
                    className="rounded-2xl p-3"
                    style={{
                      background: cardBg,
                      border: `1px solid ${borderColor}`,
                      boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div className="grid grid-cols-3 gap-2">
                      {displayProviders.map((provider, pIndex) => {
                        const startingPrice = STARTING_PRICES[provider.id] || 0;
                        return (
                          <motion.button
                            key={provider.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.03 * pIndex, duration: 0.25 }}
                            onClick={() => handleProviderClick(provider.id)}
                            whileTap={{ scale: 0.93 }}
                            className="flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl transition-colors"
                            style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                          >
                            <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center shrink-0" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                              <ProductImage providerId={provider.id} providerName={provider.name} size="lg" />
                            </div>
                            <span className="text-[11px] font-semibold text-center leading-tight max-w-[90px]" style={{ color: textColor, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {provider.name}
                            </span>
                            {startingPrice > 0 && (
                              <span className="text-[10px] font-bold" style={{ color: '#E60000' }}>
                                من {formatPrice(startingPrice)} ر.ي
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl p-8 flex flex-col items-center" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: isDark ? '#222' : '#F5F5F5' }}>
                      <Search size={24} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} />
                    </div>
                    <p className="text-sm font-medium" style={{ color: isDark ? '#555' : '#AAA' }}>لا توجد نتائج</p>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
