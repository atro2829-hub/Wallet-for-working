import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "مركز النسخ - QTBM DEV",
  description: "مركز إدارة نسخ تطبيقات المحفظة",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F2F2F7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
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
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              const theme = localStorage.getItem('south-dev-theme');
              if (theme === '"dark"' || theme === 'dark') {
                document.documentElement.classList.add('dark');
                document.documentElement.style.backgroundColor = '#000000';
              }
            } catch(e) {}
          `,
        }} />
      </head>
      <body
        className="antialiased font-sans ios-bg"
        style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Arabic', 'Segoe UI', 'Noto Sans Arabic', Roboto, Helvetica, Arial, sans-serif",
          overscrollBehavior: 'none',
          WebkitTapHighlightColor: 'transparent',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
