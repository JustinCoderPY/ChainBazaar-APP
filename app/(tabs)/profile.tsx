import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../AuthContext';
import { getProducts } from '../../services/storage';
import { Product } from '../../types';
import ProductCard from '../../components/ProductCard';
import { getCryptoPrices } from '../../services/coinGeckoApi';

export default function ProfileScreen() {
  const { user, logout, isGuest } = useAuth();
  const router = useRouter();
  const [myListings, setMyListings] = useState<Product[]>([]);
  const [btcPrice, setBtcPrice] = useState(50000);
  const [ethPrice, setEthPrice] = useState(3000);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadMyListings();
    }
  }, [user]);

  const loadMyListings = async () => {
    if (!user) return;
    
    const allProducts = await getProducts();
    const userProducts = allProducts.filter(p => p.sellerId === user.id);
    setMyListings(userProducts);

    // Load crypto prices
    const prices = await getCryptoPrices();
    if (prices) {
      setBtcPrice(prices.bitcoin.usd);
      setEthPrice(prices.ethereum.usd);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyListings();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            Alert.alert('Success', 'Logged out successfully');
          }
        },
      ]
    );
  };

  if (isGuest) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.guestContainer}>
          <Text style={styles.guestTitle}>Welcome, Guest!</Text>
          <Text style={styles.guestSubtitle}>
            Login to create listings and manage your profile
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Login / Sign Up</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{myListings.length}</Text>
            <Text style={styles.statLabel}>LISTINGS</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>SOLD</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>FAVORITES</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>My Listings</Text>

      <FlatList
        data={myListings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            btcPrice={btcPrice}
            ethPrice={ethPrice}
            onPress={() => {
              // TODO: Navigate to product details
              console.log('Product pressed:', item.id);
            }}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={Colors.secondary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No listings yet</Text>
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
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  guestTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginBottom: 12,
  },
  guestSubtitle: {
    fontSize: 16,
    color: Colors.lightGray,
    textAlign: 'center',
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  loginButtonText: {
    color: Colors.secondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.lightGray,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 20,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.success,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.lightGray,
  },
  logoutButton: {
    backgroundColor: Colors.danger,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: Colors.secondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.secondary,
    padding: 16,
  },
  list: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.lightGray,
  },
});