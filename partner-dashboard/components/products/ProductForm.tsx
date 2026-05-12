'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { Icon } from '@/components/ui/Icon'
import { Segmented } from '@/components/ui/Segmented'
import { api } from '@/lib/api'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Category { id: string; slug: string; label: string }

interface ApiImage {
  id: string
  url: string
  isCover: boolean
  sortOrder: number
}

interface ListingInit {
  id?: string
  categoryId?: string
  title?: string
  description?: string
  whyEco?: string
  type?: string
  payment?: string
  moneyPrice?: number | null
  pointsPrice?: number | null
  stock?: number | null
  location?: string
  status?: string
  images?: ApiImage[]
}

interface ProductFormProps {
  initial?: ListingInit
  mode: 'new' | 'edit'
}

type PayType = 'MONEY_ONLY' | 'FLEXIBLE'

// Images that are newly selected by the partner (not yet uploaded)
interface PendingImage {
  file: File
  preview: string  // object URL for immediate display
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProductForm({ initial, mode }: ProductFormProps) {
  const router  = useRouter()
  const fileRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  // Text fields
  const [categories, setCategories] = useState<Category[]>([])
  const [title,    setTitle]    = useState(initial?.title       ?? '')
  const [desc,     setDesc]     = useState(initial?.description ?? '')
  const [whyEco,   setWhyEco]   = useState(initial?.whyEco      ?? '')
  const [kind,     setKind]     = useState<'PRODUCT' | 'SERVICE'>(
    (initial?.type as 'PRODUCT' | 'SERVICE') ?? 'PRODUCT'
  )
  const [pay,      setPay]      = useState<PayType>((initial?.payment as PayType) ?? 'FLEXIBLE')
  const [catId,    setCatId]    = useState(initial?.categoryId  ?? '')
  const [location, setLocation] = useState(initial?.location    ?? '')

  // Numeric fields stored as strings to allow empty / correct editing behaviour
  const [moneyStr,  setMoneyStr]  = useState<string>(
    initial?.moneyPrice != null && Number(initial.moneyPrice) > 0 ? String(initial.moneyPrice) : ''
  )
  const [pointsStr, setPointsStr] = useState<string>(
    initial?.pointsPrice != null && Number(initial.pointsPrice) > 0 ? String(initial.pointsPrice) : ''
  )
  const [stockStr,  setStockStr]  = useState<string>(
    initial?.stock != null ? String(initial.stock) : ''
  )

  // Image state
  const [existingImages] = useState<ApiImage[]>(
    (initial?.images ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder)
  )
  const [pendingImages,  setPendingImages]  = useState<PendingImage[]>([])
  const [deletedIds,     setDeletedIds]     = useState<Set<string>>(new Set())

  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // Fetch categories once
  useEffect(() => {
    api.get<ApiImage[] | Category[] | { categories?: Category[] }>('/api/marketplace/categories')
      .then((r) => {
        const cats = Array.isArray(r) ? r as Category[]
          : (r as { categories?: Category[] }).categories ?? []
        setCategories(cats)
        if (!catId && cats.length > 0) setCatId(cats[0].id)
      })
      .catch(console.error)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Image helpers ────────────────────────────────────────────────────────

  // Combined view: existing (not deleted) + pending
  const visibleExisting = existingImages.filter((img) => !deletedIds.has(img.id))
  const totalImages     = visibleExisting.length + pendingImages.length
  const MAX_IMAGES      = 3

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, slot: number) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset input so same file can be re-selected after removal
    e.target.value = ''

    const preview = URL.createObjectURL(file)
    setPendingImages((prev) => {
      const next = [...prev]
      // Replace if a pending image already occupies this pending slot
      const pendingSlot = slot - visibleExisting.length
      if (pendingSlot >= 0 && pendingSlot < next.length) {
        URL.revokeObjectURL(next[pendingSlot].preview)
        next[pendingSlot] = { file, preview }
      } else {
        next.push({ file, preview })
      }
      return next
    })
  }

  const removeExisting = (id: string) => {
    setDeletedIds((prev) => new Set([...prev, id]))
  }

  const removePending = (index: number) => {
    setPendingImages((prev) => {
      const next = [...prev]
      URL.revokeObjectURL(next[index].preview)
      next.splice(index, 1)
      return next
    })
  }

  // ── Numeric input helpers ────────────────────────────────────────────────

  const numericProps = (
    value: string,
    onChange: (v: string) => void,
    allowDecimals = false
  ) => ({
    type: 'text',
    inputMode: 'decimal' as const,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      // Allow empty, digits, and optionally a single decimal point
      const pattern = allowDecimals ? /^(\d+\.?\d*)?$/ : /^\d*$/
      if (pattern.test(raw)) onChange(raw)
    },
  })

