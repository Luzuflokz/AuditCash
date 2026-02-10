'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast'; // Importar toast

// Definición de categorías fijas para las metas (se asume que es la misma que en AddGoalModal)
const GOAL_CATEGORIES = [
  'Viajes',
  'Tecnología',
  'Hogar',
  'Vehículo',
  'Educación',
  'Salud',
  'Regalos',
  'Inversión',
  'Fondo de Emergencia',
  'Otros',
];

type SavingGoal = {
  id: string;
  nombre_meta: string;
  monto_objetivo: number;
  categoria: string | null;
  fecha_limite: string | null;
};

type EditGoalModalProps = {
  goal: SavingGoal | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (id: string, name: string, target: number, category: string, deadline: string | null) => Promise<void>;
};

const EditGoalModal = ({ goal, isSubmitting, onClose, onSave }: EditGoalModalProps) => {
  const [name, setName] = useState('');
  const [target, setTarget] = useState<number | ''>(''); // Permitir cadena vacía para resetear
  const [category, setCategory] = useState(GOAL_CATEGORIES[0]); // Usar select
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (goal) {
      setName(goal.nombre_meta);
      setTarget(goal.monto_objetivo);
      setCategory(goal.categoria || GOAL_CATEGORIES[0]); // Si no hay categoría, usar la primera por defecto
      setDeadline(goal.fecha_limite ? new Date(goal.fecha_limite).toISOString().split('T')[0] : '');
    }
  }, [goal]);

  if (!goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Ajustar validación
    if (!name || target === '' || Number(target) <= 0 || !category) {
        toast.error('Por favor, completa todos los campos requeridos (Nombre, Monto Objetivo, Categoría) y asegúrate de que el monto sea mayor que cero.');
        return;
    }
    await onSave(goal.id, name, Number(target), category, deadline || null);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Editar Meta de Ahorro</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="Nombre" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" 
          />
          
          {/* Categoría como select */}
          <select 
            value={category} 
            onChange={e => setCategory(e.target.value)} 
            required 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            {GOAL_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <input 
            type="number" 
            step="0.01" 
            placeholder="Monto Objetivo" 
            value={target} 
            onChange={e => setTarget(e.target.value === '' ? '' : parseFloat(e.target.value))} 
            required 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" 
          />
          
          <div>
            <label htmlFor="edit-deadline" className="block text-sm font-medium text-gray-700 mb-1">Fecha Límite (Opcional)</label>
            <input 
              id="edit-deadline" 
              type="date" 
              value={deadline} 
              onChange={e => setDeadline(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" 
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
              disabled={isSubmitting} 
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

export default EditGoalModal;