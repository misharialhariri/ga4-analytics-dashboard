import { NextResponse } from 'next/server'

// Routes that are always public (no auth check)
const PUBLIC_PATHS = new Set(['/login', '/api/auth'])

export function proxy(request) {
  const { pathname } = request.nextUrl

  // Always allow static Next.js assets and public routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    PUBLIC_PATHS.has(pathname)
  ) {
    return NextResponse.next()
  }

  // Derive the expected token from the env var the same way the auth API sets it.
  // Using btoa (available in Edge Runtime) mirrors Buffer.from(...).toString('base64').
  const expected = btoa(process.env.DASHBOARD_PASSWORD ?? '')
  const authCookie = request.cookies.get('dashboard_auth')

  if (authCookie?.value === expected) {
    return NextResponse.next()
  }

  // Not authenticated — redirect to login, preserving the intended destination
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
}
