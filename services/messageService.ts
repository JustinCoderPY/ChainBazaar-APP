import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    Unsubscribe,
    updateDoc,
    where,
    writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Conversation, Message } from '../types';

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Generates a deterministic conversation ID from two user IDs.
 * Sorting guarantees the same ID regardless of who initiates.
 */
function makeConversationId(uid1: string, uid2: string, productId: string): string {
  const sorted = [uid1, uid2].sort();
  return `${sorted[0]}_${sorted[1]}_${productId}`;
}

// ═══════════════════════════════════════════════════════════════
// CREATE CONVERSATION IF NOT EXISTS
// ═══════════════════════════════════════════════════════════════

/**
 * Finds or creates a 1-to-1 conversation for a specific product.
 * Returns the conversation ID.
 *
 * Uses a deterministic doc ID (sorted UIDs + productId) to prevent
 * duplicate creation even under race conditions.
 */
export async function getOrCreateConversation(
  currentUserId: string,
  currentUserName: string,
  sellerId: string,
  sellerName: string,
  productId: string,
  productTitle: string,
): Promise<string> {
  const conversationId = makeConversationId(currentUserId, sellerId, productId);
  const conversationRef = doc(db, 'conversations', conversationId);

  const existing = await getDoc(conversationRef);

  if (existing.exists()) {
    console.log('[MessageService] Existing conversation found:', conversationId);
    return conversationId;
  }

  // Create new conversation document with a deterministic ID
  const participants: [string, string] = [currentUserId, sellerId].sort() as [string, string];

  await setDoc(conversationRef, {
    participants,
    participantNames: {
      [currentUserId]: currentUserName,
      [sellerId]: sellerName,
    },
    lastMessage: '',
    lastMessageSenderId: '',
    lastUpdated: serverTimestamp(),
    productId,
    productTitle,
  });

  console.log('[MessageService] Created new conversation:', conversationId);
  return conversationId;
}

// ═══════════════════════════════════════════════════════════════
// SEND MESSAGE
// ═══════════════════════════════════════════════════════════════

/**
 * Sends a message in a conversation.
 * Also updates the conversation's lastMessage metadata.
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
): Promise<string> {
  if (!content.trim()) {
    throw new Error('Message content cannot be empty');
  }

  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const conversationRef = doc(db, 'conversations', conversationId);

  // Add the message to the subcollection
  const messageDoc = await addDoc(messagesRef, {
    senderId,
    content: content.trim(),
    timestamp: serverTimestamp(),
    read: false,
  });

  // Update conversation metadata for the list view
  await updateDoc(conversationRef, {
    lastMessage: content.trim(),
    lastMessageSenderId: senderId,
    lastUpdated: serverTimestamp(),
  });

  console.log('[MessageService] Message sent:', messageDoc.id);
  return messageDoc.id;
}

// ═══════════════════════════════════════════════════════════════
// LISTEN TO MESSAGES (REAL-TIME)
// ══════════════════════════════════════════════════════════════���

/**
 * Subscribes to real-time message updates for a conversation.
 * Messages are ordered by timestamp ascending.
 *
 * @returns An unsubscribe function to call on cleanup.
 */
export function listenToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void,
): Unsubscribe {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages: Message[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Message[];

    callback(messages);
  }, (error) => {
    console.error('[MessageService] listenToMessages error:', error);
  });

  return unsubscribe;
}

// ═══════════════════════════════════════════════════════════════
// LISTEN TO CONVERSATIONS (REAL-TIME)
// ═══════════════════════════════════════════════════════════════

/**
 * Subscribes to real-time conversation list for the current user.
 * Ordered by lastUpdated descending (most recent first).
 *
 * @returns An unsubscribe function to call on cleanup.
 */
export function listenToConversations(
  currentUserId: string,
  callback: (conversations: Conversation[]) => void,
): Unsubscribe {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', currentUserId),
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const conversations: Conversation[] = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Conversation[];

    // Sort client-side by lastUpdated descending
    // (Firestore doesn't allow orderBy on a field + array-contains on a different field
    //  without a composite index — client-side sort is simpler for a marketplace scale)
    conversations.sort((a, b) => {
      const aTime = a.lastUpdated?.toMillis?.() ?? 0;
      const bTime = b.lastUpdated?.toMillis?.() ?? 0;
      return bTime - aTime;
    });

    callback(conversations);
  }, (error) => {
    console.error('[MessageService] listenToConversations error:', error);
  });

  return unsubscribe;
}

// ═══════════════════════════════════════════════════════════════
// MARK MESSAGES AS READ
// ═══════════════════════════════════════════════════════════════

/**
 * Marks all unread messages from the OTHER user as read.
 * Called when the current user opens a conversation.
 */
export async function markMessagesAsRead(
  conversationId: string,
  currentUserId: string,
): Promise<void> {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');

  // Query for unread messages NOT sent by the current user
  const q = query(
    messagesRef,
    where('read', '==', false),
    where('senderId', '!=', currentUserId),
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach((docSnap) => {
    batch.update(docSnap.ref, { read: true });
  });

  await batch.commit();
  console.log(`[MessageService] Marked ${snapshot.size} messages as read`);
}

// ═══════════════════════════════════════════════════════════════
// GET UNREAD COUNT FOR A CONVERSATION
// ═══════════════════════════════════════════════════════════════

/**
 * Returns the count of unread messages in a conversation for the current user.
 */
export async function getUnreadCount(
  conversationId: string,
  currentUserId: string,
): Promise<number> {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(
    messagesRef,
    where('read', '==', false),
    where('senderId', '!=', currentUserId),
  );

  const snapshot = await getDocs(q);
  return snapshot.size;
}