import type { Metadata } from 'next';
import { AuthProvider } from '../contexts/auth-context';
import { PageWrapper } from '../components/layouts/PageWrapper';
import { I18nProvider } from '../i18n';
import { HtmlLangWrapper } from '../components/html-lang-wrapper';
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
    <html lang="fr">
      <body className="bg-[#FAFAF9] min-h-screen">
        <I18nProvider>
          <HtmlLangWrapper>
            <AuthProvider>
              <PageWrapper>{children}</PageWrapper>
            </AuthProvider>
          </HtmlLangWrapper>
        </I18nProvider>
      </body>
    </html>
  );
}
