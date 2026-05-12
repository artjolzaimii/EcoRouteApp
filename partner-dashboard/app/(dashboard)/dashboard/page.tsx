'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Topbar } from '@/components/layout/Topbar'
import { Icon } from '@/components/ui/Icon'
import { StatusPill } from '@/components/ui/StatusPill'
import { ProductThumb } from '@/components/ui/ProductThumb'
import { api } from '@/lib/api'

interface Listing {
  id: string
  title: string
  category: { label: string }
  moneyPrice: number | null
  pointsPrice: number | null
  stock: number | null
  status: string
  images: { url: string; isCover: boolean }[]
}

function statusKind(s: string) {
  if (s === 'ACTIVE')       return 'active'
  if (s === 'OUT_OF_STOCK') return 'out'
  if (s === 'DRAFT')        return 'draft'
  return 'archived'
}

function statusLabel(s: string) {
  if (s === 'ACTIVE')       return 'Active'
  if (s === 'OUT_OF_STOCK') return 'Out of stock'
  if (s === 'DRAFT')        return 'Draft'
  return 'Archived'
}

export default function DashboardPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [total, setTotal]       = useState(0)
  const [pending, setPending]   = useState(0)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.allSettled([
      api.get<{ listings: Listing[]; total: number }>('/api/partner/listings?limit=4'),
      api.get<{ orders: unknown[]; total: number }>('/api/partner/orders?status=SIMULATED_PAID&limit=1'),
    ])
      .then(([lr, or]) => {
        if (lr.status === 'fulfilled') {
          setListings(lr.value.listings ?? [])
          setTotal(lr.value.total ?? 0)
        }
        if (or.status === 'fulfilled') {
          setPending(or.value.total ?? 0)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Topbar
        title="Welcome back"
        sub="Manage your marketplace listings from one place."
      />
      <div className="content" style={{ maxWidth: 1080 }}>
        {/* Two stats + green CTA */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, marginBottom: 24, alignItems: 'stretch' }}>
          <div className="stat">
            <div className="stat-head">
              <span className="stat-label">Total listings</span>
              <span className="stat-icon"><Icon name="box" size={18} /></span>
            </div>
            <div className="stat-value">{loading ? '—' : total}</div>
          </div>

          <div className="stat">
            <div className="stat-head">
              <span className="stat-label">Pending orders</span>
              <span className="stat-icon blue"><Icon name="cart" size={18} /></span>
            </div>
            <div className="stat-value">{loading ? '—' : pending}</div>
            <div className="stat-foot">Paid, awaiting fulfillment</div>
          </div>

          <Link
            href="/products/new"
            style={{
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              alignItems: 'flex-start', gap: 6, minWidth: 240,
              background: 'linear-gradient(135deg, var(--eco-600), var(--eco-700))',
              color: 'white', borderRadius: 'var(--r-2xl)',
              padding: '20px 22px', textDecoration: 'none',
              boxShadow: 'var(--shadow-eco)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
              <Icon name="plus" size={16} /> Add product / service
            </span>
            <span style={{ fontSize: 12, opacity: 0.85 }}>Create a new marketplace listing</span>
          </Link>
        </div>

        {/* Latest products table */}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Latest listings</div>
            </div>
            <Link href="/products" className="btn btn-ghost card-cta">View all →</Link>
          </div>
          <div className="table-wrap" style={{ border: 'none' }}>
            <table className="t">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 24 }}>Loading…</td></tr>
                )}
                {!loading && listings.length === 0 && (
                  <tr><td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 24 }}>No listings yet — add your first one!</td></tr>
                )}
                {listings.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="h-stack">
                        <ProductThumb small imageUrl={p.images?.find((i) => i.isCover)?.url} />
                        <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{p.title}</div>
                      </div>
                    </td>
                    <td>{p.category?.label ?? '—'}</td>
                    <td>
                      {p.moneyPrice != null && <span style={{ fontWeight: 600 }}>€{Number(p.moneyPrice).toFixed(2)}</span>}
                      {p.moneyPrice != null && p.pointsPrice != null && <span style={{ color: 'var(--gray-400)' }}> · </span>}
                      {p.pointsPrice != null && <span style={{ color: 'var(--eco-700)', fontWeight: 600 }}>{p.pointsPrice.toLocaleString()} pts</span>}
                    </td>
                    <td>{p.stock ?? '∞'}</td>
                    <td>
                      <StatusPill kind={statusKind(p.status)} label={statusLabel(p.status)} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={`/products/${p.id}/edit`} className="btn btn-ghost">Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
