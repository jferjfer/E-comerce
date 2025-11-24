import { useState, useRef, useEffect } from 'react'
import Modal from './Modal'

interface ARModalProps {
  isOpen: boolean
  onClose: () => void
  productName: string
  productImage: string
}

export default function ARModal({ isOpen, onClose, productName, productImage }: ARModalProps) {
  const [cameraActive, setCameraActive] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (isOpen && !cameraActive) {
      startCamera()
    }
    
    return () => {
      stopCamera()
    }
  }, [isOpen])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('No se pudo acceder a la cámara. Verifica los permisos.')
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

    setIsCapturing(true)
    const canvas = canvasRef.current
    const video = videoRef.current
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0)
      
      // Simular overlay del producto
      const img = new Image()
      img.onload = () => {
        ctx.globalAlpha = 0.7
        ctx.drawImage(img, canvas.width * 0.3, canvas.height * 0.4, canvas.width * 0.4, canvas.height * 0.5)
        
        // Descargar imagen
        canvas.toBlob(blob => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `ar-try-on-${productName}.jpg`
            a.click()
            URL.revokeObjectURL(url)
          }
        })
      }
      img.src = productImage
    }
    
    setTimeout(() => setIsCapturing(false), 1000)
  }

  const sharePhoto = () => {
    if (navigator.share) {
      navigator.share({
        title: `Probando ${productName}`,
        text: `¡Mira cómo me queda este ${productName} de StyleHub!`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Enlace copiado al portapapeles')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Probador Virtual AR" size="lg">
      <div className="space-y-4">
        <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ height: '400px' }}>
          {cameraActive ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
              
              {/* Overlay del producto */}
              <div className="absolute inset-0 pointer-events-none">
                <img
                  src={productImage}
                  alt={productName}
                  className="absolute top-1/3 left-1/3 w-1/3 h-1/2 object-contain opacity-60 mix-blend-multiply"
                />
              </div>
              
              {/* Indicador de grabación */}
              <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded text-sm animate-pulse">
                <i className="fas fa-circle mr-1"></i>AR ACTIVO
              </div>
              
              {/* Controles */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black bg-opacity-50 text-white p-3 rounded backdrop-blur-sm">
                  <p className="text-sm mb-3">Cámara AR Activada - Probando {productName}</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={capturePhoto}
                      disabled={isCapturing}
                      className="bg-white text-black px-4 py-2 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
                    >
                      <i className="fas fa-camera mr-1"></i>
                      {isCapturing ? 'Capturando...' : 'Capturar'}
                    </button>
                    <button
                      onClick={sharePhoto}
                      className="bg-primary text-white px-4 py-2 rounded text-sm hover:bg-secondary"
                    >
                      <i className="fas fa-share mr-1"></i>Compartir
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="mb-2">Iniciando cámara...</p>
                <p className="text-sm opacity-75">Preparando realidad aumentada para {productName}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Mueve tu dispositivo para ver cómo te queda {productName}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Asegúrate de estar en un lugar bien iluminado para mejores resultados
          </p>
        </div>
      </div>
      
      {/* Canvas oculto para captura */}
      <canvas ref={canvasRef} className="hidden" />
    </Modal>
  )
}