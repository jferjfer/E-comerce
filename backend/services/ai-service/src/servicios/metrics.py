"""
Sistema de monitoring y métricas con Prometheus
"""
from prometheus_client import Counter, Histogram, Gauge, generate_latest, REGISTRY
from functools import wraps
import time
from typing import Callable

# Métricas de requests
request_count = Counter(
    'ai_service_requests_total',
    'Total de requests al AI Service',
    ['endpoint', 'method', 'status']
)

request_duration = Histogram(
    'ai_service_request_duration_seconds',
    'Duración de requests',
    ['endpoint', 'method']
)

# Métricas de IA
ai_chat_requests = Counter(
    'ai_chat_requests_total',
    'Total de requests al chat IA',
    ['status']
)

ai_chat_tokens = Counter(
    'ai_chat_tokens_total',
    'Total de tokens usados en chat',
    ['type']  # input, output
)

ai_chat_duration = Histogram(
    'ai_chat_duration_seconds',
    'Duración de requests al chat IA'
)

# Métricas de recomendaciones
recommendation_requests = Counter(
    'recommendation_requests_total',
    'Total de requests de recomendaciones',
    ['type']  # personalizada, basica, tendencias
)

recommendation_accuracy = Gauge(
    'recommendation_accuracy',
    'Precisión de recomendaciones (0-1)'
)

# Métricas de Virtual Try-On
tryon_requests = Counter(
    'virtual_tryon_requests_total',
    'Total de requests de Virtual Try-On',
    ['provider', 'status']  # replicate, local, huggingface
)

tryon_duration = Histogram(
    'virtual_tryon_duration_seconds',
    'Duración de procesamiento Virtual Try-On',
    ['provider']
)

# Métricas de Avatar 3D
avatar_requests = Counter(
    'avatar_3d_requests_total',
    'Total de requests de Avatar 3D',
    ['provider', 'status']
)

avatar_duration = Histogram(
    'avatar_3d_duration_seconds',
    'Duración de generación de Avatar 3D',
    ['provider']
)

# Métricas de caché
cache_hits = Counter(
    'cache_hits_total',
    'Total de cache hits',
    ['cache_type']  # redis, memory
)

cache_misses = Counter(
    'cache_misses_total',
    'Total de cache misses',
    ['cache_type']
)

# Métricas de base de datos
db_query_duration = Histogram(
    'db_query_duration_seconds',
    'Duración de queries a base de datos',
    ['database', 'operation']  # mongodb, postgres
)

db_connection_pool = Gauge(
    'db_connection_pool_size',
    'Tamaño del pool de conexiones',
    ['database']
)

# Métricas de costos
api_cost = Counter(
    'api_cost_usd',
    'Costo acumulado de APIs externas',
    ['provider']  # deepseek, replicate, huggingface
)

# Decoradores para tracking automático

def track_request(endpoint: str):
    """Decorator para trackear requests HTTP"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            status = 'success'
            
            try:
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                status = 'error'
                raise
            finally:
                duration = time.time() - start_time
                request_count.labels(
                    endpoint=endpoint,
                    method='POST',
                    status=status
                ).inc()
                request_duration.labels(
                    endpoint=endpoint,
                    method='POST'
                ).observe(duration)
        
        return wrapper
    return decorator

def track_ai_chat():
    """Decorator para trackear chat IA"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            status = 'success'
            
            try:
                result = await func(*args, **kwargs)
                
                # Trackear tokens si están disponibles
                if isinstance(result, dict):
                    if 'usage' in result:
                        ai_chat_tokens.labels(type='input').inc(
                            result['usage'].get('prompt_tokens', 0)
                        )
                        ai_chat_tokens.labels(type='output').inc(
                            result['usage'].get('completion_tokens', 0)
                        )
                
                return result
            except Exception as e:
                status = 'error'
                raise
            finally:
                duration = time.time() - start_time
                ai_chat_requests.labels(status=status).inc()
                ai_chat_duration.observe(duration)
        
        return wrapper
    return decorator

def track_tryon(provider: str):
    """Decorator para trackear Virtual Try-On"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            status = 'success'
            
            try:
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                status = 'error'
                raise
            finally:
                duration = time.time() - start_time
                tryon_requests.labels(
                    provider=provider,
                    status=status
                ).inc()
                tryon_duration.labels(provider=provider).observe(duration)
        
        return wrapper
    return decorator

def track_cache(cache_type: str = 'redis'):
    """Decorator para trackear uso de caché"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)
            
            if result is not None:
                cache_hits.labels(cache_type=cache_type).inc()
            else:
                cache_misses.labels(cache_type=cache_type).inc()
            
            return result
        
        return wrapper
    return decorator

def track_db_query(database: str, operation: str):
    """Decorator para trackear queries a BD"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            
            try:
                result = await func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start_time
                db_query_duration.labels(
                    database=database,
                    operation=operation
                ).observe(duration)
        
        return wrapper
    return decorator

def track_api_cost(provider: str, cost_per_request: float):
    """Trackear costo de API externa"""
    api_cost.labels(provider=provider).inc(cost_per_request)

def get_metrics():
    """Obtener métricas en formato Prometheus"""
    return generate_latest(REGISTRY)

# Funciones helper para actualizar métricas

def update_recommendation_accuracy(accuracy: float):
    """Actualizar métrica de precisión de recomendaciones"""
    recommendation_accuracy.set(accuracy)

def update_db_pool_size(database: str, size: int):
    """Actualizar tamaño del pool de conexiones"""
    db_connection_pool.labels(database=database).set(size)
