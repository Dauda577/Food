import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Image, StatusBar, TextInput, Modal, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useOrders } from "../../context/OrdersContext";
import { useCart } from "../../context/CartContext";

const { width } = Dimensions.get("window");

// ── Mock cart fallback (replace with CartContext items when connected) ─────────
type CartItem = { id: string; name: string; price: number; quantity: number; image: string };

const DELIVERY_OPTIONS = [
  { id: "standard", label: "Standard",  sub: "3–5 business days", price: 10,  icon: "📦" },
  { id: "express",  label: "Express",   sub: "1–2 business days", price: 25,  icon: "⚡" },
  { id: "pickup",   label: "Pickup",    sub: "Ready today",       price: 0,   icon: "🏪" },
];

const PAYMENT_METHODS = [
  { id: "card",   label: "Credit / Debit Card", icon: "💳", sub: "Visa, Mastercard, Verve" },
  { id: "momo",   label: "Mobile Money",        icon: "📱", sub: "MTN, Telecel, AirtelTigo" },
  { id: "paypal", label: "PayPal",              icon: "🅿️", sub: "Pay via PayPal balance" },
  { id: "cod",    label: "Cash on Delivery",    icon: "💵", sub: "Pay when you receive" },
];

const PROMO_CODES: Record<string, number> = { SAVE10: 10, FIRST20: 20, DEAL15: 15 };

const StepBar = ({ step }: { step: number }) => {
  const steps = ["Address", "Payment", "Review"];
  return (
    <View style={styles.stepBar}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, i < step && styles.stepCircleDone, i === step && styles.stepCircleActive]}>
              <Text style={[styles.stepNum, (i <= step) && styles.stepNumActive]}>{i < step ? "✓" : i + 1}</Text>
            </View>
            <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{s}</Text>
          </View>
          {i < steps.length - 1 && <View style={[styles.stepLine, i < step && styles.stepLineDone]} />}
        </React.Fragment>
      ))}
    </View>
  );
};

const Field = ({ label, placeholder, value, onChangeText, keyboardType, multiline, numberOfLines }: {
  label: string; placeholder: string; value: string; onChangeText: (v: string) => void;
  keyboardType?: any; multiline?: boolean; numberOfLines?: number;
}) => (
  <View>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.inputMulti]}
      placeholder={placeholder} placeholderTextColor="#9ca3af"
      value={value} onChangeText={onChangeText}
      keyboardType={keyboardType ?? "default"}
      multiline={multiline} numberOfLines={numberOfLines}
    />
  </View>
);

