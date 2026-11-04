'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { EmployeeSubtab } from './types';

interface Employee {
  _id: string;
  name: string;
  email: string;
  roleId: string;
  status: 'active' | 'suspended' | 'invited';
  customPermissions: string[];
  sessionVersion: number;
  lastLoginAt?: string | null;
  lastLoginIp?: string | null;
  invitedBy?: string | null;
  createdAt: string;
}

interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
  assignedCount: number;
  version?: number;
}

interface PermissionItem {
  id: string;
  category: string;
  name: string;
  description: string;
}

interface ControlOsEmployeesProps {
  showToast: (msg: string) => void;
  currentUser?: {
    id: string;
    name: string;
    email: string;
    roleId: string;
    permissions: string[];
    isOwner: boolean;
  } | null;
}

export function ControlOsEmployees({ showToast, currentUser }: ControlOsEmployeesProps) {
  const [subtab, setSubtab] = useState<EmployeeSubtab>('directory');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [permissionsRegistry, setPermissionsRegistry] = useState<PermissionItem[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0, invited: 0 });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('operations_manager');
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);

  // Edit Employee Role Modal
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editRoleId, setEditRoleId] = useState('');
  const [isSubmittingRoleChange, setIsSubmittingRoleChange] = useState(false);

  // Role Creation / Editing Modal
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  const [customRoleId, setCustomRoleId] = useState('');
  const [customRoleName, setCustomRoleName] = useState('');
  const [customRoleDesc, setCustomRoleDesc] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

  // Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionLabel: string;
    actionVariant: 'danger' | 'warning' | 'primary';
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionLabel: '',
    actionVariant: 'primary',
    onConfirm: async () => {},
  });

  // Fetch Employees
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`/api/admin/employees?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEmployees(data.employees);
        if (data.stats) setStats(data.stats);
      } else {
        showToast(data.error || 'Failed to load employees');
      }
    } catch {
      showToast('Error connecting to employee directory');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, showToast]);

  // Fetch Roles
  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/roles');
      const data = await res.json();
      if (data.success) {
        setRoles(data.roles);
        if (data.permissionsRegistry) {
          setPermissionsRegistry(data.permissionsRegistry);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchRoles();
  }, [fetchEmployees, fetchRoles]);

  // Handle Invite Submission
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      showToast('Name and email are required');
      return;
    }

    setIsSubmittingInvite(true);
    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inviteName.trim(),
          email: inviteEmail.trim(),
          roleId: inviteRole,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Invitation created for ${inviteName}`);
        setGeneratedInviteLink(data.invitation.inviteUrl);
        fetchEmployees();
        fetchRoles();
      } else {
        showToast(data.error || 'Failed to create invitation');
      }
    } catch {
      showToast('Network error while creating invitation');
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  // Toggle Suspend / Reactivate
  const handleToggleStatus = (employee: Employee) => {
    const isSuspending = employee.status === 'active';
    const nextStatus = isSuspending ? 'suspended' : 'active';

    setConfirmDialog({
      isOpen: true,
      title: isSuspending ? `Suspend ${employee.name}?` : `Reactivate ${employee.name}?`,
      message: isSuspending
        ? `This will immediately invalidate all active sessions for ${employee.name} and block any further administrative access until reactivated.`
        : `This will restore administrative login access for ${employee.name}.`,
      actionLabel: isSuspending ? 'Suspend Account' : 'Reactivate Account',
      actionVariant: isSuspending ? 'danger' : 'primary',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/employees/${employee._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: nextStatus }),
          });
          const data = await res.json();
          if (data.success) {
            showToast(`${employee.name} has been ${nextStatus}`);
            fetchEmployees();
          } else {
            showToast(data.error || 'Failed to update status');
          }
        } catch {
          showToast('Failed to update employee status');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Revoke Sessions
  const handleRevokeSessions = (employee: Employee) => {
    setConfirmDialog({
      isOpen: true,
      title: `Revoke Sessions for ${employee.name}?`,
      message: `This will bump the security session version, instantly terminating all open browser sessions and requiring ${employee.name} to sign in again.`,
      actionLabel: 'Revoke All Sessions',
      actionVariant: 'warning',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/employees/${employee._id}/revoke-sessions`, {
            method: 'POST',
          });
          const data = await res.json();
          if (data.success) {
            showToast(data.message || 'Sessions revoked successfully');
            fetchEmployees();
          } else {
            showToast(data.error || 'Failed to revoke sessions');
          }
        } catch {
          showToast('Failed to revoke sessions');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Resend / Regenerate Invitation
  const handleResendInvitation = async (employee: Employee) => {
    try {
      const res = await fetch(`/api/admin/employees/${employee._id}/resend-invitation`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        navigator.clipboard.writeText(data.invitation.inviteUrl);
        showToast('Fresh invitation link generated & copied to clipboard!');
      } else {
        showToast(data.error || 'Failed to regenerate invitation');
      }
    } catch {
      showToast('Network error while regenerating invitation');
    }
  };

  // Delete Employee
  const handleDeleteEmployee = (employee: Employee) => {
    setConfirmDialog({
      isOpen: true,
      title: `Permanently Delete ${employee.name}?`,
      message: `Are you sure you want to permanently delete the administrative profile for ${employee.name} (${employee.email})? This action cannot be undone.`,
      actionLabel: 'Delete Employee',
      actionVariant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/employees/${employee._id}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          if (data.success) {
            showToast(`Employee ${employee.name} deleted`);
            fetchEmployees();
            fetchRoles();
          } else {
            showToast(data.error || 'Failed to delete employee');
          }
        } catch {
          showToast('Failed to delete employee');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Change Role Submit
  const handleRoleChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || !editRoleId) return;

    setIsSubmittingRoleChange(true);
    try {
      const res = await fetch(`/api/admin/employees/${editingEmployee._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: editRoleId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Role updated to ${editRoleId} for ${editingEmployee.name}`);
        setEditingEmployee(null);
        fetchEmployees();
        fetchRoles();
      } else {
        showToast(data.error || 'Failed to update role');
      }
    } catch {
      showToast('Failed to update employee role');
    } finally {
      setIsSubmittingRoleChange(false);
    }
  };

  // Create / Update Custom Role Submit
  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRoleName.trim()) {
      showToast('Role name is required');
      return;
    }

    setIsSubmittingRole(true);
    try {
      const isEditing = Boolean(editingRole);
      const url = isEditing ? `/api/admin/roles/${editingRole!.id}` : '/api/admin/roles';
      const method = isEditing ? 'PATCH' : 'POST';

      const payload = isEditing
        ? {
            name: customRoleName.trim(),
            description: customRoleDesc.trim(),
            permissions: Array.from(selectedPermissions),
          }
        : {
            id: customRoleId.trim().toLowerCase(),
            name: customRoleName.trim(),
            description: customRoleDesc.trim(),
            permissions: Array.from(selectedPermissions),
          };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast(isEditing ? 'Role updated successfully' : 'Custom role created successfully');
        setIsRoleModalOpen(false);
        setEditingRole(null);
        fetchRoles();
      } else {
        showToast(data.error || 'Failed to save role');
      }
    } catch {
      showToast('Network error while saving role');
    } finally {
      setIsSubmittingRole(false);
    }
  };

  // Delete Custom Role
  const handleDeleteRole = (role: RoleDefinition) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete Custom Role '${role.name}'?`,
      message: `Are you sure you want to delete this custom role? This cannot be undone. Roles assigned to active employees cannot be deleted.`,
      actionLabel: 'Delete Role',
      actionVariant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/roles/${role.id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            showToast(`Role '${role.name}' deleted`);
            fetchRoles();
          } else {
            showToast(data.error || 'Failed to delete role');
          }
        } catch {
          showToast('Failed to delete role');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Group permissions by category
  const groupedPermissions: Record<string, PermissionItem[]> = {};
  permissionsRegistry.forEach((p) => {
    if (!groupedPermissions[p.category]) groupedPermissions[p.category] = [];
    groupedPermissions[p.category].push(p);
  });

  return (
    <div className="space-y-6">
      {/* ── Top Header & Tab Navigation ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Employee Management & Access Control
            </h1>
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 px-2 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/20">
              RBAC v1.0
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Zero shared credentials. Real-time session invalidation, cryptographic password hashing, and granular permissions.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setEditingRole(null);
              setCustomRoleId('');
              setCustomRoleName('');
              setCustomRoleDesc('');
              setSelectedPermissions(new Set());
              setIsRoleModalOpen(true);
            }}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>🛡️</span>
            <span>New Custom Role</span>
          </button>

          <button
            onClick={() => {
              setInviteName('');
              setInviteEmail('');
              setInviteRole('operations_manager');
              setGeneratedInviteLink(null);
              setIsInviteModalOpen(true);
            }}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-[0.99] flex items-center gap-1.5"
          >
            <span>✉️</span>
            <span>Invite Employee</span>
          </button>
        </div>
      </div>

      {/* ── Metric Stats Overview ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800/80">
          <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">
            Total Staff
          </span>
          <span className="text-xl font-bold text-white mt-1 block font-mono">{stats.total}</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800/80">
          <span className="text-[10px] font-mono uppercase text-emerald-400 tracking-wider block">
            Active Accounts
          </span>
          <span className="text-xl font-bold text-emerald-400 mt-1 block font-mono">
            {stats.active}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800/80">
          <span className="text-[10px] font-mono uppercase text-red-400 tracking-wider block">
            Suspended
          </span>
          <span className="text-xl font-bold text-red-400 mt-1 block font-mono">
            {stats.suspended}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800/80">
          <span className="text-[10px] font-mono uppercase text-amber-400 tracking-wider block">
            Pending Invites
          </span>
          <span className="text-xl font-bold text-amber-400 mt-1 block font-mono">
            {stats.invited}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800/80">
          <span className="text-[10px] font-mono uppercase text-cyan-400 tracking-wider block">
            Available Roles
          </span>
          <span className="text-xl font-bold text-cyan-400 mt-1 block font-mono">
            {roles.length}
          </span>
        </div>
      </div>

      {/* ── Subtab Pill Switcher ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setSubtab('directory')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            subtab === 'directory'
              ? 'bg-slate-800 text-white font-bold border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <span>👥</span>
          <span>Employee Directory</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-700 text-slate-300">
            {employees.length}
          </span>
        </button>

        <button
          onClick={() => setSubtab('roles')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            subtab === 'roles'
              ? 'bg-slate-800 text-white font-bold border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <span>🛡️</span>
          <span>Roles & Permissions Registry</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-700 text-slate-300">
            {roles.length}
          </span>
        </button>
      </div>

      {/* ── Subtab 1: Directory ──────────────────────────────────────────── */}
      {subtab === 'directory' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by name or email address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full min-h-[44px] px-4 pl-10 rounded-xl bg-[#0b121a] border border-slate-800 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-cyan-400 font-mono"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                🔍
              </span>
            </div>

            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="min-h-[44px] px-3 rounded-xl bg-[#0b121a] border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none focus:border-cyan-400"
              >
                <option value="all">All Roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="min-h-[44px] px-3 rounded-xl bg-[#0b121a] border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none focus:border-cyan-400"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="invited">Pending Invite</option>
              </select>
            </div>
          </div>

          {/* Directory Content */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-mono text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block animate-pulse mr-2" />
              Loading employee records...
            </div>
          ) : employees.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#0b121a] border border-slate-800 space-y-3">
              <span className="text-3xl block">👤</span>
              <h3 className="text-sm font-bold text-white">No Employees Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No employee records match the selected filter criteria or no employees have been invited yet.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto rounded-2xl border border-slate-800 bg-[#0b121a]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Session Ver</th>
                      <th className="py-3 px-4">Last Activity</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {employees.map((emp) => {
                      const roleObj = roles.find((r) => r.id === emp.roleId);
                      const isOwner = emp.roleId === 'owner';

                      return (
                        <tr key={emp._id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                  isOwner
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                                }`}
                              >
                                {emp.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-semibold text-white block">{emp.name}</span>
                                <span className="text-[11px] text-slate-400 font-mono block">
                                  {emp.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider inline-block ${
                                isOwner
                                  ? 'bg-amber-400/10 text-amber-300 border border-amber-400/30'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {roleObj?.name || emp.roleId}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                                emp.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : emp.status === 'suspended'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  emp.status === 'active'
                                    ? 'bg-emerald-400'
                                    : emp.status === 'suspended'
                                    ? 'bg-red-400'
                                    : 'bg-amber-400 animate-pulse'
                                }`}
                              />
                              <span>
                                {emp.status === 'invited' ? 'Pending Invite' : emp.status}
                              </span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                            v{emp.sessionVersion}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                            {emp.lastLoginAt
                              ? new Date(emp.lastLoginAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Never signed in'}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {emp.status === 'invited' && (
                                <button
                                  onClick={() => handleResendInvitation(emp)}
                                  className="min-h-[32px] px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-semibold border border-amber-500/20 transition-colors"
                                  title="Copy fresh one-time invitation link"
                                >
                                  🔗 Copy Link
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setEditingEmployee(emp);
                                  setEditRoleId(emp.roleId);
                                }}
                                className="min-h-[32px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors"
                              >
                                Edit Role
                              </button>

                              {emp.status !== 'invited' && (
                                <button
                                  onClick={() => handleToggleStatus(emp)}
                                  className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                                    emp.status === 'active'
                                      ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                                  }`}
                                >
                                  {emp.status === 'active' ? 'Suspend' : 'Reactivate'}
                                </button>
                              )}

                              <button
                                onClick={() => handleRevokeSessions(emp)}
                                className="min-h-[32px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[11px] transition-colors"
                                title="Invalidate current browser sessions"
                              >
                                ⚡ Revoke
                              </button>

                              <button
                                onClick={() => handleDeleteEmployee(emp)}
                                className="min-h-[32px] px-2 py-1 rounded-lg bg-slate-900 hover:bg-red-500/20 text-slate-500 hover:text-red-400 text-[11px] transition-colors"
                                title="Delete employee"
                              >
                                ✕
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Responsive Cards View */}
              <div className="lg:hidden space-y-3">
                {employees.map((emp) => {
                  const roleObj = roles.find((r) => r.id === emp.roleId);
                  const isOwner = emp.roleId === 'owner';

                  return (
                    <div
                      key={emp._id}
                      className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                              isOwner
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                            }`}
                          >
                            {emp.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm block">{emp.name}</span>
                            <span className="text-xs text-slate-400 font-mono block">
                              {emp.email}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                            emp.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : emp.status === 'suspended'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {emp.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60 text-slate-400">
                        <span>Role: {roleObj?.name || emp.roleId}</span>
                        <span className="font-mono text-[11px]">v{emp.sessionVersion}</span>
                      </div>

                      {/* Mobile Touch Action Targets (44px min height) */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        {emp.status === 'invited' ? (
                          <button
                            onClick={() => handleResendInvitation(emp)}
                            className="min-h-[44px] px-3 rounded-xl bg-amber-500/10 text-amber-300 text-xs font-semibold border border-amber-500/20 flex items-center justify-center gap-1"
                          >
                            <span>🔗</span>
                            <span>Copy Link</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(emp)}
                            className={`min-h-[44px] px-3 rounded-xl text-xs font-semibold flex items-center justify-center ${
                              emp.status === 'active'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {emp.status === 'active' ? 'Suspend' : 'Reactivate'}
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setEditingEmployee(emp);
                            setEditRoleId(emp.roleId);
                          }}
                          className="min-h-[44px] px-3 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center"
                        >
                          Change Role
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Subtab 2: Roles & Permissions Registry ───────────────────────── */}
      {subtab === 'roles' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className="p-5 rounded-2xl bg-[#0b121a] border border-slate-800 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm">{role.name}</h3>
                      {role.isSystem ? (
                        <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-cyan-400/20">
                          System Protected
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          Custom
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                      ID: {role.id} • {role.assignedCount} Assigned Staff
                    </span>
                  </div>

                  {!role.isSystem && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingRole(role);
                          setCustomRoleId(role.id);
                          setCustomRoleName(role.name);
                          setCustomRoleDesc(role.description);
                          setSelectedPermissions(new Set(role.permissions));
                          setIsRoleModalOpen(true);
                        }}
                        className="min-h-[32px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role)}
                        className="min-h-[32px] px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{role.description}</p>

                {/* Permissions Chips */}
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block mb-2">
                    Authorized Capabilities ({role.permissions.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {role.permissions.map((p) => (
                      <span
                        key={p}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal: Invite Employee ───────────────────────────────────────── */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0b121a] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white tracking-tight">Invite New Employee</h2>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {generatedInviteLink ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>✓</span>
                    <span>One-Time Invitation Link Generated</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    This link expires in 48 hours and can only be used once. Send it directly to the employee so they can set up their password.
                  </p>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={generatedInviteLink}
                    className="w-full h-11 px-3 pr-20 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedInviteLink);
                      showToast('Invitation link copied to clipboard!');
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[32px] px-3 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-colors"
                  >
                    Copy Link
                  </button>
                </div>

                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="w-full min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. john@marinecreatures.local"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Assigned Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 font-mono"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.isSystem ? 'System' : 'Custom'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="min-h-[44px] px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingInvite}
                    className="min-h-[44px] px-5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {isSubmittingInvite ? 'Creating...' : 'Generate Invitation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: Change Role ───────────────────────────────────────────── */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0b121a] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Change Role: {editingEmployee.name}
              </h2>
              <button
                onClick={() => setEditingEmployee(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRoleChangeSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Select Role
                </label>
                <select
                  value={editRoleId}
                  onChange={(e) => setEditRoleId(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="min-h-[44px] px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRoleChange}
                  className="min-h-[44px] px-5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isSubmittingRoleChange ? 'Saving...' : 'Update Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Create / Edit Role ─────────────────────────────────────── */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0b121a] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {editingRole ? `Edit Role: ${editingRole.name}` : 'Create Custom Role'}
              </h2>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Role Identifier
                  </label>
                  <input
                    type="text"
                    disabled={Boolean(editingRole)}
                    placeholder="e.g. logistics_specialist"
                    value={customRoleId}
                    onChange={(e) => setCustomRoleId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Logistics Specialist"
                    value={customRoleName}
                    onChange={(e) => setCustomRoleName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Handles air cargo dispatch and carrier tracking"
                  value={customRoleDesc}
                  onChange={(e) => setCustomRoleDesc(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Permissions Checklist Grouped by Category */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Assign Capabilities ({selectedPermissions.size} selected)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedPermissions.size === permissionsRegistry.length) {
                        setSelectedPermissions(new Set());
                      } else {
                        setSelectedPermissions(new Set(permissionsRegistry.map((p) => p.id)));
                      }
                    }}
                    className="text-[11px] font-mono text-cyan-400 hover:underline"
                  >
                    {selectedPermissions.size === permissionsRegistry.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  {Object.entries(groupedPermissions).map(([category, perms]) => (
                    <div key={category} className="space-y-2">
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider block">
                        {category}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {perms.map((p) => {
                          const isChecked = selectedPermissions.has(p.id);
                          return (
                            <label
                              key={p.id}
                              className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                                  : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  const next = new Set(selectedPermissions);
                                  if (isChecked) next.delete(p.id);
                                  else next.add(p.id);
                                  setSelectedPermissions(next);
                                }}
                                className="mt-0.5 rounded border-slate-700 text-cyan-400 focus:ring-0"
                              />
                              <div className="min-w-0">
                                <span className="font-semibold block truncate">{p.name}</span>
                                <span className="text-[10px] font-mono text-slate-400 block truncate">
                                  {p.id}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="min-h-[44px] px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRole}
                  className="min-h-[44px] px-5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isSubmittingRole ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirmation Dialog ─────────────────────────────────────────── */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0b121a] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight">
              {confirmDialog.title}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="min-h-[44px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`min-h-[44px] px-5 rounded-xl text-xs font-bold transition-all ${
                  confirmDialog.actionVariant === 'danger'
                    ? 'bg-red-500 hover:bg-red-400 text-white'
                    : confirmDialog.actionVariant === 'warning'
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                }`}
              >
                {confirmDialog.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

