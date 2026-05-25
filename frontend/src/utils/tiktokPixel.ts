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
      contents: [{
        content_id: producto.id,
        content_type: 'product',
        content_name: producto.nombre,
        price: producto.precio
      }],
      content_type: 'product',
      value: producto.precio,
      currency: 'COP'
    })
  },

  // Cliente agrega al carrito
  addToCart: (producto: { id: string; nombre: string; precio: number; cantidad: number }) => {
    ttq()?.track('AddToCart', {
      contents: [{
        content_id: producto.id,
        content_type: 'product',
        content_name: producto.nombre,
        quantity: producto.cantidad,
        price: producto.precio
      }],
      content_type: 'product',
      value: producto.precio * producto.cantidad,
      currency: 'COP'
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
      contents: [{
        content_id: pedidoId,
        content_type: 'product',
        quantity: 1,
        price: total
      }],
      content_type: 'product',
      order_id: pedidoId,
      value: total,
      currency: 'COP'
    })
  },

  // Cliente completa la compra (alias legacy)
  placeAnOrder: (pedidoId: string, total: number) => {
    ttq()?.track('PlaceAnOrder', {
      contents: [{
        content_id: pedidoId,
        content_type: 'product',
        quantity: 1,
        price: total
      }],
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
