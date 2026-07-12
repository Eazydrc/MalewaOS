/**
 * Shared animation primitives for Delipose mobile app.
 * All animations use the native driver for 60fps on bridge.
 */
import React, { useEffect, useRef, ReactNode } from 'react';
import { Animated, ViewStyle } from 'react-native';

// ── Fade + Slide entrance ─────────────────────────────────────────────────────

interface FadeSlideProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  fromY?: number;
  style?: ViewStyle;
}

export function FadeSlide({ children, delay = 0, duration = 350, fromY = 18, style }: FadeSlideProps) {
  const opacity   = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(fromY)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration, delay, useNativeDriver: true, easing: undefined,
      }),
      Animated.spring(translateY, {
        toValue: 0, delay, useNativeDriver: true,
        tension: 80, friction: 12,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ── Staggered children ────────────────────────────────────────────────────────

interface StaggerProps {
  children: ReactNode[];
  stagger?: number;
  initialDelay?: number;
  fromY?: number;
}

export function Stagger({ children, stagger = 60, initialDelay = 0, fromY = 16 }: StaggerProps) {
  return (
    <>
      {React.Children.map(children, (child, i) => (
        <FadeSlide key={i} delay={initialDelay + i * stagger} fromY={fromY}>
          {child}
        </FadeSlide>
      ))}
    </>
  );
}

// ── Pulse (skeleton shimmer) ──────────────────────────────────────────────────

export function usePulse(duration = 900) {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return anim;
}

interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, radius: r = 8, style }: SkeletonProps) {
  const opacity = usePulse();
  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius: r, backgroundColor: '#1C2038', opacity },
        style,
      ]}
    />
  );
}

// ── Scale press (button bounce) ───────────────────────────────────────────────

export function usePressScale(active = 0.95) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: active, useNativeDriver: true, tension: 200, friction: 10 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();

  return { scale, onPressIn, onPressOut };
}

// ── Logo animated splash ───────────────────────────────────────────────────────

export function SplashLogo({ onDone }: { onDone?: () => void }) {
  const scale   = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dot1    = useRef(new Animated.Value(0)).current;
  const dot2    = useRef(new Animated.Value(0)).current;
  const dot3    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.stagger(100, [
        Animated.spring(dot1, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }),
        Animated.spring(dot2, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }),
        Animated.spring(dot3, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }),
      ]),
    ]).start();
  }, []);

  return { scale, opacity, dot1, dot2, dot3 };
}
