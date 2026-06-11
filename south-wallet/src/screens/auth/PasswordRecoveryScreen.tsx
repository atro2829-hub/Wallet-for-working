import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { theme } from '../../config/theme';
import * as Haptics from 'expo-haptics';

export default function PasswordRecoveryScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [success, setSuccess] = useState(false);
  const { recoverPassword, isLoading, error, clearError } = useAuthStore();

  const handleRecover = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!email || !nationalId) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }

    await recoverPassword(email, nationalId);
    setSuccess(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backText}>→</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>استعادة كلمة المرور</Text>
            <View style={{ width: 32 }} />
          </View>

          {success ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني
              </Text>
              <TouchableOpacity
                style={styles.backToLoginButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.backToLoginText}>العودة لتسجيل الدخول</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.description}>
                أدخل بريدك الإلكتروني ورقم الهوية لاستعادة كلمة المرور
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>البريد الإلكتروني</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="أدخل بريدك الإلكتروني"
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textAlign="right"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>رقم الهوية</Text>
                <TextInput
                  style={styles.input}
                  value={nationalId}
                  onChangeText={setNationalId}
                  placeholder="أدخل رقم الهوية الوطنية"
                  placeholderTextColor={theme.colors.textTertiary}
                  textAlign="right"
                />
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.recoverButton}
                onPress={handleRecover}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.recoverButtonText}>استعادة كلمة المرور</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 20,
    color: theme.colors.text,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: 'System',
  },
  form: {
    paddingHorizontal: 24,
    marginTop: 20,
  },
  description: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'System',
    writingDirection: 'rtl',
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 6,
    textAlign: 'right',
    fontFamily: 'System',
  },
  input: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  errorContainer: {
    backgroundColor: theme.colors.errorLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  recoverButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...theme.shadow.md,
  },
  recoverButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    fontFamily: 'System',
  },
  successContainer: {
    paddingHorizontal: 24,
    marginTop: 40,
    alignItems: 'center',
  },
  successText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.success,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'System',
    writingDirection: 'rtl',
    marginBottom: 24,
  },
  backToLoginButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  backToLoginText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    fontFamily: 'System',
  },
});
