import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../config/theme';
import { Transaction } from '../types';
import { formatCurrency, formatRelativeTime, getTransactionTypeLabel, getStatusColor } from '../utils/helpers';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
}

const TYPE_ICONS: Record<string, string> = {
  deposit: '+',
  withdraw: '-',
  transfer: '→',
  exchange: '⇄',
  service: '⊡',
  investment: '↗',
  gift: '★',
};

export default function TransactionItem({ transaction, onPress }: TransactionItemProps) {
  const isPositive = ['deposit', 'gift'].includes(transaction.type);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(transaction)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: isPositive ? theme.colors.successLight : theme.colors.errorLight }]}>
        <Text style={[styles.icon, { color: isPositive ? theme.colors.success : theme.colors.error }]}>
          {TYPE_ICONS[transaction.type] || '●'}
        </Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.type}>{getTransactionTypeLabel(transaction.type)}</Text>
        <Text style={styles.description} numberOfLines={1}>{transaction.description}</Text>
        <Text style={styles.date}>{formatRelativeTime(transaction.createdAt)}</Text>
      </View>

      <View style={styles.amountContainer}>
        <Text style={[styles.amount, { color: isPositive ? theme.colors.success : theme.colors.error }]}>
          {isPositive ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
            {transaction.status === 'completed' ? 'مكتمل' : transaction.status === 'pending' ? 'معلق' : 'فاشل'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.borderLight,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  icon: {
    fontSize: 18,
    fontWeight: '700',
  },
  details: {
    flex: 1,
    marginLeft: 12,
  },
  type: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  description: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  date: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    marginTop: 2,
    fontFamily: 'System',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'System',
  },
});
