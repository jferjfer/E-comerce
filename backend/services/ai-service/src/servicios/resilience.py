"""
Circuit Breaker y Retry Logic para APIs externas
Mejora la resiliencia del sistema
"""
from pybreaker import CircuitBreaker, CircuitBreakerError
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)
import httpx
from typing import Optional, Callable, Any
import asyncio
from functools import wraps

# Circuit Breakers para diferentes servicios
deepseek_breaker = CircuitBreaker(
    fail_max=5,
    timeout_duration=60,
    name='deepseek_api'
)

replicate_breaker = CircuitBreaker(
    fail_max=3,
    timeout_duration=120,
    name='replicate_api'
)

huggingface_breaker = CircuitBreaker(
    fail_max=3,
    timeout_duration=120,
    name='huggingface_api'
)

marketing_breaker = CircuitBreaker(
    fail_max=5,
    timeout_duration=30,
    name='marketing_service'
)

# Decorador de retry con exponential backoff
def retry_with_backoff(
    max_attempts: int = 3,
    min_wait: int = 1,
    max_wait: int = 10
):
    """
    Decorator para retry con exponential backoff
    """
    return retry(
        stop=stop_after_attempt(max_attempts),
        wait=wait_exponential(multiplier=1, min=min_wait, max=max_wait),
        retry=retry_if_exception_type((httpx.HTTPError, asyncio.TimeoutError)),
        reraise=True
    )

class ResilientAPIClient:
    """Cliente HTTP resiliente con circuit breaker y retry"""
    
    def __init__(
        self,
        breaker: CircuitBreaker,
        timeout: int = 30,
        max_retries: int = 3
    ):
        self.breaker = breaker
        self.timeout = timeout
        self.max_retries = max_retries
    
    @retry_with_backoff(max_attempts=3)
    async def get(self, url: str, **kwargs) -> httpx.Response:
        """GET request con circuit breaker y retry"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await self.breaker.call_async(
                    client.get,
                    url,
                    **kwargs
                )
                response.raise_for_status()
                return response
        except CircuitBreakerError:
            print(f"⚠️ Circuit breaker abierto para {self.breaker.name}")
            raise
        except Exception as e:
            print(f"❌ Error en GET {url}: {e}")
            raise
    
    @retry_with_backoff(max_attempts=3)
    async def post(self, url: str, **kwargs) -> httpx.Response:
        """POST request con circuit breaker y retry"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await self.breaker.call_async(
                    client.post,
                    url,
                    **kwargs
                )
                response.raise_for_status()
                return response
        except CircuitBreakerError:
            print(f"⚠️ Circuit breaker abierto para {self.breaker.name}")
            raise
        except Exception as e:
            print(f"❌ Error en POST {url}: {e}")
            raise

# Clientes pre-configurados
deepseek_client = ResilientAPIClient(
    breaker=deepseek_breaker,
    timeout=30,
    max_retries=3
)

replicate_client = ResilientAPIClient(
    breaker=replicate_breaker,
    timeout=180,
    max_retries=2
)

huggingface_client = ResilientAPIClient(
    breaker=huggingface_breaker,
    timeout=120,
    max_retries=2
)

marketing_client = ResilientAPIClient(
    breaker=marketing_breaker,
    timeout=5,
    max_retries=3
)

# Decorador para funciones con fallback
def with_fallback(fallback_func: Callable):
    """
    Decorator que ejecuta función fallback si la principal falla
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                print(f"⚠️ Función principal falló: {e}")
                print(f"🔄 Ejecutando fallback...")
                return await fallback_func(*args, **kwargs)
        
        return wrapper
    return decorator

# Funciones helper

async def call_with_timeout(
    func: Callable,
    timeout: float,
    *args,
    **kwargs
) -> Optional[Any]:
    """
    Ejecutar función con timeout
    """
    try:
        return await asyncio.wait_for(
            func(*args, **kwargs),
            timeout=timeout
        )
    except asyncio.TimeoutError:
        print(f"⏱️ Timeout ejecutando {func.__name__}")
        return None
    except Exception as e:
        print(f"❌ Error ejecutando {func.__name__}: {e}")
        return None

def get_breaker_stats():
    """Obtener estadísticas de circuit breakers"""
    breakers = [
        deepseek_breaker,
        replicate_breaker,
        huggingface_breaker,
        marketing_breaker
    ]
    
    stats = {}
    for breaker in breakers:
        stats[breaker.name] = {
            'state': breaker.current_state,
            'fail_counter': breaker.fail_counter,
            'success_counter': breaker.success_counter,
            'last_failure': str(breaker.last_failure_time) if breaker.last_failure_time else None
        }
    
    return stats

# Ejemplo de uso con fallback
async def fallback_deepseek_response(*args, **kwargs):
    """Respuesta fallback cuando DeepSeek falla"""
    return {
        "respuesta": "Lo siento, estoy experimentando problemas técnicos. ¿Puedo ayudarte de otra manera?",
        "productos_recomendados": [],
        "en_contexto": False,
        "fallback": True
    }
