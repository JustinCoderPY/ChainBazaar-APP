import { useFocusEffect, useRouter } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Shadows, Radii, Spacing } from '../../constants/theme';
import { getCryptoPrices } from '../../services/cryptoPriceService';
import { getProducts } from '../../services/storage';
import { Product } from '../../types';
import { useAuth } from '../AuthContext';
import AnimatedPressable from '../../components/AnimatedPressable';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function ProfileScreen() {
  const { user, logout, isGuest } = useAuth();
  const router = useRouter();
  const [myListings, setMyListings] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadMyListings = useCallback(async () => {
    if (!user) return;

    try {
      // Load all products from AsyncStorage then filter by current user
      const allProducts = await getProducts();
      const userProducts = allProducts.filter((p) => p.sellerId === user.id);
      setMyListings(userProducts);
    } catch (error) {
      console.error('Error loading listings:', error);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadMyListings();
      }
    }, [user, loadMyListings])
  );

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
          },
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

  const renderGridItem = ({ item }: { item: Product }) => {
    const imageUrl =
      item.imageUrls && item.imageUrls.length > 0
        ? item.imageUrls[0]
        : 'https://picsum.photos/300';

    return (
      <AnimatedPressable
        style={styles.gridCard}
        onPress={() => router.push(`/product/${item.id}`)}
        scaleValue={0.96}
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
      </AnimatedPressable>
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

        <AnimatedPressable style={styles.logoutButton} onPress={handleLogout} scaleValue={0.95}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </AnimatedPressable>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  guestTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginBottom: Spacing.md,
  },
  guestSubtitle: {
    fontSize: 16,
    color: Colors.lightGray,
    textAlign: 'center',
    marginBottom: Spacing.xxxl,
  },
  loginButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.lg,
    borderRadius: Radii.md,
    ...Shadows.glow(Colors.accent),
  },
  loginButtonText: {
    color: Colors.secondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    padding: Spacing.xxl,
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
    marginBottom: Spacing.md,
    ...Shadows.glow(Colors.accent),
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
    marginBottom: Spacing.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.xxxl,
    marginBottom: Spacing.xl,
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
    paddingHorizontal: Spacing.xxl,
    paddingVertical: 10,
    borderRadius: Radii.sm,
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
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  gridList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  gridCard: {
    width: CARD_WIDTH,
    backgroundColor: Colors.gray,
    borderRadius: Radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
    ...Shadows.sm,
  },
  gridImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.gray,
  },
  gridInfo: {
    padding: Spacing.md,
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
    marginTop: Spacing.huge,
    width: '100%',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.lightGray,
  },
});