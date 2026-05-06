import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { listenToConversations } from '../../services/messageService';
import { Conversation } from '../../types';

export default function MessagesScreen() {
  const { isGuest, user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── Subscribe to real-time conversations ──────────────────
  useEffect(() => {
    if (isGuest || !user?.id) {
      setLoading(false);
      return;
    }

    const unsubscribe = listenToConversations(user.id, (convos) => {
      setConversations(convos);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isGuest, user?.id]);

  // ─── Guest State ──────────────────────────────────────────
  if (isGuest) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <View style={styles.guestContainer}>
          <Ionicons name="chatbubbles-outline" size={56} color="#333" />
          <Text style={styles.guestTitle}>Sign in to view messages</Text>
          <Text style={styles.guestSubtitle}>
            Log in to chat with buyers and sellers
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Helper: get the other user's name ─────────────────────
  const getOtherUserName = (conv: Conversation): string => {
    if (!user?.id || !conv.participantNames) return 'User';
    const otherUserId = conv.participants.find((p) => p !== user.id);
    return otherUserId ? (conv.participantNames[otherUserId] || 'User') : 'User';
  };

  // ─── Helper: format timestamp ──────────────────────────────
  const formatTimestamp = (ts: any): string => {
    if (!ts?.toDate) return '';
    const date = ts.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // ─── Render Conversation Item ─────────────────────────────
  const renderItem = ({ item }: { item: Conversation }) => {
    const otherName = getOtherUserName(item);
    const avatarLetter = otherName.charAt(0).toUpperCase();
    const isOwnMessage = item.lastMessageSenderId === user?.id;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        activeOpacity={0.6}
        onPress={() =>
          router.push(
            `/chat/${item.id}?name=${encodeURIComponent(otherName)}`
          )
        }
      >
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: Colors.accent }]}>
          <Text style={styles.avatarText}>{avatarLetter}</Text>
        </View>

        {/* Content */}
        <View style={styles.conversationContent}>
          <View style={styles.conversationTopRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {otherName}
            </Text>
            <Text style={styles.timestamp}>
              {formatTimestamp(item.lastUpdated)}
            </Text>
          </View>
          <View style={styles.conversationBottomRow}>
            <Text style={styles.productLabel} numberOfLines={1}>
              {item.productTitle}
            </Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {isOwnMessage ? 'You: ' : ''}
            {item.lastMessage || 'No messages yet'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSeparator = () => <View style={styles.separator} />;

  // ─── Main Render ──────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={renderSeparator}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={56} color="#333" />
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubtext}>
                Messages from buyers and sellers will appear here
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.secondary,
  },

  // ── List ──
  list: {
    paddingBottom: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#1E1E1E',
    marginLeft: 76,
  },

  // ── Conversation Item ──
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 19,
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  conversationContent: {
    flex: 1,
  },
  conversationTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#555',
  },
  conversationBottomRow: {
    marginBottom: 2,
  },
  productLabel: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '500',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },

  // ── Empty / Guest ──
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    lineHeight: 18,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 14,
    color: Colors.lightGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: Colors.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});