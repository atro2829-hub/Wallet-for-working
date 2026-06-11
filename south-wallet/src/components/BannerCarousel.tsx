import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, FlatList, Image, Text, TouchableOpacity, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { theme } from '../config/theme';
import { Banner } from '../types';

interface BannerCarouselProps {
  banners: Banner[];
  height?: number;
  location: 'login' | 'home';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function BannerCarousel({ banners, height = 160, location }: BannerCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const filteredBanners = banners.filter(b => b.location === location && b.isActive);

  useEffect(() => {
    if (filteredBanners.length > 1) {
      timerRef.current = setInterval(() => {
        setActiveIndex((prev) => {
          const next = (prev + 1) % filteredBanners.length;
          flatListRef.current?.scrollToIndex({ index: next, animated: true });
          return next;
        });
      }, 4000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [filteredBanners.length]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32));
    if (index >= 0 && index < filteredBanners.length) {
      setActiveIndex(index);
    }
  };

  if (filteredBanners.length === 0) return null;

  return (
    <View style={[styles.container, { height }]}>
      <FlatList
        ref={flatListRef}
        data={filteredBanners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.bannerItem} activeOpacity={0.9}>
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderBanner}>
                <Text style={styles.placeholderText}>{item.titleAr || item.title || 'إعلان'}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH - 32,
          offset: (SCREEN_WIDTH - 32) * index,
          index,
        })}
      />
      {filteredBanners.length > 1 && (
        <View style={styles.pagination}>
          {filteredBanners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: index === activeIndex ? theme.colors.primary : theme.colors.disabled },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 14,
    overflow: 'hidden',
    ...theme.shadow.sm,
  },
  bannerItem: {
    width: SCREEN_WIDTH - 32,
    height: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  placeholderBanner: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    fontFamily: 'System',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
});
