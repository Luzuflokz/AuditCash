'use client';

import { useState } from 'react';
import Sidebar from "@/components/Sidebar";
import { FaBars } from 'react-icons/fa'; // Importar icono de hamburguesa

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Estado para controlar la visibilidad en móvil

  return (
    <div className="flex min-h-screen">
      {/* Botón de hamburguesa visible solo en pantallas pequeñas */}
      <button 
        className="fixed top-4 left-4 z-50 md:hidden p-2 text-gray-800 bg-white rounded-md shadow-md"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <FaBars size={24} />
      </button>

      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="flex-1 p-5 transition-all duration-300 md:ml-60 min-h-screen">
        {children}
      </main>
    </div>
  );
}
