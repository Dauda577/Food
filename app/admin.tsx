import React, { useState, useEffect, useCallback } from "react";
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    StatusBar, Alert, ActivityIndicator, TextInput,
    Modal, KeyboardAvoidingView, Platform, Switch, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import * as ImagePicker from "expo-image-picker";

// ── Types ─────────────────────────────────────────────────────────────────────
type Order = {
    id: string; user_id: string; status: string; total: number;
    delivery_method: string | null; created_at: string;
    profiles?: { name: string | null; email?: string | null };
};
type Product = {
    id: string; name: string; brand: string | null; price: number;
    original_price: number | null; category_id: string | null;
    images: string[] | null; image: string | null;
    description: string | null;
    in_stock: boolean; rating: number; review_count: number; badge: string | null;
};
type UserProfile = {
    id: string; name: string | null; phone: string | null;
    avatar_url: string | null; is_admin: boolean; created_at: string;
};
type Category = {
    id: string;
    name: string;
    slug: string;
    parent_id: string | null;
    icon: string | null;
    image: string | null;
    created_at: string;
};
type Analytics = {
    totalRevenue: number; totalOrders: number; totalUsers: number;
    totalProducts: number; revenueToday: number; ordersToday: number;
    ordersByStatus: Record<string, number>; recentRevenue: { date: string; amount: number }[];
};

// ── Constants ─────────────────────────────────────────────────────────────────
const TABS = ["Analytics", "Orders", "Products", "Categories", "Users", "Notify"] as const;
type Tab = typeof TABS[number];

const TAB_ICONS: Record<Tab, string> = {
    Analytics: "bar-chart-outline",
    Orders: "receipt-outline",
    Products: "cube-outline",
    Categories: "grid-outline",
    Users: "people-outline",
    Notify: "megaphone-outline",
};

const ORDER_STATUSES = ["pending", "processing", "in_transit", "out_for_delivery", "delivered", "cancelled"];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    pending: { bg: "#fef9c3", text: "#854d0e" },
    processing: { bg: "#fff7ed", text: "#c2410c" },
    in_transit: { bg: "#eff6ff", text: "#2563eb" },
    out_for_delivery: { bg: "#dbeafe", text: "#1d4ed8" },
    delivered: { bg: "#dcfce7", text: "#16a34a" },
    cancelled: { bg: "#fee2e2", text: "#dc2626" },
};

const STATUS_LABELS: Record<string, string> = {
    pending: "Pending", processing: "Processing", in_transit: "In Transit",
    out_for_delivery: "Out for Delivery", delivered: "Delivered", cancelled: "Cancelled",
};

// ── Image upload helper ───────────────────────────────────────────────────────
const uploadImageToSupabase = async (uri: string): Promise<string | null> => {
    try {
        const filename = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

        const response = await fetch(uri);
        const blob = await response.blob();

        const { data, error } = await supabase.storage
            .from("product-images")
            .upload(filename, blob, { contentType: "image/jpeg", upsert: false });

        if (error) {
            Alert.alert("Upload Error", error.message);
            return null;
        }

        const { data: urlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(data.path);

        return urlData.publicUrl;
    } catch (e: any) {
        Alert.alert("Upload Error", e.message);
        return null;
    }
};

// ── Small shared components ───────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) => (
    <View style={[adminStyles.statCard, { borderLeftColor: color }]}>
        <View style={[adminStyles.statIcon, { backgroundColor: color + "18" }]}>
            <Ionicons name={icon as any} size={18} color={color} />
        </View>
        <Text style={adminStyles.statValue}>{value}</Text>
        <Text style={adminStyles.statLabel}>{label}</Text>
    </View>
);

const SectionHeader = ({ title, count }: { title: string; count?: number }) => (
    <View style={adminStyles.sectionHeader}>
        <Text style={adminStyles.sectionTitle}>{title}</Text>
        {count !== undefined && (
            <View style={adminStyles.countBadge}><Text style={adminStyles.countBadgeText}>{count}</Text></View>
        )}
    </View>
);

