import { FontAwesome5 } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { formatPercentChange } from '../services/cryptoPriceService'; // ✅ NEW import

// ─── Props ──────────────────────────────────────────────────
interface CryptoHeaderProps {
  userName: string | null;
  isGuest: boolean;
  onProfilePress: () => void;
  btcPrice: number;
  ethPrice: number;
  btcChange24h?: number;    // ✅ NEW
  ethChange24h?: number;    // ✅ NEW
  pricesLoading?: boolean;
}

export default function HomeHeader({
  userName,
  isGuest,
  onProfilePress,
  btcPrice,
  ethPrice,
  btcChange24h = 0,    // ✅ NEW with default
  ethChange24h = 0,    // ✅ NEW with default
  pricesLoading = false,
}: CryptoHeaderProps) {
  const avatarLetter = isGuest
    ? '?'
    : userName?.charAt(0).toUpperCase() || '?';

  const formatPrice = (price: number): string => {
    return price.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    });
  };

  return (
    <View style={styles.container}>
      {/* ── Top Row: Logo + Profile Avatar ───────────────────── */}
      <View style={styles.topRow}>
        <Image
          source={require('../assets/images/chainbazaar-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={styles.avatarButton}
          onPress={onProfilePress}
          activeOpacity={0.8}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Crypto Ticker Row ────────────────────────────────── */}
      <View style={styles.tickerRow}>
        {pricesLoading ? (
          <ActivityIndicator color={Colors.secondary} size="small" />
        ) : (
          <>
            {/* BTC */}
            <View style={styles.tickerItem}>
              <View style={styles.tickerIconContainer}>
                <FontAwesome5 name="bitcoin" size={14} color="#F7931A" />
              </View>
              <View>
                <Text style={styles.tickerLabel}>Bitcoin</Text>
                <Text style={styles.tickerPrice}>${formatPrice(btcPrice)}</Text>
                {/* ✅ NEW: 24h percentage change */}
                <Text
                  style={[
                    styles.tickerChange,
                    { color: btcChange24h >= 0 ? '#4ADE80' : '#F87171' },
                  ]}
                >
                  {formatPercentChange(btcChange24h)}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.tickerDivider} />

            {/* ETH */}
            <View style={styles.tickerItem}>
              <View style={[styles.tickerIconContainer, styles.ethIcon]}>
                <FontAwesome5 name="ethereum" size={14} color="#627EEA" />
              </View>
              <View>
                <Text style={styles.tickerLabel}>Ethereum</Text>
                <Text style={styles.tickerPrice}>${formatPrice(ethPrice)}</Text>
                {/* ✅ NEW: 24h percentage change */}
                <Text
                  style={[
                    styles.tickerChange,
                    { color: ethChange24h >= 0 ? '#4ADE80' : '#F87171' },
                  ]}
                >
                  {formatPercentChange(ethChange24h)}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  logo: {
    width: 160,
    height: 44,
  },
  avatarButton: {
    padding: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  tickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  tickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  tickerIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(247, 147, 26, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ethIcon: {
    backgroundColor: 'rgba(98, 126, 234, 0.12)',
  },
  tickerLabel: {
    fontSize: 11,
    color: Colors.lightGray,
    fontWeight: '500',
    marginBottom: 1,
  },
  tickerPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  // ✅ NEW style for the percentage change
  tickerChange: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  tickerDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#333',
    marginHorizontal: 16,
  },
});