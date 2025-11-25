import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, PieChart, Calculator } from 'lucide-react';

const CFODashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Financiero</h1>
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          CFO
        </span>
      </div>

      {/* Métricas Financieras */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Mensual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$847,392</div>
            <p className="text-xs text-muted-foreground">+15.2% vs mes anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margen Bruto</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42.8%</div>
            <p className="text-xs text-muted-foreground">+2.1% mejora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EBITDA</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$285,420</div>
            <p className="text-xs text-muted-foreground">33.7% margen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flujo de Caja</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$156,890</div>
            <p className="text-xs text-muted-foreground">Positivo</p>
          </CardContent>
        </Card>
      </div>

      {/* Análisis de Rentabilidad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Rentabilidad por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Vestidos</span>
                <span className="font-bold text-green-600">48.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Blazers</span>
                <span className="font-bold text-green-600">45.1%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Pantalones</span>
                <span className="font-bold text-yellow-600">38.7%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Camisas</span>
                <span className="font-bold text-red-600">32.4%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Costos Operativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Marketing</span>
                <span className="font-bold">$125,400 (14.8%)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Logística</span>
                <span className="font-bold">$89,200 (10.5%)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Personal</span>
                <span className="font-bold">$156,800 (18.5%)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Tecnología</span>
                <span className="font-bold">$45,600 (5.4%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Proyecciones Financieras */}
      <Card>
        <CardHeader>
          <CardTitle>Proyecciones Q1 2024</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">$2.8M</div>
              <div className="text-sm text-gray-600">Revenue Proyectado</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">45%</div>
              <div className="text-sm text-gray-600">Margen Objetivo</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">$950K</div>
              <div className="text-sm text-gray-600">EBITDA Proyectado</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CFODashboard;