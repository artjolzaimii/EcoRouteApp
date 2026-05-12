'use client'

import { useEffect, useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { api } from '@/lib/api'

interface Order {
  id: string
  profile: { fullName: string; email: string }
  listing: { title: string; payment: string; moneyPrice: number | null }
  pointsUsed: number
  moneyPaidSimulated: number
  status: string
  createdAt: string
}

const STATUS_TAG: Record<string, string> = {
  PENDING:       'amber',
  SIMULATED_PAID: 'blue',
  COMPLETED:     'eco',
  CANCELLED:     'rose',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING:        'Pending',
  SIMULATED_PAID: 'Paid (sim.)',
  COMPLETED:      'Completed',
  CANCELLED:      'Cancelled',
}

function paymentSummary(o: Order) {
  const parts: string[] = []
  if (o.pointsUsed > 0)         parts.push(`${o.pointsUsed.toLocaleString()} pts`)
  if (o.moneyPaidSimulated > 0) parts.push(`€${Number(o.moneyPaidSimulated).toFixed(2)}`)
  return parts.join(' + ') || '—'
}

export default function OrdersPage() {
  const [orders,  setOrders]  = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<{ orders: Order[] }>('/api/partner/orders?limit=100')
      .then((r) => setOrders(r.orders ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/api/partner/orders/${id}/status`, { status })
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o))
      )
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      <Topbar
        title="Orders"
        sub="Customer purchases and redemptions."
      />
      <div className="content" style={{ maxWidth: 1080 }}>
        <div className="table-wrap">
          <table className="t">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Product</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 24 }}>Loading…</td></tr>
              )}
              {!loading && orders.length === 0 && (
                <tr><td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 24 }}>No orders yet.</td></tr>
              )}
              {orders.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 600, color: 'var(--gray-900)' }}>
                    {o.profile.fullName}
                    <div className="muted" style={{ fontWeight: 400, fontSize: 12 }}>{o.profile.email}</div>
                  </td>
                  <td>{o.listing.title}</td>
                  <td>
                    <span className="muted">{paymentSummary(o)}</span>
                  </td>
                  <td>
                    <span className={`tag ${STATUS_TAG[o.status] ?? ''}`}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="muted">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    {o.status === 'SIMULATED_PAID' && (
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: 12 }}
                        onClick={() => updateStatus(o.id, 'COMPLETED')}
                      >
                        Mark fulfilled
                      </button>
                    )}
                    {(o.status === 'SIMULATED_PAID' || o.status === 'PENDING') && (
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: 12, color: 'var(--rose-600)' }}
                        onClick={() => updateStatus(o.id, 'CANCELLED')}
                      >
                        Cancel
                      </button>
                    )}
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
