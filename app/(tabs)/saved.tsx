import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import AnimatedPressable from '../../components/AnimatedPressable';
import { Colors } from '../../constants/Colors';
import { Radii, Shadows, Spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { getCryptoPrices } from '../../services/cryptoPriceService';
import { getSavedListings, unsaveListingForUser } from '../../services/firebaseService';
import { Product } from '../../types';

const GRID_GAP = 16;
const GRID_MAX_WIDTH = 760;

export default function SavedScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, isGuest } = useAuth();
  const [savedListings, setSavedListings] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [ethPrice, setEthPrice] = useState(2700);

  const gridWidth = Math.min(width - 32, GRID_MAX_WIDTH);
  const cardWidth = (gridWidth - GRID_GAP) / 2;

  const loadSavedListings = useCallback(async () => {
    if (!user?.id || isGuest) {
      setSavedListings([]);
      return;
    }

    const [saved, prices] = await Promise.all([
      getSavedListings(user.id),
      getCryptoPrices().catch(() => null),
    ]);

    if (prices?.ethPrice) {
      setEthPrice(prices.ethPrice);
    }

    setSavedListings(saved);
  }, [isGuest, user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadSavedListings();
    }, [loadSavedListings])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSavedListings();
    setRefreshing(false);
  }, [loadSavedListings]);

  const handleUnsave = useCallback(async (productId: string) => {
    if (!user?.id) return;

    setSavedListings((current) => current.filter((item) => item.id !== productId));
    try {
      await unsaveListingForUser(user.id, productId);
    } catch (error) {
      console.error('Error removing saved listing:', error);
      await loadSavedListings();
    }
  }, [loadSavedListings, user?.id]);

  const renderSavedItem = ({ item }: { item: Product }) => {
    const imageUrl =
      item.imageUrls && item.imageUrls.length > 0
        ? item.imageUrls[0]
        : 'https://picsum.photos/400';
    const ethAmount = ethPrice > 0 ? (item.price / ethPrice).toFixed(4) : '0.0000';

    return (
      <AnimatedPressable
        style={[styles.card, { width: cardWidth }]}
        onPress={() => router.push(`/product/${item.id}`)}
        scaleValue={0.97}
      >
        <Image source={{ uri: imageUrl }} style={[styles.cardImage, { height: cardWidth }]} resizeMode="cover" />
        <AnimatedPressable
          style={styles.heartButton}
          onPress={() => handleUnsave(item.id)}
          scaleValue={0.9}
        >
          <Ionicons name="heart" size={24} color="#FF9D9D" />
        </AnimatedPressable>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.cardPrice}>${Number(item.price).toLocaleString()}</Text>
          <Text style={styles.cardCrypto}>₿ {ethAmount} ETH</Text>
        </View>
      </AnimatedPressable>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={46} color={Colors.lightGray} />
      <Text style={styles.emptyTitle}>No saved items yet</Text>
      <Text style={styles.emptyText}>Save listings you want to revisit later.</Text>
    </View>
  );

  if (isGuest || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { width: gridWidth }]}>
          <Text style={styles.title}>Saved Items</Text>
          <Ionicons name="search-outline" size={28} color="#9CCBFF" />
        </View>
        <View style={styles.guestContainer}>
          <Ionicons name="heart-outline" size={48} color={Colors.lightGray} />
          <Text style={styles.emptyTitle}>Sign in to save listings</Text>
          <Text style={styles.emptyText}>Your saved marketplace finds will show up here.</Text>
          <AnimatedPressable
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
            scaleValue={0.96}
          >
            <Text style={styles.loginButtonText}>Login / Sign Up</Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={savedListings}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={renderSavedItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.secondary} />
        }
        ListHeaderComponent={
          <View style={[styles.header, { width: gridWidth }]}>
            <Text style={styles.title}>Saved Items</Text>
            <Ionicons name="search-outline" size={28} color="#9CCBFF" />
          </View>
        }
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[styles.listContent, { width: gridWidth }]}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  header: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '800',
    color: Colors.secondary,
  },
  listContent: {
    alignSelf: 'center',
    paddingHorizontal: 0,
    paddingBottom: 120,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: GRID_GAP,
  },
  card: {
    backgroundColor: '#161616',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    overflow: 'hidden',
    ...Shadows.sm,
  },
  cardImage: {
    width: '100%',
    backgroundColor: '#1A1A1A',
  },
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.secondary,
    marginBottom: 8,
  },
  cardPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.success,
    marginBottom: 4,
  },
  cardCrypto: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.lightGray,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 90,
    paddingHorizontal: 32,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '800',
    color: Colors.secondary,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.lightGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  loginButton: {
    marginTop: 24,
    backgroundColor: Colors.accent,
    paddingHorizontal: 26,
    paddingVertical: 14,
    borderRadius: Radii.md,
  },
  loginButtonText: {
    color: Colors.secondary,
    fontSize: 15,
    fontWeight: '800',
  },
});
