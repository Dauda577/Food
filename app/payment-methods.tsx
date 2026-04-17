import React, { useState, useEffect, useCallback } from "react";
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    Alert, ActivityIndicator, Modal, TextInput,
    KeyboardAvoidingView, Platform, Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────
type PaymentMethod = {
    id: string;
    type: "card" | "mobile_money";
    label: string | null;
    card_last4: string | null;
    card_brand: string | null;
    card_expiry: string | null;
    card_holder: string | null;
    momo_provider: string | null;
    momo_number: string | null;
    momo_name: string | null;
    is_default: boolean;
    created_at: string;
};

type FormType = "card" | "mobile_money";

const CARD_BRANDS = ["Visa", "Mastercard", "Verve"];
const MOMO_PROVIDERS = ["MTN", "Vodafone", "AirtelTigo"];

const BRAND_COLORS: Record<string, string> = {
    Visa: "#1a1f71",
    Mastercard: "#eb001b",
    Verve: "#00425f",
};

const MOMO_COLORS: Record<string, string> = {
    MTN: "#ffcc00",
    Vodafone: "#e60000",
    AirtelTigo: "#ef3829",
};

// ── Card icons ────────────────────────────────────────────────────────────────
function CardIcon({ brand }: { brand: string | null }) {
    const icons: Record<string, string> = {
        Visa: "💳", Mastercard: "💳", Verve: "💳",
    };
    return <Text style={{ fontSize: 28 }}>{icons[brand ?? ""] ?? "💳"}</Text>;
}

// ── Format card number input ──────────────────────────────────────────────────
function formatCardNumber(val: string) {
    return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
}

