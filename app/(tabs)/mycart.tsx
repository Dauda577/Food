import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Image, StatusBar, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCart } from "../../context/CartContext";

const { width } = Dimensions.get("window");

// Floating tab bar: height 64 + bottom 20 + breathing room 16
const TAB_BAR_HEIGHT = 64 + 20 + 16;

const DELIVERY_OPTIONS = [
  { id: "standard", label: "Standard Delivery", duration: "3–5 days",    price: 10 },
  { id: "express",  label: "Express Delivery",  duration: "1–2 days",    price: 25 },
  { id: "pickup",   label: "Store Pickup",       duration: "Ready today", price: 0  },
];

// ── Cart card ─────────────────────────────────────────────────────────────────
const CartCard = ({
  item, onIncrement, onDecrement, onRemove,
}: {
  item: { id: string; name: string; brand?: string | null; price: number; image: string | null; quantity: number };
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}) => (
  <View style={styles.card}>
    <View style={styles.cardImgWrap}>
      {item.image
        ? <Image source={{ uri: item.image }} style={styles.cardImg} resizeMode="cover" />
        : <View style={[styles.cardImg, { backgroundColor: "#f3f4f6" }]} />
      }
    </View>
    <View style={styles.cardBody}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          {item.brand && <Text style={styles.cardSeller}>{item.brand}</Text>}
          <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
        </View>
        <TouchableOpacity
          onPress={onRemove}
          style={styles.removeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.removeIcon}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.cardPrice}>${(item.price * item.quantity).toLocaleString()}</Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity style={styles.qtyBtn} onPress={onDecrement} activeOpacity={0.7}>
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyVal}>{item.quantity}</Text>
          <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnActive]} onPress={onIncrement} activeOpacity={0.7}>
            <Text style={[styles.qtyBtnText, styles.qtyBtnTextActive]}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </View>
);

