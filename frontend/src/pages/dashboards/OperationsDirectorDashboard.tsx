import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Clock, CheckCircle, AlertTriangle, Users, Truck } from 'lucide-react';

const OperationsDirectorDashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Operacional</h1>
        <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
          Operations Director
        </span>
      </div>

      {/* KPIs Operacionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiencia Operacional</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">+3.8% vs mes anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio Entrega</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3 días</div>
            <p className="text-xs text-muted-foreground">-0.5 días mejora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Procesadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,847</div>
            <p className="text-xs text-muted-foreground">+18.5% vs mes anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidencias Activas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">-12 vs semana anterior</p>
          </CardContent>
        </Card>
      </div>

      {/* Procesos y Departamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Performance por Departamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Almacén</span>
                <div className="text-right">
                  <div className="font-bold text-green-600">97.8%</div>
                  <div className="text-xs">Eficiencia</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{width: '97.8%'}}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Logística</span>
                <div className="text-right">
                  <div className="font-bold text-blue-600">92.4%</div>
                  <div className="text-xs">Eficiencia</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{width: '92.4%'}}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Atención Cliente</span>
                <div className="text-right">
                  <div className="font-bold text-purple-600">89.6%</div>
                  <div className="text-xs">Satisfacción</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{width: '89.6%'}}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Calidad</span>
                <div className="text-right">
                  <div className="font-bold text-orange-600">95.2%</div>
                  <div className="text-xs">Aprobación</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{width: '95.2%'}}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="mr-2 h-5 w-5" />
              Logística y Entregas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Entregas a Tiempo</div>
                  <div className="text-xs text-gray-500">Últimos 30 días</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">94.7%</div>
                  <div className="text-xs">+2.3%</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Costo Promedio Envío</div>
                  <div className="text-xs text-gray-500">Por pedido</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">$8.45</div>
                  <div className="text-xs">-$0.85</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Devoluciones</div>
                  <div className="text-xs text-gray-500">Tasa mensual</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-600">3.2%</div>
                  <div className="text-xs">-0.8%</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Productos Dañados</div>
                  <div className="text-xs text-gray-500">En tránsito</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600">0.8%</div>
                  <div className="text-xs">-0.3%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimización de Procesos */}
      <Card>
        <CardHeader>
          <CardTitle>Optimización y Mejoras Continuas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">-15.2%</div>
              <div className="text-sm text-gray-600">Reducción Costos</div>
              <div className="text-xs text-gray-500">vs año anterior</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">+28.5%</div>
              <div className="text-sm text-gray-600">Productividad</div>
              <div className="text-xs text-gray-500">Mejora anual</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">98.7%</div>
              <div className="text-sm text-gray-600">Uptime Sistemas</div>
              <div className="text-xs text-gray-500">Disponibilidad</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OperationsDirectorDashboard;