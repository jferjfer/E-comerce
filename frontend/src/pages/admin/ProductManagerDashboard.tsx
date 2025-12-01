import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { api } from '@/services/api'

export default function ProductManagerDashboard() {
  const { usuario } = useAuthStore()
  const addNotification = useNotificationStore(state => state.addNotification)
  const [productos, setProductos] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    precio: '',
    descripcion: '',
    categoria: 'Vestidos',
    imagen: '',
    tallas: [],
    colores: [],
    stock_cantidad: '',
    sku: '',

    material: '',
    marca: '',
    descuento: '0',
    tags: '',
    en_stock: true
  })
  const [tallasSeleccionadas, setTallasSeleccionadas] = useState([])
  const [coloresSeleccionados, setColoresSeleccionados] = useState([])

  useEffect(() => {
    cargarProductos()
  }, [])

  const cargarProductos = async () => {
    try {
      const { productos } = await api.obtenerProductos()
      setProductos(productos)
    } catch (error) {
      console.error('Error cargando productos:', error)
    }
  }

  const crearProducto = async () => {
    // Validaciones
    if (!nuevoProducto.nombre || !nuevoProducto.precio || !nuevoProducto.descripcion || !nuevoProducto.imagen) {
      addNotification('Todos los campos obligatorios deben estar completos', 'error')
      return
    }
    if (tallasSeleccionadas.length === 0) {
      addNotification('Debe seleccionar al menos una talla', 'error')
      return
    }
    if (coloresSeleccionados.length === 0) {
      addNotification('Debe seleccionar al menos un color', 'error')
      return
    }

    try {
      const producto = {
        nombre: nuevoProducto.nombre,
        precio: parseFloat(nuevoProducto.precio) * 100, // Convertir a centavos
        descripcion: nuevoProducto.descripcion,
        imagen: nuevoProducto.imagen,
        sku: nuevoProducto.sku || `PROD-${Date.now()}`,
        categoria: nuevoProducto.categoria,
        marca: nuevoProducto.marca || 'Estilo y Moda',
        tallas: tallasSeleccionadas,
        colores: coloresSeleccionados,
        stock_cantidad: parseInt(nuevoProducto.stock_cantidad) || 0,
        descuento: parseFloat(nuevoProducto.descuento) || 0,
        material: nuevoProducto.material || 'Algodón',
        tags: nuevoProducto.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        calificacion: 5,
        en_stock: true,
        activo: true,
        es_eco: false,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date(),
        compatibilidad: 95
      }
      
      // Guardar en base de datos
      const resultado = await api.crearProducto(producto)
      
      if (resultado.exito) {
        // Recargar productos desde BD
        await cargarProductos()
        
        // Reset form
        setShowCreateForm(false)
        setNuevoProducto({
          nombre: '', precio: '', descripcion: '', categoria: 'Vestidos', imagen: '',
          tallas: [], colores: [], stock_cantidad: '', sku: '', material: '',
          marca: '', descuento: '0', tags: '', en_stock: true
        })
        setTallasSeleccionadas([])
        setColoresSeleccionados([])
        
        addNotification('Producto creado y guardado en la base de datos', 'success')
      } else {
        addNotification(resultado.error || 'Error al crear el producto', 'error')
      }
    } catch (error) {
      console.error('Error creando producto:', error)
      addNotification('Error de conexión al crear el producto', 'error')
    }
  }

  const eliminarProducto = (id: string) => {
    setProductos(prev => prev.filter(p => p.id !== id))
    addNotification('Producto eliminado', 'info')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                📦 Gestión de Productos
              </h1>
              <p className="text-gray-600 mt-1">Bienvenido, {usuario?.nombre}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                🏷️ {usuario?.rol === 'product_manager' ? 'Product Manager' : 'Gestor de Productos'}
              </span>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-secondary transition-colors flex items-center"
            >
              <i className="fas fa-plus mr-2"></i>
              Crear Producto
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <i className="fas fa-box text-blue-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Productos</p>
                <p className="text-2xl font-bold text-gray-900">{productos.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <i className="fas fa-check-circle text-green-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">En Stock</p>
                <p className="text-2xl font-bold text-gray-900">{productos.filter(p => p.en_stock).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <i className="fas fa-tags text-yellow-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Categorías</p>
                <p className="text-2xl font-bold text-gray-900">5</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <i className="fas fa-star text-purple-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Promedio Rating</p>
                <p className="text-2xl font-bold text-gray-900">4.8</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario Crear Producto */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Crear Nuevo Producto</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Información Básica */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  value={nuevoProducto.nombre}
                  onChange={(e) => setNuevoProducto(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Ej: Vestido Elegante de Verano"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU/Código</label>
                <input
                  type="text"
                  value={nuevoProducto.sku}
                  onChange={(e) => setNuevoProducto(prev => ({ ...prev, sku: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="VES-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                <input
                  type="text"
                  value={nuevoProducto.marca}
                  onChange={(e) => setNuevoProducto(prev => ({ ...prev, marca: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Estilo y Moda"
                />
              </div>
              
              {/* Precios y Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio (COP) *</label>
                <input
                  type="number"
                  value={nuevoProducto.precio}
                  onChange={(e) => setNuevoProducto(prev => ({ ...prev, precio: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="89999"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descuento (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={nuevoProducto.descuento}
                  onChange={(e) => setNuevoProducto(prev => ({ ...prev, descuento: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Cantidad</label>
                <input
                  type="number"
                  value={nuevoProducto.stock_cantidad}
                  onChange={(e) => setNuevoProducto(prev => ({ ...prev, stock_cantidad: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="100"
                />
              </div>

              {/* Categoría y Características */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={nuevoProducto.categoria}
                  onChange={(e) => setNuevoProducto(prev => ({ ...prev, categoria: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="Vestidos">Vestidos</option>
                  <option value="Camisas">Camisas y Blusas</option>
                  <option value="Pantalones">Pantalones y Jeans</option>
                  <option value="Blazers">Blazers y Chaquetas</option>
                  <option value="Faldas">Faldas</option>
                  <option value="Calzado">Calzado</option>
                  <option value="Accesorios">Accesorios</option>
                  <option value="Ropa Interior">Ropa Interior</option>
                  <option value="Deportiva">Ropa Deportiva</option>
                  <option value="Formal">Ropa Formal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                <input
                  type="text"
                  value={nuevoProducto.material}
                  onChange={(e) => setNuevoProducto(prev => ({ ...prev, material: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Algodón, Poliéster, etc."
                />
              </div>


              {/* Imagen */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de Imagen *</label>
                <input
                  type="url"
                  value={nuevoProducto.imagen}
                  onChange={(e) => setNuevoProducto(prev => ({ ...prev, imagen: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  required
                />
              </div>

              {/* Tallas */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tallas Disponibles *</label>
                <div className="grid grid-cols-6 gap-2">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(talla => (
                    <label key={talla} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={tallasSeleccionadas.includes(talla)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTallasSeleccionadas(prev => [...prev, talla])
                          } else {
                            setTallasSeleccionadas(prev => prev.filter(t => t !== talla))
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{talla}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Colores */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Colores Disponibles *</label>
                <div className="grid grid-cols-4 gap-2">
                  {['Negro', 'Blanco', 'Azul', 'Rojo', 'Verde', 'Rosa', 'Amarillo', 'Morado', 'Gris', 'Beige', 'Marrón', 'Naranja'].map(color => (
                    <label key={color} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={coloresSeleccionados.includes(color)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setColoresSeleccionados(prev => [...prev, color])
                          } else {
                            setColoresSeleccionados(prev => prev.filter(c => c !== color))
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{color}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Descripción */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
                <textarea
                  value={nuevoProducto.descripcion}
                  onChange={(e) => setNuevoProducto(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20"
                  placeholder="Descripción detallada del producto..."
                  required
                />
              </div>

              {/* Tags */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (separados por comas)</label>
                <input
                  type="text"
                  value={nuevoProducto.tags}
                  onChange={(e) => setNuevoProducto(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="elegante, verano, casual, tendencia"
                />
              </div>
            </div>
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  console.log('🔄 CLICK EN CREAR PRODUCTO');
                  alert('Botón clickeado - revisa consola');
                  crearProducto();
                }}
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-secondary transition-colors"
              >
                Crear Producto
              </button>
            </div>
          </div>
        )}

        {/* Lista de Productos */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Productos Creados</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {productos.slice(0, 10).map((producto) => (
                  <tr key={producto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={producto.imagen}
                          alt={producto.nombre}
                          className="w-12 h-12 object-cover rounded-lg mr-3"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{producto.nombre}</div>
                          <div className="text-sm text-gray-500">ID: {producto.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{producto.categoria}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ${(producto.precio / 100).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        producto.en_stock 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {producto.en_stock ? 'En Stock' : 'Agotado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button className="text-blue-600 hover:text-blue-800">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        onClick={() => eliminarProducto(producto.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}