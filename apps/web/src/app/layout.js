import "./globals.css";
import { Inter, Roboto_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';

// Fontes auto-hospedadas pelo Next (sem @import bloqueante do Google). As variáveis --fonte-* são
// consumidas no @theme do globals.css, que as expõe como `font-inter`, `font-roboto-mono` e `font-sans`.
const inter = Inter({ subsets: ["latin"], variable: "--fonte-inter", display: "swap" });
const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--fonte-roboto-mono",
  display: "swap",
});

export const metadata = {
  title: "Busca Bus",
  description: "Monitoramento de Linhas de Ônibus",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${robotoMono.variable} h-full antialiased text-normal`}>
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