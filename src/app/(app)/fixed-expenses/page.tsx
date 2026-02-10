'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import AddFixedExpenseModal from '@/components/AddFixedExpenseModal';
import EditFixedExpenseModal from '@/components/EditFixedExpenseModal';
import { FaEdit, FaTrash } from 'react-icons/fa';

type FixedExpense = {
  id: string;
  nombre: string;
  monto: number;
  dia_pago: number;
  categoria: string | null;
  activo: boolean;
};

export default function FixedExpensesPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const submissionLock = useRef(false);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);

  const fetchData = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('gastos_fijos')
      .select('*')
      .eq('usuario_id', userId)
      .order('dia_pago', { ascending: true });

    if (error) {
      toast.error('No se pudieron cargar los gastos fijos.');
    } else {
      setExpenses(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        await fetchData(session.user.id);
      } else window.location.href = '/login';
    };
    initialize();
  }, [supabase]);

  // --- Handlers ---
  const handleAddFixedExpense = async (data: {
    nombre: string;
    monto: number;
    dia_pago: number;
    categoria: string;
    activo: boolean;
  }) => {
    if (!user || submissionLock.current) return;
    submissionLock.current = true;
    try {
      const { error } = await supabase.from('gastos_fijos').insert({ usuario_id: user.id, ...data });
      if (error) toast.error('Error al añadir gasto fijo.');
      else {
        toast.success('¡Gasto fijo añadido!');
        await fetchData(user.id);
        setIsAddModalOpen(false);
      }
    } finally {
      submissionLock.current = false;
    }
  };

  const handleUpdateFixedExpense = async (id: string, data: {
    nombre: string;
    monto: number;
    dia_pago: number;
    categoria: string;
    activo: boolean;
  }) => {
    if (!user || submissionLock.current) return;
    submissionLock.current = true;
    try {
      const { error } = await supabase.from('gastos_fijos').update(data).eq('id', id);
      if (error) toast.error('Error al actualizar gasto fijo.');
      else {
        toast.success('¡Gasto fijo actualizado!');
        await fetchData(user.id);
        setIsEditModalOpen(false);
        setEditingExpense(null);
      }
    } finally {
      submissionLock.current = false;
    }
  };

  const handleDeleteFixedExpense = async (expenseId: string) => {
    if (window.confirm('¿Estás seguro de eliminar este gasto fijo?')) {
      if (submissionLock.current) return;
      submissionLock.current = true;
      try {
        const { error } = await supabase.from('gastos_fijos').delete().eq('id', expenseId);
        if (error) toast.error('Error al eliminar.');
        else {
          toast.success('Gasto fijo eliminado.');
          setExpenses(expenses.filter(exp => exp.id !== expenseId));
        }
      } finally {
        submissionLock.current = false;
      }
    }
  };

  const handleToggleActive = async (expenseId: string, currentStatus: boolean) => {
    if (!user || submissionLock.current) return;
    submissionLock.current = true;
    try {
        const { error } = await supabase.from('gastos_fijos').update({ activo: !currentStatus }).eq('id', expenseId);
        if(error) toast.error('Error al cambiar estado.');
        else {
            toast.success('Estado actualizado.');
            setExpenses(expenses.map(exp => exp.id === expenseId ? { ...exp, activo: !currentStatus } : exp));
        }
    } finally {
        submissionLock.current = false;
    }
  };

  if (loading) return (
    <div className="p-4 animate-pulse">
        <h1 className="h-8 bg-gray-300 rounded w-1/4 mb-8"></h1>
        
        {/* Skeleton para Lista de Gastos Fijos */}
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-200 p-4 rounded-lg shadow-md h-32">
                    <div className="flex justify-between items-center mb-2">
                        <div className="h-6 w-1/3 bg-gray-300 rounded"></div>
                        <div className="h-6 w-1/4 bg-gray-300 rounded"></div>
                    </div>
                    <div className="h-4 w-2/3 bg-gray-300 rounded mb-1"></div>
                    <div className="flex justify-end gap-2 mt-4">
                        <div className="h-8 w-20 bg-gray-300 rounded-full"></div>
                        <div className="h-8 w-20 bg-gray-300 rounded-full"></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  return (
    <>
      <AddFixedExpenseModal isOpen={isAddModalOpen} isSubmitting={submissionLock.current} onClose={() => setIsAddModalOpen(false)} onSave={handleAddFixedExpense} />
      <EditFixedExpenseModal isOpen={isEditModalOpen} isSubmitting={submissionLock.current} expense={editingExpense} onClose={() => {setIsEditModalOpen(false); setEditingExpense(null);}} onSave={handleUpdateFixedExpense} />

      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Gastos Fijos</h1>
        <div className="flex flex-col gap-4">
          {expenses.length > 0 ? expenses.map(expense => (
            <div key={expense.id} className="flex justify-between items-center bg-white p-4 rounded-lg shadow-md border-l-4" style={{ borderColor: expense.activo ? '#10b981' : '#ef4444' }}>
              <div>
                <p className="font-bold text-gray-800 text-lg">{expense.nombre}</p>
                <p className="text-sm text-gray-600">
                  Categoría: {expense.categoria || 'Sin categoría'} - Día de pago: {expense.dia_pago}
                </p>
              </div>
              <div className="flex items-center gap-4">
                 <p className="text-xl font-bold text-red-600">
                    - {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(expense.monto)}
                 </p>
                 <div className="flex flex-col gap-2">
                    <label className="flex items-center cursor-pointer text-sm text-gray-700">
                        <input type="checkbox" checked={expense.activo} onChange={() => handleToggleActive(expense.id, expense.activo)} className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out rounded focus:ring-indigo-500 mr-2" />
                        {expense.activo ? 'Activo' : 'Inactivo'}
                    </label>
                    <div className="flex gap-2 justify-end">
                        <button onClick={() => { setEditingExpense(expense); setIsEditModalOpen(true); }} className="p-2 text-gray-500 hover:text-indigo-600 transition-colors"><FaEdit /></button>
                        <button onClick={() => handleDeleteFixedExpense(expense.id)} className="p-2 text-red-600 hover:text-red-800 transition-colors"><FaTrash /></button>
                    </div>
                 </div>
              </div>
            </div>
          )) : <p className="text-center text-gray-500">No has registrado ningún gasto fijo.</p>}
        </div>      </div>

      <button onClick={() => setIsAddModalOpen(true)} className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-indigo-600 text-white text-3xl shadow-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-110 flex justify-center items-center z-50 cursor-pointer">
        +
      </button>
    </>
  );
}