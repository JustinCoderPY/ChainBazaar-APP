import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Product } from '../types';
import { addProduct } from '../services/storage';

const CATEGORIES = ['Electronics', 'Clothing', 'Home', 'Sports', 'Books', 'Other'];

export default function CreateListingScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    setLoading(true);

    // Create product object
    const newProduct: Product = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      category,
      imageUrl: imageUrl.trim() || `https://picsum.photos/seed/${Date.now()}/400/300`,
      sellerId: 'user123', // TODO: Replace with actual user ID
      sellerName: 'Current User', // TODO: Replace with actual user name
      createdAt: new Date().toISOString(),
    };

    try {
      await addProduct(newProduct);
      
      Alert.alert(
        'Success! 🎉',
        'Your listing has been created!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setTitle('');
              setDescription('');
              setPrice('');
              setImageUrl('');
              setCategory('Electronics');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.header}>Create New Listing</Text>
        <Text style={styles.subheader}>List your item for sale</Text>

        {/* Image Preview */}
        {imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={styles.imagePreview}
            onError={() => setImageUrl('')}
          />
        )}

        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., iPhone 14 Pro"
            placeholderTextColor={Colors.lightGray}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your item..."
            placeholderTextColor={Colors.lightGray}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Price */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price (USD) *</Text>
          <View style={styles.priceInputContainer}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={[styles.input, styles.priceInput]}
              placeholder="0.00"
              placeholderTextColor={Colors.lightGray}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.categoryContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  category === cat && styles.categoryButtonActive,
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === cat && styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Image URL (Optional) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Image URL (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://example.com/image.jpg"
            placeholderTextColor={Colors.lightGray}
            value={imageUrl}
            onChangeText={setImageUrl}
            autoCapitalize="none"
            keyboardType="url"
          />
          <Text style={styles.hint}>
            Leave blank for a random placeholder image
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Creating...' : '🚀 Create Listing'}
          </Text>
        </TouchableOpacity>

        <View style={styles.spacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginBottom: 4,
    marginTop: 20,
  },
  subheader: {
    fontSize: 14,
    color: Colors.lightGray,
    marginBottom: 24,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: Colors.gray,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.gray,
    color: Colors.secondary,
    padding: 14,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dollarSign: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.success,
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  priceInput: {
    flex: 1,
    paddingLeft: 32,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.gray,
    borderWidth: 1,
    borderColor: '#333',
  },
  categoryButtonActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  categoryText: {
    color: Colors.lightGray,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: Colors.secondary,
    fontWeight: 'bold',
  },
  hint: {
    fontSize: 12,
    color: Colors.lightGray,
    marginTop: 4,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: Colors.success,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#444',
  },
  submitButtonText: {
    color: Colors.secondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  spacer: {
    height: 40,
  },
});