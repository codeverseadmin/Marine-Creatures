/**
 * Marine Creatures — Role-Based Access Control (RBAC)
 * Central Permission Registry & System Role Definitions
 * 
 * Strict Principle: Deny by Default. Every permission must have an explicit scope.
 */

export interface PermissionDefinition {
  id: string;
  category: string;
  name: string;
  description: string;
}

export const PERMISSIONS_REGISTRY: Record<string, PermissionDefinition> = {
  // ── Orders & Fulfilment ──────────────────────────────────────────────────
  'orders.read': {
    id: 'orders.read',
    category: 'Orders',
    name: 'View Orders',
    description: 'Read-only access to customer orders, order items, and delivery addresses.',
  },
  'orders.update_status': {
    id: 'orders.update_status',
    category: 'Orders',
    name: 'Update Order Progress',
    description: 'Advance or revert fulfillment stages (placed, quarantine, packed, dispatched, delivered).',
  },
  'orders.approve': {
    id: 'orders.approve',
    category: 'Orders',
    name: 'Approve Orders',
    description: 'Authorize placed or pending orders for active fulfillment.',
  },
  'orders.por_price.set': {
    id: 'orders.por_price.set',
    category: 'Orders',
    name: 'Set POR Quotation Pricing',
    description: 'Set and revise custom prices for Price on Request (POR) items.',
  },
  'orders.invoice.generate': {
    id: 'orders.invoice.generate',
    category: 'Orders',
    name: 'Generate Tax Invoices',
    description: 'Download, issue, and regenerate official customer invoice PDFs.',
  },
  'orders.tracking.update': {
    id: 'orders.tracking.update',
    category: 'Orders',
    name: 'Manage Shipping AWBs',
    description: 'Assign courier names and AWB tracking numbers to orders.',
  },
  'orders.delete': {
    id: 'orders.delete',
    category: 'Orders',
    name: 'Delete Orders',
    description: 'Permanently remove cancelled or fraudulent order records (Owner only).',
  },

  // ── Customers ────────────────────────────────────────────────────────────
  'customers.read': {
    id: 'customers.read',
    category: 'Customers',
    name: 'View Customers',
    description: 'View customer contact profiles, order histories, and cities.',
  },
  'customers.update': {
    id: 'customers.update',
    category: 'Customers',
    name: 'Edit Customer Profiles',
    description: 'Update customer contact information, preferred delivery locations, and notes.',
  },
  'customers.notes.create': {
    id: 'customers.notes.create',
    category: 'Customers',
    name: 'Create Customer Service Notes',
    description: 'Append internal service notes and relationship history to customer profiles.',
  },

  // ── Enquiries & Concierge ────────────────────────────────────────────────
  'enquiries.read': {
    id: 'enquiries.read',
    category: 'Enquiries',
    name: 'View Enquiries',
    description: 'Read inbound customer enquiries, bespoke design leads, and tank specifications.',
  },
  'enquiries.update_status': {
    id: 'enquiries.update_status',
    category: 'Enquiries',
    name: 'Update Enquiry Status',
    description: 'Transition enquiry stages (new, contacted, in_progress, converted, closed).',
  },
  'enquiries.notes.create': {
    id: 'enquiries.notes.create',
    category: 'Enquiries',
    name: 'Add Enquiry Notes',
    description: 'Record internal notes, client consultation details, and follow-up tasks.',
  },
  'enquiries.delete': {
    id: 'enquiries.delete',
    category: 'Enquiries',
    name: 'Delete Enquiries',
    description: 'Permanently remove spam or duplicate enquiry submissions.',
  },

  // ── Follow-ups ───────────────────────────────────────────────────────────
  'follow_ups.read': {
    id: 'follow_ups.read',
    category: 'Follow-ups',
    name: 'View Follow-ups',
    description: 'View scheduled client touchpoints, reminders, and pending callbacks.',
  },
  'follow_ups.manage': {
    id: 'follow_ups.manage',
    category: 'Follow-ups',
    name: 'Manage Follow-ups',
    description: 'Create, reschedule, and mark client follow-up tasks as completed.',
  },

  // ── Catalogue Products & Marine Life ─────────────────────────────────────
  'products.read': {
    id: 'products.read',
    category: 'Products',
    name: 'View Catalogue',
    description: 'View all products, marine life listings, stock counts, and care guides.',
  },
  'products.create': {
    id: 'products.create',
    category: 'Products',
    name: 'Create Products',
    description: 'Add new marine livestock or dry goods equipment to the catalogue.',
  },
  'products.update': {
    id: 'products.update',
    category: 'Products',
    name: 'Edit Products',
    description: 'Edit product descriptions, scientific names, care guides, and specifications.',
  },
  'products.price.update': {
    id: 'products.price.update',
    category: 'Products',
    name: 'Modify Product Prices',
    description: 'Change base retail prices, compare-at prices, and Price on Request toggles.',
  },
  'products.archive': {
    id: 'products.archive',
    category: 'Products',
    name: 'Archive Products',
    description: 'Archive or unarchive products from public marketplace visibility.',
  },
  'products.delete': {
    id: 'products.delete',
    category: 'Products',
    name: 'Delete Products',
    description: 'Permanently remove catalogue items from persistent storage.',
  },

  // ── Inventory ────────────────────────────────────────────────────────────
  'inventory.read': {
    id: 'inventory.read',
    category: 'Inventory',
    name: 'View Inventory',
    description: 'Inspect stock counts, low-stock warnings, and reorder alerts.',
  },
  'inventory.update': {
    id: 'inventory.update',
    category: 'Inventory',
    name: 'Update Stock Levels',
    description: 'Adjust available unit counts, stock status (AVAILABLE, LIMITED, OUT OF STOCK).',
  },

  // ── Media ────────────────────────────────────────────────────────────────
  'media.read': {
    id: 'media.read',
    category: 'Media',
    name: 'View Media Assets',
    description: 'Browse the uploaded media library, image URLs, and asset metadata.',
  },
  'media.upload': {
    id: 'media.upload',
    category: 'Media',
    name: 'Upload Media',
    description: 'Upload high-resolution photography, case study galleries, and documents.',
  },
  'media.delete': {
    id: 'media.delete',
    category: 'Media',
    name: 'Delete Media',
    description: 'Permanently delete media assets from storage.',
  },

  // ── Operations: Quarantine, Dispatch, Maintenance ────────────────────────
  'quarantine.read': {
    id: 'quarantine.read',
    category: 'Operations',
    name: 'View Quarantine Protocol',
    description: 'View quarantine tank assignments, fish health logs, and observation notes.',
  },
  'quarantine.update': {
    id: 'quarantine.update',
    category: 'Operations',
    name: 'Manage Quarantine Husbandry',
    description: 'Log prophylactic medication, feeding acceptance, and clear fish for dispatch.',
  },
  'dispatch.read': {
    id: 'dispatch.read',
    category: 'Operations',
    name: 'View Dispatch Logistics',
    description: 'Inspect packed orders awaiting courier collection or air cargo transfer.',
  },
  'dispatch.update': {
    id: 'dispatch.update',
    category: 'Operations',
    name: 'Update Dispatch Records',
    description: 'Assign couriers, manifest air cargo waybills, and log dispatch disclaimers.',
  },
  'maintenance.read': {
    id: 'maintenance.read',
    category: 'Operations',
    name: 'View Maintenance Schedules',
    description: 'Inspect client aquarium maintenance visits, routes, and technician tasks.',
  },
  'maintenance.manage': {
    id: 'maintenance.manage',
    category: 'Operations',
    name: 'Manage Maintenance Visits',
    description: 'Log water parameters (salinity, alkalinity, nitrates), record servicing tasks.',
  },

  // ── Worlds: Case Studies & Client Projects ───────────────────────────────
  'worlds.read': {
    id: 'worlds.read',
    category: 'Worlds',
    name: 'View Case Studies & Projects',
    description: 'View portfolio projects, living reef case studies, and engineering briefs.',
  },
  'worlds.manage': {
    id: 'worlds.manage',
    category: 'Worlds',
    name: 'Manage Case Studies',
    description: 'Create, edit, curate, publish, and unpublish architectural portfolio projects.',
  },

  // ── Content & SEO ────────────────────────────────────────────────────────
  'content.read': {
    id: 'content.read',
    category: 'Content',
    name: 'View Content & Banners',
    description: 'Inspect promotional banners, announcements, and marketing notices.',
  },
  'content.manage': {
    id: 'content.manage',
    category: 'Content',
    name: 'Manage Content & Banners',
    description: 'Create, edit, toggle, and delete promotional banner announcements.',
  },
  'seo.read': {
    id: 'seo.read',
    category: 'SEO',
    name: 'View SEO Metadata',
    description: 'Inspect page titles, meta descriptions, image alt tags, and canonical URLs.',
  },
  'seo.update': {
    id: 'seo.update',
    category: 'SEO',
    name: 'Update SEO Metadata',
    description: 'Edit catalogue SEO overrides, keywords, and service link mappings.',
  },

  // ── Analytics & Financials ───────────────────────────────────────────────
  'analytics.read': {
    id: 'analytics.read',
    category: 'Analytics',
    name: 'View Analytics',
    description: 'Access revenue metrics, order velocity, category demand, and traffic analytics.',
  },
  'finance.read': {
    id: 'finance.read',
    category: 'Finance',
    name: 'View Financial Records',
    description: 'Inspect detailed revenue breakdowns, invoice audit logs, and payment states.',
  },
  'finance.invoice.generate': {
    id: 'finance.invoice.generate',
    category: 'Finance',
    name: 'Generate Invoices',
    description: 'Generate, re-issue, and sign official tax invoice PDFs.',
  },

  // ── Employee Management & RBAC ───────────────────────────────────────────
  'employees.read': {
    id: 'employees.read',
    category: 'Employees',
    name: 'View Employees',
    description: 'Access the employee directory, view assigned roles, and activity records.',
  },
  'employees.create': {
    id: 'employees.create',
    category: 'Employees',
    name: 'Invite Employees',
    description: 'Create employee accounts and generate cryptographically secure invitation links.',
  },
  'employees.update': {
    id: 'employees.update',
    category: 'Employees',
    name: 'Edit Employees',
    description: 'Change employee roles, edit profile names, and assign custom permissions.',
  },
  'employees.suspend': {
    id: 'employees.suspend',
    category: 'Employees',
    name: 'Suspend / Reactivate Employees',
    description: 'Immediately revoke system access by suspending or reactivating accounts.',
  },
  'employees.delete': {
    id: 'employees.delete',
    category: 'Employees',
    name: 'Delete Employees',
    description: 'Permanently remove an employee profile from the system.',
  },

  // ── Role Management ──────────────────────────────────────────────────────
  'roles.read': {
    id: 'roles.read',
    category: 'Roles',
    name: 'View Roles',
    description: 'Inspect available system roles and custom role permission matrices.',
  },
  'roles.create': {
    id: 'roles.create',
    category: 'Roles',
    name: 'Create Custom Roles',
    description: 'Create bespoke operational roles with custom permission bundles.',
  },
  'roles.update': {
    id: 'roles.update',
    category: 'Roles',
    name: 'Edit Custom Roles',
    description: 'Modify permission assignments on custom employee roles.',
  },
  'roles.delete': {
    id: 'roles.delete',
    category: 'Roles',
    name: 'Delete Custom Roles',
    description: 'Safely delete unassigned custom roles.',
  },

  // ── System Health, Audit & Security ──────────────────────────────────────
  'audit.read': {
    id: 'audit.read',
    category: 'System',
    name: 'View Audit Logs',
    description: 'Inspect persistent, immutable security and operational audit logs.',
  },
  'backups.read': {
    id: 'backups.read',
    category: 'System',
    name: 'View Backups',
    description: 'Inspect snapshot dates, backup sizes, and restoration points.',
  },
  'backups.create': {
    id: 'backups.create',
    category: 'System',
    name: 'Create & Restore Backups',
    description: 'Trigger immediate database snapshots or restore historical states.',
  },
  'health.read': {
    id: 'health.read',
    category: 'System',
    name: 'View System Health',
    description: 'Inspect MongoDB Atlas connectivity, cluster latency, and edge health.',
  },
  'security.read': {
    id: 'security.read',
    category: 'System',
    name: 'View Security Diagnostics',
    description: 'View active session states, rate limiting metrics, and authentication logs.',
  },
  'security.manage': {
    id: 'security.manage',
    category: 'System',
    name: 'Manage Security',
    description: 'Configure security parameters, rate limit windows, and revoke active sessions.',
  },
  'settings.read': {
    id: 'settings.read',
    category: 'System',
    name: 'View Settings',
    description: 'View business contact parameters, delivery thresholds, and VAT/GST rates.',
  },
  'settings.update': {
    id: 'settings.update',
    category: 'System',
    name: 'Update Settings',
    description: 'Modify company profile, business configuration, and system parameters.',
  },
};

