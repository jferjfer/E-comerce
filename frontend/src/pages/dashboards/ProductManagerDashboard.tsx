import React, { useState, useEffect, useRef } from 'react'
import { API_URL } from '@/config/api'
import { useAuthStore } from '@/store/useAuthStore'
import { formatPrice } from '@/utils/sanitize'

// ── EAN-13 para EGOS (uso interno) ──
// Prefijo Colombia 770 + 90517 (NIT 902051708) + 4 dígitos secuencial + dígito verificador
const EAN_PREFIX = '77090517'

function calcularDigitoVerificadorEAN13(doce: string): number {
  let suma = 0
  for (let i = 0; i < 12; i++) {
    suma += parseInt(doce[i]) * (i % 2 === 0 ? 1 : 3)
  }
  return (10 - (suma % 10)) % 10
}

function generarEAN13(secuencial: number): string {
  const seq = String(secuencial).padStart(4, '0')
  const doce = EAN_PREFIX + seq
  const dv = calcularDigitoVerificadorEAN13(doce)
  return doce + dv
}

// ── Tablas de codificación EAN-13 estándar ISO/IEC 15420 ──
const EAN_L = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011']
const EAN_G = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111']
const EAN_R = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100']
// Paridad del primer dígito determina qué tabla usar para los 6 dígitos izquierda
const EAN_PARIDAD = ['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL']

function codificarEAN13(codigo: string): string {
  if (codigo.length !== 13) return ''
  const d = codigo.split('').map(Number)
  const paridad = EAN_PARIDAD[d[0]]
  let bits = '101' // guarda izquierda
  for (let i = 0; i < 6; i++) {
    bits += paridad[i] === 'L' ? EAN_L[d[i + 1]] : EAN_G[d[i + 1]]
  }
  bits += '01010' // guarda central
  for (let i = 7; i < 13; i++) {
    bits += EAN_R[d[i]]
  }
  bits += '101' // guarda derecha
  return bits // 95 bits totales
}

// Ref único por instancia para capturar el canvas correcto
function BarcodeDisplay({ codigo, canvasRef }: { codigo: string, canvasRef: React.RefObject<HTMLCanvasElement> }) {

  useEffect(() => {
    if (!canvasRef.current || !codigo || codigo.length !== 13) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!

    const bits = codificarEAN13(codigo)
    if (!bits) return

    // Dimensiones proporcionales al estándar EAN-13
    const modulo = 2          // ancho de 1 módulo en px
    const totalBits = 95      // siempre 95 módulos en EAN-13
    const quietZone = 7 * modulo  // zona silenciosa a cada lado
    const barHeight = 70
    const guardHeight = barHeight + 8  // guardas más largas
    const numHeight = 14
    const W = quietZone * 2 + totalBits * modulo
    const H = guardHeight + numHeight + 4

    canvas.width = W
    canvas.height = H

    // Fondo blanco
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    // Dibujar barras
    const guardPositions = new Set([0,1,2, 45,46,47,48,49, 92,93,94]) // posiciones de guardas
    for (let i = 0; i < bits.length; i++) {
      if (bits[i] === '1') {
        ctx.fillStyle = '#000000'
        const x = quietZone + i * modulo
        const h = guardPositions.has(i) ? guardHeight : barHeight
        ctx.fillRect(x, 0, modulo, h)
      }
    }

    // Número debajo — formato estándar EAN-13
    // Primer dígito a la izquierda de la guarda izquierda
    // Dígitos 2-7 centrados bajo la mitad izquierda
    // Dígitos 8-13 centrados bajo la mitad derecha
    ctx.fillStyle = '#000000'
    ctx.font = `bold ${numHeight - 2}px monospace`
    ctx.textBaseline = 'top'
    const y = guardHeight + 2

    // Dígito 1 — izquierda de la guarda
    ctx.textAlign = 'center'
    ctx.fillText(codigo[0], quietZone / 2, y)

    // Dígitos 2-7 — mitad izquierda (bits 3 a 44, centro = bit 23.5)
    const centroIzq = quietZone + (3 + 44) / 2 * modulo
    ctx.textAlign = 'center'
    ctx.fillText(codigo.slice(1, 7), centroIzq, y)

    // Dígitos 8-13 — mitad derecha (bits 50 a 91, centro = bit 70.5)
    const centroDer = quietZone + (50 + 91) / 2 * modulo
    ctx.fillText(codigo.slice(7, 13), centroDer, y)

  }, [codigo, canvasRef])

  return (
    <div style={{ background: '#fff', padding: '8px', borderRadius: 6, display: 'inline-block' }}>
      <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%' }} />
    </div>
  )
}

