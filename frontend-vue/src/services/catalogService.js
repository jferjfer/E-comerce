const API_BASE = 'http://localhost:3002/api'

export const catalogService = {
  async getProductos() {
    const response = await fetch(`${API_BASE}/productos`)
    if (!response.ok) throw new Error('Error al obtener productos')
    return response.json()
  },

  async getProductosDestacados() {
    const response = await fetch(`${API_BASE}/productos/destacados`)
    if (!response.ok) {
      // Fallback con datos mock si el servicio no está disponible
      return [
        {
          id: 1,
          nombre: 'Camiseta Básica',
          precio: 29.99,
          imagen: 'https://via.placeholder.com/300x300',
          stock: 15
        },
        {
          id: 2,
          nombre: 'Jeans Clásicos',
          precio: 79.99,
          imagen: 'https://via.placeholder.com/300x300',
          stock: 3
        },
        {
          id: 3,
          nombre: 'Chaqueta Denim',
          precio: 99.99,
          imagen: 'https://via.placeholder.com/300x300',
          stock: 8
        },
        {
          id: 4,
          nombre: 'Zapatillas Deportivas',
          precio: 129.99,
          imagen: 'https://via.placeholder.com/300x300',
          stock: 12
        }
      ]
    }
    return response.json()
  },

  async getCategorias() {
    const response = await fetch(`${API_BASE}/categorias`)
    if (!response.ok) throw new Error('Error al obtener categorías')
    return response.json()
  }
}