import { NextRequest, NextResponse } from 'next/server';

// POST /api/auth  — login with PIN
export async function POST(req: NextRequest) {
  const { pin } = await req.json();

  const correctPin = process.env.APP_PIN;
  const secret = process.env.AUTH_SECRET;

  if (!correctPin || !secret) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  if (pin !== correctPin) {
    return NextResponse.json({ error: 'PIN ไม่ถูกต้อง' }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set('app_auth', secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30, // 30 วัน
    path: '/',
  });
  return res;
}

// DELETE /api/auth  — logout
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete('app_auth');
  return res;
}
