import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/Colors';
import { getCryptoPrices } from '../services/coinGeckoApi';

export default function CryptoHeader() {
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchPrices = async () => {
    try {
      const prices = await getCryptoPrices();
      if (prices) {
        setBtcPrice(prices.bitcoin.usd);
        setEthPrice(prices.ethereum.usd);
        setError(false);
      } else {
        setError(true);
      }
    } catch (err) {
      console.log('Failed to fetch prices, will retry...'); // CHANGED: Don't show error to user
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={Colors.secondary} />
      </View>
    );
  }

  if (error || !btcPrice || !ethPrice) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Crypto prices unavailable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.priceBox}>
        <Text style={styles.symbol}>₿ BTC</Text>
        <Text style={styles.price}>
          ${btcPrice?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </Text>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.priceBox}>
        <Text style={styles.symbol}>Ξ ETH</Text>
        <Text style={styles.price}>
          ${ethPrice?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.gray,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  symbol: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.accent,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.success,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#444',
  },
  errorText: {
    color: Colors.lightGray,
    fontSize: 12,
  },
});