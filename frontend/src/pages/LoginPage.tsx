import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { api } from '@/services/api'
import { getDepartamentos, getMunicipios } from '@/data/colombia'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '', password: '', confirmar_password: '', nombre: '', apellido: '',
    documento_tipo: 'CC', documento_numero: '', telefono: '',
    fecha_nacimiento: '', genero: '', direccion: '', barrio: '', ciudad: '', departamento: '',
    acepta_terminos: false, acepta_datos: false, acepta_marketing: false
  })
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const { iniciarSesion, errorLogin } = useAuthStore()
  const { addNotification } = useNotificationStore()
  const navigate = useNavigate()

  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {}

    if (!isLogin) {
      if (!formData.nombre || formData.nombre.length < 2)
        nuevosErrores.nombre = 'El nombre debe tener al menos 2 caracteres'
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.nombre))
        nuevosErrores.nombre = 'El nombre solo puede contener letras'
      if (formData.documento_numero && !/^[0-9]{5,12}$/.test(formData.documento_numero))
        nuevosErrores.documento_numero = 'El documento debe tener entre 5 y 12 dígitos'
      if (formData.telefono && !/^[0-9+\s\-]{7,15}$/.test(formData.telefono))
        nuevosErrores.telefono = 'El teléfono debe tener entre 7 y 15 dígitos'
      if (formData.fecha_nacimiento) {
        const fecha = new Date(formData.fecha_nacimiento)
        const hoy = new Date()
        const edad = hoy.getFullYear() - fecha.getFullYear()
        if (fecha > hoy) nuevosErrores.fecha_nacimiento = 'La fecha no puede ser futura'
        else if (edad < 18) nuevosErrores.fecha_nacimiento = 'Debes ser mayor de 18 años'
      }
      if (formData.password.length < 8)
        nuevosErrores.password = 'La contraseña debe tener al menos 8 caracteres'
      else if (!/(?=.*[A-Z])/.test(formData.password))
        nuevosErrores.password = 'La contraseña debe tener al menos una mayúscula'
      else if (!/(?=.*[0-9])/.test(formData.password))
        nuevosErrores.password = 'La contraseña debe tener al menos un número'
      else if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(formData.password))
        nuevosErrores.password = 'La contraseña debe tener al menos un carácter especial'
      if (formData.password !== formData.confirmar_password)
        nuevosErrores.confirmar_password = 'Las contraseñas no coinciden'
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validarFormulario()) return
    setLoading(true)

    try {
      if (isLogin) {
        const success = await iniciarSesion(formData.email, formData.password)
        if (success) {
          addNotification('¡Bienvenido de nuevo! Sesión iniciada correctamente', 'success')
          navigate('/')
        } else {
          addNotification(errorLogin || 'No se pudo iniciar sesión', 'error')
        }
      } else {
        const response = await api.registrar(formData)
        if (response.exito) {
          addNotification('¡Cuenta creada exitosamente! Bienvenido a EGOS', 'success')
          setIsLogin(true)
        } else {
          addNotification(response.error || 'No se pudo crear la cuenta', 'error')
        }
      }
    } catch (error) {
      addNotification('Error de conexión. Verifica tu internet e intenta de nuevo.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const demoUsers = [
    { email: 'demo@egos.com.co', role: 'Usuario Demo', password: 'admin123' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <i className="fas fa-shopping-bag text-white text-xl"></i>
            </div>
            <h1 className="text-3xl font-bold text-primary">EGOS</h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</h2>
          <p className="text-gray-600">{isLogin ? 'Accede a tu cuenta' : 'Crea tu cuenta de cliente'}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input type="text" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-primary" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                  <input type="text" value={formData.apellido} onChange={(e) => setFormData({...formData, apellido: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-primary" required />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Documento *</label>
                  <select value={formData.documento_tipo} onChange={(e) => setFormData({...formData, documento_tipo: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-primary" required>
                    <option value="CC">Cédula de Ciudadanía</option>
                    <option value="CE">Cédula de Extranjería</option>
                    <option value="TI">Tarjeta de Identidad</option>
                    <option value="PP">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número Documento *</label>
                  <input type="text" value={formData.documento_numero} onChange={(e) => setFormData({...formData, documento_numero: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 ${errores.documento_numero ? 'border-red-500' : 'border-gray-300'}`} placeholder="5 a 12 dígitos" required />
                  {errores.documento_numero && <p className="text-red-500 text-xs mt-1">{errores.documento_numero}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input type="tel" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 ${errores.telefono ? 'border-red-500' : 'border-gray-300'}`} placeholder="7 a 15 dígitos" />
                  {errores.telefono && <p className="text-red-500 text-xs mt-1">{errores.telefono}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Nacimiento</label>
                  <input type="date" value={formData.fecha_nacimiento} onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 ${errores.fecha_nacimiento ? 'border-red-500' : 'border-gray-300'}`} />
                  {errores.fecha_nacimiento && <p className="text-red-500 text-xs mt-1">{errores.fecha_nacimiento}</p>}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                <select value={formData.genero} onChange={(e) => setFormData({...formData, genero: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400">
                  <option value="">Seleccionar</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="LGBTI+">LGBTI+</option>
                  <option value="Otro">Otro</option>
                  <option value="Prefiero no decir">Prefiero no decir</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input type="text" value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                  <select value={formData.departamento} onChange={(e) => setFormData({...formData, departamento: e.target.value, ciudad: ''})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400">
                    <option value="">Seleccionar departamento</option>
                    {getDepartamentos().map(dep => (
                      <option key={dep} value={dep}>{dep}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Municipio</label>
                  <select value={formData.ciudad} onChange={(e) => setFormData({...formData, ciudad: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400" disabled={!formData.departamento}>
                    <option value="">{formData.departamento ? 'Seleccionar municipio' : 'Primero selecciona departamento'}</option>
                    {getMunicipios(formData.departamento).map(mun => (
                      <option key={mun} value={mun}>{mun}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barrio</label>
                <input type="text" value={formData.barrio} onChange={(e) => setFormData({...formData, barrio: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400" placeholder="Escribe tu barrio" />
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" checked={formData.acepta_terminos} onChange={(e) => setFormData({...formData, acepta_terminos: e.target.checked})} className="mr-2" required />
                  <span className="text-sm">Acepto los términos y condiciones *</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" checked={formData.acepta_datos} onChange={(e) => setFormData({...formData, acepta_datos: e.target.checked})} className="mr-2" required />
                  <span className="text-sm">Autorizo el tratamiento de mis datos personales *</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" checked={formData.acepta_marketing} onChange={(e) => setFormData({...formData, acepta_marketing: e.target.checked})} className="mr-2" />
                  <span className="text-sm">Acepto recibir comunicaciones comerciales</span>
                </label>
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-primary" placeholder="tu@email.com" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-primary ${errores.password ? 'border-red-500' : 'border-gray-300'}`} placeholder="Mín. 8 caracteres, mayúscula, número y especial" required />
            {errores.password && <p className="text-red-500 text-xs mt-1">{errores.password}</p>}
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Contraseña</label>
              <input type="password" value={formData.confirmar_password} onChange={(e) => setFormData({...formData, confirmar_password: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 ${errores.confirmar_password ? 'border-red-500' : 'border-gray-300'}`} placeholder="Repite tu contraseña" required={!isLogin} />
              {errores.confirmar_password && <p className="text-red-500 text-xs mt-1">{errores.confirmar_password}</p>}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-primary text-white py-3 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 font-semibold shadow-sm">
            {loading ? (isLogin ? 'Iniciando...' : 'Registrando...') : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
          </button>
        </form>

        <div className="text-center space-y-2">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:text-secondary transition-colors block w-full"
          >
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
          {isLogin && (
            <a
              href="/recuperar-contrasena"
              className="text-sm text-gray-600 hover:text-primary transition-colors block"
            >
              ¿Olvidaste tu contraseña?
            </a>
          )}
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Usuarios de Prueba:</h3>
          <div className="space-y-2">
            {demoUsers.map((user, index) => (
              <div
                key={index}
                onClick={() => {
                  console.log('Clic en usuario demo:', user.email);
                  setTimeout(() => {
                    setFormData(prev => ({
                      ...prev,
                      email: user.email,
                      password: user.password
                    }));
                  }, 0);
                }}
                className="p-3 bg-white border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{user.role}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    Click para usar
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}