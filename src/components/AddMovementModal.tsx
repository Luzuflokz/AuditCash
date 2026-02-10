'use client';

import { useState, useEffect } from 'react';

import toast from 'react-hot-toast'; // Importar toast

type Account = {
  id: string;
  nombre: string;
};

type AddMovementModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  accounts?: Account[]; // Hacer opcional
  incomeCategories?: string[]; // Hacer opcional
  expenseCategories?: string[]; // Hacer opcional
  onClose: () => void;
  onSave: (data: {
    accountId: string;
    amount: number;
    type: 'ingreso' | 'gasto';
    category: string;
    description: string;
    date: string;
  }) => Promise<void>;
};

const AddMovementModal = ({ 
  isOpen, 
  isSubmitting, 
  accounts = [], // Valor por defecto
  incomeCategories = [], // Valor por defecto
  expenseCategories = [], // Valor por defecto
  onClose, 
  onSave 
}: AddMovementModalProps) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [type, setType] = useState<'ingreso' | 'gasto'>('gasto');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 16));
  const [category, setCategory] = useState('');
  const [description, setDesciption] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setType('gasto');
      setDate(new Date().toISOString().substring(0, 16));
      setDesciption('');
      const defaultAccountId = accounts[0]?.id || '';
      setSelectedAccountId(defaultAccountId);
      // Ensure categories are not empty before accessing [0]
      setCategory(expenseCategories.length > 0 ? expenseCategories[0] : '');
    }
  }, [isOpen, accounts, expenseCategories]);

  useEffect(() => {
    // Ensure categories are not empty before accessing [0]
    setCategory(type === 'ingreso' ? (incomeCategories.length > 0 ? incomeCategories[0] : '') : (expenseCategories.length > 0 ? expenseCategories[0] : ''));
  }, [type, incomeCategories, expenseCategories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || amount === '' || Number(amount) <= 0 || !category) {
        toast.error('Por favor, completa todos los campos requeridos, incluyendo la categoría, y asegúrate de que el monto sea mayor que cero.');
        return;
    }
    await onSave({
      accountId: selectedAccountId,
      amount: Number(amount),
      type,
      category,
      description,
      date,
    });
    // onClose(); // No cerramos aquí, onSave debería manejarlo después de la operación async
  };

  const currentCategories = type === 'ingreso' ? incomeCategories : expenseCategories;
  const isFormInvalid = !selectedAccountId || amount === '' || Number(amount) <= 0 || !category;


  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Registrar Movimiento</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value as 'ingreso' | 'gasto')} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                  <option value="gasto">Gasto</option>
                  <option value="ingreso">Ingreso</option>
              </select>
              <input 
                type="number" 
                step="0.01" 
                placeholder="Monto" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} 
                required 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
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
              {currentCategories && currentCategories.length > 0 ? (
                currentCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)
              ) : (
                <option value="" disabled>No hay categorías disponibles</option>
              )}
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
                disabled={isSubmitting || isFormInvalid || accounts.length === 0} 
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isSubmitting ? 'Registrando...' : 'Registrar'}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMovementModal;
