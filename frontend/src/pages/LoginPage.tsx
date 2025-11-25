import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { api } from '@/services/api'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '', password: '', nombre: '', apellido: '',
    documento_tipo: 'CC', documento_numero: '', telefono: '',
    fecha_nacimiento: '', genero: '', direccion: '', ciudad: '', departamento: '',
    acepta_terminos: false, acepta_datos: false, acepta_marketing: false
  })
  const [loading, setLoading] = useState(false)
  const { iniciarSesion } = useAuthStore()
  const { addNotification } = useNotificationStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        const success = await iniciarSesion(formData.email, formData.password)
        if (success) {
          addNotification('Inicio de sesión exitoso', 'success')
          navigate('/dashboard')
        } else {
          addNotification('Credenciales incorrectas', 'error')
        }
      } else {
        const response = await api.registrar(formData)
        if (response.exito) {
          addNotification('Registro exitoso. Ahora puedes iniciar sesión', 'success')
          setIsLogin(true)
        } else {
          addNotification('Error en el registro', 'error')
        }
      }
    } catch (error) {
      addNotification(isLogin ? 'Error al iniciar sesión' : 'Error en el registro', 'error')
    } finally {
      setLoading(false)
    }
  }

  const demoUsers = [
    { email: 'demo@estilomoda.com', role: 'Usuario Demo', password: 'admin123' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <i className="fas fa-shopping-bag text-white text-xl"></i>
            </div>
            <h1 className="text-3xl font-bold text-primary">Estilo y Moda</h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</h2>
          <p className="text-gray-600">{isLogin ? 'Accede a tu cuenta' : 'Crea tu cuenta de cliente'}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input type="text" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                  <input type="text" value={formData.apellido} onChange={(e) => setFormData({...formData, apellido: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" required />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Documento *</label>
                  <select value={formData.documento_tipo} onChange={(e) => setFormData({...formData, documento_tipo: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" required>
                    <option value="CC">Cédula de Ciudadanía</option>
                    <option value="CE">Cédula de Extranjería</option>
                    <option value="TI">Tarjeta de Identidad</option>
                    <option value="PP">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número Documento *</label>
                  <input type="text" value={formData.documento_numero} onChange={(e) => setFormData({...formData, documento_numero: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" required />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input type="tel" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Nacimiento</label>
                  <input type="date" value={formData.fecha_nacimiento} onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                <select value={formData.genero} onChange={(e) => setFormData({...formData, genero: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
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
                <input type="text" value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                  <input type="text" value={formData.ciudad} onChange={(e) => setFormData({...formData, ciudad: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                  <select value={formData.departamento} onChange={(e) => setFormData({...formData, departamento: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Seleccionar</option>
                    <option value="Antioquia">Antioquia</option>
                    <option value="Bogotá">Bogotá D.C.</option>
                    <option value="Valle del Cauca">Valle del Cauca</option>
                    <option value="Cundinamarca">Cundinamarca</option>
                  </select>
                </div>
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
            <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="tu@email.com" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="••••••••" required />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-primary text-white py-3 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50">
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