// SKUs de fallback para productos hardcodeados sin SKU
const SKU_FALLBACK: Record<string, string> = {
  '1': '7709051700011', '2': '7709051700029', '3': '7709051700037',
  '4': '7709051700045', '5': '7709051700052', '6': '7709051700060',
  '7': '7709051700078', '8': '7709051700086',
}

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
  proveedor_id: string
  referencia_proveedor: string
}

const FORM_INICIAL: FormProducto = {
  nombre: '', sku: generarEAN13(1), marca: 'EGOS', material: '',
  costo_adquisicion: '', costo_envio: String(COSTO_ENVIO),
  costo_empaque: String(COSTO_EMPAQUE), precio_manual: '', usar_precio_manual: false,
  categoria: 'Vestidos', descripcion: '', tallas: ['S','M','L'],
  colores: ['Negro'], en_stock: true, stock_cantidad: '', imagen_url: '',
  proveedor_id: '', referencia_proveedor: ''
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
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null)
  const [proveedores, setProveedores] = useState<{id: string, codigo: string, nombre: string}[]>([])
  const [tab, setTab] = useState<'productos' | 'categorias'>('productos')
  const [categoriasList, setCategoriasList] = useState<any[]>([])
  const [cargandoCats, setCargandoCats] = useState(false)
  const [showFormCat, setShowFormCat] = useState(false)
  const [editandoCat, setEditandoCat] = useState<any>(null)
  const [formCat, setFormCat] = useState({ nombre: '', descripcion: '', imagen: '' })
  const [guardandoCat, setGuardandoCat] = useState(false)
  const [mensajeCat, setMensajeCat] = useState<{tipo: string, texto: string} | null>(null)

  useEffect(() => { cargarProductos(); cargarProveedores(); cargarCategorias() }, [])

  const cargarCategorias = async () => {
    setCargandoCats(true)
    try {
      const r = await fetch(`${API_URL}/api/categorias`)
      const d = await r.json()
      const cats = d.categorias || []
      setCategoriasList(cats)
      const nombres = cats.map((c: any) => c.nombre).filter(Boolean)
      if (nombres.length > 0) setCategorias(nombres)
    } catch {}
    finally { setCargandoCats(false) }
  }

  const guardarCategoria = async () => {
    if (!formCat.nombre.trim()) {
      setMensajeCat({ tipo: 'error', texto: 'El nombre es obligatorio' })
      return
    }
    setGuardandoCat(true)
    setMensajeCat(null)
    try {
      const url = editandoCat
        ? `${API_URL}/api/categorias/${editandoCat.id}`
        : `${API_URL}/api/categorias`
      const method = editandoCat ? 'PUT' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formCat)
      })
      const d = await r.json()
      if (r.ok) {
        setMensajeCat({ tipo: 'success', texto: editandoCat ? '✅ Categoría actualizada' : '✅ Categoría creada' })
        setShowFormCat(false)
        setEditandoCat(null)
        setFormCat({ nombre: '', descripcion: '', imagen: '' })
        cargarCategorias()
      } else {
        setMensajeCat({ tipo: 'error', texto: d.detail || d.error || 'Error guardando categoría' })
      }
    } catch { setMensajeCat({ tipo: 'error', texto: 'Error de conexión' }) }
    finally { setGuardandoCat(false) }
  }

  const eliminarCategoria = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar la categoría "${nombre}"?`)) return
    try {
      const r = await fetch(`${API_URL}/api/categorias/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (r.ok) cargarCategorias()
      else alert('Error al eliminar')
    } catch { alert('Error de conexión') }
  }

  const cargarProveedores = async () => {
    try {
      const r = await fetch(`${API_URL}/api/contabilidad/proveedores?activo=true`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const d = await r.json()
      setProveedores(d.proveedores || [])
    } catch {}
  }

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

  // Genera un secuencial único basado en los SKUs existentes para evitar duplicados
  const generarSkuUnico = (): string => {
    const skusExistentes = new Set(
      productos.map(p => (p as any).sku).filter(Boolean)
    )
    let seq = productos.length + 1
    let candidato = generarEAN13(seq)
    // Si ya existe, incrementar hasta encontrar uno libre
    while (skusExistentes.has(candidato)) {
      seq++
      candidato = generarEAN13(seq)
    }
    return candidato
  }

  const abrirCrear = () => {
    setEditando(null)
    const nuevoSku = generarSkuUnico()
    setForm({ ...FORM_INICIAL, sku: nuevoSku })
    setMensaje(null)
    setMostrarForm(true)
  }

  const abrirEditar = (p: Producto) => {
    setEditando(p)
    // Si el producto no tiene SKU (ej: hardcodeado), asignar uno del fallback o generar uno
    const skuExistente = (p as any).sku || SKU_FALLBACK[p.id] || generarSkuUnico()
    setForm({
      nombre: p.nombre,
      sku: skuExistente,
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
      imagen_url: p.imagen || '',
      proveedor_id: (p as any).proveedor_id || '',
      referencia_proveedor: (p as any).referencia_proveedor || ''
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
      calificacion: editando?.calificacion || 4.5,
      proveedor_id: form.proveedor_id || undefined,
      referencia_proveedor: form.referencia_proveedor || undefined
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
    const sku = (p as any).sku || SKU_FALLBACK[p.id] || ''
    const matchBuscar =
      p.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
      sku.includes(buscar)  // búsqueda por SKU con lector de barras
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

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setTab('productos')}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'productos' ? 'border-amber-600 text-amber-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            <i className="fas fa-box mr-2"></i>Productos
            <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{productos.length}</span>
          </button>
          <button
            onClick={() => { setTab('categorias'); cargarCategorias() }}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'categorias' ? 'border-amber-600 text-amber-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            <i className="fas fa-tags mr-2"></i>Categorías
            <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{categoriasList.length}</span>
          </button>
        </div>

        {/* ── TAB PRODUCTOS ── */}
        {tab === 'productos' && (
          <>
            {/* Filtros */}
            <div className="flex gap-3 mb-6 flex-wrap">
          <input
            type="text" placeholder="🔍 Buscar por nombre o escanear código de barras..."
            value={buscar} onChange={e => { setBuscar(e.target.value); setPagina(1) }}
            className="border rounded-xl px-4 py-2 text-sm flex-1 min-w-[200px]"
          />
          <select value={filtroCategoria} onChange={e => { setFiltroCategoria(e.target.value); setPagina(1) }}
            className="border rounded-xl px-4 py-2 text-sm">
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
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
                    {((p as any).sku || SKU_FALLBACK[p.id]) && (
                      <p className="text-[10px] text-gray-400 font-mono truncate">
                        {(p as any).sku || SKU_FALLBACK[p.id]}
                      </p>
                    )}
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

        {/* ── TAB CATEGORÍAS ── */}
        {tab === 'categorias' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{categoriasList.length} categorías registradas</p>
              <button
                onClick={() => { setShowFormCat(true); setEditandoCat(null); setFormCat({ nombre: '', descripcion: '', imagen: '' }); setMensajeCat(null) }}
                className="bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-700 flex items-center gap-2">
                <i className="fas fa-plus"></i> Nueva Categoría
              </button>
            </div>

            {mensajeCat && (
              <div className={`p-3 rounded-xl text-sm ${mensajeCat.tipo === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {mensajeCat.texto}
              </div>
            )}

            {/* Formulario crear/editar */}
            {showFormCat && (
              <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
                <h3 className="font-bold text-gray-800">
                  {editandoCat ? '✏️ Editar Categoría' : '➕ Nueva Categoría'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Nombre *</label>
                    <input
                      value={formCat.nombre}
                      onChange={e => setFormCat({ ...formCat, nombre: e.target.value })}
                      placeholder="Ej: Vestidos"
                      className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Descripción</label>
                    <input
                      value={formCat.descripcion}
                      onChange={e => setFormCat({ ...formCat, descripcion: e.target.value })}
                      placeholder="Ej: Vestidos para toda ocasión"
                      className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">URL de imagen (opcional)</label>
                    <input
                      value={formCat.imagen}
                      onChange={e => setFormCat({ ...formCat, imagen: e.target.value })}
                      placeholder="https://..."
                      className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={guardarCategoria}
                    disabled={guardandoCat}
                    className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 disabled:opacity-50"
                    style={{ color: '#c5a47e' }}>
                    {guardandoCat ? 'Guardando...' : editandoCat ? 'Actualizar' : 'Crear Categoría'}
                  </button>
                  <button
                    onClick={() => { setShowFormCat(false); setEditandoCat(null); setMensajeCat(null) }}
                    className="border border-gray-300 text-gray-600 px-6 py-2.5 rounded-xl text-sm hover:bg-gray-50">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Lista de categorías */}
            {cargandoCats ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categoriasList.map((cat: any) => (
                  <div key={cat.id} className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    {cat.imagen ? (
                      <img src={cat.imagen} alt={cat.nombre} className="w-full h-32 object-cover" />
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
                        <i className="fas fa-tags text-3xl text-amber-300"></i>
                      </div>
                    )}
                    <div className="p-3">
                      <p className="font-semibold text-gray-800 text-sm">{cat.nombre}</p>
                      {cat.descripcion && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{cat.descripcion}</p>
                      )}
                      <p className="text-xs text-gray-300 font-mono mt-1">ID: {cat.id}</p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => {
                            setEditandoCat(cat)
                            setFormCat({ nombre: cat.nombre, descripcion: cat.descripcion || '', imagen: cat.imagen || '' })
                            setShowFormCat(true)
                            setMensajeCat(null)
                          }}
                          className="flex-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 py-1.5 rounded-lg font-medium">
                          <i className="fas fa-edit mr-1"></i>Editar
                        </button>
                        <button
                          onClick={() => eliminarCategoria(cat.id, cat.nombre)}
                          className="flex-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 py-1.5 rounded-lg font-medium">
                          <i className="fas fa-trash mr-1"></i>Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {categoriasList.length === 0 && (
                  <div className="col-span-4 text-center py-16 text-gray-400">
                    <i className="fas fa-tags text-4xl mb-3"></i>
                    <p>No hay categorías. Crea la primera.</p>
                  </div>
                )}
              </div>
            )}
          </div>
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

              {/* Nombre + Marca */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Nombre del producto *</label>
                  <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                    placeholder="Ej: Vestido Midi Floral"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Marca</label>
                  <input value={form.marca} onChange={e => setForm({...form, marca: e.target.value})}
                    placeholder="EGOS"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>

              {/* Proveedor + Referencia interna del proveedor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Proveedor</label>
                  <select
                    value={form.proveedor_id}
                    onChange={e => setForm({...form, proveedor_id: e.target.value})}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                  >
                    <option value="">— Sin proveedor —</option>
                    {proveedores.map(p => (
                      <option key={p.id} value={p.id}>{p.codigo} — {p.nombre}</option>
                    ))}
                  </select>
                  {proveedores.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">⚠️ No hay proveedores. El Contador debe crearlos en Contabilidad → Proveedores.</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Referencia del proveedor</label>
                  <input
                    value={form.referencia_proveedor}
                    onChange={e => setForm({...form, referencia_proveedor: e.target.value})}
                    placeholder="Ej: REF-2024-001"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">Código que el proveedor le asigna a este producto en su catálogo</p>
                </div>
              </div>

              {/* SKU / EAN-13 — solo lectura, generado automáticamente */}
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                <p className="text-xs font-bold mb-3" style={{color:'#c5a47e'}}>🏷️ Código de Barras EAN-13 (generado automáticamente)</p>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="flex-1">
                    <label className="text-xs text-gray-400 mb-1 block">SKU / EAN-13</label>
                    <div className="flex items-center gap-2">
                      <input
                        value={form.sku}
                        readOnly
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm font-mono text-white cursor-not-allowed"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(form.sku)
                        }}
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 text-xs"
                        title="Copiar"
                      >
                        <i className="fas fa-copy"></i>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Prefijo Colombia 770 · NIT EGOS · Secuencial · Dígito verificador</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 flex-shrink-0 flex items-center justify-center" style={{minWidth: 220}}>
                    <BarcodeDisplay codigo={form.sku} canvasRef={barcodeCanvasRef} />
                  </div>
                </div>
                {/* Botón imprimir etiqueta */}
                <button
                  type="button"
                  onClick={() => {
                    const win = window.open('', '_blank', 'width=400,height=300')
                    if (!win) return
                    // Usar el ref específico del canvas de este formulario
                    const imgSrc = barcodeCanvasRef.current
                      ? barcodeCanvasRef.current.toDataURL('image/png')
                      : ''
                    win.document.write(`
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <meta charset="UTF-8">
                        <title>Etiqueta EGOS</title>
                        <style>
                          * { margin: 0; padding: 0; box-sizing: border-box; }
                          body {
                            font-family: 'Helvetica Neue', Arial, sans-serif;
                            background: #fff;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                          }
                          .etiqueta {
                            width: 320px;
                            border: 1.5px solid #111;
                            border-radius: 8px;
                            overflow: hidden;
                          }
                          .header {
                            background: #111827;
                            padding: 12px 16px;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                          }
                          .logo-row {
                            display: none;
                          }
                          .logo-e {
                            color: #c5a47e;
                            font-size: 32px;
                            font-weight: 900;
                            line-height: 1;
                            text-align: center;
                            margin-bottom: 2px;
                          }
                          .logo-gos {
                            color: #ffffff;
                            font-size: 18px;
                            font-weight: 900;
                            letter-spacing: 8px;
                            line-height: 1;
                            text-align: center;
                          }
                          .slogan {
                            color: rgba(197,164,126,0.7);
                            font-size: 7px;
                            letter-spacing: 3px;
                            text-transform: uppercase;
                            margin-top: 4px;
                            text-align: center;
                          }
                          .body {
                            padding: 14px 16px 10px;
                            background: #fff;
                          }
                          .nombre {
                            font-size: 12px;
                            font-weight: 700;
                            color: #111;
                            text-align: center;
                            margin-bottom: 12px;
                            text-transform: uppercase;
                            letter-spacing: 0.8px;
                          }
                          .barcode-wrap {
                            display: flex;
                            justify-content: center;
                            margin-bottom: 0;
                          }
                          .barcode-wrap img {
                            width: 260px;
                            height: auto;
                            display: block;
                          }
                          .footer {
                            border-top: 1px solid #eee;
                            padding: 7px 16px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                          }
                          .categoria {
                            font-size: 9px;
                            color: #888;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                          }
                          .hecho {
                            font-size: 9px;
                            color: #888;
                          }
                          @media print {
                            body { margin: 0; min-height: unset; }
                            .etiqueta { border: 1.5px solid #111; }
                          }
                        </style>
                      </head>
                      <body>
                        <div class="etiqueta">
                          <div class="header">
                            <div class="logo-e">E</div>
                            <div class="logo-gos">EGOS</div>
                            <div class="slogan">Wear Your Truth</div>
                          </div>
                          <div class="body">
                            <div class="nombre">${form.nombre || 'Producto EGOS'}</div>
                            <div class="barcode-wrap">
                              <img src="${imgSrc}" alt="codigo de barras" />
                            </div>
                          </div>
                          <div class="footer">
                            <span class="categoria">${form.categoria}</span>
                            <span class="hecho">Hecho en Colombia \uD83C\uDDE8\uD83C\uDDF4</span>
                          </div>
                        </div>
                        <script>window.onload = () => { window.print(); }<\/script>
                      </body>
                      </html>
                    `)
                    win.document.close()
                  }}
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-white border border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <i className="fas fa-print"></i>
                  Imprimir Etiqueta
                </button>
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
                    {categorias.map(c => <option key={c} value={c}>{c}</option>)}
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
