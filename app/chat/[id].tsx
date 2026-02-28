import React, { useRef, useEffect } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

// ─── Types ──────────────────────────────────────────────────
interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: string;
}

// ─── Mock Messages (keyed by conversation ID) ───────────────
const MOCK_MESSAGES: Record<string, Message[]> = {
  conv_1: [
    { id: '1', text: 'Hi! I saw your iPhone 14 Pro listing', sender: 'them', timestamp: '10:30 AM' },
    { id: '2', text: 'Hey! Yes, it\'s still available', sender: 'me', timestamp: '10:32 AM' },
    { id: '3', text: 'What condition is it in?', sender: 'them', timestamp: '10:33 AM' },
    { id: '4', text: 'Excellent condition. Only had it for 6 months. Comes with original box and charger.', sender: 'me', timestamp: '10:35 AM' },
    { id: '5', text: 'Would you take $850?', sender: 'them', timestamp: '10:36 AM' },
    { id: '6', text: 'I can do $900, that\'s the lowest I\'d go', sender: 'me', timestamp: '10:38 AM' },
    { id: '7', text: 'Is the iPhone 14 Pro still available?', sender: 'them', timestamp: '10:40 AM' },
  ],
  conv_2: [
    { id: '1', text: 'Hey, interested in the gaming laptop', sender: 'them', timestamp: '9:00 AM' },
    { id: '2', text: 'Sure! It\'s an RTX 3080, 32GB RAM, 1TB SSD', sender: 'me', timestamp: '9:05 AM' },
    { id: '3', text: 'Nice specs. Listed at $1,899 right?', sender: 'them', timestamp: '9:06 AM' },
    { id: '4', text: 'Yes, negotiable though', sender: 'me', timestamp: '9:08 AM' },
    { id: '5', text: 'Yeah I can do $1,750 for the laptop. Deal?', sender: 'them', timestamp: '9:10 AM' },
  ],
  conv_3: [
    { id: '1', text: 'Hey, the watch shipped today!', sender: 'me', timestamp: 'Yesterday' },
    { id: '2', text: 'Awesome, what carrier?', sender: 'them', timestamp: 'Yesterday' },
    { id: '3', text: 'FedEx. Should arrive in 2-3 days', sender: 'me', timestamp: 'Yesterday' },
    { id: '4', text: 'Sent you the tracking number', sender: 'me', timestamp: 'Yesterday' },
  ],
  conv_4: [
    { id: '1', text: 'Hi, love the vintage camera listing!', sender: 'them', timestamp: 'Yesterday' },
    { id: '2', text: 'Thanks! It\'s a beauty', sender: 'me', timestamp: 'Yesterday' },
    { id: '3', text: 'Can you ship to New York?', sender: 'them', timestamp: 'Yesterday' },
  ],
  conv_5: [
    { id: '1', text: 'Just sent the ETH payment', sender: 'them', timestamp: '2 days ago' },
    { id: '2', text: 'Got it! I\'ll ship the sunglasses today', sender: 'me', timestamp: '2 days ago' },
    { id: '3', text: 'Payment confirmed. Thanks!', sender: 'them', timestamp: '2 days ago' },
  ],
  conv_6: [
    { id: '1', text: 'Interested in the mechanical keyboard', sender: 'them', timestamp: '3 days ago' },
    { id: '2', text: 'It\'s Cherry MX Blue switches, RGB backlit', sender: 'me', timestamp: '3 days ago' },
    { id: '3', text: 'Would you accept 0.015 BTC?', sender: 'them', timestamp: '3 days ago' },
  ],
};

export default function ChatScreen() {
  const { id, name, color } = useLocalSearchParams<{
    id: string;
    name: string;
    color: string;
  }>();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const messages = MOCK_MESSAGES[id as string] || [];
  const otherUserName = name || 'User';
  const avatarColor = color || Colors.accent;
  const avatarLetter = otherUserName.charAt(0).toUpperCase();

  // Scroll to bottom on mount
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, []);

  // ─── Render Message Bubble ────────────────────────────────
  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender === 'me';

    return (
      <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
        {/* Other user's avatar (only for their messages) */}
        {!isMe && (
          <View style={[styles.bubbleAvatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.bubbleAvatarText}>{avatarLetter}</Text>
          </View>
        )}

        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
            {item.text}
          </Text>
          <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
            {item.timestamp}
          </Text>
        </View>
      </View>
    );
  };

  // ─── Render ───────────────────────────────────────────────
  return (
    <>
      {/* Dynamic header configured via Expo Router's Stack.Screen */}
      <Stack.Screen
        options={{
          title: otherUserName,
          headerStyle: { backgroundColor: '#121212' },
          headerTintColor: '#FFFFFF',
          headerShadowVisible: false,
          headerBackTitle: 'Back',
        }}
      />

      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
          />

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="#555"
              editable={false}
            />
            <TouchableOpacity
              style={styles.sendButton}
              activeOpacity={0.7}
              onPress={() => {
                // Non-functional — placeholder for future implementation
              }}
            >
              <Ionicons name="send" size={20} color={Colors.secondary} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  keyboardView: {
    flex: 1,
  },

  // ── Message List ──
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  // ── Bubble Layout ──
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    maxWidth: '85%',
  },
  bubbleRowMe: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  bubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  bubbleAvatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.secondary,
  },

  // ── Bubble Styles ──
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: '100%',
  },
  bubbleMe: {
    backgroundColor: Colors.accent,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: '#1E1E1E',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  bubbleTextMe: {
    color: Colors.secondary,
  },
  bubbleTextThem: {
    color: Colors.secondary,
  },
  bubbleTime: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  bubbleTimeMe: {
    color: 'rgba(255,255,255,0.6)',
  },

  // ── Input Bar ──
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
    backgroundColor: Colors.primary,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    color: Colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginRight: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
});