import { API_URL } from '@/config/api';
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNotificationStore } from '@/store/useNotificationStore'

const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === '149.130.182.9' 
  ? 'http://149.130.182.9:3000' 
  : API_URL

interface ARModalProps {
  isOpen: boolean
  onClose: () => void
  productName: string
  productImage: string
}

export default function ARModal({ isOpen, onClose, productName, productImage }: ARModalProps) {
  const [cameraActive, setCameraActive] = useState(false)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { addNotification } = useNotificationStore()

  useEffect(() => {
    console.log('🎥 ARModal useEffect - isOpen:', isOpen, 'cameraActive:', cameraActive, 'resultImage:', resultImage)
    if (isOpen && !cameraActive && !resultImage) {
      console.log('🎥 Esperando 500ms para que el DOM se monte...')
      const timer = setTimeout(() => {
        console.log('🎥 Verificando videoRef:', videoRef.current)
        if (videoRef.current) {
          console.log('🎥 Video existe, ejecutando startCamera...')
          startCamera()
        } else {
          console.error('🎥 Video aún es null, reintentando en 500ms...')
          setTimeout(() => {
            if (videoRef.current) {
              startCamera()
            } else {
              console.error('🎥 Video sigue siendo null después de 1 segundo')
            }
          }, 500)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
    
    return () => {
      if (cameraActive) {
        console.log('🎥 Limpieza: deteniendo cámara')
        stopCamera()
      }
    }
  }, [isOpen])

  const startCamera = async () => {
    console.log('📷 startCamera llamado')
    console.log('📷 videoRef.current:', videoRef.current)
    try {
      console.log('📷 Solicitando getUserMedia...')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      })
      console.log('📷 Stream obtenido:', stream)
      
      if (videoRef.current) {
        console.log('📷 Asignando stream al video...')
        videoRef.current.srcObject = stream
        console.log('📷 Llamando a play()...')
        await videoRef.current.play()
        console.log('📷 Video reproduciendo')
        setCameraActive(true)
        console.log('📷 ✅ Cámara activada exitosamente')
      } else {
        console.error('📷 ❌ videoRef.current es NULL')
      }
    } catch (error: any) {
      console.error('📷 ❌ ERROR:', error)
      addNotification('No se pudo acceder a la cámara: ' + error.message, 'error')
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      setCameraActive(false)
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0)
      canvas.toBlob(blob => {
        if (blob) processTryOn(blob)
      }, 'image/jpeg', 0.95)
    }
  }

  const processTryOn = async (imageBlob: Blob) => {
    setIsProcessing(true)
    addNotification('Procesando prueba virtual...', 'info')

    try {
      const formData = new FormData()
      formData.append('person_image', imageBlob, 'photo.jpg')
      formData.append('product_image_url', productImage)

      const response = await fetch(`${API_BASE_URL}/api/virtual-tryon`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.exito) {
        setResultImage(data.imagen_resultado)
        addNotification('¡Prueba virtual completada!', 'success')
        stopCamera()
      } else {
        throw new Error(data.mensaje || 'Error al procesar')
      }
    } catch (error) {
      addNotification('Error al procesar la imagen', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    stopCamera()
    setResultImage(null)
    setCameraActive(false)
    onClose()
  }

  const resetCamera = () => {
    setResultImage(null)
    startCamera()
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-2xl font-bold">🎨 Probador Virtual - {productName}</h3>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!resultImage ? (
            <>
              {/* Video Container */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                {/* Video siempre renderizado pero oculto si no está activo */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ 
                    transform: 'scaleX(-1)',
                    display: cameraActive ? 'block' : 'none'
                  }}
                />
                
                {cameraActive && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded text-sm animate-pulse">
                    <i className="fas fa-circle mr-2"></i>CÁMARA ACTIVA
                  </div>
                )}
                
                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-lg">Iniciando cámara...</p>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Posiciónate frente a la cámara y captura tu foto para probarte el producto
                </p>
                <button
                  onClick={capturePhoto}
                  disabled={!cameraActive || isProcessing}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
                >
                  {isProcessing ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Procesando... (30-60s)
                    </>
                  ) : (
                    <>
                      <i className="fas fa-camera mr-2"></i>
                      Capturar y Probar
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Result */}
              <div className="text-center">
                <p className="text-2xl font-semibold mb-4 text-green-600">
                  ✨ ¡Así te queda {productName}!
                </p>
                <img src={resultImage} alt="Resultado" className="w-full max-h-96 object-contain rounded-lg mx-auto" />
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    const a = document.createElement('a')
                    a.href = resultImage
                    a.download = `virtual-tryon-${productName}.png`
                    a.click()
                  }}
                  className="flex-1 bg-primary text-white py-3 rounded-lg hover:bg-secondary transition-colors text-lg font-semibold"
                >
                  <i className="fas fa-download mr-2"></i>
                  Descargar
                </button>
                <button
                  onClick={resetCamera}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors text-lg font-semibold"
                >
                  <i className="fas fa-redo mr-2"></i>
                  Tomar Otra Foto
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>,
    document.body
  )
}