  // ── Build & save ─────────────────────────────────────────────────────────

  const buildBody = (status: 'DRAFT' | 'ACTIVE') => {
    const moneyVal  = parseFloat(moneyStr)  || 0
    const pointsVal = parseInt(pointsStr)   || 0
    const stockVal  = parseInt(stockStr)
    return {
      categoryId:  catId,
      title,
      description: desc     || undefined,
      whyEco:      whyEco   || undefined,
      type:        kind,
      payment:     pay,
      moneyPrice:  moneyVal  > 0 ? moneyVal  : undefined,
      pointsPrice: pay === 'FLEXIBLE' && pointsVal > 0 ? pointsVal : undefined,
      stock:       !isNaN(stockVal) && stockVal >= 0 ? stockVal : undefined,
      location:    location || undefined,
      status,
    }
  }

  const validate = (status: 'DRAFT' | 'ACTIVE'): string | null => {
    if (!title.trim()) return 'Name is required'
    if (!catId)        return 'Category is required'
    if (status === 'ACTIVE') {
      const moneyVal  = parseFloat(moneyStr)  || 0
      const pointsVal = parseInt(pointsStr)   || 0
      if (moneyVal <= 0) return 'Money price must be greater than 0 to publish'
      if (pay === 'FLEXIBLE' && pointsVal <= 0) return 'Points price must be greater than 0 to publish'
    }
    const stockVal = parseInt(stockStr)
    if (stockStr !== '' && (isNaN(stockVal) || stockVal < 0)) return 'Stock must be 0 or greater'
    return null
  }

