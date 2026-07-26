'use client';
import { useState, useEffect } from 'react';
import styles from './admin.module.css';

export default function GestorEventosModule() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'LIST' | 'CREATE' | 'DETAIL'>('LIST');
  const [selectedEvento, setSelectedEvento] = useState<any>(null);
  const [personas, setPersonas] = useState<any[]>([]);

  // Form states for new event
  const [eNombre, setENombre] = useState('');
  const [eDesc, setEDesc] = useState('');
  const [eObjetivoGen, setEObjetivoGen] = useState('');
  const [eObjetivoEsp, setEObjetivoEsp] = useState('');
  const [eBaseBiblica, setEBaseBiblica] = useState('');
  const [ePrecio, setEPrecio] = useState('');
  const [ePresupuesto, setEPresupuesto] = useState('');
  const [eFechaInicio, setEFechaInicio] = useState('');
  const [eFechaFin, setEFechaFin] = useState('');
  const [eEstado, setEEstado] = useState('PLANIFICACION');
  const [eTipo, setETipo] = useState('EVENTO');
  const [eTargetEtapaId, setETargetEtapaId] = useState('');
  const [etapasList, setEtapasList] = useState<any[]>([]);

  useEffect(() => {
    loadEventos();
    loadPersonas();
    loadEtapas();
  }, []);

  const loadEtapas = async () => {
    try {
      const res = await fetch('/api/iglesia');
      if (res.ok) {
        const data = await res.json();
        if (data.etapas) setEtapasList(data.etapas);
      }
    } catch(e) {}
  };

  const loadEventos = async () => {
    try {
      const res = await fetch('/api/eventos');
      const data = await res.json();
      setEventos(Array.isArray(data) ? data : []);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };
  
  const loadPersonas = async () => {
    try {
      const res = await fetch('/api/miembros');
      const data = await res.json();
      setPersonas(Array.isArray(data) ? data : []);
    } catch(e) {}
  };

  const loadEventoDetail = async (id: string) => {
    setView('DETAIL');
    const res = await fetch(`/api/eventos/${id}`);
    const data = await res.json();
    setSelectedEvento(data);
  };

  const createEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/eventos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: eNombre, descripcion: eDesc, objetivo_general: eObjetivoGen, 
        objetivo_especifico: eObjetivoEsp, base_biblica: eBaseBiblica, 
        precio: ePrecio, presupuesto: ePresupuesto, 
        fecha_inicio: eFechaInicio, fecha_fin: eFechaFin, estado: eEstado,
        tipo: eTipo, target_etapa_id: eTargetEtapaId || null
      })
    });
    if (res.ok) {
      alert("Evento creado!");
      setView('LIST');
      loadEventos();
    }
  };

  const updateEvento = async (estado: string) => {
    const res = await fetch(`/api/eventos/${selectedEvento.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado })
    });
    if (res.ok) {
      loadEventoDetail(selectedEvento.id);
    }
  };

  const updateTipo = async (tipo: string) => {
    const res = await fetch(`/api/eventos/${selectedEvento.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo })
    });
    if (res.ok) {
      loadEventoDetail(selectedEvento.id);
    }
  };

  // Sub-actions
  const [newAsistente, setNewAsistente] = useState('');
  const addAsistente = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/eventos/${selectedEvento.id}`, {
      method: 'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action: 'agregar_asistente', payload: { nombre: newAsistente }})
    });
    setNewAsistente(''); loadEventoDetail(selectedEvento.id);
  };
  const toggleAsistencia = async (asistente_id: string, asistio: boolean) => {
    await fetch(`/api/eventos/${selectedEvento.id}`, {
      method: 'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action: 'marcar_asistencia', payload: { asistente_id, asistio: !asistio }})
    });
    loadEventoDetail(selectedEvento.id);
  };
  const deleteAsistente = async (asistente_id: string) => {
    if(!confirm('¿Seguro que deseas eliminar esta inscripción?')) return;
    await fetch(`/api/eventos/${selectedEvento.id}`, {
      method: 'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action: 'eliminar_asistente', payload: { asistente_id }})
    });
    loadEventoDetail(selectedEvento.id);
  };

  const [newTarea, setNewTarea] = useState('');
  const addTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/eventos/${selectedEvento.id}`, {
      method: 'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action: 'agregar_tarea', payload: { descripcion: newTarea }})
    });
    setNewTarea(''); loadEventoDetail(selectedEvento.id);
  };
  const toggleTarea = async (tarea_id: string, estado: string) => {
    await fetch(`/api/eventos/${selectedEvento.id}`, {
      method: 'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action: 'toggle_tarea', payload: { tarea_id, estado: estado === 'COMPLETADO' ? 'PENDIENTE' : 'COMPLETADO' }})
    });
    loadEventoDetail(selectedEvento.id);
  };

  const [newMaterial, setNewMaterial] = useState('');
  const addMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/eventos/${selectedEvento.id}`, {
      method: 'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action: 'agregar_material', payload: { item: newMaterial }})
    });
    setNewMaterial(''); loadEventoDetail(selectedEvento.id);
  };
  const toggleMaterial = async (material_id: string, estado: string) => {
    await fetch(`/api/eventos/${selectedEvento.id}`, {
      method: 'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action: 'toggle_material', payload: { material_id, estado: estado === 'CONSEGUIDO' ? 'FALTA' : 'CONSEGUIDO' }})
    });
    loadEventoDetail(selectedEvento.id);
  };

  const [newSesionNombre, setNewSesionNombre] = useState('');
  const [newSesionFecha, setNewSesionFecha] = useState('');
  const addSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/eventos/${selectedEvento.id}`, {
      method: 'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action: 'crear_sesion', payload: { nombre: newSesionNombre, fecha: newSesionFecha }})
    });
    setNewSesionNombre(''); setNewSesionFecha(''); loadEventoDetail(selectedEvento.id);
  };
  const deleteSesion = async (sesion_id: string) => {
    if(!confirm('¿Eliminar esta sesión de clase y sus asistencias?')) return;
    await fetch(`/api/eventos/${selectedEvento.id}`, {
      method: 'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action: 'eliminar_sesion', payload: { sesion_id }})
    });
    loadEventoDetail(selectedEvento.id);
  };
  const toggleAsistenciaSesion = async (sesion_id: string, asistente_id: string, currentStatus: boolean) => {
    await fetch(`/api/eventos/${selectedEvento.id}`, {
      method: 'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action: 'marcar_asistencia_sesion', payload: { sesion_id, asistente_id, asistio: !currentStatus }})
    });
    loadEventoDetail(selectedEvento.id);
  };

  if (loading) return <div>Cargando Eventos...</div>;

  return (
    <div style={{ padding: '0' }}>
      {view === 'LIST' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem' }}>
            <button onClick={() => setView('CREATE')} style={{ padding: '0.65rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
              + Crear Evento
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {eventos.map(ev => (
              <div key={ev.id} onClick={() => loadEventoDetail(ev.id)} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: ev.estado==='ACTIVO'?'#dcfce7':ev.estado==='PROMOCION'?'#fef08a':'#f1f5f9', color: ev.estado==='ACTIVO'?'#16a34a':ev.estado==='PROMOCION'?'#a16207':'#64748b' }}>{ev.estado}</span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{new Date(ev.fecha_inicio).toLocaleDateString()}</span>
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>{ev.nombre}</h3>
                <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ev.descripcion || 'Sin descripción'}</p>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                  <span>👥 {ev._count?.asistentes || 0}</span>
                  <span>📋 {ev._count?.tareas || 0}</span>
                  <span>📦 {ev._count?.materiales || 0}</span>
                </div>
              </div>
            ))}
            {eventos.length === 0 && (
              <div style={{ gridColumn: '1 / -1', background: 'white', padding: '3rem', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎪</div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>No hay eventos registrados</h3>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Organiza tu primer congreso, retiro o curso haciendo clic en el botón superior.</p>
                <button onClick={() => setView('CREATE')} style={{ padding: '0.75rem 1.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                  Crear mi primer evento
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {view === 'CREATE' && (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0', maxWidth: '800px', margin: '0 auto' }}>
          <button onClick={() => setView('LIST')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '1rem', fontWeight: 600 }}>← Volver</button>
          <h2 style={{ marginTop: 0 }}>Crear Nuevo Evento</h2>
          <form onSubmit={createEvento} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input required placeholder="Nombre del Evento o Clase..." value={eNombre} onChange={e=>setENombre(e.target.value)} style={{ flex: 2, padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
              <select value={eTipo} onChange={e=>setETipo(e.target.value)} style={{ flex: 1, padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                <option value="EVENTO">Evento Único</option>
                <option value="CLASE">Clase / Curso (Múltiples días)</option>
              </select>
              <select value={eEstado} onChange={e=>setEEstado(e.target.value)} style={{ flex: 1, padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                <option value="PLANIFICACION">Planificación</option>
                <option value="PROMOCION">En Promoción (Mi Iglesia)</option>
                <option value="ACTIVO">Activo (Día del Evento)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.3rem', fontWeight: 600 }}>Dirigido a Etapa de Crecimiento</label>
              <select value={eTargetEtapaId} onChange={e=>setETargetEtapaId(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                <option value="">Todas las etapas (Público General)</option>
                {etapasList.map(et => <option key={et.id} value={et.id}>{et.nombre_etapa}</option>)}
              </select>
            </div>
            <textarea placeholder="Descripción general..." value={eDesc} onChange={e=>setEDesc(e.target.value)} style={{ padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', minHeight: '80px' }} />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input type="date" required value={eFechaInicio} onChange={e=>setEFechaInicio(e.target.value)} style={{ flex: 1, padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
              <input type="date" value={eFechaFin} onChange={e=>setEFechaFin(e.target.value)} style={{ flex: 1, padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input type="number" step="0.01" placeholder="Precio / Costo Inscripción ($)" value={ePrecio} onChange={e=>setEPrecio(e.target.value)} style={{ flex: 1, padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
              <input type="number" step="0.01" placeholder="Presupuesto Estimado ($)" value={ePresupuesto} onChange={e=>setEPresupuesto(e.target.value)} style={{ flex: 1, padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
            </div>
            <textarea placeholder="Objetivo General..." value={eObjetivoGen} onChange={e=>setEObjetivoGen(e.target.value)} style={{ padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', minHeight: '60px' }} />
            <textarea placeholder="Base Bíblica (ej. Mateo 28:19)..." value={eBaseBiblica} onChange={e=>setEBaseBiblica(e.target.value)} style={{ padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
            
            <button type="submit" style={{ padding: '1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', marginTop: '1rem' }}>Crear Evento</button>
          </form>
        </div>
      )}

      {view === 'DETAIL' && selectedEvento && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <button onClick={() => {setView('LIST'); loadEventos();}} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>← Volver</button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select value={selectedEvento.tipo} onChange={e => updateTipo(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700 }}>
                <option value="EVENTO">Evento Único</option>
                <option value="CLASE">Clase / Curso</option>
              </select>
              <select value={selectedEvento.estado} onChange={e => updateEvento(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700 }}>
                <option value="PLANIFICACION">Planificación</option>
                <option value="PROMOCION">En Promoción</option>
                <option value="ACTIVO">En Curso (Activo)</option>
                <option value="FINALIZADO">Finalizado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
          </div>

          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
            <h1 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>{selectedEvento.nombre}</h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '1.1rem' }}>{selectedEvento.descripcion}</p>
            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '1.5rem 0' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              <div><strong style={{ display:'block', fontSize:'0.8rem', color:'#64748b'}}>Fecha</strong><span>{new Date(selectedEvento.fecha_inicio).toLocaleDateString()}</span></div>
              <div><strong style={{ display:'block', fontSize:'0.8rem', color:'#64748b'}}>Precio</strong><span>${selectedEvento.precio}</span></div>
              <div><strong style={{ display:'block', fontSize:'0.8rem', color:'#64748b'}}>Presupuesto</strong><span>${selectedEvento.presupuesto}</span></div>
              <div><strong style={{ display:'block', fontSize:'0.8rem', color:'#64748b'}}>Base Bíblica</strong><span>{selectedEvento.base_biblica || '-'}</span></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            {/* Tareas (Checklist) */}
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>📋 Checklist del Evento</h3>
              <form onSubmit={addTarea} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input required placeholder="Nueva tarea..." value={newTarea} onChange={e=>setNewTarea(e.target.value)} style={{ flex: 1, padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                <button type="submit" style={{ padding: '0.5rem 1rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 600 }}>Añadir</button>
              </form>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {selectedEvento.tareas?.map((t: any) => (
                  <li key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    <input type="checkbox" checked={t.estado === 'COMPLETADO'} onChange={() => toggleTarea(t.id, t.estado)} style={{ width: '1.2rem', height: '1.2rem' }} />
                    <span style={{ flex: 1, textDecoration: t.estado === 'COMPLETADO' ? 'line-through' : 'none', color: t.estado === 'COMPLETADO' ? '#94a3b8' : '#334155' }}>{t.descripcion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Materiales */}
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>📦 Materiales / Recursos</h3>
              <form onSubmit={addMaterial} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input required placeholder="Material requerido..." value={newMaterial} onChange={e=>setNewMaterial(e.target.value)} style={{ flex: 1, padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                <button type="submit" style={{ padding: '0.5rem 1rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 600 }}>Añadir</button>
              </form>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {selectedEvento.materiales?.map((m: any) => (
                  <li key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    <input type="checkbox" checked={m.estado === 'CONSEGUIDO'} onChange={() => toggleMaterial(m.id, m.estado)} style={{ width: '1.2rem', height: '1.2rem' }} />
                    <span style={{ flex: 1, textDecoration: m.estado === 'CONSEGUIDO' ? 'line-through' : 'none', color: m.estado === 'CONSEGUIDO' ? '#94a3b8' : '#334155' }}>{m.cantidad}x {m.item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Asistentes */}
            <div style={{ gridColumn: '1 / -1', background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>👥 Asistentes Inscritos ({selectedEvento.asistentes?.length || 0})</h3>
              <form onSubmit={addAsistente} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input required placeholder="Nombre completo..." value={newAsistente} onChange={e=>setNewAsistente(e.target.value)} style={{ flex: 1, padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', maxWidth: '300px' }} />
                <button type="submit" style={{ padding: '0.5rem 1rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600 }}>Inscribir</button>
              </form>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Nombre del Participante</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Fecha Inscripción</th>
                    {selectedEvento.tipo !== 'CLASE' && <th style={{ padding: '0.5rem', textAlign: 'center' }}>Check-in</th>}
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEvento.asistentes?.map((a: any) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 500 }}>{a.nombre || a.persona?.nombre}</td>
                      <td style={{ padding: '0.5rem', color: '#64748b' }}>{new Date(a.fecha_registro).toLocaleString()}</td>
                      {selectedEvento.tipo !== 'CLASE' && (
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                          <button onClick={() => toggleAsistencia(a.id, a.asistio)} style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', border: 'none', background: a.asistio ? '#dcfce7' : '#f1f5f9', color: a.asistio ? '#16a34a' : '#64748b', fontWeight: 700, cursor: 'pointer' }}>
                            {a.asistio ? 'Presente' : 'Marcar Asistencia'}
                          </button>
                        </td>
                      )}
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <button onClick={() => deleteAsistente(a.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'underline' }} title="Eliminar inscripción">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {selectedEvento.tipo === 'CLASE' && (
                <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px dashed #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>📚 Sesiones de Clase (Asistencia Semanal)</h3>
                  
                  <form onSubmit={addSesion} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input required placeholder="Nombre de la sesión (Ej: Clase 1)" value={newSesionNombre} onChange={e=>setNewSesionNombre(e.target.value)} style={{ flex: 1, padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', maxWidth: '250px' }} />
                    <input required type="date" value={newSesionFecha} onChange={e=>setNewSesionFecha(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                    <button type="submit" style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600 }}>Crear Sesión</button>
                  </form>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {selectedEvento.sesiones?.length === 0 ? (
                      <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.9rem' }}>No hay sesiones creadas. Crea una para comenzar a pasar asistencia.</p>
                    ) : (
                      selectedEvento.sesiones?.map((sesion: any) => (
                        <div key={sesion.id} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div>
                              <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{sesion.nombre}</strong>
                              <span style={{ marginLeft: '1rem', color: '#64748b', fontSize: '0.9rem' }}>📅 {new Date(sesion.fecha).toLocaleDateString()}</span>
                            </div>
                            <button onClick={() => deleteSesion(sesion.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}>Eliminar Sesión</button>
                          </div>
                          
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', background: 'white', borderRadius: '6px', overflow: 'hidden' }}>
                            <tbody>
                              {selectedEvento.asistentes?.map((a: any) => {
                                const asistencia = sesion.asistencias?.find((as:any) => as.asistente_id === a.id);
                                const isPresent = asistencia?.asistio || false;
                                return (
                                  <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '0.5rem 1rem', width: '60%' }}>{a.nombre || a.persona?.nombre}</td>
                                    <td style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>
                                      <button 
                                        onClick={() => toggleAsistenciaSesion(sesion.id, a.id, isPresent)} 
                                        style={{ padding: '0.25rem 1rem', borderRadius: '4px', border: 'none', background: isPresent ? '#16a34a' : '#e2e8f0', color: isPresent ? 'white' : '#475569', fontWeight: 600, cursor: 'pointer' }}
                                      >
                                        {isPresent ? '✅ Presente' : 'Marcar Presente'}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Finanzas */}
            <div style={{ gridColumn: '1 / -1', background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
               <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>💰 Balance del Evento</h3>
               <p style={{ margin: '0 0 1rem 0', color: '#64748b' }}>Para registrar ingresos (entradas) o gastos (materiales) asociados a este evento, utiliza el <strong>Módulo de Finanzas</strong>. A la hora de registrar la transacción, la base de datos lo asociará y el reporte final se podrá consolidar desde allí.</p>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                 <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                   <span style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Ingresos</span>
                   <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a' }}>${selectedEvento.transacciones?.filter((t:any) => t.tipo==='INGRESO').reduce((a:number,c:any)=>a+c.monto,0).toFixed(2)}</span>
                 </div>
                 <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                   <span style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Gastos</span>
                   <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>${selectedEvento.transacciones?.filter((t:any) => t.tipo==='EGRESO').reduce((a:number,c:any)=>a+c.monto,0).toFixed(2)}</span>
                 </div>
                 <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                   <span style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Balance Neto</span>
                   <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>${(selectedEvento.transacciones?.filter((t:any) => t.tipo==='INGRESO').reduce((a:number,c:any)=>a+c.monto,0) - selectedEvento.transacciones?.filter((t:any) => t.tipo==='EGRESO').reduce((a:number,c:any)=>a+c.monto,0)).toFixed(2)}</span>
                 </div>
               </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
