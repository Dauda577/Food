import React, { useState, useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, StatusBar, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useOrders } from "../../context/OrdersContext";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");

type Notification = {
  id: string;
  type: "order" | "promo" | "delivery" | "review" | "account" | "price";
  title: string;
  body: string;
  time: string;
  read: boolean;
  actionRoute?: string;
};

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  order:    { icon: "🛍️", color: "#f97316", bg: "#fff7ed" },
  promo:    { icon: "🏷️", color: "#7c3aed", bg: "#f5f3ff" },
  delivery: { icon: "🚚", color: "#2563eb", bg: "#eff6ff" },
  review:   { icon: "⭐", color: "#d97706", bg: "#fffbeb" },
  account:  { icon: "👤", color: "#16a34a", bg: "#f0fdf4" },
  price:    { icon: "📉", color: "#dc2626", bg: "#fef2f2" },
};

const FILTERS = ["All", "Orders", "Promos", "Delivery"];

const filterMap: Record<string, string[]> = {
  All:      ["order", "promo", "delivery", "review", "account", "price"],
  Orders:   ["order", "review"],
  Promos:   ["promo", "price"],
  Delivery: ["delivery"],
};

const groupNotifs = (notifs: Notification[]) => {
  const today: Notification[]     = [];
  const yesterday: Notification[] = [];
  const older: Notification[]     = [];

  notifs.forEach(n => {
    if (n.time.includes("AM") || n.time.includes("PM")) today.push(n);
    else if (n.time === "Yesterday") yesterday.push(n);
    else older.push(n);
  });

  const groups = [];
  if (today.length)     groups.push({ label: "Today",     items: today });
  if (yesterday.length) groups.push({ label: "Yesterday", items: yesterday });
  if (older.length)     groups.push({ label: "This Week", items: older });
  return groups;
};

