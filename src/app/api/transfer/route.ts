import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateReference } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const { fromUserId, toPhone, amount, currency, description } = await req.json();
    
    if (!fromUserId || !toPhone || !amount || !currency) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'المبلغ غير صالح' }, { status: 400 });
    }

    const fromUser = await db.user.findUnique({ where: { id: fromUserId } });
    if (!fromUser) {
      return NextResponse.json({ error: 'المستخدم المرسل غير موجود' }, { status: 404 });
    }

    const toUser = await db.user.findUnique({ where: { phone: toPhone } });
    if (!toUser) {
      return NextResponse.json({ error: 'المستخدم المستلم غير موجود' }, { status: 404 });
    }

    if (fromUser.id === toUser.id) {
      return NextResponse.json({ error: 'لا يمكن التحويل لنفس الحساب' }, { status: 400 });
    }

    // Check balance
    const balanceField = `balance${currency}` as keyof typeof fromUser;
    const currentBalance = fromUser[balanceField] as number;
    if (currentBalance < amount) {
      return NextResponse.json({ error: 'رصيد غير كافي' }, { status: 400 });
    }

    // Create transaction
    const transaction = await db.transaction.create({
      data: {
        fromUserId: fromUser.id,
        toUserId: toUser.id,
        amount,
        currency,
        type: 'transfer',
        status: 'completed',
        description: description || `تحويل إلى ${toUser.name}`,
        reference: generateReference(),
      },
    });

    // Update balances
    await db.user.update({
      where: { id: fromUser.id },
      data: { [balanceField]: currentBalance - amount },
    });

    const toBalanceField = `balance${currency}` as keyof typeof toUser;
    const toCurrentBalance = toUser[toBalanceField] as number;
    await db.user.update({
      where: { id: toUser.id },
      data: { [toBalanceField]: toCurrentBalance + amount },
    });

    // Create notifications
    await db.notification.create({
      data: {
        userId: toUser.id,
        title: 'تحويل وارد',
        body: `تم استلام ${amount} ${currency} من ${fromUser.name}`,
        type: 'transaction',
      },
    });

    await db.notification.create({
      data: {
        userId: fromUser.id,
        title: 'تحويل صادر',
        body: `تم تحويل ${amount} ${currency} إلى ${toUser.name}`,
        type: 'transaction',
      },
    });

    return NextResponse.json({ transaction, message: 'تم التحويل بنجاح' });
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في التحويل' }, { status: 500 });
  }
}
