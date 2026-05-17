import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
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
import { getSavedListings, getUserListings, unsaveListingForUser } from '../../services/firebaseService';
import { Product } from '../../types';

type ProfileSection = 'listings' | 'saved';

const GRID_GAP = 10;
const PROFILE_MAX_WIDTH = 620;
const SOLD_PLACEHOLDER = 0;

export default function ProfileScreen() {
  const { user, isGuest } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [myListings, setMyListings] = useState<Product[]>([]);
  const [savedListings, setSavedListings] = useState<Product[]>([]);
  const [activeSection, setActiveSection] = useState<ProfileSection>('listings');
  const [refreshing, setRefreshing] = useState(false);

  const contentWidth = Math.min(width - 24, PROFILE_MAX_WIDTH);
  const cardWidth = (contentWidth - GRID_GAP) / 2;
  const cardImageHeight = Math.min(Math.max(cardWidth * 0.84, 132), 172);

  const loadProfileData = useCallback(async () => {
    if (!user?.id || isGuest) {
      setMyListings([]);
      setSavedListings([]);
      return;
    }

    try {
      const [userProducts, savedProducts] = await Promise.all([
        getUserListings(user.id),
        getSavedListings(user.id),
      ]);
      setMyListings(userProducts ?? []);
      setSavedListings(savedProducts ?? []);
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  }, [isGuest, user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [loadProfileData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  }, [loadProfileData]);

  const initials = (user?.name?.trim()?.charAt(0) || 'U').toUpperCase();
  const displayName = user?.name || 'ChainBazaar User';
  const username = useMemo(() => {
    const source = user?.name || user?.email?.split('@')[0] || 'chaintrader';
    return source.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'chaintrader';
  }, [user?.email, user?.name]);

  const activeData = activeSection === 'listings' ? myListings : savedListings;

  const handleAvatarEdit = useCallback(() => {
    Alert.alert('Coming Soon', 'Change profile photo coming soon.');
  }, []);

  const handleUnsave = useCallback(async (productId: string) => {
    if (!user?.id) return;

    setSavedListings((current) => current.filter((item) => item.id !== productId));

    try {
      await unsaveListingForUser(user.id, productId);
    } catch (error) {
      console.error('Error removing saved listing:', error);
      await loadProfileData();
    }
  }, [loadProfileData, user?.id]);

  const stopCardPress = (event: any) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    event?.nativeEvent?.stopImmediatePropagation?.();
  };

  const renderProductTile = ({ item }: { item: Product }) => {
    const imageUrl =
      item.imageUrls && item.imageUrls.length > 0
        ? item.imageUrls[0]
        : 'https://picsum.photos/400';

    return (
      <View
        style={[styles.gridCard, { width: cardWidth }]}
      >
        <AnimatedPressable
          style={styles.gridImagePress}
          onPress={() => router.push(`/product/${item.id}`)}
          scaleValue={0.98}
        >
          <Image
            source={{ uri: imageUrl }}
            style={[styles.gridImage, { height: cardImageHeight }]}
            resizeMode="cover"
          />
        </AnimatedPressable>
        {activeSection === 'saved' && (
          <AnimatedPressable
            style={styles.savedHeartButton}
            onPress={(event) => {
              stopCardPress(event);
              handleUnsave(item.id);
            }}
            onPressIn={stopCardPress}
            scaleValue={0.9}
          >
            <Ionicons name="heart" size={20} color="#FF9D9D" />
          </AnimatedPressable>
        )}
        <AnimatedPressable
          style={styles.gridInfo}
          onPress={() => router.push(`/product/${item.id}`)}
          scaleValue={0.98}
        >
          <Text style={styles.gridTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.gridPrice}>${Number(item.price).toFixed(2)}</Text>
        </AnimatedPressable>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={[styles.profileHeader, { width: contentWidth }]}>
      <View style={styles.topBar}>
        <View style={styles.topBarSpacer} />
        <Text style={styles.username} numberOfLines={1}>{username}</Text>
        <AnimatedPressable
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
          scaleValue={0.94}
        >
          <Ionicons name="settings-outline" size={26} color={Colors.secondary} />
        </AnimatedPressable>
      </View>

      <View style={styles.identityRow}>
        <AnimatedPressable
          style={styles.avatar}
          onPress={handleAvatarEdit}
          scaleValue={0.96}
        >
          <Text style={styles.avatarText}>{initials}</Text>
          <View style={styles.avatarEditBadge}>
            <Ionicons name="add" size={18} color="#0D0D0D" />
          </View>
        </AnimatedPressable>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{myListings.length}</Text>
            <Text style={styles.statLabel}>listings</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{SOLD_PLACEHOLDER}</Text>
            <Text style={styles.statLabel}>sold</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{savedListings.length}</Text>
            <Text style={styles.statLabel}>saved</Text>
          </View>
        </View>
      </View>

      <Text style={styles.name}>{displayName}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Text style={styles.bio}>Buying, selling, and discovering crypto-friendly finds.</Text>

      <View style={styles.profileActions}>
        <View style={styles.actionPill}>
          <Ionicons name="cube-outline" size={17} color="#C7CCD6" />
          <Text style={styles.actionPillText}>{myListings.length} active</Text>
        </View>
        <AnimatedPressable
          style={styles.actionPill}
          onPress={() => setActiveSection('saved')}
          scaleValue={0.96}
        >
          <Ionicons name="heart-outline" size={17} color="#C7CCD6" />
          <Text style={styles.actionPillText}>{savedListings.length} saved</Text>
        </AnimatedPressable>
      </View>

      <View style={styles.sectionTabs}>
        <AnimatedPressable
          style={[styles.sectionTab, activeSection === 'listings' && styles.sectionTabActive]}
          onPress={() => setActiveSection('listings')}
          scaleValue={0.98}
        >
          <Text style={[styles.sectionTabText, activeSection === 'listings' && styles.sectionTabTextActive]}>
            Listings
          </Text>
        </AnimatedPressable>
        <AnimatedPressable
          style={[styles.sectionTab, activeSection === 'saved' && styles.sectionTabActive]}
          onPress={() => setActiveSection('saved')}
          scaleValue={0.98}
        >
          <Text style={[styles.sectionTabText, activeSection === 'saved' && styles.sectionTabTextActive]}>
            Saved
          </Text>
        </AnimatedPressable>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={[styles.emptyContainer, { width: contentWidth }]}>
      <Ionicons
        name={activeSection === 'listings' ? 'pricetag-outline' : 'heart-outline'}
        size={42}
        color={Colors.lightGray}
      />
      <Text style={styles.emptyText}>
        {activeSection === 'listings' ? 'No active listings yet' : 'No saved items yet'}
      </Text>
      <Text style={styles.emptySubtext}>
        {activeSection === 'listings'
          ? 'Tap Sell to create your first listing.'
          : 'Save listings from Explore to view them here.'}
      </Text>
      {activeSection === 'listings' && (
        <AnimatedPressable
          style={styles.createButton}
          onPress={() => router.push('/(tabs)/create')}
          scaleValue={0.96}
        >
          <Text style={styles.createButtonText}>Create Listing</Text>
        </AnimatedPressable>
      )}
    </View>
  );

  if (isGuest || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.guestContainer}>
          <Ionicons name="person-circle-outline" size={58} color={Colors.lightGray} />
          <Text style={styles.guestTitle}>Welcome, Guest</Text>
          <Text style={styles.guestSubtitle}>
            Login to create listings, save items, and manage your marketplace profile.
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

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={activeData}
        extraData={activeSection}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={renderProductTile}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[styles.gridList, { width: contentWidth }]}
        columnWrapperStyle={styles.gridRow}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.secondary}
          />
        }
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

  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  guestTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.secondary,
    marginTop: Spacing.lg,
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
    fontWeight: '800',
  },

  gridList: {
    alignSelf: 'center',
    paddingBottom: 120,
  },
  profileHeader: {
    alignSelf: 'center',
    paddingTop: 18,
    paddingBottom: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  topBarSpacer: {
    width: 44,
  },
  username: {
    flex: 1,
    color: Colors.secondary,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 22,
  },
  avatarText: {
    fontSize: 31,
    fontWeight: '800',
    color: '#0D0D0D',
  },
  avatarEditBadge: {
    position: 'absolute',
    right: -3,
    bottom: 5,
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#9CCBFF',
    borderWidth: 3,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    minWidth: 68,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.secondary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#C7CCD6',
    fontWeight: '600',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.secondary,
    marginBottom: 3,
  },
  email: {
    fontSize: 14,
    color: Colors.lightGray,
    marginBottom: 12,
  },
  bio: {
    fontSize: 16,
    color: '#E6E6E6',
    lineHeight: 22,
    marginBottom: 16,
  },
  profileActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#161616',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionPillText: {
    color: '#C7CCD6',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
    marginBottom: 12,
  },
  sectionTab: {
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  sectionTabActive: {
    borderBottomColor: Colors.accent,
  },
  sectionTabText: {
    color: '#C7CCD6',
    fontSize: 16,
    fontWeight: '800',
  },
  sectionTabTextActive: {
    color: Colors.accent,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: GRID_GAP,
  },
  gridCard: {
    backgroundColor: '#161616',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    overflow: 'hidden',
  },
  gridImagePress: {
    width: '100%',
  },
  gridImage: {
    width: '100%',
    backgroundColor: '#1A1A1A',
  },
  savedHeartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridInfo: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 4,
  },
  gridPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.success,
  },
  emptyContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    paddingTop: 54,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.secondary,
    marginTop: 12,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.lightGray,
    textAlign: 'center',
    marginBottom: 18,
  },
  createButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: Radii.md,
  },
  createButtonText: {
    color: Colors.secondary,
    fontSize: 14,
    fontWeight: '800',
  },
});
