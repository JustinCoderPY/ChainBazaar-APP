import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Shadows, Radii, Spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import AnimatedPressable from '../../components/AnimatedPressable';

// ✅ Firebase functions (your backend)
import { createListing, uploadImage } from '../../services/firebaseService';

const CATEGORIES = ['Electronics', 'Clothing', 'Home', 'Sports', 'Books', 'Other'];

export default function CreateListingScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const { user, isGuest } = useAuth();
  const router = useRouter();

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to upload images.'
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled) {
        const newImages = result.assets.map((asset) => asset.uri);
        setImages((prev) => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (isGuest) {
      Alert.alert('Login Required', 'Please login to create a listing', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }
    if (images.length === 0) {
      Alert.alert('Error', 'Please add at least one image');
      return;
    }

    setLoading(true);

    try {
      // ✅ Upload images to Firebase Storage, store download URLs
      const uploadedImageUrls: string[] = [];

      for (let i = 0; i < images.length; i++) {
        const filename = `${user?.id || 'user'}_${Date.now()}_${i}.jpg`;
        const downloadURL = await uploadImage(images[i], filename);
        uploadedImageUrls.push(downloadURL);
      }

      // ✅ Create listing in Firestore
      const newListing = {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category,
        imageUrls: uploadedImageUrls,
        sellerId: user!.id,
        sellerName: user!.name,
        createdAt: new Date().toISOString(),
      };

      await createListing(newListing);

      Alert.alert('Success!', 'Your listing has been created! 🎉', [
        {
          text: 'OK',
          onPress: () => {
            setTitle('');
            setDescription('');
            setPrice('');
            setImages([]);
            setCategory('Electronics');
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error creating listing:', error);
      Alert.alert('Error', `Failed to create listing: ${error?.message ?? 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <AnimatedPressable onPress={() => router.back()} scaleValue={0.95}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </AnimatedPressable>
            <Text style={styles.headerTitle}>Create Listing</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.form}>
            <Text style={styles.subtitle}>List your item for sale</Text>

            {/* Image Picker */}
            <Text style={styles.label}>Photos *</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imageScrollContainer}
            >
              {images.map((uri, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri }} style={styles.uploadedImage} />
                  <AnimatedPressable
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                    scaleValue={0.85}
                  >
                    <Ionicons name="close" size={16} color={Colors.secondary} />
                  </AnimatedPressable>
                </View>
              ))}

              <AnimatedPressable
                style={styles.addImageButton}
                onPress={pickImage}
                scaleValue={0.95}
              >
                <Ionicons name="camera-outline" size={28} color={Colors.lightGray} />
                <Text style={styles.addImageText}>Add Photo</Text>
              </AnimatedPressable>
            </ScrollView>

            {/* Title */}
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., iPhone 14 Pro"
              placeholderTextColor={Colors.lightGray}
              value={title}
              onChangeText={setTitle}
            />

            {/* Description */}
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

            {/* Price */}
            <Text style={styles.label}>Price (USD) *</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0.00"
                placeholderTextColor={Colors.lightGray}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Category */}
            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryContainer}>
              {CATEGORIES.map((cat) => (
                <AnimatedPressable
                  key={cat}
                  style={[
                    styles.categoryButton,
                    category === cat && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory(cat)}
                  scaleValue={0.93}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      category === cat && styles.categoryButtonTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>

            {/* Submit */}
            <AnimatedPressable
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              scaleValue={0.96}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Uploading...' : 'Create Listing'}
              </Text>
            </AnimatedPressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  cancelButton: {
    color: Colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  form: {
    padding: Spacing.xl,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.lightGray,
    marginBottom: Spacing.xxl,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  imageScrollContainer: {
    marginBottom: Spacing.sm,
  },
  imageContainer: {
    marginRight: Spacing.md,
    position: 'relative',
  },
  uploadedImage: {
    width: 120,
    height: 120,
    borderRadius: Radii.sm,
    backgroundColor: Colors.gray,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.danger,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: 120,
    height: 120,
    borderRadius: Radii.sm,
    backgroundColor: Colors.gray,
    borderWidth: 2,
    borderColor: '#444',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    color: Colors.lightGray,
    fontSize: 12,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.gray,
    color: Colors.secondary,
    padding: Spacing.lg,
    borderRadius: Radii.sm,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: '#333',
    paddingLeft: Spacing.lg,
  },
  dollarSign: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.success,
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    color: Colors.secondary,
    padding: Spacing.lg,
    fontSize: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  categoryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
    borderRadius: Radii.pill,
    backgroundColor: Colors.gray,
    borderWidth: 1,
    borderColor: '#444',
  },
  categoryButtonActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  categoryButtonText: {
    color: Colors.lightGray,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: Colors.secondary,
  },
  submitButton: {
    backgroundColor: Colors.success,
    padding: 18,
    borderRadius: Radii.md,
    alignItems: 'center',
    marginTop: Spacing.xxxl,
    marginBottom: Spacing.huge,
    ...Shadows.glow(Colors.success),
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitButtonText: {
    color: Colors.secondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
});