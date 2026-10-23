import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Sets the `lang` cookie (en | it) read by the blog pages; unsupported languages fall back to Italian
export function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // cookie already present: keep the visitor's language
  if (req.cookies.get('lang')) return res

  // otherwise guess the language from the browser header
  const acceptLang = req.headers.get('accept-language') || ''
  const preferred = acceptLang.split(',')[0]?.split('-')[0] || 'it'

  res.cookies.set('lang', ['en', 'it'].includes(preferred) ? preferred : 'it')
  return res
}

export const config = {
  matcher: ['/blog/:path*']
}
