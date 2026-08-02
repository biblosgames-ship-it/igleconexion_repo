"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "../grupo/grupo.module.css";

function GrupoFamiliaContent() {
  const searchParams = useSearchParams();
  const grupoIdParam = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [grupoData, setGrupoData] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeRoleView, setActiveRoleView] = useState<"member" | "leader">("member");
  const [isLeaderOfGroup, setIsLeaderOfGroup] = useState(false);

  // Pestaña activa vista líder
  const [leaderSubTab, setLeaderSubTab] = useState<"kanban" | "asistencia" | "acuerdos" | "necesidades" | "info">("kanban");

  // Formularios líder
  const [newAcuerdoTitulo, setNewAcuerdoTitulo] = useState("");
  const [newAcuerdoContenido, setNewAcuerdoContenido] = useState("");
  const [newNecesidadDesc, setNewNecesidadDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadGrupoFamilia = async () => {
    setLoading(true);
    try {
      const [authRes, grupoRes] = await Promise.all([
        fetch("/api/auth").catch(() => null),
        fetch(`/api/grupos-familia?id=${grupoIdParam || ""}`).catch(() => null),
      ]);

      if (authRes && authRes.ok) {
        const authData = await authRes.json();
        setProfile(authData);
      }

      if (grupoRes && grupoRes.ok) {
        const gData = await grupoRes.json();
        if (gData.grupo) {
          setGrupoData(gData.grupo);

          // Verificar si el usuario actual es líder del grupo o admin
          if (profile) {
            const isAdmin = profile.rol === "ADMIN_IGLESIA" || profile.rol === "SUPERADMIN";
            const isDirectiva = gData.grupo.lideres_modulo?.some((l: any) => l.usuario_id === profile.id);
            setIsLeaderOfGroup(isAdmin || isDirectiva);
          }
        }
      }
    } catch (e) {
      console.error("Error cargando Grupo de Familia:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrupoFamilia();
  }, [grupoIdParam]);

  const handleCreateAcuerdo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAcuerdoTitulo.trim() || !newAcuerdoContenido.trim() || !grupoData) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/grupos-familia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createAcuerdoGrupoFamilia",
          data: {
            grupo_familia_id: grupoData.id,
            titulo: newAcuerdoTitulo.trim(),
            contenido: newAcuerdoContenido.trim(),
            creado_por: profile?.persona?.nombre || "Líder de Grupo"
          }
        })
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      else {
        setNewAcuerdoTitulo("");
        setNewAcuerdoContenido("");
        loadGrupoFamilia();
      }
    } catch (err) {
      alert("Error al publicar acuerdo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportNecesidad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNecesidadDesc.trim() || !grupoData) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/grupos-familia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reportNecesidadFamilia",
          data: {
            grupo_familia_id: grupoData.id,
            solicitante_nombre: profile?.persona?.nombre || "Miembro de la Iglesia",
            descripcion: newNecesidadDesc.trim(),
            familia_codigo: profile?.persona?.familia_codigo || null
          }
        })
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      else {
        setNewNecesidadDesc("");
        alert("Petición / Necesidad enviada a la directiva del grupo.");
        loadGrupoFamilia();
      }
    } catch (err) {
      alert("Error al enviar petición.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p style={{ color: '#64748b' }}>Cargando Grupo de Familia...</p>
      </div>
    );
  }

  if (!grupoData) {
    return (
      <div className={styles.container} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <h2>Grupo de Familia no encontrado</h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>No se pudo cargar la información del Grupo de Familia.</p>
        <Link href="/hub">
          <button style={{ padding: '0.6rem 1.25rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
            Volver a Mi Iglesia
          </button>
        </Link>
      </div>
    );
  }

  const iconDisplay = grupoData.logo_url || "/Iconos SVG/Grupo de conexion.svg";

  return (
    <div className={styles.container}>
      {/* Botón Volver a Mi Iglesia */}
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/hub" style={{ textDecoration: 'none' }}>
          <button 
            type="button" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              padding: '0.45rem 0.9rem', 
              borderRadius: '8px', 
              border: '1px solid #cbd5e1', 
              backgroundColor: 'white', 
              color: '#334155', 
              fontSize: '0.85rem', 
              fontWeight: 700, 
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
          >
            ← Volver a Mi Iglesia
          </button>
        </Link>
      </div>

      {/* Header del Grupo de Familia */}
      <header className={styles.headerBanner} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: 'linear-gradient(135deg, #0284c7 0%, #0f172a 100%)', padding: '1.5rem', borderRadius: '16px', color: 'white', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem' }}>
            {iconDisplay.startsWith('/') ? (
              <img src={iconDisplay} alt={grupoData.nombre_grupo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: '2rem' }}>{iconDisplay}</span>
            )}
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', padding: '2px 10px', borderRadius: '12px' }}>
              Grupo #{grupoData.numero_grupo}
            </span>
            <h1 style={{ margin: '0.2rem 0 0 0', fontSize: '1.4rem', fontWeight: 800 }}>{grupoData.nombre_grupo}</h1>
          </div>
        </div>

        {/* Interruptor Vista Miembro / Vista Líder */}
        <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '30px', padding: '4px' }}>
          <button
            onClick={() => setActiveRoleView("member")}
            style={{
              padding: '0.4rem 1.25rem',
              borderRadius: '20px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              background: activeRoleView === "member" ? "white" : "transparent",
              color: activeRoleView === "member" ? "#0284c7" : "white"
            }}
          >
            👁️ Miembro
          </button>
          {isLeaderOfGroup && (
            <button
              onClick={() => setActiveRoleView("leader")}
              style={{
                padding: '0.4rem 1.25rem',
                borderRadius: '20px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                background: activeRoleView === "leader" ? "white" : "transparent",
                color: activeRoleView === "leader" ? "#0284c7" : "white"
              }}
            >
              ⚙️ Líder / Directiva
            </button>
          )}
        </div>
      </header>

      {/* Mensaje de Bienvenida Confidential/Warm */}
      <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', padding: '1.25rem', borderRadius: '12px', border: '1px solid #bbf7d0', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ fontSize: '2rem' }}>👋</div>
        <div>
          <h3 style={{ margin: 0, color: '#166534', fontSize: '1.1rem', fontWeight: 800 }}>
            ¡Bienvenido/a a {grupoData.nombre_grupo}, {profile?.persona?.nombre || "Hermano/a"}!
          </h3>
          <p style={{ margin: '0.2rem 0 0 0', color: '#15803d', fontSize: '0.88rem', lineHeight: 1.4 }}>
            Nos alegra tenerte en nuestra gran familia de fe. Este es tu espacio para mantenerte conectado, compartir peticiones y participar en todas las actividades del grupo.
          </p>
        </div>
      </div>

      {/* VISTA MIEMBRO */}
      {activeRoleView === "member" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Calendario y Agenda Interna del Grupo */}
          <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📅 Calendario y Agenda del Grupo
              </h3>
              {grupoData.acuerdos && grupoData.acuerdos.length > 0 && (
                <span style={{ fontSize: '0.75rem', fontWeight: 800, backgroundColor: '#fef3c7', color: '#b45309', padding: '3px 10px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  🔔 {grupoData.acuerdos.length} Actividades Pendientes
                </span>
              )}
            </div>

            {grupoData.acuerdos && grupoData.acuerdos.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
                {grupoData.acuerdos.map((act: any) => (
                  <div key={act.id} style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.72rem', backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                          PENDIENTE
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>📅 {new Date(act.fecha_publicacion).toLocaleDateString('es-ES')}</span>
                      </div>
                      <strong style={{ fontSize: '0.92rem', color: '#0f172a', display: 'block', marginBottom: '0.3rem' }}>{act.titulo}</strong>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.3 }}>{act.contenido}</p>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#0284c7', marginTop: '0.5rem', fontWeight: 600 }}>Asignado por directiva</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                No hay reuniones o actividades pendientes asignadas en el calendario.
              </div>
            )}
          </div>

          {/* Directiva y aviso */}
          <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: 800 }}>👤 Directiva del Grupo</h3>
            {grupoData.lideres_modulo && grupoData.lideres_modulo.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {grupoData.lideres_modulo.map((l: any) => (
                  <div key={l.id} style={{ background: '#f8fafc', padding: '0.5rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong style={{ display: 'block', fontSize: '0.88rem', color: '#0f172a' }}>{l.usuario.persona?.nombre || l.usuario.email}</strong>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>📞 {l.usuario.persona?.telefono || 'Sin teléfono'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0, fontSize: '0.85rem' }}>No hay directiva asignada a este grupo de familia.</p>
            )}
          </div>

          {/* Acuerdos y Avisos */}
          <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: 800 }}>📢 Acuerdos y Anuncios del Grupo</h3>
            {grupoData.acuerdos && grupoData.acuerdos.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {grupoData.acuerdos.map((ac: any) => (
                  <div key={ac.id} style={{ padding: '0.85rem', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #16a34a' }}>
                    <strong style={{ display: 'block', color: '#166534', fontSize: '0.95rem', marginBottom: '0.25rem' }}>{ac.titulo}</strong>
                    <p style={{ margin: '0 0 0.35rem 0', fontSize: '0.85rem', color: '#334155', lineHeight: 1.4 }}>{ac.contenido}</p>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Publicado por {ac.creado_por} • {new Date(ac.fecha_publicacion).toLocaleDateString('es-ES')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0, fontSize: '0.85rem' }}>No hay anuncios ni acuerdos publicados recientemente.</p>
            )}
          </div>

          {/* Formulario de Petición o Necesidad Familiar */}
          <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: 800 }}>🙏 Enviar Petición o Necesidad Familiar</h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#64748b' }}>Escribe cualquier necesidad o petición de oración. Los líderes del grupo le darán seguimiento pastoral confidencial.</p>
            
            <form onSubmit={handleReportNecesidad} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <textarea
                required
                rows={3}
                placeholder="Describe aquí tu petición o necesidad..."
                value={newNecesidadDesc}
                onChange={(e) => setNewNecesidadDesc(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', resize: 'none' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={submitting} style={{ background: '#0284c7', color: 'white', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                  {submitting ? "Enviando..." : "Enviar Petición"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VISTA LÍDER / DIRECTIVA (PANEL KANBAN Y GESTIÓN) */}
      {activeRoleView === "leader" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Navegación Subpestañas Líder */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: "kanban", label: "📊 Panel Kanban de Integrantes" },
              { id: "acuerdos", label: "📅 Asignar Calendario y Anuncios" },
              { id: "necesidades", label: "🙏 Necesidades Reportadas" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setLeaderSubTab(tab.id as any)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  background: leaderSubTab === tab.id ? '#0284c7' : '#f1f5f9',
                  color: leaderSubTab === tab.id ? 'white' : '#475569'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Subpestaña 1: KANBAN DE INTEGRANTES */}
          {leaderSubTab === "kanban" && (
            <div>
              <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: 800 }}>📋 Integrantes del Grupo ({grupoData.personas ? grupoData.personas.length : 0})</h3>
              {(!grupoData.personas || grupoData.personas.length === 0) ? (
                <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '12px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b' }}>
                  No hay personas o familias asignadas a este grupo de familia aún.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                  {grupoData.personas.map((p: any) => (
                    <div key={p.id} style={{ background: 'white', borderRadius: '10px', border: '1px solid #cbd5e1', padding: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                      <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0f172a', marginBottom: '0.2rem' }}>{p.nombre}</strong>
                      <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                        Etapa: {p.etapa?.nombre_etapa || 'Sin etapa'}
                      </span>
                      {p.familia_codigo && (
                        <span style={{ fontSize: '0.72rem', backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          Código Familia: {p.familia_codigo}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Subpestaña 2: ACUERDOS */}
          {leaderSubTab === "acuerdos" && (
            <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: 800 }}>➕ Publicar Nuevo Acuerdo / Anuncio</h3>
              <form onSubmit={handleCreateAcuerdo} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input
                  type="text"
                  required
                  placeholder="Título del anuncio..."
                  value={newAcuerdoTitulo}
                  onChange={(e) => setNewAcuerdoTitulo(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
                <textarea
                  required
                  rows={3}
                  placeholder="Contenido del mensaje..."
                  value={newAcuerdoContenido}
                  onChange={(e) => setNewAcuerdoContenido(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', resize: 'none' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" disabled={submitting} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                    {submitting ? "Publicando..." : "Publicar Anuncio"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Subpestaña 3: NECESIDADES */}
          {leaderSubTab === "necesidades" && (
            <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: 800 }}>🙏 Necesidades y Peticiones Reportadas</h3>
              {grupoData.necesidades && grupoData.necesidades.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {grupoData.necesidades.map((nec: any) => (
                    <div key={nec.id} style={{ padding: '0.85rem', background: '#fef2f2', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <strong style={{ color: '#991b1b', fontSize: '0.9rem' }}>{nec.solicitante_nombre} {nec.familia_codigo ? `(${nec.familia_codigo})` : ''}</strong>
                        <span style={{ fontSize: '0.72rem', backgroundColor: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          {nec.estado}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155' }}>{nec.descripcion}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0, fontSize: '0.85rem' }}>No hay peticiones de necesidades pendientes.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GrupoFamiliaPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Cargando página...</div>}>
      <GrupoFamiliaContent />
    </Suspense>
  );
}
