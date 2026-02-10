'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link'; // Necesario para el mensaje de "no user"
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import AddBudgetModal from '@/components/AddBudgetModal';
import EditBudgetModal from '@/components/EditBudgetModal';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic'; // Importar dynamic

// Carga dinámica de ExpenseChart con SSR desactivado
const DynamicExpenseChart = dynamic(() => import('@/components/ExpenseChart'), { ssr: false });

import { FaUtensils, FaBus, FaHome, FaGrinStars, FaLightbulb, FaTshirt, FaGraduationCap, FaMedkit, FaHandHoldingUsd, FaBox, FaEdit, FaTrash } from 'react-icons/fa';


// --- Types ---
type Budget = {
  id: string;
  mes: string;
  categoria: string;
  monto_presupuestado: number;
  created_at: string;
};

type Account = {
    id: string;
    nombre: string;
    saldo_actual: number;
};

const GASTOS_CATEGORIES = ['Alimentos', 'Transporte', 'Vivienda', 'Entretenimiento', 'Servicios', 'Ropa', 'Educación', 'Salud', 'Deudas', 'Otros Gastos'];

const getIconForCategory = (category: string | null) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('alimentos')) return <FaUtensils />;
    if (cat.includes('transporte')) return <FaBus />;
    if (cat.includes('vivienda')) return <FaHome />;
    if (cat.includes('entretenimiento')) return <FaGrinStars />;
    if (cat.includes('servicios')) return <FaLightbulb />;
    if (cat.includes('ropa')) return <FaTshirt />;
    if (cat.includes('educación')) return <FaGraduationCap />;
    if (cat.includes('salud')) return <FaMedkit />;
    if (cat.includes('deudas')) return <FaHandHoldingUsd />;
    return <FaBox />;
};


