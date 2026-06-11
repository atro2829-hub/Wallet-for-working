import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { theme } from '../config/theme';
import { ServiceCategory } from '../types';

interface ServiceGridProps {
  categories: ServiceCategory[];
  onCategoryPress: (category: ServiceCategory) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  telecom: '☎',
  internet: '◎',
  entertainment: '♠',
  'digital-cards': '⊡',
  electricity: '⚡',
  water: '💧',
  government: '⊞',
  crypto: '₿',
  'crypto-invest': '↗',
};

export default function ServiceGrid({ categories, onCategoryPress }: ServiceGridProps) {
  const renderItem = ({ item }: { item: ServiceCategory }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => onCategoryPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{CATEGORY_ICONS[item.id] || '●'}</Text>
      </View>
      <Text style={styles.name}>{item.nameAr}</Text>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={categories}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={4}
      scrollEnabled={false}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  item: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: theme.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...theme.shadow.sm,
  },
  icon: {
    fontSize: 24,
  },
  name: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
});
