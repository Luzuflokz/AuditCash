'use client';

import { useState, useEffect } from 'react';

import toast from 'react-hot-toast'; // Importar toast

type Account = {
  id: string;
  nombre: string;
  saldo_actual: number;
};

type AddLoanModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  accounts: Account[];
  onClose: () => void;
  onSave: (nombrePersona: string, amount: number, note: string | null, accountId: string) => Promise<void>;
};

const AddLoanModal = ({ isOpen, isSubmitting, accounts, onClose, onSave }: AddLoanModalProps) => {
  const [nombrePersona, setNombrePersona] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNombrePersona('');
      setAmount('');
      setNote('');
      setSelectedAccountId(accounts[0]?.id || '');
    }
  }, [isOpen, accounts]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNombrePersona = nombrePersona.trim();
    if (!trimmedNombrePersona) {
      toast.error('El nombre de la persona es requerido y no puede estar vacío.');
      return;
    }
    if (amount === '' || Number(amount) <= 0) {
      toast.error('El monto debe ser un número positivo.');
      return;
    }
    if (!selectedAccountId) {
      toast.error('Debes seleccionar una cuenta asociada.');
      return;
    }

    await onSave(trimmedNombrePersona, Number(amount), note || null, selectedAccountId);
    // onClose(); // Asumimos que onSave gestiona el cierre después de su operación asíncrona
  };

  const isFormInvalid = !nombrePersona.trim() || amount === '' || Number(amount) <= 0 || !selectedAccountId || accounts.length === 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Registrar Nueva Deuda</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="nombrePersona" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Persona
            </label>
            <input
              type="text"
              id="nombrePersona"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={nombrePersona}
              onChange={(e) => setNombrePersona(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Monto de la Deuda
            </label>
            <input
              type="number"
              id="amount"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
              required
              min="0.01"
              step="0.01"
            />
          </div>

          <div>
            <label htmlFor="account" className="block text-sm font-medium text-gray-700 mb-1">
              Cuenta Asociada
            </label>
            <select
              id="account"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              required
              disabled={accounts.length === 0} // Deshabilitar si no hay cuentas
            >
              <option value="" disabled>{accounts.length === 0 ? 'No hay cuentas disponibles' : 'Selecciona una cuenta'}</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.nombre} (Saldo: {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(acc.saldo_actual)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
              Motivo / Nota (Opcional)
            </label>
            <textarea
              id="note"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            ></textarea>
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
              {isSubmitting ? 'Registrando...' : 'Registrar Deuda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLoanModal;
