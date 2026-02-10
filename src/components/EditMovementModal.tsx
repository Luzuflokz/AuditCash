'use client';


import { useState, useEffect } from 'react';
import toast from 'react-hot-toast'; // Importar toast

type Account = {
  id: string;
  nombre: string;
};

type Movement = {
    id: string;
    cuenta_id: string;
    monto: number;
    tipo: 'ingreso' | 'gasto';
    categoria: string;
    descripcion: string;
    fecha: string;
};

type EditMovementModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  movement: Movement | null;
  accounts: Account[];
  incomeCategories: string[]; // Nueva prop
  expenseCategories: string[]; // Nueva prop
  onClose: () => void;
  onSave: (id: string, data: {
    accountId: string;
    amount: number;
    type: 'ingreso' | 'gasto';
    category: string;
    description: string;
    date: string;
  }) => Promise<void>;
};

const EditMovementModal = ({ isOpen, isSubmitting, movement, accounts, incomeCategories, expenseCategories, onClose, onSave }: EditMovementModalProps) => {
  const [amount, setAmount] = useState<number | ''>(''); // Permitir cadena vacía
  const [type, setType] = useState<'ingreso' | 'gasto'>('gasto');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDesciption] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  useEffect(() => {
    if (movement) {
      setAmount(movement.monto);
      setType(movement.tipo);
      // Format date for datetime-local input: YYYY-MM-DDTHH:mm
      setDate(new Date(movement.fecha).toISOString().substring(0, 16));
      setCategory(movement.categoria);
      setDesciption(movement.descripcion);
      setSelectedAccountId(movement.cuenta_id);
    }
  }, [movement]);

  // Reset category when type changes, or if initial category isn't in current list
  useEffect(() => {
    const currentCategories = type === 'ingreso' ? incomeCategories : expenseCategories;
    if (movement && currentCategories.includes(movement.categoria)) {
      setCategory(movement.categoria);
    } else {
      setCategory(currentCategories[0] || ''); // Default to first available category
    }
  }, [type, incomeCategories, expenseCategories, movement]);


  if (!isOpen || !movement) return null; // También retorna null si no hay movement

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || amount === '' || Number(amount) <= 0 || !category) {
        toast.error('Por favor, completa todos los campos requeridos, incluyendo la categoría, y asegúrate de que el monto sea mayor que cero.');
        return;
    }
    await onSave(movement.id, {
      accountId: selectedAccountId,
      amount: Number(amount),
      type,
      category,
      description,
      date,
    });
    // onClose(); // onSave debería manejar el cierre después de la operación async
  };

  const currentCategories = type === 'ingreso' ? incomeCategories : expenseCategories;
  const isFormInvalid = !selectedAccountId || amount === '' || Number(amount) <= 0 || !category;


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Editar Movimiento</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="type-select" className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select 
                  id="type-select"
                  value={type} 
                  onChange={(e) => setType(e.target.value as 'ingreso' | 'gasto')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                    <option value="gasto">Gasto</option>
                    <option value="ingreso">Ingreso</option>
                </select>
              </div>
              <div>
                <label htmlFor="amount-input" className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                <input 
                  id="amount-input"
                  type="number" 
                  step="0.01" 
                  placeholder="Monto" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} 
                  required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
          </div>
          <div>
            <label htmlFor="account-select" className="block text-sm font-medium text-gray-700 mb-1">Cuenta</label>
            <select 
              id="account-select"
              value={selectedAccountId} 
              onChange={(e) => setSelectedAccountId(e.target.value)} 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="" disabled>Selecciona una cuenta</option>
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.nombre}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="date-time" className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora</label>
            <input 
              id="date-time"
              type="datetime-local" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <div>
            <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select 
              id="category-select"
              value={category} 
              onChange={(e) => setCategory(e.target.value)} 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="" disabled>Selecciona una categoría</option>
              {currentCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="description-input" className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
            <input 
              id="description-input"
              type="text" 
              placeholder="Descripción (opcional)" 
              value={description} 
              onChange={(e) => setDesciption(e.target.value)} 
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

export default EditMovementModal;
