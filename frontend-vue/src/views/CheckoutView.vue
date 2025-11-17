<template>
  <div>
    <h1 class="text-4xl font-extrabold mb-8 text-page">Finalizar Compra (Checkout)</h1>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Columna 1: Información de Envío -->
      <div class="lg:col-span-2 space-y-8">
        <div class="bg-card p-6 rounded-2xl shadow-xl border border-secondary/10">
          <h2 class="text-2xl font-bold mb-4 text-primary-accent">1. Datos de Envío</h2>
          <form class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Nombre Completo</label>
              <input v-model="shippingForm.fullName" type="text" placeholder="Juan Pérez" 
                     class="w-full p-2 border rounded-2xl focus:ring-primary-accent focus:border-primary-accent input-style">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Teléfono</label>
              <input v-model="shippingForm.phone" type="tel" placeholder="+57 300 000 0000" 
                     class="w-full p-2 border rounded-2xl focus:ring-primary-accent focus:border-primary-accent input-style">
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium mb-1">Dirección Completa</label>
              <input v-model="shippingForm.address" type="text" placeholder="Carrera 10 # 20-30, Apto 501" 
                     class="w-full p-2 border rounded-2xl focus:ring-primary-accent focus:border-primary-accent input-style">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Ciudad</label>
              <input v-model="shippingForm.city" type="text" placeholder="Bogotá" 
                     class="w-full p-2 border rounded-2xl focus:ring-primary-accent focus:border-primary-accent input-style">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Departamento</label>
              <input v-model="shippingForm.department" type="text" placeholder="Cundinamarca" 
                     class="w-full p-2 border rounded-2xl focus:ring-primary-accent focus:border-primary-accent input-style">
            </div>
          </form>
        </div>

        <!-- Columna 2: Método de Pago -->
        <div class="bg-card p-6 rounded-2xl shadow-xl border border-secondary/10">
          <h2 class="text-2xl font-bold mb-4 text-primary-accent">2. Método de Pago</h2>
          <div class="space-y-4">
            <!-- Opción 1: Tarjeta de Crédito / Débito -->
            <label class="block cursor-pointer transition duration-200 payment-label-card">
              <input v-model="selectedPayment" type="radio" value="card" class="peer hidden">
              <div class="p-4 rounded-2xl border-2 border-secondary/50 peer-checked:border-primary-accent transition duration-200 shadow-sm hover:shadow-md">
                <div class="flex justify-between items-center mb-1">
                  <span class="font-bold text-page">Tarjeta de Crédito / Débito</span>
                  <svg class="w-6 h-6 payment-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="7" y1="15" x2="9" y2="15"/><circle cx="15" cy="15" r="1"/>
                  </svg>
                </div>
                <div class="text-xs text-secondary">Acepta Visa, Mastercard y American Express. Pago inmediato.</div>
              </div>
            </label>
            
            <!-- Opción 2: PSE -->
            <label class="block cursor-pointer transition duration-200 payment-label-card">
              <input v-model="selectedPayment" type="radio" value="pse" class="peer hidden">
              <div class="p-4 rounded-2xl border-2 border-secondary/50 peer-checked:border-primary-accent transition duration-200 shadow-sm hover:shadow-md">
                <div class="flex justify-between items-center mb-1">
                  <span class="font-bold text-page">PSE (Pagos Seguros en Línea)</span>
                  <svg class="w-6 h-6 payment-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 10a2 2 0 0 0-2 2v2a2 2 0 0 0 4 0v-2a2 2 0 0 0-2-2z"/>
                  </svg>
                </div>
                <div class="text-xs text-secondary">Transferencia directa desde tu banco. Requiere validación asíncrona.</div>
              </div>
            </label>
            
            <!-- Opción 3: Efectivo Contra Entrega -->
            <label class="block cursor-pointer transition duration-200 payment-label-cod">
              <input v-model="selectedPayment" type="radio" value="cod" class="peer hidden">
              <div class="p-4 rounded-2xl border-2 border-secondary/50 peer-checked:border-cod-color transition duration-200 shadow-sm hover:shadow-md">
                <div class="flex justify-between items-center mb-1">
                  <span class="font-bold cod-text">Efectivo Contra Entrega (COD)</span>
                  <svg class="w-6 h-6 payment-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
                <div class="text-xs text-secondary">Paga al mensajero al recibir tu pedido. Puede aplicar costo adicional.</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Columna 3: Resumen Final y CTA -->
      <div class="lg:col-span-1">
        <div class="bg-card p-6 rounded-2xl shadow-xl border border-primary-accent/30 sticky top-24">
          <h2 class="text-2xl font-bold mb-4 text-page">Total a Pagar</h2>
          <div class="space-y-3 mb-6">
            <div class="flex justify-between text-secondary">
              <span>Subtotal:</span>
              <span>${{ formatPrice(subtotal) }} COP</span>
            </div>
            <div class="flex justify-between text-secondary">
              <span>Envío:</span>
              <span>$ 0 COP</span>
            </div>
            <div class="flex justify-between text-xl font-extrabold text-page border-t pt-3 border-primary-accent/50">
              <span>Total:</span>
              <span class="text-primary-accent">${{ formatPrice(total) }} COP</span>
            </div>
          </div>
          <button @click="placeOrder" 
                  class="btn-primary w-full py-4 text-xl font-bold rounded-2xl">
            <span class="text-page">CONFIRMAR Y PAGAR</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CheckoutView',
  inject: ['cart', 'showMessage'],
  emits: ['navigate'],
  data() {
    return {
      selectedPayment: 'card',
      shippingForm: {
        fullName: '',
        phone: '',
        address: '',
        city: '',
        department: ''
      }
    }
  },
  computed: {
    cartItems() {
      return this.cart()
    },
    subtotal() {
      return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    },
    total() {
      return this.subtotal
    }
  },
  mounted() {
    if (this.cartItems.length === 0) {
      this.showMessage("El carrito está vacío, no se puede pagar.")
      this.$emit('navigate', 'listing')
    }
  },
  methods: {
    formatPrice(price) {
      return new Intl.NumberFormat('es-CO').format(price)
    },
    placeOrder() {
      if (this.selectedPayment === 'cod') {
        this.showMessage("¡Pedido Confirmado! Pagarás en efectivo al recibir.")
      } else if (this.selectedPayment === 'pse') {
        this.showMessage("Redirigiendo a PSE para pago asíncrono...")
      } else {
        this.showMessage("Procesando pago con tarjeta...")
      }
      
      // Simular proceso de pago
      setTimeout(() => {
        // Vaciar carrito (esto se haría en el store/parent)
        this.$emit('navigate', 'listing')
        this.showMessage("El flujo de compra ha finalizado. ¡Gracias!")
      }, 3000)
    }
  }
}
</script>

<style scoped>
.payment-label-card {
  border: 2px solid transparent;
}
.payment-label-card:hover {
  border-color: var(--secondary-color);
}
.payment-label-card input:checked + div {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb), 0.2);
}

.payment-label-cod .cod-text {
  color: var(--cod-color);
  font-weight: 700;
}
.payment-label-cod:hover {
  border-color: var(--cod-color);
}
.payment-label-cod input:checked + div {
  border-color: var(--cod-color);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}
.payment-label-cod .payment-icon {
  fill: var(--cod-color);
}
</style>