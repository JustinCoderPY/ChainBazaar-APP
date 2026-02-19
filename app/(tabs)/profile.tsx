import { useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { getCryptoPrices } from '../../services/coinGeckoApi';
import { getUserListings } from '../../services/firebaseService';
import { Product } from '../../types';
import { useAuth } from '../AuthContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function ProfileScreen() {
  const { user, logout, isGuest } = useAuth();
  const router = useRouter();
  const [myListings, setMyListings] = useState<Product[]>([]);
  const [btcPrice, setBtcPrice] = useState(50000);
  const [ethPrice, setEthPrice] = useState(3000);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadMyListings();
      }
    }, [user])
  );

  useEffect(() => {
    if (user) {
      loadMyListings();
    }
  }, [user]);

  const loadMyListings = async () => {
    if (!user) return;
    
    try {
      console.log('Loading user listings from Firebase...');
      // Load user's listings from Firebase
      const userProducts = await getUserListings(user.id);
      console.log(`Loaded ${userProducts.length} listings for user`);
      setMyListings(userProducts);

      // Load crypto prices
      const prices = await getCryptoPrices();
      if (prices) {
        setBtcPrice(prices.bitcoin.usd);
        setEthPrice(prices.ethereum.usd);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
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

  const renderGridItem = ({ item }: { item: Product }) => {
    const imageUrl = item.imageUrls && item.imageUrls.length > 0
      ? item.imageUrls[0]
      : 'https://picsum.photos/300';

    return (
      <TouchableOpacity 
        style={styles.gridCard}
        onPress={() => router.push(`/product/${item.id}`)}
      >
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.gridImage}
          resizeMode="cover"
        />
        <View style={styles.gridInfo}>
          <Text style={styles.gridTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.gridPrice}>${item.price.toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

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
        renderItem={renderGridItem}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridList}
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

// ... (keep all the existing styles)
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
    paddingBottom: 8,
  },
  gridList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridCard: {
    width: CARD_WIDTH,
    backgroundColor: Colors.gray,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  gridImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.gray,
  },
  gridInfo: {
    padding: 12,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 6,
    minHeight: 36,
  },
  gridPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.success,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
    width: '100%',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.lightGray,
  },
});