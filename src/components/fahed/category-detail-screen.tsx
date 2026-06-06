'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Search } from 'lucide-react';
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

// ─── Sub-sections with provider IDs ─────────────────────────────────
interface SubSection {
  id: string;
  name: string;
  providerIds: string[];
}

const categorySubSections: Record<string, SubSection[]> = {
  entertainment: [
    { id: 'shooting', name: 'ألعاب إطلاق النار', providerIds: ['pubg', 'freefire', 'call-of-duty', 'fortnite', 'valorant', 'apex-legends'] },
    { id: 'strategy', name: 'ألعاب الاستراتيجية', providerIds: ['clash-royale', 'clash-of-clans', 'league-legends'] },
    { id: 'adventure', name: 'ألعاب المغامرات', providerIds: ['roblox', 'minecraft', 'genshin-impact', 'honkai-star'] },
    { id: 'platforms', name: 'منصات الألعاب', providerIds: ['steam', 'ea-fc'] },
    { id: 'streaming', name: 'خدمات البث', providerIds: ['netflix', 'spotify', 'youtube-premium'] },
  ],
  cards: [
    { id: 'store-cards', name: 'بطاقات المتاجر', providerIds: ['google-play', 'apple-itunes', 'amazon-gift'] },
    { id: 'gaming-cards', name: 'بطاقات الألعاب', providerIds: ['psn-card', 'xbox-card', 'nintendo-card'] },
    { id: 'payment-cards', name: 'بطاقات الدفع', providerIds: ['visa-virtual', 'mastercard-virtual', 'paypal'] },
  ],
  telecom: [
    { id: 'recharge', name: 'شحن رصيد', providerIds: ['yemen-mobile', 'yo', 'sabafon', 'y'] },
    { id: 'internet-packages', name: 'باقات الإنترنت', providerIds: ['yemen-net', 'y-net-internet', 'sabafon-internet'] },
  ],
  electricity: [
    { id: 'elec', name: 'الكهرباء', providerIds: ['elec-sanaa', 'elec-aden'] },
    { id: 'water', name: 'المياه', providerIds: ['water-sanaa', 'water-aden'] },
  ],
  government: [
    { id: 'identity', name: 'الأوراق الثبوتية', providerIds: ['civil-registry', 'passport'] },
    { id: 'traffic-municipal', name: 'المرور والبلدية', providerIds: ['traffic', 'municipal'] },
  ],
  internet: [
    { id: 'providers', name: 'مزودي الإنترنت', providerIds: ['yemen-net', 'y-net-internet', 'sabafon-internet'] },
  ],
};

// ─── Product image URLs from CDN ────────────────────────────────────
const PRODUCT_IMAGES: Record<string, string> = {
  // Gaming
  'pubg': 'https://img.seerlab.com/imgs/pubg-mobile.png',
  'freefire': 'https://img.seerlab.com/imgs/free-fire.png',
  'call-of-duty': 'https://img.seerlab.com/imgs/call-of-duty-mobile.png',
  'fortnite': 'https://img.seerlab.com/imgs/fortnite.png',
  'valorant': 'https://img.seerlab.com/imgs/valorant.png',
  'apex-legends': 'https://img.seerlab.com/imgs/apex-legends.png',
  'clash-royale': 'https://img.seerlab.com/imgs/clash-royale.png',
  'clash-of-clans': 'https://img.seerlab.com/imgs/clash-of-clans.png',
  'league-legends': 'https://img.seerlab.com/imgs/league-of-legends.png',
  'roblox': 'https://img.seerlab.com/imgs/roblox.png',
  'minecraft': 'https://img.seerlab.com/imgs/minecraft.png',
  'genshin-impact': 'https://img.seerlab.com/imgs/genshin-impact.png',
  'honkai-star': 'https://img.seerlab.com/imgs/honkai-star-rail.png',
  'steam': 'https://img.seerlab.com/imgs/steam.png',
  'ea-fc': 'https://img.seerlab.com/imgs/ea-fc.png',

  // Streaming
  'netflix': 'https://img.seerlab.com/imgs/netflix.png',
  'spotify': 'https://img.seerlab.com/imgs/spotify.png',
  'youtube-premium': 'https://img.seerlab.com/imgs/youtube-premium.png',

  // Digital Cards
  'google-play': 'https://img.seerlab.com/imgs/google-play.png',
  'apple-itunes': 'https://img.seerlab.com/imgs/apple-itunes.png',
  'amazon-gift': 'https://img.seerlab.com/imgs/amazon.png',
  'psn-card': 'https://img.seerlab.com/imgs/playstation.png',
  'xbox-card': 'https://img.seerlab.com/imgs/xbox.png',
  'nintendo-card': 'https://img.seerlab.com/imgs/nintendo.png',
  'visa-virtual': 'https://img.seerlab.com/imgs/visa.png',
  'mastercard-virtual': 'https://img.seerlab.com/imgs/mastercard.png',
  'paypal': 'https://img.seerlab.com/imgs/paypal.png',
};

