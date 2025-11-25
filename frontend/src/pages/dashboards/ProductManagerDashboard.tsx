import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, Star, AlertCircle, Plus, Edit } from 'lucide-react';

const ProductManagerDashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium">
            Product Manager
          </span>
          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Métricas de Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Activos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">+45 este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating Promedio</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.6★</div>
            <p className="text-xs text-muted-foreground">+0.2 vs mes anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">Requieren revisión</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversión Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6.8%</div>
            <p className="text-xs text-muted-foreground">+1.2% mejora</p>
          </CardContent>
        </Card>
      </div>

      {/* Gestión de Productos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Edit className="mr-2 h-5 w-5" />
              Productos Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Vestido Primavera 2024</div>
                  <div className="text-xs text-gray-500">SKU: VES024 • Creado hoy</div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                    Pendiente
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Blazer Ejecutivo Pro</div>
                  <div className="text-xs text-gray-500">SKU: BLA025 • Ayer</div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                    Activo
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Pantalón Casual Flex</div>
                  <div className="text-xs text-gray-500">SKU: PAN026 • 2 días</div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    Revisión
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Vestido Profesional IA</div>
                  <div className="text-xs text-gray-500">245 ventas • 4.8★</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">$21,975</div>
                  <div className="text-xs">Revenue</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Blazer Inteligente IA</div>
                  <div className="text-xs text-gray-500">189 ventas • 4.7★</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">$24,561</div>
                  <div className="text-xs">Revenue</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Pantalón Versátil</div>
                  <div className="text-xs text-gray-500">156 ventas • 4.5★</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-purple-600">$12,464</div>
                  <div className="text-xs">Revenue</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Herramientas de Gestión */}
      <Card>
        <CardHeader>
          <CardTitle>Herramientas de Gestión</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-center">
              <Package className="mx-auto h-6 w-6 text-teal-600 mb-2" />
              <div className="font-medium">Crear Producto</div>
              <div className="text-xs text-gray-500">Nuevo SKU</div>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-center">
              <Edit className="mx-auto h-6 w-6 text-blue-600 mb-2" />
              <div className="font-medium">Editar Masivo</div>
              <div className="text-xs text-gray-500">Múltiples productos</div>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-center">
              <Star className="mx-auto h-6 w-6 text-yellow-600 mb-2" />
              <div className="font-medium">Gestionar Reviews</div>
              <div className="text-xs text-gray-500">Moderar reseñas</div>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-center">
              <TrendingUp className="mx-auto h-6 w-6 text-green-600 mb-2" />
              <div className="font-medium">Analytics</div>
              <div className="text-xs text-gray-500">Reportes detallados</div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Alertas y Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-orange-500" />
            Alertas y Acciones Requeridas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500 mr-3" />
              <div className="flex-1">
                <div className="font-medium text-red-800">Stock Bajo</div>
                <div className="text-sm text-red-600">5 productos con menos de 10 unidades</div>
              </div>
              <button className="px-3 py-1 bg-red-600 text-white rounded text-sm">
                Revisar
              </button>
            </div>
            <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-500 mr-3" />
              <div className="flex-1">
                <div className="font-medium text-yellow-800">Precios Pendientes</div>
                <div className="text-sm text-yellow-600">12 productos requieren aprobación de precios</div>
              </div>
              <button className="px-3 py-1 bg-yellow-600 text-white rounded text-sm">
                Aprobar
              </button>
            </div>
            <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-500 mr-3" />
              <div className="flex-1">
                <div className="font-medium text-blue-800">Nuevas Reseñas</div>
                <div className="text-sm text-blue-600">8 reseñas pendientes de moderación</div>
              </div>
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                Moderar
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductManagerDashboard;