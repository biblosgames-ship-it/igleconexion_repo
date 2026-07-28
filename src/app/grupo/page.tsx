"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./grupo.module.css";

function GrupoContent() {
  const searchParams = useSearchParams();
  const targetGroupId = searchParams.get("id");

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data States
  const [profile, setProfile] = useState<any>(null); // from /api/auth
  const [adminConfig, setAdminConfig] = useState<any>(null); // from /api/admin
  const [groupData, setGroupData] = useState<any>(null); // from /api/grupo

  // UI Active Roles and Subtabs
  const [activeRoleView, setActiveRoleView] = useState<"member" | "leader">("member");
  const [selectedDirigidoId, setSelectedDirigidoId] = useState<string>("");
  const [leaderSubTab, setLeaderSubTab] = useState<"kanban" | "attendance" | "agreements" | "agenda" | "forum" | "info" | "biblia">("kanban");
  const [selectedClaseIdx, setSelectedClaseIdx] = useState<number>(0);

  // Group Info Editor states (Leaders)
  const [editLugarReunion, setEditLugarReunion] = useState("");
  const [editDiaReunion, setEditDiaReunion] = useState("");
  const [editMensajeBienvenida, setEditMensajeBienvenida] = useState("");
  const [infoSubmitting, setInfoSubmitting] = useState(false);

  // Clase Bíblica Form states (Leaders)
  const [claseFecha, setClaseFecha] = useState("");
  const [claseSerie, setClaseSerie] = useState("");
  const [claseTema, setClaseTema] = useState("");
  const [claseTextoClave, setClaseTextoClave] = useState("");
  const [claseVerdadCentral, setClaseVerdadCentral] = useState("");
  const [claseObjetivo, setClaseObjetivo] = useState("");
  const [clasePuntos, setClasePuntos] = useState<Array<{ titulo: string; citas: string; descripcion: string }>>([
    { titulo: "", citas: "", descripcion: "" },
    { titulo: "", citas: "", descripcion: "" },
    { titulo: "", citas: "", descripcion: "" },
  ]);
  const [claseSubmitting, setClaseSubmitting] = useState(false);

  // Kanban details modal
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [activeLeaderStageId, setActiveLeaderStageId] = useState<string>("");
  const [expandedKanbanCards, setExpandedKanbanCards] = useState<Set<string>>(new Set());
  const [isMobileKanban, setIsMobileKanban] = useState(false);

  useEffect(() => {
    const check = () => setIsMobileKanban(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Forms states
  const [newCommentText, setNewCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Attendance states
  const [attendanceDate, setAttendanceDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [attendanceTitle, setAttendanceTitle] = useState("Reunión Semanal del Grupo");
  const [presentIds, setPresentIds] = useState<string[]>([]);
  const [attendanceSubmitting, setAttendanceSubmitting] = useState(false);

  // Agreement states
  const [agreementTitle, setAgreementTitle] = useState("");
  const [agreementContent, setAgreementContent] = useState("");
  const [agreementSubmitting, setAgreementSubmitting] = useState(false);

  // Agenda event states
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventSubmitting, setEventSubmitting] = useState(false);
  // Add Member Modal states
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberNombre, setNewMemberNombre] = useState("");
  const [newMemberTelefono, setNewMemberTelefono] = useState("");
  const [newMemberCorreo, setNewMemberCorreo] = useState("");
  const [newMemberSexo, setNewMemberSexo] = useState("M");
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [allowOutOfOrder, setAllowOutOfOrder] = useState(true);

  // Estados para Etiquetas / Alertas de Atencion Especial (Kanban)
  const [showTagsInModal, setShowTagsInModal] = useState(false);
  const [availableTagsGrupo, setAvailableTagsGrupo] = useState<any[]>([]);
  const [memberTagHistoryGrupo, setMemberTagHistoryGrupo] = useState<any[]>([]);
  const [selectedTagIdGrupo, setSelectedTagIdGrupo] = useState("");
  const [customTagDurationGrupo, setCustomTagDurationGrupo] = useState("");
  const [tagNotesGrupo, setTagNotesGrupo] = useState("");
  const [tagsLoadingGrupo, setTagsLoadingGrupo] = useState(false);
  const [modalTab, setModalTab] = useState<'avance' | 'alertas'>('avance');

  // Estados para Registro Pastoral rápido (Modal)
  const [showPastoralModal, setShowPastoralModal] = useState(false);
  const [bitTipo, setBitTipo] = useState("VISITA");
  const [bitNotas, setBitNotas] = useState("");
  const [bitFecha, setBitFecha] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [bitLoading, setBitLoading] = useState(false);

  const [memberPeticiones, setMemberPeticiones] = useState<any[]>([]);
  const [memberPastoralHistory, setMemberPastoralHistory] = useState<any[]>([]);
  const [pastoralDataLoading, setPastoralDataLoading] = useState(false);

  const loadPastoralDataForMember = async (memberId: string) => {
    setPastoralDataLoading(true);
    try {
      const resHist = await fetch(`/api/historial-pastoral?personaId=${memberId}`);
      const dataHist = await resHist.json();
      if (!dataHist.error && Array.isArray(dataHist.events)) {
        setMemberPastoralHistory(dataHist.events);
      } else {
        setMemberPastoralHistory([]);
      }

      const resPet = await fetch('/api/oracion');
      const dataPet = await resPet.json();
      if (Array.isArray(dataPet)) {
        const filtered = dataPet.filter((p: any) => p.persona_id === memberId);
        setMemberPeticiones(filtered);
      } else {
        setMemberPeticiones([]);
      }
    } catch (e) {
      console.error("Error loading pastoral data for member", e);
    } finally {
      setPastoralDataLoading(false);
    }
  };

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
  // --- Funciones de gestion de etiquetas en grupo ---
  const loadTagsForMember = async (memberId: string) => {
    setTagsLoadingGrupo(true);
    try {
      const res = await fetch(`/api/miembros/etiquetas?memberId=${memberId}`);
      const data = await res.json();
      if (!data.error) {
        setAvailableTagsGrupo(data.tags || []);
        setMemberTagHistoryGrupo(data.history || []);
        if (data.tags && data.tags.length > 0) {
          setSelectedTagIdGrupo(data.tags[0].id);
          setCustomTagDurationGrupo(String(data.tags[0].duracion_dias_defecto));
        }
      }
    } catch (e) {
      console.error('Error cargando etiquetas:', e);
    } finally {
      setTagsLoadingGrupo(false);
    }
  };

  const handleAssignTagGrupo = async () => {
    if (!selectedMember || !selectedTagIdGrupo) return;
    try {
      const res = await fetch('/api/miembros/etiquetas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assignTag',
          data: {
            memberId: selectedMember.id,
            tagId: selectedTagIdGrupo,
            duracionDias: parseInt(customTagDurationGrupo) || 0,
            notas: tagNotesGrupo,
          },
        }),
      });
      const data = await res.json();
      if (data.error) { alert('Error al asignar alerta: ' + data.error); return; }
      setTagNotesGrupo('');
      // Reload history
      const resH = await fetch(`/api/miembros/etiquetas?memberId=${selectedMember.id}`);
      const dataH = await resH.json();
      if (!dataH.error) setMemberTagHistoryGrupo(dataH.history || []);
      // Refresh group data to update badge
      loadData();
    } catch (e) { console.error(e); alert('Error al conectar con el servidor.'); }
  };

  const handleRemoveMemberTagGrupo = async (assignmentId: string) => {
    if (!confirm('¿Dar de baja esta alerta activa?')) return;
    try {
      const res = await fetch('/api/miembros/etiquetas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'removeTag', data: { assignmentId } }),
      });
      const data = await res.json();
      if (data.error) { alert('Error: ' + data.error); return; }
      if (selectedMember) {
        const resH = await fetch(`/api/miembros/etiquetas?memberId=${selectedMember.id}`);
        const dataH = await resH.json();
        if (!dataH.error) setMemberTagHistoryGrupo(dataH.history || []);
      }
      loadData();
    } catch (e) { console.error(e); }
  };

  const handleSavePastoral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setBitLoading(true);
    try {
      const res = await fetch('/api/bitacora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'crear',
          data: {
            persona_id: selectedMember.id,
            tipo: bitTipo,
            notas: bitNotas,
            fecha: bitFecha
          }
        })
      });
      if (res.ok) {
        alert('Registro pastoral guardado correctamente.');
        setShowPastoralModal(false);
        setBitNotas('');
        // Opcional: Recargar datos si queremos reflejar algo
        if (selectedMember) {
          loadPastoralDataForMember(selectedMember.id);
        }
      } else {
        const d = await res.json();
        alert('Error: ' + (d.error || 'No se pudo guardar el registro.'));
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión.');
    } finally {
      setBitLoading(false);
    }
  };

  // Load all required data
  const loadData = async () => {
    try {
      const [authRes, adminRes, grupoRes] = await Promise.all([
        fetch("/api/auth"),
        fetch("/api/iglesia"),
        fetch("/api/grupo"),
      ]);

      const authData = await authRes.json();
      const adminData = await adminRes.json();
      const grupoDataJson = await grupoRes.json();

      if (authData.error) throw new Error(authData.error);
      if (adminData.error) throw new Error(adminData.error);
      if (grupoDataJson.error) throw new Error(grupoDataJson.error);

      setProfile(authData);
      setAdminConfig(adminData);
      setGroupData(grupoDataJson);

      // Determine initial active view role
      const hasMemberGroup = !!grupoDataJson.miGrupo;
      const hasLeaderGroups = grupoDataJson.gruposDirigidos && grupoDataJson.gruposDirigidos.length > 0;

      if (loading) {
        if (targetGroupId) {
          // If a specific group ID is passed, check if it's in leader groups
          const isLeadingTarget = grupoDataJson.gruposDirigidos?.some((g: any) => g.id === targetGroupId);
          if (isLeadingTarget) {
            setSelectedDirigidoId(targetGroupId);
            setActiveRoleView("leader");
          } else if (hasMemberGroup && grupoDataJson.miGrupo.id === targetGroupId) {
            setActiveRoleView("member");
          } else {
            setActiveRoleView(hasLeaderGroups ? "leader" : "member");
            if (hasLeaderGroups) setSelectedDirigidoId(grupoDataJson.gruposDirigidos[0].id);
          }
        } else {
          if (!hasMemberGroup && hasLeaderGroups) {
            setActiveRoleView("leader");
          } else {
            setActiveRoleView("member");
          }
          if (hasLeaderGroups) {
            setSelectedDirigidoId(grupoDataJson.gruposDirigidos[0].id);
          }
        }
      }

      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al cargar la información.");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Set default attendance checks and info states when changing leading group
  useEffect(() => {
    if (groupData?.gruposDirigidos && selectedDirigidoId) {
      const selected = groupData.gruposDirigidos.find((g: any) => g.id === selectedDirigidoId);
      if (selected) {
        // Pre-check all members by default
        setPresentIds(selected.personas?.map((p: any) => p.id) || []);
        setEditLugarReunion(selected.lugar_reunion || "");
        setEditDiaReunion(selected.dia_reunion || "");
        setEditMensajeBienvenida(selected.mensaje_bienvenida || "");
      }
    }
  }, [selectedDirigidoId, groupData]);

  const handleJoinGroup = async (groupId: string) => {
    try {
      const res = await fetch("/api/grupo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "joinGroup",
          data: { grupo_conexion_id: groupId }
        })
      });
      const data = await res.json();
      if (data.error) {
        alert("Error al unirte al grupo: " + data.error);
      } else {
        alert("¡Te has unido con éxito a este Grupo de Conexión!");
        await loadData();
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión");
    }
  };

  const handleUpdateGroupInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDirigido) return;
    setInfoSubmitting(true);
    try {
      const res = await fetch("/api/grupo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateGroupInfo",
          data: {
            grupo_conexion_id: selectedDirigido.id,
            lugar_reunion: editLugarReunion,
            dia_reunion: editDiaReunion,
            mensaje_bienvenida: editMensajeBienvenida,
          }
        })
      });
      const data = await res.json();
      if (data.error) {
        alert("Error: " + data.error);
      } else {
        alert("¡Información del grupo actualizada correctamente!");
        await loadData();
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión");
    } finally {
      setInfoSubmitting(false);
    }
  };

  const handleAddClaseBiblica = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDirigido) return;
    if (!claseTema.trim() || !claseFecha) {
      alert("Por favor completa al menos la fecha y el tema de la clase.");
      return;
    }
    setClaseSubmitting(true);
    try {
      const res = await fetch("/api/grupo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addClaseBiblica",
          data: {
            grupo_conexion_id: selectedDirigido.id,
            fecha: claseFecha,
            serie: claseSerie,
            tema: claseTema,
            texto_clave: claseTextoClave,
            verdad_central: claseVerdadCentral,
            objetivo: claseObjetivo,
            puntos: clasePuntos.filter((p) => p.titulo.trim()),
            creado_por: personaNombre || "Líder de Grupo",
          },
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert("Error al programar clase: " + data.error);
      } else {
        alert("¡Clase bíblica semanal programada con éxito!");
        setClaseFecha("");
        setClaseSerie("");
        setClaseTema("");
        setClaseTextoClave("");
        setClaseVerdadCentral("");
        setClaseObjetivo("");
        setClasePuntos([
          { titulo: "", citas: "", descripcion: "" },
          { titulo: "", citas: "", descripcion: "" },
          { titulo: "", citas: "", descripcion: "" },
        ]);
        await loadData();
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    } finally {
      setClaseSubmitting(false);
    }
  };

  const handleDeleteClaseBiblica = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta clase bíblica programada?")) return;
    try {
      const res = await fetch("/api/grupo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteClaseBiblica",
          data: { id },
        }),
      });
      const data = await res.json();
      if (!data.error) {
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Set default active stage for leader when stages list is loaded
  useEffect(() => {
    if (adminConfig?.etapas?.length > 0 && !activeLeaderStageId) {
      const activeEtapas = adminConfig.etapas;
      const sorted = [...activeEtapas].sort((a: any, b: any) => a.orden_secuencial - b.orden_secuencial);
      setActiveLeaderStageId(sorted[0].id);
    }
  }, [adminConfig, activeLeaderStageId]);

  const handleToggleTask = async (memberId: string, taskId: string) => {
    try {
      const res = await fetch("/api/miembros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggleTask",
          data: { memberId, taskId }
        })
      });
      const resData = await res.json();
      if (resData.error) {
        alert("Error al actualizar proceso: " + resData.error);
      } else {
        // Recargar datos
        const authRes = await fetch("/api/auth");
        const adminRes = await fetch("/api/iglesia");
        const grupoRes = await fetch("/api/grupo");

        const authData = await authRes.json();
        const adminData = await adminRes.json();
        const grupoDataJson = await grupoRes.json();

        setProfile(authData);
        setAdminConfig(adminData);
        setGroupData(grupoDataJson);

        // Si hay un miembro seleccionado en el modal, actualizar su estado para que cambie en tiempo real
        if (selectedMember && selectedMember.id === memberId) {
          let updatedM = null;
          if (grupoDataJson.gruposDirigidos) {
            for (const g of grupoDataJson.gruposDirigidos) {
              const found = g.personas?.find((p: any) => p.id === memberId);
              if (found) {
                updatedM = found;
                break;
              }
            }
          }
          if (updatedM) {
            // Find and attach stage details if available
            const stage = adminData.etapas?.find((s: any) => s.id === updatedM.etapa_id);
            setSelectedMember({ ...updatedM, etapa: stage });
          }
        }
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión al guardar cambios.");
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p style={{ marginTop: "1rem", color: "#64748b", fontWeight: 600 }}>Cargando espacio grupal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/hub" className={styles.backBtn} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <img src="/Iconos SVG/iglesia.png" alt="Mi Iglesia" style={{ width: '16px', height: '16px', objectFit: 'contain' }} /> Volver a Mi Iglesia
          </Link>
        </header>
        <main className={styles.main}>
          <div className={`${styles.alert} ${styles.alertWarning}`}>
            ⚠️ Hubo un problema: {error}
          </div>
        </main>
      </div>
    );
  }

  const { miGrupo, gruposDirigidos, personaId, personaNombre, userRole, todosLosGrupos } = groupData;
  const activeEtapas = adminConfig?.etapas || [];
  const activeProcesos = adminConfig?.procesos || [];

  // Sort stages
  const sortedEtapas = [...activeEtapas].sort((a, b) => a.orden_secuencial - b.orden_secuencial);

  // Active group being directed
  const selectedDirigido = dirigidos().find((g: any) => g.id === selectedDirigidoId) || dirigidos()[0];

  function dirigidos() {
    return gruposDirigidos || [];
  }

  // --- ACTIONS ---

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberNombre.trim()) {
      alert("El nombre es obligatorio");
      return;
    }
    setAddMemberLoading(true);
    try {
      const res = await fetch("/api/miembros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addMember",
          data: {
            nombre: newMemberNombre.trim(),
            telefono: newMemberTelefono.trim(),
            correo: newMemberCorreo.trim(),
            sexo: newMemberSexo,
            grupo_conexion_id: selectedDirigidoId,
            etapa_id: activeLeaderStageId,
          }
        })
      });
      const data = await res.json();
      if (data.error) {
        alert("Error al agregar integrante: " + data.error);
      } else {
        alert("¡Integrante agregado con éxito a este grupo y etapa!");
        setNewMemberNombre("");
        setNewMemberTelefono("");
        setNewMemberCorreo("");
        setNewMemberSexo("M");
        setShowAddMemberModal(false);
        await loadData();
      }
    } catch (err) {
      console.error(err);
      alert("Error al registrar al integrante.");
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handlePostComment = async (groupId: string) => {
    if (!newCommentText.trim()) return;
    setCommentSubmitting(true);
    try {
      const res = await fetch("/api/grupo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addComment",
          data: {
            grupo_conexion_id: groupId,
            persona_id: personaId,
            comentario: newCommentText.trim(),
          },
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert("Error: " + data.error);
      } else {
        setNewCommentText("");
        await loadData(); // Reload list
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleConfirmAgreement = async (agreementId: string) => {
    try {
      const res = await fetch("/api/grupo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirmAgreement",
          data: {
            acuerdo_id: agreementId,
            persona_id: personaId,
          },
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert("Error: " + data.error);
      } else {
        await loadData();
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión");
    }
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDirigido) return;
    setAttendanceSubmitting(true);
    try {
      const res = await fetch("/api/grupo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addAttendance",
          data: {
            grupo_conexion_id: selectedDirigido.id,
            fecha: attendanceDate,
            presentes_ids: presentIds,
          },
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert("Error: " + data.error);
      } else {
        alert("¡Asistencia registrada con éxito!");
        // Reset checklist
        setPresentIds(selectedDirigido.personas?.map((p: any) => p.id) || []);
        await loadData();
      }
    } catch (err) {
      console.error(err);
      alert("Error de red.");
    } finally {
      setAttendanceSubmitting(false);
    }
  };

  const handlePublishAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDirigido || !agreementTitle.trim() || !agreementContent.trim()) return;
    setAgreementSubmitting(true);
    try {
      const res = await fetch("/api/grupo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addAgreement",
          data: {
            grupo_conexion_id: selectedDirigido.id,
            titulo: agreementTitle.trim(),
            contenido: agreementContent.trim(),
            creado_por: personaNombre || "Líder",
          },
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert("Error: " + data.error);
      } else {
        alert("¡Acuerdo publicado!");
        setAgreementTitle("");
        setAgreementContent("");
        await loadData();
      }
    } catch (err) {
      console.error(err);
      alert("Error de red.");
    } finally {
      setAgreementSubmitting(false);
    }
  };

  const handleAddAgendaEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDirigido || !eventTitle.trim() || !eventDate) return;
    setEventSubmitting(true);
    try {
      const res = await fetch("/api/grupo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addAgendaEvent",
          data: {
            grupo_conexion_id: selectedDirigido.id,
            titulo: eventTitle.trim(),
            descripcion: eventDesc.trim(),
            fecha: eventDate,
            hora: eventTime || null,
          },
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert("Error: " + data.error);
      } else {
        alert("¡Evento agregado a la agenda del grupo!");
        setEventTitle("");
        setEventDesc("");
        setEventDate("");
        setEventTime("");
        await loadData();
      }
    } catch (err) {
      console.error(err);
      alert("Error de red.");
    } finally {
      setEventSubmitting(false);
    }
  };

  // Helper: Format Dates
  const formatFriendlyDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Helper: Calculate progress ratio of a member
  const getMemberProgress = (member: any) => {
    const stageTasks = activeProcesos.filter((p: any) => p.etapa_id === member.etapa_id);
    if (stageTasks.length === 0) return { ratio: 100, completed: 0, total: 0 };
    
    // member.historial_tareas contains completed task config ids
    const completedTasks = member.historial_tareas?.filter((ht: any) => ht.completada).map((ht: any) => ht.tarea_id) || [];
    const completedCount = stageTasks.filter((t: any) => completedTasks.includes(t.id)).length;
    
    return {
      ratio: Math.round((completedCount / stageTasks.length) * 100),
      completed: completedCount,
      total: stageTasks.length
    };
  };

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <header className={styles.header}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href="/hub" className={styles.backBtn} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <img src="/Iconos SVG/iglesia.png" alt="Mi Iglesia" style={{ width: '16px', height: '16px', objectFit: 'contain' }} /> Volver a Mi Iglesia
          </Link>
          <div className={styles.headerTitle}>
            🌐 Espacio Grupal
          </div>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href="/perfil" className={styles.backBtn} style={{ color: "var(--text-secondary)", display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <img src="/Iconos SVG/perfil.svg" alt="Perfil" style={{ width: '16px', height: '16px', objectFit: 'contain' }} /> {personaNombre || "Mi Perfil"}
          </Link>
        </div>
      </header>

      {/* ROLE SELECTOR TABS */}
      {miGrupo && gruposDirigidos && gruposDirigidos.length > 0 && (
        <div className={styles.roleTabs}>
          <button
            onClick={() => setActiveRoleView("member")}
            className={`${styles.roleTab} ${activeRoleView === "member" ? styles.roleTabActive : ""}`}
          >
            🏠 Mi Grupo (Miembro)
          </button>
          <button
            onClick={() => setActiveRoleView("leader")}
            className={`${styles.roleTab} ${activeRoleView === "leader" ? styles.roleTabActive : ""}`}
          >
            👑 Grupos que Dirijo (Líder)
          </button>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className={styles.main}>
        {activeRoleView === "member" && miGrupo ? (
          /* ========================================================
             MEMBER VIEW
             ======================================================== */
          <div>
            {/* Grupo Info Card */}
            <div className={styles.card} style={{ marginBottom: "1.5rem", borderLeft: "5px solid var(--success)", padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", alignItems: "flex-start" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "var(--success)", background: "#dcfce7", padding: "2px 8px", borderRadius: "12px" }}>
                    Macrorred: {miGrupo.sociedad?.nombre_sociedad || "General"}
                  </span>
                  <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "0.3rem 0" }}>
                    Grupo {miGrupo.nombre_grupo}
                  </h1>
                </div>

                {/* Info de Reunión en Templo */}
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ background: "#f8fafc", padding: "0.6rem 1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>📅 Horario de Reunión</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>{miGrupo.dia_reunion || "Publicado por líderes"}</div>
                  </div>
                  <div style={{ background: "#f8fafc", padding: "0.6rem 1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>📍 Lugar / Templo</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>{miGrupo.lugar_reunion || "Salón Asignado en Templo"}</div>
                  </div>
                </div>
              </div>

              {/* Mensaje de Bienvenida */}
              <div style={{ marginTop: "1.2rem", background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)", padding: "1rem 1.25rem", borderRadius: "12px", borderLeft: "4px solid #0284c7" }}>
                <h4 style={{ margin: "0 0 0.25rem 0", color: "#0369a1", fontSize: "0.9rem", fontWeight: 800 }}>
                  👋 Mensaje de Bienvenida
                </h4>
                <p style={{ margin: 0, color: "#0f172a", fontSize: "0.95rem", lineHeight: "1.5" }}>
                  "{miGrupo.mensaje_bienvenida || "¡Bienvenidos a nuestro Grupo de Conexión! Nos alegra muchísimo contar contigo en este espacio de crecimiento espiritual y comunión."}"
                </p>
              </div>

              {/* Lideres del Grupo */}
              <div style={{ marginTop: "1.2rem" }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.5rem", color: "#1e293b" }}>
                  👨‍🏫 Tus Líderes de Grupo:
                </h3>
                {miGrupo.lideres && miGrupo.lideres.length > 0 ? (
                  <div className={styles.leaderCardGrid}>
                    {miGrupo.lideres.map((l: any) => (
                      <div key={l.id} className={styles.leaderContactCard}>
                        <div className={styles.leaderContactName}>{l.nombre}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span>📞 {l.telefono}</span>
                          {l.telefono && (
                            <a
                              href={`https://wa.me/${l.telefono.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                                backgroundColor: '#25D366',
                                color: 'white',
                                padding: '1px 7px',
                                borderRadius: '10px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                                boxShadow: '0 1px 3px rgba(37, 211, 102, 0.3)'
                              }}
                              title={`Abrir WhatsApp con ${l.nombre}`}
                            >
                              💬 WhatsApp
                            </a>
                          )}
                        </div>
                        <div>✉️ {l.correo}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "0.85rem", color: "#64748b", fontStyle: "italic", margin: 0 }}>No hay líderes asignados actualmente.</p>
                )}
              </div>
            </div>

            {/* Layout Grid */}
            <div className={styles.dashboardLayout}>
              {/* Left Column: Clase Bíblica Semanal & Forum */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                {/* Clase Bíblica Semanal */}
                <div className={styles.card} style={{ borderLeft: '5px solid #8b5cf6' }}>
                  <div className={styles.cardHeader} style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h2 className={styles.cardTitle}>📖 Clase Bíblica Semanal</h2>
                    {(() => {
                      const clases = miGrupo.clases_biblicas || [];
                      const activeClase = clases[selectedClaseIdx] || clases[0];
                      return activeClase ? (
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', padding: '3px 10px', borderRadius: '12px' }}>
                          🗓️ {formatFriendlyDate(activeClase.fecha)}
                        </span>
                      ) : null;
                    })()}
                  </div>

                  {/* Programmed Multi-Week Selector (up to 4 classes ahead) */}
                  {(() => {
                    const clases = miGrupo.clases_biblicas || [];
                    if (clases.length <= 1) return null;
                    return (
                      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.4rem', borderBottom: '1px solid #f1f5f9' }}>
                        {clases.slice(0, 4).map((c: any, idx: number) => {
                          const isSel = idx === selectedClaseIdx;
                          return (
                            <button
                              key={c.id}
                              onClick={() => setSelectedClaseIdx(idx)}
                              style={{
                                padding: '0.4rem 0.85rem',
                                borderRadius: '8px',
                                border: isSel ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                                backgroundColor: isSel ? '#7c3aed' : '#f8fafc',
                                color: isSel ? '#ffffff' : '#475569',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s'
                              }}
                            >
                              Semana {idx + 1} ({new Date(c.fecha).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })})
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {(() => {
                    const clases = miGrupo.clases_biblicas || [];
                    const activeClase = clases[selectedClaseIdx] || clases[0];

                    if (!activeClase) {
                      return (
                        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8' }}>
                          <span style={{ fontSize: '2.5rem' }}>📖</span>
                          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>Aún no se ha publicado la clase bíblica para esta semana.</p>
                        </div>
                      );
                    }

                    let pts: any[] = [];
                    try { pts = JSON.parse(activeClase.puntos_json || "[]"); } catch(e){}

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.25rem' }}>
                        {/* Header Info: Serie & Tema */}
                        <div>
                          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 800, color: '#7c3aed', letterSpacing: '0.05em' }}>
                            Serie: {activeClase.serie}
                          </span>
                          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0 0.5rem 0' }}>
                            {activeClase.tema}
                          </h2>
                          {activeClase.texto_clave && (
                            <div style={{ background: '#f5f3ff', borderLeft: '4px solid #7c3aed', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.9rem', color: '#4c1d95', fontStyle: 'italic' }}>
                              <strong>📜 Texto Clave:</strong> "{activeClase.texto_clave}"
                            </div>
                          )}
                        </div>

                        {/* Grid: Verdad Central & Objetivo */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                          {activeClase.verdad_central && (
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.85rem', borderRadius: '10px' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>🎯 Verdad Central</div>
                              <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.88rem', color: '#1e293b', lineHeight: '1.4' }}>
                                {activeClase.verdad_central}
                              </p>
                            </div>
                          )}
                          {activeClase.objetivo && (
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.85rem', borderRadius: '10px' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase' }}>📌 Objetivo de la Clase</div>
                              <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.88rem', color: '#1e293b', lineHeight: '1.4' }}>
                                {activeClase.objetivo}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Puntos Principales (2 a 4 puntos) */}
                        <div>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            💡 Puntos Principales de la Lección
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {pts && pts.length > 0 ? (
                              pts.map((p: any, pIdx: number) => (
                                <div key={pIdx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem 1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>
                                      {pIdx + 1}. {p.titulo}
                                    </span>
                                    {p.citas && (
                                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7c3aed', background: '#ede9fe', padding: '3px 10px', borderRadius: '12px' }}>
                                        📖 {p.citas}
                                      </span>
                                    )}
                                  </div>
                                  {p.descripcion && (
                                    <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0.4rem 0 0 0', lineHeight: '1.5' }}>
                                      {p.descripcion}
                                    </p>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No se registraron puntos detallados.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Foro del Grupo */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>💬 Foro de Comentarios y Testimonios</h2>
                  </div>

                  <div className={styles.forumWrapper}>
                    {/* Add Comment Form */}
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <textarea
                        className={styles.textarea}
                        placeholder="Escribe un comentario, duda o testimonio para el grupo..."
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        disabled={commentSubmitting}
                      />
                      <button
                        className={styles.primaryBtn}
                        onClick={() => handlePostComment(miGrupo.id)}
                        disabled={commentSubmitting || !newCommentText.trim()}
                        style={{ height: "fit-content", alignSelf: "flex-end" }}
                      >
                        {commentSubmitting ? "..." : "Enviar"}
                      </button>
                    </div>

                    {/* Comments Thread */}
                    <div className={styles.commentsThread}>
                      {miGrupo.comentarios_foro && miGrupo.comentarios_foro.length > 0 ? (
                        miGrupo.comentarios_foro.map((c: any) => (
                          <div key={c.id} className={styles.commentItem}>
                            <div className={styles.memberAvatar}>
                              {c.persona?.foto_url ? (
                                <img src={c.persona.foto_url} alt={c.persona.nombre} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                              ) : (
                                <span>👤</span>
                              )}
                            </div>
                            <div className={styles.commentBody}>
                              <div className={styles.commentMeta}>
                                <strong style={{ color: "#1e293b" }}>{c.persona?.nombre || "Miembro"}</strong>
                                <span>{formatFriendlyDate(c.fecha)}</span>
                              </div>
                              <div className={styles.commentContent}>{c.comentario}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p style={{ textAlign: "center", fontSize: "0.85rem", color: "#94a3b8", padding: "1rem" }}>
                          No hay comentarios en el foro aún. ¡Sé el primero en compartir!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Agreements, Cell Agenda & Mi Ruta de Avance */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* Tablero de Acuerdos */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>📜 Acuerdos y Avisos</h2>
                  </div>

                  <div className={styles.agreementsList}>
                    {miGrupo.acuerdos && miGrupo.acuerdos.length > 0 ? (
                      miGrupo.acuerdos.map((ac: any) => {
                        const userConfirmed = ac.confirmaciones?.some(
                          (conf: any) => conf.persona_id === personaId && conf.confirmado
                        );

                        return (
                          <div key={ac.id} className={styles.agreementItem}>
                            <div className={styles.agreementHeader}>
                              <span className={styles.agreementTitle}>{ac.titulo}</span>
                              <span className={styles.agreementDate}>{formatFriendlyDate(ac.fecha_publicacion)}</span>
                            </div>
                            <p className={styles.agreementContent}>{ac.contenido}</p>
                            
                            <div className={styles.agreementFooter}>
                              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Publicado por: {ac.creado_por}</span>
                              {userConfirmed ? (
                                <span className={styles.confirmBadge}>Confirmado ✓</span>
                              ) : (
                                <button
                                  className={styles.confirmBtn}
                                  onClick={() => handleConfirmAgreement(ac.id)}
                                >
                                  Cotejar Lectura 👍
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p style={{ textAlign: "center", fontSize: "0.85rem", color: "#94a3b8", padding: "1rem" }}>
                        No hay acuerdos o anuncios publicados en este grupo.
                      </p>
                    )}
                  </div>
                </div>

                {/* Agenda Interna */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>📅 Agenda de Reuniones</h2>
                  </div>

                  <div className={styles.agendaList}>
                    {miGrupo.agenda && miGrupo.agenda.length > 0 ? (
                      miGrupo.agenda.map((ev: any) => {
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
                              {ev.descripcion && <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0 }}>{ev.descripcion}</p>}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p style={{ textAlign: "center", fontSize: "0.85rem", color: "#94a3b8", padding: "1rem" }}>
                        No hay reuniones agendadas por el momento.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeRoleView === "leader" && selectedDirigido ? (
          /* ========================================================
             LEADER VIEW
             ======================================================== */
          <div>
            {/* Header / Selector de Grupo */}
            <div className={styles.card} style={{ marginBottom: "1.5rem", borderLeft: "5px solid var(--accent-blue)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "var(--accent-blue)" }}>
                    Panel de Administración del Grupo
                  </span>
                  <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: "0.2rem 0" }}>
                    {selectedDirigido.nombre_grupo} ({selectedDirigido.sociedad?.nombre_sociedad})
                  </h1>
                </div>

                {gruposDirigidos.length > 1 && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Seleccionar Grupo</label>
                    <select
                      className={styles.select}
                      value={selectedDirigidoId}
                      onChange={(e) => setSelectedDirigidoId(e.target.value)}
                    >
                      {gruposDirigidos.map((g: any) => (
                        <option key={g.id} value={g.id}>
                          {g.nombre_grupo} ({g.sociedad?.nombre_sociedad})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Sub-tabs for Leader controls */}
              <div className={styles.subTabs}>
                <button
                  onClick={() => setLeaderSubTab("kanban")}
                  className={`${styles.subTab} ${leaderSubTab === "kanban" ? styles.subTabActive : ""}`}
                >
                  📋 Tablero Kanban (Etapas)
                </button>
                <button
                  onClick={() => setLeaderSubTab("attendance")}
                  className={`${styles.subTab} ${leaderSubTab === "attendance" ? styles.subTabActive : ""}`}
                >
                  📝 Pasar Asistencia
                </button>
                <button
                  onClick={() => setLeaderSubTab("agreements")}
                  className={`${styles.subTab} ${leaderSubTab === "agreements" ? styles.subTabActive : ""}`}
                >
                  📣 Publicar Acuerdos
                </button>
                <button
                  onClick={() => setLeaderSubTab("agenda")}
                  className={`${styles.subTab} ${leaderSubTab === "agenda" ? styles.subTabActive : ""}`}
                >
                  📅 Agenda del Grupo
                </button>
                <button
                  onClick={() => setLeaderSubTab("forum")}
                  className={`${styles.subTab} ${leaderSubTab === "forum" ? styles.subTabActive : ""}`}
                >
                  💬 Foro Interno
                </button>
                <button
                  onClick={() => setLeaderSubTab("info")}
                  className={`${styles.subTab} ${leaderSubTab === "info" ? styles.subTabActive : ""}`}
                >
                  ⚙️ Datos del Grupo
                </button>
                <button
                  onClick={() => setLeaderSubTab("biblia")}
                  className={`${styles.subTab} ${leaderSubTab === "biblia" ? styles.subTabActive : ""}`}
                >
                  📖 Programar Clases Bíblicas
                </button>
              </div>
            </div>

            {/* Tab Panel Content: Programar Clases Bíblicas */}
            {leaderSubTab === "biblia" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Formulario de Nueva Clase Bíblica */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>📖 Programar Clase Bíblica Semanal</h2>
                  </div>

                  <form onSubmit={handleAddClaseBiblica} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>🗓️ Fecha de la Clase *</label>
                        <input
                          type="date"
                          className={styles.input}
                          value={claseFecha}
                          onChange={(e) => setClaseFecha(e.target.value)}
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>📚 Serie de Estudio *</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="Ej. El Fruto del Espíritu"
                          value={claseSerie}
                          onChange={(e) => setClaseSerie(e.target.value)}
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>✝️ Tema de la Clase *</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="Ej. La Paciencia en Tiempos de Prueba"
                          value={claseTema}
                          onChange={(e) => setClaseTema(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>📜 Texto Clave</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="Ej. Santiago 1:2-4"
                          value={claseTextoClave}
                          onChange={(e) => setClaseTextoClave(e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>🎯 Verdad Central</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="Declaración principal de la lección..."
                          value={claseVerdadCentral}
                          onChange={(e) => setClaseVerdadCentral(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>📌 Objetivo de la Clase</label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Propósito que los miembros aplicarán en su vida..."
                        value={claseObjetivo}
                        onChange={(e) => setClaseObjetivo(e.target.value)}
                      />
                    </div>

                    {/* Dynamic List of Points (2 to 4 points) */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <label className={styles.label} style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                          💡 Puntos Principales de la Clase ({clasePuntos.length} de máx 4)
                        </label>
                        {clasePuntos.length < 4 && (
                          <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={() => setClasePuntos([...clasePuntos, { titulo: "", citas: "", descripcion: "" }])}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          >
                            + Agregar Punto
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {clasePuntos.map((pt, idx) => (
                          <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#7c3aed' }}>
                                Punto {idx + 1}
                              </span>
                              {clasePuntos.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => setClasePuntos(clasePuntos.filter((_, i) => i !== idx))}
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
                                >
                                  ✕ Eliminar Punto
                                </button>
                              )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
                              <input
                                type="text"
                                className={styles.input}
                                placeholder={`Título del Punto ${idx + 1}`}
                                value={pt.titulo}
                                onChange={(e) => {
                                  const copy = [...clasePuntos];
                                  copy[idx].titulo = e.target.value;
                                  setClasePuntos(copy);
                                }}
                              />
                              <input
                                type="text"
                                className={styles.input}
                                placeholder="Citas Bíblicas (ej. Romanos 5:3-4)"
                                value={pt.citas}
                                onChange={(e) => {
                                  const copy = [...clasePuntos];
                                  copy[idx].citas = e.target.value;
                                  setClasePuntos(copy);
                                }}
                              />
                            </div>
                            <textarea
                              className={styles.textarea}
                              rows={2}
                              placeholder="Resumen o desarrollo del punto..."
                              value={pt.descripcion}
                              onChange={(e) => {
                                const copy = [...clasePuntos];
                                copy[idx].descripcion = e.target.value;
                                setClasePuntos(copy);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className={styles.primaryBtn}
                      disabled={claseSubmitting}
                      style={{ alignSelf: 'flex-start', padding: '0.85rem 1.75rem', fontWeight: 800, backgroundColor: '#7c3aed' }}
                    >
                      {claseSubmitting ? "Guardando..." : "💾 Programar Clase Bíblica Semanal"}
                    </button>
                  </form>
                </div>

                {/* Lista de Clases Bíblicas Programadas */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>📚 Clases Bíblicas Programadas en el Grupo</h2>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                    {selectedDirigido.clases_biblicas && selectedDirigido.clases_biblicas.length > 0 ? (
                      selectedDirigido.clases_biblicas.map((c: any) => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '1rem' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7c3aed', background: '#ede9fe', padding: '2px 8px', borderRadius: '12px' }}>
                              🗓️ {formatFriendlyDate(c.fecha)} • Serie: {c.serie}
                            </span>
                            <h4 style={{ margin: '0.3rem 0 0.2rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                              {c.tema}
                            </h4>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                              📜 Texto Clave: {c.texto_clave || 'Sin texto'} • Publicado por: {c.creado_por}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteClaseBiblica(c.id)}
                            style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      ))
                    ) : (
                      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem', padding: '1rem' }}>
                        No hay clases bíblicas programadas aún para este grupo.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab Panel Content */}
            {leaderSubTab === "info" && (
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>⚙️ Configuración de Datos y Bienvenida del Grupo</h2>
                </div>
                <form onSubmit={handleUpdateGroupInfo} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>👋 Mensaje de Bienvenida para los Miembros</label>
                    <textarea
                      className={styles.textarea}
                      rows={3}
                      placeholder="Mensaje cálido de bienvenida que verán los integrantes al entrar..."
                      value={editMensajeBienvenida}
                      onChange={(e) => setEditMensajeBienvenida(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>📅 Horario y Días de Reunión</label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Ej. Jueves 7:30 PM"
                        value={editDiaReunion}
                        onChange={(e) => setEditDiaReunion(e.target.value)}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>📍 Lugar Asignado (Templo / Dirección)</label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Ej. Salón B - Templo Principal"
                        value={editLugarReunion}
                        onChange={(e) => setEditLugarReunion(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={styles.primaryBtn}
                    disabled={infoSubmitting}
                    style={{
                      alignSelf: 'flex-start',
                      padding: '0.85rem 1.75rem',
                      fontWeight: 800,
                      backgroundColor: infoSubmitting ? '#94a3b8' : '#0284c7',
                      color: '#ffffff',
                      borderRadius: '10px',
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                      border: 'none',
                      cursor: infoSubmitting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    💾 {infoSubmitting ? "Guardando..." : "Guardar Cambios del Grupo"}
                  </button>
                </form>
              </div>
            )}

            {/* Tab Panel Content */}
            {leaderSubTab === "kanban" && (
              /* DETAILED VIEW PER STAGE */
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>📋 Avance de Integrantes por Etapas</h2>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    Selecciona una etapa para ver el siguiente proceso pendiente y las alertas de tiempo de cada miembro.
                  </span>
                </div>

                {/* Horizontal Summary & Menu */}
                <div style={{ 
                  display: 'flex', 
                  gap: '0.75rem', 
                  overflowX: 'auto', 
                  paddingBottom: '1rem', 
                  borderBottom: '1px solid #f1f5f9', 
                  marginBottom: '1.5rem',
                  paddingLeft: '0.25rem',
                  paddingRight: '0.25rem'
                }}>
                  {sortedEtapas.map((stage) => {
                    const stageMembers = selectedDirigido.personas?.filter((p: any) => p.etapa_id === stage.id) || [];
                    const isActive = activeLeaderStageId === stage.id;
                    return (
                      <button
                        key={stage.id}
                        onClick={() => setActiveLeaderStageId(stage.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.55rem 1.1rem',
                          borderRadius: '20px',
                          border: 'none',
                          outline: 'none',
                          background: isActive ? '#e0f2fe' : '#f1f5f9',
                          color: isActive ? '#0369a1' : '#475569',
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          fontSize: '0.85rem',
                          transition: 'all 0.2s',
                          boxShadow: isActive ? '0 1px 3px rgba(3, 105, 161, 0.1)' : 'none',
                        }}
                      >
                        <span>📍 {stage.nombre_etapa}</span>
                        <span style={{
                          background: isActive ? '#0284c7' : '#64748b',
                          color: 'white',
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontWeight: 700
                        }}>
                          {stageMembers.length}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* List of members in active stage */}
                {(() => {
                  const stageMembersRaw = selectedDirigido.personas?.filter((p: any) => p.etapa_id === activeLeaderStageId) || [];
                  const stageTasks = activeProcesos.filter((p: any) => p.etapa_id === activeLeaderStageId).sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0));

                  // Ordenar miembros: primero con alertas/etiquetas, luego tareas vencidas, luego pendientes, luego alfabético
                  const stageMembers = [...stageMembersRaw].sort((a: any, b: any) => {
                    // 0. Etiquetas/alertas activas van primero
                    const tagsA = a.etiquetas?.length || 0;
                    const tagsB = b.etiquetas?.length || 0;
                    if (tagsA > 0 && tagsB === 0) return -1;
                    if (tagsA === 0 && tagsB > 0) return 1;

                    const completedA = a.historial_tareas?.filter((ht: any) => ht.completada).map((ht: any) => ht.tarea_id) || [];
                    const pendingA = stageTasks.find((t: any) => !completedA.includes(t.id));
                    
                    const completedB = b.historial_tareas?.filter((ht: any) => ht.completada).map((ht: any) => ht.tarea_id) || [];
                    const pendingB = stageTasks.find((t: any) => !completedB.includes(t.id));

                    // 1. Si uno tiene tarea pendiente y el otro no
                    if (pendingA && !pendingB) return -1;
                    if (!pendingA && pendingB) return 1;
                    
                    // 2. Si ninguno tiene tareas pendientes, ordenar alfabéticamente
                    if (!pendingA && !pendingB) {
                      return (a.nombre || '').localeCompare(b.nombre || '');
                    }

                    // 3. Si ambos tienen tareas pendientes, ordenar por urgencia de fecha
                    const getDaysLeft = (m: any, task: any) => {
                      const idx = stageTasks.findIndex((t: any) => t.id === task.id);
                      let start = new Date(m.createdAt);
                      if (idx > 0) {
                        const prev = stageTasks[idx - 1];
                        const ht = m.historial_tareas?.find((h: any) => h.tarea_id === prev.id && h.completada);
                        if (ht?.fecha_completa) {
                          start = new Date(ht.fecha_completa);
                        }
                      }
                      if (!task.dias_limite) return Infinity;
                      const due = new Date(start);
                      due.setDate(due.getDate() + task.dias_limite);
                      return Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    };

                    const daysLeftA = getDaysLeft(a, pendingA);
                    const daysLeftB = getDaysLeft(b, pendingB);

                    return daysLeftA - daysLeftB;
                  });

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.25rem' }}>
                        <button
                          onClick={() => setShowAddMemberModal(true)}
                          className={styles.primaryBtn}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.82rem',
                            padding: '0.45rem 1rem',
                            backgroundColor: '#0284c7',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)'
                          }}
                        >
                          ➕ Agregar Integrante a esta Etapa
                        </button>
                      </div>

                      {stageMembers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                          No hay ningún miembro en la etapa seleccionada dentro de tu grupo de conexión.
                        </div>
                      ) : stageMembers.map((m: any) => {
                        const prog = getMemberProgress(m);
                        const completedIds = m.historial_tareas?.filter((ht: any) => ht.completada).map((ht: any) => ht.tarea_id) || [];
                        const nextPendingTask = stageTasks.find((t: any) => !completedIds.includes(t.id));
                        const isCardExpanded = expandedKanbanCards.has(m.id);
                        const hasAlerts = m.etiquetas && m.etiquetas.length > 0;

                        let dueDate = null;
                        let alertText = "";
                        let alertColor = "";
                        let alertBg = "";

                        if (nextPendingTask) {
                          const taskIndex = stageTasks.findIndex((t: any) => t.id === nextPendingTask.id);
                          let startDate = new Date(m.createdAt);
                          
                          if (taskIndex > 0) {
                            const prevTask = stageTasks[taskIndex - 1];
                            const prevHt = m.historial_tareas?.find((ht: any) => ht.tarea_id === prevTask.id && ht.completada);
                            if (prevHt?.fecha_completa) {
                              startDate = new Date(prevHt.fecha_completa);
                            }
                          }

                          if (nextPendingTask.dias_limite) {
                            const d = new Date(startDate);
                            d.setDate(d.getDate() + nextPendingTask.dias_limite);
                            dueDate = d;

                            const now = new Date();
                            const msDiff = dueDate.getTime() - now.getTime();
                            const daysLeft = Math.ceil(msDiff / (1000 * 60 * 60 * 24));

                            if (daysLeft < 0) {
                              alertText = `🚨 Vencido hace ${Math.abs(daysLeft)}d`;
                              alertColor = "#991b1b";
                              alertBg = "#fee2e2";
                            } else if (daysLeft <= 2) {
                              alertText = `⚠️ Vence en ${daysLeft}d`;
                              alertColor = "#9a3412";
                              alertBg = "#ffedd5";
                            } else {
                              alertText = `🕒 Quedan ${daysLeft}d`;
                              alertColor = "#374151";
                              alertBg = "#f3f4f6";
                            }
                          } else {
                            alertText = "Sin límite de tiempo";
                            alertColor = "#4b5563";
                            alertBg = "#f3f4f6";
                          }
                        }

                        const toggleCard = () => {
                          setExpandedKanbanCards(prev => {
                            const next = new Set(prev);
                            if (next.has(m.id)) next.delete(m.id);
                            else next.add(m.id);
                            return next;
                          });
                        };

                        return (
                          <div 
                            key={m.id} 
                            style={{ 
                              display: 'flex', 
                              flexDirection: 'column',
                              backgroundColor: hasAlerts ? '#fffbeb' : '#f8fafc',
                              border: `1px solid ${hasAlerts ? '#fde68a' : '#e2e8f0'}`,
                              borderRadius: '12px',
                              overflow: 'hidden',
                              transition: 'background-color 0.2s ease'
                            }}
                          >
                            {/* Collapsed header — always visible */}
                            <div 
                              onClick={toggleCard}
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                padding: isMobileKanban ? '0.65rem 0.85rem' : '0.75rem 1rem',
                                cursor: 'pointer',
                                gap: isMobileKanban ? '0.6rem' : '0.85rem',
                                userSelect: 'none'
                              }}
                            >
                              {/* Expand/collapse chevron */}
                              <span style={{ fontSize: '0.7rem', color: '#94a3b8', transition: 'transform 0.2s ease', transform: isCardExpanded ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}>
                                ▶
                              </span>
                              {/* Photo */}
                              <div style={{ width: isMobileKanban ? '34px' : '42px', height: isMobileKanban ? '34px' : '42px', minWidth: isMobileKanban ? '34px' : '42px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #cbd5e1', flexShrink: 0 }}>
                                {m.foto_url ? (
                                  <img src={m.foto_url} alt={m.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <span style={{ fontSize: isMobileKanban ? '0.95rem' : '1.2rem' }}>{m.sexo === "F" ? "👩" : "👤"}</span>
                                )}
                              </div>
                              {/* Name + badges inline */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: isMobileKanban ? '0.82rem' : '0.92rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'nowrap', overflow: 'hidden' }}>
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nombre}</span>
                                  {/* Etiquetas inline in collapsed view */}
                                  {m.etiquetas && m.etiquetas.map((pe: any) => (
                                    <span
                                      key={pe.id}
                                      title={`${pe.etiqueta.nombre}${pe.notas ? ` - "${pe.notas}"` : ''} | Vence: ${pe.fecha_fin ? new Date(pe.fecha_fin).toLocaleDateString() : 'Sin fecha'}`}
                                      style={{
                                        display: 'inline-flex', alignItems: 'center',
                                        padding: '1px 5px', borderRadius: '9999px',
                                        fontSize: '0.6rem', fontWeight: 'bold',
                                        background: pe.etiqueta.color + '18',
                                        color: pe.etiqueta.color,
                                        border: `1px solid ${pe.etiqueta.color}`,
                                        whiteSpace: 'nowrap', cursor: 'help', flexShrink: 0
                                      }}
                                    >
                                      {pe.etiqueta.icono} {pe.etiqueta.nombre}
                                    </span>
                                  ))}
                                </div>
                                {/* Progress mini-bar + alert text inline */}
                                {!isMobileKanban && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                                    <div style={{ width: '60px', height: '4px', background: '#cbd5e1', borderRadius: '2px', overflow: 'hidden', flexShrink: 0 }}>
                                      <div style={{ height: '100%', width: `${prog.ratio}%`, background: prog.ratio >= 100 ? '#10b981' : '#0284c7', borderRadius: '2px' }} />
                                    </div>
                                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', flexShrink: 0 }}>{prog.ratio}%</span>
                                    {alertText && (
                                      <span style={{ fontSize: '0.65rem', color: alertColor, backgroundColor: alertBg, padding: '1px 5px', borderRadius: '3px', fontWeight: 600, flexShrink: 0 }}>
                                        {alertText}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              {/* Mobile: alert count badge */}
                              {isMobileKanban && hasAlerts && (
                                <span style={{ fontSize: '0.6rem', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '9999px', padding: '1px 6px', fontWeight: 700, flexShrink: 0 }}>
                                  {m.etiquetas.length}
                                </span>
                              )}
                              {/* Mobile: quick action buttons */}
                              {isMobileKanban && (
                                <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                                  <Link
                                    href={`/perfil/${m.id}`}
                                    title="Ver Perfil"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '3px 5px', fontSize: '0.7rem', color: '#475569', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                                  >
                                    👤
                                  </Link>
                                  {m.telefono && (
                                    <a
                                      href={`https://wa.me/${m.telefono.replace(/[^0-9]/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      style={{ background: '#25D366', borderRadius: '6px', padding: '3px 5px', fontSize: '0.7rem', color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', fontWeight: 700 }}
                                    >
                                      💬
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Expanded detail section */}
                            {(isCardExpanded || !isMobileKanban) && (
                              <div style={{ 
                                padding: isMobileKanban ? '0 0.85rem 0.85rem' : '0 1rem 1rem',
                                borderTop: '1px solid #e2e8f0',
                                display: 'flex', flexDirection: 'column', gap: '0.6rem'
                              }}>
                                {/* Contact info */}
                                <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', paddingTop: isMobileKanban ? '0.5rem' : '0' }}>
                                   <span>📞 {m.telefono || 'Sin telf.'}</span>
                                   {m.telefono && (
                                     <a
                                       href={`https://wa.me/${m.telefono.replace(/[^0-9]/g, '')}`}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       style={{
                                         display: 'inline-flex', alignItems: 'center', gap: '2px',
                                         backgroundColor: '#25D366', color: 'white',
                                         padding: '1px 7px', borderRadius: '10px',
                                         fontSize: '0.72rem', fontWeight: 700, textDecoration: 'none',
                                         boxShadow: '0 1px 3px rgba(37, 211, 102, 0.3)'
                                       }}
                                       title={`Abrir WhatsApp con ${m.nombre}`}
                                     >
                                       💬 WhatsApp
                                     </a>
                                   )}
                                   {m.correo ? ` | ✉️ ${m.correo}` : ''}
                                 </div>

                                {/* Alertas + Progress + Task + Actions row */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                  {/* Alertas button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedMember(m);
                                      setModalTab('alertas');
                                      setShowTagsInModal(true);
                                      loadTagsForMember(m.id);
                                    }}
                                    style={{
                                      background: hasAlerts ? '#fef2f2' : '#f8fafc',
                                      border: `1px solid ${hasAlerts ? '#fecaca' : '#e2e8f0'}`,
                                      borderRadius: '5px',
                                      color: hasAlerts ? '#ef4444' : '#64748b',
                                      padding: '2px 8px',
                                      fontWeight: 'bold', fontSize: '0.7rem',
                                      cursor: 'pointer',
                                      display: 'inline-flex', alignItems: 'center', gap: '0.2rem'
                                    }}
                                  >
                                    🏷️ {hasAlerts ? `Alertas (${m.etiquetas.length})` : 'Alertas'}
                                  </button>

                                  {/* Progress bar */}
                                  <div style={{ display: 'flex', flexDirection: 'column', width: isMobileKanban ? '80px' : '120px', flexShrink: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#475569', fontWeight: 600, marginBottom: '0.15rem' }}>
                                      <span>Avance</span>
                                      <span>{prog.ratio}%</span>
                                    </div>
                                    <div style={{ height: '5px', background: '#cbd5e1', borderRadius: '3px', overflow: 'hidden' }}>
                                      <div style={{ height: '100%', width: `${prog.ratio}%`, background: '#10b981', borderRadius: '3px' }} />
                                    </div>
                                  </div>

                                  {/* Next pending task */}
                                  {nextPendingTask && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: '120px' }}>
                                        <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Siguiente Paso:</span>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          👉 {nextPendingTask.nombre_tarea}
                                        </span>
                                      </div>
                                      <span style={{ fontSize: '0.7rem', color: alertColor, backgroundColor: alertBg, padding: '2px 6px', borderRadius: '4px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                        {alertText}
                                      </span>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleToggleTask(m.id, nextPendingTask.id); }}
                                        style={{
                                          padding: '0.3rem 0.65rem', background: '#0284c7', color: 'white',
                                          border: 'none', borderRadius: '6px', fontSize: '0.72rem',
                                          fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
                                        }}
                                      >
                                        ✓ Completar
                                      </button>
                                    </div>
                                  )}
                                  {!nextPendingTask && (
                                    <span style={{ fontSize: '0.82rem', color: '#166534', backgroundColor: '#dcfce7', padding: '0.2rem 0.65rem', borderRadius: '6px', fontWeight: 600 }}>
                                      🎉 ¡Etapa Completada!
                                    </span>
                                  )}
                                </div>

                                {/* Action buttons row */}
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                  <button
                                    onClick={() => { setModalTab('avance'); setShowTagsInModal(false); setSelectedMember(m); }}
                                    style={{
                                      padding: '0.35rem 0.75rem', background: 'white',
                                      border: '1px solid #cbd5e1', borderRadius: '8px',
                                      fontSize: '0.78rem', fontWeight: 600, color: '#475569',
                                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'
                                    }}
                                  >
                                    🔍 Ver Detalle
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedMember(m);
                                      setShowPastoralModal(true);
                                      loadPastoralDataForMember(m.id);
                                    }}
                                    style={{
                                      padding: '0.35rem 0.75rem', background: '#fffbeb',
                                      border: '1px solid #fde68a', borderRadius: '8px',
                                      fontSize: '0.78rem', fontWeight: 600, color: '#b45309',
                                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'
                                    }}
                                  >
                                    🙏 Pastoral
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                      }
                    </div>
                  );
                })()}
              </div>
            )}

            {leaderSubTab === "attendance" && (
              /* ATTENDANCE SHEET */
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                <div className={styles.dashboardLayout}>
                  {/* Form column */}
                  <div className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h2 className={styles.cardTitle}>📝 Hoja de Registro de Asistencia</h2>
                    </div>

                    <form onSubmit={handleSaveAttendance} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Fecha de Reunión</label>
                          <input
                            type="date"
                            className={styles.input}
                            value={attendanceDate}
                            onChange={(e) => setAttendanceDate(e.target.value)}
                            required
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Título de la Reunión</label>
                          <input
                            type="text"
                            className={styles.input}
                            value={attendanceTitle}
                            onChange={(e) => setAttendanceTitle(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>Marcar Asistentes</label>
                        <div className={styles.attendanceGrid}>
                          {selectedDirigido.personas && selectedDirigido.personas.length > 0 ? (
                            selectedDirigido.personas.map((p: any) => {
                              const isChecked = presentIds.includes(p.id);
                              return (
                                <div
                                  key={p.id}
                                  className={styles.attendanceRow}
                                  onClick={() => {
                                    if (isChecked) {
                                      setPresentIds(presentIds.filter((id) => id !== p.id));
                                    } else {
                                      setPresentIds([...presentIds, p.id]);
                                    }
                                  }}
                                >
                                  <div className={styles.attendanceCheck}>
                                    <span>{isChecked ? "☑" : "☐"}</span>
                                    <span>{p.nombre}</span>
                                  </div>
                                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                    {p.etapa?.nombre_etapa}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <div style={{ padding: "1rem", textAlign: "center", color: "#94a3b8" }}>
                              No hay miembros registrados en este grupo.
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="submit"
                        className={styles.primaryBtn}
                        disabled={attendanceSubmitting || !selectedDirigido.personas?.length}
                      >
                        {attendanceSubmitting ? "Registrando..." : "💾 Guardar Hoja de Asistencia"}
                      </button>
                    </form>
                  </div>

                  {/* History column */}
                  <div className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h2 className={styles.cardTitle}>📜 Historial de Asistencias</h2>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {selectedDirigido.asistencias && selectedDirigido.asistencias.length > 0 ? (
                        selectedDirigido.asistencias.map((a: any) => {
                          const totalMembers = selectedDirigido.personas?.length || 0;
                          const presentCount = a.presentes_ids?.length || 0;
                          const pct = totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 0;

                          return (
                            <div key={a.id} className={styles.attendanceHistItem}>
                              <div>
                                <strong style={{ display: "block", fontSize: "0.88rem" }}>{a.titulo_reunion || "Reunión"}</strong>
                                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>🗓️ {formatFriendlyDate(a.fecha)}</span>
                              </div>
                              <span style={{ fontSize: "0.8rem", padding: "2px 8px", borderRadius: "4px", fontWeight: 700, 
                                backgroundColor: pct > 70 ? "#ecfdf5" : pct > 40 ? "#fffbeb" : "#fef2f2",
                                color: pct > 70 ? "#065f46" : pct > 40 ? "#b45309" : "#991b1b"
                              }}>
                                {presentCount}/{totalMembers} ({pct}%)
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <p style={{ fontSize: "0.85rem", color: "#94a3b8", textAlign: "center", padding: "1rem" }}>
                          No hay registros guardados.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* REPORT CARD */}
                {(() => {
                  const personas = selectedDirigido.personas || [];
                  const asistencias = selectedDirigido.asistencias || [];

                  if (asistencias.length === 0) {
                    return (
                      <div className={styles.card}>
                        <div className={styles.cardHeader}>
                          <h2 className={styles.cardTitle}>📊 Reporte de Alertas de Ausencia y Seguimiento</h2>
                        </div>
                        <p style={{ fontSize: "0.85rem", color: "#64748b", textAlign: "center", padding: "2rem 0", margin: 0 }}>
                          📋 Registra la primera reunión arriba para comenzar a generar reportes de ausencias acumuladas de los alumnos/miembros.
                        </p>
                      </div>
                    );
                  }

                  // Calcular estadísticas de asistencia
                  const miembrosStats = personas.map((p: any) => {
                    let faltasTotales = 0;
                    asistencias.forEach((a: any) => {
                      if (!a.presentes_ids?.includes(p.id)) {
                        faltasTotales++;
                      }
                    });

                    // Calcular faltas consecutivas (racha de inasistencias en las últimas reuniones)
                    let faltasConsecutivas = 0;
                    const sortedAsistencias = [...asistencias].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
                    for (const a of sortedAsistencias) {
                      if (!a.presentes_ids?.includes(p.id)) {
                        faltasConsecutivas++;
                      } else {
                        break;
                      }
                    }

                    return {
                      ...p,
                      faltasTotales,
                      faltasConsecutivas,
                      totalReuniones: asistencias.length,
                    };
                  });

                  // Ordenar: mayor cantidad de faltas consecutivas primero, luego faltas totales, luego por nombre
                  const miembrosOrdenados = [...miembrosStats].sort((a, b) => {
                    if (b.faltasConsecutivas !== a.faltasConsecutivas) {
                      return b.faltasConsecutivas - a.faltasConsecutivas;
                    }
                    if (b.faltasTotales !== a.faltasTotales) {
                      return b.faltasTotales - a.faltasTotales;
                    }
                    return a.nombre.localeCompare(b.nombre);
                  });

                  const absentList = miembrosOrdenados.filter(m => m.faltasTotales > 0);

                  return (
                    <div className={styles.card}>
                      <div className={styles.cardHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <h2 className={styles.cardTitle}>📊 Reporte de Alertas de Ausencia y Seguimiento</h2>
                          <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0.2rem 0 0 0" }}>
                            Alerta a los líderes sobre miembros que han dejado de asistir para darles acompañamiento oportuno.
                          </p>
                        </div>
                      </div>

                      {absentList.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "#16a34a" }}>
                          <span style={{ fontSize: "2rem" }}>🎉</span>
                          <h4 style={{ margin: "0.5rem 0 0.25rem 0", fontWeight: 700 }}>¡Asistencia Perfecta!</h4>
                          <p style={{ fontSize: "0.82rem", margin: 0, color: "#475569" }}>Todos los miembros registrados en el grupo tienen un 100% de asistencia.</p>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
                          {/* Cabecera de la tabla de reporte */}
                          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.25fr 1.75fr", padding: "0.5rem 1rem", backgroundColor: "#f1f5f9", borderRadius: "6px", fontWeight: "bold", fontSize: "0.8rem", color: "#475569" }}>
                            <span>Miembro / Creyente</span>
                            <span style={{ textAlign: "center" }}>Ausencias</span>
                            <span>Estado / Alerta</span>
                            <span style={{ textAlign: "right" }}>Acción</span>
                          </div>

                          {absentList.map((m: any) => {
                            const pctAsistencia = Math.round(((m.totalReuniones - m.faltasTotales) / m.totalReuniones) * 100);
                            
                            // Determinar nivel de alerta
                            let alertLabel = "Ausencia Ocasional";
                            let alertColor = { text: "#475569", bg: "#f1f5f9", border: "#cbd5e1" };
                            
                            if (m.faltasConsecutivas >= 2) {
                              alertLabel = `🚨 Inactivo (${m.faltasConsecutivas} consecutivas)`;
                              alertColor = { text: "#991b1b", bg: "#fef2f2", border: "#fecaca" };
                            } else if (m.faltasTotales >= 2) {
                              alertLabel = "⚠️ Alerta: Faltas Frecuentes";
                              alertColor = { text: "#b45309", bg: "#fffbeb", border: "#fef3c7" };
                            } else if (m.faltasConsecutivas === 1) {
                              alertLabel = "⏳ Faltó a la última clase";
                              alertColor = { text: "#0369a1", bg: "#e0f2fe", border: "#bae6fd" };
                            }

                            // Configurar WhatsApp
                            const whatsappNumber = m.whatsapp || m.telefono;
                            const cleanNumber = whatsappNumber ? whatsappNumber.replace(/[^0-9]/g, "") : "";
                            const message = `Hola ${m.nombre}, te extrañamos hoy en la reunión de nuestro grupo "${selectedDirigido.nombre_grupo}". ¡Esperamos que estés bien y verte la próxima semana! ⛪`;
                            const waUrl = cleanNumber ? `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}` : "";

                            return (
                              <div 
                                key={m.id}
                                style={{ 
                                  display: "grid", 
                                  gridTemplateColumns: "2fr 1fr 1.25fr 1.75fr", 
                                  alignItems: "center", 
                                  padding: "0.75rem 1rem", 
                                  backgroundColor: m.faltasConsecutivas >= 2 ? "#fff5f5" : "white", 
                                  border: `1px solid ${m.faltasConsecutivas >= 2 ? "#fed7d7" : "#e2e8f0"}`, 
                                  borderRadius: "8px",
                                  fontSize: "0.85rem"
                                }}
                              >
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                  <span style={{ fontWeight: 600, color: "#1e293b" }}>{m.nombre}</span>
                                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>📱 {m.telefono || "Sin teléfono"}</span>
                                </div>
                                <div style={{ textAlign: "center", fontWeight: 700, color: m.faltasConsecutivas >= 2 ? "#ef4444" : "#475569" }}>
                                  {m.faltasTotales} / {m.totalReuniones}
                                  <span style={{ display: "block", fontSize: "0.7rem", color: "#94a3b8", fontWeight: 500 }}>
                                    ({pctAsistencia}% asistencia)
                                  </span>
                                </div>
                                <div>
                                  <span style={{ 
                                    fontSize: "0.72rem", 
                                    padding: "3px 8px", 
                                    borderRadius: "12px", 
                                    fontWeight: 700,
                                    border: `1px solid ${alertColor.border}`,
                                    backgroundColor: alertColor.bg,
                                    color: alertColor.text,
                                    display: "inline-block"
                                  }}>
                                    {alertLabel}
                                  </span>
                                </div>
                                <div style={{ display: "flex", gap: "0.35rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                                  {m.telefono && (
                                    <a 
                                      href={`tel:${m.telefono}`}
                                      className={styles.primaryBtn}
                                      style={{ 
                                        display: "inline-flex", 
                                        alignItems: "center", 
                                        gap: "0.25rem", 
                                        padding: "0.3rem 0.6rem", 
                                        fontSize: "0.75rem",
                                        textDecoration: "none",
                                        backgroundColor: m.faltasConsecutivas >= 2 ? "#ef4444" : "#0284c7"
                                      }}
                                    >
                                      📞 Llamar
                                    </a>
                                  )}
                                  {waUrl && (
                                    <a 
                                      href={waUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={styles.primaryBtn}
                                      style={{ 
                                        display: "inline-flex", 
                                        alignItems: "center", 
                                        gap: "0.25rem", 
                                        padding: "0.3rem 0.6rem", 
                                        fontSize: "0.75rem",
                                        textDecoration: "none",
                                        backgroundColor: "#25d366"
                                      }}
                                    >
                                      💬 WhatsApp
                                    </a>
                                  )}
                                  {!m.telefono && !waUrl && (
                                    <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontStyle: "italic" }}>Sin contacto</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {leaderSubTab === "agreements" && (
              /* PUBLISH AGREEMENTS / CHECK CONFIRMATIONS */
              <div className={styles.dashboardLayout}>
                {/* Form column */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>📣 Publicar Acuerdo o Aviso Fijo</h2>
                  </div>

                  <form onSubmit={handlePublishAgreement} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Título del Anuncio</label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Ej: Retiro del grupo, Próximo acuerdo de lectura..."
                        value={agreementTitle}
                        onChange={(e) => setAgreementTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Contenido del Anuncio</label>
                      <textarea
                        className={styles.textarea}
                        placeholder="Escribe los detalles del anuncio..."
                        value={agreementContent}
                        onChange={(e) => setAgreementContent(e.target.value)}
                        required
                      />
                    </div>

                    <button type="submit" className={styles.primaryBtn} disabled={agreementSubmitting}>
                      {agreementSubmitting ? "Publicando..." : "📢 Publicar en el Tablero"}
                    </button>
                  </form>
                </div>

                {/* History & Check-offs (cotejos) Column */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>👁️ Cotejo de Lecturas Recibidas</h2>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {selectedDirigido.acuerdos && selectedDirigido.acuerdos.length > 0 ? (
                      selectedDirigido.acuerdos.map((ac: any) => {
                        const totalMembers = selectedDirigido.personas?.length || 0;
                        const confirmedCount = ac.confirmaciones?.length || 0;
                        
                        // List names of who has confirmed
                        const confirmedNames = ac.confirmaciones?.map((conf: any) => {
                          const personaObj = selectedDirigido.personas?.find((p: any) => p.id === conf.persona_id);
                          return personaObj?.nombre || "Miembro";
                        }).join(", ");

                        return (
                          <div key={ac.id} style={{ border: "1px solid #cbd5e1", padding: "0.75rem", borderRadius: "8px", backgroundColor: "#f8fafc" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.25rem" }}>
                              <strong style={{ fontSize: "0.88rem", color: "var(--text-primary)" }}>{ac.titulo}</strong>
                              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-blue)" }}>
                                {confirmedCount}/{totalMembers} leídos
                              </span>
                            </div>
                            {confirmedCount > 0 ? (
                              <div style={{ fontSize: "0.75rem", color: "var(--success)", fontWeight: 500 }}>
                                ✓ Confirmado por: <span style={{ fontStyle: "italic", color: "var(--text-secondary)" }}>{confirmedNames}</span>
                              </div>
                            ) : (
                              <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontStyle: "italic" }}>
                                Nadie ha confirmado lectura todavía.
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p style={{ fontSize: "0.85rem", color: "#94a3b8", textAlign: "center", padding: "1rem" }}>
                        No hay acuerdos publicados.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {leaderSubTab === "agenda" && (
              /* CELL AGENDA / EVENTS CREATION */
              <div className={styles.dashboardLayout}>
                {/* Form column */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>📅 Crear Evento en Agenda del Grupo</h2>
                  </div>

                  <form onSubmit={handleAddAgendaEvent} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Título del Evento</label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Ej: Reunión de Clases Bíblicas, Compartir..."
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Detalles (Opcional)</label>
                      <textarea
                        className={styles.textarea}
                        placeholder="Ubicación, qué traer, etc..."
                        value={eventDesc}
                        onChange={(e) => setEventDesc(e.target.value)}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Fecha</label>
                        <input
                          type="date"
                          className={styles.input}
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Hora (Opcional)</label>
                        <input
                          type="time"
                          className={styles.input}
                          value={eventTime}
                          onChange={(e) => setEventTime(e.target.value)}
                        />
                      </div>
                    </div>

                    <button type="submit" className={styles.primaryBtn} disabled={eventSubmitting}>
                      {eventSubmitting ? "Guardando..." : "💾 Programar Evento"}
                    </button>
                  </form>
                </div>

                {/* List column */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>📋 Próximos Eventos Internos</h2>
                  </div>

                  <div className={styles.agendaList}>
                    {selectedDirigido.agenda && selectedDirigido.agenda.length > 0 ? (
                      selectedDirigido.agenda.map((ev: any) => {
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
                              {ev.descripcion && <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0 }}>{ev.descripcion}</p>}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p style={{ textAlign: "center", fontSize: "0.85rem", color: "#94a3b8", padding: "1rem" }}>
                        No hay eventos programados.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {leaderSubTab === "forum" && (
              /* FORUM DISCUSSION MODERATION */
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>💬 Foro y Comentarios del Grupo</h2>
                </div>

                <div className={styles.forumWrapper}>
                  {/* Post Comment Form */}
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <textarea
                      className={styles.textarea}
                      placeholder="Escribe algo en el foro como líder..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      disabled={commentSubmitting}
                    />
                    <button
                      className={styles.primaryBtn}
                      onClick={() => handlePostComment(selectedDirigido.id)}
                      disabled={commentSubmitting || !newCommentText.trim()}
                      style={{ height: "fit-content", alignSelf: "flex-end" }}
                    >
                      {commentSubmitting ? "..." : "Enviar"}
                    </button>
                  </div>

                  {/* Comments Thread */}
                  <div className={styles.commentsThread}>
                    {selectedDirigido.comentarios_foro && selectedDirigido.comentarios_foro.length > 0 ? (
                      selectedDirigido.comentarios_foro.map((c: any) => (
                        <div key={c.id} className={styles.commentItem}>
                          <div className={styles.memberAvatar}>
                            {c.persona?.foto_url ? (
                              <img src={c.persona.foto_url} alt={c.persona.nombre} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                            ) : (
                              <span>👤</span>
                            )}
                          </div>
                          <div className={styles.commentBody}>
                            <div className={styles.commentMeta}>
                              <strong style={{ color: "#1e293b" }}>{c.persona?.nombre || "Miembro"}</strong>
                              <span>{formatFriendlyDate(c.fecha)}</span>
                            </div>
                            <div className={styles.commentContent}>{c.comentario}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ textAlign: "center", fontSize: "0.85rem", color: "#94a3b8", padding: "1rem" }}>
                        No hay comentarios registrados todavía en este grupo.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ========================================================
             INFORMACIÓN DE ASIGNACIÓN AUTOMÁTICA POR EDAD Y SEXO
             ======================================================== */
          <div className={styles.card} style={{ textAlign: "center", padding: "3rem", borderLeft: "5px solid var(--accent-blue)" }}>
            <span style={{ fontSize: "3.5rem" }}>👥</span>
            <h1 style={{ marginTop: "1rem", fontSize: "1.6rem", fontWeight: 800, color: "#0f172a" }}>
              Asignación Automática de Grupo de Conexión
            </h1>
            <p style={{ color: "#64748b", margin: "0.75rem auto 1.5rem auto", maxWidth: "600px", lineHeight: "1.6", fontSize: "0.95rem" }}>
              En nuestra iglesia, los integrantes son asignados <strong>automáticamente</strong> a su Grupo de Conexión en función de su <strong>Edad</strong> (fecha de nacimiento) y <strong>Sexo</strong>. Conforme pasen los años y avances de rango de edad, el sistema te promoverá automáticamente al grupo que te corresponda.
            </p>
            <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", maxWidth: "520px", margin: "0 auto 1.5rem auto", textAlign: "left", fontSize: "0.88rem", color: "#334155" }}>
              <div style={{ fontWeight: 700, marginBottom: "0.5rem", color: "#0284c7" }}>💡 ¿Por qué no veo mi grupo aún?</div>
              <ul style={{ margin: 0, paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <li>Asegúrate de haber guardado tu <strong>Fecha de Nacimiento</strong> y <strong>Sexo</strong> en tu perfil.</li>
                <li>Si tus datos ya están completos, es posible que la administración de tu templo aún no haya creado un grupo activo para tu rango de edad.</li>
              </ul>
            </div>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/perfil" className={styles.primaryBtn} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontWeight: 700 }}>
                <img src="/Iconos SVG/perfil.svg" alt="Perfil" style={{ width: '18px', height: '18px', objectFit: 'contain' }} /> Ir a Mi Perfil y Actualizar Datos
              </Link>
              <Link href="/hub" className={styles.secondaryBtn} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
                <img src="/Iconos SVG/iglesia.png" alt="Mi Iglesia" style={{ width: '18px', height: '18px', objectFit: 'contain' }} /> Volver a Mi Iglesia
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================
         MODALS & OVERLAYS
         ======================================================== */}

      {/* Member Details Modal (for Leaders inside Kanban) */}
      {selectedMember && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
          onClick={() => setSelectedMember(null)}
        >
          <div
            className={styles.card}
            style={{
              maxWidth: "600px",
              width: "100%",
              backgroundColor: "white",
              padding: "2rem",
              borderRadius: "16px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
              animation: "fadeIn 0.2s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {modalTab === 'avance' ? '👤' : '🏷️'} {modalTab === 'avance' ? 'Detalle de Avance' : 'Alertas de Atención'}: {selectedMember.nombre}
              </h3>
              <button
                style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#64748b", cursor: "pointer" }}
                onClick={() => { setSelectedMember(null); setShowTagsInModal(false); }}
              >
                &times;
              </button>
            </div>

            {/* Modal Tab Switcher */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <button
                onClick={() => setModalTab('avance')}
                style={{ padding: '0.4rem 1rem', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', background: modalTab === 'avance' ? '#e0f2fe' : '#f1f5f9', color: modalTab === 'avance' ? '#0369a1' : '#64748b' }}
              >
                📋 Avance Etapas
              </button>
              <button
                onClick={() => {
                  setModalTab('alertas');
                  if (!showTagsInModal) {
                    setShowTagsInModal(true);
                    loadTagsForMember(selectedMember.id);
                  }
                }}
                style={{ padding: '0.4rem 1rem', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', background: modalTab === 'alertas' ? '#fef2f2' : '#f1f5f9', color: modalTab === 'alertas' ? '#ef4444' : '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                🏷️ Alertas de Atención
                {selectedMember.etiquetas && selectedMember.etiquetas.length > 0 && (
                  <span style={{ background: '#ef4444', color: 'white', borderRadius: '9999px', padding: '0 5px', fontSize: '0.7rem', fontWeight: 800 }}>
                    {selectedMember.etiquetas.length}
                  </span>
                )}
              </button>
            </div>

            {/* TAB: AVANCE ETAPAS */}
            {modalTab === 'avance' && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <strong>Etapa de Crecimiento:</strong>
                <select
                  value={selectedMember.etapa_id || ""}
                  onChange={async (e) => {
                    const nextEtapaId = e.target.value;
                    if (!nextEtapaId) return;
                    try {
                      const res = await fetch("/api/miembros", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "updateEtapa",
                          data: { memberId: selectedMember.id, etapaId: nextEtapaId }
                        })
                      });
                      const resData = await res.json();
                      if (resData.error) {
                        alert("Error al actualizar la etapa: " + resData.error);
                      } else {
                        // Recargar todo
                        const authRes = await fetch("/api/auth");
                        const adminRes = await fetch("/api/iglesia");
                        const grupoRes = await fetch("/api/grupo");

                        const authData = await authRes.json();
                        const adminData = await adminRes.json();
                        const grupoDataJson = await grupoRes.json();

                        setProfile(authData);
                        setAdminConfig(adminData);
                        setGroupData(grupoDataJson);

                        // Actualizar miembro seleccionado
                        let updatedM = null;
                        if (grupoDataJson.gruposDirigidos) {
                          for (const g of grupoDataJson.gruposDirigidos) {
                            const found = g.personas?.find((p: any) => p.id === selectedMember.id);
                            if (found) {
                              updatedM = found;
                              break;
                            }
                          }
                        }
                        if (updatedM) {
                          const stage = adminData.etapas?.find((s: any) => s.id === updatedM.etapa_id);
                          setSelectedMember({ ...updatedM, etapa: stage });
                        }
                      }
                    } catch (err) {
                      console.error(err);
                      alert("Error al guardar cambios de etapa.");
                    }
                  }}
                  style={{
                    padding: "0.35rem 0.65rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#334155",
                    backgroundColor: "#f8fafc",
                    cursor: "pointer"
                  }}
                >
                  {sortedEtapas.map((stage: any) => (
                    <option key={stage.id} value={stage.id}>
                      📍 {stage.nombre_etapa}
                    </option>
                  ))}
                </select>
              </div>

              {/* Progress summary */}
              <div>
                <strong style={{ display: "block", marginBottom: "0.25rem" }}>Resumen de Procesos:</strong>
                {(() => {
                  const prog = getMemberProgress(selectedMember);
                  return (
                    <div>
                      <div className={styles.progressBarBg} style={{ marginBottom: "0.4rem" }}>
                        <div className={styles.progressBarFill} style={{ width: `${prog.ratio}%` }} />
                      </div>
                      <span style={{ fontSize: "0.85rem", color: "#475569" }}>
                        Ha completado {prog.completed} de {prog.total} procesos en esta etapa ({prog.ratio}%)
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Task checklist */}
              <div style={{ marginTop: "0.5rem" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <strong style={{ display: "block" }}>Secuencia de Procesos de esta Etapa:</strong>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: '#475569', backgroundColor: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '6px' }}>
                    <input 
                      type="checkbox" 
                      checked={allowOutOfOrder} 
                      onChange={(e) => handleSetAllowOutOfOrder(e.target.checked)} 
                      style={{ cursor: 'pointer' }}
                    />
                    🔓 Permitir libre orden
                  </label>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "250px", overflowY: "auto", paddingRight: "0.25rem" }}>
                  {(() => {
                    const stageTasks = activeProcesos.filter((p: any) => p.etapa_id === selectedMember.etapa_id).sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0));
                    const completedTasks = selectedMember.historial_tareas?.filter((ht: any) => ht.completada).map((ht: any) => ht.tarea_id) || [];

                    if (stageTasks.length === 0) {
                      return <p style={{ fontSize: "0.85rem", fontStyle: "italic", color: "#94a3b8" }}>No hay procesos asociados a esta etapa.</p>;
                    }

                    // Encontrar el índice de la primera tarea no completada
                    const firstUncompletedIndex = stageTasks.findIndex((t: any) => !completedTasks.includes(t.id));

                    return stageTasks.map((t: any, index: number) => {
                      const isDone = completedTasks.includes(t.id);
                      const isCurrentPending = !isDone && firstUncompletedIndex === index;
                      const isLocked = !isDone && !allowOutOfOrder && firstUncompletedIndex !== -1 && index > firstUncompletedIndex;

                      let statusLabel = "Pendiente";
                      let statusColor = "#64748b";
                      let statusBg = "#f1f5f9";
                      let statusBorder = "#cbd5e1";

                      if (isDone) {
                        statusLabel = "Graduado";
                        statusColor = "#15803d";
                        statusBg = "#dcfce7";
                        statusBorder = "#bbf7d0";
                      } else if (isCurrentPending) {
                        statusLabel = "👉 Siguiente Paso";
                        statusColor = "#0369a1";
                        statusBg = "#e0f2fe";
                        statusBorder = "#bae6fd";
                      } else if (isLocked) {
                        statusLabel = "🔒 Bloqueado";
                        statusColor = "#94a3b8";
                        statusBg = "#f8fafc";
                        statusBorder = "#e2e8f0";
                      }

                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            if (!isLocked) {
                              handleToggleTask(selectedMember.id, t.id);
                            } else {
                              alert("Debes completar el proceso anterior en orden para poder activar este paso.");
                            }
                          }}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "0.85rem",
                            padding: "0.5rem 0.75rem",
                            backgroundColor: statusBg,
                            border: `1px solid ${statusBorder}`,
                            borderRadius: "8px",
                            cursor: isLocked ? "not-allowed" : "pointer",
                            opacity: isLocked ? 0.6 : 1,
                            transition: "all 0.15s",
                          }}
                          title={isLocked ? "Bloqueado en orden secuencial" : "Haz clic para marcar/desmarcar"}
                        >
                          <span style={{ fontWeight: 600, color: isDone ? "#15803d" : "#334155" }}>
                            {isDone ? "✅" : isLocked ? "🔒" : "⬜"} {t.nombre_tarea}
                          </span>
                          <span style={{ 
                            fontSize: "0.72rem", 
                            padding: "2px 8px", 
                            borderRadius: "4px", 
                            fontWeight: 700,
                            backgroundColor: statusColor,
                            color: "white"
                          }}>
                            {statusLabel}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
            )} {/* End TAB: AVANCE */}

            {/* TAB: ALERTAS DE ATENCIÓN */}
            {modalTab === 'alertas' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                {/* Columna 1: Asignar nueva alerta */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.1rem' }}>
                  <h4 style={{ fontWeight: 700, margin: '0 0 0.85rem 0', color: '#0f172a', fontSize: '0.9rem' }}>➕ Asignar Alerta</h4>
                  {tagsLoadingGrupo ? (
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Cargando...</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.78rem', marginBottom: '0.25rem', color: '#475569' }}>Tipo de Alerta</label>
                        <select
                          value={selectedTagIdGrupo}
                          onChange={(e) => {
                            const tid = e.target.value;
                            setSelectedTagIdGrupo(tid);
                            const found = availableTagsGrupo.find(t => t.id === tid);
                            if (found) setCustomTagDurationGrupo(String(found.duracion_dias_defecto));
                          }}
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '7px', fontSize: '0.82rem', backgroundColor: 'white' }}
                        >
                          {availableTagsGrupo.map((tag: any) => (
                            <option key={tag.id} value={tag.id}>{tag.icono} {tag.nombre}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.78rem', marginBottom: '0.25rem', color: '#475569' }}>Duración (días, 0 = sin límite)</label>
                        <input
                          type="number"
                          value={customTagDurationGrupo}
                          onChange={(e) => setCustomTagDurationGrupo(e.target.value)}
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '7px', fontSize: '0.82rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.78rem', marginBottom: '0.25rem', color: '#475569' }}>Notas / Motivo</label>
                        <textarea
                          value={tagNotesGrupo}
                          onChange={(e) => setTagNotesGrupo(e.target.value)}
                          placeholder="Describe la situación..."
                          rows={3}
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '7px', fontSize: '0.82rem', resize: 'vertical' }}
                        />
                      </div>
                      <button
                        onClick={handleAssignTagGrupo}
                        style={{ width: '100%', padding: '0.55rem', background: '#0284c7', border: 'none', borderRadius: '7px', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
                      >
                        Asignar Alerta
                      </button>
                    </div>
                  )}
                </div>

                {/* Columna 2: Alertas activas + historial */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Activas */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.1rem' }}>
                    <h4 style={{ fontWeight: 700, margin: '0 0 0.75rem 0', color: '#0f172a', fontSize: '0.9rem' }}>🚨 Alertas Activas</h4>
                    {memberTagHistoryGrupo.filter(h => h.activa && (!h.fecha_fin || new Date(h.fecha_fin) > new Date())).length === 0 ? (
                      <p style={{ color: '#64748b', fontSize: '0.82rem', margin: 0 }}>Sin alertas activas.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {memberTagHistoryGrupo.filter(h => h.activa && (!h.fecha_fin || new Date(h.fecha_fin) > new Date())).map((h: any) => (
                          <div key={h.id} style={{ border: `1.5px solid ${h.etiqueta.color}`, borderRadius: '7px', padding: '0.7rem', background: `${h.etiqueta.color}08` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                              <span style={{ fontWeight: 'bold', color: h.etiqueta.color, fontSize: '0.85rem' }}>{h.etiqueta.icono} {h.etiqueta.nombre}</span>
                              <button onClick={() => handleRemoveMemberTagGrupo(h.id)} style={{ border: 'none', background: 'transparent', color: '#ef4444', fontWeight: 'bold', fontSize: '0.72rem', cursor: 'pointer' }}>❌ Quitar</button>
                            </div>
                            {h.notas && <p style={{ fontSize: '0.78rem', color: '#334155', margin: '0 0 0.3rem 0' }}><strong>Motivo:</strong> {h.notas}</p>}
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Vence: {h.fecha_fin ? new Date(h.fecha_fin).toLocaleDateString() : 'Sin fecha límite'}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Historial compacto */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.1rem', maxHeight: '180px', overflowY: 'auto' }}>
                    <h4 style={{ fontWeight: 700, margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '0.9rem' }}>📜 Historial</h4>
                    {memberTagHistoryGrupo.length === 0 ? (
                      <p style={{ color: '#64748b', fontSize: '0.82rem', margin: 0 }}>Sin historial.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {memberTagHistoryGrupo.map((h: any) => {
                          const isExpired = h.fecha_fin && new Date(h.fecha_fin) <= new Date();
                          const isActive = h.activa && !isExpired;
                          return (
                            <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0.5rem', borderRadius: '5px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.77rem' }}>
                              <span style={{ fontWeight: 600 }}>{h.etiqueta.icono} {h.etiqueta.nombre}</span>
                              <span style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold', background: isActive ? '#dcfce7' : '#f1f5f9', color: isActive ? '#15803d' : '#64748b' }}>
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
            )} {/* End TAB: ALERTAS */}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem", borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
              <button
                className={styles.secondaryBtn}
                onClick={() => { setSelectedMember(null); setShowTagsInModal(false); setModalTab('avance'); }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Registro Pastoral Rapido */}
      {showPastoralModal && selectedMember && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
          onClick={() => setShowPastoralModal(false)}
        >
          <div
            className={styles.card}
            style={{
              maxWidth: "500px",
              width: "100%",
              backgroundColor: "white",
              padding: "2rem",
              borderRadius: "16px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
              animation: "fadeIn 0.2s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                🙏 Pastoral: {selectedMember.nombre}
              </h3>
              <button
                style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#64748b", cursor: "pointer", background: "none", border: "none" }}
                onClick={() => setShowPastoralModal(false)}
              >
                &times;
              </button>
            </div>

            <div style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: "0.5rem" }}>
              {/* Formulario Bitacora */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <h4 style={{ fontWeight: 700, fontSize: '0.95rem', margin: '0 0 1rem 0', color: '#0f172a' }}>Nuevo Seguimiento</h4>
                <form onSubmit={handleSavePastoral} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.label} style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', color: '#334155' }}>Tipo</label>
                      <select
                        className={styles.input}
                        value={bitTipo}
                        onChange={(e) => setBitTipo(e.target.value)}
                        style={{ backgroundColor: 'white', width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      >
                        <option value="VISITA">🏠 Visita</option>
                        <option value="LLAMADA">📞 Llamada</option>
                        <option value="MENSAJE">💬 Mensaje</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label} style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', color: '#334155' }}>Fecha</label>
                      <input
                        type="date"
                        className={styles.input}
                        value={bitFecha}
                        onChange={(e) => setBitFecha(e.target.value)}
                        required
                        style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <textarea
                      className={styles.input}
                      value={bitNotas}
                      onChange={(e) => setBitNotas(e.target.value)}
                      placeholder="Escribe detalles de la visita o llamada..."
                      rows={2}
                      required
                      style={{ resize: 'vertical', padding: '0.5rem', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="submit"
                      disabled={bitLoading}
                      style={{
                        backgroundColor: '#d97706',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.5rem 1rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.85rem'
                      }}
                    >
                      {bitLoading ? "Guardando..." : "+ Registrar"}
                    </button>
                  </div>
                </form>
              </div>

              {pastoralDataLoading ? (
                <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>Cargando datos pastorales...</p>
              ) : (
                <>
                  {/* Peticiones de oracion */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem', margin: '0 0 0.75rem 0', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.3rem' }}>Peticiones de Oración ({memberPeticiones.length})</h4>
                    {memberPeticiones.length === 0 ? (
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>Sin peticiones registradas.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {memberPeticiones.map((p) => (
                          <div key={p.id} style={{ background: p.es_confidencial ? '#fefce8' : '#f1f5f9', border: `1px solid ${p.es_confidencial ? '#fef08a' : '#e2e8f0'}`, borderRadius: '8px', padding: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                              <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', background: p.estado === 'ACTIVA' ? '#dbeafe' : p.estado === 'ORANDO' ? '#dcfce7' : '#f3f4f6', color: p.estado === 'ACTIVA' ? '#1d4ed8' : p.estado === 'ORANDO' ? '#15803d' : '#374151' }}>{p.estado}</span>
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(p.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#334155', margin: 0 }}>{p.peticion}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Historial Pastoral */}
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem', margin: '0 0 0.75rem 0', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.3rem' }}>Historial Pastoral ({memberPastoralHistory.length})</h4>
                    {memberPastoralHistory.length === 0 ? (
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>Sin registros en el historial.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {memberPastoralHistory.map((h, idx) => (
                          <div key={idx} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', borderLeft: `4px solid ${h.categoria === 'PASTORAL' ? '#d97706' : '#3b82f6'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>{h.titulo}</span>
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(h.fecha).toLocaleDateString()}</span>
                            </div>
                            {h.detalle && <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0 }}>{h.detalle}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0" }}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setShowPastoralModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Agregar Integrante */}
      {showAddMemberModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
          onClick={() => setShowAddMemberModal(false)}
        >
          <div
            className={styles.card}
            style={{
              maxWidth: "500px",
              width: "100%",
              backgroundColor: "white",
              padding: "2rem",
              borderRadius: "16px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
              animation: "fadeIn 0.2s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                ➕ Agregar Integrante al Grupo
              </h3>
              <button
                style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#64748b", cursor: "pointer", background: "none", border: "none" }}
                onClick={() => setShowAddMemberModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className={styles.formGroup}>
                <label className={styles.label} style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', color: '#334155' }}>Nombre Completo *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={newMemberNombre}
                  onChange={(e) => setNewMemberNombre(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', color: '#334155' }}>Número de Teléfono</label>
                <input
                  type="tel"
                  className={styles.input}
                  value={newMemberTelefono}
                  onChange={(e) => setNewMemberTelefono(e.target.value)}
                  placeholder="Ej. 809-555-1234"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', color: '#334155' }}>Correo Electrónico (Opcional)</label>
                <input
                  type="email"
                  className={styles.input}
                  value={newMemberCorreo}
                  onChange={(e) => setNewMemberCorreo(e.target.value)}
                  placeholder="juan.perez@ejemplo.com"
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
                  Si ingresas un correo, se le creará un usuario miembro automáticamente.
                </span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', color: '#334155' }}>Sexo / Género</label>
                <select
                  className={styles.input}
                  value={newMemberSexo}
                  onChange={(e) => setNewMemberSexo(e.target.value)}
                  style={{ backgroundColor: 'white', width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="M">Masculino 👤</option>
                  <option value="F">Femenino 👩</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <strong>Grupo de destino:</strong>
                  <div style={{ fontSize: '0.85rem', color: '#0369a1', background: '#e0f2fe', padding: '0.35rem 0.6rem', borderRadius: '6px', fontWeight: 600, marginTop: '2px' }}>
                    👥 {selectedDirigido?.nombre_grupo || "Grupo de Conexión"}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <strong>Etapa inicial:</strong>
                  <div style={{ fontSize: '0.85rem', color: '#b45309', background: '#fff7ed', padding: '0.35rem 0.6rem', borderRadius: '6px', fontWeight: 600, marginTop: '2px' }}>
                    📍 {sortedEtapas.find(et => et.id === activeLeaderStageId)?.nombre_etapa || "Etapa seleccionada"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem", borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setShowAddMemberModal(false)}
                  disabled={addMemberLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={addMemberLoading}
                  style={{
                    backgroundColor: '#0284c7',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.55rem 1.25rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {addMemberLoading ? "Guardando..." : "Registrar Integrante"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GrupoPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <p style={{ color: '#64748b', fontWeight: 600 }}>Cargando...</p>
      </div>
    }>
      <GrupoContent />
    </Suspense>
  );
}
