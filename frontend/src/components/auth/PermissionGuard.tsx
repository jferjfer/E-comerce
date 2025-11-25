import React from 'react';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { Permission, UserRole } from '@/types/auth';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  role?: UserRole;
  roles?: UserRole[];
  level?: number;
  levelOrAbove?: number;
  levelOrBelow?: number;
  requireAll?: boolean; // For permissions array
  fallback?: React.ReactNode;
  regionId?: string;
  categoryId?: string;
  brandId?: string;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions,
  role,
  roles,
  level,
  levelOrAbove,
  levelOrBelow,
  requireAll = false,
  fallback = null,
  regionId,
  categoryId,
  brandId
}) => {
  const {
    can,
    canAny,
    canAll,
    hasRole,
    hasAnyRole,
    isLevel,
    isLevelOrAbove,
    isLevelOrBelow,
    canViewRegion,
    canViewCategory,
    canViewBrand
  } = useRolePermissions();

  // Check single permission
  if (permission && !can(permission)) {
    return <>{fallback}</>;
  }

  // Check multiple permissions
  if (permissions) {
    const hasPermissions = requireAll ? canAll(permissions) : canAny(permissions);
    if (!hasPermissions) {
      return <>{fallback}</>;
    }
  }

  // Check single role
  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  // Check multiple roles
  if (roles && !hasAnyRole(roles)) {
    return <>{fallback}</>;
  }

  // Check exact level
  if (level !== undefined && !isLevel(level)) {
    return <>{fallback}</>;
  }

  // Check level or above
  if (levelOrAbove !== undefined && !isLevelOrAbove(levelOrAbove)) {
    return <>{fallback}</>;
  }

  // Check level or below
  if (levelOrBelow !== undefined && !isLevelOrBelow(levelOrBelow)) {
    return <>{fallback}</>;
  }

  // Check region access
  if (regionId && !canViewRegion(regionId)) {
    return <>{fallback}</>;
  }

  // Check category access
  if (categoryId && !canViewCategory(categoryId)) {
    return <>{fallback}</>;
  }

  // Check brand access
  if (brandId && !canViewBrand(brandId)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGuard;