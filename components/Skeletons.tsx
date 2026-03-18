import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Dimensions, ViewStyle } from "react-native";

const { width } = Dimensions.get("window");

// ── Base shimmer ──────────────────────────────────────────────────────────────
export const Shimmer = ({ style }: { style?: ViewStyle }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });

  return (
    <Animated.View
      style={[styles.shimmer, style, { opacity }]}
    />
  );
};

// ── Product card skeleton ─────────────────────────────────────────────────────
export const ProductCardSkeleton = () => (
  <View style={styles.card}>
    <Shimmer style={styles.cardImg} />
    <View style={styles.cardBody}>
      <Shimmer style={styles.line1} />
      <Shimmer style={styles.line2} />
      <Shimmer style={styles.line3} />
      <View style={styles.priceRow}>
        <Shimmer style={styles.price} />
        <Shimmer style={styles.addBtn} />
      </View>
    </View>
  </View>
);

// ── Product grid skeleton ─────────────────────────────────────────────────────
export const ProductGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <View style={styles.grid}>
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </View>
);

// ── Banner skeleton ───────────────────────────────────────────────────────────
export const BannerSkeleton = () => (
  <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
    <Shimmer style={styles.banner} />
  </View>
);

// ── Category pill skeleton ────────────────────────────────────────────────────
export const CategoryPillsSkeleton = () => (
  <View style={styles.pillRow}>
    {[80, 100, 70, 90, 80].map((w, i) => (
      <Shimmer key={i} style={[styles.pill, { width: w }]} />
    ))}
  </View>
);

// ── Profile skeleton ──────────────────────────────────────────────────────────
export const ProfileSkeleton = () => (
  <View style={styles.profileWrap}>
    <Shimmer style={styles.avatar} />
    <Shimmer style={styles.profileName} />
    <Shimmer style={styles.profileEmail} />
    <View style={styles.statsRow}>
      {[1, 2, 3].map(i => (
        <View key={i} style={styles.statItem}>
          <Shimmer style={styles.statVal} />
          <Shimmer style={styles.statLabel} />
        </View>
      ))}
    </View>
  </View>
);

// ── Order card skeleton ───────────────────────────────────────────────────────
export const OrderCardSkeleton = () => (
  <View style={styles.orderCard}>
    <View>
      <Shimmer style={styles.orderTitle} />
      <Shimmer style={styles.orderSub} />
    </View>
    <View style={{ alignItems: "flex-end", gap: 6 }}>
      <Shimmer style={styles.orderPrice} />
      <Shimmer style={styles.orderBadge} />
    </View>
  </View>
);

// ── Notification skeleton ─────────────────────────────────────────────────────
export const NotifSkeleton = () => (
  <View style={styles.notifRow}>
    <Shimmer style={styles.notifIcon} />
    <View style={{ flex: 1, gap: 6 }}>
      <Shimmer style={styles.notifTitle} />
      <Shimmer style={styles.notifBody} />
      <Shimmer style={styles.notifTime} />
    </View>
  </View>
);

// ── Full home screen skeleton ─────────────────────────────────────────────────
export const HomeScreenSkeleton = () => (
  <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
    <BannerSkeleton />
    <CategoryPillsSkeleton />
    <ProductGridSkeleton count={6} />
  </View>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const CARD_W = (width - 48) / 2;

const styles = StyleSheet.create({
  shimmer: { backgroundColor: "#e5e7eb", borderRadius: 8 },

  // Card
  card: { width: CARD_W, backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", marginBottom: 4, elevation: 2 },
  cardImg: { width: "100%", height: 150, borderRadius: 0 },
  cardBody: { padding: 10, gap: 8 },
  line1: { height: 10, width: "50%", borderRadius: 5 },
  line2: { height: 13, width: "90%", borderRadius: 5 },
  line3: { height: 10, width: "60%", borderRadius: 5 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  price: { height: 16, width: 60, borderRadius: 5 },
  addBtn: { width: 30, height: 30, borderRadius: 10 },

  // Grid
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 12, justifyContent: "space-between", paddingTop: 12 },

  // Banner
  banner: { height: 160, borderRadius: 20, width: "100%" },

  // Pills
  pillRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  pill: { height: 36, borderRadius: 50 },

  // Profile
  profileWrap: { alignItems: "center", paddingVertical: 28, gap: 10, backgroundColor: "#fff" },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  profileName: { height: 20, width: 160, borderRadius: 8 },
  profileEmail: { height: 13, width: 200, borderRadius: 6 },
  statsRow: { flexDirection: "row", gap: 32, marginTop: 12 },
  statItem: { alignItems: "center", gap: 6 },
  statVal: { height: 20, width: 32, borderRadius: 5 },
  statLabel: { height: 10, width: 48, borderRadius: 5 },

  // Order
  orderCard: { flexDirection: "row", justifyContent: "space-between", padding: 14, borderRadius: 14, backgroundColor: "#f9fafb", marginBottom: 8 },
  orderTitle: { height: 13, width: 120, borderRadius: 5, marginBottom: 6 },
  orderSub: { height: 10, width: 90, borderRadius: 5 },
  orderPrice: { height: 14, width: 60, borderRadius: 5 },
  orderBadge: { height: 20, width: 80, borderRadius: 20 },

  // Notif
  notifRow: { flexDirection: "row", gap: 12, padding: 16, backgroundColor: "#fff", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#f3f4f6" },
  notifIcon: { width: 44, height: 44, borderRadius: 14, flexShrink: 0 },
  notifTitle: { height: 13, width: "80%", borderRadius: 5 },
  notifBody: { height: 11, width: "95%", borderRadius: 5 },
  notifTime: { height: 10, width: 60, borderRadius: 5 },
});