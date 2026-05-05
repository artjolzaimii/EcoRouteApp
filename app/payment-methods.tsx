import { Colors, Shadow } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CREAM = '#F1EFE8';
const ECO_GREEN = Colors.emerald600;

type CardBrand = 'visa' | 'mastercard' | 'amex';

interface PaymentCard {
    id: string;
    brand: CardBrand;
    last4: string;
    expiryMonth: string;
    expiryYear: string;
    isDefault: boolean;
}

const brandColors: Record<CardBrand, [string, string]> = {
    visa: ['#1a1f71', '#2563eb'],
    mastercard: ['#eb001b', '#f79e1b'],
    amex: ['#007bc1', '#00a3e0'],
};

const brandLabel: Record<CardBrand, string> = {
    visa: 'VISA',
    mastercard: 'Mastercard',
    amex: 'Amex',
};

const initialCards: PaymentCard[] = [
    { id: '1', brand: 'visa', last4: '4242', expiryMonth: '08', expiryYear: '27', isDefault: true },
    { id: '2', brand: 'mastercard', last4: '5353', expiryMonth: '03', expiryYear: '26', isDefault: false },
];

function CardWidget({ card, onRemove, onSetDefault }: {
    card: PaymentCard;
    onRemove: () => void;
    onSetDefault: () => void;
}) {
    const [c1, c2] = brandColors[card.brand];
    return (
        <View style={styles.cardWidget}>
            <LinearGradient colors={[c1, c2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardGradient}>
                <View style={styles.cardTop}>
                    <Text style={styles.cardBrand}>{brandLabel[card.brand]}</Text>
                    {card.isDefault && (
                        <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.cardNumber}>•••• •••• •••• {card.last4}</Text>
                <Text style={styles.cardExpiry}>Expires {card.expiryMonth}/{card.expiryYear}</Text>
            </LinearGradient>
            <View style={styles.cardActions}>
                {!card.isDefault && (
                    <TouchableOpacity style={styles.actionBtn} onPress={onSetDefault} activeOpacity={0.8}>
                        <Ionicons name="checkmark-circle-outline" size={18} color={ECO_GREEN} />
                        <Text style={[styles.actionBtnText, { color: ECO_GREEN }]}>Set as Default</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.actionBtn, styles.actionBtnRemove]} onPress={onRemove} activeOpacity={0.8}>
                    <Ionicons name="trash-outline" size={18} color={Colors.red600} />
                    <Text style={[styles.actionBtnText, { color: Colors.red600 }]}>Remove</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default function PaymentMethodsScreen() {
    const insets = useSafeAreaInsets();
    const [cards, setCards] = useState<PaymentCard[]>(initialCards);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [newCardNumber, setNewCardNumber] = useState('');
    const [newExpiry, setNewExpiry] = useState('');
    const [newCvv, setNewCvv] = useState('');

    const handleRemove = (id: string) => {
        const card = cards.find((c) => c.id === id);
        if (card?.isDefault && cards.length > 1) {
            Alert.alert('Cannot Remove', 'Please set another card as default before removing this one.');
            return;
        }
        Alert.alert('Remove Card', `Remove card ending in ${card?.last4}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: () => setCards((prev) => prev.filter((c) => c.id !== id)),
            },
        ]);
    };

    const handleSetDefault = (id: string) => {
        setCards((prev) =>
            prev.map((c) => ({ ...c, isDefault: c.id === id })),
        );
    };

    const handleAddCard = () => {
        if (newCardNumber.length < 16) {
            Alert.alert('Invalid Card', 'Please enter a valid 16-digit card number.');
            return;
        }
        const newCard: PaymentCard = {
            id: Math.random().toString(36).substr(2, 9),
            brand: newCardNumber.startsWith('4') ? 'visa' : (newCardNumber.startsWith('3') ? 'amex' : 'mastercard'),
            last4: newCardNumber.slice(-4),
            expiryMonth: newExpiry.split('/')[0] || '12',
            expiryYear: newExpiry.split('/')[1] || '29',
            isDefault: cards.length === 0,
        };
        setCards((prev) => [...prev, newCard]);
        setAddModalVisible(false);
        setNewCardNumber('');
        setNewExpiry('');
        setNewCvv('');
        Alert.alert('Success', 'Payment method added successfully!');
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.9}>
                    <Ionicons name="arrow-back-outline" size={20} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment Methods</Text>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
            >
                {cards.length === 0 ? (
                    <View style={styles.emptyWrap}>
                        <View style={styles.emptyCircle}>
                            <Ionicons name="card-outline" size={56} color={Colors.gray300} />
                        </View>
                        <Text style={styles.emptyTitle}>No payment methods</Text>
                        <Text style={styles.emptySubtitle}>
                            Add a card to unlock premium eco features and partner discounts.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.cardList}>
                        {cards.map((card) => (
                            <CardWidget
                                key={card.id}
                                card={card}
                                onRemove={() => handleRemove(card.id)}
                                onSetDefault={() => handleSetDefault(card.id)}
                            />
                        ))}
                    </View>
                )}

                {/* Security note */}
                <View style={styles.securityNote}>
                    <Ionicons name="lock-closed-outline" size={16} color={ECO_GREEN} />
                    <Text style={styles.securityText}>
                        Your payment data is encrypted and stored securely. EcoRoute never stores your full card number.
                    </Text>
                </View>

                {/* Supported brands */}
                <View style={styles.brandsRow}>
                    {(['visa', 'mastercard', 'amex'] as CardBrand[]).map((b) => (
                        <View key={b} style={styles.brandPill}>
                            <Text style={styles.brandPillText}>{brandLabel[b]}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Add Card Button */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity style={styles.addBtn} onPress={() => setAddModalVisible(true)} activeOpacity={0.9}>
                    <Ionicons name="add-circle-outline" size={22} color={Colors.white} />
                    <Text style={styles.addBtnText}>Add Payment Method</Text>
                </TouchableOpacity>
            </View>

            {/* Add Card Modal */}
            <Modal visible={addModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAddModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View style={[styles.modalContent, { paddingTop: 20 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Payment Method</Text>
                            <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.modalClose}>
                                <Ionicons name="close" size={24} color={Colors.gray900} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, gap: 20 }}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Card Number</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="0000 0000 0000 0000"
                                    placeholderTextColor={Colors.gray400}
                                    keyboardType="number-pad"
                                    maxLength={16}
                                    value={newCardNumber}
                                    onChangeText={setNewCardNumber}
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Expiry (MM/YY)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="MM/YY"
                                        placeholderTextColor={Colors.gray400}
                                        keyboardType="number-pad"
                                        maxLength={5}
                                        value={newExpiry}
                                        onChangeText={setNewExpiry}
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>CVV</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="123"
                                        placeholderTextColor={Colors.gray400}
                                        keyboardType="number-pad"
                                        maxLength={3}
                                        secureTextEntry
                                        value={newCvv}
                                        onChangeText={setNewCvv}
                                    />
                                </View>
                            </View>

                            <View style={styles.securityBanner}>
                                <Ionicons name="lock-closed" size={16} color={ECO_GREEN} />
                                <Text style={styles.securityBannerText}>Your card info is secure and encrypted</Text>
                            </View>

                            <TouchableOpacity style={styles.submitBtn} onPress={handleAddCard} activeOpacity={0.9}>
                                <Text style={styles.submitBtnText}>Add Card</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: CREAM },
    header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 24, paddingVertical: 16 },
    backBtn: {
        width: 40, height: 40, backgroundColor: Colors.white, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
    },
    headerTitle: { color: '#1A1A1A', fontSize: 24, fontWeight: '700' },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 8, gap: 20 },
    cardList: { gap: 16 },
    cardWidget: { backgroundColor: Colors.white, borderRadius: 20, overflow: 'hidden', ...Shadow.lg },
    cardGradient: { padding: 24, gap: 12 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardBrand: { color: Colors.white, fontSize: 18, fontWeight: '800', letterSpacing: 2 },
    defaultBadge: {
        backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10,
        paddingVertical: 4, borderRadius: 999,
    },
    defaultBadgeText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
    cardNumber: { color: Colors.white, fontSize: 20, fontWeight: '600', letterSpacing: 3 },
    cardExpiry: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
    cardActions: { flexDirection: 'row', padding: 12, gap: 8 },
    actionBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.emerald100,
    },
    actionBtnRemove: { backgroundColor: Colors.red100 },
    actionBtnText: { fontWeight: '600', fontSize: 13 },
    emptyWrap: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 24 },
    emptyCircle: {
        width: 112, height: 112, backgroundColor: Colors.white, borderRadius: 56,
        alignItems: 'center', justifyContent: 'center', marginBottom: 24, ...Shadow.md,
    },
    emptyTitle: { color: '#1A1A1A', fontSize: 22, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
    emptySubtitle: { color: Colors.gray600, fontSize: 15, textAlign: 'center', lineHeight: 22 },
    securityNote: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        backgroundColor: Colors.emerald100, borderRadius: 14, padding: 14,
    },
    securityText: { color: Colors.emerald800, fontSize: 13, lineHeight: 18, flex: 1 },
    brandsRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
    brandPill: {
        backgroundColor: Colors.white, paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: 999, ...Shadow.sm,
    },
    brandPillText: { color: Colors.gray700, fontWeight: '700', fontSize: 13 },
    footer: { paddingHorizontal: 24, paddingTop: 12, backgroundColor: CREAM },
    addBtn: {
        backgroundColor: ECO_GREEN, borderRadius: 20, paddingVertical: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, ...Shadow.md,
    },
    addBtnText: { color: Colors.white, fontWeight: '700', fontSize: 17 },
    modalContent: { flex: 1, backgroundColor: Colors.white },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.gray900 },
    modalClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center' },
    inputGroup: { gap: 8 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.gray600, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { backgroundColor: Colors.gray50, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: Colors.gray900, borderWidth: 1, borderColor: Colors.gray200 },
    row: { flexDirection: 'row', gap: 16 },
    securityBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.emerald50, padding: 12, borderRadius: 12, marginTop: 8 },
    securityBannerText: { fontSize: 13, color: Colors.emerald700, fontWeight: '500' },
    submitBtn: { backgroundColor: ECO_GREEN, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 12, ...Shadow.md },
    submitBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});
