import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { LoadingProvider } from "@/contexts/LoadingContext";

export const metadata = {
  title: "Busca Bus",
  description: "Monitoramento de Linhas de Ônibus",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-br"
      className={`h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <LoadingProvider>{children}</LoadingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
