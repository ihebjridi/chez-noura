import type { Metadata } from 'next';
import { AuthProvider } from '../contexts/auth-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'Chez Noura - Business Admin',
  description: 'B2B Corporate Catering Platform - Business Admin Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
