import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";

type Props = {
  emoji: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export default function EmptyState({
  emoji, title, subtitle,
  actionLabel, onAction,
  secondaryLabel, onSecondary,
}: Props) {
  const scale   = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const bounce  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounce, { toValue: -8, duration: 700, useNativeDriver: true }),
          Animated.timing(bounce, { toValue: 0,  duration: 700, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  return (
    <Animated.View style={[styles.wrap, { opacity }]}>
      <Animated.View style={[styles.emojiWrap, {
        transform: [{ scale }, { translateY: bounce }],
      }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </Animated.View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {actionLabel && onAction && (
        <TouchableOpacity style={styles.actionBtn} onPress={onAction} activeOpacity={0.88}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}

      {secondaryLabel && onSecondary && (
        <TouchableOpacity style={styles.secondaryBtn} onPress={onSecondary} activeOpacity={0.8}>
          <Text style={styles.secondaryText}>{secondaryLabel}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 40, paddingVertical: 60,
  },
  emojiWrap: {
    width: 100, height: 100, borderRadius: 30,
    backgroundColor: "#f9fafb", alignItems: "center",
    justifyContent: "center", marginBottom: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 4,
  },
  emoji: { fontSize: 48 },
  title: {
    fontSize: 22, fontWeight: "800", color: "#111827",
    marginBottom: 10, textAlign: "center",
  },
  subtitle: {
    fontSize: 14, color: "#9ca3af", textAlign: "center",
    lineHeight: 21, marginBottom: 32,
  },
  actionBtn: {
    backgroundColor: "#111827", paddingHorizontal: 32,
    paddingVertical: 14, borderRadius: 16, marginBottom: 12,
  },
  actionText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  secondaryBtn: {
    paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1.5, borderColor: "#e5e7eb",
  },
  secondaryText: { fontSize: 14, fontWeight: "600", color: "#6b7280" },
});