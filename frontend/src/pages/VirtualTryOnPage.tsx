import { API_URL } from '@/config/api';
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import VirtualAvatar3D from '@/components/VirtualAvatar3D'
import { useAuthStore } from '@/store/useAuthStore'


interface AvatarData {
    avatar_url: string
    avatar_id: string
    textura_url: string
    avatar?: {
        url: string
        id: string
        provider: string
        personalizado: boolean
    }
    animacion: {
        nombre: string
        url: string
        duracion_segundos: number
    }
    metadata: {
        tiempo_procesamiento: number
        timestamp: string
    }
}

export default function VirtualTryOnPage() {
    const { token } = useAuthStore()
    const location = useLocation()
    const [fotoCara, setFotoCara] = useState<File | null>(null)
    const [fotoCuerpo, setFotoCuerpo] = useState<File | null>(null)
    const [productoUrl, setProductoUrl] = useState(location.state?.productUrl || '')
    const [avatarData, setAvatarData] = useState<AvatarData | null>(null)
    const [cargando, setCargando] = useState(false)
    const [progreso, setProgreso] = useState(0)
    const [modoDemo, setModoDemo] = useState(false)
    const [previewCara, setPreviewCara] = useState<string>('')
    const [previewCuerpo, setPreviewCuerpo] = useState<string>('')

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        tipo: 'cara' | 'cuerpo'
    ) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validar que sea imagen
        if (!file.type.startsWith('image/')) {
            alert('Por favor selecciona una imagen válida')
            return
        }

        // Validar tamaño (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('La imagen es muy grande. Máximo 10MB')
            return
        }

        // Crear preview
        const reader = new FileReader()
        reader.onload = (event) => {
            const preview = event.target?.result as string
            if (tipo === 'cara') {
                setFotoCara(file)
                setPreviewCara(preview)
            } else {
                setFotoCuerpo(file)
                setPreviewCuerpo(preview)
            }
        }
        reader.readAsDataURL(file)
    }

    const handleCrearAvatar = async () => {
        if (!fotoCara || !fotoCuerpo || !productoUrl) {
            alert('Por favor completa todos los campos')
            return
        }

        setCargando(true)
        setProgreso(0)

        try {
            const formData = new FormData()
            formData.append('foto_cara', fotoCara)
            formData.append('foto_cuerpo', fotoCuerpo)
            formData.append('producto_url', productoUrl)
            formData.append('animacion', 'catwalk')

            // Simular progreso
            const interval = setInterval(() => {
                setProgreso(prev => Math.min(prev + 10, 90))
            }, 3000)

            const response = await fetch(`${API_URL}/api/avatar/crear`, {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                body: formData
            })

            clearInterval(interval)
            setProgreso(100)

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.detail || 'Error creando avatar')
            }

            const data = await response.json()
            setAvatarData(data)

        } catch (error) {
            console.error('Error:', error)
            alert(error instanceof Error ? error.message : 'Error creando avatar')
        } finally {
            setCargando(false)
            setProgreso(0)
        }
    }

    const handleCrearDemo = async () => {
        if (!productoUrl) {
            alert('Por favor ingresa la URL del producto')
            return
        }

        setCargando(true)

        try {
            const response = await fetch(`${API_URL}/api/avatar/demo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ producto_url: productoUrl })
            })

            if (!response.ok) {
                throw new Error('Error creando avatar demo')
            }

            const data = await response.json()
            setAvatarData(data)

        } catch (error) {
            console.error('Error:', error)
            alert('Error creando avatar demo')
        } finally {
            setCargando(false)
        }
    }

    const handleExportar = () => {
        // TODO: Implementar captura de screenshot o video
        alert('Función de exportación en desarrollo')
    }

    const handleReset = () => {
        setAvatarData(null)
        setFotoCara(null)
        setFotoCuerpo(null)
        setProductoUrl('')
        setPreviewCara('')
        setPreviewCuerpo('')
        setModoDemo(false)
    }

    if (avatarData) {
        return (
            <div className="relative">
                <VirtualAvatar3D
                    avatarUrl={avatarData.avatar_url}
                    texturaUrl={avatarData.textura_url}
                    onExportar={handleExportar}
                />

                {/* Botón volver */}
                <button
                    onClick={handleReset}
                    className="absolute top-6 left-6 bg-black/50 hover:bg-black/70 px-6 py-3 rounded-lg backdrop-blur-sm transition-all z-20"
                >
                    ← Volver
                </button>

                {/* Info del avatar */}
                <div className="absolute top-6 right-6 bg-black/50 px-6 py-4 rounded-lg backdrop-blur-sm max-w-sm z-20">
                    <h3 className="font-bold text-lg mb-2">✨ Avatar Creado</h3>
                    <p className="text-sm text-gray-300 mb-1">
                        ID: {avatarData.avatar_id}
                    </p>
                    <p className="text-sm text-gray-300 mb-1">
                        Animación: {avatarData.animacion.nombre}
                    </p>
                    {avatarData.avatar && avatarData.avatar.personalizado && (
                        <p className="text-sm text-green-400 mb-1">
                            🎭 Avatar Personalizado
                        </p>
                    )}
                    {avatarData.avatar && avatarData.avatar.provider && (
                        <p className="text-xs text-gray-500 mb-1">
                            Proveedor: {avatarData.avatar.provider}
                        </p>
                    )}
                    {avatarData.metadata && (
                        <p className="text-sm text-gray-400">
                            Procesado en {avatarData.metadata.tiempo_procesamiento.toFixed(1)}s
                        </p>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white py-20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        🎨 Probador Virtual 3D
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        Crea tu avatar 3D realista y ve cómo te queda la prenda con animaciones de pasarela
                    </p>
                </div>

                {/* Toggle Modo */}
                <div className="flex justify-center mb-8">
                    <div className="bg-gray-800 p-1 rounded-lg inline-flex">
                        <button
                            onClick={() => setModoDemo(false)}
                            className={`px-6 py-2 rounded-md transition-all ${!modoDemo
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            👤 Avatar Personalizado
                        </button>
                        <button
                            onClick={() => setModoDemo(true)}
                            className={`px-6 py-2 rounded-md transition-all ${modoDemo
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            🎭 Demo Rápido
                        </button>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto">
                    {!modoDemo ? (
                        // Modo Personalizado
                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            {/* Upload Foto Cara */}
                            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                                <label className="block mb-3 font-semibold text-lg">
                                    📸 Foto de tu Cara
                                </label>
                                <p className="text-sm text-gray-400 mb-4">
                                    Foto frontal, bien iluminada, mirando a la cámara
                                </p>

                                {previewCara ? (
                                    <div className="relative">
                                        <img
                                            src={previewCara}
                                            alt="Preview cara"
                                            className="w-full h-64 object-cover rounded-lg mb-4"
                                        />
                                        <button
                                            onClick={() => {
                                                setFotoCara(null)
                                                setPreviewCara('')
                                            }}
                                            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                                        >
                                            ✕ Cambiar
                                        </button>
                                    </div>
                                ) : (
                                    <label className="block">
                                        <div className="border-2 border-dashed border-gray-600 hover:border-purple-500 rounded-lg p-8 text-center cursor-pointer transition-all">
                                            <div className="text-4xl mb-2">📷</div>
                                            <p className="text-gray-400">Click para subir</p>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'cara')}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>

                            {/* Upload Foto Cuerpo */}
                            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                                <label className="block mb-3 font-semibold text-lg">
                                    🧍 Foto de Cuerpo Completo
                                </label>
                                <p className="text-sm text-gray-400 mb-4">
                                    De pie, cuerpo completo visible, fondo neutro
                                </p>

                                {previewCuerpo ? (
                                    <div className="relative">
                                        <img
                                            src={previewCuerpo}
                                            alt="Preview cuerpo"
                                            className="w-full h-64 object-cover rounded-lg mb-4"
                                        />
                                        <button
                                            onClick={() => {
                                                setFotoCuerpo(null)
                                                setPreviewCuerpo('')
                                            }}
                                            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                                        >
                                            ✕ Cambiar
                                        </button>
                                    </div>
                                ) : (
                                    <label className="block">
                                        <div className="border-2 border-dashed border-gray-600 hover:border-purple-500 rounded-lg p-8 text-center cursor-pointer transition-all">
                                            <div className="text-4xl mb-2">📷</div>
                                            <p className="text-gray-400">Click para subir</p>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'cuerpo')}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                        </div>
                    ) : (
                        // Modo Demo
                        <div className="bg-gradient-to-r from-purple-800/30 to-pink-800/30 p-8 rounded-xl border border-purple-500/50 mb-8">
                            <h3 className="text-2xl font-bold mb-4">🎭 Modo Demo</h3>
                            <p className="text-gray-300 mb-4">
                                Prueba el sistema sin subir tus fotos. Usaremos un avatar predefinido.
                            </p>
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                                <p className="text-yellow-300 text-sm">
                                    💡 Para una experiencia personalizada, usa el modo "Avatar Personalizado"
                                </p>
                            </div>
                        </div>
                    )}

                    {/* URL del Producto */}
                    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 mb-8">
                        <label className="block mb-3 font-semibold text-lg">
                            👔 Producto a Probar
                        </label>
                        <input
                            type="url"
                            placeholder="https://ejemplo.com/imagen-producto.jpg"
                            value={productoUrl}
                            onChange={(e) => setProductoUrl(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-all"
                        />
                        <p className="text-sm text-gray-400 mt-2">
                            Pega la URL de la imagen del producto que quieres probar
                        </p>
                    </div>

                    {/* Botón Crear */}
                    <button
                        onClick={modoDemo ? handleCrearDemo : handleCrearAvatar}
                        disabled={cargando || (!modoDemo && (!fotoCara || !fotoCuerpo || !productoUrl)) || (modoDemo && !productoUrl)}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-4 rounded-xl text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-purple-500/50"
                    >
                        {cargando ? (
                            <span className="flex items-center justify-center gap-3">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                {progreso > 0 ? `Procesando... ${progreso}%` : 'Creando avatar...'}
                            </span>
                        ) : (
                            `✨ Crear Avatar ${modoDemo ? 'Demo' : '3D'}`
                        )}
                    </button>

                    {/* Info adicional */}
                    <div className="mt-8 grid md:grid-cols-3 gap-4 text-center">
                        <div className="bg-gray-800/30 p-4 rounded-lg">
                            <div className="text-3xl mb-2">⚡</div>
                            <p className="text-sm text-gray-400">Procesamiento rápido</p>
                            <p className="text-xs text-gray-500">2-3 minutos</p>
                        </div>
                        <div className="bg-gray-800/30 p-4 rounded-lg">
                            <div className="text-3xl mb-2">🎬</div>
                            <p className="text-sm text-gray-400">Animación realista</p>
                            <p className="text-xs text-gray-500">Pasarela profesional</p>
                        </div>
                        <div className="bg-gray-800/30 p-4 rounded-lg">
                            <div className="text-3xl mb-2">🔄</div>
                            <p className="text-sm text-gray-400">Vista 360°</p>
                            <p className="text-xs text-gray-500">Rotar y hacer zoom</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
