"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FinanzasLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { name: "📊 Dashboard", href: "/admin/finanzas" },
    { name: "🟢 Entradas (Diezmos/Ofrendas)", href: "/admin/finanzas/ingresos" },
    { name: "🔴 Salidas (Gastos/Egresos)", href: "/admin/finanzas/gastos" },
    { name: "📅 Presupuestos", href: "/admin/finanzas/presupuesto" },
    { name: "🏦 Cuentas (Bancos/Cajas)", href: "/admin/finanzas/caja-bancos" },
    { name: "📋 Reportes y Balances", href: "/admin/finanzas/reportes" },
    { name: "🔎 Auditoría", href: "/admin/finanzas/auditoria" },
  ];

  return (
    <div style={{ display: 'flex', gap: '2rem', minHeight: 'calc(100vh - 120px)', alignItems: 'flex-start' }}>
      {/* Lateral Sidebar for Finanzas */}
      <aside style={{
        width: '260px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '1.25rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        flexShrink: 0,
        position: 'sticky',
        top: '20px'
      }}>
        <div style={{ padding: '0 0.5rem 0.75rem 0.5rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>💰 Panel Financiero</h2>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Gestión Contable y Auditoría</span>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {menuItems.map((item) => {
            // Match exact path for dashboard, and prefix path for other modules
            const isActive = item.href === "/admin/finanzas" 
              ? pathname === "/admin/finanzas"
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#0284c7' : '#475569',
                  backgroundColor: isActive ? '#eff6ff' : 'transparent',
                  transition: 'all 0.2s ease',
                  border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
                  cursor: 'pointer'
                }}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Page Content area */}
      <main style={{ flexGrow: 1, minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
