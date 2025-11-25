import { User } from '@/types/auth';

export class RoleFilters {
  /**
   * Filtra productos según el rol del usuario
   */
  static filterProductsByRole(products: any[], user: User): any[] {
    if (!user || !user.roles) return products;

    const primaryRole = user.roles[0];

    switch (primaryRole) {
      case 'vip_customer':
        // VIP ve todos los productos + exclusivos
        return products;
      
      case 'premium_customer':
        // Premium ve productos estándar + early access
        return products.filter(p => !p.vip_only);
      
      case 'regular_customer':
        // Regular ve solo productos públicos
        return products.filter(p => !p.vip_only && !p.premium_only);
      
      case 'category_manager':
        // Solo productos de sus categorías asignadas
        if (user.categoryIds) {
          return products.filter(p => user.categoryIds!.includes(p.categoryId));
        }
        return products;
      
      case 'regional_manager':
        // Solo productos disponibles en su región
        if (user.regionId) {
          return products.filter(p => 
            !p.regional_restrictions || 
            p.available_regions?.includes(user.regionId!)
          );
        }
        return products;
      
      case 'brand_manager':
        // Solo productos de sus marcas asignadas
        if (user.brandIds) {
          return products.filter(p => user.brandIds!.includes(p.brandId));
        }
        return products;
      
      default:
        return products;
    }
  }

  /**
   * Filtra órdenes según el rol del usuario
   */
  static filterOrdersByRole(orders: any[], user: User): any[] {
    if (!user || !user.roles) return [];

    const primaryRole = user.roles[0];

    switch (primaryRole) {
      case 'regional_manager':
        // Solo órdenes de su región
        return orders.filter(order => 
          order.shipping_region === user.regionId ||
          order.customer_region === user.regionId
        );
      
      case 'seller_premium':
      case 'seller_standard':
      case 'seller_basic':
        // Solo sus propias órdenes
        return orders.filter(order => order.seller_id === user.id);
      
      case 'customer_success':
      case 'support_agent':
        // Órdenes que requieren soporte
        return orders.filter(order => 
          ['pending_support', 'issue_reported', 'refund_requested'].includes(order.status)
        );
      
      default:
        return orders;
    }
  }

  /**
   * Filtra usuarios según el rol del usuario actual
   */
  static filterUsersByRole(users: any[], currentUser: User): any[] {
    if (!currentUser || !currentUser.roles) return [];

    const primaryRole = currentUser.roles[0];

    switch (primaryRole) {
      case 'regional_manager':
        // Solo usuarios de su región
        return users.filter(user => user.regionId === currentUser.regionId);
      
      case 'category_manager':
        // Solo usuarios relacionados con sus categorías
        return users.filter(user => 
          user.roles.includes('seller_premium') || 
          user.roles.includes('seller_standard') ||
          user.roles.includes('seller_basic')
        );
      
      case 'customer_success':
        // Solo clientes
        return users.filter(user => 
          user.roles.includes('vip_customer') ||
          user.roles.includes('premium_customer') ||
          user.roles.includes('regular_customer')
        );
      
      default:
        return users;
    }
  }

  /**
   * Obtiene métricas filtradas por rol
   */
  static getFilteredMetrics(allMetrics: any, user: User): any {
    if (!user || !user.roles) return {};

    const primaryRole = user.roles[0];
    const filteredMetrics = { ...allMetrics };

    switch (primaryRole) {
      case 'regional_manager':
        // Solo métricas de su región
        return {
          sales: allMetrics.sales_by_region?.[user.regionId!] || 0,
          customers: allMetrics.customers_by_region?.[user.regionId!] || 0,
          orders: allMetrics.orders_by_region?.[user.regionId!] || 0,
          region: user.regionId
        };
      
      case 'category_manager':
        // Solo métricas de sus categorías
        const categoryMetrics = {};
        if (user.categoryIds) {
          user.categoryIds.forEach(categoryId => {
            categoryMetrics[categoryId] = allMetrics.categories?.[categoryId] || {};
          });
        }
        return {
          categories: categoryMetrics,
          assigned_categories: user.categoryIds
        };
      
      case 'seller_premium':
      case 'seller_standard':
      case 'seller_basic':
        // Solo sus métricas personales
        return {
          personal_sales: allMetrics.seller_metrics?.[user.id] || {},
          commission: allMetrics.commissions?.[user.id] || 0,
          ranking: allMetrics.seller_rankings?.[user.id] || 'N/A'
        };
      
      default:
        return filteredMetrics;
    }
  }

  /**
   * Verifica si el usuario puede acceder a una funcionalidad específica
   */
  static canAccessFeature(feature: string, user: User): boolean {
    if (!user || !user.roles) return false;

    const primaryRole = user.roles[0];
    
    // Mapeo de funcionalidades por rol
    const roleFeatures = {
      ceo: ['*'], // Acceso total
      cfo: ['financial_reports', 'pricing_approval', 'cost_analysis'],
      cmo: ['marketing_campaigns', 'customer_analytics', 'content_management'],
      regional_manager: ['regional_analytics', 'team_management', 'regional_inventory'],
      category_manager: ['category_products', 'category_analytics', 'pricing_suggestions'],
      seller_premium: ['advanced_analytics', 'product_management', 'customer_insights'],
      seller_standard: ['basic_analytics', 'product_updates'],
      seller_basic: ['sales_only'],
      vip_customer: ['exclusive_products', 'priority_support', 'advanced_features'],
      premium_customer: ['early_access', 'enhanced_support'],
      regular_customer: ['standard_features']
    };

    const allowedFeatures = roleFeatures[primaryRole] || [];
    
    return allowedFeatures.includes('*') || allowedFeatures.includes(feature);
  }

  /**
   * Obtiene el nivel de acceso para precios
   */
  static getPricingAccess(user: User): 'view' | 'edit' | 'approve' | 'none' {
    if (!user || !user.roles) return 'none';

    const primaryRole = user.roles[0];

    switch (primaryRole) {
      case 'ceo':
      case 'cfo':
        return 'approve';
      
      case 'category_manager':
      case 'pricing_analyst':
        return 'edit';
      
      case 'product_manager':
      case 'regional_manager':
        return 'view';
      
      default:
        return 'none';
    }
  }
}

export default RoleFilters;