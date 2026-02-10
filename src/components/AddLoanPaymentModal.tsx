'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast'; // Importar toast

// Definición de tipos localmente para el modal
type Loan = {
  id: string;
  persona_nombre: string;
  monto: number;
  monto_pagado: number;
  pagado: boolean;
};

type Account = {
  id: string;
  nombre: string;
  saldo_actual: number;
};

type AddLoanPaymentModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  loan: Loan | null;
  accounts: Account[];
  onClose: () => void;
  onSave: (loan: Loan, paymentAmount: number, receivingAccountId: string) => Promise<void>;
};

export default function AddLoanPaymentModal({ isOpen, isSubmitting, loan, accounts, onClose, onSave }: AddLoanPaymentModalProps) {
  const [amount, setAmount] = useState<number | ''>('');
  const [receivingAccountId, setReceivingAccountId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      // Seleccionar la primera cuenta disponible por defecto
      setReceivingAccountId(accounts[0]?.id || '');
    }
  }, [isOpen, accounts]);

  if (!isOpen || !loan) return null;

  const remainingAmount = loan.monto - (loan.monto_pagado || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === '' || Number(amount) <= 0) {
      toast.error('El monto del pago debe ser un número positivo.');
      return;
    }
    if (!receivingAccountId) {
        toast.error('Debes seleccionar la cuenta que recibe el dinero.');
        return;
    }

    const paymentValue = Number(amount);

    if (paymentValue > remainingAmount) {
      toast.promise(
        new Promise((resolve, reject) => {
          if (window.confirm(`El monto del pago (${paymentValue}) es mayor que el saldo pendiente (${remainingAmount}). ¿Deseas registrarlo de todas formas?`)) {
            resolve(true);
          } else {
            reject(new Error('Pago cancelado por el usuario.'));
          }
        }),
        {
          loading: 'Esperando confirmación...',
          success: 'Confirmado. Registrando pago...',
          error: 'Operación cancelada.',
        }
      ).then(() => onSave(loan, paymentValue, receivingAccountId))
       .catch((err) => console.log(err.message)); // No hace nada si el usuario cancela
    } else {
      await onSave(loan, paymentValue, receivingAccountId);
    }
  };
  
  const isFormInvalid = amount === '' || Number(amount) <= 0 || !receivingAccountId || accounts.length === 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Registrar Pago a Deuda</h2>
        <p className="text-gray-600 mb-4">Deuda de: <span className="font-bold">{loan.persona_nombre}</span></p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Monto a Pagar
            </label>
            <input
              type="number"
              id="paymentAmount"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
              required
              min="0.01"
              step="0.01"
              max={remainingAmount > 0 ? remainingAmount : undefined} // Sugerencia, el usuario puede sobreescribirlo si `remainingAmount` es 0
            />
            <p className="text-sm text-gray-500 mt-1">
                Pendiente: {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(remainingAmount)}
            </p>
          </div>
          
          <div>
            <label htmlFor="receivingAccount" className="block text-sm font-medium text-gray-700 mb-1">
              Registrar Ingreso en Cuenta
            </label>
            <select
              id="receivingAccount"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              value={receivingAccountId}
              onChange={(e) => setReceivingAccountId(e.target.value)}
              required
              disabled={accounts.length === 0} // Deshabilitar si no hay cuentas
            >
              <option value="" disabled>{accounts.length === 0 ? 'No hay cuentas disponibles' : 'Selecciona una cuenta'}</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.nombre}
                </option>
              ))}
            </select>
            {accounts.length === 0 && (
                <p className="text-sm text-red-600 mt-1">Necesitas tener al menos una cuenta para registrar el pago.</p>
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
              disabled={isSubmitting || isFormInvalid}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isSubmitting ? 'Registrando...' : 'Registrar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
