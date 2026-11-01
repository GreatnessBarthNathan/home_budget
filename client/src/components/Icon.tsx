import React from 'react'

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  const paths: Record<string, React.ReactNode> = {
    home: (
      <>
        <path d='m3 10 9-7 9 7' />
        <path d='M5 9v11h14V9M9 20v-6h6v6' />
      </>
    ),
    chart: (
      <>
        <path d='M4 19V5M4 19h17' />
        <path d='m7 15 4-4 3 2 6-7' />
      </>
    ),
    wallet: (
      <>
        <rect x='3' y='5' width='18' height='15' rx='2' />
        <path d='M3 9h18M16 14h2' />
        <path d='M6 5V3h12v2' />
      </>
    ),
    plus: (
      <>
        <path d='M12 5v14M5 12h14' />
      </>
    ),
    search: (
      <>
        <circle cx='10.8' cy='10.8' r='6.8' />
        <path d='m16 16 4 4' />
      </>
    ),
    arrow: (
      <>
        <path d='M7 17 17 7M7 7h10v10' />
      </>
    ),
    down: (
      <>
        <path d='m6 9 6 6 6-6' />
      </>
    ),
    calendar: (
      <>
        <rect x='3' y='5' width='18' height='16' rx='2' />
        <path d='M16 3v4M8 3v4M3 10h18' />
      </>
    ),
    logout: (
      <>
        <path d='M10 17l5-5-5-5M15 12H3' />
        <path d='M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7' />
      </>
    ),
    menu: (
      <>
        <path d='M4 6h16M4 12h16M4 18h16' />
      </>
    ),
    close: (
      <>
        <path d='m18 6-12 12M6 6l12 12' />
      </>
    ),
    receipt: (
      <>
        <path d='M5 3h14v18l-3-2-4 2-4-2-3 2zM8 8h8M8 12h8' />
      </>
    ),
    activity: (
      <>
        <circle cx='12' cy='12' r='9' />
        <path d='M12 7v5l3 2' />
      </>
    ),
  }
  return (
    <svg {...common} aria-hidden='true'>
      {paths[name] ?? paths.home}
    </svg>
  )
}
