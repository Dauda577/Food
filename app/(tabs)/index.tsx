import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity } from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { Heart, Star, Plus, ChevronRight, Flame } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from '../../context/ThemeContext';

const Index = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeCategory, setActiveCategory] = useState(1);
  const [favorites, setFavorites] = useState<Record<number, boolean>>({});
  const scrollViewRef = useRef<ScrollView>(null);
  const { theme } = useTheme();

  const carouselItems = [
    {
      id: 1,
      title: "Our Best Seller!",
      subtitle: "Loved by thousands,\nnow it's your turn!",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60",
      bg: "#FF6B35",
    },
    {
      id: 2,
      title: "Pizza Special!",
      subtitle: "Fresh ingredients,\nauthentic taste!",
      image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=500&q=60",
      bg: "#E63946",
    },
    {
      id: 3,
      title: "Chicken Delight!",
      subtitle: "Crispy and delicious\nevery time!",
      image: "https://images.unsplash.com/photo-1626082927389-6cd097cda1ec?auto=format&fit=crop&w=500&q=60",
      bg: "#2D6A4F",
    },
    {
      id: 4,
      title: "Salad Fresh!",
      subtitle: "Healthy and tasty\noptions await!",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=60",
      bg: "#457B9D",
    },
  ];

  const popularMeals = [
    {
      id: 1,
      name: "Jumbo Burger",
      description: "Beef patty, cheddar, caramelized onions & house sauce.",
      rating: 4.8,
      reviews: 320,
      price: 5900,
      image: "https://images.unsplash.com/photo-1551782450-17144efb9c50?auto=format&fit=crop&w=500&q=60",
    },
    {
      id: 2,
      name: "Margherita Pizza",
      description: "Classic tomato sauce, fresh mozzarella & basil leaves.",
      rating: 4.7,
      reviews: 210,
      price: 5900,
      image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=500&q=60",
    },
  ];

  const categories = [
    { id: 1, name: "All",     icon: "https://cdn-icons-png.flaticon.com/512/1046/1046784.png" },
    { id: 2, name: "Burger",  icon: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png" },
    { id: 3, name: "Pizza",   icon: "https://cdn-icons-png.flaticon.com/512/1404/1404945.png" },
    { id: 4, name: "Chicken", icon: "https://cdn-icons-png.flaticon.com/512/1046/1046751.png" },
    { id: 5, name: "Salad",   icon: "https://cdn-icons-png.flaticon.com/512/2515/2515183.png" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % carouselItems.length;
        scrollViewRef.current?.scrollTo({ x: next * 340, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleScroll = (e: any) => {
    const slide = Math.round(e.nativeEvent.contentOffset.x / 340);
    setActiveSlide(slide);
  };

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Banner Carousel ── */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          style={[styles.carouselContainer, { backgroundColor: theme.cardBackground }]}
          decelerationRate="fast"
          snapToInterval={340}
        >
          {carouselItems.map((item) => (
            <View key={item.id} style={[styles.bannerCard, { backgroundColor: item.bg }]}>
              <View style={styles.bannerCircle1} />
              <View style={styles.bannerCircle2} />

              <View style={styles.bannerContent}>
                <View style={styles.bannerTextContent}>
                  <View style={styles.bannerBadge}>
                    <Text style={[styles.bannerBadgeText, { color: theme.textColor }]}>🔥 Hot Deal</Text>
                  </View>
                  <Text style={[styles.bannerTitle, { color: theme.textColor }]}>{item.title}</Text>
                  <Text style={[styles.bannerSubtitle, { color: theme.subTextColor }]}>{item.subtitle}</Text>
                  <TouchableOpacity style={styles.orderButton}>
                    <Text style={[styles.orderButtonText, { color: theme.accentColor }]}>Order now</Text>
                    <ChevronRight size={14} color={item.bg} />
                  </TouchableOpacity>
                </View>
                <Image source={{ uri: item.image }} style={styles.bannerFoodImage} />
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.paginationDots}>
          {carouselItems.map((_, i) => (
            <View key={i} style={[styles.dot, activeSlide === i && styles.activeDot]} />
          ))}
        </View>

        {/* ── Categories ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Categories</Text>
          <TouchableOpacity style={styles.seeMoreBtn}>
            <Text style={[styles.seeMoreText, { color: theme.accentColor }]}>See all</Text>
            <ChevronRight size={14} color={theme.accentColor} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer} contentContainerStyle={{ paddingRight: 16 }}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryCard, { backgroundColor: theme.cardBackground }]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <View style={[styles.categoryIconWrap, activeCategory === cat.id && styles.categoryIconWrapActive]}>
                <Image source={{ uri: cat.icon }} style={styles.categoryIcon} resizeMode="contain" />
              </View>
              <Text style={[styles.categoryName, { color: theme.textColor }]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Popular Meals ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Popular Meals</Text>
          <TouchableOpacity style={styles.seeMoreBtn}>
            <Text style={[styles.seeMoreText, { color: theme.accentColor }]}>See all</Text>
            <ChevronRight size={14} color={theme.accentColor} />
          </TouchableOpacity>
        </View>

        <View style={styles.mealsContainer}>
          {popularMeals.map((meal) => (
            <View key={meal.id} style={[styles.mealCard, { backgroundColor: theme.cardBackground }]}>
              <View style={styles.mealImageWrap}>
                <Image source={{ uri: meal.image }} style={styles.mealImage} resizeMode="cover" />
                <TouchableOpacity style={styles.favBtn} onPress={() => toggleFavorite(meal.id)}>
                  <Heart
                    size={16}
                    color={favorites[meal.id] ? theme.accentColor : "#ccc"}
                    fill={favorites[meal.id] ? theme.accentColor : "transparent"}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.mealInfo}>
                <Text style={[styles.mealName, { color: theme.textColor }]}>{meal.name}</Text>
                <Text style={[styles.mealDescription, { color: theme.subTextColor }]} numberOfLines={2}>
                  {meal.description}
                </Text>

                <View style={styles.mealMeta}>
                  <View style={styles.ratingPill}>
                    <Star size={11} color="#F4A535" fill="#F4A535" />
                    <Text style={styles.ratingText}>{meal.rating}</Text>
                    <Text style={[styles.reviewCount, { color: theme.subTextColor }]}>({meal.reviews})</Text>
                  </View>
                  <View style={styles.pricePill}>
                    <Flame size={11} color={theme.accentColor} />
                    <Text style={[styles.priceText, { color: theme.accentColor }]}>{meal.price.toLocaleString()} C</Text>
                  </View>
                </View>

                <View style={styles.mealCardFooter}>
                  <Text style={[styles.popularLabel, { color: theme.subTextColor }]}>⚡ Popular choice</Text>
                  <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.accentColor }]}>
                    <Plus size={14} color="#fff" />
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Index;

// ── Styles remain the same ──
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  scrollContent: { paddingBottom: 24 },

  carouselContainer: { marginTop: 16, marginBottom: 4 },
  bannerCard: { width: 308, marginLeft: 20, borderRadius: 22, padding: 20, height: 150, overflow: "hidden", justifyContent: "center" },
  bannerCircle1: { position: "absolute", width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255,255,255,0.08)", top: -40, right: -20 },
  bannerCircle2: { position: "absolute", width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.06)", bottom: -30, right: 60 },
  bannerContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bannerTextContent: { flex: 1 },
  bannerBadge: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start", marginBottom: 6 },
  bannerBadgeText: { fontSize: 10, fontWeight: "600" },
  bannerTitle: { fontSize: 17, fontWeight: "800", letterSpacing: -0.3, marginBottom: 2 },
  bannerSubtitle: { fontSize: 11, lineHeight: 16, marginBottom: 10 },
  orderButton: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 2 },
  orderButtonText: { fontSize: 12, fontWeight: "700" },
  bannerFoodImage: { width: 100, height: 100, borderRadius: 50, marginLeft: 8, borderWidth: 3, borderColor: "rgba(255,255,255,0.3)" },

  paginationDots: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 12, marginBottom: 8, gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#ddd" },
  activeDot: { backgroundColor: "#FF6B35", width: 18, borderRadius: 3 },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginTop: 22, marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  seeMoreBtn: { flexDirection: "row", alignItems: "center" },
  seeMoreText: { fontSize: 13, fontWeight: "600" },

  categoriesContainer: { paddingLeft: 20 },
  categoryCard: { alignItems: "center", marginRight: 12, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  categoryIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#f5f5f5", alignItems: "center", justifyContent: "center", marginBottom: 6 },
  categoryIconWrapActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  categoryIcon: { width: 28, height: 28 },
  categoryName: { fontSize: 11, fontWeight: "600" },

  mealsContainer: { paddingHorizontal: 20 },
  mealCard: { flexDirection: "row", borderRadius: 20, marginBottom: 14, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3 },
  mealImageWrap: { position: "relative" },
  mealImage: { width: 96, height: 96, borderRadius: 16 },
  favBtn: { position: "absolute", top: 6, right: 6, width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  mealInfo: { flex: 1, marginLeft: 14, justifyContent: "space-between" },
  mealName: { fontSize: 15, fontWeight: "800", letterSpacing: -0.3, marginBottom: 3 },
  mealDescription: { fontSize: 11.5, lineHeight: 17, marginBottom: 8 },
  mealMeta: { flexDirection: "row", gap: 8, marginBottom: 8 },
  ratingPill: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#FFF8EE", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  ratingText: { fontSize: 11, fontWeight: "700", color: "#F4A535" },
  reviewCount: { fontSize: 10 },
  pricePill: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#FFF2EE", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  priceText: { fontSize: 11, fontWeight: "700" },
  mealCardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  popularLabel: { fontSize: 10.5, fontWeight: "500" },
  addButton: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, flexDirection: "row", alignItems: "center", gap: 4 },
  addButtonText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  bottomSpace: { height: 80 },
});