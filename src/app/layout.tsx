import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext'; // Importar AuthProvider

export const metadata = {
  title: "AuditCash",
  description: "Tu gestor de finanzas personales.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={GeistSans.className} style={{ backgroundColor: '#f0f2f5' }}>
        <AuthProvider> {/* Envolver con AuthProvider */}
          <Toaster position="top-right" />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}