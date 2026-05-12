import Image from 'next/image'
import { Icon } from './Icon'

interface ProductThumbProps {
  imageUrl?: string | null
  glyph?: string
  small?: boolean
}

export function ProductThumb({ imageUrl, glyph, small }: ProductThumbProps) {
  const size = small ? 56 : undefined

  if (imageUrl) {
    return (
      <div
        className="product-thumb"
        style={small ? { aspectRatio: 'auto', height: 56, width: 56, borderRadius: 12, overflow: 'hidden', position: 'relative' } : { position: 'relative', overflow: 'hidden' }}
      >
        <Image
          src={imageUrl}
          alt="product"
          fill={!small}
          width={small ? size : undefined}
          height={small ? size : undefined}
          style={{ objectFit: 'cover' }}
          unoptimized
        />
      </div>
    )
  }

  if (small) {
    return (
      <div
        className="product-thumb"
        style={{ aspectRatio: 'auto', height: 56, width: 56, borderRadius: 12 }}
      >
        <Icon name="image" size={20} color="var(--eco-700)" />
      </div>
    )
  }

  const patternId = `p-${(glyph ?? 'default').replace(/[^a-z0-9]/gi, '-')}`

  return (
    <div className="product-thumb">
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
        <defs>
          <pattern id={patternId} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(5,150,105,0.25)" strokeWidth="1.2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
      {glyph && <div className="glyph" style={{ position: 'relative' }}>{glyph}</div>}
    </div>
  )
}
