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

// Map notification type to Android notification channel
function getChannelForType(type: string): string {
  switch (type) {
    case 'transaction':
      return 'transfers';
    case 'security':
      return 'security';
    case 'promo':
      return 'promo';
    default:
      return 'general';
  }
}

// Map notification type to sound file (in res/raw)
function getSoundForType(type: string): string {
  switch (type) {
    case 'transaction':
      return 'transfer_sound';
    case 'security':
      return 'security_sound';
    case 'promo':
      return 'promo_sound';
    default:
      return 'notification_sound';
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
    const channelId = getChannelForType(type || 'info');
    const soundFile = getSoundForType(type || 'info');

    // Send multicast message to all tokens
    const message = {
      notification: {
        title,
        body: messageBody,
      },
      data: {
        type: type || 'info',
        title: title,
        body: messageBody,
        ...(data || {}),
        click_action: data?.url || '/',
      },
      android: {
        priority: 'high' as const,
        notification: {
          channelId: channelId,
          icon: '@drawable/ic_notification',
          color: '#E60000',
          sound: soundFile,
          tag: type || 'info',
          defaultSound: false,
          defaultVibrateTimings: false,
          vibrateTimingsMillis: type === 'transaction'
            ? [0, 100, 50, 100, 50, 100]
            : type === 'security'
            ? [0, 200, 100, 200, 100, 200]
            : [0, 100, 50, 100],
          visibility: 'private' as const,
          notificationPriority: 'PRIORITY_HIGH' as const,
          sticky: false,
          localOnly: false,
          ticker: messageBody,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            'thread-id': channelId,
          },
        },
      },
      webpush: {
        notification: {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          dir: 'rtl' as const,
          lang: 'ar',
          vibrate: type === 'transaction'
            ? [100, 50, 100, 50, 100]
            : type === 'security'
            ? [200, 100, 200, 100, 200]
            : [100, 50, 100],
          sound: '/sounds/notification.wav',
          requireInteraction: type === 'security',
          tag: `south-${type || 'info'}-${Date.now()}`,
        },
        fcm_options: {
          link: data?.url || '/',
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
