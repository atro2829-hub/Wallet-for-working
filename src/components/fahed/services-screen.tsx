'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronLeft, Wallet } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { productIcons } from '@/lib/product-icons';
import { serviceIcons } from '@/lib/service-icons';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import type { ApiProviderConfig } from '@/lib/api-provider';

// Category display order with display names
const categoryOrder = [
  { id: 'service-providers', name: 'مزودين الخدمات' },
  { id: 'wallet-services', name: 'خدمات المحفظة الخاصة بنا' },
  { id: 'telecom', name: 'خدمات الاتصالات' },
  { id: 'internet', name: 'الإنترنت' },
  { id: 'electricity', name: 'الكهرباء والماء' },
  { id: 'government', name: 'خدمات حكومية' },
];

// Wallet Private Services: wraps ALL existing entertainment + card sub-sections
const walletPrivateServicesSubSections = [
  { id: 'shooting', name: 'ألعاب إطلاق النار', providerIds: ['pubg', 'freefire', 'call-of-duty', 'fortnite', 'apex-legends', 'valorant'] },
  { id: 'strategy', name: 'ألعاب الاستراتيجية', providerIds: ['clash-royale', 'clash-of-clans', 'league-legends'] },
  { id: 'adventure', name: 'ألعاب المغامرات', providerIds: ['roblox', 'minecraft', 'genshin-impact', 'honkai-star'] },
  { id: 'platforms', name: 'منصات الألعاب', providerIds: ['steam', 'ea-fc'] },
  { id: 'streaming', name: 'خدمات البث', providerIds: ['netflix', 'spotify', 'youtube-premium'] },
  { id: 'store-cards', name: 'بطاقات المتاجر', providerIds: ['google-play', 'apple-itunes', 'amazon-gift'] },
  { id: 'gaming-cards', name: 'بطاقات الألعاب', providerIds: ['psn-card', 'xbox-card', 'nintendo-card'] },
  { id: 'payment-cards', name: 'بطاقات الدفع', providerIds: ['visa-virtual', 'mastercard-virtual', 'paypal'] },
];

// Sub-sections mapping for other categories (non-wallet)
const categorySubSections: Record<string, { id: string; name: string; providerIds: string[] }[]> = {
  'service-providers': [],
  telecom: [],
  electricity: [
    { id: 'elec', name: 'الكهرباء', providerIds: ['elec-sanaa', 'elec-aden'] },
    { id: 'water', name: 'المياه', providerIds: ['water-sanaa', 'water-aden'] },
  ],
  government: [
    { id: 'identity', name: 'الأوراق الثبوتية', providerIds: ['civil-registry', 'passport'] },
    { id: 'traffic-municipal', name: 'المرور والبلدية', providerIds: ['traffic', 'municipal'] },
  ],
  internet: [],
};

// Icon fallback mapping for providers without dedicated product icons
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

// Maximum items shown in compact (collapsed) view per section
const COMPACT_LIMIT = 8;

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

