'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import { FaHome, FaExchangeAlt, FaPiggyBank, FaChartLine, FaFileInvoiceDollar, FaDonate, FaCog, FaTimes } from 'react-icons/fa'; // Importar FaTimes

type SidebarProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    console.log('Attempting to log out via AuthContext...');
    await signOut();
  };

  const getUserDisplayInfo = (user: User | null) => {
    if (!user) {
      return { initials: '', displayName: 'Invitado' };
    }
    const fullName = user.user_metadata?.full_name as string | undefined;
    const email = user.email as string | undefined;

    if (fullName && fullName.trim() !== '') {
      const parts = fullName.split(' ').filter(Boolean);
      const initials = parts.length > 1 
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : (parts[0][0]).toUpperCase();
      return { initials, displayName: fullName };
    } else if (email) {
      const initials = email[0].toUpperCase();
      return { initials, displayName: email };
    }
    return { initials: '?', displayName: 'Usuario Desconocido' };
  };

  const { initials, displayName } = getUserDisplayInfo(user);

  if (!user) {
    return (
        <div className="md:w-60 bg-gray-900 text-white p-5 flex-col fixed top-0 left-0 h-full justify-center items-center hidden md:flex">
            <p>Cargando...</p>
        </div>
    );
  }

  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`
        w-60 bg-gray-900 text-white p-5 flex flex-col h-full justify-between shadow-lg z-50
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 fixed top-0 left-0' : '-translate-x-full fixed top-0 left-0 '}
        md:translate-x-0 md:fixed md:top-0 md:left-0 md:h-screen md:flex
      `}>
        {/* Close button for mobile */}
        <button 
          onClick={() => setIsOpen(false)} 
          className="md:hidden absolute top-4 right-4 text-white hover:text-gray-300"
        >
          <FaTimes size={24} />
        </button>

        <div>
          <div className="text-center mb-8 mt-8 md:mt-0"> {/* Ajuste el margen superior para evitar colisión con el botón de cierre */}
              <Image src="/gatosintitulo.png" alt="AuditCash Logo" width={80} height={80} className="w-20 h-20 rounded-full mx-auto object-cover" loading="eager" />
              <h2 className="mt-2 text-xl font-semibold">AuditCash</h2>
          </div>
          <nav>
            <Link href="/" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 p-2.5 my-1 rounded-md transition-colors duration-200 hover:bg-gray-700 cursor-pointer ${pathname === '/' ? 'bg-gray-700 border-l-4 border-indigo-500' : ''}`}>
              <FaHome /> Inicio
            </Link>
            <Link href="/movements" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 p-2.5 my-1 rounded-md transition-colors duration-200 hover:bg-gray-700 cursor-pointer ${pathname === '/movements' ? 'bg-gray-700 border-l-4 border-indigo-500' : ''}`}>
              <FaExchangeAlt /> Movimientos
            </Link>

            
            <Link href="/savings" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 p-2.5 my-1 rounded-md transition-colors duration-200 hover:bg-gray-700 cursor-pointer ${pathname === '/savings' ? 'bg-gray-700 border-l-4 border-indigo-500' : ''}`}>                                                                                 
                        <FaPiggyBank /> Ahorros                                                                            
                      </Link>                                                                                              
                      <Link href="/analytics" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 p-2.5 my-1 rounded-md transition-colors duration-200 hover:bg-gray-700 cursor-pointer ${pathname === '/analytics' ? 'bg-gray-700 border-l-4 border-indigo-500' : ''}`}>                                                                                 
                        <FaChartLine /> Analítica                                                                          
                      </Link>                                                                                              
                      <Link href="/transfers" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 p-2.5 my-1 rounded-md transition-colors duration-200 hover:bg-gray-700 cursor-pointer ${pathname === '/transfers' ? 'bg-gray-700 border-l-4 border-indigo-500' : ''}`}>                                                                                 
                      <FaExchangeAlt className="rotate-90" /> Transferencias                                             
                    </Link>                                                                                             
                    <Link href="/loans" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 p-2.5 my-1 rounded-md transition-colors duration-200 hover:bg-gray-700 cursor-pointer ${pathname === '/loans' ? 'bg-gray-700 border-l-4 border-indigo-500' : ''}`}>                                                                                 
                      <FaFileInvoiceDollar /> Préstamos                                                                  
                    </Link>                                                                                              
                    <Link href="/budget" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 p-2.5 my-1 rounded-md transition-colors duration-200 hover:bg-gray-700 cursor-pointer ${pathname === '/budget' ? 'bg-gray-700 border-l-4 border-indigo-500' : ''}`}>                                                                                 
                      <FaDonate /> Presupuesto                                                                           
              </Link>

              <Link href="/settings" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 p-2.5 my-1 rounded-md transition-colors duration-200 hover:bg-gray-700 cursor-pointer ${pathname === '/settings' ? 'bg-gray-700 border-l-4 border-indigo-500' : ''}`}>
              <FaCog /> Configuración
            </Link>

            
          </nav>
        </div>
        
        <div className="text-center border-t border-gray-700 pt-4">
          <Link href="/settings" onClick={() => setIsOpen(false)} className="block cursor-pointer group">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-2 group-hover:bg-blue-500 transition-colors">
              {initials}
            </div>
            <p className="text-sm font-medium text-gray-300 break-words mb-2 group-hover:text-white transition-colors">
              {displayName}
            </p>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200 text-sm cursor-pointer mt-2"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
