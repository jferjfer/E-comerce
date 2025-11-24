const API_BASE_URL = 'http://localhost:3000';

export const api = {
  async getProducts() {
    const response = await fetch(`${API_BASE_URL}/api/productos`);
    return response.json();
  },

  async getCategories() {
    const response = await fetch(`${API_BASE_URL}/api/categorias`);
    return response.json();
  },

  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  async register(data: any) {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};