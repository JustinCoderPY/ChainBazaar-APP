import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import {
  AppColors,
  Spacing,
  Radii,
  Shadows,
  Typography,
} from '../constants/theme';
import AnimatedPressable from './AnimatedPressable';

interface Props {
  product: Product;
  btcPrice: number;
  ethPrice: number;
  onPress: () => void;
}

export default function ProductCard({
  product,
  btcPrice,
  ethPrice,
  onPress,
}: Props) {
  const btcAmount = (product.price / btcPrice).toFixed(6);
  const ethAmount = (product.price / ethPrice).toFixed(4);

  const imageUrl =
    product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls[0]
      : 'https://picsum.photos/300';

  return (
    <AnimatedPressable
      style={styles.card}
      onPress={onPress}
      scaleValue={0.975}
    >
      {/* ── Image ──────────────────────────────────────────── */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Image count badge */}
        {product.imageUrls && product.imageUrls.length > 1 && (
          <View style={styles.imageBadge}>
            <Ionicons name="images-outline" size={11} color={AppColors.secondary} />
            <Text style={styles.imageBadgeText}>
              {product.imageUrls.length}
            </Text>
          </View>
        )}

        {/* Category pill */}
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{product.category}</Text>
        </View>

        {/* Bottom gradient overlay for text readability */}
        <View style={styles.imageGradient} />
      </View>

      {/* ── Content ────────────────────────────────────────── */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={1}>
          {product.title}
        </Text>

        {/* Price row */}
        <View style={styles.priceRow}>
          <Text style={styles.usdPrice}>
            ${product.price.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          <View style={styles.cryptoContainer}>
            <View style={styles.cryptoItem}>
              <View style={[styles.cryptoDot, { backgroundColor: AppColors.btcOrange }]} />
              <Text style={styles.cryptoText}>{btcAmount} BTC</Text>
            </View>
            <View style={styles.cryptoDivider} />
            <View style={styles.cryptoItem}>
              <View style={[styles.cryptoDot, { backgroundColor: AppColors.ethPurple }]} />
              <Text style={styles.cryptoText}>{ethAmount} ETH</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.sellerRow}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarText}>
                {product.sellerName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.sellerName} numberOfLines={1}>
              {product.sellerName}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={AppColors.textDim} />
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },

  // ── Image ──
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: AppColors.surfaceAlt,
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'transparent',
    // Simulated gradient: a semi-transparent bar at the bottom of the image
    borderBottomWidth: 0,
  },
  imageBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.overlayLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.pill,
  },
  imageBadgeText: {
    color: AppColors.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  categoryPill: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: AppColors.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(30,144,255,0.2)',
  },
  categoryText: {
    ...Typography.label,
    fontSize: 10,
    color: AppColors.accent,
    letterSpacing: 0.6,
  },

  // ── Content ──
  content: {
    padding: Spacing.lg,
  },
  title: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },

  // ── Prices ──
  priceRow: {
    marginBottom: Spacing.md,
  },
  usdPrice: {
    ...Typography.price,
    marginBottom: Spacing.xs,
  },
  cryptoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cryptoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cryptoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cryptoText: {
    ...Typography.crypto,
  },
  cryptoDivider: {
    width: 1,
    height: 10,
    backgroundColor: AppColors.border,
    marginHorizontal: Spacing.sm,
  },

  // ── Footer ──
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sellerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: AppColors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: AppColors.borderLight,
  },
  sellerAvatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: AppColors.textMuted,
  },
  sellerName: {
    ...Typography.caption,
    flex: 1,
  },
});