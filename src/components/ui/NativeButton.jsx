
import React from 'react';
import { Pressable, Text, StyleSheet, Platform } from 'react-native';

export function NativeButton({ onPress, title, style, textStyle, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      android_ripple={{ color: 'rgba(255, 255, 255, 0.3)', borderless: false }}
      style={({ pressed }) => [
        styles.button,
        style,
        Platform.OS === 'ios' && pressed && styles.iosPressed,
        disabled && styles.disabled
      ]}
    >
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF', 
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', 
  },
  text: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  iosPressed: {
    opacity: 0.7,
  },
  disabled: {
    backgroundColor: '#A5C9FF',
  }
});