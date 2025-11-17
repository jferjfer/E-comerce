<template>
  <div class="modal" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ isLogin ? 'Iniciar Sesión' : 'Registrarse' }}</h2>
        <button @click="$emit('close')" class="btn-close">×</button>
      </div>
      
      <form @submit.prevent="handleSubmit">
        <div v-if="!isLogin" class="form-group">
          <label>Nombre</label>
          <input v-model="form.nombre" type="text" required>
        </div>
        
        <div class="form-group">
          <label>Email</label>
          <input v-model="form.email" type="email" required>
        </div>
        
        <div class="form-group">
          <label>Contraseña</label>
          <input v-model="form.password" type="password" required>
        </div>
        
        <div v-if="!isLogin" class="form-group">
          <label>Confirmar Contraseña</label>
          <input v-model="form.confirmPassword" type="password" required>
        </div>
        
        <button type="submit" class="btn btn-primary" style="width: 100%">
          {{ isLogin ? 'Iniciar Sesión' : 'Registrarse' }}
        </button>
      </form>
      
      <div class="auth-toggle">
        <p>
          {{ isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?' }}
          <button @click="isLogin = !isLogin" class="btn-link">
            {{ isLogin ? 'Regístrate' : 'Inicia Sesión' }}
          </button>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { authService } from '../services/authService'

export default {
  name: 'ModalAuth',
  emits: ['close'],
  data() {
    return {
      isLogin: true,
      form: {
        nombre: '',
        email: '',
        password: '',
        confirmPassword: ''
      }
    }
  },
  methods: {
    async handleSubmit() {
      try {
        if (this.isLogin) {
          await authService.login(this.form.email, this.form.password)
        } else {
          if (this.form.password !== this.form.confirmPassword) {
            alert('Las contraseñas no coinciden')
            return
          }
          await authService.register(this.form.nombre, this.form.email, this.form.password)
        }
        this.$emit('close')
      } catch (error) {
        alert(error.message)
      }
    }
  }
}
</script>

<style scoped>
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-toggle {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.btn-link {
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  text-decoration: underline;
  font-family: inherit;
}
</style>