export default function CheckoutScreen() {
  const router = useRouter();
  const { placeOrder } = useOrders();

  // Use mock items — swap for useCart().items when CartContext has product IDs
  const CART_ITEMS: CartItem[] = [
    { id: "1", name: "iPhone 15 Pro Max", price: 1099, quantity: 1, image: "https://images.unsplash.com/photo-1697565975749-4d4948a3b37e?w=200" },
    { id: "2", name: "Nike Air Max 270",  price: 150,  quantity: 2, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200" },
  ];

  const [step,          setStep]          = useState(0);
  const [address,       setAddress]       = useState({ firstName: "", lastName: "", phone: "", street: "", city: "", region: "", note: "" });
  const [delivery,      setDelivery]      = useState("standard");
  const [payment,       setPayment]       = useState("card");
  const [cardNumber,    setCardNumber]    = useState("");
  const [cardName,      setCardName]      = useState("");
  const [cardExpiry,    setCardExpiry]    = useState("");
  const [cardCVV,       setCardCVV]       = useState("");
  const [momoNumber,    setMomoNumber]    = useState("");
  const [momoNetwork,   setMomoNetwork]   = useState("MTN");
  const [promoInput,    setPromoInput]    = useState("");
  const [promoApplied,  setPromoApplied]  = useState("");
  const [promoError,    setPromoError]    = useState("");
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [orderPlaced,   setOrderPlaced]   = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [loading,       setLoading]       = useState(false);

  const selectedDelivery = DELIVERY_OPTIONS.find(d => d.id === delivery)!;
  const subtotal    = CART_ITEMS.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount    = promoApplied ? Math.round(subtotal * (PROMO_CODES[promoApplied] / 100)) : 0;
  const deliveryFee = selectedDelivery.price;
  const total       = subtotal - discount + deliveryFee;
  const itemCount   = CART_ITEMS.reduce((s, i) => s + i.quantity, 0);

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (PROMO_CODES[code]) { setPromoApplied(code); setPromoError(""); }
    else { setPromoError("Invalid promo code"); setPromoApplied(""); }
  };

  const validateAddress = () => {
    const { firstName, lastName, phone, street, city, region } = address;
    return firstName && lastName && phone && street && city && region;
  };

  const validatePayment = () => {
    if (payment === "card") return cardNumber && cardName && cardExpiry && cardCVV;
    if (payment === "momo") return momoNumber;
    return true;
  };

  const handleNext = () => {
    if (step === 0 && !validateAddress()) { Alert.alert("Missing Info", "Please fill in all required fields."); return; }
    if (step === 1 && !validatePayment()) { Alert.alert("Missing Info", "Please complete your payment details."); return; }
    if (step === 2) { setShowConfirm(true); return; }
    setStep(s => s + 1);
  };

  // ── Place real order ──────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    setShowConfirm(false);
    setLoading(true);

    const { orderId, error } = await placeOrder({
      items: CART_ITEMS.map(i => ({
        product_id: i.id,
        quantity: i.quantity,
        price: i.price,
      })),
      total,
      deliveryMethod: selectedDelivery.label,
      deliveryAddress: {
        name:   `${address.firstName} ${address.lastName}`,
        street: address.street,
        city:   address.city,
        region: address.region,
        phone:  address.phone,
        note:   address.note,
      },
    });

    setLoading(false);

    if (error) {
      Alert.alert("Order failed", error);
      return;
    }

    setPlacedOrderId(orderId);
    setOrderPlaced(true);
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (orderPlaced) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: "center", alignItems: "center" }]} edges={["top", "bottom"]}>
        <View style={styles.successWrap}>
          <View style={styles.successCircle}>
            <Text style={styles.successEmoji}>🎉</Text>
          </View>
          <Text style={styles.successTitle}>Order Placed!</Text>
          <Text style={styles.successSub}>Your order has been confirmed and will be on its way soon.</Text>
          {placedOrderId && (
            <View style={styles.orderIdBox}>
              <Text style={styles.orderIdLabel}>Order ID</Text>
              <Text style={styles.orderIdVal}>{placedOrderId.slice(0, 8).toUpperCase()}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.trackBtn} onPress={() => placedOrderId ? router.replace(`/order/${placedOrderId}` as any) : router.replace("/(tabs)")} activeOpacity={0.88}>
            <Text style={styles.trackBtnText}>{placedOrderId ? "Track Order" : "Back to Home"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ordersBtn} onPress={() => router.replace("/(tabs)")} activeOpacity={0.8}>
            <Text style={styles.ordersBtnText}>Continue Shopping</Text>
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
        <TouchableOpacity style={styles.backBtn} onPress={() => step > 0 ? setStep(s => s - 1) : router.canGoBack() ? router.back() : router.replace("/(tabs)/mycart")}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 38 }} />
      </View>

      <StepBar step={step} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Step 0: Address ── */}
        {step === 0 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              <View style={styles.row}>
                <View style={{ flex: 1 }}><Field label="First Name *" placeholder="Kwame" value={address.firstName} onChangeText={t => setAddress(a => ({ ...a, firstName: t }))} /></View>
                <View style={{ flex: 1 }}><Field label="Last Name *"  placeholder="Asante" value={address.lastName}  onChangeText={t => setAddress(a => ({ ...a, lastName: t }))} /></View>
              </View>
              <Field label="Phone *"   placeholder="+233 24 000 0000" value={address.phone}  onChangeText={t => setAddress(a => ({ ...a, phone: t }))}  keyboardType="phone-pad" />
              <Field label="Street *"  placeholder="123 Main Street"  value={address.street} onChangeText={t => setAddress(a => ({ ...a, street: t }))} />
              <View style={styles.row}>
                <View style={{ flex: 1 }}><Field label="City *"   placeholder="Accra"        value={address.city}   onChangeText={t => setAddress(a => ({ ...a, city: t }))} /></View>
                <View style={{ flex: 1 }}><Field label="Region *" placeholder="Greater Accra" value={address.region} onChangeText={t => setAddress(a => ({ ...a, region: t }))} /></View>
              </View>
              <Field label="Delivery Note" placeholder="e.g. Leave at gate" value={address.note} onChangeText={t => setAddress(a => ({ ...a, note: t }))} multiline numberOfLines={3} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Method</Text>
              {DELIVERY_OPTIONS.map(opt => (
                <TouchableOpacity key={opt.id} style={[styles.optionRow, delivery === opt.id && styles.optionRowActive]} onPress={() => setDelivery(opt.id)} activeOpacity={0.8}>
                  <View style={styles.optionIcon}><Text style={{ fontSize: 20 }}>{opt.icon}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionLabel, delivery === opt.id && styles.optionLabelActive]}>{opt.label}</Text>
                    <Text style={styles.optionSub}>{opt.sub}</Text>
                  </View>
                  <Text style={[styles.optionPrice, delivery === opt.id && { color: "#f97316" }]}>{opt.price === 0 ? "Free" : `$${opt.price}`}</Text>
                  <View style={[styles.radio, delivery === opt.id && styles.radioActive]}>
                    {delivery === opt.id && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ── Step 1: Payment ── */}
        {step === 1 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              {PAYMENT_METHODS.map(pm => (
                <TouchableOpacity key={pm.id} style={[styles.optionRow, payment === pm.id && styles.optionRowActive]} onPress={() => setPayment(pm.id)} activeOpacity={0.8}>
                  <View style={styles.optionIcon}><Text style={{ fontSize: 20 }}>{pm.icon}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionLabel, payment === pm.id && styles.optionLabelActive]}>{pm.label}</Text>
                    <Text style={styles.optionSub}>{pm.sub}</Text>
                  </View>
                  <View style={[styles.radio, payment === pm.id && styles.radioActive]}>
                    {payment === pm.id && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {payment === "card" && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Card Details</Text>
                <Field label="Card Number *" placeholder="0000  0000  0000  0000" value={cardNumber} onChangeText={t => { const c = t.replace(/\D/g,"").slice(0,16); setCardNumber(c.replace(/(.{4})/g,"$1  ").trim()); }} keyboardType="number-pad" />
                <Field label="Cardholder Name *" placeholder="KWAME ASANTE" value={cardName} onChangeText={setCardName} />
                <View style={styles.row}>
                  <View style={{ flex: 1 }}><Field label="Expiry *" placeholder="MM / YY" value={cardExpiry} onChangeText={t => { const c = t.replace(/\D/g,"").slice(0,4); setCardExpiry(c.length > 2 ? `${c.slice(0,2)} / ${c.slice(2)}` : c); }} keyboardType="number-pad" /></View>
                  <View style={{ flex: 1 }}><Field label="CVV *" placeholder="•••" value={cardCVV} onChangeText={setCardCVV} keyboardType="number-pad" /></View>
                </View>
              </View>
            )}

            {payment === "momo" && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mobile Money</Text>
                <Text style={styles.inputLabel}>Network</Text>
                <View style={styles.networkRow}>
                  {["MTN", "Telecel", "AirtelTigo"].map(n => (
                    <TouchableOpacity key={n} style={[styles.networkPill, momoNetwork === n && styles.networkPillActive]} onPress={() => setMomoNetwork(n)}>
                      <Text style={[styles.networkText, momoNetwork === n && styles.networkTextActive]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Field label="MoMo Number *" placeholder="0244 000 000" value={momoNumber} onChangeText={setMomoNumber} keyboardType="phone-pad" />
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Promo Code</Text>
              <View style={styles.promoRow}>
                <TextInput style={[styles.input, styles.promoInput]} placeholder="Enter code e.g. SAVE10" placeholderTextColor="#9ca3af" autoCapitalize="characters" value={promoInput} onChangeText={t => { setPromoInput(t); setPromoError(""); }} />
                <TouchableOpacity style={styles.promoBtn} onPress={applyPromo} activeOpacity={0.85}><Text style={styles.promoBtnText}>Apply</Text></TouchableOpacity>
              </View>
              {promoApplied !== "" && (
                <View style={styles.promoSuccess}>
                  <Text style={styles.promoSuccessText}>🎉 "{promoApplied}" — {PROMO_CODES[promoApplied]}% off!</Text>
                  <TouchableOpacity onPress={() => { setPromoApplied(""); setPromoInput(""); }}><Text style={styles.promoRemove}>Remove</Text></TouchableOpacity>
                </View>
              )}
              {promoError !== "" && <Text style={styles.promoError}>❌ {promoError}</Text>}
              <View style={styles.codeHint}>
                {["SAVE10", "FIRST20", "DEAL15"].map(c => (
                  <TouchableOpacity key={c} style={styles.codePill} onPress={() => { setPromoInput(c); setPromoError(""); }}>
                    <Text style={styles.codePillText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* ── Step 2: Review ── */}
        {step === 2 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Items</Text>
              {CART_ITEMS.map(item => (
                <View key={item.id} style={styles.reviewItem}>
                  <View style={styles.reviewImgWrap}><Image source={{ uri: item.image }} style={styles.reviewImg} resizeMode="cover" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewItemName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.reviewItemQty}>Qty: {item.quantity}</Text>
                  </View>
                  <Text style={styles.reviewItemPrice}>${(item.price * item.quantity).toLocaleString()}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery To</Text>
              <View style={styles.infoBox}>
                <Text style={styles.infoName}>{address.firstName} {address.lastName}</Text>
                <Text style={styles.infoText}>{address.phone}</Text>
                <Text style={styles.infoText}>{address.street}, {address.city}, {address.region}</Text>
                {address.note ? <Text style={styles.infoNote}>📝 {address.note}</Text> : null}
                <View style={styles.infoBadge}><Text style={styles.infoBadgeText}>{selectedDelivery.icon} {selectedDelivery.label}</Text></View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment</Text>
              <View style={styles.infoBox}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Text style={{ fontSize: 22 }}>{PAYMENT_METHODS.find(p => p.id === payment)?.icon}</Text>
                  <View>
                    <Text style={styles.infoName}>{PAYMENT_METHODS.find(p => p.id === payment)?.label}</Text>
                    {payment === "card" && cardNumber && <Text style={styles.infoText}>•••• {cardNumber.slice(-4)}</Text>}
                    {payment === "momo" && momoNumber && <Text style={styles.infoText}>{momoNetwork} · {momoNumber}</Text>}
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal ({itemCount} items)</Text><Text style={styles.summaryVal}>${subtotal.toLocaleString()}</Text></View>
                {promoApplied && <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: "#16a34a" }]}>Promo ({promoApplied})</Text><Text style={[styles.summaryVal, { color: "#16a34a" }]}>−${discount}</Text></View>}
                <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Delivery</Text><Text style={styles.summaryVal}>{deliveryFee === 0 ? "Free" : `$${deliveryFee}`}</Text></View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalVal}>${total.toLocaleString()}</Text></View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom button */}
      <View style={styles.bottomBar}>
        {step === 2 && (
          <View style={styles.totalPreview}>
            <Text style={styles.totalPreviewLabel}>Total</Text>
            <Text style={styles.totalPreviewVal}>${total.toLocaleString()}</Text>
          </View>
        )}
        <TouchableOpacity style={[styles.nextBtn, loading && { opacity: 0.6 }]} onPress={handleNext} disabled={loading} activeOpacity={0.88}>
          <Text style={styles.nextBtnText}>{loading ? "Placing..." : step === 0 ? "Continue to Payment" : step === 1 ? "Review Order" : "Place Order"}</Text>
          <Text style={styles.nextBtnArrow}>{step === 2 ? "✓" : "→"}</Text>
        </TouchableOpacity>
      </View>

      {/* Confirmation modal */}
      <Modal visible={showConfirm} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm Order</Text>
            <Text style={styles.modalSub}>You're about to place an order for <Text style={{ fontWeight: "800", color: "#111827" }}>${total.toLocaleString()}</Text> via {PAYMENT_METHODS.find(p => p.id === payment)?.label}.</Text>
            <View style={styles.modalSummary}>
              {CART_ITEMS.map(item => (
                <View key={item.id} style={styles.modalItem}>
                  <Text style={styles.modalItemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.modalItemPrice}>${(item.price * item.quantity).toLocaleString()}</Text>
                </View>
              ))}
              <View style={styles.modalDivider} />
              <View style={styles.modalItem}>
                <Text style={{ fontWeight: "800", fontSize: 15, color: "#111827" }}>Total</Text>
                <Text style={{ fontWeight: "800", fontSize: 15, color: "#111827" }}>${total.toLocaleString()}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.confirmBtn} onPress={handlePlaceOrder} activeOpacity={0.88}>
              <Text style={styles.confirmBtnText}>Yes, Place Order</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowConfirm(false)}>
              <Text style={styles.cancelBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb" },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 18, color: "#374151", fontWeight: "600" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  stepBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16, backgroundColor: "#fff", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb" },
  stepItem: { alignItems: "center", gap: 4 },
  stepCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: "#e5e7eb", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  stepCircleActive: { borderColor: "#f97316", backgroundColor: "#fff7ed" },
  stepCircleDone: { borderColor: "#f97316", backgroundColor: "#f97316" },
  stepNum: { fontSize: 12, fontWeight: "700", color: "#9ca3af" },
  stepNumActive: { color: "#f97316" },
  stepLabel: { fontSize: 10, color: "#9ca3af", fontWeight: "500" },
  stepLabelActive: { color: "#f97316", fontWeight: "700" },
  stepLine: { flex: 1, height: 2, backgroundColor: "#e5e7eb", marginBottom: 14 },
  stepLineDone: { backgroundColor: "#f97316" },
  section: { backgroundColor: "#fff", marginTop: 10, paddingHorizontal: 16, paddingVertical: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 14 },
  row: { flexDirection: "row", gap: 10 },
  inputLabel: { fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#111827", backgroundColor: "#fff" },
  inputMulti: { height: 80, textAlignVertical: "top" },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1.5, borderColor: "#e5e7eb", backgroundColor: "#fff", marginBottom: 8 },
  optionRowActive: { borderColor: "#f97316", backgroundColor: "#fff7ed" },
  optionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  optionLabel: { fontSize: 14, fontWeight: "600", color: "#374151" },
  optionLabelActive: { color: "#111827" },
  optionSub: { fontSize: 11, color: "#9ca3af", marginTop: 1 },
  optionPrice: { fontSize: 14, fontWeight: "700", color: "#374151" },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#d1d5db", alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: "#f97316" },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#f97316" },
  networkRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  networkPill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: "#e5e7eb", backgroundColor: "#fff" },
  networkPillActive: { borderColor: "#f97316", backgroundColor: "#fff7ed" },
  networkText: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  networkTextActive: { color: "#f97316" },
  promoRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  promoInput: { flex: 1, marginTop: 0 },
  promoBtn: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "#111827", borderRadius: 12 },
  promoBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  promoSuccess: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f0fdf4", borderRadius: 10, padding: 10, marginTop: 8 },
  promoSuccessText: { fontSize: 12, color: "#16a34a", fontWeight: "600", flex: 1 },
  promoRemove: { fontSize: 12, color: "#ef4444", fontWeight: "700" },
  promoError: { fontSize: 12, color: "#ef4444", marginTop: 6 },
  codeHint: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" },
  codePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#e5e7eb" },
  codePillText: { fontSize: 11, fontWeight: "700", color: "#6b7280" },
  reviewItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#f3f4f6" },
  reviewImgWrap: { width: 60, height: 60, borderRadius: 10, overflow: "hidden", backgroundColor: "#f3f4f6" },
  reviewImg: { width: "100%", height: "100%" },
  reviewItemName: { fontSize: 13, fontWeight: "600", color: "#111827", lineHeight: 18 },
  reviewItemQty: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  reviewItemPrice: { fontSize: 14, fontWeight: "800", color: "#111827" },
  infoBox: { backgroundColor: "#f9fafb", borderRadius: 14, padding: 14, gap: 4, borderWidth: 1, borderColor: "#f3f4f6" },
  infoName: { fontSize: 14, fontWeight: "700", color: "#111827" },
  infoText: { fontSize: 13, color: "#6b7280" },
  infoNote: { fontSize: 12, color: "#9ca3af", fontStyle: "italic", marginTop: 2 },
  infoBadge: { alignSelf: "flex-start", marginTop: 8, backgroundColor: "#fff7ed", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  infoBadgeText: { fontSize: 11, fontWeight: "700", color: "#f97316" },
  summaryBox: { gap: 10 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 13, color: "#6b7280" },
  summaryVal: { fontSize: 13, fontWeight: "600", color: "#111827" },
  summaryDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#e5e7eb" },
  totalLabel: { fontSize: 16, fontWeight: "800", color: "#111827" },
  totalVal: { fontSize: 20, fontWeight: "800", color: "#111827" },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 32, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#e5e7eb", shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 10 },
  totalPreview: { gap: 1 },
  totalPreviewLabel: { fontSize: 11, color: "#9ca3af" },
  totalPreviewVal: { fontSize: 18, fontWeight: "800", color: "#111827" },
  nextBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#111827", borderRadius: 16, paddingVertical: 15 },
  nextBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  nextBtnArrow: { fontSize: 16, color: "#fff" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 8 },
  modalSub: { fontSize: 14, color: "#6b7280", lineHeight: 20, marginBottom: 20 },
  modalSummary: { backgroundColor: "#f9fafb", borderRadius: 16, padding: 14, gap: 8, marginBottom: 20 },
  modalItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalItemName: { fontSize: 13, color: "#374151", flex: 1, marginRight: 8 },
  modalItemPrice: { fontSize: 13, fontWeight: "600", color: "#111827" },
  modalDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#e5e7eb" },
  confirmBtn: { backgroundColor: "#111827", borderRadius: 16, paddingVertical: 16, alignItems: "center", marginBottom: 10 },
  confirmBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  cancelBtn: { alignItems: "center", paddingVertical: 10 },
  cancelBtnText: { fontSize: 14, fontWeight: "600", color: "#9ca3af" },
  successWrap: { alignItems: "center", paddingHorizontal: 32 },
  successCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  successEmoji: { fontSize: 56 },
  successTitle: { fontSize: 28, fontWeight: "800", color: "#111827", marginBottom: 12 },
  successSub: { fontSize: 15, color: "#6b7280", textAlign: "center", lineHeight: 22, marginBottom: 28 },
  orderIdBox: { backgroundColor: "#f9fafb", borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32, alignItems: "center", marginBottom: 32, borderWidth: 1, borderColor: "#e5e7eb", width: "100%" },
  orderIdLabel: { fontSize: 11, color: "#9ca3af", marginBottom: 4, fontWeight: "600" },
  orderIdVal: { fontSize: 22, fontWeight: "800", color: "#111827" },
  trackBtn: { backgroundColor: "#111827", borderRadius: 16, paddingVertical: 15, paddingHorizontal: 40, marginBottom: 12, width: "100%", alignItems: "center" },
  trackBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  ordersBtn: { borderRadius: 16, paddingVertical: 14, paddingHorizontal: 40, width: "100%", alignItems: "center", borderWidth: 1.5, borderColor: "#e5e7eb" },
  ordersBtnText: { fontSize: 15, fontWeight: "600", color: "#374151" },
});