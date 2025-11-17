<template>
  <div v-if="product">
    <button @click="goBack" class="text-secondary hover:text-primary-accent mb-6 flex items-center space-x-1">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path>
      </svg>
      <span>Volver al Listado</span>
    </button>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
      <!-- Columna de Imágenes -->
      <div class="lg:col-span-1">
        <!-- Imagen Principal -->
        <div class="bg-card rounded-2xl overflow-hidden shadow-xl border border-secondary/10">
          <img :src="product.imageUrl" 
               :alt="product.name" 
               class="w-full h-auto object-cover aspect-[4/5] transition duration-300 transform hover:scale-[1.02]"
               @error="handleImageError">
        </div>
        <!-- Miniaturas -->
        <div class="mt-4 flex space-x-3 overflow-x-auto pb-2">
          <img :src="product.imageUrl" class="w-20 h-24 object-cover rounded-2xl cursor-pointer opacity-75 hover:opacity-100 border-2 border-primary-accent" alt="Vista Principal">
          <img src="https://images.pexels.com/photos/179909/pexels-photo-179909.jpeg?auto=compress&cs=tinysrgb&w=300" class="w-20 h-24 object-cover rounded-2xl cursor-pointer opacity-75 hover:opacity-100" alt="Detalle de la Tela">
          <img src="https://images.pexels.com/photos/1356272/pexels-photo-1356272.jpeg?auto=compress&cs=tinysrgb&w=300" class="w-20 h-24 object-cover rounded-2xl cursor-pointer opacity-75 hover:opacity-100" alt="Modelo Usando la Prenda">
        </div>
      </div>

      <!-- Columna de Detalles y Acciones -->
      <div class="lg:col-span-1">
        <h1 class="text-3xl sm:text-4xl font-extrabold mb-2 text-page">{{ product.name }}</h1>
        <p class="text-sm font-medium text-secondary mb-4">SKU: PROD-{{ product.id }} | Colección: Minimalista Puro</p>
        
        <!-- Precio y Descuento -->
        <div class="flex items-baseline space-x-3 mb-6">
          <span class="text-4xl font-black text-primary-accent">${{ formatPrice(product.price) }} COP</span>
          <span v-if="product.oldPrice > 0" class="text-xl text-secondary line-through">${{ formatPrice(product.oldPrice) }} COP</span>
          <span v-if="product.oldPrice > 0" class="text-base font-bold text-red-500 bg-red-100 px-3 py-1 rounded-2xl">
            - {{ Math.round(100 - (product.price / product.oldPrice) * 100) }}%
          </span>
        </div>

        <!-- Selección de Talla -->
        <div class="mb-6">
          <p class="text-lg font-semibold mb-3 text-page">Talla:</p>
          <div class="flex flex-wrap gap-3">
            <label v-for="(variant, index) in product.variants" :key="variant.size" 
                   :class="['cursor-pointer group relative', { 'opacity-50 pointer-events-none': variant.stock === 0 }]" 
                   :title="getStockStatus(variant)">
              <input type="radio" :id="`size-${variant.size}`" name="size" :value="variant.size" 
                     class="hidden peer" :checked="index === 0 && variant.stock > 0" 
                     :disabled="variant.stock === 0" @change="selectedSize = variant.size">
              <div class="w-14 h-14 flex items-center justify-center border-2 rounded-2xl transition-all duration-200 peer-checked:bg-primary-accent peer-checked:text-white peer-checked:border-primary-accent border-secondary/50">
                <span class="text-base font-medium">{{ variant.size }}</span>
              </div>
              <span v-if="variant.stock > 0 && variant.stock <= 5" class="absolute -top-2 -right-2 bg-yellow-500 text-xs font-bold text-white px-2 py-0.5 rounded-2xl shadow-md z-10">¡Pocas!</span>
              <span v-if="variant.stock === 0" class="absolute inset-0 flex items-center justify-center text-lg font-extrabold text-red-500/70 bg-gray-100/70 rounded-2xl">X</span>
            </label>
          </div>
        </div>

        <!-- Cantidad y Botón de Añadir al Carrito -->
        <div class="flex flex-col space-y-4 mb-6">
          <!-- Fila 1: Cantidad -->
          <div class="flex items-center space-x-2 border-2 border-secondary/50 rounded-2xl overflow-hidden bg-card h-14 max-w-[150px]">
            <button @click="decreaseQuantity" class="p-3 h-full border-r border-secondary/50 hover:bg-secondary/20 transition duration-150 text-page">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clip-rule="evenodd"></path>
              </svg>
            </button>
            <input v-model.number="quantity" type="number" min="1" max="10" 
                   class="quantity-input w-full text-center text-lg font-bold bg-transparent border-none focus:ring-0 text-page">
            <button @click="increaseQuantity" class="p-3 h-full border-l border-secondary/50 hover:bg-secondary/20 transition duration-150 text-page">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd"></path>
              </svg>
            </button>
          </div>

          <!-- Fila 2: Botones de Acción -->
          <div class="grid grid-cols-2 gap-4">
            <button @click="tryAR" class="py-4 text-xl font-bold rounded-2xl shadow-xl transition-all duration-200 flex items-center justify-center space-x-3 bg-gray-700 hover:bg-gray-800 text-white">
              <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v.5A2.5 2.5 0 0 1 12 8a2.5 2.5 0 0 1 3-3.5V5a3 3 0 0 0-3-3zM3 15v3a2 2 0 0 0 2 2h3m10 0h3a2 2 0 0 0 2-2v-3m0-6v-3a2 2 0 0 0-2-2h-3M8 4V2"/>
              </svg>
              <span>PROBAR</span>
            </button>
            <button @click="addToCart" class="btn-primary py-4 text-xl font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center justify-center space-x-3">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 18c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zM7 18c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zm0-3l.1-1.4l1.5.8c.8.4 1.7.5 2.5.3l1.8-.4 1.8.8c.8.4 1.7.5 2.5.3l1.8-.4 1.5.8c.8.4 1.7.5 2.5.3l1.8-.4L22 4H7zM3 4h2l2 4.47l.1.53l.9 1.8l3 6.2h9.2l.5-.8c.7-.6 1.7-.8 2.7-.4l.7.2 2.7-3.6c.4-.5 1.1-.7 1.7-.4l2.4 2.8c.4.5 0 1.3-.8 1.4l-1.6.4c.1.1.1.2.2.3l1.5 1.3c.4.3.7.8.8 1.3l.1.5c.3 1.1-.3 2.3-1.4 2.6l-1.5.4c-1.5.1-2.6.9-3.1 2.1l-1.5 1.3c-1 .8-2.3 1.1-3.6.8L12 18c-.8.5-1.7.8-2.7.8zM20 18c-1.1 0-1.99.9-1.99 2S18.9 22 20 22s2-.9 2-2-.9-2-2-2z"/>
              </svg>
              <span>AÑADIR</span>
            </button>
          </div>
        </div>

        <!-- Información de Pagos y Envíos -->
        <div class="bg-card p-6 rounded-2xl shadow-inner border border-secondary/10">
          <h3 class="text-lg font-bold mb-3 text-page">Pagos y Envíos:</h3>
          <div class="flex flex-wrap gap-4 items-center mb-4">
            <span class="flex items-center space-x-2 text-sm text-secondary">
              <svg class="payment-icon w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="7" y1="15" x2="9" y2="15"/>
              </svg>
              <span class="text-page">Tarjeta (Visa/MC)</span>
            </span>
            <span class="flex items-center space-x-2 text-sm text-secondary">
              <svg class="payment-icon w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 10a2 2 0 0 0-2 2v2a2 2 0 0 0 4 0v-2a2 2 0 0 0-2-2z"/>
              </svg>
              <span class="text-page">PSE (Transferencia)</span>
            </span>
            <span class="flex items-center space-x-2 text-sm text-secondary">
              <svg class="payment-icon w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              <span class="text-page font-bold text-red-500">Efectivo (COD)</span>
            </span>
          </div>
          <p class="text-xs text-secondary italic">Envío Gratis en pedidos superiores a $200.000 COP</p>
        </div>
        
        <!-- Descripción del Producto -->
        <div class="mt-8">
          <h3 class="text-xl font-bold mb-3 text-page">Detalles del Producto</h3>
          <p class="text-secondary leading-relaxed">{{ product.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProductDetail',
  inject: ['currentProduct', 'showMessage'],
  emits: ['navigate', 'add-to-cart', 'open-ar'],
  data() {
    return {
      selectedSize: null,
      quantity: 1
    }
  },
  computed: {
    product() {
      return this.currentProduct()
    }
  },
  mounted() {
    if (this.product && this.product.variants) {
      // Seleccionar primera talla disponible
      const availableVariant = this.product.variants.find(v => v.stock > 0)
      if (availableVariant) {
        this.selectedSize = availableVariant.size
      }
    }
  },
  methods: {
    formatPrice(price) {
      return new Intl.NumberFormat('es-CO').format(price)
    },
    goBack() {
      this.$emit('navigate', 'listing')
    },
    getStockStatus(variant) {
      if (variant.stock === 0) return 'Agotado'
      if (variant.stock <= 5) return 'Bajo Stock'
      return 'Disponible'
    },
    decreaseQuantity() {
      if (this.quantity > 1) {
        this.quantity--
      }
    },
    increaseQuantity() {
      if (this.quantity < 10) {
        this.quantity++
      }
    },
    addToCart() {
      if (!this.selectedSize) {
        this.showMessage("Por favor, selecciona una talla antes de añadir al carrito.")
        return
      }
      
      const variant = this.product.variants.find(v => v.size === this.selectedSize)
      if (variant.stock < this.quantity) {
        this.showMessage(`Error: Solo quedan ${variant.stock} unidades de la talla ${this.selectedSize}.`)
        return
      }
      
      this.$emit('add-to-cart', this.product, this.selectedSize, this.quantity)
    },
    tryAR() {
      this.$emit('open-ar', this.product.imageUrl, this.product.name)
    },
    handleImageError(event) {
      event.target.src = 'https://placehold.co/1000x1200/c5c5c5/2d2d2d?text=Image+Not+Available'
    }
  }
}
</script>

<style scoped>
.quantity-input {
  appearance: textfield;
  -moz-appearance: textfield;
}
.quantity-input::-webkit-outer-spin-button,
.quantity-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>