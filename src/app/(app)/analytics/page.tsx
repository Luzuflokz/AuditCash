'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link'; // Necesario para el mensaje de "no user"
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import type { User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import ExpenseChart from '@/components/ExpenseChart';
import HistoricalBarChart from '@/components/HistoricalBarChart';

type Movement = {
  id: string;
  fecha: string;
  categoria: string;
  monto: number;
  descripcion: string;
  cuentas: { nombre: string };
};

type ChartData = {
    labels: string[];
    values: number[];
};

type MonthlySummary = {
  monthYear: string; 
  totalIncome: number;
  totalExpenses: number;
};

export default function AnalyticsPage() {
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth(); // Usar el AuthContext
  const router = useRouter(); // Hook para redirección
  const [movements, setMovements] = useState<Movement[]>([]);
  const [chartData, setChartData] = useState<ChartData>({ labels: [], values: [] });
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [incomeChartData, setIncomeChartData] = useState<ChartData>({ labels: [], values: [] });
  const [totalIncome, setTotalIncome] = useState(0);
  const [pageLoading, setPageLoading] = useState(true); // Estado de carga para los datos de la página
  const [rawHistoricalMovements, setRawHistoricalMovements] = useState<any[]>([]);
  
  // --- Date filters ---
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]);
  const [filterPeriod, setFilterPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  // --- AQUÍ ESTÁ EL CÁLCULO CON EL LÍMITE CORREGIDO ---
  const formattedHistoricalData = useMemo(() => {
    if (!rawHistoricalMovements.length) return [];

    const aggregatedData: { [key: string]: { income: number; expenses: number } } = {};

    // 1. Agrupar datos
    rawHistoricalMovements.forEach(mov => {
        const movDate = new Date(mov.fecha);
        let key = '';

        if (filterPeriod === 'daily') {
            key = movDate.toISOString().split('T')[0];
        } else if (filterPeriod === 'weekly') {
            const startOfYear = new Date(movDate.getFullYear(), 0, 1);
            const diffTime = movDate.getTime() - startOfYear.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const weekNumber = Math.floor(diffDays / 7) + 1; // Semana 1 para los primeros 7 días
            // Para la key, podemos usar el formato "YYYY-W##" o la fecha del primer día de esa semana de 7 días.
            // Usaremos la fecha del primer día de esa "semana" para consistencia con el formato YYYY-MM-DD
            const startOfCustomWeek = new Date(startOfYear.getTime() + (weekNumber - 1) * 7 * (1000 * 60 * 60 * 24));
            key = startOfCustomWeek.toISOString().split('T')[0];
        } else { // monthly
            key = `${movDate.getFullYear()}-${(movDate.getMonth() + 1).toString().padStart(2, '0')}`;
        }

        if (!aggregatedData[key]) {
            aggregatedData[key] = { income: 0, expenses: 0 };
        }

        if (mov.tipo === 'ingreso') aggregatedData[key].income += mov.monto;
        if (mov.tipo === 'gasto') aggregatedData[key].expenses += mov.monto;
    });

    // 2. Ordenar fechas
    const sortedKeys = Object.keys(aggregatedData).sort();

    // 3. APLICAR LÍMITE (La corrección que pediste)
    let limit = sortedKeys.length; 

    if (filterPeriod === 'daily') limit = 30;   // Máximo últimos 30 días
    if (filterPeriod === 'weekly') limit = 12;  // Máximo últimas 12 semanas
    if (filterPeriod === 'monthly') limit = 12; // Máximo últimos 12 meses

    // Cortamos el array para quedarnos solo con el final
    const limitedKeys = sortedKeys.slice(-limit);

    return limitedKeys.map(key => {
        let formattedLabel = key;
        if (filterPeriod === 'daily') {
            const [year, month, day] = key.split('-');
            formattedLabel = `${day}/${month}`;
        } else if (filterPeriod === 'weekly') {
            const [year, month, day] = key.split('-');
            formattedLabel = `${day}/${month}`;
        } else if (filterPeriod === 'monthly') {
            const [year, month] = key.split('-');
            formattedLabel = `${month}/${year}`;
        }
        return {
            label: formattedLabel,
            income: aggregatedData[key].income,
            expenses: aggregatedData[key].expenses,
        };
    });

  }, [rawHistoricalMovements, filterPeriod]); 


  const fetchData = async (userId: string, start: string, end: string) => {
    if (!start || !end) return;
    setPageLoading(true);

    const startDateObj = new Date(`${start}T00:00:00`);
    const endDateObj = new Date(`${end}T23:59:59`);

    // GASTOS
    const { data: expenseData, error: expenseError } = await supabase
      .from('movimientos')
      .select('*, cuentas(nombre)')
      .eq('usuario_id', userId)
      .eq('tipo', 'gasto')
      .gte('fecha', startDateObj.toISOString())
      .lte('fecha', endDateObj.toISOString())
      .order('fecha', { ascending: false });

    if (expenseError) {
      toast.error("No se pudieron cargar los movimientos de gastos.");
    } else {
      setMovements(expenseData as Movement[]); 
      
      const spendingByCategory = expenseData.reduce((acc: {[key: string]: number}, mov) => {
        acc[mov.categoria] = (acc[mov.categoria] || 0) + mov.monto;
        return acc;
      }, {});

      const expenseLabels = Object.keys(spendingByCategory);
      const expenseValues = Object.values(spendingByCategory);
      const totalExp = expenseValues.reduce((sum, val) => sum + val, 0);

      setChartData({ labels: expenseLabels, values: expenseValues });
      setTotalExpenses(totalExp);
    }

    // INGRESOS
    const { data: incomeData, error: incomeError } = await supabase
      .from('movimientos')
      .select('*, cuentas(nombre)')
      .eq('usuario_id', userId)
      .eq('tipo', 'ingreso')
      .gte('fecha', startDateObj.toISOString())
      .lte('fecha', endDateObj.toISOString())
      .order('fecha', { ascending: false });

    if (incomeError) {
      toast.error("No se pudieron cargar los movimientos de ingresos.");
    } else {
      const incomeByCategory = incomeData.reduce((acc: {[key: string]: number}, mov) => {
        acc[mov.categoria] = (acc[mov.categoria] || 0) + mov.monto;
        return acc;
      }, {});

      const incomeLabels = Object.keys(incomeByCategory);
      const incomeValues = Object.values(incomeByCategory);
      const totalInc = incomeValues.reduce((sum, val) => sum + val, 0);

      setIncomeChartData({ labels: incomeLabels, values: incomeValues });
      setTotalIncome(totalInc);
    }

    // HISTÓRICO RAW (Traemos 6 meses atrás por defecto para tener base)
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstHistoricalDate = new Date(currentYear, currentMonth - 5, 1); 

    const { data: allHistoricalMovements, error: historicalError } = await supabase
        .from('movimientos')
        .select('fecha, tipo, monto')
        .eq('usuario_id', userId)
        // Podrías ajustar esta fecha si quieres traer AUN MAS historial para el filtro diario
        .gte('fecha', firstHistoricalDate.toISOString()) 
        .order('fecha', { ascending: true });

    if (historicalError) {
        toast.error("Error cargando histórico");
    } else {
        setRawHistoricalMovements(allHistoricalMovements || []);
    }
    setPageLoading(false);
  };

  useEffect(() => {
    if (user) {
        fetchData(user.id, startDate, endDate);
    } else if (!authLoading) {
        // Solo redirigir si la autenticación ya terminó y el usuario es nulo.
        router.push('/login');
    }
  }, [user, authLoading, startDate, endDate, router]);

  const handleDateChange = () => {
    if(user) {
        fetchData(user.id, startDate, endDate);
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Análisis de Gastos</h1>

      {/* Filter Section */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-8 flex items-center gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Desde:</label>
            <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"/>
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Hasta:</label>
            <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"/>
          </div>
          <div>
            <label htmlFor="filterButton" className="block text-sm font-medium text-gray-700 mb-1 invisible">Filtrar</label>
            <button onClick={handleDateChange} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors cursor-pointer">Filtrar</button>
          </div>
      </div>

      {authLoading || pageLoading ? (
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

            {/* Skeleton para la lista de Gráficos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-200 p-6 rounded-2xl shadow-lg h-72">
                    <div className="h-6 bg-gray-300 rounded w-1/2 mx-auto mb-4"></div>
                    <div className="h-48 bg-gray-300 rounded-lg w-full max-w-sm mx-auto"></div>
                </div>
                <div className="bg-gray-200 p-6 rounded-2xl shadow-lg h-72">
                    <div className="h-6 bg-gray-300 rounded w-1/2 mx-auto mb-4"></div>
                    <div className="h-48 bg-gray-300 rounded-lg w-full max-w-sm mx-auto"></div>
                </div>
            </div>

            {/* Skeleton para Histórico */}
            <div className="bg-gray-200 p-6 rounded-2xl shadow-lg mb-8 h-72">
                <div className="h-6 bg-gray-300 rounded w-1/2 mx-auto mb-4"></div>
                <div className="h-48 bg-gray-300 rounded-lg w-full max-w-lg mx-auto"></div>
            </div>

            {/* Skeleton para Filtros Históricos */}
            <div className="bg-gray-200 p-4 rounded-lg shadow-md mb-6 h-20 flex items-center gap-4">
                <div className="h-8 w-24 bg-gray-300 rounded"></div>
                <div className="h-8 w-20 bg-gray-300 rounded-full"></div>
                <div className="h-8 w-20 bg-gray-300 rounded-full"></div>
                <div className="h-8 w-20 bg-gray-300 rounded-full"></div>
            </div>

            {/* Skeleton para Tabla de Detalles */}
            <div className="bg-gray-200 p-6 rounded-2xl shadow-lg h-72">
                <div className="h-6 bg-gray-300 rounded w-1/2 mx-auto mb-4"></div>
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-100 p-3 rounded-md mb-3 h-16">
                        <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                        <div className="h-5 bg-gray-300 rounded w-1/4"></div>
                    </div>
                ))}
            </div>
        </div>
      ) : (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* Expense Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-gray-800 text-center mb-4">Gastos por Categoría</h2>
                    {chartData.values.length > 0 ? (
                        <ExpenseChart data={chartData} />
                    ) : <p className="text-center text-gray-500 py-8">No hay datos de gastos en este rango de fechas.</p>}
                    <p style={{fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center', marginTop: '15px'}}>Total de Gastos: {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(totalExpenses)}</p>
                </div>

                {/* Income Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-gray-800 text-center mb-4">Ingresos por Categoría</h2>
                    {incomeChartData.values.length > 0 ? (
                        <ExpenseChart data={incomeChartData} />
                    ) : <p className="text-center text-gray-500 py-8">No hay datos de ingresos en este rango de fechas.</p>}
                    <p className="text-2xl font-bold text-gray-800 text-center mt-4">Total de Ingresos: {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(totalIncome)}</p>
                </div>
            </div>

            {/* Historical Bar Chart Section */}
            <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
                <h2 className="text-xl font-bold text-gray-800 text-center mb-4">Ingresos vs Egresos Históricos</h2>
                {formattedHistoricalData.length > 0 ? (
                    <HistoricalBarChart data={formattedHistoricalData} title="" />
                ) : <p className="text-center text-gray-500 py-8">No hay datos históricos disponibles.</p>}
            </div>

            {/* Historical Data Filter */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-8 flex items-center gap-4">
                <h2 className="text-base font-semibold text-gray-700">Histórico por:</h2>
                <button onClick={() => setFilterPeriod('daily')} className={`px-4 py-2 text-sm rounded-full cursor-pointer transition-colors ${filterPeriod === 'daily' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Día</button>
                <button onClick={() => setFilterPeriod('weekly')} className={`px-4 py-2 text-sm rounded-full cursor-pointer transition-colors ${filterPeriod === 'weekly' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Semana</button>
                <button onClick={() => setFilterPeriod('monthly')} className={`px-4 py-2 text-sm rounded-full cursor-pointer transition-colors ${filterPeriod === 'monthly' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Mes</button>
            </div>

            {/* Details Table */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginTop: '20px' }}>
                <h2 style={{ color: '#374151', textAlign: 'center', marginBottom: '15px' }}>Detalle de Movimientos ({movements.length} gastos)</h2>
                {movements.length > 0 ? (
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {movements.map(mov => (
                            <div key={mov.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', padding: '10px 15px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '10px' }}>
                                <div>
                                    <p style={{ margin: 0, fontWeight: 'bold', color: '#1f2937' }}>{mov.categoria}</p>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#6b7280' }}>
                                        {mov.cuentas?.nombre || 'Cuenta eliminada'} - {new Date(mov.fecha).toLocaleString('es-PE', { day:'2-digit', month:'2-digit', year:'numeric' })}
                                    </p>
                                </div>
                                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: '#ef4444' }}>
                                - {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(mov.monto)}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : <p style={{textAlign: 'center'}}>No hay movimientos de gastos registrados en este rango de fechas.</p>}
            </div>
        </>
      )}
    </div>
  );
}