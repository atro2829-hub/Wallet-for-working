import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "الحبيلين اونلاين - محفظتك الرقمية",
  description: "الحبيلين اونلاين - الدفع والتحويل وإدارة الأموال لليمنيين",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "الحبيلين اونلاين",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F5F5" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0F0F" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=yes" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body
        className="antialiased font-sans"
        style={{
          fontFamily: "'Segoe UI', Tahoma, 'Noto Sans Arabic', 'Arial', sans-serif",
          background: '#F5F5F5',
          overscrollBehavior: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
