import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, AlertTriangle, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Settings {
  appName: string;
  supportEmail: string;
  defaultCountry: string;
  defaultCurrency: string;
  timezone: string;
  pointsPer10gCO2: number;
  walkingMultiplier: number;
  cyclingMultiplier: number;
  transitMultiplier: number;
  mixedMultiplier: number;
  defaultTriggerRadius: number;
  minimumMonthlyFee: number;
  defaultCouponValidity: number;
  maintenanceMode: boolean;
  badgeUnlock: boolean;
  weeklySummary: boolean;
  streakAlerts: boolean;
  partnerNearby: boolean;
  welcomeEmail: boolean;
  partnerApplication: boolean;
}

const DEFAULTS: Settings = {
  appName: 'EcoRoute',
  supportEmail: 'support@ecoroute.com',
  defaultCountry: 'Germany',
  defaultCurrency: 'EUR',
  timezone: 'Europe/Berlin',
  pointsPer10gCO2: 1,
  walkingMultiplier: 1.5,
  cyclingMultiplier: 1.5,
  transitMultiplier: 1.0,
  mixedMultiplier: 1.2,
  defaultTriggerRadius: 300,
  minimumMonthlyFee: 79,
  defaultCouponValidity: 60,
  maintenanceMode: false,
  badgeUnlock: true,
  weeklySummary: true,
  streakAlerts: true,
  partnerNearby: true,
  welcomeEmail: true,
  partnerApplication: true,
};

