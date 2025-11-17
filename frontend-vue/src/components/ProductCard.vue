<template>
  <div class="bg-card rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer border border-secondary/10" @click="viewDetail">
    <!-- Producto: Usa la URL real -->
    <img :src="producto.imagen || 'https://images.pexels.com/photos/1036622/pexels-photo-1036622.jpeg?auto=compress&cs=tinysrgb&w=800'" 
         :alt="producto.nombre" 
         class="w-full h-72 object-cover" 
         @error="handleImageError" />
    <div class="p-4">
      <h2 class="text-lg font-bold truncate text-page">{{ producto.nombre }}</h2>
      <p class="text-sm text-secondary mb-2">Ref: PROD-{{ producto.id }}</p>
      <div class="flex justify-between items-center">
        <span class="text-xl font-black text-primary-accent">${{ formatPrice(producto.precio) }}</span>
        <span v-if="producto.oldPrice && producto.oldPrice > 0" class="text-xs text-secondary line-through">${{ formatPrice(producto.oldPrice) }}</span>
      </div>
      <button @click.stop="addToCart" class="btn-primary w-full mt-3 py-2 text-sm rounded-2xl">
        Agregar al Carrito
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProductCard',
  props: {
    producto: {
      type: Object,
      required: true
    }
  },
  emits: ['add-to-cart'],
  inject: ['store', 'showMessage'],
  methods: {
    formatPrice(price) {
      return new Intl.NumberFormat('es-CO').format(price)
    },
    viewDetail() {
      this.$router.push(`/productos/${this.producto.id}`)
    },
    handleImageError(event) {
      event.target.src = 'https://placehold.co/400x500/c5c5c5/2d2d2d?text=Error+Loading+Image'
    },
    addToCart() {
      this.store.addToCart(this.producto)
      this.showMessage(`"${this.producto.nombre}" agregado al carrito`)
    }
  }
}
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>