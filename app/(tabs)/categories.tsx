import {
  StyleSheet, Text, View, Image, ScrollView,
  TouchableOpacity, Dimensions,
} from "react-native";
import React, { useState, useEffect } from "react";
import { ChevronRight, Flame, Clock } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 20 * 2 - 12) / 2;

const Categories = () => {
  const { theme } = useTheme();
  const route = useRoute();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    if (route.params?.searchQuery !== undefined) {
      setSearchQuery(route.params.searchQuery);
    }
    if (route.params?.activeFilter !== undefined) {
      setActiveFilter(route.params.activeFilter);
    }
  }, [route.params]);

  const featured = [
    {
      id: 1,
      name: "Burgers",
      tagline: "Bold, juicy & stacked",
      count: 48,
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
      bg: "#FF6B35",
      badge: "🔥 Trending",
    },
    {
      id: 2,
      name: "Pizza",
      tagline: "Stone-baked perfection",
      count: 36,
      image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80",
      bg: "#E63946",
      badge: "⚡ Popular",
    },
  ];

  const allCategories = [
    {
      id: 1, name: "Burgers", count: 48, emoji: "🍔",
      bg: "#FFF3EE", accent: "#FF6B35",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=70",
      tag: "Popular", time: "15–25 min",
    },
    {
      id: 2, name: "Pizza", count: 36, emoji: "🍕",
      bg: "#FFF0F0", accent: "#E63946",
      image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=300&q=70",
      tag: "Popular", time: "20–35 min",
    },
    {
      id: 3, name: "Chicken", count: 29, emoji: "🍗",
      bg: "#FFFBEE", accent: "#F4A535",
      image: "https://images.unsplash.com/photo-1626082927389-6cd097cda1ec?auto=format&fit=crop&w=300&q=70",
      tag: "New", time: "15–20 min",
    },
    {
      id: 4, name: "Salads", count: 21, emoji: "🥗",
      bg: "#EFFFEF", accent: "#2D6A4F",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=70",
      tag: "Offers", time: "10–15 min",
    },
    {
      id: 5, name: "Sushi", count: 33, emoji: "🍣",
      bg: "#EEF6FF", accent: "#457B9D",
      image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=300&q=70",
      tag: "New", time: "25–40 min",
    },
    {
      id: 6, name: "Pasta", count: 18, emoji: "🍝",
      bg: "#FFF6EE", accent: "#D4813A",
      image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=300&q=70",
      tag: "Offers", time: "20–30 min",
    },
    {
      id: 7, name: "Desserts", count: 41, emoji: "🍰",
      bg: "#FFF0F8", accent: "#C77DFF",
      image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=300&q=70",
      tag: "Popular", time: "10–20 min",
    },
    {
      id: 8, name: "Drinks", count: 55, emoji: "🥤",
      bg: "#EEF9FF", accent: "#48CAE4",
      image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=300&q=70",
      tag: "Popular", time: "5–10 min",
    },
    {
      id: 9, name: "Tacos", count: 14, emoji: "🌮",
      bg: "#FFFBEE", accent: "#E9C46A",
      image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=300&q=70",
      tag: "New", time: "15–25 min",
    },
    {
      id: 10, name: "Noodles", count: 22, emoji: "🍜",
      bg: "#FFF3EE", accent: "#E76F51",
      image: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?auto=format&fit=crop&w=300&q=70",
      tag: "Offers", time: "20–30 min",
    },
  ];

  const filtered = allCategories.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "All" || c.tag === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]} edges={["left","right","bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { backgroundColor: theme.backgroundColor }]}>
        
        {searchQuery === "" && activeFilter === "All" && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Featured</Text>
              <TouchableOpacity style={styles.seeAllBtn}>
                <Text style={[styles.seeAllText, { color: theme.accentColor }]}>See all</Text>
                <ChevronRight size={13} color={theme.accentColor} />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 20 }}
              style={styles.featuredRow}
            >
              {featured.map((item) => (
                <TouchableOpacity key={item.id} style={[styles.featuredCard, { backgroundColor: theme.cardBackground }]}>
                  <View style={styles.featuredCircle} />
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredBadgeText}>{item.badge}</Text>
                  </View>

                  <Text style={[styles.featuredName, { color: theme.textColor }]}>{item.name}</Text>
                  <Text style={[styles.featuredTagline, { color: theme.textColor }]}>{item.tagline}</Text>

                  <View style={styles.featuredMeta}>
                    <Flame size={12} color="rgba(255,255,255,0.9)" />
                    <Text style={[styles.featuredCount, { color: theme.textColor }]}>{item.count} items</Text>
                  </View>

                  <TouchableOpacity style={styles.featuredBtn}>
                    <Text style={[styles.featuredBtnText, { color: theme.accentColor }]}>Explore</Text>
                    <ChevronRight size={13} color={item.bg} />
                  </TouchableOpacity>

                  <Image source={{ uri: item.image }} style={styles.featuredImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            {activeFilter === "All" ? "All Categories" : activeFilter}
          </Text>
          <Text style={[styles.countLabel, { color: theme.textColor }]}>{filtered.length} found</Text>
        </View>

        <View style={styles.grid}>
          {filtered.map((cat) => (
            <TouchableOpacity key={cat.id} style={[styles.card, { backgroundColor: theme.cardBackground }]}>
              <View style={styles.cardTop}>
                <View style={[styles.emojiWrap, { backgroundColor: cat.accent + "22" }]}>
                  <Text style={styles.cardEmoji}>{cat.emoji}</Text>
                </View>
                <View style={[styles.tagPill, { backgroundColor: cat.accent + "18" }]}>
                  <Text style={[styles.tagText, { color: cat.accent }]}>{cat.tag}</Text>
                </View>
              </View>

              <Image source={{ uri: cat.image }} style={styles.cardImage} resizeMode="cover" />

              <Text style={[styles.cardName, { color: theme.textColor }]}>{cat.name}</Text>
              <Text style={[styles.cardCount, { color: theme.textColor }]}>{cat.count} items</Text>

              <View style={styles.cardFooter}>
                <View style={styles.timeRow}>
                  <Clock size={10} color={theme.textColor} />
                  <Text style={[styles.timeText, { color: theme.textColor }]}>{cat.time}</Text>
                </View>
                <View style={[styles.arrowBtn, { backgroundColor: cat.accent }]}>
                  <ChevronRight size={13} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Categories;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  scroll: { paddingBottom: 20, paddingTop: 0 },

  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 20,
    marginBottom: 5, marginTop: 20,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  seeAllBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAllText: { fontSize: 13, fontWeight: "600" },
  countLabel: { fontSize: 13, fontWeight: "500" },

  featuredRow: { paddingLeft: 20 },
  featuredCard: {
    width: 230, height: 150, borderRadius: 20,
    padding: 16, marginRight: 12, overflow: "hidden",
    justifyContent: "space-between",
  },
  featuredCircle: {
    position: "absolute", width: 140, height: 140,
    borderRadius: 70, backgroundColor: "rgba(255,255,255,0.09)",
    top: -30, right: -30,
  },
  featuredBadge: {
    backgroundColor: "rgba(255,255,255,0.22)", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start",
  },
  featuredBadgeText: { fontSize: 10, fontWeight: "700" },
  featuredName: { fontSize: 20, fontWeight: "800", letterSpacing: -0.4, marginTop: 4 },
  featuredTagline: { fontSize: 11, marginTop: 2 },
  featuredMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  featuredCount: { fontSize: 11, fontWeight: "600" },
  featuredBtn: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
    flexDirection: "row", alignItems: "center", gap: 2, alignSelf: "flex-start",
  },
  featuredBtnText: { fontSize: 12, fontWeight: "700" },
  featuredImage: {
    position: "absolute", width: 90, height: 90,
    borderRadius: 45, right: 10, bottom: 10,
    borderWidth: 3, borderColor: "rgba(255,255,255,0.25)",
  },

  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, gap: 12 },
  card: { width: CARD_WIDTH, borderRadius: 20, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  emojiWrap: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  cardEmoji: { fontSize: 20 },
  tagPill: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 10, fontWeight: "700" },
  cardImage: { width: "100%", height: 90, borderRadius: 14, marginBottom: 10 },
  cardName: { fontSize: 15, fontWeight: "800", letterSpacing: -0.3, marginBottom: 2 },
  cardCount: { fontSize: 11, marginBottom: 10 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  timeText: { fontSize: 10, fontWeight: "500" },
  arrowBtn: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },

  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "800", marginBottom: 6 },
  emptySub: { fontSize: 13 },
});