export default function BudgetPage() {
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);


  const fetchData = async (userId: string, month: string) => {
    setPageLoading(true);
    const year = month.split('-')[0];
    const monthNum = month.split('-')[1];
    const firstDayOfMonth = new Date(Number(year), Number(monthNum) - 1, 1);
    const lastDayOfMonth = new Date(Number(year), Number(monthNum), 0);

    const { data: budgetData, error: budgetError } = await supabase
      .from('presupuestos')
      .select('*')
      .eq('usuario_id', userId)
      .gte('mes', firstDayOfMonth.toISOString().split('T')[0])
      .lte('mes', lastDayOfMonth.toISOString().split('T')[0]);
    if (budgetError) toast.error('No se pudieron cargar los presupuestos.');
    else setBudgets(budgetData || []);

    const { data: accountsData, error: accountsError } = await supabase
      .from('cuentas')
      .select('id, nombre, saldo_actual')
      .eq('usuario_id', userId);
    if (accountsError) toast.error('No se pudieron cargar las cuentas.');
    else setAccounts(accountsData || []);

    setPageLoading(false);
  };

  useEffect(() => {
    if (user) {
        fetchData(user.id, selectedMonth);
    } else if (!authLoading) {
        // Solo redirigir si la autenticación ya terminó y el usuario es nulo.
        router.push('/login');
    }
  }, [user, authLoading, selectedMonth, router]);

  const handleAddBudget = async (data: { categoria: string; monto: number; mes: string; }) => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const budgetMonth = new Date(data.mes + '-01').toISOString().split('T')[0];

      const { error } = await supabase.from('presupuestos').insert({
        usuario_id: user.id,
        mes: budgetMonth,
        categoria: data.categoria,
        monto_presupuestado: data.monto,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('Ya existe un presupuesto para esta categoría en este mes.');
        } else {
          toast.error('Error al añadir presupuesto.');
        }
      } else {
        toast.success('¡Presupuesto añadido con éxito!');
        await fetchData(user.id, selectedMonth);
        setIsAddModalOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBudget = async (id: string, monto: number, categoria: string) => { // Acepta también la categoría
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    try {
        const { error } = await supabase.from('presupuestos').update({ monto_presupuestado: monto, categoria: categoria }).eq('id', id); // Actualiza también la categoría
        if (error) throw error;
        toast.success('¡Presupuesto actualizado!');
        await fetchData(user.id, selectedMonth);
        setIsEditModalOpen(false);
        setEditingBudget(null);
    } catch (error: any) {
        toast.error('Error al actualizar el presupuesto.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!user || isSubmitting) return;
    if (!window.confirm('¿Estás seguro de eliminar este presupuesto?')) return;
    setIsSubmitting(true);
    try {
        const { error } = await supabase.from('presupuestos').delete().eq('id', id);
        if (error) throw error;
        toast.success('¡Presupuesto eliminado!');
        await fetchData(user.id, selectedMonth);
    } finally {
        setIsSubmitting(false);
    }
  };


  // --- Lógica para el gráfico de pastel ---
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.saldo_actual, 0);
  const totalBudgeted = budgets.reduce((sum, budget) => sum + budget.monto_presupuestado, 0);
  const unbudgetedAmount = Math.max(0, totalBalance - totalBudgeted);

  const chartData = {
    labels: [...budgets.map(b => b.categoria), 'No Presupuestado'],
    values: [...budgets.map(b => b.monto_presupuestado), unbudgetedAmount],
    colors: [ // Paleta de colores para el gráfico
      '#34D399', '#F87171', '#60A5FA', '#FBBF24', '#A78BFA',
      '#EC4899', '#2DD4BF', '#F472B6', '#818CF8', '#FCD34D',
      '#d1d5db' // Gris claro para 'No Presupuestado'
    ],
  };


  if (authLoading || pageLoading) return (
    <div className="p-4 animate-pulse">
        <h1 className="h-8 bg-gray-300 rounded w-1/4 mb-8"></h1>
        
        {/* Skeleton para selector de mes */}
        <div className="bg-gray-200 p-4 rounded-lg shadow-md mb-8 h-20 flex items-center gap-4">
            <div className="h-6 w-24 bg-gray-300 rounded"></div>
            <div className="h-8 w-48 bg-gray-300 rounded-md"></div>
        </div>

        {/* Skeleton para gráficos y lista */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
                <div className="bg-gray-200 p-6 rounded-2xl shadow-lg h-72">
                    <div className="h-6 bg-gray-300 rounded w-1/2 mx-auto mb-4"></div>
                    <div className="h-48 bg-gray-300 rounded-lg w-full max-w-sm mx-auto"></div>
                </div>
                <div className="bg-gray-200 p-6 rounded-2xl shadow-lg h-24">
                    <div className="h-6 bg-gray-300 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-gray-300 rounded w-1/3"></div>
                </div>
            </div>
            <div className="flex flex-col gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-200 p-4 rounded-lg shadow-md h-24">
                        <div className="h-6 w-1/3 bg-gray-300 rounded"></div>
                        <div className="h-6 w-1/4 bg-gray-300 rounded"></div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );

  if (!user) return (
    <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-700">
        <p className="text-lg">Por favor, <Link href="/login" className="text-indigo-600 hover:underline">inicia sesión</Link> para ver tus presupuestos.</p>
    </div>
  );

  return (
    <>
      <AddBudgetModal 
        isOpen={isAddModalOpen} 
        isSubmitting={isSubmitting} 
        onClose={() => setIsAddModalOpen(false)} 
        onSave={handleAddBudget}
        categories={GASTOS_CATEGORIES}
        defaultMonth={selectedMonth}
      />
      <EditBudgetModal
        isOpen={isEditModalOpen}
        isSubmitting={isSubmitting}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateBudget}
        budget={editingBudget}

        categories={GASTOS_CATEGORIES}
      />

      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Presupuesto Mensual</h1>

        <div className="bg-white p-4 rounded-lg shadow-md mb-8 flex items-center gap-4">
          <label htmlFor="month-selector" className="block text-sm font-medium text-gray-700 mb-1">Selecciona Mes:</label>
          <input type="month" id="month-selector" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Distribución del Saldo</h2>
                    <p className="text-center text-gray-600">Total: {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(totalBalance)}</p>
                    {chartData.values.length > 1 ? (
                        <DynamicExpenseChart data={chartData} />
                    ) : <p className="text-center text-gray-500 mt-4">No hay suficientes datos para el gráfico.</p>}
                </div>
                 <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h3 className="text-lg font-bold text-gray-800">Total Presupuestado</h3>
                    <p className="text-2xl font-bold text-indigo-600">{new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(totalBudgeted)}</p>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {budgets.length > 0 ? budgets.map(budget => (
                    <div key={budget.id} className="flex justify-between items-center bg-white p-4 rounded-lg shadow-md">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl text-gray-600">{getIconForCategory(budget.categoria)}</span> {/* Icono */}
                        <div>
                            <p className="font-bold text-gray-800 text-lg">{budget.categoria}</p>
                            <p className="text-sm text-gray-600">
                            Presupuestado para {new Date(budget.mes + 'T00:00:00').toLocaleDateString('es-PE', { timeZone: 'UTC', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <p className="text-xl font-bold text-indigo-600">
                            {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(budget.monto_presupuestado)}
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => { setEditingBudget(budget); setIsEditModalOpen(true); }} className="p-2 text-gray-500 hover:text-indigo-600"><FaEdit /></button>
                            <button onClick={() => handleDeleteBudget(budget.id)} className="p-2 text-red-600 hover:text-red-800"><FaTrash /></button>
                        </div>
                    </div>
                    </div>
                )) : <p className="text-center text-gray-500">No hay presupuestos para este mes. ¡Añade uno con el botón '+'!</p>}
            </div>
        </div>
      </div>

      <button onClick={() => setIsAddModalOpen(true)}
        style={{
          position: 'fixed', bottom: '30px', right: '30px',
          width: '60px', height: '60px', borderRadius: '50%',
          backgroundColor: '#4f46e5', color: 'white', fontSize: '2.5rem',
          border: 'none', boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          cursor: 'pointer', zIndex: 100, lineHeight: '0'
        }}>
        +
      </button>
    </>
  );
}