import { Plus, Search, Store, Tag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../lib/api';

interface ApiPartner {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  logoUrl: string | null;
  address: string;
  websiteUrl: string | null;
  radiusMeters: number;
  createdAt: string;
  _count: { coupons: number };
}

type StatusFilter = 'All' | 'ACTIVE' | 'PENDING' | 'SUSPENDED';

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  PENDING: 'Pending',
};

export default function PartnersPage() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<ApiPartner[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<ApiPartner | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchPartners = () => {
    const params = new URLSearchParams({ limit: '200' });
    if (debouncedSearch) params.set('search', debouncedSearch);
    return api
      .get<{ success: boolean; data: { partners: ApiPartner[]; total: number } }>(`/api/admin/partners?${params}`)
      .then((res) => {
        setPartners(res.data.partners);
        setTotal(res.data.total);
      });
  };

  useEffect(() => {
    setLoading(true);
    fetchPartners()
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  const filteredPartners = partners.filter((p) => {
    if (statusFilter !== 'All' && p.status !== statusFilter) return false;
    return true;
  });

  const getStatusCount = (status: StatusFilter) => {
    if (status === 'All') return partners.length;
    return partners.filter((p) => p.status === status).length;
  };

  const handleStatusChange = async (partnerId: string, status: 'ACTIVE' | 'SUSPENDED' | 'PENDING') => {
    setUpdating(true);
    try {
      await api.patch(`/api/admin/partners/${partnerId}/status`, { status });
      await fetchPartners();
      if (selectedPartner?.id === partnerId) {
        setSelectedPartner((prev) => prev ? { ...prev, status } : prev);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePartner = async (partnerId: string) => {
    setUpdating(true);
    try {
      await api.delete(`/api/admin/partners/${partnerId}`);
      await fetchPartners();
      if (selectedPartner?.id === partnerId) setSelectedPartner(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete partner');
    } finally {
      setUpdating(false);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'ACTIVE') return 'bg-admin-primary-light text-admin-primary';
    if (status === 'PENDING') return 'bg-admin-warning-light text-admin-warning';
    return 'bg-admin-danger-light text-admin-danger';
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-admin-border pb-2">
          {(['All', 'ACTIVE', 'PENDING', 'SUSPENDED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                statusFilter === status ? 'text-admin-primary' : 'text-admin-gray hover:text-admin-charcoal'
              }`}
            >
              {status === 'All' ? 'All' : STATUS_LABELS[status]}
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs rounded-full bg-admin-primary-pale text-admin-charcoal">
                {getStatusCount(status)}
              </span>
              {statusFilter === status && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-admin-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Search + Add */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-gray" />
              <input
                type="text"
                placeholder="Search partners…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-admin-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary"
              />
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/partners/add')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-admin-primary text-white font-medium rounded-md hover:bg-admin-primary-dark transition-colors"
          >
            <Plus size={18} />
            <span>Add Partner</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-admin-gray">
        <span>{total} total partners</span>
      </div>

      {loading && <div className="text-sm text-admin-gray py-8 text-center">Loading partners…</div>}
      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

      {/* Partners Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPartners.map((partner) => (
            <div
              key={partner.id}
              className="bg-admin-white rounded-[10px] p-5 border border-admin-border cursor-pointer hover:border-admin-primary transition-colors"
              style={{ boxShadow: 'var(--admin-shadow)' }}
              onClick={() => setSelectedPartner(partner)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-admin-primary-pale flex items-center justify-center">
                    <Store size={24} className="text-admin-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-admin-charcoal">{partner.name}</h3>
                    <p className="text-xs text-admin-gray capitalize">{partner.category.toLowerCase()}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusBadge(partner.status)}`}>
                  {STATUS_LABELS[partner.status] ?? partner.status}
                </span>
              </div>

              <p className="text-sm text-admin-gray mb-4 line-clamp-2">{partner.description}</p>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-admin-primary-pale rounded-lg text-center">
                  <div className="text-lg font-semibold text-admin-primary">{partner._count.coupons}</div>
                  <div className="text-xs text-admin-gray">Coupons</div>
                </div>
                <div className="p-3 bg-admin-primary-pale rounded-lg text-center">
                  <div className="text-lg font-semibold text-admin-charcoal">{partner.radiusMeters}m</div>
                  <div className="text-xs text-admin-gray">Trigger radius</div>
                </div>
              </div>

              <p className="text-xs text-admin-gray truncate">{partner.address}</p>

              {/* Actions */}
              <div className="mt-4 flex items-center gap-2">
                {partner.status === 'PENDING' && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(partner.id, 'ACTIVE'); }}
                      disabled={updating}
                      className="flex-1 px-3 py-1.5 bg-admin-primary text-white text-sm font-medium rounded-md hover:bg-admin-primary-dark transition-colors disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletePartner(partner.id); }}
                      disabled={updating}
                      className="flex-1 px-3 py-1.5 border border-admin-danger text-admin-danger text-sm font-medium rounded-md hover:bg-admin-danger-light transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                )}
                {partner.status === 'ACTIVE' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleStatusChange(partner.id, 'SUSPENDED'); }}
                    disabled={updating}
                    className="flex-1 px-3 py-1.5 border border-admin-warning text-admin-warning text-sm font-medium rounded-md hover:bg-admin-warning-light transition-colors disabled:opacity-50"
                  >
                    Suspend
                  </button>
                )}
                {partner.status === 'SUSPENDED' && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(partner.id, 'ACTIVE'); }}
                      disabled={updating}
                      className="flex-1 px-3 py-1.5 bg-admin-primary text-white text-sm font-medium rounded-md hover:bg-admin-primary-dark transition-colors disabled:opacity-50"
                    >
                      Reinstate
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletePartner(partner.id); }}
                      disabled={updating}
                      className="flex-1 px-3 py-1.5 border border-admin-danger text-admin-danger text-sm font-medium rounded-md hover:bg-admin-danger-light transition-colors disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Partner Detail Drawer */}
      {selectedPartner && (
        <>
          <div className="fixed right-0 top-0 h-full w-full md:w-[400px] bg-admin-white z-50 overflow-y-auto shadow-xl p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-admin-primary-pale flex items-center justify-center">
                  <Store size={28} className="text-admin-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-admin-charcoal">{selectedPartner.name}</h2>
                  <p className="text-sm text-admin-gray capitalize">{selectedPartner.category.toLowerCase()}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${statusBadge(selectedPartner.status)}`}>
                    {STATUS_LABELS[selectedPartner.status]}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedPartner(null)} className="text-admin-gray hover:text-admin-charcoal">✕</button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-admin-gray">{selectedPartner.description}</p>
              <div className="text-sm text-admin-charcoal">{selectedPartner.address}</div>
              {selectedPartner.websiteUrl && (
                <a href={selectedPartner.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-admin-primary hover:underline block">
                  {selectedPartner.websiteUrl}
                </a>
              )}

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 bg-admin-primary-pale rounded-lg text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Tag size={14} className="text-admin-primary" />
                    <div className="text-lg font-semibold text-admin-primary">{selectedPartner._count.coupons}</div>
                  </div>
                  <div className="text-xs text-admin-gray">Coupons</div>
                </div>
                <div className="p-3 bg-admin-primary-pale rounded-lg text-center">
                  <div className="text-lg font-semibold text-admin-charcoal">{selectedPartner.radiusMeters}m</div>
                  <div className="text-xs text-admin-gray">Trigger radius</div>
                </div>
              </div>

              <div className="mt-4 text-xs text-admin-gray">Added {selectedPartner.createdAt.split('T')[0]}</div>

              <div className="space-y-2 pt-4 border-t border-admin-border">
                {selectedPartner.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(selectedPartner.id, 'ACTIVE')}
                      disabled={updating}
                      className="w-full px-4 py-2 bg-admin-primary text-white text-sm font-medium rounded-md hover:bg-admin-primary-dark transition-colors disabled:opacity-50"
                    >
                      Approve Partner
                    </button>
                    <button
                      onClick={() => handleDeletePartner(selectedPartner.id)}
                      disabled={updating}
                      className="w-full px-4 py-2 border border-admin-danger text-admin-danger text-sm font-medium rounded-md hover:bg-admin-danger-light transition-colors disabled:opacity-50"
                    >
                      Reject & Delete
                    </button>
                  </>
                )}
                {selectedPartner.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleStatusChange(selectedPartner.id, 'SUSPENDED')}
                    disabled={updating}
                    className="w-full px-4 py-2 border border-admin-warning text-admin-warning text-sm font-medium rounded-md hover:bg-admin-warning-light transition-colors disabled:opacity-50"
                  >
                    Suspend Partner
                  </button>
                )}
                {selectedPartner.status === 'SUSPENDED' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(selectedPartner.id, 'ACTIVE')}
                      disabled={updating}
                      className="w-full px-4 py-2 bg-admin-primary text-white text-sm font-medium rounded-md hover:bg-admin-primary-dark transition-colors disabled:opacity-50"
                    >
                      Reinstate Partner
                    </button>
                    <button
                      onClick={() => handleDeletePartner(selectedPartner.id)}
                      disabled={updating}
                      className="w-full px-4 py-2 border border-admin-danger text-admin-danger text-sm font-medium rounded-md hover:bg-admin-danger-light transition-colors disabled:opacity-50"
                    >
                      Delete Partner
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
