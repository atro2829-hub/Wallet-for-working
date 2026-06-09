'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, get, Unsubscribe } from 'firebase/database';
import {
  useAppStore,
  type CardColor,
  type MaintenanceMode,
  type ForceUpdate,
  type InvestmentPlan,
} from '@/lib/store';

// ─── Types for settings NOT yet in the Zustand store ───────────────────────

export interface VisibilitySettings {
  sections: Record<string, boolean>;
  providers: Record<string, boolean>;
  features: Record<string, boolean>;
}

export interface SocialLinks {
  whatsapp: string;
  contactAdmin: string;
  contactAdminMessage: string;
}

export interface Banner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  order: number;
  url?: string;
  link?: string;
  urlType?: string;
}

export interface Section {
  id: string;
  name: string;
  iconKey: string;
  order: number;
  isVisible: boolean;
  categoryId: string;
}

// ─── Firebase path constants ───────────────────────────────────────────────

const PATHS = {
  cardColors: 'adminSettings/cardColors',
  maintenance: 'adminSettings/maintenance',
  forceUpdate: 'adminSettings/forceUpdate',
  visibility: 'adminSettings/visibility',
  investmentPlans: 'adminSettings/investmentPlans',
  exchangeRates: 'adminSettings/exchangeRates',
  socialLinks: 'adminSettings/socialLinks',
  banners: 'adminSettings/banners',
  sections: 'ownerSettings/sections',
} as const;

// ─── Default values ────────────────────────────────────────────────────────

const defaultVisibility: VisibilitySettings = {
  sections: {},
  providers: {},
  features: {},
};

