import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing, Radii, Shadows } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import AnimatedPressable from '../components/AnimatedPressable';

// ─── Types ──────────────────────────────────────────────────
type IoniconsName = keyof typeof Ionicons.glyphMap;

interface SettingsItem {
  id: string;
  icon: IoniconsName;
  iconColor: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
}

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

export default function SettingsScreen() {
  const { user, isGuest, logout } = useAuth();
  const router = useRouter();

  // ─── Handlers ───────────────────────────────────────────────
  const handleChangePhoto = () => {
    Alert.alert(
      'Change Profile Photo',
      'This feature is coming soon. You will be able to upload a custom avatar.',
      [{ text: 'OK' }]
    );
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'Password management will be available once backend authentication is integrated.',
      [{ text: 'OK' }]
    );
  };

  const handleConnectWallet = () => {
    Alert.alert(
      'Connect Crypto Wallet',
      'Wallet integration (MetaMask, WalletConnect) is planned for a future release.',
      [{ text: 'OK' }]
    );
  };

  const handleNotifications = () => {
    Alert.alert(
      'Notifications',
      'Push notification preferences will be available soon.',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      'Privacy',
      'Privacy settings will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  const handleHelpCenter = () => {
    Alert.alert(
      'Help Center',
      'Need help? Contact us at support@chainbazaar.com',
      [{ text: 'OK' }]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  // ─── Section Data ───────────────────────────────────────────
  const sections: SettingsSection[] = [
    {
      title: 'Account',
      items: [
        {
          id: 'photo',
          icon: 'camera-outline',
          iconColor: Colors.accent,
          label: 'Change Profile Photo',
          subtitle: 'Upload a custom avatar',
          onPress: handleChangePhoto,
        },
        {
          id: 'password',
          icon: 'lock-closed-outline',
          iconColor: '#A78BFA',
          label: 'Change Password',
          subtitle: 'Update your login credentials',
          onPress: handleChangePassword,
        },
      ],
    },
    {
      title: 'Crypto',
      items: [
        {
          id: 'wallet',
          icon: 'wallet-outline',
          iconColor: '#F7931A',
          label: 'Connect Crypto Wallet',
          subtitle: 'MetaMask, WalletConnect',
          onPress: handleConnectWallet,
        },
      ],
    },
    {
      title: 'App Settings',
      items: [
        {
          id: 'notifications',
          icon: 'notifications-outline',
          iconColor: '#10B981',
          label: 'Notifications',
          subtitle: 'Push notification preferences',
          onPress: handleNotifications,
        },
        {
          id: 'privacy',
          icon: 'shield-checkmark-outline',
          iconColor: '#6366F1',
          label: 'Privacy',
          subtitle: 'Data and visibility settings',
          onPress: handlePrivacy,
        },
        {
          id: 'help',
          icon: 'help-circle-outline',
          iconColor: '#808080',
          label: 'Help Center',
          subtitle: 'FAQ and support',
          onPress: handleHelpCenter,
        },
      ],
    },
    {
      title: '',
      items: [
        {
          id: 'logout',
          icon: 'log-out-outline',
          iconColor: Colors.danger,
          label: 'Logout',
          onPress: handleLogout,
          destructive: true,
        },
      ],
    },
  ];

  // ─── Render Helpers ─────────────────────────────────────────
  const renderItem = (item: SettingsItem, isLast: boolean) => (
    <AnimatedPressable
      key={item.id}
      style={[styles.item, isLast && styles.itemLast]}
      onPress={item.onPress}
      scaleValue={0.98}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: `${item.iconColor}15` }]}>
        <Ionicons name={item.icon} size={20} color={item.iconColor} />
      </View>

      {/* Label + subtitle */}
      <View style={styles.itemContent}>
        <Text style={[styles.itemLabel, item.destructive && styles.itemLabelDestructive]}>
          {item.label}
        </Text>
        {item.subtitle && (
          <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
        )}
      </View>

      {/* Chevron (not shown for destructive/logout) */}
      {!item.destructive && (
        <Ionicons name="chevron-forward" size={18} color="#444" />
      )}
    </AnimatedPressable>
  );

  const renderSection = (section: SettingsSection, index: number) => (
    <View key={index} style={styles.section}>
      {section.title !== '' && (
        <Text style={styles.sectionTitle}>{section.title}</Text>
      )}
      <View style={styles.sectionCard}>
        {section.items.map((item, i) =>
          renderItem(item, i === section.items.length - 1)
        )}
      </View>
    </View>
  );

  // ─── Render ─────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {isGuest ? '?' : user?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {isGuest ? 'Guest User' : user?.name}
            </Text>
            <Text style={styles.profileEmail}>
              {isGuest ? 'Not signed in' : user?.email}
            </Text>
          </View>
        </View>

        {/* Settings Sections */}
        {sections.map((section, index) => renderSection(section, index))}

        {/* App Version */}
        <Text style={styles.version}>ChainBazaar v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // ── Profile Card ──
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxl,
    padding: Spacing.xl,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#252525',
    ...Shadows.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
    ...Shadows.glow(Colors.accent),
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: Colors.lightGray,
  },

  // ── Sections ──
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.lightGray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  sectionCard: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: Spacing.lg,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#252525',
    overflow: 'hidden',
  },

  // ── Items ──
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.secondary,
  },
  itemLabelDestructive: {
    color: Colors.danger,
  },
  itemSubtitle: {
    fontSize: 12,
    color: Colors.lightGray,
    marginTop: 2,
  },

  // ── Version ──
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#444',
    marginTop: Spacing.md,
  },
});