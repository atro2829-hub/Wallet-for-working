import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { theme } from '../../config/theme';
import { APP_NAME, PHONE_PREFIX } from '../../utils/constants';
import { Gender } from '../../types';
import * as Haptics from 'expo-haptics';

export default function RegisterScreen({ navigation }: any) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [nationalId, setNationalId] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!firstName || !lastName || !email || !password || !phone || !gender || !nationalId) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }

    if (!agreedToTerms) {
      Alert.alert('خطأ', 'يرجى الموافقة على الشروط والأحكام');
      return;
    }

    if (password.length < 6) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (phone.length !== 9) {
      Alert.alert('خطأ', 'رقم الهاتف يجب أن يكون 9 أرقام');
      return;
    }

    navigation.navigate('Signature', {
      userData: {
        firstName,
        lastName,
        email,
        password,
        phone,
        gender,
        nationalId,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backText}>→</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>إنشاء حساب جديد</Text>
            <View style={{ width: 32 }} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name Row */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>الاسم الأول</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="الاسم الأول"
                  placeholderTextColor={theme.colors.textTertiary}
                  textAlign="right"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>الاسم الأخير</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="الاسم الأخير"
                  placeholderTextColor={theme.colors.textTertiary}
                  textAlign="right"
                />
              </View>
            </View>

            {/* Email + Password Row */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>البريد الإلكتروني</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@example.com"
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textAlign="right"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>كلمة المرور</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="6 أحرف على الأقل"
                  placeholderTextColor={theme.colors.textTertiary}
                  secureTextEntry
                  textAlign="right"
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>رقم الهاتف</Text>
              <View style={styles.phoneContainer}>
                <View style={styles.phonePrefix}>
                  <Text style={styles.phonePrefixText}>🇾🇪 +967</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="7XXXXXXXX"
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="phone-pad"
                  maxLength={9}
                  textAlign="right"
                />
              </View>
            </View>

            {/* National ID */}
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

            {/* Gender */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>الجنس</Text>
              <View style={styles.genderRow}>
                <TouchableOpacity
                  style={[styles.genderButton, gender === 'male' && styles.genderActive]}
                  onPress={() => {
                    setGender('male');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.genderText, gender === 'male' && styles.genderActiveText]}>ذكر</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderButton, gender === 'female' && styles.genderActiveFemale]}
                  onPress={() => {
                    setGender('female');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.genderText, gender === 'female' && styles.genderActiveFemaleText]}>أنثى</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => {
                setAgreedToTerms(!agreedToTerms);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxActive]}>
                {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>أوافق على الشروط والأحكام</Text>
            </TouchableOpacity>

            {/* Continue Button */}
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>متابعة للتوقيع</Text>
            </TouchableOpacity>

            {/* Login Link */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}
            >
              <Text style={styles.loginLink}>
                هل لديك حساب؟ اضغط هنا لتسجيل الدخول
              </Text>
            </TouchableOpacity>
          </View>
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
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
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
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    overflow: 'hidden',
  },
  phonePrefix: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.border,
    backgroundColor: theme.colors.backgroundTertiary,
  },
  phonePrefixText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontFamily: 'System',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontFamily: 'System',
    writingDirection: 'ltr',
    textAlign: 'left',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderActive: {
    backgroundColor: theme.colors.primary,
  },
  genderActiveFemale: {
    backgroundColor: '#EC4899',
  },
  genderText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    fontFamily: 'System',
  },
  genderActiveText: {
    color: '#FFFFFF',
  },
  genderActiveFemaleText: {
    color: '#FFFFFF',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  termsText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontFamily: 'System',
    writingDirection: 'rtl',
    flex: 1,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.md,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    fontFamily: 'System',
  },
  loginLink: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
});
