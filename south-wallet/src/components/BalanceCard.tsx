import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../config/theme';
import { Currency } from '../types';
import { CURRENCIES } from '../utils/constants';

interface BalanceCardProps {
  currency: Currency;
  balance: number;
  index: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;

export default function BalanceCard({ currency, balance, index }: BalanceCardProps) {
  const curr = CURRENCIES[currency];

  return (
    <View style={[styles.card, { backgroundColor: curr.color }]}>
      <View style={styles.cardPattern}>
        <View style={[styles.circle, { right: -30, top: -30 }]} />
        <View style={[styles.circle, { left: -20, bottom: -20 }]} />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.appName}>محفظة الجنوب</Text>
          <Text style={styles.currencyName}>{curr.name}</Text>
        </View>

        <View style={styles.balanceContainer}>
          <Text style={styles.balanceAmount}>
            {balance.toLocaleString('ar-YE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </Text>
          <Text style={styles.balanceSymbol}>{curr.symbol}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.currencyCode}>{curr.code}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    ...theme.shadow.lg,
  },
  cardPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    fontFamily: 'System',
  },
  currencyName: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    fontFamily: 'System',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  balanceSymbol: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'System',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  currencyCode: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: theme.fontSize.xs,
    fontWeight: '500',
    fontFamily: 'System',
  },
});
