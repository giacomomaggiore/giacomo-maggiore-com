import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // se cookie lang già presente → ok
  if (req.cookies.get('lang')) return res

  // altrimenti deduci da header
  const acceptLang = req.headers.get('accept-language') || ''
  const preferred = acceptLang.split(',')[0]?.split('-')[0] || 'it'

  // set cookie (it o en)
  res.cookies.set('lang', ['en', 'it'].includes(preferred) ? preferred : 'it')
  return res
}

export const config = {
  matcher: ['/blog/:path*']
}
