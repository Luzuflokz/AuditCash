'use client'

import Image from 'next/image'; // Importar Image
import { createClient } from '@/lib/supabase/client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import * as es from '../../locales/es.json'
import toast, { Toaster } from 'react-hot-toast';
import { AuthError } from '@supabase/supabase-js';

export default function Login() {
  const supabase = createClient()

  // La redirección ahora es manejada por el AuthContext global.
  // Ya no necesitamos useEffect o useRouter aquí.

  const handleAuthError = (error: AuthError) => {
    console.error('Supabase Auth Error:', error);
    let errorMessage = 'Ocurrió un error desconocido durante la autenticación.';

    if (error.message === 'Invalid login credentials' || error.message === 'Invalid login credentials.') {
        errorMessage = 'Credenciales de inicio de sesión inválidas. Por favor, verifica tu correo y contraseña.';
    } else if (error.message.includes('User already registered') || error.message.includes('User already registered.')) {
        errorMessage = 'Este correo electrónico ya está registrado. Por favor, inicia sesión.';
    } else if (error.message.includes('Email not confirmed') || error.message.includes('Email not confirmed.')) {
        errorMessage = 'Tu correo electrónico no ha sido confirmado. Por favor, revisa tu bandeja de entrada.';
    } else if (error.message.includes('A user with this email address has already been registered')) {
        errorMessage = 'Ya existe un usuario con este correo electrónico. Por favor, inicia sesión o restablece tu contraseña.';
    } else if (error.message.includes('Email link is invalid or has expired')) {
        errorMessage = 'El enlace de correo electrónico es inválido o ha expirado. Intenta solicitar un nuevo enlace mágico.';
    }
    
    toast.error(errorMessage);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50"> {/* Fondo gris claro */}
      <Toaster />
      <div className="mb-8 text-center">
        <Image src="/gato.png" alt="Logo de la aplicación" width={100} height={100} className="mx-auto" />
        <h1 className="text-3xl font-bold text-gray-800 mt-4">Bienvenido a AuditCash</h1>
      </div>
      <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-lg space-y-4"> {/* Estilo de tarjeta */}
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              // Ajustes de color para alinearse con nuestro diseño (indigo)
              default: {
                colors: {
                  brand: 'hsl(235, 80%, 60%)', // Un tono más cercano al indigo
                  brandAccent: 'hsl(235, 80%, 40%)',
                  brandButtonText: 'white',
                  defaultButtonText: 'white', // Texto del botón por defecto (incluido Google)
                  defaultButtonBackground: '#4f46e5', // bg-indigo-600
                  defaultButtonBackgroundHover: '#4338ca', // hover:bg-indigo-700
                  inputBackground: 'white',
                  inputBorder: '#d1d5db', // gray-300
                  inputLabelText: '#374151', // gray-700
                  inputText: '#1f2937', // gray-900
                },
              },
            },
          }}
          theme="default" // Cambiar a default si queremos usar los colores de arriba
          providers={['google']}
          // redirectTo={`/auth/callback`} // El AuthContext se encarga de la redirección principal
          localization={{
            variables: es
          }}
          // onAuthStateChange ya no es necesario aquí
          onAuthError={handleAuthError}
        />
      </div>
    </div>
  )
}
