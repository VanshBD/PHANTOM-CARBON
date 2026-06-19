import type { Metadata } from 'next';
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
  openGraph: {
    type: 'website',
    title: 'Phantom Carbon — Invisible Carbon Intelligence',
    description: '71% of your carbon footprint is invisible. We make it visible.',
    siteName: 'Phantom Carbon',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable}`} style={{ backgroundColor: '#0a0e1a' }}>
      <body
        className={`${inter.className} min-h-screen antialiased`}
        style={{ backgroundColor: '#0a0e1a', color: '#f1f5f9' }}
      >
        {children}
      </body>
    </html>
  );
}
