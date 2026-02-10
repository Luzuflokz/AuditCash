'use client';

import { useState, useEffect } from 'react';
import { FaArrowRight, FaMoneyBillWave, FaCreditCard, FaPaypal, FaUniversity, FaWallet, FaHandHoldingUsd, FaCoins, FaMobileAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';

type Account = {
  id: string;
  nombre: string;
  saldo_actual: number;
  color_hex: string;
};

type AddTransferModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  accounts: Account[];
  onClose: () => void;
  onSave: (fromAccountId: string, toAccountId: string, amount: number) => Promise<void>;
};

const getIconComponentForAccount = (name: string) => {
    const lowerCaseName = name.toLowerCase();
    if (lowerCaseName.includes('yape')) return <FaMobileAlt size={60} />;
    if (lowerCaseName.includes('bcp') || lowerCaseName.includes('interbank') || lowerCaseName.includes('bbva') || lowerCaseName.includes('scotiabank')) return <FaUniversity size={60} />;
    if (lowerCaseName.includes('efectivo')) return <FaMoneyBillWave size={60} />;
    if (lowerCaseName.includes('paypal')) return <FaPaypal size={60} />;
    if (lowerCaseName.includes('crédito')) return <FaCreditCard size={60} />;
    if (lowerCaseName.includes('ahorros')) return <FaCoins size={60} />;
    if (lowerCaseName.includes('inversiones')) return <FaHandHoldingUsd size={60} />;
    return <FaWallet size={60} />;
};

const AddTransferModal = ({ isOpen, isSubmitting, accounts, onClose, onSave }: AddTransferModalProps) => {
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');

  useEffect(() => {
    if (isOpen && accounts.length >= 2) {
      if (!fromAccountId || !accounts.some(acc => acc.id === fromAccountId)) {
        setFromAccountId(accounts[0].id);
      }
      if (!toAccountId || toAccountId === fromAccountId || !accounts.some(acc => acc.id === toAccountId)) {
        const potentialToAcc = accounts.find(acc => acc.id !== fromAccountId);
        if (potentialToAcc) {
          setToAccountId(potentialToAcc.id);
        } else {
          setToAccountId('');
        }
      }
    } else if (isOpen) {
      setFromAccountId('');
      setToAccountId('');
    }
  }, [isOpen, accounts, fromAccountId]);

  useEffect(() => {
    if (isOpen && fromAccountId === toAccountId && accounts.length >= 2) {
      const potentialToAcc = accounts.find(acc => acc.id !== fromAccountId);
      if (potentialToAcc) {
        setToAccountId(potentialToAcc.id);
      } else {
        setToAccountId('');
      }
    }
  }, [fromAccountId, toAccountId, accounts, isOpen]);


  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccountId || !toAccountId || amount === '' || Number(amount) <= 0) {
      toast.error('Completa todos los campos con valores válidos.');
      return;
    }
    if (fromAccountId === toAccountId) {
      toast.error('Las cuentas de origen y destino no pueden ser la misma.');
      return;
    }
    const fromAccount = accounts.find(acc => acc.id === fromAccountId);
    if (!fromAccount || fromAccount.saldo_actual < Number(amount)) {
      toast.error('Saldo insuficiente en la cuenta de origen.');
      return;
    }

    await onSave(fromAccountId, toAccountId, Number(amount));
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Realizar Transferencia</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative p-4 rounded-lg border bg-gray-50" style={{ borderColor: accounts.find(acc => acc.id === fromAccountId)?.color_hex || '#d1d5db' }}>
                <div className="absolute inset-0 flex items-center justify-center opacity-50 pointer-events-none text-gray-400">
                    {accounts.find(acc => acc.id === fromAccountId) && getIconComponentForAccount(accounts.find(acc => acc.id === fromAccountId)?.nombre || '')}
                </div>
                <div className="relative z-10">
                    <label htmlFor="fromAccount" className="block text-sm font-medium text-gray-700 mb-1">Desde:</label>
                    <select id="fromAccount" value={fromAccountId} onChange={e => setFromAccountId(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.nombre}</option>)}
                    </select>
                </div>
            </div>
            <div className="relative p-4 rounded-lg border bg-gray-50" style={{ borderColor: accounts.find(acc => acc.id === toAccountId)?.color_hex || '#d1d5db' }}>
                <div className="absolute inset-0 flex items-center justify-center opacity-50 pointer-events-none text-gray-400">
                    {accounts.find(acc => acc.id === toAccountId) && getIconComponentForAccount(accounts.find(acc => acc.id === toAccountId)?.nombre || '')}
                </div>
                <div className="relative z-10">
                    <label htmlFor="toAccount" className="block text-sm font-medium text-gray-700 mb-1">Hacia:</label>
                    <select id="toAccount" value={toAccountId} onChange={e => setToAccountId(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                        {accounts.filter(acc => acc.id !== fromAccountId).map(acc => <option key={acc.id} value={acc.id}>{acc.nombre}</option>)}
                    </select>
                </div>
            </div>
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Monto:</label>
            <input type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors cursor-pointer font-semibold">Cancelar</button>
            <button type="submit" disabled={isSubmitting || accounts.length < 2} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-semibold">
              {isSubmitting ? 'Transfiriendo...' : 'Transferir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransferModal;