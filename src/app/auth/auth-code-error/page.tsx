export default function AuthCodeError() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md p-8 space-y-4 bg-red-800 text-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center">Error de Autenticación</h1>
        <p className="text-center">Hubo un problema al intentar procesar tu solicitud de autenticación.</p>
        <p className="text-center">Esto puede deberse a un enlace caducado o a un error en el proceso.</p>
        <div className="flex justify-center">
          <a href="/login" className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors duration-200">
            Volver a Iniciar Sesión
          </a>
        </div>
      </div>
    </div>
  );
}