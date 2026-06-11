import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { theme } from '../../config/theme';
import { getStatusLabel, getStatusColor } from '../../utils/helpers';
import * as Haptics from 'expo-haptics';

export default function AccountScreen({ navigation }: any) {
  const { user, logout, updateUserProfile } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';
  const isOwner = user?.role === 'owner';

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'خروج',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            logout();
          },
        },
      ]
    );
  };

  const MenuItem = ({
    title,
    subtitle,
    onPress,
    color,
    showBadge,
  }: {
    title: string;
    subtitle?: string;
    onPress: () => void;
    color?: string;
    showBadge?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.7}
    >
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, color && { color }]}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <Text style={styles.menuArrow}>←</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Text>
            </View>
          </View>
          <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.userId}>#{user?.userId}</Text>
          <View style={[styles.kycBadge, { backgroundColor: getStatusColor(user?.kycStatus || 'none') + '20' }]}>
            <Text style={[styles.kycText, { color: getStatusColor(user?.kycStatus || 'none') }]}>
              {getStatusLabel(user?.kycStatus || 'none')}
            </Text>
          </View>
        </View>

        {/* Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات الحساب</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>البريد الإلكتروني</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>رقم الهاتف</Text>
              <Text style={styles.infoValue}>{user?.phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>رقم الهوية</Text>
              <Text style={styles.infoValue}>{user?.nationalId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>الجنس</Text>
              <Text style={styles.infoValue}>{user?.gender === 'male' ? 'ذكر' : 'أنثى'}</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الإعدادات</Text>

          <MenuItem
            title="التحقق من الهوية"
            subtitle={user?.kycStatus === 'approved' ? 'تم التحقق' : 'لم يتم التحقق'}
            onPress={() => navigation.navigate('KYCVerification')}
            color={user?.kycStatus === 'approved' ? theme.colors.success : theme.colors.warning}
          />

          <MenuItem
            title="تحويل أموال"
            onPress={() => navigation.navigate('Transfer')}
          />

          <MenuItem
            title="إيداع كريبتو"
            onPress={() => navigation.navigate('CryptoDeposit')}
          />

          <MenuItem
            title="رمز الهدية"
            onPress={() => navigation.navigate('GiftCards')}
          />

          <MenuItem
            title="الاستثمار"
            onPress={() => navigation.navigate('Investment')}
          />

          {isAdmin && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>لوحة الإدارة</Text>

              <MenuItem
                title="لوحة تحكم المدير"
                onPress={() => navigation.navigate('AdminDashboard')}
                color={theme.colors.primary}
              />

              <MenuItem
                title="إدارة المستخدمين"
                onPress={() => navigation.navigate('AdminUsers')}
              />

              <MenuItem
                title="التحقق من الهوية"
                onPress={() => navigation.navigate('AdminKYC')}
              />

              <MenuItem
                title="إدارة الخدمات"
                onPress={() => navigation.navigate('AdminServices')}
              />

              <MenuItem
                title="إدارة البانرات"
                onPress={() => navigation.navigate('AdminBanners')}
              />

              <MenuItem
                title="إدارة الطلبات"
                onPress={() => navigation.navigate('AdminOrders')}
              />

              <MenuItem
                title="الإيداعات والسحوبات"
                onPress={() => navigation.navigate('AdminDeposits')}
              />

              <MenuItem
                title="إدارة الاستثمارات"
                onPress={() => navigation.navigate('AdminInvestments')}
              />

              <MenuItem
                title="رموز الهدية"
                onPress={() => navigation.navigate('AdminGiftCodes')}
              />

              <MenuItem
                title="محافظ الكريبتو"
                onPress={() => navigation.navigate('AdminCryptoWallets')}
              />
            </>
          )}

          {isOwner && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>لوحة المالك</Text>

              <MenuItem
                title="لوحة تحكم المالك"
                onPress={() => navigation.navigate('OwnerDashboard')}
                color="#7C3AED"
              />

              <MenuItem
                title="إدارة الأقسام"
                onPress={() => navigation.navigate('OwnerSections')}
              />

              <MenuItem
                title="إدارة الألوان"
                onPress={() => navigation.navigate('OwnerColors')}
              />

              <MenuItem
                title="إدارة المديرين"
                onPress={() => navigation.navigate('OwnerAdmins')}
              />
            </>
          )}

          <View style={styles.divider} />

          <MenuItem
            title="الدعم الفني"
            onPress={() => Alert.alert('الدعم الفني', 'سيتم تفعيل هذه الخدمة قريباً')}
          />

          <MenuItem
            title="تسجيل الخروج"
            onPress={handleLogout}
            color={theme.colors.error}
          />
        </View>

        <View style={{ height: 40 }} />
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
  profileCard: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.backgroundSecondary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'System',
  },
  userName: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  userId: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: 2,
    fontFamily: 'System',
  },
  kycBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  kycText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    fontFamily: 'System',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  infoCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 14,
    padding: 16,
    ...theme.shadow.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.borderLight,
  },
  infoLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  infoValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: '500',
    fontFamily: 'System',
    writingDirection: 'ltr',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.borderLight,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '500',
    color: theme.colors.text,
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  menuSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    marginTop: 2,
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  menuArrow: {
    fontSize: 18,
    color: theme.colors.textTertiary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginVertical: 12,
  },
});
