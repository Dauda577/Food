import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Image, StatusBar, Switch, Alert, ActivityIndicator,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useOrders } from "../../context/OrdersContext";
import { useWishlist } from "../../context/WishlistContext";
import { supabase } from "../../lib/supabase";
import { useBiometrics } from "../../hooks/useBiometrics";
import { useLocale, LANGUAGES, CURRENCIES } from "../../context/LocaleContext";
import * as FileSystem from "expo-file-system";

// ── Shared upload helper ──────────────────────────────────────────────────────
const uploadImageToSupabase = async (uri: string, bucket: string, path: string): Promise<string | null> => {
  try {
    // Read as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to ArrayBuffer
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, bytes.buffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      Alert.alert("Upload Error", error.message);
      return null;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (e: any) {
    Alert.alert("Upload Error", e.message);
    return null;
  }
};

// ── Status colour map ─────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#fef9c3", text: "#854d0e" },
  processing: { bg: "#fff7ed", text: "#c2410c" },
  in_transit: { bg: "#eff6ff", text: "#2563eb" },
  out_for_delivery: { bg: "#eff6ff", text: "#2563eb" },
  delivered: { bg: "#dcfce7", text: "#16a34a" },
  cancelled: { bg: "#fee2e2", text: "#dc2626" },
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// ── Menu row ──────────────────────────────────────────────────────────────────
const MenuRow = ({
  icon, label, value, onPress, danger = false, rightElement,
}: {
  icon: string; label: string; value?: string;
  onPress?: () => void; danger?: boolean; rightElement?: React.ReactNode;
}) => (
  <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
      <Ionicons name={icon as any} size={18} color={danger ? "#ef4444" : "#6b7280"} />
    </View>
    <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
    <View style={styles.menuRight}>
      {value && <Text style={styles.menuValue}>{value}</Text>}
      {rightElement}
      {!rightElement && (
        <Ionicons name="chevron-forward" size={18} color={danger ? "#ef4444" : "#9ca3af"} />
      )}
    </View>
  </TouchableOpacity>
);

// ── Edit Profile Modal ────────────────────────────────────────────────────────
const EditProfileModal = ({
  visible, onClose, currentName, currentPhone, onSave,
}: {
  visible: boolean; onClose: () => void;
  currentName: string; currentPhone: string;
  onSave: (name: string, phone: string) => Promise<void>;
}) => {
  const [name, setName] = useState(currentName);
  const [phone, setPhone] = useState(currentPhone);
  const [saving, setSaving] = useState(false);

  // Sync fields when modal opens with fresh data
  useEffect(() => {
    if (visible) { setName(currentName); setPhone(currentPhone); }
  }, [visible, currentName, currentPhone]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Validation", "Name cannot be empty."); return; }
    setSaving(true);
    try {
      await onSave(name.trim(), phone.trim());
      onClose();
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <SafeAreaView style={modalStyles.safe}>
          {/* Header */}
          <View style={modalStyles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={modalStyles.cancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={modalStyles.title}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color="#f97316" />
                : <Text style={modalStyles.save}>Save</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={modalStyles.body}>
            <Text style={modalStyles.label}>Full Name</Text>
            <TextInput
              style={modalStyles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
            />
            <Text style={modalStyles.label}>Phone Number</Text>
            <TextInput
              style={modalStyles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+233 ..."
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
            />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, signOut, updateProfile } = useAuth();
  const { orders, loading: ordersLoading } = useOrders();
  const { items: wishlistItems } = useWishlist();
  const { isSupported, isEnabled, biometricType, toggleBiometric } = useBiometrics();
  const { language, currency } = useLocale();

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // ── Derived from DB ──────────────────────────────────────────────────────
  const [reviewCount, setReviewCount] = useState<number | null>(null);

  const displayName = profile?.name ?? user?.email?.split("@")[0] ?? "User";
  const displayEmail = user?.email ?? "No email";
  const displayPhone = profile?.phone ?? "";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  // Member since — from Supabase Auth user creation timestamp
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-GH", { month: "long", year: "numeric" })
    : "";

  // ── Fetch review count ───────────────────────────────────────────────────
  const fetchReviewCount = useCallback(async () => {
    if (!user?.id) return;
    const { count, error } = await supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (!error && count !== null) setReviewCount(count);
  }, [user?.id]);

  useEffect(() => { fetchReviewCount(); }, [fetchReviewCount]);

  const recentOrders = orders.slice(0, 3);

  // ── Handlers ─────────────────────────────────────────────────────────────
  // Uses updateProfile from AuthContext — updates DB + local state in one call
  const handleSaveProfile = async (name: string, phone: string) => {
    const { error } = await updateProfile({ name, phone });
    if (error) throw new Error(error);
  };

  // Avatar upload using shared helper
  const handlePickAvatar = async () => {
    let ImagePicker: typeof import("expo-image-picker");
    try {
      ImagePicker = await import("expo-image-picker");
    } catch {
      Alert.alert("Missing package", "Run: npx expo install expo-image-picker");
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo access to change your avatar.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const path = `${user!.id}.jpg`;  // always .jpg since we're uploading as jpeg

    setAvatarUploading(true);
    try {
      const avatarUrl = await uploadImageToSupabase(asset.uri, "avatars", path);
      if (!avatarUrl) return;

      // Bust the cache so the new image loads immediately
      const { error: updateError } = await updateProfile({
        avatar_url: `${avatarUrl}?t=${Date.now()}`
      });
      if (updateError) throw new Error(updateError);
    } catch (e: any) {
      Alert.alert("Upload failed", e.message ?? "Could not upload avatar.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive", onPress: async () => {
          await signOut();
          router.replace("/auth");
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive", onPress: async () => {
            // Call your server-side delete function here (e.g. a Supabase Edge Function)
            // await supabase.functions.invoke("delete-account");
            await signOut();
            router.replace("/auth");
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-GH", {
        day: "numeric", month: "short", year: "numeric",
      });
    } catch { return dateStr; }
  };

  // Get current language name and currency code
  const currentLanguageName = LANGUAGES.find(l => l.code === language)?.name ?? "English";
  const currentCurrencyCode = CURRENCIES.find(c => c.code === currency)?.code ?? "GHS";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push("/notifications")}>
            <Ionicons name="notifications-outline" size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            {avatarUploading ? (
              <View style={styles.avatarFallback}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.avatarEdit} onPress={handlePickAvatar}>
              <Ionicons name="create-outline" size={12} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{displayName}</Text>
          <View style={styles.tierBadge}>
            <Ionicons name="star" size={11} color="#f97316" />
            <Text style={styles.tierText}>Gold Member</Text>
          </View>
          <Text style={styles.userEmail}>{displayEmail}</Text>
          {memberSince ? (
            <Text style={styles.memberSince}>Member since {memberSince}</Text>
          ) : null}

          {/* Real stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{orders.length}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{wishlistItems.length}</Text>
              <Text style={styles.statLabel}>Wishlist</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {reviewCount === null ? "—" : reviewCount}
              </Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </View>

        {/* Recent orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => router.push("/orders")}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {ordersLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#f97316" />
              <Text style={styles.loadingText}>Loading orders...</Text>
            </View>
          ) : recentOrders.length === 0 ? (
            <View style={styles.emptyOrders}>
              <Text style={styles.emptyOrdersText}>No orders yet</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)")}>
                <Text style={styles.emptyOrdersLink}>Start shopping →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            recentOrders.map(order => {
              const sc = STATUS_COLORS[order.status] ?? STATUS_COLORS["pending"];
              const itemCount = order.items?.reduce((s: number, i: any) => s + i.quantity, 0) ?? 1;
              return (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderCard}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/order/${order.id}` as any)}
                >
                  <View style={styles.orderLeft}>
                    <Text style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                    <Text style={styles.orderDate}>
                      {formatDate(order.created_at)} · {itemCount} {itemCount === 1 ? "item" : "items"}
                    </Text>
                  </View>
                  <View style={styles.orderRight}>
                    <Text style={styles.orderTotal}>GH₵{order.total.toLocaleString()}</Text>
                    <View style={[styles.orderStatus, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.orderStatusText, { color: sc.text }]}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* My Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Account</Text>
          <View style={styles.menuGroup}>
            <MenuRow icon="shield-outline" label="Admin Dashboard" onPress={() => router.push("/admin")} />
            <MenuRow icon="person-outline" label="Edit Profile" onPress={() => setEditVisible(true)} />
            <MenuRow icon="location-outline" label="My Addresses" value="2 saved" onPress={() => router.push("/addresses")} />
            <MenuRow icon="card-outline" label="Payment Methods" value="1 card" onPress={() => router.push("/payment-methods")} />
            <MenuRow
              icon="heart-outline"
              label="Wishlist"
              value={`${wishlistItems.length} ${wishlistItems.length === 1 ? "item" : "items"}`}
              onPress={() => router.push("/wishlist")}
            />
            <MenuRow
              icon="star-outline"
              label="My Reviews"
              value={reviewCount !== null ? `${reviewCount} ${reviewCount === 1 ? "review" : "reviews"}` : undefined}
              onPress={() => router.push("/reviews")}
            />
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.menuGroup}>
            <MenuRow
              icon="notifications-outline"
              label="Push Notifications"
              rightElement={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: "#e5e7eb", true: "#f97316" }}
                  thumbColor="#fff"
                  style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                />
              }
            />
            <MenuRow
              icon="moon-outline"
              label="Dark Mode"
              rightElement={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: "#e5e7eb", true: "#f97316" }}
                  thumbColor="#fff"
                  style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                />
              }
            />
            <MenuRow
              icon={biometricType === "face" ? "scan-outline" : "finger-print-outline"}
              label={biometricType === "face" ? "Face ID Login" : "Fingerprint Login"}
              rightElement={
                isSupported ? (
                  <Switch
                    value={isEnabled}
                    onValueChange={async (val) => {
                      const result = await toggleBiometric(val);
                      if (!result.success && result.error) {
                        Alert.alert("Biometric Login", result.error);
                      }
                    }}
                    trackColor={{ false: "#e5e7eb", true: "#f97316" }}
                    thumbColor="#fff"
                    style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                  />
                ) : (
                  <Text style={{ fontSize: 11, color: "#9ca3af" }}>Not supported</Text>
                )
              }
            />
            <MenuRow
              icon="language-outline"
              label="Language"
              value={currentLanguageName}
              onPress={() => router.push("/language-currency")}
            />
            <MenuRow
              icon="cash-outline"
              label="Currency"
              value={currentCurrencyCode}
              onPress={() => router.push("/language-currency")}
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuGroup}>
            <MenuRow icon="chatbubble-outline" label="Live Chat" onPress={() => { }} />
            <MenuRow icon="help-circle-outline" label="Help & FAQs" onPress={() => { }} />
            <MenuRow icon="document-text-outline" label="Terms of Service" onPress={() => { }} />
            <MenuRow icon="lock-closed-outline" label="Privacy Policy" onPress={() => { }} />
            <MenuRow icon="star-outline" label="Rate the App" onPress={() => { }} />
          </View>
        </View>

        {/* Danger zone */}
        <View style={styles.section}>
          <View style={styles.menuGroup}>
            <MenuRow icon="log-out-outline" label="Sign Out" onPress={handleLogout} danger />
            <MenuRow icon="trash-outline" label="Delete Account" onPress={handleDeleteAccount} danger />
          </View>
        </View>

        <Text style={styles.version}>
          ShopApp v1.0.0 · Made with{" "}
          <Ionicons name="heart" size={12} color="#ef4444" />
        </Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        currentName={displayName}
        currentPhone={displayPhone}
        onSave={handleSaveProfile}
      />
    </SafeAreaView>
  );
}

// ── Modal Styles ──────────────────────────────────────────────────────────────
const modalStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb",
  },
  title: { fontSize: 16, fontWeight: "700", color: "#111827" },
  cancel: { fontSize: 15, color: "#6b7280" },
  save: { fontSize: 15, fontWeight: "700", color: "#f97316" },
  body: { padding: 20, gap: 4 },
  label: { fontSize: 12, fontWeight: "600", color: "#6b7280", marginBottom: 6, marginTop: 16, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    backgroundColor: "#f9fafb", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb",
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#111827",
  },
});

// ── Main Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#111827" },
  settingsBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  profileCard: { backgroundColor: "#fff", alignItems: "center", paddingTop: 28, paddingBottom: 20, paddingHorizontal: 16, marginBottom: 10 },
  avatarWrap: { position: "relative", marginBottom: 14 },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarFallback: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#111827", alignItems: "center", justifyContent: "center" },
  avatarInitials: { fontSize: 28, fontWeight: "800", color: "#fff" },
  avatarEdit: { position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: "#f97316", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  userName: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 6 },
  tierBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fff7ed", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 8 },
  tierText: { fontSize: 11, fontWeight: "700", color: "#f97316" },
  userEmail: { fontSize: 13, color: "#6b7280", marginBottom: 3 },
  memberSince: { fontSize: 11, color: "#9ca3af", marginBottom: 20 },
  statsRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#f9fafb", borderRadius: 16, paddingVertical: 16, paddingHorizontal: 8, width: "100%" },
  statItem: { flex: 1, alignItems: "center", gap: 3 },
  statValue: { fontSize: 20, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "500" },
  statDivider: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: "#e5e7eb" },
  section: { backgroundColor: "#fff", marginTop: 10, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 12 },
  seeAll: { fontSize: 13, fontWeight: "600", color: "#f97316" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12 },
  loadingText: { fontSize: 13, color: "#9ca3af" },
  emptyOrders: { paddingVertical: 16, alignItems: "center", gap: 6 },
  emptyOrdersText: { fontSize: 14, color: "#9ca3af" },
  emptyOrdersLink: { fontSize: 13, fontWeight: "600", color: "#f97316" },
  orderCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: "#f3f4f6", backgroundColor: "#f9fafb", marginBottom: 8 },
  orderLeft: { gap: 3 },
  orderId: { fontSize: 13, fontWeight: "700", color: "#111827" },
  orderDate: { fontSize: 11, color: "#9ca3af" },
  orderRight: { alignItems: "flex-end", gap: 5 },
  orderTotal: { fontSize: 14, fontWeight: "800", color: "#111827" },
  orderStatus: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  orderStatusText: { fontSize: 10, fontWeight: "700" },
  menuGroup: { borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#f3f4f6", marginBottom: 4 },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13, paddingHorizontal: 14, backgroundColor: "#fff", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#f3f4f6" },
  menuIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  menuIconDanger: { backgroundColor: "#fee2e2" },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: "500", color: "#111827" },
  menuLabelDanger: { color: "#ef4444" },
  menuRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  menuValue: { fontSize: 12, color: "#9ca3af", fontWeight: "500" },
  version: { textAlign: "center", fontSize: 12, color: "#d1d5db", marginTop: 20, marginBottom: 8 },
});