import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';

export const metadata = {
  title: "Busca Bus",
  description: "Monitoramento de Linhas de Ônibus",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="h-full antialiased text-normal">
      <body className="min-h-full flex flex-col">
        <AccessibilityProvider>
          <AuthProvider>
            <LoadingProvider>
              {children}
            </LoadingProvider>
          </AuthProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}