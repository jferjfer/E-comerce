import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNotificationStore } from '@/store/useNotificationStore';
import { COLORS, RADIUS, SPACING } from '@/constants';

export default function Notifications() {
  const { notifications, removeNotification } = useNotificationStore();
  if (!notifications.length) return null;

  const cfg = (type: string) => {
    if (type === 'success') return { bar: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' };
    if (type === 'error')   return { bar: '#ef4444', bg: '#fef2f2', border: '#fecaca', text: '#991b1b' };
    if (type === 'warning') return { bar: '#f59e0b', bg: '#fffbeb', border: '#fde68a', text: '#92400e' };
    return { bar: COLORS.dorado, bg: '#f9fafb', border: COLORS.bordeClaro, text: COLORS.textoNegro };
  };

  return (
    <View style={styles.container}>
      {notifications.map(n => {
        const c = cfg(n.type);
        return (
          <View key={n.id} style={[styles.notif, { backgroundColor: c.bg, borderColor: c.border }]}>
            <View style={[styles.bar, { backgroundColor: c.bar }]} />
            <Text style={[styles.msg, { color: c.text }]} numberOfLines={2}>{n.message}</Text>
            <TouchableOpacity onPress={() => removeNotification(n.id)}>
              <Text style={{ color: COLORS.textoGrisSub, fontSize: 14, paddingLeft: 8 }}>✕</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 9999,
    gap: 8,
  },
  notif: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  bar: { width: 4, alignSelf: 'stretch' },
  msg: { flex: 1, fontSize: 13, fontWeight: '500', paddingVertical: 10, paddingHorizontal: 10 },
});
