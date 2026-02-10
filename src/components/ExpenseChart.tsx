'use client';

import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const generateColors = (numColors: number) => {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
        const hue = (i * 360 / numColors) % 360;
        colors.push(`hsla(${hue}, 70%, 60%, 0.8)`);
    }
    return colors;
};

type ChartData = {
    labels: string[];
    values: number[];
    colors?: string[]; // Prop de colores opcional
};

type ExpenseChartProps = {
    data: ChartData;
};

const ExpenseChart = ({ data }: ExpenseChartProps) => {
    
    // Usar los colores pasados o generar nuevos si no se proporcionan
    const backgroundColors = data.colors && data.colors.length >= data.values.length 
        ? data.colors 
        : generateColors(data.values.length);

    const chartData = {
        labels: data.labels,
        datasets: [
            {
                label: 'Monto', // Cambiado de 'Gastos' a 'Monto' para ser más genérico
                data: data.values,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(color => color.replace('0.8', '1')), // Asumiendo que el color de fondo tiene opacidad
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
                labels: {
                    boxWidth: 20,
                    padding: 20,
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        
                        // Usar context.raw para el valor de datos real
                        const currentValue = context.raw; 
                        const numericValue = typeof currentValue === 'number' && !isNaN(currentValue) ? currentValue : 0;

                        if (numericValue !== null) {
                            label += new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(numericValue);
                        }
                        
                        // Recalcular el total usando los valores raw del dataset directamente
                        const total = context.dataset.data.reduce((sum: number, value: number) => {
                            const num = typeof value === 'number' && !isNaN(value) ? value : 0;
                            return sum + num;
                        }, 0);
                        
                        const percentage = total > 0 ? ((numericValue / total) * 100).toFixed(2) : 0;
                        label += ` (${percentage}%)`;
                        return label;
                    }
                }
            },
            title: {
                display: false,
            },
        },
        cutout: '70%',
    };

    return (
        <div style={{ position: 'relative', height: '300px', width: '300px', margin: 'auto' }}>
            <Doughnut data={chartData} options={chartOptions} />
        </div>
    );
};

export default ExpenseChart;