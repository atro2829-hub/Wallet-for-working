import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import SignatureScreen from '../screens/auth/SignatureScreen';
import PasswordRecoveryScreen from '../screens/auth/PasswordRecoveryScreen';
import { theme } from '../config/theme';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Signature" component={SignatureScreen} />
      <Stack.Screen name="PasswordRecovery" component={PasswordRecoveryScreen} />
    </Stack.Navigator>
  );
}
