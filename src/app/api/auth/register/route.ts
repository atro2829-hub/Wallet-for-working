import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateUserId } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, phone, firebaseUid, userId: providedUserId } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 });
    }

    // Check if email already exists
    const existingEmail = await db.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ error: 'البريد الإلكتروني مسجل مسبقاً' }, { status: 409 });
    }

    // Generate unique userId (4-digit format)
    let userId = providedUserId || generateUserId();
    let attempts = 0;
    while (attempts < 10) {
      const existingUserId = await db.user.findUnique({ where: { userId } });
      if (!existingUserId) break;
      userId = generateUserId();
      attempts++;
    }

    const user = await db.user.create({
      data: {
        email,
        password, // In production, hash this with bcrypt
        phone: phone || '',
        name: name || email,
        userId,
        balanceYER: 0,
        balanceSAR: 0,
        balanceUSD: 0,
      },
    });

    return NextResponse.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        phone: user.phone,
        name: user.name, 
        role: user.role,
        userId: user.userId,
      },
      message: 'تم التسجيل بنجاح'
    });
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في التسجيل' }, { status: 500 });
  }
}
