import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { COLORS } from '@/constants';
import BtnVolver from '@/components/BtnVolver';

export default function WebViewScreen() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.container}>
      <BtnVolver />
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator color={COLORS.dorado} size="large" />
        </View>
      )}
      <WebView
        source={{ uri: decodeURIComponent(url || 'https://egoscolombia.com.co') }}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled
        domStorageEnabled
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondoCard },
  loader: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
    backgroundColor: COLORS.fondoCard,
  },
  webview: { flex: 1 },
});
