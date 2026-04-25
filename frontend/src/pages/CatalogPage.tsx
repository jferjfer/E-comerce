import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import ProductCard from '@/components/ProductCard'
import { SkeletonProductGrid } from '@/components/Skeleton'
import Footer from '@/components/Footer'
import { Producto } from '@/types'
import { formatPrice } from '@/utils/sanitize'
import { useCartStore } from '@/store/useCartStore'
import { useNotificationStore } from '@/store/useNotificationStore'

export default function CatalogPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({
    category: '',
    size: '',
    color: '',
    sortBy: 'relevance'
  })
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [mostrarModalProducto, setMostrarModalProducto] = useState(false)
  const [mostrarAR, setMostrarAR] = useState(false)
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<string[]>([])
  const [cargando, setCargando] = useState(true)
  const [paginaActual, setPaginaActual] = useState(1)
  const PRODUCTOS_POR_PAGINA = 24

  // Cargar productos del backend
  useEffect(() => {
    const cargarProductos = async () => {
      setCargando(true)
      try {
        console.log('🔄 Cargando productos del catálogo...')
        const [dataProductos, dataCategorias] = await Promise.all([
          api.obtenerProductos(),
          api.obtenerCategorias()
        ])
        setProductos(dataProductos.productos || [])
        const cats = (dataCategorias.categorias || []).map((c: any) => c.nombre)
        setCategorias(cats)
        console.log(`✅ ${dataProductos.productos?.length || 0} productos cargados`)
      } catch (error) {
        console.error('❌ Error al cargar productos:', error)
        setProductos([])
      } finally {
        setCargando(false)
      }
    }

    cargarProductos()
  }, [])

  const manejarVerDetalles = (producto: Producto) => {
    setProductoSeleccionado(producto)
    setMostrarModalProducto(true)
  }

  const cerrarModalProducto = () => {
    setMostrarModalProducto(false)
  }

  const cerrarAR = () => {
    setMostrarAR(false)
    setProductoSeleccionado(null)
  }

  const productosFiltrados = useMemo(() => {
    let filtrados = [...productos]
    if (filters.category) filtrados = filtrados.filter(p => p.categoria === filters.category)
    if (filters.sortBy === 'price-low') filtrados.sort((a, b) => a.precio - b.precio)
    else if (filters.sortBy === 'price-high') filtrados.sort((a, b) => b.precio - a.precio)
    setPaginaActual(1)
    return filtrados
  }, [productos, filters])

  const clearFilters = () => {
    setFilters({ category: '', size: '', color: '', sortBy: 'relevance' })
    setPaginaActual(1)
  }

  const totalPaginas = Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA)
  const productosPagina = useMemo(
    () => productosFiltrados.slice((paginaActual - 1) * PRODUCTOS_POR_PAGINA, paginaActual * PRODUCTOS_POR_PAGINA),
    [productosFiltrados, paginaActual]
  )

  return (
    <div className="py-6 sm:py-8 md:py-12 bg-gray-50 min-h-screen">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
            <span className="text-xs sm:text-sm font-medium text-gray-700 hidden sm:inline">Filtros:</span>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
            >
              <option value="">Todas</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm ml-auto"
            >
              <option value="relevance">Relevancia</option>
              <option value="price-low">Precio ↑</option>
              <option value="price-high">Precio ↓</option>
            </select>

            <button
              onClick={clearFilters}
              className="text-xs sm:text-sm text-gray-500 hover:text-gray-700"
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/" className="text-primary hover:text-secondary text-sm sm:text-base">
              <i className="fas fa-arrow-left mr-2"></i>
              Volver
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">Catálogo</h1>
          </div>
          <span className="text-xs sm:text-sm text-gray-600">
            {cargando ? 'Cargando...' : `${productosFiltrados.length} productos`}
          </span>
        </div>

        {cargando ? (
          <SkeletonProductGrid cantidad={24} />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 gap-3 sm:gap-4 md:gap-6">
              {productosPagina.map((producto, index) => (
                <ProductCard
                  key={producto.id || `catalog-producto-${index}`}
                  product={producto}
                  onViewDetails={manejarVerDetalles}
                />
              ))}
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
                <button
                  onClick={() => { setPaginaActual(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  disabled={paginaActual === 1}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:border-primary hover:text-primary transition-colors"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>

                {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPaginas || Math.abs(p - paginaActual) <= 1)
                  .reduce<(number | '...')[]>((acc, p, i, arr) => {
                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`dots-${i}`} className="px-2 text-gray-400">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => { setPaginaActual(p as number); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          paginaActual === p
                            ? 'bg-primary text-white'
                            : 'border border-gray-300 hover:border-primary hover:text-primary'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )
                }

                <button
                  onClick={() => { setPaginaActual(p => Math.min(totalPaginas, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  disabled={paginaActual === totalPaginas}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:border-primary hover:text-primary transition-colors"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {productoSeleccionado && mostrarModalProducto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9998] p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-2xl font-bold">{productoSeleccionado.nombre}</h3>
              <button onClick={cerrarModalProducto} className="text-gray-500 hover:text-gray-700 text-2xl">
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Imagen */}
                <div>
                  <img
                    src={productoSeleccionado.imagen}
                    className="w-full h-auto rounded-lg"
                    alt={productoSeleccionado.nombre}
                  />
                </div>

                {/* Detalles */}
                <div className="space-y-4">
                  <p className="text-base text-gray-600">{productoSeleccionado.descripcion}</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatPrice(productoSeleccionado.precio)}
                  </p>

                  {/* Botones */}
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        const agregarItem = useCartStore.getState().agregarItem
                        const addNotification = useNotificationStore.getState().addNotification
                        agregarItem(productoSeleccionado)
                        addNotification(`${productoSeleccionado.nombre} agregado al carrito`, 'success')
                      }}
                      className="w-full bg-primary text-white py-3 rounded-lg hover:bg-secondary transition-colors text-base font-semibold"
                    >
                      <i className="fas fa-shopping-cart mr-2"></i>
                      Agregar al Carrito
                    </button>
                    <button
                      onClick={() => {
                        cerrarModalProducto()
                        navigate('/virtual-tryon', { state: { productUrl: productoSeleccionado.imagen } })
                      }}
                      className="w-full bg-gradient-to-r from-gray-800 to-pink-500 text-white py-3 rounded-lg hover:from-gray-800 hover:to-pink-600 transition-colors text-base font-semibold"
                    >
                      <i className="fas fa-user-astronaut mr-2"></i>
                      Probar en Avatar 3D
                    </button>
                    {/* Botón AR original (deshabilitado por preferencia)
                    <button 
                      onClick={() => {
                        cerrarModalProducto()
                        setMostrarAR(true)
                      }}
                      className="w-full bg-gradient-to-r from-gray-800 to-pink-500 text-white py-3 rounded-lg hover:from-gray-800 hover:to-pink-600 transition-colors text-base font-semibold"
                    >
                      <i className="fas fa-camera mr-2"></i>
                      Probar con Cámara AR
                    </button>
                    */}
                  </div>

                  {/* Características */}
                  <div className="border-t pt-4">
                    <h5 className="font-semibold mb-2 text-base">Características:</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Material sostenible</li>
                      <li>• Tallas disponibles: {productoSeleccionado.tallas?.join(', ')}</li>
                      <li>• Envío gratuito</li>
                      <li>• Devolución 30 días</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ARModal
        isOpen={mostrarAR && productoSeleccionado !== null}
        onClose={cerrarAR}
        productName={productoSeleccionado?.nombre || ''}
        productImage={productoSeleccionado?.imagen || ''}
      />


      <Footer />
    </div>
  )
}