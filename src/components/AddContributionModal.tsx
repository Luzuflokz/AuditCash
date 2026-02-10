'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast'; // Importar toast

type Account = {
  id: string;
  nombre: string;
  saldo_actual: number;
};

type AddContributionModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  accounts: Account[];
  onClose: () => void;
  onSave: (accountId: string, amount: number) => Promise<void>;
  goalTargetAmount: number; // New prop: to determine max contribution
  goalCurrentAmount: number; // New prop: to determine max contribution
};

const AddContributionModal = ({ isOpen, isSubmitting, accounts, onClose, onSave, goalTargetAmount, goalCurrentAmount }: AddContributionModalProps) => {
  const [amount, setAmount] = useState<number | ''>(''); // Changed to allow empty string
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [currentAccountBalance, setCurrentAccountBalance] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  
  // Calculate max amount that can be contributed
  const maxContribution = goalTargetAmount - goalCurrentAmount;

  useEffect(() => {
    // Set default selected account if accounts are loaded
    if (accounts.length > 0) {
      // Only set if no account is selected or if the previously selected one is gone
      if (!selectedAccountId || !accounts.some(acc => acc.id === selectedAccountId)) {
        setSelectedAccountId(accounts[0].id);
      }
    } else {
      setSelectedAccountId(''); // Clear if no accounts
    }
  }, [accounts, selectedAccountId]);

  useEffect(() => {
    const account = accounts.find(acc => acc.id === selectedAccountId);
    const currentAmount = typeof amount === 'number' ? amount : 0; // Handle empty string
    if (account) {
      setCurrentAccountBalance(account.saldo_actual);
      setRemainingBalance(account.saldo_actual - currentAmount);
    } else {
      setCurrentAccountBalance(0);
      setRemainingBalance(0 - currentAmount);
    }
  }, [selectedAccountId, amount, accounts]);


  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || amount === '' || Number(amount) <= 0) { // Check for empty string
        toast.error('Por favor, selecciona una cuenta y un monto válido mayor a cero.');
        return;
    }
    await onSave(selectedAccountId, amount);
    setAmount(''); // Reset amount after saving
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Aportar a Meta</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="account" className="block text-sm font-medium text-gray-700 mb-1">Desde la Cuenta</label>
            <select 
                id="account"
                value={selectedAccountId} 
                onChange={(e) => setSelectedAccountId(e.target.value)} 
                required 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
                <option value="" disabled>Selecciona una cuenta</option>
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.nombre} ({new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(acc.saldo_actual)})</option>)}
            </select>
            {selectedAccountId && (
                <p className="text-sm text-gray-600 mt-1">
                    Saldo actual: {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(currentAccountBalance)}
                </p>
            )}
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Monto a Aportar</label>
            <input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} // Handle empty string
              max={maxContribution} // Limit max input
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {amount !== '' && typeof amount === 'number' && amount > 0 && ( // Display only if not empty and > 0
                <p className={`text-sm mt-1 ${remainingBalance < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    Te quedaría en la cuenta: {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(remainingBalance)}
                </p>
            )}
            {amount !== '' && typeof amount === 'number' && amount > maxContribution && (
                <p className="text-sm mt-1 text-red-600">
                    Máximo a aportar: {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(maxContribution)}
                </p>
            )}
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
              disabled={isSubmitting || (typeof amount === 'number' && (amount <= 0 || amount > maxContribution)) || amount === '' || accounts.length === 0} 
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isSubmitting ? 'Aportando...' : 'Aportar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContributionModal;
