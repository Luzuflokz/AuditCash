'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast'; // Importar toast

type AddBudgetModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  categories: string[]; // Lista de categorías disponibles
  defaultMonth: string; // Mes por defecto (ej. '2026-02')
  onClose: () => void;
  onSave: (data: {
    categoria: string;
    monto: number;
    mes: string; // Añadido el mes
  }) => Promise<void>;
};

const AddBudgetModal = ({ isOpen, isSubmitting, categories, defaultMonth, onClose, onSave }: AddBudgetModalProps) => {
  // Estados del formulario
  const [categoria, setCategoria] = useState(categories[0] || '');
  const [monto, setMonto] = useState<number | ''>('');
  const [mes, setMes] = useState(defaultMonth);

  // Efecto para resetear el formulario cuando se abre
  useEffect(() => {
    if (isOpen) {
      setCategoria(categories[0] || '');
      setMonto('');
      setMes(defaultMonth);
    }
  }, [isOpen, defaultMonth, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (monto === '' || Number(monto) <= 0 || !categoria || !mes) {
      toast.error('Por favor, completa todos los campos y asegúrate de que el monto sea mayor que cero.');
      return;
    }
    await onSave({
      categoria,
      monto: Number(monto),
      mes,
    });
  };

  const isFormInvalid = monto === '' || Number(monto) <= 0 || !categoria || !mes;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Añadir Presupuesto</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div>
            <label htmlFor="budget-month" className="block text-sm font-medium text-gray-700 mb-1">Mes del Presupuesto</label>
            <input
              type="month"
              id="budget-month"
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          <div>
            <label htmlFor="budget-category" className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              id="budget-category"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="budget-amount" className="block text-sm font-medium text-gray-700 mb-1">Monto Presupuestado</label>
            <input
              type="number"
              id="budget-amount"
              step="0.01"
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value === '' ? '' : parseFloat(e.target.value))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors cursor-pointer font-semibold"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || isFormInvalid} 
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isSubmitting ? 'Añadiendo...' : 'Añadir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBudgetModal;