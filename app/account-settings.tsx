import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AnimatedPressable from '../components/AnimatedPressable';
import { auth, db } from '../config/firebase';
import { Colors } from '../constants/Colors';
import { Radii, Spacing } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
};

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.name ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !user?.id) {
      showAlert('Login Required', 'Please sign in before changing account settings.');
      return;
    }

    const trimmedName = displayName.trim();
    const shouldUpdateName = trimmedName.length > 0 && trimmedName !== user.name;
    const shouldUpdatePassword = currentPassword || newPassword || confirmPassword;

    if (!shouldUpdateName && !shouldUpdatePassword) {
      showAlert('No Changes', 'There is nothing to save yet.');
      return;
    }

    if (shouldUpdatePassword) {
      if (!firebaseUser.email) {
        showAlert('Error', 'This account does not have an email password login.');
        return;
      }

      if (!currentPassword || !newPassword || !confirmPassword) {
        showAlert('Missing Password', 'Enter your current password, new password, and confirmation.');
        return;
      }

      if (newPassword.length < 6) {
        showAlert('Password Too Short', 'New password must be at least 6 characters.');
        return;
      }

      if (newPassword !== confirmPassword) {
        showAlert('Passwords Do Not Match', 'Confirm your new password and try again.');
        return;
      }
    }

    setSaving(true);
    try {
      if (shouldUpdateName) {
        await updateProfile(firebaseUser, { displayName: trimmedName });
        await setDoc(doc(db, 'users', user.id), {
          name: trimmedName,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }

      if (shouldUpdatePassword && firebaseUser.email) {
        const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
        await reauthenticateWithCredential(firebaseUser, credential);
        await updatePassword(firebaseUser, newPassword);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }

      showAlert('Saved', 'Your account settings were updated.');
    } catch (error) {
      console.error('[AccountSettings] save failed:', error);
      showAlert('Error', 'Could not save changes. Check your current password and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <AnimatedPressable style={styles.backButton} onPress={() => router.back()} scaleValue={0.94}>
              <Ionicons name="arrow-back" size={28} color="#C7CCD6" />
            </AnimatedPressable>
            <Text style={styles.title}>Account Settings</Text>
            <View style={styles.headerSpacer} />
          </View>

          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <View style={styles.readOnlyRow}>
              <View style={styles.fieldIcon}>
                <Ionicons name="mail-outline" size={24} color="#9CCBFF" />
              </View>
              <Text style={styles.readOnlyText}>{user?.email || 'No email available'}</Text>
            </View>
            <Text style={styles.helperText}>Contact support to change your registered email.</Text>

            <Text style={styles.fieldLabel}>Display Name</Text>
            <View style={styles.inputRow}>
              <View style={styles.fieldIcon}>
                <Ionicons name="person-outline" size={23} color="#9CCBFF" />
              </View>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Display name"
                placeholderTextColor="#808080"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Current Password</Text>
            <View style={styles.inputRow}>
              <View style={styles.fieldIcon}>
                <Ionicons name="lock-closed-outline" size={23} color="#C7CCD6" />
              </View>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Current password"
                placeholderTextColor="#808080"
                secureTextEntry
              />
            </View>

            <View style={styles.divider} />

            <Text style={styles.fieldLabel}>New Password</Text>
            <View style={styles.inputRow}>
              <View style={[styles.fieldIcon, styles.greenIcon]}>
                <Ionicons name="key-outline" size={23} color="#16C784" />
              </View>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor="#808080"
                secureTextEntry
              />
            </View>

            <Text style={styles.fieldLabel}>Confirm New Password</Text>
            <View style={styles.inputRow}>
              <View style={[styles.fieldIcon, styles.greenIcon]}>
                <Ionicons name="key-outline" size={23} color="#16C784" />
              </View>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#808080"
                secureTextEntry
              />
            </View>
          </View>

          <AnimatedPressable
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            scaleValue={0.97}
          >
            <Ionicons name="save-outline" size={22} color={Colors.secondary} />
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
          </AnimatedPressable>
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
  keyboardView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 28,
    paddingBottom: 42,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 18,
    paddingBottom: 30,
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B8BEC9',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#161616',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 24,
    marginBottom: 34,
  },
  fieldLabel: {
    fontSize: 16,
    color: '#C7CCD6',
    marginBottom: 12,
  },
  readOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  fieldIcon: {
    width: 46,
    height: 46,
    borderRadius: 7,
    backgroundColor: '#252B34',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  greenIcon: {
    backgroundColor: 'rgba(22,199,132,0.14)',
  },
  readOnlyText: {
    flex: 1,
    fontSize: 18,
    color: Colors.secondary,
  },
  helperText: {
    fontSize: 15,
    color: '#C7CCD6',
    lineHeight: 22,
    marginBottom: 22,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 70,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#697386',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
    marginBottom: 22,
  },
  input: {
    flex: 1,
    color: Colors.secondary,
    fontSize: 20,
    paddingVertical: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginBottom: 28,
  },
  saveButton: {
    minHeight: 70,
    borderRadius: Radii.md,
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 21,
    fontWeight: '800',
    color: Colors.secondary,
  },
});
