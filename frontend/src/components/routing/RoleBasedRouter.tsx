import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLE_DEFINITIONS } from '@/config/roles';

import CEODashboard from '@/pages/dashboards/CEODashboard';
import CFODashboard from '@/pages/dashboards/CFODashboard';
import CMODashboard from '@/pages/dashboards/CMODashboard';
import OperationsDirectorDashboard from '@/pages/dashboards/OperationsDirectorDashboard';
import RegionalManagerDashboard from '@/pages/dashboards/RegionalManagerDashboard';
import CategoryManagerDashboard from '@/pages/dashboards/CategoryManagerDashboard';
import ProductManagerDashboard from '@/pages/dashboards/ProductManagerDashboard';
import SellerPremiumDashboard from '@/pages/dashboards/SellerPremiumDashboard';
import VIPCustomerDashboard from '@/pages/dashboards/VIPCustomerDashboard';
import ContabilidadDashboard from '@/pages/dashboards/ContabilidadDashboard';
import MarketingManagerDashboard from '@/pages/dashboards/MarketingManagerDashboard';
import RRHHDashboard from '@/pages/dashboards/RRHHDashboard';
import CustomerSuccessDashboard from '@/pages/dashboards/CustomerSuccessDashboard';
import LogisticsCoordinatorDashboard from '@/pages/dashboards/LogisticsCoordinatorDashboard';

const RegularCustomerDashboard = () => <div className="p-6"><h1 className="text-2xl font-bold">Dashboard - En desarrollo</h1></div>;

const ROLE_DASHBOARDS: Record<string, React.FC> = {
  ceo: CEODashboard,
  cfo: CFODashboard,
  cmo: CMODashboard,
  operations_director: OperationsDirectorDashboard,
  regional_manager: RegionalManagerDashboard,
  category_manager: CategoryManagerDashboard,
  product_manager: ProductManagerDashboard,
  seller_premium: SellerPremiumDashboard,
  vip_customer: VIPCustomerDashboard,
  contador: ContabilidadDashboard,
  cfo_alt: ContabilidadDashboard,
  marketing_manager: MarketingManagerDashboard,
  rrhh: RRHHDashboard,
  customer_success: CustomerSuccessDashboard,
  logistics_coordinator: LogisticsCoordinatorDashboard,
  regular_customer: RegularCustomerDashboard
};

const RoleBasedRouter: React.FC = () => {
  const { usuario: user } = useAuthStore();

  if (!user) return <RegularCustomerDashboard />;

  const primaryRole = user.rol;
  const DashboardComponent = ROLE_DASHBOARDS[primaryRole] || RegularCustomerDashboard;
  const roleInfo = ROLE_DEFINITIONS[primaryRole];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900">{roleInfo?.name || 'Dashboard'}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleInfo?.color || 'bg-gray-100'} text-white`}>
                Nivel {roleInfo?.level || 'N/A'}
              </span>
            </div>
            <span className="text-sm text-gray-600">{user.nombre || user.email}</span>
          </div>
        </div>
      </div>
      <DashboardComponent />
    </div>
  );
};

export default RoleBasedRouter;