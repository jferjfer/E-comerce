"""
Sistema de embeddings para recomendaciones semánticas avanzadas
"""
from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Dict, Any, Optional
import pickle
import os
from sklearn.metrics.pairwise import cosine_similarity

class EmbeddingRecommender:
    def __init__(self):
        self.model_name = 'paraphrase-multilingual-MiniLM-L12-v2'
        self.model: Optional[SentenceTransformer] = None
        self.product_embeddings: Dict[str, np.ndarray] = {}
        self.cache_file = '/tmp/product_embeddings.pkl'
        
    def load_model(self):
        """Cargar modelo de embeddings"""
        try:
            print(f"🤖 Cargando modelo de embeddings: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
            print("✅ Modelo cargado exitosamente")
            
            # Cargar embeddings cacheados si existen
            if os.path.exists(self.cache_file):
                with open(self.cache_file, 'rb') as f:
                    self.product_embeddings = pickle.load(f)
                print(f"✅ {len(self.product_embeddings)} embeddings cargados del caché")
        except Exception as e:
            print(f"⚠️ Error cargando modelo: {e}")
            self.model = None
    
    def generate_product_text(self, producto: Dict[str, Any]) -> str:
        """Generar texto descriptivo del producto para embedding"""
        parts = [
            producto.get('nombre', ''),
            producto.get('descripcion', ''),
            producto.get('categoria', ''),
            ' '.join(producto.get('colores', [])),
            ' '.join(producto.get('tallas', [])),
            producto.get('estilo', ''),
        ]
        return ' '.join(filter(None, parts))
    
    def encode_products(self, productos: List[Dict[str, Any]]) -> Dict[str, np.ndarray]:
        """Generar embeddings para lista de productos"""
        if not self.model:
            return {}
        
        embeddings = {}
        texts = []
        ids = []
        
        for producto in productos:
            producto_id = producto.get('id')
            if not producto_id:
                continue
            
            # Usar caché si existe
            if producto_id in self.product_embeddings:
                embeddings[producto_id] = self.product_embeddings[producto_id]
                continue
            
            text = self.generate_product_text(producto)
            texts.append(text)
            ids.append(producto_id)
        
        # Generar embeddings para productos nuevos
        if texts:
            print(f"🔄 Generando embeddings para {len(texts)} productos...")
            new_embeddings = self.model.encode(texts, show_progress_bar=False)
            
            for producto_id, embedding in zip(ids, new_embeddings):
                embeddings[producto_id] = embedding
                self.product_embeddings[producto_id] = embedding
            
            # Guardar caché
            self._save_cache()
        
        return embeddings
    
    def find_similar_products(
        self,
        query_text: str,
        productos: List[Dict[str, Any]],
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """Encontrar productos similares usando búsqueda semántica"""
        if not self.model:
            return productos[:top_k]
        
        # Generar embedding de la query
        query_embedding = self.model.encode([query_text])[0]
        
        # Generar embeddings de productos
        product_embeddings = self.encode_products(productos)
        
        if not product_embeddings:
            return productos[:top_k]
        
        # Calcular similitudes
        similarities = []
        for producto in productos:
            producto_id = producto.get('id')
            if producto_id in product_embeddings:
                similarity = cosine_similarity(
                    [query_embedding],
                    [product_embeddings[producto_id]]
                )[0][0]
                similarities.append((producto, similarity))
        
        # Ordenar por similitud
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        # Retornar top_k con score
        results = []
        for producto, score in similarities[:top_k]:
            producto_copy = producto.copy()
            producto_copy['similarity_score'] = float(score)
            results.append(producto_copy)
        
        return results
    
    def recommend_based_on_history(
        self,
        productos_vistos: List[str],
        todos_productos: List[Dict[str, Any]],
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """Recomendar basado en historial de productos vistos"""
        if not self.model or not productos_vistos:
            return todos_productos[:top_k]
        
        # Generar embeddings
        product_embeddings = self.encode_products(todos_productos)
        
        # Obtener embeddings de productos vistos
        vistos_embeddings = []
        for producto_id in productos_vistos:
            if producto_id in product_embeddings:
                vistos_embeddings.append(product_embeddings[producto_id])
        
        if not vistos_embeddings:
            return todos_productos[:top_k]
        
        # Promedio de embeddings vistos
        avg_embedding = np.mean(vistos_embeddings, axis=0)
        
        # Calcular similitudes
        similarities = []
        for producto in todos_productos:
            producto_id = producto.get('id')
            
            # Excluir productos ya vistos
            if producto_id in productos_vistos:
                continue
            
            if producto_id in product_embeddings:
                similarity = cosine_similarity(
                    [avg_embedding],
                    [product_embeddings[producto_id]]
                )[0][0]
                similarities.append((producto, similarity))
        
        # Ordenar y retornar
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        results = []
        for producto, score in similarities[:top_k]:
            producto_copy = producto.copy()
            producto_copy['recommendation_score'] = float(score)
            results.append(producto_copy)
        
        return results
    
    def _save_cache(self):
        """Guardar embeddings en caché"""
        try:
            with open(self.cache_file, 'wb') as f:
                pickle.dump(self.product_embeddings, f)
        except Exception as e:
            print(f"⚠️ Error guardando caché de embeddings: {e}")

# Instancia global
recommender = EmbeddingRecommender()
