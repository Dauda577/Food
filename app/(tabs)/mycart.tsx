import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Image, StatusBar, Alert, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCart, CartItem } from "../../context/CartContext";

const TAB_BAR_HEIGHT = 65;

const DELIVERY_OPTIONS = [
  { id: "standard", label: "Standard Delivery", duration: "3–5 days", price: 10, icon: "cube-outline" },
  { id: "express", label: "Express Delivery", duration: "1–2 days", price: 25, icon: "flash-outline" },
  { id: "pickup", label: "Store Pickup", duration: "Ready today", price: 0, icon: "business-outline" },
];

// ── Cart Card ─────────────────────────────────────────────────────────────────
const CartCard = ({
  item, onIncrement, onDecrement, onRemove,
}: {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}) => {
  const image = item.product.images?.[0] ?? null;
  const variantLabel = item.variant?.options
    ?.map(o => `${o.name}: ${o.value}`)
    .join(" / ") ?? null;

  return (
    <View style={styles.card}>
      <View style={styles.cardImgWrap}>
        {image ? (
          <Image source={{ uri: image }} style={styles.cardImg} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImg, styles.cardImgPlaceholder]}>
            <Ionicons name="image-outline" size={28} color="#d1d5db" />
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.cardInfo}>
            {item.product.brand && (
              <View style={styles.brandBadge}>
                <Text style={styles.brandText}>{item.product.brand}</Text>
              </View>
            )}
            <Text style={styles.cardName} numberOfLines={2}>{item.product.name}</Text>
            {variantLabel && (
              <Text style={styles.variantLabel}>{variantLabel}</Text>
            )}
          </View>

          <TouchableOpacity
            onPress={onRemove}
            style={styles.removeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.priceContainer}>
            <Text style={styles.cardPrice}>
              ${(item.unitPrice * item.quantity).toLocaleString()}
            </Text>
            <Text style={styles.unitPrice}>${item.unitPrice} each</Text>
          </View>

          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={[styles.qtyBtn, item.quantity === 1 && styles.qtyBtnDisabled]}
              onPress={onDecrement}
              activeOpacity={0.7}
              disabled={item.quantity === 1}
            >
              <Ionicons name="remove" size={16} color={item.quantity === 1 ? "#d1d5db" : "#374151"} />
            </TouchableOpacity>

            <Text style={styles.qtyVal}>{item.quantity}</Text>

            <TouchableOpacity style={styles.qtyBtn} onPress={onIncrement} activeOpacity={0.7}>
              <Ionicons name="add" size={16} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────
export default function CartScreen() {
  const router = useRouter();
  const { items, removeFromCart, updateQuantity, clearCart, total, itemCount } = useCart();

  const [delivery, setDelivery] = useState("standard");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  const selectedDelivery = DELIVERY_OPTIONS.find(d => d.id === delivery)!;
  const discount = promoApplied ? Math.round(total * 0.1) : 0;
  const deliveryFee = selectedDelivery.price;
  const grandTotal = total - discount + deliveryFee;

  const handleRemove = (cartItemId: string) =>
    Alert.alert("Remove Item", "Remove this item from your cart?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeFromCart(cartItemId) },
    ]);

  const handleClearAll = () =>
    Alert.alert("Clear Cart", "Remove all items?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear All", style: "destructive", onPress: () => clearCart() },
    ]);

  const applyPromoCode = () => {
    const valid = ["SAVE10", "FIRST10", "DEAL10"];
    if (valid.includes(promoCode.toUpperCase())) {
      setPromoApplied(true);
    } else if (promoCode) {
      Alert.alert("Invalid Code", "Please enter a valid promo code");
    }
  };

  // ── Empty state ──────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="cart-outline" size={80} color="#e5e7eb" />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Looks like you haven't added anything yet.</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.push("/(tabs)")} activeOpacity={0.85}>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{itemCount}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 20 }}
      >
        {/* Cart Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cart Items</Text>
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          </View>

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
          <View style={styles.deliveryGrid}>
            {DELIVERY_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.deliveryCard, delivery === opt.id && styles.deliveryCardActive]}
                onPress={() => setDelivery(opt.id)}
                activeOpacity={0.8}
              >
                <View style={styles.deliveryIconWrap}>
                  <Ionicons
                    name={opt.icon as any}
                    size={24}
                    color={delivery === opt.id ? "#f97316" : "#6b7280"}
                  />
                </View>
                <View style={styles.deliveryInfo}>
                  <Text style={[styles.deliveryLabel, delivery === opt.id && styles.deliveryLabelActive]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.deliveryDuration}>{opt.duration}</Text>
                </View>
                <Text style={[styles.deliveryPrice, delivery === opt.id && styles.deliveryPriceActive]}>
                  {opt.price === 0 ? "Free" : `$${opt.price}`}
                </Text>
                {delivery === opt.id && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={20} color="#f97316" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Promo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promo Code</Text>
          <View style={styles.promoContainer}>
            <View style={styles.promoInputWrap}>
              <Ionicons name="pricetag-outline" size={20} color="#9ca3af" />
              <TextInput
                style={styles.promoInput}
                placeholder="Enter promo code"
                placeholderTextColor="#9ca3af"
                value={promoCode}
                onChangeText={setPromoCode}
                editable={!promoApplied}
                autoCapitalize="characters"
              />
              {promoApplied && (
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
              )}
            </View>
            <TouchableOpacity
              style={[styles.applyBtn, promoApplied && styles.applyBtnDisabled]}
              onPress={applyPromoCode}
              disabled={promoApplied}
            >
              <Text style={styles.applyBtnText}>{promoApplied ? "Applied" : "Apply"}</Text>
            </TouchableOpacity>
          </View>

          {!promoApplied && (
            <View style={styles.suggestedCodes}>
              <Text style={styles.suggestedLabel}>Try:</Text>
              {["SAVE10", "FIRST10", "DEAL10"].map(code => (
                <TouchableOpacity
                  key={code}
                  style={styles.codePill}
                  onPress={() => { setPromoCode(code); setPromoApplied(true); }}
                >
                  <Text style={styles.codePillText}>{code}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {promoApplied && (
            <View style={styles.promoSuccess}>
              <Ionicons name="gift" size={16} color="#16a34a" />
              <Text style={styles.promoSuccessText}>10% discount applied successfully!</Text>
            </View>
          )}
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryLabelWrap}>
                <Ionicons name="cube-outline" size={16} color="#6b7280" />
                <Text style={styles.summaryLabel}>Subtotal ({itemCount} items)</Text>
              </View>
              <Text style={styles.summaryValue}>${total.toLocaleString()}</Text>
            </View>

            {promoApplied && (
              <View style={styles.summaryRow}>
                <View style={styles.summaryLabelWrap}>
                  <Ionicons name="pricetag-outline" size={16} color="#16a34a" />
                  <Text style={[styles.summaryLabel, { color: "#16a34a" }]}>Discount</Text>
                </View>
                <Text style={[styles.summaryValue, { color: "#16a34a" }]}>-${discount}</Text>
              </View>
            )}

            <View style={styles.summaryRow}>
              <View style={styles.summaryLabelWrap}>
                <Ionicons name="car-outline" size={16} color="#6b7280" />
                <Text style={styles.summaryLabel}>Delivery Fee</Text>
              </View>
              <Text style={styles.summaryValue}>
                {deliveryFee === 0 ? "Free" : `$${deliveryFee}`}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryTotal}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>${grandTotal.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Checkout */}
        <View style={styles.checkoutSection}>
          <View style={styles.checkoutBar}>
            <View style={styles.checkoutLeft}>
              <Text style={styles.checkoutLabel}>Total to Pay</Text>
              <Text style={styles.checkoutTotal}>${grandTotal.toLocaleString()}</Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutBtn}
              activeOpacity={0.88}
              onPress={() => router.push("/checkout")}
            >
              <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 16, backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: "#f8fafc",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#0f172a", letterSpacing: -0.5 },
  headerBadge: {
    minWidth: 28, height: 28, paddingHorizontal: 8, backgroundColor: "#f97316",
    borderRadius: 14, alignItems: "center", justifyContent: "center",
  },
  headerBadgeText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  section: {
    backgroundColor: "#fff", marginTop: 12,
    paddingHorizontal: 16, paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a", letterSpacing: -0.3 },
  clearText: { fontSize: 13, fontWeight: "600", color: "#ef4444" },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 12 },
  card: { flexDirection: "row", gap: 14, paddingVertical: 12 },
  cardImgWrap: {
    width: 100, height: 100, borderRadius: 16, backgroundColor: "#f8fafc",
    overflow: "hidden", borderWidth: 1, borderColor: "#f1f5f9",
  },
  cardImg: { width: "100%", height: "100%" },
  cardImgPlaceholder: { alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1, justifyContent: "space-between" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  cardInfo: { flex: 1 },
  brandBadge: {
    backgroundColor: "#f1f5f9", paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 6, alignSelf: "flex-start", marginBottom: 4,
  },
  brandText: { fontSize: 9, fontWeight: "600", color: "#64748b", letterSpacing: 0.5 },
  cardName: { fontSize: 14, fontWeight: "600", color: "#0f172a", lineHeight: 20, letterSpacing: -0.3 },
  variantLabel: { fontSize: 11, color: "#64748b", marginTop: 4, fontWeight: "500" },
  removeBtn: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: "#fef2f2",
    alignItems: "center", justifyContent: "center",
  },
  cardBottom: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 8 },
  priceContainer: { gap: 2 },
  cardPrice: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  unitPrice: { fontSize: 11, color: "#94a3b8", fontWeight: "500" },
  qtyRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 12, padding: 4 },
  qtyBtn: {
    width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center",
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0",
  },
  qtyBtnDisabled: { opacity: 0.5 },
  qtyVal: { minWidth: 36, textAlign: "center", fontSize: 15, fontWeight: "700", color: "#0f172a" },
  deliveryGrid: { gap: 12 },
  deliveryCard: {
    flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16,
    borderWidth: 1.5, borderColor: "#e2e8f0", backgroundColor: "#fff", position: "relative",
  },
  deliveryCardActive: { borderColor: "#f97316", backgroundColor: "#fff7ed" },
  deliveryIconWrap: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: "#f8fafc",
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  deliveryInfo: { flex: 1, gap: 2 },
  deliveryLabel: { fontSize: 14, fontWeight: "600", color: "#334155" },
  deliveryLabelActive: { color: "#0f172a" },
  deliveryDuration: { fontSize: 12, color: "#94a3b8" },
  deliveryPrice: { fontSize: 15, fontWeight: "700", color: "#334155" },
  deliveryPriceActive: { color: "#f97316" },
  checkmark: { position: "absolute", top: 12, right: 12 },
  promoContainer: { flexDirection: "row", gap: 12, marginBottom: 12 },
  promoInputWrap: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, backgroundColor: "#f8fafc", borderRadius: 14,
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  promoInput: { flex: 1, fontSize: 14, fontWeight: "500", color: "#0f172a", paddingVertical: 14 },
  applyBtn: { paddingHorizontal: 20, backgroundColor: "#0f172a", borderRadius: 14, alignItems: "center", justifyContent: "center" },
  applyBtnDisabled: { backgroundColor: "#cbd5e1" },
  applyBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  suggestedCodes: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  suggestedLabel: { fontSize: 12, fontWeight: "600", color: "#64748b" },
  codePill: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#f1f5f9", borderRadius: 8 },
  codePillText: { fontSize: 11, fontWeight: "700", color: "#475569", letterSpacing: 0.5 },
  promoSuccess: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, padding: 12, backgroundColor: "#f0fdf4", borderRadius: 12 },
  promoSuccessText: { fontSize: 12, fontWeight: "600", color: "#16a34a" },
  summaryCard: { backgroundColor: "#f8fafc", borderRadius: 20, padding: 20, gap: 14 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabelWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  summaryLabel: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  summaryValue: { fontSize: 14, color: "#0f172a", fontWeight: "600" },
  summaryDivider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 4 },
  summaryTotal: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  totalValue: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  checkoutSection: {
    backgroundColor: "#fff", marginTop: 12, paddingHorizontal: 16, paddingVertical: 20,
    borderTopWidth: 1, borderTopColor: "#f1f5f9",
  },
  checkoutBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  checkoutLeft: { gap: 4 },
  checkoutLabel: { fontSize: 12, color: "#94a3b8", fontWeight: "500" },
  checkoutTotal: { fontSize: 24, fontWeight: "800", color: "#0f172a" },
  checkoutBtn: {
    flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0f172a",
    borderRadius: 16, paddingHorizontal: 24, paddingVertical: 16,
  },
  checkoutBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, backgroundColor: "#fff" },
  emptyIconContainer: {
    width: 140, height: 140, borderRadius: 70, backgroundColor: "#f8fafc",
    alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  emptyTitle: { fontSize: 24, fontWeight: "800", color: "#0f172a", marginBottom: 8, letterSpacing: -0.5 },
  emptySub: { fontSize: 15, color: "#64748b", textAlign: "center", lineHeight: 22, marginBottom: 32 },
  shopBtn: {
    backgroundColor: "#0f172a", paddingHorizontal: 32, paddingVertical: 16,
    borderRadius: 16, flexDirection: "row", alignItems: "center", gap: 8,
  },
  shopBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});