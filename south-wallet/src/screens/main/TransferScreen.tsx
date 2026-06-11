import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { useWalletStore } from '../../stores/walletStore';
import { theme } from '../../config/theme';
import { Currency } from '../../types';
import { CURRENCIES } from '../../utils/constants';
import { formatCurrency } from '../../utils/helpers';
import * as Haptics from 'expo-haptics';

export default function TransferScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { createTransfer, createExchange, isLoading, error, clearError } = useWalletStore();
  const [mode, setMode] = useState<'transfer' | 'exchange'>('transfer');
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('YER');
  const [toCurrency, setToCurrency] = useState<Currency>('USD');

  const handleTransfer = async () => {
    if (!recipientId || !amount || !user) return;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح');
      return;
    }
    await createTransfer(user.uid, recipientId, numAmount, selectedCurrency);
    if (!useWalletStore.getState().error) {
      Alert.alert('نجاح', 'تم التحويل بنجاح');
      navigation.goBack();
    }
  };

  const handleExchange = async () => {
    if (!amount || !user) return;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح');
      return;
    }
    if (selectedCurrency === toCurrency) {
      Alert.alert('خطأ', 'يرجى اختيار عملتين مختلفتين');
      return;
    }
    await createExchange(user.uid, selectedCurrency, toCurrency, numAmount);
    if (!useWalletStore.getState().error) {
      Alert.alert('نجاح', 'تم الصرف بنجاح');
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>→</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تحويل</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Mode Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, mode === 'transfer' && styles.toggleActive]}
            onPress={() => {
              setMode('transfer');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={[styles.toggleText, mode === 'transfer' && styles.toggleActiveText]}>تحويل</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, mode === 'exchange' && styles.toggleActive]}
            onPress={() => {
              setMode('exchange');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={[styles.toggleText, mode === 'exchange' && styles.toggleActiveText]}>صرف عملات</Text>
          </TouchableOpacity>
        </View>

        {/* Currency Selection */}
        <View style={styles.currencyRow}>
          {(Object.keys(CURRENCIES) as Currency[]).map((currency) => {
            const curr = CURRENCIES[currency];
            return (
              <TouchableOpacity
                key={currency}
                style={[styles.currencyChip, selectedCurrency === currency && { backgroundColor: curr.color }]}
                onPress={() => setSelectedCurrency(currency)}
              >
                <Text style={[styles.currencyChipText, selectedCurrency === currency && { color: '#FFFFFF' }]}>
                  {curr.code}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Balance Display */}
        <View style={styles.balanceDisplay}>
          <Text style={styles.balanceLabel}>الرصيد المتاح</Text>
          <Text style={styles.balanceValue}>
            {formatCurrency(user?.balances[selectedCurrency] || 0, selectedCurrency)}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {mode === 'transfer' ? (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>رقم حساب المستلم</Text>
              <TextInput
                style={styles.input}
                value={recipientId}
                onChangeText={setRecipientId}
                placeholder="أدخل رقم حساب المستلم"
                placeholderTextColor={theme.colors.textTertiary}
                keyboardType="number-pad"
                textAlign="right"
              />
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>التحويل إلى</Text>
              <View style={styles.currencyRow}>
                {(Object.keys(CURRENCIES) as Currency[]).filter(c => c !== selectedCurrency).map((currency) => {
                  const curr = CURRENCIES[currency];
                  return (
                    <TouchableOpacity
                      key={currency}
                      style={[styles.currencyChip, toCurrency === currency && { backgroundColor: curr.color }]}
                      onPress={() => setToCurrency(currency)}
                    >
                      <Text style={[styles.currencyChipText, toCurrency === currency && { color: '#FFFFFF' }]}>
                        {curr.code}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>المبلغ</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="أدخل المبلغ"
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="decimal-pad"
              textAlign="right"
            />
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.submitButton}
            onPress={mode === 'transfer' ? handleTransfer : handleExchange}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {mode === 'transfer' ? 'تحويل' : 'صرف'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  scrollView: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backText: { fontSize: 20, color: theme.colors.text },
  headerTitle: { fontSize: theme.fontSize.lg, fontWeight: '700', color: theme.colors.text, fontFamily: 'System' },
  toggleContainer: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: theme.colors.backgroundSecondary, borderRadius: 12, padding: 4 },
  toggleButton: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  toggleActive: { backgroundColor: theme.colors.primary },
  toggleText: { fontSize: theme.fontSize.md, fontWeight: '600', color: theme.colors.textSecondary, fontFamily: 'System' },
  toggleActiveText: { color: '#FFFFFF' },
  currencyRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginTop: 16 },
  currencyChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.backgroundSecondary, alignItems: 'center' },
  currencyChipText: { fontSize: theme.fontSize.sm, fontWeight: '600', color: theme.colors.text, fontFamily: 'System' },
  balanceDisplay: { alignItems: 'center', marginTop: 16, marginHorizontal: 16, paddingVertical: 16, backgroundColor: theme.colors.backgroundSecondary, borderRadius: 12 },
  balanceLabel: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, fontFamily: 'System' },
  balanceValue: { fontSize: theme.fontSize.xxl, fontWeight: '700', color: theme.colors.text, marginTop: 4, fontFamily: 'System' },
  form: { paddingHorizontal: 16, marginTop: 16 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: theme.fontSize.sm, fontWeight: '600', color: theme.colors.text, marginBottom: 6, textAlign: 'right', fontFamily: 'System' },
  input: { backgroundColor: theme.colors.backgroundSecondary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: theme.fontSize.md, color: theme.colors.text, fontFamily: 'System', writingDirection: 'rtl' },
  errorContainer: { backgroundColor: theme.colors.errorLight, borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { color: theme.colors.error, fontSize: theme.fontSize.sm, textAlign: 'center', fontFamily: 'System', writingDirection: 'rtl' },
  submitButton: { backgroundColor: theme.colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', ...theme.shadow.md },
  submitButtonText: { color: '#FFFFFF', fontSize: theme.fontSize.lg, fontWeight: '700', fontFamily: 'System' },
});
