import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AnimatedPressable from '../../components/AnimatedPressable';
import { Colors } from '../../constants/Colors';
import { Radii, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { getCryptoPrices } from '../../services/cryptoPriceService';
import { deleteListing, getAllListings } from '../../services/firebaseService';
import { getOrCreateConversation } from '../../services/messageService'; // ✅ NEW
import { Product } from '../../types';

const { width } = Dimensions.get('window');
const LOGIN_ROUTE = '/auth/login';

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
};

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isGuest } = useAuth();    // ✅ also grab isGuest
  const [product, setProduct] = useState<Product | null>(null);
  const [btcPrice, setBtcPrice] = useState(97000);
  const [ethPrice, setEthPrice] = useState(2700);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [messagingLoading, setMessagingLoading] = useState(false); // ✅ NEW

  const isOwner =
    !!user?.id &&
    !!product?.sellerId &&
    product.sellerId === user.id;

  useEffect(() => {
    loadProduct();
    loadCryptoPrices();
  }, [id]);

  const loadProduct = async () => {
    try {
      console.log('Loading product from Firebase...');
      const products = await getAllListings();
      const found = products.find(p => p.id === id);
      if (found) {
        setProduct(found);
        console.log('Product loaded:', found.title);
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
              console.log('Deleting listing from Firebase...');
              await deleteListing(id as string);
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

  // ✅ NEW: Message Seller handler
  const handleMessageSeller = async () => {
    console.log('Message Seller pressed');
    console.log('Current user:', user);
    console.log('Seller id:', product?.sellerId);

    if (isGuest || !user?.id) {
      showAlert('Login Required', 'Please login to message sellers');
      router.push(LOGIN_ROUTE);
      return;
    }

    if (!product) {
      showAlert('Error', 'Listing details are still loading. Please try again.');
      return;
    }

    if (!product.sellerId) {
      showAlert('Error', 'This listing is missing seller information.');
      return;
    }

    if (isOwner) {
      showAlert('Info', "You can't message yourself!");
      return;
    }

    setMessagingLoading(true);

    try {
      const conversationId = await getOrCreateConversation(
        user.id,
        user.name,
        product.sellerId,
        product.sellerName,
        product.id,
        product.title,
      );
      console.log('Conversation created/opened:', conversationId);

      const chatRoute = `/chat/${conversationId}?name=${encodeURIComponent(product.sellerName)}`;
      console.log('Navigating to chat:', chatRoute);
      router.push({
        pathname: '/chat/[id]',
        params: { id: conversationId, name: product.sellerName },
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      const message = error instanceof Error ? error.message : 'Could not start conversation. Please try again.';
      showAlert('Error', message);
    } finally {
      setMessagingLoading(false);
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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Back + Share Bar ─────────────────────────────── */}
        <View style={styles.topBar}>
          <AnimatedPressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.secondary} />
          </AnimatedPressable>
          <AnimatedPressable style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={Colors.secondary} />
          </AnimatedPressable>
        </View>

        {/* ── Image Carousel ──────────────────────────────── */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(index);
          }}
        >
          {images.map((url, index) => (
            <Image
              key={index}
              source={{ uri: url }}
              style={styles.image}
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        {/* Page Dots */}
        {images.length > 1 && (
          <View style={styles.dotsContainer}>
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
                <Ionicons name="logo-bitcoin" size={13} color={Colors.accent} /> {btcAmount} BTC
              </Text>
              <Text style={styles.cryptoPrice}>
                <Ionicons name="diamond-outline" size={13} color="#627EEA" /> {ethAmount} ETH
              </Text>
            </View>
          </View>

          {/* Seller Info */}
          <View style={styles.sellerSection}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarText}>
                {product.sellerName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerLabel}>Seller</Text>
              <Text style={styles.sellerName}>{product.sellerName}</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.descriptionLabel}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          {/* ── Action Buttons ─────────────────────────────── */}
          {isOwner ? (
            <AnimatedPressable style={styles.deleteButton} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color="#FF4444" />
              <Text style={styles.deleteButtonText}>Delete Listing</Text>
            </AnimatedPressable>
          ) : (
            <AnimatedPressable
              style={styles.messageButton}
              onPress={handleMessageSeller}
              disabled={messagingLoading}
            >
              <Ionicons name="chatbubble-outline" size={20} color={Colors.secondary} />
              <Text style={styles.messageButtonText}>
                {messagingLoading ? 'Opening Chat...' : 'Message Seller'}
              </Text>
            </AnimatedPressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
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
    fontSize: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width,
    height: width * 0.85,
    backgroundColor: '#1A1A1A',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: Colors.accent,
  },
  content: {
    padding: 20,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(30,144,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(30,144,255,0.2)',
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginBottom: 16,
  },
  priceSection: {
    marginBottom: 20,
  },
  usdPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.accent,
    marginBottom: 6,
  },
  cryptoPrices: {
    flexDirection: 'row',
    gap: 16,
  },
  cryptoPrice: {
    fontSize: 13,
    color: Colors.lightGray,
  },
  sellerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 14,
    borderRadius: Radii.md,
    marginBottom: 20,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sellerAvatarText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.lightGray,
    lineHeight: 22,
    marginBottom: 24,
  },
  // ✅ NEW: Message Seller button style
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: Radii.md,
    gap: 8,
    ...Shadows.md,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,68,68,0.1)',
    paddingVertical: 16,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.3)',
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF4444',
  },
});
