'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast'; // Importar toast

type Account = {
  id: string;
  nombre: string;
  saldo_actual: number;
};

type EditAccountModalProps = {
  account: Account | null;
  onClose: () => void;
  onSave: (id: string, name: string, balance: number) => Promise<void>;
};

const EditAccountModal = ({ account, onClose, onSave }: EditAccountModalProps) => {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState<number | ''>(''); // Permitir cadena vacía para resetear

  useEffect(() => {
    if (account) {
      setName(account.nombre);
      setBalance(account.saldo_actual);
    }
  }, [account]);

  if (!account) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
        toast.error('El nombre de la cuenta no puede estar vacío.');
        return;
    }
    if (balance === '' || Number(balance) < 0) {
        toast.error('El saldo debe ser un número válido y no negativo.');
        return;
    }
    await onSave(account.id, name, Number(balance));
    onClose(); // Cerrar el modal después de guardar
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Editar Cuenta</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="balance" className="block text-sm font-medium text-gray-700 mb-1">Saldo</label>
            <input
              id="balance"
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value === '' ? '' : parseFloat(e.target.value))}
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
              disabled={name.trim() === '' || balance === '' || Number(balance) < 0} // Deshabilitar si la validación falla
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAccountModal;
