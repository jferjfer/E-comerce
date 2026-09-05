import React from 'react';
import RoleBasedNavigation from '@/components/navigation/RoleBasedNavigation';
import RoleBasedRouter from '@/components/routing/RoleBasedRouter';

const RoleBasedLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <RoleBasedNavigation />
      <div className="flex-1">
        <RoleBasedRouter />
      </div>
    </div>
  );
};

export default RoleBasedLayout;