import { Colors, Shadow } from '@/constants/theme';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Comment {
  id: string;
  pinId: string;
  profileId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PIN_COLORS: Record<string, string> = {
  TRASH: '#EF4444',
  CLEANUP: '#3B82F6',
  ECO_OFFER: '#F59E0B',
  COMMUNITY: '#8B5CF6',
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PinDiscussionScreen() {
  const insets = useSafeAreaInsets();
  const { pinId, title, category, pinCreatorId } = useLocalSearchParams<{
    pinId: string;
    title: string;
    category: string;
    pinCreatorId: string;
  }>();

  const accentColor = PIN_COLORS[category ?? ''] ?? Colors.emerald600;

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [existingForumId, setExistingForumId] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadComments();
    api.get<{ id: string }>('/api/user/profile')
      .then((p) => setMyProfileId(p.id))
      .catch(() => {});
    api.get<{ forumId: string }>(`/api/forums/by-pin/${pinId}`)
      .then((d) => setExistingForumId(d.forumId))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await api.get<Comment[]>(`/api/pins/${pinId}/comments`);
      setComments(data ?? []);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  const sendComment = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    try {
      const comment = await api.post<Comment>(`/api/pins/${pinId}/comments`, { text: trimmed });
      setComments((prev) => [...prev, comment]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      setText(trimmed); // restore on failure
    } finally {
      setSending(false);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => {
    const isOwn = item.profileId === myProfileId;
    return (
      <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
        {!isOwn && (
          <View style={[styles.avatar, { backgroundColor: accentColor }]}>
            <Text style={styles.avatarText}>{initials(item.authorName)}</Text>
          </View>
        )}
        <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
          {!isOwn && (
            <Text style={styles.authorName}>{item.authorName}</Text>
          )}
          <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>{item.text}</Text>
          <Text style={[styles.timeText, isOwn && styles.timeTextOwn]}>{formatTime(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient
        colors={[accentColor, accentColor + 'CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.headerSub}>Community Discussion</Text>
        </View>
        <View style={styles.headerActions}>
          {existingForumId ? (
            <TouchableOpacity
              style={styles.createForumBtn}
              onPress={() => router.push(`/forum-post?id=${existingForumId}`)}
              activeOpacity={0.85}
            >
              <Ionicons name="newspaper-outline" size={14} color={accentColor} />
              <Text style={[styles.createForumBtnText, { color: accentColor }]}>View Forum</Text>
            </TouchableOpacity>
          ) : myProfileId && myProfileId === pinCreatorId ? (
            <TouchableOpacity
              style={styles.createForumBtn}
              onPress={() => router.push(`/create-forum?prefillTitle=${encodeURIComponent(title ?? '')}&sourcePinId=${pinId}`)}
              activeOpacity={0.85}
            >
              <Ionicons name="newspaper-outline" size={14} color={accentColor} />
              <Text style={[styles.createForumBtnText, { color: accentColor }]}>Create Forum</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={accentColor} size="large" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={renderComment}
            contentContainerStyle={[
              styles.listContent,
              comments.length === 0 && styles.listContentEmpty,
            ]}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={loadComments} tintColor={accentColor} />
            }
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="chatbubbles-outline" size={48} color={Colors.gray300} />
                <Text style={styles.emptyTitle}>No messages yet</Text>
                <Text style={styles.emptySub}>Be the first to start the discussion!</Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Write a message…"
            placeholderTextColor={Colors.gray400}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={sendComment}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: accentColor }, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={sendComment}
            disabled={!text.trim() || sending}
            activeOpacity={0.85}
          >
            {sending
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <Ionicons name="send" size={18} color={Colors.white} />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7F9' },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  createForumBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  createForumBtnText: { fontSize: 12, fontWeight: '700' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  listContent: { padding: 16, gap: 12 },
  listContentEmpty: { flex: 1, justifyContent: 'center' },

  emptyWrap: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.gray500 },
  emptySub: { fontSize: 13, color: Colors.gray400 },

  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  messageRowOwn: { flexDirection: 'row-reverse' },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: 12 },

  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 3,
    ...Shadow.sm,
  },
  bubbleOther: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
  },
  bubbleOwn: {
    backgroundColor: Colors.emerald600,
    borderBottomRightRadius: 4,
  },

  authorName: { fontSize: 11, fontWeight: '700', color: Colors.gray500, marginBottom: 1 },
  messageText: { fontSize: 14, color: '#1A1A1A', lineHeight: 20 },
  messageTextOwn: { color: Colors.white },
  timeText: { fontSize: 10, color: Colors.gray400, alignSelf: 'flex-end' },
  timeTextOwn: { color: 'rgba(255,255,255,0.65)' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    ...Shadow.sm,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A1A1A',
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnDisabled: { opacity: 0.45 },
});
