import { useEffect, useState } from 'react';
import { Plus, Edit2 } from 'lucide-react';
import { api } from '../lib/api';

interface ApiBadge {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
  conditionType: string;
  conditionValue: string;
  pointsReward: number;
  isActive: boolean;
  createdAt: string;
  earnedByCount: number;
}

const CONDITION_LABELS: Record<string, string> = {
  MIN_TRIPS: 'Min Trips',
  MIN_DISTANCE_KM: 'Min Distance (km)',
  STREAK_DAYS: 'Streak Days',
  SPECIFIC_MODE: 'Specific Mode',
  FIRST_TRIP: 'First Trip',
  PARTNER_VISIT: 'Partner Visit',
};

export default function BadgesPage() {
  const [badges, setBadges] = useState<ApiBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editBadge, setEditBadge] = useState<ApiBadge | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    conditionType: 'MIN_TRIPS',
    conditionValue: '1',
    pointsReward: 100,
    isActive: true,
    iconUrl: '',
  });

  const fetchBadges = () =>
    api
      .get<{ success: boolean; data: ApiBadge[] }>('/api/admin/badges')
      .then((res) => setBadges(res.data));

  useEffect(() => {
    setLoading(true);
    fetchBadges()
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditBadge(null);
    setForm({ name: '', description: '', conditionType: 'MIN_TRIPS', conditionValue: '1', pointsReward: 100, isActive: true, iconUrl: '' });
    setSaveError('');
    setShowCreateModal(true);
  };

  const openEdit = (badge: ApiBadge) => {
    setEditBadge(badge);
    setForm({
      name: badge.name,
      description: badge.description,
      conditionType: badge.conditionType,
      conditionValue: badge.conditionValue,
      pointsReward: badge.pointsReward,
      isActive: badge.isActive,
      iconUrl: badge.iconUrl ?? '',
    });
    setSaveError('');
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        ...form,
        iconUrl: form.iconUrl || undefined,
      };
      if (editBadge) {
        await api.put(`/api/admin/badges/${editBadge.id}`, payload);
      } else {
        await api.post('/api/admin/badges', payload);
      }
      await fetchBadges();
      setShowCreateModal(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (badge: ApiBadge) => {
    try {
      await api.patch(`/api/admin/badges/${badge.id}/toggle`);
      await fetchBadges();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Toggle failed');
    }
  };

  const activeBadges = badges.filter((b) => b.isActive).length;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-admin-white rounded-[10px] p-4 border border-admin-border" style={{ boxShadow: 'var(--admin-shadow)' }}>
          <div className="text-sm text-admin-gray mb-1">Total Badges</div>
          <div className="text-2xl font-semibold text-admin-charcoal">{badges.length}</div>
        </div>
        <div className="bg-admin-white rounded-[10px] p-4 border border-admin-border" style={{ boxShadow: 'var(--admin-shadow)' }}>
          <div className="text-sm text-admin-gray mb-1">Active Badges</div>
          <div className="text-2xl font-semibold text-admin-primary">{activeBadges}</div>
        </div>
        <div className="bg-admin-white rounded-[10px] p-4 border border-admin-border" style={{ boxShadow: 'var(--admin-shadow)' }}>
          <div className="text-sm text-admin-gray mb-1">Total Earned</div>
          <div className="text-2xl font-semibold text-admin-charcoal">
            {badges.reduce((s, b) => s + b.earnedByCount, 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-admin-primary text-white font-medium rounded-md hover:bg-admin-primary-dark transition-colors"
        >
          <Plus size={18} />
          <span>Create Badge</span>
        </button>
      </div>

      {loading && <div className="text-sm text-admin-gray py-8 text-center">Loading badges…</div>}
      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="bg-admin-white rounded-[10px] p-5 border border-admin-border text-center"
            style={{ boxShadow: 'var(--admin-shadow)' }}
          >
            <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl ${badge.isActive ? 'bg-admin-primary' : 'bg-gray-400'}`}>
              {badge.isActive ? '🏆' : '🔒'}
            </div>
            <h3 className="font-semibold text-admin-charcoal mb-1">{badge.name}</h3>
            <p className="text-sm text-admin-gray mb-2">{badge.description}</p>
            <div className="text-xs text-admin-gray mb-1">
              {CONDITION_LABELS[badge.conditionType] ?? badge.conditionType}: {badge.conditionValue}
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-admin-warning-light text-admin-warning mb-3">
              → +{badge.pointsReward} pts
            </div>
            <div className="text-sm text-admin-gray mb-4">
              Earned by {badge.earnedByCount.toLocaleString()} users
            </div>
            <div className="flex items-center justify-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={badge.isActive}
                  onChange={() => handleToggle(badge)}
                  className="w-4 h-4 text-admin-primary rounded border-admin-border"
                />
                <span className="text-sm text-admin-charcoal">Active</span>
              </label>
              <button
                onClick={() => openEdit(badge)}
                className="p-2 text-admin-gray hover:text-admin-charcoal hover:bg-admin-primary-pale rounded transition-colors"
              >
                <Edit2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {showCreateModal && (
        <>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] bg-admin-white rounded-[14px] z-50 mx-4 overflow-y-auto">
            <div className="sticky top-0 bg-admin-white border-b border-admin-border p-6 z-10">
              <h2 className="text-xl font-semibold text-admin-charcoal">
                {editBadge ? 'Edit Badge' : 'Create New Badge'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-admin-charcoal mb-1">Badge Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Eco Warrior"
                  className="w-full px-3 py-2 border border-admin-border rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-charcoal mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of the achievement"
                  className="w-full px-3 py-2 border border-admin-border rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-charcoal mb-1">Condition Type</label>
                <select
                  value={form.conditionType}
                  onChange={(e) => setForm((f) => ({ ...f, conditionType: e.target.value }))}
                  className="w-full px-3 py-2 border border-admin-border rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                >
                  {Object.entries(CONDITION_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-charcoal mb-1">Condition Value</label>
                <input
                  type="text"
                  value={form.conditionValue}
                  onChange={(e) => setForm((f) => ({ ...f, conditionValue: e.target.value }))}
                  placeholder="e.g., 7"
                  className="w-full px-3 py-2 border border-admin-border rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-charcoal mb-1">Points Reward</label>
                <input
                  type="number"
                  value={form.pointsReward}
                  onChange={(e) => setForm((f) => ({ ...f, pointsReward: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full px-3 py-2 border border-admin-border rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="w-4 h-4 text-admin-primary rounded border-admin-border"
                  />
                  <span className="text-sm text-admin-charcoal">Active</span>
                </label>
              </div>
              {saveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{saveError}</div>
              )}
              <div className="flex gap-3 pt-2 border-t border-admin-border">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 border border-admin-border rounded-md text-sm font-medium text-admin-charcoal hover:bg-admin-primary-pale transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-admin-primary text-white text-sm font-medium rounded-md hover:bg-admin-primary-dark transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving…' : editBadge ? 'Save Changes' : 'Create Badge'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