  const save = async (status: 'DRAFT' | 'ACTIVE') => {
    const err = validate(status)
    if (err) { setError(err); return }
    setError(null)
    setSaving(true)

    try {
      let listingId = initial?.id

      if (mode === 'new') {
        const created = await api.post<{ id: string }>('/api/partner/listings', buildBody(status))
        listingId = created.id
      } else {
        await api.put(`/api/partner/listings/${listingId}`, buildBody(status))
      }

      // Delete removed images
      for (const id of deletedIds) {
        try {
          await api.delete(`/api/partner/listings/${listingId}/images/${id}`)
        } catch { /* best effort */ }
      }

      // Upload new images
      for (let i = 0; i < pendingImages.length; i++) {
        const fd = new FormData()
        fd.append('image', pendingImages[i].file)
        // First image is cover if there are no existing images left
        const isCover = visibleExisting.length === 0 && i === 0
        fd.append('isCover', String(isCover))
        try {
          await api.upload(`/api/partner/listings/${listingId}/images`, fd)
        } catch { /* best effort — don't block redirect */ }
      }

      router.push('/products')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <Topbar
        title={mode === 'new' ? 'Add product / service' : 'Edit listing'}
        sub={mode === 'new' ? 'Create a new marketplace listing.' : initial?.title}
        actions={
          <>
            <Link href="/products" className="btn btn-ghost">
              <Icon name="arrowLeft" size={14} /> Back
            </Link>
            <button className="btn btn-secondary" disabled={saving} onClick={() => save('DRAFT')}>
              Save draft
            </button>
            <button className="btn btn-primary" disabled={saving} onClick={() => save('ACTIVE')}>
              <Icon name="check" size={14} strokeWidth={2.4} />
              {saving ? 'Saving…' : 'Publish'}
            </button>
          </>
        }
      />
      <div className="content" style={{ maxWidth: 760 }}>
        <div className="v-stack">

          {error && (
            <div style={{ color: 'var(--rose-600)', fontSize: 13, padding: '10px 14px', background: 'var(--rose-50)', borderRadius: 8 }}>
              {error}
            </div>
          )}

          {/* ── Basics ── */}
          <div className="card">
            <div className="card-head"><div className="card-title">Basics</div></div>
            <div className="v-stack">
              <div className="field">
                <label className="label">Name <span className="req">*</span></label>
                <input
                  className="input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Refurbished City Bike"
                />
              </div>
              <div className="field">
                <label className="label">Description</label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Describe your product or service…"
                />
              </div>
              <div className="row-2">
                <div className="field">
                  <label className="label">Type <span className="req">*</span></label>
                  <Segmented
                    value={kind}
                    onChange={(v) => setKind(v as 'PRODUCT' | 'SERVICE')}
                    options={[{ value: 'PRODUCT', label: 'Product' }, { value: 'SERVICE', label: 'Service' }]}
                  />
                </div>
                <div className="field">
                  <label className="label">Category <span className="req">*</span></label>
                  <select className="select" value={catId} onChange={(e) => setCatId(e.target.value)}>
                    <option value="">Select category…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── Images ── */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Images</div>
              <span className="muted" style={{ fontSize: 12 }}>
                {totalImages}/{MAX_IMAGES} · First image is the cover
              </span>
            </div>

            <div className="upload-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {Array.from({ length: MAX_IMAGES }).map((_, slotIdx) => {
                const existingImg = visibleExisting[slotIdx]
                const pendingImg  = pendingImages[slotIdx - visibleExisting.length]
                const isCoverSlot = slotIdx === 0

                if (existingImg) {
                  // Show uploaded image with remove button
                  return (
                    <div key={existingImg.id} className="upload-tile filled" style={{ padding: 0, overflow: 'hidden' }}>
                      <Image
                        src={existingImg.url}
                        alt="listing image"
                        fill
                        style={{ objectFit: 'cover' }}
                        unoptimized
                      />
                      {isCoverSlot && <span className="cover-badge" style={{ position: 'absolute', top: 6, left: 6, zIndex: 2 }}>Cover</span>}
                      <button
                        type="button"
                        onClick={() => removeExisting(existingImg.id)}
                        style={{
                          position: 'absolute', top: 6, right: 6, zIndex: 2,
                          width: 24, height: 24, borderRadius: '50%',
                          background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        aria-label="Remove image"
                      >
                        <Icon name="x" size={12} color="white" />
                      </button>
                    </div>
                  )
                }

                if (pendingImg) {
                  const pendingIdx = slotIdx - visibleExisting.length
                  return (
                    <div key={`pending-${slotIdx}`} className="upload-tile filled" style={{ padding: 0, overflow: 'hidden' }}>
                      <Image src={pendingImg.preview} alt="preview" fill style={{ objectFit: 'cover' }} unoptimized />
                      {isCoverSlot && <span className="cover-badge" style={{ position: 'absolute', top: 6, left: 6, zIndex: 2 }}>Cover</span>}
                      <button
                        type="button"
                        onClick={() => removePending(pendingIdx)}
                        style={{
                          position: 'absolute', top: 6, right: 6, zIndex: 2,
                          width: 24, height: 24, borderRadius: '50%',
                          background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        aria-label="Remove image"
                      >
                        <Icon name="x" size={12} color="white" />
                      </button>
                    </div>
                  )
                }

                // Empty slot
                if (totalImages < MAX_IMAGES || slotIdx < totalImages) {
                  return (
                    <button
                      key={`empty-${slotIdx}`}
                      type="button"
                      className="upload-tile empty"
                      disabled={totalImages >= MAX_IMAGES}
                      onClick={() => fileRefs[slotIdx]?.current?.click()}
                    >
                      <Icon name="upload" size={20} />
                      <div style={{ marginTop: 6, fontSize: 12 }}>
                        {isCoverSlot ? 'Add cover image' : 'Upload image'}
                      </div>
                      {isCoverSlot && <span className="cover-badge" style={{ opacity: 0.6 }}>Cover</span>}
                      <input
                        ref={fileRefs[slotIdx]}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileChange(e, slotIdx)}
                      />
                    </button>
                  )
                }

                return null
              })}
            </div>

            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
              Accepted formats: JPG, PNG, WebP · Max 5 MB per image
            </div>
          </div>

          {/* ── Payment & price ── */}
          <div className="card">
            <div className="card-head"><div className="card-title">Payment & price</div></div>
            <div className="choice-row" style={{ marginBottom: 18 }}>
              {([
                { v: 'MONEY_ONLY', ttl: 'Money only',  sub: 'Customer pays in euros only'    },
                { v: 'FLEXIBLE',   ttl: 'Flexible',    sub: 'Customer chooses points + € mix' },
              ] as { v: PayType; ttl: string; sub: string }[]).map((c) => (
                <button
                  key={c.v}
                  type="button"
                  className={`choice ${pay === c.v ? 'on' : ''}`}
                  onClick={() => setPay(c.v)}
                >
                  <div className="ttl">{c.ttl}</div>
                  <div className="sub">{c.sub}</div>
                </button>
              ))}
            </div>

            <div className="row-3">
              <div className="field">
                <label className="label">Money price <span className="req">*</span></label>
                <div className="input-with-icon">
                  <input
                    className="input"
                    placeholder="0.00"
                    {...numericProps(moneyStr, setMoneyStr, true)}
                  />
                  <span className="input-suffix">EUR</span>
                </div>
              </div>

              <div className="field" style={{ opacity: pay === 'FLEXIBLE' ? 1 : 0.4 }}>
                <label className="label">
                  Points price {pay === 'FLEXIBLE' && <span className="req">*</span>}
                </label>
                <div className="input-with-icon">
                  <input
                    className="input"
                    placeholder="0"
                    disabled={pay !== 'FLEXIBLE'}
                    {...numericProps(pointsStr, setPointsStr, false)}
                  />
                  <span className="input-suffix">PTS</span>
                </div>
                {pay === 'FLEXIBLE' && (
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
                    Full cost when paying with points only
                  </div>
                )}
              </div>

              <div className="field">
                <label className="label">Stock</label>
                <input
                  className="input"
                  placeholder="Unlimited"
                  {...numericProps(stockStr, setStockStr, false)}
                />
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
                  Leave blank for unlimited
                </div>
              </div>
            </div>

            {pay === 'FLEXIBLE' && parseFloat(moneyStr) > 0 && parseInt(pointsStr) > 0 && (
              <div style={{ fontSize: 12, color: 'var(--eco-700)', background: 'var(--eco-50)', borderRadius: 8, padding: '10px 14px', marginTop: 4 }}>
                Example: a customer with 50% of the points would pay{' '}
                {Math.floor(parseInt(pointsStr) / 2).toLocaleString()} pts + €{(parseFloat(moneyStr) / 2).toFixed(2)}
              </div>
            )}
          </div>

          {/* ── Eco & location ── */}
          <div className="card">
            <div className="card-head"><div className="card-title">Eco & location</div></div>
            <div className="field">
              <label className="label">Why is this eco-friendly?</label>
              <textarea
                className="textarea"
                rows={2}
                value={whyEco}
                onChange={(e) => setWhyEco(e.target.value)}
                placeholder="e.g. Each refurbished bike saves ~96 kg of CO₂ vs producing a new one."
              />
            </div>
            <div className="field" style={{ marginTop: 14 }}>
              <label className="label">Pickup location</label>
              <div className="input-with-icon">
                <Icon className="ic-l" name="pin" size={14} />
                <input
                  className="input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Skalitzer Str. 84, 10997 Berlin"
                />
              </div>
            </div>
          </div>

          <div className="h-stack" style={{ justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-secondary" disabled={saving} onClick={() => save('DRAFT')}>
              Save draft
            </button>
            <button type="button" className="btn btn-primary" disabled={saving} onClick={() => save('ACTIVE')}>
              <Icon name="check" size={14} strokeWidth={2.4} />
              {saving ? 'Saving…' : 'Publish'}
            </button>
          </div>

        </div>
      </div>
    </>
  )
}