// ─── Starting prices (lowest package price per provider) ────────────
const STARTING_PRICES: Record<string, number> = {
  // Gaming - Shooting
  'pubg': 1200,
  'freefire': 800,
  'call-of-duty': 1500,
  'fortnite': 2000,
  'valorant': 1800,
  'apex-legends': 1500,
  // Gaming - Strategy
  'clash-royale': 1000,
  'clash-of-clans': 1000,
  'league-legends': 2000,
  // Gaming - Adventure
  'roblox': 900,
  'minecraft': 2500,
  'genshin-impact': 1500,
  'honkai-star': 1500,
  // Gaming - Platforms
  'steam': 5000,
  'ea-fc': 3000,
  // Streaming
  'netflix': 3500,
  'spotify': 2500,
  'youtube-premium': 3000,
  // Digital Cards - Store
  'google-play': 3000,
  'apple-itunes': 3500,
  'amazon-gift': 3000,
  // Digital Cards - Gaming
  'psn-card': 6000,
  'xbox-card': 6000,
  'nintendo-card': 6000,
  // Digital Cards - Payment
  'visa-virtual': 5000,
  'mastercard-virtual': 5000,
  'paypal': 5000,
  // Telecom
  'yemen-mobile': 100,
  'yo': 100,
  'sabafon': 100,
  'y': 100,
  // Internet
  'yemen-net': 150,
  'y-net-internet': 250,
  'sabafon-internet': 400,
  // Electricity
  'elec-sanaa': 500,
  'elec-aden': 500,
  // Water
  'water-sanaa': 300,
  'water-aden': 300,
  // Government
  'civil-registry': 1000,
  'passport': 5000,
  'traffic': 500,
  'municipal': 500,
};

// ─── Icon fallback mapping ──────────────────────────────────────────
const iconFallbackMap: Record<string, string> = {
  'elec-sanaa': 'electricity',
  'elec-aden': 'electricity',
  'water-sanaa': 'water',
  'water-aden': 'water',
  'y-net-internet': 'y-net-internet',
  'sabafon-internet': 'sabafon-internet',
};

// Telecom provider IDs that navigate to recharge screen
const telecomProviderIds = ['yemen-mobile', 'yo', 'sabafon', 'y'];

// ─── Helper: get icon for provider ──────────────────────────────────
function getIconForProvider(providerId: string): string {
  // 1. Check productIcons first
  if (productIcons[providerId]) return productIcons[providerId];
  // 2. Check iconFallbackMap → productIcons
  const fallbackKey = iconFallbackMap[providerId];
  if (fallbackKey && productIcons[fallbackKey]) return productIcons[fallbackKey];
  // 3. Check serviceIcons
  if (serviceIcons[providerId]) return serviceIcons[providerId];
  // 4. Fallback key → serviceIcons
  if (fallbackKey && serviceIcons[fallbackKey]) return serviceIcons[fallbackKey];
  // 5. Generic fallback
  return serviceIcons['instant-pay'] || '';
}

// ─── Helper: get product image with fallback ────────────────────────
function getProductImage(providerId: string): { src: string; isExternal: boolean } {
  const externalUrl = PRODUCT_IMAGES[providerId];
  if (externalUrl) {
    return { src: externalUrl, isExternal: true };
  }
  return { src: getIconForProvider(providerId), isExternal: false };
}

// ─── Helper: format price ───────────────────────────────────────────
function formatPrice(price: number): string {
  return price.toLocaleString('ar-SA');
}

