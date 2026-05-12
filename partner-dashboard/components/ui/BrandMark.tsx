import { Icon } from './Icon'

interface BrandMarkProps {
  size?: number
}

export function BrandMark({ size = 36 }: BrandMarkProps) {
  return (
    <div
      className="brand-mark"
      style={{ width: size, height: size, borderRadius: size * 0.34 }}
    >
      <Icon name="leaf" size={size * 0.55} />
    </div>
  )
}
