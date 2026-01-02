import { useState } from 'react'
import { useNotificationStore } from '@/store/useNotificationStore'

interface ImageUploaderProps {
  productoId: string
  imagenActual?: string
  onUploadSuccess: (url: string) => void
}

export default function ImageUploader({ 
  productoId, 
  imagenActual,
  onUploadSuccess
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(imagenActual || null)
  const addNotification = useNotificationStore(state => state.addNotification)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      addNotification('Imagen muy grande (máximo 5MB)', 'error')
      return
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      addNotification('Solo se permiten imágenes', 'error')
      return
    }

    // Preview local
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    // Subir a Cloudinary vía backend
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('imagen', file)
      
      const response = await fetch(
        `http://localhost:3000/api/productos/${productoId}/imagen`,
        {
          method: 'POST',
          body: formData
        }
      )

      const data = await response.json()
      
      if (data.exito) {
        addNotification('Imagen subida exitosamente', 'success')
        onUploadSuccess(data.url)
      } else {
        throw new Error(data.mensaje || 'Error al subir imagen')
      }
    } catch (error) {
      console.error('Error:', error)
      addNotification('Error al subir imagen', 'error')
      setPreview(imagenActual || null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Imagen del Producto
      </label>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary transition-colors bg-gray-50">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
          id={`image-upload-${productoId}`}
        />
        
        <label
          htmlFor={`image-upload-${productoId}`}
          className="cursor-pointer flex flex-col items-center"
        >
          {preview ? (
            <div className="relative group">
              <img 
                src={preview} 
                alt="Preview" 
                className="w-48 h-48 object-cover rounded-lg shadow-md" 
              />
              {!uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center">
                  <i className="fas fa-camera text-white text-3xl opacity-0 group-hover:opacity-100"></i>
                </div>
              )}
            </div>
          ) : (
            <>
              <i className="fas fa-cloud-upload-alt text-5xl text-gray-400 mb-3"></i>
              <span className="text-gray-700 font-medium">Click para subir imagen</span>
              <span className="text-xs text-gray-500 mt-2">Máximo 5MB - JPG, PNG, WebP</span>
            </>
          )}
        </label>

        {uploading && (
          <div className="mt-4 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-gray-600 mt-3 font-medium">Subiendo a Cloudinary...</p>
            <p className="text-xs text-gray-500 mt-1">Optimizando imagen</p>
          </div>
        )}
      </div>

      {preview && !uploading && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center text-sm text-green-800">
          <i className="fas fa-check-circle mr-2"></i>
          <span>Imagen lista</span>
        </div>
      )}
    </div>
  )
}
