import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../lib/auth';
import ecoRouteLogo from '@/assets/ecoroute_logo.png';
import {
  LayoutDashboard,
  Users,
  Award,
  Store,
  Tag,
  Map,
  BarChart3,
  FileText,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from 'lucide-react';

const navigation = [
  {
    section: 'Overview',
    items: [
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard }
    ]
  },
  {
    section: 'Users & Community',
    items: [
      { name: 'Users', path: '/admin/users', icon: Users },
      { name: 'Badges', path: '/admin/badges', icon: Award }
    ]
  },
  {
    section: 'Partner Network',
    items: [
      { name: 'Partners', path: '/admin/partners', icon: Store },
      { name: 'Coupons & Offers', path: '/admin/coupons', icon: Tag },
      { name: 'Map View', path: '/admin/map', icon: Map }
    ]
  },
  {
    section: 'Data',
    items: [
      { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
      { name: 'Reports', path: '/admin/reports', icon: FileText }
    ]
  },
  {
    section: 'System',
    items: [
      { name: 'Settings', path: '/admin/settings', icon: Settings }
    ]
  }
];

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, email, displayName } = useAuth();
  const initials = displayName
    ? displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : email
    ? email[0].toUpperCase()
    : 'AD';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const currentPage = navigation
    .flatMap(section => section.items)
    .find(item => item.path === location.pathname)?.name || 'Dashboard';

  return (
    <div className="admin-panel min-h-screen bg-admin-background">
      {/* Compact Sidebar - Desktop & Tablet */}
      <aside className="hidden md:block fixed left-0 top-0 h-full w-16 bg-admin-white border-r border-admin-border">
        <div className="flex flex-col h-full items-center py-6">
          <div className="w-10 h-10 rounded-lg overflow-hidden mb-8 flex items-center justify-center" title="EcoRoute Admin">
            <img
              src={ecoRouteLogo}
              alt="EcoRoute"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <nav className="flex-1 w-full">
            {navigation.map((section) =>
              section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={item.name}
                    className={`flex items-center justify-center h-12 transition-colors relative group ${
                      isActive
                        ? 'text-admin-primary'
                        : 'text-admin-gray hover:text-admin-charcoal'
                    }`}
                  >
                    <Icon size={20} />
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-admin-primary rounded-r" />
                    )}
                    {/* Tooltip */}
                    <div className="absolute left-full ml-2 px-3 py-2 bg-admin-charcoal text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                      {item.name}
                    </div>
                  </Link>
                );
              })
            )}
          </nav>
        </div>
      </aside>

      {/* Mobile Overlay Sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="md:hidden fixed left-0 top-0 h-full w-64 bg-admin-white z-50 shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b border-admin-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                    <img
                      src={ecoRouteLogo}
                      alt="EcoRoute"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-admin-charcoal">EcoRoute</div>
                    <div className="text-xs text-admin-gray">Admin Panel</div>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-admin-gray hover:text-admin-charcoal"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto p-4">
                {navigation.map((section, idx) => (
                  <div key={idx} className="mb-6">
                    <div className="text-xs font-semibold text-admin-gray uppercase tracking-wider mb-2 px-3">
                      {section.section}
                    </div>
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                              isActive
                                ? 'bg-admin-primary-light text-admin-primary font-medium'
                                : 'text-admin-gray hover:bg-admin-primary-pale hover:text-admin-charcoal'
                            }`}
                          >
                            <Icon size={18} />
                            <span className="text-sm">{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              {/* Admin User Info */}
              <div className="p-4 border-t border-admin-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-admin-primary text-admin-white flex items-center justify-center font-semibold">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-admin-charcoal truncate">{displayName ?? email ?? 'Admin'}</div>
                    {displayName && email && <div className="text-xs text-admin-gray truncate">{email}</div>}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm text-admin-gray hover:text-admin-danger transition-colors"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className="md:ml-16">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-admin-white border-b border-admin-border">
          <div className="flex items-center justify-between px-4 md:px-6 h-16">
            {/* Left: Hamburger + Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden text-admin-charcoal"
              >
                <Menu size={24} />
              </button>
              <h1 className="font-semibold text-admin-charcoal">{currentPage}</h1>
            </div>

            {/* Right: Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-admin-primary-pale transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-admin-primary text-admin-white flex items-center justify-center font-semibold text-sm">
                  {initials}
                </div>
                <ChevronDown size={14} className="text-admin-gray hidden md:block" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-admin-white border border-admin-border rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-admin-border">
                    <p className="text-sm font-medium text-admin-charcoal">{displayName ?? email ?? 'Admin'}</p>
                    {displayName && email && <p className="text-xs text-admin-gray mt-0.5">{email}</p>}
                  </div>
                  <div className="p-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-admin-danger hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut size={15} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-admin-white border-t border-admin-border safe-area-bottom z-30">
        <div className="flex items-center justify-around h-16">
          {[
            { icon: LayoutDashboard, path: '/admin', label: 'Home' },
            { icon: Users, path: '/admin/users', label: 'Users' },
            { icon: Store, path: '/admin/partners', label: 'Partners' },
            { icon: BarChart3, path: '/admin/analytics', label: 'Analytics' },
            { icon: Settings, path: '/admin/settings', label: 'Settings' }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full ${
                  isActive ? 'text-admin-primary' : 'text-admin-gray'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
