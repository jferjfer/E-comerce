<template>
  <div class="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4" @click.self="$emit('close')">
    <div class="bg-card rounded-2xl shadow-2xl w-full max-w-lg p-8 relative max-h-[90vh] overflow-y-auto">
      
      <button @click="$emit('close')" class="absolute top-4 right-4 text-page hover:text-red-500 transition">
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
      </button>
      
      <h2 class="text-3xl font-extrabold text-primary-accent mb-6">🛒 Carrito de Compras</h2>
      
      <div v-if="store.cart.length === 0" class="text-center py-20 bg-card rounded-2xl shadow-xl border border-secondary/10">
        <!-- ICONO DE CARRITO CLÁSICO (TROLLEY) -->
        <svg class="w-16 h-16 mx-auto text-secondary mb-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.6 11.2a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>
        </svg>
        <p class="text-xl font-semibold text-page mb-2">Tu carrito está vacío.</p>
        <p class="text-secondary mb-6">Añade algunas prendas elegantes para comenzar a comprar.</p>
        <button @click="$emit('close')" class="btn-primary px-6 py-2 rounded-2xl">Explorar Tienda</button>
      </div>
      
      <div v-else>
        <div class="space-y-4 mb-6 max-h-96 overflow-y-auto">
          <div v-for="item in store.cart" :key="item.uniqueId" class="flex items-center justify-between py-4 border-b border-secondary/20 last:border-b-0">
            <div class="flex items-center space-x-4">
              <img :src="item.imagen || 'https://via.placeholder.com/80x80'" :alt="item.nombre" class="w-16 h-20 object-cover rounded-2xl">
              <div>
                <p class="font-bold text-page">{{ item.nombre }}</p>
                <p class="text-sm text-secondary">Cantidad: {{ item.quantity }}</p>
                <p class="text-sm font-semibold text-primary-accent">${{ formatPrice(item.precio) }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button @click="updateQuantity(item.uniqueId, item.quantity - 1)" class="w-8 h-8 border border-secondary/50 rounded-lg flex items-center justify-center hover:bg-secondary/20">
                -
              </button>
              <span class="w-8 text-center font-medium">{{ item.quantity }}</span>
              <button @click="updateQuantity(item.uniqueId, item.quantity + 1)" class="w-8 h-8 border border-secondary/50 rounded-lg flex items-center justify-center hover:bg-secondary/20">
                +
              </button>
              <button @click="removeItem(item.uniqueId)" class="text-red-500 hover:text-red-700 p-2 rounded-2xl transition ml-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM18 4h-3.5l-1-1h-5l-1 1H6v2h12V4z"/></svg>
              </button>
            </div>
          </div>
        </div>
        
        <div class="border-t pt-4 border-secondary/20">
          <div class="space-y-3 mb-6">
            <div class="flex justify-between text-secondary">
              <span>Subtotal ({{ store.cartCount }} ítems):</span>
              <span>${{ formatPrice(store.cartTotal) }} COP</span>
            </div>
            <div class="flex justify-between text-secondary">
              <span>Envío:</span>
              <span>$ 0 COP</span>
            </div>
            <div class="flex justify-between text-xl font-extrabold text-page border-t pt-3 border-primary-accent/50">
              <span>Total Final:</span>
              <span class="text-primary-accent">${{ formatPrice(store.cartTotal) }} COP</span>
            </div>
          </div>
          <button @click="proceedToCheckout" class="btn-primary w-full py-3 text-lg font-bold rounded-2xl">
            Proceder al Pago
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ModalCarrito',
  emits: ['close'],
  inject: ['store', 'showMessage'],
  methods: {
    formatPrice(price) {
      return new Intl.NumberFormat('es-CO').format(price)
    },
    
    updateQuantity(uniqueId, newQuantity) {
      this.store.updateQuantity(uniqueId, newQuantity)
    },
    
    removeItem(uniqueId) {
      this.store.removeFromCart(uniqueId)
      this.showMessage('Artículo eliminado del carrito')
    },
    
    proceedToCheckout() {
      if (this.store.cart.length === 0) {
        this.showMessage('El carrito está vacío, no se puede pagar')
        return
      }
      
      this.$emit('close')
      this.$router.push('/carrito')
      this.showMessage('Redirigiendo al checkout...')
    }
  }
}
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>