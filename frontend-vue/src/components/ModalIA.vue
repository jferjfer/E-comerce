<template>
  <div class="modal" @click.self="$emit('close')">
    <div class="modal-content modal-ia">
      <div class="modal-header">
        <h2>🤖 Asesor de Outfits IA</h2>
        <button @click="$emit('close')" class="btn-close">×</button>
      </div>
      
      <div class="ia-content">
        <div class="step" v-if="step === 1">
          <h3>Cuéntanos sobre ti</h3>
          <div class="form-group">
            <label>Ocasión</label>
            <select v-model="preferences.ocasion">
              <option value="">Selecciona una ocasión</option>
              <option value="casual">Casual</option>
              <option value="trabajo">Trabajo</option>
              <option value="fiesta">Fiesta</option>
              <option value="deportivo">Deportivo</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Estilo preferido</label>
            <select v-model="preferences.estilo">
              <option value="">Selecciona un estilo</option>
              <option value="minimalista">Minimalista</option>
              <option value="bohemio">Bohemio</option>
              <option value="urbano">Urbano</option>
              <option value="elegante">Elegante</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Colores favoritos</label>
            <div class="color-grid">
              <div 
                v-for="color in colores" 
                :key="color.name"
                @click="toggleColor(color.name)"
                :class="['color-option', { active: preferences.colores.includes(color.name) }]"
                :style="{ backgroundColor: color.value }"
              >
              </div>
            </div>
          </div>
          
          <button @click="nextStep" class="btn btn-primary" style="width: 100%">
            Siguiente
          </button>
        </div>
        
        <div class="step" v-if="step === 2">
          <h3>Generando recomendaciones...</h3>
          <div class="loading">
            <div class="spinner"></div>
            <p>Nuestra IA está analizando tus preferencias</p>
          </div>
        </div>
        
        <div class="step" v-if="step === 3">
          <h3>Outfits recomendados para ti</h3>
          <div class="outfits-grid">
            <div v-for="outfit in outfits" :key="outfit.id" class="outfit-card">
              <img :src="outfit.imagen" :alt="outfit.nombre">
              <h4>{{ outfit.nombre }}</h4>
              <p class="outfit-price">${{ outfit.precio }}</p>
              <button @click="selectOutfit(outfit)" class="btn btn-secondary">
                Ver Productos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ModalIA',
  emits: ['close'],
  data() {
    return {
      step: 1,
      preferences: {
        ocasion: '',
        estilo: '',
        colores: []
      },
      colores: [
        { name: 'negro', value: '#000000' },
        { name: 'blanco', value: '#ffffff' },
        { name: 'azul', value: '#3498db' },
        { name: 'rojo', value: '#e74c3c' },
        { name: 'verde', value: '#27ae60' },
        { name: 'rosa', value: '#e91e63' }
      ],
      outfits: []
    }
  },
  methods: {
    toggleColor(color) {
      const index = this.preferences.colores.indexOf(color)
      if (index > -1) {
        this.preferences.colores.splice(index, 1)
      } else {
        this.preferences.colores.push(color)
      }
    },
    
    async nextStep() {
      this.step = 2
      
      // Simular llamada a IA
      setTimeout(() => {
        this.outfits = [
          {
            id: 1,
            nombre: 'Look Casual Chic',
            precio: 159.97,
            imagen: 'https://via.placeholder.com/200x250'
          },
          {
            id: 2,
            nombre: 'Outfit Minimalista',
            precio: 189.95,
            imagen: 'https://via.placeholder.com/200x250'
          },
          {
            id: 3,
            nombre: 'Estilo Urbano',
            precio: 219.93,
            imagen: 'https://via.placeholder.com/200x250'
          }
        ]
        this.step = 3
      }, 2000)
    },
    
    selectOutfit(outfit) {
      console.log('Outfit seleccionado:', outfit)
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
.modal-ia {
  max-width: 600px;
}

.step h3 {
  margin-bottom: 20px;
  color: var(--primary);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}

.color-option {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid transparent;
  transition: border-color 0.2s;
}

.color-option.active {
  border-color: var(--primary);
}

.loading {
  text-align: center;
  padding: 40px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border);
  border-top: 4px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.outfits-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.outfit-card {
  text-align: center;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 15px;
}

.outfit-card img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 10px;
}

.outfit-card h4 {
  font-size: 14px;
  margin-bottom: 5px;
}

.outfit-price {
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 10px;
}

@media (max-width: 768px) {
  .outfits-grid {
    grid-template-columns: 1fr;
  }
}
</style>