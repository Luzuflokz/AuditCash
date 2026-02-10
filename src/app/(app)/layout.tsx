import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // Este es el layout para las páginas que están dentro del grupo (app)
  // Mantiene la barra lateral y la estructura principal de la app.
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{
        marginLeft: '240px', // Mismo ancho que el Sidebar
        padding: '20px',
        width: 'calc(100% - 240px)',
        minHeight: '100vh'
      }}>
        {children}
      </main>
    </div>
  );
}
