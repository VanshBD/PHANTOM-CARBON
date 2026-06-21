import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Phantom Carbon — Invisible Carbon Intelligence',
    template: '%s | Phantom Carbon',
  },
  description:
    '71% of your carbon footprint is invisible. Phantom Carbon uses AI to detect surface, shadow, and ghost emissions from natural conversation and receipts.',
  keywords: ['carbon footprint', 'CO2', 'sustainability', 'AI', 'climate', 'emissions tracking'],
  authors: [{ name: 'Phantom Carbon Team' }],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    title: 'Phantom Carbon — Invisible Carbon Intelligence',
    description: '71% of your carbon footprint is invisible. We make it visible.',
    siteName: 'Phantom Carbon',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Phantom Carbon',
    description: '71% of your carbon footprint is invisible. We make it visible.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#0a0e1a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable}`} style={{ backgroundColor: '#0a0e1a' }}>
      <body
        className={`${inter.className} min-h-screen antialiased`}
        style={{ backgroundColor: '#0a0e1a', color: '#f1f5f9' }}
      >
        {/* Skip to main content — WCAG 2.1 AA requirement */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-green-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
