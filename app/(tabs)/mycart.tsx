import {
  StyleSheet, Text, View, Image, ScrollView,
  TouchableOpacity, TextInput, Animated,
} from "react-native";
import React, { useState, useRef } from "react";
import {
  ArrowLeft, Trash2, Plus, Minus, Tag, CheckCircle,
  MapPin, Clock, Shield
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from '../../context/ThemeContext';

const MyCart = () => {
  const { theme } = useTheme();

  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Jumbo Burger",
      variant: "Large • Extra Cheese",
      price: 5900,
      qty: 2,
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80",
      accent: "#FF6B35",
    },
    {
      id: 2,
      name: "Margherita Pizza",
      variant: "Medium • Thin Crust",
      price: 5900,
      qty: 1,
      image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=400&q=80",
      accent: "#E63946",
    },
    {
      id: 3,
      name: "Crispy Chicken",
      variant: "6 pcs • Spicy",
      price: 4200,
      qty: 1,
      image: "https://images.unsplash.com/photo-1626082927389-6cd097cda1ec?auto=format&fit=crop&w=400&q=80",
      accent: "#F4A535",
    },
  ]);

  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState("standard");
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const updateQty = (id, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) => item.id === id ? { ...item, qty: item.qty + delta } : item)
        .filter((item) => item.qty > 0)
    );
  };

  const removeItem = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const applyPromo = () => {
    if (promoCode.trim().toUpperCase() === "SAVE10") {
      setPromoApplied(true);
      setPromoError(false);
    } else {
      setPromoApplied(false);
      setPromoError(true);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  };

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const deliveryFee = deliveryOption === "express" ? 1500 : 800;
  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal + deliveryFee - discount;

  const isEmpty = cartItems.length === 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]} edges={["top"]}>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBackground }]}>
        <TouchableOpacity style={styles.backBtn}>
          <ArrowLeft size={20} color={theme.textColor} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.textColor }]}>My Cart</Text>
          {!isEmpty && (
            <View style={[styles.itemCountBadge, { backgroundColor: "#FF6B35" }]}>
              <Text style={styles.itemCountText}>{cartItems.reduce((s, i) => s + i.qty, 0)}</Text>
            </View>
          )}
        </View>
        {!isEmpty && (
          <TouchableOpacity onPress={() => setCartItems([])}>
            <Text style={[styles.clearText, { color: "#FF6B35" }]}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      {isEmpty ? (
        <View style={[styles.emptyWrap, { backgroundColor: theme.backgroundColor }]}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyEmoji}>🛒</Text>
          </View>
          <Text style={[styles.emptyTitle, { color: theme.textColor }]}>Your cart is empty</Text>
          <Text style={[styles.emptySub, { color: theme.subTextColor }]}>Add some delicious items{"\n"}to get started!</Text>
          <TouchableOpacity style={styles.browseBtn}>
            <Text style={styles.browseBtnText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Delivery Address */}
          <View style={[styles.addressCard, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.addressLeft}>
              <View style={styles.addressIconWrap}>
                <MapPin size={16} color="#FF6B35" />
              </View>
              <View>
                <Text style={[styles.addressLabel, { color: theme.subTextColor }]}>Delivering to</Text>
                <Text style={[styles.addressText, { color: theme.textColor }]}>123 Kwame Nkrumah Ave, Kumasi</Text>
              </View>
            </View>
            <TouchableOpacity>
              <Text style={[styles.changeText, { color: "#FF6B35" }]}>Change</Text>
            </TouchableOpacity>
          </View>

          {/* Cart Items */}
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Order Items</Text>
          {cartItems.map((item) => (
            <View key={item.id} style={[styles.cartCard, { backgroundColor: theme.cardBackground }]}>
              <View style={[styles.accentBar, { backgroundColor: item.accent }]} />
              <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
              <View style={styles.itemDetails}>
                <View style={styles.itemTopRow}>
                  <Text style={[styles.itemName, { color: theme.textColor }]}>{item.name}</Text>
                  <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
                    <Trash2 size={14} color={item.accent} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.itemVariant, { color: theme.subTextColor }]}>{item.variant}</Text>
                <View style={styles.itemBottomRow}>
                  <Text style={[styles.itemPrice, { color: item.accent }]}>{(item.price * item.qty).toLocaleString()} C</Text>
                  <View style={styles.qtyControls}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, -1)}>
                      <Minus size={12} color={item.accent} />
                    </TouchableOpacity>
                    <Text style={[styles.qtyText, { color: theme.textColor }]}>{item.qty}</Text>
                    <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnFilled]} onPress={() => updateQty(item.id, 1)}>
                      <Plus size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}

          {/* Delivery Option */}
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Delivery Option</Text>
          <View style={styles.deliveryRow}>
            {["standard", "express"].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.deliveryCard,
                  deliveryOption === opt && styles.deliveryCardActive,
                  { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }
                ]}
                onPress={() => setDeliveryOption(opt)}
              >
                <View style={styles.deliveryIconWrap}>
                  {opt === "standard" ? <Clock size={18} color={deliveryOption === opt ? "#FF6B35" : "#aaa"} /> : <Text style={{ fontSize: 18 }}>⚡</Text>}
                </View>
                <Text style={[styles.deliveryType, deliveryOption === opt && styles.deliveryTypeActive, { color: theme.textColor }]}>
                  {opt === "standard" ? "Standard" : "Express"}
                </Text>
                <Text style={styles.deliveryTime}>{opt === "standard" ? "30–45 min" : "15–20 min"}</Text>
                <Text style={[styles.deliveryPrice, deliveryOption === opt && styles.deliveryPriceActive]}>
                  {opt === "standard" ? "800 C" : "1,500 C"}
                </Text>
                {deliveryOption === opt && <View style={styles.selectedDot} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Promo Code */}
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Promo Code</Text>
          <Animated.View style={[styles.promoBox, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.promoInputRow}>
              <Tag size={16} color={promoApplied ? "#2D6A4F" : "#aaa"} style={{ marginRight: 8 }} />
              <TextInput
                value={promoCode}
                onChangeText={(t) => { setPromoCode(t); setPromoError(false); }}
                placeholder="Enter promo code"
                placeholderTextColor="#ccc"
                style={[styles.promoInput, { color: theme.textColor }]}
                autoCapitalize="characters"
                editable={!promoApplied}
              />
              {promoApplied ? (
                <View style={styles.appliedBadge}>
                  <CheckCircle size={14} color="#2D6A4F" />
                  <Text style={styles.appliedText}>Applied</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.applyBtn} onPress={applyPromo}>
                  <Text style={styles.applyBtnText}>Apply</Text>
                </TouchableOpacity>
              )}
            </View>
            {promoError && <Text style={styles.promoError}>❌ Invalid code. Try SAVE10</Text>}
            {promoApplied && <Text style={styles.promoSuccess}>🎉 10% discount applied!</Text>}
          </Animated.View>

          {/* Order Summary */}
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Order Summary</Text>
          <View style={[styles.summaryCard, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.subTextColor }]}>Subtotal</Text>
              <Text style={[styles.summaryValue, { color: theme.textColor }]}>{subtotal.toLocaleString()} C</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.subTextColor }]}>
                Delivery ({deliveryOption === "express" ? "Express" : "Standard"})
              </Text>
              <Text style={[styles.summaryValue, { color: theme.textColor }]}>{deliveryFee.toLocaleString()} C</Text>
            </View>
            {promoApplied && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: "#2D6A4F" }]}>Discount (10%)</Text>
                <Text style={[styles.summaryValue, { color: "#2D6A4F" }]}>− {discount.toLocaleString()} C</Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={[styles.totalLabel, { color: theme.textColor }]}>Total</Text>
              <Text style={[styles.totalValue, { color: "#FF6B35" }]}>{total.toLocaleString()} C</Text>
            </View>
          </View>

          {/* Trust Strip */}
          <View style={styles.trustStrip}>
            <Shield size={13} color="#aaa" />
            <Text style={[styles.trustText, { color: theme.subTextColor }]}>Secure checkout · Free cancellation within 2 min</Text>
          </View>

          {/* Checkout Button */}
          <TouchableOpacity style={styles.checkoutBtn} activeOpacity={0.88}>
            <View style={styles.checkoutLeft}>
              <Text style={styles.checkoutItemCount}>{cartItems.reduce((s, i) => s + i.qty, 0)} items</Text>
            </View>
            <Text style={styles.checkoutLabel}>Place Order</Text>
            <Text style={styles.checkoutPrice}>{total.toLocaleString()} C</Text>
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default MyCart;

// ── Styles ──
const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 20 },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 20,
    paddingTop: 8, paddingBottom: 16, gap: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  itemCountBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  itemCountText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  clearText: { fontSize: 13, fontWeight: "600" },

  // Empty
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 80 },
  emptyIconCircle: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: "center", justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#FF6B35", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 4,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: "800", marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 28 },
  browseBtn: { borderRadius: 20, paddingHorizontal: 32, paddingVertical: 14 },
  browseBtnText: { fontSize: 15, fontWeight: "700" },

  // ── Address ──
  addressCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#fff", marginHorizontal: 20, marginBottom: 8,
    borderRadius: 16, padding: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  addressLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  addressIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#FFF3EE", alignItems: "center", justifyContent: "center",
  },
  addressLabel: { fontSize: 11, color: "#aaa", marginBottom: 2 },
  addressText: { fontSize: 13, fontWeight: "700", color: "#1a1a2e" },
  changeText: { fontSize: 13, color: "#FF6B35", fontWeight: "600" },

  // ── Section Title ──
  sectionTitle: {
    fontSize: 16, fontWeight: "800", color: "#1a1a2e",
    letterSpacing: -0.3, marginHorizontal: 20,
    marginTop: 22, marginBottom: 12,
  },

  // ── Cart Items ──
  cartCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", marginHorizontal: 20, marginBottom: 12,
    borderRadius: 18, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  accentBar: { width: 4, alignSelf: "stretch" },
  itemImage: { width: 80, height: 80, margin: 12, borderRadius: 14 },
  itemDetails: { flex: 1, paddingRight: 14, paddingVertical: 12 },
  itemTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 },
  itemName: { fontSize: 14, fontWeight: "800", color: "#1a1a2e", flex: 1, marginRight: 8 },
  deleteBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#FFF3EE", alignItems: "center", justifyContent: "center",
  },
  itemVariant: { fontSize: 11, color: "#aaa", marginBottom: 10 },
  itemBottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemPrice: { fontSize: 14, fontWeight: "800", color: "#FF6B35" },
  qtyControls: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, borderColor: "#FF6B35",
    alignItems: "center", justifyContent: "center",
  },
  qtyBtnFilled: { backgroundColor: "#FF6B35", borderColor: "#FF6B35" },
  qtyText: { fontSize: 14, fontWeight: "800", color: "#1a1a2e", minWidth: 18, textAlign: "center" },

  // ── Delivery Options ──
  deliveryRow: { flexDirection: "row", paddingHorizontal: 20, gap: 12, marginBottom: 4 },
  deliveryCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 18,
    padding: 14, alignItems: "center",
    borderWidth: 2, borderColor: "#f0f0f0",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    position: "relative",
  },
  deliveryCardActive: { borderColor: "#FF6B35", backgroundColor: "#FFF8F5" },
  deliveryIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#f5f5f5", alignItems: "center", justifyContent: "center",
    marginBottom: 8,
  },
  deliveryType: { fontSize: 13, fontWeight: "800", color: "#aaa", marginBottom: 2 },
  deliveryTypeActive: { color: "#1a1a2e" },
  deliveryTime: { fontSize: 11, color: "#bbb", marginBottom: 6 },
  deliveryPrice: { fontSize: 13, fontWeight: "700", color: "#bbb" },
  deliveryPriceActive: { color: "#FF6B35" },
  selectedDot: {
    position: "absolute", top: 10, right: 10,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: "#FF6B35",
  },

  // ── Promo ──
  promoBox: {
    backgroundColor: "#fff", marginHorizontal: 20, borderRadius: 16,
    padding: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  promoInputRow: { flexDirection: "row", alignItems: "center" },
  promoInput: { flex: 1, fontSize: 14, color: "#1a1a2e", fontWeight: "600" },
  applyBtn: {
    backgroundColor: "#FF6B35", borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  applyBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  appliedBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#EFFFEF", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  appliedText: { color: "#2D6A4F", fontSize: 12, fontWeight: "700" },
  promoError: { fontSize: 12, color: "#E63946", marginTop: 8, fontWeight: "500" },
  promoSuccess: { fontSize: 12, color: "#2D6A4F", marginTop: 8, fontWeight: "500" },

  // ── Summary ──
  summaryCard: {
    backgroundColor: "#fff", marginHorizontal: 20, borderRadius: 18,
    padding: 18,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  summaryRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 12,
  },
  summaryLabel: { fontSize: 14, color: "#888", fontWeight: "500" },
  summaryValue: { fontSize: 14, color: "#1a1a2e", fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginBottom: 12 },
  totalLabel: { fontSize: 16, fontWeight: "800", color: "#1a1a2e" },
  totalValue: { fontSize: 18, fontWeight: "800", color: "#FF6B35" },

  // ── Trust ──
  trustStrip: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, marginTop: 14, marginBottom: 20,
  },
  trustText: { fontSize: 11, color: "#bbb", fontWeight: "500" },

  // ── Checkout Button ──
  checkoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#FF6B35", marginHorizontal: 20, borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 18,
    shadowColor: "#FF6B35", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 6,
  },
  checkoutLeft: {
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  checkoutItemCount: { color: "#fff", fontSize: 12, fontWeight: "700" },
  checkoutLabel: { fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
  checkoutPrice: { fontSize: 15, fontWeight: "800", color: "rgba(255,255,255,0.9)" },
});