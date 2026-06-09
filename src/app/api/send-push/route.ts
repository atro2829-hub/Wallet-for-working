import { NextRequest, NextResponse } from 'next/server';

// Firebase Admin SDK for sending FCM push notifications
let adminApp: any = null;
let adminMessaging: any = null;

async function getAdminMessaging() {
  if (adminMessaging) return adminMessaging;

  try {
    const { initializeApp, cert, getApps } = await import('firebase-admin/app');
    const { getMessaging } = await import('firebase-admin/messaging');

    if (getApps().length === 0) {
      const serviceAccount = require('../../../../upload/southern-portfolio-firebase-adminsdk-fbsvc-46f601a3ba.json');
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        databaseURL: 'https://southern-portfolio-default-rtdb.firebaseio.com',
      });
    } else {
      adminApp = getApps()[0];
    }

    adminMessaging = getMessaging(adminApp);
    return adminMessaging;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokens, title, body: messageBody, type, data } = body;

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No FCM tokens provided' },
        { status: 400 }
      );
    }

    if (!title || !messageBody) {
      return NextResponse.json(
        { success: false, error: 'Title and body are required' },
        { status: 400 }
      );
    }

    const messaging = await getAdminMessaging();

    // Send multicast message to all tokens
    const message = {
      notification: {
        title,
        body: messageBody,
      },
      data: {
        type: type || 'info',
        ...(data || {}),
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        priority: 'high' as const,
        notification: {
          channelId: 'default',
          icon: '@drawable/ic_notification',
          color: '#E60000',
          sound: 'default',
          tag: type || 'info',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      tokens: tokens.filter(Boolean),
    };

    const response = await messaging.sendEachForMulticast(message);

    console.log(`FCM Push: ${response.successCount} success, ${response.failureCount} failed out of ${tokens.length} tokens`);

    // Log failed tokens for cleanup
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          console.warn(`FCM failed for token ${tokens[idx]}:`, resp.error);
        }
      });
    }

    return NextResponse.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (error: any) {
    console.error('FCM Push API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
