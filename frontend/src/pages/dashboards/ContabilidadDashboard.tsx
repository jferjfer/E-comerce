import { useState, useEffect } from 'react'
import { API_URL } from '@/config/api'
import { useAuthStore } from '@/store/useAuthStore'
import { formatPrice } from '@/utils/sanitize'

interface DashboardData {
  empresa: any
  periodo_actual: string
  resumen: {
    ventas_mes: number
    ventas_mes_anterior: number
    variacion_ventas: number
    devoluciones_mes: number
    ventas_netas: number
    iva_por_pagar: number
    cuentas_por_cobrar: number
    efectivo_disponible: number
    total_asientos_mes: number
  }
  obligaciones_fiscales: {
    iva_bimestre: { bimestre: number; iva_a_pagar: number; base_gravable: number }
    anticipo_simple: { bimestre: number; valor: number; ingresos_brutos: number }
  }
  ventas_historico: { periodo: string; ventas: number }[]
}

export default function ContabilidadDashboard() {
  const { token } = useAuthStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [cargando, setCargando] = useState(true)
  const [tab, setTab] = useState<'dashboard' | 'compras' | 'diario' | 'mayor' | 'balance' | 'resultados' | 'iva' | 'simple' | 'capital'>('dashboard')
  const [libroDiario, setLibroDiario] = useState<any[]>([])
  const [libroMayor, setLibroMayor] = useState<any[]>([])
  const [balance, setBalance] = useState<any>(null)
  const [resultados, setResultados] = useState<any>(null)
  const [ivaData, setIvaData] = useState<any>(null)
  const [simpleData, setSimpleData] = useState<any>(null)
  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7))

  // Estado formulario compra
  const [showFormCompra, setShowFormCompra] = useState(false)
  const [compras, setCompras] = useState<any[]>([])
  const [resumenCompras, setResumenCompras] = useState<any>(null)
  const [formCompra, setFormCompra] = useState({
    proveedor_nombre: '', proveedor_nit: '', descripcion: '',
    subtotal: '', iva: '0', tipo_compra: 'Mercancia',
    forma_pago: 'Contado', tipo_factura: 'Talonario',
    numero_factura: '', plazo_dias: '0'
  })
  const [guardandoCompra, setGuardandoCompra] = useState(false)
  const [mensajeCompra, setMensajeCompra] = useState<{tipo: string, texto: string} | null>(null)
  const [capitalMonto, setCapitalMonto] = useState('')
  const [capitalDesc, setCapitalDesc] = useState('Capital inicial VERTEL & CATILLO S.A.S')
  const [guardandoCapital, setGuardandoCapital] = useState(false)
  const [mensajeCapital, setMensajeCapital] = useState<{tipo: string, texto: string} | null>(null)

  const anio = new Date().getFullYear()
  const bimestre = Math.ceil(new Date().getMonth() / 2) + (new Date().getMonth() % 2 === 0 ? 0 : 0)
  const bimestreActual = Math.floor(new Date().getMonth() / 2) + 1

  useEffect(() => {
    cargarDashboard()
  }, [])

  useEffect(() => {
    if (tab === 'capital') return
    if (tab === 'diario') cargarLibroDiario()
    if (tab === 'mayor') cargarLibroMayor()
    if (tab === 'balance') cargarBalance()
    if (tab === 'resultados') cargarResultados()
    if (tab === 'iva') cargarIVA()
    if (tab === 'simple') cargarSIMPLE()
    if (tab === 'compras') cargarCompras()
  }, [tab, periodo])

  const cargarDashboard = async () => {
    try {
      const res = await fetch(`${API_URL}/api/contabilidad/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const d = await res.json()
      setData(d)
    } catch (e) {
      console.error('Error cargando dashboard contable:', e)
    } finally {
      setCargando(false)
    }
  }

  const cargarLibroDiario = async () => {
    const res = await fetch(`${API_URL}/api/contabilidad/libro-diario?periodo=${periodo}&limite=50`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const d = await res.json()
    setLibroDiario(d.asientos || [])
  }

  const cargarLibroMayor = async () => {
    const res = await fetch(`${API_URL}/api/contabilidad/libro-mayor?periodo=${periodo}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const d = await res.json()
    setLibroMayor(d.saldos || [])
  }

  const cargarBalance = async () => {
    const res = await fetch(`${API_URL}/api/contabilidad/balance-general?periodo=${periodo}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setBalance(await res.json())
  }

  const cargarResultados = async () => {
    const res = await fetch(`${API_URL}/api/contabilidad/estado-resultados?periodo=${periodo}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setResultados(await res.json())
  }

  const cargarIVA = async () => {
    const res = await fetch(`${API_URL}/api/contabilidad/iva/${anio}/${bimestreActual}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setIvaData(await res.json())
  }

  const cargarSIMPLE = async () => {
    const res = await fetch(`${API_URL}/api/contabilidad/simple/${anio}/${bimestreActual}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setSimpleData(await res.json())
  }

  const cargarCompras = async () => {
    const headers = { Authorization: `Bearer ${token}` }
    const [r1, r2] = await Promise.all([
      fetch(`${API_URL}/api/contabilidad/compras?periodo=${periodo}&limite=100`, { headers }),
      fetch(`${API_URL}/api/contabilidad/compras/resumen?periodo=${periodo}`, { headers })
    ])
    const d1 = await r1.json()
    const d2 = await r2.json()
    setCompras(d1.compras || [])
    setResumenCompras(d2)
  }

  const guardarCapital = async () => {
    if (!capitalMonto || parseFloat(capitalMonto) <= 0) {
      setMensajeCapital({ tipo: 'error', texto: 'Ingresa un monto válido' })
      return
    }
    setGuardandoCapital(true)
    setMensajeCapital(null)
    try {
      const res = await fetch(`${API_URL}/api/contabilidad/capital-inicial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ monto: parseFloat(capitalMonto), descripcion: capitalDesc })
      })
      const d = await res.json()
      if (res.ok) {
        setMensajeCapital({ tipo: 'success', texto: `✅ Capital registrado — Asiento #${d.numero} por $${parseFloat(capitalMonto).toLocaleString('es-CO')}` })
        setCapitalMonto('')
        cargarDashboard()
      } else {
        setMensajeCapital({ tipo: 'error', texto: d.detail || 'Error registrando capital' })
      }
    } catch {
      setMensajeCapital({ tipo: 'error', texto: 'Error de conexión' })
    } finally {
      setGuardandoCapital(false)
    }
  }

  const guardarCompra = async () => {
    if (!formCompra.proveedor_nombre || !formCompra.descripcion || !formCompra.subtotal) {
      setMensajeCompra({ tipo: 'error', texto: 'Proveedor, descripción y subtotal son obligatorios' })
      return
    }
    setGuardandoCompra(true)
    setMensajeCompra(null)
    try {
      const res = await fetch(`${API_URL}/api/contabilidad/compras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...formCompra,
          subtotal: parseFloat(formCompra.subtotal),
          iva: parseFloat(formCompra.iva || '0'),
          plazo_dias: parseInt(formCompra.plazo_dias || '0')
        })
      })
      const d = await res.json()
      if (res.ok) {
        setMensajeCompra({ tipo: 'success', texto: `✅ Compra registrada — Asiento #${d.numero_asiento}` })
        setFormCompra({ proveedor_nombre: '', proveedor_nit: '', descripcion: '', subtotal: '', iva: '0', tipo_compra: 'Mercancia', forma_pago: 'Contado', tipo_factura: 'Talonario', numero_factura: '', plazo_dias: '0' })
        setShowFormCompra(false)
        cargarCompras()
        cargarDashboard()
      } else {
        setMensajeCompra({ tipo: 'error', texto: d.detail || 'Error registrando compra' })
      }
    } catch (e) {
      setMensajeCompra({ tipo: 'error', texto: 'Error de conexión' })
    } finally {
      setGuardandoCompra(false)
    }
  }

  const variacionColor = (v: number) => v >= 0 ? 'text-emerald-600' : 'text-red-500'
  const variacionIcon = (v: number) => v >= 0 ? '↑' : '↓'

  const maxVenta = data ? Math.max(...data.ventas_historico.map(v => v.ventas), 1) : 1

  const TABS = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'capital', label: '🏦 Capital Inicial' },
    { id: 'compras', label: '🛒 Compras' },
    { id: 'diario', label: '📖 Libro Diario' },
    { id: 'mayor', label: '📋 Libro Mayor' },
    { id: 'balance', label: '⚖️ Balance' },
    { id: 'resultados', label: '📈 P&G' },
    { id: 'iva', label: '🧾 IVA' },
    { id: 'simple', label: '💼 SIMPLE' },
  ]

  if (cargando) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gold">📊 Contabilidad EGOS</h1>
            <p className="text-xs text-gray-400">{data?.empresa?.razon_social} — NIT {data?.empresa?.nit}</p>
          </div>
          <div className="text-right text-xs text-gray-400">
            <p>Régimen SIMPLE | CIIU 4771</p>
            <p>Período: {data?.periodo_actual}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && data && (
          <div className="space-y-6">

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: 'Ventas del Mes',
                  valor: formatPrice(data.resumen.ventas_mes),
                  sub: `${variacionIcon(data.resumen.variacion_ventas)} ${Math.abs(data.resumen.variacion_ventas)}% vs mes anterior`,
                  color: variacionColor(data.resumen.variacion_ventas),
                  icon: '💰'
                },
                {
                  label: 'Ventas Netas',
                  valor: formatPrice(data.resumen.ventas_netas),
                  sub: `Devoluciones: ${formatPrice(data.resumen.devoluciones_mes)}`,
                  color: 'text-gray-500',
                  icon: '📦'
                },
                {
                  label: 'Efectivo Disponible',
                  valor: formatPrice(data.resumen.efectivo_disponible),
                  sub: 'Caja + Bancos',
                  color: 'text-emerald-600',
                  icon: '🏦'
                },
                {
                  label: 'Cuentas por Cobrar',
                  valor: formatPrice(data.resumen.cuentas_por_cobrar),
                  sub: 'Clientes pendientes',
                  color: 'text-amber-600',
                  icon: '📋'
                },
              ].map((kpi, i) => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm border">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs text-gray-500">{kpi.label}</p>
                    <span className="text-lg">{kpi.icon}</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{kpi.valor}</p>
                  <p className={`text-xs mt-1 ${kpi.color}`}>{kpi.sub}</p>
                </div>
              ))}
            </div>

            {/* Obligaciones fiscales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-5 shadow-sm border">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>🧾</span> IVA Bimestre {data.obligaciones_fiscales.iva_bimestre.bimestre}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Base gravable</span>
                    <span className="font-medium">{formatPrice(data.obligaciones_fiscales.iva_bimestre.base_gravable)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">IVA a pagar (19%)</span>
                    <span className="font-bold text-red-600">{formatPrice(data.obligaciones_fiscales.iva_bimestre.iva_a_pagar)}</span>
                  </div>
                  <div className="mt-3 p-2 bg-red-50 rounded-lg text-xs text-red-700">
                    ⚠️ Formulario 300 — Vence aprox. día 15 del mes siguiente al bimestre
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>💼</span> Anticipo SIMPLE Bimestre {data.obligaciones_fiscales.anticipo_simple.bimestre}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Ingresos brutos</span>
                    <span className="font-medium">{formatPrice(data.obligaciones_fiscales.anticipo_simple.ingresos_brutos)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Anticipo (1.1%)</span>
                    <span className="font-bold text-amber-600">{formatPrice(data.obligaciones_fiscales.anticipo_simple.valor)}</span>
                  </div>
                  <div className="mt-3 p-2 bg-amber-50 rounded-lg text-xs text-amber-700">
                    ⚠️ Formulario 260 — Vence aprox. día 15 del mes siguiente al bimestre
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico ventas históricas */}
            <div className="bg-white rounded-xl p-5 shadow-sm border">
              <h3 className="font-semibold text-gray-800 mb-4">📈 Ventas últimos 6 meses</h3>
              <div className="flex items-end gap-2 h-40">
                {data.ventas_historico.map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-500">{formatPrice(v.ventas).replace('$', '')}</span>
                    <div
                      className="w-full bg-gray-900 rounded-t-md transition-all"
                      style={{ height: `${Math.max((v.ventas / maxVenta) * 120, 4)}px` }}
                    />
                    <span className="text-[10px] text-gray-400">{v.periodo.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Asientos del mes */}
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <p className="text-sm text-gray-600">
                📝 <strong>{data.resumen.total_asientos_mes}</strong> asientos contables registrados este mes automáticamente
              </p>
            </div>
          </div>
        )}

        {/* ── CAPITAL INICIAL ── */}
        {tab === 'capital' && (
          <div className="max-w-lg space-y-4">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="bg-gray-900 text-white px-4 py-3">
                <h3 className="font-bold">🏦 Capital Inicial de la Sociedad</h3>
                <p className="text-xs text-gray-400">Cuenta 310505 — Capital VERTEL & CATILLO S.A.S</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                  <strong>¿Por qué registrar el capital inicial?</strong><br/>
                  Sin el capital inicial el balance general no cuadra. Este asiento registra el dinero que los socios aportaron para constituir la empresa.
                  <br/><br/>
                  <strong>Asiento:</strong><br/>
                  DB 111010 Cuenta de ahorros (lo que aportaron)<br/>
                  CR 310505 Capital social (patrimonio de la empresa)
                </div>

                {mensajeCapital && (
                  <div className={`p-3 rounded-lg text-sm ${
                    mensajeCapital.tipo === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {mensajeCapital.texto}
                  </div>
                )}

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Monto del capital inicial (COP) *</label>
                  <input
                    type="number"
                    value={capitalMonto}
                    onChange={e => setCapitalMonto(e.target.value)}
                    placeholder="Ej: 10000000"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                  {capitalMonto && parseFloat(capitalMonto) > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      ${parseFloat(capitalMonto).toLocaleString('es-CO')} COP
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Descripción</label>
                  <input
                    value={capitalDesc}
                    onChange={e => setCapitalDesc(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </div>

                <button
                  onClick={guardarCapital}
                  disabled={guardandoCapital}
                  className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 disabled:opacity-50"
                >
                  {guardandoCapital ? 'Registrando...' : 'Registrar Capital Inicial'}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  ⚠️ Solo se puede registrar una vez. Consulta con tu contador antes de proceder.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── COMPRAS ── */}}
        {tab === 'compras' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input type="month" value={periodo} onChange={e => { setPeriodo(e.target.value); }}
                  className="border rounded-lg px-3 py-2 text-sm" />
                <span className="text-sm text-gray-500">{compras.length} compras</span>
              </div>
              <button onClick={() => setShowFormCompra(true)}
                className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-700">
                + Registrar Compra
              </button>
            </div>

            {/* Mensaje */}
            {mensajeCompra && (
              <div className={`p-3 rounded-lg text-sm ${mensajeCompra.tipo === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {mensajeCompra.texto}
              </div>
            )}

            {/* Resumen */}
            {resumenCompras && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Total Compras', valor: formatPrice(resumenCompras.total_compras || 0), icon: '💰' },
                  { label: 'IVA Descontable', valor: formatPrice(resumenCompras.total_iva_descontable || 0), icon: '🧾' },
                  { label: 'Cuentas por Pagar', valor: formatPrice(resumenCompras.cuentas_por_pagar || 0), icon: '⏳' },
                ].map((k, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 shadow-sm border">
                    <p className="text-xs text-gray-500">{k.label}</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{k.valor}</p>
                    <span className="text-xl">{k.icon}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Formulario */}
            {showFormCompra && (
              <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
                <h3 className="font-bold text-gray-800">Registrar Compra / Gasto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Proveedor *</label>
                    <input value={formCompra.proveedor_nombre} onChange={e => setFormCompra({...formCompra, proveedor_nombre: e.target.value})}
                      placeholder="Nombre del proveedor" className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">NIT / CC Proveedor</label>
                    <input value={formCompra.proveedor_nit} onChange={e => setFormCompra({...formCompra, proveedor_nit: e.target.value})}
                      placeholder="Opcional" className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-gray-500 mb-1 block">Descripción *</label>
                    <input value={formCompra.descripcion} onChange={e => setFormCompra({...formCompra, descripcion: e.target.value})}
                      placeholder="Qué se compró" className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Tipo de Compra *</label>
                    <select value={formCompra.tipo_compra} onChange={e => setFormCompra({...formCompra, tipo_compra: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="Mercancia">Mercancía (Inventario)</option>
                      <option value="Servicio">Servicio Tecnología</option>
                      <option value="Publicidad">Publicidad y Marketing</option>
                      <option value="Transporte">Transporte y Fletes</option>
                      <option value="Arriendo">Arriendo</option>
                      <option value="Servicios_publicos">Servicios Públicos</option>
                      <option value="Papeleria">Papelería</option>
                      <option value="Otro">Otro Gasto</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Tipo Factura</label>
                    <select value={formCompra.tipo_factura} onChange={e => setFormCompra({...formCompra, tipo_factura: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="Talonario">Talonario (Papel)</option>
                      <option value="Electronica">Electrónica</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Número Factura</label>
                    <input value={formCompra.numero_factura} onChange={e => setFormCompra({...formCompra, numero_factura: e.target.value})}
                      placeholder="Ej: 001-2024" className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Subtotal (sin IVA) *</label>
                    <input type="number" value={formCompra.subtotal} onChange={e => setFormCompra({...formCompra, subtotal: e.target.value})}
                      placeholder="0" className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">IVA (0 si no cobra)</label>
                    <input type="number" value={formCompra.iva} onChange={e => setFormCompra({...formCompra, iva: e.target.value})}
                      placeholder="0" className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Forma de Pago</label>
                    <select value={formCompra.forma_pago} onChange={e => setFormCompra({...formCompra, forma_pago: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="Contado">Contado</option>
                      <option value="Credito">Crédito</option>
                    </select>
                  </div>
                  {formCompra.forma_pago === 'Credito' && (
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Plazo (días)</label>
                      <input type="number" value={formCompra.plazo_dias} onChange={e => setFormCompra({...formCompra, plazo_dias: e.target.value})}
                        placeholder="30" className="w-full border rounded-lg px-3 py-2 text-sm" />
                    </div>
                  )}
                </div>

                {/* Preview asiento */}
                {formCompra.subtotal && (
                  <div className="bg-gray-50 rounded-lg p-3 text-xs">
                    <p className="font-semibold text-gray-700 mb-2">Vista previa del asiento:</p>
                    <div className="space-y-1 font-mono">
                      <p className="text-emerald-700">DB {formCompra.tipo_compra === 'Mercancia' ? '143505 Inventario prendas' : '5xxxxx Gasto'} ${parseFloat(formCompra.subtotal || '0').toLocaleString('es-CO')}</p>
                      {parseFloat(formCompra.iva || '0') > 0 && <p className="text-emerald-700">DB 240810 IVA descontable ${parseFloat(formCompra.iva).toLocaleString('es-CO')}</p>}
                      <p className="text-blue-700">CR {formCompra.forma_pago === 'Contado' ? '111010 Banco' : '220505 Proveedores'} ${(parseFloat(formCompra.subtotal || '0') + parseFloat(formCompra.iva || '0')).toLocaleString('es-CO')}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={guardarCompra} disabled={guardandoCompra}
                    className="bg-gray-900 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-700 disabled:opacity-50">
                    {guardandoCompra ? 'Guardando...' : 'Registrar Compra'}
                  </button>
                  <button onClick={() => { setShowFormCompra(false); setMensajeCompra(null) }}
                    className="border border-gray-300 text-gray-600 px-5 py-2 rounded-xl text-sm hover:bg-gray-50">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Lista compras */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-gray-900 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Proveedor</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-left">Factura</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                    <th className="px-4 py-3 text-right">IVA</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center">Pago</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {compras.map((c, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs text-gray-500">{c.numero}</td>
                      <td className="px-4 py-2">
                        <p className="font-medium text-gray-800">{c.proveedor}</p>
                        {c.nit && <p className="text-xs text-gray-400">NIT: {c.nit}</p>}
                      </td>
                      <td className="px-4 py-2 text-xs">{c.tipo_compra}</td>
                      <td className="px-4 py-2 text-xs">
                        <span className={`px-2 py-0.5 rounded-full ${c.tipo_factura === 'Talonario' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {c.tipo_factura}
                        </span>
                        {c.numero_factura && <p className="text-gray-400 mt-0.5">{c.numero_factura}</p>}
                      </td>
                      <td className="px-4 py-2 text-right">{formatPrice(c.subtotal)}</td>
                      <td className="px-4 py-2 text-right text-xs">{c.iva > 0 ? formatPrice(c.iva) : '-'}</td>
                      <td className="px-4 py-2 text-right font-bold">{formatPrice(c.total)}</td>
                      <td className="px-4 py-2 text-center text-xs">{c.forma_pago}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${c.estado === 'Pagada' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {c.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {compras.length === 0 && (
                    <tr><td colSpan={9} className="text-center py-8 text-gray-400">No hay compras registradas para este período</td></tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}

        {/* ── LIBRO DIARIO ── */}
        {tab === 'diario' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input type="month" value={periodo} onChange={e => setPeriodo(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm" />
              <span className="text-sm text-gray-500">{libroDiario.length} asientos</span>
            </div>
            <div className="space-y-3">
              {libroDiario.map(a => (
                <div key={a.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono bg-gray-900 text-white px-2 py-0.5 rounded">#{a.numero}</span>
                      <span className="text-sm font-medium text-gray-800">{a.descripcion}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{new Date(a.fecha).toLocaleDateString('es-CO')}</p>
                      <p className="text-xs font-semibold text-gray-700">{formatPrice(a.total_debito)}</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[400px]">
                    <tbody>
                      {a.movimientos.map((m: any, i: number) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-4 py-2 font-mono text-gray-500 w-20">{m.codigo}</td>
                          <td className="px-2 py-2 text-gray-700">{m.cuenta}</td>
                          <td className="px-2 py-2 text-right text-emerald-700 font-medium">
                            {m.debito > 0 ? formatPrice(m.debito) : ''}
                          </td>
                          <td className="px-4 py-2 text-right text-blue-700 font-medium">
                            {m.credito > 0 ? formatPrice(m.credito) : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              ))}
              {libroDiario.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-4xl mb-2">📖</p>
                  <p>No hay asientos para este período</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── LIBRO MAYOR ── */}
        {tab === 'mayor' && (
          <div className="space-y-4">
            <input type="month" value={periodo} onChange={e => setPeriodo(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm" />
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-gray-900 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Código</th>
                    <th className="px-4 py-3 text-left">Cuenta</th>
                    <th className="px-4 py-3 text-right">Débitos</th>
                    <th className="px-4 py-3 text-right">Créditos</th>
                    <th className="px-4 py-3 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {libroMayor.map((s, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-gray-500 text-xs">{s.codigo}</td>
                      <td className="px-4 py-2 text-gray-800">{s.cuenta}</td>
                      <td className="px-4 py-2 text-right text-emerald-700">{formatPrice(s.total_debitos)}</td>
                      <td className="px-4 py-2 text-right text-blue-700">{formatPrice(s.total_creditos)}</td>
                      <td className="px-4 py-2 text-right font-bold text-gray-900">{formatPrice(s.saldo_final)}</td>
                    </tr>
                  ))}
                  {libroMayor.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">Sin movimientos</td></tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}

        {/* ── BALANCE GENERAL ── */}
        {tab === 'balance' && balance && (
          <div className="space-y-4">
            <input type="month" value={periodo} onChange={e => setPeriodo(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { titulo: 'ACTIVOS', data: balance.activos, color: 'emerald' },
                { titulo: 'PASIVOS', data: balance.pasivos, color: 'red' },
                { titulo: 'PATRIMONIO', data: balance.patrimonio, color: 'blue' },
              ].map((sec, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className={`bg-${sec.color}-600 text-white px-4 py-2 flex justify-between`}>
                    <span className="font-bold text-sm">{sec.titulo}</span>
                    <span className="font-bold text-sm">{formatPrice(sec.data.total)}</span>
                  </div>
                  <div className="divide-y">
                    {sec.data.cuentas.map((c: any, j: number) => (
                      <div key={j} className="flex justify-between px-4 py-2 text-xs">
                        <span className="text-gray-600">{c.cuenta}</span>
                        <span className="font-medium">{formatPrice(c.saldo)}</span>
                      </div>
                    ))}
                    {sec.data.cuentas.length === 0 && (
                      <p className="text-center py-4 text-xs text-gray-400">Sin saldos</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className={`p-3 rounded-lg text-sm font-medium ${balance.ecuacion?.cuadra ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {balance.ecuacion?.cuadra ? '✅ Balance cuadra correctamente' : '❌ Balance no cuadra — revisar asientos'}
            </div>
          </div>
        )}

        {/* ── ESTADO DE RESULTADOS ── */}
        {tab === 'resultados' && resultados && (
          <div className="space-y-4">
            <input type="month" value={periodo} onChange={e => setPeriodo(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm" />
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="bg-gray-900 text-white px-4 py-3">
                <h3 className="font-bold">Estado de Resultados — {resultados.periodo}</h3>
                <p className="text-xs text-gray-400">{resultados.empresa} | NIT {resultados.nit}</p>
              </div>
              <div className="p-4 space-y-4">
                {[
                  { label: 'INGRESOS OPERACIONALES', data: resultados.ingresos, color: 'emerald' },
                  { label: 'COSTOS DE VENTAS', data: resultados.costos, color: 'orange' },
                  { label: 'GASTOS OPERACIONALES', data: resultados.gastos, color: 'red' },
                ].map((sec, i) => (
                  <div key={i}>
                    <div className="flex justify-between font-semibold text-sm mb-1">
                      <span>{sec.label}</span>
                      <span>{formatPrice(sec.data.total)}</span>
                    </div>
                    {sec.data.cuentas.map((c: any, j: number) => (
                      <div key={j} className="flex justify-between text-xs text-gray-500 pl-4 py-0.5">
                        <span>{c.cuenta}</span>
                        <span>{formatPrice(c.valor)}</span>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>UTILIDAD BRUTA</span>
                    <span className={resultados.utilidad_bruta >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                      {formatPrice(resultados.utilidad_bruta)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t pt-2">
                    <span>UTILIDAD NETA</span>
                    <span className={resultados.utilidad_neta >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                      {formatPrice(resultados.utilidad_neta)}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500 pt-1">
                    <span>Margen bruto: {resultados.margen_bruto}%</span>
                    <span>Margen neto: {resultados.margen_neto}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── IVA ── */}
        {tab === 'iva' && ivaData && (
          <div className="max-w-lg space-y-4">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="bg-red-600 text-white px-4 py-3">
                <h3 className="font-bold">Formulario 300 — IVA Bimestral</h3>
                <p className="text-xs opacity-80">Bimestre {ivaData.bimestre} — {ivaData.anio}</p>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: 'Base gravable (ventas sin IVA)', valor: ivaData.base_gravable, color: '' },
                  { label: 'IVA generado (19%)', valor: ivaData.iva_generado, color: 'text-red-600' },
                  { label: 'IVA descontable (compras)', valor: ivaData.iva_descontable, color: 'text-emerald-600' },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between text-sm border-b pb-2">
                    <span className="text-gray-600">{r.label}</span>
                    <span className={`font-semibold ${r.color}`}>{formatPrice(r.valor)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-base font-bold pt-2">
                  <span>IVA A PAGAR</span>
                  <span className="text-red-600">{formatPrice(ivaData.iva_a_pagar)}</span>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-xs text-red-700 mt-2">
                  📅 Fecha vencimiento aprox: <strong>{ivaData.fecha_vencimiento_aprox}</strong><br/>
                  📋 Presentar en: <strong>muisca.dian.gov.co</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SIMPLE ── */}
        {tab === 'simple' && simpleData && (
          <div className="max-w-lg space-y-4">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="bg-amber-600 text-white px-4 py-3">
                <h3 className="font-bold">Formulario 260 — Régimen SIMPLE</h3>
                <p className="text-xs opacity-80">Anticipo Bimestre {simpleData.bimestre} — {simpleData.anio}</p>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: 'Ingresos brutos del bimestre', valor: simpleData.ingresos_brutos },
                  { label: `Tarifa SIMPLE (${simpleData.tarifa_porcentaje} — CIIU 4771)`, valor: null },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between text-sm border-b pb-2">
                    <span className="text-gray-600">{r.label}</span>
                    {r.valor !== null && <span className="font-semibold">{formatPrice(r.valor)}</span>}
                  </div>
                ))}
                <div className="flex justify-between text-base font-bold pt-2">
                  <span>ANTICIPO A PAGAR</span>
                  <span className="text-amber-600">{formatPrice(simpleData.valor_anticipo)}</span>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-700 mt-2">
                  📅 Fecha vencimiento aprox: <strong>{simpleData.fecha_vencimiento_aprox}</strong><br/>
                  📋 Presentar en: <strong>muisca.dian.gov.co</strong>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
