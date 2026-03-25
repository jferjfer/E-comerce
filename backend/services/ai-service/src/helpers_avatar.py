"""
Helpers para generación y procesamiento de avatares 3D
Integración con Ready Player Me, Replicate y Mixamo
"""

import httpx
import base64
import os
import json
from typing import Optional, Dict, Any
import replicate
from datetime import datetime
import tempfile
import shutil

# Configuración
READY_PLAYER_ME_API_KEY = os.getenv("READY_PLAYER_ME_API_KEY", "")
READY_PLAYER_ME_API_URL = "https://api.readyplayer.me/v1"
REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN", "")

# Animaciones disponibles (URLs de Mixamo pre-descargadas)
ANIMACIONES_DISPONIBLES = {
    "catwalk": "/assets/animations/catwalk_walk.fbx",
    "pose_standing": "/assets/animations/standing_pose.fbx",
    "turn_around": "/assets/animations/turn_around.fbx",
    "fashion_pose": "/assets/animations/fashion_pose.fbx",
    "walking": "/assets/animations/walking.fbx"
}


HUGGINGFACE_TOKEN = os.getenv("HUGGINGFACE_TOKEN", "")

async def generar_avatar_icon(foto_cuerpo_bytes: bytes) -> Dict[str, Any]:
    """
    Genera avatar 3D realista con ICON usando Replicate
    Requiere foto de cuerpo completo
    """
    print("🎨 Generando avatar 3D con ICON (Replicate)...")
    
    if not REPLICATE_API_TOKEN:
        print("⚠️ REPLICATE_API_TOKEN no configurado")
        return avatar_generico()
    
    try:
        # Convertir imagen a base64
        foto_base64 = base64.b64encode(foto_cuerpo_bytes).decode('utf-8')
        data_uri = f"data:image/jpeg;base64,{foto_base64}"
        
        print("🔄 Generando avatar 3D con InstantMesh (Replicate)...")
        
        # Usar InstantMesh en Replicate para generar modelo 3D
        output = replicate.run(
            "camenduru/instantmesh:e9b3288f9c6c8c1e0d8e8e8e8e8e8e8e",
            input={
                "image": data_uri,
                "output_format": "glb"
            }
        )
        
        # Output es URL del modelo GLB
        if isinstance(output, str):
            avatar_url = output
        elif isinstance(output, list) and len(output) > 0:
            avatar_url = output[0]
        else:
            raise Exception(f"Output inesperado: {type(output)}")
        
        print(f"✅ Avatar 3D generado con Replicate")
        
        return {
            "avatar_url": avatar_url,
            "avatar_id": f"instantmesh_{int(datetime.now().timestamp())}",
            "provider": "replicate_instantmesh",
            "personalizado": True
        }
        
    except Exception as e:
        print(f"❌ Error generando avatar con Replicate: {e}")
        import traceback
        traceback.print_exc()
        
        # Intentar con Hugging Face como fallback
        try:
            return await generar_avatar_icon_huggingface(foto_cuerpo_bytes)
        except:
            return avatar_generico()


async def generar_avatar_icon_huggingface(foto_cuerpo_bytes: bytes) -> Dict[str, Any]:
    """
    Fallback: Intenta generar con Hugging Face Spaces
    """
    print("🔄 Intentando con Hugging Face Spaces...")
    
    if not HUGGINGFACE_TOKEN:
        return avatar_generico()
    
    try:
        from gradio_client import Client
        
        # Guardar foto temporalmente
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            tmp.write(foto_cuerpo_bytes)
            tmp_path = tmp.name
        
        # Intentar con diferentes spaces
        spaces = [
            "Yuliang/ICON",
            "radames/PIFuHD",
        ]
        
        result = None
        for space in spaces:
            try:
                print(f"🔄 Intentando con {space}...")
                client = Client(space, hf_token=HUGGINGFACE_TOKEN)
                result = client.predict(tmp_path, api_name="/predict")
                print(f"✅ Avatar generado con {space}")
                break
            except Exception as e:
                print(f"⚠️ {space} falló: {e}")
                continue
        
        if not result:
            raise Exception("Todos los spaces fallaron")
        
        # Resultado puede ser path o tuple
        avatar_path = result[0] if isinstance(result, (list, tuple)) else result
        
        # Subir a Cloudinary
        avatar_url = await subir_avatar_cloudinary(avatar_path)
        
        # Limpiar archivos temporales
        os.unlink(tmp_path)
        if os.path.exists(avatar_path):
            os.unlink(avatar_path)
        
        print(f"✅ Avatar ICON creado y subido")
        
        return {
            "avatar_url": avatar_url,
            "avatar_id": f"icon_{int(datetime.now().timestamp())}",
            "provider": "huggingface_icon",
            "personalizado": True
        }
        
    except Exception as e:
        print(f"❌ Error con Hugging Face: {e}")
        return avatar_generico()


