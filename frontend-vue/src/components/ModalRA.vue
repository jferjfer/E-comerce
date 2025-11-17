<template>
  <div class="modal" @click.self="$emit('close')">
    <div class="modal-content modal-ra">
      <div class="modal-header">
        <h2>👗 Probador Virtual AR</h2>
        <button @click="$emit('close')" class="btn-close">×</button>
      </div>
      
      <div class="ra-content">
        <div v-if="!cameraActive" class="ra-intro">
          <div class="ra-icon">📱</div>
          <h3>Pruébate la ropa virtualmente</h3>
          <p>Activa tu cámara para ver cómo te queda la ropa antes de comprar</p>
          <button @click="activateCamera" class="btn btn-primary">
            Activar Cámara
          </button>
        </div>
        
        <div v-else class="ra-camera">
          <div class="camera-view">
            <video ref="video" autoplay playsinline></video>
            <canvas ref="canvas" style="display: none;"></canvas>
            
            <!-- Overlay de la prenda virtual -->
            <div class="virtual-garment" v-if="selectedGarment">
              <img :src="selectedGarment.arImage" :alt="selectedGarment.name">
            </div>
          </div>
          
          <div class="ra-controls">
            <div class="garment-selector">
              <h4>Selecciona una prenda:</h4>
              <div class="garments-grid">
                <div 
                  v-for="garment in garments" 
                  :key="garment.id"
                  @click="selectGarment(garment)"
                  :class="['garment-option', { active: selectedGarment?.id === garment.id }]"
                >
                  <img :src="garment.thumbnail" :alt="garment.name">
                  <span>{{ garment.name }}</span>
                </div>
              </div>
            </div>
            
            <div class="ra-actions">
              <button @click="takePhoto" class="btn btn-secondary">
                📸 Capturar
              </button>
              <button @click="stopCamera" class="btn btn-primary">
                Finalizar
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
  name: 'ModalRA',
  emits: ['close'],
  data() {
    return {
      cameraActive: false,
      selectedGarment: null,
      stream: null,
      garments: [
        {
          id: 1,
          name: 'Camiseta Azul',
          thumbnail: 'https://via.placeholder.com/80x80',
          arImage: 'https://via.placeholder.com/200x300'
        },
        {
          id: 2,
          name: 'Chaqueta Negra',
          thumbnail: 'https://via.placeholder.com/80x80',
          arImage: 'https://via.placeholder.com/200x300'
        },
        {
          id: 3,
          name: 'Vestido Rojo',
          thumbnail: 'https://via.placeholder.com/80x80',
          arImage: 'https://via.placeholder.com/200x300'
        }
      ]
    }
  },
  methods: {
    async activateCamera() {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        })
        this.$refs.video.srcObject = this.stream
        this.cameraActive = true
      } catch (error) {
        alert('No se pudo acceder a la cámara')
        console.error('Error accessing camera:', error)
      }
    },
    
    selectGarment(garment) {
      this.selectedGarment = garment
    },
    
    takePhoto() {
      const video = this.$refs.video
      const canvas = this.$refs.canvas
      const ctx = canvas.getContext('2d')
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      ctx.drawImage(video, 0, 0)
      
      // Aquí se podría guardar la imagen o procesarla
      const imageData = canvas.toDataURL('image/png')
      console.log('Foto capturada:', imageData)
      
      alert('¡Foto capturada! Se guardó en tu galería virtual.')
    },
    
    stopCamera() {
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop())
        this.stream = null
      }
      this.cameraActive = false
    }
  },
  
  beforeUnmount() {
    this.stopCamera()
  }
}
</script>

<style scoped>
.modal-ra {
  max-width: 800px;
  max-height: 90vh;
}

.ra-intro {
  text-align: center;
  padding: 40px 20px;
}

.ra-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.ra-intro h3 {
  margin-bottom: 15px;
  color: var(--primary);
}

.ra-intro p {
  color: var(--secondary);
  margin-bottom: 30px;
}

.ra-camera {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.camera-view {
  position: relative;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  height: 400px;
}

.camera-view video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.virtual-garment {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.8;
}

.virtual-garment img {
  max-width: 150px;
  max-height: 200px;
}

.garment-selector h4 {
  margin-bottom: 15px;
  color: var(--primary);
}

.garments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.garment-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  border: 2px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.garment-option:hover,
.garment-option.active {
  border-color: var(--primary);
}

.garment-option img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 5px;
}

.garment-option span {
  font-size: 12px;
  text-align: center;
}

.ra-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

@media (max-width: 768px) {
  .modal-ra {
    max-width: 95vw;
  }
  
  .camera-view {
    height: 300px;
  }
  
  .ra-actions {
    flex-direction: column;
  }
}
</style>