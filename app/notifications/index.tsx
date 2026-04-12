import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────
type NotifType = "order" | "promo" | "delivery" | "review" | "account" | "price";

type Notification = {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  read: boolean;
  action_route?: string | null;
  created_at: string;
};

// ── Config ────────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  order: { icon: "🛍️", color: "#f97316", bg: "#fff7ed" },
  promo: { icon: "🏷️", color: "#7c3aed", bg: "#f5f3ff" },
  delivery: { icon: "🚚", color: "#2563eb", bg: "#eff6ff" },
  review: { icon: "⭐", color: "#d97706", bg: "#fffbeb" },
  account: { icon: "👤", color: "#16a34a", bg: "#f0fdf4" },
  price: { icon: "📉", color: "#dc2626", bg: "#fef2f2" },
};

const FILTERS = ["All", "Orders", "Promos", "Delivery"] as const;
type Filter = typeof FILTERS[number];

const FILTER_TYPES: Record<Filter, NotifType[]> = {
  All: ["order", "promo", "delivery", "review", "account", "price"],
  Orders: ["order", "review"],
  Promos: ["promo", "price"],
  Delivery: ["delivery"],
};

// ── Grouping ──────────────────────────────────────────────────────────────────
function groupNotifs(notifs: Notification[]) {
  const now = new Date();
  const todayStr = now.toDateString();
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  const yesterStr = yest.toDateString();
  const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);

  const today: Notification[] = [];
  const yesterday: Notification[] = [];
  const thisWeek: Notification[] = [];
  const older: Notification[] = [];

  notifs.forEach(n => {
    const d = new Date(n.created_at);
    const s = d.toDateString();
    if (s === todayStr) today.push(n);
    else if (s === yesterStr) yesterday.push(n);
    else if (d >= weekAgo) thisWeek.push(n);
    else older.push(n);
  });

  const groups: { label: string; items: Notification[] }[] = [];
  if (today.length) groups.push({ label: "Today", items: today });
  if (yesterday.length) groups.push({ label: "Yesterday", items: yesterday });
  if (thisWeek.length) groups.push({ label: "This Week", items: thisWeek });
  if (older.length) groups.push({ label: "Older", items: older });
  return groups;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const todayStr = now.toDateString();
  const yest = new Date(now); yest.setDate(now.getDate() - 1);

  if (d.toDateString() === todayStr) {
    return d.toLocaleTimeString("en-GH", { hour: "numeric", minute: "2-digit" });
  }
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GH", { day: "numeric", month: "short" });
}

// ── Notification row ──────────────────────────────────────────────────────────
const NotifRow = React.memo(({
  notif, onPress, onDismiss,
}: {
  notif: Notification; onPress: () => void; onDismiss: () => void;
}) => {
  const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.order;
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
        <Text style={styles.notifTime}>{formatTime(notif.created_at)}</Text>
      </View>
      <TouchableOpacity
        style={styles.dismissBtn}
        onPress={onDismiss}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.dismissIcon}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

// ── Screen ────────────────────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("All");

  // Track in-flight optimistic IDs so we don't double-apply realtime events
  const pendingIds = useRef<Set<string>>(new Set());

  // ── Fetch ───────────────────────────────────────────────────────────────
  const fetchNotifs = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data) setNotifs(data as Notification[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  // ── Realtime ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        payload => {
          if (payload.eventType === "INSERT") {
            const n = payload.new as Notification;
            if (pendingIds.current.has(n.id)) {
              pendingIds.current.delete(n.id);
              return; // Already applied optimistically
            }
            setNotifs(prev => [n, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const n = payload.new as Notification;
            setNotifs(prev => prev.map(x => x.id === n.id ? n : x));
          } else if (payload.eventType === "DELETE") {
            setNotifs(prev => prev.filter(x => x.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  // ── Derived ─────────────────────────────────────────────────────────────
  const unreadCount = notifs.filter(n => !n.read).length;
  const filtered = notifs.filter(n => FILTER_TYPES[filter].includes(n.type as NotifType));
  const groups = groupNotifs(filtered);

  // ── Actions ──────────────────────────────────────────────────────────────

  // Mark a single notification read (optimistic)
  const markRead = useCallback(async (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  }, []);

  // Mark all read (optimistic)
  const markAllRead = useCallback(async () => {
    if (!user?.id) return;
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
  }, [user?.id]);

  // Dismiss single (optimistic)
  const dismiss = useCallback(async (id: string) => {
    setNotifs(prev => prev.filter(n => n.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
  }, []);

  // Clear all
  const clearAll = useCallback(() => {
    Alert.alert("Clear All", "Remove all notifications?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear", style: "destructive", onPress: async () => {
          if (!user?.id) return;
          setNotifs([]);
          await supabase.from("notifications").delete().eq("user_id", user.id);
        },
      },
    ]);
  }, [user?.id]);

  // Press — mark read then navigate
  const handlePress = useCallback(async (notif: Notification) => {
    if (!notif.read) await markRead(notif.id);
    if (notif.action_route) router.push(notif.action_route as any);
  }, [markRead, router]);

  // ── Render ────────────────────────────────────────────────────────────────
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
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} unread</Text>
          )}
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
      {loading ? (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={[styles.emptySub, { marginTop: 12 }]}>Loading notifications...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔔</Text>
          <Text style={styles.emptyTitle}>No notifications</Text>
          <Text style={styles.emptySub}>
            {filter === "All"
              ? "You're all caught up!"
              : `No ${filter.toLowerCase()} notifications yet.`}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
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