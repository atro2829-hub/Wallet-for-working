import { NextResponse } from 'next/server';
import { ref, set } from 'firebase/database';
import { database } from '@/lib/firebase';

export async function POST() {
  try {
    const banners = {
      'banner-1': {
        id: 'banner-1',
        title: 'شحن رصيدك الآن واحصل على مكافأة!',
        description: 'مكافأة تصل إلى 500 ر.ي عند كل شحن',
        imageUrl: '',
        isActive: true,
        order: 1,
        link: 'recharge',
        createdAt: new Date().toISOString(),
      },
      'banner-2': {
        id: 'banner-2',
        title: 'عرض حصري على شدات ببجي',
        description: 'خصم 15% على جميع شدات ببجي - لفترة محدودة',
        imageUrl: '',
        isActive: true,
        order: 2,
        link: '',
        createdAt: new Date().toISOString(),
      },
      'banner-3': {
        id: 'banner-3',
        title: 'أول تحويل مجاني',
        description: 'استمتع بتحويل مجاني عند التسجيل لأول مرة',
        imageUrl: '',
        isActive: true,
        order: 3,
        link: '',
        createdAt: new Date().toISOString(),
      },
      'banner-4': {
        id: 'banner-4',
        title: 'بطاقات جوجل بلاي بأسعار منافسة',
        description: 'احصل على بطاقات جوجل بلاي بأفضل سعر في اليمن',
        imageUrl: '',
        isActive: true,
        order: 4,
        link: '',
        createdAt: new Date().toISOString(),
      },
    };

    for (const [key, banner] of Object.entries(banners)) {
      await set(ref(database, `adminSettings/banners/${key}`), banner);
    }

    // Also seed exchange rates
    await set(ref(database, 'adminSettings/exchangeRates'), {
      YERtoSAR: 1/410,
      YERtoUSD: 1/1550,
      SARtoYER: 410,
      SARtoUSD: 410/1550,
      USDtoYER: 1550,
      USDtoSAR: 1550/410,
      commission: 2,
    });

    return NextResponse.json({ success: true, message: 'Banners and exchange rates seeded successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
