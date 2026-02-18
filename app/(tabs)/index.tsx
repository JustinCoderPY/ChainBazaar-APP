import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CryptoHeader from '../../components/CryptoHeader';
import ProductCard from '../../components/ProductCard';
import { Colors } from '../../constants/Colors';
import { getCryptoPrices } from '../../services/coinGeckoApi';
import { getProducts } from '../../services/storage';
import { Product } from '../../types';
import { useAuth } from '../AuthContext';

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [btcPrice, setBtcPrice] = useState(50000);
  const [ethPrice, setEthPrice] = useState(3000);
  const [refreshing, setRefreshing] = useState(false);
  const { isGuest } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const storedProducts = await getProducts();
    setProducts(storedProducts);

    const prices = await getCryptoPrices();
    if (prices) {
      setBtcPrice(prices.bitcoin.usd);
      setEthPrice(prices.ethereum.usd);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateListing = () => {
    if (isGuest) {
      Alert.alert(
        'Login Required',
        'Please login to create a listing',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/auth/login') },
        ]
      );
    } else {
      router.push('/create');
    }
  };

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <CryptoHeader />
      
      <View style={styles.header}>
        <Text style={styles.title}>ChainBazaar</Text>
        <Text style={styles.subtitle}>Buy & Sell with Crypto Prices</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={Colors.lightGray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            btcPrice={btcPrice}
            ethPrice={ethPrice}
            onPress={() => router.push(`/product/${item.id}`)} // CHANGED: Navigate to details
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first listing!
            </Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={handleCreateListing}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.lightGray,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: Colors.gray,
    color: Colors.secondary,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  list: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 20,
    color: Colors.lightGray,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.lightGray,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 36,
    color: Colors.secondary,
    fontWeight: 'bold',
  },
});