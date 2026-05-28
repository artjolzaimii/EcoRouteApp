import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  StyleSheet,
  Pressable,
  Share,
  Dimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow, BorderRadius, FontSize } from '@/constants/theme';
import { api } from '@/lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ApiListing {
  id: string;
  title: string;
  description: string | null;
  whyEco: string | null;
  pointsPrice: number | null;
  moneyPrice: number | null;
  payment: string;
  stock: number | null;
  location: string | null;
  category: { slug: string; label: string; glyph: string };
  partner: { businessName: string; location: string | null; businessEmail: string | null };
  images: { url: string; isCover: boolean }[];
}

function adaptListing(l: ApiListing) {
  return {
    id: l.id,
    name: l.title,
    description: l.description ?? '',
    fullDescription: l.description ?? '',
    points: l.pointsPrice ?? 0,
    moneyPrice: l.moneyPrice,
    payment: l.payment,
    image: l.category?.glyph ?? '📦',
    inStock: l.stock === null || l.stock > 0,
    negotiable: false,
    rating: 0,
    reviews: 0,
    features: l.whyEco ? [l.whyEco] : [],
    shipping: l.location ? `Pickup at ${l.location}` : 'Contact partner for details',
    seller: {
      name: l.partner?.businessName ?? 'EcoRoute Partner',
      avatar: '🏪',
      rating: 5.0,
      totalReviews: 0,
      verified: true,
      location: l.partner?.location ?? l.location ?? '',
      responseTime: 'Usually responds within 24 hours',
      email: l.partner?.businessEmail ?? null,
    },
    userReviews: [] as { name: string; avatar: string; rating: number; date: string; comment: string; helpful: number }[],
  };
}

