import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const transactions = await db.transaction.findMany({
      where: {
        OR: [
          { fromUserId: userId },
          { toUserId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
