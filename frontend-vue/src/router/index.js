import { createRouter, createWebHistory } from 'vue-router'
import Inicio from '../views/Inicio.vue'
import Productos from '../views/Productos.vue'
import Carrito from '../views/Carrito.vue'

const routes = [
  {
    path: '/',
    name: 'Inicio',
    component: Inicio
  },
  {
    path: '/productos',
    name: 'Productos',
    component: Productos
  },
  {
    path: '/carrito',
    name: 'Carrito',
    component: Carrito
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router