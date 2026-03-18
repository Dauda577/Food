import React, { useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
  FlatList, Animated, StatusBar, NativeSyntheticEvent,
  NativeScrollEvent, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    emoji: "🛍️",
    emojisBg: ["🎁", "📦", "🏷️", "💝", "🛒"],
    title: "Shop Everything\nin One Place",
    subtitle: "Browse thousands of products across all categories — electronics, fashion, groceries and more.",
    bg: "#0f172a",
    accent: "#f97316",
  },
  {
    id: "2",
    emoji: "⚡",
    emojisBg: ["🚀", "✈️", "📍", "🏠", "⏱️"],
    title: "Fast & Reliable\nDelivery",
    subtitle: "Get your orders delivered to your doorstep quickly. Track every package in real time.",
    bg: "#111827",
    accent: "#6366f1",
  },
  {
    id: "3",
    emoji: "🔒",
    emojisBg: ["💳", "🛡️", "✅", "💰", "🎉"],
    title: "Safe & Secure\nPayments",
    subtitle: "Pay with confidence using our secure checkout. Multiple payment options available.",
    bg: "#0c1a12",
    accent: "#22c55e",
  },
];

const Bubble = ({ emoji, style }: { emoji: string; style: any }) => (
  <View style={[styles.bubble, style]}>
    <Text style={styles.bubbleEmoji}>{emoji}</Text>
  </View>
);

const Slide = ({ item, index, scrollX }: {
  item: typeof SLIDES[0]; index: number; scrollX: Animated.Value;
}) => {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
  const emojiScale     = scrollX.interpolate({ inputRange, outputRange: [0.6, 1, 0.6], extrapolate: "clamp" });
  const emojiTranslate = scrollX.interpolate({ inputRange, outputRange: [60, 0, -60],  extrapolate: "clamp" });
  const textTranslate  = scrollX.interpolate({ inputRange, outputRange: [80, 0, -80],  extrapolate: "clamp" });
  const opacity        = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0],     extrapolate: "clamp" });

  const bubblePositions = [
    { top: height * 0.08,  left:  width * 0.05 },
    { top: height * 0.14,  right: width * 0.08 },
    { top: height * 0.22,  left:  width * 0.22 },
    { top: height * 0.30,  right: width * 0.15 },
    { top: height * 0.18,  left:  width * 0.55 },
  ];

  return (
    <View style={[styles.slide, { backgroundColor: item.bg, width }]}>
      {item.emojisBg.map((e, i) => (
        <Bubble key={i} emoji={e} style={bubblePositions[i]} />
      ))}
      <Animated.View style={[
        styles.heroWrap,
        { transform: [{ scale: emojiScale }, { translateY: emojiTranslate }], opacity },
      ]}>
        <View style={[styles.heroCircle, { backgroundColor: item.accent + "22" }]}>
          <View style={[styles.heroCircleInner, { backgroundColor: item.accent + "33" }]}>
            <Text style={styles.heroEmoji}>{item.emoji}</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.textBlock, { transform: [{ translateY: textTranslate }], opacity }]}>
        <View style={[styles.accentPill, { backgroundColor: item.accent }]}>
          <Text style={styles.accentPillText}>{`0${index + 1} / 03`}</Text>
        </View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
      </Animated.View>
    </View>
  );
};

export default function OnboardingScreen() {
  const router  = useRouter();
  const flatRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [current, setCurrent] = useState(0);

  const goHome = () => router.replace("/auth");

  const next = () => {
    if (current < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: current + 1, animated: true });
    } else {
      goHome();
    }
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setCurrent(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const isLast = current === SLIDES.length - 1;
  const accent = SLIDES[current].accent;

  const dotWidth = (i: number) =>
    scrollX.interpolate({
      inputRange: [(i - 1) * width, i * width, (i + 1) * width],
      outputRange: [8, 24, 8],
      extrapolate: "clamp",
    });

  const dotOpacity = (i: number) =>
    scrollX.interpolate({
      inputRange: [(i - 1) * width, i * width, (i + 1) * width],
      outputRange: [0.35, 1, 0.35],
      extrapolate: "clamp",
    });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <Animated.FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={s => s.id}
        horizontal pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false, listener: handleScroll }
        )}
        renderItem={({ item, index }) => (
          <Slide item={item} index={index} scrollX={scrollX} />
        )}
      />

      <SafeAreaView style={styles.controls} edges={["bottom"]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Animated.View
              key={i}
              style={[styles.dot, { width: dotWidth(i), opacity: dotOpacity(i), backgroundColor: accent }]}
            />
          ))}
        </View>
        <View style={styles.btnRow}>
          {!isLast ? (
            <TouchableOpacity style={styles.skipBtn} onPress={goHome} activeOpacity={0.7}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.skipBtn} />
          )}
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: accent }]}
            onPress={next}
            activeOpacity={0.88}
          >
            <Text style={styles.nextBtnText}>{isLast ? "Get Started" : "Next"}</Text>
            <Text style={styles.nextBtnArrow}>{isLast ? "✓" : "→"}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f172a" },
  slide: { flex: 1, height, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  bubble: {
    position: "absolute", width: 48, height: 48, borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center",
  },
  bubbleEmoji: { fontSize: 22 },
  heroWrap: { marginBottom: 40, alignItems: "center", justifyContent: "center" },
  heroCircle: { width: 220, height: 220, borderRadius: 110, alignItems: "center", justifyContent: "center" },
  heroCircleInner: { width: 160, height: 160, borderRadius: 80, alignItems: "center", justifyContent: "center" },
  heroEmoji: { fontSize: 80 },
  textBlock: { paddingHorizontal: 32, alignItems: "flex-start", width: "100%" },
  accentPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 16 },
  accentPillText: { fontSize: 11, fontWeight: "800", color: "#fff", letterSpacing: 1 },
  slideTitle: { fontSize: 34, fontWeight: "800", color: "#fff", lineHeight: 42, marginBottom: 16, letterSpacing: -0.5 },
  slideSubtitle: { fontSize: 15, color: "rgba(255,255,255,0.65)", lineHeight: 24 },
  controls: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 10 : 24,
  },
  dots: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 24, paddingLeft: 4 },
  dot: { height: 8, borderRadius: 4 },
  btnRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  skipBtn: { paddingHorizontal: 16, paddingVertical: 14 },
  skipText: { fontSize: 15, fontWeight: "600", color: "rgba(255,255,255,0.45)" },
  nextBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 32, paddingVertical: 16, borderRadius: 18,
    shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  nextBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },
  nextBtnArrow: { fontSize: 16, color: "#fff", fontWeight: "700" },
});