interface AdminAccount {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

function parseBool(v: string | undefined): boolean {
  return v === 'true';
}

function parseSettings(raw: Record<string, string>): Settings {
  return {
    appName: raw.appName ?? DEFAULTS.appName,
    supportEmail: raw.supportEmail ?? DEFAULTS.supportEmail,
    defaultCountry: raw.defaultCountry ?? DEFAULTS.defaultCountry,
    defaultCurrency: raw.defaultCurrency ?? DEFAULTS.defaultCurrency,
    timezone: raw.timezone ?? DEFAULTS.timezone,
    pointsPer10gCO2: Number(raw.pointsPer10gCO2 ?? DEFAULTS.pointsPer10gCO2),
    walkingMultiplier: Number(raw.walkingMultiplier ?? DEFAULTS.walkingMultiplier),
    cyclingMultiplier: Number(raw.cyclingMultiplier ?? DEFAULTS.cyclingMultiplier),
    transitMultiplier: Number(raw.transitMultiplier ?? DEFAULTS.transitMultiplier),
    mixedMultiplier: Number(raw.mixedMultiplier ?? DEFAULTS.mixedMultiplier),
    defaultTriggerRadius: Number(raw.defaultTriggerRadius ?? DEFAULTS.defaultTriggerRadius),
    minimumMonthlyFee: Number(raw.minimumMonthlyFee ?? DEFAULTS.minimumMonthlyFee),
    defaultCouponValidity: Number(raw.defaultCouponValidity ?? DEFAULTS.defaultCouponValidity),
    maintenanceMode: raw.maintenanceMode !== undefined ? parseBool(raw.maintenanceMode) : DEFAULTS.maintenanceMode,
    badgeUnlock: raw.badgeUnlock !== undefined ? parseBool(raw.badgeUnlock) : DEFAULTS.badgeUnlock,
    weeklySummary: raw.weeklySummary !== undefined ? parseBool(raw.weeklySummary) : DEFAULTS.weeklySummary,
    streakAlerts: raw.streakAlerts !== undefined ? parseBool(raw.streakAlerts) : DEFAULTS.streakAlerts,
    partnerNearby: raw.partnerNearby !== undefined ? parseBool(raw.partnerNearby) : DEFAULTS.partnerNearby,
    welcomeEmail: raw.welcomeEmail !== undefined ? parseBool(raw.welcomeEmail) : DEFAULTS.welcomeEmail,
    partnerApplication: raw.partnerApplication !== undefined ? parseBool(raw.partnerApplication) : DEFAULTS.partnerApplication,
  };
}

// ─── CSV export helper (reused from other pages) ──────────────────────────────

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][][]) {
  const escape = (v: string | number) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows.flat()].map((r) => r.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [savedSettings, setSavedSettings] = useState<Settings>(DEFAULTS);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [streakMilestones, setStreakMilestones] = useState([
    { days: 3, points: 50 },
    { days: 7, points: 200 },
    { days: 14, points: 350 },
    { days: 30, points: 500 },
  ]);
  const [savedMilestones, setSavedMilestones] = useState(streakMilestones);

  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Add Admin modal
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [promoteEmail, setPromoteEmail] = useState('');
  const [promoting, setPromoting] = useState(false);
  const [promoteError, setPromoteError] = useState('');

  // Danger zone
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const hasChanges =
    JSON.stringify(settings) !== JSON.stringify(savedSettings) ||
    JSON.stringify(streakMilestones) !== JSON.stringify(savedMilestones);

  // ── Load settings from backend on mount ──────────────────────────────────────

  useEffect(() => {
    api.get<{ success: boolean; data: Record<string, string> }>('/api/admin/settings')
      .then((res) => {
        const parsed = parseSettings(res.data);
        setSettings(parsed);
        setSavedSettings(parsed);

        if (res.data.streakMilestones) {
          try {
            const m = JSON.parse(res.data.streakMilestones);
            setStreakMilestones(m);
            setSavedMilestones(m);
          } catch {
            // keep defaults
          }
        }
      })
      .catch(() => {}); // use defaults if endpoint has no data yet

    api.get<{ success: boolean; data: { users: AdminAccount[] } }>('/api/admin/users?role=ADMIN&limit=50')
      .then((res) => setAdminAccounts(res.data.users.filter((u: any) => u.role === 'ADMIN')))
      .catch(() => {})
      .finally(() => setLoadingAdmins(false));
  }, []);

  // ── Save / Discard ────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await api.put('/api/admin/settings', {
        ...settings,
        streakMilestones: JSON.stringify(streakMilestones),
      });
      setSavedSettings(settings);
      setSavedMilestones(streakMilestones);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setSettings(savedSettings);
    setStreakMilestones(savedMilestones);
  };

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  // ── Add / Remove Admin ────────────────────────────────────────────────────────

  const handlePromote = async () => {
    setPromoting(true);
    setPromoteError('');
    try {
      const res = await api.post<{ success: boolean; data: AdminAccount }>(
        '/api/admin/users/promote',
        { email: promoteEmail.trim() }
      );
      setAdminAccounts((prev) => [...prev, res.data]);
      setShowAddAdmin(false);
      setPromoteEmail('');
    } catch (err) {
      setPromoteError(err instanceof Error ? err.message : 'Failed to promote user');
    } finally {
      setPromoting(false);
    }
  };

  const handleRemoveAdmin = async (id: string) => {
    try {
      await api.delete(`/api/admin/users/${id}/admin`);
      setAdminAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove admin');
    }
  };

  // ── Danger Zone ───────────────────────────────────────────────────────────────

  const handleResetPoints = async () => {
    setResetting(true);
    try {
      await api.post('/api/admin/danger/reset-points', {});
      setShowResetConfirm(false);
      setConfirmText('');
      alert('All user points have been reset to zero.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reset points');
    } finally {
      setResetting(false);
    }
  };

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const [usersRes, partnersRes, tripsRes] = await Promise.all([
        api.get<{ success: boolean; data: { users: any[] } }>('/api/admin/users?limit=200'),
        api.get<{ success: boolean; data: { partners: any[] } }>('/api/admin/partners?limit=200'),
        api.get<{ success: boolean; data: { trips: any[] } }>('/api/admin/trips/export'),
      ]);

      downloadCsv(`users-${Date.now()}.csv`,
        ['ID', 'Name', 'Email', 'Role', 'Active', 'Points', 'Trips', 'CO2 (kg)', 'Joined'],
        [usersRes.data.users.map((u: any) => [
          u.id, u.fullName, u.email, u.role, u.isActive ? 'Yes' : 'No',
          u.stats?.totalPoints ?? 0, u.stats?.totalTrips ?? 0,
          ((u.stats?.totalCo2SavedG ?? 0) / 1000).toFixed(2),
          u.createdAt?.split('T')[0] ?? '',
        ])]
      );

      downloadCsv(`partners-${Date.now()}.csv`,
        ['ID', 'Name', 'Category', 'Status', 'Address', 'Coupons', 'Joined'],
        [partnersRes.data.partners.map((p: any) => [
          p.id, p.name, p.category, p.status, p.address,
          p._count?.coupons ?? 0, p.createdAt?.split('T')[0] ?? '',
        ])]
      );

      downloadCsv(`trips-${Date.now()}.csv`,
        ['ID', 'User', 'Email', 'Mode', 'Distance (km)', 'CO2 Saved (g)', 'Duration (s)', 'Completed At'],
        [tripsRes.data.trips.map((t: any) => [
          t.id, t.profile?.fullName ?? '', t.profile?.email ?? '',
          t.mode, t.distanceKm, t.co2SavedG, t.durationSeconds,
          t.completedAt?.split('T')[0] ?? '',
        ])]
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 pb-32 md:pb-20">

      {/* General Settings */}
      <div className="bg-admin-white rounded-[10px] p-6 border border-admin-border" style={{ boxShadow: 'var(--admin-shadow)' }}>
        <h2 className="text-lg font-semibold text-admin-charcoal mb-4 pb-3 border-b border-admin-border">General Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'App Name', key: 'appName' as const, type: 'text' },
            { label: 'Support Email', key: 'supportEmail' as const, type: 'email' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-admin-charcoal mb-2">{label}</label>
              <input type={type} value={settings[key] as string}
                onChange={(e) => set(key, e.target.value as any)}
                className="w-full px-3 py-2 border border-admin-border rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-admin-charcoal mb-2">Default Country</label>
            <select value={settings.defaultCountry} onChange={(e) => set('defaultCountry', e.target.value)}
              className="w-full px-3 py-2 border border-admin-border rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary">
              {['Germany','Netherlands','Denmark','France','Sweden'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-admin-charcoal mb-2">Default Currency</label>
            <select value={settings.defaultCurrency} onChange={(e) => set('defaultCurrency', e.target.value)}
              className="w-full px-3 py-2 border border-admin-border rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary">
              {['EUR','USD','GBP'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-admin-charcoal mb-2">Timezone</label>
            <select value={settings.timezone} onChange={(e) => set('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-admin-border rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary">
              {['Europe/Berlin','Europe/Amsterdam','Europe/Copenhagen','Europe/Paris','Europe/London'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Points Configuration */}
      <div className="bg-admin-white rounded-[10px] p-6 border border-admin-border" style={{ boxShadow: 'var(--admin-shadow)' }}>
        <h2 className="text-lg font-semibold text-admin-charcoal mb-4 pb-3 border-b border-admin-border">Points Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-admin-charcoal mb-2">Points per 10g CO2 Saved</label>
            <input type="number" value={settings.pointsPer10gCO2}
              onChange={(e) => set('pointsPer10gCO2', parseFloat(e.target.value))}
              className="w-full md:w-48 px-3 py-2 border border-admin-border rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-admin-charcoal mb-3">Mode Multipliers</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {([['Walking','walkingMultiplier'],['Cycling','cyclingMultiplier'],['Transit','transitMultiplier'],['Mixed','mixedMultiplier']] as const).map(([label, key]) => (
                <div key={key}>
                  <label className="block text-xs text-admin-gray mb-1">{label}</label>
                  <div className="flex items-center gap-2">
                    <input type="number" step="0.1" value={settings[key]}
                      onChange={(e) => set(key, parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-admin-border rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                    />
                    <span className="text-sm text-admin-gray">×</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-admin-charcoal mb-3">Streak Milestone Bonuses</label>
            <div className="space-y-2">
              {streakMilestones.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input type="number" value={m.days}
                    onChange={(e) => { const n = [...streakMilestones]; n[i] = { ...n[i], days: parseInt(e.target.value) }; setStreakMilestones(n); }}
                    className="w-24 px-3 py-2 border border-admin-border rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  />
                  <span className="text-sm text-admin-gray">days →</span>
                  <input type="number" value={m.points}
                    onChange={(e) => { const n = [...streakMilestones]; n[i] = { ...n[i], points: parseInt(e.target.value) }; setStreakMilestones(n); }}
                    className="w-24 px-3 py-2 border border-admin-border rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  />
                  <span className="text-sm text-admin-gray">pts</span>
                  <button onClick={() => setStreakMilestones(streakMilestones.filter((_, idx) => idx !== i))}
                    className="p-2 text-admin-danger hover:bg-admin-danger-light rounded transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button onClick={() => setStreakMilestones([...streakMilestones, { days: 60, points: 1000 }])}
                className="flex items-center gap-2 px-3 py-2 text-sm text-admin-primary hover:bg-admin-primary-light rounded-md transition-colors">
                <Plus size={16} /><span>Add Milestone</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-admin-white rounded-[10px] p-6 border border-admin-border" style={{ boxShadow: 'var(--admin-shadow)' }}>
        <h2 className="text-lg font-semibold text-admin-charcoal mb-4 pb-3 border-b border-admin-border">Notification Settings</h2>
        <div className="space-y-3">
          {([
            ['badgeUnlock', 'Badge unlock notifications', 'Notify users when they earn a new badge'],
            ['weeklySummary', 'Weekly summary notifications', 'Send weekly activity summaries to users'],
            ['streakAlerts', 'Streak alerts', "Alert users when their streak is about to break"],
            ['partnerNearby', 'Partner nearby alerts', 'Notify when users are near eco-partners'],
            ['welcomeEmail', 'New user welcome email', 'Send onboarding email to new users'],
            ['partnerApplication', 'Partner application alerts', 'Notify admins of new partner applications'],
          ] as const).map(([key, label, desc]) => (
            <div key={key} className="flex items-start gap-3 p-3 rounded-lg hover:bg-admin-primary-pale transition-colors">
              <input type="checkbox" checked={settings[key]}
                onChange={(e) => set(key, e.target.checked)}
                className="mt-1 w-5 h-5 text-admin-primary rounded border-admin-border"
              />
              <div className="flex-1">
                <div className="font-medium text-admin-charcoal">{label}</div>
                <div className="text-sm text-admin-gray">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Partner Defaults */}
      <div className="bg-admin-white rounded-[10px] p-6 border border-admin-border" style={{ boxShadow: 'var(--admin-shadow)' }}>
        <h2 className="text-lg font-semibold text-admin-charcoal mb-4 pb-3 border-b border-admin-border">Partner Defaults</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-admin-charcoal mb-2">
              Default Trigger Radius: {settings.defaultTriggerRadius}m
            </label>
            <input type="range" min="100" max="1000" step="50" value={settings.defaultTriggerRadius}
              onChange={(e) => set('defaultTriggerRadius', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-admin-gray mt-1"><span>100m</span><span>1000m</span></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-admin-charcoal mb-2">Minimum Monthly Fee (€)</label>
            <input type="number" value={settings.minimumMonthlyFee}
              onChange={(e) => set('minimumMonthlyFee', parseInt(e.target.value))}
              className="w-full md:w-48 px-3 py-2 border border-admin-border rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-admin-charcoal mb-2">Default Coupon Validity (days)</label>
            <input type="number" value={settings.defaultCouponValidity}
              onChange={(e) => set('defaultCouponValidity', parseInt(e.target.value))}
              className="w-full md:w-48 px-3 py-2 border border-admin-border rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
            />
          </div>
        </div>
      </div>

      {/* Admin Accounts */}
      <div className="bg-admin-white rounded-[10px] p-6 border border-admin-border" style={{ boxShadow: 'var(--admin-shadow)' }}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-admin-border">
          <h2 className="text-lg font-semibold text-admin-charcoal">Admin Accounts</h2>
          <button onClick={() => { setShowAddAdmin(true); setPromoteEmail(''); setPromoteError(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-admin-primary text-white text-sm font-medium rounded-md hover:bg-admin-primary-dark transition-colors">
            <Plus size={16} /><span>Add Admin</span>
          </button>
        </div>
        <div className="space-y-3">
          {loadingAdmins ? (
            <div className="text-sm text-admin-gray py-4 text-center">Loading…</div>
          ) : adminAccounts.length === 0 ? (
            <div className="text-sm text-admin-gray py-4 text-center">No admin accounts found.</div>
          ) : (
            adminAccounts.map((admin) => (
              <div key={admin.id} className="flex items-center gap-4 p-3 rounded-lg border border-admin-border">
                <div className="w-10 h-10 rounded-full bg-admin-primary text-white flex items-center justify-center font-semibold">
                  {admin.fullName?.charAt(0) ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-admin-charcoal">{admin.fullName}</div>
                  <div className="text-sm text-admin-gray">{admin.email}</div>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  Admin
                </span>
                <div className="text-sm text-admin-gray">{admin.createdAt?.split('T')[0]}</div>
                <button onClick={() => handleRemoveAdmin(admin.id)}
                  className="p-2 text-admin-danger hover:bg-admin-danger-light rounded transition-colors"
                  title="Remove admin role">
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-admin-white rounded-[10px] p-6 border-2 border-admin-danger" style={{ boxShadow: 'var(--admin-shadow)' }}>
        <h2 className="text-lg font-semibold text-admin-danger mb-2 flex items-center gap-2">
          <AlertTriangle size={20} /> Danger Zone
        </h2>
        <p className="text-sm text-admin-gray mb-6">These actions are irreversible. Proceed with caution.</p>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <button onClick={handleExportAll} disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 border-2 border-admin-danger text-admin-danger font-medium rounded-md hover:bg-admin-danger-light transition-colors disabled:opacity-50">
              {exporting ? <Loader2 size={16} className="animate-spin" /> : null}
              {exporting ? 'Exporting…' : 'Export All Data'}
            </button>
            <button onClick={() => { setShowResetConfirm(true); setConfirmText(''); }}
              className="px-4 py-2 border-2 border-admin-danger text-admin-danger font-medium rounded-md hover:bg-admin-danger-light transition-colors">
              Reset All Points
            </button>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <input type="checkbox" id="maintenance-mode"
              checked={settings.maintenanceMode}
              onChange={(e) => set('maintenanceMode', e.target.checked)}
              className="w-5 h-5 text-admin-danger rounded border-admin-border cursor-pointer"
            />
            <label htmlFor="maintenance-mode" className="text-sm font-medium text-admin-charcoal cursor-pointer">
              Maintenance Mode
            </label>
            <span className="text-xs text-admin-gray">Temporarily disable app access for users</span>
          </div>
        </div>
      </div>

      {/* Unsaved changes bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 md:left-16 bg-admin-primary-light border-t-2 border-admin-primary p-4 z-30">
          <div className="flex items-center justify-between max-w-screen-xl mx-auto">
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-admin-warning" />
              <span className="font-medium text-admin-charcoal">You have unsaved changes</span>
              {saveError && <span className="text-sm text-admin-danger ml-2">{saveError}</span>}
            </div>
            <div className="flex gap-3">
              <button onClick={handleDiscard}
                className="px-4 py-2 border border-admin-border bg-admin-white text-admin-charcoal font-medium rounded-md hover:bg-admin-primary-pale transition-colors">
                Discard
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-admin-primary text-white font-medium rounded-md hover:bg-admin-primary-dark transition-colors disabled:opacity-60">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                <span>{saving ? 'Saving…' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddAdmin && (
        <>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-admin-white rounded-[10px] p-6 z-50 mx-4">
            <h3 className="text-lg font-semibold text-admin-charcoal mb-2">Promote User to Admin</h3>
            <p className="text-sm text-admin-gray mb-4">Enter the email of an existing user to grant them admin access.</p>
            <input type="email" value={promoteEmail} onChange={(e) => setPromoteEmail(e.target.value)}
              placeholder="user@example.com" autoFocus
              className="w-full px-3 py-2 border border-admin-border rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary mb-3"
            />
            {promoteError && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600 mb-3">{promoteError}</div>}
            <div className="flex gap-3">
              <button onClick={() => setShowAddAdmin(false)}
                className="flex-1 px-4 py-2 border border-admin-border rounded-md text-sm font-medium text-admin-charcoal hover:bg-admin-primary-pale transition-colors">
                Cancel
              </button>
              <button onClick={handlePromote} disabled={promoting || !promoteEmail.trim()}
                className="flex-1 px-4 py-2 bg-admin-primary text-white text-sm font-medium rounded-md hover:bg-admin-primary-dark transition-colors disabled:opacity-50">
                {promoting ? 'Promoting…' : 'Promote to Admin'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Reset Points Modal */}
      {showResetConfirm && (
        <>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-admin-white rounded-[10px] p-6 z-50 mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-admin-danger" />
              <h3 className="text-lg font-semibold text-admin-charcoal">Reset All Points</h3>
            </div>
            <p className="text-sm text-admin-gray mb-4">
              This will set every user's point balance to zero. This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-admin-charcoal mb-2">
                Type <span className="font-mono bg-admin-danger-light text-admin-danger px-2 py-0.5 rounded">CONFIRM</span> to proceed
              </label>
              <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type CONFIRM"
                className="w-full px-3 py-2 border border-admin-border rounded-md focus:outline-none focus:ring-2 focus:ring-admin-danger"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowResetConfirm(false); setConfirmText(''); }}
                className="flex-1 px-4 py-2 border border-admin-border rounded-md text-sm font-medium text-admin-charcoal hover:bg-admin-primary-pale transition-colors">
                Cancel
              </button>
              <button onClick={handleResetPoints} disabled={confirmText !== 'CONFIRM' || resetting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-admin-danger text-white text-sm font-medium rounded-md hover:bg-admin-danger/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {resetting ? <Loader2 size={16} className="animate-spin" /> : null}
                {resetting ? 'Resetting…' : 'Reset All Points'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
