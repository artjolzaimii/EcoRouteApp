import { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Format = 'CSV' | 'PDF';

interface ExportRecord {
  id: string;
  name: string;
  type: string;
  date: string;
  rows: number;
  format: Format;
}

// ─── CSV helpers ─────────────────────────────────────────────────────────────

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (v: string | number) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n');
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Report generators ───────────────────────────────────────────────────────

async function generateUserReport(format: Format, from: string, to: string): Promise<number> {
  const res = await api.get<{ success: boolean; data: { users: any[] } }>(
    '/api/admin/users?limit=200'
  );
  let users = res.data.users;
  if (from) users = users.filter((u) => u.createdAt >= from);
  if (to) users = users.filter((u) => u.createdAt <= to + 'T23:59:59Z');

  const headers = ['ID', 'Name', 'Email', 'Total Trips', 'Total Points', 'CO2 Saved (kg)', 'Joined'];
  const rows = users.map((u) => [
    u.id,
    u.fullName ?? '',
    u.email ?? '',
    u.stats?.totalTrips ?? 0,
    u.stats?.totalPoints ?? 0,
    ((u.stats?.totalCo2SavedG ?? 0) / 1000).toFixed(2),
    u.createdAt?.split('T')[0] ?? '',
  ]);

  if (format === 'CSV') {
    downloadBlob(toCsv(headers, rows), `user-report-${Date.now()}.csv`, 'text/csv');
  } else {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('EcoRoute — User Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    autoTable(doc, { head: [headers], body: rows, startY: 34, styles: { fontSize: 8 } });
    doc.save(`user-report-${Date.now()}.pdf`);
  }
  return rows.length;
}

async function generatePartnerReport(format: Format, from: string, to: string): Promise<number> {
  const res = await api.get<{ success: boolean; data: { partners: any[] } }>(
    '/api/admin/partners?limit=200'
  );
  let partners = res.data.partners;
  if (from) partners = partners.filter((p) => p.createdAt >= from);
  if (to) partners = partners.filter((p) => p.createdAt <= to + 'T23:59:59Z');

  const headers = ['ID', 'Name', 'Category', 'Status', 'Address', 'Coupons', 'Points/Visit', 'Joined'];
  const rows = partners.map((p) => [
    p.id,
    p.name,
    p.category,
    p.status,
    p.address,
    p._count?.coupons ?? 0,
    p.pointsPerVisit ?? 0,
    p.createdAt?.split('T')[0] ?? '',
  ]);

  if (format === 'CSV') {
    downloadBlob(toCsv(headers, rows), `partner-report-${Date.now()}.csv`, 'text/csv');
  } else {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('EcoRoute — Partner Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    autoTable(doc, { head: [headers], body: rows, startY: 34, styles: { fontSize: 8 } });
    doc.save(`partner-report-${Date.now()}.pdf`);
  }
  return rows.length;
}

async function generateImpactReport(format: Format, from: string, to: string): Promise<number> {
  const days = from && to
    ? Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1
    : 90;
  const res = await api.get<{ success: boolean; data: { dailyStats: any[]; modeDistribution: any[]; points: any } }>(
    `/api/admin/analytics?days=${Math.min(days, 365)}`
  );
  const { dailyStats, modeDistribution, points } = res.data;

  const totalCo2G = dailyStats.reduce((s, d) => s + d.co2SavedG, 0);
  const totalTrips = dailyStats.reduce((s, d) => s + d.trips, 0);

  if (format === 'CSV') {
    const headers = ['Date', 'Trips', 'CO2 Saved (g)'];
    const rows = dailyStats.map((d) => [d.date, d.trips, d.co2SavedG]);
    downloadBlob(toCsv(headers, rows), `impact-report-${Date.now()}.csv`, 'text/csv');
  } else {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(45, 134, 83);
    doc.text('EcoRoute Impact Report', 14, 22);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

    doc.setFontSize(13);
    doc.text('Summary', 14, 44);
    autoTable(doc, {
      head: [['Metric', 'Value']],
      body: [
        ['Total Trips', totalTrips.toLocaleString()],
        ['Total CO2 Saved', `${(totalCo2G / 1_000_000).toFixed(2)} tonnes`],
        ['Equivalent Trees', Math.round(totalCo2G / 22000).toLocaleString()],
        ['Points Issued', points.totalIssued.toLocaleString()],
        ['Points Redeemed', points.totalRedeemed.toLocaleString()],
        ['Redemption Rate', `${points.redemptionRate}%`],
      ],
      startY: 48,
      styles: { fontSize: 10 },
    });

    doc.setFontSize(13);
    doc.text('Transport Mode Distribution', 14, (doc as any).lastAutoTable.finalY + 14);
    autoTable(doc, {
      head: [['Mode', 'Trips']],
      body: modeDistribution.map((m) => [m.mode, m.count]),
      startY: (doc as any).lastAutoTable.finalY + 18,
      styles: { fontSize: 10 },
    });

    doc.setFontSize(13);
    doc.text('Daily Breakdown', 14, (doc as any).lastAutoTable.finalY + 14);
    autoTable(doc, {
      head: [['Date', 'Trips', 'CO2 Saved (g)']],
      body: dailyStats.map((d) => [d.date, d.trips, d.co2SavedG.toLocaleString()]),
      startY: (doc as any).lastAutoTable.finalY + 18,
      styles: { fontSize: 8 },
    });

    doc.save(`impact-report-${Date.now()}.pdf`);
  }
  return dailyStats.length;
}

// ─── Report Card ─────────────────────────────────────────────────────────────

function ReportCard({
  title,
  description,
  iconColor,
  defaultFormat,
  options,
  onGenerate,
}: {
  title: string;
  description: string;
  iconColor: string;
  defaultFormat: Format;
  options: string[];
  onGenerate: (format: Format, from: string, to: string) => Promise<number>;
}) {
  const [format, setFormat] = useState<Format>(defaultFormat);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await onGenerate(format, from, to);
    } catch (err) {
      alert(`Export failed: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-admin-white rounded-[14px] p-6 border border-admin-border flex flex-col" style={{ boxShadow: 'var(--admin-shadow)' }}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${iconColor}1A` }}>
          <FileText size={24} style={{ color: iconColor }} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-admin-charcoal text-lg mb-1">{title}</h3>
          <p className="text-sm text-admin-gray">{description}</p>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-admin-charcoal mb-2">Date Range</label>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-2 border border-admin-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 border border-admin-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary" />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-admin-charcoal mb-2">Includes</label>
        <div className="space-y-1">
          {options.map((opt) => (
            <div key={opt} className="flex items-center gap-2 text-sm text-admin-gray">
              <div className="w-1.5 h-1.5 rounded-full bg-admin-primary flex-shrink-0" />
              {opt}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-admin-charcoal mb-2">Format</label>
        <div className="flex gap-2">
          {(['CSV', 'PDF'] as Format[]).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`flex-1 py-2 text-sm font-medium rounded-md border-2 transition-colors ${
                format === f
                  ? 'border-admin-primary bg-admin-primary-light text-admin-primary'
                  : 'border-admin-border text-admin-gray hover:border-admin-primary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="mt-auto w-full flex items-center justify-center gap-2 px-4 py-3 bg-admin-primary text-white font-medium rounded-md hover:bg-admin-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
        <span>{loading ? 'Generating…' : `Export ${format}`}</span>
      </button>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [exports, setExports] = useState<ExportRecord[]>([]);

  const record = (name: string, type: string, format: Format) =>
    async (generate: () => Promise<number>) => {
      const rows = await generate();
      setExports((prev) => [
        {
          id: crypto.randomUUID(),
          name: `${name} — ${new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`,
          type,
          date: new Date().toISOString().split('T')[0],
          rows,
          format,
        },
        ...prev,
      ]);
    };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ReportCard
          title="User Report"
          description="All user data including trips, points, and badges."
          iconColor="#2D8653"
          defaultFormat="CSV"
          options={['User profiles', 'Trip history', 'Points balance', 'CO2 saved']}
          onGenerate={async (format, from, to) => {
            await record('User Report', 'User', format)(
              () => generateUserReport(format, from, to)
            );
          }}
        />
        <ReportCard
          title="Partner Report"
          description="Performance data for all Eco-Partners including coupon metrics."
          iconColor="#3B82F6"
          defaultFormat="CSV"
          options={['Partner profiles', 'Coupon count', 'Status', 'Points per visit']}
          onGenerate={async (format, from, to) => {
            await record('Partner Report', 'Partner', format)(
              () => generatePartnerReport(format, from, to)
            );
          }}
        />
        <ReportCard
          title="Impact Report"
          description="Global CO2 savings summary for sustainability presentations."
          iconColor="#10B981"
          defaultFormat="PDF"
          options={['CO2 savings summary', 'Mode distribution', 'Daily breakdown', 'Points economy']}
          onGenerate={async (format, from, to) => {
            await record('Impact Report', 'Impact', format)(
              () => generateImpactReport(format, from, to)
            );
          }}
        />
      </div>

      {exports.length > 0 && (
        <div className="bg-admin-white rounded-[10px] border border-admin-border overflow-hidden" style={{ boxShadow: 'var(--admin-shadow)' }}>
          <div className="p-5 border-b border-admin-border">
            <h3 className="font-semibold text-admin-charcoal">Recent Exports</h3>
            <p className="text-xs text-admin-gray mt-0.5">Session history — clears on page reload</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-admin-primary-pale border-b border-admin-border">
                  {['Report Name', 'Type', 'Date', 'Rows', 'Format'].map((h) => (
                    <th key={h} className="text-left p-4 text-sm font-semibold text-admin-charcoal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exports.map((r) => (
                  <tr key={r.id} className="border-b border-admin-border hover:bg-admin-primary-pale transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-admin-primary" />
                        <span className="text-sm font-medium text-admin-charcoal">{r.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.type === 'User' ? 'bg-admin-primary-light text-admin-primary'
                        : r.type === 'Partner' ? 'bg-blue-100 text-blue-700'
                        : 'bg-emerald-100 text-emerald-700'
                      }`}>{r.type}</span>
                    </td>
                    <td className="p-4 text-sm text-admin-gray">{r.date}</td>
                    <td className="p-4 text-sm text-admin-charcoal">{r.rows.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.format === 'CSV' ? 'bg-admin-primary-light text-admin-primary' : 'bg-blue-100 text-blue-700'
                      }`}>{r.format}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
