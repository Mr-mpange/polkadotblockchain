import './globals.css'

export const metadata = {
  title: 'Polkadot Analytics Platform',
  description: 'Real-time insights into Polkadot parachains, TVL, transactions, and cross-chain flows.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
