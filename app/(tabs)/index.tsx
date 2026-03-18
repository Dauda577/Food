import React, { useState } from "react";
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  StyleSheet, Dimensions, Image, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useProducts, Product } from "../../context/ProductsContext";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { ProductGridSkeleton, BannerSkeleton, CategoryPillsSkeleton } from "../../components/Skeletons";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

const CATEGORIES = [
  { id: "Electronics", name: "Electronics", icon: "💻", color: "#EEF2FF" },
  { id: "Fashion",     name: "Fashion",     icon: "👕", color: "#FFF7ED" },
  { id: "Food",        name: "Food",        icon: "🍔", color: "#FFF1F2" },
  { id: "Beauty",      name: "Beauty",      icon: "💄", color: "#FDF4FF" },
  { id: "Sports",      name: "Sports",      icon: "⚽", color: "#F0FDF4" },
  { id: "Home",        name: "Home",        icon: "🏠", color: "#FFFBEB" },
  { id: "Computing",   name: "Computing",   icon: "💻", color: "#EFF6FF" },
];

const BANNERS = [
  { id: "1", title: "Up to 50% Off",  subtitle: "Electronics Sale",    color: "#1a1a2e", accent: "#e94560", emoji: "📱" },
  { id: "2", title: "Free Delivery",  subtitle: "On orders over $200", color: "#0f3460", accent: "#ffd460", emoji: "🚚" },
  { id: "3", title: "New Arrivals",   subtitle: "Fashion & Footwear",  color: "#533483", accent: "#e8d5b7", emoji: "👟" },
];

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  New:  { bg: "#dcfce7", text: "#16a34a" },
  Sale: { bg: "#fee2e2", text: "#dc2626" },
  Hot:  { bg: "#ffedd5", text: "#ea580c" },
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

// ── Banner ────────────────────────────────────────────────────────────────────
const Banner = ({ item }: { item: typeof BANNERS[0] }) => (
  <View style={[styles.banner, { backgroundColor: item.color }]}>
    <View style={styles.bannerContent}>
      <Text style={[styles.bannerSubtitle, { color: item.accent }]}>{item.subtitle}</Text>
      <Text style={styles.bannerTitle}>{item.title}</Text>
      <TouchableOpacity style={[styles.bannerBtn, { backgroundColor: item.accent }]}>
        <Text style={[styles.bannerBtnText, { color: item.color }]}>Shop Now</Text>
      </TouchableOpacity>
    </View>
    <Text style={styles.bannerEmoji}>{item.emoji}</Text>
  </View>
);

