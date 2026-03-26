import { useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLE_DEFINITIONS, hasPermission } from '@/config/roles';
import { Permission, UserRole } from '@/types/auth';

export const useRolePermissions = () => {
  const { usuario } = useAuthStore();
  const user = usuario ? { ...usuario, roles: [usuario.rol as UserRole], permissions: [] as Permission[], organizationId: '', isActive: true, lastLogin: new Date(), createdAt: new Date() } : null;

  const permissions = useMemo(() => {
    if (!user || !user.roles) return [];
    
    const allPermissions: Permission[] = [];
    
    user.roles.forEach(role => {
      const roleDefinition = ROLE_DEFINITIONS[role];
      if (roleDefinition) {
        allPermissions.push(...roleDefinition.permissions);
      }
    });
    
    return [...new Set(allPermissions)]; // Remove duplicates
  }, [user]);

  const primaryRole = useMemo(() => {
    if (!user || !user.roles || user.roles.length === 0) return null;
    
    return user.roles.reduce((highest, current) => {
      const currentLevel = ROLE_DEFINITIONS[current]?.level || 999;
      const highestLevel = ROLE_DEFINITIONS[highest]?.level || 999;
      return currentLevel < highestLevel ? current : highest;
    });
  }, [user]);

  const roleLevel = useMemo(() => {
    return primaryRole ? ROLE_DEFINITIONS[primaryRole]?.level || 999 : 999;
  }, [primaryRole]);

  const can = (permission: Permission): boolean => {
    return hasPermission(permissions, permission);
  };

  const canAny = (permissionList: Permission[]): boolean => {
    return permissionList.some(permission => can(permission));
  };

  const canAll = (permissionList: Permission[]): boolean => {
    return permissionList.every(permission => can(permission));
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.roles?.includes(role) || false;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  const isLevel = (level: number): boolean => {
    return roleLevel === level;
  };

  const isLevelOrAbove = (level: number): boolean => {
    return roleLevel <= level; // Lower numbers = higher hierarchy
  };

  const isLevelOrBelow = (level: number): boolean => {
    return roleLevel >= level;
  };

  // Specific role checks
  const isExecutive = (): boolean => {
    return hasAnyRole(['ceo', 'cfo', 'cmo']);
  };

  const isDirector = (): boolean => {
    return hasAnyRole(['operations_director', 'tech_director', 'regional_manager']);
  };

  const isManager = (): boolean => {
    return hasAnyRole(['category_manager', 'brand_manager', 'inventory_manager', 'marketing_manager']);
  };

  const isSeller = (): boolean => {
    return hasAnyRole(['seller_premium', 'seller_standard', 'seller_basic']);
  };

  const isCustomer = (): boolean => {
    return hasAnyRole(['cliente'] as UserRole[]);
  };

  const isPremiumCustomer = (): boolean => {
    return hasAnyRole(['cliente'] as UserRole[]);
  };

  // Data filtering helpers
  const canViewRegion = (regionId: string): boolean => {
    if (can('*' as Permission)) return true;
    return true;
  };

  const canViewCategory = (categoryId: string): boolean => {
    if (can('*' as Permission)) return true;
    return true;
  };

  const canViewBrand = (brandId: string): boolean => {
    if (can('*' as Permission)) return true;
    return true;
  };

  return {
    // Basic permission checks
    can,
    canAny,
    canAll,
    
    // Role checks
    hasRole,
    hasAnyRole,
    
    // Level checks
    isLevel,
    isLevelOrAbove,
    isLevelOrBelow,
    
    // Specific role type checks
    isExecutive,
    isDirector,
    isManager,
    isSeller,
    isCustomer,
    isPremiumCustomer,
    
    // Data filtering
    canViewRegion,
    canViewCategory,
    canViewBrand,
    
    // User info
    user,
    primaryRole,
    roleLevel,
    permissions,
    
    // Role definition
    roleDefinition: primaryRole ? ROLE_DEFINITIONS[primaryRole] : null
  };
};

export default useRolePermissions;