const defaultSocialLinks: SocialLinks = {
  whatsapp: '',
  contactAdmin: '',
  contactAdminMessage: '',
};

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useAdminSettings() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  // Local state for settings NOT in the Zustand store
  const [visibilitySettings, setVisibilitySettings] = useState<VisibilitySettings>(defaultVisibility);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(defaultSocialLinks);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  // Track loading state
  const [isLoading, setIsLoading] = useState(true);

  // Keep refs to unsubscribers so we can tear them down
  const unsubscribersRef = useRef<Map<string, Unsubscribe>>(new Map());

  // ─── Helper: convert Firebase banners object → sorted array ────────────
  const parseBanners = useCallback((raw: Record<string, any> | null): Banner[] => {
    if (!raw) return [];
    return Object.entries(raw)
      .map(([id, val]) => ({
        id,
        title: val?.title ?? '',
        description: val?.description ?? '',
        imageUrl: val?.imageUrl ?? '',
        isActive: val?.isActive ?? false,
        order: val?.order ?? 0,
        url: val?.url,
        link: val?.link,
        urlType: val?.urlType,
      }))
      .filter((b) => b.isActive)
      .sort((a, b) => a.order - b.order);
  }, []);

  // ─── Helper: convert Firebase sections object → sorted array ──────────
  const parseSections = useCallback((raw: Record<string, any> | null): Section[] => {
    if (!raw) return [];
    return Object.entries(raw)
      .map(([id, val]) => ({
        id,
        name: val?.name ?? '',
        iconKey: val?.iconKey ?? '',
        order: val?.order ?? 0,
        isVisible: val?.isVisible ?? true,
        categoryId: val?.categoryId ?? '',
      }))
      .sort((a, b) => a.order - b.order);
  }, []);

  // ─── Attach a single real-time listener ────────────────────────────────
  const attachListener = useCallback(
    (pathKey: string, path: string, handler: (snapshot: any) => void) => {
      const dbRef = ref(database, path);
      const unsubscribe = onValue(dbRef, handler, (error) => {
        console.error(`[useAdminSettings] onValue error on "${path}":`, error);
      });
      unsubscribersRef.current.set(pathKey, unsubscribe);
    },
    [],
  );

  // ─── Set up all listeners ──────────────────────────────────────────────
  const setupListeners = useCallback(() => {
    const store = useAppStore.getState();

    // 1. Card colors
    attachListener('cardColors', PATHS.cardColors, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        store.setCardColors(data as CardColor);
      }
    });

    // 2. Maintenance mode
    attachListener('maintenance', PATHS.maintenance, (snapshot) => {
      const data = snapshot.val();
      store.setMaintenance(data as MaintenanceMode | null);
    });

    // 3. Force update
    attachListener('forceUpdate', PATHS.forceUpdate, (snapshot) => {
      const data = snapshot.val();
      store.setForceUpdate(data as ForceUpdate | null);
    });

    // 4. Visibility settings
    attachListener('visibility', PATHS.visibility, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setVisibilitySettings({
          sections: data.sections ?? {},
          providers: data.providers ?? {},
          features: data.features ?? {},
        });
      } else {
        setVisibilitySettings(defaultVisibility);
      }
    });

    // 5. Investment plans
    attachListener('investmentPlans', PATHS.investmentPlans, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Firebase stores arrays as objects with numeric keys sometimes;
        // normalise to a flat array of InvestmentPlan
        const plans: InvestmentPlan[] = Array.isArray(data)
          ? data.filter(Boolean)
          : Object.values(data).filter(Boolean);
        store.setInvestmentPlans(plans);
      } else {
        store.setInvestmentPlans([]);
      }
    });

    // 6. Exchange rates
    attachListener('exchangeRates', PATHS.exchangeRates, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        store.setExchangeRates({
          YER: data.YER ?? 1,
          SAR: data.SAR ?? 1,
          USD: data.USD ?? 1,
        });
      }
    });

    // 7. Social links
    attachListener('socialLinks', PATHS.socialLinks, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSocialLinks({
          whatsapp: data.whatsapp ?? '',
          contactAdmin: data.contactAdmin ?? '',
          contactAdminMessage: data.contactAdminMessage ?? '',
        });
      } else {
        setSocialLinks(defaultSocialLinks);
      }
    });

    // 8. Banners
    attachListener('banners', PATHS.banners, (snapshot) => {
      const data = snapshot.val();
      setBanners(parseBanners(data));
    });

    // 9. Sections / categories (owner settings)
    attachListener('sections', PATHS.sections, (snapshot) => {
      const data = snapshot.val();
      setSections(parseSections(data));
    });
  }, [attachListener, parseBanners, parseSections]);

  // ─── Tear down all listeners ───────────────────────────────────────────
  const teardownListeners = useCallback(() => {
    unsubscribersRef.current.forEach((unsubscribe) => unsubscribe());
    unsubscribersRef.current.clear();
  }, []);

  // ─── Lifecycle: attach / detach based on auth state ────────────────────
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      setupListeners();
      // Allow a short grace period for first callbacks to arrive
      const timer = setTimeout(() => setIsLoading(false), 1500);
      return () => {
        clearTimeout(timer);
        teardownListeners();
      };
    } else {
      teardownListeners();
      setIsLoading(false);
    }
  }, [isAuthenticated, setupListeners, teardownListeners]);

  // ─── Manual refresh (pull-to-refresh) ──────────────────────────────────
  const refreshAll = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    const store = useAppStore.getState();

    const fetchPromises: Promise<void>[] = [
      // 1. Card colors
      get(ref(database, PATHS.cardColors)).then((snap) => {
        const data = snap.val();
        if (data) store.setCardColors(data as CardColor);
      }),

      // 2. Maintenance
      get(ref(database, PATHS.maintenance)).then((snap) => {
        store.setMaintenance(snap.val() as MaintenanceMode | null);
      }),

      // 3. Force update
      get(ref(database, PATHS.forceUpdate)).then((snap) => {
        store.setForceUpdate(snap.val() as ForceUpdate | null);
      }),

      // 4. Visibility
      get(ref(database, PATHS.visibility)).then((snap) => {
        const data = snap.val();
        if (data) {
          setVisibilitySettings({
            sections: data.sections ?? {},
            providers: data.providers ?? {},
            features: data.features ?? {},
          });
        } else {
          setVisibilitySettings(defaultVisibility);
        }
      }),

      // 5. Investment plans
      get(ref(database, PATHS.investmentPlans)).then((snap) => {
        const data = snap.val();
        if (data) {
          const plans: InvestmentPlan[] = Array.isArray(data)
            ? data.filter(Boolean)
            : Object.values(data).filter(Boolean);
          store.setInvestmentPlans(plans);
        } else {
          store.setInvestmentPlans([]);
        }
      }),

      // 6. Exchange rates
      get(ref(database, PATHS.exchangeRates)).then((snap) => {
        const data = snap.val();
        if (data) {
          store.setExchangeRates({
            YER: data.YER ?? 1,
            SAR: data.SAR ?? 1,
            USD: data.USD ?? 1,
          });
        }
      }),

      // 7. Social links
      get(ref(database, PATHS.socialLinks)).then((snap) => {
        const data = snap.val();
        if (data) {
          setSocialLinks({
            whatsapp: data.whatsapp ?? '',
            contactAdmin: data.contactAdmin ?? '',
            contactAdminMessage: data.contactAdminMessage ?? '',
          });
        } else {
          setSocialLinks(defaultSocialLinks);
        }
      }),

      // 8. Banners
      get(ref(database, PATHS.banners)).then((snap) => {
        setBanners(parseBanners(snap.val()));
      }),

      // 9. Sections
      get(ref(database, PATHS.sections)).then((snap) => {
        setSections(parseSections(snap.val()));
      }),
    ];

    await Promise.allSettled(fetchPromises);
    setIsLoading(false);
  }, [isAuthenticated, parseBanners, parseSections]);

  // ─── Return value ──────────────────────────────────────────────────────

  // Read current Zustand values for convenience
  const cardColors = useAppStore((s) => s.cardColors);
  const maintenance = useAppStore((s) => s.maintenance);
  const forceUpdate = useAppStore((s) => s.forceUpdate);
  const investmentPlans = useAppStore((s) => s.investmentPlans);
  const exchangeRates = useAppStore((s) => s.exchangeRates);

  return {
    // Zustand-synced values
    cardColors,
    maintenance,
    forceUpdate,
    investmentPlans,
    exchangeRates,

    // Local state (not in store yet)
    visibilitySettings,
    socialLinks,
    banners,
    sections,

    // Meta
    isLoading,
    refreshAll,
  } as const;
}
