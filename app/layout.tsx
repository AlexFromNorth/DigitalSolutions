import type { Metadata } from 'next';
import '@/shared/styles/globals.css';

export const metadata: Metadata = {
  title: 'Items List — 1M elements',
  description: 'Selection and sorting interface for 1,000,000 items',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
