export type ControlOsSection =
  | 'overview'
  | 'catalog'
  | 'worlds'
  | 'operations'
  | 'crm'
  | 'content'
  | 'analytics'
  | 'system';

export type AdminTab = ControlOsSection;

export interface TabItem {
  id: ControlOsSection;
  label: string;
  count?: number;
  icon?: string;
  badge?: string;
  isImplemented?: boolean;
  phaseDependency?: string;
  description?: string;
}

export interface OverviewDashboardData {
  metrics: {
    newEnquiries: number;
    activeOrders: number;
    activeProducts: number;
    totalProducts: number;
    pendingActions: number;
    totalEnquiries: number;
    totalOrders: number;
  };
  actionCenter: {
    count: number;
    items: Array<{
      id: string;
      type: 'enquiry' | 'order' | 'quarantine' | 'dispatch' | 'system';
      severity: 'high' | 'medium' | 'info';
      title: string;
      subtitle: string;
      meta?: string;
      targetTab: string;
    }>;
  };
  enquiries: Array<{
    id: string;
    name: string;
    type: string;
    serviceType: string;
    tankSize: string;
    status: string;
    createdAt: string;
    notes?: string;
  }>;
  orders: Array<{
    id: string;
    customerName: string;
    city: string;
    totalAmount: number;
    currentStep: string;
    isApproved: boolean;
    courierName: string;
    createdAt: string;
    itemsCount: number;
  }>;
  catalog: {
    totalActive: number;
    totalCatalog: number;
    categories: Array<{
      category: string;
      label: string;
      count: number;
    }>;
  };
  demand: {
    topServices: Array<{
      service: string;
      count: number;
    }>;
    hasSufficientData: boolean;
  };
  system: {
    database: {
      status: string;
      cluster: string;
      database: string;
      latencyMs: number;
    };
    api: {
      status: string;
      runtime: string;
    };
    auth: {
      status: string;
      protocol: string;
      sessionCookie: string;
    };
    backup: {
      status: string;
      latestSnapshot: {
        id: string;
        label: string;
        source: string;
        createdAt: string;
        sizeBytes: number;
      } | null;
      totalSnapshots: number;
    };
  };
  recentActivity: Array<{
    id: string;
    type: 'order' | 'enquiry' | 'product';
    text: string;
    detail: string;
    timestamp: string;
  }>;
}
