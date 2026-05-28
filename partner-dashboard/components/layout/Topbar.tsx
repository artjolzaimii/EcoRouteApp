
interface TopbarProps {
  title: string
  sub?: string
  actions?: React.ReactNode
}

export function Topbar({ title, sub, actions }: TopbarProps) {
  return (
    <div className="topbar">
      <div>
        <h1>{title}</h1>
        {sub && <div className="sub">{sub}</div>}
      </div>
      <div className="topbar-actions">
        {actions}
      </div>
    </div>
  )
}
