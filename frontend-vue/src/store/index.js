import { reactive } from 'vue'

export const store = reactive({
  cart: [],
  user: null,
  
  // Métodos del carrito
  addToCart(product) {
    const existingItem = this.cart.find(item => item.id === product.id)
    if (existingItem) {
      existingItem.quantity += 1
    } else {
      this.cart.push({
        ...product,
        quantity: 1,
        uniqueId: Date.now()
      })
    }
  },
  
  removeFromCart(uniqueId) {
    const index = this.cart.findIndex(item => item.uniqueId === uniqueId)
    if (index > -1) {
      this.cart.splice(index, 1)
    }
  },
  
  updateQuantity(uniqueId, quantity) {
    const item = this.cart.find(item => item.uniqueId === uniqueId)
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(uniqueId)
      } else {
        item.quantity = quantity
      }
    }
  },
  
  clearCart() {
    this.cart = []
  },
  
  get cartCount() {
    return this.cart.reduce((total, item) => total + item.quantity, 0)
  },
  
  get cartTotal() {
    return this.cart.reduce((total, item) => total + (item.precio * item.quantity), 0)
  },
  
  // Métodos de usuario
  setUser(user) {
    this.user = user
  },
  
  logout() {
    this.user = null
    this.clearCart()
  }
})