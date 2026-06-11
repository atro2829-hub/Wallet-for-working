import React, { useState, useEffect, useRef } from 'react';
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
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';
import { theme } from '../../config/theme';
import { APP_NAME } from '../../utils/constants';
import BannerCarousel from '../../components/BannerCarousel';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();
  const { banners, fetchBanners, listenBanners, fetchSettings } = useAppStore();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchBanners();
    unsubscribeRef.current = listenBanners();
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLogin = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!email || !password) return;
    await login(email, password);
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
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>{APP_NAME}</Text>
          </View>

          {/* Welcome Text */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>مرحباً بك في محفظة الجنوب</Text>
            <Text style={styles.welcomeSubtitle}>بعد التسجيل، يمكنك الدخول إلى حسابك</Text>
          </View>

          {/* Banners */}
          <BannerCarousel banners={banners} location="login" height={120} />

          {/* Form */}
          <View style={styles.form}>
            {/* Email */}
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

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>كلمة المرور</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="أدخل كلمة المرور"
                placeholderTextColor={theme.colors.textTertiary}
                secureTextEntry
                textAlign="right"
              />
            </View>

            {/* Error */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Login Button */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.7}
            >
              <Text style={styles.registerLink}>
                هل لديك حساب؟ اضغط هنا للتسجيل
              </Text>
            </TouchableOpacity>

            {/* Password Recovery */}
            <TouchableOpacity
              onPress={() => navigation.navigate('PasswordRecovery')}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotPassword}>نسيت كلمة المرور؟</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Icons */}
          <View style={styles.bottomIcons}>
            <TouchableOpacity style={styles.bottomIcon} activeOpacity={0.7}>
              <Text style={styles.iconText}>💬</Text>
              <Text style={styles.iconLabel}>واتساب</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomIcon} activeOpacity={0.7}>
              <Text style={styles.iconText}>📍</Text>
              <Text style={styles.iconLabel}>الموقع</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomIcon} activeOpacity={0.7}>
              <Text style={styles.iconText}>📞</Text>
              <Text style={styles.iconLabel}>اتصل بنا</Text>
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
  logoSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  appName: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: 8,
    fontFamily: 'System',
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  welcomeTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  welcomeSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  form: {
    paddingHorizontal: 24,
    marginTop: 16,
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
  loginButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...theme.shadow.md,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    fontFamily: 'System',
  },
  registerLink: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  forgotPassword: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  bottomIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    gap: 40,
  },
  bottomIcon: {
    alignItems: 'center',
  },
  iconText: {
    fontSize: 28,
  },
  iconLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 4,
    fontFamily: 'System',
  },
});
