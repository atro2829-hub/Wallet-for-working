import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'البريد الإلكتروني غير مسجل' }, { status: 404 });
    }

    if (user.password !== password) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
    }

    if (user.isBlocked) {
      return NextResponse.json({ error: `الحساب محظور: ${user.blockReason}` }, { status: 403 });
    }

    return NextResponse.json({ 
      user: {
        id: user.id, email: user.email, phone: user.phone, name: user.name, role: user.role,
        kycStatus: user.kycStatus, balanceYER: user.balanceYER,
        balanceSAR: user.balanceSAR, balanceUSD: user.balanceUSD,
        userId: user.userId, avatar: user.avatar, theme: user.theme,
        isBlocked: user.isBlocked, cardType: user.cardType,
        cardNumber: user.cardNumber, cardIssuedAt: user.cardIssuedAt,
        governorate: user.governorate,
      },
      message: 'تم تسجيل الدخول بنجاح'
    });
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في تسجيل الدخول' }, { status: 500 });
  }
}
