'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast'; // Importar toast

const FIXED_EXPENSE_CATEGORIES = [
  'Alquiler',
  'Hipoteca',
  'Suscripciones',
  'Servicios (Luz, Agua, Internet)',
  'Seguros',
  'Préstamos',
  'Transporte Público',
  'Otros Fijos',
];

type AddFixedExpenseModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (data: {
    nombre: string;
    monto: number;
    dia_pago: number;
    categoria: string;
    activo: boolean;
  }) => Promise<void>;
};

const AddFixedExpenseModal = ({ isOpen, isSubmitting, onClose, onSave }: AddFixedExpenseModalProps) => {
  const [nombre, setNombre] = useState('');
  const [monto, setMonto] = useState<number | ''>('');
  const [diaPago, setDiaPago] = useState<number | ''>('');
  const [categoria, setCategoria] = useState(FIXED_EXPENSE_CATEGORIES[0] || '');
  const [activo, setActivo] = useState(true); // Default to active

  // Reset form fields when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setNombre('');
      setMonto('');
      setDiaPago('');
      setCategoria(FIXED_EXPENSE_CATEGORIES[0] || '');
      setActivo(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || monto === '' || Number(monto) <= 0 || diaPago === '' || Number(diaPago) < 1 || Number(diaPago) > 31 || !categoria) {
        toast.error('Por favor, completa todos los campos requeridos con valores válidos (nombre, monto > 0, día de pago entre 1-31, categoría).');
        return;
    }
    await onSave({
      nombre,
      monto: Number(monto),
      dia_pago: Number(diaPago),
      categoria,
      activo,
    });
  };

  const isFormInvalid = !nombre.trim() || monto === '' || Number(monto) <= 0 || diaPago === '' || Number(diaPago) < 1 || Number(diaPago) > 31 || !categoria;


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Añadir Gasto Fijo</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="expense-name" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input 
              id="expense-name"
              type="text" 
              placeholder="Nombre (ej. Alquiler, Spotify)" 
              value={nombre} 
              onChange={e => setNombre(e.target.value)} 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            />
          </div>
          <div>
            <label htmlFor="expense-amount" className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
            <input 
              id="expense-amount"
              type="number" 
              step="0.01" 
              placeholder="Monto" 
              value={monto} 
              onChange={e => setMonto(e.target.value === '' ? '' : parseFloat(e.target.value))} 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            />
          </div>
          <div>
            <label htmlFor="expense-day" className="block text-sm font-medium text-gray-700 mb-1">Día de Pago (1-31)</label>
            <input 
              id="expense-day"
              type="number" 
              placeholder="Día de pago (ej. 15)" 
              value={diaPago} 
              onChange={e => setDiaPago(e.target.value === '' ? '' : parseInt(e.target.value))} 
              min="1" 
              max="31" 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            />
          </div>
          <div>
            <label htmlFor="expense-category" className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              id="expense-category"
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {FIXED_EXPENSE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="activo" 
              checked={activo} 
              onChange={e => setActivo(e.target.checked)} 
              className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out rounded focus:ring-indigo-500" // Tailwind checkbox styling
            />
            <label htmlFor="activo" className="text-sm font-medium text-gray-700 cursor-pointer">Activo</label>
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

export default AddFixedExpenseModal;
