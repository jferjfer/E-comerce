<template>
  <div>
    <!-- Hero Banner -->
    <div class="mb-12 p-8 md:p-12 rounded-2xl shadow-xl transition-all duration-500" style="background-color: var(--primary-color);">
      <h1 class="text-4xl sm:text-5xl font-extrabold mb-3" style="color: var(--bg-color);">
        Colección Minimalista Puro
      </h1>
      <p class="text-xl font-medium" style="color: var(--header-bg);">
        Descubre las tendencias con nuestro estilo exclusivo.
      </p>
      <!-- Imagen de Campaña Real -->
      <img src="https://images.pexels.com/photos/1126993/pexels-photo-1126993.jpeg?auto=compress&cs=tinysrgb&w=1200" 
           alt="Campaña de la colección" 
           class="mt-6 w-full h-auto rounded-2xl object-cover" 
           @error="handleImageError" />
    </div>

    <!-- Sección de Filtros y Productos -->
    <div class="md:grid md:grid-cols-4 lg:grid-cols-5 gap-8">
      <!-- Columna de Filtros -->
      <div class="md:col-span-1 p-4 bg-card rounded-2xl shadow-xl mb-8 md:mb-0 border border-secondary/10">
        <h2 class="text-2xl font-bold mb-4 text-page">Filtros</h2>
        <div class="space-y-4 text-page">
          <!-- Filtro de Categoría -->
          <div>
            <h3 class="font-semibold mb-2">Categoría</h3>
            <select class="w-full bg-page border border-secondary/50 rounded-2xl p-2 text-sm focus:ring-primary-accent focus:border-primary-accent text-page">
              <option>Todo</option>
              <option>Chaquetas</option>
              <option>Camisas</option>
              <option>Pantalones</option>
            </select>
          </div>
          <!-- Filtro de Talla -->
          <div>
            <h3 class="font-semibold mb-2">Talla</h3>
            <div class="flex flex-wrap gap-2">
              <span v-for="size in ['S', 'M', 'L', 'XL']" :key="size" class="px-3 py-1 border border-secondary/50 rounded-2xl text-xs hover:bg-secondary/20 cursor-pointer">{{ size }}</span>
            </div>
          </div>
          <!-- Filtro de Precio -->
          <div>
            <h3 class="font-semibold mb-2">Precio Máximo</h3>
            <input type="range" min="50000" max="500000" value="500000" class="w-full h-2 bg-secondary/30 rounded-2xl appearance-none cursor-pointer">
            <p class="text-sm text-right mt-1 text-secondary">$ 500.000 COP</p>
          </div>
          <button class="btn-primary w-full py-2 rounded-2xl mt-4">Aplicar Filtros</button>
        </div>
      </div>

      <!-- Columna de Resultados de Productos -->
      <div class="md:col-span-3 lg:col-span-4">
        <h1 class="text-3xl font-extrabold mb-6 text-page">Resultado de Búsqueda ({{ productsList.length }} artículos)</h1>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div v-for="product in productsList" :key="product.id" 
               class="bg-card rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer border border-secondary/10" 
               @click="viewDetail(product.id)">
            <!-- Producto: Usa la URL real -->
            <img :src="product.imageUrl" 
                 :alt="product.name" 
                 class="w-full h-72 object-cover" 
                 @error="handleProductImageError" />
            <div class="p-4">
              <h2 class="text-lg font-bold truncate text-page">{{ product.name }}</h2>
              <p class="text-sm text-secondary mb-2">Ref: PROD-{{ product.id }}</p>
              <div class="flex justify-between items-center">
                <span class="text-xl font-black text-primary-accent">${{ formatPrice(product.price) }}</span>
                <span v-if="product.oldPrice > 0" class="text-xs text-secondary line-through">${{ formatPrice(product.oldPrice) }}</span>
              </div>
              <button @click.stop="addToCart(product)" class="btn-primary w-full mt-3 py-2 text-sm rounded-2xl">
                Ver Detalle
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProductListing',
  inject: ['products', 'showMessage'],
  emits: ['navigate', 'add-to-cart'],
  computed: {
    productsList() {
      return this.products()
    }
  },
  methods: {
    formatPrice(price) {
      return new Intl.NumberFormat('es-CO').format(price)
    },
    viewDetail(productId) {
      this.$emit('navigate', 'detail', productId)
    },
    addToCart(product) {
      this.$emit('add-to-cart', product)
    },
    handleImageError(event) {
      event.target.src = 'https://placehold.co/1200x400/c5c5c5/2d2d2d?text=Campaña'
    },
    handleProductImageError(event) {
      event.target.src = 'https://placehold.co/400x500/c5c5c5/2d2d2d?text=Error+Loading+Image'
    }
  }
}
</script>