import * as Haptics from 'expo-haptics';

const safe = (fn: () => Promise<void>) => fn().catch(() => {});

export const haptic = {
  // Agregar al carrito — doble pulso suave (más satisfactorio)
  agregarCarrito: async () => {
    await safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    await new Promise(r => setTimeout(r, 80));
    await safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  },

  // Checkout exitoso — secuencia de celebración
  checkoutExito: async () => {
    await safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    await new Promise(r => setTimeout(r, 150));
    await safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    await new Promise(r => setTimeout(r, 100));
    await safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
  },

  // Error — triple pulso corto
  error: async () => {
    for (let i = 0; i < 3; i++) {
      await safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
      await new Promise(r => setTimeout(r, 60));
    }
  },

  // Tap en botón — selección mínima
  tap: () => safe(() => Haptics.selectionAsync()),

  // Favorito añadido — pulso medio + leve
  favoritoAdd: async () => {
    await safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    await new Promise(r => setTimeout(r, 100));
    await safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  },

  // Favorito quitado — leve
  favoritoRemove: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),

  // Eliminar item — advertencia
  eliminar: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),

  // Swipe de imagen — selección suave
  swipeImagen: () => safe(() => Haptics.selectionAsync()),

  // Compartir — tap
  compartir: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),

  // Conexión restaurada
  conexionRestaurada: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
};
