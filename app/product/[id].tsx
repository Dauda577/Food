import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Image, StatusBar, FlatList, ActivityIndicator,
  NativeSyntheticEvent, NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useProducts, Product } from "../../context/ProductsContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";

const { width } = Dimensions.get("window");

// ── Mock reviews (until reviews table is created) ─────────────────────────────
const MOCK_REVIEWS: Record<string, any[]> = {
  default: [
    { id: "r1", user: "Kwame A.", rating: 5, date: "Feb 2025", comment: "Excellent product, exactly as described. Fast delivery too!" },
    { id: "r2", user: "Ama S.",  rating: 4, date: "Jan 2025", comment: "Very good quality. Would definitely buy again." },
    { id: "r3", user: "Kojo M.", rating: 5, date: "Dec 2024", comment: "Great value for money. Highly recommend!" },
  ],
};

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  New:  { bg: "#dcfce7", text: "#16a34a" },
  Sale: { bg: "#fee2e2", text: "#dc2626" },
  Hot:  { bg: "#ffedd5", text: "#ea580c" },
};

const Stars = ({ rating, size = 13 }: { rating: number; size?: number }) => (
  <View style={{ flexDirection: "row", gap: 1 }}>
    {[1, 2, 3, 4, 5].map(n => (
      <Text key={n} style={{ fontSize: size, color: n <= Math.round(rating) ? "#f59e0b" : "#e5e7eb" }}>★</Text>
    ))}
  </View>
);

