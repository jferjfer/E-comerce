import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '@/services/api'
import { useCartStore } from '@/store/useCartStore'
import { useUserStore } from '@/store/useUserStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { formatPrice } from '@/utils/sanitize'
import { API_URL } from '@/config/api'
import { Producto } from '@/types'
import Footer from '@/components/Footer'

interface Resena {
  id: string
  usuario_nombre: string
  calificacion: number
  comentario: string
  fecha: string
  verificado: boolean
}

export default function ProductoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [producto, setProducto] = useState<Producto | null>(null)
  const [cargando, setCargando] = useState(true)
  const [resenas, setResenas] = useState<Resena[]>([])
  const [productosRelacionados, setProductosRelacionados] = useState<Producto[]>([])
  const [tallaSeleccionada, setTallaSeleccionada] = useState('')
  const [colorSeleccionado, setColorSeleccionado] = useState('')
  const [agregando, setAgregando] = useState(false)
  const [imagenActiva, setImagenActiva] = useState(0)

  const agregarItem = useCartStore(state => state.agregarItem)
  const { addToFavorites, removeFromFavorites, isFavorite } = useUserStore()
  const { token } = useAuthStore()
  const addNotification = useNotificationStore(state => state.addNotification)

  useEffect(() => {
    if (!id) return
    cargarProducto()
    cargarResenas()
    window.scrollTo(0, 0)
  }, [id])

  const cargarProducto = async () => {
    setCargando(true)
    try {
      const res = await fetch(`${API_URL}/api/productos/${id}`)
      const data = await res.json()
      const prod = data.producto || data
      setProducto({
        id: prod.id?.toString() || '',
        nombre: prod.nombre || '',
        precio: prod.precio || 0,
        imagen: prod.imagen || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
        descripcion: prod.descripcion || '',
        categoria: prod.categoria || '',
        tallas: prod.tallas || [],
        colores: prod.colores || [],
        calificacion: prod.calificacion || 0,
        en_stock: prod.en_stock !== false,
        es_eco: prod.es_eco || false,
      })
      if (prod.tallas?.length) setTallaSeleccionada(prod.tallas[0])
      if (prod.colores?.length) setColorSeleccionado(prod.colores[0])

      // Cargar relacionados por categoría
      const dataRel = await api.obtenerProductos()
      const relacionados = (dataRel.productos || [])
        .filter((p: Producto) => p.categoria === prod.categoria && p.id !== prod.id)
        .slice(0, 4)
      setProductosRelacionados(relacionados)
    } catch {
      addNotification('No se pudo cargar el producto', 'error')
      navigate('/')
    } finally {
      setCargando(false)
    }
  }

  const cargarResenas = async () => {
    try {
      const res = await fetch(`${API_URL}/api/resenas/${id}`)
      const data = await res.json()
      setResenas(data.resenas || [])
    } catch {}
  }

  const manejarAgregarCarrito = async () => {
    if (!producto) return
    setAgregando(true)
    agregarItem(producto)
    addNotification(`${producto.nombre} agregado al carrito`, 'success')
    setTimeout(() => setAgregando(false), 600)
  }

  const manejarToggleFavorito = async () => {
    if (!producto) return
    if (isFavorite(producto.id)) {
      removeFromFavorites(producto.id)
      addNotification('Eliminado de favoritos', 'info')
      if (token) {
        try {
          await fetch(`${API_URL}/api/listas-deseos/${producto.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          })
        } catch {}
      }
    } else {
      addToFavorites(producto.id)
      addNotification('Agregado a favoritos', 'success')
      if (token) {
        try {
          await fetch(`${API_URL}/api/listas-deseos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ producto_id: producto.id })
          })
        } catch {}
      }
    }
  }

  const renderStars = (rating: number, size = 'text-sm') => (
    Array.from({ length: 5 }, (_, i) => (
      <i key={i} className={`fas fa-star ${size} ${i < Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`} />
    ))
  )

  const promedioResenas = resenas.length
    ? resenas.reduce((s, r) => s + r.calificacion, 0) / resenas.length
    : producto?.calificacion || 0

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-pulse">
            <div className="bg-gray-200 rounded-2xl aspect-square" />
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-20 bg-gray-200 rounded" />
              <div className="h-12 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!producto) return null

  const imagenes = [producto.imagen, ...(producto as any).imagenes_adicionales || []]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO meta via document title */}
      {typeof document !== 'undefined' && (document.title = `${producto.nombre} — EGOS Colombia`)}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Inicio</Link>
          <i className="fas fa-chevron-right text-[10px]" />
          <Link to="/catalog" className="hover:text-primary transition-colors">Catálogo</Link>
          <i className="fas fa-chevron-right text-[10px]" />
          <span className="text-gray-600 font-medium truncate max-w-[200px]">{producto.nombre}</span>
        </nav>

        {/* Producto principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">

          {/* Galería */}
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden bg-gray-50 aspect-square">
              <img
                src={imagenes[imagenActiva]}
                alt={producto.nombre}
                className="w-full h-full object-cover"
              />
              {!producto.en_stock && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="bg-white text-gray-800 font-bold px-4 py-2 rounded-full text-sm">Agotado</span>
                </div>
              )}
              {producto.es_eco && (
                <span className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  🌿 Eco
                </span>
              )}
            </div>
            {imagenes.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {imagenes.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImagenActiva(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      imagenActiva === i ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-4">
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-widest font-medium">{producto.categoria}</span>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 leading-tight">{producto.nombre}</h1>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">{renderStars(promedioResenas)}</div>
              <span className="text-sm text-gray-500">
                {promedioResenas.toFixed(1)} ({resenas.length} reseña{resenas.length !== 1 ? 's' : ''})
              </span>
            </div>

            {/* Precio */}
            <p className="text-3xl font-bold text-primary">{formatPrice(producto.precio)}</p>

            {/* Stock badge */}
            <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full w-fit ${
              producto.en_stock
                ? 'text-emerald-600 bg-emerald-50'
                : 'text-red-600 bg-red-50'
            }`}>
              <i className={`fas ${producto.en_stock ? 'fa-check-circle' : 'fa-times-circle'} text-xs`}></i>
              {producto.en_stock ? 'Disponible' : 'Agotado'}
            </span>

            {/* Descripción */}
            <p className="text-gray-600 text-sm leading-relaxed">{producto.descripcion}</p>

            {/* Tallas */}
            {producto.tallas && producto.tallas.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Talla: <span className="text-primary">{tallaSeleccionada}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {producto.tallas.map(talla => (
                    <button
                      key={talla}
                      onClick={() => setTallaSeleccionada(talla)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${
                        tallaSeleccionada === talla
                          ? 'border-primary bg-primary text-white'
                          : 'border-gray-200 text-gray-600 hover:border-primary'
                      }`}
                    >
                      {talla}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colores */}
            {producto.colores && producto.colores.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Color: <span className="text-primary">{colorSeleccionado}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {producto.colores.map(color => (
                    <button
                      key={color}
                      onClick={() => setColorSeleccionado(color)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${
                        colorSeleccionado === color
                          ? 'border-primary bg-gray-50 text-primary font-bold'
                          : 'border-gray-200 text-gray-600 hover:border-primary'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={manejarAgregarCarrito}
                disabled={agregando || !producto.en_stock}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all ${
                  !producto.en_stock
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : agregando
                    ? 'bg-emerald-500 text-white scale-95'
                    : 'bg-primary text-white hover:bg-secondary'
                }`}
              >
                <i className={`fas ${agregando ? 'fa-check' : 'fa-cart-plus'} text-xs`}></i>
                {!producto.en_stock ? 'Agotado' : agregando ? '¡Agregado!' : 'Agregar al carrito'}
              </button>

              <button
                onClick={manejarToggleFavorito}
                className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${
                  isFavorite(producto.id)
                    ? 'border-rose-500 bg-rose-50 text-rose-500'
                    : 'border-gray-200 text-gray-400 hover:border-rose-400 hover:text-rose-400'
                }`}
              >
                <i className={`${isFavorite(producto.id) ? 'fas' : 'far'} fa-heart`}></i>
              </button>

              <button
                onClick={() => navigate('/virtual-tryon', { state: { productUrl: producto.imagen } })}
                className="w-12 h-12 rounded-xl border-2 border-gray-200 text-gray-400 hover:border-primary hover:text-primary flex items-center justify-center transition-all"
                title="Probar en Avatar 3D"
              >
                <i className="fas fa-user-astronaut text-sm"></i>
              </button>
            </div>

            {/* Beneficios */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
              {[
                { icon: 'fa-truck', text: 'Envío gratis' },
                { icon: 'fa-undo', text: '30 días devolución' },
                { icon: 'fa-shield-alt', text: 'Compra segura' },
              ].map(b => (
                <div key={b.icon} className="flex flex-col items-center gap-1 text-center">
                  <i className={`fas ${b.icon} text-primary text-sm`}></i>
                  <span className="text-[11px] text-gray-500">{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reseñas */}
        <div className="mt-8 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Reseñas <span className="text-gray-400 font-normal text-base">({resenas.length})</span>
          </h2>

          {resenas.length === 0 ? (
            <p className="text-gray-400 text-sm">Aún no hay reseñas para este producto.</p>
          ) : (
            <div className="space-y-4">
              {resenas.map(resena => (
                <div key={resena.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-800">{resena.usuario_nombre}</span>
                      {resena.verificado && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">
                          ✓ Verificado
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(resena.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex gap-0.5 mb-1">{renderStars(resena.calificacion, 'text-xs')}</div>
                  <p className="text-sm text-gray-600">{resena.comentario}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Productos relacionados */}
        {productosRelacionados.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">También te puede gustar</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {productosRelacionados.map(rel => (
                <Link
                  key={rel.id}
                  to={`/producto/${rel.id}`}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow group"
                >
                  <div className="relative overflow-hidden" style={{ paddingBottom: '120%' }}>
                    <img
                      src={rel.imagen}
                      alt={rel.nombre}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{rel.categoria}</p>
                    <p className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1">{rel.nombre}</p>
                    <p className="text-sm font-bold text-primary">{formatPrice(rel.precio)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
