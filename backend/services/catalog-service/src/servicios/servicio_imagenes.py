import cloudinary.uploader
from PIL import Image
import io
import time

async def subir_imagen_producto(archivo_bytes: bytes, producto_id: str) -> str:
    """
    Sube imagen a Cloudinary, la optimiza y retorna URL
    
    Args:
        archivo_bytes: Bytes de la imagen
        producto_id: ID del producto
        
    Returns:
        URL segura de Cloudinary
    """
    try:
        print(f"📸 Subiendo imagen para producto {producto_id}...")
        
        # Comprimir imagen antes de subir
        imagen = Image.open(io.BytesIO(archivo_bytes))
        
        # Redimensionar si es muy grande (máximo 1200x1200)
        max_size = (1200, 1200)
        if imagen.size[0] > max_size[0] or imagen.size[1] > max_size[1]:
            imagen.thumbnail(max_size, Image.Resampling.LANCZOS)
            print(f"  ↓ Redimensionada a {imagen.size}")
        
        # Convertir a RGB si es necesario (para JPEG)
        if imagen.mode in ('RGBA', 'LA', 'P'):
            imagen = imagen.convert('RGB')
        
        # Guardar en buffer con compresión
        buffer = io.BytesIO()
        imagen.save(buffer, format='JPEG', quality=85, optimize=True)
        buffer.seek(0)
        
        # Subir a Cloudinary con transformaciones
        resultado = cloudinary.uploader.upload(
            buffer,
            folder="estilo-moda/productos",
            public_id=f"{producto_id}_{int(time.time())}",
            resource_type="image",
            transformation=[
                {'width': 800, 'height': 800, 'crop': 'limit'},
                {'quality': 'auto:good'},
                {'fetch_format': 'auto'}  # WebP automático en navegadores compatibles
            ]
        )
        
        url = resultado['secure_url']
        print(f"✅ Imagen subida: {url}")
        
        return url
        
    except Exception as e:
        print(f"❌ Error subiendo imagen: {e}")
        raise Exception(f"Error al subir imagen: {str(e)}")


async def subir_multiples_imagenes(archivos_bytes: list, producto_id: str) -> list:
    """
    Sube múltiples imágenes para un producto
    
    Args:
        archivos_bytes: Lista de bytes de imágenes
        producto_id: ID del producto
        
    Returns:
        Lista de URLs de Cloudinary
    """
    urls = []
    
    for i, archivo in enumerate(archivos_bytes):
        try:
            url = await subir_imagen_producto(archivo, f"{producto_id}_img{i+1}")
            urls.append(url)
        except Exception as e:
            print(f"⚠️ Error subiendo imagen {i+1}: {e}")
            continue
    
    return urls


def eliminar_imagen_cloudinary(url: str) -> bool:
    """
    Elimina una imagen de Cloudinary usando su URL
    
    Args:
        url: URL de la imagen en Cloudinary
        
    Returns:
        True si se eliminó correctamente
    """
    try:
        # Extraer public_id de la URL
        # Ejemplo: https://res.cloudinary.com/dhwk5p0wn/image/upload/v123/estilo-moda/productos/prod_123.jpg
        partes = url.split('/')
        public_id = '/'.join(partes[-3:]).replace('.jpg', '').replace('.png', '')
        
        resultado = cloudinary.uploader.destroy(public_id)
        print(f"🗑️ Imagen eliminada: {public_id}")
        
        return resultado.get('result') == 'ok'
        
    except Exception as e:
        print(f"❌ Error eliminando imagen: {e}")
        return False
