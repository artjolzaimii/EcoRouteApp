'use client'

interface Option {
  value: string
  label: string
}

interface SegmentedProps {
  value: string
  onChange: (val: string) => void
  options: Option[]
}

export function Segmented({ value, onChange, options }: SegmentedProps) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={value === o.value ? 'active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
