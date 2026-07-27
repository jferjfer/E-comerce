// Meta Pixel Events — ID: 2940071826327661
declare global {
  interface Window { fbq: (...args: any[]) => void }
}

const fbq = (...args: any[]) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq(...args)
  }
}

export const metaPixel = {
  // Ver producto
  viewContent: (producto: { id: string; nombre: string; precio: number; categoria?: string }) => {
    fbq('track', 'ViewContent', {
      content_ids: [producto.id],
      content_name: producto.nombre,
      content_category: producto.categoria || 'Ropa',
      content_type: 'product',
      value: producto.precio,
      currency: 'COP',
    })
  },

  // Agregar al carrito
  addToCart: (producto: { id: string; nombre: string; precio: number }) => {
    fbq('track', 'AddToCart', {
      content_ids: [producto.id],
      content_name: producto.nombre,
      content_type: 'product',
      value: producto.precio,
      currency: 'COP',
    })
  },

  // Iniciar checkout
  initiateCheckout: (total: number, items: any[]) => {
    fbq('track', 'InitiateCheckout', {
      content_ids: items.map(i => i.id),
      num_items: items.length,
      value: total,
      currency: 'COP',
    })
  },

  // Compra completada
  purchase: (pedidoId: string, total: number, items: any[]) => {
    fbq('track', 'Purchase', {
      content_ids: items.map(i => i.id),
      content_type: 'product',
      value: total,
      currency: 'COP',
      order_id: pedidoId,
    })
  },

  // Búsqueda
  search: (query: string) => {
    fbq('track', 'Search', { search_string: query })
  },

  // Registro
  completeRegistration: () => {
    fbq('track', 'CompleteRegistration')
  },
}
