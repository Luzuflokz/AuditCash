'use client'; // Indicar que este es un Client Component

import dynamic from 'next/dynamic';
import { ToasterProps } from 'react-hot-toast'; // Importar ToasterProps para tipado

// Carga dinámica de Toaster con SSR desactivado
const DynamicToaster = dynamic(() => import('react-hot-toast').then(mod => mod.Toaster), { ssr: false });

interface ToastProviderProps {
  position?: ToasterProps['position'];
  children: React.ReactNode;
}

export default function ToastProvider({ children, position = 'top-right' }: ToastProviderProps) {
  return (
    <>
      <DynamicToaster position={position} />
      {children}
    </>
  );
}
