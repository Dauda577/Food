import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  StatusBar,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { Product } from "../../context/ProductsContext";
import { COLORS } from "../../constants/colors";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  New: { bg: COLORS.successLight, text: COLORS.success },
  Sale: { bg: COLORS.errorLight, text: COLORS.error },
  Hot: { bg: COLORS.warningLight, text: COLORS.warning },
};

// ── Grid Card Component ───────────────────────────────────────────────────────
const GridCard = ({ product, onRemove }: { product: Product; onRemove: () => void }) => {
  const router = useRouter();
  const { addToCart } = useCart();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleAddToCart = () => {
    addToCart(product);
    Alert.alert("Added to Cart", `${product.name} has been added to your cart.`);
  };

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={() => router.push(`/product/${product.id}` as any)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.95}
      >
        <View style={styles.cardImgWrap}>
          {product.image ? (
            <Image source={{ uri: product.image }} style={styles.cardImg} resizeMode="cover" />
          ) : (
            <View style={[styles.cardImg, styles.cardImgPlaceholder]}>
              <Ionicons name="image-outline" size={32} color="#cbd5e1" />
            </View>
          )}

          <View style={styles.cardImgGradient} />

          {product.badge && (
            <View style={[styles.badge, { backgroundColor: BADGE_COLORS[product.badge]?.bg ?? COLORS.inputBackground }]}>
              <Text style={[styles.badgeText, { color: BADGE_COLORS[product.badge]?.text ?? COLORS.textSecondary }]}>
                {product.badge}
              </Text>
            </View>
          )}

          {discount && (
            <View style={styles.discountTag}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.wishlistBtn}
            onPress={onRemove}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="heart" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardInfo}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardBrand} numberOfLines={1}>{product.brand}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#fbbf24" />
              <Text style={styles.ratingVal}>{product.rating}</Text>
              <Text style={styles.ratingCount}>({product.review_count})</Text>
            </View>
          </View>

          <Text style={styles.cardName} numberOfLines={2}>{product.name}</Text>

          <View style={styles.priceRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>${product.price}</Text>
              {product.original_price && (
                <Text style={styles.originalPrice}>${product.original_price}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.addToCartBtn}
              onPress={handleAddToCart}
              activeOpacity={0.8}
            >
              <Ionicons name="cart-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── List Card Component ───────────────────────────────────────────────────────
const ListCard = ({ product, onRemove }: { product: Product; onRemove: () => void }) => {
  const router = useRouter();
  const { addToCart } = useCart();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleAddToCart = () => {
    addToCart(product);
    Alert.alert("Added to Cart", `${product.name} has been added to your cart.`);
  };

  return (
    <Animated.View style={[styles.listCard, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.listCardTouchable}
        onPress={() => router.push(`/product/${product.id}` as any)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.95}
      >
        <View style={styles.listImgWrap}>
          {product.image ? (
            <Image source={{ uri: product.image }} style={styles.listImg} resizeMode="cover" />
          ) : (
            <View style={[styles.listImg, styles.listImgPlaceholder]}>
              <Ionicons name="image-outline" size={28} color="#cbd5e1" />
            </View>
          )}
          {discount && (
            <View style={styles.listDiscountTag}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          )}
        </View>

        <View style={styles.listInfo}>
          <View style={styles.listHeader}>
            <View style={styles.listBrandContainer}>
              <Text style={styles.cardBrand} numberOfLines={1}>{product.brand}</Text>
              <View style={styles.listRating}>
                <Ionicons name="star" size={12} color="#fbbf24" />
                <Text style={styles.ratingVal}>{product.rating}</Text>
                <Text style={styles.ratingCount}>({product.review_count})</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.listRemoveBtn}
              onPress={onRemove}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>

          <Text style={styles.listName} numberOfLines={2}>{product.name}</Text>

          <View style={styles.listPriceRow}>
            <View>
              <Text style={styles.price}>${product.price}</Text>
              {product.original_price && (
                <Text style={styles.originalPrice}>${product.original_price}</Text>
              )}
            </View>

            <TouchableOpacity style={styles.listAddBtn} onPress={handleAddToCart} activeOpacity={0.8}>
              <Ionicons name="cart-outline" size={18} color="#fff" />
              <Text style={styles.listAddBtnText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Empty State Component ─────────────────────────────────────────────────────
const EmptyWishlist = () => {
  const router = useRouter();
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="heart-outline" size={48} color="#f97316" />
        </View>
      </View>
      <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
      <Text style={styles.emptySubtitle}>
        Save your favorite items here and{"\n"}come back to them later.
      </Text>
      <TouchableOpacity
        style={styles.emptyBtn}
        onPress={() => router.push("/(tabs)")}
        activeOpacity={0.85}
      >
        <Ionicons name="arrow-forward" size={18} color="#fff" />
        <Text style={styles.emptyBtnText}>Start Exploring</Text>
      </TouchableOpacity>
    </View>
  );
};

// ── Main Wishlist Screen ──────────────────────────────────────────────────────
export default function WishlistScreen() {
  const { items, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [view, setView] = useState<"grid" | "list">("grid");

  const handleRemoveItem = (product: Product) => {
    Alert.alert(
      "Remove from Wishlist",
      `Remove ${product.name} from your wishlist?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => toggleWishlist(product) },
      ]
    );
  };

  const handleAddAllToCart = () => {
    if (items.length === 0) return;
    Alert.alert(
      "Add All to Cart",
      `Add all ${items.length} items to your cart?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add All",
          onPress: () => items.forEach(product => addToCart(product)),
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear Wishlist",
      `Remove all ${items.length} items from your wishlist?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear All", style: "destructive", onPress: () => items.forEach(product => toggleWishlist(product)) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.headerBadge}>
            <Ionicons name="heart" size={14} color="#f97316" />
            <Text style={styles.headerBadgeText}>Favorites</Text>
          </View>
          <Text style={styles.headerTitle}>
            My Wishlist
          </Text>
        </View>

        {items.length > 0 && (
          <TouchableOpacity style={styles.menuBtn} onPress={handleClearAll}>
            <Ionicons name="trash-outline" size={20} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      {/* Toolbar */}
      {items.length > 0 && (
        <View style={styles.toolbar}>
          <View style={styles.toolbarLeft}>
            <Ionicons name="heart" size={16} color="#f97316" />
            <Text style={styles.toolbarCount}>
              <Text style={styles.toolbarCountNum}>{items.length}</Text>
              {" "}{items.length === 1 ? "item" : "items"}
            </Text>
          </View>

          <View style={styles.toolbarRight}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.addAllBtn]}
              onPress={handleAddAllToCart}
              activeOpacity={0.8}
            >
              <Ionicons name="cart-outline" size={16} color="#fff" />
              <Text style={styles.addAllBtnText}>Add All to Cart</Text>
            </TouchableOpacity>

            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, view === "grid" && styles.toggleBtnActive]}
                onPress={() => setView("grid")}
              >
                <Ionicons
                  name="grid-outline"
                  size={18}
                  color={view === "grid" ? "#fff" : "#64748b"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleBtn, view === "list" && styles.toggleBtnActive]}
                onPress={() => setView("list")}
              >
                <Ionicons
                  name="list-outline"
                  size={18}
                  color={view === "list" ? "#fff" : "#64748b"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {items.length === 0 ? (
        <EmptyWishlist />
      ) : view === "grid" ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.gridScroll}
        >
          <View style={styles.grid}>
            {items.map(product => (
              <GridCard
                key={product.id}
                product={product}
                onRemove={() => handleRemoveItem(product)}
              />
            ))}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={items}
          keyExtractor={p => p.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listScroll}
          ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
          renderItem={({ item }) => (
            <ListCard product={item} onRemove={() => handleRemoveItem(item)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#f97316",
    letterSpacing: 0.3,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  // Toolbar
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  toolbarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  toolbarCount: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  toolbarCountNum: {
    color: "#0f172a",
    fontWeight: "800",
  },
  toolbarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addAllBtn: {
    backgroundColor: "#0f172a",
  },
  addAllBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  toggleBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleBtnActive: {
    backgroundColor: "#0f172a",
  },

  // Grid Styles
  gridScroll: {
    paddingBottom: 110,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 16,
    justifyContent: "space-between",
  },

  // Card Styles
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  cardImgWrap: {
    width: "100%",
    height: 180,
    backgroundColor: "#f8fafc",
    position: "relative",
  },
  cardImg: {
    width: "100%",
    height: "100%",
  },
  cardImgPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardImgGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  badge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  discountTag: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#ef4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  wishlistBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInfo: {
    padding: 12,
    gap: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardBrand: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingVal: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  ratingCount: {
    fontSize: 10,
    color: "#94a3b8",
  },
  cardName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  priceContainer: {
    gap: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  originalPrice: {
    fontSize: 11,
    color: "#94a3b8",
    textDecorationLine: "line-through",
  },
  addToCartBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },

  // List Styles
  listScroll: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  listSeparator: {
    height: 12,
  },
  listCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  listCardTouchable: {
    flexDirection: "row",
  },
  listImgWrap: {
    width: 120,
    height: 140,
    backgroundColor: "#f8fafc",
    position: "relative",
  },
  listImg: {
    width: "100%",
    height: "100%",
  },
  listImgPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  listDiscountTag: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#ef4444",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  listInfo: {
    flex: 1,
    padding: 14,
    justifyContent: "space-between",
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  listBrandContainer: {
    flex: 1,
    gap: 4,
  },
  listRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  listRemoveBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  listName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    lineHeight: 20,
    marginVertical: 6,
    letterSpacing: -0.3,
  },
  listPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  listAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#0f172a",
    borderRadius: 12,
  },
  listAddBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },

  // Empty State
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 50,
    backgroundColor: "#0f172a",
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.2,
  },
});