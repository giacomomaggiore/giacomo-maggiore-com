import { ImageResponse } from 'next/og'

export function GET(request: Request) {
  const title = new URL(request.url).searchParams.get('title') || 'Giacomo Maggiore'
  if (title.length > 200) return new Response('Title is too long', { status: 400 })

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', height: '100%', padding: '72px 80px', background: '#fff', color: '#171717' }}>
        <div style={{ display: 'flex', fontSize: 26, fontWeight: 600 }}>Giacomo Maggiore</div>
        <div style={{ display: 'flex', fontSize: 64, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-2px' }}>{title}</div>
        <div style={{ display: 'flex', width: 80, height: 6, background: '#47a3f3' }} />
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
