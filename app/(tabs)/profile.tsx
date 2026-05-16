import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
type IoniconsName = keyof typeof Ionicons.glyphMap;

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

  const handleNotifications = () => {
    showAlert('Notifications', 'Push notification preferences will be available soon.');
  };

  const handlePrivacy = () => {
    showAlert('Privacy', 'Privacy settings will be available in a future update.');
  };

  const handleHelpCenter = () => {
    showAlert('Help Center', 'Need help? Contact us at support@chainbazaar.com');
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
  const renderSettingsRow = ({
    icon,
    iconColor,
    title,
    subtitle,
    onPress,
    destructive = false,
  }: {
    icon: IoniconsName;
    iconColor: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    destructive?: boolean;
  }) => (
    <AnimatedPressable
      style={[styles.settingsRow, destructive && loggingOut && styles.rowDisabled]}
      onPress={onPress}
      disabled={destructive && loggingOut}
      scaleValue={0.98}
    >
      <View style={[styles.settingsIcon, { backgroundColor: `${iconColor}18` }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.settingsText}>
        <Text style={[styles.settingsLabel, destructive && styles.destructiveText]}>
          {destructive && loggingOut ? 'Logging out...' : title}
        </Text>
        {subtitle && <Text style={styles.settingsSubtitle}>{subtitle}</Text>}
      </View>
      {!destructive && <Ionicons name="chevron-forward" size={20} color="#707070" />}
    </AnimatedPressable>
  );

  const renderSettingsSection = (
    title: string,
    rows: React.ReactNode[],
  ) => (
    <View style={styles.settingsSection}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.settingsCard}>
        {rows.map((row, index) => (
          <React.Fragment key={index}>{row}</React.Fragment>
        ))}
      </View>
    </View>
  );

  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <Text style={styles.screenTitle}>Settings</Text>
      <View style={styles.avatarLarge}>
        <Text style={styles.avatarLargeText}>{initials}</Text>
        <View style={styles.avatarAddBadge}>
          <Ionicons name="add" size={24} color="#0D0D0D" />
        </View>
      </View>
      <Text style={styles.profileName}>{user?.name}</Text>
      <Text style={styles.profileEmail}>{user?.email}</Text>

      {renderSettingsSection('Account', [
        renderSettingsRow({
          icon: 'lock-closed-outline',
          iconColor: '#FFB267',
          title: 'Change Password',
          subtitle: 'Update your login credentials',
          onPress: () => router.push('/account-settings' as any),
        }),
      ])}

      {renderSettingsSection('Crypto', [
        renderSettingsRow({
          icon: 'wallet-outline',
          iconColor: '#F7931A',
          title: 'Connect Crypto Wallet',
          subtitle: 'MetaMask, WalletConnect',
          onPress: () => router.push('/connect-wallet' as any),
        }),
      ])}

      {renderSettingsSection('App Settings', [
        renderSettingsRow({
          icon: 'notifications-outline',
          iconColor: '#75F29B',
          title: 'Notifications',
          subtitle: 'Push notification preferences',
          onPress: handleNotifications,
        }),
        renderSettingsRow({
          icon: 'shield-checkmark-outline',
          iconColor: '#A8C7FF',
          title: 'Privacy',
          subtitle: 'Data and visibility settings',
          onPress: handlePrivacy,
        }),
        renderSettingsRow({
          icon: 'help-circle-outline',
          iconColor: '#A5ADBA',
          title: 'Help Center',
          subtitle: 'FAQ and support',
          onPress: handleHelpCenter,
        }),
      ])}

      {renderSettingsSection('', [
        renderSettingsRow({
          icon: 'log-out-outline',
          iconColor: Colors.danger,
          title: 'Logout',
          onPress: handleLogout,
          destructive: true,
        }),
      ])}

      <Text style={styles.myListingsTitle}>My Listings</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={myListings}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        renderItem={renderGridItem}
        ListHeaderComponent={renderProfileHeader}
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

  profileHeader: {
    paddingTop: 20,
    paddingBottom: 18,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: 34,
  },
  avatarLarge: {
    alignSelf: 'center',
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarLargeText: {
    fontSize: 34,
    fontWeight: '700',
    color: '#0D0D0D',
  },
  avatarAddBadge: {
    position: 'absolute',
    right: -4,
    bottom: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#9CCBFF',
    borderWidth: 4,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#C7CCD6',
    textAlign: 'center',
    marginBottom: 34,
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B8BEC9',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 2,
  },
  settingsCard: {
    backgroundColor: '#161616',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 88,
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  rowDisabled: {
    opacity: 0.6,
  },
  settingsIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  settingsText: {
    flex: 1,
  },
  settingsLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.secondary,
    marginBottom: 4,
  },
  destructiveText: {
    color: '#FFB4AB',
  },
  settingsSubtitle: {
    fontSize: 16,
    color: '#C7CCD6',
  },
  myListingsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.secondary,
    marginBottom: 14,
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
