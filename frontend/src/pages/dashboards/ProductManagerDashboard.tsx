import { useState, useEffect } from 'react'
import { API_URL } from '@/config/api'
import { useAuthStore } from '@/store/useAuthStore'
import { formatPrice } from '@/utils/sanitize'

// ── Constantes de la fórmula PVP ──
const IVA           = 0.19
const COM_EPAYCO    = 0.0299 * 1.19   // 2.99% + IVA sobre comisión
const FIX_EPAYCO    = 900 * 1.19      // $900 + IVA
const COSTO_ENVIO   = 25000
const COSTO_EMPAQUE = 5000
const DENOMINADOR   = 1 - (IVA + COM_EPAYCO)

function calcularPVP(costoAdquisicion: number, costoEnvio = COSTO_ENVIO, costoEmpaque = COSTO_EMPAQUE): number {
  const Cp  = costoAdquisicion
  const U   = costoAdquisicion          // Utilidad = Cp
  const Gv  = costoEnvio + costoEmpaque
  const num = Cp + U + Gv + FIX_EPAYCO
  return Math.ceil(num / DENOMINADOR)
}

const CATEGORIAS = [
  'Vestidos','Blusas','Jeans','Blazers','Faldas','Conjuntos',
  'Camisas','Pantalones','Cardigans','Tops','Deportivo',
  'Sudaderas','Chaquetas','Monos','Shorts','Kimonos','Camisetas',
  'Formal','Accesorios','Bolsos','Calzado','Ropa Interior',
  'Pijamas','Maternidad','Tallas Grandes','Niños','Hombre'
]

const TALLAS_DEFAULT = ['XS','S','M','L','XL','XXL','28','30','32','34','36','38','39','40','41','42','43']
const COLORES_DEFAULT = [
  'Negro','Blanco','Gris','Azul','Rojo','Verde','Beige','Rosa',
  'Amarillo','Morado','Naranja','Café','Vino','Dorado','Plateado',
  'Azul Marino','Verde Militar','Terracota','Coral','Fucsia'
]

interface Producto {
  id: string
  nombre: string
  precio: number
  categoria: string
  descripcion: string
  imagen?: string
  en_stock: boolean
  tallas: string[]
  colores: string[]
  calificacion: number
  costo_adquisicion?: number
}

interface FormProducto {
  nombre: string
  sku: string
  marca: string
  material: string
  costo_adquisicion: string
  costo_envio: string
  costo_empaque: string
  precio_manual: string
  usar_precio_manual: boolean
  categoria: string
  descripcion: string
  tallas: string[]
  colores: string[]
  en_stock: boolean
  stock_cantidad: string
  imagen_url: string
}

const FORM_INICIAL: FormProducto = {
  nombre: '', sku: '', marca: 'EGOS', material: '',
  costo_adquisicion: '', costo_envio: String(COSTO_ENVIO),
  costo_empaque: String(COSTO_EMPAQUE), precio_manual: '', usar_precio_manual: false,
  categoria: 'Vestidos', descripcion: '', tallas: ['S','M','L'],
  colores: ['Negro'], en_stock: true, stock_cantidad: '', imagen_url: ''
}

