import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  StyleSheet, Dimensions, Image, TextInput,
  StatusBar, Keyboard, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

// ── Mock data ─────────────────────────────────────────────────────────────────
const ALL_PRODUCTS = [
  { id: "1",  name: "iPhone 15 Pro Max",       brand: "Apple",    price: 1099, originalPrice: 1299, category: "Electronics", image: "https://images.unsplash.com/photo-1697565975749-4d4948a3b37e?w=400", rating: 4.9, reviews: 2341, badge: "Sale" },
  { id: "2",  name: "Nike Air Max 270",         brand: "Nike",     price: 150,  originalPrice: null, category: "Fashion",     image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",    rating: 4.7, reviews: 892,  badge: "Hot" },
  { id: "3",  name: "Sony WH-1000XM5",          brand: "Sony",     price: 279,  originalPrice: 349,  category: "Electronics", image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400", rating: 4.8, reviews: 1567, badge: "Sale" },
  { id: "4",  name: "MacBook Air M2",           brand: "Apple",    price: 1099, originalPrice: null, category: "Computing",   image: "https://images.unsplash.com/photo-1611186871525-11c1f3f92614?w=400", rating: 4.9, reviews: 3201, badge: "New" },
  { id: "5",  name: "Adidas Ultraboost 23",     brand: "Adidas",   price: 180,  originalPrice: 220,  category: "Fashion",     image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400", rating: 4.6, reviews: 445,  badge: "Sale" },
  { id: "6",  name: "Samsung 4K QLED TV",       brand: "Samsung",  price: 799,  originalPrice: null, category: "Electronics", image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400", rating: 4.7, reviews: 678,  badge: null },
  { id: "7",  name: "Protein Whey Isolate 5lb", brand: "NutriFit", price: 65,   originalPrice: null, category: "Sports",      image: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400", rating: 4.5, reviews: 234,  badge: null },
  { id: "8",  name: "Dyson V15 Vacuum",         brand: "Dyson",    price: 599,  originalPrice: 699,  category: "Home",        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",    rating: 4.8, reviews: 1102, badge: "Sale" },
  { id: "9",  name: "iPad Pro 12.9\"",          brand: "Apple",    price: 1099, originalPrice: null, category: "Computing",   image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400",    rating: 4.8, reviews: 987,  badge: "New" },
  { id: "10", name: "AirPods Pro 2nd Gen",      brand: "Apple",    price: 249,  originalPrice: 299,  category: "Electronics", image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400", rating: 4.7, reviews: 4521, badge: "Sale" },
  { id: "11", name: "Levi's 501 Jeans",         brand: "Levi's",   price: 89,   originalPrice: null, category: "Fashion",     image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",    rating: 4.5, reviews: 321,  badge: null },
  { id: "12", name: "Yoga Mat Premium",         brand: "FitLife",  price: 45,   originalPrice: 60,   category: "Sports",      image: "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=400", rating: 4.4, reviews: 189,  badge: "Sale" },
];

const TRENDING = ["iPhone 15", "Nike Air Max", "MacBook", "Sony headphones", "AirPods", "Samsung TV"];

const CATEGORIES = ["All", "Electronics", "Fashion", "Computing", "Sports", "Home"];

const SORT_OPTIONS = [
  { id: "popular",   label: "Most Popular" },
  { id: "price_asc", label: "Price: Low–High" },
  { id: "price_desc",label: "Price: High–Low" },
  { id: "rating",    label: "Top Rated" },
  { id: "newest",    label: "Newest" },
];

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  New:  { bg: "#dcfce7", text: "#16a34a" },
  Sale: { bg: "#fee2e2", text: "#dc2626" },
  Hot:  { bg: "#ffedd5", text: "#ea580c" },
};

// ── Product card ──────────────────────────────────────────────────────────────
const ProductCard = ({ item }: { item: typeof ALL_PRODUCTS[0] }) => {
  const router   = useRouter();
  const discount = item.originalPrice
    ? Math.round((1 - item.price / item.originalPrice) * 100)
    : null;
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.92}
      onPress={() => router.push(`/product/${item.id}`)}
    >
      <View style={styles.cardImgWrap}>
        <Image source={{ uri: item.image }} style={styles.cardImg} resizeMode="cover" />
        {item.badge && (
          <View style={[styles.badge, { backgroundColor: BADGE_COLORS[item.badge].bg }]}>
            <Text style={[styles.badgeText, { color: BADGE_COLORS[item.badge].text }]}>{item.badge}</Text>
          </View>
        )}
        {discount && (
          <View style={styles.discountTag}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardBrand}>{item.brand}</Text>
        <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.star}>★</Text>
          <Text style={styles.ratingVal}>{item.rating}</Text>
          <Text style={styles.ratingCount}>({item.reviews})</Text>
        </View>
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.price}>${item.price}</Text>
            {item.originalPrice && (
              <Text style={styles.originalPrice}>${item.originalPrice}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.addBtn}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────
export default function SearchScreen() {
  const router       = useRouter();
  const inputRef     = useRef<TextInput>(null);
  const fadeAnim     = useRef(new Animated.Value(0)).current;

  const [query,           setQuery]           = useState("");
  const [focused,         setFocused]         = useState(false);
  const [recentSearches,  setRecentSearches]  = useState(["Sony headphones", "Nike shoes", "Apple watch"]);
  const [activeCategory,  setActiveCategory]  = useState("All");
  const [activeSort,      setActiveSort]      = useState("popular");
  const [showSortSheet,   setShowSortSheet]   = useState(false);
  const [priceRange,      setPriceRange]      = useState<[number, number]>([0, 2000]);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  const addRecentSearch = (q: string) => {
    if (!q.trim()) return;
    setRecentSearches(prev => [q, ...prev.filter(s => s !== q)].slice(0, 8));
  };

  const clearRecent = (s: string) =>
    setRecentSearches(prev => prev.filter(r => r !== s));

  const handleSearch = (q: string) => {
    setQuery(q);
    if (q.length > 2) addRecentSearch(q);
  };

  const handleTrendingTap = (t: string) => {
    setQuery(t);
    addRecentSearch(t);
    Keyboard.dismiss();
  };

  // Filter + sort
  const results = ALL_PRODUCTS
    .filter(p => {
      const matchQ   = !query || p.name.toLowerCase().includes(query.toLowerCase()) || p.brand.toLowerCase().includes(query.toLowerCase());
      const matchCat = activeCategory === "All" || p.category === activeCategory;
      const matchPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      return matchQ && matchCat && matchPrice;
    })
    .sort((a, b) => {
      if (activeSort === "price_asc")  return a.price - b.price;
      if (activeSort === "price_desc") return b.price - a.price;
      if (activeSort === "rating")     return b.rating - a.rating;
      return b.reviews - a.reviews;
    });

  const showResults = query.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Search bar ── */}
      <View style={styles.searchHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={[styles.searchBar, focused && styles.searchBarFocused]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search products, brands..."
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={handleSearch}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            returnKeyType="search"
            onSubmitEditing={() => { addRecentSearch(query); Keyboard.dismiss(); }}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        {showResults && (
          <TouchableOpacity style={styles.filterBtn} onPress={() => setShowSortSheet(v => !v)}>
            <Text style={styles.filterIcon}>⇅</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Category filter strip (only when results showing) ── */}
      {showResults && (
        <View style={styles.catStrip}>
          <FlatList
            data={CATEGORIES}
            keyExtractor={c => c}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.catPill, activeCategory === item && styles.catPillActive]}
                onPress={() => setActiveCategory(item)}
              >
                <Text style={[styles.catText, activeCategory === item && styles.catTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* ── Sort sheet ── */}
      {showSortSheet && (
        <View style={styles.sortSheet}>
          {SORT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.id}
              style={[styles.sortRow, activeSort === opt.id && styles.sortRowActive]}
              onPress={() => { setActiveSort(opt.id); setShowSortSheet(false); }}
            >
              <Text style={[styles.sortLabel, activeSort === opt.id && styles.sortLabelActive]}>
                {opt.label}
              </Text>
              {activeSort === opt.id && <Text style={styles.sortCheck}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        {/* ── Empty state / recent + trending ── */}
        {!showResults ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                  <TouchableOpacity onPress={() => setRecentSearches([])}>
                    <Text style={styles.clearAll}>Clear all</Text>
                  </TouchableOpacity>
                </View>
                {recentSearches.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={styles.recentRow}
                    onPress={() => handleTrendingTap(s)}
                  >
                    <Text style={styles.recentIcon}>🕐</Text>
                    <Text style={styles.recentText}>{s}</Text>
                    <TouchableOpacity
                      onPress={() => clearRecent(s)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.recentRemove}>✕</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Trending */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
              <View style={styles.trendingGrid}>
                {TRENDING.map((t, i) => (
                  <TouchableOpacity
                    key={t}
                    style={styles.trendingPill}
                    onPress={() => handleTrendingTap(t)}
                  >
                    <Text style={styles.trendingNum}>{i + 1}</Text>
                    <Text style={styles.trendingText}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Popular products */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Popular Right Now</Text>
              <View style={styles.grid}>
                {ALL_PRODUCTS.slice(0, 4).map(item => (
                  <ProductCard key={item.id} item={item} />
                ))}
              </View>
            </View>
          </ScrollView>
        ) : (
          /* ── Results ── */
          <View style={{ flex: 1 }}>
            {/* Result count + active sort */}
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                <Text style={{ color: "#111827", fontWeight: "700" }}>{results.length}</Text>
                {" "}results for "{query}"
              </Text>
              <Text style={styles.activeSort}>
                {SORT_OPTIONS.find(s => s.id === activeSort)?.label}
              </Text>
            </View>

            {results.length === 0 ? (
              <View style={styles.noResults}>
                <Text style={styles.noResultsEmoji}>🔍</Text>
                <Text style={styles.noResultsTitle}>No results found</Text>
                <Text style={styles.noResultsSub}>
                  Try different keywords or browse by category
                </Text>
                <TouchableOpacity
                  style={styles.browseCatBtn}
                  onPress={() => router.push("/(tabs)/categories")}
                >
                  <Text style={styles.browseCatText}>Browse Categories</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={results}
                keyExtractor={p => p.id}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.resultGrid}
                columnWrapperStyle={{ gap: 12 }}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => <ProductCard item={item} />}
              />
            )}
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },

  // Header
  searchHeader: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: "#fff", gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb",
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center",
  },
  backIcon: { fontSize: 18, color: "#374151", fontWeight: "600" },
  searchBar: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: "#f3f4f6", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    gap: 8, borderWidth: 1.5, borderColor: "transparent",
  },
  searchBarFocused: { borderColor: "#f97316", backgroundColor: "#fff" },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 14, color: "#111827", padding: 0 },
  clearBtn: { fontSize: 13, color: "#9ca3af", padding: 2 },
  filterBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center",
  },
  filterIcon: { fontSize: 16, color: "#374151", fontWeight: "700" },

  // Category strip
  catStrip: { backgroundColor: "#fff", paddingVertical: 10 },
  catPill: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 50, backgroundColor: "#f3f4f6",
  },
  catPillActive: { backgroundColor: "#111827" },
  catText: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  catTextActive: { color: "#fff" },

  // Sort sheet
  sortSheet: {
    position: "absolute", top: 110, right: 12, zIndex: 200,
    backgroundColor: "#fff", borderRadius: 16, minWidth: 180,
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 20,
    overflow: "hidden",
  },
  sortRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#f3f4f6",
  },
  sortRowActive: { backgroundColor: "#f9fafb" },
  sortLabel: { fontSize: 13, color: "#374151" },
  sortLabelActive: { fontWeight: "700", color: "#111827" },
  sortCheck: { fontSize: 13, color: "#f97316", fontWeight: "700" },

  // Section
  section: { backgroundColor: "#fff", marginTop: 10, paddingHorizontal: 16, paddingVertical: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 12 },
  clearAll: { fontSize: 13, fontWeight: "600", color: "#f97316" },

  // Recent
  recentRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#f9fafb",
  },
  recentIcon: { fontSize: 14 },
  recentText: { flex: 1, fontSize: 14, color: "#374151" },
  recentRemove: { fontSize: 12, color: "#d1d5db", padding: 2 },

  // Trending
  trendingGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  trendingPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 50, backgroundColor: "#f3f4f6",
    borderWidth: 1, borderColor: "#e5e7eb",
  },
  trendingNum: { fontSize: 11, fontWeight: "800", color: "#f97316" },
  trendingText: { fontSize: 13, fontWeight: "500", color: "#374151" },

  // Results header
  resultsHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb",
  },
  resultsCount: { fontSize: 13, color: "#6b7280" },
  activeSort: { fontSize: 12, fontWeight: "600", color: "#f97316" },

  // Product grid
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
  resultGrid: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 120, gap: 12 },

  // Product card
  card: {
    width: CARD_WIDTH, backgroundColor: "#fff", borderRadius: 16, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardImgWrap: { width: "100%", height: 150, backgroundColor: "#f5f5f5" },
  cardImg: { width: "100%", height: "100%" },
  badge: { position: "absolute", top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  discountTag: { position: "absolute", top: 8, right: 8, backgroundColor: "#dc2626", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  discountText: { color: "#fff", fontSize: 10, fontWeight: "700" },
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

  // No results
  noResults: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, paddingHorizontal: 40 },
  noResultsEmoji: { fontSize: 52, marginBottom: 16 },
  noResultsTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 8 },
  noResultsSub: { fontSize: 14, color: "#9ca3af", textAlign: "center", lineHeight: 20, marginBottom: 24 },
  browseCatBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: "#111827", borderRadius: 50 },
  browseCatText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});