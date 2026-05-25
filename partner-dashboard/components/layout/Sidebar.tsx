'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BrandMark } from '../ui/BrandMark'
import { Icon } from '../ui/Icon'
import { signOut } from '@/lib/auth'

const NAV_ITEMS = [
  { href: '/dashboard',   icon: 'home',     label: 'Home' },
  { href: '/products',    icon: 'box',      label: 'Products & Services' },
  { href: '/orders',      icon: 'cart',     label: 'Orders' },
  { href: '/settings',    icon: 'settings', label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-card">
          <BrandMark size={38} />
          <div style={{ minWidth: 0 }}>
            <div className="brand-name">EcoRoute</div>
            <div className="brand-sub">Partner Portal</div>
          </div>
        </div>
      </div>

      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
        >
          <Icon className="ic" name={item.icon} size={18} />
          <span>{item.label}</span>
        </Link>
      ))}

      <Link
        href="/products/new"
        className={`nav-item ${pathname === '/products/new' ? 'active' : ''}`}
      >
        <Icon className="ic" name="plus" size={18} />
        <span>Add product</span>
      </Link>

      <div className="sidebar-foot">
        <div className="avatar">BL</div>
        <div className="meta" style={{ flex: 1, minWidth: 0 }}>
          <div className="name">Partner</div>
          <div className="role">EcoRoute</div>
        </div>
        <button
          onClick={handleSignOut}
          title="Sign out"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)', padding: 4 }}
        >
          <Icon name="arrowLeft" size={16} />
        </button>
      </div>
    </aside>
  )
}
