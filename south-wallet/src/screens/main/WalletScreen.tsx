import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { useWalletStore } from '../../stores/walletStore';
import { theme } from '../../config/theme';
import { Currency } from '../../types';
import { CURRENCIES, EXCHANGE_RATES } from '../../utils/constants';
import { formatCurrency } from '../../utils/helpers';
import TransactionItem from '../../components/TransactionItem';
import * as Haptics from 'expo-haptics';

export default function WalletScreen({ navigation }: any) {
  const { user, fetchUserProfile } = useAuthStore();
  const { transactions, fetchTransactions, listenTransactions, createDeposit, createWithdrawal, isLoading } = useWalletStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchTransactions(user.userId);
      const unsub = listenTransactions(user.userId);
      return () => unsub();
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user) {
      await fetchUserProfile(user.uid);
      await fetchTransactions(user.userId);
    }
    setRefreshing(false);
  };

  const filteredTransactions = selectedFilter === 'all'
    ? transactions
    : transactions.filter(tx => tx.type === selectedFilter);

  const handleDeposit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('CryptoDeposit');
  };

  const handleWithdraw = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('سحب', 'سيتم تفعيل هذه الخدمة قريباً');
  };

  const filters = [
    { key: 'all', label: 'الكل' },
    { key: 'deposit', label: 'إيداع' },
    { key: 'withdraw', label: 'سحب' },
    { key: 'transfer', label: 'تحويل' },
    { key: 'service', label: 'خدمة' },
    { key: 'investment', label: 'استثمار' },
    { key: 'gift', label: 'هدية' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>المحفظة</Text>
        </View>

        {/* Balances */}
        <View style={styles.balancesSection}>
          {(Object.keys(CURRENCIES) as Currency[]).map((currency) => {
            const curr = CURRENCIES[currency];
            const balance = user?.balances[currency] || 0;
            return (
              <View key={currency} style={[styles.balanceRow, { borderRightColor: curr.color }]}>
                <View style={styles.balanceInfo}>
                  <Text style={styles.balanceName}>{curr.name}</Text>
                  <Text style={styles.balanceCode}>{curr.code}</Text>
                </View>
                <Text style={[styles.balanceAmount, { color: curr.color }]}>
                  {formatCurrency(balance, currency)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.depositButton} onPress={handleDeposit} activeOpacity={0.8}>
            <Text style={styles.depositButtonText}>إيداع</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.withdrawButton} onPress={handleWithdraw} activeOpacity={0.8}>
            <Text style={styles.withdrawButtonText}>سحب</Text>
          </TouchableOpacity>
        </View>

        {/* Exchange Rates */}
        <View style={styles.exchangeSection}>
          <Text style={styles.sectionTitle}>أسعار الصرف</Text>
          <View style={styles.exchangeCards}>
            <View style={styles.exchangeCard}>
              <Text style={styles.exchangeLabel}>1 دولار</Text>
              <Text style={styles.exchangeRate}>{EXCHANGE_RATES.usdToYer} ر.ي</Text>
            </View>
            <View style={styles.exchangeCard}>
              <Text style={styles.exchangeLabel}>1 ريال سعودي</Text>
              <Text style={styles.exchangeRate}>{EXCHANGE_RATES.sarToYer} ر.ي</Text>
            </View>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[styles.filterChip, selectedFilter === filter.key && styles.filterChipActive]}
                onPress={() => {
                  setSelectedFilter(filter.key);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.filterText, selectedFilter === filter.key && styles.filterTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Transactions */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>سجل المعاملات</Text>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>لا توجد معاملات</Text>
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: 'System',
  },
  balancesSection: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    ...theme.shadow.sm,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderRightWidth: 3,
    paddingRight: 12,
    marginRight: 4,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceName: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  balanceCode: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    fontFamily: 'System',
  },
  balanceAmount: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 16,
  },
  depositButton: {
    flex: 1,
    backgroundColor: theme.colors.success,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  depositButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    fontFamily: 'System',
  },
  withdrawButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    fontFamily: 'System',
  },
  exchangeSection: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  exchangeCards: {
    flexDirection: 'row',
    gap: 12,
  },
  exchangeCard: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  exchangeLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  exchangeRate: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 4,
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  filtersSection: {
    marginTop: 20,
    marginHorizontal: 16,
  },
  filtersScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundSecondary,
    marginLeft: 8,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    fontFamily: 'System',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  transactionsSection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textTertiary,
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
});
