import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow, BorderRadius, FontSize } from '@/constants/theme';
import { api } from '@/lib/api';

// ── API data types ────────────────────────────────────────────────────────────

interface ApiCategory {
  id: string; slug: string; label: string; glyph: string;
}

interface ApiListing {
  id: string;
  title: string;
  description: string | null;
  pointsPrice: number | null;
  moneyPrice: number | null;
  payment: string;
  category: ApiCategory;
  partner: { businessName: string; location: string | null };
  images: { url: string; isCover: boolean }[];
}

// Map API category slug → Ionicons name
const SLUG_ICON: Record<string, string> = {
  bike:     'bicycle-outline',
  scooter:  'bicycle-outline',
  eco:      'leaf-outline',
  coffee:   'cafe-outline',
  transit:  'bus-outline',
  reusable: 'leaf-outline',
  fashion:  'shirt-outline',
  repair:   'build-outline',
  gym:      'barbell-outline',
  student:  'school-outline',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 16;
const COL_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - COL_GAP) / 2;

type SortOption = 'popular' | 'points' | 'distance';

export default function MarketplaceScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery]   = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showFilters, setShowFilters]   = useState(false);
  const [showNearbyOnly, setShowNearbyOnly] = useState(false);
  const [sortBy, setSortBy]             = useState<SortOption>('popular');
  const [userPoints, setUserPoints]     = useState(0);
  const [loading, setLoading]           = useState(true);
  const [categories, setCategories]     = useState<ApiCategory[]>([]);
  const [listings, setListings]         = useState<ApiListing[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        try {
          const [statsRes, catsRes, listRes] = await Promise.allSettled([
            api.get<{ totalPoints: number }>('/api/user/stats'),
            api.get<ApiCategory[] | { categories: ApiCategory[] }>('/api/marketplace/categories'),
            api.get<{ listings: ApiListing[] }>('/api/marketplace/listings?limit=100'),
          ]);

          if (statsRes.status === 'fulfilled') setUserPoints(statsRes.value.totalPoints ?? 0);

          if (catsRes.status === 'fulfilled') {
            const raw = catsRes.value;
            const cats = Array.isArray(raw) ? raw : (raw as { categories: ApiCategory[] }).categories ?? [];
            setCategories(cats);
          }

          if (listRes.status === 'fulfilled') {
            setListings(listRes.value.listings ?? []);
          }
        } catch {
          // keep defaults
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  let filtered = listings.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat    = activeCategory === 'all' || p.category?.slug === activeCategory;
    return matchSearch && matchCat;
  });

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'points') return (a.pointsPrice ?? 0) - (b.pointsPrice ?? 0);
    if (sortBy === 'distance') return 0; // distance not available from API
    return 0; // popular: keep server order
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <LinearGradient
        colors={[Colors.emerald600, Colors.emerald700]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 24 }]}
      >
        <View style={styles.headerRow}>
          <Ionicons name="bag-handle-outline" size={24} color={Colors.white} />
          <Text style={styles.headerTitle}>Marketplace</Text>
        </View>
        <Text style={styles.headerSub}>Redeem points for eco-friendly products</Text>

        <View style={styles.pointsCard}>
          <View style={styles.pointsCardInner}>
            <View>
              <Text style={styles.pointsLabel}>Available Points</Text>
              {loading ? (
                <ActivityIndicator color={Colors.white} style={{ marginTop: 6 }} />
              ) : (
                <Text style={styles.pointsValue}>{userPoints.toLocaleString()}</Text>
              )}
            </View>
            <View style={styles.sparkleBox}>
              <Ionicons name="sparkles-outline" size={26} color={Colors.white} />
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* ── Search + Filter ── */}
      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={Colors.gray400} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor={Colors.gray400}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={18} color={Colors.gray400} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
            onPress={() => setShowFilters(!showFilters)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={showFilters ? Colors.white : Colors.gray700}
            />
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={styles.filterPanel}>
            <Text style={styles.filterLabel}>Sort By</Text>
            <View style={styles.sortRow}>
              {(['popular', 'points', 'distance'] as SortOption[]).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.sortBtn, sortBy === opt && styles.sortBtnActive]}
                  onPress={() => setSortBy(opt)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.sortBtnText, sortBy === opt && styles.sortBtnTextActive]}>
                    {opt === 'popular' ? 'Popular' : opt === 'points' ? 'Points' : 'Nearest'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.nearbyRow}>
              <View style={styles.nearbyLeft}>
                <Ionicons name="location-outline" size={16} color={Colors.emerald600} />
                <Text style={styles.nearbyLabel}>Available Near You (within 3 km)</Text>
              </View>
              <Switch
                value={showNearbyOnly}
                onValueChange={setShowNearbyOnly}
                trackColor={{ false: Colors.gray300, true: Colors.emerald600 }}
                thumbColor={Colors.white}
                ios_backgroundColor={Colors.gray300}
              />
            </View>
          </View>
        )}
      </View>

      {/* ── Categories ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
        style={styles.categoryWrap}
      >
        {[{ id: 'all', slug: 'all', label: 'All', glyph: '🌿' }, ...categories].map((cat) => {
          const isActive = activeCategory === cat.slug;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, isActive && styles.categoryChipActive]}
              onPress={() => setActiveCategory(cat.slug)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={(SLUG_ICON[cat.slug] ?? 'bag-handle-outline') as any}
                size={15}
                color={isActive ? Colors.white : Colors.gray700}
              />
              <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Product Grid ── */}
      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={Colors.emerald600} size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="bag-handle-outline" size={40} color={Colors.gray400} />
          </View>
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptySub}>Try adjusting your search or filters</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {filtered.map((product) => {
            const pts = product.pointsPrice ?? 0;
            const canAfford = true;
            const coverUrl  = product.images?.find((i) => i.isCover)?.url ?? null;
            const emoji     = product.category?.glyph ?? '📦';
            const location  = product.partner?.location ?? '';
            return (
              <TouchableOpacity
                key={product.id}
                style={[styles.productCard, !canAfford && styles.productCardDim]}
                activeOpacity={0.9}
                onPress={() =>
                  router.push({
                    pathname: '/marketplace-product',
                    params: { id: product.id },
                  })
                }
              >
                {/* Image */}
                {coverUrl ? (
                  <View style={styles.productImageBox}>
                    <Image
                      source={{ uri: coverUrl }}
                      style={StyleSheet.absoluteFillObject}
                      contentFit="cover"
                    />
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
                    </View>
                  </View>
                ) : (
                  <LinearGradient
                    colors={[Colors.emerald50, Colors.emerald100]}
                    style={styles.productImageBox}
                  >
                    <Text style={styles.productEmoji}>{emoji}</Text>
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
                    </View>
                  </LinearGradient>
                )}

                {/* Info */}
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>{product.title}</Text>
                  <Text style={styles.productDesc} numberOfLines={2}>{product.description ?? ''}</Text>

                  {location ? (
                    <View style={styles.productLocationRow}>
                      <Ionicons name="location-outline" size={11} color={Colors.gray400} />
                      <Text style={styles.productLocation} numberOfLines={1}>{location}</Text>
                    </View>
                  ) : null}

                  <View style={styles.productPointsRow}>
                    <Ionicons name="sparkles-outline" size={13} color={Colors.emerald600} />
                    <Text style={styles.productPoints}>
                      {product.payment === 'MONEY_ONLY'
                        ? `€${Number(product.moneyPrice).toFixed(2)}`
                        : pts > 0
                          ? `${pts.toLocaleString()} pts`
                          : `€${Number(product.moneyPrice).toFixed(2)}`}
                    </Text>
                  </View>

                  <View style={styles.productActions}>
                    <TouchableOpacity
                      style={[styles.viewBtn, !canAfford && styles.viewBtnLocked]}
                      onPress={() =>
                        router.push({
                          pathname: '/marketplace-product',
                          params: { id: product.id },
                        })
                      }
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.viewBtnText, !canAfford && styles.viewBtnTextLocked]}>
                        View
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.chatBtn} activeOpacity={0.8}>
                      <Ionicons name="chatbubble-outline" size={15} color={Colors.gray700} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={{ height: 28 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },

  // ── Header ──
  header: {
    paddingHorizontal: 24,
    paddingBottom: 52,
    borderBottomLeftRadius: BorderRadius['3xl'],
    borderBottomRightRadius: BorderRadius['3xl'],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: FontSize['2xl'],
    fontWeight: '700',
  },
  headerSub: {
    color: Colors.emeraldText100,
    fontSize: FontSize.sm,
    marginBottom: 20,
  },
  pointsCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius['2xl'],
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pointsCardInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.sm,
    marginBottom: 4,
  },
  pointsValue: {
    color: Colors.white,
    fontSize: 32,
    fontWeight: '700',
  },
  sparkleBox: {
    width: 52,
    height: 52,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Search ──
  searchSection: {
    paddingHorizontal: H_PAD,
    marginTop: -32,
    marginBottom: 16,
    gap: 10,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
    ...Shadow.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.gray900,
    padding: 0,
  },
  filterBtn: {
    width: 50,
    height: 50,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
  filterBtnActive: {
    backgroundColor: Colors.emerald600,
  },

  // ── Filter Panel ──
  filterPanel: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 16,
    ...Shadow.lg,
  },
  filterLabel: {
    color: Colors.gray700,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sortBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    backgroundColor: Colors.gray100,
  },
  sortBtnActive: {
    backgroundColor: Colors.emerald600,
  },
  sortBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.gray700,
  },
  sortBtnTextActive: {
    color: Colors.white,
  },
  nearbyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nearbyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  nearbyLabel: {
    color: Colors.gray700,
    fontSize: FontSize.sm,
    fontWeight: '600',
    flex: 1,
  },

  // ── Categories ──
  categoryWrap: {
    marginBottom: 16,
  },
  categoryScroll: {
    paddingHorizontal: H_PAD,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.white,
    ...Shadow.sm,
  },
  categoryChipActive: {
    backgroundColor: Colors.emerald600,
    ...Shadow.md,
  },
  categoryChipText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.gray700,
  },
  categoryChipTextActive: {
    color: Colors.white,
  },

  // ── Grid ──
  grid: {
    paddingHorizontal: H_PAD,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: COL_GAP,
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  productCardDim: {
    opacity: 0.6,
  },
  productImageBox: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productEmoji: {
    fontSize: 52,
  },
  popularBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EAB308',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  popularBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.emerald600,
    borderRadius: BorderRadius.full,
    padding: 3,
  },
  negotiableBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: Colors.blue600,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  negotiableBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  productInfo: {
    padding: 12,
    gap: 4,
  },
  productName: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.gray900,
    lineHeight: 17,
  },
  productDesc: {
    fontSize: 10,
    color: Colors.gray500,
    lineHeight: 14,
  },
  productRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  productRating: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.gray700,
  },
  productReviewCount: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
  },
  productLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  productLocation: {
    fontSize: FontSize.xs,
    color: Colors.gray500,
  },
  productPointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  productPoints: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.emerald700,
  },
  productActions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  viewBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    backgroundColor: Colors.emerald600,
  },
  viewBtnLocked: {
    backgroundColor: Colors.gray200,
  },
  viewBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.white,
  },
  viewBtnTextLocked: {
    color: Colors.gray400,
  },
  chatBtn: {
    width: 34,
    height: 34,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Empty State ──
  emptyState: {
    alignItems: 'center',
    paddingVertical: 56,
    paddingHorizontal: 32,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: Colors.gray900,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySub: {
    color: Colors.gray500,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
});
