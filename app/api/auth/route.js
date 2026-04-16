import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { password } = await request.json()

    if (!password || password !== process.env.DASHBOARD_PASSWORD) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    // Store a base64-encoded token in a secure, HttpOnly cookie.
    // The middleware validates the same derived value.
    const token = Buffer.from(process.env.DASHBOARD_PASSWORD).toString('base64')

    const response = NextResponse.json({ success: true })
    response.cookies.set('dashboard_auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set('dashboard_auth', '', { maxAge: 0, path: '/' })
  return response
}
