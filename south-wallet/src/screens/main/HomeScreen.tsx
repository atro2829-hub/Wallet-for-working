import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  RefreshControl,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { useWalletStore } from '../../stores/walletStore';
import { useAppStore } from '../../stores/appStore';
import { theme } from '../../config/theme';
import { Currency } from '../../types';
import { CURRENCIES, SERVICE_CATEGORIES, SERVICE_PROVIDERS } from '../../utils/constants';
import { formatRelativeTime } from '../../utils/helpers';
import BalanceCard from '../../components/BalanceCard';
import BannerCarousel from '../../components/BannerCarousel';
import TransactionItem from '../../components/TransactionItem';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CURRENCY_KEYS: Currency[] = ['YER', 'SAR', 'USD'];

export default function HomeScreen({ navigation }: any) {
  const { user, fetchUserProfile } = useAuthStore();
  const { transactions, fetchTransactions, listenTransactions } = useWalletStore();
  const { banners, settings, fetchBanners, listenBanners, fetchSettings, fetchServiceCategories, serviceCategories } = useAppStore();
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (user) {
      fetchTransactions(user.userId);
      unsubscribeRef.current = listenTransactions(user.userId);
    }
    fetchSettings();
    fetchBanners();
    listenBanners();
    fetchServiceCategories();

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user) {
      await fetchUserProfile(user.uid);
      await fetchTransactions(user.userId);
    }
    await fetchBanners();
    await fetchSettings();
    setRefreshing(false);
  };

  const handleCardScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32));
    if (index >= 0 && index < CURRENCY_KEYS.length) {
      setActiveCardIndex(index);
    }
  };

  const handleCategoryPress = (category: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('ServiceCategory', {
      categoryId: category.id,
      name: category.nameAr,
    });
  };

  const handleQuickAction = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (action) {
      case 'transfer':
        navigation.navigate('Transfer');
        break;
      case 'deposit':
        navigation.navigate('CryptoDeposit');
        break;
      case 'gift':
        navigation.navigate('GiftCards');
        break;
      case 'invest':
        navigation.navigate('Investment');
        break;
    }
  };

  const categories = serviceCategories.length > 0
    ? serviceCategories
    : SERVICE_CATEGORIES.filter((c) => settings.subSections[c.id as keyof typeof settings.subSections] !== false);

  const recentTransactions = transactions.slice(0, 5);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>مرحباً،</Text>
            <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.userId}>#{user?.userId}</Text>
          </View>
        </View>

        {/* Balance Cards */}
        <View style={styles.cardsSection}>
          <FlatList
            data={CURRENCY_KEYS}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleCardScroll}
            scrollEventThrottle={16}
            keyExtractor={(item) => item}
            renderItem={({ item, index }) => (
              <View style={styles.cardWrapper}>
                <BalanceCard
                  currency={item}
                  balance={user?.balances[item] || 0}
                  index={index}
                />
              </View>
            )}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH - 32,
              offset: (SCREEN_WIDTH - 32) * index,
              index,
            })}
          />
          {/* Card Indicators */}
          <View style={styles.cardIndicators}>
            {CURRENCY_KEYS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  { backgroundColor: index === activeCardIndex ? theme.colors.primary : theme.colors.disabled },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Banners */}
        <BannerCarousel banners={banners} location="home" height={120} />

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} onPress={() => handleQuickAction('transfer')}>
              <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <Text style={styles.quickActionEmoji}>→</Text>
              </View>
              <Text style={styles.quickActionLabel}>تحويل</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => handleQuickAction('deposit')}>
              <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.successLight }]}>
                <Text style={styles.quickActionEmoji}>+</Text>
              </View>
              <Text style={styles.quickActionLabel}>إيداع</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => handleQuickAction('gift')}>
              <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.warningLight }]}>
                <Text style={styles.quickActionEmoji}>★</Text>
              </View>
              <Text style={styles.quickActionLabel}>هدية</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => handleQuickAction('invest')}>
              <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.infoLight }]}>
                <Text style={styles.quickActionEmoji}>↗</Text>
              </View>
              <Text style={styles.quickActionLabel}>استثمار</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>الخدمات</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ServicesTab')}>
              <Text style={styles.seeAll}>عرض الكل</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.serviceGrid}>
            {categories.slice(0, 8).map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.serviceItem}
                onPress={() => handleCategoryPress(category)}
                activeOpacity={0.7}
              >
                <View style={styles.serviceIconContainer}>
                  <Text style={styles.serviceIconText}>
                    {getCategoryIcon(category.id)}
                  </Text>
                </View>
                <Text style={styles.serviceName}>{category.nameAr}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>آخر المعاملات</Text>
            <TouchableOpacity onPress={() => navigation.navigate('WalletTab')}>
              <Text style={styles.seeAll}>عرض الكل</Text>
            </TouchableOpacity>
          </View>
          {recentTransactions.length > 0 ? (
            recentTransactions.map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>لا توجد معاملات بعد</Text>
            </View>
          )}
        </View>

        {/* Gift Code Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.giftCodeButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate('GiftCards');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.giftCodeButtonText}>رمز الهدية</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getCategoryIcon(id: string): string {
  const icons: Record<string, string> = {
    telecom: '☎',
    internet: '◎',
    entertainment: '♠',
    'digital-cards': '⊡',
    electricity: '⚡',
    water: '◈',
    government: '⊞',
    crypto: '₿',
    'crypto-invest': '↗',
  };
  return icons[id] || '●';
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  greeting: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontFamily: 'System',
  },
  userName: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  headerRight: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  userId: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.primary,
    fontFamily: 'System',
  },
  cardsSection: {
    marginTop: 12,
  },
  cardWrapper: {
    width: SCREEN_WIDTH - 32,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  cardIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  seeAll: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '600',
    fontFamily: 'System',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    width: '23%',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionEmoji: {
    fontSize: 22,
    fontWeight: '700',
  },
  quickActionLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text,
    fontWeight: '500',
    fontFamily: 'System',
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceItem: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: theme.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  serviceIconText: {
    fontSize: 22,
  },
  serviceName: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textTertiary,
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  giftCodeButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.md,
  },
  giftCodeButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    fontFamily: 'System',
  },
});
