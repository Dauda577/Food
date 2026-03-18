import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Image, StatusBar, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useOrders, Order } from "../../context/OrdersContext";

const { width } = Dimensions.get("window");

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  pending:           { label: "Order Pending",    color: "#d97706", bg: "#fffbeb", emoji: "⏳" },
  processing:        { label: "Processing",       color: "#d97706", bg: "#fffbeb", emoji: "⚙️" },
  in_transit:        { label: "In Transit",       color: "#7c3aed", bg: "#f5f3ff", emoji: "📦" },
  out_for_delivery:  { label: "Out for Delivery", color: "#2563eb", bg: "#eff6ff", emoji: "🚚" },
  delivered:         { label: "Delivered",        color: "#16a34a", bg: "#f0fdf4", emoji: "✅" },
  cancelled:         { label: "Cancelled",        color: "#dc2626", bg: "#fef2f2", emoji: "✕"  },
};

// ── Build timeline from order status ─────────────────────────────────────────
const buildTimeline = (order: Order) => {
  const STATUS_ORDER = ["pending", "processing", "in_transit", "out_for_delivery", "delivered"];
  const currentIdx   = STATUS_ORDER.indexOf(order.status);

  const steps = [
    { id: "1", label: "Order Placed",         sub: new Date(order.created_at).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" }) },
    { id: "2", label: "Payment Confirmed",     sub: "Confirmed" },
    { id: "3", label: "Order Processed",       sub: currentIdx >= 1 ? "Processed" : "Pending" },
    { id: "4", label: "Picked Up by Carrier",  sub: currentIdx >= 2 ? "Picked up" : "Pending" },
    { id: "5", label: "Out for Delivery",      sub: currentIdx >= 3 ? "On the way" : "Pending" },
    { id: "6", label: "Delivered",             sub: order.status === "delivered" ? "Delivered ✓" : order.status === "cancelled" ? "Cancelled" : "Expected soon" },
  ];

  return steps.map((s, i) => ({
    ...s,
    done:   order.status !== "cancelled" && i < currentIdx + 1,
    active: order.status !== "cancelled" && i === currentIdx,
  }));
};

// ── Timeline step ─────────────────────────────────────────────────────────────
const TimelineStep = ({
  step, isLast,
}: {
  step: { id: string; label: string; sub: string; done: boolean; active: boolean };
  isLast: boolean;
}) => (
  <View style={styles.timelineRow}>
    <View style={styles.timelineLeft}>
      <View style={[
        styles.timelineDot,
        step.done   && styles.timelineDotDone,
        step.active && styles.timelineDotActive,
      ]}>
        {step.done   && <Text style={styles.timelineDotCheck}>✓</Text>}
        {step.active && <View style={styles.timelineDotPulse} />}
      </View>
      {!isLast && <View style={[styles.timelineLine, step.done && styles.timelineLineDone]} />}
    </View>
    <View style={[styles.timelineContent, !isLast && { paddingBottom: 24 }]}>
      <Text style={[styles.timelineLabel, step.done && styles.timelineLabelDone, step.active && styles.timelineLabelActive]}>
        {step.label}
      </Text>
      <Text style={[styles.timelineSub, step.active && styles.timelineSubActive]}>{step.sub}</Text>
    </View>
  </View>
);

// ── Screen ────────────────────────────────────────────────────────────────────
export default function OrderTrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getOrderById } = useOrders();

  const [order,     setOrder]     = useState<Order | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<"tracking" | "details">("tracking");

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    getOrderById(id).then(data => {
      setOrder(data);
      setLoading(false);
    });
  }, [id]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.root, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={{ marginTop: 12, fontSize: 14, color: "#9ca3af" }}>Loading order...</Text>
      </View>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!order) {
    return (
      <SafeAreaView style={[styles.root, { alignItems: "center", justifyContent: "center" }]} edges={["top"]}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>📦</Text>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 8 }}>Order not found</Text>
        <TouchableOpacity style={styles.fallbackBtn} onPress={() => router.back()}>
          <Text style={styles.fallbackBtnText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const status   = STATUS_CONFIG[order.status] ?? STATUS_CONFIG["pending"];
  const timeline = buildTimeline(order);
  const address  = order.delivery_address;
  const items    = order.items ?? [];
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shortId  = `#${order.id.slice(0, 8).toUpperCase()}`;

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <SafeAreaView style={styles.headerWrap} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Track Order</Text>
            <Text style={styles.headerSub}>{shortId}</Text>
          </View>
          <TouchableOpacity style={styles.shareBtn}>
            <Text style={styles.shareIcon}>⤴</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: status.bg }]}>
          <View style={styles.statusLeft}>
            <Text style={styles.statusEmoji}>{status.emoji}</Text>
            <View>
              <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
              <Text style={styles.statusEta}>
                Placed: <Text style={{ fontWeight: "700", color: "#111827" }}>{formatDate(order.created_at)}</Text>
              </Text>
            </View>
          </View>
          {order.delivery_method && (
            <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
              <Text style={styles.statusBadgeText}>{order.delivery_method}</Text>
            </View>
          )}
        </View>

        {/* Map placeholder */}
        <View style={styles.mapWrap}>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapEmoji}>🗺️</Text>
            <Text style={styles.mapText}>Live map tracking</Text>
            <Text style={styles.mapSub}>Coming soon</Text>
          </View>
          <View style={styles.mapPin}>
            <View style={styles.mapPinBubble}>
              <Text style={styles.mapPinText}>📍 Your location</Text>
            </View>
          </View>
          <View style={styles.mapDriverPin}>
            <View style={[styles.mapPinBubble, { backgroundColor: "#2563eb" }]}>
              <Text style={[styles.mapPinText, { color: "#fff" }]}>🚚 Driver</Text>
            </View>
          </View>
        </View>

        {/* Order ID box */}
        <View style={styles.trackingBox}>
          <View style={styles.trackingLeft}>
            <Text style={styles.trackingLabel}>Order ID</Text>
            <Text style={styles.trackingNumber}>{shortId}</Text>
          </View>
          <TouchableOpacity style={styles.copyBtn} onPress={() => Alert.alert("Copied!", `${shortId} copied.`)}>
            <Text style={styles.copyBtnText}>Copy</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, activeTab === "tracking" && styles.tabActive]} onPress={() => setActiveTab("tracking")}>
            <Text style={[styles.tabText, activeTab === "tracking" && styles.tabTextActive]}>Tracking</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === "details" && styles.tabActive]} onPress={() => setActiveTab("details")}>
            <Text style={[styles.tabText, activeTab === "details" && styles.tabTextActive]}>Order Details</Text>
          </TouchableOpacity>
        </View>

        {/* Tracking tab */}
        {activeTab === "tracking" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Timeline</Text>
            <View style={styles.timeline}>
              {timeline.map((step, i) => (
                <TimelineStep key={step.id} step={step} isLast={i === timeline.length - 1} />
              ))}
            </View>
          </View>
        )}

        {/* Details tab */}
        {activeTab === "details" && (
          <>
            {/* Items */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Items Ordered</Text>
              {items.length === 0 ? (
                <Text style={{ fontSize: 13, color: "#9ca3af" }}>No items found</Text>
              ) : (
                items.map(item => (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={styles.itemImgWrap}>
                      {item.product?.image
                        ? <Image source={{ uri: item.product.image }} style={styles.itemImg} resizeMode="cover" />
                        : <View style={[styles.itemImg, { backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" }]}><Text>📦</Text></View>
                      }
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName} numberOfLines={2}>{item.product?.name ?? `Product ${item.product_id.slice(0, 6)}`}</Text>
                      <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                    </View>
                    <Text style={styles.itemPrice}>${(item.price * item.quantity).toLocaleString()}</Text>
                  </View>
                ))
              )}
            </View>

            {/* Delivery address */}
            {address && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Delivery Address</Text>
                <View style={styles.infoBox}>
                  {address.name && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoIcon}>👤</Text>
                      <Text style={styles.infoText}>{address.name}</Text>
                    </View>
                  )}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>📍</Text>
                    <Text style={styles.infoText}>
                      {[address.street, address.city, address.region].filter(Boolean).join(", ")}
                    </Text>
                  </View>
                  {address.phone && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoIcon}>📞</Text>
                      <Text style={styles.infoText}>{address.phone}</Text>
                    </View>
                  )}
                  {address.note && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoIcon}>📝</Text>
                      <Text style={styles.infoText}>{address.note}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Payment summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Summary</Text>
              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryVal}>${subtotal.toLocaleString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery</Text>
                  <Text style={styles.summaryVal}>{order.delivery_method ?? "—"}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total Paid</Text>
                  <Text style={styles.totalVal}>${order.total.toLocaleString()}</Text>
                </View>
              </View>
            </View>

            {/* Order info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Info</Text>
              <View style={styles.infoBox}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>🗓️</Text>
                  <View>
                    <Text style={styles.infoLabel}>Order Placed</Text>
                    <Text style={styles.infoText}>{formatDate(order.created_at)}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>🔢</Text>
                  <View>
                    <Text style={styles.infoLabel}>Order ID</Text>
                    <Text style={styles.infoText}>{shortId}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>📦</Text>
                  <View>
                    <Text style={styles.infoLabel}>Status</Text>
                    <Text style={[styles.infoText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionText}>Contact Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
            <Text style={styles.actionIcon}>↩️</Text>
            <Text style={styles.actionText}>Return / Refund</Text>
          </TouchableOpacity>
          {order.status === "pending" && (
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} activeOpacity={0.8}>
              <Text style={styles.actionIcon}>✕</Text>
              <Text style={[styles.actionText, { color: "#dc2626" }]}>Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f9fafb" },
  fallbackBtn: { backgroundColor: "#111827", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
  fallbackBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  headerWrap: { backgroundColor: "#fff", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 18, color: "#374151", fontWeight: "600" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#111827" },
  headerSub: { fontSize: 12, color: "#9ca3af", marginTop: 1 },
  shareBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  shareIcon: { fontSize: 16, color: "#374151" },
  statusBanner: { marginHorizontal: 16, marginTop: 14, marginBottom: 4, borderRadius: 20, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statusLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  statusEmoji: { fontSize: 32 },
  statusLabel: { fontSize: 16, fontWeight: "800", marginBottom: 2 },
  statusEta: { fontSize: 12, color: "#6b7280" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusBadgeText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  mapWrap: { marginHorizontal: 16, marginTop: 12, height: 180, borderRadius: 20, overflow: "hidden", position: "relative" },
  mapPlaceholder: { flex: 1, backgroundColor: "#e5e7eb", alignItems: "center", justifyContent: "center", gap: 6 },
  mapEmoji: { fontSize: 36 },
  mapText: { fontSize: 14, fontWeight: "700", color: "#374151" },
  mapSub: { fontSize: 11, color: "#9ca3af" },
  mapPin: { position: "absolute", bottom: 20, left: 20 },
  mapDriverPin: { position: "absolute", top: 24, right: 24 },
  mapPinBubble: { backgroundColor: "#fff", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 4 },
  mapPinText: { fontSize: 12, fontWeight: "700", color: "#111827" },
  trackingBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 16, marginTop: 12, backgroundColor: "#fff", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#f3f4f6" },
  trackingLeft: { gap: 2 },
  trackingLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "500" },
  trackingNumber: { fontSize: 14, fontWeight: "700", color: "#111827" },
  copyBtn: { backgroundColor: "#f3f4f6", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  copyBtnText: { fontSize: 12, fontWeight: "700", color: "#374151" },
  tabs: { flexDirection: "row", marginHorizontal: 16, marginTop: 16, backgroundColor: "#f3f4f6", borderRadius: 14, padding: 4 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: "600", color: "#9ca3af" },
  tabTextActive: { color: "#111827" },
  section: { backgroundColor: "#fff", marginTop: 10, paddingHorizontal: 16, paddingVertical: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 16 },
  timeline: { paddingLeft: 4 },
  timelineRow: { flexDirection: "row", gap: 14 },
  timelineLeft: { alignItems: "center", width: 24 },
  timelineDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: "#e5e7eb", backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  timelineDotDone: { backgroundColor: "#f97316", borderColor: "#f97316" },
  timelineDotActive: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  timelineDotCheck: { fontSize: 12, color: "#fff", fontWeight: "800" },
  timelineDotPulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#2563eb" },
  timelineLine: { width: 2, flex: 1, backgroundColor: "#e5e7eb", marginTop: 4 },
  timelineLineDone: { backgroundColor: "#f97316" },
  timelineContent: { flex: 1, paddingTop: 2 },
  timelineLabel: { fontSize: 14, fontWeight: "600", color: "#9ca3af" },
  timelineLabelDone: { color: "#374151" },
  timelineLabelActive: { color: "#111827", fontWeight: "800" },
  timelineSub: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  timelineSubActive: { color: "#2563eb", fontWeight: "600" },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#f3f4f6" },
  itemImgWrap: { width: 60, height: 60, borderRadius: 12, overflow: "hidden", backgroundColor: "#f3f4f6" },
  itemImg: { width: "100%", height: "100%" },
  itemName: { fontSize: 13, fontWeight: "600", color: "#111827", lineHeight: 18 },
  itemQty: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: "800", color: "#111827" },
  infoBox: { gap: 12 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  infoIcon: { fontSize: 15, width: 22, textAlign: "center", marginTop: 1 },
  infoLabel: { fontSize: 11, color: "#9ca3af", marginBottom: 1 },
  infoText: { fontSize: 13, color: "#374151", fontWeight: "500", flex: 1, lineHeight: 18 },
  summaryBox: { gap: 10 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 13, color: "#6b7280" },
  summaryVal: { fontSize: 13, fontWeight: "600", color: "#111827" },
  summaryDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#e5e7eb" },
  totalLabel: { fontSize: 15, fontWeight: "800", color: "#111827" },
  totalVal: { fontSize: 18, fontWeight: "800", color: "#111827" },
  actions: { flexDirection: "row", gap: 8, marginHorizontal: 16, marginTop: 10, marginBottom: 10 },
  actionBtn: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#fff", borderRadius: 16, paddingVertical: 14, borderWidth: 1, borderColor: "#f3f4f6", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  actionBtnDanger: { borderColor: "#fee2e2", backgroundColor: "#fff5f5" },
  actionIcon: { fontSize: 20 },
  actionText: { fontSize: 11, fontWeight: "600", color: "#374151", textAlign: "center" },
});