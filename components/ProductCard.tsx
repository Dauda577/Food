import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { Product } from "../constants/categories";
import { useCart } from "../context/CartContext";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  New:  { bg: "#dcfce7", text: "#16a34a" },
  Sale: { bg: "#fee2e2", text: "#dc2626" },
  Hot:  { bg: "#ffedd5", text: "#ea580c" },
};

export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.92}
      onPress={() => router.push(`/product/${product.id}`)}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
        {product.badge && (
          <View style={[styles.badge, { backgroundColor: BADGE_COLORS[product.badge].bg }]}>
            <Text style={[styles.badgeText, { color: BADGE_COLORS[product.badge].text }]}>
              {product.badge}
            </Text>
          </View>
        )}
        {discount && (
          <View style={styles.discount}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.seller} numberOfLines={1}>{product.seller}</Text>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.star}>★</Text>
          <Text style={styles.rating}>{product.rating}</Text>
          <Text style={styles.reviewCount}>({product.reviewCount})</Text>
        </View>
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.price}>${product.price}</Text>
            {product.originalPrice && (
              <Text style={styles.originalPrice}>${product.originalPrice}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(product)} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH, backgroundColor: "#fff", borderRadius: 16,
    overflow: "hidden", marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  imageContainer: { width: "100%", height: 150, backgroundColor: "#f5f5f5" },
  image: { width: "100%", height: "100%" },
  badge: { position: "absolute", top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  discount: { position: "absolute", top: 8, right: 8, backgroundColor: "#dc2626", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  discountText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  info: { padding: 10 },
  seller: { fontSize: 10, color: "#9ca3af", marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 },
  name: { fontSize: 13, fontWeight: "600", color: "#111827", marginBottom: 4, lineHeight: 18 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 2 },
  star: { fontSize: 11, color: "#f59e0b" },
  rating: { fontSize: 11, fontWeight: "600", color: "#374151" },
  reviewCount: { fontSize: 11, color: "#9ca3af" },
  priceRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  price: { fontSize: 15, fontWeight: "700", color: "#111827" },
  originalPrice: { fontSize: 11, color: "#9ca3af", textDecorationLine: "line-through" },
  addBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: "#111827", alignItems: "center", justifyContent: "center" },
  addBtnText: { color: "#fff", fontSize: 18, fontWeight: "300", lineHeight: 22 },
});