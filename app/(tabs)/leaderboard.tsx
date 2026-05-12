import { Colors, Shadow } from '@/constants/theme';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaderEntry {
  profileId: string;
  rank: number;
  fullName: string;
  avatarUrl: string | null;
  totalPoints: number;
  totalTrips: number;
  totalCo2SavedG: number;
  isMe: boolean;
}

interface LeaderboardData {
  entries: LeaderEntry[];
  me: LeaderEntry | null;
  total: number;
}

// ─── Tier System ─────────────────────────────────────────────────────────────

type Tier = 'Seedling' | 'Sapling' | 'Grove' | 'Forest' | 'Ancient Oak';

interface TierMeta {
  name: Tier;
  emoji: string;
  gradientColors: [string, string];
  badgeBg: string;
  badgeText: string;
  minPoints: number;
}

const TIERS: TierMeta[] = [
  { name: 'Seedling',    emoji: '🌱', gradientColors: ['#d1fae5', '#a7f3d0'], badgeBg: '#d1fae5', badgeText: '#047857', minPoints: 0 },
  { name: 'Sapling',    emoji: '🌿', gradientColors: ['#a7f3d0', '#34d399'], badgeBg: '#a7f3d0', badgeText: '#065f46', minPoints: 500 },
  { name: 'Grove',      emoji: '🌳', gradientColors: ['#059669', '#047857'], badgeBg: '#059669', badgeText: '#ffffff', minPoints: 1500 },
  { name: 'Forest',     emoji: '🌲', gradientColors: ['#065f46', '#064e3b'], badgeBg: '#065f46', badgeText: '#d1fae5', minPoints: 3500 },
  { name: 'Ancient Oak',emoji: '🌰', gradientColors: ['#713f12', '#422006'], badgeBg: '#92400e', badgeText: '#fef3c7', minPoints: 7000 },
];

function getTier(points: number): TierMeta {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (points >= TIERS[i].minPoints) return TIERS[i];
  }
  return TIERS[0];
}

function getNextTier(points: number): TierMeta | null {
  for (const t of TIERS) {
    if (points < t.minPoints) return t;
  }
  return null;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  uri,
  name,
  size = 44,
  bg,
}: {
  uri: string | null;
  name: string;
  size?: number;
  bg?: string;
}) {
  const initials = name
    .split(' ')
    .map((w) => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const circle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: bg ?? Colors.emerald100,
    overflow: 'hidden' as const,
  };

  if (uri) {
    return (
      <View style={circle}>
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" />
      </View>
    );
  }
  return (
    <View style={circle}>
      <Text style={{ color: bg ? undefined : Colors.emerald700, fontWeight: '700', fontSize: size * 0.36 }}>
        {initials}
      </Text>
    </View>
  );
}

// ─── Delta Badge ──────────────────────────────────────────────────────────────

function DeltaBadge({ delta }: { delta: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (delta === 0) return;
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 350, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [delta]);

  if (delta === 0) return null;

  const up = delta > 0;
  return (
    <Animated.View
      style={[
        styles.deltaBadge,
        up ? styles.deltaBadgeUp : styles.deltaBadgeDown,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
        },
      ]}
    >
      <Ionicons name={up ? 'arrow-up' : 'arrow-down'} size={10} color={up ? Colors.green600 : Colors.red600} />
      <Text style={[styles.deltaBadgeText, up ? styles.deltaUp : styles.deltaDown]}>
        {Math.abs(delta)}
      </Text>
    </Animated.View>
  );
}

// ─── Rank Card ────────────────────────────────────────────────────────────────