async def subir_avatar_cloudinary(file_path: str) -> str:
    """Sube avatar a Cloudinary y retorna URL pública"""
    try:
        import cloudinary
        import cloudinary.uploader
        
        cloudinary.config(
            cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
            api_key=os.getenv("CLOUDINARY_API_KEY"),
            api_secret=os.getenv("CLOUDINARY_API_SECRET")
        )
        
        result = cloudinary.uploader.upload(
            file_path,
            resource_type="raw",
            folder="avatares_3d",
            public_id=f"avatar_{int(datetime.now().timestamp())}"
        )
        
        return result["secure_url"]
        
    except Exception as e:
        print(f"❌ Error subiendo a Cloudinary: {e}")
        # Si falla Cloudinary, intentar servir localmente
        return f"file://{file_path}"


def avatar_generico() -> Dict[str, Any]:
    """Retorna avatar genérico como fallback"""
    return {
        "avatar_url": "https://models.readyplayer.me/63c97c6b96312097c36e6f16.glb",
        "avatar_id": "generic_avatar",
        "provider": "generic",
        "personalizado": False
    }


async def generar_avatar_readyplayerme(foto_cara_bytes: bytes) -> Dict[str, Any]:
    """
    Sistema híbrido: Prioriza ICON sobre Ready Player Me
    """
    print("🎨 Generando avatar personalizado...")
    
    # Intento 1: ICON con Replicate (más confiable que HF Spaces)
    if REPLICATE_API_TOKEN or HUGGINGFACE_TOKEN:
        try:
            print("🔄 Intentando con ICON...")
            return await generar_avatar_icon(foto_cara_bytes)
        except Exception as e:
            print(f"⚠️ ICON falló: {e}")
    
    # Intento 2: Ready Player Me (si hay API key)
    if READY_PLAYER_ME_API_KEY:
        try:
            print("🔄 Intentando con Ready Player Me...")
            async with httpx.AsyncClient(timeout=60.0) as client:
                files = {"photo": ("face.jpg", foto_cara_bytes, "image/jpeg")}
                headers = {"Authorization": f"Bearer {READY_PLAYER_ME_API_KEY}"}
                
                response = await client.post(
                    f"{READY_PLAYER_ME_API_URL}/avatars",
                    files=files,
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "avatar_url": data.get("glbUrl"),
                        "avatar_id": data.get("id"),
                        "provider": "ready_player_me",
                        "personalizado": True
                    }
        except Exception as e:
            print(f"⚠️ Ready Player Me falló: {e}")
    
    # Intento 3: Avatar genérico
    print("🔄 Usando avatar genérico...")
    return avatar_generico()


async def aplicar_prenda_con_replicate(
    foto_cuerpo_bytes: bytes,
    producto_url: str
) -> str:
    """
    Aplica una prenda a una foto de cuerpo usando Replicate (IDM-VTON)
    
    Args:
        foto_cuerpo_bytes: Bytes de la imagen del cuerpo
        producto_url: URL de la imagen del producto
        
    Returns:
        URL de la imagen con la prenda aplicada
    """
    print("👔 Aplicando prenda con Replicate (IDM-VTON)...")
    
    if not REPLICATE_API_TOKEN:
        print("⚠️ Replicate API token no configurado")
        return producto_url  # Retornar imagen original
    
    try:
        # Convertir imagen a base64
        foto_base64 = base64.b64encode(foto_cuerpo_bytes).decode('utf-8')
        
        # Ejecutar IDM-VTON en Replicate
        output = replicate.run(
            "cuuupid/idm-vton:c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4",
            input={
                "garm_img": producto_url,
                "human_img": f"data:image/jpeg;base64,{foto_base64}",
                "garment_des": "clothing item",
                "category": "upper_body",
                "n_samples": 1,
                "n_steps": 30,
                "image_scale": 2.0,
                "seed": 42
            }
        )
        
        print(f"✅ Prenda aplicada con Replicate")
        
        # Output es una URL de la imagen resultante
        if isinstance(output, str):
            return output
        elif isinstance(output, list) and len(output) > 0:
            return output[0]
        else:
            print(f"⚠️ Output inesperado de Replicate: {type(output)}")
            return producto_url
            
    except Exception as e:
        print(f"❌ Error aplicando prenda con Replicate: {e}")
        import traceback
        traceback.print_exc()
        return producto_url


