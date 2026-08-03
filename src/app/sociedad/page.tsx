"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./sociedad.module.css";
import InventarioModulo from "@/components/InventarioModulo";
import AsistenciaModulo from "@/components/AsistenciaModulo";
import PresupuestoModulo from "@/components/PresupuestoModulo";

export default function SociedadPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null); // from /api/sociedad
  const [selectedSocId, setSelectedSocId] = useState<string>("");

  // Tab control
  const [activeTab, setActiveTab] = useState<"panorama" | "acuerdos" | "agenda" | "foro" | "inventario" | "asistencia" | "presupuesto" | "mensajes">("panorama");

  // Agreements Form States
  const [agreementTitle, setAgreementTitle] = useState("");
  const [agreementContent, setAgreementContent] = useState("");
  const [agreementSubmitting, setAgreementSubmitting] = useState(false);

  // Agenda Form States
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventSubmitting, setEventSubmitting] = useState(false);

  // Forum Comments Form States
  const [newCommentText, setNewCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  useEffect(() => {
    const fetchSociedades = async () => {
      try {
        const res = await fetch("/api/sociedad");
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        
        setData(json);
        if (json.societies && json.societies.length > 0) {
          setSelectedSocId(json.societies[0].id);
        }
        setLoading(false);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error al cargar la información macro.");
        setLoading(false);
      }
    };
    fetchSociedades();
  }, []);

  const formatFriendlyDate = (dateStr: string) => {
    if (!dateStr) return "";
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const dateObj = new Date(dateStr.replace(/-/g, '\/'));
    return dateObj.toLocaleDateString('es-ES', options);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p style={{ marginTop: "1rem", color: "#64748b", fontWeight: 600 }}>Cargando panorama macro...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/hub" className={styles.backBtn} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <img src="/Iconos SVG/Iglesia-ID.svg" alt="Mi Iglesia" style={{ width: '16px', height: '16px', objectFit: 'contain' }} /> Volver a Mi Iglesia
          </Link>
        </header>
        <main className={styles.main}>
          <div style={{ padding: "1.5rem", borderRadius: "8px", backgroundColor: "#fffbeb", border: "1px solid #fef3c7", color: "#b45309", fontWeight: 500 }}>
            ⚠️ Hubo un problema: {error}
          </div>
        </main>
      </div>
    );
  }

  const societies = data?.societies || [];
  const selectedSoc = societies.find((s: any) => s.id === selectedSocId) || societies[0];

  const handleSaveAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreementTitle.trim() || !agreementContent.trim()) return;
    setAgreementSubmitting(true);
    try {
      const res = await fetch("/api/sociedad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addAcuerdo",
          data: {
            sociedad_id: selectedSocId,
            titulo: agreementTitle.trim(),
            contenido: agreementContent.trim()
          }
        })
      });
      if (res.ok) {
        setAgreementTitle("");
        setAgreementContent("");
        // Reload data
        const reloadRes = await fetch("/api/sociedad");
        const reloadJson = await reloadRes.json();
        if (!reloadJson.error) setData(reloadJson);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAgreementSubmitting(false);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate) return;
    setEventSubmitting(true);
    try {
      const res = await fetch("/api/sociedad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addAgendaEvent",
          data: {
            sociedad_id: selectedSocId,
            titulo: eventTitle.trim(),
            descripcion: eventDesc.trim(),
            fecha: eventDate,
            hora: eventTime || null
          }
        })
      });
      if (res.ok) {
        setEventTitle("");
        setEventDesc("");
        setEventDate("");
        setEventTime("");
        // Reload data
        const reloadRes = await fetch("/api/sociedad");
        const reloadJson = await reloadRes.json();
        if (!reloadJson.error) setData(reloadJson);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEventSubmitting(false);
    }
  };

  const handleSaveComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    setCommentSubmitting(true);
    try {
      const res = await fetch("/api/sociedad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addComment",
          data: {
            sociedad_id: selectedSocId,
            comentario: newCommentText.trim()
          }
        })
      });
      if (res.ok) {
        setNewCommentText("");
        // Reload data
        const reloadRes = await fetch("/api/sociedad");
        const reloadJson = await reloadRes.json();
        if (!reloadJson.error) setData(reloadJson);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm("¿Estás seguro de eliminar este mensaje del buzón?")) return;
    try {
      const res = await fetch(`/api/contacto?id=${msgId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        // Reload data
        const reloadRes = await fetch("/api/sociedad");
        const reloadJson = await reloadRes.json();
        if (!reloadJson.error) setData(reloadJson);
      } else {
        const errJson = await res.json();
        alert(errJson.error || "Error al eliminar el mensaje.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión al servidor.");
    }
  };

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <header className={styles.header}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href="/hub" className={styles.backBtn} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <img src="/Iconos SVG/Iglesia-ID.svg" alt="Mi Iglesia" style={{ width: '16px', height: '16px', objectFit: 'contain' }} /> Volver a Mi Iglesia
          </Link>
          <div className={styles.headerTitle}>
            📊 Panorama de Sociedades
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className={styles.main}>
        {societies.length === 0 ? (
          /* NO SOCIETIES ACCESSIBLE WARNING */
          <div className={styles.card} style={{ textAlign: "center", padding: "3rem" }}>
            <span style={{ fontSize: "3rem" }}>📊</span>
            <h1 style={{ marginTop: "1rem", fontSize: "1.5rem" }}>Acceso no disponible</h1>
            <p style={{ color: "var(--text-secondary)", margin: "0.5rem 0 1.5rem 0" }}>
              Actualmente no tienes permisos ni roles asignados para visualizar el panorama macro de las Sociedades.
            </p>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Link href="/hub" className={styles.actionBtn} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: "0.6rem 1.25rem" }}>
                <img src="/Iconos SVG/Iglesia-ID.svg" alt="Mi Iglesia" style={{ width: '16px', height: '16px', objectFit: 'contain' }} /> Volver a Mi Iglesia
              </Link>
            </div>
          </div>
        ) : (
          /* PANORAMIC DASHBOARD */
          <>
            {/* Selector de Sociedad si tiene acceso a más de una */}
            <div className={styles.selectorCard}>
              <div>
                <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)" }}>
                  Sociedad {selectedSoc.nombre_sociedad}
                </h1>
                {selectedSoc.descripcion && (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "0.2rem 0 0 0" }}>
                    {selectedSoc.descripcion}
                  </p>
                )}
              </div>

              {societies.length > 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                    Seleccionar Sociedad
                  </span>
                  <select
                    className={styles.select}
                    style={{ width: "auto" }}
                    value={selectedSocId}
                    onChange={(e) => setSelectedSocId(e.target.value)}
                  >
                    {societies.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre_sociedad}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>


            {/* METRICS SUMMARY */}
            <div className={styles.statsRow}>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{selectedSoc.total_grupos}</span>
                <span className={styles.statLabel}>Grupos de Conexión</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{selectedSoc.total_miembros}</span>
                <span className={styles.statLabel}>Integrantes Totales</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statValue}>
                  {selectedSoc.asistencia_promedio_macro}%
                </span>
                <span className={styles.statLabel}>Asistencia Promedio</span>
              </div>
            </div>

            {/* TABS SELECTOR */}
            <div className={styles.subTabs}>
              <button 
                onClick={() => setActiveTab("panorama")} 
                className={`${styles.subTab} ${activeTab === "panorama" ? styles.subTabActive : ""}`}
              >
                📊 Panorama de Crecimiento
              </button>
              <button 
                onClick={() => setActiveTab("acuerdos")} 
                className={`${styles.subTab} ${activeTab === "acuerdos" ? styles.subTabActive : ""}`}
              >
                📢 Acuerdos y Comunicados
              </button>
              <button 
                onClick={() => setActiveTab("agenda")} 
                className={`${styles.subTab} ${activeTab === "agenda" ? styles.subTabActive : ""}`}
              >
                📅 Agenda y Eventos
              </button>
              <button 
                onClick={() => setActiveTab("foro")} 
                className={`${styles.subTab} ${activeTab === "foro" ? styles.subTabActive : ""}`}
              >
                💬 Foro de Directivos
              </button>
              <button 
                onClick={() => setActiveTab("inventario")} 
                className={`${styles.subTab} ${activeTab === "inventario" ? styles.subTabActive : ""}`}
              >
                📦 Inventario
              </button>
              <button
                onClick={() => setActiveTab("asistencia")}
                className={`${styles.subTab} ${activeTab === "asistencia" ? styles.subTabActive : ""}`}
              >
                📝 Asistencia
              </button>
              <button
                onClick={() => setActiveTab("presupuesto")}
                className={`${styles.subTab} ${activeTab === "presupuesto" ? styles.subTabActive : ""}`}
              >
                💰 Presupuesto
              </button>
              <button
                onClick={() => setActiveTab("mensajes")}
                className={`${styles.subTab} ${activeTab === "mensajes" ? styles.subTabActive : ""}`}
              >
                📬 Buzón de Mensajes
              </button>
            </div>

            {/* PANORAMIC LAYOUT */}
            <div className={styles.panoramicGrid}>
              {/* Left Column: Dynamic Tab Content */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                {/* TAB 1: PANORAMA DE CRECIMIENTO */}
                {activeTab === "panorama" && (
                  <>
                    <div className={styles.card}>
                      <h2 className={styles.cardTitle}>👥 Grupos de Conexión Activos</h2>
                      <div className={styles.groupsList}>
                        {selectedSoc.grupos && selectedSoc.grupos.length > 0 ? (
                          selectedSoc.grupos.map((g: any) => (
                            <div key={g.id} className={styles.groupRow}>
                              <div className={styles.groupInfo}>
                                <span className={styles.groupName}>{g.nombre_grupo}</span>
                                <span className={styles.groupMeta}>
                                  Edades sugeridas: {g.rango_edad_min || 0} a {g.rango_edad_max || 99} años
                                </span>
                              </div>

                              <div className={styles.groupMetrics}>
                                <div className={styles.metricItem}>
                                  <span className={styles.metricValue}>{g.miembros_count}</span>
                                  <span className={styles.metricLabel}>Integrantes</span>
                                </div>
                                <div className={styles.metricItem}>
                                  <span className={styles.metricValue}>
                                    {g.asistencias_count > 0 ? `${g.asistencia_promedio}%` : "S/R"}
                                  </span>
                                  <span className={styles.metricLabel}>Asistencia</span>
                                </div>
                                
                                <Link href={`/grupo?id=${g.id}`} className={styles.actionBtn}>
                                  Administrar Grupo 👑
                                </Link>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p style={{ textAlign: "center", fontStyle: "italic", color: "#94a3b8", padding: "2rem" }}>
                            No se han registrado grupos de conexión en esta sociedad todavía.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className={styles.card}>
                      <h2 className={styles.cardTitle}>🌱 Distribución por Ruta de Crecimiento</h2>
                      <div className={styles.stageList}>
                        {selectedSoc.distribucion_etapas && selectedSoc.distribucion_etapas.length > 0 ? (
                          selectedSoc.distribucion_etapas.map((st: any, idx: number) => {
                            const totalMembers = selectedSoc.total_miembros || 1;
                            const percentage = Math.round((st.count / totalMembers) * 100);

                            return (
                              <div key={idx} className={styles.stageRow}>
                                <div className={styles.stageLabelRow}>
                                  <span>{st.name}</span>
                                  <strong>
                                    {st.count} ({percentage}%)
                                  </strong>
                                </div>
                                <div className={styles.stageBarBg}>
                                  <div className={styles.stageBarFill} style={{ width: `${percentage}%` }} />
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p style={{ textAlign: "center", fontStyle: "italic", color: "#94a3b8", padding: "2rem" }}>
                            No hay miembros registrados en las etapas de crecimiento para esta sociedad.
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* TAB 2: ACUERDOS Y COMUNICADOS */}
                {activeTab === "acuerdos" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div className={styles.card}>
                      <h2 className={styles.cardTitle}>📢 Publicar Comunicado Oficial</h2>
                      <form onSubmit={handleSaveAgreement} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Título del Comunicado</label>
                          <input 
                            type="text" 
                            className={styles.input} 
                            placeholder="Ej. Planificación Trimestral de Sociedades"
                            value={agreementTitle} 
                            onChange={e => setAgreementTitle(e.target.value)} 
                            required 
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Contenido</label>
                          <textarea 
                            className={styles.textarea} 
                            placeholder="Escribe el acuerdo, pautas o avisos oficiales aquí..."
                            value={agreementContent} 
                            onChange={e => setAgreementContent(e.target.value)} 
                            required 
                          />
                        </div>
                        <button type="submit" className={styles.primaryBtn} disabled={agreementSubmitting}>
                          {agreementSubmitting ? "Publicando..." : "📢 Publicar Comunicado"}
                        </button>
                      </form>
                    </div>

                    <div className={styles.card}>
                      <h2 className={styles.cardTitle}>📜 Historial de Comunicados</h2>
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {selectedSoc.acuerdos && selectedSoc.acuerdos.length > 0 ? (
                          selectedSoc.acuerdos.map((ac: any) => (
                            <div key={ac.id} style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem" }}>
                              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{ac.titulo}</h3>
                              <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0.15rem 0 0.5rem 0" }}>
                                Por 👤 {ac.creado_por} • 🗓️ {new Date(ac.fecha_publicacion).toLocaleDateString("es-ES")}
                              </p>
                              <p style={{ fontSize: "0.88rem", color: "#334155", whiteSpace: "pre-line", margin: 0 }}>{ac.contenido}</p>
                            </div>
                          ))
                        ) : (
                          <p style={{ fontStyle: "italic", color: "#94a3b8", textAlign: "center", padding: "1rem 0", margin: 0 }}>
                            No hay acuerdos ni comunicados oficiales registrados.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: AGENDA Y EVENTOS */}
                {activeTab === "agenda" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div className={styles.card}>
                      <h2 className={styles.cardTitle}>📅 Programar Actividad o Evento</h2>
                      <form onSubmit={handleSaveEvent} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Nombre de la Actividad</label>
                          <input 
                            type="text" 
                            className={styles.input} 
                            placeholder="Ej. Retiro Anual de Jóvenes" 
                            value={eventTitle} 
                            onChange={e => setEventTitle(e.target.value)} 
                            required 
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Descripción</label>
                          <textarea 
                            className={styles.textarea} 
                            placeholder="Detalles sobre lugar, requerimientos, etc." 
                            value={eventDesc} 
                            onChange={e => setEventDesc(e.target.value)} 
                          />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                          <div className={styles.formGroup}>
                            <label className={styles.label}>Fecha</label>
                            <input 
                              type="date" 
                              className={styles.input} 
                              value={eventDate} 
                              onChange={e => setEventDate(e.target.value)} 
                              required 
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.label}>Hora (Opcional)</label>
                            <input 
                              type="text" 
                              className={styles.input} 
                              placeholder="Ej. 19:30" 
                              value={eventTime} 
                              onChange={e => setEventTime(e.target.value)} 
                            />
                          </div>
                        </div>
                        <button type="submit" className={styles.primaryBtn} disabled={eventSubmitting}>
                          {eventSubmitting ? "Guardando..." : "💾 Programar en Agenda"}
                        </button>
                      </form>
                    </div>

                    <div className={styles.card}>
                      <h2 className={styles.cardTitle}>📅 Actividades Programadas</h2>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {selectedSoc.agenda && selectedSoc.agenda.length > 0 ? (
                          selectedSoc.agenda.map((ev: any) => (
                            <div key={ev.id} style={{ display: "flex", gap: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
                              <div style={{ backgroundColor: "#f0f9ff", color: "var(--accent-blue)", borderRadius: "8px", padding: "0.5rem 1rem", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: "80px", fontWeight: "bold" }}>
                                <span style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
                                  {new Date(ev.fecha.replace(/-/g, '\/')).toLocaleDateString("es-ES", { month: "short" })}
                                </span>
                                <span style={{ fontSize: "1.25rem" }}>
                                  {new Date(ev.fecha.replace(/-/g, '\/')).getDate()}
                                </span>
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                                <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{ev.titulo}</strong>
                                {ev.hora && <span style={{ fontSize: "0.75rem", color: "#64748b" }}>⏰ Hora: {ev.hora}</span>}
                                {ev.descripcion && <p style={{ fontSize: "0.8rem", color: "#475569", margin: "0.2rem 0 0 0" }}>{ev.descripcion}</p>}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p style={{ fontStyle: "italic", color: "#94a3b8", textAlign: "center", padding: "1rem 0", margin: 0 }}>
                            No hay actividades programadas en agenda.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: FORO DE DISCUSIÓN */}
                {activeTab === "foro" && (
                  <div className={styles.card}>
                    <h2 className={styles.cardTitle}>💬 Foro de la Mesa Directiva</h2>
                    <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "-0.5rem 0 0.5rem 0" }}>
                      Espacio interactivo exclusivo para los líderes autorizados en la directiva de la sociedad.
                    </p>

                    <div className={styles.forumComments}>
                      {selectedSoc.foro && selectedSoc.foro.length > 0 ? (
                        selectedSoc.foro.map((f: any) => (
                          <div key={f.id} className={styles.commentBubble}>
                            <div className={styles.commentHeader}>
                              <span>👤 {f.autor}</span>
                              <span>🗓️ {new Date(f.fecha).toLocaleDateString("es-ES")} {new Date(f.fecha).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div style={{ color: "#1e293b", margin: 0 }}>{f.comentario}</div>
                          </div>
                        ))
                      ) : (
                        <p style={{ fontStyle: "italic", color: "#94a3b8", textAlign: "center", padding: "2rem 0", margin: 0 }}>
                          Aún no hay discusiones en el foro. ¡Inicia el diálogo escribiendo abajo!
                        </p>
                      )}
                    </div>

                    <form onSubmit={handleSaveComment} style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                      <input 
                        type="text" 
                        className={styles.input} 
                        placeholder="Escribe un mensaje en el foro de directivos..." 
                        value={newCommentText} 
                        onChange={e => setNewCommentText(e.target.value)} 
                        required 
                      />
                      <button type="submit" className={styles.primaryBtn} disabled={commentSubmitting} style={{ whiteSpace: "nowrap" }}>
                        {commentSubmitting ? "..." : "Enviar 💬"}
                      </button>
                    </form>
                  </div>
                )}

                {activeTab === "inventario" && (
                  <InventarioModulo contextId={selectedSoc.id} contextType="sociedad" />
                )}

                {activeTab === "asistencia" && (() => {
                  // Agrupar miembros de todos los grupos de la sociedad
                  const todosMiembros: { id: string, nombre: string }[] = [];
                  selectedSoc.grupos_conexion?.forEach((g: any) => {
                    g.personas?.forEach((p: any) => {
                      if (!todosMiembros.find(m => m.id === p.id)) {
                        todosMiembros.push({ id: p.id, nombre: p.nombre });
                      }
                    });
                  });

                  return <AsistenciaModulo contextId={selectedSoc.id} contextType="sociedad" miembros={todosMiembros} />;
                })()}

                {activeTab === "presupuesto" && selectedSocId && (
                  <PresupuestoModulo entidadId={selectedSocId} entidadTipo="SOCIEDAD" />
                )}

                {activeTab === "mensajes" && (
                  <div className={styles.card}>
                    <h2 className={styles.cardTitle}>📬 Buzón de Mensajes de la Sociedad</h2>
                    <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "-0.5rem 0 1.25rem 0" }}>
                      Aquí se muestran las consultas y mensajes que los miembros envían a la directiva desde el Hub.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {selectedSoc.mensajes && selectedSoc.mensajes.length > 0 ? (
                        selectedSoc.mensajes.map((msg: any) => (
                          <div 
                            key={msg.id} 
                            style={{ 
                              border: "1px solid #e2e8f0", 
                              borderRadius: "12px", 
                              padding: "1.25rem", 
                              backgroundColor: "#f8fafc", 
                              position: "relative",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.6rem"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1.5rem" }}>
                              <div>
                                <strong style={{ fontSize: "0.95rem", color: "#1e293b", display: "block" }}>👤 {msg.nombre}</strong>
                                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                  🗓️ {new Date(msg.createdAt).toLocaleDateString("es-ES")} {new Date(msg.createdAt).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <button 
                                onClick={() => handleDeleteMessage(msg.id)}
                                style={{ 
                                  background: "rgba(239, 68, 68, 0.08)", 
                                  color: "#ef4444", 
                                  border: "none", 
                                  borderRadius: "6px", 
                                  padding: "0.35rem 0.6rem", 
                                  fontSize: "0.75rem", 
                                  fontWeight: "bold", 
                                  cursor: "pointer",
                                  transition: "all 0.15s"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.15)"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.08)"}
                                title="Eliminar mensaje"
                              >
                                🗑️ Eliminar
                              </button>
                            </div>
                            
                            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.8rem", color: "#475569", borderBottom: "1px dashed #e2e8f0", paddingBottom: "0.6rem" }}>
                              <div>✉️ <strong>Correo:</strong> <a href={`mailto:${msg.email}`} style={{ color: "var(--accent-blue)", textDecoration: "none" }}>{msg.email}</a></div>
                              <div>📞 <strong>Teléfono:</strong> <a href={`tel:${msg.telefono}`} style={{ color: "var(--accent-blue)", textDecoration: "none" }}>{msg.telefono}</a></div>
                            </div>
                            
                            <p style={{ margin: 0, fontSize: "0.88rem", color: "#334155", lineHeight: "1.5", whiteSpace: "pre-wrap", background: "white", padding: "0.75rem", borderRadius: "8px", border: "1px solid #edf2f7" }}>
                              {msg.mensaje}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: "3rem 1.5rem", textAlign: "center", border: "2px dashed #e2e8f0", borderRadius: "12px", background: "#f8fafc" }}>
                          <span style={{ fontSize: "2.5rem" }}>📭</span>
                          <h4 style={{ margin: "0.75rem 0 0.25rem 0", color: "#475569", fontWeight: 700 }}>El buzón está vacío</h4>
                          <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>No se han recibido mensajes para la directiva de esta sociedad todavía.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* Right Column: Directiva de la Sociedad */}
              <div>
                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>👑 Directiva de la Sociedad</h2>
                  <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "-0.5rem 0 0.5rem 0" }}>
                    Líderes con directiva y alcance asignados sobre esta sociedad local.
                  </p>

                  <div className={styles.directivaList}>
                    {selectedSoc.directiva && selectedSoc.directiva.length > 0 ? (
                      selectedSoc.directiva.map((l: any) => (
                        <div key={l.id} className={styles.directivaItem}>
                          <div className={styles.directivaAvatar}>
                            {l.nombre.slice(0, 2).toUpperCase()}
                          </div>
                          <div className={styles.directivaMeta}>
                            <span className={styles.directivaName}>{l.nombre}</span>
                            <span className={styles.directivaRole}>
                              {l.rol === "ADMIN_IGLESIA" ? "Administrador de Iglesia" : "Líder de Sociedad"}
                            </span>
                            <span style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.15rem" }}>📧 {l.email}</span>
                            {l.telefono && l.telefono !== "Sin teléfono" && (
                              <a 
                                href={`tel:${l.telefono}`}
                                style={{ 
                                  display: "inline-flex", 
                                  alignItems: "center", 
                                  gap: "0.2rem", 
                                  color: "var(--accent-blue)", 
                                  fontSize: "0.72rem", 
                                  textDecoration: "none", 
                                  marginTop: "0.2rem", 
                                  fontWeight: "bold" 
                                }}
                              >
                                📞 {l.telefono}
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ textAlign: "center", fontStyle: "italic", color: "#94a3b8", padding: "1rem 0", margin: 0, fontSize: "0.82rem" }}>
                        No se han configurado directivos para esta sociedad.
                      </p>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </>
        )}
      </main>
    </div>
  );
}