// ── Add/Edit Modal ────────────────────────────────────────────────────────────
function PaymentFormModal({
    visible, onClose, onSave, saving, initial,
}: {
    visible: boolean;
    onClose: () => void;
    onSave: (data: Partial<PaymentMethod>) => Promise<void>;
    saving: boolean;
    initial?: PaymentMethod | null;
}) {
    const [type, setType] = useState<FormType>("card");
    const [label, setLabel] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [cardHolder, setCardHolder] = useState("");
    const [cardExpiry, setCardExpiry] = useState("");
    const [cardBrand, setCardBrand] = useState("Visa");
    const [momoProvider, setMomoProvider] = useState("MTN");
    const [momoNumber, setMomoNumber] = useState("");
    const [momoName, setMomoName] = useState("");
    const [isDefault, setIsDefault] = useState(false);

    useEffect(() => {
        if (visible) {
            if (initial) {
                setType(initial.type);
                setLabel(initial.label ?? "");
                setCardHolder(initial.card_holder ?? "");
                setCardExpiry(initial.card_expiry ?? "");
                setCardBrand(initial.card_brand ?? "Visa");
                setMomoProvider(initial.momo_provider ?? "MTN");
                setMomoNumber(initial.momo_number ?? "");
                setMomoName(initial.momo_name ?? "");
                setIsDefault(initial.is_default);
                setCardNumber("");
            } else {
                setType("card"); setLabel(""); setCardNumber("");
                setCardHolder(""); setCardExpiry(""); setCardBrand("Visa");
                setMomoProvider("MTN"); setMomoNumber(""); setMomoName("");
                setIsDefault(false);
            }
        }
    }, [visible]);

    const handleSave = async () => {
        if (type === "card") {
            if (!cardHolder.trim()) { Alert.alert("Required", "Cardholder name is required."); return; }
            if (!initial && cardNumber.replace(/\s/g, "").length < 16) {
                Alert.alert("Required", "Enter a valid 16-digit card number."); return;
            }
            if (!cardExpiry.match(/^\d{2}\/\d{2}$/)) {
                Alert.alert("Required", "Enter expiry as MM/YY."); return;
            }
        } else {
            if (!momoNumber.trim()) { Alert.alert("Required", "Mobile money number is required."); return; }
            if (!momoName.trim()) { Alert.alert("Required", "Account name is required."); return; }
        }

        const data: Partial<PaymentMethod> = {
            type,
            label: label.trim() || null,
            is_default: isDefault,
            ...(type === "card" ? {
                card_holder: cardHolder.trim(),
                card_last4: cardNumber.replace(/\s/g, "").slice(-4) || initial?.card_last4 || null,
                card_brand: cardBrand,
                card_expiry: cardExpiry,
                momo_provider: null, momo_number: null, momo_name: null,
            } : {
                momo_provider: momoProvider,
                momo_number: momoNumber.trim(),
                momo_name: momoName.trim(),
                card_last4: null, card_brand: null, card_expiry: null, card_holder: null,
            }),
        };

        await onSave(data);
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
                <SafeAreaView style={pmStyles.modalSafe}>
                    <View style={pmStyles.modalHeader}>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={pmStyles.modalCancel}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={pmStyles.modalTitle}>{initial ? "Edit" : "Add"} Payment Method</Text>
                        <TouchableOpacity onPress={handleSave} disabled={saving}>
                            {saving
                                ? <ActivityIndicator size="small" color="#f97316" />
                                : <Text style={pmStyles.modalSave}>Save</Text>}
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">

                        {/* Type selector */}
                        {!initial && (
                            <>
                                <Text style={pmStyles.fieldLabel}>Type</Text>
                                <View style={pmStyles.typeRow}>
                                    {(["card", "mobile_money"] as FormType[]).map(t => (
                                        <TouchableOpacity
                                            key={t}
                                            style={[pmStyles.typeBtn, type === t && pmStyles.typeBtnActive]}
                                            onPress={() => setType(t)}
                                        >
                                            <Ionicons
                                                name={t === "card" ? "card-outline" : "phone-portrait-outline"}
                                                size={18}
                                                color={type === t ? "#fff" : "#6b7280"}
                                            />
                                            <Text style={[pmStyles.typeBtnText, type === t && pmStyles.typeBtnTextActive]}>
                                                {t === "card" ? "Bank Card" : "Mobile Money"}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}

                        <Text style={pmStyles.fieldLabel}>Label (optional)</Text>
                        <TextInput
                            style={pmStyles.input}
                            value={label}
                            onChangeText={setLabel}
                            placeholder={type === "card" ? "e.g. Personal Card" : "e.g. MTN MoMo"}
                            placeholderTextColor="#9ca3af"
                        />

                        {type === "card" ? (
                            <>
                                <Text style={pmStyles.fieldLabel}>Card Brand</Text>
                                <View style={pmStyles.pillRow}>
                                    {CARD_BRANDS.map(b => (
                                        <TouchableOpacity
                                            key={b}
                                            style={[pmStyles.pill, cardBrand === b && pmStyles.pillActive]}
                                            onPress={() => setCardBrand(b)}
                                        >
                                            <Text style={[pmStyles.pillText, cardBrand === b && pmStyles.pillTextActive]}>{b}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {!initial && (
                                    <>
                                        <Text style={pmStyles.fieldLabel}>Card Number</Text>
                                        <TextInput
                                            style={pmStyles.input}
                                            value={cardNumber}
                                            onChangeText={v => setCardNumber(formatCardNumber(v))}
                                            placeholder="0000 0000 0000 0000"
                                            placeholderTextColor="#9ca3af"
                                            keyboardType="number-pad"
                                            maxLength={19}
                                        />
                                    </>
                                )}

                                <Text style={pmStyles.fieldLabel}>Cardholder Name</Text>
                                <TextInput
                                    style={pmStyles.input}
                                    value={cardHolder}
                                    onChangeText={setCardHolder}
                                    placeholder="Name on card"
                                    placeholderTextColor="#9ca3af"
                                    autoCapitalize="characters"
                                />

                                <Text style={pmStyles.fieldLabel}>Expiry Date</Text>
                                <TextInput
                                    style={pmStyles.input}
                                    value={cardExpiry}
                                    onChangeText={v => setCardExpiry(formatExpiry(v))}
                                    placeholder="MM/YY"
                                    placeholderTextColor="#9ca3af"
                                    keyboardType="number-pad"
                                    maxLength={5}
                                />
                            </>
                        ) : (
                            <>
                                <Text style={pmStyles.fieldLabel}>Provider</Text>
                                <View style={pmStyles.pillRow}>
                                    {MOMO_PROVIDERS.map(p => (
                                        <TouchableOpacity
                                            key={p}
                                            style={[pmStyles.pill, momoProvider === p && pmStyles.pillActive]}
                                            onPress={() => setMomoProvider(p)}
                                        >
                                            <Text style={[pmStyles.pillText, momoProvider === p && pmStyles.pillTextActive]}>{p}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={pmStyles.fieldLabel}>Phone Number</Text>
                                <TextInput
                                    style={pmStyles.input}
                                    value={momoNumber}
                                    onChangeText={setMomoNumber}
                                    placeholder="024 000 0000"
                                    placeholderTextColor="#9ca3af"
                                    keyboardType="phone-pad"
                                />

                                <Text style={pmStyles.fieldLabel}>Account Name</Text>
                                <TextInput
                                    style={pmStyles.input}
                                    value={momoName}
                                    onChangeText={setMomoName}
                                    placeholder="Full name on account"
                                    placeholderTextColor="#9ca3af"
                                    autoCapitalize="words"
                                />
                            </>
                        )}

                        <View style={pmStyles.defaultRow}>
                            <View>
                                <Text style={pmStyles.defaultLabel}>Set as default</Text>
                                <Text style={pmStyles.defaultSub}>Used automatically at checkout</Text>
                            </View>
                            <Switch
                                value={isDefault}
                                onValueChange={setIsDefault}
                                trackColor={{ false: "#e5e7eb", true: "#f97316" }}
                                thumbColor="#fff"
                            />
                        </View>

                    </ScrollView>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// ── Payment card display ──────────────────────────────────────────────────────
function PaymentCard({ method, onEdit, onDelete, onSetDefault }: {
    method: PaymentMethod;
    onEdit: () => void;
    onDelete: () => void;
    onSetDefault: () => void;
}) {
    const isCard = method.type === "card";
    const bgColor = isCard
        ? (BRAND_COLORS[method.card_brand ?? ""] ?? "#1a1f71")
        : (MOMO_COLORS[method.momo_provider ?? ""] ?? "#f97316");

    return (
        <View style={pmStyles.cardWrap}>
            {/* Visual card */}
            <View style={[pmStyles.visualCard, { backgroundColor: bgColor }]}>
                <View style={pmStyles.visualCardTop}>
                    <Text style={pmStyles.visualCardType}>
                        {isCard ? (method.card_brand ?? "Card") : method.momo_provider}
                    </Text>
                    {method.is_default && (
                        <View style={pmStyles.defaultBadge}>
                            <Text style={pmStyles.defaultBadgeText}>Default</Text>
                        </View>
                    )}
                </View>
                {isCard ? (
                    <>
                        <Text style={pmStyles.visualCardNumber}>
                            •••• •••• •••• {method.card_last4}
                        </Text>
                        <View style={pmStyles.visualCardBottom}>
                            <View>
                                <Text style={pmStyles.visualCardSubLabel}>Cardholder</Text>
                                <Text style={pmStyles.visualCardSub}>{method.card_holder}</Text>
                            </View>
                            <View>
                                <Text style={pmStyles.visualCardSubLabel}>Expires</Text>
                                <Text style={pmStyles.visualCardSub}>{method.card_expiry}</Text>
                            </View>
                        </View>
                    </>
                ) : (
                    <>
                        <Text style={pmStyles.visualCardNumber}>{method.momo_number}</Text>
                        <View style={pmStyles.visualCardBottom}>
                            <View>
                                <Text style={pmStyles.visualCardSubLabel}>Account Name</Text>
                                <Text style={pmStyles.visualCardSub}>{method.momo_name}</Text>
                            </View>
                        </View>
                    </>
                )}
            </View>

            {/* Actions */}
            <View style={pmStyles.cardActions}>
                {!method.is_default && (
                    <TouchableOpacity style={pmStyles.actionBtn} onPress={onSetDefault}>
                        <Ionicons name="checkmark-circle-outline" size={16} color="#f97316" />
                        <Text style={pmStyles.actionBtnText}>Set Default</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={pmStyles.actionBtn} onPress={onEdit}>
                    <Ionicons name="create-outline" size={16} color="#6b7280" />
                    <Text style={pmStyles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[pmStyles.actionBtn, pmStyles.actionBtnDanger]} onPress={onDelete}>
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    <Text style={[pmStyles.actionBtnText, { color: "#ef4444" }]}>Remove</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function PaymentMethodsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

    const fetchMethods = useCallback(async () => {
        if (!user?.id) return;
        const { data, error } = await supabase
            .from("payment_methods")
            .select("*")
            .eq("user_id", user.id)
            .order("is_default", { ascending: false })
            .order("created_at", { ascending: false });
        if (!error) setMethods((data ?? []) as PaymentMethod[]);
        setLoading(false);
    }, [user?.id]);

    useEffect(() => { fetchMethods(); }, [fetchMethods]);

    const handleSave = async (data: Partial<PaymentMethod>) => {
        if (!user?.id) return;
        setSaving(true);
        try {
            // If setting as default, clear others first
            if (data.is_default) {
                await supabase
                    .from("payment_methods")
                    .update({ is_default: false })
                    .eq("user_id", user.id);
            }

            if (editingMethod) {
                const { error } = await supabase
                    .from("payment_methods")
                    .update(data)
                    .eq("id", editingMethod.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("payment_methods")
                    .insert({ ...data, user_id: user.id });
                if (error) throw error;
            }

            setModalVisible(false);
            setEditingMethod(null);
            await fetchMethods();
        } catch (e: any) {
            Alert.alert("Error", e.message ?? "Failed to save.");
        } finally {
            setSaving(false);
        }
    };

    const handleSetDefault = async (method: PaymentMethod) => {
        await supabase.from("payment_methods").update({ is_default: false }).eq("user_id", user!.id);
        await supabase.from("payment_methods").update({ is_default: true }).eq("id", method.id);
        fetchMethods();
    };

    const handleDelete = (method: PaymentMethod) => {
        Alert.alert(
            "Remove Payment Method",
            `Remove this ${method.type === "card" ? `${method.card_brand} card ending in ${method.card_last4}` : `${method.momo_provider} number`}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove", style: "destructive", onPress: async () => {
                        await supabase.from("payment_methods").delete().eq("id", method.id);
                        fetchMethods();
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={pmStyles.safe} edges={["top"]}>
            <View style={pmStyles.header}>
                <TouchableOpacity style={pmStyles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={20} color="#111827" />
                </TouchableOpacity>
                <Text style={pmStyles.headerTitle}>Payment Methods</Text>
                <TouchableOpacity
                    style={pmStyles.addBtn}
                    onPress={() => { setEditingMethod(null); setModalVisible(true); }}
                >
                    <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={pmStyles.centered}>
                    <ActivityIndicator size="large" color="#f97316" />
                </View>
            ) : methods.length === 0 ? (
                <View style={pmStyles.centered}>
                    <Text style={{ fontSize: 48, marginBottom: 16 }}>💳</Text>
                    <Text style={pmStyles.emptyTitle}>No payment methods</Text>
                    <Text style={pmStyles.emptySub}>Add a card or mobile money account</Text>
                    <TouchableOpacity
                        style={pmStyles.emptyAddBtn}
                        onPress={() => { setEditingMethod(null); setModalVisible(true); }}
                    >
                        <Ionicons name="add" size={18} color="#fff" />
                        <Text style={pmStyles.emptyAddBtnText}>Add Payment Method</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
                    <Text style={pmStyles.sectionNote}>
                        Your payment details are stored securely. Card numbers are never saved in full.
                    </Text>
                    {methods.map(m => (
                        <PaymentCard
                            key={m.id}
                            method={m}
                            onEdit={() => { setEditingMethod(m); setModalVisible(true); }}
                            onDelete={() => handleDelete(m)}
                            onSetDefault={() => handleSetDefault(m)}
                        />
                    ))}
                </ScrollView>
            )}

            <PaymentFormModal
                visible={modalVisible}
                onClose={() => { setModalVisible(false); setEditingMethod(null); }}
                onSave={handleSave}
                saving={saving}
                initial={editingMethod}
            />
        </SafeAreaView>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const pmStyles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#f9fafb" },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb", gap: 12 },
    backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: "800", color: "#111827" },
    addBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#f97316", alignItems: "center", justifyContent: "center" },
    sectionNote: { fontSize: 12, color: "#9ca3af", textAlign: "center", marginBottom: 16, lineHeight: 18 },
    cardWrap: { marginBottom: 16 },
    visualCard: { borderRadius: 18, padding: 22, marginBottom: 8, minHeight: 160 },
    visualCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
    visualCardType: { fontSize: 16, fontWeight: "800", color: "#fff", opacity: 0.9 },
    defaultBadge: { backgroundColor: "rgba(255,255,255,0.25)", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
    defaultBadgeText: { fontSize: 10, fontWeight: "700", color: "#fff" },
    visualCardNumber: { fontSize: 20, fontWeight: "700", color: "#fff", letterSpacing: 2, marginBottom: 20 },
    visualCardBottom: { flexDirection: "row", gap: 24 },
    visualCardSubLabel: { fontSize: 9, color: "rgba(255,255,255,0.6)", fontWeight: "600", textTransform: "uppercase", marginBottom: 2 },
    visualCardSub: { fontSize: 13, fontWeight: "600", color: "#fff" },
    cardActions: { flexDirection: "row", gap: 8, paddingHorizontal: 4 },
    actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 10, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb" },
    actionBtnDanger: { borderColor: "#fee2e2", backgroundColor: "#fff5f5" },
    actionBtnText: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
    emptyTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 6 },
    emptySub: { fontSize: 13, color: "#9ca3af", marginBottom: 24 },
    emptyAddBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#f97316", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
    emptyAddBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
    modalSafe: { flex: 1, backgroundColor: "#fff" },
    modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb" },
    modalTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
    modalCancel: { fontSize: 15, color: "#6b7280" },
    modalSave: { fontSize: 15, fontWeight: "700", color: "#f97316" },
    fieldLabel: { fontSize: 12, fontWeight: "600", color: "#6b7280", marginBottom: 8, marginTop: 16, textTransform: "uppercase", letterSpacing: 0.4 },
    input: { backgroundColor: "#f9fafb", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#111827" },
    typeRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
    typeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#e5e7eb" },
    typeBtnActive: { backgroundColor: "#111827", borderColor: "#111827" },
    typeBtnText: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
    typeBtnTextActive: { color: "#fff" },
    pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
    pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#e5e7eb" },
    pillActive: { backgroundColor: "#111827", borderColor: "#111827" },
    pillText: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
    pillTextActive: { color: "#fff" },
    defaultRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f9fafb", borderRadius: 12, padding: 14, marginTop: 20, borderWidth: 1, borderColor: "#e5e7eb" },
    defaultLabel: { fontSize: 14, fontWeight: "600", color: "#111827" },
    defaultSub: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
});