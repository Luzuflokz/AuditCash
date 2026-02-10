'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link'; // Importar Link
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import AddGoalModal from '@/components/AddGoalModal';
import EditGoalModal from '@/components/EditGoalModal';
import AddContributionModal from '@/components/AddContributionModal';
import { useAuth } from '@/context/AuthContext'; // Asumiendo que AuthContext se usará aquí también
import { FaPlus, FaPlane, FaLaptopCode, FaHome, FaCar, FaGift, FaBook, FaHeartbeat, FaMoneyBillWave, FaLightbulb, FaCoins } from 'react-icons/fa';

import { FaEdit, FaTrashAlt, FaCheckCircle, FaPlusCircle } from 'react-icons/fa'; // Added FaCheckCircle and FaPlusCircle

// --- Types ---
type SavingGoal = {
  id: string;
  nombre_meta: string;
  monto_objetivo: number;
  monto_actual: number;
  categoria: string | null;
  fecha_limite: string | null;
  created_at: string; // Añadir created_at para mostrar en UI
};
type Account = {
  id: string;
  nombre: string;
  saldo_actual: number;
};

const SAVINGS_PER_PAGE = 5;

const getIconForCategory = (category: string | null) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('viaje')) return <FaPlane />;
    if (cat.includes('tecno')) return <FaLaptopCode />;
    if (cat.includes('casa') || cat.includes('hogar')) return <FaHome />;
    if (cat.includes('vehículo')) return <FaCar />; // Ajustado para 'vehículo'
    if (cat.includes('educación')) return <FaBook />;
    if (cat.includes('salud')) return <FaHeartbeat />;
    if (cat.includes('regalo')) return <FaGift />;
    if (cat.includes('inversión')) return <FaMoneyBillWave />;
    if (cat.includes('emergencia')) return <FaLightbulb />; // Podría ser otro ícono
    return <FaCoins />; // Por defecto
};

const ProgressBar = ({ current, target }: { current: number; target: number }) => {
  const percentage = target > 0 ? (current / target) * 100 : 0;
  const displayPercentage = Math.min(percentage, 100); 
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
      <div 
        className="bg-green-400 rounded-full h-full" 
        style={{ width: `${displayPercentage}%` }}
      ></div>
    </div>
  );
};