// ── Screen ────────────────────────────────────────────────────────────────────
export default function CartScreen() {
  const router = useRouter();
  const { items, removeFromCart, updateQuantity, total, itemCount } = useCart();

  const [delivery,      setDelivery]      = useState("standard");
  const [promoCode,     setPromoCode]     = useState("");
  const [promoApplied,  setPromoApplied]  = useState(false);

  const selectedDelivery = DELIVERY_OPTIONS.find(d => d.id === delivery)!;
  const discount         = promoApplied ? Math.round(total * 0.1) : 0;
  const deliveryFee      = selectedDelivery.price;
  const grandTotal       = total - discount + deliveryFee;
  const checkoutBarH     = 80 + TAB_BAR_HEIGHT;

  const handleRemove = (id: string) =>
    Alert.alert("Remove Item", "Remove this item from your cart?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeFromCart(id) },
    ]);

  // ── Empty state ──────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🛍️</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Looks like you haven't added anything yet.</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.push("/(tabs)")} activeOpacity={0.85}>
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{itemCount} {itemCount === 1 ? "item" : "items"}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: checkoutBarH + 20 }}
      >
        {/* Cart items */}
        <View style={styles.section}>
          {items.map((item, i) => (
            <View key={item.id}>
              <CartCard
                item={item}
                onIncrement={() => updateQuantity(item.id, item.quantity + 1)}
                onDecrement={() => updateQuantity(item.id, item.quantity - 1)}
                onRemove={() => handleRemove(item.id)}
              />
              {i < items.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Delivery */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Method</Text>
          {DELIVERY_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.id}
              style={[styles.deliveryRow, delivery === opt.id && styles.deliveryRowActive]}
              onPress={() => setDelivery(opt.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.radio, delivery === opt.id && styles.radioActive]}>
                {delivery === opt.id && <View style={styles.radioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.deliveryLabel, delivery === opt.id && styles.deliveryLabelActive]}>
                  {opt.label}
                </Text>
                <Text style={styles.deliveryDuration}>{opt.duration}</Text>
              </View>
              <Text style={[styles.deliveryPrice, delivery === opt.id && styles.deliveryPriceActive]}>
                {opt.price === 0 ? "Free" : `$${opt.price}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Promo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promo Code</Text>
          <View style={styles.promoRow}>
            <View style={[styles.promoInput, promoApplied && styles.promoInputActive]}>
              <Text style={styles.promoTag}>🏷️</Text>
              <Text style={[styles.promoText, !promoCode && { color: "#9ca3af" }]}>
                {promoCode || "Enter promo code"}
              </Text>
              {promoApplied && <Text style={styles.promoCheck}>✓</Text>}
            </View>
            {["SAVE10", "FIRST10", "DEAL10"].map(code => (
              <TouchableOpacity
                key={code}
                style={[styles.codePill, promoCode === code && styles.codePillActive]}
                onPress={() => { setPromoCode(code); setPromoApplied(true); }}
              >
                <Text style={[styles.codePillText, promoCode === code && styles.codePillTextActive]}>
                  {code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {promoApplied && <Text style={styles.promoSuccess}>🎉 10% discount applied!</Text>}
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal ({itemCount} items)</Text>
              <Text style={styles.summaryValue}>${total.toLocaleString()}</Text>
            </View>
            {promoApplied && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: "#16a34a" }]}>Promo Discount</Text>
                <Text style={[styles.summaryValue, { color: "#16a34a" }]}>−${discount}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={styles.summaryValue}>
                {deliveryFee === 0
                  ? <Text style={{ color: "#16a34a" }}>Free</Text>
                  : `$${deliveryFee}`}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${grandTotal.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Checkout bar — sits above floating tab bar */}
      <View style={[styles.checkoutBar, { bottom: TAB_BAR_HEIGHT }]}>
        <View style={styles.checkoutLeft}>
          <Text style={styles.checkoutLabel}>Total</Text>
          <Text style={styles.checkoutTotal}>${grandTotal.toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          activeOpacity={0.88}
          onPress={() => router.push("/checkout")}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          <Text style={styles.checkoutArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#111827" },
  headerBadge: { paddingHorizontal: 10, paddingVertical: 3, backgroundColor: "#f97316", borderRadius: 20 },
  headerBadgeText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  section: { backgroundColor: "#fff", marginTop: 10, paddingHorizontal: 16, paddingVertical: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 14, letterSpacing: 0.2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#f3f4f6", marginVertical: 4 },
  card: { flexDirection: "row", gap: 12, paddingVertical: 10 },
  cardImgWrap: { width: 88, height: 88, borderRadius: 14, backgroundColor: "#f3f4f6", overflow: "hidden" },
  cardImg: { width: "100%", height: "100%" },
  cardBody: { flex: 1, justifyContent: "space-between" },
  cardTop: { flexDirection: "row", gap: 8 },
  cardSeller: { fontSize: 10, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  cardName: { fontSize: 13, fontWeight: "600", color: "#111827", lineHeight: 18 },
  removeBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  removeIcon: { fontSize: 10, color: "#6b7280", fontWeight: "700" },
  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  cardPrice: { fontSize: 16, fontWeight: "800", color: "#111827" },
  qtyRow: { flexDirection: "row", alignItems: "center" },
  qtyBtn: { width: 30, height: 30, borderRadius: 10, borderWidth: 1.5, borderColor: "#e5e7eb", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  qtyBtnActive: { backgroundColor: "#111827", borderColor: "#111827" },
  qtyBtnText: { fontSize: 16, color: "#374151", fontWeight: "500", lineHeight: 20 },
  qtyBtnTextActive: { color: "#fff" },
  qtyVal: { minWidth: 32, textAlign: "center", fontSize: 14, fontWeight: "700", color: "#111827" },
  deliveryRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1.5, borderColor: "#e5e7eb", marginBottom: 8, backgroundColor: "#fff" },
  deliveryRowActive: { borderColor: "#f97316", backgroundColor: "#fff7ed" },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#d1d5db", alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: "#f97316" },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#f97316" },
  deliveryLabel: { fontSize: 13, fontWeight: "600", color: "#374151" },
  deliveryLabelActive: { color: "#111827" },
  deliveryDuration: { fontSize: 11, color: "#9ca3af", marginTop: 1 },
  deliveryPrice: { fontSize: 13, fontWeight: "700", color: "#374151" },
  deliveryPriceActive: { color: "#f97316" },
  promoRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  promoInput: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1, minWidth: width * 0.4, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: "#e5e7eb", backgroundColor: "#f9fafb" },
  promoInputActive: { borderColor: "#16a34a", backgroundColor: "#f0fdf4" },
  promoTag: { fontSize: 14 },
  promoText: { flex: 1, fontSize: 13, fontWeight: "500", color: "#111827" },
  promoCheck: { fontSize: 13, color: "#16a34a", fontWeight: "800" },
  codePill: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: "#e5e7eb", backgroundColor: "#fff" },
  codePillActive: { borderColor: "#f97316", backgroundColor: "#fff7ed" },
  codePillText: { fontSize: 11, fontWeight: "700", color: "#6b7280" },
  codePillTextActive: { color: "#f97316" },
  promoSuccess: { fontSize: 12, color: "#16a34a", fontWeight: "600", marginTop: 8 },
  summaryBox: { backgroundColor: "#f9fafb", borderRadius: 16, padding: 16, gap: 10 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  summaryValue: { fontSize: 13, color: "#111827", fontWeight: "600" },
  summaryDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#e5e7eb", marginVertical: 2 },
  totalLabel: { fontSize: 15, fontWeight: "800", color: "#111827" },
  totalValue: { fontSize: 18, fontWeight: "800", color: "#111827" },
  checkoutBar: { position: "absolute", left: 0, right: 0, zIndex: 100, flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#e5e7eb", shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 20, gap: 14 },
  checkoutLeft: { gap: 2 },
  checkoutLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "500" },
  checkoutTotal: { fontSize: 20, fontWeight: "800", color: "#111827" },
  checkoutBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#111827", borderRadius: 16, paddingVertical: 15 },
  checkoutBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  checkoutArrow: { fontSize: 16, color: "#fff" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 64, marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: "800", color: "#111827", marginBottom: 8 },
  emptySub: { fontSize: 14, color: "#9ca3af", textAlign: "center", lineHeight: 20, marginBottom: 32 },
  shopBtn: { backgroundColor: "#111827", paddingHorizontal: 32, paddingVertical: 15, borderRadius: 16 },
  shopBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});