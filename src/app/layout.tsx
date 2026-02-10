import { GeistSans } from "geist/font/sans";
import "./globals.css";
// import { Toaster } from 'react-hot-toast'; // Se comenta la importación directa
import { AuthProvider } from '@/context/AuthContext'; // Importar AuthProvider
import ToastProvider from '@/components/ToastProvider'; // Importar el nuevo Client Component

export const metadata = {
  title: "AuditCash",
  description: "Tu gestor de finanzas personales.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body> {/* Remover GeistSans.className */}
        <AuthProvider> {/* Envolver con AuthProvider */}
          <ToastProvider> {/* Envolver con el nuevo ToastProvider */}
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}