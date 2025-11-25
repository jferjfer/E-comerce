import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { ROLE_DEFINITIONS } from '@/config/roles';

// Importar dashboards implementados
import CEODashboard from '@/pages/dashboards/CEODashboard';
import CFODashboard from '@/pages/dashboards/CFODashboard';
import CMODashboard from '@/pages/dashboards/CMODashboard';
import OperationsDirectorDashboard from '@/pages/dashboards/OperationsDirectorDashboard';
import RegionalManagerDashboard from '@/pages/dashboards/RegionalManagerDashboard';
import CategoryManagerDashboard from '@/pages/dashboards/CategoryManagerDashboard';
import ProductManagerDashboard from '@/pages/dashboards/ProductManagerDashboard';
import SellerPremiumDashboard from '@/pages/dashboards/SellerPremiumDashboard';
import VIPCustomerDashboard from '@/pages/dashboards/VIPCustomerDashboard';

// Dashboards por implementar
const RegularCustomerDashboard = () => <div className="p-6"><h1 className="text-2xl font-bold">Regular Customer Dashboard - En desarrollo</h1></div>;

const ROLE_DASHBOARDS = {
  ceo: CEODashboard,
  cfo: CFODashboard,
  cmo: CMODashboard,
  operations_director: OperationsDirectorDashboard,
  regional_manager: RegionalManagerDashboard,
  category_manager: CategoryManagerDashboard,
  product_manager: ProductManagerDashboard,
  seller_premium: SellerPremiumDashboard,
  vip_customer: VIPCustomerDashboard,
  regular_customer: RegularCustomerDashboard
};

const RoleBasedRouter: React.FC = () => {
  const { user } = useAuthStore();
  
  if (!user || !user.roles || user.roles.length === 0) {
    return <RegularCustomerDashboard />;
  }

  // Obtener el rol principal (el de mayor jerarquía)
  const primaryRole = user.roles.reduce((highest, current) => {
    const currentLevel = ROLE_DEFINITIONS[current]?.level || 999;
    const highestLevel = ROLE_DEFINITIONS[highest]?.level || 999;
    return currentLevel < highestLevel ? current : highest;
  });

  const DashboardComponent = ROLE_DASHBOARDS[primaryRole] || RegularCustomerDashboard;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {ROLE_DEFINITIONS[primaryRole]?.name || 'Dashboard'}
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${ROLE_DEFINITIONS[primaryRole]?.color || 'bg-gray-100'} text-white`}>
                Nivel {ROLE_DEFINITIONS[primaryRole]?.level || 'N/A'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {user.name || user.email}
              </span>
            </div>
          </div>
        </div>
      </div>
      <DashboardComponent />
    </div>
  );
};

export default RoleBasedRouter;