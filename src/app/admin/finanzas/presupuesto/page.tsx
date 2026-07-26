"use client";
import { useState, useEffect } from 'react';

export default function PresupuestoPage() {
  const [presupuestos, setPresupuestos] = useState<any[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [anio, setAnio] = useState(new Date().getFullYear().toString());
  const [tipo, setTipo] = useState('MINISTERIO');
  const [departamento, setDepartamento] = useState('');
  const [ministerio, setMinisterio] = useState('');
  const [proyectoId, setProyectoId] = useState('');
  const [montoAsignado, setMontoAsignado] = useState('');

  useEffect(() => {
    loadData();
    loadSelectorData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finanzas/presupuesto');
      const json = await res.json();
      if (!json.error) {
        setPresupuestos(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectorData = async () => {
    try {
      const res = await fetch('/api/finanzas/caja-bancos');
      const json = await res.json();
      if (!json.error) {
        setProyectos(json.proyectos || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!montoAsignado || Number(montoAsignado) <= 0) {
      alert("Por favor ingresa un monto asignado válido.");
      return;
    }

    const payload = {
      action: 'crear',
      data: {
        anio: Number(anio),
        departamento: tipo === 'DEPARTAMENTO' ? departamento : null,
        ministerio: tipo === 'MINISTERIO' ? ministerio : null,
        proyecto_id: tipo === 'PROYECTO' ? proyectoId : null,
        monto_asignado: Number(montoAsignado)
      }
    };

    try {
      const res = await fetch('/api/finanzas/presupuesto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resJson = await res.json();
      if (resJson.success) {
        alert("Presupuesto configurado exitosamente.");
        setMontoAsignado('');
        setDepartamento('');
        setMinisterio('');
        loadData();
      } else {
        alert("Error: " + resJson.error);
      }
    } catch (err: any) {
      console.error(err);
      alert("Error de red");
    }
  };

  const getPercentage = (exec: number, total: number) => {
    if (!total || total <= 0) return 0;
    return Math.round((exec / total) * 100);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em' }}>Presupuestos Anuales</h1>
        <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '0.15rem' }}>Asigna y controla los topes presupuestarios anuales por ministerios, departamentos y proyectos especiales.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Form Column */}
        <form onSubmit={handleSubmit} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', margin: 0 }}>Nuevo Límite Presupuestal</h3>

          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Año Fiscal</label>
            <input 
              type="number" 
              value={anio} 
              onChange={e => setAnio(e.target.value)}
              required
              style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Tipo de Presupuesto</label>
            <select 
              value={tipo} 
              onChange={e => setTipo(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }}
            >
              <option value="MINISTERIO">Ministerio</option>
              <option value="DEPARTAMENTO">Departamento</option>
              <option value="PROYECTO">Proyecto Especial</option>
            </select>
          </div>

          {tipo === 'MINISTERIO' && (
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Nombre del Ministerio</label>
              <input 
                type="text" 
                placeholder="Ej: Ministerio Juvenil"
                value={ministerio} 
                onChange={e => setMinisterio(e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {tipo === 'DEPARTAMENTO' && (
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Nombre del Departamento</label>
              <input 
                type="text" 
                placeholder="Ej: Administración / Escuela Bíblica"
                value={departamento} 
                onChange={e => setDepartamento(e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {tipo === 'PROYECTO' && (
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Proyecto Asociado</label>
              <select 
                value={proyectoId} 
                onChange={e => setProyectoId(e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }}
              >
                <option value="">Seleccione proyecto...</option>
                {proyectos.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Monto Asignado (USD)</label>
            <input 
              type="number" 
              placeholder="0.00"
              value={montoAsignado} 
              onChange={e => setMontoAsignado(e.target.value)}
              required
              style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' }}
            />
          </div>

          <button 
            type="submit" 
            style={{
              padding: '0.75rem',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.95rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              marginTop: '0.5rem',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#0369a1'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#0284c7'}
          >
            + Asignar Presupuesto
          </button>
        </form>

        {/* List Column */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', margin: 0 }}>Límites y Ejecución</h3>
          
          {loading ? (
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>Cargando presupuestos...</p>
          ) : presupuestos.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>No hay límites presupuestarios asignados aún.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {presupuestos.map((b) => {
                const name = b.ministerio || b.departamento || b.proyectoNombre || 'General';
                const typeLabel = b.ministerio ? 'Ministerio' : b.departamento ? 'Departamento' : 'Proyecto';
                const pct = getPercentage(b.monto_ejecutado, b.monto_asignado);
                const isAlert = pct > 90;

                return (
                  <div key={b.id} style={{ border: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{name}</h4>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>{typeLabel} — Año {b.anio}</span>
                      </div>
                      
                      {isAlert && (
                        <span style={{
                          fontSize: '0.72rem',
                          background: '#fee2e2',
                          color: '#ef4444',
                          padding: '2px 8px',
                          borderRadius: '20px',
                          fontWeight: 700
                        }}>
                          ⚠️ Alerta de Exceso
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                        <span>Ejecución Presupuestaria</span>
                        <span>{pct}%</span>
                      </div>
                      <div style={{ height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(pct, 100)}%`,
                          background: isAlert ? '#ef4444' : 'linear-gradient(to right, #0284c7, #10b981)',
                          borderRadius: '5px'
                        }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                      <span style={{ color: '#475569', fontWeight: 600 }}>Ejecutado: <strong style={{ color: '#ef4444' }}>${b.monto_ejecutado.toFixed(2)}</strong></span>
                      <span style={{ color: '#475569', fontWeight: 600 }}>Asignado: <strong style={{ color: '#0284c7' }}>${b.monto_asignado.toFixed(2)}</strong></span>
                      <span style={{ color: '#475569', fontWeight: 600 }}>Disponible: <strong style={{ color: '#10b981' }}>${(b.monto_asignado - b.monto_ejecutado).toFixed(2)}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
