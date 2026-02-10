'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast'; // Importar toast

// Definición de categorías fijas (se asume que es la misma que en AddBudgetModal y AddGoalModal)
const GASTOS_CATEGORIES = ['Alimentos', 'Transporte', 'Vivienda', 'Entretenimiento', 'Servicios', 'Ropa', 'Educación', 'Salud', 'Deudas', 'Otros Gastos'];


type Budget = {
  id: string;
  mes: string;
  categoria: string;
  monto_presupuestado: number;
};

type EditBudgetModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  budget: Budget | null;
  categories: string[]; // Nueva prop: categorías disponibles
  onClose: () => void;
  onSave: (id: string, monto: number, categoria: string) => Promise<void>; // onSave ahora espera la categoría
};

const EditBudgetModal = ({ isOpen, isSubmitting, budget, categories, onClose, onSave }: EditBudgetModalProps) => {
  const [monto, setMonto] = useState<number | ''>(''); // Permitir cadena vacía
  const [categoria, setCategoria] = useState(''); // Estado para la categoría

  useEffect(() => {
    if (budget) {
      setMonto(budget.monto_presupuestado);
      setCategoria(budget.categoria); // Inicializar con la categoría del presupuesto
    } else {
      setMonto('');
      setCategoria(categories[0] || ''); // Por defecto la primera categoría si no hay presupuesto
    }
  }, [budget, categories]); // Depende de budget y categories

  if (!isOpen || !budget) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (monto === '' || Number(monto) <= 0 || !categoria) { // Validar también la categoría
      toast.error('Por favor, completa todos los campos y asegúrate de que el monto sea positivo.');
      return;
    }
    await onSave(budget.id, Number(monto), categoria); // Pasar la categoría a onSave
    onClose();
  };

  const isFormInvalid = monto === '' || Number(monto) <= 0 || !categoria;


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Editar Presupuesto para "{budget.categoria}"</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="edit-budget-category" className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              id="edit-budget-category"
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
            <label htmlFor="edit-budget-amount" className="block text-sm font-medium text-gray-700 mb-1">
              Nuevo Monto Presupuestado
            </label>
            <input
              type="number"
              id="edit-budget-amount"
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
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBudgetModal;