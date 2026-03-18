import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Image, StatusBar, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

const SORT_OPTIONS = ["Date Added", "Price: Low–High", "Price: High–Low", "Top Rated"];

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  New:  { bg: "#dcfce7", text: "#16a34a" },
  Sale: { bg: "#fee2e2", text: "#dc2626" },
  Hot:  { bg: "#ffedd5", text: "#ea580c" },
};

export default function WishlistScreen() {
  const router = useRouter();
  const { items, loading, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [sort,      setSort]      = useState("Date Added");
  const [showSort,  setShowSort]  = useState(false);
  const [addedIds,  setAddedIds]  = useState<string[]>([]);

  const sorted = [...items].sort((a, b) => {
    if (sort === "Price: Low–High")  return a.price - b.price;
    if (sort === "Price: High–Low")  return b.price - a.price;
    if (sort === "Top Rated")        return b.rating - a.rating;
    return 0;
  });

  const inStockCount  = items.filter(i => i.in_stock).length;
  const outStockCount = items.filter(i => !i.in_stock).length;
  const totalSavings  = items.reduce((sum, i) => sum + (i.original_price ? i.original_price - i.price : 0), 0);

  const handleAddToCart = (item: typeof items[0]) => {
    addToCart({ ...item, quantity: 1 });
    setAddedIds(prev => [...prev, item.id]);
    setTimeout(() => setAddedIds(prev => prev.filter(id => id !== item.id)), 2000);
  };

  const handleAddAll = () => {
    const inStock = items.filter(i => i.in_stock);
    inStock.forEach(i => addToCart({ ...i, quantity: 1 }));
    setAddedIds(inStock.map(i => i.id));
    setTimeout(() => setAddedIds([]), 2000);
  };

  const handleRemove = (item: typeof items[0]) => {
    Alert.alert("Remove Item", "Remove this from your wishlist?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => toggleWishlist(item) },
    ]);
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Text style={styles.backIcon}>←</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Wishlist</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Loading wishlist...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Text style={styles.backIcon}>←</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Wishlist</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>❤️</Text>
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptySub}>Save items you love and come back to them anytime.</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push("/(tabs)")} activeOpacity={0.88}>
            <Text style={styles.browseBtnText}>Start Browsing</Text>
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
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Text style={styles.backIcon}>←</Text></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Wishlist</Text>
          <Text style={styles.headerSub}>{items.length} saved items</Text>
        </View>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSort(v => !v)}>
          <Text style={styles.sortIcon}>⇅</Text>
        </TouchableOpacity>
      </View>

      {/* Sort dropdown */}
      {showSort && (
        <View style={styles.sortSheet}>
          {SORT_OPTIONS.map(opt => (
            <TouchableOpacity key={opt} style={[styles.sortRow, sort === opt && styles.sortRowActive]} onPress={() => { setSort(opt); setShowSort(false); }}>
              <Text style={[styles.sortLabel, sort === opt && styles.sortLabelActive]}>{opt}</Text>
              {sort === opt && <Text style={styles.sortCheck}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Stats bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{inStockCount}</Text>
            <Text style={styles.statLabel}>In Stock</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statVal, outStockCount > 0 && { color: "#ef4444" }]}>{outStockCount}</Text>
            <Text style={styles.statLabel}>Out of Stock</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: "#16a34a" }]}>{totalSavings > 0 ? `$${totalSavings}` : "—"}</Text>
            <Text style={styles.statLabel}>Savings</Text>
          </View>
        </View>

        {/* Action bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.addAllBtn} onPress={handleAddAll} activeOpacity={0.88}>
            <Text style={styles.addAllIcon}>🛒</Text>
            <Text style={styles.addAllText}>
              {addedIds.length > 0 ? `Added ${addedIds.length} items!` : `Add All to Cart (${inStockCount})`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {sorted.map(item => {
            const discount = item.original_price
              ? Math.round((1 - item.price / item.original_price) * 100)
              : null;
            const added = addedIds.includes(item.id);

            return (
              <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.92} onPress={() => router.push(`/product/${item.id}` as any)}>
                {/* Remove */}
                <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item)} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                  <Text style={styles.removeIcon}>✕</Text>
                </TouchableOpacity>

                {/* Image */}
                <View style={styles.cardImgWrap}>
                  {item.image
                    ? <Image source={{ uri: item.image }} style={styles.cardImg} resizeMode="cover" />
                    : <View style={[styles.cardImg, { backgroundColor: "#f3f4f6" }]} />
                  }
                  {item.badge && (
                    <View style={[styles.badge, { backgroundColor: BADGE_COLORS[item.badge]?.bg ?? "#f3f4f6" }]}>
                      <Text style={[styles.badgeText, { color: BADGE_COLORS[item.badge]?.text ?? "#374151" }]}>{item.badge}</Text>
                    </View>
                  )}
                  {discount && (
                    <View style={styles.discountTag}>
                      <Text style={styles.discountText}>-{discount}%</Text>
                    </View>
                  )}
                  {!item.in_stock && (
                    <View style={styles.outOfStock}>
                      <Text style={styles.outOfStockText}>Out of Stock</Text>
                    </View>
                  )}
                </View>

                {/* Info */}
                <View style={styles.cardInfo}>
                  <Text style={styles.cardBrand}>{item.brand}</Text>
                  <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
                  <View style={styles.ratingRow}>
                    <Text style={styles.star}>★</Text>
                    <Text style={styles.ratingVal}>{item.rating}</Text>
                    <Text style={styles.ratingCount}>({item.review_count})</Text>
                  </View>
                  <Text style={styles.price}>${item.price.toLocaleString()}</Text>
                  {item.original_price && <Text style={styles.originalPrice}>${item.original_price.toLocaleString()}</Text>}

                  <TouchableOpacity
                    style={[styles.addBtn, (!item.in_stock || added) && styles.addBtnAlt]}
                    onPress={() => item.in_stock && handleAddToCart(item)}
                    disabled={!item.in_stock}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.addBtnText, !item.in_stock && styles.addBtnTextDisabled]}>
                      {added ? "✓ Added!" : item.in_stock ? "Add to Cart" : "Out of Stock"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {outStockCount > 0 && (
          <View style={styles.stockNotice}>
            <Text style={styles.stockNoticeIcon}>⚠️</Text>
            <Text style={styles.stockNoticeText}>
              {outStockCount} {outStockCount === 1 ? "item is" : "items are"} currently out of stock. We'll notify you when they're back.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb" },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 18, color: "#374151", fontWeight: "600" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#111827" },
  headerSub: { fontSize: 12, color: "#9ca3af", marginTop: 1 },
  sortBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  sortIcon: { fontSize: 16, color: "#374151", fontWeight: "700" },
  sortSheet: { position: "absolute", top: 72, right: 12, zIndex: 200, backgroundColor: "#fff", borderRadius: 16, minWidth: 180, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 20, overflow: "hidden" },
  sortRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#f3f4f6" },
  sortRowActive: { backgroundColor: "#f9fafb" },
  sortLabel: { fontSize: 13, color: "#374151" },
  sortLabelActive: { fontWeight: "700", color: "#111827" },
  sortCheck: { fontSize: 13, color: "#f97316", fontWeight: "700" },
  statsBar: { flexDirection: "row", backgroundColor: "#fff", marginTop: 10, paddingVertical: 14, paddingHorizontal: 8 },
  statItem: { flex: 1, alignItems: "center", gap: 3 },
  statVal: { fontSize: 18, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 10, color: "#9ca3af", fontWeight: "500" },
  statDivider: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: "#e5e7eb", alignSelf: "center" },
  actionBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb" },
  addAllBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#111827", borderRadius: 14, paddingVertical: 12 },
  addAllIcon: { fontSize: 16 },
  addAllText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, paddingTop: 12, gap: 12, justifyContent: "space-between" },
  card: { width: CARD_WIDTH, backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3, marginBottom: 4 },
  removeBtn: { position: "absolute", top: 8, right: 8, zIndex: 10, width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  removeIcon: { fontSize: 9, color: "#fff", fontWeight: "700" },
  cardImgWrap: { width: "100%", height: 150, backgroundColor: "#f5f5f5", position: "relative" },
  cardImg: { width: "100%", height: "100%" },
  badge: { position: "absolute", top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  discountTag: { position: "absolute", bottom: 8, left: 8, backgroundColor: "#dc2626", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  discountText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  outOfStock: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.55)", paddingVertical: 6, alignItems: "center" },
  outOfStockText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  cardInfo: { padding: 10 },
  cardBrand: { fontSize: 10, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  cardName: { fontSize: 12, fontWeight: "600", color: "#111827", marginBottom: 4, lineHeight: 17 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginBottom: 5, gap: 2 },
  star: { fontSize: 10, color: "#f59e0b" },
  ratingVal: { fontSize: 10, fontWeight: "600", color: "#374151" },
  ratingCount: { fontSize: 10, color: "#9ca3af" },
  price: { fontSize: 14, fontWeight: "700", color: "#111827" },
  originalPrice: { fontSize: 10, color: "#9ca3af", textDecorationLine: "line-through", marginBottom: 8 },
  addBtn: { backgroundColor: "#111827", borderRadius: 10, paddingVertical: 8, alignItems: "center", marginTop: 6 },
  addBtnAlt: { backgroundColor: "#f0fdf4" },
  addBtnText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  addBtnTextDisabled: { color: "#9ca3af" },
  stockNotice: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginHorizontal: 16, marginTop: 8, backgroundColor: "#fffbeb", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#fef3c7" },
  stockNoticeIcon: { fontSize: 16 },
  stockNoticeText: { flex: 1, fontSize: 12, color: "#92400e", lineHeight: 18 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, color: "#9ca3af" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 64, marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: "800", color: "#111827", marginBottom: 8 },
  emptySub: { fontSize: 14, color: "#9ca3af", textAlign: "center", lineHeight: 20, marginBottom: 32 },
  browseBtn: { backgroundColor: "#111827", paddingHorizontal: 32, paddingVertical: 15, borderRadius: 16 },
  browseBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});