'use client'

import { useEffect, useRef, useState } from 'react'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

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

      <div className="sidebar-foot" style={{ position: 'relative' }} ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          style={{ display: 'contents', cursor: 'pointer' }}
          title="Account menu"
        >
          <div className="avatar" style={{ cursor: 'pointer', flexShrink: 0 }}>BL</div>
        </button>
        <div className="meta" style={{ flex: 1, minWidth: 0 }}>
          <div className="name">Partner</div>
          <div className="role">EcoRoute</div>
        </div>

        {menuOpen && (
          <div style={{
            position: 'absolute', bottom: 'calc(100% + 8px)', left: 0,
            background: 'var(--white)', border: '1px solid var(--gray-200)',
            borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            minWidth: 160, zIndex: 100, overflow: 'hidden',
          }}>
            <button
              onClick={handleSignOut}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 14px', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: 13, color: 'var(--rose-600)',
                fontWeight: 500, textAlign: 'left',
              }}
            >
              <Icon name="arrowLeft" size={15} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
