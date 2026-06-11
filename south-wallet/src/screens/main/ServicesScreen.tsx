import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../stores/appStore';
import { theme } from '../../config/theme';
import { SERVICE_CATEGORIES, SERVICE_PROVIDERS } from '../../utils/constants';
import * as Haptics from 'expo-haptics';

export default function ServicesScreen({ navigation }: any) {
  const { settings, fetchSettings } = useAppStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSettings();
    setRefreshing(false);
  };

  const categories = SERVICE_CATEGORIES.filter(
    (c) => settings.subSections[c.id as keyof typeof settings.subSections] !== false
  );

  const getCategoryIcon = (id: string): string => {
    const icons: Record<string, string> = {
      telecom: '☎',
      internet: '◎',
      entertainment: '♠',
      'digital-cards': '⊡',
      electricity: '⚡',
      water: '◈',
      government: '⊞',
      crypto: '₿',
      'crypto-invest': '↗',
    };
    return icons[id] || '●';
  };

  const getCategoryColor = (id: string): string => {
    const colors: Record<string, string> = {
      telecom: '#DC2626',
      internet: '#2563EB',
      entertainment: '#7C3AED',
      'digital-cards': '#0891B2',
      electricity: '#F59E0B',
      water: '#06B6D4',
      government: '#059669',
      crypto: '#F97316',
      'crypto-invest': '#8B5CF6',
    };
    return colors[id] || theme.colors.primary;
  };

  const handleCategoryPress = (category: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('ServiceCategory', {
      categoryId: category.id,
      name: category.nameAr,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>الخدمات</Text>
        </View>

        <View style={styles.grid}>
          {categories.map((category) => {
            const color = getCategoryColor(category.id);
            const providers = SERVICE_PROVIDERS[category.id] || [];
            return (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category)}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryIcon, { backgroundColor: color + '15' }]}>
                  <Text style={[styles.iconText, { color }]}>{getCategoryIcon(category.id)}</Text>
                </View>
                <Text style={styles.categoryName}>{category.nameAr}</Text>
                <Text style={styles.providerCount}>{providers.length} مزود</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 20 }} />
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: 'System',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  categoryCard: {
    width: '31%',
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...theme.shadow.sm,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconText: {
    fontSize: 24,
    fontWeight: '700',
  },
  categoryName: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  providerCount: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    marginTop: 2,
    fontFamily: 'System',
  },
});
