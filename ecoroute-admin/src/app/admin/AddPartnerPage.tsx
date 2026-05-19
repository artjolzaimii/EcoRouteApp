import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Store, MapPin, Phone, Mail, Globe, ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

const CATEGORIES = [
  { value: 'FOOD',          label: 'Food & Beverage' },
  { value: 'RETAIL',        label: 'Retail' },
  { value: 'TRANSPORT',     label: 'Transport / Bike Shop' },
  { value: 'FITNESS',       label: 'Fitness & Gym' },
  { value: 'WELLNESS',      label: 'Wellness & Spa' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'OTHER',         label: 'Other' },
];

const PARTNER_TYPES = [
  { value: 'ECO_BUSINESS',      label: 'Eco Business' },
  { value: 'MOBILITY_PROVIDER', label: 'Mobility Provider' },
];

export default function AddPartnerPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    category: '',
    partnerType: 'ECO_BUSINESS',
    status: 'ACTIVE',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    country: '',
    description: '',
    radiusMeters: '500',
  });

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const fullAddress = [form.address, form.city, form.country].filter(Boolean).join(', ');

    const contactBlock = [
      form.contactPerson && `Contact: ${form.contactPerson}`,
      form.email        && `Email: ${form.email}`,
      form.phone        && `Phone: ${form.phone}`,
    ].filter(Boolean).join(' | ');

    const fullDescription = contactBlock
      ? `${contactBlock}\n\n${form.description}`
      : form.description;

    try {
      await api.post('/api/admin/partners', {
        name: form.name,
        category: form.category,
        partnerType: form.partnerType,
        status: form.status,
        address: fullAddress,
        description: fullDescription || ' ',
        websiteUrl: form.website || undefined,
        radiusMeters: Number(form.radiusMeters),
      });
      navigate('/admin/partners');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create partner');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full px-4 py-2.5 bg-admin-white border border-admin-border rounded-lg text-admin-charcoal focus:outline-none focus:ring-2 focus:ring-admin-primary text-sm';

  return (
    <div className="space-y-6 max-w-4xl pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/admin/partners')}
          className="w-10 h-10 bg-admin-white rounded-lg border border-admin-border flex items-center justify-center hover:bg-admin-primary-pale transition-colors"
        >
          <ArrowLeft size={20} className="text-admin-gray" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-admin-charcoal">Add New Partner</h1>
          <p className="text-sm text-admin-gray">Add a new eco-partner to the network</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-admin-white rounded-[10px] p-6 border border-admin-border space-y-6" style={{ boxShadow: 'var(--admin-shadow)' }}>

        {/* Business Information */}
        <div>
          <h2 className="text-base font-semibold text-admin-charcoal mb-4">Business Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-medium text-admin-charcoal mb-1.5">Business Name *</label>
              <input type="text" required value={form.name} onChange={set('name')}
                className={inputCls} placeholder="Enter business name" />
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-charcoal mb-1.5">Category *</label>
              <select required value={form.category} onChange={set('category')} className={inputCls}>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-charcoal mb-1.5">Partner Type</label>
              <select value={form.partnerType} onChange={set('partnerType')} className={inputCls}>
                {PARTNER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-charcoal mb-1.5">Initial Status</label>
              <select value={form.status} onChange={set('status')} className={inputCls}>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-charcoal mb-1.5">Contact Person</label>
              <input type="text" value={form.contactPerson} onChange={set('contactPerson')}
                className={inputCls} placeholder="Contact person name" />
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-charcoal mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-gray" />
                <input type="email" value={form.email} onChange={set('email')}
                  className={`${inputCls} pl-9`} placeholder="email@example.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-charcoal mb-1.5">Phone</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-gray" />
                <input type="tel" value={form.phone} onChange={set('phone')}
                  className={`${inputCls} pl-9`} placeholder="+1 234 567 8900" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-charcoal mb-1.5">Website</label>
              <div className="relative">
                <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-gray" />
                <input type="url" value={form.website} onChange={set('website')}
                  className={`${inputCls} pl-9`} placeholder="https://example.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-charcoal mb-1.5">Trigger Radius (meters)</label>
              <input type="number" min="50" max="10000" value={form.radiusMeters} onChange={set('radiusMeters')}
                className={inputCls} placeholder="500" />
              <p className="text-xs text-admin-gray mt-1">Distance at which coupon notifications are triggered</p>
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <h2 className="text-base font-semibold text-admin-charcoal mb-4">Location</h2>
          <p className="text-xs text-admin-gray mb-3">The address will be geocoded automatically to place the partner on the map.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-admin-charcoal mb-1.5">Street Address *</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-3 text-admin-gray" />
                <input type="text" required value={form.address} onChange={set('address')}
                  className={`${inputCls} pl-9`} placeholder="Street address" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-charcoal mb-1.5">City *</label>
              <input type="text" required value={form.city} onChange={set('city')}
                className={inputCls} placeholder="City" />
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-charcoal mb-1.5">Country *</label>
              <input type="text" required value={form.country} onChange={set('country')}
                className={inputCls} placeholder="Country" />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-admin-charcoal mb-1.5">Description</label>
          <textarea value={form.description} onChange={set('description')} rows={4}
            className={`${inputCls} resize-none`}
            placeholder="Brief description of the business and partnership…" />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate('/admin/partners')}
            className="flex-1 px-6 py-3 border border-admin-border text-admin-gray rounded-lg font-medium hover:bg-admin-primary-pale transition-colors text-sm">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="flex-1 px-6 py-3 bg-admin-primary text-white rounded-lg font-medium hover:bg-admin-primary-dark transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed">
            {submitting ? (
              <><Loader2 size={16} className="animate-spin" /> Creating…</>
            ) : (
              <><Store size={16} /> Add Partner</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
