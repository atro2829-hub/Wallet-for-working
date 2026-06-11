import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { theme } from '../config/theme';
import { useAuthStore } from '../stores/authStore';
import { useAppStore } from '../stores/appStore';

// Main screens
import HomeScreen from '../screens/main/HomeScreen';
import WalletScreen from '../screens/main/WalletScreen';
import ServicesScreen from '../screens/main/ServicesScreen';
import AccountScreen from '../screens/main/AccountScreen';

// Sub screens
import ServiceCategoryScreen from '../screens/services/ServiceCategoryScreen';
import ProviderScreen from '../screens/services/ProviderScreen';
import OrderScreen from '../screens/services/OrderScreen';
import InvestmentScreen from '../screens/investment/InvestmentScreen';
import InvestmentDetailScreen from '../screens/investment/InvestmentDetailScreen';
import CryptoDepositScreen from '../screens/crypto/CryptoDepositScreen';
import GiftCardScreen from '../screens/gift/GiftCardScreen';
import KYCVerificationScreen from '../screens/kyc/KYCVerificationScreen';
import TransferScreen from '../screens/main/TransferScreen';

// Admin screens
import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminKYCScreen from '../screens/admin/AdminKYCScreen';
import AdminServicesScreen from '../screens/admin/AdminServicesScreen';
import AdminBannersScreen from '../screens/admin/AdminBannersScreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminDepositsScreen from '../screens/admin/AdminDepositsScreen';
import AdminInvestmentsScreen from '../screens/admin/AdminInvestmentsScreen';
import AdminGiftCodesScreen from '../screens/admin/AdminGiftCodesScreen';
import AdminCryptoWalletsScreen from '../screens/admin/AdminCryptoWalletsScreen';

// Owner screens
import OwnerDashboard from '../screens/owner/OwnerDashboard';
import OwnerSectionsScreen from '../screens/owner/OwnerSectionsScreen';
import OwnerColorsScreen from '../screens/owner/OwnerColorsScreen';
import OwnerAdminsScreen from '../screens/owner/OwnerAdminsScreen';

// Components
import VerificationToast from '../components/VerificationToast';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ name, focused, icon }: { name: string; focused: boolean; icon: string }) {
  const iconMap: Record<string, string> = {
    home: '⌂',
    wallet: '◇',
    services: '⊞',
    account: '◉',
  };

  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, { color: focused ? theme.colors.primary : theme.colors.textTertiary }]}>
        {iconMap[icon] || '●'}
      </Text>
      <Text style={[styles.tabLabel, { color: focused ? theme.colors.primary : theme.colors.textTertiary }]}>
        {name}
      </Text>
    </View>
  );
}

function MainTabs() {
  const { settings } = useAppStore();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.borderLight,
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
      }}
    >
      {settings.sections.home && (
        <Tab.Screen
          name="HomeTab"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon name="الرئيسية" focused={focused} icon="home" />,
          }}
        />
      )}
      {settings.sections.wallet && (
        <Tab.Screen
          name="WalletTab"
          component={WalletScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon name="المحفظة" focused={focused} icon="wallet" />,
          }}
        />
      )}
      {settings.sections.services && (
        <Tab.Screen
          name="ServicesTab"
          component={ServicesScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon name="الخدمات" focused={focused} icon="services" />,
          }}
        />
      )}
      <Tab.Screen
        name="AccountTab"
        component={AccountScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="الحساب" focused={focused} icon="account" />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';
  const isOwner = user?.role === 'owner';

  return (
    <>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} />

        {/* Service Screens */}
        <Stack.Screen name="ServiceCategory" component={ServiceCategoryScreen} />
        <Stack.Screen name="Provider" component={ProviderScreen} />
        <Stack.Screen name="Order" component={OrderScreen} />

        {/* Investment */}
        {isAdmin && (
          <Stack.Screen name="Investment" component={InvestmentScreen} />
        )}
        <Stack.Screen name="InvestmentDetail" component={InvestmentDetailScreen} />

        {/* Crypto Deposit */}
        <Stack.Screen name="CryptoDeposit" component={CryptoDepositScreen} />

        {/* Gift Cards */}
        <Stack.Screen name="GiftCards" component={GiftCardScreen} />

        {/* KYC */}
        <Stack.Screen name="KYCVerification" component={KYCVerificationScreen} />

        {/* Transfer */}
        <Stack.Screen name="Transfer" component={TransferScreen} />

        {/* Admin Screens */}
        {isAdmin && (
          <>
            <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
            <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
            <Stack.Screen name="AdminKYC" component={AdminKYCScreen} />
            <Stack.Screen name="AdminServices" component={AdminServicesScreen} />
            <Stack.Screen name="AdminBanners" component={AdminBannersScreen} />
            <Stack.Screen name="AdminOrders" component={AdminOrdersScreen} />
            <Stack.Screen name="AdminDeposits" component={AdminDepositsScreen} />
            <Stack.Screen name="AdminInvestments" component={AdminInvestmentsScreen} />
            <Stack.Screen name="AdminGiftCodes" component={AdminGiftCodesScreen} />
            <Stack.Screen name="AdminCryptoWallets" component={AdminCryptoWalletsScreen} />
          </>
        )}

        {/* Owner Screens */}
        {isOwner && (
          <>
            <Stack.Screen name="OwnerDashboard" component={OwnerDashboard} />
            <Stack.Screen name="OwnerSections" component={OwnerSectionsScreen} />
            <Stack.Screen name="OwnerColors" component={OwnerColorsScreen} />
            <Stack.Screen name="OwnerAdmins" component={OwnerAdminsScreen} />
          </>
        )}
      </Stack.Navigator>

      {/* Verification Toast */}
      {user && user.kycStatus !== 'approved' && <VerificationToast />}
    </>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
});