export const ALL_PERMISSIONS: string[] = Object.keys(PERMISSIONS_REGISTRY);

/**
 * 8 Initial System Roles with Strict Granular Permission Bundles
 */
export interface SystemRoleDefinition {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
}

export const SYSTEM_ROLES: Record<string, SystemRoleDefinition> = {
  owner: {
    id: 'owner',
    name: 'Owner / Super Admin',
    description: 'Complete administrative authority across all dashboard modules, employees, and security.',
    isSystem: true,
    permissions: ALL_PERMISSIONS,
  },

  operations_manager: {
    id: 'operations_manager',
    name: 'Operations Manager',
    description: 'Supervises orders, enquiries, customer care, dispatch, quarantine, and maintenance.',
    isSystem: true,
    permissions: [
      'orders.read',
      'orders.update_status',
      'orders.approve',
      'orders.tracking.update',
      'orders.invoice.generate',
      'customers.read',
      'customers.update',
      'customers.notes.create',
      'enquiries.read',
      'enquiries.update_status',
      'enquiries.notes.create',
      'follow_ups.read',
      'follow_ups.manage',
      'inventory.read',
      'quarantine.read',
      'quarantine.update',
      'dispatch.read',
      'dispatch.update',
      'maintenance.read',
      'maintenance.manage',
      'worlds.read',
      'analytics.read',
      'audit.read',
      'health.read',
    ],
  },

  orders_fulfilment: {
    id: 'orders_fulfilment',
    name: 'Orders & Fulfilment',
    description: 'Processes orders, packaging, courier tracking, dispatch, and quarantine release.',
    isSystem: true,
    permissions: [
      'orders.read',
      'orders.update_status',
      'orders.approve',
      'orders.tracking.update',
      'customers.read',
      'dispatch.read',
      'dispatch.update',
      'quarantine.read',
      'quarantine.update',
      'inventory.read',
    ],
  },

  inventory_manager: {
    id: 'inventory_manager',
    name: 'Inventory Manager',
    description: 'Manages products, livestock listings, stock counts, and media assets.',
    isSystem: true,
    permissions: [
      'products.read',
      'products.create',
      'products.update',
      'products.archive',
      'inventory.read',
      'inventory.update',
      'media.read',
      'media.upload',
      'analytics.read',
    ],
  },

  customer_support: {
    id: 'customer_support',
    name: 'Customer Support',
    description: 'Handles concierge enquiries, customer assistance, order lookups, and follow-ups.',
    isSystem: true,
    permissions: [
      'enquiries.read',
      'enquiries.update_status',
      'enquiries.notes.create',
      'customers.read',
      'customers.notes.create',
      'follow_ups.read',
      'follow_ups.manage',
      'orders.read',
      'products.read',
    ],
  },

  finance_manager: {
    id: 'finance_manager',
    name: 'Finance Manager',
    description: 'Manages quotation pricing, official invoices, and financial reporting.',
    isSystem: true,
    permissions: [
      'finance.read',
      'finance.invoice.generate',
      'orders.read',
      'orders.invoice.generate',
      'orders.por_price.set',
      'customers.read',
      'analytics.read',
    ],
  },

  content_seo: {
    id: 'content_seo',
    name: 'Content & SEO Manager',
    description: 'Curates living reef case studies, promotional banners, and SEO metadata.',
    isSystem: true,
    permissions: [
      'content.read',
      'content.manage',
      'seo.read',
      'seo.update',
      'worlds.read',
      'worlds.manage',
      'media.read',
      'media.upload',
      'products.read',
      'analytics.read',
    ],
  },

  auditor: {
    id: 'auditor',
    name: 'Auditor / Viewer',
    description: 'Strict read-only access across operations, orders, catalogue, and audit logs.',
    isSystem: true,
    permissions: [
      'orders.read',
      'customers.read',
      'enquiries.read',
      'follow_ups.read',
      'products.read',
      'inventory.read',
      'quarantine.read',
      'dispatch.read',
      'maintenance.read',
      'worlds.read',
      'audit.read',
      'analytics.read',
      'health.read',
      'settings.read',
    ],
  },
};

