import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag, TrendingUp, Package, DollarSign } from 'lucide-react';

const CategoryManagerDashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard - Categoría Vestidos</h1>
        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
          Category Manager
        </span>
      </div>

      {/* Métricas de Categoría */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Vestidos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$285,420</div>
            <p className="text-xs text-muted-foreground">+28.5% vs mes anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Activos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">+12 nuevos este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margen Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48.2%</div>
            <p className="text-xs text-muted-foreground">+3.1% mejora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rotación Stock</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.5x</div>
            <p className="text-xs text-muted-foreground">Excelente rotación</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance por Subcategoría */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance por Subcategoría</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Vestidos Profesionales</span>
                <div className="text-right">
                  <div className="font-bold">$125,680</div>
                  <div className="text-xs text-green-600">+35.2%</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Vestidos Casuales</span>
                <div className="text-right">
                  <div className="font-bold">$89,420</div>
                  <div className="text-xs text-green-600">+22.1%</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Vestidos de Noche</span>
                <div className="text-right">
                  <div className="font-bold">$45,680</div>
                  <div className="text-xs text-yellow-600">+8.5%</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Vestidos de Verano</span>
                <div className="text-right">
                  <div className="font-bold">$24,640</div>
                  <div className="text-xs text-red-600">-5.2%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Productos - Vestidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Vestido Profesional IA</div>
                  <div className="text-xs text-gray-500">SKU: VES001</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">$89.99</div>
                  <div className="text-xs text-green-600">245 vendidos</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Vestido Midi Elegante</div>
                  <div className="text-xs text-gray-500">SKU: VES002</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">$65.90</div>
                  <div className="text-xs text-green-600">189 vendidos</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Vestido Casual Verano</div>
                  <div className="text-xs text-gray-500">SKU: VES003</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">$45.50</div>
                  <div className="text-xs text-yellow-600">156 vendidos</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análisis Competitivo */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis Competitivo - Vestidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">$89.99</div>
              <div className="text-sm text-gray-600">Precio Promedio</div>
              <div className="text-xs text-gray-500">vs $95.50 competencia</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">4.8★</div>
              <div className="text-sm text-gray-600">Rating Promedio</div>
              <div className="text-xs text-gray-500">vs 4.3★ mercado</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">25%</div>
              <div className="text-sm text-gray-600">Market Share</div>
              <div className="text-xs text-gray-500">Categoría vestidos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">156</div>
              <div className="text-sm text-gray-600">SKUs Activos</div>
              <div className="text-xs text-gray-500">vs 89 competencia</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryManagerDashboard;