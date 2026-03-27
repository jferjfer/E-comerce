import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import ProductCard from '@/components/ProductCard'
import Modal from '@/components/Modal'
import ARModal from '@/components/ARModal'
import Footer from '@/components/Footer'
import HeroCarousel from '@/components/HeroCarousel'
import { Producto } from '@/types'
import { formatPrice } from '@/utils/sanitize'
import { useCartStore } from '@/store/useCartStore'
import { useNotificationStore } from '@/store/useNotificationStore'

export default function HomePage() {
  const navigate = useNavigate()
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showAR, setShowAR] = useState(false)
  const [productos, setProductos] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtros, setFiltros] = useState({
    categoria: '',
    precioMin: '',
    precioMax: '',
    busqueda: '',
    ordenar: 'relevancia'
  })

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setCargando(true)
        const data = await api.obtenerProductos()
        setProductos(data.productos || [])
      } catch (error) {
        console.error('Error al cargar productos:', error)
      } finally {
        setCargando(false)
      }
    }
    cargarProductos()
  }, [])

  const productosFiltrados = useMemo(() => {
    let filtrados = [...productos]
    if (filtros.categoria) filtrados = filtrados.filter(p => p.categoria === filtros.categoria)
    if (filtros.precioMin) filtrados = filtrados.filter(p => p.precio >= parseInt(filtros.precioMin))
    if (filtros.precioMax) filtrados = filtrados.filter(p => p.precio <= parseInt(filtros.precioMax))
    if (filtros.busqueda) filtrados = filtrados.filter(p =>
      p.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      p.descripcion.toLowerCase().includes(filtros.busqueda.toLowerCase())
    )
    if (filtros.ordenar === 'precio_asc') filtrados.sort((a, b) => a.precio - b.precio)
    else if (filtros.ordenar === 'precio_desc') filtrados.sort((a, b) => b.precio - a.precio)
    else if (filtros.ordenar === 'nombre') filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre))
    return filtrados
  }, [productos, filtros])

  const limpiarFiltros = () => setFiltros({ categoria: '', precioMin: '', precioMax: '', busqueda: '', ordenar: 'relevancia' })

  const manejarVerDetalles = (producto: Producto) => {
    setProductoSeleccionado(producto)
    setShowProductModal(true)
  }

  return (
    <div className="bg-[#0a0a0a] min-h-screen">

      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop"
            className="w-full h-full object-cover opacity-40"
            alt="EGOS Hero"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-[#0a0a0a]"></div>
        </div>
        <div className="relative z-10 w-full px-4 text-center">
          <HeroCarousel />
        </div>
      </section>

      {/* Barra de Filtros */}
      <section className="sticky top-16 sm:top-20 z-30 bg-black/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">

            <select
              value={filtros.categoria}
              onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}
              className="flex-shrink-0 bg-transparent border border-white/10 text-gray-300 px-3 py-1.5 text-xs tracking-wider focus:outline-none focus:border-gold/50 hover:border-white/30 transition-colors"
            >
              <option value="" className="bg-black">Todas las categorías</option>
              <option value="Vestidos" className="bg-black">Vestidos</option>
              <option value="Camisas" className="bg-black">Camisas</option>
              <option value="Pantalones" className="bg-black">Pantalones</option>
              <option value="Blazers" className="bg-black">Blazers</option>
              <option value="Calzado" className="bg-black">Calzado</option>
            </select>

            <input
              type="text"
              placeholder="Buscar..."
              value={filtros.busqueda}
              onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
              className="flex-shrink-0 bg-transparent border border-white/10 text-gray-300 placeholder-gray-600 px-3 py-1.5 text-xs w-28 sm:w-40 focus:outline-none focus:border-gold/50"
            />

            <div className="flex-shrink-0 flex gap-1 items-center">
              <input
                type="number"
                placeholder="Mín"
                value={filtros.precioMin}
                onChange={(e) => setFiltros(prev => ({ ...prev, precioMin: e.target.value }))}
                className="bg-transparent border border-white/10 text-gray-300 placeholder-gray-600 px-2 py-1.5 text-xs w-16 focus:outline-none focus:border-gold/50"
              />
              <span className="text-gray-600 text-xs">—</span>
              <input
                type="number"
                placeholder="Máx"
                value={filtros.precioMax}
                onChange={(e) => setFiltros(prev => ({ ...prev, precioMax: e.target.value }))}
                className="bg-transparent border border-white/10 text-gray-300 placeholder-gray-600 px-2 py-1.5 text-xs w-16 focus:outline-none focus:border-gold/50"
              />
            </div>

            <select
              value={filtros.ordenar}
              onChange={(e) => setFiltros(prev => ({ ...prev, ordenar: e.target.value }))}
              className="flex-shrink-0 bg-transparent border border-white/10 text-gray-300 px-3 py-1.5 text-xs tracking-wider focus:outline-none focus:border-gold/50"
            >
              <option value="relevancia" className="bg-black">Relevancia</option>
              <option value="precio_asc" className="bg-black">Precio ↑</option>
              <option value="precio_desc" className="bg-black">Precio ↓</option>
              <option value="nombre" className="bg-black">A-Z</option>
            </select>

            <button
              onClick={limpiarFiltros}
              className="flex-shrink-0 text-xs text-gray-600 hover:text-gold px-2 py-1.5 transition-colors tracking-wider"
            >
              <i className="fas fa-times mr-1"></i>
              <span className="hidden sm:inline">Limpiar</span>
            </button>

            <span className="flex-shrink-0 text-xs text-gray-600 ml-auto tracking-widest">
              {cargando ? '...' : `${productosFiltrados.length} piezas`}
            </span>
          </div>
        </div>
      </section>

      {/* Grid de Productos */}
      <section className="py-8 sm:py-12">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16">
          {cargando ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-px bg-white/5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-[#111] animate-pulse">
                  <div className="bg-[#1a1a1a]" style={{ paddingBottom: '130%' }}></div>
                  <div className="p-3 space-y-2">
                    <div className="h-2 bg-[#1a1a1a] rounded w-3/4"></div>
                    <div className="h-3 bg-[#1a1a1a] rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : productosFiltrados.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-px bg-white/5">
              {productosFiltrados.map((producto, index) => (
                <ProductCard
                  key={producto.id || `producto-${index}`}
                  product={producto}
                  onViewDetails={manejarVerDetalles}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <p className="font-prata text-2xl text-gray-600 tracking-widest mb-4">Sin resultados</p>
              <button onClick={limpiarFiltros} className="text-xs text-gold tracking-[3px] uppercase hover:text-gold-light transition-colors">
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Modal Producto */}
      {productoSeleccionado && (
        <Modal isOpen={showProductModal} onClose={() => setShowProductModal(false)} title="" size="lg">
          <div className="bg-[#0a0a0a] -m-6 rounded-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="bg-[#111]">
                <img
                  src={productoSeleccionado.imagen}
                  className="w-full h-full object-cover"
                  style={{ minHeight: '400px', maxHeight: '600px' }}
                  alt={productoSeleccionado.nombre}
                />
              </div>
              <div className="p-8 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-[3px] mb-2">{productoSeleccionado.categoria}</p>
                  <h2 className="font-prata text-xl text-white tracking-wide mb-4">{productoSeleccionado.nombre}</h2>
                  <p className="font-bodoni text-3xl text-gold mb-6">{formatPrice(productoSeleccionado.precio)}</p>
                  <p className="text-sm text-gray-400 leading-relaxed mb-6">{productoSeleccionado.descripcion}</p>
                  <div className="border-t border-white/5 pt-4 mb-6">
                    <ul className="text-xs text-gray-500 space-y-1.5 tracking-wide">
                      <li>Tallas: {productoSeleccionado.tallas?.join(' · ')}</li>
                      <li>Envío gratuito</li>
                      <li>Devolución 30 días</li>
                    </ul>
                  </div>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      useCartStore.getState().agregarItem(productoSeleccionado)
                      useNotificationStore.getState().addNotification(`${productoSeleccionado.nombre} agregado al carrito`, 'success')
                      setShowProductModal(false)
                    }}
                    className="w-full bg-gold text-black py-3 text-xs font-semibold tracking-[4px] uppercase hover:bg-gold-light transition-colors"
                  >
                    Agregar al carrito
                  </button>
                  <button
                    onClick={() => {
                      setShowProductModal(false)
                      navigate('/virtual-tryon', { state: { productUrl: productoSeleccionado.imagen } })
                    }}
                    className="w-full border border-white/20 text-gray-300 py-3 text-xs tracking-[4px] uppercase hover:border-gold/50 hover:text-gold transition-colors"
                  >
                    Probar en Avatar 3D
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <ARModal
        isOpen={showAR && productoSeleccionado !== null}
        onClose={() => { setShowAR(false); setProductoSeleccionado(null) }}
        productName={productoSeleccionado?.nombre || ''}
        productImage={productoSeleccionado?.imagen || ''}
      />

      <Footer />
    </div>
  )
}
