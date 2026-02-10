'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { FaArrowRight, FaMoneyBillWave, FaCreditCard, FaPaypal, FaUniversity, FaWallet, FaHandHoldingUsd, FaCoins, FaMobileAlt, FaTrash } from 'react-icons/fa'; // Import FaTrash
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import Link from 'next/link';

// --- Types ---
type Account = {
  id: string;
  nombre: string;
  saldo_actual: number;
  color_hex: string;
};

type Transfer = {
  id: string;
  fecha: string; // La fecha de creación/transacción ahora es 'fecha'
  monto: number;
  cuenta_origen: { nombre: string; color_hex: string };
  cuenta_destino: { nombre: string; color_hex: string };
};

const TRANSFERS_PER_PAGE = 10; // Constante para la paginación

// --- Helper Functions ---
const getIconComponentForAccount = (name: string) => {
    const lowerCaseName = name.toLowerCase();
    if (lowerCaseName.includes('yape')) return <FaMobileAlt size={80} />;
    if (lowerCaseName.includes('bcp') || lowerCaseName.includes('interbank') || lowerCaseName.includes('bbva') || lowerCaseName.includes('scotiabank')) return <FaUniversity size={80} />;
    if (lowerCaseName.includes('efectivo')) return <FaMoneyBillWave size={80} />;
    if (lowerCaseName.includes('paypal')) return <FaPaypal size={80} />;
    if (lowerCaseName.includes('crédito')) return <FaCreditCard size={80} />;
    if (lowerCaseName.includes('ahorros')) return <FaCoins size={80} />;
    if (lowerCaseName.includes('inversiones')) return <FaHandHoldingUsd size={80} />;
    return <FaWallet size={80} />;
};

