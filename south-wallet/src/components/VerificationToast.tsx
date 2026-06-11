import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { theme } from '../config/theme';
import { useAuthStore } from '../stores/authStore';

interface VerificationToastProps {}

export default function VerificationToast({}: VerificationToastProps) {
  const { user } = useAuthStore();
  const [visible, setVisible] = React.useState(true);
  const translateY = React.useRef(new Animated.Value(-100)).current;

  React.useEffect(() => {
    if (user && user.kycStatus !== 'approved') {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    }
  }, [user?.kycStatus]);

  if (!user || user.kycStatus === 'approved' || !visible) return null;

  const getStatusText = () => {
    switch (user.kycStatus) {
      case 'none':
        return 'حسابك غير مفعل، يرجى التحقق من هويتك';
      case 'pending':
        return 'طلب التحقق قيد المراجعة';
      case 'rejected':
        return 'تم رفض التحقق، يرجى إعادة التقديم';
      default:
        return '';
    }
  };

  const getBackgroundColor = () => {
    switch (user.kycStatus) {
      case 'none':
        return theme.colors.warning;
      case 'pending':
        return theme.colors.info;
      case 'rejected':
        return theme.colors.error;
      default:
        return theme.colors.warning;
    }
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={[styles.toast, { backgroundColor: getBackgroundColor() }]}>
        <Text style={styles.text}>{getStatusText()}</Text>
        <TouchableOpacity
          onPress={() => {
            setVisible(false);
          }}
          style={styles.closeButton}
        >
          <Text style={styles.closeText}>X</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    ...theme.shadow.md,
  },
  text: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    flex: 1,
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  closeButton: {
    marginLeft: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
