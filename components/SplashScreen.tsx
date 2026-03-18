import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet, Dimensions, StatusBar } from "react-native";

const { width, height } = Dimensions.get("window");

type Props = { onFinish: () => void };

export default function SplashScreen({ onFinish }: Props) {
  const logoScale   = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const bgOpacity   = useRef(new Animated.Value(1)).current;
  const ring1       = useRef(new Animated.Value(0)).current;
  const ring2       = useRef(new Animated.Value(0)).current;
  const barScale    = useRef(new Animated.Value(0)).current; // scaleX instead of width

  useEffect(() => {
    Animated.sequence([
      // Logo pop in
      Animated.parallel([
        Animated.spring(logoScale,   { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      // Rings + text + loading bar
      Animated.parallel([
        Animated.timing(ring1,       { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(ring2,       { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(barScale,    { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
      // Hold
      Animated.delay(600),
      // Fade out
      Animated.timing(bgOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => onFinish());
  }, []);

  const ring1Scale   = ring1.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.6] });
  const ring1Opacity = ring1.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });
  const ring2Scale   = ring2.interpolate({ inputRange: [0, 1], outputRange: [0.8, 2.2] });
  const ring2Opacity = ring2.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0] });

  return (
    <Animated.View style={[styles.root, { opacity: bgOpacity }]}>
      <StatusBar barStyle="light-content" />

      {/* Ripple rings */}
      <Animated.View style={[styles.ring, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]} />
      <Animated.View style={[styles.ring, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]} />

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🛍️</Text>
        </View>
      </Animated.View>

      {/* App name */}
      <Animated.View style={[styles.textWrap, { opacity: textOpacity }]}>
        <Text style={styles.appName}>ShopApp</Text>
        <Text style={styles.tagline}>Everything you need, delivered.</Text>
      </Animated.View>

      {/* Loading bar — uses scaleX, not width */}
      <Animated.View style={[styles.bottomWrap, { opacity: textOpacity }]}>
        <View style={styles.loadingTrack}>
          <Animated.View style={[
            styles.loadingFill,
            { transform: [{ scaleX: barScale }] },
          ]} />
        </View>
        <Text style={styles.bottomText}>Made with ❤️ in Ghana</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "#111827", alignItems: "center", justifyContent: "center",
    zIndex: 9999,
  },
  ring: {
    position: "absolute",
    width: 200, height: 200, borderRadius: 100,
    borderWidth: 1.5, borderColor: "#f97316",
  },
  logoWrap: { alignItems: "center", justifyContent: "center", marginBottom: 28 },
  logoCircle: {
    width: 100, height: 100, borderRadius: 30,
    backgroundColor: "#f97316", alignItems: "center", justifyContent: "center",
    shadowColor: "#f97316", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  logoEmoji: { fontSize: 48 },
  textWrap: { alignItems: "center", gap: 8 },
  appName: { fontSize: 32, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: "rgba(255,255,255,0.5)", fontWeight: "400" },
  bottomWrap: {
    position: "absolute", bottom: 60,
    alignItems: "center", gap: 16, width: "100%",
  },
  loadingTrack: {
    width: 120, height: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2, overflow: "hidden",
  },
  // Full width fill that scales from left via transformOrigin workaround
  loadingFill: {
    width: 120, height: 3,
    backgroundColor: "#f97316",
    borderRadius: 2,
    transformOrigin: "left",  // scales from left edge
  },
  bottomText: { fontSize: 12, color: "rgba(255,255,255,0.3)" },
});