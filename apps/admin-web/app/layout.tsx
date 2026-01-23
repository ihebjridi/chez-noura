import type { Metadata } from 'next';
import { AuthProvider } from '../contexts/auth-context';
import { PageWrapper } from '../components/layouts/PageWrapper';
import './globals.css';

export const metadata: Metadata = {
  title: 'Chez Noura - Super Admin',
  description: 'B2B Corporate Catering Platform - Super Admin Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#FAFAF9] min-h-screen">
        <AuthProvider>
          <PageWrapper>{children}</PageWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
