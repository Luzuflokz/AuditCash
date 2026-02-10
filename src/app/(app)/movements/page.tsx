'use client'

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import AddMovementModal from '@/components/AddMovementModal';
import EditMovementModal from '@/components/EditMovementModal';
import { FaEdit, FaTrash, FaFilter } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';

// --- Types ---
type Account = {
  id: string;
  nombre: string;
};

type Movement = {
  id:string;
  fecha: string;
  categoria: string;
  tipo: 'ingreso' | 'gasto';
  monto: number;
  descripcion: string;
  cuenta_id: string;
  cuentas: { nombre: string };
};

const MOVEMENTS_PER_PAGE = 10;

// Definición de categorías fijas
const INGRESOS_CATEGORIES = ['Salario', 'Inversiones', 'Regalo', 'Ventas', 'Otros Ingresos'];
const GASTOS_CATEGORIES = ['Alimentos', 'Transporte', 'Vivienda', 'Entretenimiento', 'Servicios', 'Ropa', 'Educación', 'Salud', 'Deudas', 'Otros Gastos'];

export default function MovementsPage() {
  const supabase = createClient();
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const submissionLock = useRef(false);

  // --- Modal States ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);

  // --- Filter States ---
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'ingreso' | 'gasto'>('all');
  
  const fetchMovements = async (
    userId: string, 
    pageNum: number, 
    startD?: string, 
    endD?: string, 
    typeF?: 'all' | 'ingreso' | 'gasto'
  ) => {
    setLoading(true);
    const from = pageNum * MOVEMENTS_PER_PAGE;
    const to = from + MOVEMENTS_PER_PAGE - 1;

    let query = supabase
      .from('movimientos')
      .select('*, cuentas(nombre)')
      .eq('usuario_id', userId);

    if (startD) {
      query = query.gte('fecha', `${startD}T00:00:00Z`);
    }
    if (endD) {
      query = query.lte('fecha', `${endD}T23:59:59Z`);
    }
    if (typeF && typeF !== 'all') {
      query = query.eq('tipo', typeF);
    }

    const { data, error } = await query
      .order('fecha', { ascending: false })
      .range(from, to);

    if (error) {
      toast.error('No se pudieron cargar los movimientos.');
      console.error(error);
    } else {
      setMovements(data as Movement[]);
      setHasMore(data.length === MOVEMENTS_PER_PAGE);
    }
    setLoading(false);
  };

  const fetchAccounts = async (userId: string) => {
    const { data: userAccounts, error } = await supabase
      .from('cuentas')
      .select('id, nombre')
      .eq('usuario_id', userId);
    
    if(error) {
      toast.error('No se pudieron cargar las cuentas.');
      console.error(error);
    } else {
      setAccounts(userAccounts || []);
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([
        fetchMovements(user.id, 0, startDate, endDate, filterType),
        fetchAccounts(user.id)
      ]).finally(() => setLoading(false));
    }
  }, [user]);

  const applyFilters = () => {
    if (user) {
      setPage(0);
      fetchMovements(user.id, 0, startDate, endDate, filterType);
    }
  };

  const onMovementAdded = () => {
    if(user) {
      toast.success('¡Movimiento registrado con éxito!');
      setIsAddModalOpen(false);
      fetchMovements(user.id, page, startDate, endDate, filterType);
      fetchAccounts(user.id);
    }
  }

  const handleAddMovement = async (data: any) => {
    if (!user || submissionLock.current) return;
    submissionLock.current = true;
    try {
      const { error } = await supabase.from('movimientos').insert({ 
        usuario_id: user.id, 
        cuenta_id: data.accountId, 
        monto: data.amount, 
        tipo: data.type, 
        categoria: data.category, 
        descripcion: data.description, 
        fecha: new Date(data.date).toISOString() 
      });

      if (error) {
        toast.error('Error al registrar el movimiento.');
        console.error(error);
      } else {
        onMovementAdded();
      }
    } finally {
      submissionLock.current = false;
    }
  };
  
  const handleUpdateMovement = async (id: string, data: any) => {
    if (!user || submissionLock.current) return;
    submissionLock.current = true;
    try {
        const { error } = await supabase.from('movimientos').update({ 
          cuenta_id: data.accountId, 
          monto: data.amount, 
          tipo: data.type, 
          categoria: data.category, 
          descripcion: data.description, 
          fecha: new Date(data.date).toISOString() 
        }).eq('id', id);
        if(error) {
          toast.error('Error al actualizar el movimiento.');
          console.error(error);
        }
        else {
            toast.success('Movimiento actualizado con éxito.');
            fetchMovements(user.id, page, startDate, endDate, filterType);
            fetchAccounts(user.id);
            setIsEditModalOpen(false);
        }
    } finally {
        submissionLock.current = false;
    }
  };
  
  const handleDeleteMovement = async (movementId: string) => {
    if (window.confirm('¿Estás seguro de eliminar este movimiento?')) {
        if (!user || submissionLock.current) return;
        submissionLock.current = true;
        try {
            const { error } = await supabase.from('movimientos').delete().eq('id', movementId);
            if(error) {
              toast.error('Error al eliminar el movimiento.');
              console.error(error);
            }
            else {
                toast.success('Movimiento eliminado con éxito.');
                fetchMovements(user.id, page, startDate, endDate, filterType);
                fetchAccounts(user.id);
            }
        } finally {
            submissionLock.current = false;
        }
    }
  };
  
  const handlePageChange = async (newPage: number) => {
    if (!user || newPage < 0) return;
    setPage(newPage);
    fetchMovements(user.id, newPage, startDate, endDate, filterType);
  }

  if (!user) {
    return <div style={{ color: '#1f2937', textAlign: 'center', marginTop: '50px' }}>Cargando...</div>;
  }

  return (
    <>
      <AddMovementModal 
        isOpen={isAddModalOpen} 
        isSubmitting={submissionLock.current} 
        accounts={accounts} 
        onClose={() => setIsAddModalOpen(false)} 
        onSave={handleAddMovement}
        incomeCategories={INGRESOS_CATEGORIES}
        expenseCategories={GASTOS_CATEGORIES}
      />
      <EditMovementModal 
        isOpen={isEditModalOpen} 
        isSubmitting={submissionLock.current} 
        movement={editingMovement} 
        accounts={accounts} 
        onClose={() => setIsEditModalOpen(false)} 
        onSave={handleUpdateMovement}
        incomeCategories={INGRESOS_CATEGORIES}
        expenseCategories={GASTOS_CATEGORIES}
      />

      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Historial de Movimientos</h1>
        
        {/* Sección de Filtros */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 grid grid-cols-2 gap-4 md:flex md:flex-wrap md:gap-4 md:items-end">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Desde:</label>
            <input 
              type="date" 
              id="startDate" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Hasta:</label>
            <input 
              type="date" 
              id="endDate" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <div>
            <label htmlFor="filterType" className="block text-sm font-medium text-gray-700 mb-1">Tipo:</label>
            <select 
              id="filterType" 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value as 'all' | 'ingreso' | 'gasto')} 
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="all">Todos</option>
              <option value="ingreso">Ingresos</option>
              <option value="gasto">Gastos</option>
            </select>
          </div>
          <button 
            onClick={applyFilters} 
            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors cursor-pointer flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <FaFilter /> Aplicar Filtros
          </button>
        </div>

        {loading ? (
          <div className="p-4 animate-pulse">
            {/* Skeleton para la sección de Filtros */}
            <div className="bg-gray-200 p-4 rounded-lg shadow-md mb-6 h-32">
                <div className="flex flex-wrap gap-3 mb-3">
                    <div className="h-8 w-24 bg-gray-300 rounded"></div>
                    <div className="h-8 w-24 bg-gray-300 rounded"></div>
                    <div className="h-8 w-24 bg-gray-300 rounded"></div>
                    <div className="h-8 w-32 bg-gray-300 rounded"></div>
                </div>
                <div className="h-10 w-32 bg-gray-300 rounded-md"></div>
            </div>

            {/* Skeleton para la lista de Movimientos */}
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-gray-200 p-4 rounded-lg shadow-sm h-28">
                        <div className="flex justify-between items-center mb-2">
                            <div className="h-6 w-1/3 bg-gray-300 rounded"></div>
                            <div className="h-6 w-1/4 bg-gray-300 rounded"></div>
                        </div>
                        <div className="h-4 w-2/3 bg-gray-300 rounded mb-1"></div>
                        <div className="h-4 w-1/2 bg-gray-300 rounded"></div>
                    </div>
                ))}
            </div>
            {/* Skeleton para la Paginación */}
            <div className="mt-6 flex justify-center gap-4">
                <div className="h-10 w-24 bg-gray-300 rounded-md"></div>
                <div className="h-8 w-16 bg-gray-300 rounded"></div>
                <div className="h-10 w-24 bg-gray-300 rounded-md"></div>
            </div>
          </div>
        ) : (
          <div>
            {movements.length === 0 ? (
                <p className="text-center text-gray-500 mt-8">No hay movimientos registrados con los filtros actuales.</p>
            ) : (
                <>
                {movements.map(mov => {
                    return (
                    <div key={mov.id} className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm mb-3 border-l-4" style={{ borderColor: mov.tipo === 'ingreso' ? '#10b981' : '#ef4444' }}>
                        <div>
                            <p className="font-bold text-gray-800 text-lg">{mov.categoria}</p>
                            <p className="text-sm text-gray-600 mt-1">
                                {mov.cuentas?.nombre || 'Cuenta eliminada'} - {new Date(mov.fecha).toLocaleString('es-PE', { day:'2-digit', month:'2-digit', year:'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {mov.descripcion && (
                                <p 
                                    className="text-xs text-gray-500 mt-1 truncate max-w-xs"
                                    title={mov.descripcion}
                                >
                                    {mov.descripcion.length > 70 ? `${mov.descripcion.substring(0, 67)}...` : mov.descripcion}
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <p className={`text-xl font-bold ${mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                                {mov.tipo === 'ingreso' ? '+' : '-'} {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(mov.monto)}
                            </p>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => { setEditingMovement(mov); setIsEditModalOpen(true); }} 
                                    className="text-gray-500 hover:text-indigo-600 transition-colors cursor-pointer p-1 rounded-full hover:bg-gray-100"
                                    title="Editar Movimiento"
                                >
                                    <FaEdit size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDeleteMovement(mov.id)} 
                                    className="text-gray-500 hover:text-red-600 transition-colors cursor-pointer p-1 rounded-full hover:bg-gray-100"
                                    title="Eliminar Movimiento"
                                >
                                    <FaTrash size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                    );
                })}
                <div className="mt-6 flex justify-center items-center gap-4">
                    <button 
                        onClick={() => handlePageChange(page - 1)} 
                        disabled={page === 0 || loading} 
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Anterior
                    </button>
                    <span className="text-gray-700">Página {page + 1}</span>
                    <button 
                        onClick={() => handlePageChange(page + 1)} 
                        disabled={!hasMore || loading} 
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Siguiente
                    </button>
                </div>
                </>
            )}
          </div>
        )}
      </div>

      <button onClick={() => setIsAddModalOpen(true)} className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-green-500 text-white text-3xl shadow-lg hover:bg-green-600 transition-all duration-300 transform hover:scale-110 flex justify-center items-center z-50 cursor-pointer">
        +
      </button>
    </>
  );
}