// ── Analytics Tab ─────────────────────────────────────────────────────────────
function AnalyticsTab({ analytics, loading }: { analytics: Analytics | null; loading: boolean }) {
    if (loading) return <View style={adminStyles.centered}><ActivityIndicator size="large" color="#f97316" /></View>;
    if (!analytics) return null;

    const maxRevenue = Math.max(...analytics.recentRevenue.map(r => r.amount), 1);

    return (
        <ScrollView contentContainerStyle={adminStyles.tabContent}>
            <Text style={adminStyles.tabSectionTitle}>Overview</Text>
            <View style={adminStyles.statGrid}>
                <StatCard label="Total Revenue" value={`GH₵${analytics.totalRevenue.toLocaleString()}`} icon="cash-outline" color="#f97316" />
                <StatCard label="Total Orders" value={String(analytics.totalOrders)} icon="receipt-outline" color="#2563eb" />
                <StatCard label="Total Users" value={String(analytics.totalUsers)} icon="people-outline" color="#7c3aed" />
                <StatCard label="Products" value={String(analytics.totalProducts)} icon="cube-outline" color="#16a34a" />
            </View>

            <Text style={adminStyles.tabSectionTitle}>Today</Text>
            <View style={adminStyles.statGrid}>
                <StatCard label="Revenue Today" value={`GH₵${analytics.revenueToday.toLocaleString()}`} icon="trending-up-outline" color="#f97316" />
                <StatCard label="Orders Today" value={String(analytics.ordersToday)} icon="bag-outline" color="#2563eb" />
            </View>

            <Text style={adminStyles.tabSectionTitle}>Orders by Status</Text>
            <View style={adminStyles.card}>
                {ORDER_STATUSES.map(s => {
                    const count = analytics.ordersByStatus[s] ?? 0;
                    const pct = analytics.totalOrders > 0 ? count / analytics.totalOrders : 0;
                    const sc = STATUS_COLORS[s];
                    return (
                        <View key={s} style={adminStyles.statusRow}>
                            <View style={[adminStyles.statusDot, { backgroundColor: sc.text }]} />
                            <Text style={adminStyles.statusRowLabel}>{STATUS_LABELS[s]}</Text>
                            <View style={adminStyles.statusBarWrap}>
                                <View style={[adminStyles.statusBar, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: sc.text + "33" }]} />
                            </View>
                            <Text style={[adminStyles.statusCount, { color: sc.text }]}>{count}</Text>
                        </View>
                    );
                })}
            </View>

            {analytics.recentRevenue.length > 0 && (
                <>
                    <Text style={adminStyles.tabSectionTitle}>Revenue (Last 7 Days)</Text>
                    <View style={adminStyles.card}>
                        <View style={adminStyles.barChart}>
                            {analytics.recentRevenue.map((r, i) => {
                                const h = maxRevenue > 0 ? Math.max((r.amount / maxRevenue) * 80, 4) : 4;
                                return (
                                    <View key={i} style={adminStyles.barCol}>
                                        <Text style={adminStyles.barValue}>
                                            {r.amount > 0 ? `₵${(r.amount / 1000).toFixed(1)}k` : ""}
                                        </Text>
                                        <View style={[adminStyles.bar, { height: h }]} />
                                        <Text style={adminStyles.barLabel}>
                                            {new Date(r.date).toLocaleDateString("en-GH", { weekday: "short" })}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </>
            )}
        </ScrollView>
    );
}

// ── Orders Tab ────────────────────────────────────────────────────────────────
function OrdersTab({ orders, loading, onRefresh, refreshing }: {
    orders: Order[]; loading: boolean; onRefresh: () => void; refreshing: boolean;
}) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatus] = useState("all");
    const [updating, setUpdating] = useState<string | null>(null);

    const filtered = orders.filter(o => {
        const matchSearch = search === "" ||
            o.id.toLowerCase().includes(search.toLowerCase()) ||
            (o.profiles?.name ?? "").toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || o.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const updateStatus = async (orderId: string, newStatus: string) => {
        setUpdating(orderId);
        const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
        if (error) Alert.alert("Error", error.message);
        else await onRefresh();
        setUpdating(null);
    };

    const confirmUpdate = (order: Order, newStatus: string) => {
        Alert.alert(
            "Update Order Status",
            `Change #${order.id.slice(0, 8).toUpperCase()} to "${STATUS_LABELS[newStatus]}"?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Update", onPress: () => updateStatus(order.id, newStatus) },
            ]
        );
    };

    if (loading) return <View style={adminStyles.centered}><ActivityIndicator size="large" color="#f97316" /></View>;

    return (
        <ScrollView
            contentContainerStyle={adminStyles.tabContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}
        >
            <View style={adminStyles.searchRow}>
                <Ionicons name="search-outline" size={16} color="#9ca3af" style={{ marginRight: 8 }} />
                <TextInput
                    style={adminStyles.searchInput}
                    placeholder="Search by order ID or customer..."
                    placeholderTextColor="#9ca3af"
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {["all", ...ORDER_STATUSES].map(s => (
                    <TouchableOpacity
                        key={s}
                        style={[adminStyles.pill, statusFilter === s && adminStyles.pillActive]}
                        onPress={() => setStatus(s)}
                    >
                        <Text style={[adminStyles.pillText, statusFilter === s && adminStyles.pillTextActive]}>
                            {s === "all" ? "All" : STATUS_LABELS[s]}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <SectionHeader title="Orders" count={filtered.length} />

            {filtered.length === 0 ? (
                <Text style={adminStyles.emptyText}>No orders found.</Text>
            ) : (
                filtered.map(order => {
                    const sc = STATUS_COLORS[order.status] ?? STATUS_COLORS.pending;
                    return (
                        <View key={order.id} style={adminStyles.card}>
                            <View style={adminStyles.rowBetween}>
                                <Text style={adminStyles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                                <View style={[adminStyles.statusBadge, { backgroundColor: sc.bg }]}>
                                    <Text style={[adminStyles.statusBadgeText, { color: sc.text }]}>
                                        {STATUS_LABELS[order.status] ?? order.status}
                                    </Text>
                                </View>
                            </View>
                            <Text style={adminStyles.orderMeta}>
                                {order.profiles?.name ?? "Unknown"} · GH₵{order.total.toLocaleString()}
                            </Text>
                            <Text style={adminStyles.orderDate}>
                                {new Date(order.created_at).toLocaleDateString("en-GH", {
                                    day: "numeric", month: "short", year: "numeric",
                                })}
                            </Text>

                            <View style={adminStyles.statusActions}>
                                {ORDER_STATUSES.filter(s => s !== order.status).map(s => (
                                    <TouchableOpacity
                                        key={s}
                                        style={adminStyles.statusActionBtn}
                                        onPress={() => confirmUpdate(order, s)}
                                        disabled={updating === order.id}
                                    >
                                        {updating === order.id
                                            ? <ActivityIndicator size="small" color="#f97316" />
                                            : <Text style={adminStyles.statusActionText}>{STATUS_LABELS[s]}</Text>}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    );
                })
            )}
        </ScrollView>
    );
}

// ── Categories Tab ────────────────────────────────────────────────────────────
type CategoryForm = { name: string; slug: string; icon: string; image: string; parent_id: string };

function CategoryFormModal({ visible, onClose, onSave, saving, title, categories, initial }: {
    visible: boolean; onClose: () => void;
    onSave: (form: CategoryForm) => Promise<void>;
    saving: boolean; title: string;
    categories: Category[]; initial: CategoryForm;
}) {
    const [form, setForm] = useState<CategoryForm>(initial);
    useEffect(() => { if (visible) setForm(initial); }, [visible]);

    const set = (key: keyof CategoryForm, val: string) => setForm(prev => ({ ...prev, [key]: val }));

    const slugify = (text: string) =>
        text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
                <SafeAreaView style={adminStyles.modalSafe}>
                    <View style={adminStyles.modalHeader}>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={adminStyles.modalCancel}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={adminStyles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={() => onSave(form)} disabled={saving}>
                            {saving
                                ? <ActivityIndicator size="small" color="#f97316" />
                                : <Text style={adminStyles.modalSave}>Save</Text>}
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">

                        <Text style={adminStyles.fieldLabel}>Name *</Text>
                        <TextInput
                            style={adminStyles.fieldInput}
                            value={form.name}
                            onChangeText={v => { set("name", v); set("slug", slugify(v)); }}
                            placeholder="e.g. Electronics"
                            placeholderTextColor="#9ca3af"
                        />

                        <Text style={adminStyles.fieldLabel}>Slug *</Text>
                        <TextInput
                            style={adminStyles.fieldInput}
                            value={form.slug}
                            onChangeText={v => set("slug", v)}
                            placeholder="e.g. electronics"
                            placeholderTextColor="#9ca3af"
                            autoCapitalize="none"
                        />

                        <Text style={adminStyles.fieldLabel}>Icon (emoji)</Text>
                        <TextInput
                            style={adminStyles.fieldInput}
                            value={form.icon}
                            onChangeText={v => set("icon", v)}
                            placeholder="e.g. 📱"
                            placeholderTextColor="#9ca3af"
                        />

                        <Text style={adminStyles.fieldLabel}>Image URL</Text>
                        <TextInput
                            style={adminStyles.fieldInput}
                            value={form.image}
                            onChangeText={v => set("image", v)}
                            placeholder="https://..."
                            placeholderTextColor="#9ca3af"
                            autoCapitalize="none"
                            keyboardType="url"
                        />

                        <Text style={adminStyles.fieldLabel}>Parent Category (optional)</Text>
                        <ScrollView
                            style={[adminStyles.userPickerList, { maxHeight: 180 }]}
                            nestedScrollEnabled
                        >
                            <TouchableOpacity
                                style={[adminStyles.userPickerRow, !form.parent_id && adminStyles.userPickerRowActive]}
                                onPress={() => set("parent_id", "")}
                            >
                                <Text style={[adminStyles.userPickerName, !form.parent_id && { color: "#f97316" }]}>
                                    None (top-level)
                                </Text>
                                {!form.parent_id && <Ionicons name="checkmark" size={16} color="#f97316" />}
                            </TouchableOpacity>
                            {categories.filter(c => !c.parent_id).map(cat => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[adminStyles.userPickerRow, form.parent_id === cat.id && adminStyles.userPickerRowActive]}
                                    onPress={() => set("parent_id", cat.id)}
                                >
                                    <View style={adminStyles.rowGap}>
                                        {cat.icon && <Text>{cat.icon}</Text>}
                                        <Text style={[adminStyles.userPickerName, form.parent_id === cat.id && { color: "#f97316" }]}>
                                            {cat.name}
                                        </Text>
                                    </View>
                                    {form.parent_id === cat.id && <Ionicons name="checkmark" size={16} color="#f97316" />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                    </ScrollView>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

function CategoriesTab({ categories, loading, onRefresh, refreshing }: {
    categories: Category[]; loading: boolean; onRefresh: () => void; refreshing: boolean;
}) {
    const [addVisible, setAddVisible] = useState(false);
    const [editCat, setEditCat] = useState<Category | null>(null);
    const [saving, setSaving] = useState(false);

    const slugify = (text: string) =>
        text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const handleAdd = async (form: { name: string; slug: string; icon: string; image: string; parent_id: string }) => {
        setSaving(true);
        const { error } = await supabase.from("categories").insert({
            name: form.name.trim(),
            slug: form.slug.trim() || slugify(form.name),
            icon: form.icon.trim() || null,
            image: form.image.trim() || null,
            parent_id: form.parent_id || null,
        });
        setSaving(false);
        if (error) { Alert.alert("Error", error.message); return; }
        setAddVisible(false);
        onRefresh();
    };

    const handleEdit = async (form: { name: string; slug: string; icon: string; image: string; parent_id: string }) => {
        if (!editCat) return;
        setSaving(true);
        const { error } = await supabase.from("categories").update({
            name: form.name.trim(),
            slug: form.slug.trim() || slugify(form.name),
            icon: form.icon.trim() || null,
            image: form.image.trim() || null,
            parent_id: form.parent_id || null,
        }).eq("id", editCat.id);
        setSaving(false);
        if (error) { Alert.alert("Error", error.message); return; }
        setEditCat(null);
        onRefresh();
    };

    const confirmDelete = (cat: Category) => {
        Alert.alert(
            "Delete Category",
            `Delete "${cat.name}"? Products linked to it will lose their category.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive", onPress: async () => {
                        const { error } = await supabase.from("categories").delete().eq("id", cat.id);
                        if (error) Alert.alert("Error", error.message);
                        else onRefresh();
                    },
                },
            ]
        );
    };

    const topLevel = categories.filter(c => !c.parent_id);
    const subCategories = categories.filter(c => c.parent_id);

    if (loading) return <View style={adminStyles.centered}><ActivityIndicator size="large" color="#f97316" /></View>;

    return (
        <>
            <ScrollView
                contentContainerStyle={adminStyles.tabContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}
            >
                <TouchableOpacity style={[adminStyles.addBtn, { alignSelf: "flex-end", marginBottom: 12, width: "auto", paddingHorizontal: 16, flexDirection: "row", gap: 6 }]} onPress={() => setAddVisible(true)}>
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Add Category</Text>
                </TouchableOpacity>

                <SectionHeader title="Top-level Categories" count={topLevel.length} />
                {topLevel.map(cat => {
                    const children = subCategories.filter(s => s.parent_id === cat.id);
                    return (
                        <View key={cat.id} style={adminStyles.card}>
                            <View style={adminStyles.rowBetween}>
                                <View style={adminStyles.rowGap}>
                                    {cat.icon && <Text style={{ fontSize: 20 }}>{cat.icon}</Text>}
                                    <View>
                                        <Text style={adminStyles.productName}>{cat.name}</Text>
                                        <Text style={adminStyles.productMeta}>/{cat.slug}</Text>
                                    </View>
                                </View>
                                <View style={adminStyles.rowGap}>
                                    <TouchableOpacity style={adminStyles.editBtn} onPress={() => setEditCat(cat)}>
                                        <Ionicons name="create-outline" size={15} color="#f97316" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={adminStyles.deleteBtn} onPress={() => confirmDelete(cat)}>
                                        <Ionicons name="trash-outline" size={15} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {children.length > 0 && (
                                <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#f3f4f6" }}>
                                    <Text style={{ fontSize: 11, color: "#9ca3af", fontWeight: "600", marginBottom: 6 }}>
                                        SUBCATEGORIES ({children.length})
                                    </Text>
                                    {children.map(sub => (
                                        <View key={sub.id} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 }}>
                                            <View style={adminStyles.rowGap}>
                                                <View style={{ width: 12, height: 1, backgroundColor: "#e5e7eb" }} />
                                                {sub.icon && <Text style={{ fontSize: 14 }}>{sub.icon}</Text>}
                                                <Text style={{ fontSize: 13, color: "#374151" }}>{sub.name}</Text>
                                                <Text style={adminStyles.productMeta}>/{sub.slug}</Text>
                                            </View>
                                            <View style={adminStyles.rowGap}>
                                                <TouchableOpacity style={adminStyles.editBtn} onPress={() => setEditCat(sub)}>
                                                    <Ionicons name="create-outline" size={13} color="#f97316" />
                                                </TouchableOpacity>
                                                <TouchableOpacity style={adminStyles.deleteBtn} onPress={() => confirmDelete(sub)}>
                                                    <Ionicons name="trash-outline" size={13} color="#ef4444" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>

            <CategoryFormModal
                visible={addVisible}
                onClose={() => setAddVisible(false)}
                onSave={handleAdd}
                saving={saving}
                title="Add Category"
                categories={categories}
                initial={{ name: "", slug: "", icon: "", image: "", parent_id: "" }}
            />

            <CategoryFormModal
                visible={!!editCat}
                onClose={() => setEditCat(null)}
                onSave={handleEdit}
                saving={saving}
                title="Edit Category"
                categories={categories.filter(c => c.id !== editCat?.id)}
                initial={editCat ? {
                    name: editCat.name,
                    slug: editCat.slug,
                    icon: editCat.icon ?? "",
                    image: editCat.image ?? "",
                    parent_id: editCat.parent_id ?? "",
                } : { name: "", slug: "", icon: "", image: "", parent_id: "" }}
            />
        </>
    );
}

// ── Product Form (shared by Add + Edit) ───────────────────────────────────────
type ProductForm = {
    name: string; brand: string; price: string; original_price: string;
    category_id: string; description: string;
    images: string[];
    badge: string; in_stock: boolean;
};

const EMPTY_FORM: ProductForm = {
    name: "", brand: "", price: "", original_price: "",
    category_id: "", description: "", images: [], badge: "", in_stock: true,
};

const BADGE_OPTIONS = ["", "New", "Sale", "Hot", "Limited", "Bestseller"];

function ProductFormModal({
    visible, onClose, onSave, saving, title, initial, categories,
}: {
    visible: boolean; onClose: () => void;
    onSave: (form: ProductForm) => Promise<void>;
    saving: boolean; title: string; initial: ProductForm;
    categories: Category[];
}) {
    const [form, setForm] = useState<ProductForm>(initial);
    const [uploading, setUploading] = useState(false);

    useEffect(() => { if (visible) setForm(initial); }, [visible]);

    const set = (key: keyof ProductForm, val: string | boolean | string[]) =>
        setForm(prev => ({ ...prev, [key]: val }));

    const handleSave = async () => {
        if (!form.name.trim()) { Alert.alert("Required", "Product name is required."); return; }
        const price = parseFloat(form.price);
        if (isNaN(price) || price <= 0) { Alert.alert("Required", "Enter a valid price."); return; }
        await onSave(form);
    };

    const pickImages = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission needed", "Allow access to your photo library to pick images.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
            selectionLimit: 5,
        });

        if (result.canceled) return;

        setUploading(true);
        Alert.alert("Uploading...", "Please wait while your images upload.");

        const uploadedUrls: string[] = [];
        for (const asset of result.assets) {
            const url = await uploadImageToSupabase(asset.uri);
            if (url) uploadedUrls.push(url);
        }

        if (uploadedUrls.length > 0) {
            set("images", [...form.images, ...uploadedUrls]);
            Alert.alert("Done!", `${uploadedUrls.length} image(s) added.`);
        }
        setUploading(false);
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
                <SafeAreaView style={adminStyles.modalSafe}>
                    <View style={adminStyles.modalHeader}>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={adminStyles.modalCancel}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={adminStyles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={handleSave} disabled={saving || uploading}>
                            {saving || uploading
                                ? <ActivityIndicator size="small" color="#f97316" />
                                : <Text style={adminStyles.modalSave}>Save</Text>}
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">

                        <Text style={adminStyles.formSection}>Basic Info</Text>

                        <Text style={adminStyles.fieldLabel}>Product Name *</Text>
                        <TextInput style={adminStyles.fieldInput} value={form.name} onChangeText={v => set("name", v)}
                            placeholder="e.g. Nike Air Max 270" placeholderTextColor="#9ca3af" />

                        <Text style={adminStyles.fieldLabel}>Brand</Text>
                        <TextInput style={adminStyles.fieldInput} value={form.brand} onChangeText={v => set("brand", v)}
                            placeholder="e.g. Nike" placeholderTextColor="#9ca3af" />

                        <Text style={adminStyles.fieldLabel}>Category</Text>
                        <ScrollView
                            style={[adminStyles.userPickerList, { maxHeight: 160 }]}
                            nestedScrollEnabled
                        >
                            <TouchableOpacity
                                style={[adminStyles.userPickerRow, !form.category_id && adminStyles.userPickerRowActive]}
                                onPress={() => set("category_id", "")}
                            >
                                <Text style={[adminStyles.userPickerName, !form.category_id && { color: "#f97316" }]}>
                                    None
                                </Text>
                                {!form.category_id && <Ionicons name="checkmark" size={16} color="#f97316" />}
                            </TouchableOpacity>
                            {categories.map(cat => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[adminStyles.userPickerRow, form.category_id === cat.id && adminStyles.userPickerRowActive]}
                                    onPress={() => set("category_id", cat.id)}
                                >
                                    <View style={adminStyles.rowGap}>
                                        {cat.icon && <Text>{cat.icon}</Text>}
                                        <Text style={[adminStyles.userPickerName, form.category_id === cat.id && { color: "#f97316" }]}>
                                            {cat.name}
                                            {cat.parent_id && <Text style={{ color: "#9ca3af" }}> (sub)</Text>}
                                        </Text>
                                    </View>
                                    {form.category_id === cat.id && <Ionicons name="checkmark" size={16} color="#f97316" />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={adminStyles.fieldLabel}>Description</Text>
                        <TextInput style={[adminStyles.fieldInput, adminStyles.fieldInputMulti]}
                            value={form.description} onChangeText={v => set("description", v)}
                            placeholder="Product description..." placeholderTextColor="#9ca3af"
                            multiline numberOfLines={4} textAlignVertical="top" />

                        <Text style={adminStyles.formSection}>Pricing</Text>

                        <Text style={adminStyles.fieldLabel}>Price (GH₵) *</Text>
                        <TextInput style={adminStyles.fieldInput} value={form.price} onChangeText={v => set("price", v)}
                            placeholder="0.00" placeholderTextColor="#9ca3af" keyboardType="decimal-pad" />

                        <Text style={adminStyles.fieldLabel}>Original Price (GH₵) — for showing a discount</Text>
                        <TextInput style={adminStyles.fieldInput} value={form.original_price} onChangeText={v => set("original_price", v)}
                            placeholder="Optional" placeholderTextColor="#9ca3af" keyboardType="decimal-pad" />

                        <Text style={adminStyles.formSection}>Images</Text>

                        {form.images.map((img, i) => (
                            <View key={i} style={[adminStyles.rowGap, { marginBottom: 8 }]}>
                                <TextInput
                                    style={[adminStyles.fieldInput, { flex: 1, marginBottom: 0 }]}
                                    value={img}
                                    onChangeText={v => {
                                        const next = [...form.images];
                                        next[i] = v;
                                        set("images", next);
                                    }}
                                    placeholder={`Image URL ${i + 1}`}
                                    placeholderTextColor="#9ca3af"
                                    autoCapitalize="none"
                                    keyboardType="url"
                                />
                                <TouchableOpacity
                                    style={adminStyles.deleteBtn}
                                    onPress={() => set("images", form.images.filter((_, j) => j !== i))}
                                >
                                    <Ionicons name="trash-outline" size={14} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        ))}

                        <View style={[adminStyles.rowGap, { marginBottom: 16 }]}>
                            <TouchableOpacity
                                style={[adminStyles.pill, { backgroundColor: "#eff6ff", flexDirection: "row", gap: 6 }]}
                                onPress={pickImages}
                                disabled={uploading}
                            >
                                <Ionicons name="images-outline" size={14} color="#2563eb" />
                                <Text style={[adminStyles.pillText, { color: "#2563eb" }]}>
                                    {uploading ? "Uploading..." : "Pick from Gallery"}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={adminStyles.pill}
                                onPress={() => set("images", [...form.images, ""])}
                            >
                                <Ionicons name="link-outline" size={14} color="#6b7280" />
                                <Text style={adminStyles.pillText}>Add URL</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={adminStyles.formSection}>Badge</Text>
                        <View style={adminStyles.badgeRow}>
                            {BADGE_OPTIONS.map(b => (
                                <TouchableOpacity
                                    key={b || "none"}
                                    style={[adminStyles.pill, form.badge === b && adminStyles.pillActive]}
                                    onPress={() => set("badge", b)}
                                >
                                    <Text style={[adminStyles.pillText, form.badge === b && adminStyles.pillTextActive]}>
                                        {b || "None"}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={adminStyles.formSection}>Availability</Text>
                        <View style={[adminStyles.card, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                            <View>
                                <Text style={{ fontSize: 14, fontWeight: "600", color: "#111827" }}>In Stock</Text>
                                <Text style={{ fontSize: 12, color: form.in_stock ? "#16a34a" : "#dc2626", marginTop: 2 }}>
                                    {form.in_stock ? "Available for purchase" : "Hidden from customers"}
                                </Text>
                            </View>
                            <Switch
                                value={form.in_stock}
                                onValueChange={v => set("in_stock", v)}
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

// ── Products Tab ──────────────────────────────────────────────────────────────
function ProductsTab({ products, categories, loading, onRefresh, refreshing }: {
    products: Product[]; categories: Category[]; loading: boolean; onRefresh: () => void; refreshing: boolean;
}) {
    const [search, setSearch] = useState("");
    const [editProduct, setEdit] = useState<Product | null>(null);
    const [addVisible, setAddVisible] = useState(false);
    const [saving, setSaving] = useState(false);

    const filtered = products.filter(p =>
        search === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.brand ?? "").toLowerCase().includes(search.toLowerCase())
    );

    const handleAdd = async (form: ProductForm) => {
        setSaving(true);
        const { error } = await supabase.from("products").insert({
            name: form.name.trim(),
            brand: form.brand.trim() || null,
            price: parseFloat(form.price),
            original_price: form.original_price ? parseFloat(form.original_price) : null,
            category_id: form.category_id || null,
            description: form.description.trim() || null,
            images: form.images.filter(Boolean),
            image: form.images[0] ?? null,
            badge: form.badge || null,
            in_stock: form.in_stock,
            rating: 0,
            review_count: 0,
        });
        setSaving(false);
        if (error) { Alert.alert("Error", error.message); return; }
        setAddVisible(false);
        await onRefresh();
        Alert.alert("Added!", `"${form.name}" has been added to your store.`);
    };

    const handleEdit = async (form: ProductForm) => {
        if (!editProduct) return;
        setSaving(true);
        const { error } = await supabase.from("products").update({
            name: form.name.trim(),
            brand: form.brand.trim() || null,
            price: parseFloat(form.price),
            original_price: form.original_price ? parseFloat(form.original_price) : null,
            category_id: form.category_id || null,
            description: form.description.trim() || null,
            images: form.images.filter(Boolean),
            image: form.images[0] ?? null,
            badge: form.badge || null,
            in_stock: form.in_stock,
        }).eq("id", editProduct.id);
        setSaving(false);
        if (error) { Alert.alert("Error", error.message); return; }
        setEdit(null);
        await onRefresh();
    };

    const confirmDelete = (p: Product) => {
        Alert.alert(
            "Delete Product",
            `Permanently delete "${p.name}"? This cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive", onPress: async () => {
                        const { error } = await supabase.from("products").delete().eq("id", p.id);
                        if (error) Alert.alert("Error", error.message);
                        else onRefresh();
                    },
                },
            ]
        );
    };

    const toggleStock = async (p: Product) => {
        await supabase.from("products").update({ in_stock: !p.in_stock }).eq("id", p.id);
        onRefresh();
    };

    const getCategoryName = (categoryId: string | null) => {
        if (!categoryId) return "—";
        return categories.find(c => c.id === categoryId)?.name ?? "—";
    };

    if (loading) return <View style={adminStyles.centered}><ActivityIndicator size="large" color="#f97316" /></View>;

    return (
        <>
            <ScrollView
                contentContainerStyle={adminStyles.tabContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}
            >
                <View style={adminStyles.searchAddRow}>
                    <View style={[adminStyles.searchRow, { flex: 1, marginBottom: 0 }]}>
                        <Ionicons name="search-outline" size={16} color="#9ca3af" style={{ marginRight: 8 }} />
                        <TextInput
                            style={adminStyles.searchInput}
                            placeholder="Search products..."
                            placeholderTextColor="#9ca3af"
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                    <TouchableOpacity style={adminStyles.addBtn} onPress={() => setAddVisible(true)}>
                        <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                <SectionHeader title="Products" count={filtered.length} />

                {filtered.length === 0 ? (
                    <View style={adminStyles.emptyState}>
                        <Text style={{ fontSize: 36, marginBottom: 12 }}>📦</Text>
                        <Text style={adminStyles.emptyStateTitle}>No products yet</Text>
                        <TouchableOpacity style={adminStyles.emptyAddBtn} onPress={() => setAddVisible(true)}>
                            <Ionicons name="add" size={16} color="#fff" />
                            <Text style={adminStyles.emptyAddBtnText}>Add First Product</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    filtered.map(p => (
                        <View key={p.id} style={adminStyles.card}>
                            <View style={adminStyles.rowBetween}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={adminStyles.productName} numberOfLines={1}>{p.name}</Text>
                                    <Text style={adminStyles.productMeta}>{p.brand ?? "—"} · {getCategoryName(p.category_id)}</Text>
                                </View>
                                <View style={adminStyles.rowGap}>
                                    <TouchableOpacity style={adminStyles.editBtn} onPress={() => setEdit(p)}>
                                        <Ionicons name="create-outline" size={15} color="#f97316" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={adminStyles.deleteBtn} onPress={() => confirmDelete(p)}>
                                        <Ionicons name="trash-outline" size={15} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={adminStyles.rowBetween}>
                                <View style={adminStyles.rowGap}>
                                    <Text style={adminStyles.productPrice}>GH₵{p.price.toLocaleString()}</Text>
                                    {p.original_price && (
                                        <Text style={adminStyles.originalPrice}>GH₵{p.original_price.toLocaleString()}</Text>
                                    )}
                                </View>
                                <View style={adminStyles.rowGap}>
                                    <Text style={adminStyles.stockLabel}>{p.in_stock ? "In stock" : "Out of stock"}</Text>
                                    <Switch
                                        value={p.in_stock}
                                        onValueChange={() => toggleStock(p)}
                                        trackColor={{ false: "#e5e7eb", true: "#f97316" }}
                                        thumbColor="#fff"
                                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                                    />
                                </View>
                            </View>

                            <View style={adminStyles.rowGap}>
                                <Text style={adminStyles.ratingText}>⭐ {p.rating.toFixed(1)} ({p.review_count})</Text>
                                {p.badge && <View style={adminStyles.badgePill}><Text style={adminStyles.badgePillText}>{p.badge}</Text></View>}
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            <ProductFormModal
                visible={addVisible}
                onClose={() => setAddVisible(false)}
                onSave={handleAdd}
                saving={saving}
                title="Add Product"
                initial={EMPTY_FORM}
                categories={categories}
            />

            <ProductFormModal
                visible={!!editProduct}
                onClose={() => setEdit(null)}
                onSave={handleEdit}
                saving={saving}
                title="Edit Product"
                initial={editProduct ? {
                    name: editProduct.name,
                    brand: editProduct.brand ?? "",
                    price: String(editProduct.price),
                    original_price: editProduct.original_price ? String(editProduct.original_price) : "",
                    category_id: editProduct.category_id ?? "",
                    description: editProduct.description ?? "",
                    images: editProduct.images ?? [],
                    badge: editProduct.badge ?? "",
                    in_stock: editProduct.in_stock,
                } : EMPTY_FORM}
                categories={categories}
            />
        </>
    );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab({ users, loading, onRefresh, refreshing }: {
    users: UserProfile[]; loading: boolean; onRefresh: () => void; refreshing: boolean;
}) {
    const [search, setSearch] = useState("");
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const filtered = users.filter(u =>
        search === "" ||
        (u.name ?? "").toLowerCase().includes(search.toLowerCase())
    );

    const toggleAdmin = async (u: UserProfile) => {
        Alert.alert(
            u.is_admin ? "Remove Admin" : "Make Admin",
            `${u.is_admin ? "Remove admin access from" : "Grant admin access to"} ${u.name ?? "this user"}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Confirm", onPress: async () => {
                        setTogglingId(u.id);
                        await supabase.from("profiles").update({ is_admin: !u.is_admin }).eq("id", u.id);
                        await onRefresh();
                        setTogglingId(null);
                    },
                },
            ]
        );
    };

    if (loading) return <View style={adminStyles.centered}><ActivityIndicator size="large" color="#f97316" /></View>;

    return (
        <ScrollView
            contentContainerStyle={adminStyles.tabContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}
        >
            <View style={adminStyles.searchRow}>
                <Ionicons name="search-outline" size={16} color="#9ca3af" style={{ marginRight: 8 }} />
                <TextInput
                    style={adminStyles.searchInput}
                    placeholder="Search users..."
                    placeholderTextColor="#9ca3af"
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            <SectionHeader title="Users" count={filtered.length} />

            {filtered.map(u => {
                const initials = (u.name ?? "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                return (
                    <View key={u.id} style={adminStyles.card}>
                        <View style={adminStyles.rowBetween}>
                            <View style={adminStyles.rowGap}>
                                <View style={adminStyles.userAvatar}>
                                    <Text style={adminStyles.userAvatarText}>{initials}</Text>
                                </View>
                                <View>
                                    <View style={adminStyles.rowGap}>
                                        <Text style={adminStyles.userName}>{u.name ?? "No name"}</Text>
                                        {u.is_admin && (
                                            <View style={adminStyles.adminBadge}><Text style={adminStyles.adminBadgeText}>Admin</Text></View>
                                        )}
                                    </View>
                                    <Text style={adminStyles.userMeta}>
                                        Joined {new Date(u.created_at).toLocaleDateString("en-GH", { month: "short", year: "numeric" })}
                                    </Text>
                                    {u.phone && <Text style={adminStyles.userMeta}>{u.phone}</Text>}
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[adminStyles.adminToggleBtn, u.is_admin && adminStyles.adminToggleBtnActive]}
                                onPress={() => toggleAdmin(u)}
                                disabled={togglingId === u.id}
                            >
                                {togglingId === u.id
                                    ? <ActivityIndicator size="small" color={u.is_admin ? "#fff" : "#f97316"} />
                                    : <Ionicons name={u.is_admin ? "shield" : "shield-outline"} size={15} color={u.is_admin ? "#fff" : "#f97316"} />
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            })}
        </ScrollView>
    );
}

// ── Notify Tab ────────────────────────────────────────────────────────────────
type NotifType = "order" | "promo" | "delivery" | "review" | "account" | "price";
const NOTIF_TYPES: { value: NotifType; label: string; icon: string }[] = [
    { value: "promo", label: "Promo", icon: "🏷️" },
    { value: "order", label: "Order", icon: "🛍️" },
    { value: "delivery", label: "Delivery", icon: "🚚" },
    { value: "account", label: "Account", icon: "👤" },
    { value: "price", label: "Price", icon: "📉" },
];

function NotifyTab({ users }: { users: UserProfile[] }) {
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [type, setType] = useState<NotifType>("promo");
    const [route, setRoute] = useState("");
    const [target, setTarget] = useState<"all" | "single">("all");
    const [targetUser, setTargetUser] = useState<string>("");
    const [sending, setSending] = useState(false);

    const send = async () => {
        if (!title.trim() || !body.trim()) {
            Alert.alert("Validation", "Title and body are required.");
            return;
        }

        setSending(true);
        try {
            const recipientIds = target === "all"
                ? users.map(u => u.id)
                : [targetUser];

            if (recipientIds.length === 0) { Alert.alert("No recipients", "Select a user."); return; }

            const rows = recipientIds.map(user_id => ({
                user_id,
                type,
                title: title.trim(),
                body: body.trim(),
                action_route: route.trim() || null,
                read: false,
            }));

            const { error } = await supabase.from("notifications").insert(rows);
            if (error) throw error;

            Alert.alert("Sent!", `Notification sent to ${recipientIds.length} user${recipientIds.length !== 1 ? "s" : ""}.`);
            setTitle(""); setBody(""); setRoute(""); setTarget("all"); setTargetUser("");
        } catch (e: any) {
            Alert.alert("Error", e.message ?? "Failed to send.");
        } finally {
            setSending(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={adminStyles.tabContent} keyboardShouldPersistTaps="handled">
            <SectionHeader title="Send Notification" />

            <Text style={adminStyles.fieldLabel}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {NOTIF_TYPES.map(nt => (
                    <TouchableOpacity
                        key={nt.value}
                        style={[adminStyles.pill, type === nt.value && adminStyles.pillActive]}
                        onPress={() => setType(nt.value)}
                    >
                        <Text>{nt.icon} </Text>
                        <Text style={[adminStyles.pillText, type === nt.value && adminStyles.pillTextActive]}>{nt.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <Text style={adminStyles.fieldLabel}>Recipients</Text>
            <View style={adminStyles.rowGap}>
                {(["all", "single"] as const).map(t => (
                    <TouchableOpacity
                        key={t}
                        style={[adminStyles.pill, target === t && adminStyles.pillActive]}
                        onPress={() => setTarget(t)}
                    >
                        <Text style={[adminStyles.pillText, target === t && adminStyles.pillTextActive]}>
                            {t === "all" ? `All Users (${users.length})` : "Specific User"}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {target === "single" && (
                <>
                    <Text style={[adminStyles.fieldLabel, { marginTop: 12 }]}>Select User</Text>
                    <ScrollView style={adminStyles.userPickerList} nestedScrollEnabled>
                        {users.map(u => (
                            <TouchableOpacity
                                key={u.id}
                                style={[adminStyles.userPickerRow, targetUser === u.id && adminStyles.userPickerRowActive]}
                                onPress={() => setTargetUser(u.id)}
                            >
                                <Text style={[adminStyles.userPickerName, targetUser === u.id && { color: "#f97316" }]}>
                                    {u.name ?? "No name"}
                                </Text>
                                {targetUser === u.id && <Ionicons name="checkmark" size={16} color="#f97316" />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </>
            )}

            <Text style={[adminStyles.fieldLabel, { marginTop: 16 }]}>Title</Text>
            <TextInput
                style={adminStyles.fieldInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Notification title..."
                placeholderTextColor="#9ca3af"
                maxLength={80}
            />
            <Text style={adminStyles.charCount}>{title.length}/80</Text>

            <Text style={adminStyles.fieldLabel}>Body</Text>
            <TextInput
                style={[adminStyles.fieldInput, adminStyles.fieldInputMulti]}
                value={body}
                onChangeText={setBody}
                placeholder="Notification message..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                maxLength={200}
            />
            <Text style={adminStyles.charCount}>{body.length}/200</Text>

            <Text style={adminStyles.fieldLabel}>Action Route (optional)</Text>
            <TextInput
                style={adminStyles.fieldInput}
                value={route}
                onChangeText={setRoute}
                placeholder="e.g. /product/123 or /(tabs)/categories"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
            />

            {(title || body) && (
                <View style={adminStyles.previewCard}>
                    <Text style={adminStyles.previewLabel}>Preview</Text>
                    <View style={adminStyles.previewRow}>
                        <Text style={adminStyles.previewEmoji}>
                            {NOTIF_TYPES.find(n => n.value === type)?.icon}
                        </Text>
                        <View style={{ flex: 1 }}>
                            <Text style={adminStyles.previewTitle}>{title || "Title..."}</Text>
                            <Text style={adminStyles.previewBody}>{body || "Message..."}</Text>
                        </View>
                    </View>
                </View>
            )}

            <TouchableOpacity style={adminStyles.sendBtn} onPress={send} disabled={sending}>
                {sending
                    ? <ActivityIndicator color="#fff" />
                    : <>
                        <Ionicons name="send-outline" size={16} color="#fff" />
                        <Text style={adminStyles.sendBtnText}>
                            Send to {target === "all" ? `All ${users.length} Users` : "Selected User"}
                        </Text>
                    </>
                }
            </TouchableOpacity>
        </ScrollView>
    );
}

// ── Root Admin Screen ─────────────────────────────────────────────────────────
export default function AdminScreen() {
    const router = useRouter();
    const { user, profile } = useAuth();

    const [activeTab, setActiveTab] = useState<Tab>("Analytics");
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (profile && !profile.is_admin) {
            Alert.alert("Access Denied", "You don't have admin privileges.");
            router.back();
        }
    }, [profile]);

    const fetchAll = useCallback(async () => {
        if (!user?.id) return;

        const [ordersRes, productsRes, usersRes, categoriesRes] = await Promise.all([
            supabase.from("orders").select("*, profiles(name)").order("created_at", { ascending: false }),
            supabase.from("products").select("*").order("name"),
            supabase.from("profiles").select("*").order("created_at", { ascending: false }),
            supabase.from("categories").select("*").order("name"),
        ]);

        const allOrders = (ordersRes.data ?? []) as Order[];
        const allProducts = (productsRes.data ?? []) as Product[];
        const allUsers = (usersRes.data ?? []) as UserProfile[];
        const allCategories = (categoriesRes.data ?? []) as Category[];

        setOrders(allOrders);
        setProducts(allProducts);
        setUsers(allUsers);
        setCategories(allCategories);

        const todayStr = new Date().toDateString();
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);

        const ordersByStatus: Record<string, number> = {};
        ORDER_STATUSES.forEach(s => { ordersByStatus[s] = 0; });
        allOrders.forEach(o => { if (ordersByStatus[o.status] !== undefined) ordersByStatus[o.status]++; });

        const revenueMap: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            revenueMap[d.toISOString().split("T")[0]] = 0;
        }
        allOrders.forEach(o => {
            if (o.status !== "cancelled") {
                const day = o.created_at.split("T")[0];
                if (revenueMap[day] !== undefined) revenueMap[day] += o.total;
            }
        });
        const recentRevenue = Object.entries(revenueMap).map(([date, amount]) => ({ date, amount }));

        const todayOrders = allOrders.filter(o => new Date(o.created_at).toDateString() === todayStr);

        setAnalytics({
            totalRevenue: allOrders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0),
            totalOrders: allOrders.length,
            totalUsers: allUsers.length,
            totalProducts: allProducts.length,
            revenueToday: todayOrders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0),
            ordersToday: todayOrders.length,
            ordersByStatus,
            recentRevenue,
        });

        setLoading(false);
    }, [user?.id]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAll();
        setRefreshing(false);
    };

    if (!profile?.is_admin) {
        return (
            <SafeAreaView style={adminStyles.safe}>
                <View style={adminStyles.centered}>
                    <ActivityIndicator size="large" color="#f97316" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={adminStyles.safe} edges={["top"]}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <View style={adminStyles.header}>
                <TouchableOpacity style={adminStyles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={20} color="#111827" />
                </TouchableOpacity>
                <View>
                    <Text style={adminStyles.headerTitle}>Admin Dashboard</Text>
                    <Text style={adminStyles.headerSub}>ShopApp Control Panel</Text>
                </View>
                <View style={adminStyles.adminBadgeHeader}>
                    <Ionicons name="shield-checkmark" size={14} color="#f97316" />
                    <Text style={adminStyles.adminBadgeHeaderText}>Admin</Text>
                </View>
            </View>

            <View style={adminStyles.tabBar}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[adminStyles.tabBtn, activeTab === tab && adminStyles.tabBtnActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Ionicons
                            name={TAB_ICONS[tab] as any}
                            size={16}
                            color={activeTab === tab ? "#f97316" : "#9ca3af"}
                        />
                        <Text style={[adminStyles.tabBtnText, activeTab === tab && adminStyles.tabBtnTextActive]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {activeTab === "Analytics" && <AnalyticsTab analytics={analytics} loading={loading} />}
            {activeTab === "Orders" && <OrdersTab orders={orders} loading={loading} onRefresh={handleRefresh} refreshing={refreshing} />}
            {activeTab === "Products" && <ProductsTab products={products} categories={categories} loading={loading} onRefresh={handleRefresh} refreshing={refreshing} />}
            {activeTab === "Categories" && <CategoriesTab categories={categories} loading={loading} onRefresh={handleRefresh} refreshing={refreshing} />}
            {activeTab === "Users" && <UsersTab users={users} loading={loading} onRefresh={handleRefresh} refreshing={refreshing} />}
            {activeTab === "Notify" && <NotifyTab users={users} />}
        </SafeAreaView>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const adminStyles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#f9fafb" },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
    header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb" },
    backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
    headerSub: { fontSize: 11, color: "#9ca3af", marginTop: 1 },
    adminBadgeHeader: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fff7ed", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginLeft: "auto" },
    adminBadgeHeaderText: { fontSize: 11, fontWeight: "700", color: "#f97316" },

    tabBar: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb" },
    tabBtn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10, gap: 3 },
    tabBtnActive: { borderBottomWidth: 2, borderBottomColor: "#f97316" },
    tabBtnText: { fontSize: 9, fontWeight: "600", color: "#9ca3af" },
    tabBtnTextActive: { color: "#f97316" },

    tabContent: { padding: 16, paddingBottom: 60 },
    tabSectionTitle: { fontSize: 13, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, marginTop: 4 },

    statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
    statCard: { width: "47%", backgroundColor: "#fff", borderRadius: 14, padding: 14, borderLeftWidth: 3, gap: 6, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    statValue: { fontSize: 22, fontWeight: "800", color: "#111827" },
    statLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "500" },

    card: { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
    rowGap: { flexDirection: "row", alignItems: "center", gap: 8 },

    statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusRowLabel: { fontSize: 12, fontWeight: "500", color: "#374151", width: 100 },
    statusBarWrap: { flex: 1, height: 6, backgroundColor: "#f3f4f6", borderRadius: 3, overflow: "hidden" },
    statusBar: { height: 6, borderRadius: 3 },
    statusCount: { fontSize: 12, fontWeight: "700", width: 28, textAlign: "right" },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusBadgeText: { fontSize: 10, fontWeight: "700" },

    barChart: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 100, paddingTop: 8 },
    barCol: { flex: 1, alignItems: "center", gap: 4 },
    bar: { width: "70%", backgroundColor: "#f97316", borderRadius: 4 },
    barValue: { fontSize: 8, color: "#9ca3af", fontWeight: "600" },
    barLabel: { fontSize: 9, color: "#9ca3af", fontWeight: "600" },

    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
    sectionTitle: { fontSize: 15, fontWeight: "800", color: "#111827" },
    countBadge: { backgroundColor: "#f3f4f6", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    countBadgeText: { fontSize: 11, fontWeight: "700", color: "#6b7280" },

    searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
    searchInput: { flex: 1, fontSize: 14, color: "#111827" },

    pill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "#f3f4f6", marginRight: 6 },
    pillActive: { backgroundColor: "#111827" },
    pillText: { fontSize: 11, fontWeight: "600", color: "#6b7280" },
    pillTextActive: { color: "#fff" },

    orderId: { fontSize: 13, fontWeight: "700", color: "#111827" },
    orderMeta: { fontSize: 12, color: "#6b7280", marginBottom: 3 },
    orderDate: { fontSize: 11, color: "#9ca3af", marginBottom: 10 },
    statusActions: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
    statusActionBtn: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "#f9fafb", borderRadius: 8, borderWidth: 1, borderColor: "#e5e7eb" },
    statusActionText: { fontSize: 10, fontWeight: "600", color: "#374151" },

    productName: { fontSize: 14, fontWeight: "700", color: "#111827" },
    productMeta: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
    productPrice: { fontSize: 15, fontWeight: "800", color: "#f97316" },
    originalPrice: { fontSize: 12, color: "#9ca3af", textDecorationLine: "line-through" },
    editBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#fff7ed", alignItems: "center", justifyContent: "center" },
    deleteBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#fee2e2", alignItems: "center", justifyContent: "center" },
    stockLabel: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
    ratingText: { fontSize: 11, color: "#9ca3af" },
    badgePill: { backgroundColor: "#f97316", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    badgePillText: { fontSize: 10, fontWeight: "700", color: "#fff" },
    badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
    emptyText: { textAlign: "center", color: "#9ca3af", fontSize: 14, marginTop: 40 },
    emptyState: { alignItems: "center", paddingVertical: 48 },
    emptyStateTitle: { fontSize: 16, fontWeight: "700", color: "#9ca3af", marginBottom: 16 },
    emptyAddBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f97316", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
    emptyAddBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
    searchAddRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
    addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#f97316", alignItems: "center", justifyContent: "center" },
    formSection: { fontSize: 13, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 20, marginBottom: 10 },

    userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#111827", alignItems: "center", justifyContent: "center" },
    userAvatarText: { fontSize: 14, fontWeight: "700", color: "#fff" },
    userName: { fontSize: 14, fontWeight: "700", color: "#111827" },
    userMeta: { fontSize: 11, color: "#9ca3af", marginTop: 1 },
    adminBadge: { backgroundColor: "#fff7ed", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
    adminBadgeText: { fontSize: 10, fontWeight: "700", color: "#f97316" },
    adminToggleBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#fff7ed", alignItems: "center", justifyContent: "center" },
    adminToggleBtnActive: { backgroundColor: "#f97316" },

    fieldLabel: { fontSize: 12, fontWeight: "600", color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 },
    fieldInput: { backgroundColor: "#f9fafb", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#111827", marginBottom: 4 },
    fieldInputMulti: { minHeight: 80, textAlignVertical: "top" },
    charCount: { fontSize: 11, color: "#9ca3af", textAlign: "right", marginBottom: 12 },

    userPickerList: { maxHeight: 180, backgroundColor: "#f9fafb", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 12 },
    userPickerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb" },
    userPickerRowActive: { backgroundColor: "#fff7ed" },
    userPickerName: { fontSize: 13, fontWeight: "500", color: "#111827" },

    previewCard: { backgroundColor: "#f9fafb", borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "#e5e7eb" },
    previewLabel: { fontSize: 11, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", marginBottom: 10 },
    previewRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
    previewEmoji: { fontSize: 24 },
    previewTitle: { fontSize: 13, fontWeight: "700", color: "#111827", marginBottom: 3 },
    previewBody: { fontSize: 12, color: "#6b7280" },

    sendBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#f97316", borderRadius: 14, paddingVertical: 14, marginTop: 8 },
    sendBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },

    modalSafe: { flex: 1, backgroundColor: "#fff" },
    modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb" },
    modalTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
    modalCancel: { fontSize: 15, color: "#6b7280" },
    modalSave: { fontSize: 15, fontWeight: "700", color: "#f97316" },
    modalProductName: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 20 },
});