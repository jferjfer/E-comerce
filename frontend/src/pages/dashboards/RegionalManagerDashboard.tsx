import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Users, TrendingUp, Package } from 'lucide-react';

const RegionalManagerDashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Regional - Norte</h1>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
          Gerente Regional
        </span>
      </div>

      {/* Métricas Regionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Región Norte</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$425,680</div>
            <p className="text-xs text-muted-foreground">+22.1% vs mes anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8,945</div>
            <p className="text-xs text-muted-foreground">+15.3% crecimiento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendedores Activos</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">3 ciudades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventario Regional</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">productos en stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance por Ciudad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance por Ciudad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Monterrey</span>
                <div className="text-right">
                  <div className="font-bold">$185,420</div>
                  <div className="text-xs text-green-600">+18.5%</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Guadalajara</span>
                <div className="text-right">
                  <div className="font-bold">$142,680</div>
                  <div className="text-xs text-green-600">+25.2%</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Tijuana</span>
                <div className="text-right">
                  <div className="font-bold">$97,580</div>
                  <div className="text-xs text-yellow-600">+8.1%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Vendedores Región</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Ana García</div>
                  <div className="text-xs text-gray-500">Monterrey</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">$45,680</div>
                  <div className="text-xs text-green-600">128% meta</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Carlos López</div>
                  <div className="text-xs text-gray-500">Guadalajara</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">$38,920</div>
                  <div className="text-xs text-green-600">115% meta</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">María Rodríguez</div>
                  <div className="text-xs text-gray-500">Tijuana</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">$32,450</div>
                  <div className="text-xs text-yellow-600">95% meta</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparativa Regional */}
      <Card>
        <CardHeader>
          <CardTitle>Comparativa vs Otras Regiones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">#1</div>
              <div className="text-sm text-gray-600">Ranking Nacional</div>
              <div className="text-xs text-gray-500">Región Norte</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">22.1%</div>
              <div className="text-sm text-gray-600">Crecimiento</div>
              <div className="text-xs text-gray-500">vs 15.8% promedio</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">$47.6</div>
              <div className="text-sm text-gray-600">Ticket Promedio</div>
              <div className="text-xs text-gray-500">vs $42.3 nacional</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">4.8★</div>
              <div className="text-sm text-gray-600">Satisfacción</div>
              <div className="text-xs text-gray-500">vs 4.5★ promedio</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegionalManagerDashboard;