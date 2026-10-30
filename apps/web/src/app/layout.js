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

// Aplica as preferências de acessibilidade salvas antes da primeira pintura, para o tema não "piscar" no
// padrão a cada carga. Mesmo mapeamento do AccessibilityContext (que continua sendo a fonte da verdade).
const SCRIPT_PREFERENCIAS = `try{var p=JSON.parse(localStorage.getItem("accessibilityPreferences")||"{}"),r=document.documentElement;if(p.fontSize==="large"||p.fontSize==="xlarge")r.dataset.fonte=p.fontSize;if(p.contrastMode==="dark")r.dataset.contraste="escuro";else if(p.contrastMode==="light")r.dataset.contraste="claro"}catch(e){}`;

export const metadata = {
  title: "Busca Bus",
  description: "Monitoramento de Linhas de Ônibus",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${robotoMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_PREFERENCIAS }} />
      </head>
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