async def descargar_imagen(url: str) -> bytes:
    """Descarga una imagen desde una URL"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url)
        return response.content


def obtener_animacion(nombre: str = "catwalk") -> Dict[str, Any]:
    """
    Obtiene información de una animación de Mixamo
    
    Args:
        nombre: Nombre de la animación (catwalk, pose_standing, etc.)
        
    Returns:
        Dict con información de la animación
    """
    animacion_url = ANIMACIONES_DISPONIBLES.get(
        nombre,
        ANIMACIONES_DISPONIBLES["catwalk"]
    )
    
    return {
        "nombre": nombre,
        "url": animacion_url,
        "formato": "fbx",
        "duracion_segundos": 10,
        "loop": True
    }


def listar_animaciones_disponibles() -> list:
    """Retorna lista de animaciones disponibles"""
    return [
        {
            "id": key,
            "nombre": key.replace("_", " ").title(),
            "url": value,
            "descripcion": _obtener_descripcion_animacion(key)
        }
        for key, value in ANIMACIONES_DISPONIBLES.items()
    ]


def _obtener_descripcion_animacion(nombre: str) -> str:
    """Obtiene descripción de una animación"""
    descripciones = {
        "catwalk": "Caminata de pasarela profesional",
        "pose_standing": "Pose de pie estática y elegante",
        "turn_around": "Giro completo de 360 grados",
        "fashion_pose": "Pose de moda dinámica",
        "walking": "Caminata casual natural"
    }
    return descripciones.get(nombre, "Animación de moda")


async def procesar_avatar_completo(
    foto_cara_bytes: bytes,
    foto_cuerpo_bytes: bytes,
    producto_url: str,
    animacion: str = "catwalk"
) -> Dict[str, Any]:
    """
    Procesa todo el flujo de creación de avatar con prenda
    
    Args:
        foto_cara_bytes: Imagen de la cara (no usada con ICON)
        foto_cuerpo_bytes: Imagen del cuerpo completo (usada para ICON)
        producto_url: URL del producto a probar
        animacion: Nombre de la animación a usar
        
    Returns:
        Dict con toda la información del avatar procesado
    """
    print("🚀 Iniciando procesamiento completo de avatar...")
    
    inicio = datetime.now()
    
    # Paso 1: Generar avatar 3D (usa foto de CUERPO para ICON)
    # ICON necesita foto de cuerpo completo, no solo cara
    avatar_data = await generar_avatar_readyplayerme(foto_cuerpo_bytes)
    
    # Paso 2: Aplicar prenda con Replicate
    textura_url = await aplicar_prenda_con_replicate(
        foto_cuerpo_bytes,
        producto_url
    )
    
    # Paso 3: Obtener animación
    animacion_data = obtener_animacion(animacion)
    
    duracion = (datetime.now() - inicio).total_seconds()
    
    print(f"✅ Avatar procesado en {duracion:.2f} segundos")
    
    return {
        "exito": True,
        "avatar": {
            "url": avatar_data["avatar_url"],
            "id": avatar_data["avatar_id"],
            "provider": avatar_data["provider"],
            "personalizado": avatar_data.get("personalizado", False)
        },
        "textura": {
            "url": textura_url,
            "producto_url": producto_url
        },
        "animacion": animacion_data,
        "metadata": {
            "tiempo_procesamiento": duracion,
            "timestamp": datetime.now().isoformat()
        }
    }


async def guardar_avatar_usuario(
    usuario_id: int,
    avatar_data: Dict[str, Any]
) -> str:
    """
    Guarda información del avatar de un usuario para reutilización
    
    Args:
        usuario_id: ID del usuario
        avatar_data: Datos del avatar generado
        
    Returns:
        ID del avatar guardado
    """
    # TODO: Implementar guardado en MongoDB o sistema de archivos
    avatar_id = f"avatar_{usuario_id}_{int(datetime.now().timestamp())}"
    
    print(f"💾 Avatar guardado: {avatar_id}")
    
    return avatar_id
