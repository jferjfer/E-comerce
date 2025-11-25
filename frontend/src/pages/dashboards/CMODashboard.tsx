import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, Users, TrendingUp, Target, Eye, MousePointer } from 'lucide-react';

const CMODashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Marketing</h1>
        <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium">
          CMO
        </span>
      </div>

      {/* KPIs Marketing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI Campañas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">485%</div>
            <p className="text-xs text-muted-foreground">+125% vs trimestre anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CAC (Costo Adquisición)</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$24.50</div>
            <p className="text-xs text-muted-foreground">-18.2% optimización</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LTV Cliente</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$485.60</div>
            <p className="text-xs text-muted-foreground">+32.1% vs año anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversión Global</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.7%</div>
            <p className="text-xs text-muted-foreground">+2.1% mejora</p>
          </CardContent>
        </Card>
      </div>

      {/* Campañas Activas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Megaphone className="mr-2 h-5 w-5" />
              Campañas Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Primavera 2024</div>
                  <div className="text-xs text-gray-500">Google Ads + Facebook</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">ROI: 520%</div>
                  <div className="text-xs">$45K gastado</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Influencer Fashion</div>
                  <div className="text-xs text-gray-500">Instagram + TikTok</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">ROI: 380%</div>
                  <div className="text-xs">$28K gastado</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Email Retargeting</div>
                  <div className="text-xs text-gray-500">Automatización</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-purple-600">ROI: 650%</div>
                  <div className="text-xs">$12K gastado</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="mr-2 h-5 w-5" />
              Canales de Adquisición
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Búsqueda Orgánica</span>
                <div className="text-right">
                  <div className="font-bold">35.2%</div>
                  <div className="text-xs text-green-600">+8.5%</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{width: '35.2%'}}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Redes Sociales</span>
                <div className="text-right">
                  <div className="font-bold">28.7%</div>
                  <div className="text-xs text-blue-600">+12.3%</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{width: '28.7%'}}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Email Marketing</span>
                <div className="text-right">
                  <div className="font-bold">18.9%</div>
                  <div className="text-xs text-purple-600">+5.2%</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{width: '18.9%'}}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Publicidad Pagada</span>
                <div className="text-right">
                  <div className="font-bold">17.2%</div>
                  <div className="text-xs text-orange-600">+3.1%</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{width: '17.2%'}}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segmentación de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Segmentación y Retención de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">15.2%</div>
              <div className="text-sm text-gray-600">Clientes VIP</div>
              <div className="text-xs text-gray-500">Alto valor</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">32.8%</div>
              <div className="text-sm text-gray-600">Clientes Premium</div>
              <div className="text-xs text-gray-500">Frecuentes</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">52.0%</div>
              <div className="text-sm text-gray-600">Clientes Regulares</div>
              <div className="text-xs text-gray-500">Estándar</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">85.4%</div>
              <div className="text-sm text-gray-600">Retención 12M</div>
              <div className="text-xs text-gray-500">+8.2% vs año anterior</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CMODashboard;