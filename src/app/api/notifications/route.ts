import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
    
    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ notifications });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, notificationId, title, body: notifBody, type, createOnly } = body;

    // Create a new notification (for admin send notification feature)
    if (createOnly && userId && title && notifBody) {
      await db.notification.create({
        data: {
          userId,
          title,
          body: notifBody,
          type: type || 'info',
        },
      });
      return NextResponse.json({ message: 'تم إرسال الإشعار' });
    }

    // Mark as read
    if (notificationId) {
      await db.notification.update({ where: { id: notificationId }, data: { isRead: true } });
    } else if (userId) {
      await db.notification.updateMany({ where: { userId }, data: { isRead: true } });
    }
    return NextResponse.json({ message: 'تم تحديث الإشعارات' });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
