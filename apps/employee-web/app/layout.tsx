import type { Metadata } from 'next';
import { AuthProvider } from '../contexts/auth-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'Chez Noura - Employee Ordering',
  description: 'B2B Corporate Catering Platform - Employee Meal Ordering',
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
