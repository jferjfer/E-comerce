<template>
  <div>
    <!-- Hero Banner -->
    <div class="mb-12 p-8 md:p-12 rounded-2xl shadow-xl transition-all duration-500 bg-primary-color">
      <h1 class="text-4xl sm:text-5xl font-extrabold mb-3 text-page-bg">
        Colección Minimalista Puro
      </h1>
      <p class="text-xl font-medium text-header-bg">
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
        <h1 class="text-3xl font-extrabold mb-6 text-page">Productos Destacados ({{ productosDestacados.length }} artículos)</h1>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <ProductCard 
            v-for="producto in productosDestacados" 
            :key="producto.id"
            :producto="producto"
            @add-to-cart="agregarAlCarrito"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ProductCard from '../components/ProductCard.vue'
import { catalogService } from '../services/catalogService'

export default {
  name: 'Inicio',
  components: {
    ProductCard
  },
  inject: ['showMessage'],
  data() {
    return {
      productosDestacados: []
    }
  },
  async mounted() {
    this.productosDestacados = await catalogService.getProductosDestacados()
  },
  methods: {
    agregarAlCarrito(producto) {
      // Implementar lógica del carrito
      this.showMessage(`Producto "${producto.nombre}" agregado al carrito`)
      console.log('Agregando al carrito:', producto)
    },
    handleImageError(event) {
      event.target.src = 'https://placehold.co/1200x400/c5c5c5/2d2d2d?text=Campaña'
    }
  }
}
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>