<template>
  <div class="carrito-page">
    <div class="container">
      <h1>Carrito de Compras</h1>
      
      <div v-if="items.length === 0" class="carrito-vacio">
        <div class="empty-icon">🛒</div>
        <h2>Tu carrito está vacío</h2>
        <p>Explora nuestros productos y agrega algunos al carrito</p>
        <router-link to="/productos" class="btn btn-primary">
          Ver Productos
        </router-link>
      </div>
      
      <div v-else class="carrito-content">
        <div class="carrito-items">
          <div v-for="item in items" :key="item.id" class="carrito-item">
            <img :src="item.imagen" :alt="item.nombre">
            <div class="item-details">
              <h3>{{ item.nombre }}</h3>
              <p class="item-price">${{ item.precio }}</p>
              <div class="item-controls">
                <button @click="updateQuantity(item.id, item.cantidad - 1)" class="btn-quantity">-</button>
                <span class="quantity">{{ item.cantidad }}</span>
                <button @click="updateQuantity(item.id, item.cantidad + 1)" class="btn-quantity">+</button>
                <button @click="removeItem(item.id)" class="btn-remove">Eliminar</button>
              </div>
            </div>
            <div class="item-total">
              ${{ (item.precio * item.cantidad).toFixed(2) }}
            </div>
          </div>
        </div>
        
        <div class="carrito-sidebar">
          <div class="resumen-pedido">
            <h3>Resumen del Pedido</h3>
            
            <div class="resumen-line">
              <span>Subtotal ({{ totalItems }} artículos):</span>
              <span>${{ subtotal.toFixed(2) }}</span>
            </div>
            
            <div class="resumen-line">
              <span>Envío:</span>
              <span>${{ envio.toFixed(2) }}</span>
            </div>
            
            <div class="resumen-line total">
              <span>Total:</span>
              <span>${{ total.toFixed(2) }}</span>
            </div>
            
            <button @click="proceedToCheckout" class="btn btn-primary checkout-btn">
              Proceder al Pago
            </button>
            
            <router-link to="/productos" class="btn btn-secondary continue-shopping">
              Seguir Comprando
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Carrito',
  data() {
    return {
      items: [
        // Mock data
        {
          id: 1,
          nombre: 'Camiseta Básica Blanca',
          precio: 29.99,
          cantidad: 2,
          imagen: 'https://via.placeholder.com/150x150'
        },
        {
          id: 2,
          nombre: 'Jeans Clásicos Azules',
          precio: 79.99,
          cantidad: 1,
          imagen: 'https://via.placeholder.com/150x150'
        }
      ],
      envio: 9.99
    }
  },
  computed: {
    subtotal() {
      return this.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
    },
    total() {
      return this.subtotal + this.envio
    },
    totalItems() {
      return this.items.reduce((sum, item) => sum + item.cantidad, 0)
    }
  },
  methods: {
    updateQuantity(id, newQuantity) {
      if (newQuantity <= 0) {
        this.removeItem(id)
        return
      }
      
      const item = this.items.find(item => item.id === id)
      if (item) {
        item.cantidad = newQuantity
      }
    },
    
    removeItem(id) {
      this.items = this.items.filter(item => item.id !== id)
    },
    
    proceedToCheckout() {
      console.log('Procediendo al checkout')
      // Implementar navegación al checkout
    }
  }
}
</script>

<style scoped>
.carrito-page {
  padding: 40px 0;
  min-height: 60vh;
}

.carrito-page h1 {
  font-size: 36px;
  margin-bottom: 40px;
  color: var(--primary);
}

.carrito-vacio {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 30px;
  opacity: 0.5;
}

.carrito-vacio h2 {
  margin-bottom: 15px;
  color: var(--primary);
}

.carrito-vacio p {
  color: var(--secondary);
  margin-bottom: 30px;
  font-size: 18px;
}

.carrito-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 40px;
}

.carrito-item {
  display: grid;
  grid-template-columns: 150px 1fr auto;
  gap: 20px;
  padding: 20px 0;
  border-bottom: 1px solid var(--border);
}

.carrito-item img {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
}

.item-details h3 {
  font-size: 20px;
  margin-bottom: 10px;
  color: var(--primary);
}

.item-price {
  font-size: 18px;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 15px;
}

.item-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.btn-quantity {
  width: 35px;
  height: 35px;
  border: 1px solid var(--border);
  background: white;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.btn-quantity:hover {
  background: var(--hover);
}

.quantity {
  min-width: 30px;
  text-align: center;
  font-weight: 600;
  font-size: 16px;
}

.btn-remove {
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  text-decoration: underline;
  font-family: inherit;
}

.item-total {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
  text-align: right;
}

.carrito-sidebar {
  position: sticky;
  top: 20px;
  height: fit-content;
}

.resumen-pedido {
  background: var(--accent);
  padding: 30px;
  border-radius: 8px;
}

.resumen-pedido h3 {
  margin-bottom: 20px;
  color: var(--primary);
}

.resumen-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  font-size: 16px;
}

.resumen-line.total {
  font-weight: 700;
  font-size: 20px;
  color: var(--primary);
  border-top: 2px solid var(--border);
  padding-top: 15px;
  margin-top: 20px;
}

.checkout-btn {
  width: 100%;
  margin: 25px 0 15px 0;
  padding: 15px;
  font-size: 16px;
  font-weight: 600;
}

.continue-shopping {
  width: 100%;
  text-align: center;
  padding: 12px;
}

@media (max-width: 768px) {
  .carrito-content {
    grid-template-columns: 1fr;
    gap: 30px;
  }
  
  .carrito-item {
    grid-template-columns: 100px 1fr;
    gap: 15px;
  }
  
  .carrito-item img {
    width: 100px;
    height: 100px;
  }
  
  .item-total {
    grid-column: 1 / -1;
    text-align: left;
    margin-top: 10px;
  }
}
</style>