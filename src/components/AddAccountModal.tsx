'use client';

import { useState, useEffect } from 'react';

type AddAccountModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  availableNames: string[]; // Receives the filtered list as a prop
  onClose: () => void;
  onSave: (name: string, initialBalance: number) => Promise<void>;
};

const AddAccountModal = ({ isOpen, isSubmitting, availableNames, onClose, onSave }: AddAccountModalProps) => {
  const [accountName, setAccountName] = useState('');
  const [customName, setCustomName] = useState('');
  const [initialBalance, setInitialBalance] = useState<number | ''>('');

  // Set the default selection when the modal opens or the available list changes
  useEffect(() => {
    if (isOpen && availableNames.length > 0) {
      setAccountName(availableNames[0]);
    }
  }, [isOpen, availableNames]);
  
  useEffect(() => {
    if (accountName !== 'Otro') {
      setCustomName('');
    }
  }, [accountName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const finalName = accountName === 'Otro' ? customName : accountName;
    if (!finalName) {
        alert("Por favor, especifica un nombre para la cuenta de tipo 'Otro'.");
        return;
    }
    await onSave(finalName, Number(initialBalance) || 0);
  };

  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
    justifyContent: 'center', alignItems: 'center', zIndex: 1000,
  };

  const modalContentStyle: React.CSSProperties = {
    background: 'white', padding: '25px', borderRadius: '8px',
    width: '90%', maxWidth: '500px',
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0, color: '#1f2937' }}>Añadir Nueva Cuenta</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label htmlFor="accountName" style={{ display: 'block', marginBottom: '5px', color: '#374151' }}>Tipo de Cuenta</label>
            <select
              id="accountName"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            >
              {availableNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {accountName === 'Otro' && (
            <div>
              <label htmlFor="customAccountName" style={{ display: 'block', marginBottom: '5px', color: '#374151' }}>Nombre Personalizado</label>
              <input
                id="customAccountName"
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Escribe el nombre aquí"
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
          )}
          
          <div>
            <label htmlFor="initialBalance" style={{ display: 'block', marginBottom: '5px', color: '#374151' }}>Saldo Inicial</label>
            <input
              id="initialBalance"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value === '' ? '' : parseFloat(e.target.value))}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 15px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: 'transparent', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} style={{ padding: '10px 15px', border: 'none', borderRadius: '6px', backgroundColor: '#4f46e5', color: 'white', cursor: 'pointer' }}>
              {isSubmitting ? 'Añadiendo...' : 'Añadir Cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAccountModal;