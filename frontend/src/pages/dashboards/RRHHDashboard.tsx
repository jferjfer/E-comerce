import { useState, useEffect } from 'react'
import { API_URL } from '@/config/api'
import { useAuthStore } from '@/store/useAuthStore'
import { ROLE_DEFINITIONS } from '@/config/roles'

const ROLES_INTERNOS = [
  { value: 'rrhh', label: 'Recursos Humanos' },
  { value: 'contador', label: 'Contador' },
  { value: 'cfo', label: 'CFO' },
  { value: 'cmo', label: 'CMO' },
  { value: 'operations_director', label: 'Director de Operaciones' },
  { value: 'tech_director', label: 'Director Técnico' },
  { value: 'regional_manager', label: 'Gerente Regional' },
  { value: 'category_manager', label: 'Gerente de Categoría' },
  { value: 'brand_manager', label: 'Gerente de Marca' },
  { value: 'inventory_manager', label: 'Gerente de Inventario' },
  { value: 'marketing_manager', label: 'Gerente de Marketing' },
  { value: 'product_manager', label: 'Gestor de Productos' },
  { value: 'pricing_analyst', label: 'Analista de Precios' },
  { value: 'content_editor', label: 'Editor de Contenido' },
  { value: 'visual_merchandiser', label: 'Merchandiser Visual' },
  { value: 'photographer', label: 'Fotógrafo' },
  { value: 'customer_success', label: 'Customer Success' },
  { value: 'support_agent', label: 'Agente de Soporte' },
  { value: 'logistics_coordinator', label: 'Coordinador Logístico' },
  { value: 'qa_specialist', label: 'Especialista QA' },
  { value: 'seller_premium', label: 'Vendedor Premium' },
  { value: 'seller_standard', label: 'Vendedor Estándar' },
  { value: 'seller_basic', label: 'Vendedor Básico' },
]

const FORM_INICIAL = {
  nombre: '', apellido: '', email: '', rol: 'product_manager',
  telefono: '', documento_tipo: 'CC', documento_numero: '',
  ciudad: '', direccion: '', contrasena_temporal: ''
}