function RankCard({ entry, delta }: { entry: LeaderEntry; delta: number }) {
  const tier = getTier(entry.totalPoints);
  const isTop3 = entry.rank <= 3;
  const medalEmojis = ['🥇', '🥈', '🥉'];

  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!entry.isMe) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.02, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.98, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View style={entry.isMe ? { transform: [{ scale: scaleAnim }] } : undefined}>
      <View style={[styles.rankCard, entry.isMe && styles.rankCardMe, isTop3 && styles.rankCardTop]}>
        {entry.isMe && <View style={styles.meAccent} />}

        <View style={styles.rankNumCol}>
          {isTop3 ? (
            <Text style={styles.medalEmoji}>{medalEmojis[entry.rank - 1]}</Text>
          ) : (
            <Text style={[styles.rankNum, entry.isMe && styles.rankNumMe]}>#{entry.rank}</Text>
          )}
          <DeltaBadge delta={delta} />
        </View>

        <Avatar
          uri={entry.avatarUrl}
          name={entry.fullName}
          size={44}
          bg={tier.badgeBg}
        />

        <View style={styles.rankInfo}>
          <Text style={[styles.rankName, entry.isMe && styles.rankNameMe]} numberOfLines={1}>
            {entry.isMe ? 'You' : entry.fullName}
          </Text>
          <View style={[styles.tierPill, { backgroundColor: tier.badgeBg }]}>
            <Text style={[styles.tierPillText, { color: tier.badgeText }]}>
              {tier.emoji} {tier.name}
            </Text>
          </View>
        </View>

        <View style={styles.rankPoints}>
          <Text style={[styles.pointsNum, entry.isMe && styles.pointsNumMe]}>
            {entry.totalPoints.toLocaleString()}
          </Text>
          <Text style={styles.pointsLabel}>pts</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── My Progress Card ─────────────────────────────────────────────────────────

