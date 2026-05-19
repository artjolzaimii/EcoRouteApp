import { Colors, Shadow } from '@/constants/theme';
import { api, getEcoRoutes } from '@/lib/api';
import { reverseGeocode } from '@/lib/geocode';
import { routeStore } from '@/lib/routeStore';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { LongPressEvent, Marker, Polyline, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

type PinCategory = 'TRASH' | 'CLEANUP' | 'ECO_OFFER' | 'COMMUNITY';

interface PinData {
  id: string;
  profileId: string;
  category: PinCategory;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  expiresAt: string;
  createdAt: string;
  upvoteCount: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_REGION: Region = {
  latitude: 41.3275,
  longitude: 19.8187,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};

const PIN_CONFIG: Record<PinCategory, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  TRASH:     { label: 'Trash Report', icon: 'trash-outline',    color: '#EF4444' },
  CLEANUP:   { label: 'Cleanup Event', icon: 'leaf-outline',    color: '#3B82F6' },
  ECO_OFFER: { label: 'Eco Offer',    icon: 'pricetag-outline', color: '#F59E0B' },
  COMMUNITY: { label: 'Community Event', icon: 'people-outline', color: '#8B5CF6' },
};

const EXPIRY_OPTIONS = [
  { label: '24h',  hours: 24 },
  { label: '3d',   hours: 72 },
  { label: '7d',   hours: 168 },
  { label: '30d',  hours: 720 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getUserRegion(): Promise<Region> {
  try {
    const Location = require('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return DEFAULT_REGION;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      latitudeDelta: 0.03,
      longitudeDelta: 0.03,
    };
  } catch {
    return DEFAULT_REGION;
  }
}

function timeUntilExpiry(expiresAt: string): string {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return 'Expired';
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HeatmapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const lastRegionRef = useRef<Region>(DEFAULT_REGION);

  // Route lines state
  const [routeLines, setRouteLines] = useState<[number, number][][]>([]);
  const [distinctRouteCount, setDistinctRouteCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Pins state
  const [pins, setPins] = useState<PinData[]>([]);
  const [selectedPin, setSelectedPin] = useState<PinData | null>(null);
  const [displayPin, setDisplayPin] = useState<PinData | null>(null);
  const cardAnim = useRef(new Animated.Value(0)).current;
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [upvoting, setUpvoting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [takingRoute, setTakingRoute] = useState(false);

  // Create pin state
  const [newPinCoord, setNewPinCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [displayCreateCard, setDisplayCreateCard] = useState(false);
  const createCardAnim = useRef(new Animated.Value(0)).current;
  const [createCategory, setCreateCategory] = useState<PinCategory>('TRASH');
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createExpiresInHours, setCreateExpiresInHours] = useState(24);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getUserRegion().then((r) => {
      mapRef.current?.animateToRegion(r, 600);
      fetchRouteLines(r);
      fetchPins(r);
    });
    api.get<{ id: string }>('/api/user/profile')
      .then((p) => setMyProfileId(p.id))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedPin) {
      setDisplayPin(selectedPin);
      Animated.spring(cardAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 9,
      }).start();
    } else {
      Animated.timing(cardAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => setDisplayPin(null));
    }
  }, [selectedPin]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (showCreateModal) {
      setDisplayCreateCard(true);
      Animated.spring(createCardAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 9,
      }).start();
    } else {
      Animated.timing(createCardAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        setDisplayCreateCard(false);
        // Restore position — Google Maps resets its camera when a Modal unmounts
        mapRef.current?.animateToRegion(lastRegionRef.current, 0);
      });
    }
  }, [showCreateModal]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRouteLines = async (r: Region) => {
    setLoading(true);
    try {
      const minLat = r.latitude - r.latitudeDelta / 2;
      const maxLat = r.latitude + r.latitudeDelta / 2;
      const minLng = r.longitude - r.longitudeDelta / 2;
      const maxLng = r.longitude + r.longitudeDelta / 2;
      const data = await api.get<{ lines: [number, number][][]; count: number; distinctCount: number }>(
        `/api/heatmap/lines?min_lat=${minLat}&max_lat=${maxLat}&min_lng=${minLng}&max_lng=${maxLng}`
      );
      setRouteLines(data.lines ?? []);
      setDistinctRouteCount(data.distinctCount ?? 0);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  const fetchPins = async (r: Region) => {
    try {
      const minLat = r.latitude - r.latitudeDelta / 2;
      const maxLat = r.latitude + r.latitudeDelta / 2;
      const minLng = r.longitude - r.longitudeDelta / 2;
      const maxLng = r.longitude + r.longitudeDelta / 2;
      const data = await api.get<PinData[]>(
        `/api/pins?min_lat=${minLat}&max_lat=${maxLat}&min_lng=${minLng}&max_lng=${maxLng}`
      );
      setPins(data ?? []);
    } catch {
      // silent fail
    }
  };

  const onRegionChange = (r: Region) => {
    lastRegionRef.current = r;
    fetchRouteLines(r);
    fetchPins(r);
  };

  const onLongPress = (e: LongPressEvent) => {
    setNewPinCoord(e.nativeEvent.coordinate);
    setCreateCategory('TRASH');
    setCreateTitle('');
    setCreateDescription('');
    setCreateExpiresInHours(24);
    setShowCreateModal(true);
  };

  const submitPin = async () => {
    if (!createTitle.trim()) {
      Alert.alert('Missing title', 'Please enter a title for your pin.');
      return;
    }
    if (!newPinCoord) return;
    setSubmitting(true);
    try {
      const pin = await api.post<PinData>('/api/pins', {
        category: createCategory,
        title: createTitle.trim(),
        description: createDescription.trim() || undefined,
        latitude: newPinCoord.latitude,
        longitude: newPinCoord.longitude,
        expiresInHours: createExpiresInHours,
      });
      setPins((prev) => [pin, ...prev]);
      setShowCreateModal(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not drop pin. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUpvote = async (pin: PinData) => {
    if (upvoting) return;
    setUpvoting(true);
    const alreadyUpvoted = upvotedIds.has(pin.id);
    // optimistic update
    setUpvotedIds((prev) => {
      const next = new Set(prev);
      alreadyUpvoted ? next.delete(pin.id) : next.add(pin.id);
      return next;
    });
    setSelectedPin((prev) =>
      prev ? { ...prev, upvoteCount: prev.upvoteCount + (alreadyUpvoted ? -1 : 1) } : null
    );
    setPins((prev) =>
      prev.map((p) =>
        p.id === pin.id ? { ...p, upvoteCount: p.upvoteCount + (alreadyUpvoted ? -1 : 1) } : p
      )
    );
    try {
      const result = await api.post<{ upvoteCount: number; hasUpvoted: boolean }>(
        `/api/pins/${pin.id}/upvote`, {}
      );
      setSelectedPin((prev) => prev ? { ...prev, upvoteCount: result.upvoteCount } : null);
      setPins((prev) =>
        prev.map((p) => p.id === pin.id ? { ...p, upvoteCount: result.upvoteCount } : p)
      );
    } catch {
      // revert optimistic update on failure
      setUpvotedIds((prev) => {
        const next = new Set(prev);
        alreadyUpvoted ? next.add(pin.id) : next.delete(pin.id);
        return next;
      });
    } finally {
      setUpvoting(false);
    }
  };

  const deletePin = (pin: PinData) => {
    Alert.alert('Delete Pin', 'Remove this pin from the map?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await api.delete(`/api/pins/${pin.id}`);
            setPins((prev) => prev.filter((p) => p.id !== pin.id));
            setSelectedPin(null);
          } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'Could not delete pin.');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  const takeMeThere = async (pin: PinData) => {
    if (takingRoute) return;
    setTakingRoute(true);
    try {
      const Location = require('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location required', 'Please allow location access to get directions.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const oLat = pos.coords.latitude;
      const oLng = pos.coords.longitude;

      const [originAddress, destAddress] = await Promise.all([
        reverseGeocode(oLat, oLng).catch(() => 'Your location'),
        reverseGeocode(pin.latitude, pin.longitude).catch(() => pin.title),
      ]);

      const ecoResponse = await getEcoRoutes(
        { lat: oLat, lng: oLng, name: originAddress },
        { lat: pin.latitude, lng: pin.longitude, name: destAddress },
      );

      if (!ecoResponse.routes || ecoResponse.routes.length === 0) {
        Alert.alert('No routes found', 'No eco-routes available to this pin location.');
        return;
      }

      const bestIndex = ecoResponse.routes.findIndex((r: any) => r.recommended) ?? 0;

      routeStore.set({
        originLat: oLat,
        originLng: oLng,
        destLat: pin.latitude,
        destLng: pin.longitude,
        originAddress,
        destAddress,
        routes: [] as any,
        selectedIndex: bestIndex >= 0 ? bestIndex : 0,
        preferredMode: 'CYCLING',
        ecoResponse,
      });

      router.navigate('/(tabs)/routes');
    } catch (err: any) {
      Alert.alert('Could not get routes', err?.message ?? 'Check your connection and try again.');
    } finally {
      setTakingRoute(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        onRegionChangeComplete={onRegionChange}
        onLongPress={onLongPress}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {routeLines.map((line, index) => (
          <Polyline
            key={`route-${index}`}
            coordinates={line.map(([lat, lng]) => ({ latitude: lat, longitude: lng }))}
            strokeColor="rgba(5, 150, 105, 0.25)"
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        ))}

        {pins.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            onPress={() => setSelectedPin(pin)}
            tracksViewChanges={false}
          >
            <View style={[styles.pinMarker, { backgroundColor: PIN_CONFIG[pin.category].color }]}>
              <Ionicons name={PIN_CONFIG[pin.category].icon} size={14} color="#FFF" />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Back button */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 12 }]}
        onPress={() => router.back()}
        activeOpacity={0.85}
      >
        <Ionicons name="arrow-back-outline" size={20} color="#1A1A1A" />
      </TouchableOpacity>

      {/* Title card */}
      <View style={[styles.titleCard, { top: insets.top + 12 }]}>
        <Text style={styles.titleText}>Community Eco Map</Text>
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitleText}>
            {distinctRouteCount > 0 ? `${distinctRouteCount} eco-routes in view` : 'Hold map to drop a pin'}
          </Text>
          {loading && <ActivityIndicator size="small" color={Colors.emerald600} style={{ marginLeft: 6 }} />}
        </View>
      </View>

      {/* ── Create Pin Modal ─────────────────────────────────────────────────── */}
      <Modal
        visible={displayCreateCard}
        animationType="none"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.createModalBg}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Animated.View style={[
            styles.modalSheet,
            {
              opacity: createCardAnim,
              transform: [{
                translateY: createCardAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }),
              }],
            },
          ]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Drop a Pin</Text>

            {/* Category selector */}
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.categoryRow}>
              {(Object.keys(PIN_CONFIG) as PinCategory[]).map((cat) => {
                const cfg = PIN_CONFIG[cat];
                const active = createCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryBtn, active && { backgroundColor: cfg.color, borderColor: cfg.color }]}
                    onPress={() => setCreateCategory(cat)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={cfg.icon} size={16} color={active ? '#FFF' : cfg.color} />
                    <Text style={[styles.categoryBtnText, active && { color: '#FFF' }]}>{cfg.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Title */}
            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Trash near the park"
              placeholderTextColor={Colors.gray400}
              value={createTitle}
              onChangeText={setCreateTitle}
              maxLength={120}
              returnKeyType="next"
            />

            {/* Description */}
            <Text style={styles.fieldLabel}>Description <Text style={styles.optionalLabel}>(optional)</Text></Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Add more details..."
              placeholderTextColor={Colors.gray400}
              value={createDescription}
              onChangeText={setCreateDescription}
              maxLength={400}
              multiline
              numberOfLines={3}
            />

            {/* Expiry */}
            <Text style={styles.fieldLabel}>Expires in</Text>
            <View style={styles.expiryRow}>
              {EXPIRY_OPTIONS.map((opt) => {
                const active = createExpiresInHours === opt.hours;
                return (
                  <TouchableOpacity
                    key={opt.hours}
                    style={[styles.expiryBtn, active && styles.expiryBtnActive]}
                    onPress={() => setCreateExpiresInHours(opt.hours)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.expiryBtnText, active && styles.expiryBtnTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowCreateModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: PIN_CONFIG[createCategory].color }]}
                onPress={submitPin}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <Text style={styles.submitBtnText}>Drop Pin</Text>
                }
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Pin Detail Card (floating, no overlay) ──────────────────────────── */}
      {displayPin && (
        <Animated.View style={[
          styles.pinDetailCard,
          { bottom: insets.bottom + 16 },
          {
            opacity: cardAnim,
            transform: [{
              translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }),
            }],
          },
        ]}>
          {/* Category accent bar */}
          <View style={[styles.pinDetailAccent, { backgroundColor: PIN_CONFIG[displayPin.category].color }]} />

          <View style={styles.pinDetailInner}>
            {/* Header */}
            <View style={styles.detailHeader}>
              <View style={[styles.detailCategoryDot, { backgroundColor: PIN_CONFIG[displayPin.category].color }]}>
                <Ionicons name={PIN_CONFIG[displayPin.category].icon} size={16} color="#FFF" />
              </View>
              <View style={styles.detailHeaderText}>
                <Text style={styles.detailCategoryLabel}>{PIN_CONFIG[displayPin.category].label}</Text>
                <Text style={styles.detailExpiry}>{timeUntilExpiry(displayPin.expiresAt)}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedPin(null)} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
                <Ionicons name="close" size={22} color={Colors.gray400} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <Text style={styles.detailTitle}>{displayPin.title}</Text>
            {displayPin.description ? (
              <Text style={styles.detailDescription}>{displayPin.description}</Text>
            ) : null}

            {/* Action buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: PIN_CONFIG[displayPin.category].color }]}
                onPress={() => selectedPin && takeMeThere(selectedPin)}
                disabled={takingRoute}
                activeOpacity={0.85}
              >
                {takingRoute
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <>
                      <Ionicons name="navigate" size={15} color="#FFF" />
                      <Text style={styles.actionBtnTxt}>Take me there</Text>
                    </>
                }
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSecondary]}
                onPress={() => router.push(`/pin-discussion?pinId=${displayPin.id}&title=${encodeURIComponent(displayPin.title)}&category=${displayPin.category}&pinCreatorId=${displayPin.profileId}`)}
                activeOpacity={0.85}
              >
                <Ionicons name="chatbubble-outline" size={15} color={PIN_CONFIG[displayPin.category].color} />
                <Text style={[styles.actionBtnTxt, { color: PIN_CONFIG[displayPin.category].color }]}>Discussion</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.detailFooter}>
              <TouchableOpacity
                style={[styles.upvoteBtn, upvotedIds.has(displayPin.id) && styles.upvoteBtnActive]}
                onPress={() => selectedPin && toggleUpvote(selectedPin)}
                disabled={upvoting}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={upvotedIds.has(displayPin.id) ? 'arrow-up-circle' : 'arrow-up-circle-outline'}
                  size={18}
                  color={upvotedIds.has(displayPin.id) ? Colors.emerald600 : Colors.gray500}
                />
                <Text style={[styles.upvoteCount, upvotedIds.has(displayPin.id) && { color: Colors.emerald600 }]}>
                  {displayPin.upvoteCount}
                </Text>
              </TouchableOpacity>

              {myProfileId === displayPin.profileId && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => selectedPin && deletePin(selectedPin)}
                  disabled={deleting}
                  activeOpacity={0.8}
                >
                  {deleting
                    ? <ActivityIndicator size="small" color="#EF4444" />
                    : <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  }
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  map: { ...StyleSheet.absoluteFillObject },

  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  titleCard: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    ...Shadow.md,
  },
  titleText: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 1 },
  subtitleText: { fontSize: 11, color: Colors.gray500 },

  // Pin marker
  pinMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },

  // Modal
  createModalBg: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray200 ?? '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },

  // Create form
  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.gray500, marginBottom: 6, marginTop: 12 },
  optionalLabel: { fontWeight: '400', color: Colors.gray400 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.gray200 ?? '#E5E7EB',
    backgroundColor: Colors.white,
  },
  categoryBtnText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray200 ?? '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A1A1A',
  },
  textArea: { minHeight: 72, textAlignVertical: 'top' },
  expiryRow: { flexDirection: 'row', gap: 8 },
  expiryBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.gray200 ?? '#E5E7EB',
    alignItems: 'center',
  },
  expiryBtnActive: { backgroundColor: Colors.emerald600, borderColor: Colors.emerald600 },
  expiryBtnText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  expiryBtnTextActive: { color: '#FFF' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.gray200 ?? '#E5E7EB',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  submitBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  // Floating pin detail card
  pinDetailCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: Colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  pinDetailAccent: {
    width: 4,
  },
  pinDetailInner: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  detailCategoryDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeaderText: { flex: 1 },
  detailCategoryLabel: { fontSize: 12, fontWeight: '700', color: '#1A1A1A' },
  detailExpiry: { fontSize: 11, color: Colors.gray500, marginTop: 1 },
  detailTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  detailDescription: { fontSize: 13, color: '#374151', lineHeight: 19, marginBottom: 2 },
  detailFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200 ?? '#E5E7EB',
  },
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.gray200 ?? '#E5E7EB',
    backgroundColor: Colors.white,
  },
  upvoteBtnActive: { borderColor: Colors.emerald600, backgroundColor: '#F0FDF4' },
  upvoteCount: { fontSize: 14, fontWeight: '600', color: Colors.gray500 },
  deleteBtn: {
    marginLeft: 'auto',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    backgroundColor: '#FFF5F5',
  },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    borderRadius: 14,
  },
  actionBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.gray200,
  },
  actionBtnTxt: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
