import { useEffect, useState } from 'react';
import { Search, Plus, Trash2, Edit2 } from 'lucide-react';
import { api } from '../lib/api';

interface ApiCoupon {
  id: string;
  partnerId: string;
  title: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED' | 'FREE_ITEM';
  discountValue: string;
  pointsCost: number;
  totalStock: number | null;
  issuedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  partner: { id: string; name: string };
}

interface ApiPartner {
  id: string;
  name: string;
  status: string;
}

type DiscountType = 'PERCENTAGE' | 'FIXED' | 'FREE_ITEM';

const DISCOUNT_LABELS: Record<string, string> = {
  PERCENTAGE: '% off',
  FIXED: '€ off',
  FREE_ITEM: 'Free item',
};

interface CouponForm {
  partnerId: string;
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  pointsCost: number;
  totalStock: string | number;
  expiresAt: string;
  isActive: boolean;
}

function discountText(coupon: ApiCoupon) {
  if (coupon.discountType === 'PERCENTAGE') return `${coupon.discountValue}% off`;
  if (coupon.discountType === 'FIXED') return `€${coupon.discountValue} off`;
  return 'Free item';
}

function discountColor(type: string) {
  if (type === 'PERCENTAGE') return 'bg-admin-primary text-white';
  if (type === 'FIXED') return 'bg-blue-500 text-white';
  return 'bg-purple-500 text-white';
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<ApiCoupon[]>([]);
  const [partners, setPartners] = useState<ApiPartner[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedPartnerId, setSelectedPartnerId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editCoupon, setEditCoupon] = useState<ApiCoupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const emptyForm = (): CouponForm => ({
    partnerId: '',
    title: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    pointsCost: 0,
    totalStock: '',
    expiresAt: '',
    isActive: true,
  });

  const [form, setForm] = useState<CouponForm>(emptyForm());

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchCoupons = () => {
    const params = new URLSearchParams({ limit: '200' });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (selectedPartnerId !== 'all') params.set('partnerId', selectedPartnerId);
    return api
      .get<{ success: boolean; data: { coupons: ApiCoupon[]; total: number } }>(`/api/admin/coupons?${params}`)
      .then((res) => {
        setCoupons(res.data.coupons);
        setTotal(res.data.total);
      });
  };

  useEffect(() => {
    api
      .get<{ success: boolean; data: { partners: ApiPartner[] } }>('/api/admin/partners?limit=200')
      .then((res) => setPartners(res.data.partners.filter((p) => p.status === 'ACTIVE')))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchCoupons()
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [debouncedSearch, selectedPartnerId]);

  const openCreate = () => {
    setEditCoupon(null);
    setForm(emptyForm());
    setSaveError('');
    setShowModal(true);
  };

  const openEdit = (coupon: ApiCoupon) => {
    setEditCoupon(coupon);
    setForm({
      partnerId: coupon.partnerId,
      title: coupon.title,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: parseFloat(coupon.discountValue),
      pointsCost: coupon.pointsCost,
      totalStock: coupon.totalStock ?? '',
      expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '',
      isActive: coupon.isActive,
    });
    setSaveError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        ...form,
        totalStock: form.totalStock !== '' ? Number(form.totalStock) : undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      };
      if (editCoupon) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { partnerId, ...updatePayload } = payload;
        await api.put(`/api/admin/coupons/${editCoupon.id}`, updatePayload);
      } else {
        await api.post('/api/admin/coupons', payload);
      }
      await fetchCoupons();
      setShowModal(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (coupon: ApiCoupon) => {
    try {
      await api.patch(`/api/admin/coupons/${coupon.id}/toggle`);
      await fetchCoupons();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Toggle failed');
    }
  };

  const handleDelete = async (coupon: ApiCoupon) => {
    if (!confirm(`Delete "${coupon.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/admin/coupons/${coupon.id}`);
      await fetchCoupons();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const activeCoupons = coupons.filter((c) => c.isActive).length;
  const totalIssued = coupons.reduce((s, c) => s + c.issuedCount, 0);

  return (
    <div className="pb-20 md:pb-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-admin-white rounded-[10px] p-4 border border-admin-border" style={{ boxShadow: 'var(--admin-shadow)' }}>
          <div className="text-sm text-admin-gray mb-1">Active Coupons</div>
          <div className="text-2xl font-semibold text-admin-charcoal">{activeCoupons}</div>
        </div>
        <div className="bg-admin-white rounded-[10px] p-4 border border-admin-border" style={{ boxShadow: 'var(--admin-shadow)' }}>
          <div className="text-sm text-admin-gray mb-1">Total Issued</div>
          <div className="text-2xl font-semibold text-admin-charcoal">{totalIssued.toLocaleString()}</div>
        </div>
        <div className="bg-admin-white rounded-[10px] p-4 border border-admin-border" style={{ boxShadow: 'var(--admin-shadow)' }}>
          <div className="text-sm text-admin-gray mb-1">Total Coupons</div>
          <div className="text-2xl font-semibold text-admin-charcoal">{total}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-gray" />
            <input
              type="text"
              placeholder="Search coupons…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-admin-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary"
            />
          </div>
        </div>
        <select
          value={selectedPartnerId}
          onChange={(e) => setSelectedPartnerId(e.target.value)}
          className="px-3 py-2 border border-admin-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary"
        >
          <option value="all">All Partners</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-admin-primary text-white font-medium rounded-md hover:bg-admin-primary-dark transition-colors"
        >
          <Plus size={18} />
          <span>Add Coupon</span>
        </button>
      </div>

      {loading && <div className="text-sm text-admin-gray py-8 text-center">Loading coupons…</div>}
      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4">{error}</div>}

      {/* Coupons List */}
      {!loading && (
        <div className="space-y-3">
          {coupons.length === 0 && (
            <div className="text-center py-12 text-admin-gray text-sm">No coupons found.</div>
          )}
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="bg-admin-white rounded-[10px] p-5 border border-admin-border"
              style={{ boxShadow: 'var(--admin-shadow)' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-semibold text-admin-charcoal">{coupon.title}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${discountColor(coupon.discountType)}`}>
                      {discountText(coupon)}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${coupon.isActive ? 'bg-admin-primary-light text-admin-primary' : 'bg-gray-100 text-gray-500'}`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-admin-gray mb-3">{coupon.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-admin-gray">
                    <span>Partner: <span className="text-admin-charcoal font-medium">{coupon.partner.name}</span></span>
                    {coupon.pointsCost > 0 && <span>Cost: {coupon.pointsCost} pts</span>}
                    {coupon.totalStock != null && (
                      <span>
                        Stock: {coupon.issuedCount}/{coupon.totalStock}
                      </span>
                    )}
                    {coupon.expiresAt && <span>Expires: {coupon.expiresAt.split('T')[0]}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(coupon)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${coupon.isActive ? 'border-admin-warning text-admin-warning hover:bg-admin-warning-light' : 'border-admin-primary text-admin-primary hover:bg-admin-primary-pale'}`}
                  >
                    {coupon.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => openEdit(coupon)}
                    className="p-2 text-admin-gray hover:text-admin-charcoal hover:bg-admin-primary-pale rounded transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(coupon)}
                    className="p-2 text-admin-gray hover:text-admin-danger hover:bg-admin-danger-light rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] bg-admin-white rounded-[14px] z-50 mx-4 overflow-y-auto">
            <div className="sticky top-0 bg-admin-white border-b border-admin-border p-6 z-10">
              <h2 className="text-xl font-semibold text-admin-charcoal">
                {editCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {!editCoupon && (
                <div>
                  <label className="block text-sm font-medium text-admin-charcoal mb-1">Partner</label>
                  <select
                    value={form.partnerId}
                    onChange={(e) => setForm((f) => ({ ...f, partnerId: e.target.value }))}
                    className="w-full px-3 py-2 border border-admin-border rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  >
                    <option value="">Select partner…</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-admin-charcoal mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., 10% off coffee"
                  className="w-full px-3 py-2 border border-admin-border rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-charcoal mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-admin-border rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-admin-charcoal mb-1">Discount Type</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as typeof form.discountType }))}
                    className="w-full px-3 py-2 border border-admin-border rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  >
                    {Object.entries(DISCOUNT_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-charcoal mb-1">
                    Value {form.discountType === 'PERCENTAGE' ? '(%)' : form.discountType === 'FIXED' ? '(€)' : '(description)'}
                  </label>
                  <input
                    type="number"
                    value={form.discountValue}
                    onChange={(e) => setForm((f) => ({ ...f, discountValue: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-admin-border rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-admin-charcoal mb-1">Points Cost</label>
                  <input
                    type="number"
                    value={form.pointsCost}
                    onChange={(e) => setForm((f) => ({ ...f, pointsCost: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full px-3 py-2 border border-admin-border rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-charcoal mb-1">Total Stock (optional)</label>
                  <input
                    type="number"
                    value={form.totalStock}
                    onChange={(e) => setForm((f) => ({ ...f, totalStock: e.target.value }))}
                    placeholder="Unlimited"
                    className="w-full px-3 py-2 border border-admin-border rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-charcoal mb-1">Expires At (optional)</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
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
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-admin-border rounded-md text-sm font-medium text-admin-charcoal hover:bg-admin-primary-pale transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-admin-primary text-white text-sm font-medium rounded-md hover:bg-admin-primary-dark transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving…' : editCoupon ? 'Save Changes' : 'Create Coupon'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
