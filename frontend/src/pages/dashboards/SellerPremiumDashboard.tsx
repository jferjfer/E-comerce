import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Users, Package, Target, Award } from 'lucide-react';

const SellerPremiumDashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Vendedor Premium</h1>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
            Seller Premium
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            ⭐ Top Performer
          </span>
        </div>
      </div>

      {/* Métricas de Ventas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,680</div>
            <p className="text-xs text-muted-foreground">+32.5% vs mes anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comisiones</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$4,568</div>
            <p className="text-xs text-muted-foreground">10% comisión promedio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">284</div>
            <p className="text-xs text-muted-foreground">+18 nuevos este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta Mensual</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128%</div>
            <p className="text-xs text-muted-foreground">Meta: $35,000</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance y Productos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Performance Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Semana 1</span>
                <div className="text-right">
                  <div className="font-bold">$12,450</div>
                  <div className="text-xs text-green-600">+25%</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Semana 2</span>
                <div className="text-right">
                  <div className="font-bold">$11,680</div>
                  <div className="text-xs text-green-600">+18%</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Semana 3</span>
                <div className="text-right">
                  <div className="font-bold">$13,250</div>
                  <div className="text-xs text-green-600">+35%</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Semana 4</span>
                <div className="text-right">
                  <div className="font-bold">$8,300</div>
                  <div className="text-xs text-yellow-600">+8%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Top Productos Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Vestido Profesional IA</div>
                  <div className="text-xs text-gray-500">SKU: VES001</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">45 vendidos</div>
                  <div className="text-xs text-green-600">$4,049.55</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Blazer Inteligente IA</div>
                  <div className="text-xs text-gray-500">SKU: BLA001</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">28 vendidos</div>
                  <div className="text-xs text-green-600">$3,637.20</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Pantalón Versátil</div>
                  <div className="text-xs text-gray-500">SKU: PAN001</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">32 vendidos</div>
                  <div className="text-xs text-green-600">$2,556.80</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Herramientas Premium */}
      <Card>
        <CardHeader>
          <CardTitle>Herramientas Premium Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <Package className="mx-auto h-8 w-8 text-blue-600 mb-2" />
              <div className="font-medium">Gestión Completa</div>
              <div className="text-xs text-gray-500">CRUD productos, precios especiales</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <TrendingUp className="mx-auto h-8 w-8 text-green-600 mb-2" />
              <div className="font-medium">Analytics Avanzados</div>
              <div className="text-xs text-gray-500">Reportes detallados, métricas</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Users className="mx-auto h-8 w-8 text-purple-600 mb-2" />
              <div className="font-medium">Clientes VIP</div>
              <div className="text-xs text-gray-500">Acceso a base premium</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ranking y Reconocimientos */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking y Reconocimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gold-600">#3</div>
              <div className="text-sm text-gray-600">Ranking Nacional</div>
              <div className="text-xs text-gray-500">Top Sellers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">⭐⭐⭐⭐⭐</div>
              <div className="text-sm text-gray-600">Rating Cliente</div>
              <div className="text-xs text-gray-500">4.9/5.0 promedio</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">🏆</div>
              <div className="text-sm text-gray-600">Vendedor del Mes</div>
              <div className="text-xs text-gray-500">Enero 2024</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">💎</div>
              <div className="text-sm text-gray-600">Status Premium</div>
              <div className="text-xs text-gray-500">Desde 2023</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerPremiumDashboard;