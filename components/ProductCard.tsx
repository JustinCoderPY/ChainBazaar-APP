import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Product } from '../types';
import { Colors } from '../constants/Colors';

interface Props {
  product: Product;
  btcPrice: number;
  ethPrice: number;
  onPress: () => void;
}

export default function ProductCard({ product, btcPrice, ethPrice, onPress }: Props) {
  const btcAmount = (product.price / btcPrice).toFixed(6);
  const ethAmount = (product.price / ethPrice).toFixed(6);

  // Use first image or placeholder
  const imageUrl = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls[0] 
    : 'https://picsum.photos/300';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image 
        source={{ uri: imageUrl }} 
        style={styles.image}
      />
      {product.imageUrls && product.imageUrls.length > 1 && (
        <View style={styles.imageBadge}>
          <Text style={styles.imageBadgeText}>+{product.imageUrls.length - 1}</Text>
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {product.title}
        </Text>
        <Text style={styles.category}>{product.category}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.usdPrice}>${product.price.toFixed(2)}</Text>
          <Text style={styles.cryptoPrice}>
            ₿ {btcAmount} | Ξ {ethAmount}
          </Text>
        </View>
        
        <Text style={styles.seller}>Sold by {product.sellerName}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.gray,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#1a1a1a',
  },
  imageBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageBadgeText: {
    color: Colors.secondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: Colors.lightGray,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  priceContainer: {
    marginBottom: 8,
  },
  usdPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.success,
    marginBottom: 4,
  },
  cryptoPrice: {
    fontSize: 12,
    color: Colors.lightGray,
  },
  seller: {
    fontSize: 11,
    color: Colors.lightGray,
    fontStyle: 'italic',
  },
});