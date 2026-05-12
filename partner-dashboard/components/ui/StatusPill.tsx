type StatusKind = 'active' | 'draft' | 'out' | 'archived' | 'eco' | 'blue' | 'amber' | 'rose'

interface StatusPillProps {
  kind: StatusKind
  label: string
}

export function StatusPill({ kind, label }: StatusPillProps) {
  return (
    <span className={`status ${kind}`}>
      <span className="dot" />
      {label}
    </span>
  )
}
