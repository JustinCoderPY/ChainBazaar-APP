import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import CryptoHeader from '../../components/CryptoHeader';
import ProductCard from '../../components/ProductCard';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { getCryptoPrices } from '../../services/cryptoPriceService'; // ✅ Peter’s price service
import { getAllListings } from '../../services/firebaseService'; // ✅ Firebase
import { Product } from '../../types';

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [btcPrice, setBtcPrice] = useState(97000);
  const [ethPrice, setEthPrice] = useState(2700);
  const [btcChange24h, setBtcChange24h] = useState(0);
  const [ethChange24h, setEthChange24h] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [pricesLoading, setPricesLoading] = useState(false);

  const { isGuest, user } = useAuth();
  const router = useRouter();

  // prevents double fetch spam
  const isFetching = useRef(false);

  const loadData = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      // ✅ Load products from Firebase
      const firebaseProducts = await getAllListings();
      setProducts(firebaseProducts);

      // ✅ Load crypto prices (supports both return shapes)
      const prices: any = await getCryptoPrices();

      // If Peter’s service returns { btcPrice, ethPrice, btcChange24h, ethChange24h }
      if (prices?.btcPrice != null && prices?.ethPrice != null) {
        setBtcPrice(prices.btcPrice);
        setEthPrice(prices.ethPrice);
        setBtcChange24h(prices.btcChange24h ?? 0);
        setEthChange24h(prices.ethChange24h ?? 0);
      }
      // If another service returns CoinGecko shape { bitcoin: { usd }, ethereum: { usd } }
      else if (prices?.bitcoin?.usd != null && prices?.ethereum?.usd != null) {
        setBtcPrice(prices.bitcoin.usd);
        setEthPrice(prices.ethereum.usd);
        setBtcChange24h(prices.bitcoin.usd_24h_change ?? 0);
        setEthChange24h(prices.ethereum.usd_24h_change ?? 0);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      isFetching.current = false;
    }
  }, []);

  // Load when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Optional: also load once on mount (safe)
  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleCreateListing = () => {
    if (isGuest) {
      Alert.alert('Login Required', 'Please login to create a listing', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/auth/login') },
      ]);
    } else {
      router.push('/(tabs)/create');
    }
  };

  const filteredProducts = products.filter((product) => {
    const title = (product.title ?? '').toLowerCase();
    const category = (product.category ?? '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return title.includes(q) || category.includes(q);
  });

  return (
    <SafeAreaView style={styles.container}>
        {/* Header — avatar opens Settings modal */}
        <CryptoHeader
          userName={user?.name || null}
          isGuest={isGuest}
          onProfilePress={() => router.push('/settings')}
          btcPrice={btcPrice}
          ethPrice={ethPrice}
          btcChange24h={btcChange24h}
          ethChange24h={ethChange24h}
          pricesLoading={pricesLoading}
        />

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={Colors.lightGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Product List with pull-to-refresh */}
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              btcPrice={btcPrice}
              ethPrice={ethPrice}
              onPress={() => router.push(`/product/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.secondary}
              colors={['#1E90FF']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No products yet</Text>
              <Text style={styles.emptySubtext}>
                Tap Sell to create your first listing
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.primary,
    },
    searchContainer: {
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    searchInput: {
      backgroundColor: '#1A1A1A',
      color: Colors.secondary,
      padding: 12,
      borderRadius: 10,
      fontSize: 15,
      borderWidth: 1,
      borderColor: '#2A2A2A',
    },
    list: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    emptyContainer: {
      alignItems: 'center',
      marginTop: 80,
      paddingHorizontal: 32,
    },
    emptyText: {
      fontSize: 20,
      color: Colors.lightGray,
      marginBottom: 8,
      fontWeight: '600',
    },
    emptySubtext: {
      fontSize: 14,
      color: Colors.lightGray,
      textAlign: 'center',
    },
  });