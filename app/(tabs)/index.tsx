import React, { useState, useRef } from "react";
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  StyleSheet, Dimensions, Image, StatusBar, TextInput,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useProducts, Product } from "../../context/ProductsContext";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useLocale } from "../../context/LocaleContext";
import { ProductGridSkeleton, BannerSkeleton, CategoryPillsSkeleton } from "../../components/Skeletons";
import Footer from "../../components/Footer";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

const CATEGORIES = [
  { id: "electronics", name: "Electronics", icon: "laptop-outline", color: "#EEF2FF" },
  { id: "fashion", name: "Fashion", icon: "shirt-outline", color: "#FFF7ED" },
  { id: "food", name: "Food", icon: "fast-food-outline", color: "#FFF1F2" },
  { id: "beauty", name: "Beauty", icon: "color-palette-outline", color: "#FDF4FF" },
  { id: "sports", name: "Sports", icon: "football-outline", color: "#F0FDF4" },
  { id: "home", name: "Home", icon: "home-outline", color: "#FFFBEB" },
  { id: "computing", name: "Computing", icon: "desktop-outline", color: "#EFF6FF" },
];

const BANNERS = [
  { id: "1", title: "Up to 50% Off", subtitle: "Electronics Sale", color: "#667eea", accent: "#fff", icon: "phone-portrait-outline" },
  { id: "2", title: "Free Delivery", subtitle: "On orders over GH₵200", color: "#f093fb", accent: "#fff", icon: "car-outline" },
  { id: "3", title: "New Arrivals", subtitle: "Fashion & Footwear", color: "#4facfe", accent: "#fff", icon: "footsteps-outline" },
];

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  New: { bg: "#dcfce7", text: "#16a34a" },
  Sale: { bg: "#fee2e2", text: "#dc2626" },
  Hot: { bg: "#ffedd5", text: "#ea580c" },
};

const getGreeting = (t: (key: any) => string) => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

// ── Banner ────────────────────────────────────────────────────────────────────
const Banner = ({ item, index, currentIndex, t }: {
  item: typeof BANNERS[0]; index: number; currentIndex: number; t: (key: any) => string;
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.spring(scale, {
      toValue: index === currentIndex ? 1 : 0.95,
      useNativeDriver: true,
    }).start();
  }, [currentIndex, index]);

  return (
    <Animated.View style={[styles.bannerWrapper, { transform: [{ scale }] }]}>
      <View style={[styles.banner, { backgroundColor: item.color }]}>
        <View style={styles.bannerContent}>
          <View style={styles.bannerTag}>
            <Text style={[styles.bannerSubtitle, { color: item.accent }]}>{item.subtitle}</Text>
          </View>
          <Text style={styles.bannerTitle}>{item.title}</Text>
          <TouchableOpacity style={[styles.bannerBtn, { backgroundColor: item.accent }]}>
            <Text style={[styles.bannerBtnText, { color: item.color }]}>Shop Now</Text>
            <Ionicons name="arrow-forward" size={14} color={item.color} />
          </TouchableOpacity>
        </View>
        <View style={styles.bannerIconContainer}>
          <Ionicons name={item.icon as any} size={56} color="#fff" style={styles.bannerIcon} />
        </View>
      </View>
    </Animated.View>
  );
};