export default function RRHHDashboard() {
  const { token, usuario } = useAuthStore()
  const [empleados, setEmpleados] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [form, setForm] = useState(FORM_INICIAL)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: string; texto: string } | null>(null)
  const [buscar, setBuscar] = useState('')
  const [filtroRol, setFiltroRol] = useState('')
  const [confirmEliminar, setConfirmEliminar] = useState<any>(null)

  useEffect(() => { cargarEmpleados() }, [filtroRol, buscar])

  const cargarEmpleados = async () => {
    setCargando(true)
    try {
      const params = new URLSearchParams()
      if (filtroRol) params.append('rol', filtroRol)
      if (buscar) params.append('buscar', buscar)
      const res = await fetch(`${API_URL}/api/usuarios/rrhh/empleados?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const d = await res.json()
      setEmpleados(d.empleados || [])
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  const guardarEmpleado = async () => {
    if (!form.nombre || !form.email || !form.rol) {
      setMensaje({ tipo: 'error', texto: 'Nombre, email y rol son obligatorios' })
      return
    }
    setGuardando(true)
    setMensaje(null)
    try {
      const url = editando
        ? `${API_URL}/api/usuarios/rrhh/${editando.id}`
        : `${API_URL}/api/usuarios/rrhh/crear`
      const method = editando ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      })
      const d = await res.json()

      if (res.ok) {
        setMensaje({
          tipo: 'success',
          texto: editando
            ? `✅ Empleado actualizado`
            : `✅ Empleado creado — Contraseña temporal: ${d.password_temporal}`
        })
        setShowForm(false)
        setEditando(null)
        setForm(FORM_INICIAL)
        cargarEmpleados()
      } else {
        setMensaje({ tipo: 'error', texto: d.error || 'Error al guardar' })
      }
    } catch (e) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión' })
    } finally {
      setGuardando(false)
    }
  }

  const cambiarEstado = async (emp: any) => {
    try {
      const res = await fetch(`${API_URL}/api/usuarios/rrhh/${emp.id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ activo: !emp.activo, motivo: 'Cambio desde panel RRHH' })
      })
      const d = await res.json()
      if (res.ok) {
        setMensaje({ tipo: 'success', texto: d.mensaje })
        cargarEmpleados()
      } else {
        setMensaje({ tipo: 'error', texto: d.error })
      }
    } catch (e) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión' })
    }
  }

  const eliminarEmpleado = async (emp: any) => {
    try {
      const res = await fetch(`${API_URL}/api/usuarios/rrhh/${emp.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const d = await res.json()
      if (res.ok) {
        setMensaje({ tipo: 'success', texto: d.mensaje })
        setConfirmEliminar(null)
        cargarEmpleados()
      } else {
        setMensaje({ tipo: 'error', texto: d.error })
      }
    } catch (e) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión' })
    }
  }

  const abrirEditar = (emp: any) => {
    setEditando(emp)
    setForm({
      nombre: emp.nombre || '',
      apellido: emp.apellido || '',
      email: emp.email || '',
      rol: emp.rol || '',
      telefono: emp.telefono || '',
      documento_tipo: emp.documento_tipo || 'CC',
      documento_numero: emp.documento_numero || '',
      ciudad: emp.ciudad || '',
      direccion: emp.direccion || '',
      contrasena_temporal: ''
    })
    setShowForm(true)
    setMensaje(null)
  }

  const roleInfo = (rol: string) => ROLE_DEFINITIONS[rol] || { name: rol, color: 'bg-gray-400', icon: 'fas fa-user' }

  const activos = empleados.filter(e => e.activo !== false).length
  const inactivos = empleados.filter(e => e.activo === false).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-purple-400">👥 Recursos Humanos</h1>
            <p className="text-xs text-gray-400">VERTEL & CATILLO S.A.S — Gestión de empleados</p>
          </div>
          <button onClick={() => { setShowForm(true); setEditando(null); setForm(FORM_INICIAL); setMensaje(null) }}
            className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-purple-700">
            + Nuevo Empleado
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Empleados', valor: empleados.length, icon: '👥', color: 'text-gray-900' },
            { label: 'Activos', valor: activos, icon: '✅', color: 'text-emerald-600' },
            { label: 'Inactivos', valor: inactivos, icon: '⏸️', color: 'text-red-500' },
          ].map((k, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border">
              <p className="text-xs text-gray-500">{k.label}</p>
              <p className={`text-3xl font-bold mt-1 ${k.color}`}>{k.valor}</p>
              <span className="text-xl">{k.icon}</span>
            </div>
          ))}
        </div>

        {/* Mensaje */}
        {mensaje && (
          <div className={`p-3 rounded-xl text-sm font-medium ${mensaje.tipo === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {mensaje.texto}
          </div>
        )}

        {/* Formulario crear/editar */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-bold text-gray-800 mb-4 text-lg">
              {editando ? `✏️ Editar: ${editando.nombre}` : '➕ Nuevo Empleado'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nombre *</label>
                <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Nombre" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Apellido</label>
                <input value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Apellido" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Email *</label>
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  type="email" className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="correo@empresa.com" disabled={!!editando} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Rol *</label>
                <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  {ROLES_INTERNOS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Teléfono</label>
                <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="3001234567" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Ciudad</label>
                <input value={form.ciudad} onChange={e => setForm({ ...form, ciudad: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Bogotá" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tipo Documento</label>
                <select value={form.documento_tipo} onChange={e => setForm({ ...form, documento_tipo: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="PP">Pasaporte</option>
                  <option value="NIT">NIT</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Número Documento</label>
                <input value={form.documento_numero} onChange={e => setForm({ ...form, documento_numero: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="1234567890" />
              </div>
              {!editando && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Contraseña temporal (opcional)</label>
                  <input value={form.contrasena_temporal} onChange={e => setForm({ ...form, contrasena_temporal: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Se genera automáticamente" />
                </div>
              )}
            </div>
            {!editando && (
              <p className="text-xs text-gray-400 mt-3">
                📧 El empleado recibirá un correo con sus credenciales de acceso automáticamente.
              </p>
            )}
            <div className="flex gap-3 mt-5">
              <button onClick={guardarEmpleado} disabled={guardando}
                className="bg-gray-900 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-700 disabled:opacity-50">
                {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Crear Empleado'}
              </button>
              <button onClick={() => { setShowForm(false); setEditando(null); setMensaje(null) }}
                className="border border-gray-300 text-gray-600 px-6 py-2 rounded-xl text-sm hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-3 flex-wrap">
          <input value={buscar} onChange={e => setBuscar(e.target.value)}
            placeholder="🔍 Buscar por nombre o email..."
            className="border rounded-lg px-3 py-2 text-sm w-64" />
          <select value={filtroRol} onChange={e => setFiltroRol(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Todos los roles</option>
            {ROLES_INTERNOS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button onClick={() => { setBuscar(''); setFiltroRol('') }}
            className="text-sm text-gray-500 hover:text-gray-700 px-2">
            Limpiar
          </button>
        </div>

        {/* Tabla empleados */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Empleado</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-left">Contacto</th>
                <th className="px-4 py-3 text-left">Documento</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Cargando...</td></tr>
              ) : empleados.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No hay empleados</td></tr>
              ) : empleados.map((emp, i) => {
                const ri = roleInfo(emp.rol)
                return (
                  <tr key={i} className={`border-b hover:bg-gray-50 ${emp.activo === false ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${ri.color} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white font-bold text-sm">{emp.nombre?.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{emp.nombre} {emp.apellido || ''}</p>
                          <p className="text-xs text-gray-400">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white ${ri.color}`}>
                        <i className={`${ri.icon} text-[10px]`}></i>
                        {ri.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {emp.telefono && <p>📞 {emp.telefono}</p>}
                      {emp.ciudad && <p>📍 {emp.ciudad}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {emp.documento_tipo && <p>{emp.documento_tipo}: {emp.documento_numero || 'N/A'}</p>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${emp.activo !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {emp.activo !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => abrirEditar(emp)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Editar">
                          <i className="fas fa-edit text-xs"></i>
                        </button>
                        <button onClick={() => cambiarEstado(emp)}
                          className={`p-1.5 rounded-lg text-xs ${emp.activo !== false ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                          title={emp.activo !== false ? 'Desactivar' : 'Activar'}>
                          <i className={`fas ${emp.activo !== false ? 'fa-pause' : 'fa-play'} text-xs`}></i>
                        </button>
                        {usuario?.rol === 'ceo' && emp.rol !== 'ceo' && (
                          <button onClick={() => setConfirmEliminar(emp)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Eliminar">
                            <i className="fas fa-trash text-xs"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>

        {/* Modal confirmar eliminar */}
        {confirmEliminar && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
              <h3 className="font-bold text-gray-900 text-lg mb-2">⚠️ Eliminar empleado</h3>
              <p className="text-gray-600 text-sm mb-4">
                ¿Estás seguro de eliminar a <strong>{confirmEliminar.nombre}</strong>?
                Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button onClick={() => eliminarEmpleado(confirmEliminar)}
                  className="flex-1 bg-red-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-red-700">
                  Eliminar
                </button>
                <button onClick={() => setConfirmEliminar(null)}
                  className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-xl text-sm hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
