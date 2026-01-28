import type { Metadata } from 'next';
import { AuthProvider } from '../contexts/auth-context';
import { I18nProvider } from '../i18n';
import { HtmlLangWrapper } from '../components/html-lang-wrapper';
import './globals.css';

export const metadata: Metadata = {
  title: 'Chez Noura - Employee Ordering',
  description: 'B2B Corporate Catering Platform - Employee Meal Ordering',
  icons: {
    icon: '/chez-noura-logo.svg',
    shortcut: '/chez-noura-logo.svg',
    apple: '/chez-noura-logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <I18nProvider>
          <HtmlLangWrapper>
            <AuthProvider>{children}</AuthProvider>
          </HtmlLangWrapper>
        </I18nProvider>
      </body>
    </html>
  );
}
