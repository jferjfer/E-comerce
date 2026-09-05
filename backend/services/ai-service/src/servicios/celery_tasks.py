"""
Sistema de queue con Celery para procesamiento asíncrono
"""
from celery import Celery
import os

# Configuración de Celery
celery_app = Celery(
    'ai_service',
    broker=os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('REDIS_URL', 'redis://localhost:6379/0')
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='America/Bogota',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutos
    task_soft_time_limit=240,  # 4 minutos
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=50,
)

@celery_app.task(name='ai_service.procesar_virtual_tryon', bind=True)
def procesar_virtual_tryon_task(self, foto_bytes: bytes, producto_url: str, usuario_id: str):
    """
    Tarea asíncrona para procesar Virtual Try-On
    """
    from helpers_avatar import aplicar_prenda_con_replicate
    import asyncio
    import base64
    
    try:
        # Actualizar progreso
        self.update_state(state='PROCESSING', meta={'progress': 10, 'status': 'Iniciando...'})
        
        # Procesar imagen
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        self.update_state(state='PROCESSING', meta={'progress': 50, 'status': 'Aplicando prenda...'})
        
        resultado_url = loop.run_until_complete(
            aplicar_prenda_con_replicate(foto_bytes, producto_url)
        )
        
        self.update_state(state='PROCESSING', meta={'progress': 90, 'status': 'Finalizando...'})
        
        return {
            'status': 'completed',
            'resultado_url': resultado_url,
            'usuario_id': usuario_id
        }
        
    except Exception as e:
        return {
            'status': 'failed',
            'error': str(e),
            'usuario_id': usuario_id
        }

@celery_app.task(name='ai_service.generar_avatar_3d', bind=True)
def generar_avatar_3d_task(
    self,
    foto_cara_bytes: bytes,
    foto_cuerpo_bytes: bytes,
    producto_url: str,
    animacion: str,
    usuario_id: str
):
    """
    Tarea asíncrona para generar avatar 3D completo
    """
    from helpers_avatar import procesar_avatar_completo
    import asyncio
    
    try:
        self.update_state(state='PROCESSING', meta={'progress': 10, 'status': 'Generando avatar...'})
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        self.update_state(state='PROCESSING', meta={'progress': 40, 'status': 'Aplicando prenda...'})
        
        resultado = loop.run_until_complete(
            procesar_avatar_completo(
                foto_cara_bytes,
                foto_cuerpo_bytes,
                producto_url,
                animacion
            )
        )
        
        self.update_state(state='PROCESSING', meta={'progress': 90, 'status': 'Finalizando...'})
        
        resultado['usuario_id'] = usuario_id
        resultado['status'] = 'completed'
        
        return resultado
        
    except Exception as e:
        return {
            'status': 'failed',
            'error': str(e),
            'usuario_id': usuario_id
        }

@celery_app.task(name='ai_service.actualizar_embeddings')
def actualizar_embeddings_task():
    """
    Tarea periódica para actualizar embeddings de productos
    """
    from servicios.embedding_recommender import recommender
    from motor.motor_asyncio import AsyncIOMotorClient
    import asyncio
    import os
    
    try:
        # Conectar a MongoDB
        mongodb_uri = os.getenv('MONGODB_CATALOG_URI')
        client = AsyncIOMotorClient(mongodb_uri)
        db = client['catalogo']
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        # Obtener productos
        productos = loop.run_until_complete(
            db.productos.find({}).to_list(length=1000)
        )
        
        # Generar embeddings
        recommender.load_model()
        recommender.encode_products(productos)
        
        client.close()
        
        return {
            'status': 'completed',
            'productos_procesados': len(productos)
        }
        
    except Exception as e:
        return {
            'status': 'failed',
            'error': str(e)
        }

# Configurar tareas periódicas
celery_app.conf.beat_schedule = {
    'actualizar-embeddings-cada-hora': {
        'task': 'ai_service.actualizar_embeddings',
        'schedule': 3600.0,  # Cada hora
    },
}
