import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Shadows, Radii, Spacing } from '../../constants/theme';
import { useAuth } from '../AuthContext';
import AnimatedPressable from '../../components/AnimatedPressable';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const success = await signup(name, email, password);
    setLoading(false);

    if (success) {
      Alert.alert('Success', 'Account created successfully!');
      router.back();
    } else {
      Alert.alert('Error', 'Please check your information');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <AnimatedPressable
          style={styles.closeButton}
          onPress={() => router.back()}
          scaleValue={0.9}
        >
          <Ionicons name="close" size={28} color={Colors.secondary} />
        </AnimatedPressable>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join ChainBazaar</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor={Colors.lightGray}
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.lightGray}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password (min 6 characters)"
            placeholderTextColor={Colors.lightGray}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <AnimatedPressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
            scaleValue={0.96}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </Text>
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => router.back()}
            style={styles.linkButton}
            scaleValue={0.98}
          >
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkBold}>Login</Text>
            </Text>
          </AnimatedPressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
    padding: Spacing.xxl,
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.lightGray,
    marginBottom: 40,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: Colors.gray,
    color: Colors.secondary,
    padding: Spacing.lg,
    borderRadius: Radii.md,
    fontSize: 16,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    backgroundColor: Colors.accent,
    padding: Spacing.lg,
    borderRadius: Radii.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
    ...Shadows.glow(Colors.accent),
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: Colors.secondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: Spacing.xxl,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  linkText: {
    color: Colors.lightGray,
    fontSize: 14,
  },
  linkBold: {
    color: Colors.accent,
    fontWeight: 'bold',
  },
});