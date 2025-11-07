import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Polkadot Analytics Platform',
  description: 'Real-time insights into Polkadot parachains, TVL, transactions, and cross-chain flows.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Polkadot Analytics Platform',
    description: 'Real-time insights into Polkadot parachains, TVL, transactions, and cross-chain flows.',
    type: 'website',
    locale: 'en_US',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(preches-color-scheme: dark)', color: '#000000' },
  ],
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
