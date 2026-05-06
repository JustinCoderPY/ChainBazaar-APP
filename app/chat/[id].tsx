import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import {
  listenToMessages,
  markMessagesAsRead,
  sendMessage,
} from '../../services/messageService';
import { Message } from '../../types';

export default function ChatScreen() {
  const { id, name } = useLocalSearchParams<{
    id: string;
    name: string;
  }>();
  const router = useRouter();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const conversationId = id as string;
  const otherUserName = name || 'User';

  // ─── Subscribe to real-time messages ──────────────────────
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = listenToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setLoading(false);

      // Scroll to bottom when new messages arrive
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => unsubscribe();
  }, [conversationId]);

  // ─── Mark messages as read when screen opens ──────────────
  useEffect(() => {
    if (!conversationId || !user?.id) return;

    markMessagesAsRead(conversationId, user.id).catch((err) =>
      console.error('[ChatScreen] markMessagesAsRead error:', err)
    );
  }, [conversationId, user?.id, messages.length]);

  // ─── Send handler ──────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!inputText.trim() || sending || !user?.id) return;

    const text = inputText.trim();
    setInputText(''); // Clear immediately for UX
    setSending(true);

    try {
      await sendMessage(conversationId, user.id, text);
    } catch (error) {
      console.error('[ChatScreen] Error sending message:', error);
      setInputText(text); // Restore on failure
    } finally {
      setSending(false);
    }
  }, [inputText, sending, user?.id, conversationId]);

  // ─── Render Message Bubble ────────────────────────────────
  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.id;

    return (
      <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
        <View
          style={[
            styles.bubble,
            isMe ? styles.bubbleMe : styles.bubbleThem,
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              isMe ? styles.bubbleTextMe : styles.bubbleTextThem,
            ]}
          >
            {item.content}
          </Text>
          <View style={styles.bubbleMeta}>
            <Text style={[styles.timeText, isMe && styles.timeTextMe]}>
              {item.timestamp?.toDate
                ? item.timestamp.toDate().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ''}
            </Text>
            {isMe && (
              <Ionicons
                name={item.read ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={item.read ? '#4ADE80' : '#888'}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  // ─── Render ───────────────────────────────────────────────
  return (
    <>
      <Stack.Screen
        options={{
          title: otherUserName,
          headerStyle: { backgroundColor: Colors.primary },
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
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Colors.accent} size="large" />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="chatbubble-ellipses-outline" size={48} color="#333" />
                  <Text style={styles.emptyText}>No messages yet</Text>
                  <Text style={styles.emptySubtext}>
                    Say hello to start the conversation!
                  </Text>
                </View>
              }
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: false })
              }
            />
          )}

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="#555"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              returnKeyType="default"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || sending) && styles.sendButtonDisabled,
              ]}
              activeOpacity={0.7}
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator color={Colors.secondary} size="small" />
              ) : (
                <Ionicons name="send" size={20} color={Colors.secondary} />
              )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.lightGray,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },

  // ── Bubbles ──
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bubbleRowMe: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
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
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
    color: '#888',
  },
  timeTextMe: {
    color: 'rgba(255,255,255,0.6)',
  },

  // ── Input Bar ──
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
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
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});