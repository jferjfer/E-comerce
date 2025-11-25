import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Shield, Users, Crown } from 'lucide-react';
import { ROLE_DEFINITIONS } from '@/config/roles';

const UserManagement = () => {
  const [selectedRole, setSelectedRole] = useState('');

  const mockUsers = [
    { id: '1', name: 'Fernando Vertel', email: 'ceo@estilomoda.com', role: 'ceo', status: 'active' },
    { id: '2', name: 'Ana García', email: 'ana@estilomoda.com', role: 'cfo', status: 'active' },
    { id: '3', name: 'Carlos López', email: 'carlos@estilomoda.com', role: 'regional_manager', status: 'active' },
    { id: '4', name: 'María Rodríguez', email: 'maria@estilomoda.com', role: 'product_manager', status: 'active' },
    { id: '5', name: 'José Martínez', email: 'jose@estilomoda.com', role: 'seller_premium', status: 'active' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Crear Usuario
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">+12% vs mes anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,198</div>
            <p className="text-xs text-muted-foreground">96.1% activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos Este Mes</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">+18% crecimiento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles Únicos</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Roles configurados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <select 
              className="px-3 py-2 border rounded-lg"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="">Todos los roles</option>
              {Object.entries(ROLE_DEFINITIONS).map(([key, role]) => (
                <option key={key} value={key}>
                  {role.name} (Nivel {role.level})
                </option>
              ))}
            </select>
            <input 
              type="text" 
              placeholder="Buscar por nombre o email..."
              className="px-3 py-2 border rounded-lg flex-1"
            />
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              Buscar
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Usuario</th>
                  <th className="text-left p-3">Rol</th>
                  <th className="text-left p-3">Nivel</th>
                  <th className="text-left p-3">Estado</th>
                  <th className="text-left p-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mockUsers.map((user) => {
                  const roleConfig = ROLE_DEFINITIONS[user.role];
                  return (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleConfig?.color || 'bg-gray-100'} text-white`}>
                          {roleConfig?.name || user.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm font-medium">
                          Nivel {roleConfig?.level || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex space-x-2">
                          <button className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-red-600 hover:bg-red-100 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;