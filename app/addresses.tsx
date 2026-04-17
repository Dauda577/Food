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
type Address = {
    id: string;
    label: string | null;
    recipient_name: string;
    phone: string;
    region: string;
    city: string;
    area: string | null;
    street: string | null;
    landmark: string | null;
    is_default: boolean;
    created_at: string;
};

type AddressForm = {
    label: string;
    recipient_name: string;
    phone: string;
    region: string;
    city: string;
    area: string;
    street: string;
    landmark: string;
    is_default: boolean;
};

const EMPTY_FORM: AddressForm = {
    label: "", recipient_name: "", phone: "",
    region: "", city: "", area: "",
    street: "", landmark: "", is_default: false,
};

// Ghana regions
const GHANA_REGIONS = [
    "Greater Accra", "Ashanti", "Western", "Eastern", "Central",
    "Northern", "Upper East", "Upper West", "Volta", "Brong-Ahafo",
    "Oti", "Bono East", "Ahafo", "Savannah", "North East", "Western North",
];

const LABEL_PRESETS = ["Home", "Office", "School", "Other"];

// ── Address Form Modal ────────────────────────────────────────────────────────
function AddressFormModal({
    visible, onClose, onSave, saving, initial,
}: {
    visible: boolean;
    onClose: () => void;
    onSave: (form: AddressForm) => Promise<void>;
    saving: boolean;
    initial?: Address | null;
}) {
    const [form, setForm] = useState<AddressForm>(EMPTY_FORM);
    const [showRegions, setShowRegions] = useState(false);

    useEffect(() => {
        if (visible) {
            setForm(initial ? {
                label: initial.label ?? "",
                recipient_name: initial.recipient_name,
                phone: initial.phone,
                region: initial.region,
                city: initial.city,
                area: initial.area ?? "",
                street: initial.street ?? "",
                landmark: initial.landmark ?? "",
                is_default: initial.is_default,
            } : EMPTY_FORM);
            setShowRegions(false);
        }
    }, [visible]);

    const set = (key: keyof AddressForm, val: string | boolean) =>
        setForm(prev => ({ ...prev, [key]: val }));

    const handleSave = async () => {
        if (!form.recipient_name.trim()) { Alert.alert("Required", "Recipient name is required."); return; }
        if (!form.phone.trim()) { Alert.alert("Required", "Phone number is required."); return; }
        if (!form.region) { Alert.alert("Required", "Please select a region."); return; }
        if (!form.city.trim()) { Alert.alert("Required", "City / town is required."); return; }
        await onSave(form);
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
                <SafeAreaView style={addrStyles.modalSafe}>

                    {/* Header */}
                    <View style={addrStyles.modalHeader}>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={addrStyles.modalCancel}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={addrStyles.modalTitle}>{initial ? "Edit" : "Add"} Address</Text>
                        <TouchableOpacity onPress={handleSave} disabled={saving}>
                            {saving
                                ? <ActivityIndicator size="small" color="#f97316" />
                                : <Text style={addrStyles.modalSave}>Save</Text>}
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">

                        {/* Label presets */}
                        <Text style={addrStyles.fieldLabel}>Label</Text>
                        <View style={addrStyles.presetRow}>
                            {LABEL_PRESETS.map(p => (
                                <TouchableOpacity
                                    key={p}
                                    style={[addrStyles.presetBtn, form.label === p && addrStyles.presetBtnActive]}
                                    onPress={() => set("label", form.label === p ? "" : p)}
                                >
                                    <Text style={[addrStyles.presetBtnText, form.label === p && addrStyles.presetBtnTextActive]}>
                                        {p === "Home" ? "🏠" : p === "Office" ? "🏢" : p === "School" ? "🎓" : "📍"} {p}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TextInput
                            style={addrStyles.input}
                            value={form.label}
                            onChangeText={v => set("label", v)}
                            placeholder="Or type a custom label..."
                            placeholderTextColor="#9ca3af"
                        />

                        {/* Recipient */}
                        <Text style={addrStyles.fieldLabel}>Recipient Name *</Text>
                        <TextInput
                            style={addrStyles.input}
                            value={form.recipient_name}
                            onChangeText={v => set("recipient_name", v)}
                            placeholder="Full name"
                            placeholderTextColor="#9ca3af"
                            autoCapitalize="words"
                        />

                        <Text style={addrStyles.fieldLabel}>Phone Number *</Text>
                        <TextInput
                            style={addrStyles.input}
                            value={form.phone}
                            onChangeText={v => set("phone", v)}
                            placeholder="024 000 0000"
                            placeholderTextColor="#9ca3af"
                            keyboardType="phone-pad"
                        />

                        {/* Location */}
                        <Text style={addrStyles.fieldLabel}>Region *</Text>
                        <TouchableOpacity
                            style={[addrStyles.input, addrStyles.picker]}
                            onPress={() => setShowRegions(v => !v)}
                        >
                            <Text style={{ color: form.region ? "#111827" : "#9ca3af", fontSize: 14 }}>
                                {form.region || "Select region..."}
                            </Text>
                            <Ionicons name={showRegions ? "chevron-up" : "chevron-down"} size={16} color="#9ca3af" />
                        </TouchableOpacity>

                        {showRegions && (
                            <View style={addrStyles.regionList}>
                                {GHANA_REGIONS.map(r => (
                                    <TouchableOpacity
                                        key={r}
                                        style={[addrStyles.regionRow, form.region === r && addrStyles.regionRowActive]}
                                        onPress={() => { set("region", r); setShowRegions(false); }}
                                    >
                                        <Text style={[addrStyles.regionText, form.region === r && { color: "#f97316", fontWeight: "700" }]}>
                                            {r}
                                        </Text>
                                        {form.region === r && <Ionicons name="checkmark" size={16} color="#f97316" />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <Text style={addrStyles.fieldLabel}>City / Town *</Text>
                        <TextInput
                            style={addrStyles.input}
                            value={form.city}
                            onChangeText={v => set("city", v)}
                            placeholder="e.g. Kumasi"
                            placeholderTextColor="#9ca3af"
                            autoCapitalize="words"
                        />

                        <Text style={addrStyles.fieldLabel}>Area / Suburb</Text>
                        <TextInput
                            style={addrStyles.input}
                            value={form.area}
                            onChangeText={v => set("area", v)}
                            placeholder="e.g. Adum, Bantama"
                            placeholderTextColor="#9ca3af"
                            autoCapitalize="words"
                        />

                        <Text style={addrStyles.fieldLabel}>Street / House No.</Text>
                        <TextInput
                            style={addrStyles.input}
                            value={form.street}
                            onChangeText={v => set("street", v)}
                            placeholder="e.g. No. 5 Oduro Street"
                            placeholderTextColor="#9ca3af"
                            autoCapitalize="words"
                        />

                        <Text style={addrStyles.fieldLabel}>Landmark</Text>
                        <TextInput
                            style={addrStyles.input}
                            value={form.landmark}
                            onChangeText={v => set("landmark", v)}
                            placeholder="e.g. Near Melcom, Behind Shell"
                            placeholderTextColor="#9ca3af"
                            autoCapitalize="sentences"
                        />

                        {/* Default toggle */}
                        <View style={addrStyles.defaultRow}>
                            <View>
                                <Text style={addrStyles.defaultLabel}>Set as default address</Text>
                                <Text style={addrStyles.defaultSub}>Used automatically at checkout</Text>
                            </View>
                            <Switch
                                value={form.is_default}
                                onValueChange={v => set("is_default", v)}
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

// ── Address Card ──────────────────────────────────────────────────────────────
function AddressCard({ address, onEdit, onDelete, onSetDefault }: {
    address: Address;
    onEdit: () => void;
    onDelete: () => void;
    onSetDefault: () => void;
}) {
    const labelIcon =
        address.label === "Home" ? "home" :
            address.label === "Office" ? "business" :
                address.label === "School" ? "school" : "location";

    const lines = [
        address.street,
        address.area,
        address.city,
        address.region,
    ].filter(Boolean).join(", ");

    return (
        <View style={addrStyles.card}>
            <View style={addrStyles.cardTop}>
                <View style={addrStyles.cardIconWrap}>
                    <Ionicons name={labelIcon as any} size={18} color="#f97316" />
                </View>
                <View style={{ flex: 1 }}>
                    <View style={addrStyles.cardTitleRow}>
                        <Text style={addrStyles.cardLabel}>{address.label || "Address"}</Text>
                        {address.is_default && (
                            <View style={addrStyles.defaultBadge}>
                                <Text style={addrStyles.defaultBadgeText}>Default</Text>
                            </View>
                        )}
                    </View>
                    <Text style={addrStyles.cardName}>{address.recipient_name}</Text>
                    <Text style={addrStyles.cardPhone}>{address.phone}</Text>
                    <Text style={addrStyles.cardLines}>{lines}</Text>
                    {address.landmark ? (
                        <Text style={addrStyles.cardLandmark}>📍 Near {address.landmark}</Text>
                    ) : null}
                </View>
            </View>

            <View style={addrStyles.cardActions}>
                {!address.is_default && (
                    <TouchableOpacity style={addrStyles.actionBtn} onPress={onSetDefault}>
                        <Ionicons name="checkmark-circle-outline" size={15} color="#f97316" />
                        <Text style={addrStyles.actionText}>Set Default</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={addrStyles.actionBtn} onPress={onEdit}>
                    <Ionicons name="create-outline" size={15} color="#6b7280" />
                    <Text style={addrStyles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[addrStyles.actionBtn, addrStyles.actionBtnDanger]} onPress={onDelete}>
                    <Ionicons name="trash-outline" size={15} color="#ef4444" />
                    <Text style={[addrStyles.actionText, { color: "#ef4444" }]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function AddressesScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);

    const fetchAddresses = useCallback(async () => {
        if (!user?.id) return;
        const { data, error } = await supabase
            .from("addresses")
            .select("*")
            .eq("user_id", user.id)
            .order("is_default", { ascending: false })
            .order("created_at", { ascending: false });
        if (!error) setAddresses((data ?? []) as Address[]);
        setLoading(false);
    }, [user?.id]);

    useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

    const handleSave = async (form: AddressForm) => {
        if (!user?.id) return;
        setSaving(true);
        try {
            if (form.is_default) {
                await supabase
                    .from("addresses")
                    .update({ is_default: false })
                    .eq("user_id", user.id);
            }

            if (editingAddress) {
                const { error } = await supabase
                    .from("addresses")
                    .update({
                        label: form.label.trim() || null,
                        recipient_name: form.recipient_name.trim(),
                        phone: form.phone.trim(),
                        region: form.region,
                        city: form.city.trim(),
                        area: form.area.trim() || null,
                        street: form.street.trim() || null,
                        landmark: form.landmark.trim() || null,
                        is_default: form.is_default,
                    })
                    .eq("id", editingAddress.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("addresses")
                    .insert({
                        user_id: user.id,
                        label: form.label.trim() || null,
                        recipient_name: form.recipient_name.trim(),
                        phone: form.phone.trim(),
                        region: form.region,
                        city: form.city.trim(),
                        area: form.area.trim() || null,
                        street: form.street.trim() || null,
                        landmark: form.landmark.trim() || null,
                        is_default: form.is_default,
                    });
                if (error) throw error;
            }

            setModalVisible(false);
            setEditingAddress(null);
            await fetchAddresses();
        } catch (e: any) {
            Alert.alert("Error", e.message ?? "Failed to save address.");
        } finally {
            setSaving(false);
        }
    };

    const handleSetDefault = async (address: Address) => {
        await supabase.from("addresses").update({ is_default: false }).eq("user_id", user!.id);
        await supabase.from("addresses").update({ is_default: true }).eq("id", address.id);
        fetchAddresses();
    };

    const handleDelete = (address: Address) => {
        Alert.alert(
            "Delete Address",
            `Delete "${address.label || "this address"}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive", onPress: async () => {
                        await supabase.from("addresses").delete().eq("id", address.id);
                        fetchAddresses();
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={addrStyles.safe} edges={["top"]}>
            <View style={addrStyles.header}>
                <TouchableOpacity style={addrStyles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={20} color="#111827" />
                </TouchableOpacity>
                <Text style={addrStyles.headerTitle}>My Addresses</Text>
                <TouchableOpacity
                    style={addrStyles.addBtn}
                    onPress={() => { setEditingAddress(null); setModalVisible(true); }}
                >
                    <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={addrStyles.centered}>
                    <ActivityIndicator size="large" color="#f97316" />
                </View>
            ) : addresses.length === 0 ? (
                <View style={addrStyles.centered}>
                    <Text style={{ fontSize: 48, marginBottom: 16 }}>📍</Text>
                    <Text style={addrStyles.emptyTitle}>No addresses saved</Text>
                    <Text style={addrStyles.emptySub}>Add a delivery address to get started</Text>
                    <TouchableOpacity
                        style={addrStyles.emptyAddBtn}
                        onPress={() => { setEditingAddress(null); setModalVisible(true); }}
                    >
                        <Ionicons name="add" size={18} color="#fff" />
                        <Text style={addrStyles.emptyAddBtnText}>Add Address</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
                    {addresses.map(a => (
                        <AddressCard
                            key={a.id}
                            address={a}
                            onEdit={() => { setEditingAddress(a); setModalVisible(true); }}
                            onDelete={() => handleDelete(a)}
                            onSetDefault={() => handleSetDefault(a)}
                        />
                    ))}
                </ScrollView>
            )}

            <AddressFormModal
                visible={modalVisible}
                onClose={() => { setModalVisible(false); setEditingAddress(null); }}
                onSave={handleSave}
                saving={saving}
                initial={editingAddress}
            />
        </SafeAreaView>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const addrStyles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#f9fafb" },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb", gap: 12 },
    backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: "800", color: "#111827" },
    addBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#f97316", alignItems: "center", justifyContent: "center" },
    card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#f3f4f6" },
    cardTop: { flexDirection: "row", gap: 12, marginBottom: 12 },
    cardIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#fff7ed", alignItems: "center", justifyContent: "center" },
    cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
    cardLabel: { fontSize: 15, fontWeight: "700", color: "#111827" },
    defaultBadge: { backgroundColor: "#fff7ed", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    defaultBadgeText: { fontSize: 10, fontWeight: "700", color: "#f97316" },
    cardName: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 1 },
    cardPhone: { fontSize: 12, color: "#6b7280", marginBottom: 4 },
    cardLines: { fontSize: 13, color: "#6b7280", lineHeight: 18 },
    cardLandmark: { fontSize: 12, color: "#9ca3af", marginTop: 3 },
    cardActions: { flexDirection: "row", gap: 8, borderTopWidth: 1, borderTopColor: "#f3f4f6", paddingTop: 12 },
    actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, borderRadius: 10, backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb" },
    actionBtnDanger: { borderColor: "#fee2e2", backgroundColor: "#fff5f5" },
    actionText: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
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
    input: { backgroundColor: "#f9fafb", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#111827", marginBottom: 4 },
    picker: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    presetRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
    presetBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#e5e7eb" },
    presetBtnActive: { backgroundColor: "#111827", borderColor: "#111827" },
    presetBtnText: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
    presetBtnTextActive: { color: "#fff" },
    regionList: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 8, maxHeight: 220, overflow: "hidden" },
    regionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#f3f4f6" },
    regionRowActive: { backgroundColor: "#fff7ed" },
    regionText: { fontSize: 14, color: "#374151" },
    defaultRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f9fafb", borderRadius: 12, padding: 14, marginTop: 20, borderWidth: 1, borderColor: "#e5e7eb" },
    defaultLabel: { fontSize: 14, fontWeight: "600", color: "#111827" },
    defaultSub: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
});