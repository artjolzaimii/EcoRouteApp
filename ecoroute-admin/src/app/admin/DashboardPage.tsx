import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Leaf, Users, Car, Store } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../lib/api';

interface Stats {
  totalUsers: number;
  usersToday: number;
  totalTrips: number;
  tripsWeeklyChange: number | null;
  co2SavedLifetimeG: number;
  treesEquivalent: number;
  activePartners: number;
  pendingPartners: number;
}

interface DailyStat {
  date: string;
  trips: number;
  co2SavedG: number;
}

interface ActivityEvent {
  id: string;
  type: 'user' | 'trip' | 'badge';
  description: string;
  timestamp: string;
}

interface UserRow {
  id: string;
  fullName: string;
  stats: { totalPoints: number; totalTrips: number; totalCo2SavedG: number } | null;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<'7D' | '30D' | '90D'>('30D');
  const [stats, setStats] = useState<Stats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [topUsers, setTopUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [graphLoading, setGraphLoading] = useState(false);
  const [error, setError] = useState('');

  const days = dateRange === '7D' ? 7 : dateRange === '30D' ? 30 : 90;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<{ success: boolean; data: Stats }>('/api/admin/stats'),
      api.get<{ success: boolean; data: { dailyStats: DailyStat[] } }>(`/api/admin/analytics?days=${days}`),
      api.get<{ success: boolean; data: ActivityEvent[] }>('/api/admin/activity'),
      api.get<{ success: boolean; data: { users: UserRow[] } }>('/api/admin/users?limit=10'),
    ])
      .then(([statsRes, analyticsRes, activityRes, usersRes]) => {
        setStats(statsRes.data);
        setDailyStats(analyticsRes.data.dailyStats);
        setActivity(activityRes.data);
        const sorted = [...usersRes.data.users]
          .filter((u) => u.stats)
          .sort((a, b) => (b.stats?.totalPoints ?? 0) - (a.stats?.totalPoints ?? 0))
          .slice(0, 5);
        setTopUsers(sorted);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) return;
    setGraphLoading(true);
    api.get<{ success: boolean; data: { dailyStats: DailyStat[] } }>(`/api/admin/analytics?days=${days}`)
      .then((res) => setDailyStats(res.data.dailyStats))
      .catch((err: Error) => setError(err.message))
      .finally(() => setGraphLoading(false));
  }, [days]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-admin-gray">Loading dashboard…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
    );
  }

  const co2Tonnes = stats ? (stats.co2SavedLifetimeG / 1_000_000).toFixed(1) : '0';
  const weeklyChange = stats?.tripsWeeklyChange;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-admin-white rounded-[10px] p-5 border border-admin-border" style={{ boxShadow: 'var(--admin-shadow)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-admin-gray">Total Users</span>
            <Users size={20} className="text-admin-primary" />
          </div>
          <div className="text-3xl font-semibold text-admin-charcoal mb-2">
            {stats?.totalUsers.toLocaleString()}
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-admin-primary-light text-admin-primary">
            +{stats?.usersToday} today
          </span>
        </div>

        <div className="bg-admin-white rounded-[10px] p-5 border border-admin-border" style={{ boxShadow: 'var(--admin-shadow)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-admin-gray">Total Trips</span>
            <Car size={20} className="text-admin-primary" />
          </div>
          <div className="text-3xl font-semibold text-admin-charcoal mb-2">
            {stats?.totalTrips.toLocaleString()}
          </div>
          {weeklyChange !== null && weeklyChange !== undefined && (
            <div className="flex items-center gap-2">
              {weeklyChange >= 0 ? (
                <TrendingUp size={14} className="text-admin-primary" />
              ) : (
                <TrendingDown size={14} className="text-admin-danger" />
              )}
              <span className={`text-sm font-medium ${weeklyChange >= 0 ? 'text-admin-primary' : 'text-admin-danger'}`}>
                {weeklyChange >= 0 ? '+' : ''}{weeklyChange}%
              </span>
              <span className="text-sm text-admin-gray">vs last week</span>
            </div>
          )}
        </div>

        <div className="bg-admin-white rounded-[10px] p-5 border border-admin-border" style={{ boxShadow: 'var(--admin-shadow)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-admin-gray">CO2 Saved Lifetime</span>
            <Leaf size={20} className="text-admin-primary" />
          </div>
          <div className="text-3xl font-semibold text-admin-charcoal mb-2">{co2Tonnes}t</div>
          <div className="flex items-center gap-1 text-sm text-admin-gray">
            <Leaf size={14} />
            <span>≈ {stats?.treesEquivalent.toLocaleString()} trees</span>
          </div>
        </div>

        <div className="bg-admin-white rounded-[10px] p-5 border border-admin-border" style={{ boxShadow: 'var(--admin-shadow)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-admin-gray">Active Eco-Partners</span>
            <Store size={20} className="text-admin-primary" />
          </div>
          <div className="text-3xl font-semibold text-admin-charcoal mb-2">{stats?.activePartners}</div>
          {(stats?.pendingPartners ?? 0) > 0 && (
            <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-admin-warning-light text-admin-warning">
              {stats?.pendingPartners} pending
            </div>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-admin-white rounded-[10px] p-5 border border-admin-border" style={{ boxShadow: 'var(--admin-shadow)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-admin-charcoal">Activity Overview</h2>
            <div className="flex gap-2">
              {(['7D', '30D', '90D'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    dateRange === range
                      ? 'bg-admin-primary text-white'
                      : 'bg-admin-primary-pale text-admin-gray hover:bg-admin-primary-light'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 relative">
            {graphLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10 rounded-md">
                <div className="text-sm text-admin-gray">Loading…</div>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#B8D8C4" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#666666' }}
                  tickFormatter={(v: string) => {
                    const d = new Date(v);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#666666' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#666666' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #B8D8C4', borderRadius: '6px', fontSize: '12px' }}
                />
                <Line yAxisId="left" type="monotone" dataKey="trips" stroke="#2D8653" strokeWidth={2} dot={false} name="Daily Trips" />
                <Line yAxisId="right" type="monotone" dataKey="co2SavedG" stroke="#1A5C38" strokeWidth={2} strokeDasharray="5 5" dot={false} name="CO2 Saved (g)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-admin-white rounded-[10px] p-5 border border-admin-border" style={{ boxShadow: 'var(--admin-shadow)' }}>
          <h2 className="text-lg font-semibold text-admin-charcoal mb-4">Live Activity Feed</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {activity.length === 0 && (
              <p className="text-sm text-admin-gray">No recent activity.</p>
            )}
            {activity.map((event) => {
              const dotColor = {
                trip: 'bg-admin-primary',
                user: 'bg-blue-500',
                badge: 'bg-purple-500',
              }[event.type];
              return (
                <div key={event.id} className="flex gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${dotColor}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-admin-charcoal leading-relaxed">{event.description}</p>
                    <p className="text-xs text-admin-gray mt-0.5">{timeAgo(event.timestamp)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Users */}
      <div className="bg-admin-white rounded-[10px] p-5 border border-admin-border" style={{ boxShadow: 'var(--admin-shadow)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-admin-charcoal">Top Users by Green Points</h2>
          <a href="/admin/users" className="text-sm text-admin-primary hover:underline">View All</a>
        </div>
        <div className="space-y-3">
          {topUsers.map((user, index) => (
            <div key={user.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-admin-primary-pale transition-colors">
              <div className="text-lg font-semibold text-admin-gray w-6">#{index + 1}</div>
              <div className="w-10 h-10 rounded-full bg-admin-primary text-white flex items-center justify-center font-semibold">
                {user.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-admin-charcoal">{user.fullName}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-admin-primary">{(user.stats?.totalPoints ?? 0).toLocaleString()}</div>
                <div className="text-xs text-admin-gray">{user.stats?.totalTrips ?? 0} trips</div>
              </div>
              <div className="text-right text-sm text-admin-gray">
                {((user.stats?.totalCo2SavedG ?? 0) / 1000).toFixed(1)} kg
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
