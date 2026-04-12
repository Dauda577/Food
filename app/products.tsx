import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    View, Text, ScrollView, FlatList, TouchableOpacity, StyleSheet,
    Dimensions, Image, TextInput, StatusBar, Animated, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase"; // 👈 adjust if needed

const { width } = Dimensions.get("window");
const CARD_W = (width - 48) / 2; // 2 columns with padding
const TAB_BAR_HEIGHT = 65;
const PAGE_SIZE = 20;

// ── Types ─────────────────────────────────────────────────────────────────────

type Product = {
    id: string;
    name: string;
    brand: string | null;
    price: number;
    original_price: number | null;
    image: string | null;
    images: string[];
    rating: number;
    review_count: number;
    badge: string | null;
    in_stock: boolean;
};

type SortKey = "newest" | "price_asc" | "price_desc" | "rating";

const SORT_OPTIONS: { key: SortKey; label: string; icon: string }[] = [
    { key: "newest", label: "Newest", icon: "time-outline" },
    { key: "price_asc", label: "Price: Low–High", icon: "arrow-up-outline" },
    { key: "price_desc", label: "Price: High–Low", icon: "arrow-down-outline" },
    { key: "rating", label: "Top Rated", icon: "star-outline" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatPrice = (price: number) =>
    `GH₵ ${price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

const discount = (price: number, original: number) =>
    Math.round(((original - price) / original) * 100);

// ── Skeleton card ─────────────────────────────────────────────────────────────

const SkeletonCard = () => (
    <View style={[styles.card, { width: CARD_W }]}>
        <View style={sk.img} />
        <View style={sk.brand} />
        <View style={sk.name} />
        <View style={sk.price} />
    </View>
);

// ── Product Card ──────────────────────────────────────────────────────────────

const ProductCard = ({
    item,
    onPress,
    onWishlist,
    wishlisted,
}: {
    item: Product;
    onPress: (id: string) => void;
    onWishlist: (id: string) => void;
    wishlisted: boolean;
}) => {
    const scale = useRef(new Animated.Value(1)).current;
    const press = (to: number) =>
        Animated.spring(scale, { toValue: to, useNativeDriver: true }).start();

    const thumb = item.images?.[0] ?? item.image;
    const hasDiscount = item.original_price && item.original_price > item.price;

    return (
        <Animated.View style={[styles.card, { width: CARD_W, transform: [{ scale }] }]}>
            <TouchableOpacity
                onPressIn={() => press(0.97)}
                onPressOut={() => press(1)}
                onPress={() => onPress(item.id)}
                activeOpacity={0.95}
            >
                {/* Image */}
                <View style={styles.cardImgWrap}>
                    {thumb ? (
                        <Image source={{ uri: thumb }} style={styles.cardImg} resizeMode="cover" />
                    ) : (
                        <View style={styles.cardImgPlaceholder}>
                            <Ionicons name="image-outline" size={36} color="#cbd5e1" />
                        </View>
                    )}

                    {/* Badge */}
                    {item.badge && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{item.badge}</Text>
                        </View>
                    )}

                    {/* Discount pill */}
                    {hasDiscount && (
                        <View style={styles.discountPill}>
                            <Text style={styles.discountText}>
                                -{discount(item.price, item.original_price!)}%
                            </Text>
                        </View>
                    )}

                    {/* Out of stock overlay */}
                    {!item.in_stock && (
                        <View style={styles.outOfStockOverlay}>
                            <Text style={styles.outOfStockText}>Out of Stock</Text>
                        </View>
                    )}

                    {/* Wishlist button */}
                    <TouchableOpacity
                        style={styles.wishlistBtn}
                        onPress={() => onWishlist(item.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons
                            name={wishlisted ? "heart" : "heart-outline"}
                            size={18}
                            color={wishlisted ? "#f97316" : "#64748b"}
                        />
                    </TouchableOpacity>
                </View>

                {/* Info */}
                <View style={styles.cardInfo}>
                    {item.brand && (
                        <Text style={styles.cardBrand} numberOfLines={1}>{item.brand}</Text>
                    )}
                    <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>

                    {/* Rating */}
                    {item.rating > 0 && (
                        <View style={styles.ratingRow}>
                            <Ionicons name="star" size={11} color="#f59e0b" />
                            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                            {item.review_count > 0 && (
                                <Text style={styles.reviewCount}>({item.review_count})</Text>
                            )}
                        </View>
                    )}

                    {/* Price */}
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>{formatPrice(item.price)}</Text>
                        {hasDiscount && (
                            <Text style={styles.originalPrice}>
                                {formatPrice(item.original_price!)}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Add to cart strip */}
                <TouchableOpacity
                    style={[styles.addToCartBtn, !item.in_stock && styles.addToCartDisabled]}
                    disabled={!item.in_stock}
                >
                    <Ionicons name="cart-outline" size={14} color={item.in_stock ? "#f97316" : "#94a3b8"} />
                    <Text style={[styles.addToCartText, !item.in_stock && styles.addToCartTextDisabled]}>
                        {item.in_stock ? "Add to Cart" : "Unavailable"}
                    </Text>
                </TouchableOpacity>
            </TouchableOpacity>
        </Animated.View>
    );
};

// ── Sort Sheet ────────────────────────────────────────────────────────────────

const SortSheet = ({
    visible,
    current,
    onSelect,
    onClose,
}: {
    visible: boolean;
    current: SortKey;
    onSelect: (key: SortKey) => void;
    onClose: () => void;
}) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sortSheet}>
            <View style={styles.sortHandle} />
            <Text style={styles.sortTitle}>Sort By</Text>
            {SORT_OPTIONS.map((opt) => {
                const active = current === opt.key;
                return (
                    <TouchableOpacity
                        key={opt.key}
                        style={[styles.sortOption, active && styles.sortOptionActive]}
                        onPress={() => { onSelect(opt.key); onClose(); }}
                    >
                        <View style={styles.sortOptionLeft}>
                            <Ionicons
                                name={opt.icon as any}
                                size={18}
                                color={active ? "#f97316" : "#64748b"}
                            />
                            <Text style={[styles.sortOptionText, active && styles.sortOptionTextActive]}>
                                {opt.label}
                            </Text>
                        </View>
                        {active && <Ionicons name="checkmark" size={18} color="#f97316" />}
                    </TouchableOpacity>
                );
            })}
        </View>
    </Modal>
);

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ProductsScreen() {
    const router = useRouter();
    const { categoryId, categoryName } = useLocalSearchParams<{
        categoryId: string;
        categoryName: string;
    }>();

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("newest");
    const [showSort, setShowSort] = useState(false);
    const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());
    const [totalCount, setTotalCount] = useState<number | null>(null);

    const pageRef = useRef(0);

    // ── Build Supabase query ────────────────────────────────────────────────────
    const buildQuery = useCallback(
        (from: number, to: number, search: string, sort: SortKey) => {
            let q = supabase
                .from("products")
                .select("id, name, brand, price, original_price, image, images, rating, review_count, badge, in_stock", { count: "exact" })
                .eq("category_id", categoryId)
                .range(from, to);

            if (search.trim()) {
                q = q.ilike("name", `%${search.trim()}%`);
            }

            switch (sort) {
                case "newest": q = q.order("created_at", { ascending: false }); break;
                case "price_asc": q = q.order("price", { ascending: true }); break;
                case "price_desc": q = q.order("price", { ascending: false }); break;
                case "rating": q = q.order("rating", { ascending: false }); break;
            }

            return q;
        },
        [categoryId]
    );

    // ── Initial / reset load ────────────────────────────────────────────────────
    const loadProducts = useCallback(
        async (search: string, sort: SortKey) => {
            setLoading(true);
            setProducts([]);
            pageRef.current = 0;
            setHasMore(true);

            const { data, error, count } = await buildQuery(0, PAGE_SIZE - 1, search, sort);

            if (!error && data) {
                setProducts(data);
                setTotalCount(count);
                setHasMore(data.length === PAGE_SIZE);
                pageRef.current = 1;
            }
            setLoading(false);
        },
        [buildQuery]
    );

    // ── Load more (pagination) ──────────────────────────────────────────────────
    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);

        const from = pageRef.current * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data, error } = await buildQuery(from, to, searchQuery, sortKey);

        if (!error && data) {
            setProducts((prev) => [...prev, ...data]);
            setHasMore(data.length === PAGE_SIZE);
            pageRef.current += 1;
        }
        setLoadingMore(false);
    }, [loadingMore, hasMore, buildQuery, searchQuery, sortKey]);

    // ── Re-load on sort or search change ────────────────────────────────────────
    useEffect(() => {
        loadProducts(searchQuery, sortKey);
    }, [sortKey]); // sortKey triggers reload; search uses debounce below

    // ── Debounced search ────────────────────────────────────────────────────────
    useEffect(() => {
        const t = setTimeout(() => loadProducts(searchQuery, sortKey), 350);
        return () => clearTimeout(t);
    }, [searchQuery]);

    // ── Initial load ────────────────────────────────────────────────────────────
    useEffect(() => {
        loadProducts("", "newest");
    }, [categoryId]);

    const toggleWishlist = (id: string) =>
        setWishlisted((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    const currentSortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? "Sort";

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {categoryName ?? "Products"}
                    </Text>
                    {totalCount !== null && (
                        <Text style={styles.headerSub}>{totalCount} items</Text>
                    )}
                </View>
                <TouchableOpacity style={styles.iconBtn}>
                    <Ionicons name="cart-outline" size={22} color="#1e293b" />
                </TouchableOpacity>
            </View>

            {/* Search + Sort bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <Ionicons name="search-outline" size={18} color="#94a3b8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={`Search in ${categoryName ?? "products"}...`}
                        placeholderTextColor="#94a3b8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                            <Ionicons name="close-circle" size={16} color="#94a3b8" />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSort(true)}>
                    <Ionicons name="swap-vertical-outline" size={16} color="#f97316" />
                    <Text style={styles.sortBtnText} numberOfLines={1}>{currentSortLabel}</Text>
                </TouchableOpacity>
            </View>

            {/* Grid */}
            {loading ? (
                <ScrollView contentContainerStyle={styles.grid}>
                    {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </ScrollView>
            ) : products.length === 0 ? (
                <View style={styles.emptyWrap}>
                    <Ionicons name="search-outline" size={52} color="#cbd5e1" />
                    <Text style={styles.emptyTitle}>No products found</Text>
                    <Text style={styles.emptySubtitle}>
                        {searchQuery
                            ? `No results for "${searchQuery}"`
                            : "This category has no products yet"}
                    </Text>
                    {searchQuery ? (
                        <TouchableOpacity style={styles.clearBtn} onPress={() => setSearchQuery("")}>
                            <Text style={styles.clearBtnText}>Clear Search</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={
                        loadingMore ? (
                            <View style={styles.loadMoreRow}>
                                <View style={sk.loadMoreDot} />
                                <View style={[sk.loadMoreDot, { opacity: 0.6 }]} />
                                <View style={[sk.loadMoreDot, { opacity: 0.3 }]} />
                            </View>
                        ) : null
                    }
                    renderItem={({ item }) => (
                        <ProductCard
                            item={item}
                            onPress={(id) => router.push(`/product/${id}`)}
                            onWishlist={toggleWishlist}
                            wishlisted={wishlisted.has(item.id)}
                        />
                    )}
                />
            )}

            {/* Sort Sheet */}
            <SortSheet
                visible={showSort}
                current={sortKey}
                onSelect={setSortKey}
                onClose={() => setShowSort(false)}
            />
        </SafeAreaView>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#fff" },

    header: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
    },
    headerTitle: { fontSize: 17, fontWeight: "700", color: "#0f172a", letterSpacing: -0.3 },
    headerSub: { fontSize: 12, color: "#94a3b8", marginTop: 1 },
    iconBtn: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: "#f8fafc",
        alignItems: "center", justifyContent: "center",
    },

    searchContainer: {
        flexDirection: "row", alignItems: "center", gap: 10,
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
    },
    searchBox: {
        flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
        backgroundColor: "#f8fafc", paddingHorizontal: 12, paddingVertical: 10,
        borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0",
    },
    searchInput: { flex: 1, fontSize: 13, color: "#0f172a", padding: 0 },
    sortBtn: {
        flexDirection: "row", alignItems: "center", gap: 6,
        paddingHorizontal: 12, paddingVertical: 10,
        backgroundColor: "#fff7ed", borderRadius: 12,
        borderWidth: 1, borderColor: "#fed7aa",
        maxWidth: 130,
    },
    sortBtnText: { fontSize: 12, fontWeight: "600", color: "#f97316", flexShrink: 1 },

    grid: { flexDirection: "row", flexWrap: "wrap", padding: 12, gap: 12 },
    listContent: { padding: 12, paddingBottom: TAB_BAR_HEIGHT + 20 },
    row: { gap: 12, marginBottom: 12 },

    // Card
    card: {
        backgroundColor: "#fff", borderRadius: 16, overflow: "hidden",
        borderWidth: 1, borderColor: "#f1f5f9",
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    },
    cardImgWrap: {
        width: "100%", aspectRatio: 1, backgroundColor: "#f8fafc",
        position: "relative",
    },
    cardImg: { width: "100%", height: "100%" },
    cardImgPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },

    badge: {
        position: "absolute", top: 8, left: 8,
        backgroundColor: "#f97316", paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 6,
    },
    badgeText: { fontSize: 10, fontWeight: "800", color: "#fff", letterSpacing: 0.3 },

    discountPill: {
        position: "absolute", top: 8, right: 36,
        backgroundColor: "#dc2626", paddingHorizontal: 6, paddingVertical: 3,
        borderRadius: 6,
    },
    discountText: { fontSize: 10, fontWeight: "700", color: "#fff" },

    outOfStockOverlay: {
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(255,255,255,0.7)",
        alignItems: "center", justifyContent: "center",
    },
    outOfStockText: { fontSize: 12, fontWeight: "700", color: "#64748b" },

    wishlistBtn: {
        position: "absolute", top: 8, right: 8,
        width: 28, height: 28, borderRadius: 8,
        backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
    },

    cardInfo: { padding: 10, gap: 3 },
    cardBrand: { fontSize: 10, color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
    cardName: { fontSize: 13, fontWeight: "600", color: "#0f172a", lineHeight: 18 },

    ratingRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
    ratingText: { fontSize: 11, fontWeight: "700", color: "#f59e0b" },
    reviewCount: { fontSize: 11, color: "#94a3b8" },

    priceRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" },
    price: { fontSize: 14, fontWeight: "800", color: "#0f172a" },
    originalPrice: { fontSize: 11, color: "#94a3b8", textDecorationLine: "line-through" },

    addToCartBtn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
        paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#f1f5f9",
    },
    addToCartDisabled: { backgroundColor: "#f8fafc" },
    addToCartText: { fontSize: 12, fontWeight: "700", color: "#f97316" },
    addToCartTextDisabled: { color: "#94a3b8" },

    // Empty state
    emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 32 },
    emptyTitle: { fontSize: 17, fontWeight: "700", color: "#0f172a" },
    emptySubtitle: { fontSize: 13, color: "#94a3b8", textAlign: "center" },
    clearBtn: {
        marginTop: 8, paddingHorizontal: 24, paddingVertical: 10,
        backgroundColor: "#f97316", borderRadius: 12,
    },
    clearBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },

    // Sort sheet
    modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
    sortSheet: {
        backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
    },
    sortHandle: {
        width: 40, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0",
        alignSelf: "center", marginBottom: 20,
    },
    sortTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 12 },
    sortOption: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, marginBottom: 4,
    },
    sortOptionActive: { backgroundColor: "#fff7ed" },
    sortOptionLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    sortOptionText: { fontSize: 14, fontWeight: "500", color: "#334155" },
    sortOptionTextActive: { color: "#f97316", fontWeight: "700" },

    // Load more
    loadMoreRow: { flexDirection: "row", justifyContent: "center", gap: 6, paddingVertical: 20 },
});

const sk = StyleSheet.create({
    img: { width: "100%", aspectRatio: 1, backgroundColor: "#e2e8f0" },
    brand: { width: 60, height: 9, borderRadius: 4, backgroundColor: "#e2e8f0", margin: 10, marginBottom: 4 },
    name: { width: "80%", height: 12, borderRadius: 4, backgroundColor: "#e2e8f0", marginHorizontal: 10, marginBottom: 4 },
    price: { width: 70, height: 14, borderRadius: 4, backgroundColor: "#e2e8f0", marginHorizontal: 10, marginBottom: 10 },
    loadMoreDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#f97316" },
});