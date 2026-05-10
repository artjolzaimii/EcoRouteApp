import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';
import { api } from '@/lib/api';

type AppNotification = {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  refType?: string | null;
  refId?: string | null;
  createdAt: string;
};

type NotificationsResponse = {
  notifications: AppNotification[];
  unreadCount: number;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function notifIcon(refType?: string | null): React.ComponentProps<typeof Ionicons>['name'] {
  switch (refType) {
    case 'badge': return 'trophy-outline';
    case 'coupon': return 'pricetag-outline';
    case 'trip': return 'leaf-outline';
    case 'points': return 'flash-outline';
    case 'streak': return 'flame-outline';
    case 'challenge': return 'ribbon-outline';
    default: return 'notifications-outline';
  }
}

function notifColor(refType?: string | null): string {
  switch (refType) {
    case 'badge': return Colors.yellow500;
    case 'coupon': return Colors.purple600;
    case 'trip': return Colors.emerald600;
    case 'points': return Colors.blue600;
    case 'streak': return Colors.orange600;
    case 'challenge': return Colors.amber600;
    default: return Colors.gray500;
  }
}

function notifBg(refType?: string | null): string {
  switch (refType) {
    case 'badge': return Colors.yellow100;
    case 'coupon': return Colors.purple100;
    case 'trip': return Colors.emerald100;
    case 'points': return Colors.blue100;
    case 'streak': return Colors.orange100;
    case 'challenge': return Colors.amber100;
    default: return Colors.gray100;
  }
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<NotificationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await api.get<NotificationsResponse>('/api/notifications');
      setData(res);
    } catch {
      // silently keep existing data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  useFocusEffect(useCallback(() => { loadNotifications(); }, [loadNotifications]));

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/api/notifications/${id}/read`, {});
      setData((prev) => {
        if (!prev) return prev;
        const updated = prev.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        );
        return { notifications: updated, unreadCount: updated.filter((n) => !n.isRead).length };
      });
    } catch {
      // ignore
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.patch('/api/notifications/read-all', {});
      setData((prev) => {
        if (!prev) return prev;
        return {
          notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        };
      });
    } catch {
      // ignore
    } finally {
      setMarkingAll(false);
    }
  };

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.9}>
          <Ionicons name="arrow-back-outline" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} disabled={markingAll} activeOpacity={0.7}>
            {markingAll ? (
              <ActivityIndicator size="small" color={Colors.emerald600} />
            ) : (
              <Text style={styles.markAllBtn}>Mark all read</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.emerald600} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIcon}>
            <Ionicons name="notifications-off-outline" size={40} color={Colors.gray400} />
          </View>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySubtitle}>We'll notify you about trips, badges, and eco-rewards.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadNotifications(); }}
              tintColor={Colors.emerald600}
            />
          }
        >
          {notifications.map((notif, idx) => {
            const prev = notifications[idx - 1];
            const showDateSep = !prev || new Date(prev.createdAt).toDateString() !== new Date(notif.createdAt).toDateString();
            return (
              <React.Fragment key={notif.id}>
                {showDateSep && (
                  <Text style={styles.dateSep}>
                    {new Date(notif.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </Text>
                )}
                <TouchableOpacity
                  style={[styles.notifCard, notif.isRead && styles.notifCardRead]}
                  activeOpacity={0.7}
                  onPress={() => !notif.isRead && markAsRead(notif.id)}
                >
                  <View style={[styles.iconBox, { backgroundColor: notifBg(notif.refType) }]}>
                    <Ionicons name={notifIcon(notif.refType)} size={22} color={notifColor(notif.refType)} />
                  </View>
                  <View style={styles.notifContent}>
                    <View style={styles.notifTop}>
                      <Text style={[styles.notifTitle, notif.isRead && styles.notifTitleRead]}>{notif.title}</Text>
                      <Text style={styles.notifTime}>{timeAgo(notif.createdAt)}</Text>
                    </View>
                    <Text style={styles.notifBody}>{notif.body}</Text>
                  </View>
                  {!notif.isRead && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: Colors.gray50,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: '#1A1A1A', fontSize: 20, fontWeight: '700' },
  badge: {
    backgroundColor: Colors.red600,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  markAllBtn: { color: Colors.emerald600, fontSize: 13, fontWeight: '600' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: Colors.gray100,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { color: Colors.gray800, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { color: Colors.gray500, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  list: { paddingHorizontal: 16, paddingTop: 8, gap: 2 },
  dateSep: { color: Colors.gray500, fontSize: 12, fontWeight: '600', paddingHorizontal: 4, paddingTop: 16, paddingBottom: 4 },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginVertical: 3,
    ...Shadow.sm,
  },
  notifCardRead: { backgroundColor: Colors.gray50 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifContent: { flex: 1, gap: 4 },
  notifTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  notifTitle: { flex: 1, color: Colors.gray900, fontWeight: '700', fontSize: 14, marginRight: 8 },
  notifTitleRead: { fontWeight: '500', color: Colors.gray600 },
  notifBody: { color: Colors.gray600, fontSize: 13, lineHeight: 18 },
  notifTime: { color: Colors.gray400, fontSize: 11, flexShrink: 0 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.emerald600,
    marginTop: 6,
    flexShrink: 0,
  },
});
