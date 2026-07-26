"use client";
import { useState, useEffect } from "react";
import styles from "./lider.module.css";
import Link from "next/link";

export default function LeaderDashboard() {
  const [scope, setScope] = useState("GRUPO"); // "GLOBAL", "SOCIEDAD", "GRUPO"
  const [activeModuloId, setActiveModuloId] = useState("mod-1"); // Consolidación por defecto
  
  // Leer etapas/módulos/procesos de API
  const [etapas, setEtapas] = useState<any[]>([]);
  const [modulos, setModulos] = useState<any[]>([]);
  const [procesos, setProcesos] = useState<any[]>([]);
  const [miembros, setMiembros] = useState<any[]>([]);
  const [allowOutOfOrder, setAllowOutOfOrder] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Estados para Etiquetas / Alertas de Atención Especial
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [selectedMemberForTags, setSelectedMemberForTags] = useState<any | null>(null);
  const [memberTagHistory, setMemberTagHistory] = useState<any[]>([]);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState("");
  const [customTagDuration, setCustomTagDuration] = useState("");
  const [tagNotes, setTagNotes] = useState("");
  const [tagsLoading, setTagsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("allowOutOfOrder");
      if (saved !== null) {
        setAllowOutOfOrder(saved === "true");
      }
    }
  }, []);

  const handleSetAllowOutOfOrder = (val: boolean) => {
    setAllowOutOfOrder(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("allowOutOfOrder", String(val));
    }
  };

  const loadData = async () => {
    try {
      const configRes = await fetch("/api/iglesia");
      const configData = await configRes.json();
      if (!configData.error) {
        setEtapas(configData.etapas || []);
        setModulos(configData.modulos || []);
        setProcesos(configData.procesos || []);

        if (configData.modulos.length > 0) {
          const exists = configData.modulos.find((m: any) => m.id === "mod-1");
          if (!exists) {
            setActiveModuloId(configData.modulos[0].id);
          }
        }
      }

      const miembrosRes = await fetch("/api/miembros");
      const miembrosData = await miembrosRes.json();
      if (!miembrosData.error) {
        setMiembros(miembrosData);
      }

      const authRes = await fetch("/api/auth");
      const authData = await authRes.json();
      if (!authData.error) {
        setCurrentUser(authData);
      }
    } catch (e) {
      console.error("Error loading data in Leader Dashboard", e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Funciones de gestión de etiquetas ---
  const loadMemberTags = async (member: any) => {
    setSelectedMemberForTags(member);
    setTagsLoading(true);
    setTagNotes("");
    try {
      const res = await fetch(`/api/miembros/etiquetas?memberId=${member.id}`);
      const data = await res.json();
      if (!data.error) {
        setAvailableTags(data.tags || []);
        setMemberTagHistory(data.history || []);
        if (data.tags && data.tags.length > 0) {
          setSelectedTagId(data.tags[0].id);
          setCustomTagDuration(String(data.tags[0].duracion_dias_defecto));
        }
      }
    } catch (e) {
      console.error("Error al cargar etiquetas", e);
    } finally {
      setTagsLoading(false);
      setShowTagsModal(true);
    }
  };

  const handleAssignTag = async () => {
    if (!selectedMemberForTags || !selectedTagId) return;
    try {
      const res = await fetch("/api/miembros/etiquetas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assignTag",
          data: {
            memberId: selectedMemberForTags.id,
            tagId: selectedTagId,
            duracionDias: parseInt(customTagDuration) || 0,
            notas: tagNotes,
          },
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert("Error al asignar etiqueta: " + data.error);
      } else {
        setTagNotes("");
        const resH = await fetch(`/api/miembros/etiquetas?memberId=${selectedMemberForTags.id}`);
        const dataH = await resH.json();
        if (!dataH.error) setMemberTagHistory(dataH.history || []);
        await loadData();
      }
    } catch (e) {
      console.error(e);
      alert("Error al conectar con el servidor.");
    }
  };

  const handleRemoveMemberTag = async (assignmentId: string) => {
    if (!confirm("¿Deseas dar de baja esta alerta activa?")) return;
    try {
      const res = await fetch("/api/miembros/etiquetas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "removeTag", data: { assignmentId } }),
      });
      const data = await res.json();
      if (data.error) {
        alert("Error: " + data.error);
      } else {
        if (selectedMemberForTags) {
          const resH = await fetch(`/api/miembros/etiquetas?memberId=${selectedMemberForTags.id}`);
          const dataH = await resH.json();
          if (!dataH.error) setMemberTagHistory(dataH.history || []);
        }
        await loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateDiasTranscurridos = async (memberId: string, increment: number) => {
    try {
      const res = await fetch("/api/miembros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateDays",
          data: { memberId, increment },
        }),
      });
      const result = await res.json();
      if (!result.error) {
        await loadData();
      }
    } catch (e) {
      console.error("Error updating days", e);
    }
  };

  const toggleTaskCompletada = async (memberId: string, taskId: string) => {
    try {
      const res = await fetch("/api/miembros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggleTask",
          data: { memberId, taskId },
        }),
      });
      const result = await res.json();
      if (!result.error) {
        await loadData();
      }
    } catch (e) {
      console.error("Error toggling task", e);
    }
  };

  const toggleSubtaskCompletada = async (memberId: string, taskId: string, subtaskId: string) => {
    try {
      const res = await fetch("/api/miembros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggleSubtask",
          data: { memberId, taskId, subtaskId },
        }),
      });
      const result = await res.json();
      if (!result.error) {
        await loadData();
      }
    } catch (e) {
      console.error("Error toggling subtask", e);
    }
  };

  const getMemberActiveStage = (member: any) => {
    const sorted = [...etapas].sort((a, b) => a.orden_secuencial - b.orden_secuencial);
    for (const stage of sorted) {
      // Find tasks in this stage
      const stageTasks = procesos.filter(p => p.etapa_id === stage.id);
      if (stageTasks.length > 0) {
        const allCompleted = stageTasks.every(t => (member.tareas_completadas || []).includes(t.id));
        if (!allCompleted) {
          return stage; // This is the active stage (first incomplete stage)
        }
      }
    }
    return sorted.find(e => e.id === member.etapa_id) || sorted[sorted.length - 1] || null;
  };

  const getTareasForMember = (member: any) => {
    const stage = getMemberActiveStage(member);
    if (!stage) return [];
    
    // 2. Filtrar procesos por esta etapa Y que pertenezcan al módulo activo
    return procesos.filter(p => p.etapa_id === stage.id && p.modulo_id === activeModuloId);
  };

  const filteredMiembros = miembros.filter(m => {
    if (scope === "GRUPO") {
      return m.grupo_conexion === "Jóvenes Universitarios";
    }
    if (scope === "SOCIEDAD") {
      return m.sociedad === "Sociedad de Jóvenes";
    }
    return true; // GLOBAL
  });

  const activeModuloName = modulos.find(m => m.id === activeModuloId)?.nombre_modulo || "Módulo Activo";

  return (
    <div className={styles.container}>
      {/* Header del Panel Administrativo */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <span>⚙️</span> Igleconexion Admin
        </div>
        <div className={styles.userMenu}>
          {currentUser && currentUser.paginas_acceso && (
            <Link href="/admin" className={styles.approveBtn} style={{ backgroundColor: '#0ea5e9', boxShadow: 'none', color: 'white', marginRight: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              ⚙️ Configuración General
            </Link>
          )}
          <Link href="/hub" style={{ color: 'var(--text-secondary)', marginRight: '1rem', fontSize: '0.9rem', fontWeight: 600 }}>
            ← Mi Iglesia Usuario
          </Link>
          <span>Hola, Líder {currentUser ? currentUser.nombre.split(" ")[0] : "Cargando..."}</span>
          <div className={styles.avatar}>
            {currentUser ? currentUser.nombre.slice(0, 1).toUpperCase() : "L"}
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>Panel de Seguimiento</h1>
            <p className={styles.subtitle}>Gestiona el crecimiento de las personas asignadas a tus módulos con protocolos de tiempo (SLAs).</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {/* Simulador de Alcance (Scope) */}
            <div className={styles.moduleSelector}>
              <label className={styles.moduleLabel}>Tu Alcance (Simulador)</label>
              <select 
                className={styles.select} 
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                style={{ backgroundColor: '#fef3c7', borderColor: '#f59e0b' }}
              >
                <option value="GRUPO">Nivel Micro: Mi Grupo (Jóvenes Universitarios)</option>
                <option value="SOCIEDAD">Nivel Medio: Sociedad (Toda la Directiva Juvenil)</option>
                <option value="GLOBAL">Nivel Macro: Global (Cuerpo Oficial / Educ. Cristiana)</option>
              </select>
            </div>

            {/* Selector Dinámico de Módulo */}
            <div className={styles.moduleSelector}>
              <label className={styles.moduleLabel}>Módulo Activo (Tu Área)</label>
              <select 
                className={styles.select}
                value={activeModuloId}
                onChange={(e) => setActiveModuloId(e.target.value)}
              >
                {modulos.map(m => (
                  <option key={m.id} value={m.id}>Módulo: {m.nombre_modulo}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.dashboardGrid}>
          {/* Tarjeta con la lista de personas */}
          <div className={styles.card}>
            <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 className={styles.cardTitle} style={{ margin: 0 }}>
                Procesos de {activeModuloName} pendientes
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#475569', backgroundColor: '#f1f5f9', padding: '0.3rem 0.6rem', borderRadius: '6px', userSelect: 'none' }}>
                  <input 
                    type="checkbox" 
                    checked={allowOutOfOrder} 
                    onChange={(e) => handleSetAllowOutOfOrder(e.target.checked)} 
                    style={{ cursor: 'pointer' }}
                  />
                  🔓 Permitir libre orden
                </label>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                  Mostrando {filteredMiembros.length} miembro(s)
                </span>
              </div>
            </div>
            
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Miembro / Creyente</th>
                    <th className={styles.th}>Sociedad / Grupo de Conexión</th>
                    <th className={styles.th}>Estado Etapa</th>
                    <th className={styles.th}>Procesos de Módulo: {activeModuloName}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMiembros.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                        No hay miembros asignados bajo este alcance.
                      </td>
                    </tr>
                  ) : (
                    filteredMiembros.map((m) => {
                      const tareas = getTareasForMember(m);
                      
                      return (
                        <tr key={m.id} className={styles.tr}>
                          <td className={styles.td}>
                            <div className={styles.personInfo}>
                              <div className={styles.personAvatar}>{m.avatar}</div>
                              <div style={{ flex: 1 }}>
                                <div className={styles.personName} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                  {m.nombre}
                                  {m.etiquetas && m.etiquetas.map((tag: any) => (
                                    <span
                                      key={tag.id}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        padding: '1px 7px',
                                        borderRadius: '9999px',
                                        fontSize: '0.68rem',
                                        background: tag.color + '1a',
                                        color: tag.color,
                                        border: `1px solid ${tag.color}`,
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap'
                                      }}
                                      title={`${tag.nombre}${tag.notas ? ` - "${tag.notas}"` : ''} (Expira: ${tag.fecha_fin ? new Date(tag.fecha_fin).toLocaleDateString() : 'Nunca'})`}
                                    >
                                      {tag.icono} {tag.nombre}
                                    </span>
                                  ))}
                                </div>
                                <div className={styles.personMeta}>📱 {m.telefono}</div>
                                <button
                                  onClick={() => loadMemberTags(m)}
                                  style={{
                                    marginTop: '0.3rem',
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    borderRadius: '5px',
                                    color: '#ef4444',
                                    padding: '2px 8px',
                                    fontWeight: 'bold',
                                    fontSize: '0.72rem',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.2rem'
                                  }}
                                >
                                  🏷️ Alertas
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className={styles.td}>
                            <span style={{ fontWeight: 600, display: 'block', color: 'var(--text-primary)' }}>{m.sociedad}</span>
                            <span style={{ fontWeight: 500, color: "var(--text-secondary)", fontSize: '0.85rem' }}>↳ {m.grupo_conexion}</span>
                          </td>
                           <td className={styles.td}>
                            {(() => {
                              const activeStage = getMemberActiveStage(m);
                              const activeStageName = activeStage ? activeStage.nombre_etapa : m.etapa_nombre;
                              const isThirdStage = activeStageName.includes("Etapa 3");
                              return (
                                <span className={`${styles.statusBadge} ${isThirdStage ? styles.statusProgress : styles.statusPending}`} style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
                                  {activeStageName}
                                </span>
                              );
                            })()}
                            
                            {/* Simulador de tiempo en la etapa */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
                              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Transcurrido:</span>
                              <button 
                                onClick={() => updateDiasTranscurridos(m.id, -1)}
                                style={{ padding: '2px 5px', background: '#e2e8f0', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid #cbd5e1' }}
                                title="Reducir día transcurrido"
                              >
                                -
                              </button>
                              <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a', minWidth: '15px', textAlign: 'center' }}>
                                {m.dias_transcurridos}d
                              </span>
                              <button 
                                onClick={() => updateDiasTranscurridos(m.id, 1)}
                                style={{ padding: '2px 5px', background: '#e2e8f0', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid #cbd5e1' }}
                                title="Aumentar día transcurrido"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className={styles.td}>
                            {tareas.length === 0 ? (
                              <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                Sin procesos de {activeModuloName} en esta etapa.
                              </span>
                            ) : (
                              <div className={styles.taskList}>
                                {tareas.map((task: any) => {
                                  const activeProcessObj = tareas.find((t: any) => !m.tareas_completadas.includes(t.id));
                                  const activeProcessId = activeProcessObj ? activeProcessObj.id : null;
                                  const isCompletada = m.tareas_completadas.includes(task.id);
                                  const isTaskActive = task.id === activeProcessId;
                                  const isTaskWaiting = !allowOutOfOrder && !isCompletada && !isTaskActive;

                                  let rowStyle = {};
                                  let statusText = "";
                                  let statusColor = "";

                                  const memberSubs = m.subtareas_completadas || [];
                                  const hasSubtasks = task.subtareas && task.subtareas.length > 0;

                                  // 1. Calcular estado del proceso principal
                                  if (isCompletada) {
                                    rowStyle = { borderColor: '#10b981', backgroundColor: '#f0fdf4' };
                                    statusText = "✓ Aprobado / Completado";
                                    statusColor = "#10b981";
                                  } else if (isTaskWaiting) {
                                    rowStyle = { borderColor: '#e2e8f0', opacity: 0.65, backgroundColor: '#f8fafc' };
                                    statusText = "🔒 En espera (Completa el proceso anterior)";
                                    statusColor = "#64748b";
                                  } else {
                                    // Proceso activo
                                    if (!hasSubtasks) {
                                      const diasRestantes = task.dias_limite !== null ? (task.dias_limite - m.dias_transcurridos) : null;
                                      const isOverdue = diasRestantes !== null && diasRestantes < 0;

                                      if (isOverdue) {
                                        rowStyle = { borderColor: '#ef4444', backgroundColor: '#fef2f2' };
                                        statusText = `⚠️ Atrasado por ${Math.abs(diasRestantes!)} ${Math.abs(diasRestantes!) === 1 ? 'día' : 'días'}`;
                                        statusColor = "#ef4444";
                                      } else if (diasRestantes !== null) {
                                        rowStyle = { borderColor: '#e2e8f0' };
                                        statusText = `⏳ Quedan ${diasRestantes} ${diasRestantes === 1 ? 'día' : 'días'}`;
                                        statusColor = "#d97706";
                                      } else {
                                        rowStyle = { borderColor: '#e2e8f0' };
                                        statusText = "♾️ Sin límite";
                                        statusColor = "#64748b";
                                      }
                                    } else {
                                      // Tiene subtareas: encontrar la subtarea activa (primera incompleta)
                                      const activeSubObj = task.subtareas.find((s: any) => !memberSubs.includes(s.id));
                                      
                                      if (activeSubObj) {
                                        const subLimit = activeSubObj.dias_limite;
                                        const subDiasRestantes = subLimit !== null ? (subLimit - m.dias_transcurridos) : null;
                                        const isSubOverdue = subDiasRestantes !== null && subDiasRestantes < 0;

                                        if (isSubOverdue) {
                                          rowStyle = { borderColor: '#ef4444', backgroundColor: '#fef2f2' };
                                          statusText = `⚠️ Tarea en curso '${activeSubObj.nombre_subtarea}' retrasada por ${Math.abs(subDiasRestantes!)}d`;
                                          statusColor = "#ef4444";
                                        } else if (subDiasRestantes !== null) {
                                          rowStyle = { borderColor: '#e2e8f0', backgroundColor: '#fffbeb' };
                                          statusText = `⚡ Tarea en curso: '${activeSubObj.nombre_subtarea}' (SLA: Quedan ${subDiasRestantes}d)`;
                                          statusColor = "#d97706";
                                        } else {
                                          rowStyle = { borderColor: '#e2e8f0', backgroundColor: '#f0f9ff' };
                                          statusText = `⚡ Tarea en curso: '${activeSubObj.nombre_subtarea}' (Sin límite)`;
                                          statusColor = "#0284c7";
                                        }
                                      } else {
                                        rowStyle = { borderColor: '#10b981', backgroundColor: '#f0fdf4' };
                                        statusText = "✓ Listas completadas";
                                        statusColor = "#10b981";
                                      }
                                    }
                                  }

                                  // Determinar la subtarea activa dentro de este proceso
                                  const activeSubtaskObj = task.subtareas.find((s: any) => !memberSubs.includes(s.id));
                                  const activeSubtaskId = activeSubtaskObj ? activeSubtaskObj.id : null;

                                  return (
                                    <div key={task.id} className={styles.taskRow} style={{ ...rowStyle, flexDirection: 'column', alignItems: 'stretch', gap: '0.75rem' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                          <span className={styles.taskName} style={{ fontWeight: 600, color: isTaskWaiting ? '#94a3b8' : '#1e293b' }}>
                                            {task.nombre_tarea}
                                          </span>
                                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: statusColor }}>
                                            {statusText}
                                          </span>
                                        </div>
                                        
                                        {!hasSubtasks && !isTaskWaiting && (
                                          <button 
                                            className={styles.approveBtn}
                                            onClick={() => toggleTaskCompletada(m.id, task.id)}
                                            style={{ 
                                              backgroundColor: isCompletada ? '#e2e8f0' : 'var(--success)', 
                                              color: isCompletada ? '#475569' : 'white',
                                              boxShadow: isCompletada ? 'none' : '0 2px 4px rgba(16, 185, 129, 0.2)'
                                            }}
                                          >
                                            {isCompletada ? "Desmarcar" : "Marcar Completado"}
                                          </button>
                                        )}
                                      </div>

                                      {hasSubtasks && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.6rem 0.8rem', background: 'white', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem', marginBottom: '0.25rem' }}>
                                            📋 Checklist de Tareas Internas
                                          </div>
                                          {task.subtareas.map((sub: any) => {
                                            const isSubDone = memberSubs.includes(sub.id);
                                            const isSubActive = sub.id === activeSubtaskId && isTaskActive;
                                            const isSubWaiting = !allowOutOfOrder && !isSubDone && !isSubActive;
                                            
                                            const subLimit = sub.dias_limite;
                                            const subDiasRestantes = subLimit !== null ? (subLimit - m.dias_transcurridos) : null;
                                            const highlightRed = isSubActive && subDiasRestantes !== null && subDiasRestantes < 0;

                                            return (
                                              <label 
                                                key={sub.id} 
                                                style={{ 
                                                  display: 'flex', 
                                                  alignItems: 'center', 
                                                  gap: '0.5rem', 
                                                  fontSize: '0.8rem', 
                                                  fontWeight: 500,
                                                  color: isSubDone ? '#94a3b8' : (highlightRed ? '#ef4444' : (isSubWaiting ? '#94a3b8' : '#334155')),
                                                  textDecoration: isSubDone ? 'line-through' : 'none',
                                                  cursor: (isSubWaiting || isTaskWaiting || isCompletada) ? 'not-allowed' : 'pointer',
                                                  userSelect: 'none'
                                                }}
                                              >
                                                <input 
                                                  type="checkbox" 
                                                  checked={isSubDone}
                                                  disabled={isSubWaiting || isTaskWaiting || isCompletada}
                                                  onChange={() => toggleSubtaskCompletada(m.id, task.id, sub.id)}
                                                  style={{ 
                                                    width: '14px', 
                                                    height: '14px', 
                                                    accentColor: 'var(--success)',
                                                    outline: highlightRed ? '2px solid #ef4444' : 'none',
                                                    cursor: (isSubWaiting || isTaskWaiting || isCompletada) ? 'not-allowed' : 'pointer'
                                                  }}
                                                />
                                                <span>{sub.nombre_subtarea}</span>
                                                
                                                {isSubDone && (
                                                  <span style={{ fontSize: '0.7rem', color: '#10b981', marginLeft: 'auto', fontWeight: 600 }}>✓ Listo</span>
                                                )}
                                                {isSubActive && subLimit !== null && (
                                                  <span style={{ fontSize: '0.72rem', color: highlightRed ? '#ef4444' : '#d97706', marginLeft: 'auto', fontWeight: 700 }}>
                                                    {highlightRed ? `⚠️ RETRASADA POR ${Math.abs(subDiasRestantes!)}d` : `⏱️ SLA: Quedan ${subDiasRestantes}d`}
                                                  </span>
                                                )}
                                                {isSubActive && subLimit === null && (
                                                  <span style={{ fontSize: '0.72rem', color: '#0284c7', marginLeft: 'auto', fontWeight: 600 }}>
                                                    ⏱️ Sin límite
                                                  </span>
                                                )}
                                                {isSubWaiting && (
                                                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginLeft: 'auto', fontStyle: 'italic' }}>
                                                    🔒 En espera
                                                  </span>
                                                )}
                                              </label>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL: GESTIÓN DE ETIQUETAS Y ALERTAS DE ATENCIÓN */}
      {showTagsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.25rem', color: '#0f172a', margin: 0 }}>
                🏷️ Alertas de Atención Especial: {selectedMemberForTags?.nombre}
              </h3>
              <button onClick={() => setShowTagsModal(false)} style={{ border: 'none', background: 'transparent', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {/* COLUMNA 1: ASIGNAR NUEVA ALERTA */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem' }}>
                <h4 style={{ fontWeight: 700, margin: '0 0 1rem 0', color: '#0f172a', fontSize: '0.95rem' }}>➕ Asignar Alerta Especial</h4>
                {tagsLoading ? (
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Cargando etiquetas...</p>
                ) : (
                  <div>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.3rem', color: '#475569' }}>Tipo de Alerta</label>
                      <select
                        value={selectedTagId}
                        onChange={(e) => {
                          const tid = e.target.value;
                          setSelectedTagId(tid);
                          const found = availableTags.find(t => t.id === tid);
                          if (found) setCustomTagDuration(String(found.duracion_dias_defecto));
                        }}
                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', backgroundColor: 'white' }}
                      >
                        {availableTags.map((tag: any) => (
                          <option key={tag.id} value={tag.id}>{tag.icono} {tag.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.3rem', color: '#475569' }}>Duración (días)</label>
                      <input
                        type="number"
                        value={customTagDuration}
                        onChange={(e) => setCustomTagDuration(e.target.value)}
                        placeholder="Ej: 7 (usa 0 para indefinido)"
                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.3rem', color: '#475569' }}>Notas / Motivo</label>
                      <textarea
                        value={tagNotes}
                        onChange={(e) => setTagNotes(e.target.value)}
                        placeholder="Describe la situación especial..."
                        rows={3}
                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', resize: 'vertical' }}
                      />
                    </div>
                    <button
                      onClick={handleAssignTag}
                      style={{ width: '100%', padding: '0.65rem', background: '#0284c7', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' }}
                    >
                      Asignar Alerta
                    </button>
                  </div>
                )}
              </div>

              {/* COLUMNA 2: ALERTAS ACTIVAS E HISTORIAL */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Alertas activas */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem' }}>
                  <h4 style={{ fontWeight: 700, margin: '0 0 1rem 0', color: '#0f172a', fontSize: '0.95rem' }}>🚨 Alertas Activas</h4>
                  {memberTagHistory.filter(h => h.activa && (!h.fecha_fin || new Date(h.fecha_fin) > new Date())).length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Sin alertas activas actualmente.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {memberTagHistory.filter(h => h.activa && (!h.fecha_fin || new Date(h.fecha_fin) > new Date())).map((h: any) => (
                        <div key={h.id} style={{ border: `1.5px solid ${h.etiqueta.color}`, borderRadius: '8px', padding: '0.85rem', background: `${h.etiqueta.color}08` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <span style={{ fontWeight: 'bold', color: h.etiqueta.color, fontSize: '0.9rem' }}>
                              {h.etiqueta.icono} {h.etiqueta.nombre}
                            </span>
                            <button
                              onClick={() => handleRemoveMemberTag(h.id)}
                              style={{ border: 'none', background: 'transparent', color: '#ef4444', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}
                            >
                              ❌ Quitar
                            </button>
                          </div>
                          {h.notas && <p style={{ fontSize: '0.82rem', color: '#334155', margin: '0 0 0.4rem 0' }}><strong>Motivo:</strong> {h.notas}</p>}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b' }}>
                            <span>Por: {h.creado_por || 'Líder'}</span>
                            <span>Vence: {h.fecha_fin ? new Date(h.fecha_fin).toLocaleDateString() : 'Sin fecha límite'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Historial */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', maxHeight: '220px', overflowY: 'auto' }}>
                  <h4 style={{ fontWeight: 700, margin: '0 0 0.75rem 0', color: '#0f172a', fontSize: '0.95rem' }}>📜 Historial de Alertas</h4>
                  {memberTagHistory.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Sin historial registrado.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {memberTagHistory.map((h: any) => {
                        const isExpired = h.fecha_fin && new Date(h.fecha_fin) <= new Date();
                        const isActive = h.activa && !isExpired;
                        return (
                          <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.6rem', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                            <span style={{ fontWeight: 600 }}>{h.etiqueta.icono} {h.etiqueta.nombre}</span>
                            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', background: isActive ? '#dcfce7' : '#f1f5f9', color: isActive ? '#15803d' : '#64748b' }}>
                              {isActive ? 'Activa' : isExpired ? 'Expirada' : 'Inactiva'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