function MyProgressCard({
  me,
  nextInBoard,
}: {
  me: LeaderEntry;
  nextInBoard: LeaderEntry | undefined;
}) {
  const tier = getTier(me.totalPoints);
  const next = getNextTier(me.totalPoints);
  const tierProgress = next
    ? (me.totalPoints - tier.minPoints) / (next.minPoints - tier.minPoints)
    : 1;

  const tierAnim = useRef(new Animated.Value(0)).current;
  const rankAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(tierAnim, {
      toValue: tierProgress,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [tierProgress]);

  const ptsToNext = nextInBoard ? nextInBoard.totalPoints - me.totalPoints : 0;

  useEffect(() => {
    if (!nextInBoard) return;
    const fraction = Math.max(0, 1 - ptsToNext / Math.max(nextInBoard.totalPoints, 1));
    Animated.timing(rankAnim, {
      toValue: fraction,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [ptsToNext]);

  return (
    <View style={styles.myCard}>
      <LinearGradient
        colors={[Colors.emerald700, Colors.emerald900]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.myCardGradient}
      >
        <View style={styles.myCardTop}>
          <View>
            <Text style={styles.myCardLabel}>Your Rank</Text>
            <Text style={styles.myCardRank}>#{me.rank}</Text>
          </View>
          <View style={[styles.myCardTierBadge, { backgroundColor: tier.badgeBg }]}>
            <Text style={[styles.myCardTierText, { color: tier.badgeText }]}>
              {tier.emoji} {tier.name}
            </Text>
          </View>
        </View>

        {/* Tier progress */}
        <View style={styles.myProgressSection}>
          <View style={styles.myProgressLabelRow}>
            <Text style={styles.myProgressLabel}>
              {next ? `Progress to ${next.emoji} ${next.name}` : 'Max tier reached!'}
            </Text>
            <Text style={styles.myProgressVal}>
              {next
                ? `${me.totalPoints.toLocaleString()} / ${next.minPoints.toLocaleString()}`
                : `${me.totalPoints.toLocaleString()} pts`}
            </Text>
          </View>
          <View style={styles.myProgressTrack}>
            <Animated.View
              style={[
                styles.myProgressFill,
                {
                  width: tierAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                },
              ]}
            />
          </View>
        </View>

        {/* Rank progress — show only if there's someone to overtake */}
        {nextInBoard && ptsToNext > 0 && (
          <View style={[styles.myProgressSection, { marginTop: 12 }]}>
            <View style={styles.myProgressLabelRow}>
              <Text style={styles.myProgressLabel}>
                To overtake #{nextInBoard.rank} {nextInBoard.fullName.split(' ')[0]}
              </Text>
              <Text style={styles.myProgressVal}>{ptsToNext.toLocaleString()} pts away</Text>
            </View>
            <View style={styles.myProgressTrack}>
              <Animated.View
                style={[
                  styles.myProgressFill,
                  styles.myProgressFillRank,
                  {
                    width: rankAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                  },
                ]}
              />
            </View>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

// ─── Podium ───────────────────────────────────────────────────────────────────

function Podium({ entries }: { entries: LeaderEntry[] }) {
  const top3 = entries.filter((e) => !e.isMe && e.rank <= 3).slice(0, 3);
  const byRank = (r: number) => top3.find((e) => e.rank === r);
  const medalEmojis = ['🥇', '🥈', '🥉'];
  const podiumHeights = [100, 72, 56];

  const renderSlot = (entry: LeaderEntry | undefined, pos: number) => {
    if (!entry) return <View key={pos} style={styles.podiumSlot} />;
    const tier = getTier(entry.totalPoints);
    return (
      <View key={pos} style={styles.podiumSlot}>
        <Avatar uri={entry.avatarUrl} name={entry.fullName} size={40} bg={tier.badgeBg} />
        <Text style={styles.podiumMedal}>{medalEmojis[pos - 1]}</Text>
        <Text style={styles.podiumName} numberOfLines={1}>{entry.fullName.split(' ')[0]}</Text>
        <Text style={styles.podiumPts}>{entry.totalPoints.toLocaleString()}</Text>
        <View
          style={[
            styles.podiumBlock,
            { height: podiumHeights[pos - 1] },
            pos === 1 && styles.podiumBlockFirst,
          ]}
        >
          <Text style={styles.podiumRankText}>{pos}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.podiumRow}>
      {renderSlot(byRank(2), 2)}
      {renderSlot(byRank(1), 1)}
      {renderSlot(byRank(3), 3)}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const [scope, setScope] = useState<'regional' | 'global'>('regional');
  const [activeSection, setActiveSection] = useState<'board' | 'tiers' | 'hall'>('board');

  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Tracks last-known ranks so we can show +/- deltas on re-focus
  const prevRanksRef = useRef<Record<string, number>>({});
  const [deltaMap, setDeltaMap] = useState<Record<string, number>>({});

  const loadData = useCallback(async () => {
    try {
      setError(false);
      const result = await api.get<LeaderboardData>('/api/leaderboard?limit=50');

      // Compute deltas against previously stored ranks
      const prev = prevRanksRef.current;
      const newDeltas: Record<string, number> = {};
      const allEntries = result.me ? [...result.entries, result.me] : result.entries;

      allEntries.forEach((e) => {
        if (prev[e.profileId] !== undefined) {
          newDeltas[e.profileId] = prev[e.profileId] - e.rank; // positive = climbed
        }
      });

      // Persist current ranks for next refresh
      const newRankMap: Record<string, number> = {};
      allEntries.forEach((e) => { newRankMap[e.profileId] = e.rank; });
      prevRanksRef.current = newRankMap;

      setDeltaMap(newDeltas);
      setData(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload every time the tab gains focus so ranks stay fresh
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData]),
  );

  const entries = data?.entries ?? [];
  const me = data?.me ?? null;

  // Person directly above "me" in the board (for the progress bar)
  const nextAboveMe = me
    ? entries.find((e) => !e.isMe && e.rank === me.rank - 1)
    : undefined;

  // Board shown without the caller's card (it's pinned separately)
  const board = entries.filter((e) => !e.isMe);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.emerald600, Colors.emerald900]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerEmoji}>🏆</Text>
          <Text style={styles.headerTitle}>Leaderboard</Text>
          {data && (
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>{data.total} users</Text>
            </View>
          )}
        </View>
        <Text style={styles.headerSub}>
          {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })} · Season {getCurrentSeason()}
        </Text>

        {/* Scope toggle */}
        <View style={styles.scopeBar}>
          {(['regional', 'global'] as const).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.scopeBtn, scope === s && styles.scopeBtnActive]}
              onPress={() => setScope(s)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={s === 'regional' ? 'location-outline' : 'globe-outline'}
                size={14}
                color={scope === s ? Colors.emerald700 : Colors.white80}
              />
              <Text style={[styles.scopeBtnText, scope === s && styles.scopeBtnTextActive]}>
                {s === 'regional' ? 'My City' : 'Global'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Section tabs */}
        <View style={styles.sectionBar}>
          {(['board', 'tiers', 'hall'] as const).map((sec) => {
            const labels = { board: '📋 Rankings', tiers: '🌿 Tiers', hall: '🏅 Hall of Fame' };
            return (
              <TouchableOpacity
                key={sec}
                style={[styles.sectionBtn, activeSection === sec && styles.sectionBtnActive]}
                onPress={() => setActiveSection(sec)}
                activeOpacity={0.8}
              >
                <Text style={[styles.sectionBtnText, activeSection === sec && styles.sectionBtnTextActive]}>
                  {labels[sec]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Regional coming-soon notice */}
        {scope === 'regional' && activeSection === 'board' && (
          <View style={styles.regionalNotice}>
            <Ionicons name="location-outline" size={16} color={Colors.emerald600} />
            <Text style={styles.regionalNoticeText}>
              City filtering coming soon — showing global rankings for now.
            </Text>
          </View>
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator color={Colors.emerald600} size="large" />
          </View>
        )}

        {/* Error */}
        {!loading && error && (
          <View style={styles.centered}>
            <Ionicons name="cloud-offline-outline" size={48} color={Colors.gray300} />
            <Text style={styles.emptyText}>Couldn't load leaderboard</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadData} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && activeSection === 'board' && (
          <>
            {/* My pinned card */}
            {me && <MyProgressCard me={me} nextInBoard={nextAboveMe} />}

            {/* Podium */}
            {board.length >= 3 && (
              <View style={styles.podiumWrap}>
                <Podium entries={board} />
              </View>
            )}

            {/* Full board */}
            <View style={styles.boardList}>
              {board.length === 0 ? (
                <View style={styles.centered}>
                  <Ionicons name="people-outline" size={48} color={Colors.gray300} />
                  <Text style={styles.emptyText}>No users yet — be the first!</Text>
                </View>
              ) : (
                board.map((entry) => (
                  <RankCard
                    key={entry.profileId}
                    entry={entry}
                    delta={deltaMap[entry.profileId] ?? 0}
                  />
                ))
              )}
            </View>

            {/* Caller's card pinned at the bottom when outside top list */}
            {me && me.rank > (data?.entries.length ?? 0) && (
              <View style={styles.mePinnedBottom}>
                <Text style={styles.mePinnedLabel}>· · · You're #{me.rank} of {data?.total} · · ·</Text>
                <RankCard entry={me} delta={deltaMap[me.profileId] ?? 0} />
              </View>
            )}
          </>
        )}

        {!loading && !error && activeSection === 'tiers' && (
          <View style={styles.tiersWrap}>
            <Text style={styles.tiersTitle}>Nature Tiers</Text>
            <Text style={styles.tiersSub}>Earn eco-points to level up your identity</Text>
            {TIERS.map((tier, idx) => {
              const myPoints = me?.totalPoints ?? 0;
              const isCurrentTier = getTier(myPoints).name === tier.name;
              const isUnlocked = myPoints >= tier.minPoints;
              return (
                <View key={tier.name} style={[styles.tierCard, isCurrentTier && styles.tierCardActive]}>
                  <LinearGradient
                    colors={tier.gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.tierCardBar}
                  />
                  <View style={[styles.tierCardBody, !isUnlocked && styles.tierCardBodyLocked]}>
                    <Text style={styles.tierCardEmoji}>{tier.emoji}</Text>
                    <View style={styles.tierCardInfo}>
                      <View style={styles.tierCardNameRow}>
                        <Text style={styles.tierCardName}>{tier.name}</Text>
                        {isCurrentTier && (
                          <View style={styles.currentBadge}>
                            <Text style={styles.currentBadgeText}>You're here</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.tierCardPts}>
                        {idx === 0
                          ? `0 – ${TIERS[1].minPoints - 1} pts`
                          : idx === TIERS.length - 1
                          ? `${tier.minPoints.toLocaleString()}+ pts`
                          : `${tier.minPoints.toLocaleString()} – ${(TIERS[idx + 1].minPoints - 1).toLocaleString()} pts`}
                      </Text>
                    </View>
                    {isCurrentTier ? (
                      <Ionicons name="checkmark-circle" size={22} color={Colors.emerald600} />
                    ) : isUnlocked ? (
                      <Ionicons name="checkmark-circle-outline" size={22} color={Colors.gray400} />
                    ) : (
                      <Ionicons name="lock-closed-outline" size={20} color={Colors.gray300} />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {!loading && !error && activeSection === 'hall' && (
          <View style={styles.hallWrap}>
            <Text style={styles.tiersTitle}>Hall of Fame</Text>
            <Text style={styles.tiersSub}>All-time eco leaders on this platform</Text>

            {entries.slice(0, 3).map((entry, idx) => {
              const seasonEmojis = ['🥇', '🌿', '🌍'];
              const tier = getTier(entry.totalPoints);
              return (
                <LinearGradient
                  key={entry.profileId}
                  colors={[Colors.amber100, '#fef9c3']}
                  style={styles.hallCard}
                >
                  <Text style={styles.hallEmoji}>{seasonEmojis[idx]}</Text>
                  <View style={styles.hallInfo}>
                    <Text style={styles.hallSeason}>#{idx + 1} All-time · {tier.emoji} {tier.name}</Text>
                    <Text style={styles.hallName}>{entry.fullName}</Text>
                    <Text style={styles.hallTrips}>{entry.totalTrips} eco-trips · {Math.round(entry.totalCo2SavedG / 1000)} kg CO₂ saved</Text>
                  </View>
                  <View style={styles.hallPts}>
                    <Text style={styles.hallPtsNum}>{entry.totalPoints.toLocaleString()}</Text>
                    <Text style={styles.hallPtsLabel}>pts</Text>
                  </View>
                </LinearGradient>
              );
            })}

            {entries.length === 0 && (
              <View style={styles.centered}>
                <Ionicons name="trophy-outline" size={48} color={Colors.gray300} />
                <Text style={styles.emptyText}>No champions yet — go earn some points!</Text>
              </View>
            )}

            <View style={styles.hallCta}>
              <Ionicons name="trophy-outline" size={32} color={Colors.emerald600} />
              <Text style={styles.hallCtaTitle}>Could you be next?</Text>
              <Text style={styles.hallCtaSub}>
                Top scorer by month-end earns a permanent spot. Keep taking eco-friendly trips!
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}

function getCurrentSeason(): number {
  const month = new Date().getMonth(); // 0-11
  return Math.floor(month / 3) + 1 + (new Date().getFullYear() - 2025) * 4;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },

  header: { paddingHorizontal: 24, paddingBottom: 40, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  headerEmoji: { fontSize: 22 },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: '700', flex: 1 },
  totalBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  totalBadgeText: { color: Colors.white, fontSize: 11, fontWeight: '600' },
  headerSub: { color: Colors.white80, fontSize: 13, marginBottom: 16 },

  scopeBar: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 4, gap: 4 },
  scopeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10 },
  scopeBtnActive: { backgroundColor: Colors.white },
  scopeBtnText: { color: Colors.white80, fontSize: 13, fontWeight: '600' },
  scopeBtnTextActive: { color: Colors.emerald700 },

  scrollContent: { paddingHorizontal: 16 },

  sectionBar: { flexDirection: 'row', marginTop: 16, marginBottom: 12, backgroundColor: Colors.white, borderRadius: 12, padding: 4, ...Shadow.sm, gap: 2 },
  sectionBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  sectionBtnActive: { backgroundColor: Colors.emerald600 },
  sectionBtnText: { fontSize: 11, fontWeight: '600', color: Colors.gray500 },
  sectionBtnTextActive: { color: Colors.white },

  regionalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.emerald50,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.emerald100,
  },
  regionalNoticeText: { color: Colors.emerald700, fontSize: 12, flex: 1 },

  centered: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { color: Colors.gray500, fontSize: 15, textAlign: 'center' },
  retryBtn: { backgroundColor: Colors.emerald600, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryBtnText: { color: Colors.white, fontWeight: '600', fontSize: 14 },

  // My progress card
  myCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 16, ...Shadow.xl },
  myCardGradient: { padding: 20 },
  myCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  myCardLabel: { color: Colors.white70, fontSize: 12, marginBottom: 2 },
  myCardRank: { color: Colors.white, fontSize: 36, fontWeight: '700' },
  myCardTierBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  myCardTierText: { fontSize: 13, fontWeight: '700' },
  myProgressSection: {},
  myProgressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  myProgressLabel: { color: Colors.white70, fontSize: 12 },
  myProgressVal: { color: Colors.white, fontSize: 12, fontWeight: '600' },
  myProgressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  myProgressFill: { height: '100%', backgroundColor: Colors.white, borderRadius: 4 },
  myProgressFillRank: { backgroundColor: Colors.emerald400 },

  // Podium
  podiumWrap: { marginBottom: 20 },
  podiumRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8 },
  podiumSlot: { flex: 1, alignItems: 'center' },
  podiumMedal: { fontSize: 16, marginTop: 4, marginBottom: 2 },
  podiumName: { color: Colors.gray800, fontSize: 11, fontWeight: '600', marginBottom: 2, textAlign: 'center' },
  podiumPts: { color: Colors.gray500, fontSize: 10, marginBottom: 6 },
  podiumBlock: { width: '100%', backgroundColor: Colors.emerald100, borderTopLeftRadius: 8, borderTopRightRadius: 8, alignItems: 'center', justifyContent: 'center' },
  podiumBlockFirst: { backgroundColor: Colors.emerald200 },
  podiumRankText: { color: Colors.emerald700, fontWeight: '700', fontSize: 18 },

  // Rank card
  boardList: { gap: 10, marginBottom: 8 },
  rankCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 16, padding: 14, gap: 12, ...Shadow.md, overflow: 'hidden' },
  rankCardMe: { borderWidth: 2, borderColor: Colors.emerald400, backgroundColor: Colors.emerald50 },
  rankCardTop: { ...Shadow.lg },
  meAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: Colors.emerald600 },
  rankNumCol: { width: 36, alignItems: 'center' },
  rankNum: { color: Colors.gray400, fontSize: 13, fontWeight: '700' },
  rankNumMe: { color: Colors.emerald700 },
  medalEmoji: { fontSize: 20 },
  rankInfo: { flex: 1 },
  rankName: { color: Colors.gray900, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  rankNameMe: { color: Colors.emerald800 },
  tierPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  tierPillText: { fontSize: 11, fontWeight: '600' },
  rankPoints: { alignItems: 'flex-end' },
  pointsNum: { color: Colors.gray900, fontSize: 16, fontWeight: '700' },
  pointsNumMe: { color: Colors.emerald700 },
  pointsLabel: { color: Colors.gray400, fontSize: 11 },

  // Delta badge
  deltaBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 999, marginTop: 3, gap: 1 },
  deltaBadgeUp: { backgroundColor: Colors.green100 },
  deltaBadgeDown: { backgroundColor: Colors.red100 },
  deltaBadgeText: { fontSize: 10, fontWeight: '700' },
  deltaUp: { color: Colors.green600 },
  deltaDown: { color: Colors.red600 },

  // Me pinned bottom
  mePinnedBottom: { marginTop: 8, gap: 8 },
  mePinnedLabel: { textAlign: 'center', color: Colors.gray400, fontSize: 12 },

  // Tiers
  tiersWrap: { gap: 12 },
  tiersTitle: { color: Colors.gray900, fontSize: 20, fontWeight: '700', marginBottom: 2 },
  tiersSub: { color: Colors.gray500, fontSize: 13, marginBottom: 8 },
  tierCard: { backgroundColor: Colors.white, borderRadius: 16, overflow: 'hidden', flexDirection: 'row', ...Shadow.md },
  tierCardActive: { borderWidth: 2, borderColor: Colors.emerald400 },
  tierCardBar: { width: 6 },
  tierCardBody: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  tierCardBodyLocked: { opacity: 0.5 },
  tierCardEmoji: { fontSize: 28 },
  tierCardInfo: { flex: 1 },
  tierCardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  tierCardName: { color: Colors.gray900, fontSize: 15, fontWeight: '700' },
  tierCardPts: { color: Colors.gray500, fontSize: 12 },
  currentBadge: { backgroundColor: Colors.emerald100, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  currentBadgeText: { color: Colors.emerald700, fontSize: 11, fontWeight: '600' },

  // Hall of Fame
  hallWrap: { gap: 12 },
  hallCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 20, gap: 14, ...Shadow.md },
  hallEmoji: { fontSize: 32 },
  hallInfo: { flex: 1 },
  hallSeason: { color: Colors.amber700, fontSize: 11, fontWeight: '600', marginBottom: 2 },
  hallName: { color: Colors.gray900, fontSize: 16, fontWeight: '700', marginBottom: 2 },
  hallTrips: { color: Colors.gray600, fontSize: 12 },
  hallPts: { alignItems: 'flex-end' },
  hallPtsNum: { color: Colors.amber700, fontSize: 18, fontWeight: '700' },
  hallPtsLabel: { color: Colors.amber700, fontSize: 11 },
  hallCta: { backgroundColor: Colors.white, borderRadius: 20, padding: 24, alignItems: 'center', gap: 8, ...Shadow.lg, marginTop: 4 },
  hallCtaTitle: { color: Colors.gray900, fontSize: 18, fontWeight: '700' },
  hallCtaSub: { color: Colors.gray500, fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
