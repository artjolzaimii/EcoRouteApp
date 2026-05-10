import { Colors, Shadow } from '@/constants/theme';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ForumPost {
  id: string;
  profileId: string;
  authorName: string;
  title: string;
  body: string | null;
  imageUrl: string | null;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

interface ForumComment {
  id: string;
  forumId: string;
  profileId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ForumPostScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [liked, setLiked] = useState(false);
  const [text, setText] = useState('');
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [photoVisible, setPhotoVisible] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    Promise.all([
      api.get<ForumPost>(`/api/forums/${id}`).then(setPost),
      api.get<ForumComment[]>(`/api/forums/${id}/comments`).then((d) => setComments(d ?? [])),
      api.get<{ id: string }>('/api/user/profile').then((p) => setMyProfileId(p.id)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleLike = async () => {
    if (!post) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setPost((p) => p ? { ...p, likeCount: p.likeCount + (wasLiked ? -1 : 1) } : null);
    try {
      const result = await api.post<{ likeCount: number; hasLiked: boolean }>(`/api/forums/${id}/like`, {});
      setPost((p) => p ? { ...p, likeCount: result.likeCount } : null);
      setLiked(result.hasLiked);
    } catch {
      setLiked(wasLiked);
      setPost((p) => p ? { ...p, likeCount: p.likeCount + (wasLiked ? 1 : -1) } : null);
    }
  };

  const deletePost = () => {
    Alert.alert('Delete Post', 'This will permanently delete your post and all its comments.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await api.delete(`/api/forums/${id}`);
            router.replace('/(tabs)/forum');
          } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'Could not delete post.');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  const sendComment = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    try {
      const comment = await api.post<ForumComment>(`/api/forums/${id}/comments`, { text: trimmed });
      setComments((prev) => [...prev, comment]);
      setPost((p) => p ? { ...p, commentCount: p.commentCount + 1 } : null);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const renderComment = ({ item }: { item: ForumComment }) => {
    const isOwn = item.profileId === myProfileId;
    return (
      <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
        {!isOwn && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(item.authorName)}</Text>
          </View>
        )}
        <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
          {!isOwn && <Text style={styles.authorLabel}>{item.authorName}</Text>}
          <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn]}>{item.text}</Text>
          <Text style={[styles.timeText, isOwn && styles.timeTextOwn]}>{formatTime(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={Colors.emerald600} size="large" />
      </View>
    );
  }

  if (!post) return null;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          ref={flatListRef}
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          showsVerticalScrollIndicator={false}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View>
              {/* Back bar */}
              <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
                  <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
                </TouchableOpacity>
                {myProfileId === post.profileId && (
                  <TouchableOpacity style={styles.deleteBtn} onPress={deletePost} disabled={deleting} activeOpacity={0.8}>
                    {deleting
                      ? <ActivityIndicator size="small" color="#EF4444" />
                      : <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    }
                  </TouchableOpacity>
                )}
              </View>

              {/* Image — tap to view full screen */}
              {post.imageUrl && (
                <TouchableOpacity activeOpacity={0.92} onPress={() => setPhotoVisible(true)}>
                  <Image source={{ uri: post.imageUrl }} style={styles.heroImage} resizeMode="cover" />
                </TouchableOpacity>
              )}

              {/* Post content */}
              <View style={styles.postCard}>
                <Text style={styles.postTitle}>{post.title}</Text>
                <View style={styles.postMeta}>
                  <View style={styles.authorAvatar}>
                    <Text style={styles.authorAvatarText}>{initials(post.authorName)}</Text>
                  </View>
                  <Text style={styles.postAuthor}>{post.authorName}</Text>
                  <Text style={styles.dot}>·</Text>
                  <Text style={styles.postAge}>{formatTime(post.createdAt)}</Text>
                </View>
                {post.body ? <Text style={styles.postBody}>{post.body}</Text> : null}

                {/* Action bar */}
                <View style={styles.actionBar}>
                  <TouchableOpacity style={[styles.actionBtn, liked && styles.actionBtnLiked]} onPress={toggleLike} activeOpacity={0.8}>
                    <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? '#EF4444' : Colors.gray500} />
                    <Text style={[styles.actionCount, liked && { color: '#EF4444' }]}>{post.likeCount}</Text>
                  </TouchableOpacity>
                  <View style={styles.actionBtn}>
                    <Ionicons name="chatbubble-outline" size={18} color={Colors.gray500} />
                    <Text style={styles.actionCount}>{post.commentCount}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.commentsHeader}>Discussion</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyComments}>
              <Text style={styles.emptyCommentsText}>No comments yet — start the conversation!</Text>
            </View>
          }
        />

        {/* Input bar */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={styles.input}
            placeholder="Write a comment…"
            placeholderTextColor={Colors.gray400}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
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

      {/* Full-screen photo viewer */}
      {post.imageUrl && (
        <Modal visible={photoVisible} transparent animationType="fade" onRequestClose={() => setPhotoVisible(false)}>
          <View style={styles.photoOverlay}>
            <TouchableOpacity style={styles.photoClose} onPress={() => setPhotoVisible(false)} activeOpacity={0.8}>
              <Ionicons name="close" size={26} color={Colors.white} />
            </TouchableOpacity>
            <Image source={{ uri: post.imageUrl }} style={styles.photoFull} resizeMode="contain" />
          </View>
        </Modal>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7F9' },
  flex: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F7F9' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: Colors.white,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoClose: {
    position: 'absolute',
    top: 52,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoFull: {
    width: '100%',
    height: '80%',
  },
  heroImage: {
    width: '100%',
    height: 220,
    backgroundColor: Colors.gray100,
  },
  postCard: {
    backgroundColor: Colors.white,
    padding: 20,
    marginBottom: 8,
  },
  postTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', lineHeight: 26, marginBottom: 10 },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  authorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.emerald100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarText: { fontSize: 10, fontWeight: '700', color: Colors.emerald700 },
  postAuthor: { fontSize: 13, fontWeight: '600', color: '#374151' },
  dot: { fontSize: 13, color: Colors.gray300 },
  postAge: { fontSize: 13, color: Colors.gray400 },
  postBody: { fontSize: 15, color: '#374151', lineHeight: 22, marginBottom: 16 },
  actionBar: { flexDirection: 'row', gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  actionBtnLiked: { backgroundColor: '#FFF5F5', borderColor: '#FEE2E2' },
  actionCount: { fontSize: 14, fontWeight: '600', color: Colors.gray500 },

  commentsHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gray500,
    paddingHorizontal: 16,
    paddingVertical: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  listContent: { paddingBottom: 16 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  messageRowOwn: { flexDirection: 'row-reverse' },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.emerald600,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: 11 },
  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 3,
    ...Shadow.sm,
  },
  bubbleOther: { backgroundColor: Colors.white, borderBottomLeftRadius: 4 },
  bubbleOwn: { backgroundColor: Colors.emerald600, borderBottomRightRadius: 4 },
  authorLabel: { fontSize: 11, fontWeight: '700', color: Colors.gray500, marginBottom: 1 },
  bubbleText: { fontSize: 14, color: '#1A1A1A', lineHeight: 20 },
  bubbleTextOwn: { color: Colors.white },
  timeText: { fontSize: 10, color: Colors.gray400, alignSelf: 'flex-end' },
  timeTextOwn: { color: 'rgba(255,255,255,0.65)' },

  emptyComments: { paddingHorizontal: 16, paddingVertical: 24, alignItems: 'center' },
  emptyCommentsText: { fontSize: 14, color: Colors.gray400, textAlign: 'center' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
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
    backgroundColor: Colors.emerald600,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnDisabled: { opacity: 0.45 },
});