export default function ServicesScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const {
    providers,
    categories,
    setSelectedProvider,
    setOrderOpen,
    setActiveScreen,
    setSelectedCategory,
  } = useAppStore();

  const [visibilitySections, setVisibilitySections] = useState<Record<string, boolean>>({});
  const [visibilityProviders, setVisibilityProviders] = useState<Record<string, boolean>>({});
  const [apiProviders, setApiProviders] = useState<ApiProviderConfig[]>([]);

  // Firebase visibility settings listener
  useEffect(() => {
    const visRef = ref(database, 'adminSettings/visibility');
    const unsubscribe = onValue(visRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.sections) setVisibilitySections(data.sections);
        if (data.providers) setVisibilityProviders(data.providers);
      }
    }, (error) => {
      console.error('Firebase visibility error:', error);
    });

    // Also listen to legacy sectionVisibility for backward compatibility
    const legacyRef = ref(database, 'adminSettings/sectionVisibility');
    const unsubLegacy = onValue(legacyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setVisibilitySections(prev => ({ ...prev, ...data }));
      }
    });

    return () => { unsubscribe(); unsubLegacy(); };
  }, []);

  // Firebase API providers listener
  useEffect(() => {
    const apiProvidersRef = ref(database, 'adminSettings/apiProviders');
    const unsub = onValue(apiProvidersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const providersList: ApiProviderConfig[] = Object.values(data)
          .filter((p: any) => p.isActive)
          .map((p: any) => ({
            id: p.id || '',
            name: p.name || '',
            baseUrl: p.baseUrl || '',
            apiKey: p.apiKey || '',
            apiSecret: p.apiSecret || '',
            method: p.method || 'POST',
            headers: p.headers || {},
            bodyTemplate: p.bodyTemplate || '',
            responseFormat: p.responseFormat || 'json',
            fieldMappings: p.fieldMappings || undefined,
            isActive: p.isActive !== false,
            createdAt: p.createdAt || '',
            sectionName: p.sectionName || '',
            sectionId: p.sectionId || '',
            sectionIcon: p.sectionIcon || '',
          }));
        setApiProviders(providersList);
      } else {
        setApiProviders([]);
      }
    }, (error) => {
      console.error('Firebase API providers error:', error);
    });

    return () => unsub();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const dividerColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
  const cardStyle = {
    background: isDark ? '#1A1A1A' : '#FFFFFF',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
    boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.04)',
  };

  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleProviderClick = (providerId: string) => {
    // Telecom providers go to recharge screen
    if (telecomProviderIds.includes(providerId)) {
      setActiveScreen('recharge');
      return;
    }
    // Other providers open the order bottom sheet
    const provider = providers.find(p => p.id === providerId);
    if (provider) {
      setSelectedProvider(provider);
      setOrderOpen(true);
    }
  };

  // Build Wallet Private Services section (wraps all wallet-services providers)
  const buildWalletPrivateServices = () => {
    const walletProviders = providers.filter(
      p => p.categoryId === 'wallet-services' && p.isActive && visibilityProviders[p.id] !== false
    );

    if (walletProviders.length === 0) return null;

    const subSections = walletPrivateServicesSubSections
      .map(sub => {
        const subProviders = sub.providerIds
          .map(pid => walletProviders.find(p => p.id === pid))
          .filter((p): p is NonNullable<typeof p> => !!p);
        return { id: sub.id, name: sub.name, providers: subProviders };
      })
      .filter(sub => sub.providers.length > 0);

    return {
      id: 'wallet-services',
      name: 'خدمات المحفظة الخاصة بنا',
      providers: walletProviders,
      subSections,
      isWalletSection: true as const,
    };
  };

  // Build API provider sections
  const buildApiProviderSections = () => {
    return apiProviders
      .filter(ap => ap.sectionName && ap.sectionId)
      .map(ap => {
        // Find providers associated with this API provider
        const apProviders = providers.filter(
          p => p.categoryId === `api-${ap.sectionId}` && p.isActive && visibilityProviders[p.id] !== false
        );
        if (apProviders.length === 0) return null;
        return {
          id: `api-${ap.sectionId}`,
          name: ap.sectionName!,
          providers: apProviders,
          subSections: null,
          isWalletSection: false as const,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  };

  // Build other (non-wallet) sections
  const buildOtherSections = () => {
    return categoryOrder
      .filter(cat => cat.id !== 'wallet-services') // wallet-services is handled by buildWalletPrivateServices
      .filter(cat => visibilitySections[cat.id] !== false)
      .map(cat => {
        const catProviders = providers.filter(p => p.categoryId === cat.id && p.isActive && visibilityProviders[p.id] !== false);
        return {
          id: cat.id,
          name: cat.name,
          providers: catProviders,
          subSections: null as any,
          isWalletSection: false as const,
        };
      })
      .filter(section => section.providers.length > 0 || section.id === 'service-providers'); // show service-providers even if empty
  };

  // Combine all sections: Wallet Private → API Provider sections → Other sections
  const allSections = [
    ...(buildWalletPrivateServices() ? [buildWalletPrivateServices()!] : []),
    ...buildApiProviderSections(),
    ...buildOtherSections(),
  ];

  // Filter by search query
  const filteredSections = searchQuery.trim()
    ? allSections
        .map(section => ({
          ...section,
          providers: section.providers.filter(p =>
            p.name.includes(searchQuery.trim())
          ),
        }))
        .filter(section => section.providers.length > 0)
    : allSections;

  // Helper: build sub-section data for a category (non-wallet)
  const buildSubSections = (
    categoryId: string,
    catProviders: typeof providers
  ) => {
    const subDefs = categorySubSections[categoryId];
    if (!subDefs || subDefs.length === 0) return null;

    return subDefs
      .map(sub => {
        const subProviders = sub.providerIds
          .map(pid => catProviders.find(p => p.id === pid))
          .filter((p): p is NonNullable<typeof p> => !!p);
        return {
          id: sub.id,
          name: sub.name,
          providers: subProviders,
        };
      })
      .filter(sub => sub.providers.length > 0);
  };

  // Helper: flatten sub-sections into a single provider list (preserving order)
  const flattenSubSectionProviders = (
    subSections: { id: string; name: string; providers: typeof providers }[]
  ) => {
    const result: typeof providers = [];
    for (const sub of subSections) {
      result.push(...sub.providers);
    }
    return result;
  };

  // Render a provider grid item
  const renderProviderItem = (provider: typeof providers[number], index: number) => {
    const iconSrc = getIconForProvider(provider.id);
    return (
      <motion.button
        key={provider.id}
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ delay: 0.02 * index, duration: 0.25 }}
        onClick={() => handleProviderClick(provider.id)}
        whileTap={{ scale: 0.92 }}
        className="flex flex-col items-center justify-center gap-1.5 py-2"
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
          <img
            src={iconSrc}
            alt={provider.name}
            className="w-10 h-10 object-contain"
            draggable={false}
          />
        </div>
        {/* Provider Name */}
        <span
          className="text-[10px] font-medium text-center leading-tight max-w-[72px]"
          style={{
            color: isDark ? '#BBB' : '#555',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {provider.name}
        </span>
      </motion.button>
    );
  };

  // Render sub-sections inside a section
  const renderSubSections = (
    subSections: { id: string; name: string; providers: typeof providers }[],
    isExpanded: boolean
  ) => {
    // For collapsed view, limit total providers
    let displaySubSections = subSections;
    if (!isExpanded) {
      let remaining = COMPACT_LIMIT;
      displaySubSections = subSections.map(sub => {
        const take = Math.min(sub.providers.length, remaining);
        remaining -= take;
        return {
          ...sub,
          providers: sub.providers.slice(0, take),
        };
      }).filter(sub => sub.providers.length > 0);
    }

    return (
      <AnimatePresence mode="popLayout">
        {displaySubSections.map((sub, subIndex) => {
          let itemIndexOffset = 0;
          for (let i = 0; i < subIndex; i++) {
            itemIndexOffset += displaySubSections[i].providers.length;
          }

          return (
            <div key={sub.id}>
              {/* Sub-section header */}
              <div
                className={`mb-2 pr-2 ${subIndex === 0 ? '' : 'mt-3'}`}
                style={{
                  borderRight: '2px solid #E60000',
                }}
              >
                <span
                  className="text-xs font-semibold"
                  style={{ color: isDark ? '#AAA' : '#666' }}
                >
                  {sub.name}
                </span>
              </div>

              {/* Provider grid for this sub-section */}
              <div className="grid grid-cols-4 gap-x-2 gap-y-4">
                {sub.providers.map((provider, pIndex) =>
                  renderProviderItem(provider, itemIndexOffset + pIndex)
                )}
              </div>

              {/* Divider between sub-sections (not after last one) */}
              {subIndex < displaySubSections.length - 1 && (
                <div
                  className="my-3"
                  style={{
                    height: '1px',
                    background: dividerColor,
                  }}
                />
              )}
            </div>
          );
        })}
      </AnimatePresence>
    );
  };

  return (
    <div className="pb-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="px-4 pt-4 pb-3"
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
            القائمة
          </h1>
        </div>

        {/* Search Bar */}
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-2xl"
          style={{
            background: isDark ? '#1A1A1A' : '#F0F0F0',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
          }}
        >
          <Search size={18} strokeWidth={1.5} color={isDark ? '#555' : '#AAA'} />
          <input
            type="text"
            placeholder="ابحث عن خدمة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
          />
        </div>
      </motion.div>

      {/* Category Sections */}
      {filteredSections.map((section, sectionIndex) => {
        const isExpanded = expandedCategories.has(section.id) || !!searchQuery.trim();
        const hasSubSections = section.isWalletSection
          ? section.subSections && section.subSections.length > 0
          : buildSubSections(section.id, section.providers) !== null;

        const subSections = section.isWalletSection
          ? section.subSections
          : buildSubSections(section.id, section.providers);

        // Determine total provider count and display providers
        const totalProviders = section.providers.length;
        const hasMore = totalProviders > COMPACT_LIMIT;

        // For categories with sub-sections, compute display
        let displayFlatProviders: typeof section.providers | null = null;

        if (hasSubSections && subSections) {
          // Sub-sections handle their own display in renderSubSections
        } else {
          // No sub-sections: flat grid
          displayFlatProviders = isExpanded
            ? section.providers
            : section.providers.slice(0, COMPACT_LIMIT);
        }

        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * sectionIndex, duration: 0.4 }}
            className="px-4 mt-4"
          >
            {/* Section Header */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => {
                  setSelectedCategory(section.id);
                  setActiveScreen('category-detail');
                }}
                className="active:scale-95 transition-transform"
              >
                <h3
                  className="text-sm font-bold flex items-center gap-1.5"
                  style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                >
                  {section.isWalletSection && (
                    <Wallet size={14} strokeWidth={2} color="#E60000" />
                  )}
                  {section.name}
                </h3>
              </button>
              {hasMore && !searchQuery.trim() && (
                <button
                  onClick={() => toggleCategoryExpand(section.id)}
                  className="text-xs font-medium flex items-center gap-0.5 active:scale-95 transition-transform"
                  style={{ color: '#E60000' }}
                >
                  {isExpanded ? 'إخفاء' : 'الكل'}
                  <ChevronLeft
                    size={14}
                    strokeWidth={1.5}
                    style={{
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>
              )}
            </div>

            {/* Provider Content */}
            <div
              className="rounded-2xl p-4"
              style={cardStyle}
            >
              {hasSubSections && subSections ? (
                /* Render with sub-sections */
                renderSubSections(subSections, isExpanded)
              ) : (
                /* Render flat grid (no sub-sections) */
                <div className="grid grid-cols-4 gap-x-2 gap-y-4">
                  <AnimatePresence mode="popLayout">
                    {displayFlatProviders!.map((provider, index) =>
                      renderProviderItem(provider, index)
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}

      {/* Empty state when search yields no results */}
      {filteredSections.length === 0 && searchQuery.trim() && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 mt-8"
        >
          <div
            className="rounded-2xl p-8 flex flex-col items-center"
            style={cardStyle}
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
  );
}
