import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { api } from '@/services/api'
import { formatPrice } from '@/utils/sanitize'
import { Link } from 'react-router-dom'

interface ProductoPedido {
  id: string
  nombre?: string
  precio: number
  cantidad: number
  imagen?: string
  descripcion?: string
}

interface Pedido {
  id: string
  estado: string
  total: number
  fecha_creacion: string
  productos: ProductoPedido[]
}

export default function OrdersPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [cargando, setCargando] = useState(true)
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<string | null>(null)
  const [historial, setHistorial] = useState<any[]>([])
  const [productosDetalle, setProductosDetalle] = useState<Record<string, any>>({})
  const { token } = useAuthStore()

  useEffect(() => {
    cargarPedidos()
  }, [])

  const cargarPedidos = async () => {
    if (!token) return

    setCargando(true)
    try {
      const resultado = await api.obtenerPedidos(token)
      if (resultado.exito) {
        setPedidos(resultado.pedidos)
        // Cargar detalles de productos
        await cargarDetallesProductos(resultado.pedidos)
      }
    } catch (error) {
      console.error('Error cargando pedidos:', error)
    } finally {
      setCargando(false)
    }
  }

  const cargarDetallesProductos = async (pedidosList: Pedido[]) => {
    const productosIds = new Set<string>()
    
    // Recopilar todos los IDs de productos
    pedidosList.forEach(pedido => {
      pedido.productos?.forEach(producto => {
        productosIds.add(producto.id)
      })
    })

    // Cargar detalles de cada producto
    const detalles: Record<string, any> = {}
    for (const productoId of productosIds) {
      try {
        const response = await fetch(`http://localhost:3000/api/productos/${productoId}`)
        if (response.ok) {
          const data = await response.json()
          detalles[productoId] = data.producto
        }
      } catch (error) {
        console.error(`Error cargando producto ${productoId}:`, error)
      }
    }
    
    setProductosDetalle(detalles)
  }

  const verHistorial = async (pedidoId: string) => {
    if (!token) return

    try {
      const response = await fetch(`http://localhost:3000/api/pedidos/${pedidoId}/historial`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setHistorial(data.historial || [])
      setPedidoSeleccionado(pedidoId)
    } catch (error) {
      console.error('Error cargando historial:', error)
    }
  }

  const getEstadoColor = (estado: string) => {
    const colores: Record<string, string> = {
      'Creado': 'bg-blue-100 text-blue-800',
      'En preparación': 'bg-yellow-100 text-yellow-800',
      'Enviado': 'bg-purple-100 text-purple-800',
      'Entregado': 'bg-green-100 text-green-800',
      'Cancelado': 'bg-red-100 text-red-800'
    }
    return colores[estado] || 'bg-gray-100 text-gray-800'
  }

  const getEstadoIcono = (estado: string) => {
    const iconos: Record<string, string> = {
      'Creado': 'fa-file-alt',
      'En preparación': 'fa-box',
      'Enviado': 'fa-truck',
      'Entregado': 'fa-check-circle',
      'Cancelado': 'fa-times-circle'
    }
    return iconos[estado] || 'fa-circle'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-primary hover:text-secondary">
              <i className="fas fa-arrow-left mr-2"></i>
              Volver
            </Link>
            <h1 className="text-3xl font-bold text-primary">Mis Pedidos</h1>
          </div>
          <span className="text-sm text-gray-600">
            {pedidos.length} pedido(s)
          </span>
        </div>

        {cargando ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <i className="fas fa-shopping-bag text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No tienes pedidos aún</h3>
            <p className="text-gray-500 mb-6">¡Comienza a comprar ahora!</p>
            <Link to="/catalog" className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-secondary transition-colors">
              Ver Catálogo
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm text-gray-500">Pedido #{pedido.id.slice(0, 8)}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor(pedido.estado)}`}>
                        <i className={`fas ${getEstadoIcono(pedido.estado)} mr-1`}></i>
                        {pedido.estado}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(pedido.fecha_creacion).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{formatPrice(pedido.total)}</p>
                    <p className="text-sm text-gray-500">{pedido.productos?.length || 0} producto(s)</p>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex gap-4">
                    <button
                      onClick={() => setPedidoSeleccionado(pedidoSeleccionado === pedido.id ? null : pedido.id)}
                      className="text-primary hover:text-secondary font-semibold text-sm"
                    >
                      <i className={`fas fa-${pedidoSeleccionado === pedido.id ? 'chevron-up' : 'chevron-down'} mr-2`}></i>
                      {pedidoSeleccionado === pedido.id ? 'Ocultar' : 'Ver'} productos
                    </button>
                    <button
                      onClick={() => verHistorial(pedido.id)}
                      className="text-primary hover:text-secondary font-semibold text-sm"
                    >
                      <i className="fas fa-history mr-2"></i>
                      Ver seguimiento
                    </button>
                  </div>
                </div>

                {/* Mostrar productos del pedido */}
                {pedidoSeleccionado === pedido.id && pedido.productos && pedido.productos.length > 0 && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      <i className="fas fa-box mr-2"></i>
                      Productos del pedido ({pedido.productos.length})
                    </h4>
                    <div className="space-y-3">
                      {pedido.productos.map((producto: ProductoPedido, index: number) => {
                        const detalleProducto = productosDetalle[producto.id]
                        return (
                          <div key={index} className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {detalleProducto?.imagen ? (
                                <img 
                                  src={detalleProducto.imagen} 
                                  alt={detalleProducto.nombre}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <i className="fas fa-image text-gray-400"></i>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-800">
                                {detalleProducto?.nombre || `Producto #${producto.id.slice(0, 8)}`}
                              </h5>
                              {detalleProducto?.descripcion && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {detalleProducto.descripcion}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm text-gray-500">
                                  <i className="fas fa-shopping-cart mr-1"></i>
                                  Cantidad: {producto.cantidad}
                                </span>
                                {detalleProducto?.categoria && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    {detalleProducto.categoria}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary">
                                {formatPrice(producto.precio * producto.cantidad)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatPrice(producto.precio)} c/u
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* Resumen del pedido */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">Total del pedido:</span>
                        <span className="text-xl font-bold text-primary">{formatPrice(pedido.total)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {pedidoSeleccionado === pedido.id && historial.length > 0 && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Historial de seguimiento</h4>
                    <div className="space-y-3">
                      {historial.map((item, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <i className={`fas ${getEstadoIcono(item.estado_nuevo)} text-white text-xs`}></i>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {item.estado_anterior && (
                                <span className="text-sm text-gray-500">{item.estado_anterior}</span>
                              )}
                              <i className="fas fa-arrow-right text-xs text-gray-400"></i>
                              <span className="text-sm font-semibold text-gray-800">{item.estado_nuevo}</span>
                            </div>
                            {item.comentario && (
                              <p className="text-xs text-gray-600 mt-1">{item.comentario}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(item.fecha_cambio).toLocaleString('es-ES')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
