"""
Sistema de prompts dinámicos con versionado y A/B testing
"""
from typing import Dict, List, Optional, Any
from datetime import datetime
import json
import os
from enum import Enum

class PromptVersion(Enum):
    V1_BASIC = "v1_basic"
    V2_DETAILED = "v2_detailed"
    V3_CONVERSATIONAL = "v3_conversational"
    V4_EXPERT = "v4_expert"

class PromptManager:
    def __init__(self):
        self.prompts: Dict[str, Dict[str, Any]] = {}
        self.active_experiments: Dict[str, List[str]] = {}
        self.prompt_stats: Dict[str, Dict[str, int]] = {}
        self.load_prompts()
    
    def load_prompts(self):
        """Cargar prompts desde configuración"""
        self.prompts = {
            PromptVersion.V1_BASIC.value: {
                "system": """Eres un asesor de moda para 'Estilo y Moda'.

REGLAS:
1. Solo respondes sobre moda y compras
2. Habla de forma natural y profesional
3. Recomienda productos sin mencionar IDs
4. Al final: PRODUCTOS_RECOMENDADOS: [ids]""",
                "temperature": 0.7,
                "max_tokens": 400,
                "description": "Prompt básico y conciso"
            },
            
            PromptVersion.V2_DETAILED.value: {
                "system": """Eres María, asesora de moda experta para 'Estilo y Moda'.

PERSONALIDAD:
- Cálida, profesional y entusiasta
- Conocedora de tendencias actuales
- Enfocada en el cliente

REGLAS ESTRICTAS:
1. SOLO respondes sobre moda, ropa, accesorios, estilo y compras
2. Si preguntan algo fuera de moda: "Solo puedo ayudarte con temas de moda"
3. Describe productos por nombre, color y características
4. NUNCA uses paréntesis con IDs como "(ID: 1)"
5. Al final, en línea separada: PRODUCTOS_RECOMENDADOS: [id1, id2, id3]

ESTILO DE RESPUESTA:
- Usa emojis ocasionalmente ✨
- Haz preguntas para entender mejor las necesidades
- Ofrece 2-3 opciones cuando sea posible
- Menciona beneficios específicos de cada producto""",
                "temperature": 0.8,
                "max_tokens": 600,
                "description": "Prompt detallado con personalidad"
            },
            
            PromptVersion.V3_CONVERSATIONAL.value: {
                "system": """Eres María, tu asesora personal de imagen en 'Estilo y Moda'.

SOBRE TI:
Soy una estilista profesional con 10 años de experiencia. Me apasiona ayudar a las personas a encontrar su estilo único y sentirse seguras con su imagen.

MI ENFOQUE:
1. Escucho activamente tus necesidades
2. Hago preguntas para entender tu estilo de vida
3. Considero tu presupuesto y preferencias
4. Ofrezco opciones versátiles

REGLAS DE CONVERSACIÓN:
- Habla en primera persona ("te recomiendo", "creo que")
- Usa un tono amigable pero profesional
- Haz seguimiento de preferencias mencionadas
- Sugiere combinaciones completas de outfit
- NUNCA menciones IDs en el texto
- Al final: PRODUCTOS_RECOMENDADOS: [ids]

EJEMPLOS DE RESPUESTAS:
Usuario: "Busco algo para una boda"
Tú: "¡Qué emocionante! 💕 Para ayudarte mejor, ¿la boda es de día o de noche? ¿Prefieres un look más clásico o moderno? Mientras tanto, te muestro algunas opciones elegantes que tenemos..."

Usuario: "Necesito ropa para la oficina"
Tú: "Perfecto, te ayudo a crear un guardarropa profesional. ¿Tu oficina tiene un código de vestimenta formal o es más business casual? Te recomiendo empezar con piezas versátiles que puedas combinar..."
""",
                "temperature": 0.85,
                "max_tokens": 700,
                "description": "Prompt conversacional con ejemplos"
            },
            
            PromptVersion.V4_EXPERT.value: {
                "system": """Eres María, Directora de Estilo en 'Estilo y Moda' con certificación internacional.

EXPERTISE:
- Análisis de colorimetría personal
- Teoría de siluetas y proporciones
- Tendencias de moda internacionales
- Psicología del vestir
- Sostenibilidad en moda

METODOLOGÍA DE ASESORÍA:
1. ANÁLISIS: Entiendo necesidades, ocasión, presupuesto
2. DIAGNÓSTICO: Identifico estilo personal y preferencias
3. RECOMENDACIÓN: Sugiero piezas específicas con justificación
4. EDUCACIÓN: Explico por qué cada pieza funciona
5. SEGUIMIENTO: Ofrezco tips de combinación y cuidado

FRAMEWORK DE RESPUESTA:
- Contexto: Reconoce la situación del cliente
- Opciones: Presenta 2-3 alternativas con pros/contras
- Justificación: Explica por qué cada opción funciona
- Acción: Guía clara sobre próximos pasos

REGLAS TÉCNICAS:
- Usa terminología de moda apropiada
- Menciona detalles de corte, tela, caída
- Considera estacionalidad y versatilidad
- NUNCA uses IDs en el texto narrativo
- Formato final: PRODUCTOS_RECOMENDADOS: [ids]

EJEMPLO AVANZADO:
Usuario: "Tengo una entrevista importante"
Tú: "Excelente, una entrevista es tu oportunidad de causar una primera impresión memorable. 

Para un look profesional y confiado, te sugiero:

OPCIÓN 1 - Clásico Atemporal:
Un blazer estructurado en azul marino (transmite confianza y profesionalismo) combinado con pantalón de corte recto. Este conjunto es versátil y apropiado para cualquier industria.

OPCIÓN 2 - Moderno Sofisticado:
Blazer en tono neutro con blusa de seda. La combinación de texturas añade interés visual sin ser llamativa.

Ambas opciones te permiten moverte con comodidad y proyectar autoridad. ¿En qué industria es la entrevista? Eso me ayudará a afinar la recomendación.

PRODUCTOS_RECOMENDADOS: [1, 4, 7]"
""",
                "temperature": 0.75,
                "max_tokens": 800,
                "description": "Prompt experto con metodología"
            }
        }
    
    def get_prompt(
        self,
        version: Optional[str] = None,
        user_profile: Optional[Dict] = None,
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Obtener prompt dinámico basado en versión y contexto
        """
        # Si no se especifica versión, usar A/B testing
        if not version:
            version = self._select_version_ab_test(user_profile)
        
        # Obtener prompt base
        prompt_config = self.prompts.get(
            version,
            self.prompts[PromptVersion.V2_DETAILED.value]
        )
        
        # Personalizar con contexto
        system_prompt = prompt_config["system"]
        
        if context:
            system_prompt = self._inject_context(system_prompt, context)
        
        if user_profile:
            system_prompt = self._personalize_prompt(system_prompt, user_profile)
        
        # Trackear uso
        self._track_prompt_usage(version)
        
        return {
            "system": system_prompt,
            "temperature": prompt_config["temperature"],
            "max_tokens": prompt_config["max_tokens"],
            "version": version
        }
    
    def _select_version_ab_test(self, user_profile: Optional[Dict]) -> str:
        """
        Seleccionar versión de prompt usando A/B testing
        """
        # Por ahora, distribución simple
        # TODO: Implementar algoritmo de multi-armed bandit
        
        if not user_profile:
            return PromptVersion.V2_DETAILED.value
        
        # Usuarios nuevos: versión conversacional
        if user_profile.get('es_nuevo', True):
            return PromptVersion.V3_CONVERSATIONAL.value
        
        # Usuarios frecuentes: versión experta
        if user_profile.get('compras_totales', 0) > 5:
            return PromptVersion.V4_EXPERT.value
        
        # Default: versión detallada
        return PromptVersion.V2_DETAILED.value
    
    def _inject_context(self, prompt: str, context: Dict) -> str:
        """Inyectar contexto dinámico en el prompt"""
        context_section = "\n\nCONTEXTO ACTUAL:\n"
        
        if context.get('productos'):
            context_section += f"- Tenemos {len(context['productos'])} productos disponibles\n"
        
        if context.get('categorias'):
            context_section += f"- Categorías: {', '.join(context['categorias'][:5])}\n"
        
        if context.get('cupones_activos'):
            context_section += f"- {len(context['cupones_activos'])} cupones activos\n"
        
        if context.get('campanas_activas'):
            context_section += f"- Campañas especiales activas\n"
        
        return prompt + context_section
    
    def _personalize_prompt(self, prompt: str, user_profile: Dict) -> str:
        """Personalizar prompt según perfil de usuario"""
        personalization = "\n\nPERFIL DEL CLIENTE:\n"
        
        if user_profile.get('nombre'):
            personalization += f"- Nombre: {user_profile['nombre']}\n"
        
        if user_profile.get('estilo_preferido'):
            personalization += f"- Estilo preferido: {user_profile['estilo_preferido']}\n"
        
        if user_profile.get('colores_favoritos'):
            personalization += f"- Colores favoritos: {', '.join(user_profile['colores_favoritos'])}\n"
        
        if user_profile.get('presupuesto_max'):
            personalization += f"- Presupuesto: hasta ${user_profile['presupuesto_max']:,.0f}\n"
        
        return prompt + personalization
    
    def _track_prompt_usage(self, version: str):
        """Trackear uso de prompts para análisis"""
        if version not in self.prompt_stats:
            self.prompt_stats[version] = {
                'uses': 0,
                'successes': 0,
                'failures': 0
            }
        
        self.prompt_stats[version]['uses'] += 1
    
    def record_prompt_result(self, version: str, success: bool):
        """Registrar resultado de prompt para optimización"""
        if version in self.prompt_stats:
            if success:
                self.prompt_stats[version]['successes'] += 1
            else:
                self.prompt_stats[version]['failures'] += 1
    
    def get_best_performing_prompt(self) -> str:
        """Obtener versión de prompt con mejor performance"""
        best_version = PromptVersion.V2_DETAILED.value
        best_rate = 0.0
        
        for version, stats in self.prompt_stats.items():
            if stats['uses'] > 10:  # Mínimo de usos
                success_rate = stats['successes'] / stats['uses']
                if success_rate > best_rate:
                    best_rate = success_rate
                    best_version = version
        
        return best_version
    
    def get_stats(self) -> Dict:
        """Obtener estadísticas de prompts"""
        return {
            'prompt_stats': self.prompt_stats,
            'active_experiments': self.active_experiments,
            'best_performing': self.get_best_performing_prompt()
        }

# Instancia global
prompt_manager = PromptManager()
