import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { api } from '../lib/api';

interface DailyStat {
  date: string;
  trips: number;
  co2SavedG: number;
}

interface ModeRow {
  mode: string;
  count: number;
}

interface PointsSummary {
  totalIssued: number;
  totalRedeemed: number;
  netOutstanding: number;
  redemptionRate: number;
}

interface AnalyticsData {
  dailyStats: DailyStat[];
  modeDistribution: ModeRow[];
  points: PointsSummary;
}

const MODE_COLORS: Record<string, string> = {
  WALKING: '#EAF4EE',
  CYCLING: '#1A5C38',
  TRANSIT: '#2D8653',
  CYCLING_TRANSIT: '#F59E0B',
  EV: '#60A5FA',
};

const MODE_LABELS: Record<string, string> = {
  WALKING: 'Walking',
  CYCLING: 'Cycling',
  TRANSIT: 'Transit',
  CYCLING_TRANSIT: 'Cycling + Transit',
  EV: 'EV',
};

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<'7D' | '30D' | '90D'>('30D');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const days = dateRange === '7D' ? 7 : dateRange === '30D' ? 30 : 90;

  useEffect(() => {
    setLoading(true);
    api
      .get<{ success: boolean; data: AnalyticsData }>(`/api/admin/analytics?days=${days}`)
      .then((res) => setData(res.data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return <div className="text-sm text-admin-gray py-8 text-center">Loading analytics…</div>;
  }
  if (error) {
    return <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>;
  }
  if (!data) return null;

  const chartData = data.dailyStats.map((d) => ({
    date: d.date,
    trips: d.trips,
    co2kg: Math.round(d.co2SavedG / 1000),
  }));

  const modeData = data.modeDistribution.map((d) => ({
    name: MODE_LABELS[d.mode] ?? d.mode,
    value: d.count,
    fill: MODE_COLORS[d.mode] ?? '#ccc',
  }));

  const totalTrips = data.modeDistribution.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-admin-charcoal">Data Overview</h2>
        <div className="flex gap-2">
          {(['7D', '30D', '90D'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                dateRange === range
                  ? 'bg-admin-primary text-white'
                  : 'bg-admin-white border border-admin-border text-admin-gray hover:bg-admin-primary-pale'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trips */}
        <div className="bg-admin-white rounded-[10px] p-5 border border-admin-border" style={{ boxShadow: 'var(--admin-shadow)' }}>
          <h3 className="font-semibold text-admin-charcoal mb-4">Daily Trips</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#B8D8C4" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#666666' }}
                  tickFormatter={(v: string) => {
                    const d = new Date(v);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12, fill: '#666666' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #B8D8C4', borderRadius: '6px', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="trips" stroke="#2D8653" strokeWidth={2} dot={false} name="Trips" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily CO2 Saved */}
        <div className="bg-admin-white rounded-[10px] p-5 border border-admin-border" style={{ boxShadow: 'var(--admin-shadow)' }}>
          <h3 className="font-semibold text-admin-charcoal mb-4">Daily CO2 Saved (kg)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#B8D8C4" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#666666' }}
                  tickFormatter={(v: string) => {
                    const d = new Date(v);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12, fill: '#666666' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #B8D8C4', borderRadius: '6px', fontSize: '12px' }}
                />
                <Bar dataKey="co2kg" fill="#2D8653" name="CO2 Saved (kg)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mode Distribution */}
        <div className="bg-admin-white rounded-[10px] p-5 border border-admin-border" style={{ boxShadow: 'var(--admin-shadow)' }}>
          <h3 className="font-semibold text-admin-charcoal mb-4">Trip Mode Distribution</h3>
          {modeData.length === 0 ? (
            <div className="text-sm text-admin-gray py-8 text-center">No trip data yet.</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={modeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {modeData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #B8D8C4', borderRadius: '6px', fontSize: '12px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-4 space-y-2">
            {modeData.map((m) => (
              <div key={m.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: m.fill }} />
                  <span className="text-admin-charcoal">{m.name}</span>
                </div>
                <span className="text-admin-gray">
                  {m.value.toLocaleString()} ({totalTrips > 0 ? ((m.value / totalTrips) * 100).toFixed(1) : '0'}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Points Economy */}
        <div className="bg-admin-white rounded-[10px] p-5 border border-admin-border" style={{ boxShadow: 'var(--admin-shadow)' }}>
          <h3 className="font-semibold text-admin-charcoal mb-4">Points Economy</h3>
          <div className="space-y-4">
            {[
              { label: 'Total Points Issued', value: data.points.totalIssued.toLocaleString(), color: 'text-admin-primary' },
              { label: 'Total Points Redeemed', value: data.points.totalRedeemed.toLocaleString(), color: 'text-admin-danger' },
              { label: 'Net Outstanding', value: data.points.netOutstanding.toLocaleString(), color: 'text-admin-charcoal' },
              { label: 'Redemption Rate', value: `${data.points.redemptionRate}%`, color: 'text-admin-warning' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-admin-primary-pale">
                <span className="text-sm text-admin-gray">{label}</span>
                <span className={`font-semibold ${color}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Redemption progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-admin-gray mb-1">
              <span>Redemption rate</span>
              <span>{data.points.redemptionRate}%</span>
            </div>
            <div className="w-full h-2 bg-admin-primary-pale rounded-full overflow-hidden">
              <div
                className="h-full bg-admin-primary rounded-full transition-all"
                style={{ width: `${Math.min(data.points.redemptionRate, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
