const ICON_PATHS: Record<string, string> = {
  leaf:       'M20 4c-9 0-15 5-15 13a7 7 0 0 0 7 7c8 0 13-7 13-15V4h-5Zm-2 4-9 9',
  home:       'M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1v-9Z',
  box:        'M3 7.5 12 3l9 4.5v9L12 21 3 16.5v-9Zm0 0 9 4.5m0 0 9-4.5M12 12v9',
  cart:       'M3 4h2l2.4 11.5a2 2 0 0 0 2 1.5h8.4a2 2 0 0 0 2-1.5L21 8H6m3 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  bell:       'M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8Zm4 12a2 2 0 0 0 4 0',
  search:     'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-4.3-4.3',
  plus:       'M12 5v14M5 12h14',
  settings:   'M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm8.5 2.5c0 .5 0 1-.1 1.5l2 1.5-2 3.4-2.4-.9c-.7.6-1.6 1-2.5 1.3L15 21h-4l-.5-2.2c-.9-.3-1.7-.7-2.5-1.3L5.6 18.4l-2-3.4 2-1.5c-.1-.5-.1-1-.1-1.5s0-1 .1-1.5l-2-1.5 2-3.4 2.4.9c.7-.6 1.6-1 2.5-1.3L11 3h4l.5 2.2c.9.3 1.7.7 2.5 1.3l2.4-.9 2 3.4-2 1.5c.1.5.1 1 .1 1.5Z',
  edit:       'M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Zm10-13 3 3',
  trash:      'M5 7h14M10 7V4h4v3m-7 0 1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13',
  more:       'M6 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm7 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm7 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z',
  arrowLeft:  'M19 12H5m5-5-5 5 5 5',
  check:      'M5 12.5 10 17 19 7',
  close:      'M6 6l12 12M18 6 6 18',
  upload:     'M12 16V4m0 0-5 5m5-5 5 5M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2',
  image:      'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm0 11 5-5 4 4 3-3 5 5M10 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z',
  coin:       'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v10m3-7c-1-1-2-1-3-1s-3 .5-3 2 2 2 3 2 3 .5 3 2-2 2-3 2-2 0-3-1',
  sparkles:   'M12 3v6m0 6v6m-9-9h6m6 0h6M6 6l3 3m6 6 3 3M6 18l3-3m6-6 3-3',
  pkg:        'M12 3 3 7.5v9L12 21l9-4.5v-9L12 3Zm0 0v9m0 0L3 7.5M12 12l9-4.5',
  truck:      'M3 7h11v9H3V7Zm11 3h4l3 3v3h-7v-6ZM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  pin:        'M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13Zm0-11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  user:       'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 0 1 16 0',
  filter:     'M3 5h18M6 12h12M10 19h4',
  download:   'M12 4v12m0 0-5-5m5 5 5-5M4 20h16',
  cal:        'M3 7h18M5 5v4m14-4v4M5 7h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z',
  shield:     'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z',
  star:       'm12 3 2.7 6 6.3.5-4.8 4.3 1.5 6.2L12 16.8 6.3 20l1.5-6.2L3 9.5l6.3-.5L12 3Z',
  copy:       'M9 9V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-4M5 21h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z',
  layers:     'M12 3 3 8l9 5 9-5-9-5Zm-9 9 9 5 9-5m-18 4 9 5 9-5',
  zap:        'M13 3 4 14h6l-1 7 9-11h-6l1-7Z',
  eye:        'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  eyeOff:     'M3 3l18 18M9.9 5.1A10.4 10.4 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.3 4M6.6 6.6A17 17 0 0 0 2 12s4 7 10 7a10.4 10.4 0 0 0 4.4-1M9.9 9.9a3 3 0 0 0 4.2 4.2',
  google:     'M12 11v3.5h5a5 5 0 1 1-1.5-5.3l2.5-2.5A8.5 8.5 0 1 0 20.5 13H12Z',
  apple:      'M16 8a4 4 0 0 0-4 4 4 4 0 0 0-4-4c-2 0-4 1.5-4 4.5C4 16 8 21 12 21s8-5 8-8.5C20 9.5 18 8 16 8Zm-4 3a3 3 0 0 0 3-3 3 3 0 0 0-3 3Z',
}

const ICON_FILL: Record<string, boolean> = { star: true }

interface IconProps {
  name: string
  size?: number
  color?: string
  strokeWidth?: number
  className?: string
  style?: React.CSSProperties
}

export function Icon({ name, size = 18, color, strokeWidth = 1.7, className = '', style }: IconProps) {
  const d = ICON_PATHS[name]
  if (!d) return null
  const fill = ICON_FILL[name]
  return (
    <svg
      className={`ic ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? (color ?? 'currentColor') : 'none'}
      stroke={fill ? 'none' : (color ?? 'currentColor')}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}
