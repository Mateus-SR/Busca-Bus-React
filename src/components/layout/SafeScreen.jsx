
import React from 'react';
import { 
  KeyboardAvoidingView, 
  Platform, 
  StyleSheet, 
  SafeAreaView, 
  TouchableWithoutFeedback, 
  Keyboard 
} from 'react-native';

export function SafeScreen({ children }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            {children}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF', 
  },
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    padding: 20,
    justifyContent: 'center', 
  }
});