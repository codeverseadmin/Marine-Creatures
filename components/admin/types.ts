export type AdminTab = 'products' | 'orders' | 'banners' | 'inquiries' | 'overview' | 'system';

export interface TabItem {
  id: AdminTab;
  label: string;
  count?: number;
  icon: string;
}
