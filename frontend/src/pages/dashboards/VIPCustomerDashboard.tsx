import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Gift, Star, ShoppingBag, Heart, Zap } from 'lucide-react';

const VIPCustomerDashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Bienvenida, Isabella ✨</h1>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-medium">
            👑 Cliente VIP
          </span>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
            💎 Diamante
          </span>
        </div>
      </div>

      {/* Beneficios VIP */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Descuento VIP</CardTitle>
            <Crown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">25%</div>
            <p className="text-xs text-yellow-600">En toda la tienda</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Puntos Acumulados</CardTitle>
            <Star className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">15,847</div>
            <p className="text-xs text-purple-600">= $158.47 en crédito</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Envío Gratis</CardTitle>
            <Zap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">∞</div>
            <p className="text-xs text-green-600">Siempre gratis</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compras VIP</CardTitle>
            <ShoppingBag className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">47</div>
            <p className="text-xs text-blue-600">Este año</p>
          </CardContent>
        </Card>
      </div>

      {/* Productos Exclusivos VIP */}
      <Card className="border-2 border-gold-200 bg-gradient-to-r from-yellow-50 to-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center text-yellow-800">
            <Crown className="mr-2 h-5 w-5" />
            Colección Exclusiva VIP ✨
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border border-yellow-200 rounded-lg bg-white">
              <div className="w-full h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg mb-3 flex items-center justify-center">
                <Crown className="h-8 w-8 text-purple-600" />
              </div>
              <div className="font-medium">Vestido Exclusivo Diamante</div>
              <div className="text-sm text-gray-600">Solo para VIP</div>
              <div className="text-lg font-bold text-purple-600 mt-2">$299.99</div>
              <div className="text-xs text-green-600">25% OFF = $224.99</div>
            </div>
            <div className="text-center p-4 border border-yellow-200 rounded-lg bg-white">
              <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg mb-3 flex items-center justify-center">
                <Star className="h-8 w-8 text-blue-600" />
              </div>
              <div className="font-medium">Blazer Edición Limitada</div>
              <div className="text-sm text-gray-600">Acceso anticipado</div>
              <div className="text-lg font-bold text-blue-600 mt-2">$199.99</div>
              <div className="text-xs text-green-600">25% OFF = $149.99</div>
            </div>
            <div className="text-center p-4 border border-yellow-200 rounded-lg bg-white">
              <div className="w-full h-32 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg mb-3 flex items-center justify-center">
                <Gift className="h-8 w-8 text-green-600" />
              </div>
              <div className="font-medium">Set Premium Completo</div>
              <div className="text-sm text-gray-600">Bundle VIP</div>
              <div className="text-lg font-bold text-green-600 mt-2">$449.99</div>
              <div className="text-xs text-green-600">25% OFF = $337.49</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Servicios Premium */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="mr-2 h-5 w-5 text-red-500" />
              Servicios Premium VIP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Asesoría Personal de Estilo</span>
                </div>
                <span className="text-green-600 font-medium">Activo</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Soporte Prioritario 24/7</span>
                </div>
                <span className="text-green-600 font-medium">Disponible</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Devoluciones Extendidas (60 días)</span>
                </div>
                <span className="text-green-600 font-medium">Incluido</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>Probador Virtual AR</span>
                </div>
                <span className="text-blue-600 font-medium">Beta</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gift className="mr-2 h-5 w-5 text-purple-500" />
              Recompensas y Beneficios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="font-medium text-purple-800">🎁 Regalo de Cumpleaños</div>
                <div className="text-sm text-purple-600">Producto gratis hasta $150</div>
                <div className="text-xs text-purple-500">Próximo: 15 de Marzo</div>
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="font-medium text-yellow-800">⚡ Early Access</div>
                <div className="text-sm text-yellow-600">48h antes que otros clientes</div>
                <div className="text-xs text-yellow-500">Próxima colección: 1 Feb</div>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="font-medium text-green-800">💎 Eventos Exclusivos</div>
                <div className="text-sm text-green-600">Fashion shows privados</div>
                <div className="text-xs text-green-500">Próximo: 20 de Febrero</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historial y Estadísticas */}
      <Card>
        <CardHeader>
          <CardTitle>Tu Historial VIP</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">$12,847</div>
              <div className="text-sm text-gray-600">Total Gastado</div>
              <div className="text-xs text-gray-500">Este año</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">$3,211</div>
              <div className="text-sm text-gray-600">Ahorrado con VIP</div>
              <div className="text-xs text-gray-500">En descuentos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">4.9★</div>
              <div className="text-sm text-gray-600">Satisfacción</div>
              <div className="text-xs text-gray-500">Promedio reseñas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">2.5 años</div>
              <div className="text-sm text-gray-600">Cliente VIP</div>
              <div className="text-xs text-gray-500">Desde Julio 2021</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VIPCustomerDashboard;