'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ProductForm } from '@/components/products/ProductForm'
import { api } from '@/lib/api'

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const [listing, setListing] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    api.get<Record<string, unknown>>(`/api/partner/listings/${id}`)
      .then(setListing)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="content" style={{ padding: 40 }}>Loading…</div>
  if (error)   return <div className="content" style={{ padding: 40, color: 'var(--rose-600)' }}>{error}</div>

  return <ProductForm mode="edit" initial={listing ?? undefined} />
}
