import { Colors, Shadow } from '@/constants/theme';
import { api } from '@/lib/api';
import { forumStore, ForumPost, ForumSort } from '@/lib/forumStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SortOption = ForumSort;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAge(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ForumScreen() {
  const insets = useSafeAreaInsets();

  // Initialise from cache so the list is instant on return
  const initial = forumStore.get();
  const [posts, setPosts]           = useState<ForumPost[]>(initial?.posts ?? []);
  const [sort, setSort]             = useState<SortOption>(initial?.sort ?? 'comments');
  const [loading, setLoading]       = useState(!initial);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor]         = useState<string | undefined>(initial?.cursor);
  const [hasMore, setHasMore]       = useState(initial?.hasMore ?? true);
  const sortRef = useRef<SortOption>(initial?.sort ?? 'comments');
  // Guard against duplicate in-flight loads
  const fetchingRef = useRef(false);

  const loadPosts = useCallback(async (s: SortOption, reset = false, showSpinner = true) => {
    if (reset) {
      if (showSpinner) setLoading(true);
      setCursor(undefined);
      setHasMore(true);
      sortRef.current = s;
      setSort(s);
    } else {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      setLoadingMore(true);
    }
    try {
      const cursorParam = reset ? '' : cursor ? `&cursor=${cursor}` : '';
      const data = await api.get<ForumPost[]>(`/api/forums?sort=${s}${cursorParam}`);
      const list = data ?? [];
      const newCursor = list.length > 0 ? list[list.length - 1].id : undefined;
      const more = list.length >= 20;

      if (reset) {
        setPosts(list);
        setCursor(newCursor);
        forumStore.set(list, newCursor, more, s);
      } else {
        setPosts((prev) => [...prev, ...list]);
        if (newCursor) setCursor(newCursor);
        forumStore.append(list, newCursor, more);
      }

      if (!more) setHasMore(false);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
      setLoadingMore(false);
      fetchingRef.current = false;
    }
  }, [cursor]);

  useFocusEffect(
    useCallback(() => {
      const cached = forumStore.get();
      const currentSort = sortRef.current;

      if (cached && cached.sort === currentSort) {
        setPosts(cached.posts);
        setCursor(cached.cursor);
        setHasMore(cached.hasMore);
        setSort(currentSort);
        setLoading(false);

        if (!forumStore.isFresh() && !fetchingRef.current) {
          fetchingRef.current = true;
          loadPosts(currentSort, true, false);
        }
      } else if (!fetchingRef.current) {
        fetchingRef.current = true;
        loadPosts(currentSort, true, true);
      }
    }, [loadPosts]),
  );

  const SORT_OPTIONS: { key: SortOption; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
    { key: 'comments', label: 'Most Commented', icon: 'chatbubble-outline' },
    { key: 'likes',    label: 'Most Liked',     icon: 'heart-outline' },
    { key: 'newest',   label: 'Newest',          icon: 'time-outline' },
  ];

  const renderPost = ({ item }: { item: ForumPost }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => router.push(`/forum-post?id=${item.id}`)}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          {item.body ? (
            <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>
          ) : null}
          <View style={styles.cardMeta}>
            <View style={styles.cardAvatar}>
              <Text style={styles.cardAvatarText}>
                {item.authorName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.cardAuthor}>{item.authorName}</Text>
            <Text style={styles.cardDot}>·</Text>
            <Text style={styles.cardAge}>{formatAge(item.createdAt)}</Text>
          </View>
        </View>
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.cardThumb} />
        )}
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.cardStat}>
          <Ionicons name="heart-outline" size={14} color={Colors.gray400} />
          <Text style={styles.cardStatText}>{item.likeCount}</Text>
        </View>
        <View style={styles.cardStat}>
          <Ionicons name="chatbubble-outline" size={14} color={Colors.gray400} />
          <Text style={styles.cardStatText}>{item.commentCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient
        colors={[Colors.emerald600, Colors.emerald700]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Community Forum</Text>
            <Text style={styles.headerSub}>Share ideas, tips & eco stories</Text>
          </View>
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => router.push('/create-forum')}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={styles.newBtnText}>New Post</Text>
          </TouchableOpacity>
        </View>

        {/* Sort selector */}
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.sortChip, sort === opt.key && styles.sortChipActive]}
              onPress={() => {
                if (sort !== opt.key && !fetchingRef.current) {
                  fetchingRef.current = true;
                  loadPosts(opt.key, true);
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons name={opt.icon} size={13} color={sort === opt.key ? Colors.emerald700 : 'rgba(255,255,255,0.75)'} />
              <Text style={[styles.sortChipText, sort === opt.key && styles.sortChipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.emerald600} size="large" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={() => { if (hasMore && !loadingMore) loadPosts(sortRef.current); }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.emerald600} style={{ marginVertical: 16 }} /> : null}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="chatbubbles-outline" size={52} color={Colors.gray300} />
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySub}>Be the first to start a discussion!</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/create-forum')} activeOpacity={0.85}>
                <Text style={styles.emptyBtnText}>Create a Post</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7F9' },

  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },

  sortRow: { flexDirection: 'row', gap: 8 },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  sortChipActive: { backgroundColor: Colors.white },
  sortChipText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  sortChipTextActive: { color: Colors.emerald700 },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, gap: 12 },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  cardContent: { flexDirection: 'row', padding: 14, gap: 12 },
  cardLeft: { flex: 1, gap: 6 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', lineHeight: 20 },
  cardBody: { fontSize: 13, color: Colors.gray500, lineHeight: 18 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.emerald100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatarText: { fontSize: 8, fontWeight: '700', color: Colors.emerald700 },
  cardAuthor: { fontSize: 12, color: Colors.gray500, fontWeight: '500' },
  cardDot: { fontSize: 12, color: Colors.gray300 },
  cardAge: { fontSize: 12, color: Colors.gray400 },
  cardThumb: { width: 72, height: 72, borderRadius: 10, backgroundColor: Colors.gray100 },
  cardFooter: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cardStat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardStatText: { fontSize: 13, color: Colors.gray400, fontWeight: '500' },

  emptyWrap: { alignItems: 'center', gap: 10, paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.gray500 },
  emptySub: { fontSize: 14, color: Colors.gray400 },
  emptyBtn: { backgroundColor: Colors.emerald600, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 8 },
  emptyBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});
