import Script from 'next/script';
import { Inter, Literata, JetBrains_Mono } from 'next/font/google';

import type { Metadata, Viewport } from 'next';
import './globals.css';

const inter = Inter({
  variable: '--font-display',
  subsets: ['latin'],
});

const literata = Literata({
  variable: '--font-reading',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'FastRead - Speed Reading for Academic Articles',
  description:
    'Read academic articles faster with RSVP speed reading. Upload PDFs, manage citations, and sync across devices.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FastRead',
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <Script src="/polyfills.js" strategy="beforeInteractive" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body
        className={`${inter.variable} ${literata.variable} ${jetbrainsMono.variable} antialiased bg-background text-text-primary`}
      >
        {children}
      </body>
    </html>
  );
}
