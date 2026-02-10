'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import AddLoanModal from '@/components/AddLoanModal';
import AddLoanPaymentModal from '@/components/AddLoanPaymentModal'; // Nuevo modal
import { FaPlus, FaTrash, FaHandHoldingUsd } from 'react-icons/fa';

// --- Types ---
type Account = {
  id: string;
  nombre: string;
  saldo_actual: number;
};

type Loan = {
  id: string;
  persona_nombre: string;
  monto: number;
  monto_pagado: number; // Nueva columna
  nota: string | null;
  cuenta_id: string;
  created_at: string;
  pagado: boolean;
  cuentas: { nombre: string };
};

const LOANS_PER_PAGE = 10;

export default function LoansPage() {
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // --- Modal States ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false); // Nuevo modal
  const [payingLoan, setPayingLoan] = useState<Loan | null>(null); // Deuda a la que se le va a pagar

  const [showPaidLoans, setShowPaidLoans] = useState(false);

  const fetchLoans = async (userId: string, pageNum: number) => {
    setPageLoading(true);
    const from = pageNum * LOANS_PER_PAGE;
    const to = from + LOANS_PER_PAGE - 1;

    const { data, error } = await supabase
      .from('deudas')
      .select('*, cuentas(nombre)')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      toast.error('No se pudieron cargar las deudas.');
      console.error(error);
    } else {
      setLoans(data as Loan[]);
      setHasMore(data.length === LOANS_PER_PAGE);
    }
    setPageLoading(false);
  };

  const fetchAccounts = async (userId: string) => {
    const { data: accountsData, error: accountsError } = await supabase.from('cuentas').select('id, nombre, saldo_actual').eq('usuario_id', userId);
    if (accountsError) {
      toast.error('Error al cargar las cuentas.');
      console.error(accountsError);
    } else {
      setAccounts(accountsData || []);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        setPageLoading(true);
        Promise.all([
          fetchLoans(user.id, page),
          fetchAccounts(user.id)
        ]).finally(() => setPageLoading(false));
      } else {
        router.push('/login');
      }
    }
  }, [user, page, authLoading, router]);

  // --- Handlers ---
  const handleAddLoan = async (nombrePersona: string, amount: number, note: string | null, accountId: string) => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('deudas').insert({
        usuario_id: user.id,
        persona_nombre: nombrePersona,
        monto: amount,
        nota: note,
        cuenta_id: accountId,
        pagado: false,
        monto_pagado: 0, // Inicia en 0
        created_at: new Date().toISOString(),
      });

      if (error) { throw error; }

      toast.success('¡Deuda registrada con éxito!');
      setPage(0);
      await Promise.all([
        fetchLoans(user.id, 0),
        fetchAccounts(user.id)
      ]);
      setIsAddModalOpen(false);
    } catch (error: any) {
      console.error('Error al registrar deuda:', error);
      toast.error(`Error al registrar deuda: ${error.message || 'Desconocido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddPayment = async (loan: Loan, paymentAmount: number, receivingAccountId: string) => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const newPaidAmount = (loan.monto_pagado || 0) + paymentAmount;
      const isNowPaid = newPaidAmount >= loan.monto;

      const { error } = await supabase.from('deudas').update({
          monto_pagado: newPaidAmount,
          pagado: isNowPaid,
      }).eq('id', loan.id);
      
      if (error) { throw error; }

      toast.success('¡Pago registrado con éxito!');
      await Promise.all([
        fetchLoans(user.id, page),
        fetchAccounts(user.id) // Refrescar por si el saldo de la cuenta que recibe cambió
      ]);
      setIsPaymentModalOpen(false);
      setPayingLoan(null);
    } catch (error: any) {
      console.error('Error al registrar pago:', error);
      toast.error(`Error al registrar pago: ${error.message || 'Desconocido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLoan = async (loanId: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta deuda? Todos los pagos asociados se eliminarán y esta acción es irreversible.')) {
        if (!user || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('deudas').delete().eq('id', loanId);
            if(error) {
              toast.error('Error al eliminar la deuda.');
              console.error(error);
            }
            else {
                toast.success('Deuda eliminada con éxito.');
                await fetchLoans(user.id, page); // Refrescar las deudas después de eliminar
                await fetchAccounts(user.id); // También refrescar las cuentas por si hubo movimientos de pago
            }
        } finally {
            setIsSubmitting(false);
        }
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0) {
      setPage(newPage);
    }
  };

  const activeLoans = loans.filter(loan => !loan.pagado);
  const paidLoans = loans.filter(loan => loan.pagado);

  if (authLoading || pageLoading) return (
    <div className="p-4 animate-pulse">
        <h1 className="h-8 bg-gray-300 rounded w-1/4 mb-8"></h1>
        
        {/* Skeleton para Tarjeta de Deudas Activas */}
        <div className="bg-gray-300 p-6 rounded-2xl shadow-lg mb-8 h-48">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            {[...Array(2)].map((_, i) => (
                <div key={i} className="flex justify-between items-center bg-gray-200 p-4 rounded-lg mb-2">
                    <div className="h-6 w-1/3 bg-gray-300 rounded"></div>
                    <div className="h-6 w-1/4 bg-gray-300 rounded"></div>
                </div>
            ))}
        </div>

        {/* Skeleton para Deudas Pagadas */}
        <div className="bg-gray-300 p-6 rounded-2xl shadow-lg h-48">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            {[...Array(2)].map((_, i) => (
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
        <p className="text-lg">Por favor, <Link href="/login" className="text-indigo-600 hover:underline">inicia sesión</Link> para ver tus deudas.</p>
    </div>
  );

  return (
    <div className="w-full space-y-8 p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Gestión de Deudas</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Columna principal de deudas */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Deudas Activas</h2>
            {activeLoans.length === 0 ? (
              <p>No tienes deudas activas. ¡Añade una!</p>
            ) : (
              <div>
                {activeLoans.map(loan => (
                  <LoanCard key={loan.id} loan={loan} onDelete={handleDeleteLoan} onAddPayment={() => { setPayingLoan(loan); setIsPaymentModalOpen(true); }} isSubmitting={isSubmitting} />
                ))}
                <div className="flex justify-center items-center gap-4 mt-6">
                  <button onClick={() => handlePageChange(page - 1)} disabled={page === 0 || loading} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">Anterior</button>
                  <span>Página {page + 1}</span>
                  <button onClick={() => handlePageChange(page + 1)} disabled={!hasMore || loading} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">Siguiente</button>
                </div>
              </div>
            )}
          </div>
          
          {paidLoans.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-md mt-8">
                  <button onClick={() => setShowPaidLoans(!showPaidLoans)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors cursor-pointer mb-4">
                      {showPaidLoans ? 'Ocultar deudas pagadas' : 'Ver deudas pagadas'} ({paidLoans.length})
                  </button>

                  {showPaidLoans && (
                      <>
                          <h2 className="text-xl font-bold text-gray-800 mb-4">Deudas Pagadas</h2>
                          <div>
                              {paidLoans.map(loan => (
                                  <LoanCard key={loan.id} loan={loan} onDelete={handleDeleteLoan} isSubmitting={isSubmitting} />
                              ))}
                          </div>
                      </>
                  )}
              </div>
          )}
        </div>

        {/* Columna de tarjetas de información */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h3 className="text-lg font-bold text-gray-800">Total Deudas Pendientes</h3>
              <p className="text-2xl font-bold text-red-600">{new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(activeLoans.reduce((sum, loan) => sum + loan.monto - loan.monto_pagado, 0))}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h3 className="text-lg font-bold text-gray-800">Total Deudas Pagadas</h3>
              <p className="text-2xl font-bold text-green-600">{new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(paidLoans.reduce((sum, loan) => sum + loan.monto_pagado, 0))}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h3 className="text-lg font-bold text-gray-800">Deudas Activas</h3>
              <p className="text-2xl font-bold text-indigo-600">{activeLoans.length}</p>
          </div>
        </div>
      </div>
      
      <button onClick={() => setIsAddModalOpen(true)} className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-indigo-600 text-white text-3xl shadow-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-110 flex justify-center items-center z-50 cursor-pointer" title="Añadir Nueva Deuda">
        <FaPlus />
      </button>

      <AddLoanModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleAddLoan} accounts={accounts} isSubmitting={isSubmitting} />
      <AddLoanPaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onSave={handleAddPayment} accounts={accounts} loan={payingLoan} isSubmitting={isSubmitting} />
    </div>
  );
}

// Componente auxiliar
const LoanCard = ({ loan, onDelete, onAddPayment, isSubmitting }: { loan: Loan; onDelete: (id: string) => void; onAddPayment?: () => void; isSubmitting: boolean }) => (
    <div className={`flex justify-between items-center bg-white p-4 rounded-lg shadow-sm mb-3 border-l-4 ${loan.pagado ? 'opacity-70' : ''}`} style={{ borderColor: loan.pagado ? '#34D399' : '#EF4444' }}>
        <div>
            <p className="font-bold text-gray-800 text-lg">{loan.persona_nombre}</p>
            <p className="text-sm text-gray-600">Total: {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(loan.monto)}</p>
            <p className="text-sm text-green-600">Pagado: {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(loan.monto_pagado || 0)}</p>
            {!loan.pagado && (
                <p className="text-sm font-semibold text-red-600">Pendiente: {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(loan.monto - (loan.monto_pagado || 0))}</p>
            )}
            <p className="text-xs text-gray-500">Registrado: {new Date(loan.created_at).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className="flex items-center gap-2">
            {onAddPayment && !loan.pagado && (
                <button onClick={onAddPayment} disabled={isSubmitting} className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 cursor-pointer" title="Registrar Pago">
                    <FaHandHoldingUsd />
                </button>
            )}
            <button onClick={() => onDelete(loan.id)} disabled={isSubmitting} className="p-2 text-red-600 hover:text-red-800 disabled:opacity-50 cursor-pointer">
                <FaTrash size={20} />
            </button>
        </div>
    </div>
);