export default function TransfersPage() {
  const supabase = createClient();
  const { user } = useAuth(); // Usar el AuthContext
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const submissionLock = useRef(false);

  // --- Form State ---
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');

  // --- Pagination State ---
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchTransfers = async (userId: string, pageNum: number) => {
    setLoading(true);
    const from = pageNum * TRANSFERS_PER_PAGE;
    const to = from + TRANSFERS_PER_PAGE - 1;

    const { data: transfersData, error: transfersError } = await supabase
      .from('transferencias')
      .select('*, cuenta_origen:cuentas!transferencias_cuenta_origen_id_fkey(nombre, color_hex), cuenta_destino:cuentas!transferencias_cuenta_destino_id_fkey(nombre, color_hex)') // 'fecha' ya se selecciona con '*'
      .eq('usuario_id', userId)
      .order('fecha', { ascending: false }) // Ordernar por 'fecha'
      .range(from, to);
      
    if (transfersError) {
      toast.error('No se pudieron cargar las transferencias.');
      console.error(transfersError);
    } else {
      setTransfers(transfersData as Transfer[]);
      setHasMore(transfersData.length === TRANSFERS_PER_PAGE);
    }
    setLoading(false);
  };

  const fetchAccounts = async (userId: string) => {
    const { data: accountsData, error: accountsError } = await supabase.from('cuentas').select('*').eq('usuario_id', userId);
    if (accountsError) {
      toast.error('No se pudieron cargar las cuentas.');
      console.error(accountsError);
    } else {
      setAccounts(accountsData || []);
      // Inicializar selectores si hay suficientes cuentas
      if ((accountsData || []).length >= 2) {
        if (!fromAccountId) setFromAccountId(accountsData[0].id);
        if (!toAccountId || toAccountId === accountsData[0].id) {
            const potentialToAcc = accountsData.find(acc => acc.id !== (accountsData[0].id));
            if (potentialToAcc) setToAccountId(potentialToAcc.id);
        }
      } else {
          setFromAccountId('');
          setToAccountId('');
      }
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([
        fetchAccounts(user.id),
        fetchTransfers(user.id, page)
      ]).finally(() => setLoading(false));
    }
  }, [user, page]); // Depende de user y page

  useEffect(() => {
    if (accounts.length >= 2 && fromAccountId && toAccountId === fromAccountId) {
        const potentialToAcc = accounts.find(acc => acc.id !== fromAccountId);
        if (potentialToAcc) setToAccountId(potentialToAcc.id);
        else setToAccountId('');
    }
  }, [fromAccountId, accounts]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || submissionLock.current) return;
    if (!fromAccountId || !toAccountId || amount === '' || amount <= 0) { toast.error('Completa todos los campos.'); return; }
    if (fromAccountId === toAccountId) { toast.error('Las cuentas no pueden ser la misma.'); return; }
    const fromAccount = accounts.find(acc => acc.id === fromAccountId);
    if (!fromAccount || fromAccount.saldo_actual < Number(amount)) { toast.error('Saldo insuficiente.'); return; }

    submissionLock.current = true;
    try {
        // Al insertar, usa la fecha actual para la columna 'fecha'
        const { error } = await supabase.from('transferencias').insert({ 
            usuario_id: user.id, 
            cuenta_origen_id: fromAccountId, 
            cuenta_destino_id: toAccountId, 
            monto: Number(amount),
            fecha: new Date().toISOString() // Asegura que 'fecha' tenga un valor
        });
        if (error) {
            toast.error('Error al realizar la transferencia.');
            console.error(error);
        } else {
            toast.success('¡Transferencia exitosa!');
            setAmount(''); // Limpiar el monto
            setPage(0); // Volver a la primera página para ver la nueva transferencia
            await Promise.all([
                fetchAccounts(user.id), // Refrescar saldos de cuentas
                fetchTransfers(user.id, 0) // Refrescar transferencias
            ]);
        }
    } finally {
        submissionLock.current = false;
    }
  };

  const handleDeleteTransfer = async (transferId: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta transferencia?')) {
      if (!user) return;
      const { error } = await supabase.from('transferencias').delete().eq('id', transferId);
      if (error) {
        toast.error('Error al eliminar la transferencia.');
        console.error(error);
      } else {
        toast.success('Transferencia eliminada con éxito.');
        setPage(0); // Volver a la primera página
        await Promise.all([
            fetchAccounts(user.id), // Refrescar saldos de cuentas
            fetchTransfers(user.id, 0) // Refrescar transferencias
        ]);
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0) {
      setPage(newPage);
      // El useEffect se encargará de llamar a fetchTransfers con la nueva página
    }
  };

  const selectedFromAccount = accounts.find(acc => acc.id === fromAccountId);
  const selectedToAccount = accounts.find(acc => acc.id === toAccountId);
  const numericAmount = Number(amount) || 0;

  if (loading) return (
    <div className="p-4 animate-pulse">
        <h1 className="h-8 bg-gray-300 rounded w-1/4 mb-8"></h1>
        
        {/* Skeleton para el formulario de Transferencia */}
        <div className="bg-gray-300 p-6 rounded-2xl shadow-lg mb-8 h-48">
            <div className="flex items-center justify-center gap-4 h-full">
                <div className="w-1/3 h-24 bg-gray-200 rounded-lg"></div>
                <div className="w-16 h-8 bg-gray-200 rounded-lg"></div>
                <div className="w-1/3 h-24 bg-gray-200 rounded-lg"></div>
            </div>
        </div>

        {/* Skeleton para Historial de Transferencias */}
        <div className="bg-gray-300 p-6 rounded-2xl shadow-lg h-64">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between items-center bg-gray-200 p-4 rounded-lg mb-2">
                    <div className="h-6 w-1/3 bg-gray-300 rounded"></div>
                    <div className="h-6 w-1/4 bg-gray-300 rounded"></div>
                </div>
            ))}
        </div>
    </div>
  );
  if (!user) return (
    <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-700">
        <p className="text-lg">Por favor, <Link href="/login" className="text-indigo-600 hover:underline">inicia sesión</Link> para ver tus transferencias.</p>
    </div>
  );

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Transferencias entre Cuentas</h1>

      {/* NEW Visual Transfer Form */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Nueva Transferencia</h2>
        <form onSubmit={handleTransfer}>
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                {/* From Account Card */}
                <div className="relative p-4 rounded-lg border bg-gray-50" style={{ borderColor: selectedFromAccount?.color_hex || '#d1d5db' }}>
                                    <div className="absolute inset-0 flex items-center justify-center opacity-50 pointer-events-none text-gray-400">
                                        {selectedFromAccount && getIconComponentForAccount(selectedFromAccount.nombre)}
                                    </div>                    <div className="relative z-10">
                        <label htmlFor="fromAccountSelect" className="block text-sm font-medium text-gray-700 mb-1">Desde:</label>
                        <select id="fromAccountSelect" value={fromAccountId} onChange={e => setFromAccountId(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.nombre}</option>)}
                        </select>
                        {selectedFromAccount && 
                            <div className="mt-2 text-sm text-gray-600">
                                <p>Saldo: {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(selectedFromAccount.saldo_actual)}</p>
                                <p className="font-semibold text-gray-800">Quedaría: {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(selectedFromAccount.saldo_actual - numericAmount)}</p>
                            </div>
                        }
                    </div>
                </div>

                {/* Amount and Arrow */}
                <div className="flex flex-col items-center justify-center gap-2">
                    <FaArrowRight size={24} className="text-gray-500" />
                    <input type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center" />
                </div>

                {/* To Account Card */}
                 <div className="relative p-4 rounded-lg border bg-gray-50" style={{ borderColor: selectedToAccount?.color_hex || '#d1d5db' }}>
                                    <div className="absolute inset-0 flex items-center justify-center opacity-50 pointer-events-none text-gray-400">
                                        {selectedToAccount && getIconComponentForAccount(selectedToAccount.nombre)}
                                    </div>                    <div className="relative z-10">
                        <label htmlFor="toAccountSelect" className="block text-sm font-medium text-gray-700 mb-1">Hacia:</label>
                        <select id="toAccountSelect" value={toAccountId} onChange={e => setToAccountId(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                            {accounts.filter(acc => acc.id !== fromAccountId).map(acc => <option key={acc.id} value={acc.id}>{acc.nombre}</option>)}
                        </select>
                        {selectedToAccount && 
                            <div className="mt-2 text-sm text-gray-600">
                                <p>Saldo: {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(selectedToAccount.saldo_actual)}</p>
                                <p className="font-semibold text-gray-800">Tendría: {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(selectedToAccount.saldo_actual + numericAmount)}</p>
                            </div>
                        }
                    </div>
                </div>
            </div>
            <button type="submit" disabled={submissionLock.current || accounts.length < 2} className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-4">
                {submissionLock.current ? 'Transfiriendo...' : 'Realizar Transferencia'}
            </button>
            {accounts.length < 2 && <p className="text-red-600 text-sm text-center mt-2">Necesitas al menos 2 cuentas para realizar una transferencia.</p>}
        </form>
      </div>

      {/* Recent Transfers History */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Historial de Transferencias</h2>
        <div className="space-y-4"> {/* Contenedor para las tarjetas de transferencia */}
        {transfers.length > 0 ? transfers.map(t => (
          <div key={t.id} className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border-l-4 mb-4" style={{ borderColor: t.cuenta_origen?.color_hex || '#6B7280' }}>
            <div className="flex flex-col items-center flex-1">
                <p className="font-bold text-gray-800">{t.cuenta_origen?.nombre || 'N/A'}</p>
                <p className="text-sm text-gray-600">Origen</p>
            </div>
            <div className="flex flex-col items-center mx-4 text-gray-500">
                <FaArrowRight size={20} />
                <p className="text-lg font-bold text-gray-800 mt-1">{new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(t.monto)}</p>
                <p className="text-xs text-gray-500 mt-1">
                    {t.fecha ? new Date(t.fecha).toLocaleString('es-PE', { day:'2-digit', month:'2-digit', year:'numeric', hour: '2-digit', minute: '2-digit' }) : 'Fecha no disponible'}
                </p>
            </div>
            <div className="flex flex-col items-center flex-1 text-right">
                <p className="font-bold text-gray-800">{t.cuenta_destino?.nombre || 'N/A'}</p>
                <p className="text-sm text-gray-600">Destino</p>
            </div>
            <button onClick={() => handleDeleteTransfer(t.id)} className="p-2 text-red-600 hover:text-red-800 transition-colors cursor-pointer" title="Eliminar Transferencia"><FaTrash /></button>
          </div>
        )) : <p className="text-center text-gray-500">No hay transferencias recientes.</p>}
        </div> {/* Cierra el contenedor space-y-4 */}

        {/* Paginación */}
        <div className="flex justify-center items-center gap-4 mt-6">
            <button onClick={() => handlePageChange(page - 1)} disabled={page === 0 || loading} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">Anterior</button>
            <span className="text-gray-700">Página {page + 1}</span>
            <button onClick={() => handlePageChange(page + 1)} disabled={!hasMore || loading} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">Siguiente</button>
        </div>
      </div>
    </div>
  );
}