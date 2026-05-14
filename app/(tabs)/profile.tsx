import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Shadows, Radii, Spacing } from '../../constants/theme';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import AnimatedPressable from '../../components/AnimatedPressable';

// ✅ Firebase-backed profile listings
import { getUserListings } from '../../services/firebaseService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const LOGOUT_REDIRECT_ROUTE = '/auth/login';

const confirmAction = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Logout',
      style: 'destructive',
      onPress: onConfirm,
    },
  ]);
};

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
};

export default function ProfileScreen() {
  const { user, logout, isGuest } = useAuth();
  const router = useRouter();
  const [myListings, setMyListings] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadMyListings = useCallback(async () => {
    if (!user?.id) return;

    try {
      const userProducts = await getUserListings(user.id);
      setMyListings(userProducts ?? []);
    } catch (error) {
      console.error('Error loading listings:', error);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadMyListings();
    }, [loadMyListings])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyListings();
    setRefreshing(false);
  };

  const handleLogout = () => {
    confirmAction('Logout', 'Are you sure you want to logout?', async () => {
      setLoggingOut(true);
      try {
        await logout();
        router.replace(LOGOUT_REDIRECT_ROUTE);
      } catch (error) {
        console.error('Error logging out:', error);
        showAlert('Error', 'Failed to log out. Please try again.');
      } finally {
        setLoggingOut(false);
      }
    });
  };

  if (isGuest || !user) {
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
          <Text style={styles.gridPrice}>${Number(item.price).toFixed(2)}</Text>
        </View>
      </AnimatedPressable>
    );
  };

  const initials = (user?.name?.trim()?.charAt(0) || 'U').toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
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
            <Text style={styles.statLabel}>FAVS</Text>
          </View>
        </View>

        <AnimatedPressable
          style={[styles.logoutButton, loggingOut && styles.logoutButtonDisabled]}
          onPress={handleLogout}
          disabled={loggingOut}
          scaleValue={0.95}
        >
          <Text style={styles.logoutButtonText}>{loggingOut ? 'Logging out...' : 'Logout'}</Text>
        </AnimatedPressable>
      </View>

      <FlatList
        data={myListings}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        renderItem={renderGridItem}
        contentContainerStyle={styles.gridList}
        columnWrapperStyle={styles.gridRow}
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
            <Text style={styles.emptySubtext}>Create your first listing!</Text>
            <AnimatedPressable
              style={styles.createButton}
              onPress={() => router.push('/(tabs)/create')}
              scaleValue={0.96}
            >
              <Text style={styles.createButtonText}>Create Listing</Text>
            </AnimatedPressable>
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

  // Guest view
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
    lineHeight: 22,
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
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Header
  header: {
    alignItems: 'center',
    padding: Spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 3,
    borderColor: Colors.success,
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
    marginBottom: Spacing.lg,
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: Spacing.lg,
  },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.lightGray,
    letterSpacing: 1,
  },

  logoutButton: {
    backgroundColor: Colors.danger,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    ...Shadows.md,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    color: Colors.secondary,
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Grid
  gridList: {
    padding: 16,
    paddingBottom: 32,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  gridCard: {
    width: CARD_WIDTH,
    backgroundColor: Colors.gray,
    borderRadius: Radii.md,
    marginBottom: 16,
    overflow: 'hidden',
    ...Shadows.md,
  },
  gridImage: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: '#111',
  },
  gridInfo: {
    padding: 12,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 6,
  },
  gridPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.success,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.lightGray,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.lightGray,
    textAlign: 'center',
    marginBottom: 18,
  },
  createButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: Radii.md,
    ...Shadows.glow(Colors.success),
  },
  createButtonText: {
    color: Colors.secondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
