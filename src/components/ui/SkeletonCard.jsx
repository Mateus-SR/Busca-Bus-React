
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

export function SkeletonCard() {
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      <View style={styles.titlePlaceholder} />
      <View style={styles.subtitlePlaceholder} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    backgroundColor: '#E1E9EE',
    borderRadius: 8,
    height: 80,
    justifyContent: 'center',
  },
  titlePlaceholder: {
    height: 20,
    width: '60%',
    backgroundColor: '#C8D6E5',
    borderRadius: 4,
    marginBottom: 10,
  },
  subtitlePlaceholder: {
    height: 14,
    width: '40%',
    backgroundColor: '#C8D6E5',
    borderRadius: 4,
  }
});