// ─── Product image component with fallback ──────────────────────────
function ProductImage({ providerId, providerName }: { providerId: string; providerName: string }) {
  const { src, isExternal } = getProductImage(providerId);
  const [imgError, setImgError] = useState(false);
  const fallbackIcon = getIconForProvider(providerId);

  // If external image failed or no external URL, use SVG fallback
  if (!isExternal || imgError) {
    return (
      <img
        src={fallbackIcon}
        alt={providerName}
        className="w-9 h-9 object-contain"
        draggable={false}
      />
    );
  }

  return (
    <img
      src={src}
      alt={providerName}
      className="w-9 h-9 object-contain"
      draggable={false}
      onError={() => setImgError(true)}
    />
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

  const [activeSubSection, setActiveSubSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll to top on mount
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, []);

  // If no category selected, don't render
  if (!selectedCategory) return null;

  const categoryId = selectedCategory;
  const categoryName = categoryNames[categoryId] || categoryId;
  const subSections = categorySubSections[categoryId] || [];

  // Get providers for this category
  const categoryProviders = providers.filter(p => p.categoryId === categoryId && p.isActive);

  // Set default active sub-section
  const effectiveActiveSub = activeSubSection || (subSections.length > 0 ? subSections[0].id : null);

  // Build sub-section data with resolved providers
  const resolvedSubSections = subSections.map(sub => {
    const subProviders = sub.providerIds
      .map(pid => categoryProviders.find(p => p.id === pid))
      .filter((p): p is NonNullable<typeof p> => !!p);
    return {
      ...sub,
      providers: subProviders,
    };
  }).filter(sub => sub.providers.length > 0);

  // Filter by search query
  const filteredSubSections = searchQuery.trim()
    ? resolvedSubSections.map(sub => ({
        ...sub,
        providers: sub.providers.filter(p => p.name.includes(searchQuery.trim())),
      })).filter(sub => sub.providers.length > 0)
    : resolvedSubSections;

  // For categories without sub-sections, just show flat grid
  const flatProviders = categoryProviders;

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
    setSelectedCategory(null);
    setActiveScreen('main');
  };

  // Handle sub-section tab click - scroll to that section
  const handleSubSectionClick = (subId: string) => {
    setActiveSubSection(subId);
    const element = document.getElementById(`subsection-${subId}`);
    if (element && contentRef.current) {
      const container = contentRef.current;
      const elementTop = element.offsetTop - container.offsetTop - 10;
      container.scrollTo({ top: elementTop, behavior: 'smooth' });
    }
  };

  // Colors
  const cardBg = isDark ? '#1A1A1A' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? '#FFF' : '#1a1a1a';
  const secondaryTextColor = isDark ? '#AAA' : '#666';
  const subtleTextColor = isDark ? '#666' : '#999';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: isDark ? '#0A0A0A' : '#F5F5F5' }}>
      {/* ─── Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-30"
        style={{
          background: isDark ? '#0A0A0A' : '#F5F5F5',
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

          {/* Category name - Center */}
          <h1 className="text-xl font-bold absolute left-1/2 -translate-x-1/2" style={{ color: textColor }}>
            {categoryName}
          </h1>

          {/* Search icon - Left side (RTL) */}
          <button
            onClick={() => {
              const searchInput = document.getElementById('category-search-input');
              if (searchInput) searchInput.focus();
            }}
            className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
          >
            <Search size={20} strokeWidth={1.5} color={isDark ? '#CCC' : '#666'} />
          </button>
        </div>

        {/* Search Bar - Collapsible */}
        <AnimatePresence>
          {searchQuery.trim() !== '' && (
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
                  id="category-search-input"
                  type="text"
                  placeholder="ابحث عن خدمة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: textColor }}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs font-medium"
                    style={{ color: '#E60000' }}
                  >
                    مسح
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sub-section tabs - Horizontal scrollable chips */}
        {resolvedSubSections.length > 1 && (
          <div
            ref={scrollContainerRef}
            className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide"
            style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
          >
            {resolvedSubSections.map((sub) => (
              <button
                key={sub.id}
                onClick={() => handleSubSectionClick(sub.id)}
                className="shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95"
                style={{
                  background: effectiveActiveSub === sub.id
                    ? '#E60000'
                    : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  color: effectiveActiveSub === sub.id
                    ? '#FFFFFF'
                    : secondaryTextColor,
                  boxShadow: effectiveActiveSub === sub.id
                    ? '0 2px 8px rgba(230,0,0,0.3)'
                    : 'none',
                }}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* ─── Content ─── */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto pb-6"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {resolvedSubSections.length > 0 ? (
          /* Render with sub-sections */
          filteredSubSections.map((sub, subIndex) => (
            <motion.div
              key={sub.id}
              id={`subsection-${sub.id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * subIndex, duration: 0.35 }}
              className="px-4 mt-4"
            >
              {/* Sub-section header */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-1 h-4 rounded-full"
                  style={{ background: '#E60000' }}
                />
                <h3
                  className="text-sm font-bold"
                  style={{ color: textColor }}
                >
                  {sub.name}
                </h3>
              </div>

              {/* Product grid - 4 columns */}
              <div
                className="rounded-2xl p-3"
                style={{
                  background: cardBg,
                  border: `1px solid ${borderColor}`,
                  boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                <div className="grid grid-cols-4 gap-x-1 gap-y-3">
                  {sub.providers.map((provider, pIndex) => {
                    const startingPrice = STARTING_PRICES[provider.id] || 0;
                    return (
                      <motion.button
                        key={provider.id}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.02 * pIndex, duration: 0.2 }}
                        onClick={() => handleProviderClick(provider.id)}
                        whileTap={{ scale: 0.92 }}
                        className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl transition-colors"
                        style={{
                          background: 'transparent',
                        }}
                      >
                        {/* Icon Container */}
                        <div
                          className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center shrink-0"
                          style={{
                            background: isDark
                              ? 'rgba(255,255,255,0.05)'
                              : 'rgba(0,0,0,0.03)',
                          }}
                        >
                          <ProductImage providerId={provider.id} providerName={provider.name} />
                        </div>

                        {/* Provider Name */}
                        <span
                          className="text-[10px] font-medium text-center leading-tight max-w-[72px]"
                          style={{
                            color: secondaryTextColor,
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
                            className="text-[9px] font-bold"
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

              {/* Divider between sub-sections (not after last one) */}
              {subIndex < filteredSubSections.length - 1 && (
                <div
                  className="my-3 mx-4"
                  style={{
                    height: '1px',
                    background: dividerColor,
                  }}
                />
              )}
            </motion.div>
          ))
        ) : (
          /* Flat grid for categories without sub-sections */
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.35 }}
            className="px-4 mt-4"
          >
            <div
              className="rounded-2xl p-3"
              style={{
                background: cardBg,
                border: `1px solid ${borderColor}`,
                boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              <div className="grid grid-cols-4 gap-x-1 gap-y-3">
                {flatProviders.map((provider, pIndex) => {
                  const startingPrice = STARTING_PRICES[provider.id] || 0;
                  return (
                    <motion.button
                      key={provider.id}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.02 * pIndex, duration: 0.2 }}
                      onClick={() => handleProviderClick(provider.id)}
                      whileTap={{ scale: 0.92 }}
                      className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl transition-colors"
                    >
                      {/* Icon Container */}
                      <div
                        className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center shrink-0"
                        style={{
                          background: isDark
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(0,0,0,0.03)',
                        }}
                      >
                        <ProductImage providerId={provider.id} providerName={provider.name} />
                      </div>

                      {/* Provider Name */}
                      <span
                        className="text-[10px] font-medium text-center leading-tight max-w-[72px]"
                        style={{
                          color: secondaryTextColor,
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
                          className="text-[9px] font-bold"
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
          </motion.div>
        )}

        {/* Empty state when search yields no results */}
        {filteredSubSections.length === 0 && searchQuery.trim() && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 mt-8"
          >
            <div
              className="rounded-2xl p-8 flex flex-col items-center"
              style={{
                background: cardBg,
                border: `1px solid ${borderColor}`,
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: isDark ? '#222' : '#F5F5F5' }}
              >
                <Search size={24} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} />
              </div>
              <p className="text-sm font-medium" style={{ color: isDark ? '#555' : '#AAA' }}>
                لا توجد نتائج
              </p>
              <p className="text-[11px] mt-1" style={{ color: isDark ? '#444' : '#CCC' }}>
                جرب البحث بكلمات مختلفة
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
