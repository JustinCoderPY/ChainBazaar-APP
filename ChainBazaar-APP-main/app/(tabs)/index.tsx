import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Product } from '../../types';
import { getProducts } from '../../services/storage';
import { getCryptoPrices } from '../../services/cryptoPriceService';
import ProductCard from '../../components/ProductCard';
import HomeHeader from '../../components/HomeHeader';
import { useAuth } from '../AuthContext';

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [btcPrice, setBtcPrice] = useState(97000);
  const [ethPrice, setEthPrice] = useState(2700);
  const [refreshing, setRefreshing] = useState(false);
  const [pricesLoading, setPricesLoading] = useState(true);
  const { isGuest, user } = useAuth();
  const router = useRouter();

  // ─── Prevents double-fetching if useFocusEffect fires while
  //     a pull-to-refresh is already in progress ─────────────
  const isFetching = useRef(false);

  // ─── Core data loader ─────────────────────────────────────
  //
  // useCallback with [] deps means this function reference is
  // stable across renders. It never goes stale because it only
  // calls setters (which are stable) and imported functions
  // (which are module-level, also stable).
  //
  // If it depended on a prop or state value that changes, we'd
  // need to add that to the deps array — but it doesn't.
  const loadData = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      // Fetch listings and prices in parallel
      const [allProducts, prices] = await Promise.all([
        getProducts(),
        getCryptoPrices(),
      ]);

      setProducts(allProducts);
      setBtcPrice(prices.btcPrice);
      setEthPrice(prices.ethPrice);
    } catch (error) {
      console.error('[Home] Error loading data:', error);
    } finally {
      setPricesLoading(false);
      isFetching.current = false;
    }
  }, []);
  //   ^^ empty deps — loadData never changes identity.
  //
  //   WHY THIS IS SAFE:
  //   - getProducts, getCryptoPrices are module-level imports (stable)
  //   - setProducts, setBtcPrice, etc. are React state setters (stable)
  //   - isFetching is a ref (stable)
  //   - No props or state values are read inside the function
  //
  //   If we added `products` or `btcPrice` to deps, loadData would
  //   get a new identity every time those values change, which would
  //   cause useFocusEffect to re-run → calling loadData → updating
  //   state → new loadData → infinite loop.

  // ─── Load on mount + every tab focus ──────────────────────
  //
  // useFocusEffect fires:
  //   1. On initial mount (user opens app)
  //   2. Every time this tab becomes focused (switching back from
  //      Sell, Profile, Messages tabs, or returning from Settings
  //      modal / product detail)
  //
  // This ensures new listings created on the Sell tab appear
  // immediately when the user switches back to Explore.
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
    //    ^^ loadData is stable ([] deps), so this useCallback also
    //       has a stable identity. useFocusEffect only re-subscribes
    //       if this callback identity changes — which it won't.
    //       Result: no infinite loops.
  );

  // ─── Pull-to-refresh handler ──────────────────────────────
  //
  // Separate from loadData so we can control the RefreshControl
  // spinner independently from the initial pricesLoading state.
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // ─── Search filter ────────────────────────────────────────
  const filteredProducts = products.filter(
    (product) =>
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header — avatar opens Settings modal */}
      <HomeHeader
        userName={user?.name || null}
        isGuest={isGuest}
        onProfilePress={() => router.push('/settings')}
        btcPrice={btcPrice}
        ethPrice={ethPrice}
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