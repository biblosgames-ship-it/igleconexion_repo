"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./liderazgo-grupo.module.css";
import InventarioModulo from "@/components/InventarioModulo";
import AsistenciaModulo from "@/components/AsistenciaModulo";
import PresupuestoModulo from "@/components/PresupuestoModulo";
import FinanzasMinisterioModulo from "@/components/FinanzasMinisterioModulo";

function LiderazgoGrupoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [grupo, setGrupo] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"announcements" | "agenda" | "forum" | "inventario" | "asistencia" | "presupuesto" | "finanzas">("announcements");

  // Form states
  const [newAgreementTitle, setNewAgreementTitle] = useState("");
  const [newAgreementContent, setNewAgreementContent] = useState("");
  const [agreementSubmitting, setAgreementSubmitting] = useState(false);

  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [eventSubmitting, setEventSubmitting] = useState(false);

  const [newCommentText, setNewCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const loadWorkspaceData = async () => {
    if (!id) return;
    try {
      // 1. Cargar datos de Liderazgo para obtener el grupo
      const res = await fetch("/api/liderazgo");
      const data = await res.json();
      if (!data.error && data.grupos) {
        const found = data.grupos.find((g: any) => g.id === id);
        if (found) {
          setGrupo(found);
        } else {
          alert("Grupo de liderazgo no encontrado.");
          router.push("/hub");
        }
      }

      // 2. Cargar sesión de usuario actual
      const authRes = await fetch("/api/auth");
      const authData = await authRes.json();
      if (!authData.error) {
        setCurrentUser(authData);
      }
    } catch (err) {
      console.error("Error loading workspace data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #0284c7', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
          <p style={{ color: '#64748b', fontWeight: 600 }}>Cargando espacio de trabajo...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (!grupo) {
    return (
      <div className={styles.container} style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', fontWeight: 600 }}>Error: No se pudo cargar el espacio de trabajo.</p>
        <Link href="/hub" className={styles.secondaryBtn} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '1rem', textDecoration: 'none' }}>
          <img src="/Iconos SVG/Iglesia-ID.svg" alt="Mi Iglesia" style={{ width: '16px', height: '16px', objectFit: 'contain' }} /> Volver a Mi Iglesia
        </Link>
      </div>
    );
  }

  // Verificar si el usuario actual pertenece a la directiva o es administrador
  const isMemberOfDirectiva = grupo.miembros?.some((m: any) => m.usuario_id === currentUser?.id);
  const isAdmin = currentUser?.rol === "ADMIN_IGLESIA" || currentUser?.rol === "SUPERADMIN";
  const hasPostPermissions = isMemberOfDirectiva || isAdmin;

  // Manejadores
  const handlePostAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgreementTitle.trim() || !newAgreementContent.trim()) return;

    setAgreementSubmitting(true);
    try {
      const res = await fetch("/api/liderazgo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addAcuerdo",
          data: {
            grupo_trabajo_id: grupo.id,
            titulo: newAgreementTitle,
            contenido: newAgreementContent,
            creado_por: currentUser?.persona?.nombre || currentUser?.email.split("@")[0]
          }
        })
      });
      const data = await res.json();
      if (!data.error) {
        setNewAgreementTitle("");
        setNewAgreementContent("");
        await loadWorkspaceData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAgreementSubmitting(false);
    }
  };

  const handlePostEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate) return;

    setEventSubmitting(true);
    try {
      const res = await fetch("/api/liderazgo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addAgendaEvent",
          data: {
            grupo_trabajo_id: grupo.id,
            titulo: newEventTitle,
            descripcion: newEventDesc,
            fecha: newEventDate,
            hora: newEventTime
          }
        })
      });
      const data = await res.json();
      if (!data.error) {
        setNewEventTitle("");
        setNewEventDesc("");
        setNewEventDate("");
        setNewEventTime("");
        await loadWorkspaceData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEventSubmitting(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setCommentSubmitting(true);
    try {
      const res = await fetch("/api/liderazgo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addComment",
          data: {
            grupo_trabajo_id: grupo.id,
            comentario: newCommentText
          }
        })
      });
      const data = await res.json();
      if (!data.error) {
        setNewCommentText("");
        await loadWorkspaceData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  // Formateador de Fechas
  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  let groupTypeLabel = "Departamento";
  let typeColor = "#10b981";
  if (grupo.tipo === "CUERPO_OFICIAL") {
    groupTypeLabel = "Cuerpo Oficial";
    typeColor = "#db2777";
  } else if (grupo.tipo === "MINISTERIO") {
    groupTypeLabel = "Ministerio";
    typeColor = "#f59e0b";
  } else if (grupo.tipo === "INSTITUCION") {
    groupTypeLabel = "Institución";
    typeColor = "#64748b";
  }

  const todosMiembros = grupo.miembros?.map((m: any) => ({
    id: m.usuario.persona?.id || m.usuario_id,
    nombre: m.usuario.persona?.nombre || m.usuario.email.split("@")[0]
  })) || [];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/hub" className={styles.backBtn} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <img src="/Iconos SVG/Iglesia-ID.svg" alt="Mi Iglesia" style={{ width: '16px', height: '16px', objectFit: 'contain' }} /> Volver a Mi Iglesia
          </Link>
          {isAdmin && (
            <Link href="/admin" className={styles.backBtn} style={{ color: '#0284c7' }}>
              ⚙️ Admin Config
            </Link>
          )}
        </div>
        <div style={{ fontWeight: 600, color: '#64748b', fontSize: '0.88rem' }}>
          Sesión: {currentUser?.persona?.nombre || currentUser?.email}
        </div>
      </header>

      <main className={styles.main}>
        {/* Banner o Cabecera del Grupo */}
        <section className={styles.pageHeader}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.72rem', backgroundColor: `${typeColor}15`, color: typeColor, padding: '2px 10px', borderRadius: '12px', fontWeight: 700 }}>
                {groupTypeLabel}
              </span>
            </div>
            <h1 className={styles.title}>{grupo.nombre}</h1>
            {grupo.descripcion && <p className={styles.subtitle}>{grupo.descripcion}</p>}
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: '#f8fafc', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '1.25rem' }}>👥</span>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', display: 'block' }}>Roster Directiva</span>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{grupo.miembros?.length || 0} directivos asignados</span>
            </div>
          </div>
        </section>

        {/* Grid Principal */}
        <div className={styles.grid}>
        {/* Nav Icon Tabs */}
        <div className={styles.tabList}>
          <button 
            onClick={() => setActiveTab("announcements")}
            className={`${styles.tabBtn} ${activeTab === "announcements" ? styles.tabBtnActive : ""}`}
            title="Comunicados y Acuerdos"
          >
            <span className={styles.tabBtnIcon}><img src="/Iconos SVG/comunicado.svg" alt="" /></span>
            <span className={styles.tabBtnLabel}>Comunicados</span>
          </button>
          <button 
            onClick={() => setActiveTab("agenda")}
            className={`${styles.tabBtn} ${activeTab === "agenda" ? styles.tabBtnActive : ""}`}
            title="Agenda y Calendario"
          >
            <span className={styles.tabBtnIcon}><img src="/Iconos SVG/Agenda.svg" alt="" /></span>
            <span className={styles.tabBtnLabel}>Agenda</span>
          </button>
          <button 
            onClick={() => setActiveTab("forum")}
            className={`${styles.tabBtn} ${activeTab === "forum" ? styles.tabBtnActive : ""}`}
            title="Foro de Directivos"
          >
            <span className={styles.tabBtnIcon}><img src="/Iconos SVG/contacto.svg" alt="" /></span>
            <span className={styles.tabBtnLabel}>Foro</span>
          </button>
          <button 
            onClick={() => setActiveTab("inventario")} 
            className={`${styles.tabBtn} ${activeTab === "inventario" ? styles.tabBtnActive : ""}`}
            title="Inventario"
          >
            <span className={styles.tabBtnIcon}><img src="/Iconos SVG/Proceso.svg" alt="" /></span>
            <span className={styles.tabBtnLabel}>Inventario</span>
          </button>
          <button
            onClick={() => setActiveTab("asistencia")}
            className={`${styles.tabBtn} ${activeTab === "asistencia" ? styles.tabBtnActive : ""}`}
            title="Asistencia"
          >
            <span className={styles.tabBtnIcon}><img src="/Iconos SVG/Miembros.svg" alt="" /></span>
            <span className={styles.tabBtnLabel}>Asistencia</span>
          </button>
          <button
            onClick={() => setActiveTab("presupuesto")}
            className={`${styles.tabBtn} ${activeTab === "presupuesto" ? styles.tabBtnActive : ""}`}
            title="Presupuesto"
          >
            <span className={styles.tabBtnIcon}><img src="/Iconos SVG/finanzas.svg" alt="" /></span>
            <span className={styles.tabBtnLabel}>Presupuesto</span>
          </button>
          <button
            onClick={() => setActiveTab("finanzas")}
            className={`${styles.tabBtn} ${activeTab === "finanzas" ? styles.tabBtnActive : ""}`}
            title="Finanzas del Ministerio"
          >
            <span className={styles.tabBtnIcon}><img src="/Iconos SVG/servicio.svg" alt="" /></span>
            <span className={styles.tabBtnLabel}>Finanzas</span>
          </button>
        </div>

            {/* CONTENIDO PESTAÑA: COMUNICADOS Y ACUERDOS */}
            {activeTab === "announcements" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {hasPostPermissions && (
                  <div className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h2 className={styles.cardTitle}>📢 Publicar Comunicado / Acuerdo</h2>
                    </div>
                    <form onSubmit={handlePostAgreement} style={{ display: 'flex', flexDirection: 'column' }}>
                      <input 
                        type="text" 
                        placeholder="Título del Comunicado..." 
                        value={newAgreementTitle}
                        onChange={(e) => setNewAgreementTitle(e.target.value)}
                        className={styles.input}
                        required
                      />
                      <textarea 
                        placeholder="Escribe el contenido detallado aquí..." 
                        value={newAgreementContent}
                        onChange={(e) => setNewAgreementContent(e.target.value)}
                        className={styles.textarea}
                        required
                      />
                      <button 
                        type="submit" 
                        className={styles.primaryBtn} 
                        style={{ alignSelf: 'flex-end' }}
                        disabled={agreementSubmitting}
                      >
                        {agreementSubmitting ? "Publicando..." : "Publicar Acuerdo"}
                      </button>
                    </form>
                  </div>
                )}

                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Historial de Comunicados</h2>
                  </div>

                  {grupo.acuerdos?.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', margin: '2rem 0' }}>
                      No se han publicado comunicados en este grupo.
                    </p>
                  ) : (
                    grupo.acuerdos?.map((ac: any) => (
                      <div key={ac.id} className={styles.announcementItem}>
                        <div className={styles.announcementHeader}>
                          <span className={styles.announcementTitle}>{ac.titulo}</span>
                          <span className={styles.announcementMeta}>
                            Por <strong>{ac.creado_por}</strong> • {formatDateStr(ac.fecha_publicacion)}
                          </span>
                        </div>
                        <p className={styles.announcementContent}>{ac.contenido}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* CONTENIDO PESTAÑA: AGENDA Y EVENTOS */}
            {activeTab === "agenda" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {hasPostPermissions && (
                  <div className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h2 className={styles.cardTitle}>📅 Programar Actividad</h2>
                    </div>
                    <form onSubmit={handlePostEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <input 
                        type="text" 
                        placeholder="Título del evento..." 
                        value={newEventTitle}
                        onChange={(e) => setNewEventTitle(e.target.value)}
                        className={styles.input}
                        required
                      />
                      <textarea 
                        placeholder="Descripción o lugar (Opcional)..." 
                        value={newEventDesc}
                        onChange={(e) => setNewEventDesc(e.target.value)}
                        className={styles.textarea}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Fecha</label>
                          <input 
                            type="date" 
                            value={newEventDate}
                            onChange={(e) => setNewEventDate(e.target.value)}
                            className={styles.input}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Hora (Opcional)</label>
                          <input 
                            type="text" 
                            placeholder="Ej: 7:00 PM"
                            value={newEventTime}
                            onChange={(e) => setNewEventTime(e.target.value)}
                            className={styles.input}
                          />
                        </div>
                      </div>
                      <button 
                        type="submit" 
                        className={styles.primaryBtn} 
                        style={{ alignSelf: 'flex-end' }}
                        disabled={eventSubmitting}
                      >
                        {eventSubmitting ? "Guardando..." : "Programar Evento"}
                      </button>
                    </form>
                  </div>
                )}

                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Próximas Actividades</h2>
                  </div>

                  {grupo.agenda?.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', margin: '2rem 0' }}>
                      No hay actividades programadas.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {grupo.agenda?.map((ev: any) => {
                        const dateObj = new Date(ev.fecha);
                        const day = dateObj.getDate();
                        const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
                        const month = months[dateObj.getMonth()];

                        return (
                          <div key={ev.id} className={styles.agendaItem}>
                            <div className={styles.agendaDateBox}>
                              <span className={styles.agendaDay}>{day}</span>
                              <span>{month}</span>
                            </div>
                            <div className={styles.agendaDetails}>
                              <span className={styles.agendaTitle}>{ev.titulo}</span>
                              {ev.hora && <span className={styles.agendaTime}>🕒 {ev.hora}</span>}
                              {ev.descripcion && <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>{ev.descripcion}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CONTENIDO PESTAÑA: FORO DE DISCUSIÓN */}
            {activeTab === "forum" && (
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>💬 Foro y Comentarios de la Directiva</h2>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                  <textarea 
                    placeholder="Escribe un mensaje o propuesta en el foro..." 
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className={styles.textarea}
                    style={{ margin: 0 }}
                  />
                  <button 
                    onClick={handlePostComment}
                    className={styles.primaryBtn}
                    style={{ padding: '0.75rem 1.25rem', height: 'fit-content' }}
                    disabled={commentSubmitting || !newCommentText.trim()}
                  >
                    {commentSubmitting ? "..." : "Enviar"}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {grupo.foro?.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', margin: '2rem 0' }}>
                      No hay comentarios. Sé el primero en iniciar el debate.
                    </p>
                  ) : (
                    grupo.foro?.map((comment: any) => {
                      const authorName = comment.usuario?.persona?.nombre || comment.usuario?.email.split("@")[0];
                      const avatar = authorName.charAt(0).toUpperCase();

                      return (
                        <div key={comment.id} className={styles.commentItem}>
                          <div className={styles.memberAvatar} style={{ background: '#f1f5f9', color: '#475569' }}>
                            {avatar}
                          </div>
                          <div className={styles.commentBody}>
                            <div className={styles.commentHeader}>
                              <span className={styles.commentAuthor}>{authorName}</span>
                              <span className={styles.commentDate}>{formatDateStr(comment.fecha)}</span>
                            </div>
                            <p className={styles.commentText}>{comment.comentario}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* CONTENIDO PESTAÑA: INVENTARIO */}
            {activeTab === "inventario" && (
              <InventarioModulo contextId={grupo.id} contextType="grupo_trabajo" />
            )}

            {/* CONTENIDO PESTAÑA: ASISTENCIA */}
            {activeTab === "asistencia" && (
              <AsistenciaModulo contextId={grupo.id} contextType="grupo_trabajo" miembros={todosMiembros} />
            )}

            {activeTab === "presupuesto" && grupo && (
              <PresupuestoModulo entidadId={grupo.id} entidadTipo="GRUPO_TRABAJO" />
            )}

            {activeTab === "finanzas" && grupo && (
              <FinanzasMinisterioModulo grupoId={grupo.id} nombreGrupo={grupo.nombre} tipoGrupo={grupo.tipo} />
            )}

          {/* Directivos */}
          <div className={styles.card} style={{ height: 'fit-content' }}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>👑 Directivos Activos</h2>
            </div>
            {grupo.miembros?.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                Sin miembros asignados en esta directiva.
              </p>
            ) : (
              <div className={styles.memberList}>
                {grupo.miembros?.map((m: any) => {
                  const name = m.usuario.persona?.nombre || m.usuario.email.split("@")[0];
                  const avatar = name.charAt(0).toUpperCase();

                  return (
                    <div key={m.id} className={styles.memberItem}>
                      <div className={styles.memberAvatar}>
                        {avatar}
                      </div>
                      <div>
                        <span className={styles.memberName}>{name}</span>
                        <span className={styles.memberPuesto}>{m.puesto}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        Igleconet SaaS • Espacio de Trabajo Colaborativo de Liderazgo
      </footer>
    </div>
  );
}

export default function LiderazgoGrupoPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <p style={{ color: '#64748b', fontWeight: 600 }}>Cargando...</p>
      </div>
    }>
      <LiderazgoGrupoContent />
    </Suspense>
  );
}
