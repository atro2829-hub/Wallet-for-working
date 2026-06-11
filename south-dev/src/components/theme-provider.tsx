'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useEffect } from 'react';
import { useDevStore } from '@/lib/store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="south-dev-theme"
      disableTransitionOnChange
    >
      <ThemeSync>{children}</ThemeSync>
    </NextThemesProvider>
  );
}

function ThemeSync({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useDevStore();

  useEffect(() => {
    const stored = localStorage.getItem('south-dev-theme');
    if (stored) {
      const parsed = stored.replace(/"/g, '');
      if (parsed === 'dark' || parsed === 'light') {
        setTheme(parsed);
      }
    }
  }, [setTheme]);

  return <>{children}</>;
}
