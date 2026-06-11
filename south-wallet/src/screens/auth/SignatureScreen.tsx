import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SignatureCanvas from 'react-native-signature-canvas';
import { useAuthStore } from '../../stores/authStore';
import { theme } from '../../config/theme';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SignatureScreen({ navigation, route }: any) {
  const { userData } = route.params;
  const signatureRef = useRef<any>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const { register, isLoading, error, clearError } = useAuthStore();

  const handleSignature = (signature: string) => {
    setSignatureData(signature);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleEmpty = () => {
    setSignatureData(null);
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setSignatureData(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleConfirm = async () => {
    if (!signatureData) {
      Alert.alert('خطأ', 'يرجى التوقيع قبل المتابعة');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    await register({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password,
      phone: userData.phone,
      gender: userData.gender,
      nationalId: userData.nationalId,
      signature: signatureData,
    });
  };

  const webStyle = `.m-signature-pad--footer
    .button {
      display: none;
    }
    .m-signature-pad {
      border: none;
      box-shadow: none;
    }
    .m-signature-pad--body {
      border: 2px dashed #E5E7EB;
      border-radius: 12px;
    }
    body {
      background-color: transparent;
    }`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>→</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>التوقيع الإلكتروني</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            يرجى التوقيع في المربع أدناه لإكمال التسجيل
          </Text>
        </View>

        {/* Signature Pad */}
        <View style={styles.signatureContainer}>
          <SignatureCanvas
            ref={signatureRef}
            onOK={handleSignature}
            onEmpty={handleEmpty}
            webStyle={webStyle}
            descriptionText=""
            confirmText=""
            clearText=""
            autoClear={false}
            imageType="image/png"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            activeOpacity={0.7}
          >
            <Text style={styles.clearButtonText}>مسح التوقيع</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              !signatureData && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!signatureData || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmButtonText}>تأكيد التسجيل</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  instructions: {
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  signatureContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: theme.colors.backgroundSecondary,
    height: 300,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    fontFamily: 'System',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.md,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    fontFamily: 'System',
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
});
