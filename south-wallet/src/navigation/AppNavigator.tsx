import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../stores/authStore';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { theme } from '../config/theme';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.card,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.primary,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '900' },
        },
      }}
    >
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated && user ? (
          <Stack.Screen
            name="Main"
            component={MainNavigator}
            options={{ animation: 'fade' }}
          />
        ) : (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{ animation: 'fade' }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
