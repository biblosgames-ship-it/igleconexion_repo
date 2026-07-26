'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import styles from './admin.module.css';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function GestorFormulariosModule() {
  const [formularios, setFormularios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('LIST'); // LIST, BUILDER, ANALYTICS
  const [selectedForm, setSelectedForm] = useState<any>(null);

  // Builder States
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [preguntas, setPreguntas] = useState<any[]>([]);

  // Targeting States
  const [targetRol, setTargetRol] = useState('');
  const [targetGrupoId, setTargetGrupoId] = useState('');
  const [targetSociedadId, setTargetSociedadId] = useState('');
  const [targetEventoId, setTargetEventoId] = useState('');
  const [targetEtapaId, setTargetEtapaId] = useState('');
  const [esPopupObligatorio, setEsPopupObligatorio] = useState(false);

  // Select Options
  const [gruposList, setGruposList] = useState<any[]>([]);
  const [sociedadesList, setSociedadesList] = useState<any[]>([]);
  const [eventosList, setEventosList] = useState<any[]>([]);
  const [etapasList, setEtapasList] = useState<any[]>([]);

  useEffect(() => {
    loadFormularios();
    loadTargetingOptions();
  }, []);

  const loadTargetingOptions = async () => {
    try {
      const [iglesiaRes, eRes] = await Promise.all([
        fetch('/api/iglesia'),
        fetch('/api/eventos')
      ]);
      
      if (iglesiaRes.ok) {
        const iglesia = await iglesiaRes.json();
        if (iglesia.etapas) setEtapasList(iglesia.etapas);
        if (iglesia.sociedades) {
          setSociedadesList(iglesia.sociedades);
          const todosLosGrupos = iglesia.sociedades.flatMap((s: any) => s.grupos_conexion || []);
          setGruposList(todosLosGrupos);
        }
      }
      
      if (eRes.ok) setEventosList(await eRes.json());
    } catch (e) {}
  };

  const loadFormularios = async () => {
    setLoading(true);
    const res = await fetch('/api/formularios');
    if (res.ok) setFormularios(await res.json());
    setLoading(false);
  };

  const createFormulario = async () => {
    const res = await fetch('/api/formularios', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'Nuevo Formulario', descripcion: '' })
    });
    if (res.ok) {
      const form = await res.json();
      setSelectedForm(form);
      setTitulo(form.titulo);
      setDescripcion(form.descripcion);
      setTargetEtapaId('');
      setPreguntas([]);
      setView('BUILDER');
    }
  };

  const loadFormBuilder = async (id: string) => {
    const res = await fetch(`/api/formularios/${id}`);
    if (res.ok) {
      const form = await res.json();
      setSelectedForm(form);
      setTitulo(form.titulo);
      setDescripcion(form.descripcion || '');
      setTargetRol(form.target_rol || '');
      setTargetGrupoId(form.target_grupo_id || '');
      setTargetSociedadId(form.target_sociedad_id || '');
      setTargetEventoId(form.target_evento_id || '');
      setTargetEtapaId(form.target_etapa_id || '');
      setEsPopupObligatorio(form.es_popup_obligatorio || false);

      // Parse opciones JSON string
      const pregs = form.preguntas.map((p:any) => ({
        ...p, opciones: p.opciones ? JSON.parse(p.opciones) : []
      }));
      setPreguntas(pregs);
      setView('BUILDER');
    }
  };

  const loadAnalytics = async (id: string) => {
    const res = await fetch(`/api/formularios/${id}?with_respuestas=true`);
    if (res.ok) {
      const form = await res.json();
      setSelectedForm(form);
      setView('ANALYTICS');
    }
  };

  const saveFormulario = async () => {
    // 1. Update title/desc and targeting
    await fetch(`/api/formularios/${selectedForm.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        titulo, 
        descripcion, 
        estado: selectedForm.estado,
        target_rol: targetRol || null,
        target_grupo_id: targetGrupoId || null,
        target_sociedad_id: targetSociedadId || null,
        target_evento_id: targetEventoId || null,
        target_etapa_id: targetEtapaId || null,
        es_popup_obligatorio: esPopupObligatorio
      })
    });
    
    // 2. Update Preguntas
    const res = await fetch(`/api/formularios/${selectedForm.id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'guardar_preguntas', payload: { preguntas } })
    });

    if (res.ok) {
      alert("Formulario guardado exitosamente.");
      loadFormularios();
    }
  };

  const togglePublish = async (id: string, currentEstado: string) => {
    const nuevoEstado = currentEstado === 'PUBLICADO' ? 'BORRADOR' : 'PUBLICADO';
    await fetch(`/api/formularios/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    });
    loadFormularios();
    if (selectedForm && selectedForm.id === id) {
      setSelectedForm({ ...selectedForm, estado: nuevoEstado });
    }
  };

  // BUILDER FUNCTIONS
  const addPregunta = (tipo: string) => {
    setPreguntas([...preguntas, { tipo, pregunta: 'Nueva Pregunta', opciones: tipo === 'OPCION_MULTIPLE' || tipo === 'CASILLAS' ? ['Opción 1'] : [], obligatoria: false }]);
  };
  const updatePregunta = (index: number, key: string, value: any) => {
    const updated = [...preguntas];
    updated[index][key] = value;
    setPreguntas(updated);
  };
  const removePregunta = (index: number) => {
    const updated = [...preguntas];
    updated.splice(index, 1);
    setPreguntas(updated);
  };

  // EXPORT EXCEL
  const exportToExcel = () => {
    if (!selectedForm || !selectedForm.respuestas || selectedForm.respuestas.length === 0) {
      alert("No hay respuestas para exportar.");
      return;
    }
    
    // Parse preguntas first
    const preguntasArray = selectedForm.preguntas || [];
    
    // Create matrix Data
    const data = selectedForm.respuestas.map((r: any) => {
      let edad = '';
      let demografia = '';
      if (r.persona?.fecha_nacimiento) {
        const diff = Date.now() - new Date(r.persona.fecha_nacimiento).getTime();
        const ageDate = new Date(diff);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
        edad = age.toString();
        if (age < 30) demografia = 'Joven';
        else demografia = r.persona.sexo === 'M' ? 'Caballero' : (r.persona.sexo === 'F' ? 'Dama' : '');
      } else {
        demografia = r.persona?.sexo === 'M' ? 'Caballero' : (r.persona?.sexo === 'F' ? 'Dama' : '');
      }

      const row: any = {
        'Fecha': new Date(r.createdAt).toLocaleString(),
        'Participante': r.persona?.nombre || 'Anónimo',
        'Correo': r.persona?.correo || '',
        'Teléfono': r.persona?.telefono || '',
        'Sexo': r.persona?.sexo === 'M' ? 'M' : (r.persona?.sexo === 'F' ? 'F' : ''),
        'Edad': edad,
        'Demografía': demografia,
        'Grupo de Conexión': r.persona?.grupo_conexion?.nombre_grupo || 'N/A'
      };
      
      preguntasArray.forEach((p:any) => {
        const det = r.detalles.find((d:any) => d.pregunta_id === p.id);
        row[p.pregunta] = det ? det.valor : '';
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Respuestas");
    XLSX.writeFile(workbook, `${selectedForm.titulo}_Resultados.xlsx`);
  };

  const getAnalyticsData = (pregunta_id: string, tipo: string) => {
    if (!selectedForm || !selectedForm.respuestas) return [];
    
    const counts: any = {};
    selectedForm.respuestas.forEach((r: any) => {
      const det = r.detalles.find((d:any) => d.pregunta_id === pregunta_id);
      if (det && det.valor) {
        if (tipo === 'CASILLAS') {
          try {
            const arr = JSON.parse(det.valor);
            arr.forEach((v:string) => {
              counts[v] = (counts[v] || 0) + 1;
            });
          } catch(e) {}
        } else {
          counts[det.valor] = (counts[det.valor] || 0) + 1;
        }
      }
    });
    
    return Object.keys(counts).map((name, i) => ({
      name, value: counts[name], fill: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F'][i % 6]
    }));
  };

  return (
    <div style={{ padding: '0', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* ---------- LIST VIEW ---------- */}
      {view === 'LIST' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem' }}>
            <button onClick={createFormulario} style={{ padding: '0.65rem 1rem', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
              + Crear Formulario
            </button>
          </div>

          {loading ? <p>Cargando...</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {formularios.map(f => (
                <div key={f.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '999px', background: f.estado === 'PUBLICADO' ? '#dcfce7' : '#f1f5f9', color: f.estado === 'PUBLICADO' ? '#16a34a' : '#64748b' }}>
                      {f.estado}
                    </span>
                    <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>{f._count.respuestas} Respuestas</span>
                  </div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>{f.titulo}</h3>
                  <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{f.descripcion || 'Sin descripción'}</p>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button onClick={() => loadFormBuilder(f.id)} style={{ flex: 1, padding: '0.5rem', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>✏️ Editar</button>
                    <button onClick={() => loadAnalytics(f.id)} style={{ flex: 1, padding: '0.5rem', background: '#f8fafc', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>📊 Resultados</button>
                    <button onClick={() => togglePublish(f.id, f.estado)} style={{ width: '100%', padding: '0.5rem', background: f.estado==='PUBLICADO'?'#fff1f2':'#f0fdf4', color: f.estado==='PUBLICADO'?'#e11d48':'#16a34a', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                      {f.estado === 'PUBLICADO' ? 'Pausar Recepción' : 'Publicar Formulario'}
                    </button>
                    {f.estado === 'PUBLICADO' && (
                      <button onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/hub/formularios/${f.id}`);
                        alert('Enlace copiado al portapapeles');
                      }} style={{ width: '100%', padding: '0.5rem', background: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem' }}>
                        🔗 Copiar Enlace
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ---------- BUILDER VIEW ---------- */}
      {view === 'BUILDER' && (
        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <button onClick={() => setView('LIST')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>← Volver</button>
            <button onClick={saveFormulario} style={{ padding: '0.6rem 1.5rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>💾 Guardar Formulario</button>
          </div>

          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', borderTop: '8px solid #8b5cf6', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
            <input value={titulo} onChange={e=>setTitulo(e.target.value)} style={{ width: '100%', fontSize: '2rem', fontWeight: 800, border: 'none', borderBottom: '1px solid #e2e8f0', marginBottom: '1rem', paddingBottom: '0.5rem', outline: 'none' }} placeholder="Título del Formulario" />
            <textarea value={descripcion} onChange={e=>setDescripcion(e.target.value)} style={{ width: '100%', fontSize: '1rem', border: 'none', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', minHeight: '60px', outline: 'none' }} placeholder="Descripción del formulario..." />
          </div>

          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>🎯 Configuración de Publicación (Targeting)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 600 }}>Público Objetivo (Rol)</label>
                <select value={targetRol} onChange={e=>setTargetRol(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="">Cualquier Miembro</option>
                  <option value="LIDER">Solo Líderes</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 600 }}>Dirigido a una Sociedad</label>
                <select value={targetSociedadId} onChange={e=>setTargetSociedadId(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="">Todas las sociedades</option>
                  {sociedadesList.map(s => <option key={s.id} value={s.id}>{s.nombre_sociedad}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 600 }}>Dirigido a un Grupo</label>
                <select value={targetGrupoId} onChange={e=>setTargetGrupoId(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="">Todos los grupos</option>
                  {gruposList.map(g => <option key={g.id} value={g.id}>{g.nombre_grupo}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 600 }}>Dirigido a Etapa de Crecimiento</label>
                <select value={targetEtapaId} onChange={e=>setTargetEtapaId(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="">Todas las etapas (Público General)</option>
                  {etapasList.map(et => <option key={et.id} value={et.id}>{et.nombre_etapa}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 600 }}>Examen de Clase/Evento</label>
                <select value={targetEventoId} onChange={e=>setTargetEventoId(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="">Ninguno</option>
                  {eventosList.map(ev => <option key={ev.id} value={ev.id}>{ev.nombre}</option>)}
                </select>
              </div>
            </div>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: esPopupObligatorio ? '#fef2f2' : '#f8fafc', padding: '1rem', borderRadius: '8px', border: esPopupObligatorio ? '1px solid #fca5a5' : '1px solid #e2e8f0' }}>
              <input type="checkbox" checked={esPopupObligatorio} onChange={e=>setEsPopupObligatorio(e.target.checked)} style={{ width: '1.25rem', height: '1.25rem', accentColor: '#ef4444' }} />
              <div>
                <strong style={{ color: esPopupObligatorio ? '#b91c1c' : '#334155', display: 'block' }}>Hacer obligatorio (Pop-up en Mi Iglesia)</strong>
                <span style={{ fontSize: '0.85rem', color: esPopupObligatorio ? '#dc2626' : '#64748b' }}>Si se activa, el formulario aparecerá inmediatamente cuando las personas seleccionadas entren a Mi Iglesia y no podrán cerrarlo hasta completarlo.</span>
              </div>
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {preguntas.map((p, index) => (
              <div key={index} style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'relative' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <input value={p.pregunta} onChange={e => updatePregunta(index, 'pregunta', e.target.value)} style={{ flex: 1, padding: '0.75rem', fontSize: '1.1rem', background: '#f8fafc', border: 'none', borderBottom: '2px solid #94a3b8', outline: 'none' }} placeholder="Escribe la pregunta..." />
                  <select value={p.tipo} onChange={e => updatePregunta(index, 'tipo', e.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                    <option value="TEXTO_CORTO">Texto Corto</option>
                    <option value="PARRAFO">Párrafo</option>
                    <option value="OPCION_MULTIPLE">Opción Múltiple (Radio)</option>
                    <option value="CASILLAS">Casillas (Checkboxes)</option>
                  </select>
                </div>

                {/* Opciones Builder para Opción múltiple / casillas */}
                {(p.tipo === 'OPCION_MULTIPLE' || p.tipo === 'CASILLAS') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '1rem' }}>
                    {p.opciones.map((opt: string, optIndex: number) => (
                      <div key={optIndex} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#cbd5e1' }}>{p.tipo === 'CASILLAS' ? '◻️' : '◯'}</span>
                        <input value={opt} onChange={e => {
                          const newOpts = [...p.opciones];
                          newOpts[optIndex] = e.target.value;
                          updatePregunta(index, 'opciones', newOpts);
                        }} style={{ padding: '0.5rem', border: 'none', borderBottom: '1px dotted #94a3b8', outline: 'none', flex: 1 }} />
                        <button onClick={() => {
                          const newOpts = [...p.opciones];
                          newOpts.splice(optIndex, 1);
                          updatePregunta(index, 'opciones', newOpts);
                        }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✖</button>
                      </div>
                    ))}
                    <button onClick={() => updatePregunta(index, 'opciones', [...p.opciones, `Opción ${p.opciones.length+1}`])} style={{ alignSelf: 'flex-start', padding: '0.5rem', background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#cbd5e1' }}>{p.tipo === 'CASILLAS' ? '◻️' : '◯'}</span> Añadir opción
                    </button>
                  </div>
                )}

                {(p.tipo === 'TEXTO_CORTO' || p.tipo === 'PARRAFO') && (
                  <div style={{ color: '#94a3b8', fontStyle: 'italic', marginLeft: '1rem', paddingBottom: '0.5rem', borderBottom: '1px dotted #e2e8f0' }}>Texto de respuesta breve...</div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={p.obligatoria} onChange={e => updatePregunta(index, 'obligatoria', e.target.checked)} />
                    <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>Obligatorio</span>
                  </label>
                  <button 
                    onClick={() => removePregunta(index)} 
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
                    title="Eliminar pregunta"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button onClick={() => addPregunta('TEXTO_CORTO')} style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>+ T. Corto</button>
            <button onClick={() => addPregunta('PARRAFO')} style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>+ Párrafo</button>
            <button onClick={() => addPregunta('OPCION_MULTIPLE')} style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>+ Opc. Múltiple</button>
            <button onClick={() => addPregunta('CASILLAS')} style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>+ Casillas</button>
          </div>

        </div>
      )}

      {/* ---------- ANALYTICS VIEW ---------- */}
      {view === 'ANALYTICS' && selectedForm && (
        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <button onClick={() => setView('LIST')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>← Volver</button>
            <button onClick={exportToExcel} style={{ padding: '0.6rem 1.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📥</span> Descargar Excel (.xlsx)
            </button>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2rem', margin: 0, color: '#0f172a' }}>{selectedForm.titulo}</h2>
            <p style={{ color: '#64748b', fontSize: '1.1rem' }}>{selectedForm.respuestas.length} Respuestas Recibidas</p>
          </div>

          {selectedForm.respuestas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px' }}>Aún no hay respuestas para este formulario.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {selectedForm.preguntas.map((p: any) => {
                const data = getAnalyticsData(p.id, p.tipo);
                
                return (
                  <div key={p.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>{p.pregunta}</h3>
                    
                    {/* Gráficos para opciones múltiples y casillas */}
                    {(p.tipo === 'OPCION_MULTIPLE' || p.tipo === 'CASILLAS') ? (
                      <div style={{ height: '300px', display: 'flex' }}>
                        <ResponsiveContainer width="50%" height="100%">
                          <PieChart>
                            <Pie data={data} cx="50%" cy="50%" outerRadius={100} label dataKey="value">
                              {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                        <ResponsiveContainer width="50%" height="100%">
                          <BarChart data={data} layout="vertical">
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12}} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                              {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div style={{ maxHeight: '200px', overflowY: 'auto', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                        {selectedForm.respuestas.map((r:any) => {
                          const det = r.detalles.find((d:any) => d.pregunta_id === p.id);
                          return det && det.valor ? (
                            <div key={r.id} style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.9rem' }}>
                              <span style={{ fontWeight: 600, color: '#94a3b8', marginRight: '0.5rem' }}>{r.persona?.nombre || 'Anónimo'}:</span>
                              {det.valor}
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