// ── Category Card ─────────────────────────────────────────────────────────────
const CategoryCard = ({ item, isSelected, onPress }: {
  item: typeof CATEGORIES[0]; isSelected: boolean; onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
    activeOpacity={0.8}
  >
    <View style={[styles.categoryIconWrap, { backgroundColor: item.color }]}>
      <Ionicons name={item.icon as any} size={24} color={isSelected ? "#fff" : "#4b5563"} />
    </View>
    <Text style={[styles.categoryName, isSelected && styles.categoryNameSelected]}>{item.name}</Text>
    {isSelected && <View style={styles.categoryActiveIndicator} />}
  </TouchableOpacity>
);

// ── Product Card ──────────────────────────────────────────────────────────────
const ProductCard = ({ product }: { product: Product }) => {
  const router = useRouter();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { formatPrice, t } = useLocale(); // ← locale hook
  const wishlisted = isWishlisted(product.id);
  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null;

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={() => router.push(`/product/${product.id}` as any)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.95}
      >
        <View style={styles.cardImgWrap}>
          {product.images?.[0] ? (
            <Image source={{ uri: product.images[0] }} style={styles.cardImg} resizeMode="cover" />
          ) : (
            <View style={[styles.cardImg, styles.cardImgPlaceholder]}>
              <Ionicons name="image-outline" size={32} color="#cbd5e1" />
            </View>
          )}

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
            style={styles.wishlistBtn}
            onPress={() => toggleWishlist(product)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons
              name={wishlisted ? "heart" : "heart-outline"}
              size={20}
              color={wishlisted ? "#ef4444" : "#fff"}
            />
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
              {/* ← formatPrice replaces hardcoded GH₵ */}
              <Text style={styles.price}>{formatPrice(product.price)}</Text>
              {product.original_price && (
                <Text style={styles.originalPrice}>{formatPrice(product.original_price)}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.addToCartBtn}
              onPress={() => addToCart(product)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Main Home Screen ──────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { products, loading, fetchProducts } = useProducts();
  const { itemCount } = useCart();
  const { t, formatPrice } = useLocale(); // ← locale hook
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [bannerIndex, setBannerIndex] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;

  const firstName = profile?.name?.split(" ")[0] ?? null;

  const filtered = selectedCategory
    ? products.filter(p => p.category_name?.toLowerCase() === selectedCategory.toLowerCase())
    : products;

  const handleCategoryPress = (slug: string) => {
    const next = selectedCategory === slug ? null : slug;
    setSelectedCategory(next);
    fetchProducts(next ? { category: next } : {});
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: "clamp",
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <Animated.View style={[styles.headerContainer, { opacity: headerOpacity }]}>
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            {/* ← greeting with first name */}
            <Text style={styles.greeting}>
              {getGreeting(t)}{firstName ? `, ${firstName}` : ""}
            </Text>
            <Text style={styles.headerTitle}>
              {t("search") === "Search" ? "What are you looking for?" : t("search")}
            </Text>
          </View>

          <TouchableOpacity style={styles.cartBtn} onPress={() => router.push("/(tabs)/mycart")}>
            <Ionicons name="cart-outline" size={24} color="#1e293b" />
            {itemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{itemCount > 99 ? "99+" : itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity style={styles.searchBox} activeOpacity={0.8} onPress={() => router.push("/search")}>
          <Ionicons name="search-outline" size={20} color="#94a3b8" />
          <Text style={styles.searchPlaceholder}>{t("search")} products, brands...</Text>
          <Ionicons name="mic-outline" size={20} color="#94a3b8" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Banners */}
        {loading ? (
          <BannerSkeleton />
        ) : (
          <View style={styles.bannersContainer}>
            <FlatList
              data={BANNERS}
              keyExtractor={b => b.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={width - 32}
              decelerationRate="fast"
              onScroll={e => setBannerIndex(Math.round(e.nativeEvent.contentOffset.x / (width - 32)))}
              renderItem={({ item, index }) => (
                <Banner item={item} index={index} currentIndex={bannerIndex} t={t} />
              )}
            />
            <View style={styles.dotsContainer}>
              {BANNERS.map((_, i) => (
                <View key={i} style={[styles.dot, i === bannerIndex && styles.dotActive]} />
              ))}
            </View>
          </View>
        )}

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Categories</Text>
              <Text style={styles.sectionSubtitle}>Shop by category</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/categories")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <CategoryPillsSkeleton />
          ) : (
            <FlatList
              data={CATEGORIES}
              keyExtractor={c => c.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
              renderItem={({ item }) => (
                <CategoryCard
                  item={item}
                  isSelected={selectedCategory === item.id}
                  onPress={() => handleCategoryPress(item.id)}
                />
              )}
            />
          )}
        </View>

        {/* Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                {selectedCategory
                  ? CATEGORIES.find(c => c.id === selectedCategory)?.name
                  : "All Products"}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {filtered.length} {t("in_stock") === "In Stock" ? "items available" : t("in_stock")}
              </Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.filterBtn}>
                <Ionicons name="options-outline" size={16} color="#f97316" /> Filter
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ProductGridSkeleton count={6} />
          ) : filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="cube-outline" size={64} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySubtitle}>Try a different category or search term</Text>
              <TouchableOpacity
                style={styles.clearFilterBtn}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={styles.clearFilterText}>Clear Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.grid}>
              {filtered.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </View>
          )}
        </View>

        <Footer />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

// ── Styles (unchanged) ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  headerContainer: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  greetingContainer: { flex: 1 },
  greeting: { fontSize: 13, color: "#64748b", marginBottom: 4, fontWeight: "500" },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#0f172a", lineHeight: 32, letterSpacing: -0.5 },
  cartBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center", position: "relative", borderWidth: 1, borderColor: "#e2e8f0" },
  cartBadge: { position: "absolute", top: -6, right: -6, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center", paddingHorizontal: 5, borderWidth: 2, borderColor: "#fff" },
  cartBadgeText: { fontSize: 10, fontWeight: "800", color: "#fff" },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", marginHorizontal: 20, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", gap: 12 },
  searchPlaceholder: { flex: 1, fontSize: 14, color: "#94a3b8", fontWeight: "500" },
  bannersContainer: { marginTop: 8, marginBottom: 8 },
  bannerWrapper: { paddingHorizontal: 8 },
  banner: { width: width - 48, height: 180, borderRadius: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  bannerContent: { flex: 1, gap: 8 },
  bannerTag: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12 },
  bannerSubtitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  bannerTitle: { fontSize: 24, fontWeight: "800", color: "#fff", lineHeight: 30 },
  bannerBtn: { flexDirection: "row", alignSelf: "flex-start", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, marginTop: 4 },
  bannerBtnText: { fontSize: 13, fontWeight: "700" },
  bannerIconContainer: { width: 100, height: 100, alignItems: "center", justifyContent: "center" },
  bannerIcon: { opacity: 0.9 },
  dotsContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 16, marginBottom: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#cbd5e1" },
  dotActive: { width: 20, backgroundColor: "#0f172a" },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a", letterSpacing: -0.5 },
  sectionSubtitle: { fontSize: 13, color: "#64748b", marginTop: 4 },
  seeAll: { fontSize: 13, fontWeight: "600", color: "#f97316" },
  filterBtn: { fontSize: 13, fontWeight: "600", color: "#f97316" },
  categoriesList: { gap: 12, paddingRight: 20 },
  categoryCard: { alignItems: "center", gap: 8, minWidth: 80, paddingVertical: 8 },
  categoryCardSelected: { transform: [{ scale: 1.05 }] },
  categoryIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  categoryName: { fontSize: 12, fontWeight: "600", color: "#475569", textAlign: "center" },
  categoryNameSelected: { color: "#f97316" },
  categoryActiveIndicator: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#f97316", marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 16 },
  card: { width: CARD_WIDTH, backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: "#f1f5f9" },
  cardImgWrap: { width: "100%", height: 180, backgroundColor: "#f8fafc", position: "relative" },
  cardImg: { width: "100%", height: "100%" },
  cardImgPlaceholder: { alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  discountTag: { position: "absolute", top: 12, right: 12, backgroundColor: "#ef4444", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  discountText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  wishlistBtn: { position: "absolute", bottom: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.3)", alignItems: "center", justifyContent: "center" },
  cardInfo: { padding: 12, gap: 6 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardBrand: { fontSize: 10, color: "#64748b", fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" },
  ratingContainer: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingVal: { fontSize: 11, fontWeight: "600", color: "#475569" },
  ratingCount: { fontSize: 10, color: "#94a3b8" },
  cardName: { fontSize: 14, fontWeight: "600", color: "#0f172a", lineHeight: 20, letterSpacing: -0.3 },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  priceContainer: { gap: 2 },
  price: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  originalPrice: { fontSize: 11, color: "#94a3b8", textDecorationLine: "line-through" },
  addToCartBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#0f172a", alignItems: "center", justifyContent: "center" },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyIconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 24 },
  clearFilterBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "#f1f5f9", borderRadius: 12 },
  clearFilterText: { fontSize: 13, fontWeight: "600", color: "#475569" },
});