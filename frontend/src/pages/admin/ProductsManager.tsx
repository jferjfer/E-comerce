import { useState, useEffect } from 'react'
import { api } from '@/services/api'
import { Producto } from '@/types'
import { formatPrice } from '@/utils/sanitize'
import RoleGuard from '@/components/auth/RoleGuard'
import { useNotificationStore } from '@/store/useNotificationStore'
import { API_URL } from '@/config/api'

export default function ProductsManager() {
  const [products, setProducts] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(true)
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null)
  const [formEdicion, setFormEdicion] = useState<any>({})
  const [tallasEdicion, setTallasEdicion] = useState<string[]>([])
  const [coloresEdicion, setColoresEdicion] = useState<string[]>([])
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)
  const addNotification = useNotificationStore(state => state.addNotification)

  useEffect(() => {
    api.obtenerProductos().then(({ productos }) => {
      setProducts(productos)
      setCargando(false)
    }).catch(() => setCargando(false))
  }, [])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  const itemsPerPage = 10
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || product.categoria === selectedCategory
    return matchesSearch && matchesCategory
  })
  
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage)
  
  const categories = [...new Set(products.map(p => p.categoria))]

  const abrirEdicion = (producto: Producto) => {
    setProductoEditando(producto)
    setFormEdicion({
      nombre: producto.nombre,
      precio: String(producto.precio),
      descripcion: producto.descripcion,
      categoria: producto.categoria,
      imagen: producto.imagen,
      en_stock: producto.en_stock,
      material: (producto as any).material || '',
      marca: (producto as any).marca || 'EGOS',
      sku: (producto as any).sku || '',
      descuento: String((producto as any).descuento || '0'),
      stock_cantidad: String((producto as any).stock || ''),
    })
    setTallasEdicion(producto.tallas || [])
    setColoresEdicion(producto.colores || [])
  }

  const guardarEdicion = async () => {
    if (!productoEditando) return
    if (!formEdicion.nombre || !formEdicion.precio || !formEdicion.descripcion) {
      addNotification('Nombre, precio y descripción son obligatorios', 'error')
      return
    }
    setGuardandoEdicion(true)
    try {
      const resultado = await api.actualizarProducto(productoEditando.id, {
        ...formEdicion,
        precio: parseFloat(formEdicion.precio),
        stock: parseInt(formEdicion.stock_cantidad) || 0,
        descuento: parseFloat(formEdicion.descuento) || 0,
        tallas: tallasEdicion,
        colores: coloresEdicion,
      })
      if (resultado.exito) {
        addNotification('Producto actualizado exitosamente', 'success')
        setProductoEditando(null)
        const { productos } = await api.obtenerProductos()
        setProducts(productos)
      } else {
        addNotification(resultado.error || 'Error al actualizar', 'error')
      }
    } catch {
      addNotification('Error de conexión', 'error')
    } finally {
      setGuardandoEdicion(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
            <p className="text-gray-600">Administra el catálogo de productos ({products.length} total)</p>
          </div>
          
          <RoleGuard requiredPermissions={['products:create']}>
            <a
              href="/products/crear"
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-secondary transition-colors inline-flex items-center"
            >
              <i className="fas fa-plus mr-2"></i>
              Crear Producto
            </a>
          </RoleGuard>
        </div>
        
        {/* Filtros */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar productos
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nombre del producto..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                <option value="">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('')
                  setCurrentPage(1)
                }}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
        
        {/* Tabla de Productos */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {cargando ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img 
                          src={product.imagen} 
                          alt={product.nombre}
                          className="w-12 h-12 object-cover rounded-lg mr-4"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {product.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {product.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(product.precio)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        product.en_stock 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.en_stock ? 'En Stock' : 'Agotado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Activo
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <RoleGuard requiredPermissions={['products:update']}>
                        <button
                          onClick={() => abrirEdicion(product)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Editar producto"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                      </RoleGuard>
                      
                      <RoleGuard requiredPermissions={['products:delete']}>
                        <button className="text-red-600 hover:text-red-900">
                          <i className="fas fa-trash"></i>
                        </button>
                      </RoleGuard>
                      
                      <button className="text-gray-600 hover:text-gray-900">
                        <i className="fas fa-eye"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Paginación */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
            
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                  <span className="font-medium">
                    {Math.min(startIndex + itemsPerPage, filteredProducts.length)}
                  </span>{' '}
                  de <span className="font-medium">{filteredProducts.length}</span> productos
                </p>
              </div>
              
              <div className="flex space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === page
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL EDICIÓN ── */}
      {productoEditando && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">Editar: {productoEditando.nombre}</h2>
              <button onClick={() => setProductoEditando(null)} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nombre *</label>
                <input value={formEdicion.nombre} onChange={e => setFormEdicion({...formEdicion, nombre: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">SKU</label>
                <input value={formEdicion.sku} onChange={e => setFormEdicion({...formEdicion, sku: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Marca</label>
                <input value={formEdicion.marca} onChange={e => setFormEdicion({...formEdicion, marca: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Precio (COP) *</label>
                <input type="number" value={formEdicion.precio} onChange={e => setFormEdicion({...formEdicion, precio: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Descuento (%)</label>
                <input type="number" min="0" max="100" value={formEdicion.descuento} onChange={e => setFormEdicion({...formEdicion, descuento: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Stock</label>
                <input type="number" value={formEdicion.stock_cantidad} onChange={e => setFormEdicion({...formEdicion, stock_cantidad: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Categoría</label>
                <select value={formEdicion.categoria} onChange={e => setFormEdicion({...formEdicion, categoria: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  {['Vestidos','Camisas','Pantalones','Blazers','Faldas','Calzado','Accesorios','Ropa Interior','Deportiva','Formal'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Material</label>
                <input value={formEdicion.material} onChange={e => setFormEdicion({...formEdicion, material: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input type="checkbox" id="en_stock_pm" checked={formEdicion.en_stock}
                  onChange={e => setFormEdicion({...formEdicion, en_stock: e.target.checked})} />
                <label htmlFor="en_stock_pm" className="text-sm text-gray-700">En Stock</label>
              </div>

              <div className="md:col-span-3">
                <label className="text-xs text-gray-500 mb-1 block">URL de Imagen</label>
                <div className="flex gap-3 items-center">
                  <input value={formEdicion.imagen} onChange={e => setFormEdicion({...formEdicion, imagen: e.target.value})}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="https://..." />
                  {formEdicion.imagen && (
                    <img src={formEdicion.imagen} alt="preview" className="w-12 h-12 object-cover rounded-lg border" />
                  )}
                </div>
                <input type="file" accept="image/*" className="mt-2 text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-gray-900 file:text-white cursor-pointer"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    if (file.size > 5 * 1024 * 1024) { addNotification('Máx 5MB', 'error'); return }
                    const formData = new FormData()
                    formData.append('imagen', file)
                    try {
                      const res = await fetch(`${API_URL}/api/productos/${productoEditando.id}/imagen`, { method: 'POST', body: formData })
                      const data = await res.json()
                      if (data.exito) { setFormEdicion((p: any) => ({...p, imagen: data.url})); addNotification('Imagen actualizada', 'success') }
                      else addNotification('Error subiendo imagen', 'error')
                    } catch { addNotification('Error de conexión', 'error') }
                  }} />
              </div>

              <div className="md:col-span-3">
                <label className="text-xs text-gray-500 mb-2 block">Tallas</label>
                <div className="flex flex-wrap gap-2">
                  {['XS','S','M','L','XL','XXL','28','30','32','34','36','38','39','40','41','42'].map(t => (
                    <label key={t} className="flex items-center gap-1 text-sm">
                      <input type="checkbox" checked={tallasEdicion.includes(t)}
                        onChange={e => setTallasEdicion(prev => e.target.checked ? [...prev, t] : prev.filter(x => x !== t))} />
                      {t}
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-3">
                <label className="text-xs text-gray-500 mb-2 block">Colores</label>
                <div className="flex flex-wrap gap-2">
                  {['Negro','Blanco','Azul','Rojo','Verde','Rosa','Amarillo','Morado','Gris','Beige','Marrón','Naranja'].map(c => (
                    <label key={c} className="flex items-center gap-1 text-sm">
                      <input type="checkbox" checked={coloresEdicion.includes(c)}
                        onChange={e => setColoresEdicion(prev => e.target.checked ? [...prev, c] : prev.filter(x => x !== c))} />
                      {c}
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-3">
                <label className="text-xs text-gray-500 mb-1 block">Descripción *</label>
                <textarea value={formEdicion.descripcion} onChange={e => setFormEdicion({...formEdicion, descripcion: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm h-20" />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button onClick={() => setProductoEditando(null)}
                className="border border-gray-300 text-gray-600 px-5 py-2 rounded-xl text-sm hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={guardarEdicion} disabled={guardandoEdicion}
                className="bg-gray-900 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-700 disabled:opacity-50">
                {guardandoEdicion ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}