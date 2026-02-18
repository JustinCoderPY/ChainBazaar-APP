import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Product } from '../../types';
import { getProducts, saveProducts } from '../../services/storage';
import { getCryptoPrices } from '../../services/coinGeckoApi';

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [btcPrice, setBtcPrice] = useState(67000);
  const [ethPrice, setEthPrice] = useState(1950);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadProduct();
    loadCryptoPrices();
  }, [id]);

  const loadProduct = async () => {
    const products = await getProducts();
    const found = products.find(p => p.id === id);
    if (found) {
      setProduct(found);
    }
  };

  const loadCryptoPrices = async () => {
    const prices = await getCryptoPrices();
    if (prices) {
      setBtcPrice(prices.bitcoin.usd);
      setEthPrice(prices.ethereum.usd);
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
            const products = await getProducts();
            const filtered = products.filter(p => p.id !== id);
            await saveProducts(filtered);
            Alert.alert('Success', 'Listing deleted successfully');
            router.back();
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

  const images = product.imageUrls && product.imageUrls.length > 0
    ? product.imageUrls
    : ['https://picsum.photos/400'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Image Gallery */}
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

        {/* Image Indicator */}
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

        {/* Product Info */}
        <View style={styles.content}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{product.category}</Text>
          </View>

          <Text style={styles.title}>{product.title}</Text>

          <View style={styles.priceSection}>
            <Text style={styles.usdPrice}>${product.price.toFixed(2)}</Text>
            <View style={styles.cryptoPrices}>
              <Text style={styles.cryptoPrice}>₿ {btcAmount} BTC</Text>
              <Text style={styles.cryptoPrice}>Ξ {ethAmount} ETH</Text>
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

      {/* Action Buttons Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Text style={styles.shareButtonText}>📤 Share</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
        </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: Colors.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  image: {
    width: width,
    height: 400,
    backgroundColor: '#1a1a1a',
  },
  imageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
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
    padding: 20,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.gray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryText: {
    color: Colors.lightGray,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginBottom: 16,
  },
  priceSection: {
    marginBottom: 24,
  },
  usdPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.success,
    marginBottom: 8,
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
    backgroundColor: '#333',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginBottom: 12,
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
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: Colors.primary,
  },
  shareButton: {
    flex: 1,
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    color: Colors.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: Colors.danger,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: Colors.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});