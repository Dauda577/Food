import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Image, StatusBar, Switch, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useOrders } from "../../context/OrdersContext";
import { useWishlist } from "../../context/WishlistContext";

const { width } = Dimensions.get("window");

// ── Status colour map ─────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:           { bg: "#fef9c3", text: "#854d0e" },
  processing:        { bg: "#fff7ed", text: "#c2410c" },
  in_transit:        { bg: "#eff6ff", text: "#2563eb" },
  out_for_delivery:  { bg: "#eff6ff", text: "#2563eb" },
  delivered:         { bg: "#dcfce7", text: "#16a34a" },
  cancelled:         { bg: "#fee2e2", text: "#dc2626" },
};

const STATUS_LABELS: Record<string, string> = {
  pending:           "Pending",
  processing:        "Processing",
  in_transit:        "In Transit",
  out_for_delivery:  "Out for Delivery",
  delivered:         "Delivered",
  cancelled:         "Cancelled",
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
      <Text style={styles.menuIconText}>{icon}</Text>
    </View>
    <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
    <View style={styles.menuRight}>
      {value && <Text style={styles.menuValue}>{value}</Text>}
      {rightElement}
      {!rightElement && <Text style={[styles.menuChevron, danger && { color: "#ef4444" }]}>›</Text>}
    </View>
  </TouchableOpacity>
);

// ── Screen ────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, signOut }          = useAuth();
  const { orders, loading: ordersLoading }  = useOrders();
  const { items: wishlistItems }            = useWishlist();

  const [notifications, setNotifications] = useState(true);
  const [darkMode,       setDarkMode]      = useState(false);
  const [biometrics,     setBiometrics]    = useState(false);

  // Real user data with fallbacks
  const displayName  = profile?.name ?? user?.email?.split("@")[0] ?? "User";
  const displayEmail = user?.email   ?? "No email";
  const initials     = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  // Real stats
  const recentOrders = orders.slice(0, 3);

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
        { text: "Delete", style: "destructive", onPress: () => {} },
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

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push("/notifications")}>
            <Text style={styles.settingsIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.avatarEdit}>
              <Text style={styles.avatarEditIcon}>✎</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{displayName}</Text>
          <View style={styles.tierBadge}>
            <Text style={styles.tierIcon}>⭐</Text>
            <Text style={styles.tierText}>Gold Member</Text>
          </View>
          <Text style={styles.userEmail}>{displayEmail}</Text>
          <Text style={styles.memberSince}>Member since March 2024</Text>

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
              <Text style={styles.statValue}>5</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </View>

        {/* Recent orders — real data */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity>
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
              const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 1;
              return (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderCard}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/order/${order.id}` as any)}
                >
                  <View style={styles.orderLeft}>
                    <Text style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                    <Text style={styles.orderDate}>{formatDate(order.created_at)} · {itemCount} {itemCount === 1 ? "item" : "items"}</Text>
                  </View>
                  <View style={styles.orderRight}>
                    <Text style={styles.orderTotal}>${order.total.toLocaleString()}</Text>
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
            <MenuRow icon="👤" label="Edit Profile"    onPress={() => {}} />
            <MenuRow icon="📍" label="My Addresses"    value="2 saved"   onPress={() => {}} />
            <MenuRow icon="💳" label="Payment Methods" value="1 card"    onPress={() => {}} />
            <MenuRow icon="❤️" label="Wishlist"
              value={`${wishlistItems.length} ${wishlistItems.length === 1 ? "item" : "items"}`}
              onPress={() => router.push("/wishlist")}
            />
            <MenuRow icon="⭐" label="My Reviews"      value="5 reviews" onPress={() => {}} />
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.menuGroup}>
            <MenuRow icon="🔔" label="Push Notifications" rightElement={
              <Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: "#e5e7eb", true: "#f97316" }} thumbColor="#fff" style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }} />
            } />
            <MenuRow icon="🌙" label="Dark Mode" rightElement={
              <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ false: "#e5e7eb", true: "#f97316" }} thumbColor="#fff" style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }} />
            } />
            <MenuRow icon="🔒" label="Biometric Login" rightElement={
              <Switch value={biometrics} onValueChange={setBiometrics} trackColor={{ false: "#e5e7eb", true: "#f97316" }} thumbColor="#fff" style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }} />
            } />
            <MenuRow icon="🌍" label="Language" value="English"  onPress={() => {}} />
            <MenuRow icon="💱" label="Currency"  value="USD ($)" onPress={() => {}} />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuGroup}>
            <MenuRow icon="💬" label="Live Chat"        onPress={() => {}} />
            <MenuRow icon="❓" label="Help & FAQs"      onPress={() => {}} />
            <MenuRow icon="📋" label="Terms of Service" onPress={() => {}} />
            <MenuRow icon="🔏" label="Privacy Policy"   onPress={() => {}} />
            <MenuRow icon="⭐" label="Rate the App"     onPress={() => {}} />
          </View>
        </View>

        {/* Danger zone */}
        <View style={styles.section}>
          <View style={styles.menuGroup}>
            <MenuRow icon="🚪" label="Sign Out"       onPress={handleLogout}        danger />
            <MenuRow icon="🗑️" label="Delete Account" onPress={handleDeleteAccount} danger />
          </View>
        </View>

        <Text style={styles.version}>ShopApp v1.0.0 · Made with ❤️</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#111827" },
  settingsBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  settingsIcon: { fontSize: 18 },
  profileCard: { backgroundColor: "#fff", alignItems: "center", paddingTop: 28, paddingBottom: 20, paddingHorizontal: 16, marginBottom: 10 },
  avatarWrap: { position: "relative", marginBottom: 14 },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarFallback: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#111827", alignItems: "center", justifyContent: "center" },
  avatarInitials: { fontSize: 28, fontWeight: "800", color: "#fff" },
  avatarEdit: { position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: "#f97316", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  avatarEditIcon: { fontSize: 12, color: "#fff", fontWeight: "700" },
  userName: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 6 },
  tierBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fff7ed", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 8 },
  tierIcon: { fontSize: 11 },
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
  menuIconText: { fontSize: 16 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: "500", color: "#111827" },
  menuLabelDanger: { color: "#ef4444" },
  menuRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  menuValue: { fontSize: 12, color: "#9ca3af", fontWeight: "500" },
  menuChevron: { fontSize: 20, color: "#9ca3af", fontWeight: "300" },
  version: { textAlign: "center", fontSize: 12, color: "#d1d5db", marginTop: 20, marginBottom: 8 },
});