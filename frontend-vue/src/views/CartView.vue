<template>
  <div>
    <h1 class="text-4xl font-extrabold mb-8 text-page">Carrito de Compras</h1>
    
    <!-- Carrito Vacío -->
    <div v-if="cartItems.length === 0" class="text-center py-20 bg-card rounded-2xl shadow-xl border border-secondary/10">
      <svg class="w-16 h-16 mx-auto text-secondary mb-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.6 11.2a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>
      </svg>
      <p class="text-xl font-semibold text-page mb-2">Tu carrito está vacío.</p>
      <p class="text-secondary mb-6">Añade algunas prendas elegantes para comenzar a comprar.</p>
      <button @click="goToListing" class="btn-primary px-6 py-2 rounded-2xl">Explorar Tienda</button>
    </div>
    
    <!-- Carrito con Productos -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Columna de Ítems del Carrito -->
      <div class="lg:col-span-2 bg-card p-6 rounded-2xl shadow-xl border border-secondary/10">
        <div v-for="item in cartItems" :key="item.uniqueId" 
             class="flex items-center justify-between py-4 border-b border-secondary/20 last:border-b-0">
          <div class="flex items-center space-x-4">
            <img :src="item.imageUrl" :alt="item.name" 
                 class="w-16 h-20 object-cover rounded-2xl" 
                 @error="handleImageError">
            <div>
              <p class="font-bold text-page">{{ item.name }}</p>
              <p class="text-sm text-secondary">Talla: {{ item.size }} | Cantidad: {{ item.quantity }}</p>
              <p class="text-sm font-semibold text-primary-accent">${{ formatPrice(item.price) }}</p>
            </div>
          </div>
          <button @click="removeItem(item.uniqueId)" 
                  class="text-red-500 hover:text-red-700 p-2 rounded-2xl transition">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM18 4h-3.5l-1-1h-5l-1 1H6v2h12V4z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Columna de Resumen -->
      <div class="lg:col-span-1">
        <div class="bg-card p-6 rounded-2xl shadow-xl border border-primary-accent/30 sticky top-24">
          <h2 class="text-2xl font-bold mb-4 text-page">Resumen del Pedido</h2>
          <div class="space-y-3 mb-6">
            <div class="flex justify-between text-secondary">
              <span>Subtotal ({{ totalItems }} ítems):</span>
              <span>${{ formatPrice(subtotal) }} COP</span>
            </div>
            <div class="flex justify-between text-secondary border-t pt-3 border-secondary/20">
              <span>Envío:</span>
              <span>$ 0 COP</span>
            </div>
            <div class="flex justify-between text-xl font-extrabold text-page border-t pt-3 border-primary-accent/50">
              <span>Total Final:</span>
              <span class="text-primary-accent">${{ formatPrice(total) }} COP</span>
            </div>
          </div>
          <button @click="proceedToCheckout" 
                  class="btn-primary w-full py-3 text-lg font-bold rounded-2xl">
            <span class="text-page">Proceder al Pago</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CartView',
  inject: ['cart', 'removeFromCart', 'showMessage'],
  emits: ['navigate'],
  computed: {
    cartItems() {
      return this.cart()
    },
    subtotal() {
      return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    },
    total() {
      return this.subtotal // Sin costo de envío
    },
    totalItems() {
      return this.cartItems.reduce((sum, item) => sum + item.quantity, 0)
    }
  },
  methods: {
    formatPrice(price) {
      return new Intl.NumberFormat('es-CO').format(price)
    },
    goToListing() {
      this.$emit('navigate', 'listing')
    },
    proceedToCheckout() {
      this.$emit('navigate', 'checkout')
    },
    removeItem(uniqueId) {
      this.removeFromCart(uniqueId)
    },
    handleImageError(event) {
      event.target.src = 'https://placehold.co/80x100/d9d9d9/555555?text=Img+Error'
    }
  }
}
</script>