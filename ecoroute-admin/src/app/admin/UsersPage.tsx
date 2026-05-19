import { useEffect, useState } from 'react';
import { Search, Download, X, Trophy } from 'lucide-react';
import { api } from '../lib/api';

function downloadCsv(users: ApiUser[]) {
  const escape = (v: string | number) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Points', 'Trips', 'CO2 Saved (kg)', 'Joined'];
  const rows = users.map((u) => [
    u.id, u.fullName, u.email, u.role,
    u.isActive ? 'Active' : 'Suspended',
    u.stats?.totalPoints ?? 0,
    u.stats?.totalTrips ?? 0,
    ((u.stats?.totalCo2SavedG ?? 0) / 1000).toFixed(2),
    u.createdAt.split('T')[0],
  ]);
  const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface UserStats {
  totalPoints: number;
  totalTrips: number;
  totalCo2SavedG: number;
  currentStreak: number;
  longestStreak: number;
}

interface ApiUser {
  id: string;
  email: string;
  fullName: string;
  role: 'USER' | 'ADMIN' | 'PARTNER';
  isActive: boolean;
  createdAt: string;
  stats: UserStats | null;
}

function roleBadge(role: ApiUser['role']) {
  if (role === 'ADMIN') return 'bg-purple-100 text-purple-700';
  if (role === 'PARTNER') return 'bg-blue-100 text-blue-700';
  return 'bg-admin-primary-light text-admin-primary';
}

function roleLabel(role: ApiUser['role']) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

export default function UsersPage() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'USER' | 'PARTNER' | 'ADMIN'>('All');
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const [suspending, setSuspending] = useState(false);

  const handleToggleSuspend = async () => {
    if (!selectedUser) return;
    setSuspending(true);
    try {
      await api.patch(`/api/admin/users/${selectedUser.id}/suspend`);
      const res = await api.get<{ success: boolean; data: { users: ApiUser[]; total: number } }>('/api/admin/users?limit=100');
      setUsers(res.data.users);
      const updated = res.data.users.find((u) => u.id === selectedUser.id);
      if (updated) setSelectedUser(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update account status');
    } finally {
      setSuspending(false);
    }
  };

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '100' });
    if (debouncedSearch) params.set('search', debouncedSearch);
    api
      .get<{ success: boolean; data: { users: ApiUser[]; total: number } }>(`/api/admin/users?${params}`)
      .then((res) => {
        setUsers(res.data.users);
        setTotal(res.data.total);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'All' && u.role !== roleFilter) return false;
    return true;
  });

  const toggleUserSelection = (id: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllUsers = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const [bulkWorking, setBulkWorking] = useState(false);

  const handleBulkStatusChange = async (targetActive: boolean) => {
    const targets = filteredUsers.filter(
      (u) => selectedUsers.has(u.id) && u.isActive !== targetActive
    );
    if (targets.length === 0) return;
    setBulkWorking(true);
    try {
      await Promise.all(targets.map((u) => api.patch(`/api/admin/users/${u.id}/suspend`)));
      const res = await api.get<{ success: boolean; data: { users: ApiUser[]; total: number } }>('/api/admin/users?limit=100');
      setUsers(res.data.users);
      setSelectedUsers(new Set());
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bulk action failed');
    } finally {
      setBulkWorking(false);
    }
  };

  const handleAdjustPoints = async () => {
    if (!selectedUser) return;
    const delta = parseInt(adjustAmount, 10);
    if (isNaN(delta)) { setAdjustError('Enter a valid number'); return; }
    if (!adjustReason.trim()) { setAdjustError('Reason is required'); return; }
    setAdjusting(true);
    setAdjustError('');
    try {
      await api.patch(`/api/admin/users/${selectedUser.id}/points`, { delta, reason: adjustReason });
      setShowAdjustModal(false);
      setAdjustAmount('');
      setAdjustReason('');
      // Refresh user list
      const res = await api.get<{ success: boolean; data: { users: ApiUser[]; total: number } }>('/api/admin/users?limit=100');
      setUsers(res.data.users);
      const updated = res.data.users.find((u) => u.id === selectedUser.id);
      if (updated) setSelectedUser(updated);
    } catch (err) {
      setAdjustError(err instanceof Error ? err.message : 'Failed to adjust points');
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Controls Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-gray" />
              <input
                type="text"
                placeholder="Search users by name or email…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-admin-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-admin-gray">{total} users</span>
            <button
              onClick={() => downloadCsv(filteredUsers)}
              className="flex items-center gap-2 px-4 py-2 border border-admin-border rounded-md text-sm text-admin-charcoal hover:bg-admin-primary-pale transition-colors"
            >
              <Download size={16} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Role Filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-admin-gray self-center">Role:</span>
          {(['All', 'USER', 'PARTNER', 'ADMIN'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                roleFilter === role
                  ? 'bg-admin-primary text-white'
                  : 'bg-admin-white border border-admin-border text-admin-gray hover:bg-admin-primary-pale'
              }`}
            >
              {role === 'All' ? 'All' : roleLabel(role)}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedUsers.size > 0 && (
        <div className="bg-admin-primary-light border border-admin-primary rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-admin-charcoal">
            {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkStatusChange(false)}
              disabled={bulkWorking}
              className="px-4 py-2 bg-admin-danger text-white text-sm font-medium rounded-md hover:bg-admin-danger/90 transition-colors disabled:opacity-50"
            >
              Suspend Selected
            </button>
            <button
              onClick={() => handleBulkStatusChange(true)}
              disabled={bulkWorking}
              className="px-4 py-2 bg-admin-primary text-white text-sm font-medium rounded-md hover:bg-admin-primary-dark transition-colors disabled:opacity-50"
            >
              Activate Selected
            </button>
          </div>
        </div>
      )}

      {/* Loading / Error */}
      {loading && <div className="text-sm text-admin-gray py-8 text-center">Loading users…</div>}
      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

      {/* Users Table - Desktop */}
      {!loading && (
        <div className="hidden md:block bg-admin-white rounded-[10px] border border-admin-border overflow-hidden" style={{ boxShadow: 'var(--admin-shadow)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-admin-primary-pale border-b border-admin-border">
                  <th className="text-left p-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                      onChange={toggleAllUsers}
                      className="w-4 h-4 text-admin-primary rounded border-admin-border"
                    />
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-admin-charcoal">User</th>
                  <th className="text-left p-4 text-sm font-semibold text-admin-charcoal">Role</th>
                  <th className="text-left p-4 text-sm font-semibold text-admin-charcoal">Status</th>
                  <th className="text-left p-4 text-sm font-semibold text-admin-charcoal">Green Points</th>
                  <th className="text-left p-4 text-sm font-semibold text-admin-charcoal">Total Trips</th>
                  <th className="text-left p-4 text-sm font-semibold text-admin-charcoal">CO2 Saved</th>
                  <th className="text-left p-4 text-sm font-semibold text-admin-charcoal">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-admin-border hover:bg-admin-primary-pale transition-colors cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="w-4 h-4 text-admin-primary rounded border-admin-border"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-admin-primary text-white flex items-center justify-center font-semibold">
                          {user.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-admin-charcoal">{user.fullName}</div>
                          <div className="text-xs text-admin-gray">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleBadge(user.role)}`}>
                        {roleLabel(user.role)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-admin-primary-light text-admin-primary' : 'bg-admin-danger-light text-admin-danger'}`}>
                        {user.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Trophy size={14} className="text-admin-primary" />
                        <span className="font-medium text-admin-charcoal">{(user.stats?.totalPoints ?? 0).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="p-4 text-admin-charcoal">{user.stats?.totalTrips ?? 0}</td>
                    <td className="p-4 text-admin-charcoal">{((user.stats?.totalCo2SavedG ?? 0) / 1000).toFixed(1)} kg</td>
                    <td className="p-4 text-sm text-admin-gray">{user.createdAt.split('T')[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users Cards - Mobile */}
      {!loading && (
        <div className="md:hidden space-y-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-admin-white rounded-[10px] p-4 border border-admin-border"
              style={{ boxShadow: 'var(--admin-shadow)' }}
              onClick={() => setSelectedUser(user)}
            >
              <div className="flex items-start gap-3 mb-3">
                <input
                  type="checkbox"
                  checked={selectedUsers.has(user.id)}
                  onChange={() => toggleUserSelection(user.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 w-4 h-4 text-admin-primary rounded border-admin-border"
                />
                <div className="w-12 h-12 rounded-full bg-admin-primary text-white flex items-center justify-center font-semibold">
                  {user.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-admin-charcoal">{user.fullName}</div>
                  <div className="text-sm text-admin-gray">{user.email}</div>
                  <div className="flex gap-2 mt-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge(user.role)}`}>
                      {roleLabel(user.role)}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${user.isActive ? 'bg-admin-primary-light text-admin-primary' : 'bg-admin-danger-light text-admin-danger'}`}>
                      {user.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-admin-border">
                <div>
                  <div className="text-xs text-admin-gray">Points</div>
                  <div className="font-semibold text-admin-primary">{(user.stats?.totalPoints ?? 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-admin-gray">Trips</div>
                  <div className="font-semibold text-admin-charcoal">{user.stats?.totalTrips ?? 0}</div>
                </div>
                <div>
                  <div className="text-xs text-admin-gray">CO2 Saved</div>
                  <div className="font-semibold text-admin-charcoal">{((user.stats?.totalCo2SavedG ?? 0) / 1000).toFixed(1)} kg</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Detail Drawer */}
      {selectedUser && (
        <>
          <div className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-admin-white z-50 overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-admin-white border-b border-admin-border p-6 z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-admin-primary text-white flex items-center justify-center text-2xl font-semibold">
                    {selectedUser.fullName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-admin-charcoal">{selectedUser.fullName}</h2>
                    <p className="text-sm text-admin-gray">{selectedUser.email}</p>
                    <div className="flex gap-2 mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleBadge(selectedUser.role)}`}>
                        {roleLabel(selectedUser.role)}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${selectedUser.isActive ? 'bg-admin-primary-light text-admin-primary' : 'bg-admin-danger-light text-admin-danger'}`}>
                        {selectedUser.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-admin-gray hover:text-admin-charcoal">
                  <X size={24} />
                </button>
              </div>
              <div className="text-xs text-admin-gray">Joined {selectedUser.createdAt.split('T')[0]}</div>
            </div>

            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Green Points', value: (selectedUser.stats?.totalPoints ?? 0).toLocaleString(), accent: true },
                  { label: 'Total Trips', value: selectedUser.stats?.totalTrips ?? 0 },
                  { label: 'CO2 Saved', value: `${((selectedUser.stats?.totalCo2SavedG ?? 0) / 1000).toFixed(1)} kg` },
                  { label: 'Current Streak', value: `${selectedUser.stats?.currentStreak ?? 0} days` },
                  { label: 'Longest Streak', value: `${selectedUser.stats?.longestStreak ?? 0} days` },
                ].map(({ label, value, accent }) => (
                  <div key={label} className="p-4 rounded-lg bg-admin-primary-pale">
                    <div className="text-sm text-admin-gray mb-1">{label}</div>
                    <div className={`text-2xl font-semibold ${accent ? 'text-admin-primary' : 'text-admin-charcoal'}`}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <h3 className="font-semibold text-admin-charcoal">Quick Actions</h3>
                <button
                  onClick={() => { setShowAdjustModal(true); setAdjustError(''); setAdjustAmount(''); setAdjustReason(''); }}
                  className="w-full px-4 py-2 bg-admin-primary text-white text-sm font-medium rounded-md hover:bg-admin-primary-dark transition-colors"
                >
                  Adjust Points
                </button>
                <button
                  onClick={handleToggleSuspend}
                  disabled={suspending}
                  className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${
                    selectedUser.isActive
                      ? 'border border-admin-danger bg-red-50 text-admin-danger hover:bg-red-100'
                      : 'border border-admin-primary bg-admin-primary-light text-admin-primary hover:bg-admin-primary-light/70'
                  }`}
                >
                  {suspending ? 'Saving…' : selectedUser.isActive ? 'Suspend Account' : 'Activate Account'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Adjust Points Modal */}
      {showAdjustModal && selectedUser && (
        <>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-admin-white rounded-[10px] p-6 z-50 mx-4">
            <h3 className="text-lg font-semibold text-admin-charcoal mb-4">
              Adjust Points for {selectedUser.fullName}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-admin-charcoal mb-2">Current Balance</label>
                <div className="text-2xl font-semibold text-admin-primary">
                  {(selectedUser.stats?.totalPoints ?? 0).toLocaleString()} points
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-charcoal mb-2">
                  Amount (positive to add, negative to deduct)
                </label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g., 100 or -50"
                  className="w-full px-3 py-2 border border-admin-border rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-charcoal mb-2">Reason (required)</label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Explain why you're adjusting points…"
                  rows={3}
                  className="w-full px-3 py-2 border border-admin-border rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                />
              </div>
              {adjustError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{adjustError}</div>
              )}
              <div className="p-3 bg-admin-warning-light border border-admin-warning rounded-md text-xs text-admin-warning">
                ⚠️ This action is recorded in the points ledger and cannot be undone.
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 px-4 py-2 border border-admin-border rounded-md text-sm text-admin-charcoal hover:bg-admin-primary-pale transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjustPoints}
                  disabled={adjusting}
                  className="flex-1 px-4 py-2 bg-admin-primary text-white text-sm font-medium rounded-md hover:bg-admin-primary-dark transition-colors disabled:opacity-50"
                >
                  {adjusting ? 'Saving…' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