export default function SavingsPage() {
  const supabase = createClient();
  const { user } = useAuth(); // Usar el AuthContext
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // --- Modal States ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingGoal | null>(null);
  const [contributingGoal, setContributingGoal] = useState<SavingGoal | null>(null);

  // --- Estado para Metas Completadas ---
  const [showCompletedGoals, setShowCompletedGoals] = useState(false);

  const fetchData = async (userId: string, pageNum: number) => {
    setLoading(true);
    const from = pageNum * SAVINGS_PER_PAGE;
    const to = from + SAVINGS_PER_PAGE - 1;

    const { data: goalsData, error: goalsError } = await supabase.from('ahorros').select('*').eq('usuario_id', userId).order('created_at', { ascending: false }).range(from, to);
    if (goalsError) toast.error('No se pudieron cargar las metas.');
    else {
        setGoals(goalsData || []);
        if ((goalsData || []).length < SAVINGS_PER_PAGE) setHasMore(false);
        else setHasMore(true);
    }
    setLoading(false); // Mover aquí para que se desactive loading al final de fetchData
  };

  const fetchAccounts = async (userId: string) => {
    const { data: accountsData } = await supabase.from('cuentas').select('id, nombre, saldo_actual').eq('usuario_id', userId);
    setAccounts(accountsData || []);
  };

  useEffect(() => {
    if (user) {
      setLoading(true); // Activar loading al inicio
      Promise.all([
        fetchData(user.id, page), // Usa la página actual
        fetchAccounts(user.id)
      ]).finally(() => setLoading(false)); // Desactivar loading cuando ambos terminan
    } else {
        setLoading(false); // Si no hay usuario, no estamos cargando nada
        setGoals([]);
        setAccounts([]);
    }
  }, [user, page]); // Depende de user y page


  // --- Handlers ---
  const handleAddGoal = async (name: string, target: number, categoria: string, deadline: string | null) => {
    if (!user || isSubmitting) return; // Asegurarse de que haya usuario
    setIsSubmitting(true);
    const { error } = await supabase.from('ahorros').insert({ usuario_id: user.id, nombre_meta: name, monto_objetivo: target, categoria, fecha_limite: deadline });
    if (error) toast.error('Error al crear la meta.');
    else {
      toast.success('¡Meta creada!');
      setPage(0); // Volver a la primera página para ver la nueva meta
      await fetchData(user.id, 0);
      setIsAddModalOpen(false);
    }
    setIsSubmitting(false);
  };
  
  const handleUpdateGoal = async (id: string, name: string, target: number, categoria: string, deadline: string | null) => {
    if (!user || isSubmitting) return; // Asegurarse de que haya usuario
    setIsSubmitting(true);
    const { error } = await supabase.from('ahorros').update({ nombre_meta: name, monto_objetivo: target, categoria, fecha_limite: deadline }).eq('id', id);
    if (error) toast.error('Error al actualizar la meta.');
    else {
      toast.success('¡Meta actualizada!');
      await fetchData(user.id, page);
      setIsEditModalOpen(false);
    }
    setIsSubmitting(false);
  };
  
  const handleDeleteGoal = async (goalId: string) => {
    if (window.confirm('¿Estás seguro?')) {
      if (!user) return; // Asegurarse de que haya usuario
      const { error } = await supabase.from('ahorros').delete().eq('id', goalId);
      if (error) toast.error('Error al eliminar.');
      else {
        toast.success('Meta eliminada.');
        await fetchData(user.id, page);
      }
    }
  };

  const handleSaveContribution = async (accountId: string, amount: number) => {
    if (isSubmitting || !contributingGoal || !user) return; // Asegurarse de que haya usuario
    setIsSubmitting(true);
    const { error } = await supabase.rpc('aportar_a_ahorro', { meta_id: contributingGoal.id, cuenta_id: accountId, monto_aporte: amount, user_id: user.id });
    if (error) toast.error(`Error: ${error.message}`);
    else {
        toast.success('¡Aporte registrado!');
        await fetchData(user.id, page);
        setIsContributionModalOpen(false);
        // También actualizamos las cuentas ya que el saldo_actual de la cuenta cambió
        fetchAccounts(user.id);
    }
    setIsSubmitting(false);
  };

  const handlePageChange = async (newPage: number) => {
    if (!user) return;
    setPage(newPage);
    // fetchData ya se llamará por el useEffect debido al cambio de 'page'
  }

  // --- Lógica para separar metas activas y completadas ---
  const activeGoals = goals.filter(goal => goal.monto_actual < goal.monto_objetivo);
  const completedGoals = goals.filter(goal => goal.monto_actual >= goal.monto_objetivo);

  if (loading) return (
    <div className="p-4 animate-pulse">
        <h1 className="h-8 bg-gray-300 rounded w-1/4 mb-8"></h1>
        
        {/* Skeleton para Metas Activas */}
        <h2 className="h-6 bg-gray-300 rounded w-1/3 mb-6"></h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => ( // Renderiza 3 skeletons de GoalCard
                <div key={i} className="bg-gray-300 rounded-xl shadow-md p-4 h-48">
                    <div className="flex justify-between items-center mb-4">
                        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                        <div className="flex gap-2">
                            <div className="h-6 w-12 bg-gray-200 rounded"></div>
                            <div className="h-6 w-12 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                    <div className="h-2 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3 mt-4"></div>
                </div>
            ))}
        </div>

        {/* Skeleton para botón de Metas Cumplidas */}
        <div className="h-10 w-48 bg-gray-300 rounded-md mt-8"></div>
        
        {/* Skeleton para Paginación */}
        <div className="flex justify-center items-center gap-4 mt-8">
            <div className="h-8 w-20 bg-gray-300 rounded-md"></div>
            <div className="h-6 bg-gray-300 rounded w-16"></div>
            <div className="h-8 w-20 bg-gray-300 rounded-md"></div>
        </div>
    </div>
  );
  if (!user) return (
    <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-700">
        <p className="text-lg">Por favor, <Link href="/login" className="text-indigo-600 hover:underline">inicia sesión</Link> para ver tus metas.</p>
    </div>
  ); // Mensaje si no hay usuario

  return (
    <>
      <AddGoalModal isOpen={isAddModalOpen} isSubmitting={isSubmitting} onClose={() => setIsAddModalOpen(false)} onSave={handleAddGoal} />
      <EditGoalModal goal={editingGoal} isSubmitting={isSubmitting} onClose={() => { setIsEditModalOpen(false); setEditingGoal(null); }} onSave={handleUpdateGoal} />
      <AddContributionModal isOpen={isContributionModalOpen} isSubmitting={isSubmitting} accounts={accounts} onClose={() => {setIsContributionModalOpen(false); setContributingGoal(null);}} onSave={handleSaveContribution} goalTargetAmount={contributingGoal?.monto_objetivo || 0} goalCurrentAmount={contributingGoal?.monto_actual || 0} />

      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Metas de Ahorro</h1>

        {/* Metas Activas */}
        {activeGoals.length > 0 && (
            <>
                <h2 className="text-xl font-bold text-gray-700 mt-8 mb-4">Metas Activas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeGoals.map(goal => (
                        <GoalCard key={goal.id} goal={goal} setEditingGoal={setEditingGoal} setIsEditModalOpen={setIsEditModalOpen} handleDeleteGoal={handleDeleteGoal} setContributingGoal={setContributingGoal} setIsContributionModalOpen={setIsContributionModalOpen} />
                    ))}
                </div>
            </>
        )}
        {activeGoals.length === 0 && completedGoals.length === 0 && !loading && (
            <p className="text-center text-gray-500 mt-8">Aún no tienes metas de ahorro. ¡Crea una para empezar!</p>
        )}
        {activeGoals.length === 0 && completedGoals.length > 0 && !showCompletedGoals && !loading && (
            <p className="text-center text-gray-500 mt-8">No tienes metas activas. Haz clic en "Ver metas cumplidas" para ver tus logros.</p>
        )}

        {/* Sección de Metas Completadas */}
        {completedGoals.length > 0 && (
            <div className="mt-8">
                <button 
                    onClick={() => setShowCompletedGoals(!showCompletedGoals)} 
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors cursor-pointer mb-4"
                >
                    {showCompletedGoals ? 'Ocultar metas cumplidas' : 'Ver metas cumplidas'} ({completedGoals.length})
                </button>

                {showCompletedGoals && (
                    <>
                        <h2 className="text-xl font-bold text-gray-700 mb-4">Metas Cumplidas</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {completedGoals.map(goal => (
                                <GoalCard key={goal.id} goal={goal} setEditingGoal={setEditingGoal} setIsEditModalOpen={setIsEditModalOpen} handleDeleteGoal={handleDeleteGoal} setContributingGoal={setContributingGoal} setIsContributionModalOpen={setIsContributionModalOpen} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        )}
        
        {/* Paginación */}
        <div className="mt-8 flex justify-center items-center gap-4">
            <button onClick={() => handlePageChange(page - 1)} disabled={page === 0} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">Anterior</button>
            <span className="text-gray-700">Página {page + 1}</span>
            <button onClick={() => handlePageChange(page + 1)} disabled={!hasMore} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">Siguiente</button>
        </div>
      </div>
      
      <button onClick={() => setIsAddModalOpen(true)} className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-indigo-600 text-white text-3xl shadow-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-110 flex justify-center items-center z-50 cursor-pointer">
        <FaPlus />
      </button>
    </>
  );
}

// Componente auxiliar para renderizar una meta (para evitar duplicación de código)
const GoalCard = ({ goal, setEditingGoal, setIsEditModalOpen, handleDeleteGoal, setContributingGoal, setIsContributionModalOpen }: { 
    goal: SavingGoal; 
    setEditingGoal: (goal: SavingGoal | null) => void;
    setIsEditModalOpen: (isOpen: boolean) => void;
    handleDeleteGoal: (goalId: string) => Promise<void>;
    setContributingGoal: (goal: SavingGoal | null) => void;
    setIsContributionModalOpen: (isOpen: boolean) => void;
}) => {
    const isCompleted = goal.monto_actual >= goal.monto_objetivo;
    return (
        <div className={`bg-white p-5 rounded-xl shadow-md ${isCompleted ? 'opacity-70 border-l-4 border-green-500' : 'border-l-4 border-indigo-500'}`}>
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <span className="text-2xl">{getIconForCategory(goal.categoria)}</span>
                    {goal.nombre_meta}
                </h3>
                <div className="flex gap-2">
                    {isCompleted && <FaCheckCircle className="text-green-500 text-xl" title="Meta Completada" />}
                    <button 
                        onClick={() => { setEditingGoal(goal); setIsEditModalOpen(true); }} 
                        className="text-gray-500 hover:text-indigo-600 transition-colors cursor-pointer p-1 rounded-full hover:bg-gray-100"
                        title="Editar Meta"
                    >
                        <FaEdit size={16} />
                    </button>
                    <button 
                        onClick={() => handleDeleteGoal(goal.id)} 
                        className="text-gray-500 hover:text-red-600 transition-colors cursor-pointer p-1 rounded-full hover:bg-gray-100"
                        title="Eliminar Meta"
                    >
                        <FaTrashAlt size={16} />
                    </button>
                </div>
            </div>
            <p className="text-gray-700 text-md mb-2">
                <span className="font-bold">{new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(goal.monto_actual)}</span> 
                {' de '} 
                {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(goal.monto_objetivo)}
            </p>
            <ProgressBar current={goal.monto_actual} target={goal.monto_objetivo} />
            {goal.fecha_limite && (
                <p className="text-gray-500 text-xs mt-3">
                    Fecha límite: {new Date(goal.fecha_limite).toLocaleDateString('es-PE')}
                </p>
            )}
            <p className="text-gray-500 text-xs mt-1">
                Creada: {new Date(goal.created_at).toLocaleDateString('es-PE')}
            </p>
            {!isCompleted && (
                <button 
                    onClick={() => { setContributingGoal(goal); setIsContributionModalOpen(true); }} 
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors cursor-pointer font-semibold text-sm flex items-center gap-2"
                >
                    <FaPlusCircle /> Aportar
                </button>
            )}
        </div>
    );
}; 