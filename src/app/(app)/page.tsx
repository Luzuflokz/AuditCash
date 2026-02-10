'use client'

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import type { User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import EditAccountModal from '@/components/EditAccountModal';
import AddAccountModal from '@/components/AddAccountModal';
import AddMovementModal from '@/components/AddMovementModal'; // Nuevo modal
import AddFixedExpenseModal from '@/components/AddFixedExpenseModal'; // Nuevo modal
import AddTransferModal from '@/components/AddTransferModal'; // Modal para transferencias
import ExpenseChart from '@/components/ExpenseChart';

import { FaMoneyBillWave, FaCreditCard, FaPaypal, FaUniversity, FaWallet, FaHandHoldingUsd, FaCoins, FaMobileAlt, FaSearchPlus, FaEye, FaEyeSlash, FaEdit, FaTrashAlt, FaPlus, FaTimes, FaExchangeAlt, FaFileInvoiceDollar } from 'react-icons/fa'; // Se añaden FaPlus, FaTimes y otros

type Account = {
  id: string;
  nombre: string;
  saldo_actual: number;
  color_hex: string;
};

type Movement = {
  id:string;
  fecha: string;
  categoria: string;
  tipo: 'ingreso' | 'gasto';
  monto: number;
  descripcion: string;
  cuenta_id: string;
  cuentas: { nombre: string }; // from join
};

// ... (Helper functions getColorForAccount, getIconComponentForAccount, predefinedAccountNames) remain the same

const getColorForAccount = (name: string): string => {
    const lowerCaseName = name.toLowerCase();
    if (lowerCaseName.includes('yape')) return '#8A2BE2';
    if (lowerCaseName.includes('bcp')) return '#FF7800';
    if (lowerCaseName.includes('interbank')) return '#007F4E';
    if (lowerCaseName.includes('bbva')) return '#004F87';
    if (lowerCaseName.includes('scotiabank')) return '#E2002B';
    if (lowerCaseName.includes('paypal')) return '#0070BA';
    if (lowerCaseName.includes('efectivo')) return '#6B7280';
    return '#4B5563';
};

const getIconComponentForAccount = (name: string) => {
    const lowerCaseName = name.toLowerCase();
    if (lowerCaseName.includes('yape')) return <FaMobileAlt size={60} />;
    if (lowerCaseName.includes('bcp') || lowerCaseName.includes('interbank') || lowerCaseName.includes('bbva') || lowerCaseName.includes('scotiabank')) return <FaUniversity size={60} />;
    if (lowerCaseName.includes('efectivo')) return <FaMoneyBillWave size={60} />;
    if (lowerCaseName.includes('paypal')) return <FaPaypal size={60} />;
    if (lowerCaseName.includes('crédito')) return <FaCreditCard size={60} />;
    if (lowerCaseName.includes('ahorros')) return <FaCoins size={60} />;
    if (lowerCaseName.includes('inversiones')) return <FaHandHoldingUsd size={60} />;
    return <FaWallet size={60} />;
};

const predefinedAccountNames = [
  "Yape", "Banco BCP", "Banco Interbank", "Banco BBVA", "Banco Scotiabank",
  "Efectivo", "PayPal", "Otro"
];

const INGRESOS_CATEGORIES = ['Salario', 'Inversiones', 'Regalo', 'Ventas', 'Otros Ingresos'];
const GASTOS_CATEGORIES = ['Alimentos', 'Transporte', 'Vivienda', 'Entretenimiento', 'Servicios', 'Ropa', 'Educación', 'Salud', 'Deudas', 'Otros Gastos'];

export default function HomePage() {
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth(); // Usar el AuthContext
  const router = useRouter(); // Hook para redirección
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [chartData, setChartData] = useState({ labels: [], values: [] });
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [latestMovements, setLatestMovements] = useState<Movement[]>([]);
  const [pageLoading, setPageLoading] = useState(true); // Estado de carga para los datos de la página
  const submissionLock = useRef(false);

  // Modal States
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isAddMovementModalOpen, setIsAddMovementModalOpen] = useState(false);
  const [isAddFixedExpenseModalOpen, setIsAddFixedExpenseModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // UI State
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [timeRange, setTimeRange] = useState<'30-days' | 'this-month' | '90-days'>('30-days');
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

  const fetchData = async (userId: string, range: '30-days' | 'this-month' | '90-days') => {
    setPageLoading(true);
    // Fetch accounts
    const { data: accountsData, error: accountsError } = await supabase.from('cuentas').select('*').eq('usuario_id', userId).order('created_at', { ascending: true });
    if (accountsError) toast.error('No se pudieron cargar las cuentas.');
    else setAccounts(accountsData || []);

    // Calcular la fecha de inicio según el rango seleccionado
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (range === 'this-month') {
        startDate.setDate(1);
    } else if (range === '90-days') {
        startDate.setDate(startDate.getDate() - 90);
    } else {
        startDate.setDate(startDate.getDate() - 30);
    }

    // Fetch movements for chart
    const { data: movementsData, error: movementsError } = await supabase
      .from('movimientos')
      .select('categoria, monto')
      .eq('usuario_id', userId)
      .eq('tipo', 'gasto')
      .gte('fecha', startDate.toISOString());

    if (movementsError) {
      toast.error("No se pudieron cargar los datos para el gráfico.");
    } else {
      const spendingByCategory = movementsData.reduce((acc: {[key: string]: number}, mov) => {
        acc[mov.categoria] = (acc[mov.categoria] || 0) + mov.monto;
        return acc;
      }, {});
      const labels = Object.keys(spendingByCategory);
      const values = Object.values(spendingByCategory);
      const total = values.reduce((sum, val) => sum + val, 0);
      
      setChartData({ labels, values });
      setTotalExpenses(total);
    }

    // Fetch latest movements
    const { data: latestMovData, error: latestMovError } = await supabase
        .from('movimientos')
        .select('*, cuentas(nombre)')
        .eq('usuario_id', userId)
        .order('fecha', { ascending: false })
        .limit(5);

    if (latestMovError) {
        toast.error("No se pudieron cargar los últimos movimientos.");
    } else {
        setLatestMovements(latestMovData as Movement[]);
    }
    setPageLoading(false);
  };

  useEffect(() => {
    if (user) {
        fetchData(user.id, timeRange);
    } else if (!authLoading) {
        // Solo redirigir si la autenticación ya terminó y el usuario es nulo.
        router.push('/login');
    }
  }, [user, authLoading, timeRange, router]);
  
  const handleAddAccount = async (name: string, initialBalance: number) => {
    if (!user || submissionLock.current) return;
    submissionLock.current = true;
    try {
      const color = getColorForAccount(name);
      const { error } = await supabase.from('cuentas').insert({ usuario_id: user.id, nombre: name, saldo_actual: initialBalance, color_hex: color });
      if (error) {
        if (error.code === '23505') toast.error('Ya existe una cuenta con ese nombre.'); else toast.error('Error al crear la cuenta.');
      } else {
        toast.success('¡Cuenta creada con éxito!'); await fetchData(user.id, timeRange); setIsAddAccountModalOpen(false);
      }
    } finally { submissionLock.current = false; }
  };
  
  const handleDeleteAccount = async (accountId: string) => {
    if (window.confirm('¿Estás seguro que quieres eliminar esta cuenta? Todos los movimientos asociados se eliminarán y esta acción es irreversible.')) {
        if (submissionLock.current) return;
        submissionLock.current = true;
        try {
          // Antes de eliminar la cuenta, considera eliminar movimientos asociados o manejar la referencia.
          // Para este ejemplo, simplemente eliminamos la cuenta.
          const { error } = await supabase.from('cuentas').delete().eq('id', accountId);
          if (error) toast.error('Error al eliminar la cuenta.');
          else {
            toast.success('Cuenta eliminada con éxito.'); 
            await fetchData(user.id, timeRange); // Re-fetch data after deletion
          }
        } finally { submissionLock.current = false; }
    }
  };

  const handleSaveChanges = async (id: string, name: string, balance: number) => {
    if (!user || submissionLock.current) return;
    submissionLock.current = true;
    try {
      const color = getColorForAccount(name);
      const { error } = await supabase.from('cuentas').update({ nombre: name, saldo_actual: balance, color_hex: color }).eq('id', id);
      if (error) toast.error('Error al guardar los cambios.');
      else {
        toast.success('Cambios guardados correctamente.'); 
        await fetchData(user.id, timeRange); 
        setEditingAccount(null);
      }
    } finally { submissionLock.current = false; }
  };

  const handleTransfer = async (fromAccountId: string, toAccountId: string, amount: number) => {
    if (!user || submissionLock.current) return;
    submissionLock.current = true;
    try {
      const { error } = await supabase.rpc('realizar_transferencia', {
        p_usuario_id: user.id,
        p_cuenta_origen_id: fromAccountId,
        p_cuenta_destino_id: toAccountId,
        p_monto: amount,
      });

      if (error) {
        toast.error('Error al realizar la transferencia.');
        console.error(error);
      } else {
        toast.success('¡Transferencia exitosa!');
        await fetchData(user.id, timeRange);
        setIsTransferModalOpen(false);
      }
    } finally {
      submissionLock.current = false;
    }
  };

  const totalBalance = accounts.reduce((sum, account) => sum + account.saldo_actual, 0);
  const existingAccountNames = new Set(accounts.map(acc => acc.nombre));
  const availableAccountNames = predefinedAccountNames.filter(name => !existingAccountNames.has(name) || name === 'Otro');

  if (authLoading || pageLoading) return (
    <div className="p-4 animate-pulse">
        <h1 className="h-8 bg-gray-300 rounded w-1/4 mb-8"></h1>
        
        {/* Skeleton para Tarjeta de Saldo Total */}
        <div className="relative h-32 bg-gray-300 rounded-2xl shadow-lg mb-8"></div>

        {/* Skeleton para Tarjeta de Gráfico de Gastos */}
        <div className="bg-gray-300 p-6 rounded-2xl shadow-lg mb-8 relative">
            <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
            <div className="flex justify-center gap-2 mb-4">
                <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
                <div className="h-8 w-20 bg-gray-200 rounded-full"></div>
                <div className="h-8 w-28 bg-gray-200 rounded-full"></div>
            </div>
            <div className="h-48 bg-gray-200 rounded-lg w-full max-w-sm mx-auto"></div>
        </div>

        {/* Skeleton para Sección de Cuentas */}
        <div className="flex justify-between items-center mb-4">
            <div className="h-6 bg-gray-300 rounded w-1/3"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => ( // Renderiza 3 skeletons de cuenta
                <div key={i} className="bg-gray-300 rounded-xl shadow-md p-4 h-32">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="flex gap-4">
                        <div className="h-5 w-16 bg-gray-200 rounded"></div>
                        <div className="h-5 w-16 bg-gray-200 rounded"></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  return (
    <>
      <EditAccountModal account={editingAccount} onClose={() => setEditingAccount(null)} onSave={handleSaveChanges} isSubmitting={submissionLock.current} />
      <AddAccountModal 
        isOpen={isAddAccountModalOpen} 
        isSubmitting={submissionLock.current} 
        onClose={() => setIsAddAccountModalOpen(false)} 
        onSave={handleAddAccount}
        availableNames={availableAccountNames}
      />
      <AddMovementModal
        isOpen={isAddMovementModalOpen}
        onClose={() => setIsAddMovementModalOpen(false)}
        onSave={() => { user && fetchData(user.id, timeRange); setIsAddMovementModalOpen(false); }}
        isSubmitting={submissionLock.current}
        accounts={accounts}
        incomeCategories={INGRESOS_CATEGORIES}
        expenseCategories={GASTOS_CATEGORIES}
      />
      <AddFixedExpenseModal
        isOpen={isAddFixedExpenseModalOpen}
        onClose={() => setIsAddFixedExpenseModalOpen(false)}
        onSave={() => { user && fetchData(user.id, timeRange); setIsAddFixedExpenseModalOpen(false); }}
        isSubmitting={submissionLock.current}
      />
      <AddTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSave={handleTransfer}
        isSubmitting={submissionLock.current}
        accounts={accounts}
      />

      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Inicio</h1>
        
        {/* Tarjeta de Saldo Total */}
        <div className="relative text-white p-6 rounded-2xl shadow-xl mb-8" style={{ background: 'linear-gradient(to right, #4f46e5, #7c3aed)'}}>
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-lg font-normal opacity-80">Saldo Total</h2>
                    <p className="text-4xl font-bold mt-2">
                        {isBalanceVisible ? new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(totalBalance) : 'S/ ****.**'}
                    </p>
                </div>
                <button onClick={() => setIsBalanceVisible(!isBalanceVisible)} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors cursor-pointer">
                    {isBalanceVisible ? <FaEyeSlash /> : <FaEye />}
                </button>
            </div>
        </div>

        
        {/* Sección de Cuentas */}
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Cuentas</h2>
            {/* Aquí podría ir un botón para ver todas, si la lista es muy larga */}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {accounts.map(account => (
            <div key={account.id} className="bg-white rounded-xl shadow-md p-4 flex flex-col justify-between border-l-4" style={{ borderColor: account.color_hex || '#6B7280' }}>
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold text-gray-800">{account.nombre}</p>
                        <p className="text-xl font-semibold text-gray-600 mt-1">{new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(account.saldo_actual)}</p>
                    </div>
                    <div className="text-gray-300 opacity-50">
                        {getIconComponentForAccount(account.nombre)}
                    </div>
                </div>
                <div className="flex items-center gap-4 mt-4">
                    <button onClick={() => setEditingAccount(account)} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors text-sm cursor-pointer">
                        <FaEdit /> Editar
                    </button>
                    <button onClick={() => handleDeleteAccount(account.id)} disabled={submissionLock.current} className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors text-sm cursor-pointer">
                        <FaTrashAlt /> Eliminar
                    </button>
                </div>
            </div>
          ))}
        </div>
        {accounts.length === 0 && <p className="text-center text-gray-500 mt-8">No has creado ninguna cuenta. ¡Añade una con el botón +!</p>}




        {/* Tarjeta de Gráfico de Gastos */}
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-8 relative">
            <Link href="/analytics" className="absolute top-4 right-4 text-gray-500 hover:text-indigo-600 transition-colors cursor-pointer">
                <FaSearchPlus size={20} />
            </Link>
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Estructura de Gastos</h2>
            <div className="flex justify-center gap-2 mb-4">
                <button 
                    onClick={() => setTimeRange('30-days')} 
                    className={`px-3 py-1 text-sm rounded-full cursor-pointer transition-colors ${
                        timeRange === '30-days' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    Últimos 30 días
                </button>
                <button 
                    onClick={() => setTimeRange('this-month')} 
                    className={`px-3 py-1 text-sm rounded-full cursor-pointer transition-colors ${
                        timeRange === 'this-month' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    Este Mes
                </button>
                <button 
                    onClick={() => setTimeRange('90-days')} 
                    className={`px-3 py-1 text-sm rounded-full cursor-pointer transition-colors ${
                        timeRange === '90-days' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    Últimos 90 días
                </button>
            </div>
            {chartData.values.length > 0 ? (
                <div className="w-full max-w-sm mx-auto">
                    <ExpenseChart data={chartData} />
                    <p className="text-center text-2xl font-bold text-gray-800 mt-4">Total: {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(totalExpenses)}</p>
                </div>
            ) : <p className="text-center text-gray-500 py-8">No hay datos de gastos para mostrar.</p>}
        </div>



      {/* Sección de Últimos Movimientos */}

      <h2 className="text-xl font-bold text-gray-800 mb-4">Últimos Movimientos</h2>
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
          {latestMovements.length > 0 ? (
              <div className="space-y-3">
                  {latestMovements.map(mov => (
                      <div key={mov.id} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                          <div>
                              <p className="font-semibold text-gray-800">{mov.categoria}</p>
                              <p className="text-xs text-gray-500">{mov.cuentas?.nombre} - {new Date(mov.fecha).toLocaleString('es-PE', { day:'2-digit', month:'2-digit', year:'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          <p className={`font-bold ${mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                              {mov.tipo === 'ingreso' ? '+' : '-'} {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(mov.monto)}
                          </p>
                      </div>
                  ))}
                  <Link href="/movements" className="block w-fit mx-auto text-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors cursor-pointer">
                    Ver más movimientos
                  </Link>
              </div>
          ) : (
              <p className="text-center text-gray-500 py-4">No hay movimientos recientes.</p>
          )}
      </div>
      </div>



      {/* Menú FAB */}
      {isFabMenuOpen && (
        <div className="fixed bottom-28 right-8 flex flex-col items-end space-y-3 z-40">
          <button
            onClick={() => { setIsAddFixedExpenseModalOpen(true); setIsFabMenuOpen(false); }}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-800 rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer text-sm"
          >
            <FaFileInvoiceDollar className="text-indigo-600" /> Añadir Gasto Fijo
          </button>
          <button
            onClick={() => { setIsAddMovementModalOpen(true); setIsFabMenuOpen(false); }}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-800 rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer text-sm"
          >
            <FaExchangeAlt className="text-indigo-600" /> Añadir Movimiento
          </button>
          <button
            onClick={() => { setIsTransferModalOpen(true); setIsFabMenuOpen(false); }}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-800 rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer text-sm"
          >
            <FaExchangeAlt className="text-indigo-600 rotate-90" /> Realizar Transferencia
          </button>
          <button
            onClick={() => { setIsAddAccountModalOpen(true); setIsFabMenuOpen(false); }}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-800 rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer text-sm"
          >
            <FaWallet className="text-indigo-600" /> Añadir Cuenta
          </button>
        </div>
      )}

      {/* Botón FAB Principal */}
      <button
        onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-indigo-600 text-white text-3xl shadow-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-110 flex justify-center items-center z-50 cursor-pointer"
      >
        {isFabMenuOpen ? <FaTimes /> : <FaPlus />}
      </button>
    </>
  );
}