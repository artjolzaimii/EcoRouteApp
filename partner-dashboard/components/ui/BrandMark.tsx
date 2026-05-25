import Image from 'next/image'

interface BrandMarkProps {
  size?: number
}

export function BrandMark({ size = 36 }: BrandMarkProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.34,
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        src="/ecoroute_logo.png"
        alt="EcoRoute logo"
        width={size}
        height={size}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        priority
      />
    </div>
  )
}
