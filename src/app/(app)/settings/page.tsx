'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Importar Link
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import toast, { Toaster } from 'react-hot-toast';
import DinoGame from '@/components/DinoGame';

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [newName, setNewName] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [hasInteractedWithNewName, setHasInteractedWithNewName] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for submission lock

  // Easter Egg states for DinoGame
  const [dinoGameActivated, setDinoGameActivated] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const EASTER_EGG_THRESHOLD = 5; // Clicks needed to activate the game

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
      }
    };
    getUser();
  }, [supabase, router]);

  useEffect(() => {
    if (user && !hasInteractedWithNewName) {
      setNewName(user.user_metadata?.full_name || user.email || '');
    }
  }, [user, hasInteractedWithNewName]);

  const handleTitleClick = () => {
    setClickCount(prevCount => {
      const newCount = prevCount + 1;
      if (newCount >= EASTER_EGG_THRESHOLD) {
        setDinoGameActivated(true);
        return 0; // Reset count after activation
      }
      return newCount;
    });
  };

  const handleChangeName = async (e: React.FormEvent) => { // Make function async
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true); // Set submitting state

    try {
      const { error } = await supabase.auth.updateUser({ // Await the update operation
        data: { full_name: newName }
      });

      if (error) {
        console.error('Error al actualizar el nombre:', error);
        toast.error(`Error al actualizar el nombre: ${error.message}`);
      } else {
        toast.success('Nombre actualizado con éxito. La página se recargará...');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error('Error inesperado al actualizar el nombre:', error);
      toast.error('Ocurrió un error inesperado al actualizar el nombre.');
    } finally {
      setIsSubmitting(false); // Reset submitting state
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      toast.loading('Eliminando tus datos...');
      const response = await fetch('/api/delete-user-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ userId: user.id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar la cuenta.');
      }

      toast.dismiss();
      toast.success('Tu cuenta y todos tus datos han sido eliminados.');
      await supabase.auth.signOut();
      router.push('/login');

    } catch (error: any) {
      toast.dismiss();
      toast.error(`Error al eliminar la cuenta: ${error.message}`);
    } finally {
      setShowDeleteConfirmation(false);
    }
  };

  if (!user) return (
    <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-700">
        <p className="text-lg">Por favor, <Link href="/login" className="text-indigo-600 hover:underline">inicia sesión</Link> para ver tus configuraciones.</p>
    </div>
  );

  return (
    <div className="w-full space-y-8 p-4">
      <Toaster />
      <h1 
        className="text-2xl font-bold text-gray-800 mb-8"
        onClick={handleTitleClick}
        title="Haz clic para activar un secreto..."
      >
        Configuración de Usuario
      </h1>
      
      {/* Sección de Información de Perfil */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Información de Perfil</h2>
        <div className="space-y-2 text-gray-700">
          <p><strong>Email:</strong> {user.email}</p>
          {user.created_at && (
            <p><strong>Miembro desde:</strong> {new Date(user.created_at).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          )}
          {user.user_metadata?.full_name && (
            <p><strong>Nombre completo:</strong> {user.user_metadata.full_name}</p>
          )}
        </div>
      </div>

      {/* Sección para cambiar nombre */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Cambiar Nombre</h2>
        <form onSubmit={handleChangeName} className="space-y-4">
          <div>
            <input
              type="text"
              id="name"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setHasInteractedWithNewName(true);
              }}
              placeholder="Introduce tu nuevo nombre"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            disabled={!newName.trim() || newName.trim() === (user.user_metadata?.full_name || user.email) || isSubmitting}
          >
            Guardar Nombre
          </button>
        </form>
      </div>

      {/* Sección para borrar data */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Borrar Todos Mis Datos</h2>
        <p className="mb-4 text-gray-700">Ten cuidado: Esta acción es irreversible y eliminará toda tu información de la aplicación.</p>
        <button
          onClick={() => setShowDeleteConfirmation(true)}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 cursor-pointer"
        >
          Eliminar Mi Cuenta y Datos
        </button>
      </div>

      {dinoGameActivated && <DinoGame />}
    

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-gray-800 max-w-md w-full space-y-6">
            <h3 className="text-xl font-bold text-red-600">Confirmación de Eliminación</h3>
            <p className="text-gray-700">Estás a punto de eliminar tu cuenta y todos los datos asociados. Esta acción es **irreversible**.</p>
            <p className="text-gray-700">¿Estás absolutamente seguro de que deseas continuar?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-md font-semibold transition-colors duration-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md font-semibold transition-colors duration-200 cursor-pointer"
              >
                Sí, Eliminar Mi Cuenta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}