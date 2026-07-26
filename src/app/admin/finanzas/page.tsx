"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function FinanzasDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finanzas/dashboard');
      const json = await res.json();
      if (!json.error) {
        setData(json);
      }
    } catch (e) {
      console.error("Error loading dashboard metrics", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #f3f4f6', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>Cargando métricas consolidadas...</span>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin { to { transform: rotate(360deg); } }
        `}} />
      </div>
    );
  }

  const { resumen, kpi, paymentMethods, chartData, proyectos } = data ?? {
    resumen: { hoy: 0, semana: 0, mes: 0, anio: 0 },
    kpi: { diezmos: 0, ofrendas: 0, donaciones: 0, gastos: 0, saldo: 0, bancos: 0, cajaChica: 0, presupuestoEjecutado: 0, presupuestoAsignado: 0 },
    paymentMethods: { EFECTIVO: 0, TRANSFERENCIA: 0, TARJETA: 0, CHEQUE: 0, OTRO: 0 },
    chartData: [],
    proyectos: []
  };

  // Safe division helper
  const getPercentage = (value: number, total: number) => {
    if (!total || total <= 0) return 0;
    return Math.round((value / total) * 100);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em' }}>Dashboard Financiero</h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '0.15rem' }}>Resumen ejecutivo del estado financiero y distribución de recursos en tiempo real.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link
            href="/admin/finanzas/ingresos"
            style={{
              padding: '0.6rem 1.2rem',
              background: '#10b981',
              color: 'white',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 700,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#10b981')}
          >
            🟢 Nueva Entrada (Ingreso)
          </Link>
          <Link
            href="/admin/finanzas/gastos"
            style={{
              padding: '0.6rem 1.2rem',
              background: '#ef4444',
              color: 'white',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 700,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
          >
            🔴 Nueva Salida (Gasto)
          </Link>
          <button 
            onClick={fetchData}
            style={{
              padding: '0.6rem 1.2rem',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#475569',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#f8fafc')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#ffffff')}
          >
            🔄 Sincronizar
          </button>
        </div>
      </div>

      {/* KPI Cards: Resumen de Tiempos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {[
          { label: "Recibido Hoy", amount: resumen.hoy, color: "#10b981", bg: "rgba(16, 185, 129, 0.08)" },
          { label: "Esta Semana", amount: resumen.semana, color: "#0284c7", bg: "rgba(2, 132, 199, 0.08)" },
          { label: "Este Mes", amount: resumen.mes, color: "#7c3aed", bg: "rgba(124, 58, 237, 0.08)" },
          { label: "Este Año", amount: resumen.anio, color: "#b45309", bg: "rgba(217, 119, 6, 0.08)" }
        ].map((item) => (
          <div 
            key={item.label} 
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ width: '4px', height: '100%', background: item.color, position: 'absolute', left: 0, top: 0 }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em' }}>
              ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.72rem', background: item.bg, color: item.color, padding: '2px 8px', borderRadius: '20px', alignSelf: 'flex-start', fontWeight: 700, marginTop: '0.25rem' }}>
              Ingresos reales
            </div>
          </div>
        ))}
      </div>

      {/* Main KPI Accounts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          { label: "Total Diezmos", val: kpi.diezmos, icon: "📖", color: "#0284c7" },
          { label: "Total Ofrendas", val: kpi.ofrendas, icon: "🤝", color: "#10b981" },
          { label: "Donaciones", val: kpi.donaciones, icon: "🎁", color: "#06b6d4" },
          { label: "Total Gastos", val: kpi.gastos, icon: "💸", color: "#ef4444" },
          { label: "Saldo Disponible", val: kpi.saldo, icon: "💰", color: kpi.saldo >= 0 ? "#10b981" : "#ef4444" },
          { label: "Saldos Bancarios", val: kpi.bancos, icon: "🏦", color: "#4f46e5" },
          { label: "Caja Chica", val: kpi.cajaChica, icon: "🪙", color: "#d97706" }
        ].map((item) => (
          <div key={item.label} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{item.label}</span>
              <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
            </div>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: item.color }}>
              ${item.val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>

      {/* Visual Analytics and Projects Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        
        {/* Chart: Ingresos vs Egresos */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem' }}>📈 Comparativo Mensual — Ingresos vs Gastos</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {chartData.map((d: any) => {
              const maxVal = Math.max(...chartData.map((item: any) => Math.max(item.ingresos, item.gastos)), 1);
              const ingPct = (d.ingresos / maxVal) * 100;
              const gasPct = (d.gastos / maxVal) * 100;
              
              return (
                <div key={d.mes} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', width: '60px', flexShrink: 0 }}>
                    {d.mes}
                  </span>
                  
                  <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {/* Ingresos bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ height: '10px', width: `${Math.max(ingPct, 2)}%`, background: 'linear-gradient(to right, #0284c7, #38bdf8)', borderRadius: '4px' }} />
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0284c7' }}>
                        ${d.ingresos.toLocaleString()}
                      </span>
                    </div>
                    {/* Egresos bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ height: '10px', width: `${Math.max(gasPct, 2)}%`, background: 'linear-gradient(to right, #ef4444, #fca5a5)', borderRadius: '4px' }} />
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ef4444' }}>
                        ${d.gastos.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', justifyContent: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#0284c7' }} />
              Ingresos Totales
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ef4444' }} />
              Gastos / Egresos
            </div>
          </div>
        </div>

        {/* Chart: Distribution and Budget Exec */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>📊 Presupuesto Anual Ejecutado</h3>
            <p style={{ color: '#64748b', fontSize: '0.78rem' }}>Control global de gastos sobre el límite asignado para el año actual.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
              <span>Ejecución Presupuestaria</span>
              <span>{getPercentage(kpi.presupuestoEjecutado, kpi.presupuestoAsignado)}%</span>
            </div>
            <div style={{ height: '16px', background: '#f1f5f9', borderRadius: '8px', overflow: 'hidden', display: 'flex', border: '1px solid #e2e8f0' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(getPercentage(kpi.presupuestoEjecutado, kpi.presupuestoAsignado), 100)}%`,
                background: getPercentage(kpi.presupuestoEjecutado, kpi.presupuestoAsignado) > 90 ? '#ef4444' : 'linear-gradient(to right, #0284c7, #10b981)',
                borderRadius: '8px',
                transition: 'width 0.6s ease'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
              <span>Gastado: ${kpi.presupuestoEjecutado.toLocaleString()}</span>
              <span>Límite: ${kpi.presupuestoAsignado.toLocaleString()}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>💳 Canales y Métodos de Pago</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.entries(paymentMethods).map(([method, val]: any) => {
                const totalM = Object.values(paymentMethods).reduce((a: any, b: any) => a + b, 0) as number;
                const pct = getPercentage(val, totalM);
                
                return (
                  <div key={method}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>
                      <span style={{ textTransform: 'capitalize' }}>{method.toLowerCase()}</span>
                      <span>${val.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#6366f1', borderRadius: '3px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Projects Progress panel */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>🏗️ Proyectos Especiales y Campañas Activas</h3>
        
        {proyectos.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>No hay proyectos especiales configurados aún.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {proyectos.map((p: any) => {
              const pct = getPercentage(p.recaudado, p.meta);
              
              return (
                <div key={p.id} style={{ border: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{p.nombre}</h4>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{p.descripcion || 'Sin descripción'}</span>
                    </div>
                    <span style={{
                      fontSize: '0.72rem',
                      background: p.estado === 'ACTIVO' ? '#dcfce7' : '#f3f4f6',
                      color: p.estado === 'ACTIVO' ? '#15803d' : '#475569',
                      padding: '1px 6px',
                      borderRadius: '6px',
                      fontWeight: 700
                    }}>
                      {p.estado}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                      <span>Avance de Recaudación</span>
                      <span>{pct}%</span>
                    </div>
                    <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: 'linear-gradient(to right, #06b6d4, #0891b2)', borderRadius: '4px' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Meta</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>${p.meta.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Recaudado</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803d' }}>${p.recaudado.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Gastado</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ef4444' }}>${p.gastado.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