// ── Notification row ──────────────────────────────────────────────────────────
const NotifRow = ({
  notif, onPress, onDismiss,
}: {
  notif: Notification; onPress: () => void; onDismiss: () => void;
}) => {
  const cfg = TYPE_CONFIG[notif.type];
  return (
    <TouchableOpacity
      style={[styles.notifRow, !notif.read && styles.notifRowUnread]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {!notif.read && <View style={styles.unreadDot} />}
      <View style={[styles.notifIcon, { backgroundColor: cfg.bg }]}>
        <Text style={styles.notifIconEmoji}>{cfg.icon}</Text>
      </View>
      <View style={styles.notifContent}>
        <Text style={[styles.notifTitle, !notif.read && styles.notifTitleUnread]} numberOfLines={1}>
          {notif.title}
        </Text>
        <Text style={styles.notifBody} numberOfLines={2}>{notif.body}</Text>
        <Text style={styles.notifTime}>{notif.time}</Text>
      </View>
      <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.dismissIcon}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const router = useRouter();
  const { orders } = useOrders();
  const { profile } = useAuth();

  const firstName = profile?.name?.split(" ")[0] ?? "there";

  // Build dynamic notifications from real orders + static promos
  const INITIAL_NOTIFS: Notification[] = useMemo(() => {
    const notifs: Notification[] = [];

    // Real order-based notifications
    orders.slice(0, 5).forEach((order, i) => {
      const shortId = `#${order.id.slice(0, 8).toUpperCase()}`;
      const itemCount = order.items?.reduce((s, it) => s + it.quantity, 0) ?? 1;
      const firstName = order.items?.[0]?.product?.name ?? "your order";

      if (order.status === "out_for_delivery") {
        notifs.push({
          id: `order-delivery-${order.id}`,
          type: "delivery",
          title: "Your order is out for delivery! 🚚",
          body: `${shortId} · ${firstName} is on its way. Expected today.`,
          time: "10:15 AM",
          read: false,
          actionRoute: `/order/${order.id}`,
        });
      } else if (order.status === "delivered") {
        notifs.push({
          id: `order-delivered-${order.id}`,
          type: "order",
          title: "Order delivered ✅",
          body: `${shortId} has been delivered. Tap to leave a review.`,
          time: "Yesterday",
          read: i > 0,
          actionRoute: `/order/${order.id}`,
        });
      } else if (order.status === "in_transit") {
        notifs.push({
          id: `order-transit-${order.id}`,
          type: "delivery",
          title: "Order picked up by carrier 📦",
          body: `${shortId} is on its way to you.`,
          time: "Yesterday",
          read: i > 0,
          actionRoute: `/order/${order.id}`,
        });
      } else if (order.status === "pending" || order.status === "processing") {
        notifs.push({
          id: `order-confirmed-${order.id}`,
          type: "order",
          title: "Order confirmed ✅",
          body: `${shortId} has been confirmed. We'll notify you when it ships.`,
          time: "Yesterday",
          read: i > 0,
          actionRoute: `/order/${order.id}`,
        });
      }

      // Payment notification for all orders
      notifs.push({
        id: `order-payment-${order.id}`,
        type: "order",
        title: "Payment successful 💳",
        body: `Your payment of $${order.total.toLocaleString()} for ${shortId} was processed.`,
        time: "Mar 15",
        read: true,
        actionRoute: `/order/${order.id}`,
      });
    });

    // Static promo + account notifications
    notifs.push(
      { id: "promo-1",   type: "promo",    title: "Flash Sale — Up to 50% Off 🔥",      body: "Today only! Electronics, fashion and more. Shop before midnight.",          time: "9:00 AM",  read: false, actionRoute: "/(tabs)/categories" },
      { id: "price-1",   type: "price",    title: "Price drop on your wishlist item 📉", body: "Sony WH-1000XM5 dropped from $349 to $279. Grab it before it's gone!",    time: "8:30 AM",  read: false, actionRoute: "/product/3" },
      { id: "promo-2",   type: "promo",    title: "New arrivals just dropped 👟",         body: "Check out the latest sneakers and fashion from top brands.",                time: "Yesterday",read: true,  actionRoute: "/(tabs)/categories" },
      { id: "account-1", type: "account",  title: `Welcome to ShopApp, ${firstName}! 🎉`, body: "Your account is ready. Start browsing thousands of products.",             time: "Mar 12",   read: true },
      { id: "price-2",   type: "price",    title: "Back in stock — MacBook Air M2 💻",   body: "The item you saved is back in stock. Limited units available.",             time: "Mar 11",   read: true,  actionRoute: "/product/4" },
    );

    return notifs;
  }, [orders, firstName]);

  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [filter, setFilter] = useState("All");
  const [initialised, setInitialised] = React.useState(false);

  // Sync when orders load
  React.useEffect(() => {
    if (!initialised && INITIAL_NOTIFS.length > 0) {
      setNotifs(INITIAL_NOTIFS);
      setInitialised(true);
    }
  }, [INITIAL_NOTIFS, initialised]);

  const unreadCount = notifs.filter(n => !n.read).length;

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const dismiss     = (id: string) => setNotifs(prev => prev.filter(n => n.id !== id));
  const clearAll    = () => Alert.alert("Clear All", "Remove all notifications?", [
    { text: "Cancel", style: "cancel" },
    { text: "Clear", style: "destructive", onPress: () => setNotifs([]) },
  ]);

  const handlePress = (notif: Notification) => {
    setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    if (notif.actionRoute) router.push(notif.actionRoute as any);
  };

  const filtered = notifs.filter(n => filterMap[filter].includes(n.type));
  const groups   = groupNotifs(filtered);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && <Text style={styles.headerSub}>{unreadCount} unread</Text>}
        </View>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.headerBtn} onPress={markAllRead}>
              <Text style={styles.headerBtnText}>Mark all read</Text>
            </TouchableOpacity>
          )}
          {notifs.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, filter === f && styles.filterPillActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            {f === "All" && unreadCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔔</Text>
          <Text style={styles.emptyTitle}>No notifications</Text>
          <Text style={styles.emptySub}>
            {filter === "All" ? "You're all caught up!" : `No ${filter.toLowerCase()} notifications yet.`}
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {groups.map(group => (
            <View key={group.label}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupLabel}>{group.label}</Text>
                <View style={styles.groupLine} />
              </View>
              {group.items.map(notif => (
                <NotifRow
                  key={notif.id}
                  notif={notif}
                  onPress={() => handlePress(notif)}
                  onDismiss={() => dismiss(notif.id)}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb" },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 18, color: "#374151", fontWeight: "600" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#111827" },
  headerSub: { fontSize: 12, color: "#f97316", fontWeight: "600", marginTop: 1 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#fff7ed", borderRadius: 10 },
  headerBtnText: { fontSize: 11, fontWeight: "700", color: "#f97316" },
  clearBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#f3f4f6", borderRadius: 10 },
  clearBtnText: { fontSize: 11, fontWeight: "700", color: "#6b7280" },
  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb" },
  filterPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, backgroundColor: "#f3f4f6" },
  filterPillActive: { backgroundColor: "#111827" },
  filterText: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  filterTextActive: { color: "#fff" },
  filterBadge: { minWidth: 16, height: 16, borderRadius: 8, backgroundColor: "#f97316", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  filterBadgeText: { fontSize: 9, fontWeight: "800", color: "#fff" },
  groupHeader: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  groupLabel: { fontSize: 12, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.6 },
  groupLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: "#e5e7eb" },
  notifRow: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 16, paddingVertical: 14, gap: 12, backgroundColor: "#fff", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#f3f4f6", position: "relative" },
  notifRowUnread: { backgroundColor: "#fafafa" },
  unreadDot: { position: "absolute", left: 6, top: 18, width: 6, height: 6, borderRadius: 3, backgroundColor: "#f97316" },
  notifIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  notifIconEmoji: { fontSize: 20 },
  notifContent: { flex: 1, gap: 3 },
  notifTitle: { fontSize: 13, fontWeight: "600", color: "#374151", lineHeight: 18 },
  notifTitleUnread: { fontWeight: "800", color: "#111827" },
  notifBody: { fontSize: 12, color: "#6b7280", lineHeight: 17 },
  notifTime: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  dismissBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
  dismissIcon: { fontSize: 9, color: "#9ca3af", fontWeight: "700" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 100, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 8 },
  emptySub: { fontSize: 14, color: "#9ca3af", textAlign: "center", lineHeight: 20 },
});