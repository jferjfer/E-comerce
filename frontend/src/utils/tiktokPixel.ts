// Helper TikTok Pixel — EGOS
// Pixel ID: D88U5GRC77UCUUKVIO80

declare global {
  interface Window {
    ttq?: any
  }
}

const ttq = () => window.ttq

export const tiktokPixel = {
  // Cliente ve un producto
  viewContent: (producto: { id: string; nombre: string; precio: number; categoria: string }) => {
    ttq()?.track('ViewContent', {
      content_type: 'product',
      content_id: producto.id,
      content_name: producto.nombre,
      content_category: producto.categoria,
      value: producto.precio,
      currency: 'COP'
    })
  },

  // Cliente agrega al carrito
  addToCart: (producto: { id: string; nombre: string; precio: number; cantidad: number }) => {
    ttq()?.track('AddToCart', {
      content_type: 'product',
      content_id: producto.id,
      content_name: producto.nombre,
      value: producto.precio * producto.cantidad,
      currency: 'COP',
      quantity: producto.cantidad
    })
  },

  // Cliente abre el checkout
  initiateCheckout: (total: number) => {
    ttq()?.track('InitiateCheckout', {
      value: total,
      currency: 'COP'
    })
  },

  // Cliente completa la compra — evento crítico e-commerce TikTok
  completePayment: (pedidoId: string, total: number) => {
    ttq()?.track('CompletePayment', {
      content_type: 'product',
      order_id: pedidoId,
      value: total,
      currency: 'COP'
    })
  },

  // Cliente completa la compra (alias legacy)
  placeAnOrder: (pedidoId: string, total: number) => {
    ttq()?.track('PlaceAnOrder', {
      content_type: 'product',
      order_id: pedidoId,
      value: total,
      currency: 'COP'
    })
  },

  // Cliente busca un producto
  search: (termino: string) => {
    ttq()?.track('Search', {
      query: termino
    })
  }
}
