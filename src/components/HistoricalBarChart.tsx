'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
// No se necesita importar useEffect si no se usa aquí

// Registrar los elementos de Chart.js una vez a nivel de módulo
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface HistoricalDataPoint {
  label: string;
  income: number;
  expenses: number;
}

interface HistoricalBarChartProps {
  data: HistoricalDataPoint[];
  title: string;
}

// ... (resto del código del componente) ...

const HistoricalBarChart = ({ data, title }: HistoricalBarChartProps) => {
  // El useEffect que registraba los elementos se elimina
  const labels = data.map(dp => dp.label);
  const incomeData = data.map(dp => dp.income);
  const expensesData = data.map(dp => dp.expenses);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Ingresos',
        data: incomeData,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Egresos',
        data: expensesData,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: title,
        font: {
          size: 16
        }
      },
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: string | number) {
            return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(Number(value));
          }
        }
      }
    }
  };

  return (
    <div style={{ position: 'relative', height: '400px', width: '100%' }}>
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
};

export default HistoricalBarChart;