export default function MarketplaceProductScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [userPoints, setUserPoints]     = useState(0);
  const [loadingPoints, setLoadingPoints] = useState(true);
  const [listing, setListing]           = useState<ApiListing | null>(null);
  const [loadingListing, setLoadingListing] = useState(true);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [offerPoints, setOfferPoints]   = useState('');

  useEffect(() => {
    (async () => {
      setLoadingPoints(true);
      try {
        const stats = await api.get<{ totalPoints: number }>('/api/user/stats');
        setUserPoints(stats.totalPoints ?? 0);
      } catch {
        // keep 0
      } finally {
        setLoadingPoints(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoadingListing(true);
    api.get<ApiListing>(`/api/marketplace/listings/${id}`)
      .then(setListing)
      .catch(console.error)
      .finally(() => setLoadingListing(false));
  }, [id]);

  const product = listing ? adaptListing(listing) : null;
  const pts     = product?.points ?? 0;
  // FLEXIBLE: always accessible — user can choose 0 pts and pay full money sim
  const canAfford = true;

  const handleMessageSeller = () => {
    const email = product?.seller.email;
    if (!email) return;
    const subject = encodeURIComponent('EcoRoute Marketplace Inquiry');
    const body = encodeURIComponent(`Hi ${product?.seller.name},\n\nI'm interested in "${product?.name}" listed on EcoRoute Marketplace.\n\nCould you please provide more details?\n\nThank you!`);
    Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  const handleShare = async (_platform: string) => {
    setShowShareModal(false);
    try {
      await Share.share({
        message: `Check out "${product?.name}" on EcoRoute Marketplace! 🌱`,
      });
    } catch {
      // ignore
    }
  };

  const handleMakeOffer = () => {
    setShowOfferModal(false);
    setOfferPoints('');
  };

  const handleRedeem = () => {
    router.push({
      pathname: '/marketplace-checkout',
      params: { id: String(id) },
    });
  };

  const offerValid = offerPoints.length > 0 && Number(offerPoints) < pts && Number(offerPoints) > 0;

  if (loadingListing) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={Colors.emerald600} size="large" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <Text style={{ color: Colors.gray500, fontSize: FontSize.base }}>Listing not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: Colors.emerald600, fontWeight: '600' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.headerBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back-outline" size={22} color={Colors.gray700} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setShowShareModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="share-social-outline" size={22} color={Colors.gray700} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── Product Hero Image ── */}
        {(() => {
          const sortedImages = [...(listing?.images ?? [])].sort((a, b) => (a.isCover ? -1 : 1) - (b.isCover ? -1 : 1));
          const coverImg = sortedImages[0];
          return coverImg ? (
            <View style={styles.heroBox}>
              <Image
                source={{ uri: coverImg.url }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
              />
              {product.seller.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={26} color={Colors.white} />
                </View>
              )}
            </View>
          ) : (
            <LinearGradient colors={[Colors.emerald50, Colors.emerald100]} style={styles.heroBox}>
              <Text style={styles.heroEmoji}>{product.image}</Text>
              {product.seller.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={26} color={Colors.white} />
                </View>
              )}
            </LinearGradient>
          );
        })()}

        <View style={styles.content}>
          {/* ── Title & In-Stock ── */}
          <View style={styles.titleRow}>
            <Text style={styles.productName}>{product.name}</Text>
            {product.inStock && (
              <View style={styles.inStockBadge}>
                <Ionicons name="checkmark" size={12} color={Colors.green600} />
                <Text style={styles.inStockText}>In Stock</Text>
              </View>
            )}
          </View>

          {/* ── Location ── */}
          {product.seller.location ? (
            <View style={[styles.metaRow, { justifyContent: 'flex-start' }]}>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={Colors.gray400} />
                <Text style={styles.locationText}>{product.seller.location}</Text>
              </View>
            </View>
          ) : null}

          {/* ── Points / Price ── */}
          <View style={styles.pointsRow}>
            <Ionicons name="sparkles-outline" size={24} color={Colors.emerald600} />
            {product.payment === 'MONEY_ONLY' ? (
              <>
                <Text style={styles.pointsValue}>€{Number(product.moneyPrice).toFixed(2)}</Text>
                <Text style={styles.pointsLabel}>EUR</Text>
              </>
            ) : (
              <>
                <Text style={styles.pointsValue}>{pts.toLocaleString()} pts</Text>
                <Text style={styles.pointsLabel}>or €{Number(product.moneyPrice).toFixed(2)}</Text>
              </>
            )}
          </View>

          {/* ── Description ── */}
          <Text style={styles.description}>{product.fullDescription}</Text>

          {/* ── Seller Card ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sold By</Text>
            <View style={styles.sellerRow}>
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerAvatarEmoji}>{product.seller.avatar}</Text>
              </View>
              <View style={styles.sellerInfo}>
                <View style={styles.sellerNameRow}>
                  <Text style={styles.sellerName}>{product.seller.name}</Text>
                  {product.seller.verified && (
                    <Ionicons name="checkmark-circle" size={18} color={Colors.emerald600} />
                  )}
                </View>
                <View style={styles.sellerRatingRow}>
                  <Ionicons name="star" size={14} color="#EAB308" />
                  <Text style={styles.sellerRatingVal}>{product.seller.rating}</Text>
                  <Text style={styles.sellerRatingCount}>({product.seller.totalReviews})</Text>
                </View>
                <Text style={styles.sellerResponse}>{product.seller.responseTime}</Text>
                <TouchableOpacity
                  style={[styles.messageBtnFull, !product.seller.email && styles.messageBtnDisabled]}
                  activeOpacity={product.seller.email ? 0.8 : 1}
                  onPress={product.seller.email ? handleMessageSeller : undefined}
                  disabled={!product.seller.email}
                >
                  <Ionicons name="mail-outline" size={16} color={Colors.white} />
                  <Text style={styles.messageBtnText}>
                    {product.seller.email ? 'Message Seller' : 'Contact Unavailable'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── Features ── */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="star-outline" size={18} color={Colors.emerald600} />
              <Text style={styles.cardTitle}>What's Included</Text>
            </View>
            {product.features.map((feature, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={styles.featureCheck}>
                  <Ionicons name="checkmark" size={12} color={Colors.emerald600} />
                </View>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* ── Shipping ── */}
          <View style={styles.shippingCard}>
            <View style={styles.shippingIcon}>
              <Ionicons name="cube-outline" size={20} color={Colors.blue600} />
            </View>
            <View style={styles.shippingInfo}>
              <Text style={styles.shippingTitle}>Delivery Info</Text>
              <Text style={styles.shippingText}>{product.shipping}</Text>
            </View>
          </View>

          {/* ── Reviews ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Customer Reviews</Text>
            {product.userReviews.map((review, i) => (
              <View
                key={i}
                style={[styles.reviewItem, i < product.userReviews.length - 1 && styles.reviewBorder]}
              >
                <View style={styles.reviewRow}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarEmoji}>{review.avatar}</Text>
                  </View>
                  <View style={styles.reviewMeta}>
                    <View style={styles.reviewTopRow}>
                      <Text style={styles.reviewName}>{review.name}</Text>
                      <Text style={styles.reviewDate}>{review.date}</Text>
                    </View>
                    <View style={styles.reviewStars}>
                      {Array.from({ length: 5 }).map((_, si) => (
                        <Ionicons
                          key={si}
                          name="star"
                          size={13}
                          color={si < review.rating ? '#EAB308' : Colors.gray200}
                        />
                      ))}
                    </View>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                    <TouchableOpacity style={styles.helpfulBtn} activeOpacity={0.7}>
                      <Ionicons name="thumbs-up-outline" size={13} color={Colors.gray500} />
                      <Text style={styles.helpfulText}>Helpful ({review.helpful})</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* ── Points Balance ── */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceRowLabel}>Your Points</Text>
              {loadingPoints ? (
                <ActivityIndicator color={Colors.gray700} size="small" />
              ) : (
                <Text style={styles.balanceRowVal}>{userPoints.toLocaleString()}</Text>
              )}
            </View>
            {product.payment === 'MONEY_ONLY' ? (
              <View style={styles.balanceRow}>
                <Text style={styles.balanceRowLabel}>Price</Text>
                <Text style={styles.balanceRowVal}>€{Number(product.moneyPrice).toFixed(2)}</Text>
              </View>
            ) : (
              <>
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceRowLabel}>Full points cost</Text>
                  <Text style={styles.balanceRowVal}>{pts.toLocaleString()} pts</Text>
                </View>
                <View style={styles.balanceDivider} />
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceTotalLabel}>Choose your mix at checkout</Text>
                  <Text style={styles.balanceTotalVal}>↓</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── Bottom CTA ── */}
      <View style={[styles.bottomCTA, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={styles.redeemBtn}
          onPress={handleRedeem}
          activeOpacity={0.8}
        >
          <Ionicons name="bag-handle-outline" size={18} color={Colors.white} />
          <Text style={styles.redeemBtnText}>
            {product.payment === 'MONEY_ONLY'
              ? `Buy for €${Number(product.moneyPrice).toFixed(2)}`
              : 'Checkout'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Make Offer Modal ── */}
      <Modal
        visible={showOfferModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOfferModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowOfferModal(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Make an Offer</Text>
            <Text style={styles.modalSub}>Current price: {pts.toLocaleString()} points</Text>
            <Text style={styles.modalFieldLabel}>Your Offer (points)</Text>
            <TextInput
              style={styles.modalInput}
              value={offerPoints}
              onChangeText={setOfferPoints}
              keyboardType="numeric"
              placeholder={`Less than ${pts}`}
              placeholderTextColor={Colors.gray400}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowOfferModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, !offerValid && styles.modalConfirmBtnDisabled]}
                onPress={offerValid ? handleMakeOffer : undefined}
                activeOpacity={offerValid ? 0.8 : 1}
              >
                <Text style={[styles.modalConfirmText, !offerValid && styles.modalConfirmTextDisabled]}>
                  Send Offer
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Share Modal ── */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowShareModal(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Share Product</Text>
            <View style={styles.sharePlatforms}>
              {['Facebook', 'Twitter', 'WhatsApp', 'Copy Link'].map((platform) => (
                <TouchableOpacity
                  key={platform}
                  style={styles.sharePlatformBtn}
                  onPress={() => handleShare(platform)}
                  activeOpacity={0.8}
                >
                  <View style={styles.sharePlatformIcon}>
                    <Ionicons name="share-social-outline" size={24} color={Colors.emerald600} />
                  </View>
                  <Text style={styles.sharePlatformLabel}>{platform}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowShareModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },

  // ── Header ──
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    ...Shadow.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.gray900,
  },

  scroll: {
    flex: 1,
  },

  // ── Hero ──
  heroBox: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 120,
  },
  negotiableBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.blue600,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  negotiableBadgeText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: Colors.emerald600,
    borderRadius: BorderRadius.full,
    padding: 6,
  },

  // ── Content ──
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  productName: {
    flex: 1,
    fontSize: FontSize['2xl'],
    fontWeight: '700',
    color: Colors.gray900,
    lineHeight: 30,
  },
  inStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.green100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginTop: 4,
  },
  inStockText: {
    color: Colors.green600,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingVal: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.gray900,
  },
  ratingCount: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointsValue: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.emerald700,
  },
  pointsLabel: {
    fontSize: FontSize.base,
    color: Colors.gray500,
  },
  description: {
    fontSize: FontSize.base,
    color: Colors.gray600,
    lineHeight: 22,
  },

  // ── Cards ──
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: 20,
    gap: 12,
    ...Shadow.lg,
  },
  cardTitle: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.gray900,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Seller
  sellerRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  sellerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.emerald100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerAvatarEmoji: {
    fontSize: 28,
  },
  sellerInfo: {
    flex: 1,
    gap: 4,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellerName: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.gray900,
  },
  sellerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sellerRatingVal: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.gray900,
  },
  sellerRatingCount: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
  },
  sellerResponse: {
    fontSize: FontSize.xs,
    color: Colors.gray500,
  },
  messageBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.emerald600,
    paddingVertical: 10,
    borderRadius: BorderRadius.xl,
    marginTop: 4,
  },
  messageBtnDisabled: {
    backgroundColor: Colors.gray300,
  },
  messageBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },

  // Features
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.emerald100,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  featureText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.gray700,
    lineHeight: 20,
  },

  // Shipping
  shippingCard: {
    backgroundColor: Colors.blue100,
    borderRadius: BorderRadius.xl,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  shippingIcon: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(37,99,235,0.15)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  shippingInfo: {
    flex: 1,
    gap: 3,
  },
  shippingTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: '#1e3a8a',
  },
  shippingText: {
    fontSize: FontSize.sm,
    color: Colors.blue600,
    lineHeight: 20,
  },

  // Reviews
  reviewItem: {
    paddingBottom: 16,
  },
  reviewBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    marginBottom: 16,
  },
  reviewRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.purple100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarEmoji: {
    fontSize: 20,
  },
  reviewMeta: {
    flex: 1,
    gap: 4,
  },
  reviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewName: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.gray900,
  },
  reviewDate: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
    lineHeight: 19,
  },
  helpfulBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  helpfulText: {
    fontSize: FontSize.xs,
    color: Colors.gray500,
  },

  // Balance
  balanceCard: {
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.xl,
    padding: 20,
    gap: 10,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceRowLabel: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
  },
  balanceRowVal: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.gray900,
  },
  balanceDivider: {
    height: 1,
    backgroundColor: Colors.gray300,
  },
  balanceTotalLabel: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.gray900,
  },
  balanceTotalVal: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.emerald600,
  },
  balanceTotalInsuff: {
    color: Colors.red600,
    fontSize: FontSize.sm,
  },

  // ── Bottom CTA ──
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    paddingTop: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 10,
  },
  offerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.blue600,
    paddingVertical: 16,
    borderRadius: BorderRadius['2xl'],
    ...Shadow.lg,
  },
  offerBtnText: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: '700',
  },
  redeemBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.emerald600,
    paddingVertical: 16,
    borderRadius: BorderRadius['2xl'],
    ...Shadow.lg,
  },
  redeemBtnHalf: {
    flex: 1,
  },
  redeemBtnLocked: {
    backgroundColor: Colors.gray200,
    elevation: 0,
    shadowOpacity: 0,
  },
  redeemBtnText: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: '700',
  },
  redeemBtnTextLocked: {
    color: Colors.gray400,
  },

  // ── Modals ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
    gap: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.gray200,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.gray900,
  },
  modalSub: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
    marginTop: -8,
  },
  modalFieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.gray700,
    marginBottom: -8,
  },
  modalInput: {
    backgroundColor: Colors.gray50,
    borderWidth: 2,
    borderColor: Colors.gray200,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: FontSize.base,
    color: Colors.gray900,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.gray700,
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: Colors.emerald600,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  modalConfirmBtnDisabled: {
    backgroundColor: Colors.gray200,
  },
  modalConfirmText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },
  modalConfirmTextDisabled: {
    color: Colors.gray400,
  },
  sharePlatforms: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sharePlatformBtn: {
    alignItems: 'center',
    gap: 8,
  },
  sharePlatformIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.emerald100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sharePlatformLabel: {
    fontSize: FontSize.xs,
    color: Colors.gray600,
    fontWeight: '500',
  },
});
