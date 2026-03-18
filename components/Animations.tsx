import React, { useEffect, useRef } from "react";
import { Animated, TouchableOpacity, ViewStyle, StyleProp } from "react-native";

// ── Fade in on mount ──────────────────────────────────────────────────────────
export const FadeIn = ({
  children, delay = 0, duration = 300, style,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1, duration, delay, useNativeDriver: true,
    }).start();
  }, []);

  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
};

// ── Slide up on mount ─────────────────────────────────────────────────────────
export const SlideUp = ({
  children, delay = 0, distance = 20, style,
}: {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}) => {
  const opacity     = useRef(new Animated.Value(0)).current;
  const translateY  = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,     { toValue: 1, duration: 350, delay, useNativeDriver: true }),
      Animated.spring(translateY,  { toValue: 0, tension: 80, friction: 10, delay, useNativeDriver: true } as any),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};

// ── Staggered list ────────────────────────────────────────────────────────────
export const StaggeredList = ({
  children, stagger = 60,
}: {
  children: React.ReactNode[];
  stagger?: number;
}) => (
  <>
    {React.Children.map(children, (child, i) => (
      <SlideUp key={i} delay={i * stagger}>
        {child as React.ReactNode}
      </SlideUp>
    ))}
  </>
);

// ── Bounce press button ───────────────────────────────────────────────────────
export const BounceButton = ({
  children, onPress, style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 50 }).start();

  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  return (
    <TouchableOpacity
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={onPress}
      activeOpacity={1}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ── Pulse (for badges, notifications dot) ────────────────────────────────────
export const Pulse = ({
  children, style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
};