import { Icon } from '../ui/Icon'

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
        <button className="icon-btn" title="Search">
          <Icon name="search" size={17} />
        </button>
        <button className="icon-btn" title="Notifications" style={{ position: 'relative' }}>
          <Icon name="bell" size={17} />
          <span style={{
            position: 'absolute', top: 8, right: 8,
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--rose-600)', border: '2px solid var(--white)',
          }} />
        </button>
        {actions}
      </div>
    </div>
  )
}
