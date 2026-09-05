"""
Modelo local de Virtual Try-On usando ONNX Runtime
Elimina dependencia de APIs externas
"""
import onnxruntime as ort
import numpy as np
from PIL import Image
import io
import os
from typing import Optional
import cv2

class LocalVirtualTryOn:
    def __init__(self):
        self.model_path = os.getenv('VTON_MODEL_PATH', '/models/idm_vton.onnx')
        self.session: Optional[ort.InferenceSession] = None
        self.enabled = False
        
    def load_model(self):
        """Cargar modelo ONNX"""
        try:
            if not os.path.exists(self.model_path):
                print(f"⚠️ Modelo ONNX no encontrado en {self.model_path}")
                return False
            
            print(f"🤖 Cargando modelo ONNX: {self.model_path}")
            
            # Configurar providers (GPU si está disponible)
            providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']
            
            self.session = ort.InferenceSession(
                self.model_path,
                providers=providers
            )
            
            self.enabled = True
            print(f"✅ Modelo cargado con provider: {self.session.get_providers()[0]}")
            return True
            
        except Exception as e:
            print(f"❌ Error cargando modelo ONNX: {e}")
            self.enabled = False
            return False
    
    def preprocess_image(self, image_bytes: bytes, target_size=(512, 512)) -> np.ndarray:
        """Preprocesar imagen para el modelo"""
        # Cargar imagen
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        # Redimensionar
        image = image.resize(target_size, Image.LANCZOS)
        
        # Convertir a numpy array
        image_array = np.array(image).astype(np.float32)
        
        # Normalizar [0, 255] -> [-1, 1]
        image_array = (image_array / 127.5) - 1.0
        
        # Cambiar formato (H, W, C) -> (1, C, H, W)
        image_array = np.transpose(image_array, (2, 0, 1))
        image_array = np.expand_dims(image_array, axis=0)
        
        return image_array
    
    def postprocess_image(self, output: np.ndarray) -> bytes:
        """Postprocesar salida del modelo"""
        # Remover batch dimension
        output = output[0]
        
        # Cambiar formato (C, H, W) -> (H, W, C)
        output = np.transpose(output, (1, 2, 0))
        
        # Desnormalizar [-1, 1] -> [0, 255]
        output = ((output + 1.0) * 127.5).astype(np.uint8)
        
        # Convertir a imagen
        image = Image.fromarray(output)
        
        # Convertir a bytes
        buffer = io.BytesIO()
        image.save(buffer, format='JPEG', quality=95)
        return buffer.getvalue()
    
    def apply_garment(
        self,
        person_image_bytes: bytes,
        garment_image_bytes: bytes
    ) -> Optional[bytes]:
        """
        Aplicar prenda a persona usando modelo local
        
        Args:
            person_image_bytes: Imagen de la persona
            garment_image_bytes: Imagen de la prenda
            
        Returns:
            Imagen resultante en bytes o None si falla
        """
        if not self.enabled or not self.session:
            print("⚠️ Modelo local no disponible")
            return None
        
        try:
            print("🎨 Procesando con modelo local...")
            
            # Preprocesar imágenes
            person_array = self.preprocess_image(person_image_bytes)
            garment_array = self.preprocess_image(garment_image_bytes)
            
            # Preparar inputs
            inputs = {
                'person_image': person_array,
                'garment_image': garment_array
            }
            
            # Ejecutar inferencia
            outputs = self.session.run(None, inputs)
            
            # Postprocesar resultado
            result_bytes = self.postprocess_image(outputs[0])
            
            print("✅ Procesamiento local completado")
            return result_bytes
            
        except Exception as e:
            print(f"❌ Error en modelo local: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def enhance_result(self, image_bytes: bytes) -> bytes:
        """Mejorar calidad de la imagen resultante"""
        try:
            # Cargar imagen
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convertir a OpenCV
            cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            # Aplicar mejoras
            # 1. Ajuste de contraste
            lab = cv2.cvtColor(cv_image, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            l = clahe.apply(l)
            enhanced = cv2.merge([l, a, b])
            enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
            
            # 2. Reducción de ruido
            enhanced = cv2.fastNlMeansDenoisingColored(enhanced, None, 10, 10, 7, 21)
            
            # 3. Sharpening
            kernel = np.array([[-1, -1, -1],
                             [-1,  9, -1],
                             [-1, -1, -1]])
            enhanced = cv2.filter2D(enhanced, -1, kernel)
            
            # Convertir de vuelta a PIL
            enhanced_image = Image.fromarray(cv2.cvtColor(enhanced, cv2.COLOR_BGR2RGB))
            
            # Guardar en bytes
            buffer = io.BytesIO()
            enhanced_image.save(buffer, format='JPEG', quality=95)
            
            return buffer.getvalue()
            
        except Exception as e:
            print(f"⚠️ Error mejorando imagen: {e}")
            return image_bytes

# Instancia global
local_tryon = LocalVirtualTryOn()
