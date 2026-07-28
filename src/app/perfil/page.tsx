"use client";
import { useState, useEffect } from "react";
import styles from "./perfil.module.css";
import Link from "next/link";

export default function Perfil() {
  const [user, setUser] = useState<any>(null);
  const [etapas, setEtapas] = useState<any[]>([]);
  const [procesos, setProcesos] = useState<any[]>([]);
  const [expandedStages, setExpandedStages] = useState<{[key: string]: boolean}>({});
  const [myWorkgroups, setMyWorkgroups] = useState<any[]>([]);
  const [allowOutOfOrder, setAllowOutOfOrder] = useState(true);

  // Estados para Mi Familia
  const [familia, setFamilia] = useState<any[]>([]);
  const [familiaLoading, setFamiliaLoading] = useState(true);
  const [familiarSearch, setFamiliarSearch] = useState("");
  const [familiarResult, setFamiliarResult] = useState<any[]>([]);
  const [familiarId, setFamiliarId] = useState("");
  const [familiarNombre, setFamiliarNombre] = useState("");
  const [rolFamiliar, setRolFamiliar] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  // Estados para Clases, Eventos y Promesas de Fe en Perfil
  const [actividades, setActividades] = useState<{
    clasesActivas: any[];
    clasesHistorial: any[];
    eventosInscritos: any[];
    eventosHistorial: any[];
    promesasFe: any[];
    agendaDepartamentos: any[];
  }>({
    clasesActivas: [],
    clasesHistorial: [],
    eventosInscritos: [],
    eventosHistorial: [],
    promesasFe: [],
    agendaDepartamentos: [],
  });
  const [activeTabPerfil, setActiveTabPerfil] = useState<"clases" | "eventos" | "promesas" | "historial">("clases");
  const [selectedClasePerfilIdx, setSelectedClasePerfilIdx] = useState<number>(0);
  const [selectedEventoModal, setSelectedEventoModal] = useState<any>(null);
  const [selectedPromesaModal, setSelectedPromesaModal] = useState<any>(null);

  useEffect(() => {
    const fetchActividades = async () => {
      try {
        const res = await fetch("/api/perfil/actividades");
        const data = await res.json();
        if (!data.error) {
          setActividades(data);
        }
      } catch (e) {
        console.error("Error loading profile activities:", e);
      }
    };
    fetchActividades();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("allowOutOfOrder");
      if (saved !== null) {
        setAllowOutOfOrder(saved === "true");
      }
    }
  }, []);

  // Búsqueda de familiares
  useEffect(() => {
    if (familiarSearch.length < 3) {
      setFamiliarResult([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/personas/search?q=${encodeURIComponent(familiarSearch)}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setFamiliarResult(data);
        }
      } catch (e) {
        console.error("Error searching familiar", e);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [familiarSearch]);

  const handleLinkFamily = async () => {
    if (!familiarId || !rolFamiliar) {
      alert("Selecciona un familiar y tu parentesco.");
      return;
    }
    setIsLinking(true);
    try {
      const res = await fetch("/api/perfil/familia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familiarId, rolFamiliar })
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert("¡Familia vinculada con éxito!");
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
      alert("Error al vincular familia");
    } finally {
      setIsLinking(false);
    }
  };

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editNombre, setEditNombre] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [editFechaNacimiento, setEditFechaNacimiento] = useState("");
  const [editSexo, setEditSexo] = useState("M");
  const [editFotoUrl, setEditFotoUrl] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const authRes = await fetch("/api/auth");
        const authData = await authRes.json();
        if (!authData.error) {
          setUser(authData);
          setEditNombre(authData.nombre || "");
          setEditTelefono(authData.telefono || "");
          setEditFechaNacimiento(authData.fechaNacimiento || "");
          setEditSexo(authData.sexo || "M");
          setEditFotoUrl(authData.foto_url || "");

          try {
            const lidRes = await fetch("/api/liderazgo");
            const lidData = await lidRes.json();
            if (!lidData.error && lidData.grupos) {
              const mine = lidData.grupos.filter((g: any) => 
                g.miembros?.some((m: any) => 
                  m.usuario_id === (authData.usuario_id || authData.id) ||
                  (authData.persona_id && m.usuario?.persona?.id === authData.persona_id)
                )
              );
              setMyWorkgroups(mine);
            }
          } catch (err) {
            console.error("Error loading leadership groups in profile", err);
          }
        }

        // Cargar familia
        try {
          const famRes = await fetch("/api/perfil/familia");
          const famData = await famRes.json();
          if (famData.familia) {
            setFamilia(famData.familia);
          }
        } catch (e) {
          console.error("Error loading family", e);
        } finally {
          setFamiliaLoading(false);
        }

        const configRes = await fetch("/api/iglesia");
        const configData = await configRes.json();
        if (!configData.error) {
          setEtapas(configData.etapas || []);
          setProcesos(configData.procesos || []);
        }
      } catch (e) {
        console.error("Error loading profile data", e);
      }
    };
    loadProfileData();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      if (res.ok) {
        window.location.href = "/";
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSwitchRole = async () => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "switch-role" }),
      });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      }
    } catch (e) {
      console.error("Error al cambiar de vista", e);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setProfileError(null);

    try {
      const res = await fetch("/api/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: editNombre,
          telefono: editTelefono,
          fechaNacimiento: editFechaNacimiento,
          sexo: editSexo,
          foto_url: editFotoUrl
        })
      });
      const data = await res.json();
      if (data.error) {
        setProfileError(data.error);
      } else {
        setUser(data);
        setEditFotoUrl(data.foto_url || "");
        setIsEditing(false);
        alert("¡Perfil actualizado con éxito!");
      }
    } catch (err) {
      console.error(err);
      setProfileError("Error al guardar los cambios.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert("El archivo original es muy grande. Selecciona una imagen menor de 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 120;
        canvas.height = 120;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, 120, 120);
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, 120, 120);
          const compressedBase64 = canvas.toDataURL("image/png");
          setEditFotoUrl(compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };


  const currentUser = user || {
    nombre: "Juan Pérez",
    telefono: "(809) 555-1234",
    fechaNacimiento: "1990-04-15",
    calculatedAge: 36,
    sexo: "M",
    sociedadName: "Sociedad de Jóvenes",
    grupoName: "Jóvenes Universitarios",
    etapa_id: "etapa-2",
    etapa_nombre: "Etapa 2: Nuevo Creyente",
    tareas_completadas: ["proc-4"]
  };

  const matchedMember = {
    tareas_completadas: currentUser.tareas_completadas || []
  };

  // Cargar lista de etapas de forma secuencial
  const activeEtapas = etapas.length > 0 ? etapas : [
    { id: "etapa-1", nombre_etapa: "Etapa 1: Visita Inicial", orden_secuencial: 1 },
    { id: "etapa-2", nombre_etapa: "Etapa 2: Nuevo Creyente", orden_secuencial: 2 },
    { id: "etapa-3", nombre_etapa: "Etapa 3: Miembro Activo", orden_secuencial: 3 }
  ];

  // Obtener tareas específicas de cada etapa
  const getTasksForStage = (stageId: string) => {
    if (procesos.length > 0) {
      return procesos.filter(p => p.etapa_id === stageId);
    }
    // Fallback si localstorage está vacío
    if (stageId === "etapa-1") {
      return [
        { id: "task-1-1", nombre_tarea: "Llamada de Primer Contacto", dias_limite: 1, es_obligatoria: true },
        { id: "task-1-2", nombre_tarea: "Visita en el hogar", dias_limite: 7, es_obligatoria: true }
      ];
    }
    if (stageId === "etapa-2") {
      return [
        { id: "task-2-1", nombre_tarea: "Llamada de Bienvenida", dias_limite: 3, es_obligatoria: true },
        { id: "task-2-2", nombre_tarea: "Asistencia a 4 Clases Bíblicas", dias_limite: 15, es_obligatoria: true }
      ];
    }
    if (stageId === "etapa-3") {
      return [
        { id: "task-3-1", nombre_tarea: "Curso de Liderazgo Básico", dias_limite: 30, es_obligatoria: true }
      ];
    }
    return [];
  };

  // Helper para formatear fecha de nacimiento
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Ordenar las etapas para asegurar la secuencia correcta
  const sortedEtapas = [...activeEtapas].sort((a, b) => a.orden_secuencial - b.orden_secuencial);

  const userStageObj = sortedEtapas.find(e => e.id === currentUser.etapa_id);

  // Determinar qué etapas están completadas
  const completedStageIds = sortedEtapas.filter(stage => {
    // Si hay una etapa asignada en la DB y el orden de esta etapa es menor, se marca como completada automáticamente (salteada)
    if (userStageObj) {
      if (stage.orden_secuencial < userStageObj.orden_secuencial) {
        return true;
      }
      if (stage.orden_secuencial === userStageObj.orden_secuencial) {
        return false;
      }
    }

    const stageTasks = getTasksForStage(stage.id);
    
    // Si la etapa no tiene tareas/procesos asignados
    if (stageTasks.length === 0) {
      if (currentUser.rol === "ADMIN_IGLESIA" || currentUser.rol === "SUPERADMIN") {
        return false;
      }
      
      const currentStageObj = sortedEtapas.find(e => e.id === currentUser.etapa_id);
      if (currentStageObj) {
        return stage.orden_secuencial < currentStageObj.orden_secuencial;
      }
      return false;
    }
    
    return stageTasks.every((t: any) => matchedMember.tareas_completadas.includes(t.id));
  }).map(s => s.id);

  // La etapa activa es la de la base de datos si está asignada; si no, la primera incompleta
  const activeStageId = userStageObj ? userStageObj.id : (sortedEtapas.find(stage => !completedStageIds.includes(stage.id))?.id || sortedEtapas[sortedEtapas.length - 1]?.id || null);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/hub" className={styles.backBtn} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <img src="/Iconos SVG/iglesia.png" alt="Mi Iglesia" style={{ width: '16px', height: '16px', objectFit: 'contain' }} /> <span className={styles.backBtnText}>Volver a Mi Iglesia</span>
          </Link>

        </div>
        <div className={styles.headerRight}>
          {user?.canSwitchRole && (
            <button
              onClick={handleSwitchRole}
              style={{
                background: user?.viewingAs === "MIEMBRO" ? "#f0fdf4" : "#eff6ff",
                color: user?.viewingAs === "MIEMBRO" ? "#166534" : "#1d4ed8",
                border: `1px solid ${user?.viewingAs === "MIEMBRO" ? "#bbf7d0" : "#bfdbfe"}`,
                padding: "0.35rem 0.75rem",
                borderRadius: "20px",
                fontWeight: 600,
                fontSize: "0.8rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                transition: "all 0.2s"
              }}
              title={user?.viewingAs === "MIEMBRO" ? "Ver como Admin" : "Ver como Miembro"}
            >
              {user?.viewingAs === "MIEMBRO" ? "👤 Miembro" : "👑 Admin"}
            </button>
          )}
          <div className={styles.headerTitle}>
            Mi Perfil
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              color: "#b91c1c",
              padding: "0",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            title="Cerrar Sesión"
            onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fef2f2"; }}
          >
            <img src="/Iconos SVG/salir.svg" alt="Salir" style={{ width: "18px", height: "18px", objectFit: "contain" }} />
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Tarjeta de Información Principal */}
        <section className={styles.profileCard}>
          <div className={styles.avatarContainer} style={{ position: 'relative' }}>
            <div className={styles.avatar} style={{ backgroundColor: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", overflow: 'hidden' }}>
              {editFotoUrl ? (
                <img src={editFotoUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '3rem' }}>{editSexo === "F" ? "👩" : "👤"}</span>
              )}
            </div>
            {isEditing && (
              <label style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                background: '#0284c7',
                color: 'white',
                border: '2px solid white',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                fontSize: '14px'
              }} title="Subir foto del rostro">
                📷
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarUpload} 
                  style={{ display: 'none' }} 
                />
              </label>
            )}
          </div>

          
          {isEditing ? (
            <form onSubmit={handleSaveProfile} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#1e293b' }}>Editar Mis Datos</h2>
              {profileError && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0 }}>⚠️ {profileError}</p>}
              
              <div className={styles.formGrid}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Nombre Completo</label>
                  <input
                    type="text"
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Teléfono</label>
                  <input
                    type="text"
                    value={editTelefono}
                    onChange={(e) => setEditTelefono(e.target.value)}
                    style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    placeholder="(809) 555-1234"
                  />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={editFechaNacimiento}
                    onChange={(e) => setEditFechaNacimiento(e.target.value)}
                    style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontFamily: 'inherit' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Género</label>
                  <select
                    value={editSexo}
                    onChange={(e) => setEditSexo(e.target.value)}
                    style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: 'white' }}
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
              </div>

              {/* Vinculación Familiar Integrada en Edición */}
              <div style={{ marginTop: '0.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1rem', color: '#1e293b', margin: '0 0 0.5rem 0' }}>👨‍👩‍👧‍👦 Vincular Familiar</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem 0' }}>Si tienes familiares ya registrados, vincúlalos aquí para unirlos a tu grupo familiar.</p>
                
                {familiarId ? (
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.75rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#166534', display: 'block' }}>Familiar seleccionado:</span>
                      <strong style={{ color: '#15803d', fontSize: '0.9rem' }}>{familiarNombre}</strong>
                    </div>
                    <button type="button" onClick={() => { setFamiliarId(""); setFamiliarNombre(""); setFamiliarSearch(""); setRolFamiliar(""); }} style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                  </div>
                ) : (
                  <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Buscar por nombre</label>
                    <input 
                      type="text" 
                      placeholder="Ej: María Gómez" 
                      value={familiarSearch} 
                      onChange={(e) => setFamiliarSearch(e.target.value)} 
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                    {isSearching && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Buscando...</div>}
                    
                    {familiarResult.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', marginTop: '4px', zIndex: 10, maxHeight: '150px', overflowY: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                        {familiarResult.map((fam) => (
                          <div 
                            key={fam.id} 
                            onClick={() => {
                              setFamiliarId(fam.id);
                              setFamiliarNombre(fam.nombre);
                              setFamiliarResult([]);
                            }}
                            style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}
                          >
                            <span style={{ fontWeight: 500 }}>{fam.nombre}</span>
                            {fam.familia_codigo && <span style={{ fontSize: '0.7rem', marginLeft: '0.5rem', backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '2px 4px', borderRadius: '4px' }}>Fam: {fam.familia_codigo}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {familiarId && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Tu parentesco con {familiarNombre}</label>
                      <select value={rolFamiliar} onChange={(e) => setRolFamiliar(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                        <option value="">Selecciona tu rol...</option>
                        <option value="ESPOSO">Soy su Esposo</option>
                        <option value="ESPOSA">Soy su Esposa</option>
                        <option value="PADRE">Soy su Padre</option>
                        <option value="MADRE">Soy su Madre</option>
                        <option value="HIJO">Soy su Hijo</option>
                        <option value="HIJA">Soy su Hija</option>
                        <option value="HERMANO">Soy su Hermano/a</option>
                      </select>
                    </div>
                    <button 
                      type="button"
                      onClick={handleLinkFamily}
                      disabled={!rolFamiliar || isLinking}
                      style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '6px', fontWeight: 600, cursor: (!rolFamiliar || isLinking) ? 'not-allowed' : 'pointer', opacity: (!rolFamiliar || isLinking) ? 0.7 : 1, fontSize: '0.85rem' }}
                    >
                      {isLinking ? 'Vinculando...' : 'Guardar Vínculo Familiar'}
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={saveLoading}
                  style={{ background: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {saveLoading ? "Guardando..." : "Guardar Cambios"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditNombre(currentUser.nombre);
                    setEditTelefono(currentUser.telefono);
                    setEditFechaNacimiento(currentUser.fechaNacimiento);
                    setEditSexo(currentUser.sexo);
                  }}
                  style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.userInfo}>
              <div className={styles.userInfoHeader}>
                <h1 style={{ margin: 0 }}>{currentUser.nombre}</h1>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setIsEditing(true)}
                      style={{
                        background: '#e0f2fe',
                        border: '1px solid #bae6fd',
                        color: '#0369a1',
                        borderRadius: '6px',
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#bae6fd"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#e0f2fe"; }}
                    >
                      ✏️ Editar Perfil
                    </button>
                </div>
              </div>
              <p className={styles.userSubtitle} style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                <span>Ruta: {currentUser.etapa_nombre}</span>
              </p>

              {/* Fecha de nacimiento y género — justo debajo de Ruta */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', margin: '-0.4rem 0 0 0', fontSize: '0.83rem', color: '#64748b' }}>
                {currentUser.fechaNacimiento && (
                  <span>🎂 {formatDate(currentUser.fechaNacimiento)} ({currentUser.calculatedAge} años)</span>
                )}
                {currentUser.sexo && (
                  <span>🚻 {currentUser.sexo === "M" ? "Masculino" : "Femenino"}</span>
                )}
              </div>

              {familia.length > 0 && (
                <div style={{ margin: '0.75rem 0 0 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.85rem' }}>👨‍👩‍👧‍👦</span>
                    <span style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '1px 7px', borderRadius: '4px', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                      {familia[0].familia_codigo}
                    </span>
                  </div>
                  {familia.filter(fam => fam.id !== currentUser.persona_id).length > 0 && (
                    <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: '0.1rem 0 0 0' }}>
                      {familia.filter(fam => fam.id !== currentUser.persona_id).map(fam => `${fam.nombre}${fam.rol_familiar ? ` (${fam.rol_familiar})` : ''}`).join(' · ')}
                    </p>
                  )}
                </div>
              )}
              
              {/* Detalles de Auto Asignación */}
              <div style={{ display: 'flex', gap: '0.75rem', margin: '0.75rem 0', flexWrap: 'wrap' }}>
                <span style={{ background: '#f1f5f9', color: '#334155', padding: '3px 10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                  Sociedad: {currentUser.sociedadName}{currentUser.grupoName ? ` / ${currentUser.grupoName}` : ''}
                </span>
              </div>

              <div className={styles.contactInfo}>
                <div className={styles.contactItem}>
                  📱 {currentUser.telefono}
                </div>
                {currentUser.correo && (
                  <div className={styles.contactItem}>
                    ✉️ {currentUser.correo}
                  </div>
                )}
              </div>

              {/* Accesos Rápidos Nav Style */}
              <div className={styles.leaderBadges} style={{ paddingBottom: '1rem' }}>
                {currentUser.rol === "ADMIN_IGLESIA" && (
                  <Link href="/admin" className={styles.leaderBadge} title="Configurar Iglesia">
                    <span className={styles.badgeIcon}><img src="/Iconos SVG/dashboard.png" alt="" /></span>
                    <span className={styles.badgeText}>Admin Iglesia</span>
                  </Link>
                )}
                {currentUser.rol === "LIDER" && currentUser.paginas_acceso && (
                  <Link href="/admin" className={styles.leaderBadge} title="Panel de Administración">
                    <span className={styles.badgeIcon}><img src="/Iconos SVG/dashboard.png" alt="" /></span>
                    <span className={styles.badgeText}>Liderazgo</span>
                  </Link>
                )}
                {currentUser.rol === "SUPERADMIN" && (
                  <Link href="/admin" className={styles.leaderBadge} title="Configurar esta Iglesia">
                    <span className={styles.badgeIcon}><img src="/Iconos SVG/dashboard.png" alt="" /></span>
                    <span className={styles.badgeText}>Config Iglesia</span>
                  </Link>
                )}
                {currentUser.rol === "SUPERADMIN" && (
                  <Link href="/superadmin" className={styles.leaderBadge} title="Consola de Super Administrador">
                    <span className={styles.badgeIcon}><img src="/Iconos SVG/Identidad-2.svg" alt="" /></span>
                    <span className={styles.badgeText}>Superadmin</span>
                  </Link>
                )}
                {(currentUser.rol === "LIDER" || currentUser.rol === "ADMIN_IGLESIA" || currentUser.rol === "SUPERADMIN") && (
                  <Link href="/sociedad" className={styles.leaderBadge} title="Panorama de Sociedades y Grupos">
                    <span className={styles.badgeIcon}><img src="/Iconos SVG/Sociedad.svg" alt="" /></span>
                    <span className={styles.badgeText}>Sociedades</span>
                  </Link>
                )}
                <Link href="/grupo" className={styles.leaderBadge} title="Mi Grupo de Conexión">
                  <span className={styles.badgeIcon}><img src="/Iconos SVG/Miembros.svg" alt="" /></span>
                  <span className={styles.badgeText}>Mi Grupo</span>
                </Link>

                {myWorkgroups.map((group: any) => {
                  const mb = group.miembros?.find((m: any) => 
                    m.usuario_id === currentUser.usuario_id ||
                    m.usuario_id === currentUser.id ||
                    (currentUser.persona_id && m.usuario?.persona?.id === currentUser.persona_id)
                  );
                  const puesto = mb?.puesto || "Líder";
                  
                  let iconSrc = '/Iconos SVG/servicio.svg';
                  if (group.tipo === "CUERPO_OFICIAL") iconSrc = '/Iconos SVG/Identidad-2.svg';
                  else if (group.tipo === "MINISTERIO") iconSrc = '/Iconos SVG/pastoral.svg';
                  else if (group.tipo === "INSTITUCION") iconSrc = '/Iconos SVG/iglesia.png';

                  return (
                    <Link 
                      key={group.id}
                      href={`/liderazgo-grupo?id=${group.id}`} 
                      className={styles.leaderBadge} 
                      title={`${group.nombre} - ${puesto}`}
                    >
                      <span className={styles.badgeIcon}><img src={iconSrc} alt="" /></span>
                      <span className={styles.badgeText}>{group.nombre}</span>
                    </Link>
                  );
                })}

                {/* Acceso a Cursos y Eventos Inscritos */}
                {actividades.eventosInscritos.map((ev: any) => {
                  const isCurso = ev.tipo === 'CLASE' || ev.tipo === 'CURSO' || ev.tipo === 'TALLER';
                  return (
                    <button
                      key={ev.evento_id}
                      onClick={() => setSelectedEventoModal(ev)}
                      className={styles.leaderBadge}
                      title={`${isCurso ? 'Curso' : 'Evento'}: ${ev.nombre}`}
                    >
                      <span className={styles.badgeIcon}><img src={isCurso ? '/Iconos SVG/Formulario.svg' : '/Iconos SVG/Ebento.svg'} alt="" /></span>
                      <span className={styles.badgeText}>{ev.nombre}</span>
                    </button>
                  );
                })}

                {/* Acceso a Promesas de Fe Activas */}
                {actividades.promesasFe.filter((pf: any) => pf.estado === 'ACTIVA').map((pf: any) => (
                  <button
                    key={pf.id}
                    onClick={() => setSelectedPromesaModal(pf)}
                    className={styles.leaderBadge}
                    title={`Promesa de Fe: ${pf.proyecto_nombre}`}
                  >
                    <span className={styles.badgeIcon}><img src="/Iconos SVG/Peticiones.svg" alt="" /></span>
                    <span className={styles.badgeText}>{pf.proyecto_nombre}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Ruta de Crecimiento (Timeline Dinámico) */}
        <section className={styles.timelineCard}>
          <h2 className={styles.sectionTitle}>Mi Ruta de Crecimiento</h2>
          
          <div className={styles.timeline}>
            
            {sortedEtapas.map((stage) => {
              const order = stage.orden_secuencial;
              const isStageCompleted = completedStageIds.includes(stage.id);
              const isStageActive = stage.id === activeStageId;
              
              // Determinar estado de la etapa
              let stageClass = styles.locked;
              let iconContent = `${order}`;
              
              if (isStageCompleted) {
                stageClass = styles.completed;
                iconContent = "✓";
              } else if (isStageActive) {
                stageClass = styles.active;
              }

              const stageTasks = getTasksForStage(stage.id);
              const isExpanded = expandedStages[stage.id] !== undefined ? expandedStages[stage.id] : isStageActive;

              return (
                <div key={stage.id} className={`${styles.stage} ${stageClass}`}>
                  <div className={styles.stageIcon}>{iconContent}</div>
                  <div className={styles.stageContent} style={{ width: '100%' }}>
                    {/* Header Clickable para colapsar/desplegar */}
                    <div 
                      onClick={() => setExpandedStages(prev => ({ ...prev, [stage.id]: !isExpanded }))}
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        userSelect: 'none',
                        width: '100%',
                        paddingBottom: isExpanded ? '0.5rem' : '0'
                      }}
                      title="Haz clic para desplegar/ocultar procesos"
                    >
                      <h3 className={styles.stageTitle} style={{ margin: 0 }}>{stage.nombre_etapa}</h3>
                      <span style={{ 
                        fontSize: '0.78rem', 
                        color: isStageActive ? '#0284c7' : '#64748b', 
                        fontWeight: 600,
                        backgroundColor: isStageActive ? '#e0f2fe' : '#f1f5f9',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        transition: 'all 0.2s'
                      }}>
                        {isExpanded ? 'Ocultar ▲' : 'Ver procesos ▼'}
                      </span>
                    </div>

                    {isExpanded && (
                      <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                        {isStageActive && (
                          <p className={styles.stageDesc} style={{ marginTop: '0.25rem' }}>
                            Estás consolidando tu fe en esta etapa. Completa los siguientes procesos asignados por los líderes para avanzar:
                          </p>
                        )}

                        {isStageCompleted && (
                          <p className={styles.stageDesc} style={{ color: '#059669', fontWeight: 500, marginTop: '0.25rem' }}>
                            ¡Completado con éxito!
                          </p>
                        )}

                        {!isStageActive && !isStageCompleted && (
                          <p className={styles.stageDesc} style={{ marginTop: '0.25rem' }}>
                            Etapa bloqueada. Debes graduar las etapas anteriores para desbloquear estos procesos.
                          </p>
                        )}

                        {/* Listar tareas si es la etapa activa o completada */}
                        {(isStageActive || isStageCompleted) && stageTasks.length > 0 && (
                          <div className={styles.tasksList}>
                            {(() => {
                              const activeTaskObj = stageTasks.find((t: any) => !matchedMember.tareas_completadas.includes(t.id));
                              const activeTaskId = activeTaskObj ? activeTaskObj.id : null;

                              return stageTasks.map((t: any) => {
                                const isDone = matchedMember.tareas_completadas.includes(t.id);
                                const isTaskActive = t.id === activeTaskId && isStageActive;
                                const isTaskWaiting = !allowOutOfOrder && !isDone && !isTaskActive;

                                return (
                                  <div key={t.id} className={styles.taskItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '600px', margin: '0.4rem 0', opacity: isTaskWaiting ? 0.65 : 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      {isDone ? (
                                        <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem', marginRight: '0.15rem' }}>☑</span>
                                      ) : (isTaskActive || allowOutOfOrder) ? (
                                        <span style={{ color: '#d97706', fontWeight: 'bold', fontSize: '1.1rem', marginRight: '0.15rem' }}>☐</span>
                                      ) : (
                                        <span style={{ color: '#94a3b8', fontSize: '0.95rem', marginRight: '0.15rem' }}>🔒</span>
                                      )}
                                      <span style={{ 
                                        fontWeight: 500, 
                                        textDecoration: isDone ? 'line-through' : 'none', 
                                        color: isDone || isTaskWaiting ? '#94a3b8' : '#1e293b' 
                                      }}>
                                        {t.nombre_tarea}
                                      </span>
                                    </div>
                                    
                                    {isDone ? (
                                      <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                        ✓ Completado
                                      </span>
                                    ) : (isTaskActive || allowOutOfOrder) ? (
                                      <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                        {isTaskActive ? "⚡ En curso" : "⚡ Pendiente"}
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                        En espera
                                      </span>
                                    )}
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

          </div>
        </section>

        {/* Tarjeta de Pendientes y Compromisos de la Semana */}
        <section className={styles.timelineCard} style={{ marginTop: '1.5rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
          <h2 className={styles.sectionTitle} style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📅 Mis Pendientes y Actividades de la Semana
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {/* Reunión del Grupo de Conexión */}
            {currentUser.grupoName && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase' }}>
                  👥 Grupo de Conexión
                </span>
                <h4 style={{ margin: '0.2rem 0 0.3rem 0', fontSize: '1rem', color: '#0f172a' }}>
                  {currentUser.grupoName}
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569' }}>
                  Reunión semanal asignada según tu perfil.
                </p>
                <Link href="/grupo" style={{ display: 'inline-block', marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#16a34a', textDecoration: 'underline' }}>
                  Ir a Mi Grupo ➔
                </Link>
              </div>
            )}

            {/* Reuniones de Departamentos / Ministerios */}
            {actividades.agendaDepartamentos && actividades.agendaDepartamentos.map((r: any) => (
              <div key={r.id} style={{ background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: '10px', padding: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#db2777', textTransform: 'uppercase' }}>
                  🏛️ {r.grupo_nombre}
                </span>
                <h4 style={{ margin: '0.2rem 0 0.3rem 0', fontSize: '1rem', color: '#0f172a' }}>
                  {r.titulo}
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569' }}>
                  🗓️ {new Date(r.fecha).toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' })} {r.hora ? `@ ${r.hora}` : ''}
                </p>
                {r.descripcion && <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>{r.descripcion}</p>}
                <Link href={`/liderazgo-grupo?id=${r.grupo_trabajo_id}`} style={{ display: 'inline-block', marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#db2777', textDecoration: 'underline' }}>
                  Ir a Mi Departamento ➔
                </Link>
              </div>
            ))}

            {/* Próximas Clases o Eventos de la Semana */}
            {actividades.eventosInscritos.length > 0 ? (
              actividades.eventosInscritos.slice(0, 2).map((ev: any) => (
                <div key={ev.evento_id} style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>
                    {ev.tipo === 'CLASE' ? '📚 Curso Inscrito' : '🎉 Evento Programado'}
                  </span>
                  <h4 style={{ margin: '0.2rem 0 0.3rem 0', fontSize: '1rem', color: '#0f172a' }}>
                    {ev.nombre}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569' }}>
                    🗓️ {new Date(ev.fecha_inicio).toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <button
                    onClick={() => setSelectedEventoModal(ev)}
                    style={{ background: 'none', border: 'none', padding: 0, marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#0284c7', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Ver Detalles ➔
                  </button>
                </div>
              ))
            ) : (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                No tienes eventos adicionales pendientes para esta semana.
              </div>
            )}
          </div>
        </section>
      </main>

      {/* MODAL DE DETALLES DEL EVENTO */}
      {selectedEventoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '1rem' }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '560px', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button
              onClick={() => setSelectedEventoModal(null)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold', color: '#64748b' }}
            >
              ✕
            </button>

            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0284c7', background: '#e0f2fe', padding: '3px 10px', borderRadius: '10px', textTransform: 'uppercase' }}>
              {selectedEventoModal.tipo === 'CLASE' ? '📚 TALLER / CLASE' : '🎉 DETALLES DEL EVENTO'}
            </span>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0.5rem 0' }}>
              {selectedEventoModal.nombre}
            </h2>

            {selectedEventoModal.imagen_url && (
              <img src={selectedEventoModal.imagen_url} alt={selectedEventoModal.nombre} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '10px', margin: '0.75rem 0' }} />
            )}

            <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.5', margin: '0 0 1rem 0' }}>
              {selectedEventoModal.descripcion || 'Sin descripción detallada.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
              <div>🗓️ <strong>Fecha de Inicio:</strong> {new Date(selectedEventoModal.fecha_inicio).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              {selectedEventoModal.fecha_fin && <div>🏁 <strong>Fecha de Finalización:</strong> {new Date(selectedEventoModal.fecha_fin).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>}
              {selectedEventoModal.base_biblica && <div>📜 <strong>Base Bíblica:</strong> {selectedEventoModal.base_biblica}</div>}
              {selectedEventoModal.objetivo_general && <div>🎯 <strong>Objetivo General:</strong> {selectedEventoModal.objetivo_general}</div>}
              {selectedEventoModal.objetivo_especifico && <div>📌 <strong>Objetivo Específico:</strong> {selectedEventoModal.objetivo_especifico}</div>}
              <div>💵 <strong>Inversión / Costo:</strong> {selectedEventoModal.precio > 0 ? `$${selectedEventoModal.precio}` : 'Gratuito'}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                onClick={() => setSelectedEventoModal(null)}
                style={{ background: '#0284c7', color: 'white', border: 'none', padding: '0.65rem 1.5rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
              >
                Cerrar Vista
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className={styles.footer}>
        Igleconexion SaaS • Gestión de Crecimiento
      </footer>
    </div>
  );
}