export default function ProductManagerDashboard() {
  const { token } = useAuthStore()
  const [productos, setProductos] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(true)
  const [buscar, setBuscar] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState<Producto | null>(null)
  const [form, setForm] = useState<FormProducto>(FORM_INICIAL)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{tipo: string, texto: string} | null>(null)
  const [pagina, setPagina] = useState(1)
  const POR_PAGINA = 12

  useEffect(() => { cargarProductos() }, [])

  const cargarProductos = async () => {
    setCargando(true)
    try {
      const r = await fetch(`${API_URL}/api/productos?limite=200&todos=true`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const d = await r.json()
      setProductos(d.productos || [])
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  // PVP calculado en tiempo real
  const pvpPreview = form.costo_adquisicion
    ? calcularPVP(
        parseFloat(form.costo_adquisicion) || 0,
        parseFloat(form.costo_envio) || COSTO_ENVIO,
        parseFloat(form.costo_empaque) || COSTO_EMPAQUE
      )
    : 0

  const utilidadPreview = parseFloat(form.costo_adquisicion) || 0

  const abrirCrear = () => {
    setEditando(null)
    setForm(FORM_INICIAL)
    setMensaje(null)
    setMostrarForm(true)
  }

  const abrirEditar = (p: Producto) => {
    setEditando(p)
    setForm({
      nombre: p.nombre,
      sku: (p as any).sku || '',
      marca: (p as any).marca || 'EGOS',
      material: (p as any).material || '',
      costo_adquisicion: p.costo_adquisicion ? String(p.costo_adquisicion) : '',
      costo_envio: String(COSTO_ENVIO),
      costo_empaque: String(COSTO_EMPAQUE),
      precio_manual: String(p.precio),
      usar_precio_manual: !p.costo_adquisicion,
      categoria: p.categoria,
      descripcion: p.descripcion,
      tallas: p.tallas || [],
      colores: p.colores || [],
      en_stock: p.en_stock,
      stock_cantidad: String((p as any).stock || ''),
      imagen_url: p.imagen || ''
    })
    setMensaje(null)
    setMostrarForm(true)
  }

  const guardar = async () => {
    if (!form.nombre) {
      setMensaje({ tipo: 'error', texto: 'El nombre es obligatorio' })
      return
    }

    let precioFinal: number

    if (form.usar_precio_manual) {
      // Precio promocional manual
      precioFinal = parseFloat(form.precio_manual)
      if (!precioFinal || precioFinal <= 0) {
        setMensaje({ tipo: 'error', texto: 'Ingresa un precio promocional válido' })
        return
      }
    } else {
      // Precio calculado con fórmula PVP
      const costo = parseFloat(form.costo_adquisicion)
      if (!costo || costo <= 0) {
        setMensaje({ tipo: 'error', texto: 'El costo de adquisición es obligatorio' })
        return
      }
      precioFinal = calcularPVP(
        costo,
        parseFloat(form.costo_envio) || COSTO_ENVIO,
        parseFloat(form.costo_empaque) || COSTO_EMPAQUE
      )
    }

    setGuardando(true)
    setMensaje(null)

    const datos = {
      nombre: form.nombre,
      sku: form.sku,
      marca: form.marca,
      material: form.material,
      precio: precioFinal,
      costo_adquisicion: parseFloat(form.costo_adquisicion) || 0,
      precio_manual: form.usar_precio_manual,
      categoria: form.categoria,
      descripcion: form.descripcion,
      tallas: form.tallas,
      colores: form.colores,
      en_stock: form.en_stock,
      stock: parseInt(form.stock_cantidad) || 0,
      imagen: form.imagen_url || undefined,
      calificacion: editando?.calificacion || 4.5
    }

    try {
      const url = editando
        ? `${API_URL}/api/productos/${editando.id}`
        : `${API_URL}/api/productos`
      const method = editando ? 'PUT' : 'POST'

      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(datos)
      })
      const d = await r.json()

      if (r.ok && d.exito !== false) {
        setMensaje({ tipo: 'success', texto: editando ? '✅ Producto actualizado' : '✅ Producto creado' })
        cargarProductos()
        setTimeout(() => { setMostrarForm(false); setMensaje(null) }, 1500)
      } else {
        setMensaje({ tipo: 'error', texto: d.detail || d.error || 'Error guardando producto' })
      }
    } catch (e) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión' })
    } finally {
      setGuardando(false)
    }
  }

  const toggleStock = async (id: string, estadoActual: boolean) => {
    try {
      const r = await fetch(`${API_URL}/api/productos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ en_stock: !estadoActual })
      })
      if (r.ok) {
        setProductos(prev => prev.map(p => p.id === id ? { ...p, en_stock: !estadoActual } : p))
      }
    } catch {
      alert('Error de conexión')
    }
  }

  const eliminarProducto = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return
    try {
      const r = await fetch(`${API_URL}/api/productos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (r.ok) {
        setProductos(prev => prev.filter(p => p.id !== id))
      } else {
        alert('Error al eliminar el producto')
      }
    } catch {
      alert('Error de conexión')
    }
  }

  const toggleTalla = (t: string) => {
    setForm(f => ({
      ...f,
      tallas: f.tallas.includes(t) ? f.tallas.filter(x => x !== t) : [...f.tallas, t]
    }))
  }

  const toggleColor = (c: string) => {
    setForm(f => ({
      ...f,
      colores: f.colores.includes(c) ? f.colores.filter(x => x !== c) : [...f.colores, c]
    }))
  }

  const productosFiltrados = productos.filter(p => {
    const matchBuscar = p.nombre.toLowerCase().includes(buscar.toLowerCase())
    const matchCat = !filtroCategoria || p.categoria === filtroCategoria
    return matchBuscar && matchCat
  })

  const paginados = productosFiltrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
  const totalPaginas = Math.ceil(productosFiltrados.length / POR_PAGINA)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold" style={{color:'#c5a47e'}}>📦 Gestión de Productos</h1>
            <p className="text-xs text-gray-400">{productos.length} productos en catálogo</p>
          </div>
          <button onClick={abrirCrear}
            className="bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-700 flex items-center gap-2">
            <i className="fas fa-plus"></i> Nuevo Producto
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Filtros */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <input
            type="text" placeholder="🔍 Buscar producto..."
            value={buscar} onChange={e => { setBuscar(e.target.value); setPagina(1) }}
            className="border rounded-xl px-4 py-2 text-sm flex-1 min-w-[200px]"
          />
          <select value={filtroCategoria} onChange={e => { setFiltroCategoria(e.target.value); setPagina(1) }}
            className="border rounded-xl px-4 py-2 text-sm">
            <option value="">Todas las categorías</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="text-sm text-gray-500 self-center">{productosFiltrados.length} resultados</span>
        </div>

        {/* Grid productos */}
        {cargando ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
              {paginados.map(p => (
                <div key={p.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    {p.imagen
                      ? <img src={p.imagen} alt={p.nombre} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <i className="fas fa-image text-2xl"></i>
                        </div>
                    }
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold text-gray-800 truncate">{p.nombre}</p>
                    <p className="text-xs text-gray-400">{p.categoria}</p>
                    <p className="text-sm font-bold text-amber-700 mt-1">{formatPrice(p.precio)}</p>
                    {p.costo_adquisicion && (
                      <p className="text-xs text-gray-400">Costo: {formatPrice(p.costo_adquisicion)}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <button
                        onClick={() => toggleStock(p.id, p.en_stock)}
                        className={`text-xs px-1.5 py-0.5 rounded-full cursor-pointer transition-colors ${
                          p.en_stock
                            ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                            : 'bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700'
                        }`}
                        title={p.en_stock ? 'Click para desactivar' : 'Click para activar'}>
                        {p.en_stock ? 'Activo' : 'Inactivo'}
                      </button>
                      <div className="flex gap-2">
                        <button onClick={() => abrirEditar(p)}
                          className="text-xs text-blue-600 hover:text-blue-800" title="Editar">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button onClick={() => eliminarProducto(p.id, p.nombre)}
                          className="text-xs text-red-500 hover:text-red-700" title="Eliminar">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
                  className="px-3 py-1 text-sm rounded-lg border disabled:opacity-40 hover:bg-white">
                  <i className="fas fa-chevron-left"></i>
                </button>
                <span className="text-sm text-gray-600">Página {pagina} de {totalPaginas}</span>
                <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
                  className="px-3 py-1 text-sm rounded-lg border disabled:opacity-40 hover:bg-white">
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal crear/editar */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            {/* Header modal */}
            <div className="bg-gray-900 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center">
              <h2 className="font-bold text-lg" style={{color:'#c5a47e'}}>
                {editando ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
              </h2>
              <button onClick={() => setMostrarForm(false)} className="text-gray-400 hover:text-white">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Mensaje */}
              {mensaje && (
                <div className={`p-3 rounded-xl text-sm ${mensaje.tipo === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {mensaje.texto}
                </div>
              )}

              {/* Nombre + SKU + Marca */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Nombre del producto *</label>
                  <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                    placeholder="Ej: Vestido Midi Floral"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">SKU</label>
                  <input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})}
                    placeholder="Ej: VES-001"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Marca</label>
                  <input value={form.marca} onChange={e => setForm({...form, marca: e.target.value})}
                    placeholder="EGOS"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>

              {/* Costo adquisición + PVP calculado */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <p className="text-xs font-bold text-amber-800 mb-3">💰 Calculadora de Precio PVP</p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Costo adquisición *</label>
                    <input type="number" value={form.costo_adquisicion}
                      onChange={e => setForm({...form, costo_adquisicion: e.target.value})}
                      placeholder="40000"
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Costo envío</label>
                    <input type="number" value={form.costo_envio}
                      onChange={e => setForm({...form, costo_envio: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Costo empaque</label>
                    <input type="number" value={form.costo_empaque}
                      onChange={e => setForm({...form, costo_empaque: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                </div>

                {pvpPreview > 0 && (
                  <div className="bg-white rounded-xl p-3 border border-amber-300">
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                      <span>Costo prenda:</span><span className="text-right font-medium">{formatPrice(parseFloat(form.costo_adquisicion))}</span>
                      <span>Tu utilidad:</span><span className="text-right font-medium text-green-600">{formatPrice(utilidadPreview)}</span>
                      <span>Envío + empaque:</span><span className="text-right font-medium">{formatPrice((parseFloat(form.costo_envio)||0) + (parseFloat(form.costo_empaque)||0))}</span>
                      <span>Fix ePayco:</span><span className="text-right font-medium">{formatPrice(FIX_EPAYCO)}</span>
                      <span>IVA DIAN (19%):</span><span className="text-right font-medium">{formatPrice(pvpPreview * IVA)}</span>
                      <span>Comisión ePayco:</span><span className="text-right font-medium">{formatPrice(pvpPreview * COM_EPAYCO)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between items-center">
                      <span className="font-bold text-gray-800">PVP al cliente:</span>
                      <span className="text-xl font-bold text-amber-700">{formatPrice(pvpPreview)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle precio manual */}
              <div className={`rounded-xl p-4 border-2 transition-colors ${
                form.usar_precio_manual
                  ? 'bg-orange-50 border-orange-300'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold text-gray-800">🏷️ Precio Promocional</p>
                    <p className="text-xs text-gray-500">Activa para ofertas o descuentos especiales</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, usar_precio_manual: !f.usar_precio_manual }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      form.usar_precio_manual ? 'bg-orange-500' : 'bg-gray-300'
                    }`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      form.usar_precio_manual ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                {form.usar_precio_manual && (
                  <div>
                    <label className="text-xs text-orange-700 font-semibold mb-1 block">
                      ⚠️ Precio promocional (la fórmula PVP queda desactivada)
                    </label>
                    <input
                      type="number"
                      value={form.precio_manual}
                      onChange={e => setForm({...form, precio_manual: e.target.value})}
                      placeholder="Ej: 59900"
                      className="w-full border-2 border-orange-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 font-bold text-orange-700"
                    />
                    {form.precio_manual && pvpPreview > 0 && (
                      <p className="text-xs text-orange-600 mt-1">
                        Descuento vs PVP normal: {formatPrice(pvpPreview - parseFloat(form.precio_manual))} ({Math.round((1 - parseFloat(form.precio_manual)/pvpPreview)*100)}% off)
                      </p>
                    )}
                  </div>
                )}
              </div>
              {/* Categoría + Material + Stock */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Categoría *</label>
                  <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Material / Composición</label>
                  <input value={form.material} onChange={e => setForm({...form, material: e.target.value})}
                    placeholder="Ej: 95% algodón, 5% elastano"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Stock disponible</label>
                  <input type="number" value={form.stock_cantidad}
                    onChange={e => setForm({...form, stock_cantidad: e.target.value})}
                    placeholder="Ej: 50"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>

              {/* Imagen */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Imagen del producto</label>
                <div className="flex gap-3 items-start">
                  <div className="flex-1 space-y-2">
                    <input value={form.imagen_url} onChange={e => setForm({...form, imagen_url: e.target.value})}
                      placeholder="URL de imagen (https://...)"
                      className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                    <input type="file" accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        if (file.size > 5 * 1024 * 1024) { setMensaje({ tipo: 'error', texto: 'Máx 5MB' }); return }
                        const prodId = editando?.id || `temp_${Date.now()}`
                        const formData = new FormData()
                        formData.append('imagen', file)
                        try {
                          const r = await fetch(`${API_URL}/api/productos/${prodId}/imagen`, {
                            method: 'POST', body: formData
                          })
                          const d = await r.json()
                          if (d.exito) { setForm(f => ({...f, imagen_url: d.url})); setMensaje({ tipo: 'success', texto: '✅ Imagen subida' }) }
                          else setMensaje({ tipo: 'error', texto: 'Error subiendo imagen' })
                        } catch { setMensaje({ tipo: 'error', texto: 'Error de conexión' }) }
                      }}
                      className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-gray-900 file:text-white cursor-pointer" />
                    <p className="text-xs text-gray-400">Sube una imagen o pega una URL. Máx 5MB.</p>
                  </div>
                  {form.imagen_url && (
                    <img src={form.imagen_url} alt="preview"
                      className="w-20 h-20 object-cover rounded-xl border flex-shrink-0" />
                  )}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}
                  rows={2} placeholder="Describe el producto..."
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
              </div>

              {/* Tallas */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-2 block">Tallas disponibles</label>
                <div className="space-y-2">
                  <p className="text-xs text-gray-400">Ropa:</p>
                  <div className="flex flex-wrap gap-2">
                    {['XS','S','M','L','XL','XXL'].map(t => (
                      <button key={t} type="button" onClick={() => toggleTalla(t)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          form.tallas.includes(t) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
                        }`}>{t}</button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">Jeans / Pantalones:</p>
                  <div className="flex flex-wrap gap-2">
                    {['26','28','30','32','34','36'].map(t => (
                      <button key={t} type="button" onClick={() => toggleTalla(t)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          form.tallas.includes(t) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
                        }`}>{t}</button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">Calzado:</p>
                  <div className="flex flex-wrap gap-2">
                    {['35','36','37','38','39','40','41','42','43'].map(t => (
                      <button key={t} type="button" onClick={() => toggleTalla(t)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          form.tallas.includes(t) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
                        }`}>{t}</button>
                    ))}
                  </div>
                  {form.tallas.length > 0 && (
                    <p className="text-xs text-amber-700">Seleccionadas: {form.tallas.join(', ')}</p>
                  )}
                </div>
              </div>

              {/* Colores */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-2 block">Colores disponibles</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {COLORES_DEFAULT.map(c => (
                    <button key={c} type="button" onClick={() => toggleColor(c)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        form.colores.includes(c)
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
                      }`}>{c}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    placeholder="Agregar color personalizado..."
                    className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value.trim()
                        if (val && !form.colores.includes(val)) {
                          setForm(f => ({...f, colores: [...f.colores, val]}))
                          ;(e.target as HTMLInputElement).value = ''
                        }
                      }
                    }}
                  />
                  <span className="text-xs text-gray-400 self-center">Enter para agregar</span>
                </div>
                {form.colores.length > 0 && (
                  <p className="text-xs text-amber-700 mt-1">Seleccionados: {form.colores.join(', ')}</p>
                )}
              </div>

              {/* En stock */}
              <div className="flex items-center gap-3">
                <input type="checkbox" id="en_stock" checked={form.en_stock}
                  onChange={e => setForm({...form, en_stock: e.target.checked})}
                  className="w-4 h-4 accent-amber-600" />
                <label htmlFor="en_stock" className="text-sm text-gray-700">Producto activo y disponible</label>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <button onClick={guardar} disabled={guardando}
                  className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  style={{color:'#c5a47e'}}>
                  {guardando ? 'Guardando...' : editando ? 'Actualizar Producto' : 'Crear Producto'}
                </button>
                <button onClick={() => setMostrarForm(false)}
                  className="px-6 border border-gray-300 text-gray-600 py-3 rounded-xl hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
