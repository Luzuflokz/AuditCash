'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast'; // Importar toast

// Definición de categorías fijas para las metas
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

type AddGoalModalProps = {
  isOpen: boolean;
  isSubmitting: boolean; 
  onClose: () => void;
  // El onSave ahora espera 'categoria' para que coincida con SavingsPage
  onSave: (name: string, target: number, categoria: string, deadline: string | null) => Promise<void>;
};

const AddGoalModal = ({ isOpen, isSubmitting, onClose, onSave }: AddGoalModalProps) => {
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState<number | ''>(''); // Cambiado a number | ''
  const [categoria, setCategoria] = useState(GOAL_CATEGORIES[0]); // Por defecto, la primera categoría
  
  // Calcular la fecha actual en formato YYYY-MM-DD
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Meses son 0-11
  const day = String(today.getDate()).padStart(2, '0');
  const defaultDeadline = `${year}-${month}-${day}`;

  const [deadline, setDeadline] = useState(defaultDeadline); // Por defecto la fecha de hoy

  // Efecto para resetear el formulario cuando se abre
  useEffect(() => {
    if (isOpen) {
      setGoalName('');
      setTargetAmount(''); // Limpiar a cadena vacía
      setCategoria(GOAL_CATEGORIES[0]); // Resetear a la primera categoría
      setDeadline(defaultDeadline); // Resetear a la fecha de hoy
    }
  }, [isOpen]); // Depende solo de isOpen para resetear al abrirse

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Ajustar validación
    if (!goalName || targetAmount === '' || Number(targetAmount) <= 0 || !categoria) {
        toast.error('Por favor, completa todos los campos requeridos (Nombre, Monto Objetivo, Categoría) y asegúrate de que el monto sea mayor que cero.');
        return;
    }
    // Convertir targetAmount a número antes de enviar
    await onSave(goalName, Number(targetAmount), categoria, deadline || null); // Usar 'categoria'
    onClose(); // Cerrar el modal después de guardar
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Crear Nueva Meta</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="Nombre (ej. Viaje a Cusco)" 
            value={goalName} 
            onChange={e => setGoalName(e.target.value)} 
            required 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" 
          />
          
          {/* Categoría como select */}
          <select 
            value={categoria} 
            onChange={e => setCategoria(e.target.value)} 
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
            value={targetAmount} 
            onChange={e => setTargetAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} 
            required 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" 
          />
          
          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">Fecha Límite (Opcional)</label>
            <input 
              id="deadline" 
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
              {isSubmitting ? 'Creando...' : 'Crear Meta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGoalModal;
