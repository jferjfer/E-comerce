import { API_URL } from '@/config/api';
import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import EgosLogo from '@/components/EgosLogo';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [verPass, setVerPass] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    const tokenUrl = searchParams.get('token');
    if (tokenUrl) setToken(tokenUrl);
    else setMensaje('El enlace de recuperación no es válido o ha expirado.');
  }, [searchParams]);

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevaContrasena !== confirmarContrasena) {
      setMensaje('Las contraseñas no coinciden');
      return;
    }
    if (nuevaContrasena.length < 8) {
      setMensaje('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setCargando(true);
    setMensaje('');
    try {
      const respuesta = await fetch(`${API_URL}/api/auth/restablecer-contrasena`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, nuevaContrasena }),
      });
      const datos = await respuesta.json();
      if (respuesta.ok) {
        setExito(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setMensaje(datos.error || 'Error al restablecer la contraseña');
      }
    } catch {
      setMensaje('Error de conexión. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  if (exito) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-10">
            <EgosLogo size="md" showSlogan />
          </div>
          <div className="bg-white rounded-2xl p-8 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <i className="fas fa-check text-emerald-600 text-2xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">¡Contraseña actualizada!</h2>
            <p className="text-gray-500 text-sm">Serás redirigido al inicio de sesión en unos segundos...</p>
            <Link
              to="/login"
              className="block w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors text-sm"
              style={{ color: '#c5a47e' }}
            >
              Ir al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!token && mensaje) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-10">
            <EgosLogo size="md" showSlogan />
          </div>
          <div className="bg-white rounded-2xl p-8 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <i className="fas fa-times text-red-500 text-2xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Enlace inválido</h2>
            <p className="text-gray-500 text-sm">{mensaje}</p>
            <Link
              to="/recuperar-contrasena"
              className="block w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors text-sm"
              style={{ color: '#c5a47e' }}
            >
              Solicitar nuevo enlace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-10">
          <EgosLogo size="md" showSlogan />
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-xl space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Nueva contraseña</h2>
            <p className="text-gray-500 text-sm mt-1">Crea una contraseña segura para tu cuenta</p>
          </div>

          <form onSubmit={manejarEnvio} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
              <div className="relative">
                <input
                  type={verPass ? 'text' : 'password'}
                  required
                  value={nuevaContrasena}
                  onChange={(e) => setNuevaContrasena(e.target.value)}
                  placeholder="Mín. 8 caracteres"
                  className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <button type="button" onClick={() => setVerPass(!verPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <i className={`fas ${verPass ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
              <div className="relative">
                <input
                  type={verConfirmar ? 'text' : 'password'}
                  required
                  value={confirmarContrasena}
                  onChange={(e) => setConfirmarContrasena(e.target.value)}
                  placeholder="Repite tu contraseña"
                  className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <button type="button" onClick={() => setVerConfirmar(!verConfirmar)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <i className={`fas ${verConfirmar ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                </button>
              </div>
            </div>

            {mensaje && (
              <p className="text-red-600 text-sm text-center">{mensaje}</p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm"
              style={{ color: '#c5a47e' }}
            >
              {cargando ? 'Guardando...' : 'Guardar nueva contraseña'}
            </button>
          </form>

          <div className="text-center">
            <Link to="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              ← Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
