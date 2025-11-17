<template>
  <div class="bg-page text-page transition-all duration-300">
    <!-- CABECERA (Header) -->
    <header class="header-bg shadow-md sticky top-0 z-50 transition-all duration-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <button @click="navigate('listing')" class="text-2xl font-bold text-page cursor-pointer">
          Cloth<span class="text-primary-accent">Store</span>
        </button>
        
        <div class="flex items-center space-x-4">
          <!-- Íconos de Usuario y Carrito (UX) -->
          <button class="p-2 rounded-2xl hover:bg-secondary/20 transition duration-150 border-2 border-transparent hover:border-primary-accent" title="Perfil / Iniciar Sesión" @click="openAuthModal('login')">
            <svg class="icon w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21v-2a4 4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
          <button class="p-2 rounded-2xl hover:bg-secondary/20 transition duration-150 relative" title="Carrito de Compras" @click="navigate('cart')">
            <!-- ICONO DE CARRITO CLÁSICO (TROLLEY) -->
            <svg class="icon w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.6 11.2a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>
            </svg>
            <span class="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">{{ cartCount }}</span>
          </button>
        </div>
      </div>
    </header>

    <!-- CUERPO PRINCIPAL (Contenedor de Vistas SPA) -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 min-h-screen">
      <component :is="currentView" @navigate="navigate" @add-to-cart="addToCart" @open-ar="openARSimulation" />
    </main>
    
    <!-- Mensaje de Confirmación -->
    <div :class="['message-box', { show: showMessage }]">{{ messageText }}</div>

    <!-- Botón Flotante Asesor Outfit -->
    <button class="fixed bottom-6 right-6 z-50 btn-ai text-base font-bold px-5 py-3 rounded-2xl flex items-center space-x-2 shadow-2xl hover:shadow-xl transition-all duration-200" @click="openAIModal" title="Asesor de Imagen con IA">
      <!-- Icono de IA (Sparkle/Brillantez) -->
      <svg class="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L15 8L21 9L15 10L12 16L9 10L3 9L9 8L12 2z"/><path d="M22 17l-3 3M19 22l-3-3"/>
      </svg>
      <span class="hidden sm:inline">Asesor Outfit</span>
    </button>

    <!-- MODAL DE REALIDAD AUMENTADA (AR) -->
    <div v-if="showAR" class="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center transition-opacity duration-300">
      <div class="relative w-11/12 max-w-2xl h-[80vh] bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        <button @click="closeARSimulation" class="absolute top-4 right-4 text-white hover:text-red-500 z-50 p-2 rounded-2xl bg-black/50 transition">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
        </button>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-full h-full bg-black flex flex-col items-center justify-center text-white p-4">
            <p class="text-xl font-bold mb-4 text-center">PRUEBA VIRTUAL (AR) EN VIVO</p>
            <p class="text-sm text-gray-400 mb-6 text-center">Simulación: En un entorno real, tu cámara se activaría para proyectar el producto.</p>
            <div class="w-full h-2/3 bg-gray-800 rounded-2xl flex items-center justify-center border-4 border-gray-600 border-dashed">
              <span class="text-gray-500">Esperando acceso a la cámara...</span>
            </div>
            <button @click="closeARSimulation" class="mt-8 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition duration-200">
              Salir de AR
            </button>
          </div>
        </div>
        <div v-if="arProduct" class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div class="flex flex-col items-center p-8">
            <h3 class="text-2xl text-white font-bold mb-4 z-10">{{ arProduct.name }}</h3>
            <img :src="arProduct.imageUrl" :alt="arProduct.name" 
                 class="w-full max-w-[200px] h-auto object-contain transform scale-[1.6] opacity-75 drop-shadow-lg"
                 style="filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));"
                 @error="handleARImageError">
            <p class="text-base text-white mt-10 z-10">¡Se ve genial! Proyección AR activa.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL ASESOR OUTFIT (IA) -->
    <div v-if="showIA" class="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300">
      <div :class="['bg-card rounded-2xl shadow-2xl w-full max-w-lg p-8 relative transition-all duration-300 max-h-[90vh] overflow-y-auto', aiModalClass]">
        <button @click="closeAIModal" class="absolute top-4 right-4 text-page hover:text-red-500 transition">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
        </button>
        
        <div class="text-center mb-6">
          <svg class="w-10 h-10 mx-auto mb-2 ai-accent-text" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L15 8L21 9L15 10L12 16L9 10L3 9L9 8L12 2z"/><path d="M22 17l-3 3M19 22l-3-3"/>
          </svg>
          <h2 class="text-3xl font-extrabold text-primary-accent mb-2">Asesor Outfit</h2>
          <p class="text-secondary text-sm">Creamos tu outfit ideal en 3 preguntas, ¡con estilo y sin etiquetas!</p>
        </div>

        <div v-html="aiWizardContent"></div>
        
        <div v-if="showAIControls" class="mt-6 flex justify-between">
          <button :disabled="aiPrevDisabled" class="px-4 py-2 text-secondary hover:text-primary-accent rounded-2xl disabled:opacity-50 transition duration-150" @click="prevStep">
            ← Anterior
          </button>
          <button v-if="showAINextBtn" :disabled="aiNextDisabled" class="btn-primary px-6 py-2 rounded-2xl disabled:opacity-50" @click="nextStep">
            {{ aiNextText }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- MODAL DE AUTENTICACIÓN -->
    <div v-if="showAuth" class="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
      <div :class="['bg-card rounded-2xl shadow-2xl w-full p-8 relative transform scale-100 transition-transform duration-300 max-h-[90vh] overflow-y-auto', authModalClass]">
        <button @click="closeAuthModal" class="absolute top-4 right-4 text-page hover:text-red-500 transition">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
        </button>

        <div class="mb-6">
          <h2 class="text-3xl font-extrabold text-primary-accent mb-4 text-page">{{ authTitle }}</h2>
          <p class="text-secondary text-sm cursor-pointer hover:underline" @click="toggleAuthMode" v-html="authToggleText"></p>
        </div>

        <div v-if="authMode === 'login'">
          <form class="space-y-4" @submit.prevent="handleLogin">
            <div>
              <label class="block text-sm font-medium text-page mb-1">Correo Electrónico</label>
              <input v-model="loginForm.email" type="email" placeholder="tu.correo@ejemplo.com" class="w-full p-3 border rounded-2xl focus:ring-primary-accent focus:border-primary-accent input-style">
            </div>
            <div>
              <label class="block text-sm font-medium text-page mb-1">Contraseña</label>
              <input v-model="loginForm.password" type="password" placeholder="••••••••" class="w-full p-3 border rounded-2xl focus:ring-primary-accent focus:border-primary-accent input-style">
            </div>
            <button type="submit" class="btn-primary w-full py-3 text-lg font-bold rounded-2xl mt-4">
              INICIAR SESIÓN
            </button>
            <p class="text-xs text-center text-secondary pt-2">¿Olvidaste tu contraseña? <a href="#" class="hover:text-primary-accent">Recuperar</a></p>
          </form>
        </div>
        
        <div v-else>
          <div v-if="!registerSuccess">
            <form class="space-y-4" @submit.prevent="handleRegister">
              <div v-if="registerError" class="p-3 rounded-2xl text-sm font-semibold bg-red-100 text-red-700">{{ registerError }}</div>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-page mb-1">Primer Nombre <span class="text-red-500">*</span></label>
                  <input v-model="registerForm.firstName" type="text" placeholder="Juan" class="w-full p-3 border rounded-2xl focus:ring-primary-accent focus:border-primary-accent input-style">
                </div>
                <div>
                  <label class="block text-sm font-medium text-page mb-1">Segundo Nombre (Opcional)</label>
                  <input v-model="registerForm.secondName" type="text" placeholder="Felipe" class="w-full p-3 border rounded-2xl focus:ring-primary-accent focus:border-primary-accent input-style">
                </div>
              </div>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-page mb-1">Primer Apellido <span class="text-red-500">*</span></label>
                  <input v-model="registerForm.firstLastname" type="text" placeholder="Pérez" class="w-full p-3 border rounded-2xl focus:ring-primary-accent focus:border-primary-accent input-style">
                </div>
                <div>
                  <label class="block text-sm font-medium text-page mb-1">Segundo Apellido</label>
                  <input v-model="registerForm.secondLastname" type="text" placeholder="Gómez" class="w-full p-3 border rounded-2xl focus:ring-primary-accent focus:border-primary-accent input-style">
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="sm:col-span-1">
                  <label class="block text-sm font-medium text-page mb-1">Tipo Doc. <span class="text-red-500">*</span></label>
                  <select v-model="registerForm.docType" class="w-full p-3 border rounded-2xl focus:ring-primary-accent focus:border-primary-accent input-style">
                    <option>C.C.</option>
                    <option>C.E.</option>
                    <option>Pasaporte</option>
                  </select>
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-sm font-medium text-page mb-1">Número Documento <span class="text-red-500">*</span></label>
                  <input v-model="registerForm.docNumber" type="text" placeholder="Ej: 1020304050" class="w-full p-3 border rounded-2xl focus:ring-primary-accent focus:border-primary-accent input-style">
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-page mb-1">Correo Electrónico <span class="text-red-500">*</span></label>
                <input v-model="registerForm.email" type="email" placeholder="tu.correo@ejemplo.com" class="w-full p-3 border rounded-2xl focus:ring-primary-accent focus:border-primary-accent input-style">
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-page mb-1">Teléfono <span class="text-red-500">*</span></label>
                  <input v-model="registerForm.phone" type="tel" placeholder="300 000 0000" class="w-full p-3 border rounded-2xl focus:ring-primary-accent focus:border-primary-accent input-style">
                </div>
                <div>
                  <label class="block text-sm font-medium text-page mb-1">Fecha Nacimiento <span class="text-red-500">*</span></label>
                  <input v-model="registerForm.dob" type="date" class="w-full p-3 border rounded-2xl focus:ring-primary-accent focus:border-primary-accent input-style">
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-page mb-1">Dirección Completa <span class="text-red-500">*</span></label>
                <input v-model="registerForm.address" type="text" placeholder="Carrera 10 # 20-30, Barrio X" class="w-full p-3 border rounded-2xl focus:ring-primary-accent focus:border-primary-accent input-style">
              </div>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-page mb-1">Ciudad <span class="text-red-500">*</span></label>
                  <input v-model="registerForm.city" type="text" placeholder="Bogotá, Medellín, etc." class="w-full p-3 border rounded-2xl focus:ring-primary-accent focus:border-primary-accent input-style">
                </div>
                <div>
                  <label class="block text-sm font-medium text-page mb-1">Contraseña <span class="text-red-500">*</span></label>
                  <input v-model="registerForm.password" @input="checkPasswordStrength" type="password" placeholder="Mín. 8 caracteres" class="w-full p-3 border rounded-2xl focus:ring-primary-accent focus:border-primary-accent input-style">
                  <div :class="passwordFeedbackClass" class="mt-1 text-xs font-semibold h-4">{{ passwordFeedback }}</div>
                </div>
              </div>

              <button type="submit" class="btn-primary w-full py-3 text-lg font-bold rounded-2xl mt-4">
                REGISTRARME
              </button>
              <p class="text-xs text-center text-secondary pt-2">Al registrarte, aceptas nuestros términos y condiciones de tratamiento de datos (Ley 1581/2012).</p>
            </form>
          </div>
          
          <div v-else class="text-center py-10 px-4 transition-all duration-500" v-html="registerSuccessContent">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ProductListing from './views/ProductListing.vue'
import ProductDetail from './views/ProductDetail.vue'
import CartView from './views/CartView.vue'
import CheckoutView from './views/CheckoutView.vue'

export default {
  name: 'App',
  components: {
    ProductListing,
    ProductDetail,
    CartView,
    CheckoutView
  },
  data() {
    return {
      // Estado de navegación
      currentPage: 'listing',
      currentProduct: null,
      
      // Estado de modales
      showAuth: false,
      showIA: false,
      showAR: false,
      showMessage: false,
      messageText: '',
      
      // Estado del carrito
      cart: [],
      
      // Estado de autenticación
      authMode: 'login',
      registerSuccess: false,
      registerError: '',
      registerTimeoutId: null,
      loginForm: {
        email: '',
        password: ''
      },
      registerForm: {
        firstName: '',
        secondName: '',
        firstLastname: '',
        secondLastname: '',
        docType: 'C.C.',
        docNumber: '',
        email: '',
        phone: '',
        dob: '',
        address: '',
        city: '',
        password: ''
      },
      passwordFeedback: '',
      passwordFeedbackClass: 'mt-1 text-xs font-semibold h-4',
      
      // Estado del Asesor IA
      aiWizardStep: 1,
      aiWizardMaxSteps: 3,
      aiWizardAnswers: {
        occasion: null,
        vibe: null,
        fit: null
      },
      aiWizardContent: '',
      
      // Estado de AR
      arProduct: null,
      
      // Productos mock (igual que en el HTML de referencia)
      products: [
        {
          id: 1,
          name: "Chaqueta Cuero Urbano",
          price: 450000,
          oldPrice: 600000,
          description: "Chaqueta atemporal en cuero genuino y cierres de alta calidad. Edición limitada.",
          imageUrl: "https://images.pexels.com/photos/1036622/pexels-photo-1036622.jpeg?auto=compress&cs=tinysrgb&w=800",
          variants: [
            { size: 'XS', stock: 15 },
            { size: 'S', stock: 10 },
            { size: 'M', stock: 3 },
            { size: 'L', stock: 0 },
            { size: 'XL', stock: 8 }
          ]
        },
        {
          id: 2,
          name: "Camisa Lino Azul",
          price: 120000,
          oldPrice: 150000,
          description: "Camisa ligera de lino, perfecta para climas cálidos. Corte moderno y ajuste cómodo.",
          imageUrl: "https://images.pexels.com/photos/1689731/pexels-photo-1689731.jpeg?auto=compress&cs=tinysrgb&w=800",
          variants: [
            { size: 'S', stock: 50 },
            { size: 'M', stock: 1 },
            { size: 'L', stock: 25 }
          ]
        },
        {
          id: 3,
          name: "Jeans Slim Fit Negro",
          price: 180000,
          oldPrice: 0,
          description: "Jeans de alta elasticidad con ajuste slim fit. Ideal para uso diario o casual elegante.",
          imageUrl: "https://images.pexels.com/photos/6770278/pexels-photo-6770278.jpeg?auto=compress&cs=tinysrgb&w=800",
          variants: [
            { size: '28', stock: 5 },
            { size: '30', stock: 12 },
            { size: '32', stock: 3 },
            { size: '34', stock: 0 }
          ]
        },
        {
          id: 4,
          name: "Vestido Midi Flores",
          price: 280000,
          oldPrice: 350000,
          description: "Vestido midi con estampado floral. Tela fluida y diseño romántico. Ideal para eventos.",
          imageUrl: "https://images.pexels.com/photos/1691888/pexels-photo-1691888.jpeg?auto=compress&cs=tinysrgb&w=800",
          variants: [
            { size: 'S', stock: 10 },
            { size: 'M', stock: 10 }
          ]
        },
        {
          id: 5,
          name: "Zapatos Oxford",
          price: 320000,
          oldPrice: 0,
          description: "Zapatos Oxford de cuero brillante, cómodos y elegantes. Hechos a mano en Colombia.",
          imageUrl: "https://images.pexels.com/photos/1035667/pexels-photo-1035667.jpeg?auto=compress&cs=tinysrgb&w=800",
          variants: [
            { size: '38', stock: 12 },
            { size: '40', stock: 15 },
            { size: '42', stock: 1 }
          ]
        },
        {
          id: 6,
          name: "Gafas de Sol Clásicas",
          price: 90000,
          oldPrice: 120000,
          description: "Diseño clásico atemporal con protección UV400. Montura ligera.",
          imageUrl: "https://images.pexels.com/photos/1000679/pexels-photo-1000679.jpeg?auto=compress&cs=tinysrgb&w=800",
          variants: [
            { size: 'U', stock: 20 }
          ]
        }
      ]
    }
  },
  computed: {
    currentView() {
      switch (this.currentPage) {
        case 'listing':
          return 'ProductListing'
        case 'detail':
          return 'ProductDetail'
        case 'cart':
          return 'CartView'
        case 'checkout':
          return 'CheckoutView'
        default:
          return 'ProductListing'
      }
    },
    cartCount() {
      return this.cart.length
    },
    authTitle() {
      return this.authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'
    },
    authToggleText() {
      return this.authMode === 'login' 
        ? '¿No tienes cuenta? <span class="font-bold text-primary-accent">Regístrate aquí.</span>'
        : '¿Ya tienes cuenta? <span class="font-bold text-primary-accent">Inicia sesión.</span>'
    },
    authModalClass() {
      return this.authMode === 'login' ? 'max-w-md' : 'max-w-2xl'
    },
    aiModalClass() {
      return this.aiWizardStep === 4 ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
    },
    showAIControls() {
      return this.aiWizardStep <= this.aiWizardMaxSteps
    },
    showAINextBtn() {
      return this.aiWizardStep <= this.aiWizardMaxSteps
    },
    aiPrevDisabled() {
      return this.aiWizardStep === 1 || this.aiWizardStep === this.aiWizardMaxSteps + 1
    },
    aiNextDisabled() {
      if (this.aiWizardStep <= this.aiWizardMaxSteps) {
        const key = this.getStepKey(this.aiWizardStep)
        return !this.aiWizardAnswers[key]
      }
      return false
    },
    aiNextText() {
      return this.aiWizardStep === this.aiWizardMaxSteps ? 'Generar Outfit' : 'Siguiente'
    },
    registerSuccessContent() {
      return `
        <div class="p-8 bg-card rounded-2xl shadow-xl border border-primary-accent/30">
          <svg class="w-20 h-20 mx-auto mb-6" style="fill: var(--primary-color);" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8.59l-9 9z"/>
          </svg>
          <h3 class="text-3xl font-extrabold text-primary-accent mb-2">¡Cuenta Creada con Éxito!</h3>
          <p class="text-xl text-page mb-8">
            Hemos enviado un **link de activación** a <span class="font-bold">${this.registerForm.email}</span>.
            <br>
            Revisa tu correo (y carpeta de spam) para verificar tu identidad y poder iniciar sesión.
          </p>
          <button @click="closeRegisterSuccessMessage" class="btn-primary w-full py-4 text-xl font-bold rounded-2xl shadow-xl transition duration-150 mt-4">
            Aceptar y Continuar al Login
          </button>
        </div>
      `
    }
  },
  mounted() {
    // Hacer la instancia accesible globalmente para eventos onclick
    window.app = this
    this.renderAIWizard()
  },
  methods: {
    // Navegación
    navigate(page, productId = null) {
      this.currentPage = page
      if (page === 'detail' && productId) {
        this.currentProduct = this.products.find(p => p.id === productId)
        if (!this.currentProduct) {
          this.showNotification("Error: Producto no encontrado.")
          this.navigate('listing')
        }
      } else {
        this.currentProduct = null
      }
    },
    
    // Carrito
    addToCart(product, size = null, quantity = 1) {
      if (!size && product.variants && product.variants.length > 0) {
        // Seleccionar primera talla disponible
        const availableVariant = product.variants.find(v => v.stock > 0)
        if (availableVariant) {
          size = availableVariant.size
        } else {
          this.showNotification("Producto agotado")
          return
        }
      }
      
      const cartItem = {
        ...product,
        size: size,
        quantity: quantity,
        uniqueId: Date.now() + Math.random()
      }
      
      this.cart.push(cartItem)
      this.showNotification(`Añadido "${product.name}" al carrito`)
    },
    
    removeFromCart(uniqueId) {
      this.cart = this.cart.filter(item => item.uniqueId !== uniqueId)
      this.showNotification("Artículo eliminado del carrito")
    },
    
    // Mensajes
    showNotification(text) {
      this.messageText = text
      this.showMessage = true
      setTimeout(() => {
        this.showMessage = false
      }, 3000)
    },
    
    // Autenticación
    openAuthModal(mode = null) {
      if (mode) this.authMode = mode
      this.showAuth = !this.showAuth
      if (this.showAuth) {
        this.updateAuthModalContent()
      }
    },
    
    closeAuthModal() {
      this.showAuth = false
      this.registerSuccess = false
      this.registerError = ''
      if (this.registerTimeoutId) {
        clearTimeout(this.registerTimeoutId)
        this.registerTimeoutId = null
      }
    },
    
    toggleAuthMode() {
      this.authMode = this.authMode === 'login' ? 'register' : 'login'
      this.updateAuthModalContent()
    },
    
    updateAuthModalContent() {
      this.registerSuccess = false
      this.registerError = ''
      if (this.registerTimeoutId) {
        clearTimeout(this.registerTimeoutId)
        this.registerTimeoutId = null
      }
    },
    
    handleLogin() {
      if (this.loginForm.email.includes('@')) {
        this.showNotification(`Bienvenido(a) ${this.loginForm.email.split('@')[0]}! (Sesión Simulada)`)
        this.closeAuthModal()
      } else {
        this.showNotification("Por favor, introduce un correo válido.")
      }
    },
    
    handleRegister() {
      const { firstName, firstLastname, email, phone, dob, address, city, password, docType, docNumber } = this.registerForm
      
      if (firstName && firstLastname && email.includes('@') && phone && dob && address && city && password.length >= 8 && docType && docNumber) {
        this.registerSuccess = true
        
        this.registerTimeoutId = setTimeout(() => {
          this.closeRegisterSuccessMessage()
        }, 20000)
      } else {
        this.registerError = "Por favor, completa todos los campos obligatorios (*) y verifica tu contraseña (mín. 8 caracteres)."
      }
    },
    
    closeRegisterSuccessMessage() {
      if (this.registerTimeoutId) {
        clearTimeout(this.registerTimeoutId)
        this.registerTimeoutId = null
      }
      this.openAuthModal('login')
    },
    
    checkPasswordStrength() {
      const password = this.registerForm.password
      let score = 0
      let message = ""
      let color = "text-red-500"
      
      if (password.length === 0) {
        this.passwordFeedback = ''
        this.passwordFeedbackClass = 'mt-1 text-xs font-semibold h-4'
        return
      }
      
      if (password.length >= 8) score++
      if (/[A-Z]/.test(password)) score++
      if (/[a-z]/.test(password)) score++
      if (/[0-9]/.test(password)) score++
      if (/[^A-Za-z0-9]/.test(password)) score++
      
      if (score <= 1) {
        message = "Muy Débil"
        color = "text-red-500"
      } else if (score <= 3) {
        message = "Media (Recomendado mejorar)"
        color = "text-yellow-600"
      } else if (score <= 4) {
        message = "Fuerte"
        color = "text-green-500"
      } else if (score === 5) {
        message = "Excelente"
        color = "text-green-700"
      }
      
      this.passwordFeedback = `Fortaleza: ${message}`
      this.passwordFeedbackClass = `mt-1 text-xs font-semibold h-4 ${color}`
    },
    
    // Asesor IA
    openAIModal() {
      this.showIA = !this.showIA
      if (this.showIA) {
        this.aiWizardStep = 1
        this.aiWizardAnswers = { occasion: null, vibe: null, fit: null }
        this.renderAIWizard()
      }
    },
    
    closeAIModal() {
      this.showIA = false
    },
    
    renderAIWizard(step = null) {
      if (step) this.aiWizardStep = step
      
      switch (this.aiWizardStep) {
        case 1:
          this.aiWizardContent = this.renderQuestion(
            'occasion',
            '¿Para qué ocasión buscas el outfit perfecto?',
            ['Casual y Diario', 'Noche y Fiesta', 'Trabajo/Formal', 'Evento Especial', 'Deportivo/Outdoor']
          )
          break
        case 2:
          this.aiWizardContent = this.renderQuestion(
            'vibe',
            '¿Qué estilo o "vibe" quieres proyectar hoy? (Inclusivo)',
            ['Minimalista y Neutro', 'Andrógino o Desestructurado', 'Femme Atrevido', 'Masculino Clásico', 'Lujo Discreto', 'Statement (Llamativo)']
          )
          break
        case 3:
          this.aiWizardContent = this.renderQuestion(
            'fit',
            '¿Qué corte de prendas prefieres?',
            ['Ajustado o Entallado', 'Oversize o Grande', 'Corte Estándar/Regular', 'Flotante o Ligeras']
          )
          break
        case 4:
          this.aiWizardContent = this.renderLoading()
          setTimeout(() => this.fetchAIRecommendation(), 2000)
          break
      }
    },
    
    renderQuestion(key, question, options) {
      const selectedValue = this.aiWizardAnswers[key]
      
      return `
        <div class="mb-4">
          <p class="text-xl font-bold text-page mb-4 text-center">${question}</p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            ${options.map((option, index) => {
              const isSelected = option === selectedValue
              return `
                <label class="block cursor-pointer" onclick="window.app.updateAIAnswer('${key}', '${option}')">
                  <input type="radio" name="${key}" value="${option}" class="peer hidden" ${isSelected ? 'checked' : ''}>
                  <div class="ai-option-card p-3 text-center rounded-2xl border-2 border-secondary/50 transition duration-200 shadow-sm hover:shadow-md hover:scale-[1.02] bg-card text-page hover:bg-page/50 ${isSelected ? 'bg-primary-accent text-white' : ''}">
                    <span class="font-semibold text-sm">${option}</span>
                  </div>
                </label>
              `
            }).join('')}
          </div>
        </div>
      `
    },
    
    renderLoading() {
      return `
        <div class="text-center py-10">
          <div class="w-16 h-16 border-4 border-t-4 rounded-full mx-auto mb-4 border-gray-200" 
               style="border-top-color: var(--ai-color); animation: spin 1s linear infinite;"></div>
          <p class="text-xl font-bold text-page mb-2">Analizando tus preferencias...</p>
          <p class="text-secondary">Generando una recomendación **inclusiva** basada en tu estilo.</p>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `
    },
    
    updateAIAnswer(key, value) {
      this.aiWizardAnswers[key] = value
      this.renderAIWizard(this.aiWizardStep)
    },
    
    nextStep() {
      const key = this.getStepKey(this.aiWizardStep)
      
      if (this.aiWizardStep <= this.aiWizardMaxSteps && !this.aiWizardAnswers[key]) {
        this.showNotification("Por favor, selecciona una opción para continuar.")
        return
      }
      
      if (this.aiWizardStep <= this.aiWizardMaxSteps) {
        this.aiWizardStep++
      }
      
      this.renderAIWizard()
    },
    
    prevStep() {
      if (this.aiWizardStep > 1) {
        this.aiWizardStep--
        this.renderAIWizard()
      }
    },
    
    getStepKey(step) {
      if (step === 1) return 'occasion'
      if (step === 2) return 'vibe'
      if (step === 3) return 'fit'
      return null
    },
    
    fetchAIRecommendation() {
      const mockRecommendation = {
        title: "Look Minimalista Andrógino para Noche",
        description: `Basado en tu preferencia por un estilo **${this.aiWizardAnswers.vibe}** y un corte **${this.aiWizardAnswers.fit}** para una ocasión **${this.aiWizardAnswers.occasion}**, este conjunto te ofrece líneas limpias y una silueta definida, perfecta para proyectar confianza y elegancia.`,
        items: [
          { id: 3, name: "Jeans Slim Fit Negro", imageUrl: this.products.find(p => p.id === 3).imageUrl },
          { id: 2, name: "Camisa Lino Azul", imageUrl: this.products.find(p => p.id === 2).imageUrl },
          { id: 6, name: "Gafas de Sol Clásicas", imageUrl: this.products.find(p => p.id === 6).imageUrl }
        ]
      }
      
      this.renderAIResult(mockRecommendation)
    },
    
    renderAIResult(recommendation) {
      const itemsHtml = recommendation.items.map(item => `
        <div class="flex items-center space-x-4 bg-page p-3 rounded-2xl border border-secondary/20 hover:shadow-lg transition duration-200">
          <img src="${item.imageUrl}" alt="${item.name}" class="w-12 h-16 object-cover rounded-xl shadow-md">
          <div>
            <p class="font-bold text-page">${item.name}</p>
            <p class="text-sm text-secondary">ID: PROD-${item.id}</p>
          </div>
        </div>
      `).join('')
      
      this.aiWizardContent = `
        <div class="text-center">
          <h3 class="text-3xl font-extrabold text-primary-accent mb-2">${recommendation.title}</h3>
          <p class="text-secondary mb-6">${recommendation.description}</p>
        </div>
        
        <div class="space-y-4 mb-8">
          <p class="text-lg font-bold text-page border-b pb-2 border-secondary/20">Tu Look Exclusivo:</p>
          ${itemsHtml}
        </div>

        <button class="btn-ai w-full py-3 text-lg font-bold rounded-2xl shadow-xl" onclick="window.app.addAIOutfitToCart()">
          AÑADIR ESTE LOOK AL CARRITO
        </button>
        <button class="w-full py-2 text-secondary hover:text-red-500 mt-2 rounded-2xl" onclick="window.app.restartAIWizard()">
          Reiniciar Asesoría
        </button>
      `
      this.aiWizardStep = 4
    },
    
    addAIOutfitToCart() {
      const item1 = this.products.find(p => p.id === 3)
      const item2 = this.products.find(p => p.id === 2)
      const item3 = this.products.find(p => p.id === 6)
      
      if (item1) this.addToCart(item1, 'M', 1)
      if (item2) this.addToCart(item2, 'L', 1)
      if (item3) this.addToCart(item3, 'U', 1)
      
      this.closeAIModal()
      this.navigate('cart')
      this.showNotification("¡Outfit completo añadido al carrito!")
    },
    
    restartAIWizard() {
      this.aiWizardStep = 1
      this.aiWizardAnswers = { occasion: null, vibe: null, fit: null }
      this.renderAIWizard()
    },
    
    // Realidad Aumentada
    openARSimulation(imageUrl, productName) {
      this.arProduct = { imageUrl, name: productName }
      this.showAR = true
      this.showNotification("Iniciando Prueba Virtual (AR)...")
    },
    
    closeARSimulation() {
      this.showAR = false
      this.arProduct = null
    },
    
    handleARImageError(event) {
      event.target.src = 'https://placehold.co/200x300/1e1e1e/f5f5f5?text=ERROR'
    }
  },
  provide() {
    return {
      showMessage: this.showNotification,
      products: () => this.products,
      currentProduct: () => this.currentProduct,
      cart: () => this.cart,
      addToCart: this.addToCart,
      removeFromCart: this.removeFromCart
    }
  }
}
</script>