export default function ProductDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { fetchProductById } = useProducts();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [product,      setProduct]      = useState<Product | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [imgIndex,     setImgIndex]     = useState(0);
  const [selectedColor, setColor]       = useState<string | null>(null);
  const [selectedOption, setOption]     = useState<string | null>(null);
  const [quantity,     setQuantity]     = useState(1);
  const [addedToCart,  setAddedToCart]  = useState(false);
  const [activeTab,    setActiveTab]    = useState<"details" | "reviews">("details");

  // Fetch real product from Supabase
  useEffect(() => {
    if (!id) return;
    fetchProductById(id).then(data => {
      setProduct(data);
      setLoading(false);
    });
  }, [id]);

  const wishlisted = product ? isWishlisted(product.id) : false;
  const reviews    = MOCK_REVIEWS["default"];

  const handleAddToCart = () => {
    if (!product) return;
    // Add to cart `quantity` times
    for (let i = 0; i < quantity; i++) addToCart(product);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleImgScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setImgIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.root, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={{ marginTop: 12, fontSize: 14, color: "#9ca3af" }}>Loading product...</Text>
      </View>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!product) {
    return (
      <SafeAreaView style={[styles.root, { alignItems: "center", justifyContent: "center" }]} edges={["top"]}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>😕</Text>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>Product not found</Text>
        <TouchableOpacity style={styles.backBtnFallback} onPress={() => router.back()}>
          <Text style={styles.backBtnFallbackText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null;

  // Build images array — use product.image as single image for now
  const images = product.image ? [product.image] : [];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Image carousel ── */}
        <View style={[styles.imgCarousel, images.length === 0 && { backgroundColor: "#f3f4f6" }]}>
          {images.length > 0 ? (
            <FlatList
              data={images}
              keyExtractor={(_, i) => String(i)}
              horizontal pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleImgScroll}
              scrollEventThrottle={16}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.heroImg} resizeMode="cover" />
              )}
            />
          ) : (
            <View style={styles.heroImgPlaceholder}>
              <Text style={{ fontSize: 48 }}>📦</Text>
            </View>
          )}

          {/* Top bar */}
          <SafeAreaView style={styles.imgTopBar} edges={["top"]}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
              <Text style={styles.iconBtnText}>←</Text>
            </TouchableOpacity>
            <View style={styles.imgTopRight}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => product && toggleWishlist(product)}>
                <Text style={[styles.iconBtnText, wishlisted && { color: "#ef4444" }]}>
                  {wishlisted ? "♥" : "♡"}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Badge */}
          {product.badge && BADGE_COLORS[product.badge] && (
            <View style={[styles.heroBadge, { backgroundColor: BADGE_COLORS[product.badge].bg }]}>
              <Text style={[styles.heroBadgeText, { color: BADGE_COLORS[product.badge].text }]}>
                {product.badge}
              </Text>
            </View>
          )}

          {/* Dots */}
          {images.length > 1 && (
            <View style={styles.imgDots}>
              {images.map((_, i) => (
                <View key={i} style={[styles.dot, i === imgIndex && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>

        {/* ── Product info ── */}
        <View style={styles.infoCard}>
          <View style={styles.infoTopRow}>
            <Text style={styles.categoryTag}>{product.category}</Text>
            <View style={[styles.stockBadge, { backgroundColor: product.in_stock ? "#dcfce7" : "#fee2e2" }]}>
              <Text style={[styles.stockText, { color: product.in_stock ? "#16a34a" : "#dc2626" }]}>
                {product.in_stock ? "In Stock" : "Out of Stock"}
              </Text>
            </View>
          </View>

          <Text style={styles.productName}>{product.name}</Text>
          {product.brand && <Text style={styles.brandText}>{product.brand}</Text>}

          <View style={styles.ratingRow}>
            <Stars rating={product.rating} />
            <Text style={styles.ratingVal}>{product.rating}</Text>
            <Text style={styles.ratingCount}>({product.review_count.toLocaleString()} reviews)</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>${product.price.toLocaleString()}</Text>
            {product.original_price && (
              <Text style={styles.originalPrice}>${product.original_price.toLocaleString()}</Text>
            )}
            {discount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{discount}% OFF</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Quantity ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <Text style={styles.sectionSub}>Total: ${(product.price * quantity).toLocaleString()}</Text>
          </View>
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={[styles.qtyBtn, quantity <= 1 && styles.qtyBtnDisabled]}
              onPress={() => setQuantity(q => Math.max(1, q - 1))}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyVal}>{quantity}</Text>
            <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnActive]} onPress={() => setQuantity(q => q + 1)}>
              <Text style={[styles.qtyBtnText, { color: "#fff" }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Details / Reviews tabs ── */}
        <View style={styles.section}>
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "details" && styles.tabActive]}
              onPress={() => setActiveTab("details")}
            >
              <Text style={[styles.tabText, activeTab === "details" && styles.tabTextActive]}>Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "reviews" && styles.tabActive]}
              onPress={() => setActiveTab("reviews")}
            >
              <Text style={[styles.tabText, activeTab === "reviews" && styles.tabTextActive]}>
                Reviews ({reviews.length})
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === "details" ? (
            <View style={styles.tabContent}>
              <View style={styles.detailsGrid}>
                {product.brand && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Brand</Text>
                    <Text style={styles.detailValue}>{product.brand}</Text>
                  </View>
                )}
                {product.category && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Category</Text>
                    <Text style={styles.detailValue}>{product.category}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Rating</Text>
                  <Text style={styles.detailValue}>{product.rating} / 5.0</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reviews</Text>
                  <Text style={styles.detailValue}>{product.review_count.toLocaleString()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Availability</Text>
                  <Text style={[styles.detailValue, { color: product.in_stock ? "#16a34a" : "#dc2626" }]}>
                    {product.in_stock ? "In Stock" : "Out of Stock"}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.tabContent}>
              <View style={styles.ratingBig}>
                <Text style={styles.ratingBigNum}>{product.rating}</Text>
                <Stars rating={product.rating} size={18} />
                <Text style={styles.ratingBigCount}>{product.review_count.toLocaleString()} reviews</Text>
              </View>
              {reviews.map(r => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewTop}>
                    <View style={styles.reviewAvatar}>
                      <Text style={styles.reviewAvatarText}>{r.user[0]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewUser}>{r.user}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Stars rating={r.rating} size={11} />
                        <Text style={styles.reviewDate}>{r.date}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{r.comment}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>

      {/* ── Bottom bar ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.wishlistBtn}
          onPress={() => product && toggleWishlist(product)}
        >
          <Text style={[styles.wishlistIcon, wishlisted && { color: "#ef4444" }]}>
            {wishlisted ? "♥" : "♡"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addToCartBtn, addedToCart && styles.addedBtn, !product.in_stock && styles.disabledBtn]}
          onPress={handleAddToCart}
          disabled={!product.in_stock}
          activeOpacity={0.88}
        >
          <Text style={styles.addToCartText}>
            {!product.in_stock ? "Out of Stock" : addedToCart ? "✓  Added to Cart!" : "Add to Cart"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buyNowBtn, !product.in_stock && styles.disabledBtn]}
          disabled={!product.in_stock}
          onPress={() => { handleAddToCart(); router.push("/checkout"); }}
          activeOpacity={0.88}
        >
          <Text style={styles.buyNowText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f9fafb" },
  backBtnFallback: { marginTop: 20, backgroundColor: "#111827", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backBtnFallbackText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  imgCarousel: { width, height: width * 1.0, backgroundColor: "#111" },
  heroImg: { width, height: width * 1.0 },
  heroImgPlaceholder: { width, height: width * 1.0, alignItems: "center", justifyContent: "center" },
  imgTopBar: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 8, zIndex: 10 },
  imgTopRight: { flexDirection: "row", gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" },
  iconBtnText: { fontSize: 18, color: "#fff", fontWeight: "600" },
  heroBadge: { position: "absolute", bottom: 52, left: 16, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  heroBadgeText: { fontSize: 11, fontWeight: "800" },
  imgDots: { position: "absolute", bottom: 16, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.4)" },
  dotActive: { width: 20, backgroundColor: "#fff" },
  infoCard: { backgroundColor: "#fff", marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 6 },
  infoTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  categoryTag: { fontSize: 11, fontWeight: "700", color: "#f97316", backgroundColor: "#fff7ed", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, overflow: "hidden" },
  stockBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  stockText: { fontSize: 11, fontWeight: "700" },
  productName: { fontSize: 20, fontWeight: "800", color: "#111827", lineHeight: 26, marginBottom: 3 },
  brandText: { fontSize: 13, color: "#9ca3af", marginBottom: 10, fontWeight: "500" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  ratingVal: { fontSize: 13, fontWeight: "700", color: "#111827" },
  ratingCount: { fontSize: 12, color: "#9ca3af" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 6 },
  price: { fontSize: 26, fontWeight: "800", color: "#111827" },
  originalPrice: { fontSize: 16, color: "#9ca3af", textDecorationLine: "line-through" },
  discountBadge: { backgroundColor: "#fee2e2", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  discountText: { fontSize: 12, fontWeight: "800", color: "#dc2626" },
  section: { backgroundColor: "#fff", marginTop: 8, paddingHorizontal: 16, paddingVertical: 14 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  sectionSub: { fontSize: 14, fontWeight: "700", color: "#f97316" },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 0 },
  qtyBtn: { width: 36, height: 36, borderRadius: 12, borderWidth: 1.5, borderColor: "#e5e7eb", alignItems: "center", justifyContent: "center" },
  qtyBtnDisabled: { opacity: 0.4 },
  qtyBtnActive: { backgroundColor: "#111827", borderColor: "#111827" },
  qtyBtnText: { fontSize: 18, color: "#374151", lineHeight: 22 },
  qtyVal: { minWidth: 44, textAlign: "center", fontSize: 16, fontWeight: "800", color: "#111827" },
  tabRow: { flexDirection: "row", borderBottomWidth: 1.5, borderBottomColor: "#f3f4f6", marginBottom: 16 },
  tab: { flex: 1, alignItems: "center", paddingBottom: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#111827" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#9ca3af" },
  tabTextActive: { color: "#111827" },
  tabContent: { paddingTop: 4 },
  detailsGrid: { gap: 0 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#f3f4f6" },
  detailLabel: { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  detailValue: { fontSize: 13, fontWeight: "600", color: "#111827" },
  ratingBig: { alignItems: "center", paddingVertical: 16, gap: 6, marginBottom: 12 },
  ratingBigNum: { fontSize: 48, fontWeight: "800", color: "#111827", lineHeight: 52 },
  ratingBigCount: { fontSize: 12, color: "#9ca3af" },
  reviewCard: { borderWidth: 1, borderColor: "#f3f4f6", borderRadius: 14, padding: 14, marginBottom: 10, backgroundColor: "#f9fafb" },
  reviewTop: { flexDirection: "row", gap: 10, marginBottom: 8 },
  reviewAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#e5e7eb", alignItems: "center", justifyContent: "center" },
  reviewAvatarText: { fontSize: 13, fontWeight: "700", color: "#374151" },
  reviewUser: { fontSize: 13, fontWeight: "700", color: "#111827", marginBottom: 2 },
  reviewDate: { fontSize: 11, color: "#9ca3af" },
  reviewComment: { fontSize: 13, color: "#4b5563", lineHeight: 20 },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#e5e7eb", shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 10 },
  wishlistBtn: { width: 48, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: "#e5e7eb", alignItems: "center", justifyContent: "center" },
  wishlistIcon: { fontSize: 22, color: "#9ca3af" },
  addToCartBtn: { flex: 1, height: 48, borderRadius: 14, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  addedBtn: { backgroundColor: "#dcfce7" },
  disabledBtn: { opacity: 0.4 },
  addToCartText: { fontSize: 14, fontWeight: "700", color: "#111827" },
  buyNowBtn: { flex: 1, height: 48, borderRadius: 14, backgroundColor: "#111827", alignItems: "center", justifyContent: "center" },
  buyNowText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});