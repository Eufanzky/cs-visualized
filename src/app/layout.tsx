import type { Metadata, Viewport } from 'next';
import {
  JetBrains_Mono,
  Space_Grotesk,
  Instrument_Serif,
} from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

/* ── Fonts ─────────────────────────────────────────────────────────── */

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
});

/* ── Metadata ───────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: {
    default: 'cs.visualized — Algorithm Animations',
    template: '%s · cs.visualized',
  },
  description:
    'Interactive visualizations of sorting algorithms, data structures, graph algorithms, and more. Built with pure canvas animations.',
  keywords: [
    'algorithm visualizer',
    'sorting algorithms',
    'data structures',
    'computer science',
    'animation',
    'bubble sort',
    'binary search',
    'graph algorithms',
  ],
  authors: [{ name: 'cs.visualized' }],
  openGraph: {
    title: 'cs.visualized — Algorithm Animations',
    description:
      'Interactive visualizations of CS algorithms with step-through controls.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  colorScheme: 'dark',
};

/* ── Root Layout ────────────────────────────────────────────────────── */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jetbrainsMono.variable} ${spaceGrotesk.variable} ${instrumentSerif.variable}`}
    >
      <body className="antialiased">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
