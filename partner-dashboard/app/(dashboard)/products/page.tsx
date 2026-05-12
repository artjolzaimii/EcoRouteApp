'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Topbar } from '@/components/layout/Topbar'
import { Icon } from '@/components/ui/Icon'
import { StatusPill } from '@/components/ui/StatusPill'
import { ProductThumb } from '@/components/ui/ProductThumb'
import { api } from '@/lib/api'

interface Category { id: string; slug: string; label: string }

interface Listing {
  id: string
  title: string
  category: Category
  payment: string
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

function paymentLabel(p: string) {
  if (p === 'MONEY_ONLY') return 'Money'
  if (p === 'FLEXIBLE')   return 'Flexible'
  return p
}

export default function ProductsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading]   = useState(true)
  const [q, setQ]               = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    api.get<{ listings: Listing[] }>('/api/partner/listings?limit=100')
      .then((r) => setListings(r.listings))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing?')) return
    setDeleting(id)
    try {
      await api.delete(`/api/partner/listings/${id}`)
      setListings((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      alert('Failed to delete listing')
      console.error(err)
    } finally {
      setDeleting(null)
    }
  }

  const filtered = listings.filter((p) =>
    p.title.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <>
      <Topbar
        title="Products & services"
        sub="Manage what appears on the EcoRoute marketplace."
        actions={
          <Link href="/products/new" className="btn btn-primary">
            <Icon name="plus" size={16} /> Add product
          </Link>
        }
      />
      <div className="content" style={{ maxWidth: 1180 }}>
        <div className="filter-bar">
          <div className="input-with-icon">
            <Icon className="ic-l" name="search" size={16} />
            <input
              className="input"
              placeholder="Search your listings…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrap">
          <table className="t">
            <thead>
              <tr>
                <th style={{ width: '34%' }}>Product</th>
                <th>Category</th>
                <th>Payment</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 24 }}>Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 24 }}>No listings found.</td></tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="h-stack">
                      <ProductThumb small imageUrl={p.images?.find((i) => i.isCover)?.url} />
                      <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{p.title}</div>
                    </div>
                  </td>
                  <td>{p.category?.label ?? '—'}</td>
                  <td>
                    <span className={`tag ${p.payment === 'FLEXIBLE' ? 'blue' : ''}`}>
                      {paymentLabel(p.payment)}
                    </span>
                  </td>
                  <td>
                    {p.moneyPrice != null && <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>€{Number(p.moneyPrice).toFixed(2)}</span>}
                    {p.moneyPrice != null && p.pointsPrice != null && <span style={{ color: 'var(--gray-400)' }}> · </span>}
                    {p.pointsPrice != null && <span style={{ color: 'var(--eco-700)', fontWeight: 600 }}>{p.pointsPrice.toLocaleString()} pts</span>}
                  </td>
                  <td>{p.stock ?? '∞'}</td>
                  <td>
                    <StatusPill kind={statusKind(p.status)} label={statusLabel(p.status)} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 4 }}>
                      <Link href={`/products/${p.id}/edit`} className="btn btn-ghost">
                        <Icon name="edit" size={14} /> Edit
                      </Link>
                      <button
                        className="btn btn-danger-ghost"
                        disabled={deleting === p.id}
                        onClick={() => handleDelete(p.id)}
                      >
                        <Icon name="trash" size={14} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
