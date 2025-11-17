const API_BASE = 'http://localhost:3001/api/auth'

export const authService = {
  async login(email, password) {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })
    
    if (!response.ok) {
      throw new Error('Error en el login')
    }
    
    const data = await response.json()
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('token', data.token)
    }
    return data
  },

  async register(nombre, email, password) {
    const response = await fetch(`${API_BASE}/registro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nombre, email, password })
    })
    
    if (!response.ok) {
      throw new Error('Error en el registro')
    }
    
    const data = await response.json()
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('token', data.token)
    }
    return data
  },

  logout() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('token')
    }
  },

  getToken() {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('token')
    }
    return null
  },

  isAuthenticated() {
    return !!this.getToken()
  }
}