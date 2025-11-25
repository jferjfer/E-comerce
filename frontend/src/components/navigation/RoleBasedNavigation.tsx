import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { ROLE_DEFINITIONS } from '@/config/roles';
import { 
  Crown, DollarSign, Megaphone, Settings, Globe, Tag, 
  Package, Users, Headphones, Store, Star, User 
} from 'lucide-react';

const RoleBasedNavigation = () => {
  const { user } = useAuthStore();
  
  if (!user || !user.roles) return null;

  const primaryRole = user.roles[0];
  const roleConfig = ROLE_DEFINITIONS[primaryRole];

  const getNavigationItems = () => {
    switch (primaryRole) {
      case 'ceo':
        return [
          { icon: Crown, label: 'Dashboard Ejecutivo', path: '/dashboard' },
          { icon: DollarSign, label: 'Finanzas', path: '/finances' },
          { icon: Users, label: 'Equipos', path: '/teams' },
          { icon: Globe, label: 'Expansión', path: '/expansion' }
        ];
      
      case 'cfo':
        return [
          { icon: DollarSign, label: 'Dashboard Financiero', path: '/dashboard' },
          { icon: Package, label: 'Rentabilidad', path: '/profitability' },
          { icon: Settings, label: 'Precios', path: '/pricing' }
        ];
      
      case 'cmo':
        return [
          { icon: Megaphone, label: 'Dashboard Marketing', path: '/dashboard' },
          { icon: Users, label: 'Campañas', path: '/campaigns' },
          { icon: Star, label: 'Analytics', path: '/analytics' }
        ];
      
      case 'regional_manager':
        return [
          { icon: Globe, label: 'Dashboard Regional', path: '/dashboard' },
          { icon: Users, label: 'Mi Equipo', path: '/team' },
          { icon: Package, label: 'Inventario Regional', path: '/inventory' }
        ];
      
      case 'seller_premium':
        return [
          { icon: Store, label: 'Mi Dashboard', path: '/dashboard' },
          { icon: Package, label: 'Mis Productos', path: '/products' },
          { icon: DollarSign, label: 'Comisiones', path: '/commissions' }
        ];
      
      case 'vip_customer':
        return [
          { icon: Crown, label: 'Mi Dashboard VIP', path: '/dashboard' },
          { icon: Package, label: 'Exclusivos', path: '/exclusive' },
          { icon: Star, label: 'Mis Puntos', path: '/points' }
        ];
      
      default:
        return [
          { icon: User, label: 'Dashboard', path: '/dashboard' },
          { icon: Package, label: 'Productos', path: '/products' }
        ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <nav className="bg-white shadow-sm border-r border-gray-200 w-64 min-h-screen">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${roleConfig?.color || 'bg-gray-100'}`}>
            <Crown className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {roleConfig?.name || 'Usuario'}
            </div>
            <div className="text-xs text-gray-500">
              Nivel {roleConfig?.level || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="space-y-2">
          {navigationItems.map((item, index) => (
            <button
              key={index}
              className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <item.icon className="h-5 w-5 text-gray-500" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default RoleBasedNavigation;