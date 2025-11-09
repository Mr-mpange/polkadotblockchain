import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'API Test - Polkadot Analytics',
  description: 'Test page for API connections',
};

export default function TestLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto">
            <h1 className="text-xl font-bold">Polkadot Analytics - API Test</h1>
          </div>
        </nav>
        <main className="container mx-auto p-4">
          {children}
        </main>
        <footer className="bg-gray-100 p-4 mt-8">
          <div className="container mx-auto text-center text-gray-600 text-sm">
            <p>Backend: http://localhost:3001</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