// ── Product card ──────────────────────────────────────────────────────────────
const ProductCard = ({ product }: { product: Product }) => {
  const router = useRouter();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(product.id);
  const discount   = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.92}
      onPress={() => router.push(`/product/${product.id}` as any)}
    >
      <View style={styles.cardImgWrap}>
        {product.image
          ? <Image source={{ uri: product.image }} style={styles.cardImg} resizeMode="cover" />
          : <View style={[styles.cardImg, { backgroundColor: "#f3f4f6" }]} />
        }
        {product.badge && (
          <View style={[styles.badge, { backgroundColor: BADGE_COLORS[product.badge]?.bg ?? "#f3f4f6" }]}>
            <Text style={[styles.badgeText, { color: BADGE_COLORS[product.badge]?.text ?? "#374151" }]}>
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
          style={styles.heartBtn}
          onPress={() => toggleWishlist(product)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={styles.heartIcon}>{wishlisted ? "❤️" : "🤍"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.cardBrand} numberOfLines={1}>{product.brand}</Text>
        <Text style={styles.cardName} numberOfLines={2}>{product.name}</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.star}>★</Text>
          <Text style={styles.ratingVal}>{product.rating}</Text>
          <Text style={styles.ratingCount}>({product.review_count})</Text>
        </View>
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.price}>${product.price}</Text>
            {product.original_price && (
              <Text style={styles.originalPrice}>${product.original_price}</Text>
            )}
          </View>
          {/* addToCart — no quantity needed, CartContext handles it */}
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => addToCart(product)}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ── Home screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { products, loading, fetchProducts } = useProducts();
  const { itemCount } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [bannerIndex,       setBannerIndex]      = useState(0);

  const firstName = profile?.name?.split(" ")[0] ?? null;

  const filtered = selectedCategory
    ? products.filter(p => p.category === selectedCategory)
    : products;

  const handleCategoryPress = (id: string) => {
    const next = selectedCategory === id ? null : id;
    setSelectedCategory(next);
    fetchProducts(next ? { category: next } : {});
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {getGreeting()}{firstName ? `, ${firstName}` : ""} 👋
            </Text>
            <Text style={styles.headerTitle}>What are you{"\n"}looking for?</Text>
          </View>
          {/* Cart button with live item count badge */}
          <TouchableOpacity style={styles.cartBtn} onPress={() => router.push("/(tabs)/mycart")}>
            <Text style={{ fontSize: 22 }}>🛒</Text>
            {itemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{itemCount > 9 ? "9+" : itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search */}
        <TouchableOpacity style={styles.searchBox} activeOpacity={0.8} onPress={() => router.push("/search")}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search products, brands...</Text>
        </TouchableOpacity>

        {/* Banners */}
        {loading ? <BannerSkeleton /> : (
          <View style={{ paddingHorizontal: 16, marginBottom: 4 }}>
            <FlatList
              data={BANNERS}
              keyExtractor={b => b.id}
              horizontal pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={width - 32}
              decelerationRate="fast"
              onScroll={e => setBannerIndex(Math.round(e.nativeEvent.contentOffset.x / (width - 32)))}
              renderItem={({ item }) => <Banner item={item} />}
            />
            <View style={styles.dots}>
              {BANNERS.map((_, i) => (
                <View key={i} style={[styles.dot, i === bannerIndex && styles.dotActive]} />
              ))}
            </View>
          </View>
        )}

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/categories")}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {loading ? <CategoryPillsSkeleton /> : (
          <FlatList
            data={CATEGORIES}
            keyExtractor={c => c.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleCategoryPress(item.id)}
                style={[styles.pill, { backgroundColor: selectedCategory === item.id ? "#111827" : item.color }]}
              >
                <Text style={{ fontSize: 15 }}>{item.icon}</Text>
                <Text style={[styles.pillText, { color: selectedCategory === item.id ? "#fff" : "#374151" }]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Products */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCategory
              ? CATEGORIES.find(c => c.id === selectedCategory)?.name
              : "All Products"}
          </Text>
          <Text style={{ fontSize: 13, color: "#9ca3af" }}>{filtered.length} items</Text>
        </View>

        {loading ? (
          <ProductGridSkeleton count={6} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📦</Text>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#374151" }}>No products found</Text>
            <Text style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Try a different category</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: "#fff" },
  greeting: { fontSize: 13, color: "#6b7280", marginBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#111827", lineHeight: 30 },
  cartBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center", marginTop: 4, position: "relative" },
  cartBadge: { position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center", paddingHorizontal: 4, borderWidth: 2, borderColor: "#f9fafb" },
  cartBadgeText: { fontSize: 9, fontWeight: "800", color: "#fff" },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginHorizontal: 16, marginVertical: 12, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  searchPlaceholder: { flex: 1, fontSize: 14, color: "#9ca3af" },
  banner: { width: width - 32, height: 160, borderRadius: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, overflow: "hidden" },
  bannerContent: { flex: 1 },
  bannerSubtitle: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
  bannerTitle: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 14, lineHeight: 26 },
  bannerBtn: { alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  bannerBtnText: { fontSize: 12, fontWeight: "700" },
  bannerEmoji: { fontSize: 64, opacity: 0.9 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#d1d5db" },
  dotActive: { width: 18, backgroundColor: "#111827" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginTop: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  seeAll: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  pill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 50, gap: 6 },
  pillText: { fontSize: 13, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 12, justifyContent: "space-between" },
  card: { width: CARD_WIDTH, backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", marginBottom: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  cardImgWrap: { width: "100%", height: 150, backgroundColor: "#f5f5f5", position: "relative" },
  cardImg: { width: "100%", height: "100%" },
  badge: { position: "absolute", top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  discountTag: { position: "absolute", top: 8, right: 8, backgroundColor: "#dc2626", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  discountText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  heartBtn: { position: "absolute", bottom: 8, right: 8 },
  heartIcon: { fontSize: 16 },
  cardInfo: { padding: 10 },
  cardBrand: { fontSize: 10, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  cardName: { fontSize: 13, fontWeight: "600", color: "#111827", marginBottom: 4, lineHeight: 18 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 2 },
  star: { fontSize: 11, color: "#f59e0b" },
  ratingVal: { fontSize: 11, fontWeight: "600", color: "#374151" },
  ratingCount: { fontSize: 11, color: "#9ca3af" },
  priceRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  price: { fontSize: 15, fontWeight: "700", color: "#111827" },
  originalPrice: { fontSize: 11, color: "#9ca3af", textDecorationLine: "line-through" },
  addBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: "#111827", alignItems: "center", justifyContent: "center" },
  addBtnText: { color: "#fff", fontSize: 20, fontWeight: "300", lineHeight: 24 },
  empty: { alignItems: "center", paddingVertical: 60 },
});