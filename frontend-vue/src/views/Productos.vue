<template>
  <div class="productos">
    <div class="container">
      <div class="productos-header">
        <h1>Catálogo de Productos</h1>
        <div class="filters">
          <select v-model="filtroCategoria" @change="filtrarProductos">
            <option value="">Todas las categorías</option>
            <option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">
              {{ categoria.nombre }}
            </option>
          </select>
          
          <select v-model="ordenamiento" @change="ordenarProductos">
            <option value="nombre">Nombre A-Z</option>
            <option value="precio-asc">Precio: Menor a Mayor</option>
            <option value="precio-desc">Precio: Mayor a Menor</option>
          </select>
        </div>
      </div>
      
      <div class="productos-grid">
        <ProductCard 
          v-for="producto in productosFiltrados" 
          :key="producto.id"
          :producto="producto"
          @add-to-cart="agregarAlCarrito"
        />
      </div>
      
      <div v-if="productosFiltrados.length === 0" class="no-productos">
        <h3>No se encontraron productos</h3>
        <p>Intenta cambiar los filtros de búsqueda</p>
      </div>
    </div>
  </div>
</template>

<script>
import ProductCard from '../components/ProductCard.vue'
import { catalogService } from '../services/catalogService'

export default {
  name: 'Productos',
  components: {
    ProductCard
  },
  data() {
    return {
      productos: [],
      productosFiltrados: [],
      categorias: [],
      filtroCategoria: '',
      ordenamiento: 'nombre'
    }
  },
  async mounted() {
    await this.cargarDatos()
  },
  methods: {
    async cargarDatos() {
      try {
        this.productos = await catalogService.getProductos()
        this.categorias = await catalogService.getCategorias()
        this.productosFiltrados = [...this.productos]
      } catch (error) {
        // Fallback con datos mock
        this.productos = [
          {
            id: 1,
            nombre: 'Camiseta Básica Blanca',
            precio: 29.99,
            imagen: 'https://via.placeholder.com/300x300',
            stock: 15,
            categoria_id: 1
          },
          {
            id: 2,
            nombre: 'Jeans Clásicos Azules',
            precio: 79.99,
            imagen: 'https://via.placeholder.com/300x300',
            stock: 3,
            categoria_id: 2
          },
          {
            id: 3,
            nombre: 'Chaqueta Denim Negra',
            precio: 99.99,
            imagen: 'https://via.placeholder.com/300x300',
            stock: 8,
            categoria_id: 3
          },
          {
            id: 4,
            nombre: 'Zapatillas Deportivas',
            precio: 129.99,
            imagen: 'https://via.placeholder.com/300x300',
            stock: 12,
            categoria_id: 4
          },
          {
            id: 5,
            nombre: 'Vestido Casual Rosa',
            precio: 59.99,
            imagen: 'https://via.placeholder.com/300x300',
            stock: 6,
            categoria_id: 5
          },
          {
            id: 6,
            nombre: 'Sudadera con Capucha',
            precio: 49.99,
            imagen: 'https://via.placeholder.com/300x300',
            stock: 20,
            categoria_id: 1
          }
        ]
        
        this.categorias = [
          { id: 1, nombre: 'Camisetas' },
          { id: 2, nombre: 'Pantalones' },
          { id: 3, nombre: 'Chaquetas' },
          { id: 4, nombre: 'Calzado' },
          { id: 5, nombre: 'Vestidos' }
        ]
        
        this.productosFiltrados = [...this.productos]
      }
    },
    
    filtrarProductos() {
      if (this.filtroCategoria === '') {
        this.productosFiltrados = [...this.productos]
      } else {
        this.productosFiltrados = this.productos.filter(
          producto => producto.categoria_id == this.filtroCategoria
        )
      }
      this.ordenarProductos()
    },
    
    ordenarProductos() {
      switch (this.ordenamiento) {
        case 'nombre':
          this.productosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre))
          break
        case 'precio-asc':
          this.productosFiltrados.sort((a, b) => a.precio - b.precio)
          break
        case 'precio-desc':
          this.productosFiltrados.sort((a, b) => b.precio - a.precio)
          break
      }
    },
    
    agregarAlCarrito(producto) {
      console.log('Agregando al carrito:', producto)
      // Implementar lógica del carrito
    }
  }
}
</script>

<style scoped>
.productos {
  padding: 40px 0;
}

.productos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.productos-header h1 {
  font-size: 36px;
  color: var(--primary);
}

.filters {
  display: flex;
  gap: 15px;
}

.filters select {
  padding: 10px 15px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: white;
  font-family: inherit;
  cursor: pointer;
}

.productos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 30px;
}

.no-productos {
  text-align: center;
  padding: 60px 20px;
  color: var(--secondary);
}

.no-productos h3 {
  margin-bottom: 10px;
  color: var(--primary);
}

@media (max-width: 768px) {
  .productos-header {
    flex-direction: column;
    gap: 20px;
    align-items: stretch;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .productos-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
  }
}
</style>