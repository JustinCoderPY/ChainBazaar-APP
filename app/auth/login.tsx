import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const success = await login(email, password);
    setLoading(false);

    if (success) {
      Alert.alert('Success', 'Logged in successfully!');
      router.back();
    } else {
      Alert.alert('Error', 'Password must be at least 6 characters');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Login to ChainBazaar</Text>

        <View style={styles.form}>
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
            placeholder="Password"
            placeholderTextColor={Colors.lightGray}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/auth/signup')}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkBold}>Sign up</Text>
            </Text>
          </TouchableOpacity>
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
    padding: 24,
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  closeText: {
    fontSize: 32,
    color: Colors.secondary,
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
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    backgroundColor: Colors.accent,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: Colors.secondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
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