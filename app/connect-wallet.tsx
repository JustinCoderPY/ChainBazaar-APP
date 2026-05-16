import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AnimatedPressable from '../components/AnimatedPressable';
import { Colors } from '../constants/Colors';
import { Radii, Spacing } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { updateUserWalletPreference } from '../services/firebaseService';

type WalletOption = {
  name: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
};

const WALLETS: WalletOption[] = [
  {
    name: 'MetaMask',
    subtitle: 'Browser and mobile wallet',
    icon: 'logo-firefox',
    accent: '#F7931A',
  },
  {
    name: 'Coinbase Wallet',
    subtitle: 'Coinbase self-custody wallet',
    icon: 'ellipse-outline',
    accent: '#2E9AFE',
  },
  {
    name: 'Trust Wallet',
    subtitle: 'Multi-chain mobile wallet',
    icon: 'shield-checkmark-outline',
    accent: '#4AA3FF',
  },
  {
    name: 'WalletConnect',
    subtitle: 'Connect with QR or mobile link',
    icon: 'git-network-outline',
    accent: '#9CCBFF',
  },
];

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
};

export default function ConnectWalletScreen() {
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [savingWallet, setSavingWallet] = useState<string | null>(null);

  const handleSelectWallet = async (walletName: string) => {
    setSelectedWallet(walletName);

    if (isGuest || !user?.id) {
      showAlert('Login Required', 'Please sign in to save a wallet preference.');
      return;
    }

    setSavingWallet(walletName);
    try {
      await updateUserWalletPreference(user.id, walletName);
      showAlert('Wallet Selected', `${walletName} saved as your preferred wallet.`);
    } catch (error) {
      console.error('[ConnectWallet] save failed:', error);
      showAlert('Error', 'Could not save your wallet preference. Please try again.');
    } finally {
      setSavingWallet(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AnimatedPressable style={styles.backButton} onPress={() => router.back()} scaleValue={0.94}>
            <Ionicons name="arrow-back" size={28} color="#C7CCD6" />
          </AnimatedPressable>
          <Text style={styles.title}>Connect Wallet</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.heroIcon}>
          <Ionicons name="wallet-outline" size={54} color="#9CCBFF" />
        </View>
        <Text style={styles.heroTitle}>Connect Your Wallet</Text>
        <Text style={styles.heroText}>
          Start buying and selling items securely on the blockchain. Choose a wallet to get started.
        </Text>

        <View style={styles.walletList}>
          {WALLETS.map((wallet) => {
            const selected = selectedWallet === wallet.name;
            const saving = savingWallet === wallet.name;

            return (
              <AnimatedPressable
                key={wallet.name}
                style={[styles.walletRow, selected && styles.walletRowSelected]}
                onPress={() => handleSelectWallet(wallet.name)}
                scaleValue={0.98}
              >
                <View style={[styles.walletIcon, { backgroundColor: `${wallet.accent}18` }]}>
                  <Ionicons name={wallet.icon} size={28} color={wallet.accent} />
                </View>
                <View style={styles.walletText}>
                  <Text style={styles.walletName}>{wallet.name}</Text>
                  <Text style={styles.walletSubtitle}>{saving ? 'Saving preference...' : wallet.subtitle}</Text>
                </View>
                <Ionicons
                  name={selected ? 'checkmark-circle' : 'chevron-forward'}
                  size={24}
                  color={selected ? Colors.accent : '#C7CCD6'}
                />
              </AnimatedPressable>
            );
          })}
        </View>

        <Text style={styles.learnMore}>New to crypto wallets? Learn more</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  content: {
    paddingHorizontal: 22,
    paddingBottom: 42,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 18,
    paddingBottom: 34,
  },
  backButton: {
    width: 42,
    height: 42,
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 42,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.secondary,
  },
  heroIcon: {
    alignSelf: 'center',
    width: 118,
    height: 118,
    borderRadius: 24,
    backgroundColor: '#20262D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 26,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  heroText: {
    alignSelf: 'center',
    maxWidth: 440,
    fontSize: 17,
    color: '#C7CCD6',
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 36,
  },
  walletList: {
    gap: Spacing.lg,
  },
  walletRow: {
    minHeight: 108,
    backgroundColor: '#1A1A1A',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  walletRowSelected: {
    borderColor: Colors.accent,
    backgroundColor: '#16202B',
  },
  walletIcon: {
    width: 58,
    height: 58,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  walletText: {
    flex: 1,
  },
  walletName: {
    fontSize: 21,
    fontWeight: '800',
    color: Colors.secondary,
    marginBottom: 3,
  },
  walletSubtitle: {
    fontSize: 13,
    color: Colors.lightGray,
  },
  learnMore: {
    marginTop: 34,
    textAlign: 'center',
    color: '#9CCBFF',
    fontSize: 16,
  },
});
