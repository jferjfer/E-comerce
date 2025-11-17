const URL_BASE_API = 'http://localhost:3002/api';
const URL_AUTH_API = 'http://localhost:3001/api';

const apiCliente = {
  async get(url) {
    const token = localStorage.getItem('tokenUsuario');
    const baseUrl = url.startsWith('/auth') ? URL_AUTH_API : URL_BASE_API;
    const response = await fetch(`${baseUrl}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });
    return { data: await response.json() };
  },

  async post(url, data) {
    const token = localStorage.getItem('tokenUsuario');
    const baseUrl = url.startsWith('/auth') ? URL_AUTH_API : URL_BASE_API;
    const fullUrl = `${baseUrl}${url}`;
    console.log('🌐 URL completa:', fullUrl);
    console.log('📦 Datos a enviar:', data);
    
    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(data)
      });
      
      console.log('📊 Status:', response.status);
      console.log('📊 OK:', response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log('📝 Respuesta del servidor:', responseData);
      
      return { data: responseData };
    } catch (error) {
      console.error('🚨 Error en fetch:', error);
      throw error;
    }
  }
};

export default apiCliente;