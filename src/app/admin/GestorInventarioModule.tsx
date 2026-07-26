'use client';

import React, { useState, useEffect } from 'react';
import styles from './admin.module.css';

export default function GestorInventarioModule() {
  const [bienes, setBienes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('LIST'); // LIST, CREATE, DETAIL
  const [selectedBien, setSelectedBien] = useState<any>(null);

  // Form states (Create/Edit)
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('Electrónica');
  const [ubicacion, setUbicacion] = useState('');
  const [fechaAdq, setFechaAdq] = useState('');
  const [valor, setValor] = useState('');
  const [notas, setNotas] = useState('');

  // Form states (Maintenance)
  const [mTipo, setMTipo] = useState('PREVENTIVO');
  const [mDesc, setMDesc] = useState('');
  const [mFechaProg, setMFechaProg] = useState('');
  const [mResp, setMResp] = useState('');

  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => {
    loadBienes();
  }, [filtroCategoria, filtroEstado]);

  const loadBienes = async () => {
    setLoading(true);
    let url = '/api/bienes?';
    if (filtroCategoria) url += `categoria=${filtroCategoria}&`;
    if (filtroEstado) url += `estado=${filtroEstado}&`;
    const res = await fetch(url);
    if (res.ok) {
      setBienes(await res.json());
    }
    setLoading(false);
  };

  const loadBienDetail = async (id: string) => {
    const res = await fetch('/api/bienes?');
    if (res.ok) {
      const all = await res.json();
      const b = all.find((x:any) => x.id === id);
      if (b) setSelectedBien(b);
    }
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/bienes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, descripcion, categoria, ubicacion, fecha_adquisicion: fechaAdq, valor_estimado: valor, notas })
    });
    if (res.ok) {
      alert("Bien registrado en el inventario.");
      setView('LIST');
      loadBienes();
    }
  };

  const updateEstado = async (id: string, nuevoEstado: string) => {
    if (nuevoEstado === 'DADO_DE_BAJA' && !confirm('¿Estás seguro de dar de baja este equipo?')) return;
    const res = await fetch(`/api/bienes/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    });
    if (res.ok) {
      loadBienDetail(id);
      if (view === 'LIST') loadBienes();
    }
  };

  const addMantenimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/bienes/${selectedBien.id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'crear_mantenimiento', payload: { tipo: mTipo, descripcion: mDesc, fecha_programada: mFechaProg, responsable: mResp }})
    });
    if (res.ok) {
      setMDesc(''); setMFechaProg(''); setMResp('');
      loadBienDetail(selectedBien.id);
    }
  };

  const completeMantenimiento = async (registro_id: string) => {
    const costo = prompt("¿Hubo algún costo de reparación/mantenimiento? (Ingresa el monto o 0)");
    if (costo === null) return;
    
    const res = await fetch(`/api/bienes/${selectedBien.id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'completar_mantenimiento', payload: { registro_id, costo }})
    });
    if (res.ok) {
      loadBienDetail(selectedBien.id);
    }
  };

  const deleteBien = async (id: string) => {
    if(!confirm('Esto borrará todo el historial del bien. ¿Continuar?')) return;
    await fetch(`/api/bienes/${id}`, { method: 'DELETE' });
    setView('LIST');
    loadBienes();
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'ACTIVO': return '#16a34a';
      case 'AVERIADO': return '#ef4444';
      case 'EN_MANTENIMIENTO': return '#f59e0b';
      case 'DADO_DE_BAJA': return '#64748b';
      default: return '#64748b';
    }
  };

  return (
    <div style={{ padding: '0' }}>
      {view === 'LIST' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 className={styles.blockTitle} style={{ margin: 0 }}>📦 Control de Inventario</h2>
              <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>Control de bienes de la iglesia, mantenimiento programado y reportes de averías.</p>
            </div>
            <button onClick={() => {
              setNombre(''); setDescripcion(''); setUbicacion(''); setFechaAdq(''); setValor(''); setNotas(''); setView('CREATE');
            }} style={{ padding: '0.65rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
              + Registrar Bien
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Filtrar por Categoría</label>
              <select value={filtroCategoria} onChange={e=>setFiltroCategoria(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <option value="">Todas las categorías</option>
                <option value="Electrónica">Electrónica (Audio/Video)</option>
                <option value="Mobiliario">Mobiliario</option>
                <option value="Instrumentos">Instrumentos Musicales</option>
                <option value="Vehículos">Vehículos</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Filtrar por Estado</label>
              <select value={filtroEstado} onChange={e=>setFiltroEstado(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <option value="">Todos los estados</option>
                <option value="ACTIVO">Activo</option>
                <option value="AVERIADO">Averiado</option>
                <option value="EN_MANTENIMIENTO">En Mantenimiento</option>
                <option value="DADO_DE_BAJA">Dado de Baja</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p>Cargando inventario...</p>
          ) : bienes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>No hay bienes registrados</h3>
              <p style={{ color: '#94a3b8', margin: 0 }}>Registra tu primer equipo o mobiliario para empezar a gestionarlo.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {bienes.map(b => (
                <div key={b.id} onClick={() => { setSelectedBien(b); setView('DETAIL'); }} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', cursor: 'pointer', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '999px', background: `${getEstadoColor(b.estado)}15`, color: getEstadoColor(b.estado) }}>
                      {b.estado}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{b.categoria}</span>
                  </div>
                  <h3 style={{ margin: '0 0 0.25rem 0', color: '#0f172a' }}>{b.nombre}</h3>
                  <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{b.descripcion || 'Sin descripción'}</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', color: '#475569' }}>
                    <span>📍 Ubicación: <strong>{b.ubicacion || 'N/A'}</strong></span>
                    {b.mantenimientos?.filter((m:any) => m.estado === 'PENDIENTE').length > 0 && (
                      <span style={{ color: '#ef4444', fontWeight: 600, marginTop: '0.5rem' }}>⚠️ Mantenimientos Pendientes!</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === 'CREATE' && (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0', maxWidth: '600px', margin: '0 auto' }}>
          <button onClick={() => setView('LIST')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '1rem', fontWeight: 600 }}>← Volver</button>
          <h2 style={{ marginTop: 0 }}>Registrar Nuevo Bien</h2>
          <form onSubmit={submitCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input required placeholder="Nombre (Ej: Consola de Sonido Yamaha)" value={nombre} onChange={e=>setNombre(e.target.value)} style={{ padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
            <textarea placeholder="Descripción o detalles técnicos..." value={descripcion} onChange={e=>setDescripcion(e.target.value)} style={{ padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', minHeight: '80px' }} />
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <select value={categoria} onChange={e=>setCategoria(e.target.value)} style={{ flex: 1, padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                <option value="Electrónica">Electrónica (Audio/Video)</option>
                <option value="Mobiliario">Mobiliario</option>
                <option value="Instrumentos">Instrumentos Musicales</option>
                <option value="Vehículos">Vehículos</option>
                <option value="Otros">Otros</option>
              </select>
              <input placeholder="Ubicación (Ej: Templo)" value={ubicacion} onChange={e=>setUbicacion(e.target.value)} style={{ flex: 1, padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Fecha de Adquisición</label>
                <input type="date" value={fechaAdq} onChange={e=>setFechaAdq(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Valor Estimado ($)</label>
                <input type="number" step="0.01" placeholder="Ej: 500.00" value={valor} onChange={e=>setValor(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
              </div>
            </div>

            <textarea placeholder="Notas adicionales, seriales, estado inicial..." value={notas} onChange={e=>setNotas(e.target.value)} style={{ padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', minHeight: '80px' }} />
            
            <button type="submit" style={{ padding: '0.75rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginTop: '1rem' }}>Guardar en Inventario</button>
          </form>
        </div>
      )}

      {view === 'DETAIL' && selectedBien && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <button onClick={() => {setView('LIST'); loadBienes();}} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>← Volver</button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select value={selectedBien.estado} onChange={e => updateEstado(selectedBien.id, e.target.value)} style={{ padding: '0.5rem', border: `2px solid ${getEstadoColor(selectedBien.estado)}`, color: getEstadoColor(selectedBien.estado), borderRadius: '8px', fontWeight: 800, background: 'white' }}>
                <option value="ACTIVO">ESTADO: ACTIVO</option>
                <option value="AVERIADO">ESTADO: AVERIADO</option>
                <option value="EN_MANTENIMIENTO">ESTADO: EN MANTENIMIENTO</option>
                <option value="DADO_DE_BAJA">ESTADO: DADO DE BAJA</option>
              </select>
              <button onClick={() => deleteBien(selectedBien.id)} style={{ padding: '0.5rem 1rem', background: 'white', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Eliminar Bien</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
            
            {/* Info Panel */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{selectedBien.categoria}</span>
              <h2 style={{ margin: '0.5rem 0 1rem 0', color: '#0f172a' }}>{selectedBien.nombre}</h2>
              <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '2rem' }}>{selectedBien.descripcion || 'Sin descripción'}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Ubicación</span>
                  <strong style={{ color: '#0f172a' }}>{selectedBien.ubicacion || 'No especificada'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Valor Estimado</span>
                  <strong style={{ color: '#0f172a' }}>{selectedBien.valor_estimado ? `$${selectedBien.valor_estimado}` : 'No definido'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Fecha Adquisición</span>
                  <strong style={{ color: '#0f172a' }}>{selectedBien.fecha_adquisicion ? new Date(selectedBien.fecha_adquisicion).toLocaleDateString() : 'Desconocida'}</strong>
                </div>
                {selectedBien.notas && (
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Notas / Serial</span>
                    <strong style={{ color: '#0f172a' }}>{selectedBien.notas}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Maintenance Panel */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', color: '#0f172a' }}>🛠️ Historial y Mantenimiento</h3>
              
              <form onSubmit={addMantenimiento} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#334155' }}>Registrar Tarea o Reportar Avería</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
                  <select required value={mTipo} onChange={e=>setMTipo(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                    <option value="PREVENTIVO">Mantenimiento Preventivo</option>
                    <option value="REPORTE_AVERIA">Reportar Avería ⚠️</option>
                  </select>
                  <input required placeholder="Descripción del problema o tarea..." value={mDesc} onChange={e=>setMDesc(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem' }}>
                  <input type="date" value={mFechaProg} onChange={e=>setMFechaProg(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                  <input placeholder="Asignado a (Nombre del técnico/persona)" value={mResp} onChange={e=>setMResp(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                  <button type="submit" style={{ padding: '0.5rem 1rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Programar</button>
                </div>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {selectedBien.mantenimientos?.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', marginTop: '1rem' }}>No hay registros de mantenimiento para este equipo.</p>
                ) : (
                  selectedBien.mantenimientos?.map((m: any) => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', borderLeft: `4px solid ${m.estado === 'PENDIENTE' ? '#f59e0b' : '#16a34a'}` }}>
                      <div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px', background: m.tipo === 'REPORTE_AVERIA' ? '#fee2e2' : '#e0f2fe', color: m.tipo === 'REPORTE_AVERIA' ? '#dc2626' : '#0284c7' }}>
                            {m.tipo}
                          </span>
                          <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>{m.estado}</span>
                        </div>
                        <strong style={{ display: 'block', color: '#1e293b', marginBottom: '0.25rem' }}>{m.descripcion}</strong>
                        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                          {m.fecha_programada && `Prog: ${new Date(m.fecha_programada).toLocaleDateString()} • `}
                          {m.responsable && `Resp: ${m.responsable}`}
                        </span>
                        {m.costo !== null && m.costo > 0 && (
                           <span style={{ display: 'block', color: '#0f172a', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.5rem' }}>Costo: ${m.costo}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
                        {m.estado === 'PENDIENTE' && (
                          <button onClick={() => completeMantenimiento(m.id)} style={{ padding: '0.4rem 0.8rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>✓ Completar</button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
