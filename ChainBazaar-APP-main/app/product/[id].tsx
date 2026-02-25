import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Shadows, Radii, Spacing } from '../../constants/theme';
import { getCryptoPrices } from '../../services/cryptoPriceService';
import { getProducts, removeProduct } from '../../services/storage';
import { Product } from '../../types';
import AnimatedPressable from '../../components/AnimatedPressable';

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [btcPrice, setBtcPrice] = useState(97000);
  const [ethPrice, setEthPrice] = useState(2700);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadProduct();
    loadCryptoPrices();
  }, [id]);

  const loadProduct = async () => {
    try {
      const products = await getProducts();
      const found = products.find((p) => p.id === id);
      if (found) {
        setProduct(found);
      }
    } catch (error) {
      console.error('Error loading product:', error);
    }
  };

  const loadCryptoPrices = async () => {
    try {
      const prices = await getCryptoPrices();
      setBtcPrice(prices.btcPrice);
      setEthPrice(prices.ethPrice);
    } catch (error) {
      console.error('Error loading prices:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeProduct(id as string);
              Alert.alert('Success', 'Listing deleted successfully');
              router.back();
            } catch (error) {
              console.error('Error deleting listing:', error);
              Alert.alert('Error', 'Failed to delete listing');
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!product) return;

    try {
      await Share.share({
        message: `Check out this listing on ChainBazaar!\n\n${product.title}\n$${product.price}\n\n${product.description}`,
        title: product.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const btcAmount = (product.price / btcPrice).toFixed(8);
  const ethAmount = (product.price / ethPrice).toFixed(8);

  const images =
    product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls
      : ['https://picsum.photos/400'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <AnimatedPressable
            style={styles.backButton}
            onPress={() => router.back()}
            scaleValue={0.9}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.secondary} />
            <Text style={styles.backButtonText}>Back</Text>
          </AnimatedPressable>
        </View>

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(index);
          }}
        >
          {images.map((uri, index) => (
            <Image
              key={index}
              source={{ uri }}
              style={styles.image}
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        {images.length > 1 && (
          <View style={styles.imageIndicator}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentImageIndex && styles.activeDot,
                ]}
              />
            ))}
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{product.category}</Text>
          </View>

          <Text style={styles.title}>{product.title}</Text>

          <View style={styles.priceSection}>
            <Text style={styles.usdPrice}>${product.price.toFixed(2)}</Text>
            <View style={styles.cryptoPrices}>
              <Text style={styles.cryptoPrice}>
                <Ionicons name="logo-bitcoin" size={13} color={Colors.btcOrange} /> {btcAmount} BTC
              </Text>
              <Text style={styles.cryptoPrice}>
                <Ionicons name="diamond-outline" size={13} color={Colors.ethPurple} /> {ethAmount} ETH
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Seller Information</Text>
          <Text style={styles.sellerName}>{product.sellerName}</Text>
          <Text style={styles.listedDate}>
            Listed on {new Date(product.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AnimatedPressable
          style={styles.shareButton}
          onPress={handleShare}
          scaleValue={0.96}
        >
          <Ionicons name="share-outline" size={18} color={Colors.secondary} />
          <Text style={styles.shareButtonText}>Share</Text>
        </AnimatedPressable>

        <AnimatedPressable
          style={styles.deleteButton}
          onPress={handleDelete}
          scaleValue={0.96}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.secondary} />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </AnimatedPressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.secondary,
    fontSize: 18,
  },
  header: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.pill,
  },
  backButtonText: {
    color: Colors.secondary,
    fontSize: 15,
    fontWeight: '600',
  },
  image: {
    width: width,
    height: 400,
    backgroundColor: '#1a1a1a',
  },
  imageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#444',
  },
  activeDot: {
    backgroundColor: Colors.accent,
    width: 24,
  },
  content: {
    padding: Spacing.xl,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accentSoft,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(30,144,255,0.2)',
  },
  categoryText: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginBottom: Spacing.lg,
  },
  priceSection: {
    marginBottom: Spacing.xxl,
  },
  usdPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.success,
    marginBottom: Spacing.sm,
  },
  cryptoPrices: {
    gap: 4,
  },
  cryptoPrice: {
    fontSize: 14,
    color: Colors.lightGray,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginVertical: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: 16,
    color: Colors.lightGray,
    lineHeight: 24,
  },
  sellerName: {
    fontSize: 16,
    color: Colors.secondary,
    marginBottom: 4,
  },
  listedDate: {
    fontSize: 14,
    color: Colors.lightGray,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    backgroundColor: Colors.primary,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.lg,
    borderRadius: Radii.md,
    ...Shadows.glow(Colors.accent),
  },
  shareButtonText: {
    color: Colors.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.danger,
    paddingVertical: Spacing.lg,
    borderRadius: Radii.md,
  },
  deleteButtonText: {
    color: Colors.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});