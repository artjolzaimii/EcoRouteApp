import { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { Search, Store, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { api } from '../lib/api';

interface Partner {
  id: string;
  name: string;
  category: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  address: string;
  lat: string;
  lng: string;
  radiusMeters: number;
  _count: { coupons: number };
}

const STATUS_COLORS: Record<Partner['status'], string> = {
  ACTIVE: '#2D8653',
  PENDING: '#F59E0B',
  SUSPENDED: '#6B7280',
};

const STATUS_LABEL: Record<Partner['status'], string> = {
  ACTIVE: 'Active',
  PENDING: 'Pending',
  SUSPENDED: 'Suspended',
};

export default function MapViewPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Set<Partner['status']>>(new Set(['ACTIVE']));
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    api.get<{ success: boolean; data: { partners: Partner[] } }>('/api/admin/partners?limit=200')
      .then((res) => setPartners(res.data.partners))
      .finally(() => setLoading(false));

    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { /* permission denied or unavailable — fall back to first partner */ },
    );
  }, []);

  const toggleStatus = (status: Partner['status']) => {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      next.has(status) ? next.delete(status) : next.add(status);
      return next;
    });
  };

  const filtered = partners.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter.size === 0 || statusFilter.has(p.status);
    return matchesSearch && matchesStatus;
  });

  const mapCenter = userLocation
    ?? (filtered.length > 0 ? { lat: parseFloat(filtered[0].lat), lng: parseFloat(filtered[0].lng) } : { lat: 44.8178, lng: 20.4569 });

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string}>
      <div className="relative -m-6 h-[calc(100vh-64px)] pb-20 md:pb-0">

        {/* Left Control Panel */}
        <div
          className={`absolute left-0 top-0 h-full bg-admin-white border-r border-admin-border z-20 transition-all duration-300 ${
            panelCollapsed ? 'w-12' : 'w-80'
          } hidden md:flex flex-col`}
        >
          {panelCollapsed ? (
            <button
              onClick={() => setPanelCollapsed(false)}
              className="absolute right-0 top-4 p-2 text-admin-gray hover:text-admin-charcoal"
            >
              <ChevronRight size={20} />
            </button>
          ) : (
            <>
              <div className="p-4 border-b border-admin-border flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-admin-charcoal">Partner Locations</h3>
                  <button
                    onClick={() => setPanelCollapsed(true)}
                    className="text-admin-gray hover:text-admin-charcoal"
                  >
                    <ChevronLeft size={20} />
                  </button>
                </div>

                <div className="relative mb-4">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-gray" />
                  <input
                    type="text"
                    placeholder="Search partners..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-admin-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-admin-gray uppercase mb-2">Status</label>
                  <div className="space-y-1">
                    {(['ACTIVE', 'PENDING', 'SUSPENDED'] as const).map((s) => (
                      <label key={s} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={statusFilter.has(s)}
                          onChange={() => toggleStatus(s)}
                          className="w-4 h-4 text-admin-primary rounded border-admin-border"
                        />
                        <span className="text-sm text-admin-charcoal">{STATUS_LABEL[s]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Partner List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-sm text-admin-gray">Loading…</div>
                ) : filtered.length === 0 ? (
                  <div className="p-4 text-sm text-admin-gray">No partners found.</div>
                ) : (
                  filtered.map((partner) => (
                    <button
                      key={partner.id}
                      onClick={() => setSelectedPartner(partner)}
                      className={`w-full p-3 border-b border-admin-border text-left hover:bg-admin-primary-pale transition-colors ${
                        selectedPartner?.id === partner.id ? 'bg-admin-primary-light' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: STATUS_COLORS[partner.status] }}
                        />
                        <span className="font-medium text-admin-charcoal text-sm truncate">{partner.name}</span>
                      </div>
                      <div className="text-xs text-admin-gray pl-5 truncate">{partner.address}</div>
                    </button>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-admin-border flex-shrink-0">
                <a
                  href="/admin/partners/add"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-admin-primary text-white text-sm font-medium rounded-md hover:bg-admin-primary-dark transition-colors"
                >
                  <Plus size={16} />
                  <span>Add Partner</span>
                </a>
              </div>
            </>
          )}
        </div>

        {/* Map */}
        <div className={`h-full ${panelCollapsed ? 'md:ml-12' : 'md:ml-80'} transition-all duration-300`}>
          <Map
            defaultCenter={mapCenter}
            defaultZoom={12}
            mapId="ecoroute-admin-map"
            style={{ width: '100%', height: '100%' }}
            gestureHandling="greedy"
            disableDefaultUI={false}
          >
            {filtered.map((partner) => (
              <AdvancedMarker
                key={partner.id}
                position={{ lat: parseFloat(partner.lat), lng: parseFloat(partner.lng) }}
                onClick={() => setSelectedPartner(partner)}
              >
                <div
                  className="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center"
                  style={{ backgroundColor: STATUS_COLORS[partner.status] }}
                >
                  <Store size={14} color="white" />
                </div>
              </AdvancedMarker>
            ))}

            {selectedPartner && (
              <InfoWindow
                position={{ lat: parseFloat(selectedPartner.lat), lng: parseFloat(selectedPartner.lng) }}
                onCloseClick={() => setSelectedPartner(null)}
              >
                <div className="p-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: STATUS_COLORS[selectedPartner.status] }}
                    />
                    <p className="font-semibold text-sm text-gray-800">{selectedPartner.name}</p>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{selectedPartner.category}</p>
                  <p className="text-xs text-gray-500 mb-3">{selectedPartner.address}</p>
                  <div className="flex gap-3 text-xs text-gray-600 mb-3">
                    <span><strong>{selectedPartner._count.coupons}</strong> coupons</span>
                    <span><strong>{selectedPartner.radiusMeters}m</strong> radius</span>
                  </div>
                  <a
                    href={`/admin/partners`}
                    className="text-xs text-green-700 font-medium hover:underline"
                  >
                    View in Partners →
                  </a>
                </div>
              </InfoWindow>
            )}
          </Map>
        </div>

        {/* Mobile Bottom Sheet */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-admin-white border-t border-admin-border z-30 max-h-[40vh] overflow-y-auto safe-area-bottom">
          <div className="p-4">
            <div className="w-12 h-1 bg-admin-border rounded-full mx-auto mb-4" />
            <h3 className="font-semibold text-admin-charcoal mb-3">Partner Locations</h3>
            <div className="space-y-2">
              {filtered.slice(0, 5).map((partner) => (
                <button
                  key={partner.id}
                  onClick={() => setSelectedPartner(partner)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-admin-border hover:bg-admin-primary-pale transition-colors"
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[partner.status] }}
                  />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-admin-charcoal text-sm">{partner.name}</div>
                    <div className="text-xs text-admin-gray truncate">{partner.address}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </APIProvider>
  );
}
