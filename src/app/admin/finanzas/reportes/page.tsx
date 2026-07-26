"use client";
import { useState, useEffect } from 'react';

export default function ReportesPage() {
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
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '3rem' }}>Generando balances y estados financieros...</p>;
  }

  const { kpi, chartData, proyectos } = data ?? {
    kpi: { diezmos: 0, ofrendas: 0, donaciones: 0, otrosIngresos: 0, gastos: 0, saldo: 0, bancos: 0, cajaChica: 0, presupuestoEjecutado: 0, presupuestoAsignado: 0 },
    chartData: [],
    proyectos: []
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const rows = [
      ["Categoria", "Monto (USD)"],
      ["Diezmos Recibidos", kpi.diezmos],
      ["Ofrendas Recibidas", kpi.ofrendas],
      ["Donaciones Recibidas", kpi.donaciones],
      ["Otros Ingresos (Conceptos)", kpi.otrosIngresos || 0],
      ["Total Ingresos", kpi.diezmos + kpi.ofrendas + kpi.donaciones + (kpi.otrosIngresos || 0)],
      ["Total Egresos (Gastos)", kpi.gastos],
      ["Saldo Neto Disponible", kpi.saldo]
    ];

    let csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_Financiero_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="print-area" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          #print-area { width: 100% !important; padding: 0 !important; }
        }
      `}} />

      {/* Header */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em' }}>Generador de Reportes</h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '0.15rem' }}>Genera y exporta balances generales, estados de resultados y flujos de efectivo.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={handleExportCSV}
            style={{ padding: '0.55rem 1.1rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', color: '#475569', cursor: 'pointer' }}
          >
            Exportar CSV
          </button>
          <button 
            onClick={handlePrint}
            style={{ padding: '0.55rem 1.1rem', background: '#0284c7', color: 'white', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', border: 'none', cursor: 'pointer' }}
          >
            🖨️ Imprimir PDF
          </button>
        </div>
      </div>

      {/* State of Results Card */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>IGLECONEXIÓN FINANZAS</h2>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Estado de Resultados Consolidado</span>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Fecha de Emisión: {new Date().toLocaleDateString()}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Ingresos section */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem', borderBottom: '1px solid #bfdbfe', paddingBottom: '0.25rem' }}>1. Ingresos y Recaudaciones</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { name: "Diezmos Miembros", amount: kpi.diezmos },
                { name: "Ofrendas Generales y Especiales", amount: kpi.ofrendas },
                { name: "Donaciones Recibidas", amount: kpi.donaciones },
                { name: "Otros Conceptos de Ingreso", amount: kpi.otrosIngresos || 0 }
              ].map(item => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#334155' }}>
                  <span>{item.name}</span>
                  <span style={{ fontWeight: 600 }}>${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', borderTop: '1px dotted #cbd5e1', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                <span>Subtotal Ingresos</span>
                <span>${(kpi.diezmos + kpi.ofrendas + kpi.donaciones + (kpi.otrosIngresos || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Gastos section */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem', borderBottom: '1px solid #fecaca', paddingBottom: '0.25rem' }}>2. Egresos y Gastos Operativos</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#334155' }}>
                <span>Gastos Operativos, Salarios, Servicios y Mantenimiento</span>
                <span style={{ fontWeight: 600 }}>-${kpi.gastos.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', borderTop: '1px dotted #cbd5e1', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                <span>Subtotal Egresos</span>
                <span>-${kpi.gastos.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Net Balance */}
          <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>Balance Neto Consolidado</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: kpi.saldo >= 0 ? '#10b981' : '#ef4444' }}>
              ${kpi.saldo.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
