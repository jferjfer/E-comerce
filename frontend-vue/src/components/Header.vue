<template>
  <header class="header-bg shadow-md sticky top-0 z-50 transition-all duration-300">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
      <router-link to="/" class="text-2xl font-bold text-page cursor-pointer">
        Cloth<span class="text-primary-accent">Store</span>
      </router-link>
      
      <div class="flex items-center space-x-4">
        <!-- Íconos de Usuario y Carrito (UX) -->
        <button @click="$emit('toggle-auth')" class="p-2 rounded-2xl hover:bg-secondary/20 transition duration-150 border-2 border-transparent hover:border-primary-accent" title="Perfil / Iniciar Sesión">
          <svg class="icon w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21v-2a4 4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
        <button @click="$emit('toggle-cart')" class="p-2 rounded-2xl hover:bg-secondary/20 transition duration-150 relative" title="Carrito de Compras">
          <!-- ICONO DE CARRITO CLÁSICO (TROLLEY) -->
          <svg class="icon w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.6 11.2a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>
          </svg>
          <span v-if="cartCount > 0" class="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">{{ cartCount }}</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script>
export default {
  name: 'Header',
  emits: ['toggle-auth', 'toggle-cart'],
  inject: ['store'],
  computed: {
    cartCount() {
      return this.store.cartCount
    }
  }
}
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>