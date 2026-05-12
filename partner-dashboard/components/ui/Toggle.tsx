'use client'

interface ToggleProps {
  on: boolean
  onChange?: (val: boolean) => void
  label?: string
}

export function Toggle({ on, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      className={`toggle ${on ? 'on' : ''}`}
      onClick={() => onChange?.(!on)}
    >
      <span className="track"><span className="knob" /></span>
      {label && <span style={{ fontSize: 13, color: 'var(--gray-700)', fontWeight: 500 }}>{label}</span>}
    </button>
  )
}
