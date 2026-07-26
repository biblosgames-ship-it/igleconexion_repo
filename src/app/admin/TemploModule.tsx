'use client';

import React, { useState, useEffect } from 'react';
import styles from './admin.module.css';

export default function TemploModule() {
  const [activeSubTab, setActiveSubTab] = useState('inventario');
  const [loading, setLoading] = useState(true);

  // Data states
  const [bienes, setBienes] = useState<any[]>([]);
  const [prestamos, setPrestamos] = useState<any[]>([]);
  const [salones, setSalones] = useState<any[]>([]);
  const [reservas, setReservas] = useState<any[]>([]);

  // Filter states
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Form views for Bienes
  const [bienView, setBienView] = useState('LIST'); // LIST, CREATE, DETAIL
  const [selectedBien, setSelectedBien] = useState<any>(null);
  const [nombreBien, setNombreBien] = useState('');
  const [descBien, setDescBien] = useState('');
  const [catBien, setCatBien] = useState('Electrónica');
  const [ubBien, setUbBien] = useState('');
  const [fechaAdqBien, setFechaAdqBien] = useState('');
  const [valorBien, setValorBien] = useState('');
  const [notasBien, setNotasBien] = useState('');

  // Form states for Maintenance
  const [mTipo, setMTipo] = useState('PREVENTIVO');
  const [mDesc, setMDesc] = useState('');
  const [mFechaProg, setMFechaProg] = useState('');
  const [mResp, setMResp] = useState('');
  const [mProvNombre, setMProvNombre] = useState('');
  const [mProvContacto, setMProvContacto] = useState('');
  const [mRecurrencia, setMRecurrencia] = useState('NO_REPETIR');
  const [mBienId, setMBienId] = useState('');
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);

  // Form states for Loans
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [loanBienId, setLoanBienId] = useState('');
  const [loanPersona, setLoanPersona] = useState('');
  const [loanFechaP, setLoanFechaP] = useState(new Date().toISOString().split('T')[0]);
  const [loanFechaPrev, setLoanFechaPrev] = useState('');
  const [loanNotas, setLoanNotas] = useState('');

  // Form states for Salones
  const [showAddSalon, setShowAddSalon] = useState(false);
  const [salonNombre, setSalonNombre] = useState('');
  const [salonCapacidad, setSalonCapacidad] = useState('');
  const [salonUbicacion, setSalonUbicacion] = useState('');
  const [salonDesc, setSalonDesc] = useState('');

  // Form states for Reservas
  const [showAddReserva, setShowAddReserva] = useState(false);
  const [resSalonId, setResSalonId] = useState('');
  const [resTipo, setResTipo] = useState('RECURRENTE'); // RECURRENTE, ESPECIFICA
  const [resDiaSemana, setResDiaSemana] = useState('Domingo');
  const [resFechaEsp, setResFechaEsp] = useState('');
  const [resHoraInicio, setResHoraInicio] = useState('');
  const [resHoraFin, setResHoraFin] = useState('');
  const [resPor, setResPor] = useState('');
  const [resProposito, setResProposito] = useState('');

  useEffect(() => {
    loadAllData();
  }, [filtroCategoria, filtroEstado]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Bienes
      let urlBienes = '/api/bienes?';
      if (filtroCategoria) urlBienes += `categoria=${filtroCategoria}&`;
      if (filtroEstado) urlBienes += `estado=${filtroEstado}&`;
      const resB = await fetch(urlBienes);
      if (resB.ok) setBienes(await resB.json());

      // 2. Prestamos
      const resP = await fetch('/api/prestamos');
      if (resP.ok) setPrestamos(await resP.json());

      // 3. Salones
      const resS = await fetch('/api/salones');
      if (resS.ok) setSalones(await resS.json());

      // 4. Reservas
      const resR = await fetch('/api/reservas');
      if (resR.ok) setReservas(await resR.json());
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const loadBienDetail = async (id: string) => {
    const res = await fetch('/api/bienes');
    if (res.ok) {
      const all = await res.json();
      const b = all.find((x: any) => x.id === id);
      if (b) setSelectedBien(b);
    }
  };

  // Bienes CRUD
  const submitCreateBien = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/bienes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: nombreBien,
        descripcion: descBien,
        categoria: catBien,
        ubicacion: ubBien,
        fecha_adquisicion: fechaAdqBien,
        valor_estimado: valorBien,
        notas: notasBien
      })
    });
    if (res.ok) {
      setBienView('LIST');
      loadAllData();
    }
  };

  const updateEstadoBien = async (id: string, nuevoEstado: string) => {
    if (nuevoEstado === 'DADO_DE_BAJA' && !confirm('¿Estás seguro de dar de baja este equipo?')) return;
    const res = await fetch(`/api/bienes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    });
    if (res.ok) {
      loadBienDetail(id);
      loadAllData();
    }
  };

  const deleteBien = async (id: string) => {
    if (!confirm('Esto borrará todo el historial del bien. ¿Continuar?')) return;
    await fetch(`/api/bienes/${id}`, { method: 'DELETE' });
    setBienView('LIST');
    loadAllData();
  };

  // Mantenimiento actions
  const addMantenimiento = async (e: React.FormEvent, bienIdToUse?: string) => {
    e.preventDefault();
    const targetBienId = bienIdToUse || selectedBien?.id;
    if (!targetBienId) {
      alert("Selecciona un artículo de inventario.");
      return;
    }
    const res = await fetch(`/api/bienes/${targetBienId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'crear_mantenimiento',
        payload: {
          tipo: mTipo,
          descripcion: mDesc,
          fecha_programada: mFechaProg,
          responsable: mResp,
          proveedor_nombre: mProvNombre,
          proveedor_contacto: mProvContacto,
          recurrencia: mRecurrencia
        }
      })
    });
    if (res.ok) {
      setMDesc('');
      setMFechaProg('');
      setMResp('');
      setMProvNombre('');
      setMProvContacto('');
      setMRecurrencia('NO_REPETIR');
      setMBienId('');
      setShowAddMaintenance(false);
      if (selectedBien && selectedBien.id === targetBienId) {
        loadBienDetail(targetBienId);
      }
      loadAllData();
    }
  };

  const completeMantenimiento = async (registro_id: string, bienId: string) => {
    const costo = prompt("¿Hubo algún costo de reparación/mantenimiento? (Ingresa el monto o 0)");
    if (costo === null) return;

    const res = await fetch(`/api/bienes/${bienId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'completar_mantenimiento', payload: { registro_id, costo } })
    });
    if (res.ok) {
      if (selectedBien) loadBienDetail(selectedBien.id);
      loadAllData();
    }
  };

  // Prestamos actions
  const createLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/prestamos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'crear',
        data: {
          bien_id: loanBienId,
          persona_nombre: loanPersona,
          fecha_prestamo: loanFechaP,
          fecha_devolucion_prevista: loanFechaPrev,
          notas: loanNotas
        }
      })
    });
    if (res.ok) {
      setShowAddLoan(false);
      setLoanBienId('');
      setLoanPersona('');
      setLoanNotas('');
      loadAllData();
    } else {
      const err = await res.json();
      alert("Error: " + err.error);
    }
  };

  const returnLoan = async (id: string, notasDevolucion: string = '') => {
    const res = await fetch('/api/prestamos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'devolver',
        data: { id, notas: notasDevolucion }
      })
    });
    if (res.ok) {
      loadAllData();
    }
  };

  const deleteLoan = async (id: string) => {
    if (!confirm('¿Eliminar registro de préstamo?')) return;
    const res = await fetch('/api/prestamos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'eliminar', data: { id } })
    });
    if (res.ok) {
      loadAllData();
    }
  };

  // Salones actions
  const createSalon = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/salones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'crear',
        data: {
          nombre: salonNombre,
          capacidad: salonCapacidad,
          ubicacion: salonUbicacion,
          descripcion: salonDesc
        }
      })
    });
    if (res.ok) {
      setShowAddSalon(false);
      setSalonNombre('');
      setSalonCapacidad('');
      setSalonUbicacion('');
      setSalonDesc('');
      loadAllData();
    }
  };

  const deleteSalon = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este salón? Esto borrará sus reservas asociadas.')) return;
    const res = await fetch('/api/salones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'eliminar', data: { id } })
    });
    if (res.ok) {
      loadAllData();
    }
  };

  // Reservas actions
  const createReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/reservas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'crear',
        data: {
          salon_id: resSalonId,
          dia_semana: resTipo === 'RECURRENTE' ? resDiaSemana : null,
          fecha_especifica: resTipo === 'ESPECIFICA' ? resFechaEsp : null,
          hora_inicio: resHoraInicio,
          hora_fin: resHoraFin,
          reservado_por: resPor,
          proposito: resProposito
        }
      })
    });
    if (res.ok) {
      setShowAddReserva(false);
      setResSalonId('');
      setResHoraInicio('');
      setResHoraFin('');
      setResPor('');
      setResProposito('');
      loadAllData();
    } else {
      const err = await res.json();
      alert("Error: " + err.error);
    }
  };

  const deleteReserva = async (id: string) => {
    if (!confirm('¿Cancelar esta reserva?')) return;
    const res = await fetch('/api/reservas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'eliminar', data: { id } })
    });
    if (res.ok) {
      loadAllData();
    }
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

  // Consolidate pending maintenances across all items
  const todosMantenimientosPendientes = bienes.flatMap(b => 
    (b.mantenimientos || []).map((m: any) => ({ ...m, bienNombre: b.nombre, bienId: b.id }))
  ).filter(m => m.estado === 'PENDIENTE');

  const todosMantenimientosCompletados = bienes.flatMap(b => 
    (b.mantenimientos || []).map((m: any) => ({ ...m, bienNombre: b.nombre, bienId: b.id }))
  ).filter(m => m.estado === 'COMPLETADO');

  return (
    <div style={{ padding: '0' }}>
      
      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem', borderBottom: '2px solid #e2e8f0' }}>
        {[
          { id: 'inventario', label: '📦 Inventario de Bienes' },
          { id: 'prestamos', label: '🤝 Préstamo de Artículos' },
          { id: 'mantenimiento', label: '🛠️ Mantenimiento Programado' },
          { id: 'salones', label: '🏫 Salones y Reservas' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{ 
              padding: '0.6rem 1.2rem', 
              border: 'none', 
              background: 'none', 
              fontWeight: 700, 
              fontSize: '0.9rem', 
              cursor: 'pointer', 
              borderBottom: activeSubTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent', 
              color: activeSubTab === tab.id ? 'var(--color-primary)' : '#64748b', 
              marginBottom: '-2px',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#64748b' }}>Cargando datos del templo...</p>
      ) : (
        <>
          
          {/* TAB 1: INVENTARIO */}
          {activeSubTab === 'inventario' && (
            <div>
              {bienView === 'LIST' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h2 className={styles.blockTitle} style={{ margin: 0 }}>📦 Control de Inventario</h2>
                      <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>Bienes muebles y equipos de la iglesia.</p>
                    </div>
                    <button onClick={() => {
                      setNombreBien(''); setDescBien(''); setUbBien(''); setFechaAdqBien(''); setValorBien(''); setNotasBien(''); setBienView('CREATE');
                    }} style={{ padding: '0.65rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                      + Registrar Artículo
                    </button>
                  </div>

                  {/* Filtros */}
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

                  {bienes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                      <h3 style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>No hay bienes registrados</h3>
                      <p style={{ color: '#94a3b8', margin: 0 }}>Registra tu primer equipo o mobiliario para empezar.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                      {bienes.map(b => (
                        <div key={b.id} onClick={() => { setSelectedBien(b); setBienView('DETAIL'); }} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', cursor: 'pointer', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'transform 0.15s' }}>
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
                            {b.mantenimientos?.filter((m: any) => m.estado === 'PENDIENTE').length > 0 && (
                              <span style={{ color: '#ef4444', fontWeight: 600, marginTop: '0.5rem' }}>⚠️ Mantenimiento Pendiente</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {bienView === 'CREATE' && (
                <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0', maxWidth: '600px', margin: '0 auto' }}>
                  <button onClick={() => setBienView('LIST')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '1rem', fontWeight: 600 }}>← Volver</button>
                  <h2 style={{ marginTop: 0 }}>Registrar Nuevo Artículo</h2>
                  <form onSubmit={submitCreateBien} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input required placeholder="Nombre (Ej: Consola de Sonido Yamaha)" value={nombreBien} onChange={e=>setNombreBien(e.target.value)} style={{ padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                    <textarea placeholder="Descripción o detalles técnicos..." value={descBien} onChange={e=>setDescBien(e.target.value)} style={{ padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', minHeight: '80px' }} />
                    
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <select value={catBien} onChange={e=>setCatBien(e.target.value)} style={{ flex: 1, padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                        <option value="Electrónica">Electrónica (Audio/Video)</option>
                        <option value="Mobiliario">Mobiliario</option>
                        <option value="Instrumentos">Instrumentos Musicales</option>
                        <option value="Vehículos">Vehículos</option>
                        <option value="Otros">Otros</option>
                      </select>
                      <input placeholder="Ubicación (Ej: Templo)" value={ubBien} onChange={e=>setUbBien(e.target.value)} style={{ flex: 1, padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Fecha de Adquisición</label>
                        <input type="date" value={fechaAdqBien} onChange={e=>setFechaAdqBien(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Valor Estimado ($)</label>
                        <input type="number" step="0.01" placeholder="Ej: 500.00" value={valorBien} onChange={e=>setValorBien(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                      </div>
                    </div>

                    <textarea placeholder="Notas adicionales, seriales, estado inicial..." value={notasBien} onChange={e=>setNotasBien(e.target.value)} style={{ padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', minHeight: '80px' }} />
                    
                    <button type="submit" style={{ padding: '0.75rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginTop: '1rem' }}>Guardar en Inventario</button>
                  </form>
                </div>
              )}

              {bienView === 'DETAIL' && selectedBien && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <button onClick={() => {setBienView('LIST'); loadAllData();}} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>← Volver</button>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <select value={selectedBien.estado} onChange={e => updateEstadoBien(selectedBien.id, e.target.value)} style={{ padding: '0.5rem', border: `2px solid ${getEstadoColor(selectedBien.estado)}`, color: getEstadoColor(selectedBien.estado), borderRadius: '8px', fontWeight: 800, background: 'white' }}>
                        <option value="ACTIVO">ESTADO: ACTIVO</option>
                        <option value="AVERIADO">ESTADO: AVERIADO</option>
                        <option value="EN_MANTENIMIENTO">ESTADO: EN MANTENIMIENTO</option>
                        <option value="DADO_DE_BAJA">ESTADO: DADO DE BAJA</option>
                      </select>
                      <button 
                        onClick={() => deleteBien(selectedBien.id)} 
                        style={{ 
                          background: 'none',
                          border: 'none',
                          color: '#f43f5e',
                          cursor: 'pointer',
                          padding: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'color 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#e11d48'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#f43f5e'}
                        title="Eliminar Artículo"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                      </button>
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
                      
                      <form onSubmit={(e) => addMantenimiento(e)} style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#334155' }}>Programar Tarea o Reportar Avería</h4>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Tipo</label>
                            <select required value={mTipo} onChange={e=>setMTipo(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white' }}>
                              <option value="PREVENTIVO">Mantenimiento Preventivo</option>
                              <option value="REPORTE_AVERIA">Reportar Avería ⚠️</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Descripción</label>
                            <input required placeholder="Descripción del problema o tarea..." value={mDesc} onChange={e=>setMDesc(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Fecha Programada</label>
                            <input type="date" value={mFechaProg} onChange={e=>setMFechaProg(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Responsable (Interno)</label>
                            <input placeholder="Ej: Diácono Juan" value={mResp} onChange={e=>setMResp(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Proveedor (Empresa/Persona)</label>
                            <input placeholder="Ej: Climas S.A." value={mProvNombre} onChange={e=>setMProvNombre(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Contacto del Proveedor</label>
                            <input placeholder="Ej: +506 8888-8888" value={mProvContacto} onChange={e=>setMProvContacto(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Recurrencia / Repetición</label>
                            <select value={mRecurrencia} onChange={e=>setMRecurrencia(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white' }}>
                              <option value="NO_REPETIR">No repetir (Única vez)</option>
                              <option value="MENSUAL">Cada mes</option>
                              <option value="TRIMESTRAL">Cada 3 meses</option>
                              <option value="SEMESTRAL">Cada 6 meses</option>
                              <option value="ANUAL">Cada año</option>
                            </select>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button type="submit" style={{ padding: '0.6rem 1.5rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Programar</button>
                        </div>
                      </form>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {selectedBien.mantenimientos?.length === 0 ? (
                          <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>No hay registros de mantenimiento para este equipo.</p>
                        ) : (
                          selectedBien.mantenimientos?.map((m: any) => (
                            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', borderLeft: `4px solid ${m.estado === 'PENDIENTE' ? '#f59e0b' : '#16a34a'}` }}>
                              <div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px', background: m.tipo === 'REPORTE_AVERIA' ? '#fee2e2' : '#e0f2fe', color: m.tipo === 'REPORTE_AVERIA' ? '#dc2626' : '#0284c7' }}>
                                    {m.tipo}
                                  </span>
                                  <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>{m.estado}</span>
                                  {m.recurrencia && m.recurrencia !== 'NO_REPETIR' && (
                                    <span style={{ fontSize: '0.7rem', background: '#f3e8ff', color: '#6b21a8', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                                      🔄 {m.recurrencia}
                                    </span>
                                  )}
                                </div>
                                <strong style={{ display: 'block', color: '#1e293b', marginBottom: '0.25rem' }}>{m.descripcion}</strong>
                                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                                  {m.fecha_programada && `Prog: ${new Date(m.fecha_programada).toLocaleDateString()} • `}
                                  {m.responsable && `Resp: ${m.responsable}`}
                                  {m.proveedor_nombre && ` • Prov: ${m.proveedor_nombre}`}
                                  {m.proveedor_contacto && ` (${m.proveedor_contacto})`}
                                </span>
                                {m.costo !== null && m.costo > 0 && (
                                   <span style={{ display: 'block', color: '#0f172a', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.5rem' }}>Costo: ${m.costo}</span>
                                )}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
                                {m.estado === 'PENDIENTE' && (
                                  <button onClick={() => completeMantenimiento(m.id, selectedBien.id)} style={{ padding: '0.4rem 0.8rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>✓ Completar</button>
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
          )}

          {/* TAB 2: PRESTAMOS */}
          {activeSubTab === 'prestamos' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 className={styles.blockTitle} style={{ margin: 0 }}>🤝 Préstamo de Artículos</h2>
                  <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>Registra y monitorea los bienes que se prestan a miembros o ministerios.</p>
                </div>
                <button onClick={() => setShowAddLoan(true)} style={{ padding: '0.65rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                  + Registrar Préstamo
                </button>
              </div>

              {showAddLoan && (
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#1e293b' }}>Registrar Nuevo Préstamo</h3>
                  <form onSubmit={createLoan} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Artículo a Prestar</label>
                      <select required value={loanBienId} onChange={e=>setLoanBienId(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                        <option value="">Selecciona un bien...</option>
                        {bienes.filter(b=>b.estado === 'ACTIVO').map(b=> (
                          <option key={b.id} value={b.id}>{b.nombre} ({b.ubicacion})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>A quién se le presta</label>
                      <input required type="text" placeholder="Nombre completo" value={loanPersona} onChange={e=>setLoanPersona(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Fecha Préstamo</label>
                      <input type="date" value={loanFechaP} onChange={e=>setLoanFechaP(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Devolución Prevista</label>
                      <input type="date" value={loanFechaPrev} onChange={e=>setLoanFechaPrev(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Notas adicionales / Condiciones</label>
                      <input type="text" placeholder="Estado del equipo, detalles del evento..." value={loanNotas} onChange={e=>setLoanNotas(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="submit" style={{ padding: '0.6rem 1rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Guardar</button>
                      <button type="button" onClick={() => setShowAddLoan(false)} style={{ padding: '0.6rem 1rem', background: '#94a3b8', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                    </div>
                  </form>
                </div>
              )}

              <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '1rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 700 }}>Artículo</th>
                      <th style={{ padding: '1rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 700 }}>Prestado a</th>
                      <th style={{ padding: '1rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 700 }}>Fecha Préstamo</th>
                      <th style={{ padding: '1rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 700 }}>Fecha Límite</th>
                      <th style={{ padding: '1rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 700 }}>Estado</th>
                      <th style={{ padding: '1rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 700 }}>Notas</th>
                      <th style={{ padding: '1rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prestamos.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No hay registros de préstamos de bienes.</td>
                      </tr>
                    ) : (
                      prestamos.map(p => {
                        const isOverdue = p.estado === 'PRESTADO' && p.fecha_devolucion_prevista && new Date(p.fecha_devolucion_prevista) < new Date();
                        return (
                          <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '1rem', fontWeight: 600, color: '#1e293b' }}>{p.bien?.nombre}</td>
                            <td style={{ padding: '1rem' }}>{p.persona_nombre}</td>
                            <td style={{ padding: '1rem' }}>{new Date(p.fecha_prestamo).toLocaleDateString()}</td>
                            <td style={{ padding: '1rem' }}>
                              {p.fecha_devolucion_prevista ? new Date(p.fecha_devolucion_prevista).toLocaleDateString() : 'N/A'}
                              {isOverdue && <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.7rem', display: 'block' }}>⚠️ DEMORADO</span>}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px', background: p.estado === 'PRESTADO' ? '#fef3c7' : '#dcfce7', color: p.estado === 'PRESTADO' ? '#d97706' : '#15803d' }}>
                                {p.estado}
                              </span>
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#475569' }}>{p.notas || '-'}</td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', alignItems: 'center' }}>
                                {p.estado === 'PRESTADO' && (
                                  <button onClick={() => returnLoan(p.id)} style={{ padding: '0.35rem 0.75rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                                    Devolver
                                  </button>
                                )}
                                <button 
                                  onClick={() => deleteLoan(p.id)} 
                                  style={{ 
                                    background: 'none',
                                    border: 'none',
                                    color: '#f43f5e',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'color 0.2s',
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.color = '#e11d48'}
                                  onMouseLeave={(e) => e.currentTarget.style.color = '#f43f5e'}
                                  title="Eliminar Registro"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MANTENIMIENTO CONSOLIDADO */}
          {activeSubTab === 'mantenimiento' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 className={styles.blockTitle} style={{ margin: 0 }}>🛠️ Tareas de Mantenimiento</h2>
                  <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>Monitorea trabajos de conservación de la planta física y equipos averiados.</p>
                </div>
                <button onClick={() => setShowAddMaintenance(!showAddMaintenance)} style={{ padding: '0.65rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                  {showAddMaintenance ? '✕ Cancelar' : '+ Programar Mantenimiento'}
                </button>
              </div>

              {showAddMaintenance && (
                <div style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#1e293b', marginBottom: '1rem' }}>🛠️ Programar Nuevo Mantenimiento</h3>
                  <form onSubmit={(e) => addMantenimiento(e, mBienId)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Artículo / Bien</label>
                        <select required value={mBienId} onChange={e=>setMBienId(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white' }}>
                          <option value="">Selecciona artículo...</option>
                          {bienes.map(b => (
                            <option key={b.id} value={b.id}>{b.nombre} ({b.ubicacion || 'Sin ubicación'})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Tipo de Mantenimiento</label>
                        <select required value={mTipo} onChange={e=>setMTipo(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white' }}>
                          <option value="PREVENTIVO">Mantenimiento Preventivo</option>
                          <option value="REPORTE_AVERIA">Reportar Avería ⚠️</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Fecha Programada</label>
                        <input type="date" value={mFechaProg} onChange={e=>setMFechaProg(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Descripción del Trabajo</label>
                        <input required placeholder="Ej: Cambio de filtros, revisión de cables..." value={mDesc} onChange={e=>setMDesc(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Responsable (Interno)</label>
                        <input placeholder="Ej: Diácono Juan" value={mResp} onChange={e=>setMResp(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Proveedor (Empresa/Persona)</label>
                        <input placeholder="Ej: Climas S.A." value={mProvNombre} onChange={e=>setMProvNombre(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Contacto del Proveedor</label>
                        <input placeholder="Ej: +506 8888-8888" value={mProvContacto} onChange={e=>setMProvContacto(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Recurrencia / Repetición</label>
                        <select value={mRecurrencia} onChange={e=>setMRecurrencia(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white' }}>
                          <option value="NO_REPETIR">No repetir (Única vez)</option>
                          <option value="MENSUAL">Cada mes</option>
                          <option value="TRIMESTRAL">Cada 3 meses</option>
                          <option value="SEMESTRAL">Cada 6 meses</option>
                          <option value="ANUAL">Cada año</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                      <button type="submit" style={{ padding: '0.6rem 1.25rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Programar</button>
                      <button type="button" onClick={() => setShowAddMaintenance(false)} style={{ padding: '0.6rem 1.25rem', background: '#94a3b8', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                    </div>
                  </form>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#1e293b', fontSize: '1.05rem' }}>⚠️ Trabajos Pendientes ({todosMantenimientosPendientes.length})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {todosMantenimientosPendientes.length === 0 ? (
                      <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>No hay tareas de mantenimiento programadas o averías pendientes en este momento.</p>
                    ) : (
                      todosMantenimientosPendientes.map((m: any) => (
                        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', borderLeft: `4px solid ${m.tipo === 'REPORTE_AVERIA' ? '#ef4444' : '#f59e0b'}` }}>
                          <div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                              <strong style={{ fontSize: '0.85rem', color: '#334155' }}>{m.bienNombre}</strong>
                              <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px', background: m.tipo === 'REPORTE_AVERIA' ? '#fee2e2' : '#e0f2fe', color: m.tipo === 'REPORTE_AVERIA' ? '#dc2626' : '#0284c7' }}>
                                {m.tipo}
                              </span>
                              {m.recurrencia && m.recurrencia !== 'NO_REPETIR' && (
                                <span style={{ fontSize: '0.65rem', background: '#f3e8ff', color: '#6b21a8', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                                  🔄 {m.recurrencia}
                                </span>
                              )}
                            </div>
                            <span style={{ display: 'block', color: '#1e293b', marginBottom: '0.25rem', fontSize: '0.95rem', fontWeight: 600 }}>{m.descripcion}</span>
                            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                              {m.fecha_programada && `Programada: ${new Date(m.fecha_programada).toLocaleDateString()} • `}
                              {m.responsable && `Responsable: ${m.responsable}`}
                              {m.proveedor_nombre && ` • Proveedor: ${m.proveedor_nombre}`}
                              {m.proveedor_contacto && ` (${m.proveedor_contacto})`}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <button onClick={() => completeMantenimiento(m.id, m.bienId)} style={{ padding: '0.4rem 0.8rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>
                              ✓ Completar
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#1e293b', fontSize: '1.05rem' }}>✓ Historial de Mantenimientos Completados ({todosMantenimientosCompletados.length})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {todosMantenimientosCompletados.length === 0 ? (
                      <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>No hay registros de mantenimientos completados.</p>
                    ) : (
                      todosMantenimientosCompletados.map((m: any) => (
                        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', borderLeft: `4px solid #10b981`, background: '#f8fafc' }}>
                          <div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                              <strong style={{ fontSize: '0.85rem', color: '#334155' }}>{m.bienNombre}</strong>
                              <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px', background: '#dcfce7', color: '#15803d' }}>
                                Completado
                              </span>
                              {m.recurrencia && m.recurrencia !== 'NO_REPETIR' && (
                                <span style={{ fontSize: '0.65rem', background: '#f3e8ff', color: '#6b21a8', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                                  🔄 {m.recurrencia}
                                </span>
                              )}
                            </div>
                            <span style={{ display: 'block', color: '#1e293b', marginBottom: '0.25rem', fontSize: '0.95rem', fontWeight: 600 }}>{m.descripcion}</span>
                            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                              {m.fecha_realizada && `Realizado el: ${new Date(m.fecha_realizada).toLocaleDateString()} • `}
                              {m.responsable && `Responsable: ${m.responsable}`}
                              {m.proveedor_nombre && ` • Proveedor: ${m.proveedor_nombre}`}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', fontSize: '0.9rem' }}>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>
                              Costo: {m.costo !== null && m.costo > 0 ? `$${m.costo}` : 'Sin costo'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SALONES Y RESERVAS */}
          {activeSubTab === 'salones' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 className={styles.blockTitle} style={{ margin: 0 }}>🏫 Gestión de Salones y Reservas</h2>
                  <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>Administra los espacios físicos de la iglesia y programa el uso de los mismos.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setShowAddSalon(true)} style={{ padding: '0.65rem 1rem', background: 'white', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                    + Registrar Salón
                  </button>
                  <button onClick={() => setShowAddReserva(true)} style={{ padding: '0.65rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                    📅 Reservar Espacio
                  </button>
                </div>
              </div>

              {/* Form Nuevo Salon */}
              {showAddSalon && (
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#1e293b' }}>Registrar Nuevo Salón/Espacio</h3>
                  <form onSubmit={createSalon} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Nombre del Salón</label>
                      <input required type="text" placeholder="Ej: Salón de Jóvenes" value={salonNombre} onChange={e=>setSalonNombre(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Capacidad (Personas)</label>
                      <input type="number" placeholder="Ej: 50" value={salonCapacidad} onChange={e=>setSalonCapacidad(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Ubicación</label>
                      <input type="text" placeholder="Ej: Segundo Piso" value={salonUbicacion} onChange={e=>setSalonUbicacion(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Descripción</label>
                      <input type="text" placeholder="Detalles de aire acondicionado, sonido..." value={salonDesc} onChange={e=>setSalonDesc(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="submit" style={{ padding: '0.6rem 1rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Guardar</button>
                      <button type="button" onClick={() => setShowAddSalon(false)} style={{ padding: '0.6rem 1rem', background: '#94a3b8', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Form Nueva Reserva */}
              {showAddReserva && (
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#1e293b' }}>Reservar Espacio Físico</h3>
                  <form onSubmit={createReserva} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Salón / Espacio</label>
                      <select required value={resSalonId} onChange={e=>setResSalonId(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                        <option value="">Selecciona salón...</option>
                        {salones.map(s => (
                          <option key={s.id} value={s.id}>{s.nombre} ({s.ubicacion || 'N/A'})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Tipo de Reserva</label>
                      <select value={resTipo} onChange={e=>setResTipo(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                        <option value="RECURRENTE">Recurrente (Semanal)</option>
                        <option value="ESPECIFICA">Fecha Única</option>
                      </select>
                    </div>

                    {resTipo === 'RECURRENTE' ? (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Día de la Semana</label>
                        <select value={resDiaSemana} onChange={e=>setResDiaSemana(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                          <option value="Lunes">Lunes</option>
                          <option value="Martes">Martes</option>
                          <option value="Miércoles">Miércoles</option>
                          <option value="Jueves">Jueves</option>
                          <option value="Viernes">Viernes</option>
                          <option value="Sábado">Sábado</option>
                          <option value="Domingo">Domingo</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Fecha Específica</label>
                        <input required type="date" value={resFechaEsp} onChange={e=>setResFechaEsp(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                      </div>
                    )}

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Hora de Inicio</label>
                      <input required type="time" value={resHoraInicio} onChange={e=>setResHoraInicio(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Hora de Finalización</label>
                      <input required type="time" value={resHoraFin} onChange={e=>setResHoraFin(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Reservado para</label>
                      <input required type="text" placeholder="Ej: Ministerio de Niños, Grupo #4" value={resPor} onChange={e=>setResPor(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Propósito de la reserva</label>
                      <input type="text" placeholder="Ensayo, clase de bautismo, reunión especial..." value={resProposito} onChange={e=>setResProposito(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="submit" style={{ padding: '0.6rem 1rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Reservar</button>
                      <button type="button" onClick={() => setShowAddReserva(false)} style={{ padding: '0.6rem 1rem', background: '#94a3b8', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                    </div>
                  </form>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                
                {/* Salones List */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '1.25rem', color: '#0f172a', fontSize: '1rem' }}>🏫 Salones Registrados</h3>
                  {salones.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>No hay salones registrados aún.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {salones.map(s => (
                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', border: '1px solid #f1f5f9', borderRadius: '8px', background: '#f8fafc' }}>
                          <div>
                            <strong style={{ display: 'block', color: '#1e293b', fontSize: '0.9rem' }}>{s.nombre}</strong>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>📍 {s.ubicacion || 'N/A'} • 👥 Cap. {s.capacidad || 'N/A'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <button 
                              onClick={() => deleteSalon(s.id)} 
                              style={{ 
                                background: 'none',
                                border: 'none',
                                color: '#f43f5e',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'color 0.2s',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#e11d48'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#f43f5e'}
                              title="Eliminar Salón"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reservas List */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '1.25rem', color: '#0f172a', fontSize: '1rem' }}>📅 Reservas de Espacios</h3>
                  <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '0.75rem', color: '#64748b', fontWeight: 700 }}>Salón</th>
                          <th style={{ padding: '0.75rem', color: '#64748b', fontWeight: 700 }}>Reservado Por</th>
                          <th style={{ padding: '0.75rem', color: '#64748b', fontWeight: 700 }}>Horario</th>
                          <th style={{ padding: '0.75rem', color: '#64748b', fontWeight: 700 }}>Día/Fecha</th>
                          <th style={{ padding: '0.75rem', color: '#64748b', fontWeight: 700, textAlign: 'center' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservas.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>No hay reservas activas.</td>
                          </tr>
                        ) : (
                          reservas.map(r => (
                            <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.75rem', fontWeight: 600 }}>{r.salon?.nombre}</td>
                              <td style={{ padding: '0.75rem' }}>
                                <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{r.reservado_por}</span>
                                {r.proposito && <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>{r.proposito}</span>}
                              </td>
                              <td style={{ padding: '0.75rem' }}>⏰ {r.hora_inicio} - {r.hora_fin}</td>
                              <td style={{ padding: '0.75rem' }}>
                                {r.dia_semana ? (
                                  <span style={{ fontSize: '0.8rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                    Recurrente: {r.dia_semana}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.8rem', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                    Única: {r.fecha_especifica ? new Date(r.fecha_especifica).toLocaleDateString() : 'N/A'}
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                <button 
                                  onClick={() => deleteReserva(r.id)} 
                                  style={{ 
                                    background: 'none',
                                    border: 'none',
                                    color: '#f43f5e',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'color 0.2s',
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.color = '#e11d48'}
                                  onMouseLeave={(e) => e.currentTarget.style.color = '#f43f5e'}
                                  title="Cancelar Reserva"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

        </>
      )}

    </div>
  );
}
