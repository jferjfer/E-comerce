import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

// Fade + slide up al montar una pantalla
export function useFadeIn(delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 350, delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0, delay,
        useNativeDriver: true,
        tension: 80, friction: 12,
      }),
    ]).start();
  }, []);

  return { opacity, transform: [{ translateY }] };
}

// Stagger para listas — cada item aparece con delay incremental
export function useStaggerFadeIn(index: number, baseDelay = 60) {
  return useFadeIn(index * baseDelay);
}

// Scale press — para botones
export function useScalePress() {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, tension: 200, friction: 10 }).start();

  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();

  return { scale, onPressIn, onPressOut };
}

// Slide up desde abajo (para bottom sheets)
export function useSlideUp(visible: boolean) {
  const translateY = useRef(new Animated.Value(400)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0, useNativeDriver: true,
          tension: 80, friction: 14,
        }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 400, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return { translateY, opacity };
}

// Shimmer skeleton
export function useShimmer() {
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
  return opacity;
}
