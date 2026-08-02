"use client";
import { useState, useEffect } from "react";
import styles from "./admin.module.css";
import Link from "next/link";
import dynamic from "next/dynamic";

const FinanzasModule = dynamic(() => import("./FinanzasModule"), {
  ssr: false,
  loading: () => <div style={{ padding: "2rem", textAlign: "center", color: "#64748b", fontWeight: 600 }}>⏳ Cargando Módulo de Finanzas...</div>
});

const GestorEventosModule = dynamic(() => import("./GestorEventosModule"), {
  ssr: false,
  loading: () => <div style={{ padding: "2rem", textAlign: "center", color: "#64748b", fontWeight: 600 }}>⏳ Cargando Módulo de Eventos...</div>
});

const TemploModule = dynamic(() => import("./TemploModule"), {
  ssr: false,
  loading: () => <div style={{ padding: "2rem", textAlign: "center", color: "#64748b", fontWeight: 600 }}>⏳ Cargando Módulo de Templo...</div>
});

const GestorFormulariosModule = dynamic(() => import("./GestorFormulariosModule"), {
  ssr: false,
  loading: () => <div style={{ padding: "2rem", textAlign: "center", color: "#64748b", fontWeight: 600 }}>⏳ Cargando Gestor de Formularios...</div>
});

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState(12); // Default; restored from recentTabs in useEffect
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [recentTabs, setRecentTabs] = useState<number[]>(() => {
    if (typeof window !== 'undefined') {
      try { return JSON.parse(localStorage.getItem('admin_recent_tabs') || '[]'); } catch { return []; }
    }
    return [];
  });

  const trackTabVisit = (tabId: number) => {
    setActiveTab(tabId);
    setRecentTabs(prev => {
      const filtered = prev.filter(id => id !== tabId);
      const next = [tabId, ...filtered].slice(0, 6);
      try { localStorage.setItem('admin_recent_tabs', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const allTabs = [
    { id: 12, label: "Dashboard", title: "Reporte y Dashboard Analítico", description: "Estado y crecimiento congregacional a la luz del avance por etapas.", icon: "/Iconos SVG/dashboard.png", roles: ["SUPERADMIN", "ADMIN_IGLESIA"] },
    { id: 1, label: "Mi Iglesia", title: "Mi Iglesia y Configuración General", description: "Gestiona los datos, colores, agenda y recursos disponibles para los miembros.", icon: "/Iconos SVG/Identidad-2.svg", roles: ["SUPERADMIN", "ADMIN_IGLESIA"] },
    { id: 2, label: "Sociedades", title: "Estructura de Sociedades y Grupos", description: "Crea las Sociedades principales y subdivídelas en Grupos de Conexión.", icon: "/Iconos SVG/Sociedad.svg", roles: ["SUPERADMIN", "ADMIN_IGLESIA"] },
    { id: 18, label: "Grupos de Familias", title: "Grupos de Familias de Hogar", description: "Administra los Macro Grupos de familias mixtos de la iglesia, sus directivas, cultos de hogar y necesidades de familias.", icon: "🏡", roles: ["SUPERADMIN", "ADMIN_IGLESIA"] },
    { id: 3, label: "Etapas de Crecimiento", title: "Estructura de la Ruta de Crecimiento", description: "Configura las Etapas del camino de crecimiento del miembro y mapea sus procesos.", icon: "/Iconos SVG/Etapas.svg", roles: ["SUPERADMIN", "ADMIN_IGLESIA"] },
    { id: 4, label: "Módulos de Procesos", title: "Catálogo de Módulos y Procesos", description: "Crea los Módulos correspondientes a los departamentos de trabajo y registra las tareas.", icon: "/Iconos SVG/Proceso.svg", roles: ["SUPERADMIN", "ADMIN_IGLESIA"] },
    { id: 5, label: "Liderazgo y Permisos", title: "Consola de Liderazgo y Permisos (RBAC)", description: "Organiza y clasifica a los líderes por áreas, personaliza sus categorías y crea sus directivas.", icon: "/Iconos SVG/servicio.svg", roles: ["SUPERADMIN", "ADMIN_IGLESIA"] },
    { id: 6, label: "Agenda y Eventos", title: "Agenda de Actividades de la Iglesia", description: "Programa actividades semanales regulares y eventos especiales.", icon: "/Iconos SVG/Agenda.svg", roles: ["SUPERADMIN", "ADMIN_IGLESIA"] },
    { id: 7, label: "Miembros", title: "Administración General de Miembros", description: "Busca, edita y gestiona la información y etapas de crecimiento de todos los miembros registrados en la iglesia.", icon: "/Iconos SVG/Miembros.svg", roles: ["SUPERADMIN", "ADMIN_IGLESIA"] },
    { id: 9, label: "Comunicados", title: "Comunicados Oficiales", description: "Publica anuncios oficiales para toda la iglesia, sociedades específicas o grupos de líderes.", icon: "/Iconos SVG/comunicado.png", roles: ["SUPERADMIN", "ADMIN_IGLESIA"] },
    { id: 10, label: "Finanzas", title: "Módulo de Finanzas", description: "Gestión completa de ingresos, egresos, fondos y nómina de la iglesia.", icon: "/Iconos SVG/finanzas.png", roles: ["SUPERADMIN", "ADMIN_IGLESIA"] },
    { id: 11, label: "Pastoral", title: "Módulo Pastoral", description: "Gestión de peticiones de oración y bitácora de seguimiento pastoral.", icon: "/Iconos SVG/pastoral.svg", roles: ["SUPERADMIN", "ADMIN_IGLESIA"] },
    { id: 17, label: "Templo", title: "Administración del Templo y Planta Física", description: "Administra el inventario de bienes, programar mantenimiento, control de préstamos de artículos y reservas de salones.", icon: "/Iconos SVG/templo.png", roles: ["SUPERADMIN", "ADMIN_IGLESIA"] },
    { id: 14, label: "Eventos y Cursos", title: "Gestión de Eventos y Cursos", description: "Administra eventos, cursos de crecimiento y check-in de asistencia.", icon: "/Iconos SVG/Ebento.svg", roles: ["SUPERADMIN", "ADMIN_IGLESIA"] },
    { id: 16, label: "Formularios y Encuestas", title: "Encuestas y Formularios", description: "Crea y gestiona formularios, encuestas y recopila respuestas de los miembros.", icon: "/Iconos SVG/Formulario.svg", roles: ["SUPERADMIN", "ADMIN_IGLESIA"] },
    { id: 8, label: "Soporte Técnico", title: "Soporte Técnico y Mensajería", description: "Chatea directamente con nuestro equipo de soporte técnico para resolver dudas o problemas.", icon: "/Iconos SVG/soporte.svg", roles: ["SUPERADMIN", "ADMIN_IGLESIA"] }
  ];

  const visibleTabs = (() => {
    if (!currentUser) return [];
    if (currentUser.rol === "SUPERADMIN" || currentUser.rol === "ADMIN_IGLESIA") {
      return allTabs.filter(t => !t.roles || t.roles.includes(currentUser.rol));
    }
    if (currentUser.rol === "LIDER") {
      const allowedIds = currentUser.paginas_acceso
        ? currentUser.paginas_acceso.split(",").map((id: string) => parseInt(id)).filter((id: number) => !isNaN(id))
        : [];
      return allTabs.filter(t => allowedIds.includes(t.id));
    }
    return [];
  })();

  useEffect(() => {
    if (currentUser && visibleTabs.length > 0) {
      const isAllowed = visibleTabs.some(t => t.id === activeTab);
      if (!isAllowed) {
        setActiveTab(visibleTabs[0].id);
      }
    }
  }, [currentUser, visibleTabs, activeTab]);

  // Restore last visited tab from recentTabs
  useEffect(() => {
    if (recentTabs.length > 0 && visibleTabs.length > 0) {
      const lastRecent = recentTabs.find(id => visibleTabs.some(t => t.id === id));
      if (lastRecent && activeTab === 12) {
        setActiveTab(lastRecent);
      }
    }
  }, [visibleTabs]);

  useEffect(() => {
    if (activeTab === 15) {
      setActiveTab(10);
    }
  }, [activeTab]);
  
  // Estados de datos relacionales
  const [etapas, setEtapas] = useState<any[]>([]);
  const [modulos, setModulos] = useState<any[]>([]);
  const [procesos, setProcesos] = useState<any[]>([]);
  const [sociedades, setSociedades] = useState<any[]>([]);
  const [gruposConexion, setGruposConexion] = useState<any[]>([]);
  const [lideres, setLideres] = useState<any[]>([]);
  const [miembros, setMiembros] = useState<any[]>([]);

  // Estados para Modal Crear Miembro y Carga Masiva (Tab 7)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [newMemberNombre, setNewMemberNombre] = useState("");
  const [newMemberTelefono, setNewMemberTelefono] = useState("");
  const [newMemberCorreo, setNewMemberCorreo] = useState("");
  const [newMemberFechaNacimiento, setNewMemberFechaNacimiento] = useState("");
  const [newMemberSexo, setNewMemberSexo] = useState("M");
  const [newMemberEstadoCivil, setNewMemberEstadoCivil] = useState("Soltero/a");
  const [newMemberGrupoId, setNewMemberGrupoId] = useState("");
  const [newMemberEtapaId, setNewMemberEtapaId] = useState("");
  const [addMemberLoading, setAddMemberLoading] = useState(false);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberNombre.trim()) {
      alert("Ingresa el nombre del miembro.");
      return;
    }
    setAddMemberLoading(true);
    try {
      const selectedGroup = gruposConexion.find(g => g.id === newMemberGrupoId);
      const selectedSoc = selectedGroup ? sociedades.find(s => s.id === selectedGroup.sociedad_id) : null;

      const res = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: newMemberNombre,
          telefono: newMemberTelefono || null,
          correo: newMemberCorreo || null,
          fechaNacimiento: newMemberFechaNacimiento || null,
          sexo: newMemberSexo,
          estadoCivil: newMemberEstadoCivil,
          etapaId: newMemberEtapaId || (etapas[0]?.id || null),
          sociedadName: selectedSoc?.nombre_sociedad || null,
          grupoName: selectedGroup?.nombre_grupo || null,
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert("Error al registrar miembro: " + data.error);
      } else {
        alert("¡Miembro registrado con éxito!");
        setShowAddMemberModal(false);
        setNewMemberNombre("");
        setNewMemberTelefono("");
        setNewMemberCorreo("");
        setNewMemberFechaNacimiento("");
        setNewMemberSexo("M");
        setNewMemberGrupoId("");
        
        // Reload miembros list
        const resM = await fetch("/api/miembros");
        const dataM = await resM.json();
        if (!dataM.error && Array.isArray(dataM)) {
          setMiembros(dataM);
        }
      }
    } catch (err: any) {
      console.error(err);
      alert("Error al intentar registrar el miembro.");
    } finally {
      setAddMemberLoading(false);
    }
  };

  // Estados para Edición Completa de Miembros desde Admin
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [editMemberNombre, setEditMemberNombre] = useState("");
  const [editMemberFechaNacimiento, setEditMemberFechaNacimiento] = useState("");
  const [editMemberSexo, setEditMemberSexo] = useState("M");
  const [editMemberTelefono, setEditMemberTelefono] = useState("");
  const [editMemberCorreo, setEditMemberCorreo] = useState("");
  const [editMemberGrupoId, setEditMemberGrupoId] = useState("");
  const [editMemberEtapaId, setEditMemberEtapaId] = useState("");
  const [editMemberFamiliaCodigo, setEditMemberFamiliaCodigo] = useState("");
  const [editMemberLoading, setEditMemberLoading] = useState(false);

  const handleOpenEditMemberModal = (m: any) => {
    setEditingMember(m);
    setEditMemberNombre(m.nombre || "");
    setEditMemberFechaNacimiento(m.fecha_nacimiento ? m.fecha_nacimiento.split("T")[0] : "");
    setEditMemberSexo(m.sexo || "M");
    setEditMemberTelefono(m.telefono || "");
    setEditMemberCorreo(m.correo || "");
    setEditMemberGrupoId(m.grupo_conexion_id || "");
    setEditMemberEtapaId(m.etapa_id || "");
    setEditMemberFamiliaCodigo(m.familia_codigo || "");
  };

  const handleSaveEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setEditMemberLoading(true);
    try {
      const res = await fetch("/api/miembros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateMemberDetails",
          data: {
            memberId: editingMember.id,
            nombre: editMemberNombre,
            fecha_nacimiento: editMemberFechaNacimiento,
            sexo: editMemberSexo,
            telefono: editMemberTelefono,
            correo: editMemberCorreo,
            grupo_conexion_id: editMemberGrupoId,
            etapa_id: editMemberEtapaId,
            familia_codigo: editMemberFamiliaCodigo,
          }
        })
      });
      const data = await res.json();
      if (data.error) {
        alert("Error al actualizar miembro: " + data.error);
      } else {
        alert("¡Ficha del miembro actualizada con éxito!");
        setEditingMember(null);
        const resM = await fetch("/api/miembros");
        const dataM = await resM.json();
        if (!dataM.error && Array.isArray(dataM)) setMiembros(dataM);
      }
    } catch (err) {
      alert("Error de conexión al actualizar miembro.");
    } finally {
      setEditMemberLoading(false);
    }
  };

  // Estados para Etiquetas/Alertas de Atención Especial
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [selectedMemberForTags, setSelectedMemberForTags] = useState<any | null>(null);
  const [memberTagHistory, setMemberTagHistory] = useState<any[]>([]);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState("");
  const [customTagDuration, setCustomTagDuration] = useState("");
  const [tagNotes, setTagNotes] = useState("");
  const [tagsLoading, setTagsLoading] = useState(false);

  // Creación de nueva etiqueta personalizada
  const [showCreateTagForm, setShowCreateTagForm] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#ef4444");
  const [newTagIcon, setNewTagIcon] = useState("⚠️");
  const [newTagDuration, setNewTagDuration] = useState("7");

  // Estados para CRM Pastoral - Línea de Tiempo
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [timelineMemberId, setTimelineMemberId] = useState("");
  const [timelineMemberName, setTimelineMemberName] = useState("");
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [newHitoTitulo, setNewHitoTitulo] = useState("Se casó");
  const [newHitoTituloCustom, setNewHitoTituloCustom] = useState("");
  const [newHitoDetalle, setNewHitoDetalle] = useState("");
  const [newHitoFecha, setNewHitoFecha] = useState(new Date().toISOString().split("T")[0]);
  const [newHitoCategoria, setNewHitoCategoria] = useState("PERSONAL");

  // Estados de Configuración de Iglesia
  const [churchName, setChurchName] = useState("");
  const [churchSlug, setChurchSlug] = useState("");
  const [churchSlogan, setChurchSlogan] = useState("");
  const [churchLogoUrl, setChurchLogoUrl] = useState("");
  const [churchColor, setChurchColor] = useState("#0284c7");
  const [churchUsarGruposFamilia, setChurchUsarGruposFamilia] = useState(true);
  const [churchDescription, setChurchDescription] = useState("");
  const [churchQuienesSomos, setChurchQuienesSomos] = useState("");
  const [churchMision, setChurchMision] = useState("");
  const [churchVision, setChurchVision] = useState("");
  const [churchValores, setChurchValores] = useState("");
  const [churchHistoria, setChurchHistoria] = useState("");
  const [churchPhone, setChurchPhone] = useState("");
  const [churchEmail, setChurchEmail] = useState("");
  const [churchAddress, setChurchAddress] = useState("");
  const [churchGoogleMaps, setChurchGoogleMaps] = useState("");
  const [churchWaze, setChurchWaze] = useState("");
  const [churchSocials, setChurchSocials] = useState({ facebook: "", instagram: "", youtube: "" });
  const [churchEvents, setChurchEvents] = useState<any[]>([]);
  const [churchResources, setChurchResources] = useState<any[]>([]);
  const [churchPlan, setChurchPlan] = useState("BASICO");
  const [churchSliderImages, setChurchSliderImages] = useState<string[]>([]);
  const [temaAnual, setTemaAnual] = useState<any>({
    anio: new Date().getFullYear(),
    lema_anual: "",
    descripcion: "",
    logo_url: "",
    versiculo_clave: "",
    meses: Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      tema: "",
      descripcion: ""
    }))
  });
  const [limitePersonas, setLimitePersonas] = useState(50);
  const [limiteUsuarios, setLimiteUsuarios] = useState(5);
  const [precioMensual, setPrecioMensual] = useState(29.99);
  const [fechaVencimiento, setFechaVencimiento] = useState<string | null>(null);
  const [estadoPago, setEstadoPago] = useState("PAGADO");
  const [churchOpcionesRegistro, setChurchOpcionesRegistro] = useState<any>({ medio_relacion: [] });
  const [newMedioOption, setNewMedioOption] = useState("");

  // Estados para configurar detalles de sociedad
  const [editingSoc, setEditingSoc] = useState<any | null>(null);
  const [editingSocDesc, setEditingSocDesc] = useState("");
  const [editingSocHorarios, setEditingSocHorarios] = useState("");
  const [editingSocEdadMin, setEditingSocEdadMin] = useState("");
  const [editingSocEdadMax, setEditingSocEdadMax] = useState("");
  const [editingSocSexo, setEditingSocSexo] = useState("MIXTO");
  const [editingSocGaleria, setEditingSocGaleria] = useState<string[]>([]);


  // Formulario de nuevo evento
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventType, setNewEventType] = useState("REGULAR"); // "REGULAR" | "ESPECIAL"
  const [newEventDiaSemana, setNewEventDiaSemana] = useState("Domingo");
  const [newEventSociedadId, setNewEventSociedadId] = useState("");


  // Formulario de nuevo recurso
  const [newRecTitle, setNewRecTitle] = useState("");
  const [newRecCategory, setNewRecCategory] = useState("General");
  const [newRecDesc, setNewRecDesc] = useState("");
  const [newRecType, setNewRecType] = useState("LINK");
  const [newRecUrl, setNewRecUrl] = useState("");

  // ── ESTADOS: FINANZAS ──────────────────────────────────────────
  const [finanzasData, setFinanzasData] = useState<any>(null);
  const [finTipo, setFinTipo] = useState("INGRESO");
  const [finCategoria, setFinCategoria] = useState("DIEZMO");
  const [finDescripcion, setFinDescripcion] = useState("");
  const [finMonto, setFinMonto] = useState("");
  const [finFecha, setFinFecha] = useState(new Date().toISOString().split('T')[0]);
  const [finFilter, setFinFilter] = useState(""); // YYYY-MM filter
  const [finLoading, setFinLoading] = useState(false);

  // ── ESTADOS: PASTORAL ─────────────────────────────────────────
  const [peticiones, setPeticiones] = useState<any[]>([]);
  const [bitacora, setBitacora] = useState<any[]>([]);
  const [pastoralTab, setPastoralTab] = useState<'peticiones'|'bitacora'>('peticiones');
  const [bitPersonaId, setBitPersonaId] = useState("");
  const [bitTipo, setBitTipo] = useState("VISITA");
  const [bitNotas, setBitNotas] = useState("");
  const [bitFecha, setBitFecha] = useState(new Date().toISOString().split('T')[0]);
  const [pastoralLoading, setPastoralLoading] = useState(false);

  // ── ESTADOS: ANALYTICS ─────────────────────────────────────────
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

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

  const loadConfig = async () => {
    try {
      const res = await fetch("/api/admin");
      if (res.status === 401 || res.status === 403) {
        alert("Acceso denegado: Solo los administradores autorizados pueden acceder al Motor de Configuración.");
        window.location.href = "/hub";
        return;
      }
      const data = await res.json();
      if (data.error) {
        alert(`Error: ${data.error}`);
        window.location.href = "/hub";
        return;
      }
      setEtapas(data.etapas);
      setModulos(data.modulos);
      setProcesos(data.procesos);
      setSociedades(data.sociedades);
      setGruposConexion(data.grupos);
      setLideres(data.lideres);
      setUsuarios(data.usuarios || []);

      // Todas las demás llamadas en paralelo
      const [resLid, resM, resIgl, authRes] = await Promise.all([
        fetch("/api/liderazgo").catch(() => null),
        fetch("/api/miembros").catch(() => null),
        fetch("/api/iglesia").catch(() => null),
        fetch("/api/auth").catch(() => null),
      ]);

      if (resLid?.ok) {
        const dataLid = await resLid.json();
        if (!dataLid.error) {
          setLiderazgoGrupos(dataLid.grupos || []);
          if (dataLid.labels) {
            setLiderazgoLabels(dataLid.labels);
            setEditLabelCuerpoOficial(dataLid.labels.label_cuerpo_oficial || "Cuerpo Oficial");
            setEditLabelSociedades(dataLid.labels.label_sociedades || "Sociedades");
            setEditLabelGruposConexion(dataLid.labels.label_grupos_conexion || "Grupos de Conexión");
            setEditLabelDepartamentos(dataLid.labels.label_departamentos || "Departamentos");
            setEditLabelMinisterios(dataLid.labels.label_ministerios || "Ministerios");
            setEditLabelInstituciones(dataLid.labels.label_instituciones || "Instituciones");
          }
          if (dataLid.usuarios) {
            setUsuarios(dataLid.usuarios);
          }
        }
      }

      if (resM?.ok) {
        const dataM = await resM.json();
        if (!dataM.error && Array.isArray(dataM)) {
          setMiembros(dataM);
        }
      }

      if (resIgl?.ok) {
        const dataIgl = await resIgl.json();
        if (!dataIgl.error) {
          setChurchName(dataIgl.nombre_iglesia || "");
          setChurchSlug(dataIgl.subdominio_o_slug || "");
          setChurchSlogan(dataIgl.slogan || "");
          setChurchLogoUrl(dataIgl.logo_url || "");
          setChurchColor(dataIgl.color_principal || "#0284c7");
          setChurchUsarGruposFamilia(dataIgl.usar_grupos_familia !== undefined ? dataIgl.usar_grupos_familia : true);
          setChurchDescription(dataIgl.descripcion || "");
          setChurchQuienesSomos(dataIgl.quienes_somos || "");
          setChurchMision(dataIgl.mision || "");
          setChurchVision(dataIgl.vision || "");
          setChurchValores(dataIgl.valores || "");
          setChurchHistoria(dataIgl.historia || "");
          setChurchPhone(dataIgl.contacto_telefono || "");
          setChurchEmail(dataIgl.contacto_email || "");
          setChurchAddress(dataIgl.contacto_direccion || "");
          setChurchGoogleMaps(dataIgl.link_google_maps || "");
          setChurchWaze(dataIgl.link_waze || "");
          setChurchSocials(dataIgl.redes_sociales || { facebook: "", instagram: "", youtube: "" });
          setChurchEvents(dataIgl.eventos || []);
          setChurchResources(dataIgl.recursos || []);
          setChurchPlan(dataIgl.plan || "BASICO");
          setLimitePersonas(dataIgl.limite_personas ?? 50);
          setLimiteUsuarios(dataIgl.limite_usuarios ?? 5);
          setPrecioMensual(dataIgl.precio_mensual ?? 29.99);
          setFechaVencimiento(dataIgl.fecha_vencimiento ?? null);
          setEstadoPago(dataIgl.estado_pago || "PAGADO");
          setChurchSliderImages(dataIgl.imagenes_slider || []);
          if (dataIgl.tema_anual) {
            setTemaAnual(dataIgl.tema_anual);
          }
          if (dataIgl.opciones_registro) {
            setChurchOpcionesRegistro(dataIgl.opciones_registro);
          }
        }
      }

      if (authRes?.ok) {
        const authData = await authRes.json();
        if (!authData.error) {
          setCurrentUser(authData);
        }
      }
    } catch (e) {
      console.error("Error loading config from API", e);
    }
  };

  const loadSupportTickets = async () => {
    try {
      const res = await fetch("/api/soporte");
      const data = await res.json();
      if (!data.error) {
        setSupportTickets(data);
      }
    } catch (e) {
      console.error("Error al cargar tickets de soporte:", e);
    }
  };

  // Cargar etiquetas configuradas y el historial de un miembro
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
        // Recargar el historial
        const resH = await fetch(`/api/miembros/etiquetas?memberId=${selectedMemberForTags.id}`);
        const dataH = await resH.json();
        if (!dataH.error) {
          setMemberTagHistory(dataH.history || []);
        }
        // Recargar listado principal de miembros
        const resM = await fetch("/api/miembros");
        const dataM = await resM.json();
        if (!dataM.error && Array.isArray(dataM)) {
          setMiembros(dataM);
        }
      }
    } catch (e) {
      console.error(e);
      alert("Error al conectar con el servidor.");
    }
  };

  const handleCreateCustomTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await fetch("/api/miembros/etiquetas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createTag",
          data: {
            nombre: newTagName,
            color: newTagColor,
            icono: newTagIcon,
            duracion_dias_defecto: parseInt(newTagDuration) || 7,
          },
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert("Error al crear etiqueta: " + data.error);
      } else {
        setNewTagName("");
        setShowCreateTagForm(false);
        // Recargar etiquetas disponibles
        if (selectedMemberForTags) {
          const resTags = await fetch(`/api/miembros/etiquetas?memberId=${selectedMemberForTags.id}`);
          const dataTags = await resTags.json();
          if (!dataTags.error) {
            setAvailableTags(dataTags.tags || []);
            setSelectedTagId(data.id || dataTags.tags[0]?.id);
            setCustomTagDuration(String(data.duracion_dias_defecto || dataTags.tags[0]?.duracion_dias_defecto));
          }
        }
      }
    } catch (e) {
      console.error(e);
      alert("Error al conectar con el servidor.");
    }
  };

  const handleRemoveMemberTag = async (assignmentId: string) => {
    if (!confirm("¿Deseas dar de baja esta etiqueta de alerta activa?")) return;
    try {
      const res = await fetch("/api/miembros/etiquetas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "removeTag",
          data: { assignmentId },
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert("Error al quitar etiqueta: " + data.error);
      } else {
        // Recargar el historial y los miembros
        if (selectedMemberForTags) {
          const resH = await fetch(`/api/miembros/etiquetas?memberId=${selectedMemberForTags.id}`);
          const dataH = await resH.json();
          if (!dataH.error) {
            setMemberTagHistory(dataH.history || []);
          }
        }
        const resM = await fetch("/api/miembros");
        const dataM = await resM.json();
        if (!dataM.error && Array.isArray(dataM)) {
          setMiembros(dataM);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openTimelineForMember = async (memberId: string) => {
    setTimelineMemberId(memberId);
    setTimelineLoading(true);
    setShowTimelineModal(true);
    setNewHitoTitulo("Se casó");
    setNewHitoTituloCustom("");
    setNewHitoDetalle("");
    setNewHitoFecha(new Date().toISOString().split("T")[0]);
    setNewHitoCategoria("PERSONAL");
    
    try {
      const res = await fetch(`/api/historial-pastoral?personaId=${memberId}`);
      const data = await res.json();
      if (data.error) {
        alert("Error al cargar historial: " + data.error);
      } else {
        setTimelineMemberName(data.personaNombre);
        setTimelineEvents(data.events || []);
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión al cargar historial.");
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleCreateHito = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timelineMemberId) return;

    const finalTitulo = newHitoTitulo === "OTRO" ? newHitoTituloCustom : newHitoTitulo;
    if (!finalTitulo.trim()) {
      alert("Por favor, especifica un título para el hito.");
      return;
    }

    try {
      const res = await fetch("/api/historial-pastoral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "crear",
          data: {
            personaId: timelineMemberId,
            titulo: finalTitulo,
            detalle: newHitoDetalle,
            fecha: newHitoFecha,
            categoria: newHitoCategoria,
          },
        }),
      });

      const data = await res.json();
      if (data.error) {
        alert("Error al guardar hito: " + data.error);
      } else {
        // Recargar línea de tiempo
        const resReload = await fetch(`/api/historial-pastoral?personaId=${timelineMemberId}`);
        const dataReload = await resReload.json();
        if (!dataReload.error) {
          setTimelineEvents(dataReload.events || []);
        }
        // Limpiar campos
        setNewHitoTitulo("Se casó");
        setNewHitoTituloCustom("");
        setNewHitoDetalle("");
        setNewHitoFecha(new Date().toISOString().split("T")[0]);
        setNewHitoCategoria("PERSONAL");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión al guardar hito.");
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (activeTab === 8) {
      loadSupportTickets();
    }
  }, [activeTab]);

  const loadComunicados = async () => {
    try {
      const res = await fetch("/api/comunicados");
      const data = await res.json();
      if (!data.error) {
        setComunicadosList(data);
      }
    } catch (e) {
      console.error("Error al cargar comunicados:", e);
    }
  };

  useEffect(() => {
    if (activeTab === 9) {
      loadComunicados();
    }
  }, [activeTab]);

  // Load Finanzas on tab 10
  useEffect(() => {
    if (activeTab === 10) {
      loadFinanzas();
    }
  }, [activeTab]);

  // Load Pastoral on tab 11
  useEffect(() => {
    if (activeTab === 11) {
      loadPastoral();
    }
  }, [activeTab]);

  // Load Analytics on tab 12
  useEffect(() => {
    if (activeTab === 12) {
      loadAnalytics();
    }
  }, [activeTab]);

  const loadFinanzas = async () => {
    setFinLoading(true);
    try {
      const res = await fetch('/api/finanzas');
      const data = await res.json();
      if (!data.error) setFinanzasData(data);
    } catch(e) { console.error(e); }
    finally { setFinLoading(false); }
  };

  const loadPastoral = async () => {
    setPastoralLoading(true);
    try {
      const [resPet, resBit] = await Promise.all([
        fetch('/api/oracion'),
        fetch('/api/bitacora')
      ]);
      const dataPet = await resPet.json();
      const dataBit = await resBit.json();
      if (!dataPet.error) setPeticiones(dataPet);
      if (!dataBit.error) setBitacora(dataBit);
    } catch(e) { console.error(e); }
    finally { setPastoralLoading(false); }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      if (!data.error) setAnalyticsData(data);
    } catch(e) { console.error(e); }
    finally { setAnalyticsLoading(false); }
  };

  const handleComunicadoImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("El archivo original es muy grande. Selecciona una imagen menor de 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
          setNewComunicadoImagen(compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleVisionLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert("El archivo original es muy grande. Selecciona una imagen menor de 3MB.");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 250;
          const MAX_HEIGHT = 250;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL(file.type, 0.85);
          setTemaAnual({ ...temaAnual, logo_url: dataUrl });
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error processando logo de visión", err);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        const MAX_WIDTH = 120;
        const MAX_HEIGHT = 120;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/png");
          setChurchLogoUrl(compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSliderImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (churchSliderImages.length >= 5) {
      alert("Solo puedes subir un máximo de 5 imágenes para el slider.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("El archivo original es muy grande. Selecciona una imagen menor de 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          setChurchSliderImages([...churchSliderImages, compressedBase64]);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };


  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    const newEvent = {
      id: "ev-" + Date.now(),
      titulo: newEventTitle.trim(),
      tipo: newEventType,
      fecha: newEventType === "ESPECIAL" ? newEventDate : "",
      diaSemana: newEventType === "REGULAR" ? newEventDiaSemana : "",
      hora: newEventTime,
      descripcion: newEventDesc.trim(),
      sociedadId: newEventSociedadId || null,
    };
    const updated = [...churchEvents, newEvent];
    setChurchEvents(updated);
    await postAction("updateChurchEvents", { eventos: updated });
    setNewEventTitle("");
    setNewEventDate("");
    setNewEventTime("");
    setNewEventDesc("");
    setNewEventSociedadId("");
  };

  const handleRemoveEvent = async (id: string) => {
    const updated = churchEvents.filter(ev => ev.id !== id);
    setChurchEvents(updated);
    await postAction("updateChurchEvents", { eventos: updated });
  };


  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecTitle.trim() || (!newRecUrl.trim() && newRecType !== "BLOG")) return;
    const newRec = {
      id: "rec-" + Date.now(),
      titulo: newRecTitle.trim(),
      descripcion: newRecDesc.trim(),
      categoria: newRecCategory || "General",
      tipo: newRecType,
      url: newRecUrl.trim() || (newRecType === "BLOG" ? "#blog" : ""),
    };
    setChurchResources([...churchResources, newRec]);
    setNewRecTitle("");
    setNewRecDesc("");
    setNewRecCategory("General");
    setNewRecType("LINK");
    setNewRecUrl("");
  };

  const handleRemoveResource = (id: string) => {
    setChurchResources(churchResources.filter(rec => rec.id !== id));
  };

  const handleSaveChurchConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const res = await fetch("/api/iglesia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_iglesia: churchName,
          subdominio_o_slug: churchSlug,
          slogan: churchSlogan,
          logo_url: churchLogoUrl,
          color_principal: churchColor,
          usar_grupos_familia: churchUsarGruposFamilia,
          descripcion: churchDescription,
          quienes_somos: churchQuienesSomos,
          mision: churchMision,
          vision: churchVision,
          valores: churchValores,
          historia: churchHistoria,
          contacto_telefono: churchPhone,
          contacto_email: churchEmail,
          contacto_direccion: churchAddress,
          link_google_maps: churchGoogleMaps,
          link_waze: churchWaze,
          redes_sociales: churchSocials,
          recursos: churchResources,
          eventos: churchEvents,
          imagenes_slider: churchSliderImages,
          tema_anual: temaAnual,
          opciones_registro: churchOpcionesRegistro,
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert("Error al guardar la configuración: " + data.error);
      } else {
        alert("¡Configuración guardada exitosamente!");
        loadConfig();
      }
    } catch (err) {
      console.error("Error saving church config:", err);
      alert("Error al guardar la configuración.");
    }
  };

  const postAction = async (action: string, data: any) => {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, data }),
      });
      const result = await res.json();
      if (result.error) {
        alert("Error: " + result.error);
      } else {
        await loadConfig();
      }
    } catch (e) {
      console.error("Error posting admin action", e);
    }
  };

  // Estados Formulario Etapa
  const [newStageName, setNewStageName] = useState("");
  const [newStageOrder, setNewStageOrder] = useState("");
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editStageName, setEditStageName] = useState("");
  const [editStageOrder, setEditStageOrder] = useState("");

  // Estados Formulario Módulo
  const [newModuloName, setNewModuloName] = useState("");
  const [editingModuloId, setEditingModuloId] = useState<string | null>(null);
  const [editModuloName, setEditModuloName] = useState("");
  const [expandedModuloIds, setExpandedModuloIds] = useState<Record<string, boolean>>({});

  // Estados Formulario Proceso
  const [addingProcessModuloId, setAddingProcessModuloId] = useState<string | null>(null);
  const [procName, setProcName] = useState("");
  const [procSla, setProcSla] = useState("");
  const [procIsMandatory, setProcIsMandatory] = useState(true);
  const [procStageId, setProcStageId] = useState("");
  const [procSubtasksText, setProcSubtasksText] = useState("");
  
  const [editingProcessId, setEditingProcessId] = useState<string | null>(null);
  const [editProcessName, setEditProcessName] = useState("");
  const [editProcessSla, setEditProcessSla] = useState("");
  const [editProcessIsMandatory, setEditProcessIsMandatory] = useState(true);
  const [editProcessSubtasks, setEditProcessSubtasks] = useState<{ id?: string; nombre_subtarea: string; dias_limite: number | null }[]>([]);

  // Estados Vinculación Etapa
  const [linkingStageId, setLinkingStageId] = useState<string | null>(null);
  const [selectedProcessToLink, setSelectedProcessToLink] = useState("");

  // Estados Formulario Sociedad (Tab 2)
  const [newSocName, setNewSocName] = useState("");
  const [newSocEdadMin, setNewSocEdadMin] = useState("");
  const [newSocEdadMax, setNewSocEdadMax] = useState("");
  const [newSocSexo, setNewSocSexo] = useState("MIXTO");
  const [newSocLogoUrl, setNewSocLogoUrl] = useState("");

  // Estados Formulario Grupo Conexión (Tab 2)
  const [addingGroupSocId, setAddingGroupSocId] = useState<string | null>(null);
  const [gcName, setGcName] = useState("");
  const [gcEdadMin, setGcEdadMin] = useState("");
  const [gcEdadMax, setGcEdadMax] = useState("");
  const [gcSexo, setGcSexo] = useState("MIXTO"); // "MIXTO" | "M" | "F"
  const [gcEstadoCivil, setGcEstadoCivil] = useState(""); // "" | "SOLTERO" | "CASADO"

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGcName, setEditGcName] = useState("");
  const [editGcEdadMin, setEditGcEdadMin] = useState("");
  const [editGcEdadMax, setEditGcEdadMax] = useState("");
  const [editGcEstadoCivil, setEditGcEstadoCivil] = useState(""); // "" | "SOLTERO" | "CASADO"
  const [editGcSexo, setEditGcSexo] = useState("MIXTO"); // "MIXTO" | "M" | "F"

  // Estados Formulario Asignación Liderazgo (Tab 5)
  const [selectedMemberName, setSelectedMemberName] = useState("");
  const [memberSearchTerm, setMemberSearchTerm] = useState("");

  // Filtros del listado de miembros (Tab 7)
  const [filterSexo, setFilterSexo] = useState("");
  const [filterEdadMin, setFilterEdadMin] = useState("");
  const [filterEdadMax, setFilterEdadMax] = useState("");
  const [filterGrupoConexion, setFilterGrupoConexion] = useState("");
  const [filterProfesion, setFilterProfesion] = useState("");
  const [filterNivelAcademico, setFilterNivelAcademico] = useState("");
  const [filterEstadoCivil, setFilterEstadoCivil] = useState("");
  const [filterEtapa, setFilterEtapa] = useState("");
  const [filtersActive, setFiltersActive] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [selectedModuloId, setSelectedModuloId] = useState("all");
  const [selectedModuloIds, setSelectedModuloIds] = useState<string[]>(["all"]);
  const [editingLiderId, setEditingLiderId] = useState<string | null>(null);
  const [selectedAlcance, setSelectedAlcance] = useState("GRUPO_CONEXION"); // GLOBAL, SOCIEDAD, GRUPO_CONEXION
  const [selectedSocId, setSelectedSocId] = useState("");
  const [selectedGcId, setSelectedGcId] = useState("");
  const [promoteGrupoTrabajoId, setPromoteGrupoTrabajoId] = useState("");
  const [promoteTabPermissions, setPromoteTabPermissions] = useState<number[]>([]);
  const [manageTabPermissions, setManageTabPermissions] = useState<number[]>([]);

  // Nuevos Estados para la Consola de Líderes y Permisos
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [showAddDirectiveModal, setShowAddDirectiveModal] = useState(false);
  const [targetUsuarioId, setTargetUsuarioId] = useState("");
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoteMemberName, setPromoteMemberName] = useState("");
  const [promoteRol, setPromoteRol] = useState("LIDER");
  const [showManageUserModal, setShowManageUserModal] = useState(false);
  const [manageUsuarioId, setManageUsuarioId] = useState("");
  const [manageRol, setManageRol] = useState("LIDER");
  const [manageEstado, setManageEstado] = useState("ACTIVO");
  const [liderSearchTerm, setLiderSearchTerm] = useState("");

  // Estados Liderazgo y Grupos de Trabajo (Cuerpo Oficial, Departamentos, etc.)
  const [liderazgoGrupos, setLiderazgoGrupos] = useState<any[]>([]);
  const [liderazgoLabels, setLiderazgoLabels] = useState<any>({
    label_cuerpo_oficial: "Cuerpo Oficial",
    label_sociedades: "Sociedades",
    label_grupos_conexion: "Grupos de Conexión",
    label_departamentos: "Departamentos",
    label_ministerios: "Ministerios",
    label_instituciones: "Instituciones"
  });
  const [activeLiderazgoSubTab, setActiveLiderazgoSubTab] = useState("list"); // "list" | "setup" | "labels"
  
  // Modales y formulaciones de Grupos de Trabajo
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGrupoTrabajoNombre, setNewGrupoTrabajoNombre] = useState("");
  const [newGrupoTrabajoTipo, setNewGrupoTrabajoTipo] = useState("DEPARTAMENTO"); // "CUERPO_OFICIAL" | "DEPARTAMENTO" | "MINISTERIO" | "INSTITUCION"
  const [newGrupoTrabajoDesc, setNewGrupoTrabajoDesc] = useState("");

  const [selectedGrupoTrabajoId, setSelectedGrupoTrabajoId] = useState("");
  const [showAddMiembroGroupModal, setShowAddMiembroGroupModal] = useState(false);
  const [newMiembroPuesto, setNewMiembroPuesto] = useState("LIDER");
  const [newMiembroUsuarioId, setNewMiembroUsuarioId] = useState("");

  // Estados para tickets de soporte técnico
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [newTicketAsunto, setNewTicketAsunto] = useState("");
  const [newTicketDesc, setNewTicketDesc] = useState("");
  const [newTicketPrioridad, setNewTicketPrioridad] = useState("MEDIA");
  const [newTicketContactNom, setNewTicketContactNom] = useState("");
  const [newTicketContactEml, setNewTicketContactEml] = useState("");
  const [newTicketContactTel, setNewTicketContactTel] = useState("");
  const [supportLoading, setSupportLoading] = useState(false);

  // Estados para Comunicados Oficiales
  const [comunicadosList, setComunicadosList] = useState<any[]>([]);
  const [newComunicadoTitulo, setNewComunicadoTitulo] = useState("");
  const [newComunicadoContenido, setNewComunicadoContenido] = useState("");
  const [newComunicadoImagen, setNewComunicadoImagen] = useState(""); // base64
  const [newComunicadoDestinatario, setNewComunicadoDestinatario] = useState("TODOS"); // TODOS, LIDERES, SOCIEDAD, GRUPO_CONEXION
  const [newComunicadoDestId, setNewComunicadoDestId] = useState("");
  const [newComunicadoObligatorio, setNewComunicadoObligatorio] = useState(false);
  const [newComunicadoFechaInicio, setNewComunicadoFechaInicio] = useState("");
  const [newComunicadoFechaFin, setNewComunicadoFechaFin] = useState("");
  const [comunicadosLoading, setComunicadosLoading] = useState(false);

  // Edición de Labels
  const [editLabelCuerpoOficial, setEditLabelCuerpoOficial] = useState("");
  const [editLabelSociedades, setEditLabelSociedades] = useState("");
  const [editLabelGruposConexion, setEditLabelGruposConexion] = useState("");
  const [editLabelDepartamentos, setEditLabelDepartamentos] = useState("");
  const [editLabelMinisterios, setEditLabelMinisterios] = useState("");
  const [editLabelInstituciones, setEditLabelInstituciones] = useState("");

  const filteredMiembros = miembros.filter(m =>
    m.nombre.toLowerCase().includes(memberSearchTerm.toLowerCase())
  );

  // Helper para calcular edad
  const calcEdad = (fn: string | null | undefined): number | null => {
    if (!fn) return null;
    const today = new Date();
    const birth = new Date(fn);
    let age = today.getFullYear() - birth.getFullYear();
    const m2 = today.getMonth() - birth.getMonth();
    if (m2 < 0 || (m2 === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  // Valores únicos para los selects de filtro
  const uniqueProfesiones = [...new Set(miembros.map(m => m.profesion_oficio).filter(Boolean))].sort();
  const nivelesAcademicos = ["Básico", "Bachiller", "Técnico", "Universitario", "Postgrado / Maestría"];
  const uniqueNiveles = nivelesAcademicos.filter(n => miembros.some(m => m.nivel_academico === n));
  const uniqueEstadosCiviles = [...new Set(miembros.map(m => m.estado_civil).filter(Boolean))].sort();
  const uniqueGruposConexion = [...new Set(miembros.map(m => m.grupo_conexion).filter(Boolean))].sort();
  const uniqueSociedades = [...new Set(miembros.map(m => m.sociedad).filter(s => s && s !== 'Sociedad General'))].sort();

  // Filtros avanzados del listado (Tab 7)
  const hasActiveFilters = filtersActive || filterSexo || filterEdadMin || filterEdadMax || filterGrupoConexion || filterProfesion || filterNivelAcademico || filterEstadoCivil || filterEtapa || memberSearchTerm;

  const displayMiembros = (() => {
    if (!hasActiveFilters) {
      return [...miembros].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 20);
    }
    return miembros.filter(m => {
      if (filterSexo && m.sexo !== filterSexo) return false;
      if (filterEdadMin || filterEdadMax) {
        const edad = calcEdad(m.fecha_nacimiento);
        if (edad === null) return false;
        if (filterEdadMin && edad < parseInt(filterEdadMin)) return false;
        if (filterEdadMax && edad > parseInt(filterEdadMax)) return false;
      }
      if (filterGrupoConexion && m.grupo_conexion !== filterGrupoConexion && m.sociedad !== filterGrupoConexion) return false;
      if (filterProfesion && (m.profesion_oficio || '') !== filterProfesion) return false;
      if (filterNivelAcademico && (m.nivel_academico || '') !== filterNivelAcademico) return false;
      if (filterEstadoCivil && (m.estado_civil || '') !== filterEstadoCivil) return false;
      if (filterEtapa && m.etapa_id !== filterEtapa) return false;
      if (memberSearchTerm) {
        const s = memberSearchTerm.toLowerCase();
        const matchName = m.nombre.toLowerCase().includes(s);
        const matchEmail = (m.correo || '').toLowerCase().includes(s);
        const matchPhone = (m.telefono || '').includes(s);
        if (!matchName && !matchEmail && !matchPhone) return false;
      }
      return true;
    });
  })();

  const generatePDF = () => {
    const printSection = document.getElementById('miembros-print-section');
    if (!printSection) return;
    const printHeader = document.getElementById('print-header');
    if (printHeader) printHeader.style.display = 'block';
    const win = window.open('', '_blank', 'width=1100,height=700');
    if (!win) { alert('Permitir ventanas emergentes para generar el PDF.'); return; }
    win.document.write(`
      <!DOCTYPE html>
      <html><head>
      <title>Listado de Miembros - IgleConexión</title>
      <style>
        @page { margin: 1.2cm; size: landscape; }
        body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1e293b; margin: 0; padding: 0; }
        .header { text-align: center; margin-bottom: 1rem; border-bottom: 2px solid #0f172a; padding-bottom: 0.75rem; }
        .header h1 { font-size: 1.3rem; font-weight: 800; margin: 0; }
        .header p { font-size: 0.8rem; color: #64748b; margin: 0.2rem 0 0 0; }
        table { width: 100%; border-collapse: collapse; font-size: 0.72rem; }
        th { background: #f8fafc; border-bottom: 2px solid #0f172a; padding: 0.4rem 0.35rem; text-align: left; font-weight: 700; font-size: 0.65rem; text-transform: uppercase; color: #475569; }
        td { padding: 0.35rem 0.35rem; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) { background: #f8fafc; }
        .footer { text-align: center; margin-top: 1rem; font-size: 0.7rem; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 0.5rem; }
        @media print { @page { size: landscape; margin: 1cm; } }
      </style>
      </head><body>
      <div class="header">
        <h1>Listado de Miembros</h1>
        <p>Fecha: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })} | Total: ${displayMiembros.length} miembros${hasActiveFilters ? ' (filtrado)' : ''}</p>
      </div>
      <table>
        <thead><tr>
          <th>#</th><th>Nombre</th><th>Cédula</th><th>Sexo</th><th>Edad</th><th>Teléfono</th><th>Correo</th><th>Grupo de Conexión</th><th>Sociedad</th><th>Etapa</th><th>Profesión</th><th>N. Académico</th><th>Estado Civil</th>
        </tr></thead>
        <tbody>
          ${displayMiembros.map((m, i) => `
            <tr>
              <td>${i + 1}</td>
              <td><strong>${m.nombre}</strong></td>
              <td>${m.cedula || '—'}</td>
              <td>${m.sexo === 'M' ? 'M' : m.sexo === 'F' ? 'F' : '—'}</td>
              <td>${calcEdad(m.fecha_nacimiento) || '—'}</td>
              <td>${m.telefono || '—'}</td>
              <td>${m.correo || '—'}</td>
              <td>${m.grupo_conexion || '—'}</td>
              <td>${m.sociedad || '—'}</td>
              <td>${m.etapa_nombre || '—'}</td>
              <td>${m.profesion_oficio || '—'}</td>
              <td>${m.nivel_academico || '—'}</td>
              <td>${m.estado_civil || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="footer">Generado por IgleConexión — ${new Date().toLocaleDateString('es-ES')}</div>
      <script>window.onload = function() { window.print(); }</script>
      </body></html>
    `);
    win.document.close();
  };

  // Auto-cargar selecciones de liderazgo al cambiar el alcance
  useEffect(() => {
    if (sociedades.length > 0 && !selectedSocId) {
      setSelectedSocId(sociedades[0].id);
    }
    if (gruposConexion.length > 0 && !selectedGcId) {
      setSelectedGcId(gruposConexion[0].id);
    }
    if (miembros.length > 0 && !selectedMemberName) {
      setSelectedMemberName(miembros[0].nombre);
    }
  }, [sociedades, gruposConexion, miembros, selectedAlcance, selectedMemberName, selectedSocId, selectedGcId]);

  // --- HANDLERS ETAPAS ---
  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim()) return;
    
    const order = newStageOrder ? parseInt(newStageOrder) : etapas.length + 1;
    await postAction("addEtapa", {
      nombre_etapa: `Etapa ${order}: ${newStageName.trim()}`,
      orden_secuencial: order,
    });
    setNewStageName("");
    setNewStageOrder("");
  };

  const handleDeleteStage = async (stageId: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta etapa? Los procesos vinculados a ella volverán a estar 'Sin asignar'.")) {
      await postAction("deleteEtapa", { id: stageId });
    }
  };

  const handleStartEditStage = (stage: any) => {
    setEditingStageId(stage.id);
    const cleanName = stage.nombre_etapa.replace(/^Etapa \d+:\s*/i, "");
    setEditStageName(cleanName);
    setEditStageOrder(String(stage.orden_secuencial));
  };

  const handleSaveEditStage = async (stageId: string) => {
    if (!editStageName.trim()) return;
    await postAction("updateEtapa", {
      id: stageId,
      nombre_etapa: editStageName.trim(),
      orden_secuencial: editStageOrder,
    });
    setEditingStageId(null);
  };

  // --- HANDLERS MÓDULOS ---
  const handleAddModulo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuloName.trim()) return;
    await postAction("addModulo", { nombre_modulo: newModuloName.trim() });
    setNewModuloName("");
  };

  const handleDeleteModulo = async (moduloId: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este módulo? Se borrarán todos sus procesos y asignaciones de líderes.")) {
      await postAction("deleteModulo", { id: moduloId });
    }
  };

  const handleStartEditModulo = (mod: any) => {
    setEditingModuloId(mod.id);
    setEditModuloName(mod.nombre_modulo);
  };

  const handleSaveEditModulo = async (moduloId: string) => {
    if (!editModuloName.trim()) return;
    await postAction("updateModulo", {
      id: moduloId,
      nombre_modulo: editModuloName.trim(),
    });
    setEditingModuloId(null);
  };

  // --- HANDLERS PROCESOS ---
  const handleAddProcess = async (moduloId: string) => {
    if (!procName.trim()) return;

    const subList = procSubtasksText
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((line) => {
        const parts = line.split("|");
        const name = parts[0].trim();
        const days = parts[1] ? parseInt(parts[1].trim()) : null;
        return {
          nombre_subtarea: name,
          dias_limite: days && !isNaN(days) ? days : null
        };
      });

    await postAction("addProcess", {
      nombre_tarea: procName.trim(),
      modulo_id: moduloId,
      etapa_id: procStageId === "" ? null : procStageId,
      dias_limite: procSla ? parseInt(procSla) : null,
      es_obligatoria: procIsMandatory,
      subtareas: subList
    });

    setAddingProcessModuloId(null);
    setProcName("");
    setProcSla("");
    setProcIsMandatory(true);
    setProcStageId("");
    setProcSubtasksText("");
  };

  const handleDeleteProcess = async (procId: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este proceso?")) {
      await postAction("deleteProcess", { id: procId });
    }
  };

  const handleStartEditProcess = (proc: any) => {
    setEditingProcessId(proc.id);
    setEditProcessName(proc.nombre_tarea);
    setEditProcessSla(proc.dias_limite !== null && proc.dias_limite !== undefined ? String(proc.dias_limite) : "");
    setEditProcessIsMandatory(!!proc.es_obligatoria);
    setEditProcessSubtasks(
      (proc.subtareas || []).map((sub: any) => ({
        id: sub.id,
        nombre_subtarea: sub.nombre_subtarea,
        dias_limite: sub.dias_limite
      }))
    );
  };

  const handleSaveEditProcess = async (procId: string) => {
    if (!editProcessName.trim()) return;
    await postAction("updateProcess", {
      id: procId,
      nombre_tarea: editProcessName.trim(),
      dias_limite: editProcessSla ? parseInt(editProcessSla) : null,
      es_obligatoria: editProcessIsMandatory,
      subtareas: editProcessSubtasks.filter(sub => sub.nombre_subtarea.trim() !== ""),
    });
    setEditingProcessId(null);
  };

  const handleMoveProcess = async (procId: string, direction: 'up' | 'down') => {
    const procIndex = procesos.findIndex(p => p.id === procId);
    if (procIndex === -1) return;

    const moduloId = procesos[procIndex].modulo_id;
    const moduleProcs = procesos.filter(p => p.modulo_id === moduloId);
    const relativeIndex = moduleProcs.findIndex(p => p.id === procId);
    if (relativeIndex === -1) return;

    let targetIndex = -1;
    if (direction === 'up' && relativeIndex > 0) {
      targetIndex = relativeIndex - 1;
    } else if (direction === 'down' && relativeIndex < moduleProcs.length - 1) {
      targetIndex = relativeIndex + 1;
    }

    if (targetIndex !== -1) {
      const reorderedList = procesos.map(p => {
        if (p.id === moduleProcs[relativeIndex].id) {
          return moduleProcs[targetIndex];
        }
        if (p.id === moduleProcs[targetIndex].id) {
          return moduleProcs[relativeIndex];
        }
        return p;
      });

      const payload = reorderedList.map((p, idx) => ({
        id: p.id,
        orden: idx + 1
      }));

      await postAction("reorderProcesses", { processes: payload });
    }
  };

  const handleMoveModulo = async (moduloId: string, direction: 'up' | 'down') => {
    const relativeIndex = modulos.findIndex(m => m.id === moduloId);
    if (relativeIndex === -1) return;

    let targetIndex = -1;
    if (direction === 'up' && relativeIndex > 0) {
      targetIndex = relativeIndex - 1;
    } else if (direction === 'down' && relativeIndex < modulos.length - 1) {
      targetIndex = relativeIndex + 1;
    }

    if (targetIndex !== -1) {
      const reorderedList = [...modulos];
      const temp = reorderedList[relativeIndex];
      reorderedList[relativeIndex] = reorderedList[targetIndex];
      reorderedList[targetIndex] = temp;

      const payload = reorderedList.map((m, idx) => ({
        id: m.id,
        orden: idx + 1
      }));

      await postAction("reorderModulos", { modulos: payload });
    }
  };

  const handleMoveProcessInStage = async (procId: string, direction: 'up' | 'down') => {
    const procIndex = procesos.findIndex(p => p.id === procId);
    if (procIndex === -1) return;

    const stageId = procesos[procIndex].etapa_id;
    if (!stageId) return;

    const stageProcs = procesos.filter(p => p.etapa_id === stageId);
    const relativeIndex = stageProcs.findIndex(p => p.id === procId);
    if (relativeIndex === -1) return;

    let targetIndex = -1;
    if (direction === 'up' && relativeIndex > 0) {
      targetIndex = relativeIndex - 1;
    } else if (direction === 'down' && relativeIndex < stageProcs.length - 1) {
      targetIndex = relativeIndex + 1;
    }

    if (targetIndex !== -1) {
      const reorderedList = procesos.map(p => {
        if (p.id === stageProcs[relativeIndex].id) {
          return stageProcs[targetIndex];
        }
        if (p.id === stageProcs[targetIndex].id) {
          return stageProcs[relativeIndex];
        }
        return p;
      });

      const payload = reorderedList.map((p, idx) => ({
        id: p.id,
        orden: idx + 1
      }));

      await postAction("reorderProcesses", { processes: payload });
    }
  };

  const handleLinkProcess = async (stageId: string, procId: string) => {
    await postAction("linkProcess", { stageId, processId: procId });
    setLinkingStageId(null);
    setSelectedProcessToLink("");
  };

  const handleUnlinkProcess = async (procId: string) => {
    await postAction("unlinkProcess", { processId: procId });
  };

  const handleMoveSociedad = async (socId: string, direction: 'up' | 'down') => {
    const relativeIndex = sociedades.findIndex(s => s.id === socId);
    if (relativeIndex === -1) return;

    let targetIndex = -1;
    if (direction === 'up' && relativeIndex > 0) {
      targetIndex = relativeIndex - 1;
    } else if (direction === 'down' && relativeIndex < sociedades.length - 1) {
      targetIndex = relativeIndex + 1;
    }

    if (targetIndex !== -1) {
      const newOrderList = [...sociedades];
      const temp = newOrderList[relativeIndex];
      newOrderList[relativeIndex] = newOrderList[targetIndex];
      newOrderList[targetIndex] = temp;

      const payload = newOrderList.map((s, idx) => ({
        id: s.id,
        orden: idx + 1
      }));

      await postAction("reorderSociedades", { sociedades: payload });
    }
  };

  // --- HANDLERS SOCIEDADES ---
  const handleSocLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          const scale = Math.min(120 / img.width, 120 / img.height);
          const x = (120 - img.width * scale) / 2;
          const y = (120 - img.height * scale) / 2;
          const width = img.width * scale;
          const height = img.height * scale;
          ctx.drawImage(img, x, y, width, height);
          const compressedBase64 = canvas.toDataURL("image/png");
          setNewSocLogoUrl(compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateSocLogo = (socId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert("El archivo original es muy grande. Selecciona una imagen menor de 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = 120;
        canvas.height = 120;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, 120, 120);
          const scale = Math.min(120 / img.width, 120 / img.height);
          const x = (120 - img.width * scale) / 2;
          const y = (120 - img.height * scale) / 2;
          const width = img.width * scale;
          const height = img.height * scale;
          ctx.drawImage(img, x, y, width, height);
          const compressedBase64 = canvas.toDataURL("image/png");
          await postAction("updateSociedadLogo", {
            id: socId,
            logo_url: compressedBase64
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddSociedad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSocName.trim()) return;
    await postAction("addSociedad", {
      nombre_sociedad: newSocName.trim(),
      rango_edad_min: newSocEdadMin,
      rango_edad_max: newSocEdadMax,
      sexo_requerido: newSocSexo,
      logo_url: newSocLogoUrl || null,
    });
    setNewSocName("");
    setNewSocEdadMin("");
    setNewSocEdadMax("");
    setNewSocSexo("MIXTO");
    setNewSocLogoUrl("");
  };

  const handleDeleteSociedad = async (socId: string) => {
    if (confirm("¿Estás seguro de eliminar esta sociedad? Esto eliminará todos sus grupos pequeños y revocará los accesos de líderes asignados a ella.")) {
      await postAction("deleteSociedad", { id: socId });
    }
  };

  const handleOpenConfigDetalles = (soc: any) => {
    setEditingSoc(soc);
    setEditingSocDesc(soc.descripcion || "");
    setEditingSocHorarios(soc.horarios || "");
    setEditingSocEdadMin(soc.rango_edad_min !== null && soc.rango_edad_min !== undefined ? String(soc.rango_edad_min) : "");
    setEditingSocEdadMax(soc.rango_edad_max !== null && soc.rango_edad_max !== undefined ? String(soc.rango_edad_max) : "");
    setEditingSocSexo(soc.sexo_requerido || "MIXTO");
    let gal: string[] = [];
    if (soc.galeria) {
      try {
        gal = JSON.parse(soc.galeria);
      } catch (e) {
        console.error("Error parsing galeria JSON:", e);
      }
    }
    setEditingSocGaleria(gal);
  };

  const handleSaveSocDetalles = async () => {
    if (!editingSoc) return;
    await postAction("updateSociedadDetalles", {
      id: editingSoc.id,
      descripcion: editingSocDesc,
      horarios: editingSocHorarios,
      rango_edad_min: editingSocEdadMin,
      rango_edad_max: editingSocEdadMax,
      sexo_requerido: editingSocSexo,
      galeria: JSON.stringify(editingSocGaleria),
    });
    setEditingSoc(null);
  };

  const handleSocGaleriaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 5 - editingSocGaleria.length;
    if (files.length > remainingSlots) {
      alert(`Solo puedes agregar ${remainingSlots} imagen(es) más a la galería (máximo 5).`);
      return;
    }

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`El archivo "${file.name}" supera los 5MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 600;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
            setEditingSocGaleria((prev) => {
              if (prev.length >= 5) return prev;
              return [...prev, compressedBase64];
            });
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };


  // --- HANDLERS GRUPOS CONEXIÓN ---
  const handleAddGroup = async (socId: string) => {
    if (!gcName.trim()) return;
    await postAction("addGroup", {
      sociedad_id: socId,
      nombre_grupo: gcName.trim(),
      rango_edad_min: gcEdadMin,
      rango_edad_max: gcEdadMax,
      estado_civil_requerido: gcEstadoCivil || null,
      sexo: gcSexo || "MIXTO",
    });
    setAddingGroupSocId(null);
    setGcName("");
    setGcEdadMin("");
    setGcEdadMax("");
    setGcSexo("MIXTO");
    setGcEstadoCivil("");
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (confirm("¿Estás seguro de eliminar este grupo pequeño? Se revocarán los accesos de líderes asignados a él.")) {
      await postAction("deleteGroup", { id: groupId });
    }
  };

  const handleStartEditGroup = (g: any) => {
    setEditingGroupId(g.id);
    setEditGcName(g.nombre_grupo);
    setEditGcEdadMin(g.rango_edad_min !== null && g.rango_edad_min !== undefined ? String(g.rango_edad_min) : "");
    setEditGcEdadMax(g.rango_edad_max !== null && g.rango_edad_max !== undefined ? String(g.rango_edad_max) : "");
    setEditGcEstadoCivil(g.estado_civil_requerido || "");
    setEditGcSexo(g.sexo_raw || "MIXTO");
  };

  const handleSaveEditGroup = async (groupId: string) => {
    if (!editGcName.trim()) return;
    await postAction("updateGroup", {
      id: groupId,
      nombre_grupo: editGcName.trim(),
      rango_edad_min: editGcEdadMin,
      rango_edad_max: editGcEdadMax,
      estado_civil_requerido: editGcEstadoCivil || null,
      sexo: editGcSexo || "MIXTO",
    });
    setEditingGroupId(null);
  };

  // --- HANDLERS LIDERAZGO ---
  const handleAddLiderDirectiva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUsuarioId) return;

    await postAction("addLiderDirectiva", {
      usuario_id: targetUsuarioId,
      modulo_ids: selectedModuloIds,
      alcance_tipo: selectedAlcance,
      sociedad_id: selectedAlcance === "SOCIEDAD" ? selectedSocId : null,
      grupo_conexion_id: selectedAlcance === "GRUPO_CONEXION" ? selectedGcId : null,
      grupo_trabajo_id: ["CUERPO_OFICIAL", "DEPARTAMENTO", "MINISTERIO", "INSTITUCION"].includes(selectedAlcance) ? promoteGrupoTrabajoId : null,
    });

    setShowAddDirectiveModal(false);
    setTargetUsuarioId("");
    setSelectedModuloIds(["all"]);
    setSelectedModuloId("all");
    setSelectedAlcance("GRUPO_CONEXION");
    setPromoteGrupoTrabajoId("");
    await loadConfig();
  };

  const handleRemoveLiderDirectiva = async (id: string) => {
    if (confirm("¿Estás seguro de remover esta función/directiva asignada?")) {
      await postAction("removeLiderDirectiva", { id });
      await loadConfig();
    }
  };

  const handleUpdateUsuarioRoleStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageUsuarioId) return;

    await postAction("updateUsuarioRoleStatus", {
      usuario_id: manageUsuarioId,
      rol: manageRol,
      estado: manageEstado,
      paginas_acceso: manageTabPermissions.join(",")
    });

    setShowManageUserModal(false);
    setManageUsuarioId("");
    setManageTabPermissions([]);
    await loadConfig();
  };

  const handleRevokeLiderCompleto = async (usuarioId: string) => {
    if (confirm("¿Estás seguro de revocar TODOS los permisos de liderazgo de este usuario? Volverá a ser un miembro común.")) {
      await postAction("revokeLiderCompleto", { usuario_id: usuarioId });
      await loadConfig();
    }
  };

  const handlePromoteNewLider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoteMemberName) {
      alert("Por favor selecciona un miembro.");
      return;
    }

    await postAction("addLider", {
      nombre_lider: promoteMemberName,
      rol: promoteRol,
      modulo_ids: selectedModuloIds,
      alcance_tipo: selectedAlcance,
      sociedad_id: selectedAlcance === "SOCIEDAD" ? selectedSocId : null,
      grupo_conexion_id: selectedAlcance === "GRUPO_CONEXION" ? selectedGcId : null,
      grupo_trabajo_id: ["CUERPO_OFICIAL", "DEPARTAMENTO", "MINISTERIO", "INSTITUCION"].includes(selectedAlcance) ? promoteGrupoTrabajoId : null,
      paginas_acceso: promoteTabPermissions.join(","),
    });

    setShowPromoteModal(false);
    setPromoteMemberName("");
    setPromoteRol("LIDER");
    setSelectedModuloIds(["all"]);
    setSelectedModuloId("all");
    setSelectedAlcance("GRUPO_CONEXION");
    setPromoteGrupoTrabajoId("");
    setPromoteTabPermissions([]);
    await loadConfig();
  };

  const handleCreateGrupoTrabajo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGrupoTrabajoNombre.trim()) return;

    try {
      const res = await fetch("/api/liderazgo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createGrupoTrabajo",
          data: {
            nombre: newGrupoTrabajoNombre,
            tipo: newGrupoTrabajoTipo,
            descripcion: newGrupoTrabajoDesc,
          }
        })
      });
      const data = await res.json();
      if (!data.error) {
        setNewGrupoTrabajoNombre("");
        setNewGrupoTrabajoDesc("");
        setShowCreateGroupModal(false);
        await loadConfig();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGrupoTrabajo = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este grupo de liderazgo? Se perderán todos sus foros, agendas y acuerdos.")) {
      try {
        const res = await fetch("/api/liderazgo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "deleteGrupoTrabajo",
            data: { id }
          })
        });
        const data = await res.json();
        if (!data.error) {
          await loadConfig();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddMiembroGrupo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrupoTrabajoId || !newMiembroUsuarioId) return;

    try {
      const res = await fetch("/api/liderazgo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addMiembroGrupo",
          data: {
            grupo_trabajo_id: selectedGrupoTrabajoId,
            usuario_id: newMiembroUsuarioId,
            puesto: newMiembroPuesto
          }
        })
      });
      const data = await res.json();
      if (!data.error) {
        setNewMiembroPuesto("LIDER");
        setNewMiembroUsuarioId("");
        setShowAddMiembroGroupModal(false);
        await loadConfig();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMiembroGrupo = async (id: string) => {
    if (confirm("¿Estás seguro de remover a este directivo del grupo?")) {
      try {
        const res = await fetch("/api/liderazgo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "removeMiembroGrupo",
            data: { id }
          })
        });
        const data = await res.json();
        if (!data.error) {
          await loadConfig();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUpdateLiderazgoLabels = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/liderazgo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateLabels",
          data: {
            label_cuerpo_oficial: editLabelCuerpoOficial,
            label_sociedades: editLabelSociedades,
            label_grupos_conexion: editLabelGruposConexion,
            label_departamentos: editLabelDepartamentos,
            label_ministerios: editLabelMinisterios,
            label_instituciones: editLabelInstituciones
          }
        })
      });
      const data = await res.json();
      if (!data.error) {
        alert("¡Categorías personalizadas actualizadas con éxito!");
        await loadConfig();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'contents' }}>
      <div className={styles.adminLayout}>
      {/* 1. SIDEBAR (Only visible on Desktop) */}
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <div className={styles.sidebarHeader}>
          {churchLogoUrl ? (
            <img src={churchLogoUrl} alt="Logo" className={styles.sidebarLogo} />
          ) : (
            <span className={styles.sidebarLogoPlaceholder}>⛪</span>
          )}
          {!sidebarCollapsed && <span className={styles.sidebarTitle}>{churchName || "Configuración"}</span>}
        </div>

        <nav className={styles.sidebarMenu}>
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.sidebarItem} ${activeTab === tab.id ? styles.sidebarItemActive : ''}`}
              onClick={() => trackTabVisit(tab.id)}
              title={tab.label}
            >
              <span className={styles.sidebarIcon}>
                {tab.icon.startsWith("/") ? (
                  <img src={tab.icon} alt={tab.label} style={{ width: 24, height: 24, objectFit: 'contain' }} />
                ) : (
                  tab.icon
                )}
              </span>
              {!sidebarCollapsed && <span className={styles.sidebarLabel}>{tab.label}</span>}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button 
            type="button"
            className={styles.sidebarCollapseBtn} 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expandir Menú" : "Contraer Menú"}
          >
            {sidebarCollapsed ? "▶" : "◀"}
          </button>
          
          <button
            type="button"
            onClick={handleLogout}
            className={styles.sidebarLogoutBtn}
            title="Cerrar Sesión / Salir"
          >
            <img src="/Iconos SVG/salir.svg" alt="Salir" className={styles.sidebarIcon} style={{ width: "18px", height: "18px", objectFit: "contain" }} />
            {!sidebarCollapsed && <span className={styles.sidebarLabel}>Salir</span>}
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT WRAPPER */}
      <div className={styles.adminMainContent}>
        {/* Top Navbar */}
        <header className={styles.adminTopNavbar}>
          <button 
            type="button"
            className={styles.mobileMenuToggle}
            onClick={() => setMobileMenuOpen(true)}
          >
            ☰
          </button>

          <div className={styles.adminTopNavbarTitleBlock}>
            <h1 className={styles.adminPageTitle} style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.25 }}>
              {visibleTabs.find(t => t.id === activeTab)?.title || visibleTabs.find(t => t.id === activeTab)?.label || "Configuración"}
            </h1>
            <p className={styles.adminTopNavbarDesc}>
              {visibleTabs.find(t => t.id === activeTab)?.description}
            </p>
          </div>

          <div className={styles.adminTopNavbarActions}>
            {currentUser && currentUser.rol === "LIDER" && (
              <Link href="/lider" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0369a1', textDecoration: 'none', background: '#e0f2fe', padding: '0.35rem 0.75rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                👔 Panel de Líder
              </Link>
            )}
            <Link href="/hub" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0284c7', textDecoration: 'none', background: '#e0f2fe', padding: '0.35rem 0.75rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <img src="/Iconos SVG/iglesia.png" alt="Mi Iglesia" style={{ width: 14, height: 14, objectFit: 'contain' }} /> Ver Mi Iglesia
            </Link>
            <Link href="/perfil" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', textDecoration: 'none', background: '#f1f5f9', padding: '0.35rem 0.75rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <img src="/Iconos SVG/perfil.svg" alt="Perfil" style={{ width: 14, height: 14, objectFit: 'contain' }} /> Mi Perfil
            </Link>
          </div>
        </header>

        <div className={styles.adminPageContainer}>
          <div className={styles.tabContent}>
          {/* TAB 1: IDENTIDAD */}
          {activeTab === 1 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button onClick={() => handleSaveChurchConfig()} className={styles.btnPrimary} style={{ padding: '0.6rem 1.5rem', boxShadow: '0 2px 4px rgba(2,132,199,0.3)' }}>
                  💾 Guardar Cambios Generales
                </button>
              </div>

              {/* Bloque 1: Identidad Básica */}
              <div className={styles.configBlock} style={{ background: 'white' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#1e293b' }}>
                  ⛪ Identidad de la Iglesia y Módulos Activos
                </h3>

                {/* Checkbox Módulo Grupos de Familias */}
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.85rem 1.1rem', borderRadius: '10px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <strong style={{ color: '#166534', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      🏡 Habilitar Estructura de Grupos de Familias (Cultos de Hogar)
                    </strong>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#15803d' }}>
                      Si tu iglesia trabaja con macro grupos de familias mixtos para cultos de hogar y consolidación, activa este módulo. De lo contrario, se mantendrá oculto.
                    </p>
                  </div>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', color: '#166534', backgroundColor: 'white', padding: '0.4rem 0.85rem', borderRadius: '8px', border: '1px solid #86efac' }}>
                    <input 
                      type="checkbox"
                      checked={churchUsarGruposFamilia}
                      onChange={(e) => setChurchUsarGruposFamilia(e.target.checked)}
                      style={{ accentColor: '#16a34a', transform: 'scale(1.2)' }}
                    />
                    {churchUsarGruposFamilia ? 'Módulo Activado' : 'Módulo Desactivado'}
                  </label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>Nombre de la Iglesia</label>
                    <input 
                      type="text" 
                      value={churchName} 
                      onChange={(e) => setChurchName(e.target.value)} 
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                      placeholder="Ej: Iglesia Conexión de Vida"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>
                      🔑 Código de la Iglesia (Slug)
                    </label>
                    <input 
                      type="text" 
                      value={churchSlug} 
                      onChange={(e) => setChurchSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))} 
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontWeight: 700, color: '#0284c7', backgroundColor: '#f0f9ff' }} 
                      placeholder="Ej: torrefuerte"
                    />
                    <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>
                      Código de acceso usado al iniciar sesión.
                    </span>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>Slogan o Lema</label>
                    <input 
                      type="text" 
                      value={churchSlogan} 
                      onChange={(e) => setChurchSlogan(e.target.value)} 
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                      placeholder="Ej: Conectando vidas con el propósito divino"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>Logo de la Iglesia</label>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      {churchLogoUrl ? (
                        <div style={{ width: '60px', height: '60px', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#f8fafc', position: 'relative' }}>
                          <img src={churchLogoUrl} alt="Logo Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                          <button 
                            type="button" 
                            onClick={() => setChurchLogoUrl("")} 
                            style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '0 0 0 4px', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px' }}
                            title="Eliminar logo"
                          >
                            &times;
                          </button>
                        </div>
                      ) : (
                        <div style={{ width: '60px', height: '60px', borderRadius: '8px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#94a3b8', background: '#f8fafc' }}>
                          ⛪
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label className={styles.btnPrimary} style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', display: 'inline-block', cursor: 'pointer', textAlign: 'center' }}>
                          📁 Seleccionar Imagen...
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleLogoUpload} 
                            style={{ display: 'none' }} 
                          />
                        </label>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Se reducirá automáticamente para no recargar la base de datos.</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>Color Principal (Tema de Mi Iglesia)</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input 
                        type="color" 
                        value={churchColor} 
                        onChange={(e) => setChurchColor(e.target.value)} 
                        style={{ width: '60px', height: '38px', padding: 0, border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }} 
                      />
                      <input 
                        type="text" 
                        value={churchColor} 
                        onChange={(e) => setChurchColor(e.target.value)} 
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                        placeholder="#0284c7"
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>Misión</label>
                    <textarea 
                      rows={3}
                      value={churchMision} 
                      onChange={(e) => setChurchMision(e.target.value)} 
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'inherit', resize: 'vertical' }} 
                      placeholder="Ej: Anunciar el evangelio y hacer discípulos..."
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>Visión</label>
                    <textarea 
                      rows={3}
                      value={churchVision} 
                      onChange={(e) => setChurchVision(e.target.value)} 
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'inherit', resize: 'vertical' }} 
                      placeholder="Ej: Ser una iglesia de impacto transformador..."
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>Quiénes Somos (Presentación Corta)</label>
                    <textarea 
                      rows={3}
                      value={churchQuienesSomos} 
                      onChange={(e) => setChurchQuienesSomos(e.target.value)} 
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'inherit', resize: 'vertical' }} 
                      placeholder="Describe brevemente quiénes integran la congregación..."
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>Valores de la Iglesia (Uno por línea)</label>
                    <textarea 
                      rows={3}
                      value={churchValores} 
                      onChange={(e) => setChurchValores(e.target.value)} 
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'inherit', resize: 'vertical' }} 
                      placeholder="Ej:&#10;• Amor y Gracia&#10;• Fidelidad Bíblica"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>Historia de la Iglesia</label>
                  <textarea 
                    rows={4}
                    value={churchHistoria} 
                    onChange={(e) => setChurchHistoria(e.target.value)} 
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'inherit', resize: 'vertical' }} 
                    placeholder="Escribe la historia de fundación, crecimiento y momentos memorables de la congregación..."
                  />
                </div>
              </div>

              {/* Bloque: Slider de Imágenes de Portada */}
              <div className={styles.configBlock} style={{ background: 'white', marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>📸 Galería de Portada (Slider en Inicio)</span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal' }}>
                    {churchSliderImages.length} / 5 imágenes
                  </span>
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
                  Sube hasta 5 imágenes destacadas. Estas imágenes se mostrarán como un banner deslizante (slider) en la pantalla de inicio pública de la iglesia.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  {churchSliderImages.map((imgBase64, idx) => (
                    <div key={idx} style={{ position: 'relative', border: '1px solid #cbd5e1', borderRadius: '8px', height: '110px', overflow: 'hidden', background: '#f8fafc' }}>
                      <img src={imgBase64} alt={`Portada ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => {
                          const newList = [...churchSliderImages];
                          newList.splice(idx, 1);
                          setChurchSliderImages(newList);
                        }}
                        style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                        title="Eliminar imagen"
                      >
                        ×
                      </button>
                      <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: 'rgba(15, 23, 42, 0.6)', color: 'white', fontSize: '0.7rem', padding: '2px 4px', textAlign: 'center' }}>
                        Imagen {idx + 1}
                      </div>
                    </div>
                  ))}

                  {churchSliderImages.length < 5 && (
                    <label style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', height: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fafafa', color: '#64748b', transition: 'all 0.15s', padding: '0.5rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '1.5rem' }}>➕</span>
                      <span style={{ fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>Añadir Imagen</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSliderImageUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Bloque: Visión y Tema del Año */}
              <div className={styles.configBlock} style={{ background: 'white', marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#1e293b' }}>
                  🎯 Enfoque General de la Visión Anual
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>Año</label>
                      <input 
                        type="number" 
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                        value={temaAnual.anio || new Date().getFullYear()} 
                        onChange={(e) => setTemaAnual({ ...temaAnual, anio: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>Visión Anual</label>
                      <input 
                        type="text" 
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                        placeholder="Ej. Visión 2026"
                        value={temaAnual.vision_anual || temaAnual.lema_anual || ""} 
                        onChange={(e) => setTemaAnual({ ...temaAnual, vision_anual: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>Eslogan</label>
                      <input 
                        type="text" 
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                        placeholder="Ej. Año de la Expansión"
                        value={temaAnual.eslogan || ""} 
                        onChange={(e) => setTemaAnual({ ...temaAnual, eslogan: e.target.value })}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>Base Bíblica</label>
                      <input 
                        type="text" 
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                        placeholder="Ej. Isaías 54:2"
                        value={temaAnual.base_biblica || temaAnual.versiculo_clave || ""} 
                        onChange={(e) => setTemaAnual({ ...temaAnual, base_biblica: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>Logo de la Visión</label>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {temaAnual.logo_url ? (
                          <div style={{ width: '60px', height: '60px', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#f8fafc', position: 'relative' }}>
                            <img src={temaAnual.logo_url} alt="Logo Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            <button 
                              type="button" 
                              onClick={() => setTemaAnual({ ...temaAnual, logo_url: "" })} 
                              style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '0 0 0 4px', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px' }}
                              title="Eliminar logo"
                            >
                              &times;
                            </button>
                          </div>
                        ) : (
                          <div style={{ width: '60px', height: '60px', borderRadius: '8px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#94a3b8', background: '#f8fafc' }}>
                            🌟
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <label className={styles.btnPrimary} style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', display: 'inline-block', cursor: 'pointer', textAlign: 'center' }}>
                            📁 Seleccionar Imagen...
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleVisionLogoUpload} 
                              style={{ display: 'none' }} 
                            />
                          </label>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Se reducirá automáticamente para no recargar la base de datos.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>Descripción breve de la visión</label>
                    <textarea 
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'none' }} 
                      rows={3}
                      placeholder="Explica brevemente de qué trata la visión de este año..."
                      value={temaAnual.descripcion || ""}
                      onChange={(e) => setTemaAnual({ ...temaAnual, descripcion: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.configBlock} style={{ background: 'white', marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '0.5rem', color: '#1e293b' }}>
                  📅 Temas Mensuales
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  Define un tema específico para cada mes del año. Estos se mostrarán automáticamente en Mi Iglesia según el mes actual.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {[
                    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                  ].map((nombreMes, index) => {
                    const mesIndex = index + 1;
                    const mesData = temaAnual.meses?.find((m: any) => m.mes === mesIndex) || { mes: mesIndex, tema: "", descripcion: "" };
                    
                    return (
                      <div key={index} style={{ 
                        background: 'white', 
                        borderRadius: '12px', 
                        border: '1px solid #e2e8f0', 
                        padding: '1.25rem',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.025)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)';
                      }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px dashed #e2e8f0' }}>
                          <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            🗓️ {nombreMes}
                          </h4>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>
                            Mes {mesIndex}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                          <div>
                            <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, color: '#64748b', marginBottom: '0.35rem', display: 'block' }}>Lema del Mes</label>
                            <input 
                              type="text" 
                              className={styles.input} 
                              style={{ padding: '0.6rem 0.8rem', fontSize: '0.9rem', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%' }}
                              placeholder={`Ej: Cosecha y Bendición`}
                              value={mesData.tema}
                              onChange={(e) => {
                                const newMeses = [...(temaAnual.meses || [])];
                                const existingIdx = newMeses.findIndex(m => m.mes === mesIndex);
                                if (existingIdx >= 0) {
                                  newMeses[existingIdx].tema = e.target.value;
                                } else {
                                  newMeses.push({ mes: mesIndex, theme: e.target.value, descripcion: "" });
                                }
                                setTemaAnual({ ...temaAnual, meses: newMeses });
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, color: '#64748b', marginBottom: '0.35rem', display: 'block' }}>Descripción (Opcional)</label>
                            <textarea 
                              className={styles.textarea} 
                              rows={2}
                              style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%', resize: 'none' }}
                              placeholder="Breve enfoque para este mes..."
                              value={mesData.descripcion}
                              onChange={(e) => {
                                const newMeses = [...(temaAnual.meses || [])];
                                const existingIdx = newMeses.findIndex(m => m.mes === mesIndex);
                                if (existingIdx >= 0) {
                                  newMeses[existingIdx].descripcion = e.target.value;
                                } else {
                                  newMeses.push({ mes: mesIndex, tema: "", descripcion: e.target.value });
                                }
                                setTemaAnual({ ...temaAnual, meses: newMeses });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bloque 2: Contacto e Información */}
              <div className={styles.configBlock} style={{ background: 'white' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#1e293b' }}>
                  📞 Datos de Contacto
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>Teléfono de Contacto</label>
                    <input 
                      type="text" 
                      value={churchPhone} 
                      onChange={(e) => setChurchPhone(e.target.value)} 
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                      placeholder="Ej: (809) 555-0199"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>Correo Electrónico oficial</label>
                    <input 
                      type="email" 
                      value={churchEmail} 
                      onChange={(e) => setChurchEmail(e.target.value)} 
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                      placeholder="Ej: contacto@iglesia.org"
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>Dirección Física</label>
                  <input 
                    type="text" 
                    value={churchAddress} 
                    onChange={(e) => setChurchAddress(e.target.value)} 
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                    placeholder="Ej: Av. Libertad #12, Sector Centro, Higuey"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>Enlace de Google Maps (Opcional)</label>
                    <input 
                      type="text" 
                      value={churchGoogleMaps} 
                      onChange={(e) => setChurchGoogleMaps(e.target.value)} 
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                      placeholder="Ej: https://goo.gl/maps/... o link con coordenadas"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>Enlace de Waze (Opcional)</label>
                    <input 
                      type="text" 
                      value={churchWaze} 
                      onChange={(e) => setChurchWaze(e.target.value)} 
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                      placeholder="Ej: https://waze.com/ul?ll=... o link con dirección"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque 3: Redes Sociales */}
              <div className={styles.configBlock} style={{ background: 'white' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#1e293b' }}>
                  🌐 Redes Sociales y Canales de Comunicación
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>Facebook URL</label>
                    <input 
                      type="text" 
                      value={churchSocials.facebook} 
                      onChange={(e) => setChurchSocials({ ...churchSocials, facebook: e.target.value })} 
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                      placeholder="https://facebook.com/miiglesia"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>Instagram URL</label>
                    <input 
                      type="text" 
                      value={churchSocials.instagram} 
                      onChange={(e) => setChurchSocials({ ...churchSocials, instagram: e.target.value })} 
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                      placeholder="https://instagram.com/miiglesia"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>YouTube URL</label>
                    <input 
                      type="text" 
                      value={churchSocials.youtube} 
                      onChange={(e) => setChurchSocials({ ...churchSocials, youtube: e.target.value })} 
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                      placeholder="https://youtube.com/c/miiglesia"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque 5: Recursos */}
              <div className={styles.configBlock} style={{ background: 'white' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#1e293b' }}>
                  📚 Biblioteca de Recursos
                </h3>
                
                {/* Formulario Agregar Recurso */}
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px dashed #cbd5e1', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: '#334155' }}>📚 Cargar Nuevo Recurso</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.25rem' }}>Título del Recurso</label>
                      <input 
                        type="text" 
                        value={newRecTitle} 
                        onChange={(e) => setNewRecTitle(e.target.value)} 
                        style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                        placeholder="Ej: Libro de Discipulado"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.25rem' }}>Categoría</label>
                      <select
                        value={newRecCategory}
                        onChange={(e) => setNewRecCategory(e.target.value)}
                        style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: 'white' }}
                      >
                        <option value="Estudios Bíblicos">Estudios Bíblicos</option>
                        <option value="Sermones y Predicas">Sermones y Prédicas</option>
                        <option value="Manuales y Guías">Manuales y Guías</option>
                        <option value="Jóvenes y Niños">Jóvenes y Niños</option>
                        <option value="Eventos Especiales">Eventos Especiales</option>
                        <option value="General">General</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.25rem' }}>Tipo de Recurso</label>
                      <select 
                        value={newRecType} 
                        onChange={(e) => setNewRecType(e.target.value)} 
                        style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: 'white' }} 
                      >
                        <option value="LINK">🌐 Link / Sitio Web</option>
                        <option value="PDF">📄 Documento PDF / Guía</option>
                        <option value="VIDEO">📺 Video (YouTube / Vimeo)</option>
                        <option value="GALERIA">🖼️ Fotografía / Galería de Fotos</option>
                        <option value="AUDIO">🎧 Audio / Podcast / Prédica</option>
                        <option value="BLOG">✍️ Artículo / Reflexión Escrita</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.25rem' }}>URL / Enlace del Recurso</label>
                    <input 
                      type="text" 
                      value={newRecUrl} 
                      onChange={(e) => setNewRecUrl(e.target.value)} 
                      style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                      placeholder="Ej: https://miiglesia.com/recursos/libro.pdf"
                    />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.25rem' }}>Breve Descripción</label>
                    <input 
                      type="text" 
                      value={newRecDesc} 
                      onChange={(e) => setNewRecDesc(e.target.value)} 
                      style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                      placeholder="Ej: Guía de estudio para nuevos creyentes en grupos pequeños."
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={handleAddResource} className={styles.btnPrimary} style={{ fontSize: '0.85rem', padding: '0.4rem 1.25rem' }}>
                      + Cargar Recurso
                    </button>
                  </div>
                </div>

                {/* Listado de Recursos */}
                {churchResources.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>No hay recursos cargados.</p>
                ) : (
                  <table className={styles.table} style={{ fontSize: '0.9rem' }}>
                    <thead>
                      <tr>
                        <th>Título</th>
                        <th>Tipo</th>
                        <th>Descripción</th>
                        <th style={{ width: '80px', textAlign: 'center' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {churchResources.map((rec) => (
                        <tr key={rec.id}>
                          <td style={{ fontWeight: 600 }}>{rec.titulo}</td>
                          <td>
                            <span style={{ fontSize: '0.75rem', background: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              {rec.tipo}
                            </span>
                          </td>
                          <td style={{ color: '#64748b' }}>{rec.descripcion}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveResource(rec.id)} 
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
                              title="Remover recurso"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

              </div>

              {/* Bloque: Opciones Personalizadas del Formulario de Registro */}
              <div className={styles.configBlock} style={{ background: 'white', marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#1e293b' }}>
                  📋 Opciones del Formulario de Registro
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Personaliza las opciones que tus nuevos creyentes y miembros verán al registrarse en la pregunta <strong>¿Cómo nos conociste? / ¿Quién te invitó?</strong>.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                  {/* Formulario para agregar */}
                  <div style={{ borderRight: '1px solid #f1f5f9', paddingRight: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>Nueva Opción</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        value={newMedioOption} 
                        onChange={(e) => setNewMedioOption(e.target.value)} 
                        style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} 
                        placeholder="Ej: Invitación radial, Volante, etc."
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if (!newMedioOption.trim()) return;
                          const currentOptions = churchOpcionesRegistro?.medio_relacion || [];
                          if (currentOptions.includes(newMedioOption.trim())) {
                            alert("Esta opción ya existe.");
                            return;
                          }
                          setChurchOpcionesRegistro({
                            ...churchOpcionesRegistro,
                            medio_relacion: [...currentOptions, newMedioOption.trim()]
                          });
                          setNewMedioOption("");
                        }}
                        className={styles.btnPrimary}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                      >
                        Añadir
                      </button>
                    </div>
                  </div>

                  {/* Listado de opciones */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.6rem', color: '#475569' }}>Opciones actuales en el formulario</label>
                    {(!churchOpcionesRegistro?.medio_relacion || churchOpcionesRegistro.medio_relacion.length === 0) ? (
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>No hay opciones configuradas. Se mostrarán las opciones por defecto.</p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {churchOpcionesRegistro.medio_relacion.map((opt: string, index: number) => (
                          <div 
                            key={index} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem', 
                              background: '#f1f5f9', 
                              color: '#334155', 
                              padding: '0.4rem 0.75rem', 
                              borderRadius: '20px', 
                              fontSize: '0.85rem', 
                              fontWeight: 500 
                            }}
                          >
                            <span>{opt}</span>
                            <button 
                              type="button" 
                              onClick={() => {
                                const filtered = churchOpcionesRegistro.medio_relacion.filter((_: any, i: number) => i !== index);
                                setChurchOpcionesRegistro({
                                  ...churchOpcionesRegistro,
                                  medio_relacion: filtered
                                });
                              }} 
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: '#ef4444', 
                                cursor: 'pointer', 
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                                padding: 0,
                                lineHeight: 1
                              }}
                              title="Eliminar opción"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Guardar Cambios Generales */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button onClick={() => handleSaveChurchConfig()} className={styles.btnPrimary} style={{ padding: '0.75rem 2.5rem', fontSize: '1rem', boxShadow: '0 4px 6px rgba(2,132,199,0.2)' }}>
                  💾 Guardar Todos los Cambios
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: AGENDA Y EVENTOS (INTERACTIVO AUTOMÁTICO) */}
          {activeTab === 6 && (
            <div>
              {/* Formulario Agregar Evento */}
              <div className={styles.configBlock} style={{ background: 'white' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#1e293b' }}>
                  🗓️ Programar Nueva Actividad
                </h3>
                
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px dashed #cbd5e1', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: '#334155' }}>🗓️ Programar Nueva Actividad</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.25rem' }}>Título de la Actividad</label>
                      <input 
                        type="text" 
                        value={newEventTitle} 
                        onChange={(e) => setNewEventTitle(e.target.value)} 
                        style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                        placeholder="Ej: Culto de Jóvenes"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.25rem' }}>Tipo de Agenda</label>
                      <select 
                        value={newEventType}
                        onChange={(e) => setNewEventType(e.target.value)}
                        style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: 'white' }}
                      >
                        <option value="REGULAR">Semanal (Regular)</option>
                        <option value="ESPECIAL">Especial (Por Fecha)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.25rem' }}>Hora</label>
                      <input 
                        type="time" 
                        value={newEventTime} 
                        onChange={(e) => setNewEventTime(e.target.value)} 
                        style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    {newEventType === "ESPECIAL" ? (
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.25rem' }}>Fecha del Evento</label>
                        <input 
                          type="date" 
                          value={newEventDate} 
                          onChange={(e) => setNewEventDate(e.target.value)} 
                          style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                        />
                      </div>
                    ) : (
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.25rem' }}>Día de Repetición</label>
                        <select 
                          value={newEventDiaSemana} 
                          onChange={(e) => setNewEventDiaSemana(e.target.value)} 
                          style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: 'white' }} 
                        >
                          <option value="Lunes">Lunes</option>
                          <option value="Martes">Martes</option>
                          <option value="Miércoles">Miércoles</option>
                          <option value="Jueves">Jueves</option>
                          <option value="Viernes">Viernes</option>
                          <option value="Sábado">Sábado</option>
                          <option value="Domingo">Domingo</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.25rem' }}>Sociedad Vinculada (Opcional)</label>
                      <select 
                        value={newEventSociedadId} 
                        onChange={(e) => setNewEventSociedadId(e.target.value)} 
                        style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: 'white' }} 
                      >
                        <option value="">General (Toda la Iglesia)</option>
                        {sociedades.map((s) => (
                          <option key={s.id} value={s.id}>{s.nombre_sociedad}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.25rem' }}>Detalle de la Actividad</label>
                    <input 
                      type="text" 
                      value={newEventDesc} 
                      onChange={(e) => setNewEventDesc(e.target.value)} 
                      style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                      placeholder="Ej: Te esperamos en el templo principal, trae a un invitado."
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={handleAddEvent} className={styles.btnPrimary} style={{ fontSize: '0.85rem', padding: '0.4rem 1.25rem' }} disabled={!newEventTitle.trim()}>
                      + Agregar a la Agenda
                    </button>
                  </div>
                </div>

                {/* Listado de Eventos */}
                {churchEvents.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>No hay actividades registradas en la agenda.</p>
                ) : (
                  <table className={styles.table} style={{ fontSize: '0.9rem' }}>
                    <thead>
                      <tr>
                        <th>Actividad</th>
                        <th>Tipo / Repetición</th>
                        <th>Hora</th>
                        <th>Descripción</th>
                        <th style={{ width: '80px', textAlign: 'center' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {churchEvents.map((ev) => {
                        const linkedSoc = sociedades.find(s => s.id === ev.sociedadId);
                        const tipoText = ev.tipo === "ESPECIAL" 
                          ? `Especial: ${ev.fecha || 'Sin fecha'}` 
                          : `Regular: Todos los ${ev.diaSemana || 'Domingos'}`;

                        return (
                          <tr key={ev.id}>
                            <td>
                              <span style={{ fontWeight: 600, display: 'block' }}>{ev.titulo}</span>
                              {linkedSoc && (
                                <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', padding: '1px 5px', borderRadius: '4px', display: 'inline-block', marginTop: '2px', fontWeight: 500 }}>
                                  👥 {linkedSoc.nombre_sociedad}
                                </span>
                              )}
                            </td>
                            <td>{tipoText}</td>
                            <td>{ev.hora ? `@ ${ev.hora}` : 'Sin hora'}</td>
                            <td style={{ color: '#64748b' }}>{ev.descripcion}</td>
                            <td style={{ textAlign: 'center' }}>
                              <button 
                                type="button" 
                                onClick={() => handleRemoveEvent(ev.id)} 
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
                                title="Remover evento"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SOCIEDADES (INTERACTIVO) */}
          {activeTab === 2 && (
            <div>

              {/* Formulario Nueva Sociedad */}
              <div className={styles.configBlock} style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', color: '#1e293b' }}>
                  🆕 Crear Nueva Sociedad (Macrogrupo)
                </h3>
                <form onSubmit={handleAddSociedad} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ flex: '2 1 200px' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.25rem', color: '#475569' }}>Nombre de la Sociedad</label>
                    <input type="text" placeholder="Ej: Sociedad de Damas, Parejas..." value={newSocName} onChange={(e) => setNewSocName(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
                  </div>
                  <div style={{ flex: '1 1 80px' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.25rem', color: '#475569' }}>Edad Mín</label>
                    <input type="number" value={newSocEdadMin} onChange={(e) => setNewSocEdadMin(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  </div>
                  <div style={{ flex: '1 1 80px' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.25rem', color: '#475569' }}>Edad Máx</label>
                    <input type="number" value={newSocEdadMax} onChange={(e) => setNewSocEdadMax(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  </div>
                  <div style={{ flex: '1 1 120px' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.25rem', color: '#475569' }}>Sexo</label>
                    <select value={newSocSexo} onChange={(e) => setNewSocSexo(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}>
                      <option value="MIXTO">Mixto</option>
                      <option value="M">Masculino (M)</option>
                      <option value="F">Femenino (F)</option>
                    </select>
                  </div>
                  <div style={{ flex: '2 1 200px', display: 'flex', flexDirection: 'column' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.25rem', color: '#475569' }}>Logo / Imagen (Opcional)</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input type="file" accept="image/*" onChange={handleSocLogoUpload} style={{ fontSize: '0.8rem', width: '100%' }} />
                      {newSocLogoUrl && (
                        <div style={{ position: 'relative', width: '36px', height: '36px', flexShrink: 0, borderRadius: '50%', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                          <img src={newSocLogoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => setNewSocLogoUrl("")} style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>&times;</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <button type="submit" className={styles.btnPrimary} style={{ height: '36px' }}>+ Crear Sociedad</button>
                </form>
              </div>

              {/* Lista de Sociedades */}
              {sociedades.map(soc => {
                const gruposDeLaSoc = gruposConexion
                  .filter(g => g.sociedad_id === soc.id)
                  .sort((a, b) => (a.rango_edad_min ?? 0) - (b.rango_edad_min ?? 0));

                return (
                  <div key={soc.id} className={styles.configBlock} style={{ background: 'white' }}>
                    <h3 className={styles.blockTitle} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title="Click en 📷 para cambiar logo">
                          {soc.logo_url ? (
                            <img src={soc.logo_url} alt={soc.nombre_sociedad} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #cbd5e1' }} />
                          ) : (
                            <span style={{ fontSize: '1.5rem', display: 'inline-block', padding: '2px', background: '#f1f5f9', borderRadius: '50%' }}>🛡️</span>
                          )}
                          <label style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <span style={{ fontSize: '10px' }}>📷</span>
                            <input type="file" accept="image/*" onChange={(e) => handleUpdateSocLogo(soc.id, e)} style={{ display: 'none' }} />
                          </label>
                        </div>
                        <span>
                          {soc.nombre_sociedad}{" "}
                          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                            (Edad: {soc.rango_edad_min || 0} a {soc.rango_edad_max || '99'} | Sexo: {soc.sexo_requerido})
                          </span>
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                         <button 
                          onClick={() => handleMoveSociedad(soc.id, 'up')}
                          style={{ 
                            backgroundColor: '#f1f5f9', 
                            color: '#475569', 
                            fontSize: '0.75rem', 
                            padding: '0.35rem 0.55rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                          title="Subir"
                        >
                          ▲
                        </button>
                        <button 
                          onClick={() => handleMoveSociedad(soc.id, 'down')}
                          style={{ 
                            backgroundColor: '#f1f5f9', 
                            color: '#475569', 
                            fontSize: '0.75rem', 
                            padding: '0.35rem 0.55rem', 
                            marginRight: '0.5rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                          title="Bajar"
                        >
                          ▼
                        </button>
                        <button 
                          onClick={() => setAddingGroupSocId(addingGroupSocId === soc.id ? null : soc.id)} 
                          style={{ 
                            marginRight: '0.5rem', 
                            fontSize: '0.75rem', 
                            padding: '0.4rem 0.85rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderRadius: '12px',
                            background: 'rgba(79, 70, 229, 0.08)',
                            color: 'var(--color-primary)',
                            border: '1px solid rgba(79, 70, 229, 0.15)',
                            transition: 'all 0.25s ease',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(79, 70, 229, 0.15)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(79, 70, 229, 0.08)';
                            e.currentTarget.style.transform = 'none';
                          }}
                        >
                          {addingGroupSocId === soc.id ? "Cancelar" : "+ Añadir Grupo Pequeño"}
                        </button>
                        <button 
                          onClick={() => handleOpenConfigDetalles(soc)} 
                          style={{ 
                            background: 'none',
                            border: 'none',
                            color: '#475569',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}
                          title="Detalles / Editar Sociedad"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteSociedad(soc.id)} 
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
                          title="Eliminar Sociedad"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                        </button>

                      </div>
                    </h3>

                    {/* Formulario Nuevo Grupo inline */}
                    {addingGroupSocId === soc.id && (
                      <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                        <h4 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem', color: '#334155' }}>Crear Nuevo Grupo de Conexión</h4>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                          <div style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.2rem' }}>Nombre del Grupo</label>
                            <input type="text" placeholder="Ej: Jóvenes Universitarios" value={gcName} onChange={(e) => setGcName(e.target.value)} style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                          </div>
                          <div style={{ width: '80px' }}>
                            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.2rem' }}>Edad Mín</label>
                            <input type="number" value={gcEdadMin} onChange={(e) => setGcEdadMin(e.target.value)} style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                          </div>
                          <div style={{ width: '80px' }}>
                            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.25rem' }}>Edad Máx</label>
                            <input type="number" value={gcEdadMax} onChange={(e) => setGcEdadMax(e.target.value)} style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                          </div>
                          <div style={{ width: '110px' }}>
                            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.25rem' }}>Sexo</label>
                            <select value={gcSexo} onChange={(e) => setGcSexo(e.target.value)} style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}>
                              <option value="MIXTO">Mixto</option>
                              <option value="M">Masculino</option>
                              <option value="F">Femenino</option>
                            </select>
                          </div>
                          <div style={{ width: '140px' }}>
                            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.25rem' }}>Estado Civil</label>
                            <select value={gcEstadoCivil} onChange={(e) => setGcEstadoCivil(e.target.value)} style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}>
                              <option value="">Cualquiera</option>
                              <option value="SOLTERO">Solo Solteros/as</option>
                              <option value="CASADO">Solo Casados/as</option>
                            </select>
                          </div>
                          <button onClick={() => handleAddGroup(soc.id)} className={styles.btnPrimary} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Guardar Grupo</button>
                        </div>
                      </div>
                    )}

                    {/* Tabla de Grupos Pequeños */}
                    {gruposDeLaSoc.length === 0 ? (
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>No hay grupos creados en esta sociedad.</p>
                    ) : (
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Grupo Pequeño (Microgrupo)</th>
                            <th>Rango Edades</th>
                            <th>Sexo</th>
                            <th>Estado Civil</th>
                            <th>Líderes</th>
                            <th style={{ width: '120px', textAlign: 'center' }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gruposDeLaSoc.map(g => {
                            const isEditing = editingGroupId === g.id;
                            return (
                              <tr key={g.id}>
                                <td>
                                  {isEditing ? (
                                    <input 
                                      type="text" 
                                      value={editGcName} 
                                      onChange={(e) => setEditGcName(e.target.value)} 
                                      style={{ width: '100%', padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                                    />
                                  ) : (
                                    <span style={{ fontWeight: 600 }}>{g.nombre_grupo}</span>
                                  )}
                                </td>
                                <td>
                                  {isEditing ? (
                                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                      <input 
                                        type="number" 
                                        value={editGcEdadMin} 
                                        onChange={(e) => setEditGcEdadMin(e.target.value)} 
                                        style={{ width: '60px', padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                                        placeholder="Min"
                                      />
                                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>a</span>
                                      <input 
                                        type="number" 
                                        value={editGcEdadMax} 
                                        onChange={(e) => setEditGcEdadMax(e.target.value)} 
                                        style={{ width: '60px', padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                                        placeholder="Max"
                                      />
                                    </div>
                                  ) : (
                                    <span>{g.rango_edad_min || 0} a {g.rango_edad_max || 99} años</span>
                                  )}
                                </td>
                                <td>
                                  {isEditing ? (
                                    <select 
                                      value={editGcSexo} 
                                      onChange={(e) => setEditGcSexo(e.target.value)} 
                                      style={{ padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: 'white' }}
                                    >
                                      <option value="MIXTO">Mixto</option>
                                      <option value="M">Masculino</option>
                                      <option value="F">Femenino</option>
                                    </select>
                                  ) : (
                                    <span>{g.sexo}</span>
                                  )}
                                </td>
                                <td>
                                  {isEditing ? (
                                    <select 
                                      value={editGcEstadoCivil} 
                                      onChange={(e) => setEditGcEstadoCivil(e.target.value)} 
                                      style={{ padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: 'white' }}
                                    >
                                      <option value="">Cualquiera</option>
                                      <option value="SOLTERO">Solo Solteros/as</option>
                                      <option value="CASADO">Solo Casados/as</option>
                                    </select>
                                  ) : (
                                    <span>
                                      {g.estado_civil_requerido === "SOLTERO" ? "Solo Solteros/as" : g.estado_civil_requerido === "CASADO" ? "Solo Casados/as" : "Cualquiera"}
                                    </span>
                                  )}
                                </td>
                                <td>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    {lideres.filter(lid => lid.grupo_conexion_id === g.id).map(lid => (
                                      <div key={lid.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.78rem', width: 'fit-content' }}>
                                        <span>👤 {lid.nombre_lider}</span>
                                        <button 
                                          onClick={() => handleRemoveLiderDirectiva(lid.id)} 
                                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}
                                          title="Revocar Liderazgo"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                    <select
                                      value=""
                                      onChange={async (e) => {
                                        const val = e.target.value;
                                        if (!val) return;
                                        await postAction("addLider", {
                                          nombre_lider: val,
                                          modulo_ids: ["all"],
                                          alcance_tipo: "GRUPO_CONEXION",
                                          grupo_conexion_id: g.id,
                                        });
                                      }}
                                      style={{ fontSize: '0.75rem', padding: '0.15rem', borderRadius: '4px', border: '1px solid #cbd5e1', marginTop: '0.25rem' }}
                                    >
                                      <option value="">+ Añadir Líder...</option>
                                      {miembros.map(m => (
                                        <option key={m.id} value={m.nombre}>{m.nombre}</option>
                                      ))}
                                    </select>
                                  </div>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', alignItems: 'center' }}>
                                    {isEditing ? (
                                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                                        <button 
                                          onClick={() => handleSaveEditGroup(g.id)} 
                                          style={{ 
                                            background: 'none',
                                            border: 'none',
                                            color: '#10b981',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'color 0.2s',
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.color = '#059669'}
                                          onMouseLeave={(e) => e.currentTarget.style.color = '#10b981'}
                                          title="Guardar"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                        </button>
                                        <button 
                                          onClick={() => setEditingGroupId(null)} 
                                          style={{ 
                                            background: 'none',
                                            border: 'none',
                                            color: '#94a3b8',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'color 0.2s',
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.color = '#64748b'}
                                          onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                                          title="Cancelar"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                                        </button>
                                      </div>
                                    ) : (
                                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                                        <button 
                                          onClick={() => handleStartEditGroup(g)} 
                                          style={{ 
                                            background: 'none',
                                            border: 'none',
                                            color: '#475569',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'color 0.2s',
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                                          onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}
                                          title="Editar Grupo"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteGroup(g.id)} 
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
                                          title="Eliminar Grupo"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })}

            </div>
          )}

          {/* TAB 18: GRUPOS DE FAMILIAS (MACRO GRUPOS DE HOGARES) */}
          {activeTab === 18 && (
            <div>
              {!churchUsarGruposFamilia && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>⚠️ El módulo de Grupos de Familias está desactivado en la configuración de la iglesia.</strong>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>Los miembros y líderes no verán esta opción hasta que la actives desde la pestaña 'Mi Iglesia'.</p>
                  </div>
                  <button onClick={() => setActiveTab(1)} style={{ background: '#991b1b', color: 'white', border: 'none', padding: '0.4rem 0.85rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                    Ir a Activar
                  </button>
                </div>
              )}

              <GruposFamiliaAdminSection 
                miembros={miembros} 
                lideres={lideres} 
                etapas={etapas} 
              />
            </div>
          )}

          {/* TAB 3: RUTA DE CRECIMIENTO (ETAPAS Y MAPEO) */}
          {activeTab === 3 && (
            <div>

              {/* Formulario de Nueva Etapa */}
              <div className={styles.configBlock} style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', marginBottom: '1.5rem' }}>
                <h3 className={styles.blockTitle} style={{ fontSize: '1.05rem', marginBottom: '0.75rem', color: '#0f172a' }}>
                  🆕 Crear Nueva Etapa de Crecimiento
                </h3>
                <form onSubmit={handleAddStage} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ flex: '2 1 300px' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.25rem', color: '#475569' }}>
                      Nombre de la Etapa
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ej: Nuevo Convertido, Discipulado I, Servidor..."
                      value={newStageName}
                      onChange={(e) => setNewStageName(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                      required
                    />
                  </div>
                  <div style={{ flex: '1 1 120px' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.25rem', color: '#475569' }}>
                      Orden Secuencial
                    </label>
                    <input 
                      type="number" 
                      placeholder={`Ej: ${etapas.length + 1}`}
                      value={newStageOrder}
                      onChange={(e) => setNewStageOrder(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>
                  <button type="submit" className={styles.btnPrimary} style={{ height: '36px', padding: '0 1.25rem', fontSize: '0.9rem' }}>
                    + Crear Etapa
                  </button>
                </form>
              </div>

              {/* Lista de Etapas */}
              {etapas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', background: '#f8fafc', borderRadius: '8px', color: '#64748b' }}>
                  No hay etapas configuradas. Crea tu primera etapa arriba.
                </div>
              ) : (
                etapas.map(stage => {
                  const procesosVinculados = procesos.filter(p => p.etapa_id === stage.id);
                  const unassignedProcesos = procesos.filter(p => p.etapa_id === null);

                  return (
                    <div key={stage.id} className={styles.configBlock} style={{ borderLeft: '4px solid #0284c7', background: 'white' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {editingStageId === stage.id ? (
                          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>📍 Etapa</span>
                            <input 
                              type="number" 
                              value={editStageOrder} 
                              onChange={(e) => setEditStageOrder(e.target.value)} 
                              style={{ width: '60px', padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} 
                              placeholder="No."
                            />
                            <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>:</span>
                            <input 
                              type="text" 
                              value={editStageName} 
                              onChange={(e) => setEditStageName(e.target.value)} 
                              style={{ width: '220px', padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} 
                              placeholder="Nombre de la etapa"
                            />
                          </div>
                        ) : (
                          <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                            📍 {stage.nombre_etapa}
                          </span>
                        )}
                        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                          {editingStageId === stage.id ? (
                            <>
                              <button 
                                onClick={() => handleSaveEditStage(stage.id)} 
                                style={{ 
                                  background: 'none',
                                  border: 'none',
                                  color: '#10b981',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'color 0.2s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#059669'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#10b981'}
                                title="Guardar"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              </button>
                              <button 
                                onClick={() => setEditingStageId(null)} 
                                style={{ 
                                  background: 'none',
                                  border: 'none',
                                  color: '#94a3b8',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'color 0.2s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#64748b'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                                title="Cancelar"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => handleStartEditStage(stage)} 
                                style={{ 
                                  background: 'none',
                                  border: 'none',
                                  color: '#475569',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'color 0.2s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}
                                title="Editar Etapa"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                              </button>
                              <button 
                                onClick={() => {
                                  setLinkingStageId(linkingStageId === stage.id ? null : stage.id);
                                  setSelectedProcessToLink("");
                                }}
                                style={{ 
                                  background: 'rgba(139, 92, 246, 0.08)', 
                                  border: '1px solid rgba(139, 92, 246, 0.15)', 
                                  color: 'var(--color-spiritual)', 
                                  borderRadius: '12px', 
                                  padding: '0.4rem 0.85rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                  cursor: 'pointer'
                                }}
                              >
                                {linkingStageId === stage.id ? "Cancelar" : "🔗 Vincular Proceso"}
                              </button>
                              <button 
                                onClick={() => handleDeleteStage(stage.id)}
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
                                title="Eliminar Etapa"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Formulario de vinculación inline */}
                      {linkingStageId === stage.id && (
                        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' }}>
                          <h5 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem', color: '#0369a1' }}>
                            Vincular un Proceso Existente del Catálogo a esta Etapa
                          </h5>
                          {unassignedProcesos.length === 0 ? (
                            <p style={{ fontSize: '0.85rem', color: '#0369a1', fontStyle: 'italic' }}>
                              No hay procesos disponibles sin asignar en el catálogo. Primero crea procesos en la pestaña 4.
                            </p>
                          ) : (
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                              <div style={{ flex: 1, minWidth: '250px' }}>
                                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.25rem', color: '#0369a1' }}>
                                    Seleccionar Proceso Libre
                                  </label>
                                  <select 
                                    value={selectedProcessToLink}
                                    onChange={(e) => setSelectedProcessToLink(e.target.value)}
                                    style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: 'white' }}
                                  >
                                    <option value="">-- Seleccionar --</option>
                                    {unassignedProcesos.map(up => {
                                      const modName = modulos.find(m => m.id === up.modulo_id)?.nombre_modulo || "";
                                      return (
                                        <option key={up.id} value={up.id}>
                                          [{modName}] {up.nombre_tarea}
                                        </option>
                                      );
                                    })}
                                  </select>
                              </div>
                              <button 
                                onClick={() => handleLinkProcess(stage.id, selectedProcessToLink)}
                                disabled={!selectedProcessToLink}
                                className={styles.btnPrimary}
                                style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
                              >
                                Confirmar Vinculación
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Procesos vinculados */}
                      {procesosVinculados.length === 0 ? (
                        <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic', padding: '0.5rem 0' }}>
                          No hay procesos vinculados a esta etapa. Haz clic en "Vincular Proceso" para asociar uno del catálogo.
                        </div>
                      ) : (
                        <table className={styles.table} style={{ fontSize: '0.9rem' }}>
                          <thead>
                            <tr>
                              <th>Proceso / Tarea</th>
                              <th>Módulo Responsable</th>
                              <th>Protocolo SLA / Límite</th>
                              <th style={{ width: '120px', textAlign: 'center' }}>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {procesosVinculados.map(proc => {
                              const modName = modulos.find(m => m.id === proc.modulo_id)?.nombre_modulo || "Desconocido";
                              return (
                                <tr key={proc.id}>
                                  <td>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{proc.nombre_tarea}</span>
                                      <span style={{ fontSize: '0.75rem', color: proc.es_obligatoria ? '#059669' : '#64748b' }}>
                                        {proc.es_obligatoria ? "✓ Obligatoria" : "Opcional"}
                                      </span>
                                    </div>
                                  </td>
                                  <td>
                                    <span style={{ background: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '0.8rem' }}>
                                      {modName}
                                    </span>
                                  </td>
                                  <td>
                                    <span style={{ fontWeight: 600, color: proc.dias_limite ? '#ef4444' : '#64748b', fontSize: '0.85rem' }}>
                                      {proc.dias_limite ? `⏱️ Máximo ${proc.dias_limite} días` : '♾️ Sin límite'}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                                      <button 
                                        onClick={() => handleMoveProcessInStage(proc.id, 'up')}
                                        className={styles.btnPrimary}
                                        style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.75rem', padding: '0.3rem 0.5rem' }}
                                        title="Subir"
                                      >
                                        ▲
                                      </button>
                                      <button 
                                        onClick={() => handleMoveProcessInStage(proc.id, 'down')}
                                        className={styles.btnPrimary}
                                        style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.75rem', padding: '0.3rem 0.5rem' }}
                                        title="Bajar"
                                      >
                                        ▼
                                      </button>
                                      <button 
                                        onClick={() => handleUnlinkProcess(proc.id)}
                                        className={styles.btnPrimary}
                                        style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.75rem', padding: '0.3rem 0.6rem', marginLeft: '0.25rem' }}
                                      >
                                        Desvincular
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 4: MÓDULOS DE PROCESOS (CATÁLOGO) */}
          {activeTab === 4 && (
            <div>

              {/* Formulario de Nuevo Módulo */}
              <div className={styles.configBlock} style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', marginBottom: '1.5rem' }}>
                <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem', color: '#1e293b' }}>
                  🆕 Crear Nuevo Módulo de Procesos (Departamento)
                </h4>
                <form onSubmit={handleAddModulo} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <input 
                      type="text" 
                      placeholder="Ej: Consolidación, Escuela Bíblica, Servicio Social..."
                      value={newModuloName}
                      onChange={(e) => setNewModuloName(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                      required
                    />
                  </div>
                  <button type="submit" className={styles.btnPrimary} style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
                    + Crear Módulo
                  </button>
                </form>
              </div>

              {/* Lista de Módulos */}
              {modulos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', background: '#f8fafc', borderRadius: '8px', color: '#64748b' }}>
                  No hay módulos creados. Crea tu primer módulo arriba.
                </div>
              ) : (
                modulos.map((mod, index) => {
                  const procesosDelModulo = procesos.filter(p => p.modulo_id === mod.id);
                  const isExpanded = !!expandedModuloIds[mod.id];
                  const toggleExpanded = () => {
                    setExpandedModuloIds(prev => ({
                      ...prev,
                      [mod.id]: !prev[mod.id]
                    }));
                  };

                  return (
                    <div key={mod.id} className={styles.configBlock} style={{ background: 'white', borderLeft: '4px solid #475569', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isExpanded ? '1px solid #f1f5f9' : 'none', paddingBottom: isExpanded ? '0.75rem' : '0', marginBottom: isExpanded ? '1rem' : '0', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {editingModuloId === mod.id ? (
                          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>📁 Módulo:</span>
                            <input 
                              type="text" 
                              value={editModuloName} 
                              onChange={(e) => setEditModuloName(e.target.value)} 
                              style={{ padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '200px' }} 
                            />
                          </div>
                        ) : (
                          <div 
                            onClick={toggleExpanded}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}
                            title={isExpanded ? "Ocultar procesos" : "Mostrar procesos"}
                          >
                            <span style={{ fontSize: '1.15rem', color: '#64748b', transition: 'transform 0.2s', display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                              ▶
                            </span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                              📁 {mod.nombre_modulo}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                              {procesosDelModulo.length} {procesosDelModulo.length === 1 ? 'proceso' : 'procesos'}
                            </span>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                          {editingModuloId === mod.id ? (
                            <>
                              <button 
                                onClick={() => handleSaveEditModulo(mod.id)} 
                                style={{ 
                                  background: 'none',
                                  border: 'none',
                                  color: '#10b981',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'color 0.2s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#059669'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#10b981'}
                                title="Guardar"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              </button>
                              <button 
                                onClick={() => setEditingModuloId(null)} 
                                style={{ 
                                  background: 'none',
                                  border: 'none',
                                  color: '#94a3b8',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'color 0.2s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#64748b'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                                title="Cancelar"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => handleMoveModulo(mod.id, 'up')}
                                disabled={index === 0}
                                style={{ 
                                  backgroundColor: '#f1f5f9', 
                                  color: '#475569', 
                                  fontSize: '0.75rem', 
                                  padding: '0.35rem 0.55rem', 
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '8px',
                                  cursor: index === 0 ? 'not-allowed' : 'pointer', 
                                  opacity: index === 0 ? 0.35 : 1 
                                }}
                                title="Subir Módulo"
                              >
                                ▲
                              </button>
                              <button 
                                onClick={() => handleMoveModulo(mod.id, 'down')}
                                disabled={index === modulos.length - 1}
                                style={{ 
                                  backgroundColor: '#f1f5f9', 
                                  color: '#475569', 
                                  fontSize: '0.75rem', 
                                  padding: '0.35rem 0.55rem', 
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '8px',
                                  cursor: index === modulos.length - 1 ? 'not-allowed' : 'pointer', 
                                  opacity: index === modulos.length - 1 ? 0.35 : 1 
                                }}
                                title="Bajar Módulo"
                              >
                                ▼
                              </button>
                              <button 
                                onClick={() => handleStartEditModulo(mod)} 
                                style={{ 
                                  background: 'none',
                                  border: 'none',
                                  color: '#475569',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'color 0.2s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}
                                title="Editar Módulo"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                              </button>
                              <button 
                                onClick={() => {
                                  const isOpening = addingProcessModuloId !== mod.id;
                                  setAddingProcessModuloId(isOpening ? mod.id : null);
                                  if (isOpening) {
                                    setExpandedModuloIds(prev => ({ ...prev, [mod.id]: true }));
                                  }
                                  setProcName("");
                                  setProcSla("");
                                  setProcIsMandatory(true);
                                  setProcStageId("");
                                }}
                                style={{ 
                                  background: 'rgba(139, 92, 246, 0.08)', 
                                  border: '1px solid rgba(139, 92, 246, 0.15)', 
                                  color: 'var(--color-spiritual)', 
                                  borderRadius: '12px', 
                                  padding: '0.4rem 0.85rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                  cursor: 'pointer'
                                }}
                              >
                                {addingProcessModuloId === mod.id ? "Cancelar" : "+ Crear Proceso"}
                              </button>
                              <button 
                                onClick={() => handleDeleteModulo(mod.id)}
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
                                title="Eliminar Módulo"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <>
                          {/* Formulario de Nuevo Proceso */}
                          {addingProcessModuloId === mod.id && (
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                              <h5 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem', color: '#334155' }}>
                                Agregar Nuevo Proceso a Módulo: {mod.nombre_modulo}
                              </h5>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.25rem', color: '#64748b' }}>
                                    Nombre del Proceso
                                  </label>
                                  <input 
                                    type="text" 
                                    placeholder="Ej: Llamar a los 3 días"
                                    value={procName}
                                    onChange={(e) => setProcName(e.target.value)}
                                    style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.25rem', color: '#64748b' }}>
                                    Tiempo Límite (Días SLA)
                                  </label>
                                  <input 
                                    type="number" 
                                    placeholder="Ej: 3 (Opcional)"
                                    value={procSla}
                                    onChange={(e) => setProcSla(e.target.value)}
                                    style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                    min="0"
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.25rem', color: '#64748b' }}>
                                    Asignar Inmediatamente a Etapa
                                  </label>
                                  <select 
                                    value={procStageId}
                                    onChange={(e) => setProcStageId(e.target.value)}
                                    style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: 'white' }}
                                  >
                                    <option value="">-- Dejar sin asignar --</option>
                                    {etapas.map(et => (
                                      <option key={et.id} value={et.id}>{et.nombre_etapa}</option>
                                    ))}
                                  </select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: '1.25rem' }}>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', color: '#475569' }}>
                                    <input 
                                      type="checkbox" 
                                      checked={procIsMandatory}
                                      onChange={(e) => setProcIsMandatory(e.target.checked)}
                                      style={{ width: '14px', height: '14px' }}
                                    />
                                    ¿Es obligatoria?
                                  </label>
                                </div>
                              </div>

                              <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.4rem', color: '#475569' }}>
                                  📋 Tareas de Seguimiento para el Líder (Una por línea. Formato: Nombre de la Tarea | Días Límite - Opcional)
                                </label>
                                <textarea
                                  rows={3}
                                  placeholder="Ej:&#10;Llamar para coordinar fecha | 3&#10;Entregar folleto introductorio | 7&#10;Confirmar asistencia al grupo | 14"
                                  value={procSubtasksText}
                                  onChange={(e) => setProcSubtasksText(e.target.value)}
                                  style={{ width: '100%', padding: '0.5rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical' }}
                                />
                                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                                  Escribe cada tarea de seguimiento en una línea. Si agregas `|` seguido de un número de días (ej: `| 3`), esa tarea de seguimiento específica tendrá un reloj de SLA asignado de forma independiente.
                                </p>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button 
                                  type="button"
                                  className={styles.btnPrimary} 
                                  onClick={() => {
                                    setAddingProcessModuloId(null);
                                    setProcSubtasksText("");
                                  }}
                                  style={{ backgroundColor: '#e2e8f0', color: '#334155', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                                >
                                  Cancelar
                                </button>
                                <button 
                                  type="button"
                                  className={styles.btnPrimary} 
                                  onClick={() => handleAddProcess(mod.id)}
                                  disabled={!procName.trim()}
                                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                                >
                                  Guardar Proceso
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Procesos registrados */}
                          {procesosDelModulo.length === 0 ? (
                            <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic', padding: '0.5rem 0' }}>
                              No hay procesos registrados en este módulo. Haz clic en "+ Crear Proceso" para empezar.
                            </div>
                          ) : (
                            <table className={styles.table} style={{ fontSize: '0.9rem' }}>
                              <thead>
                                <tr>
                                  <th>Proceso</th>
                                  <th>SLA / Protocolo</th>
                                  <th>Asignado a Etapa</th>
                                  <th style={{ width: '150px', textAlign: 'center' }}>Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {procesosDelModulo.map((proc, index) => {
                                  const stageLink = etapas.find(e => e.id === proc.etapa_id);
                                  const isEditing = editingProcessId === proc.id;

                                  return (
                                    <tr key={proc.id}>
                                      <td>
                                        {isEditing ? (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                            <input 
                                              type="text" 
                                              value={editProcessName} 
                                              onChange={(e) => setEditProcessName(e.target.value)} 
                                              style={{ padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem', width: '100%' }} 
                                            />
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', cursor: 'pointer', color: '#475569' }}>
                                              <input 
                                                type="checkbox" 
                                                checked={editProcessIsMandatory} 
                                                onChange={(e) => setEditProcessIsMandatory(e.target.checked)} 
                                              />
                                              ¿Es obligatoria?
                                            </label>

                                            <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>
                                                📋 Pasos de Seguimiento para el Líder:
                                              </span>
                                              {editProcessSubtasks.map((sub, sIdx) => (
                                                <div key={sub.id || sIdx} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                                                  <input 
                                                    type="text" 
                                                    value={sub.nombre_subtarea} 
                                                    onChange={(e) => {
                                                      const newSubs = [...editProcessSubtasks];
                                                      newSubs[sIdx].nombre_subtarea = e.target.value;
                                                      setEditProcessSubtasks(newSubs);
                                                    }} 
                                                    placeholder="Nombre del paso" 
                                                    style={{ flex: 1, padding: '0.25rem 0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }} 
                                                  />
                                                  <input 
                                                    type="number" 
                                                    value={sub.dias_limite !== null && sub.dias_limite !== undefined ? String(sub.dias_limite) : ""} 
                                                    onChange={(e) => {
                                                      const newSubs = [...editProcessSubtasks];
                                                      newSubs[sIdx].dias_limite = e.target.value ? parseInt(e.target.value) : null;
                                                      setEditProcessSubtasks(newSubs);
                                                    }} 
                                                    placeholder="SLA" 
                                                    style={{ width: '45px', padding: '0.25rem 0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }} 
                                                    min="0"
                                                  />
                                                  <button 
                                                    type="button" 
                                                    onClick={() => {
                                                      const newSubs = editProcessSubtasks.filter((_, idx) => idx !== sIdx);
                                                      setEditProcessSubtasks(newSubs);
                                                    }} 
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
                                                    title="Eliminar paso"
                                                  >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                                  </button>
                                                </div>
                                              ))}
                                              <button 
                                                type="button" 
                                                onClick={() => setEditProcessSubtasks([...editProcessSubtasks, { nombre_subtarea: "", dias_limite: null }])} 
                                                style={{ background: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: '4px', color: '#475569', fontSize: '0.75rem', padding: '2px 8px', cursor: 'pointer', width: '100%', marginTop: '0.25rem', fontWeight: 600 }}
                                              >
                                                + Agregar paso
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 600, color: '#1e293b' }}>{proc.nombre_tarea}</span>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.2rem' }}>
                                              <span style={{ fontSize: '0.75rem', color: proc.es_obligatoria ? '#059669' : '#64748b' }}>
                                                {proc.es_obligatoria ? "✓ Obligatorio" : "Opcional"}
                                              </span>
                                              {proc.subtareas && proc.subtareas.length > 0 && (
                                                <div style={{ marginTop: '0.35rem', paddingLeft: '0.6rem', borderLeft: '2px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                                  {proc.subtareas.map((sub: any, sIdx: number) => (
                                                    <div key={sub.id || sIdx} style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', gap: '0.4rem' }}>
                                                      <span>• {sub.nombre_subtarea}</span>
                                                      {sub.dias_limite && (
                                                        <span style={{ color: '#ef4444', fontWeight: 600 }}>(⏱️ {sub.dias_limite}d)</span>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </td>
                                      <td>
                                        {isEditing ? (
                                          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                            <input 
                                              type="number" 
                                              value={editProcessSla} 
                                              onChange={(e) => setEditProcessSla(e.target.value)} 
                                              style={{ padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem', width: '60px' }} 
                                              placeholder="SLA"
                                              min="0"
                                            />
                                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>días</span>
                                          </div>
                                        ) : (
                                          <span style={{ fontWeight: 600, color: proc.dias_limite ? '#ef4444' : '#64748b', fontSize: '0.85rem' }}>
                                            {proc.dias_limite ? `⏱️ Max ${proc.dias_limite}d` : '♾️ Sin límite'}
                                          </span>
                                        )}
                                      </td>
                                      <td>
                                        {stageLink ? (
                                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                                              📍 {stageLink.nombre_etapa.split(":")[0]}
                                            </span>
                                            <button 
                                              onClick={() => handleUnlinkProcess(proc.id)}
                                              style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                                            >
                                              Desvincular
                                            </button>
                                          </span>
                                        ) : (
                                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>⚪ Sin etapa</span>
                                            <select 
                                              onChange={(e) => handleLinkProcess(e.target.value, proc.id)}
                                              defaultValue=""
                                              style={{ padding: '2px 5px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                            >
                                              <option value="" disabled>Asignar a...</option>
                                              {etapas.map(et => (
                                                <option key={et.id} value={et.id}>{et.nombre_etapa.split(":")[0]}</option>
                                              ))}
                                            </select>
                                          </span>
                                        )}
                                      </td>
                                      <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                                          {isEditing ? (
                                            <>
                                              <button 
                                                onClick={() => handleSaveEditProcess(proc.id)} 
                                                style={{ 
                                                  background: 'none',
                                                  border: 'none',
                                                  color: '#10b981',
                                                  cursor: 'pointer',
                                                  padding: '4px',
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  transition: 'color 0.2s',
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = '#059669'}
                                                onMouseLeave={(e) => e.currentTarget.style.color = '#10b981'}
                                                title="Guardar"
                                              >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                              </button>
                                              <button 
                                                onClick={() => setEditingProcessId(null)} 
                                                style={{ 
                                                  background: 'none',
                                                  border: 'none',
                                                  color: '#94a3b8',
                                                  cursor: 'pointer',
                                                  padding: '4px',
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  transition: 'color 0.2s',
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = '#64748b'}
                                                onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                                                title="Cancelar"
                                              >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                                              </button>
                                            </>
                                          ) : (
                                            <>
                                              <button 
                                                onClick={() => handleStartEditProcess(proc)} 
                                                style={{ 
                                                  background: 'none',
                                                  border: 'none',
                                                  color: '#475569',
                                                  cursor: 'pointer',
                                                  padding: '4px',
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  transition: 'color 0.2s',
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                                                onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}
                                                title="Editar proceso"
                                              >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                              </button>
                                              <button 
                                                onClick={() => handleMoveProcess(proc.id, 'up')}
                                                disabled={index === 0}
                                                style={{ 
                                                  background: '#f1f5f9', 
                                                  color: '#475569', 
                                                  fontSize: '0.75rem', 
                                                  padding: '0.3rem 0.5rem', 
                                                  border: '1px solid #cbd5e1',
                                                  borderRadius: '8px',
                                                  cursor: index === 0 ? 'not-allowed' : 'pointer', 
                                                  opacity: index === 0 ? 0.35 : 1 
                                                }}
                                                title="Subir orden"
                                              >
                                                ▲
                                              </button>
                                              <button 
                                                onClick={() => handleMoveProcess(proc.id, 'down')}
                                                disabled={index === procesosDelModulo.length - 1}
                                                style={{ 
                                                  background: '#f1f5f9', 
                                                  color: '#475569', 
                                                  fontSize: '0.75rem', 
                                                  padding: '0.3rem 0.5rem', 
                                                  border: '1px solid #cbd5e1',
                                                  borderRadius: '8px',
                                                  cursor: index === procesosDelModulo.length - 1 ? 'not-allowed' : 'pointer', 
                                                  opacity: index === procesosDelModulo.length - 1 ? 0.35 : 1 
                                                }}
                                                title="Bajar orden"
                                              >
                                                ▼
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
  </tbody>
                            </table>
                          )}
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 5: CONSOLA DE LIDERAZGO Y PERMISOS (ACUMULATIVO POR ÁREAS) */}
          {activeTab === 5 && (
            <div>
              {/* Header de Liderazgo */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                  
                  {/* Sumatoria de Líderes Únicos */}
                  <div style={{ 
                    backgroundColor: '#e0f2fe', 
                    border: '1px solid #bae6fd', 
                    borderRadius: '10px', 
                    padding: '0.5rem 1rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.6rem',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <span style={{ fontSize: '1.4rem' }}>👥</span>
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Líderes Únicos</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0369a1', lineHeight: '1' }}>
                        {usuarios.filter(u => u.directivas && u.directivas.some((d: any) => ["CUERPO_OFICIAL", "SOCIEDAD", "GRUPO_CONEXION", "DEPARTAMENTO", "MINISTERIO", "INSTITUCION"].includes(d.alcance_tipo))).length}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    onClick={() => setShowPromoteModal(true)} 
                    className={styles.btnPrimary}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
                  >
                    👤 Promover Líder
                  </button>
                  <button 
                    onClick={() => {
                      setEditLabelCuerpoOficial(liderazgoLabels.label_cuerpo_oficial || "Cuerpo Oficial");
                      setEditLabelSociedades(liderazgoLabels.label_sociedades || "Sociedades");
                      setEditLabelGruposConexion(liderazgoLabels.label_grupos_conexion || "Grupos de Conexión");
                      setEditLabelDepartamentos(liderazgoLabels.label_departamentos || "Departamentos");
                      setEditLabelMinisterios(liderazgoLabels.label_ministerios || "Ministerios");
                      setEditLabelInstituciones(liderazgoLabels.label_instituciones || "Instituciones");
                      setActiveLiderazgoSubTab("labels");
                    }} 
                    className={styles.btnSecondary}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
                  >
                    ⚙️ Personalizar Nombres
                  </button>
                </div>
              </div>

              {/* Selector de Sub-Tablas */}
              <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                <button 
                  onClick={() => setActiveLiderazgoSubTab("list")}
                  className={styles.tabBtn}
                  style={{
                    border: 'none',
                    background: activeLiderazgoSubTab === "list" ? '#0284c7' : 'transparent',
                    color: activeLiderazgoSubTab === "list" ? 'white' : '#475569',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  👥 Estructura de Liderazgo (Vista de Áreas)
                </button>
                <button 
                  onClick={() => setActiveLiderazgoSubTab("setup")}
                  className={styles.tabBtn}
                  style={{
                    border: 'none',
                    background: activeLiderazgoSubTab === "setup" ? '#0284c7' : 'transparent',
                    color: activeLiderazgoSubTab === "setup" ? 'white' : '#475569',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  💼 Configurar Grupos (Directivas)
                </button>
              </div>

              {/* SUB TAB 1: ESTRUCTURA DE LIDERAZGO CLASIFICADA */}
              {activeLiderazgoSubTab === "list" && (
                <div>
                  <div className={styles.configBlock} style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                    <input 
                      type="text"
                      placeholder="🔍 Buscar líder en la estructura por nombre..."
                      value={liderSearchTerm}
                      onChange={(e) => setLiderSearchTerm(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>

                  {(() => {
                    // Agrupador Dinámico por las 6 Categorías
                    const getLeadersByCategory = (categoryKey: string) => {
                      return usuarios.filter(u => {
                        const matchesSearch = (u.persona?.nombre || u.email).toLowerCase().includes(liderSearchTerm.toLowerCase());
                        if (!matchesSearch) return false;

                        // Filtrar en base a directivas o grupos de trabajo
                        if (categoryKey === "CUERPO_OFICIAL") {
                          return u.directivas.some((d: any) => d.alcance_tipo === "CUERPO_OFICIAL");
                        } else if (categoryKey === "SOCIEDAD") {
                          return u.directivas.some((d: any) => d.alcance_tipo === "SOCIEDAD");
                        } else if (categoryKey === "GRUPO_CONEXION") {
                          return u.directivas.some((d: any) => d.alcance_tipo === "GRUPO_CONEXION");
                        } else if (categoryKey === "DEPARTAMENTO") {
                          return u.directivas.some((d: any) => d.alcance_tipo === "DEPARTAMENTO");
                        } else if (categoryKey === "MINISTERIO") {
                          return u.directivas.some((d: any) => d.alcance_tipo === "MINISTERIO");
                        } else if (categoryKey === "INSTITUCION") {
                          return u.directivas.some((d: any) => d.alcance_tipo === "INSTITUCION");
                        }
                        return false;
                      });
                    };

                    const categories = [
                      { key: "CUERPO_OFICIAL", label: liderazgoLabels.label_cuerpo_oficial || "Cuerpo Oficial", color: "#db2777" },
                      { key: "SOCIEDAD", label: liderazgoLabels.label_sociedades || "Sociedades", color: "#7c3aed" },
                      { key: "GRUPO_CONEXION", label: liderazgoLabels.label_grupos_conexion || "Grupos de Conexión", color: "#0ea5e9" },
                      { key: "DEPARTAMENTO", label: liderazgoLabels.label_departamentos || "Departamentos", color: "#10b981" },
                      { key: "MINISTERIO", label: liderazgoLabels.label_ministerios || "Ministerios", color: "#f59e0b" },
                      { key: "INSTITUCION", label: liderazgoLabels.label_instituciones || "Instituciones", color: "#64748b" }
                    ];

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {categories.map(cat => {
                          const leaders = getLeadersByCategory(cat.key);
                          
                          return (
                            <div key={cat.key} className={styles.configBlock} style={{ padding: '1.25rem', borderLeft: `5px solid ${cat.color}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cat.color }} />
                                  {cat.label}
                                  <span style={{ fontSize: '0.8rem', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '10px', marginLeft: '0.5rem', fontWeight: 600 }}>
                                    {leaders.length}
                                  </span>
                                </h3>
                              </div>

                              {leaders.length === 0 ? (
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', padding: '0.5rem 0' }}>
                                  No hay líderes registrados en esta área.
                                </p>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                  {leaders.map(u => {
                                    const nombre = u.persona?.nombre || u.email.split("@")[0];
                                    const avatar = nombre.charAt(0).toUpperCase();

                                    // Filtrar directivas del usuario que pertenecen a esta categoría específica
                                    const activeDirs = u.directivas.filter((d: any) => d.alcance_tipo === cat.key);

                                    return (
                                      <div 
                                        key={`${u.id}-${cat.key}`} 
                                        style={{ 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          justifyContent: 'space-between', 
                                          padding: '0.6rem 0.75rem', 
                                          background: '#f8fafc', 
                                          borderRadius: '8px', 
                                          border: '1px solid #e2e8f0',
                                          gap: '1rem',
                                          flexWrap: 'wrap'
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '200px' }}>
                                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${cat.color}15`, color: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                            {avatar}
                                          </div>
                                          <div>
                                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a', display: 'block' }}>{nombre}</span>
                                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{u.email}</span>
                                          </div>
                                        </div>

                                        {/* Roles específicos en esta categoría */}
                                        <div style={{ flex: 1, display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                          {activeDirs.map((d: any) => (
                                            <span 
                                              key={d.id} 
                                              style={{ 
                                                fontSize: '0.72rem', 
                                                background: 'white', 
                                                color: '#334155', 
                                                border: '1px solid #cbd5e1', 
                                                padding: '2px 8px', 
                                                borderRadius: '6px',
                                                fontWeight: 600
                                              }}
                                            >
                                              {d.alcance_tipo === "GLOBAL" ? "Global" : d.alcance_tipo === "SOCIEDAD" ? d.sociedad_nombre : d.alcance_tipo === "GRUPO_CONEXION" ? d.grupo_conexion_nombre : (d.grupo_trabajo_nombre || d.sociedad_nombre || d.grupo_conexion_nombre || "Área")} {d.modulo_nombre ? `(${d.modulo_nombre})` : ''}
                                            </span>
                                          ))}
                                        </div>

                                        {/* Acciones */}
                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                          <button
                                            onClick={() => {
                                              setManageUsuarioId(u.id);
                                              setManageRol(u.rol);
                                              setManageEstado(u.estado);
                                              const currentPerms = u.paginas_acceso 
                                                ? u.paginas_acceso.split(",").map((p: string) => parseInt(p)).filter((n: number) => !isNaN(n))
                                                : [];
                                              setManageTabPermissions(currentPerms);
                                              setShowManageUserModal(true);
                                            }}
                                            style={{ 
                                              background: 'none',
                                              border: 'none',
                                              color: '#475569',
                                              cursor: 'pointer',
                                              padding: '4px',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              transition: 'color 0.2s',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}
                                            title="Gestionar Cuenta / Permisos"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                          </button>
                                          <button
                                            onClick={() => {
                                              if (cat.key === "SOCIEDAD" || cat.key === "GRUPO_CONEXION") {
                                                const targetDir = activeDirs[0];
                                                if (targetDir) handleRemoveLiderDirectiva(targetDir.id);
                                              } else {
                                                // Es un Grupo de Trabajo
                                                const group = liderazgoGrupos.find(g => g.tipo === cat.key && g.miembros.some((m: any) => m.usuario_id === u.id));
                                                const memberRecord = group?.miembros.find((m: any) => m.usuario_id === u.id);
                                                if (memberRecord) handleRemoveMiembroGrupo(memberRecord.id);
                                              }
                                            }}
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
                                            title="Quitar Líder"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* SUB TAB 2: CONFIGURACIÓN DE GRUPOS DE TRABAJO (WORKSPACE DIRECTIVAS) */}
              {activeLiderazgoSubTab === "setup" && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                      💼 Departamentos y Grupos Colaborativos
                    </h3>
                    <button 
                      onClick={() => setShowCreateGroupModal(true)} 
                      className={styles.btnPrimary}
                      style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                    >
                      ➕ Crear Nuevo Grupo/Departamento
                    </button>
                  </div>

                  {liderazgoGrupos.length === 0 ? (
                    <div className={styles.configBlock} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                      <span style={{ fontSize: '2.5rem' }}>💼</span>
                      <h4 style={{ margin: '1rem 0 0.25rem 0', color: '#334155' }}>No hay departamentos creados</h4>
                      <p style={{ fontSize: '0.85rem', margin: 0 }}>Crea un departamento para habilitar su espacio de trabajo y agregar su directiva.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                      {liderazgoGrupos.map(group => {
                        let groupTypeLabel = "Departamento";
                        let typeColor = "#10b981";
                        if (group.tipo === "CUERPO_OFICIAL") {
                          groupTypeLabel = liderazgoLabels.label_cuerpo_oficial || "Cuerpo Oficial";
                          typeColor = "#db2777";
                        } else if (group.tipo === "MINISTERIO") {
                          groupTypeLabel = liderazgoLabels.label_ministerios || "Ministerio";
                          typeColor = "#f59e0b";
                        } else if (group.tipo === "INSTITUCION") {
                          groupTypeLabel = liderazgoLabels.label_instituciones || "Institución";
                          typeColor = "#64748b";
                        } else {
                          groupTypeLabel = liderazgoLabels.label_departamentos || "Departamento";
                        }

                        return (
                          <div 
                            key={group.id} 
                            className={styles.configBlock}
                            style={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              justifyContent: 'space-between',
                              borderTop: `4px solid ${typeColor}`, 
                              padding: '1.25rem',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}
                          >
                            <div>
                              {/* Header del Grupo */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
                                  {group.nombre}
                                </h4>
                                <span style={{ fontSize: '0.68rem', backgroundColor: `${typeColor}15`, color: typeColor, padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                                  {groupTypeLabel}
                                </span>
                              </div>
                              {group.descripcion && (
                                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 1rem 0' }}>{group.descripcion}</p>
                              )}

                              {/* Directivos del Grupo */}
                              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginBottom: '1.25rem' }}>
                                <strong style={{ fontSize: '0.78rem', color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                                  Directiva Asignada ({group.miembros.length}):
                                </strong>

                                {group.miembros.length === 0 ? (
                                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                    ⚠️ Sin directivos asignados.
                                  </p>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                    {group.miembros.map((mb: any) => (
                                      <div 
                                        key={mb.id} 
                                        style={{ 
                                          display: 'flex', 
                                          justifyContent: 'space-between', 
                                          alignItems: 'center', 
                                          padding: '0.25rem 0.5rem', 
                                          background: '#f8fafc', 
                                          borderRadius: '4px',
                                          fontSize: '0.75rem',
                                          border: '1px solid #e2e8f0'
                                        }}
                                      >
                                        <span style={{ fontWeight: 600, color: '#1e293b' }}>
                                          👑 {mb.usuario.persona?.nombre || mb.usuario.email.split("@")[0]} ({mb.puesto})
                                        </span>
                                        <button 
                                          onClick={() => handleRemoveMiembroGrupo(mb.id)}
                                          style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                                          title="Remover directivo"
                                        >
                                          &times;
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Botones de Acción */}
                            <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginTop: 'auto' }}>
                              <button
                                onClick={() => {
                                  setSelectedGrupoTrabajoId(group.id);
                                  setShowAddMiembroGroupModal(true);
                                }}
                                className={styles.btnPrimary}
                                style={{ flex: 1, fontSize: '0.78rem', padding: '0.4rem', backgroundColor: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                              >
                                ➕ Directivo
                              </button>
                              <Link
                                href={`/liderazgo-grupo?id=${group.id}`}
                                className={styles.btnSecondary}
                                style={{ flex: 1, fontSize: '0.78rem', padding: '0.4rem', textDecoration: 'none', textAlign: 'center', borderRadius: '6px', fontWeight: 600 }}
                              >
                                🚪 Workspace
                              </Link>
                              <button
                                onClick={() => handleDeleteGrupoTrabajo(group.id)}
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
                                title="Eliminar este grupo de trabajo"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SUB TAB 3: PERSONALIZAR NOMBRES DE CATEGORÍAS */}
              {activeLiderazgoSubTab === "labels" && (
                <div className={styles.configBlock} style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                    ⚙️ Personalizar Nombres de Áreas de Liderazgo
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>
                    Ajusta los nombres de las categorías para adaptarlos a la jerga y estructura organizativa de tu iglesia local (ej. cambiar "Cuerpo Oficial" por "Consistorio" o "Junta").
                  </p>

                  <form onSubmit={handleUpdateLiderazgoLabels} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Cuerpo Oficial</label>
                        <input 
                          type="text" 
                          value={editLabelCuerpoOficial} 
                          onChange={(e) => setEditLabelCuerpoOficial(e.target.value)} 
                          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          required
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Sociedades</label>
                        <input 
                          type="text" 
                          value={editLabelSociedades} 
                          onChange={(e) => setEditLabelSociedades(e.target.value)} 
                          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Grupos de Conexión</label>
                        <input 
                          type="text" 
                          value={editLabelGruposConexion} 
                          onChange={(e) => setEditLabelGruposConexion(e.target.value)} 
                          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          required
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Departamentos</label>
                        <input 
                          type="text" 
                          value={editLabelDepartamentos} 
                          onChange={(e) => setEditLabelDepartamentos(e.target.value)} 
                          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Ministerios</label>
                        <input 
                          type="text" 
                          value={editLabelMinisterios} 
                          onChange={(e) => setEditLabelMinisterios(e.target.value)} 
                          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          required
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Instituciones</label>
                        <input 
                          type="text" 
                          value={editLabelInstituciones} 
                          onChange={(e) => setEditLabelInstituciones(e.target.value)} 
                          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button 
                        type="button" 
                        onClick={() => setActiveLiderazgoSubTab("list")} 
                        className={styles.btnSecondary}
                        style={{ padding: '0.5rem 1rem' }}
                      >
                        Volver
                      </button>
                      <button 
                        type="submit" 
                        className={styles.btnPrimary}
                        style={{ padding: '0.5rem 1.25rem' }}
                      >
                        💾 Guardar Nombres
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* MODAL 1: PROMOVER A NUEVO LÍDER */}
              {showPromoteModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}>
                  <div style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '480px', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)', margin: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10, paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>👤 Promover Nuevo Líder</h3>
                      <button onClick={() => setShowPromoteModal(false)} style={{ border: 'none', background: 'transparent', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                    </div>

                    <form onSubmit={handlePromoteNewLider} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Seleccionar Persona/Miembro</label>
                        <select 
                          value={promoteMemberName} 
                          onChange={(e) => setPromoteMemberName(e.target.value)} 
                          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}
                          required
                        >
                          <option value="">Selecciona un miembro...</option>
                          {miembros.filter(m => !usuarios.some(u => u.persona?.id === m.id && (u.rol === 'LIDER' || u.rol === 'ADMIN_IGLESIA' || u.rol === 'SUPERADMIN'))).map(m => (
                            <option key={m.id} value={m.nombre}>{m.nombre}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Rol de Sistema</label>
                        <select 
                          value={promoteRol} 
                          onChange={(e) => setPromoteRol(e.target.value)} 
                          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}
                        >
                          <option value="LIDER">🔑 Líder de Área / Directiva</option>
                          <option value="ADMIN_IGLESIA">🛡️ Administrador del Sistema</option>
                          <option value="SUPERADMIN">👑 Super Administrador</option>
                        </select>
                      </div>

                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                        <strong style={{ fontSize: '0.85rem', color: '#1e293b', display: 'block', marginBottom: '0.5rem' }}>Asignar Primera Función/Directiva:</strong>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Alcance</label>
                            <select 
                              value={selectedAlcance} 
                              onChange={(e) => setSelectedAlcance(e.target.value)} 
                              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}
                            >
                              <option value="GLOBAL">Global (Toda la Iglesia)</option>
                              <option value="SOCIEDAD">{liderazgoLabels.label_sociedades || "Sociedad"}</option>
                              <option value="GRUPO_CONEXION">{liderazgoLabels.label_grupos_conexion || "Grupo de Conexión"}</option>
                              <option value="CUERPO_OFICIAL">{liderazgoLabels.label_cuerpo_oficial || "Cuerpo Oficial"}</option>
                              <option value="DEPARTAMENTO">{liderazgoLabels.label_departamentos || "Departamento"}</option>
                              <option value="MINISTERIO">{liderazgoLabels.label_ministerios || "Ministerio"}</option>
                              <option value="INSTITUCION">{liderazgoLabels.label_instituciones || "Institución"}</option>
                            </select>
                          </div>

                          {selectedAlcance === "SOCIEDAD" && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Seleccionar Sociedad</label>
                              <select 
                                value={selectedSocId} 
                                onChange={(e) => setSelectedSocId(e.target.value)} 
                                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}
                                required
                              >
                                <option value="">Selecciona...</option>
                                {sociedades.map(s => (
                                  <option key={s.id} value={s.id}>{s.nombre_sociedad}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {selectedAlcance === "GRUPO_CONEXION" && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Seleccionar Grupo de Conexión</label>
                              <select 
                                value={selectedGcId} 
                                onChange={(e) => setSelectedGcId(e.target.value)} 
                                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}
                                required
                              >
                                <option value="">Selecciona...</option>
                                {gruposConexion.map(g => {
                                  const sName = sociedades.find(s => s.id === g.sociedad_id)?.nombre_sociedad || "Sociedad";
                                  return (
                                    <option key={g.id} value={g.id}>{g.nombre_grupo} ({sName})</option>
                                  );
                                })}
                              </select>
                            </div>
                          )}

                          {["CUERPO_OFICIAL", "DEPARTAMENTO", "MINISTERIO", "INSTITUCION"].includes(selectedAlcance) && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                                Seleccionar {selectedAlcance === "CUERPO_OFICIAL" ? (liderazgoLabels.label_cuerpo_oficial || "Cuerpo Oficial") : selectedAlcance === "DEPARTAMENTO" ? (liderazgoLabels.label_departamentos || "Departamento") : selectedAlcance === "MINISTERIO" ? (liderazgoLabels.label_ministerios || "Ministerio") : (liderazgoLabels.label_instituciones || "Institución")}
                              </label>
                              <select 
                                value={promoteGrupoTrabajoId} 
                                onChange={(e) => setPromoteGrupoTrabajoId(e.target.value)} 
                                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}
                                required
                              >
                                <option value="">Selecciona...</option>
                                {liderazgoGrupos.filter((g: any) => g.tipo === selectedAlcance).map((g: any) => (
                                  <option key={g.id} value={g.id}>{g.nombre}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Módulos del Proceso Autorizados</label>
                            <div style={{ maxHeight: '100px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
                                <input 
                                  type="checkbox" 
                                  id="new-mod-all"
                                  checked={selectedModuloIds.includes("all")}
                                  onChange={(e) => setSelectedModuloIds(e.target.checked ? ["all"] : [])}
                                />
                                <label htmlFor="new-mod-all" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Todos los Módulos (Líder General)</label>
                              </div>
                              {modulos.map(m => (
                                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
                                  <input 
                                    type="checkbox" 
                                    id={`new-mod-${m.id}`}
                                    checked={selectedModuloIds.includes(m.id)}
                                    onChange={(e) => {
                                      if (selectedModuloIds.includes("all")) {
                                        setSelectedModuloIds([m.id]);
                                      } else {
                                        setSelectedModuloIds(e.target.checked ? [...selectedModuloIds, m.id] : selectedModuloIds.filter(id => id !== m.id));
                                      }
                                    }}
                                  />
                                  <label htmlFor={`new-mod-${m.id}`} style={{ fontSize: '0.8rem' }}>{m.nombre_modulo}</label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Pestañas de Administración Autorizadas</label>
                            <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {allTabs.map(tab => (
                                <div key={tab.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <input 
                                    type="checkbox" 
                                    id={`promote-tab-${tab.id}`}
                                    checked={promoteTabPermissions.includes(tab.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setPromoteTabPermissions([...promoteTabPermissions, tab.id]);
                                      } else {
                                        setPromoteTabPermissions(promoteTabPermissions.filter(id => id !== tab.id));
                                      }
                                    }}
                                  />
                                  <label htmlFor={`promote-tab-${tab.id}`} style={{ fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                    {tab.icon && <img src={tab.icon} alt="" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />}
                                    {tab.label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <button type="submit" className={styles.btnPrimary} style={{ width: '100%', padding: '0.6rem', marginTop: '0.5rem' }}>
                        💾 Promover a Líder
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL 2: AGREGAR NUEVA DIRECTIVA A LÍDER EXISTENTE */}
              {showAddDirectiveModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}>
                  <div style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '450px', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)', margin: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10, paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>➕ Agregar Nueva Directiva / Función</h3>
                      <button onClick={() => setShowAddDirectiveModal(false)} style={{ border: 'none', background: 'transparent', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                    </div>

                    <form onSubmit={handleAddLiderDirectiva} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Líder</label>
                        <div style={{ padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold', fontSize: '0.85rem' }}>
                          👤 {usuarios.find(u => u.id === targetUsuarioId)?.persona?.nombre || 'Líder Seleccionado'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Alcance</label>
                        <select 
                          value={selectedAlcance} 
                          onChange={(e) => setSelectedAlcance(e.target.value)} 
                          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}
                        >
                          <option value="GLOBAL">Global (Toda la Iglesia)</option>
                          <option value="SOCIEDAD">{liderazgoLabels.label_sociedades || "Sociedad"}</option>
                          <option value="GRUPO_CONEXION">{liderazgoLabels.label_grupos_conexion || "Grupo de Conexión"}</option>
                          <option value="CUERPO_OFICIAL">{liderazgoLabels.label_cuerpo_oficial || "Cuerpo Oficial"}</option>
                          <option value="DEPARTAMENTO">{liderazgoLabels.label_departamentos || "Departamento"}</option>
                          <option value="MINISTERIO">{liderazgoLabels.label_ministerios || "Ministerio"}</option>
                          <option value="INSTITUCION">{liderazgoLabels.label_instituciones || "Institución"}</option>
                        </select>
                      </div>

                      {selectedAlcance === "SOCIEDAD" && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Seleccionar Sociedad</label>
                          <select 
                            value={selectedSocId} 
                            onChange={(e) => setSelectedSocId(e.target.value)} 
                            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}
                            required
                          >
                            <option value="">Selecciona...</option>
                            {sociedades.map(s => (
                              <option key={s.id} value={s.id}>{s.nombre_sociedad}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {selectedAlcance === "GRUPO_CONEXION" && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Seleccionar Grupo de Conexión</label>
                          <select 
                            value={selectedGcId} 
                            onChange={(e) => setSelectedGcId(e.target.value)} 
                            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}
                            required
                          >
                            <option value="">Selecciona...</option>
                            {gruposConexion.map(g => {
                              const sName = sociedades.find(s => s.id === g.sociedad_id)?.nombre_sociedad || "Sociedad";
                              return (
                                <option key={g.id} value={g.id}>{g.nombre_grupo} ({sName})</option>
                              );
                            })}
                          </select>
                        </div>
                      )}

                      {["CUERPO_OFICIAL", "DEPARTAMENTO", "MINISTERIO", "INSTITUCION"].includes(selectedAlcance) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                            Seleccionar {selectedAlcance === "CUERPO_OFICIAL" ? (liderazgoLabels.label_cuerpo_oficial || "Cuerpo Oficial") : selectedAlcance === "DEPARTAMENTO" ? (liderazgoLabels.label_departamentos || "Departamento") : selectedAlcance === "MINISTERIO" ? (liderazgoLabels.label_ministerios || "Ministerio") : (liderazgoLabels.label_instituciones || "Institución")}
                          </label>
                          <select 
                            value={promoteGrupoTrabajoId} 
                            onChange={(e) => setPromoteGrupoTrabajoId(e.target.value)} 
                            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}
                            required
                          >
                            <option value="">Selecciona...</option>
                            {liderazgoGrupos.filter((g: any) => g.tipo === selectedAlcance).map((g: any) => (
                              <option key={g.id} value={g.id}>{g.nombre}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Módulos Autorizados</label>
                        <div style={{ maxHeight: '100px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
                            <input 
                              type="checkbox" 
                              id="dir-mod-all"
                              checked={selectedModuloIds.includes("all")}
                              onChange={(e) => setSelectedModuloIds(e.target.checked ? ["all"] : [])}
                            />
                            <label htmlFor="dir-mod-all" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Todos los Módulos (Líder General)</label>
                          </div>
                          {modulos.map(m => (
                            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
                              <input 
                                type="checkbox" 
                                id={`dir-mod-${m.id}`}
                                checked={selectedModuloIds.includes(m.id)}
                                onChange={(e) => {
                                  if (selectedModuloIds.includes("all")) {
                                    setSelectedModuloIds([m.id]);
                                  } else {
                                    setSelectedModuloIds(e.target.checked ? [...selectedModuloIds, m.id] : selectedModuloIds.filter(id => id !== m.id));
                                  }
                                }}
                              />
                              <label htmlFor={`dir-mod-${m.id}`} style={{ fontSize: '0.8rem' }}>{m.nombre_modulo}</label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button type="submit" className={styles.btnPrimary} style={{ width: '100%', padding: '0.6rem', marginTop: '0.5rem' }}>
                        💾 Registrar Nueva Directiva
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL 3: GESTIONAR ROL Y ESTADO DE LÍDER */}
              {showManageUserModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}>
                  <div style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '400px', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)', margin: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10, paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>✏️ Gestionar Cuenta de Líder</h3>
                      <button onClick={() => setShowManageUserModal(false)} style={{ border: 'none', background: 'transparent', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                    </div>

                    <form onSubmit={handleUpdateUsuarioRoleStatus} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Líder</label>
                        <div style={{ padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold', fontSize: '0.85rem' }}>
                          👤 {usuarios.find(u => u.id === manageUsuarioId)?.persona?.nombre || 'Líder Seleccionado'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Rol del Sistema</label>
                        <select 
                          value={manageRol} 
                          onChange={(e) => setManageRol(e.target.value)} 
                          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}
                        >
                          <option value="LIDER">🔑 Líder de Área / Directiva</option>
                          <option value="ADMIN_IGLESIA">🛡️ Administrador del Sistema</option>
                          <option value="SUPERADMIN">👑 Super Administrador</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Estado de Cuenta</label>
                        <select 
                          value={manageEstado} 
                          onChange={(e) => setManageEstado(e.target.value)} 
                          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}
                        >
                          <option value="ACTIVO">🟢 Activo (Acceso Concedido)</option>
                          <option value="PENDIENTE">🟡 Pendiente (Espera Admisión)</option>
                          <option value="SUSPENDIDO">🔴 Suspendido (Acceso Bloqueado)</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Pestañas de Administración Autorizadas</label>
                        <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {allTabs.map(tab => (
                            <div key={tab.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <input 
                                type="checkbox" 
                                id={`manage-tab-${tab.id}`}
                                checked={manageTabPermissions.includes(tab.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setManageTabPermissions([...manageTabPermissions, tab.id]);
                                  } else {
                                    setManageTabPermissions(manageTabPermissions.filter(id => id !== tab.id));
                                  }
                                }}
                              />
                              <label htmlFor={`manage-tab-${tab.id}`} style={{ fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                {tab.icon && <img src={tab.icon} alt="" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />}
                                {tab.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button type="submit" className={styles.btnPrimary} style={{ width: '100%', padding: '0.6rem', marginTop: '0.5rem' }}>
                        💾 Guardar Cambios de Cuenta
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL 4: CREAR GRUPO DE TRABAJO */}
              {showCreateGroupModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                  <div style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '450px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>💼 Crear Nuevo Grupo de Liderazgo</h3>
                      <button onClick={() => setShowCreateGroupModal(false)} style={{ border: 'none', background: 'transparent', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                    </div>

                    <form onSubmit={handleCreateGrupoTrabajo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Nombre del Grupo/Área</label>
                        <input 
                          type="text" 
                          placeholder="Ej: Ministerio de Alabanza, Diaconado, etc."
                          value={newGrupoTrabajoNombre}
                          onChange={(e) => setNewGrupoTrabajoNombre(e.target.value)}
                          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          required
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Tipo de Liderazgo</label>
                        <select 
                          value={newGrupoTrabajoTipo} 
                          onChange={(e) => setNewGrupoTrabajoTipo(e.target.value)} 
                          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}
                        >
                          <option value="CUERPO_OFICIAL">👑 {liderazgoLabels.label_cuerpo_oficial || "Cuerpo Oficial"}</option>
                          <option value="DEPARTAMENTO">💼 {liderazgoLabels.label_departamentos || "Departamento"}</option>
                          <option value="MINISTERIO">🎸 {liderazgoLabels.label_ministerios || "Ministerio"}</option>
                          <option value="INSTITUCION">⛪ {liderazgoLabels.label_instituciones || "Institución"}</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Descripción (Opcional)</label>
                        <textarea 
                          placeholder="Detalla las funciones o responsabilidades de este grupo..."
                          value={newGrupoTrabajoDesc}
                          onChange={(e) => setNewGrupoTrabajoDesc(e.target.value)}
                          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
                        />
                      </div>

                      <button type="submit" className={styles.btnPrimary} style={{ width: '100%', padding: '0.6rem', marginTop: '0.5rem' }}>
                        💾 Registrar Grupo
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL 5: AGREGAR MIEMBRO A GRUPO DE TRABAJO */}
              {showAddMiembroGroupModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                  <div style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '400px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>➕ Asignar Directivo a Grupo</h3>
                      <button onClick={() => setShowAddMiembroGroupModal(false)} style={{ border: 'none', background: 'transparent', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                    </div>

                    <form onSubmit={handleAddMiembroGrupo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Grupo Destino</label>
                        <div style={{ padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold', fontSize: '0.85rem' }}>
                          💼 {liderazgoGrupos.find(g => g.id === selectedGrupoTrabajoId)?.nombre || 'Grupo Seleccionado'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Seleccionar Usuario</label>
                        <select 
                          value={newMiembroUsuarioId} 
                          onChange={(e) => setNewMiembroUsuarioId(e.target.value)} 
                          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}
                          required
                        >
                          <option value="">Selecciona un usuario/líder...</option>
                          {usuarios.map(u => (
                            <option key={u.id} value={u.id}>
                              👤 {u.persona?.nombre || u.email.split("@")[0]} ({u.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Cargo / Puesto</label>
                        <select 
                          value={newMiembroPuesto}
                          onChange={(e) => setNewMiembroPuesto(e.target.value)}
                          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}
                          required
                        >
                          <option value="Director">Director</option>
                          <option value="Subdirector">Subdirector</option>
                          <option value="Secretario">Secretario</option>
                          <option value="Tesorero">Tesorero</option>
                          <option value="Coordinador">Coordinador</option>
                          <option value="Supervisor">Supervisor</option>
                          <option value="Lider">Líder</option>
                          <option value="Servidor">Servidor</option>
                          <option value="Voluntario">Voluntario</option>
                          <option value="Vocal">Vocal</option>
                          <option value="Encargado">Encargado</option>
                        </select>
                      </div>

                      <button type="submit" className={styles.btnPrimary} style={{ width: '100%', padding: '0.6rem', marginTop: '0.5rem' }}>
                        💾 Asignar Directivo
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: MIEMBROS */}
          {activeTab === 7 && (
            <div id="miembros-print-section">
              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  body { background: white !important; color: black !important; }
                  body > *:not(#miembros-print-section) { display: none !important; }
                  #miembros-print-section { position: absolute; left: 0; top: 0; width: 100%; padding: 1.5rem !important; box-shadow: none !important; border: none !important; }
                  #miembros-print-section .no-print { display: none !important; }
                  #print-header { display: block !important; }
                  #miembros-listado-print { padding: 0 !important; border: none !important; box-shadow: none !important; }
                  #miembros-listado-print table { font-size: 0.78rem !important; }
                  #miembros-listado-print th { border-bottom: 2px solid #000 !important; padding: 0.4rem 0.3rem !important; }
                  #miembros-listado-print td { padding: 0.35rem 0.3rem !important; border-bottom: 1px solid #ddd !important; }
                  #miembros-listado-print svg { display: none !important; }
                  #miembros-listado-print button { display: none !important; }
                  #miembros-listado-print select { border: none !important; background: none !important; padding: 0 !important; appearance: none !important; -webkit-appearance: none !important; }
                  #miembros-listado-print a[href^="https://wa.me"] { display: none !important; }
                  @page { margin: 1cm; size: landscape; }
                }
              `}} />

              {/* DESGLOSE DEMOGRÁFICO COMPACTO */}
              <div className={styles.configBlock} style={{ background: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.6)', borderRadius: '24px', padding: '1rem 1.5rem', marginBottom: '1rem', boxShadow: 'var(--shadow-xl)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ padding: '0.4rem 0.85rem', background: 'var(--color-primary-light)', borderRadius: '10px', display: 'inline-flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--color-primary)' }}>Total</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--color-primary-dark)', fontFamily: 'var(--font-mono)' }}>{miembros.length}</span>
                  </div>
                  <div style={{ padding: '0.4rem 0.85rem', background: '#ecfdf5', borderRadius: '10px', display: 'inline-flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: '#10b981' }}>Familias</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#065f46', fontFamily: 'var(--font-mono)' }}>{new Set(miembros.map(m => m.familia_codigo).filter(Boolean)).size}</span>
                  </div>
                  <div style={{ padding: '0.4rem 0.85rem', background: '#fffbeb', borderRadius: '10px', display: 'inline-flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: '#d97706' }}>Sin Grupo</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#92400e', fontFamily: 'var(--font-mono)' }}>{miembros.filter(m => !m.familia_codigo).length}</span>
                  </div>
                  {(Object.entries(
                    miembros.reduce((acc, m) => {
                      const soc = m.sociedad || 'General';
                      acc[soc] = (acc[soc] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ) as [string, number][]).map(([socName, count]) => (
                    <div key={socName} style={{ border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '10px', padding: '0.35rem 0.7rem', display: 'inline-flex', flexDirection: 'column', background: '#f8fafc' }}>
                      <span style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>{socName}</span>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* PANEL DE FILTROS */}
              <div className={styles.configBlock} style={{ background: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.6)', borderRadius: '24px', marginBottom: '1rem', boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}>
                <button
                  onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.5rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    color: 'var(--color-primary-dark)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    Filtros de Búsqueda
                    {hasActiveFilters && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'var(--color-primary)', color: 'white', padding: '2px 8px', borderRadius: '99px', marginLeft: '0.3rem' }}>
                        Activos
                      </span>
                    )}
                  </span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    transition: 'transform 0.25s ease',
                    transform: showFiltersPanel ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </span>
                </button>
                {showFiltersPanel && (
                  <div style={{ padding: '0 1.5rem 1.25rem 1.5rem', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Sexo</label>
                        <select value={filterSexo} onChange={(e) => setFilterSexo(e.target.value)} style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: 'white' }}>
                          <option value="">Todos</option>
                          <option value="M">Masculino</option>
                          <option value="F">Femenino</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Edad Mín</label>
                        <input type="number" min="0" max="120" placeholder="Ej: 18" value={filterEdadMin} onChange={(e) => setFilterEdadMin(e.target.value)} style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Edad Máx</label>
                        <input type="number" min="0" max="120" placeholder="Ej: 65" value={filterEdadMax} onChange={(e) => setFilterEdadMax(e.target.value)} style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Grupo de Conexión / Sociedad</label>
                        <select value={filterGrupoConexion} onChange={(e) => setFilterGrupoConexion(e.target.value)} style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: 'white' }}>
                          <option value="">Todos</option>
                          {uniqueSociedades.length > 0 && (
                            <optgroup label="Sociedades">
                              {uniqueSociedades.map(s => (
                                <option key={`soc-${s}`} value={s}>{s}</option>
                              ))}
                            </optgroup>
                          )}
                          {uniqueGruposConexion.length > 0 && (
                            <optgroup label="Grupos de Conexión">
                              {uniqueGruposConexion.map(g => (
                                <option key={`gc-${g}`} value={g}>{g}</option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Profesión</label>
                        <select value={filterProfesion} onChange={(e) => setFilterProfesion(e.target.value)} style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: 'white' }}>
                          <option value="">Todas</option>
                          {uniqueProfesiones.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Nivel Académico</label>
                        <select value={filterNivelAcademico} onChange={(e) => setFilterNivelAcademico(e.target.value)} style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: 'white' }}>
                          <option value="">Todos</option>
                          {uniqueNiveles.map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Estado Civil</label>
                        <select value={filterEstadoCivil} onChange={(e) => setFilterEstadoCivil(e.target.value)} style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: 'white' }}>
                          <option value="">Todos</option>
                          <option value="Soltero">Soltero/a</option>
                          <option value="Casado">Casado/a</option>
                          <option value="Divorciado">Divorciado/a</option>
                          <option value="Viudo">Viudo/a</option>
                          <option value="Unión libre">Unión libre</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Etapa</label>
                        <select value={filterEtapa} onChange={(e) => setFilterEtapa(e.target.value)} style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: 'white' }}>
                          <option value="">Todas</option>
                          {etapas.map((et: any) => (
                            <option key={et.id} value={et.id}>{et.nombre_etapa}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                      <input
                        type="text"
                        placeholder="🔍 Buscar por nombre, correo o teléfono..."
                        value={memberSearchTerm}
                        onChange={(e) => setMemberSearchTerm(e.target.value)}
                        style={{ flex: 1, minWidth: '200px', padding: '0.5rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                      <button onClick={() => { setFiltersActive(true); setShowFiltersPanel(false); }} style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'var(--color-primary)', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        🔍 Filtrar
                      </button>
                      <button onClick={() => { setFiltersActive(false); setFilterSexo(""); setFilterEdadMin(""); setFilterEdadMax(""); setFilterGrupoConexion(""); setFilterProfesion(""); setFilterNivelAcademico(""); setFilterEstadoCivil(""); setFilterEtapa(""); setMemberSearchTerm(""); }} style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        ✕ Limpiar
                      </button>
                    </div>
                  </div>
                )}
                {/* BARRA DE ACCIONES - SIEMPRE VISIBLE */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', padding: showFiltersPanel ? '0 1.5rem 1rem' : '0 1.5rem 1rem', borderTop: showFiltersPanel ? 'none' : '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                    {hasActiveFilters ? `${displayMiembros.length} de ${miembros.length} miembros` : `Mostrando ${displayMiembros.length} miembros`}
                  </span>
                  <span style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => setShowAddMemberModal(true)} 
                      style={{ padding: '0.45rem 0.9rem', borderRadius: '8px', background: '#0284c7', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      ➕ Agregar Miembro
                    </button>
                    <button 
                      onClick={() => setShowBulkImportModal(true)} 
                      style={{ padding: '0.45rem 0.9rem', borderRadius: '8px', background: '#16a34a', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      📥 Carga Masiva (Excel)
                    </button>
                    <button onClick={() => window.print()} style={{ padding: '0.45rem 0.9rem', borderRadius: '8px', background: '#1e293b', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      🖨️ Imprimir
                    </button>
                    <button onClick={generatePDF} style={{ padding: '0.45rem 0.9rem', borderRadius: '8px', background: '#dc2626', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      📄 PDF
                    </button>
                  </span>
                </div>
              </div>

              {/* TABLA DE MIEMBROS */}
              <div className={styles.configBlock} id="miembros-listado-print" style={{ background: 'white', padding: '1.5rem' }}>
                <div id="print-header" style={{ display: 'none' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>Listado de Miembros</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>Fecha de impresión: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  {hasActiveFilters && (
                    <p style={{ fontSize: '0.78rem', color: '#475569', margin: '0 0 0.5rem 0', fontStyle: 'italic' }}>
                      Filtros: {[
                        filterSexo && `Sexo: ${filterSexo === 'M' ? 'Masculino' : 'Femenino'}`,
                        (filterEdadMin || filterEdadMax) && `Edad: ${filterEdadMin || '0'}-${filterEdadMax || '∞'}`,
                        filterGrupoConexion && `Grupo: ${filterGrupoConexion}`,
                        filterProfesion && `Profesión: ${filterProfesion}`,
                        filterNivelAcademico && `Nivel: ${filterNivelAcademico}`,
                        filterEstadoCivil && `Estado civil: ${filterEstadoCivil}`,
                        filterEtapa && `Etapa: ${etapas.find((e: any) => e.id === filterEtapa)?.nombre_etapa || filterEtapa}`,
                        memberSearchTerm && `Búsqueda: "${memberSearchTerm}"`,
                      ].filter(Boolean).join(' | ')}
                    </p>
                  )}
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '0.6rem 0.5rem', width: '5%' }}>#</th>
                        <th style={{ padding: '0.6rem 0.5rem', width: '22%' }}>Nombre</th>
                        <th style={{ padding: '0.6rem 0.5rem', width: '6%' }}>Sexo</th>
                        <th style={{ padding: '0.6rem 0.5rem', width: '6%' }}>Edad</th>
                        <th style={{ padding: '0.6rem 0.5rem', width: '18%' }}>Contacto</th>
                        <th style={{ padding: '0.6rem 0.5rem', width: '14%' }}>Sociedad / Grupo</th>
                        <th style={{ padding: '0.6rem 0.5rem', width: '10%' }}>Profesión</th>
                        <th style={{ padding: '0.6rem 0.5rem', width: '10%' }}>Crecimiento</th>
                        <th style={{ padding: '0.6rem 0.5rem', width: '9%', textAlign: 'center' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayMiembros.map((m, idx) => {
                        const mEtapaId = m.etapa_id || '';
                        const edad = calcEdad(m.fecha_nacimiento);
                        return (
                          <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.6rem 0.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>{idx + 1}</td>
                            <td style={{ padding: '0.6rem 0.5rem', color: '#1e293b' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 600 }}>{m.nombre}</span>
                                {m.etiquetas && m.etiquetas.map((tag: any) => (
                                  <span
                                    key={tag.id}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      padding: '1px 6px',
                                      borderRadius: '9999px',
                                      fontSize: '0.68rem',
                                      background: tag.color + '1a',
                                      color: tag.color,
                                      border: `1px solid ${tag.color}`,
                                      fontWeight: 'bold',
                                    }}
                                    title={`${tag.nombre} ${tag.notas ? `- "${tag.notas}"` : ""} (Expira: ${tag.fecha_fin ? new Date(tag.fecha_fin).toLocaleDateString() : 'Nunca'})`}
                                  >
                                    {tag.icono} {tag.nombre}
                                  </span>
                                ))}
                                {m.familia_codigo && (
                                  <span style={{ fontSize: '0.7rem', backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                                    Fam: {m.familia_codigo}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '0.6rem 0.5rem', color: '#334155', fontSize: '0.85rem' }}>
                              {m.sexo === 'M' ? '♂ M' : m.sexo === 'F' ? '♀ F' : '-'}
                            </td>
                            <td style={{ padding: '0.6rem 0.5rem', color: '#334155', fontSize: '0.85rem' }}>
                              {edad !== null ? `${edad} años` : '-'}
                            </td>
                            <td style={{ padding: '0.6rem 0.5rem', color: '#64748b' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap', whiteSpace: 'nowrap' }}>
                                <span>📞 {m.telefono || 'S/tel'}</span>
                                {m.telefono && (
                                  <a href={`https://wa.me/${m.telefono.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', backgroundColor: '#25D366', color: 'white', padding: '1px 6px', borderRadius: '10px', fontSize: '0.68rem', fontWeight: 700, textDecoration: 'none' }}>
                                    💬 WA
                                  </a>
                                )}
                              </div>
                              {m.correo && <div style={{ fontSize: '0.75rem', marginTop: '0.15rem', whiteSpace: 'nowrap' }}>✉️ {m.correo}</div>}
                            </td>
                            <td style={{ padding: '0.6rem 0.5rem', color: '#334155' }}>
                              <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{m.sociedad || 'Sin Sociedad'}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>👥 {m.grupo_conexion || 'Sin Grupo'}</div>
                            </td>
                            <td style={{ padding: '0.6rem 0.5rem', color: '#64748b', fontSize: '0.8rem' }}>
                              {m.profesion || m.profesion_oficio || '-'}
                            </td>
                            <td style={{ padding: '0.6rem 0.5rem' }}>
                              <select
                                value={mEtapaId}
                                onChange={async (e) => {
                                  const nextEtapaId = e.target.value;
                                  if (!nextEtapaId) return;
                                  try {
                                    const res = await fetch("/api/miembros", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ action: "updateEtapa", data: { memberId: m.id, etapaId: nextEtapaId } })
                                    });
                                    const resData = await res.json();
                                    if (resData.error) {
                                      alert("Error al actualizar la etapa: " + resData.error);
                                    } else {
                                      const resM = await fetch("/api/miembros");
                                      const dataM = await resM.json();
                                      if (!dataM.error && Array.isArray(dataM)) { setMiembros(dataM); }
                                    }
                                  } catch (err) { console.error(err); alert("Error al guardar cambios de etapa."); }
                                }}
                                style={{ padding: '0.3rem 0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', fontWeight: 600, color: '#334155', backgroundColor: '#f8fafc', cursor: 'pointer' }}
                              >
                                {etapas.map((et: any) => (
                                  <option key={et.id} value={et.id}>{et.nombre_etapa.replace(/Etapa\s*/i, '')}</option>
                                ))}
                              </select>
                            </td>
                            <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap' }}>
                              {m.usuario && m.usuario.estado === 'PENDIENTE' && (
                                <button
                                  onClick={async () => {
                                    if (!confirm(`¿Deseas admitir y activar la cuenta de ${m.nombre}?`)) return;
                                    try {
                                      const res = await fetch("/api/miembros", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "updateUserStatus", data: { usuarioId: m.usuario.id, estado: "ACTIVO" } }) });
                                      const resData = await res.json();
                                      if (!resData.error) { const resM = await fetch("/api/miembros"); const dataM = await resM.json(); if (!dataM.error && Array.isArray(dataM)) setMiembros(dataM); }
                                    } catch (err) { console.error(err); }
                                  }}
                                  style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '6px', color: '#15803d', padding: '0.3rem 0.5rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}
                                >
                                  ✔️ Admitir
                                </button>
                              )}
                              <Link href={`/perfil/${m.id}`} title="Ver Perfil" style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '3px', display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                              </Link>
                              <button onClick={() => handleOpenEditMemberModal(m)} title="Editar Ficha Completa del Miembro" style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', padding: '3px', display: 'inline-flex', alignItems: 'center' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                              </button>
                              <button onClick={() => openTimelineForMember(m.id)} title="Historial" style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '3px', display: 'inline-flex', alignItems: 'center' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg>
                              </button>
                              <button onClick={() => loadMemberTags(m)} title="Alertas y Etiquetas" style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '3px', display: 'inline-flex', alignItems: 'center' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29c.39.39 1.02.39 1.41 0l7.59-7.59c.39-.39.39-1.02 0-1.41L12 2z"/><path d="M7 7h.01"/></svg>
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${m.nombre}?`)) return;
                                  try {
                                    const res = await fetch("/api/miembros", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deleteMember", data: { memberId: m.id } }) });
                                    const resData = await res.json();
                                    if (!resData.error) { const resM = await fetch("/api/miembros"); const dataM = await resM.json(); if (!dataM.error && Array.isArray(dataM)) setMiembros(dataM); }
                                  } catch (err) { console.error(err); }
                                }}
                                title="Eliminar miembro"
                                style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '3px', display: 'inline-flex', alignItems: 'center' }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {displayMiembros.length === 0 && (
                        <tr><td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                          No se encontraron miembros con los filtros seleccionados.
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MODAL: GESTIÓN DE ETIQUETAS Y ALERTAS */}
              {showTagsModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                  <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                      <h3 style={{ fontWeight: 800, fontSize: '1.25rem', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        🏷️ Alertas de Atención Especial: {selectedMemberForTags?.nombre}
                      </h3>
                      <button onClick={() => { setShowTagsModal(false); setShowCreateTagForm(false); }} style={{ border: 'none', background: 'transparent', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                      {/* COLUMNA 1: ASIGNAR / CONFIGURAR ETIQUETAS */}
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem' }}>
                        {!showCreateTagForm ? (
                          <>
                            <h4 style={{ fontWeight: 700, margin: '0 0 1rem 0', color: '#0f172a', fontSize: '0.95rem' }}>➕ Asignar Alerta Especial</h4>
                            
                            {tagsLoading ? (
                              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Cargando etiquetas...</p>
                            ) : (
                              <div>
                                <div style={{ marginBottom: '0.75rem' }}>
                                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.3rem', color: '#475569' }}>Seleccionar Etiqueta</label>
                                  <select 
                                    value={selectedTagId} 
                                    onChange={(e) => {
                                      const tid = e.target.value;
                                      setSelectedTagId(tid);
                                      const found = availableTags.find(t => t.id === tid);
                                      if (found) {
                                        setCustomTagDuration(String(found.duracion_dias_defecto));
                                      }
                                    }} 
                                    style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', backgroundColor: 'white' }}
                                  >
                                    {availableTags.map((tag: any) => (
                                      <option key={tag.id} value={tag.id}>
                                        {tag.icono} {tag.nombre}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div style={{ marginBottom: '0.75rem' }}>
                                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.3rem', color: '#475569' }}>Duración de la alerta (días)</label>
                                  <input 
                                    type="number" 
                                    value={customTagDuration} 
                                    onChange={(e) => setCustomTagDuration(e.target.value)} 
                                    placeholder="Ej: 7" 
                                    style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }} 
                                  />
                                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem', display: 'block' }}>La alerta expirará automáticamente a los días indicados. Usa 0 para duración indefinida.</span>
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.3rem', color: '#475569' }}>Notas o Motivo</label>
                                  <textarea 
                                    value={tagNotes} 
                                    onChange={(e) => setTagNotes(e.target.value)} 
                                    placeholder="Detalla la situación especial (ej: hospitalizado por cirugía de vesícula, reposo médico de 5 días)..." 
                                    rows={3}
                                    style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', resize: 'vertical' }} 
                                  />
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button 
                                    onClick={handleAssignTag} 
                                    style={{ flex: 1, padding: '0.6rem', background: '#0284c7', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
                                  >
                                    Asignar Alerta
                                  </button>
                                  <button 
                                    onClick={() => setShowCreateTagForm(true)} 
                                    style={{ padding: '0.6rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
                                    title="Crear Nueva Etiqueta"
                                  >
                                    ⚙️ Crear
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <h4 style={{ fontWeight: 700, margin: '0 0 1rem 0', color: '#0f172a', fontSize: '0.95rem' }}>⚙️ Crear Nueva Categoría de Etiqueta</h4>
                            
                            <div style={{ marginBottom: '0.75rem' }}>
                              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.3rem', color: '#475569' }}>Nombre de la etiqueta</label>
                              <input 
                                type="text" 
                                value={newTagName} 
                                onChange={(e) => setNewTagName(e.target.value)} 
                                placeholder="Ej: Adulto Mayor en Soledad" 
                                style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }} 
                              />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                              <div>
                                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.3rem', color: '#475569' }}>Ícono/Emoji</label>
                                <input 
                                  type="text" 
                                  value={newTagIcon} 
                                  onChange={(e) => setNewTagIcon(e.target.value)} 
                                  placeholder="Ej: 👴" 
                                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center' }} 
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.3rem', color: '#475569' }}>Color</label>
                                <input 
                                  type="color" 
                                  value={newTagColor} 
                                  onChange={(e) => setNewTagColor(e.target.value)} 
                                  style={{ width: '100%', padding: '0.2rem', height: '38px', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }} 
                                />
                              </div>
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.3rem', color: '#475569' }}>Duración por defecto (días)</label>
                              <input 
                                type="number" 
                                value={newTagDuration} 
                                onChange={(e) => setNewTagDuration(e.target.value)} 
                                placeholder="Ej: 30" 
                                style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }} 
                              />
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button 
                                onClick={handleCreateCustomTag} 
                                style={{ flex: 1, padding: '0.6rem', background: '#16a34a', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
                              >
                                Guardar Etiqueta
                              </button>
                              <button 
                                onClick={() => setShowCreateTagForm(false)} 
                                style={{ padding: '0.6rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
                              >
                                Cancelar
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* COLUMNA 2: ALERTAS ACTIVAS E HISTORIAL */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* ALERTAS ACTIVAS */}
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem' }}>
                          <h4 style={{ fontWeight: 700, margin: '0 0 1rem 0', color: '#0f172a', fontSize: '0.95rem' }}>🚨 Alertas Activas Actualmente</h4>
                          
                          {memberTagHistory.filter(h => h.activa && (!h.fecha_fin || new Date(h.fecha_fin) > new Date())).length === 0 ? (
                            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>El miembro no posee ninguna alerta activa en este momento.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              {memberTagHistory.filter(h => h.activa && (!h.fecha_fin || new Date(h.fecha_fin) > new Date())).map((h: any) => (
                                <div key={h.id} style={{ border: `1.5px solid ${h.etiqueta.color}`, borderRadius: '8px', padding: '0.85rem', background: `${h.etiqueta.color}08` }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                    <span style={{ fontWeight: 'bold', color: h.etiqueta.color, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                      {h.etiqueta.icono} {h.etiqueta.nombre}
                                    </span>
                                    <button 
                                      onClick={() => handleRemoveMemberTag(h.id)} 
                                      style={{ border: 'none', background: 'transparent', color: '#ef4444', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', padding: '2px 6px', borderRadius: '4px' }}
                                      title="Dar de baja / Quitar alerta"
                                    >
                                      ❌ Quitar
                                    </button>
                                  </div>
                                  {h.notas && <p style={{ fontSize: '0.82rem', color: '#334155', margin: '0 0 0.5rem 0', lineHeight: 1.4 }}><strong>Motivo:</strong> {h.notas}</p>}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b' }}>
                                    <span>Asignado por: {h.creado_por || "Líder"}</span>
                                    <span>Vence: {h.fecha_fin ? new Date(h.fecha_fin).toLocaleDateString() : 'Nunca'}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* HISTORIAL COMPLETO */}
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', flex: 1, maxHeight: '250px', overflowY: 'auto' }}>
                          <h4 style={{ fontWeight: 700, margin: '0 0 0.75rem 0', color: '#0f172a', fontSize: '0.95rem' }}>📜 Historial de Alertas</h4>
                          
                          {memberTagHistory.length === 0 ? (
                            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>No hay registros de alertas en el historial.</p>
                          ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                                  <th style={{ padding: '0.4rem 0.2rem' }}>Etiqueta</th>
                                  <th style={{ padding: '0.4rem 0.2rem' }}>Notas</th>
                                  <th style={{ padding: '0.4rem 0.2rem' }}>Estado</th>
                                </tr>
                              </thead>
                              <tbody>
                                {memberTagHistory.map((h: any) => {
                                  const isExpired = h.fecha_fin && new Date(h.fecha_fin) <= new Date();
                                  const isActive = h.activa && !isExpired;
                                  return (
                                    <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                      <td style={{ padding: '0.5rem 0.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                        {h.etiqueta.icono} {h.etiqueta.nombre}
                                      </td>
                                      <td style={{ padding: '0.5rem 0.2rem', color: '#475569' }}>
                                        <div style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={h.notas}>
                                          {h.notas || 'Sin descripción'}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Por: {h.creado_por || 'Líder'} ({new Date(h.createdAt).toLocaleDateString()})</div>
                                      </td>
                                      <td style={{ padding: '0.5rem 0.2rem' }}>
                                        <span style={{ 
                                          fontSize: '0.7rem', 
                                          padding: '2px 6px', 
                                          borderRadius: '4px', 
                                          fontWeight: 'bold', 
                                          background: isActive ? '#dcfce7' : '#f1f5f9', 
                                          color: isActive ? '#15803d' : '#64748b' 
                                        }}>
                                          {isActive ? 'Activa' : isExpired ? 'Expirada' : 'Inactiva'}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL: CREAR / AGREGAR NUEVO MIEMBRO */}
              {showAddMemberModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', overflowY: 'auto' }}>
                  <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '520px', maxHeight: '85vh', overflowY: 'auto', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)', margin: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>➕ Agregar Nuevo Miembro</h3>
                      <button onClick={() => setShowAddMemberModal(false)} style={{ border: 'none', background: 'transparent', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
                    </div>

                    <form onSubmit={handleCreateMember} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>Nombre Completo *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: Alexander Palacio"
                          value={newMemberNombre}
                          onChange={(e) => setNewMemberNombre(e.target.value)}
                          style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>Teléfono / WhatsApp</label>
                          <input
                            type="text"
                            placeholder="Ej: 8095551234"
                            value={newMemberTelefono}
                            onChange={(e) => setNewMemberTelefono(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>Fecha de Nacimiento</label>
                          <input
                            type="date"
                            value={newMemberFechaNacimiento}
                            onChange={(e) => setNewMemberFechaNacimiento(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: 'white', fontFamily: 'inherit' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>Correo Electrónico</label>
                          <input
                            type="email"
                            placeholder="ejemplo@correo.com"
                            value={newMemberCorreo}
                            onChange={(e) => setNewMemberCorreo(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>Sexo</label>
                          <select
                            value={newMemberSexo}
                            onChange={(e) => setNewMemberSexo(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: 'white' }}
                          >
                            <option value="M">Masculino</option>
                            <option value="F">Femenino</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>Asignar Grupo de Conexión / Sociedad</label>
                        <select
                          value={newMemberGrupoId}
                          onChange={(e) => setNewMemberGrupoId(e.target.value)}
                          style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: 'white' }}
                        >
                          <option value="">Selecciona un Grupo de Conexión...</option>
                          {gruposConexion.map(g => {
                            const socName = sociedades.find(s => s.id === g.sociedad_id)?.nombre_sociedad || "";
                            return (
                              <option key={g.id} value={g.id}>
                                {g.nombre_grupo} ({socName})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                        <button type="button" onClick={() => setShowAddMemberModal(false)} style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>
                          Cancelar
                        </button>
                        <button type="submit" disabled={addMemberLoading} style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', background: '#0284c7', color: 'white', border: 'none', fontWeight: 700, cursor: addMemberLoading ? 'not-allowed' : 'pointer' }}>
                          {addMemberLoading ? "Guardando..." : "💾 Registrar Miembro"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL: CARGA MASIVA DE MIEMBROS (EXCEL / CSV) */}
              {showBulkImportModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', overflowY: 'auto' }}>
                  <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '850px', maxHeight: '85vh', overflowY: 'auto', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)', margin: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>📥 Carga Masiva de Miembros</h3>
                      <button onClick={() => setShowBulkImportModal(false)} style={{ border: 'none', background: 'transparent', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
                    </div>

                    <BulkImportSection gruposConexion={gruposConexion} sociedades={sociedades} />
                  </div>
                </div>
              )}

              {/* MODAL: EDITAR FICHA COMPLETA DE MIEMBRO (ADMIN) */}
              {editingMember && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', overflowY: 'auto' }} onClick={() => setEditingMember(null)}>
                  <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '88vh', overflowY: 'auto', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)', margin: 'auto' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>✏️ Editar Ficha: {editingMember.nombre}</h3>
                      <button onClick={() => setEditingMember(null)} style={{ border: 'none', background: 'transparent', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
                    </div>

                    <form onSubmit={handleSaveEditMember} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>Nombre Completo *</label>
                        <input
                          type="text"
                          required
                          value={editMemberNombre}
                          onChange={(e) => setEditMemberNombre(e.target.value)}
                          style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>Código de Familia</label>
                          <input
                            type="text"
                            placeholder="Ej: TF0001"
                            value={editMemberFamiliaCodigo}
                            onChange={(e) => setEditMemberFamiliaCodigo(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>Fecha de Nacimiento</label>
                          <input
                            type="date"
                            value={editMemberFechaNacimiento}
                            onChange={(e) => setEditMemberFechaNacimiento(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: 'white', fontFamily: 'inherit' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>Teléfono / WhatsApp</label>
                          <input
                            type="text"
                            placeholder="(809) 555-1234"
                            value={editMemberTelefono}
                            onChange={(e) => setEditMemberTelefono(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>Correo Electrónico</label>
                          <input
                            type="email"
                            placeholder="correo@ejemplo.com"
                            value={editMemberCorreo}
                            onChange={(e) => setEditMemberCorreo(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>Sexo</label>
                          <select
                            value={editMemberSexo}
                            onChange={(e) => setEditMemberSexo(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: 'white' }}
                          >
                            <option value="M">Masculino</option>
                            <option value="F">Femenino</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>Etapa de Crecimiento</label>
                          <select
                            value={editMemberEtapaId}
                            onChange={(e) => setEditMemberEtapaId(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: 'white' }}
                          >
                            {etapas.map((et: any) => (
                              <option key={et.id} value={et.id}>{et.nombre_etapa}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>Grupo de Conexión</label>
                        <select
                          value={editMemberGrupoId}
                          onChange={(e) => setEditMemberGrupoId(e.target.value)}
                          style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: 'white' }}
                        >
                          <option value="">Sin Grupo de Conexión</option>
                          {gruposConexion.map(g => {
                            const socName = sociedades.find(s => s.id === g.sociedad_id)?.nombre_sociedad || "";
                            return (
                              <option key={g.id} value={g.id}>
                                {g.nombre_grupo} ({socName})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                        <button type="button" onClick={() => setEditingMember(null)} style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>
                          Cancelar
                        </button>
                        <button type="submit" disabled={editMemberLoading} style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', background: '#0284c7', border: 'none', color: 'white', fontWeight: 700, cursor: editMemberLoading ? 'not-allowed' : 'pointer' }}>
                          {editMemberLoading ? "Guardando..." : "💾 Guardar Cambios"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL: HISTORIAL / LÍNEA DE TIEMPO PASTORAL */}
              {showTimelineModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                  <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                      <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a', margin: 0 }}>
                        📜 Historial Pastoral: {timelineMemberName}
                      </h3>
                      <button onClick={() => setShowTimelineModal(false)} style={{ border: 'none', background: 'transparent', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                      {/* FORMULARIO PARA REGISTRAR NUEVO HITO */}
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem' }}>
                        <h4 style={{ fontWeight: 700, margin: '0 0 1rem 0', color: '#0f172a', fontSize: '0.95rem' }}>➕ Registrar Hito Manual</h4>
                        <form onSubmit={handleCreateHito}>
                          <div style={{ marginBottom: '0.75rem' }}>
                             <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.3rem', color: '#475569' }}>Título del Hito</label>
                             <select value={newHitoTitulo} onChange={e => setNewHitoTitulo(e.target.value)} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}>
                               <option value="Se casó">💍 Se casó</option>
                               <option value="Tuvo un hijo">👶 Tuvo un hijo</option>
                               <option value="Recibió consejería">📞 Recibió consejería</option>
                               <option value="Fue restaurado">🕊️ Fue restaurado</option>
                               <option value="Aceptó a Cristo">❤️ Aceptó a Cristo</option>
                               <option value="Inició doctrina">📖 Inició doctrina</option>
                               <option value="Fue bautizado">💧 Fue bautizado</option>
                               <option value="Cambió de dirección">📍 Cambió de dirección</option>
                               <option value="OTRO">✏️ Otro (Especificar...)</option>
                             </select>
                           </div>

                           {newHitoTitulo === "OTRO" && (
                             <div style={{ marginBottom: '0.75rem' }}>
                               <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.3rem', color: '#475569' }}>Título Personalizado</label>
                               <input type="text" value={newHitoTituloCustom} onChange={e => setNewHitoTituloCustom(e.target.value)} required placeholder="Ej. Ingresó al ministerio, se mudó..." style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', boxSizing: 'border-box' }} />
                             </div>
                           )}

                           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                             <div>
                               <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.3rem', color: '#475569' }}>Fecha</label>
                               <input type="date" value={newHitoFecha} onChange={e => setNewHitoFecha(e.target.value)} required style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', boxSizing: 'border-box' }} />
                             </div>
                             <div>
                               <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.3rem', color: '#475569' }}>Categoría</label>
                               <select value={newHitoCategoria} onChange={e => setNewHitoCategoria(e.target.value)} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}>
                                 <option value="PERSONAL">👤 Personal</option>
                                 <option value="ESPIRITUAL">❤️ Espiritual</option>
                                 <option value="PASTORAL">🙏 Pastoral</option>
                                 <option value="CRECIMIENTO">📈 Crecimiento</option>
                               </select>
                             </div>
                           </div>

                           <div style={{ marginBottom: '1.25rem' }}>
                             <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.3rem', color: '#475569' }}>Detalle / Notas</label>
                             <textarea value={newHitoDetalle} onChange={e => setNewHitoDetalle(e.target.value)} rows={3} placeholder="Describa notas importantes sobre el hito..." style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }} />
                           </div>

                           <button type="submit" style={{ width: '100%', padding: '0.7rem', background: '#0284c7', color: 'white', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '0.88rem' }}>
                             💾 Registrar en Historial
                           </button>
                         </form>
                       </div>

                       {/* TIMELINE LIST */}
                       <div style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                         <h4 style={{ fontWeight: 700, margin: '0 0 1.25rem 0', color: '#0f172a', fontSize: '0.95rem' }}>⏳ Línea del Tiempo Espiritual</h4>
                         
                         {timelineLoading ? (
                           <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>Cargando línea de tiempo...</p>
                         ) : timelineEvents.length === 0 ? (
                           <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>No hay hitos registrados en la historia de este miembro.</p>
                         ) : (
                           <div style={{ position: 'relative', paddingLeft: '1.25rem', borderLeft: '2px solid #e2e8f0', marginLeft: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                             {timelineEvents.map((ev: any, idx: number) => {
                               let nodeBg = '#64748b'; // SISTEMA / PERSONAL
                               if (ev.categoria === 'CRECIMIENTO') nodeBg = '#0284c7';
                               if (ev.categoria === 'ESPIRITUAL') nodeBg = '#16a34a';
                               if (ev.categoria === 'PASTORAL') nodeBg = '#d97706';

                               return (
                                 <div key={idx} style={{ position: 'relative' }}>
                                   {/* Dot */}
                                   <span style={{
                                     position: 'absolute',
                                     left: '-1.62rem',
                                     top: '0.25rem',
                                     width: '10px',
                                     height: '10px',
                                     backgroundColor: nodeBg,
                                     borderRadius: '50%',
                                     border: '2px solid white',
                                     boxShadow: '0 0 0 1px #cbd5e1'
                                   }} />
                                   
                                   <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', fontSize: '0.85rem' }}>
                                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.3rem' }}>
                                       <strong style={{ color: '#0f172a', fontSize: '0.88rem' }}>{ev.titulo}</strong>
                                       <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                                         🗓️ {new Date(ev.fecha).toLocaleDateString()}
                                       </span>
                                     </div>
                                     {ev.detalle && <p style={{ margin: '0 0 0.4rem 0', color: '#475569', lineHeight: '1.4', fontSize: '0.82rem' }}>{ev.detalle}</p>}
                                     <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic', display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                                       <span>Por: {ev.creado_por || 'Sistema'}</span>
                                       <span style={{ textTransform: 'capitalize', fontWeight: 'bold', color: nodeBg }}>{ev.categoria.toLowerCase()}</span>
                                     </div>
                                   </div>
                                 </div>
                               );
                             })}
                           </div>
                         )}
                       </div>
                     </div>
                   </div>
                 </div>
               )}
           </div>
         )}

          {/* TAB 8: SOPORTE TÉCNICO INTERNO */}
          {activeTab === 8 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button 
                  onClick={() => {
                    setNewTicketContactNom(churchName || "Pastor / Admin");
                    setNewTicketContactEml(churchEmail || "contacto@iglesia.com");
                    setNewTicketContactTel(churchPhone || "");
                    setShowCreateTicketModal(true);
                  }} 
                  className={styles.btnPrimary}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem' }}
                >
                  ➕ Crear Nuevo Ticket / Consulta
                </button>
              </div>

              {/* INFORMACIÓN DEL PLAN Y SUSCRIPCIÓN */}
              <div style={{ backgroundColor: '#e0e7ff', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #c7d2fe', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>💎</span> Plan: {churchPlan} ({limitePersonas} miembros máx. / {limiteUsuarios} líderes máx.)
                </div>
                <div style={{ fontSize: '0.9rem', color: '#4338ca', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <span><strong style={{color: '#312e81'}}>Precio:</strong> US$ {precioMensual?.toFixed(2)}/mes</span>
                  {fechaVencimiento && (
                    <span><strong style={{color: '#312e81'}}>Vence:</strong> {new Date(fechaVencimiento).toLocaleDateString()}</span>
                  )}
                  <span>
                    <strong style={{color: '#312e81'}}>Estado:</strong>{' '}
                    <span style={{ 
                      fontWeight: 'bold', 
                      padding: '0.1rem 0.5rem',
                      borderRadius: '4px',
                      background: estadoPago === "PAGADO" ? "#dcfce7" : estadoPago === "PENDIENTE" ? "#fef3c7" : "#fee2e2",
                      color: estadoPago === "PAGADO" ? "#15803d" : estadoPago === "PENDIENTE" ? "#b45309" : "#b91c1c" 
                    }}>
                      {estadoPago}
                    </span>
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', minHeight: '550px' }}>
                {/* LISTA DE TICKETS */}
                <div className={styles.configBlock} style={{ background: 'white', display: 'flex', flexDirection: 'column', padding: '1rem', gap: '1rem', maxHeight: '600px', overflowY: 'auto' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', margin: 0, color: '#1e293b' }}>
                    Tus Tickets de Soporte
                  </h3>
                  
                  {supportTickets.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', color: '#94a3b8', textAlign: 'center', gap: '0.5rem', flex: 1 }}>
                      <span style={{ fontSize: '2.5rem' }}>🎫</span>
                      <p style={{ fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>No tienes ningún ticket de soporte activo.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                      {supportTickets.map((t) => {
                        const isSelected = t.id === activeTicketId;
                        const lastMsg = t.mensajes && t.mensajes.length > 0 ? t.mensajes[t.mensajes.length - 1] : null;
                        
                        return (
                          <div 
                            key={t.id} 
                            onClick={() => setActiveTicketId(t.id)}
                            style={{
                              padding: '0.85rem',
                              borderRadius: '8px',
                              border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                              background: isSelected ? '#f0f9ff' : '#f8fafc',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b', wordBreak: 'break-word' }}>
                                {t.asunto}
                              </span>
                              <span style={{ 
                                fontSize: '0.65rem', 
                                padding: '2px 6px', 
                                borderRadius: '4px', 
                                fontWeight: 700,
                                background: t.estado === "ABIERTO" ? "#fef3c7" : t.estado === "EN_PROCESO" ? "#dbeafe" : "#d1fae5",
                                color: t.estado === "ABIERTO" ? "#b45309" : t.estado === "EN_PROCESO" ? "#1d4ed8" : "#065f46"
                              }}>
                                {t.estado}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.5rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {lastMsg ? lastMsg.mensaje : t.descripcion}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8' }}>
                              <span>Prioridad: {t.prioridad}</span>
                              <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* VENTANA DE CHAT */}
                <div className={styles.configBlock} style={{ background: 'white', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', height: '600px', border: '1px solid #e2e8f0' }}>
                  {activeTicketId ? (() => {
                    const ticket = supportTickets.find(t => t.id === activeTicketId);
                    if (!ticket) return null;
                    
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {/* Header del Chat */}
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>{ticket.asunto}</h3>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Contacto: {ticket.contactoNom} ({ticket.contactoEml})</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '12px', fontWeight: 600, background: '#f1f5f9', color: '#475569' }}>
                              Prioridad: {ticket.prioridad}
                            </span>
                            <span style={{ 
                              fontSize: '0.75rem', 
                              padding: '3px 8px', 
                              borderRadius: '12px', 
                              fontWeight: 600,
                              background: ticket.estado === "ABIERTO" ? "#fef3c7" : ticket.estado === "EN_PROCESO" ? "#dbeafe" : "#d1fae5",
                              color: ticket.estado === "ABIERTO" ? "#b45309" : ticket.estado === "EN_PROCESO" ? "#1d4ed8" : "#065f46"
                            }}>
                              {ticket.estado}
                            </span>
                          </div>
                        </div>

                        {/* Mensajes del Chat */}
                        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f8fafc' }}>
                          {ticket.mensajes?.map((m: any) => {
                            const isMe = m.remitente === "CLIENTE";
                            return (
                              <div 
                                key={m.id}
                                style={{
                                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                                  maxWidth: '70%',
                                  display: 'flex',
                                  flexDirection: 'column',
                                }}
                              >
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '2px', alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
                                  {m.nombre} • {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <div style={{
                                  padding: '0.75rem 1rem',
                                  borderRadius: '12px',
                                  borderTopRightRadius: isMe ? '2px' : '12px',
                                  borderTopLeftRadius: isMe ? '12px' : '2px',
                                  background: isMe ? '#0284c7' : '#ffffff',
                                  color: isMe ? '#ffffff' : '#1e293b',
                                  border: isMe ? 'none' : '1px solid #e2e8f0',
                                  fontSize: '0.9rem',
                                  lineHeight: '1.4',
                                  wordBreak: 'break-word',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}>
                                  {m.mensaje}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Input de Envío */}
                        <form 
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (!chatMessage.trim()) return;
                            const msgText = chatMessage;
                            setChatMessage("");
                            
                            try {
                              const res = await fetch("/api/soporte", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  action: "sendMessage",
                                  data: { ticketId: activeTicketId, mensaje: msgText }
                                })
                              });
                              if (res.ok) {
                                await loadSupportTickets();
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', background: 'white', display: 'flex', gap: '0.75rem' }}
                        >
                          <input 
                            type="text" 
                            placeholder="Escribe tu mensaje para soporte aquí..."
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            style={{ flex: 1, padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                          />
                          <button 
                            type="submit" 
                            className={styles.btnPrimary}
                            style={{ padding: '0.65rem 1.5rem', background: '#0284c7' }}
                          >
                            Enviar ⚡
                          </button>
                        </form>
                      </div>
                    );
                  })() : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', padding: '2rem', textAlign: 'center', gap: '0.75rem', background: '#f8fafc' }}>
                      <span style={{ fontSize: '3.5rem' }}>💬</span>
                      <h3 style={{ margin: 0, color: '#475569' }}>Bandeja de Conversación</h3>
                      <p style={{ fontSize: '0.88rem', margin: 0, maxWidth: '350px' }}>Selecciona un ticket de soporte de la lista o crea uno nuevo para iniciar la conversación interactiva con el equipo técnico.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MODAL: CREAR TICKET DE SOPORTE */}
          {showCreateTicketModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '500px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>🎫 Crear Consulta / Ticket de Soporte</h3>
                  <button onClick={() => setShowCreateTicketModal(false)} style={{ border: 'none', background: 'transparent', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                </div>

                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newTicketAsunto || !newTicketDesc || !newTicketContactNom || !newTicketContactEml) {
                      alert("Por favor completa los campos obligatorios.");
                      return;
                    }
                    
                    setSupportLoading(true);
                    try {
                      const res = await fetch("/api/soporte", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "createTicket",
                          data: {
                            asunto: newTicketAsunto,
                            descripcion: newTicketDesc,
                            prioridad: newTicketPrioridad,
                            contactoNom: newTicketContactNom,
                            contactoEml: newTicketContactEml,
                            contactoTel: newTicketContactTel
                          }
                        })
                      });
                      
                      const data = await res.json();
                      if (data.error) {
                        alert(data.error);
                      } else {
                        setShowCreateTicketModal(false);
                        setNewTicketAsunto("");
                        setNewTicketDesc("");
                        setNewTicketPrioridad("MEDIA");
                        
                        await loadSupportTickets();
                        if (data.id) {
                          setActiveTicketId(data.id);
                        }
                      }
                    } catch (err) {
                      console.error(err);
                      alert("Error al enviar el ticket.");
                    } finally {
                      setSupportLoading(false);
                    }
                  }} 
                  style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Asunto / Problema</label>
                    <input 
                      type="text" 
                      value={newTicketAsunto}
                      onChange={(e) => setNewTicketAsunto(e.target.value)}
                      placeholder="Ej: Error al generar reportes en PDF"
                      style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Descripción detallada</label>
                    <textarea 
                      value={newTicketDesc}
                      onChange={(e) => setNewTicketDesc(e.target.value)}
                      placeholder="Explica detalladamente qué sucede y los pasos para reproducirlo..."
                      rows={4}
                      style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'inherit', resize: 'vertical' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Nombre de Contacto</label>
                      <input 
                        type="text" 
                        value={newTicketContactNom}
                        onChange={(e) => setNewTicketContactNom(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        required
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Prioridad</label>
                      <select 
                        value={newTicketPrioridad}
                        onChange={(e) => setNewTicketPrioridad(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}
                      >
                        <option value="BAJA">Baja</option>
                        <option value="MEDIA">Media</option>
                        <option value="ALTA">Alta</option>
                        <option value="URGENTE">Urgente</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Email</label>
                      <input 
                        type="email" 
                        value={newTicketContactEml}
                        onChange={(e) => setNewTicketContactEml(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        required
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Teléfono (Opcional)</label>
                      <input 
                        type="text" 
                        value={newTicketContactTel}
                        onChange={(e) => setNewTicketContactTel(e.target.value)}
                        placeholder="Ej: 809-555-1234"
                        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                    <button 
                      type="button" 
                      onClick={() => setShowCreateTicketModal(false)}
                      style={{ padding: '0.5rem 1.25rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f1f5f9', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className={styles.btnPrimary}
                      disabled={supportLoading}
                      style={{ padding: '0.5rem 1.5rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                      {supportLoading ? "Enviando..." : "Enviar Ticket 🚀"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 9: COMUNICADOS OFICIALES */}
          {activeTab === 9 && (
            <div>

              <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '1.5rem', minHeight: '500px' }}>
                {/* PUBLICAR NUEVO ANUNCIO */}
                <div className={styles.configBlock} style={{ background: 'white', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>📣 Crear Comunicado</h3>
                  
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!newComunicadoTitulo || !newComunicadoContenido) {
                        alert("Por favor escribe un título y contenido");
                        return;
                      }

                      setComunicadosLoading(true);
                      try {
                        const res = await fetch("/api/comunicados", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            action: "create",
                            data: {
                              titulo: newComunicadoTitulo,
                              contenido: newComunicadoContenido,
                              imagen: newComunicadoImagen || null,
                              destinatario: newComunicadoDestinatario,
                              destinatarioId: newComunicadoDestId,
                              esObligatorio: newComunicadoObligatorio,
                              fechaInicio: newComunicadoFechaInicio || null,
                              fechaFin: newComunicadoFechaFin || null
                            }
                          })
                        });

                        const data = await res.json();
                        if (data.error) {
                          alert(data.error);
                        } else {
                          setNewComunicadoTitulo("");
                          setNewComunicadoContenido("");
                          setNewComunicadoImagen("");
                          setNewComunicadoDestId("");
                          setNewComunicadoObligatorio(false);
                          setNewComunicadoFechaInicio("");
                          setNewComunicadoFechaFin("");
                          await loadComunicados();
                        }
                      } catch (err) {
                        console.error(err);
                        alert("Error al guardar comunicado");
                      } finally {
                        setComunicadosLoading(false);
                      }
                    }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Título del Comunicado</label>
                      <input
                        type="text"
                        placeholder="Ej: Reunión general este Domingo"
                        value={newComunicadoTitulo}
                        onChange={(e) => setNewComunicadoTitulo(e.target.value)}
                        style={{ padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Mensaje / Contenido</label>
                      <textarea
                        placeholder="Escribe el mensaje del anuncio aquí..."
                        rows={5}
                        value={newComunicadoContenido}
                        onChange={(e) => setNewComunicadoContenido(e.target.value)}
                        style={{ padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'inherit', resize: 'vertical' }}
                        required
                      />
                    </div>

                    {/* Rango de Fecha y Hora de Vigencia */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>📅 Activo Desde (Fecha y Hora)</label>
                        <input
                          type="datetime-local"
                          value={newComunicadoFechaInicio}
                          onChange={(e) => setNewComunicadoFechaInicio(e.target.value)}
                          style={{ padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>⏰ Expira En (Fecha y Hora Desaparición)</label>
                        <input
                          type="datetime-local"
                          value={newComunicadoFechaFin}
                          onChange={(e) => setNewComunicadoFechaFin(e.target.value)}
                          style={{ padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '-0.5rem' }}>
                      Una vez cumplida la fecha y hora de expiración, el comunicado se eliminará automáticamente de la pantalla de todos los usuarios.
                    </span>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Imagen Adjunta (Opcional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleComunicadoImageUpload}
                        style={{ fontSize: '0.85rem' }}
                      />
                      {newComunicadoImagen && (
                        <div style={{ position: 'relative', marginTop: '0.5rem', width: '100%', maxHeight: '150px', overflow: 'hidden', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                          <img src={newComunicadoImagen} alt="Preview" style={{ width: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => setNewComunicadoImagen("")}
                            style={{
                              position: 'absolute',
                              top: '5px',
                              right: '5px',
                              backgroundColor: 'rgba(239, 68, 68, 0.9)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            &times;
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Enviar a / Dirigido a:</label>
                      <select
                        value={newComunicadoDestinatario}
                        onChange={(e) => {
                          setNewComunicadoDestinatario(e.target.value);
                          setNewComunicadoDestId("");
                        }}
                        style={{ padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}
                      >
                        <option value="TODOS">🌐 Toda la Membresía</option>
                        <option value="LIDERES">👑 Grupo de Líderes y Directivas</option>
                        <option value="SOCIEDAD">👥 Por Sociedad (Damas, Jóvenes, Caballeros...)</option>
                        <option value="GRUPO_CONEXION">🏠 Por Grupo de Conexión</option>
                        <option value="DEPARTAMENTO">💼 Por Departamento / Ministerio</option>
                      </select>
                    </div>

                    {newComunicadoDestinatario === "SOCIEDAD" && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Seleccionar Sociedad</label>
                        <select
                          value={newComunicadoDestId}
                          onChange={(e) => setNewComunicadoDestId(e.target.value)}
                          style={{ padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}
                          required
                        >
                          <option value="">Selecciona una sociedad...</option>
                          {sociedades.map((s) => (
                            <option key={s.id} value={s.id}>{s.nombre_sociedad}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {newComunicadoDestinatario === "GRUPO_CONEXION" && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Seleccionar Grupo</label>
                        <select
                          value={newComunicadoDestId}
                          onChange={(e) => setNewComunicadoDestId(e.target.value)}
                          style={{ padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}
                          required
                        >
                          <option value="">Selecciona un grupo...</option>
                          {gruposConexion.map((g) => (
                            <option key={g.id} value={g.id}>{g.nombre_grupo}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {newComunicadoDestinatario === "DEPARTAMENTO" && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Seleccionar Departamento / Ministerio</label>
                        <select
                          value={newComunicadoDestId}
                          onChange={(e) => setNewComunicadoDestId(e.target.value)}
                          style={{ padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}
                          required
                        >
                          <option value="">Selecciona un departamento...</option>
                          {modulos.map((m: any) => (
                            <option key={m.id} value={m.id}>{m.nombre_modulo || m.nombre}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <input
                        type="checkbox"
                        id="esObligatorioChk"
                        checked={newComunicadoObligatorio}
                        onChange={(e) => setNewComunicadoObligatorio(e.target.checked)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                      <label htmlFor="esObligatorioChk" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                        Obligatorio (Ver al iniciar la app)
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={comunicadosLoading}
                      className={styles.btnPrimary}
                      style={{ padding: '0.65rem', marginTop: '0.5rem', border: 'none', cursor: 'pointer' }}
                    >
                      {comunicadosLoading ? "Publicando..." : "📢 Publicar Comunicado Oficial"}
                    </button>
                  </form>
                </div>

                {/* ANUNCIOS PUBLICADOS */}
                <div className={styles.configBlock} style={{ background: 'white', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>📋 Historial de Comunicados</h3>

                  {comunicadosList.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '4rem 1rem' }}>
                      <span style={{ fontSize: '3rem' }}>📢</span>
                      <p style={{ fontSize: '0.9rem', fontStyle: 'italic', marginTop: '0.5rem' }}>No se han publicado comunicados oficiales.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {comunicadosList.map((c) => (
                        <div key={c.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', background: '#f8fafc' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>
                                {c.titulo}
                              </h4>
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                {new Date(c.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              {c.esObligatorio && (
                                <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: '#fee2e2', color: '#991b1b', fontWeight: 700 }}>
                                  Pantalla Obligatoria
                                </span>
                              )}
                              <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>
                                Enviado a: {c.destinatario}
                              </span>
                            </div>
                          </div>
                          
                          {c.imagen && (
                            <div style={{ marginBottom: '0.75rem', maxWidth: '300px', maxHeight: '180px', overflow: 'hidden', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                              <img src={c.imagen} alt="Comunicado" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          )}

                          <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0 0 1rem 0', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                            {c.contenido}
                          </p>

                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              onClick={async () => {
                                if (!confirm("¿Estás seguro de que deseas eliminar este comunicado?")) return;
                                try {
                                  const res = await fetch("/api/comunicados", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      action: "delete",
                                      data: { comunicadoId: c.id }
                                    })
                                  });
                                  if (res.ok) {
                                    loadComunicados();
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              style={{ 
                                background: 'none',
                                border: 'none',
                                color: '#f43f5e',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                transition: 'color 0.2s',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#e11d48'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#f43f5e'}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>



          {/* Modal para configurar detalles de sociedad */}
          {editingSoc && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1.5rem',
            }} onClick={() => setEditingSoc(null)}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '85vh',
                overflowY: 'auto',
                border: '1px solid #e2e8f0',
              }} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={{
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    margin: 0
                  }}>
                    📝 Configurar Detalles: {editingSoc.nombre_sociedad}
                  </h3>
                  <button 
                    onClick={() => setEditingSoc(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      padding: 0,
                      lineHeight: 1
                    }}
                  >
                    &times;
                  </button>
                </div>

                {/* Body */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Descripción */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem', color: '#475569' }}>
                      Descripción de la Sociedad
                    </label>
                    <textarea
                      value={editingSocDesc}
                      onChange={(e) => setEditingSocDesc(e.target.value)}
                      placeholder="Escribe una breve descripción del propósito, enfoque y actividades de esta sociedad..."
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.9rem',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Rango de Edad y Sexo */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>
                        Edad Mínima
                      </label>
                      <input
                        type="number"
                        placeholder="Ej: 0"
                        value={editingSocEdadMin}
                        onChange={(e) => setEditingSocEdadMin(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>
                        Edad Máxima
                      </label>
                      <input
                        type="number"
                        placeholder="Ej: 12"
                        value={editingSocEdadMax}
                        onChange={(e) => setEditingSocEdadMax(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>
                        Sexo Requerido
                      </label>
                      <select
                        value={editingSocSexo}
                        onChange={(e) => setEditingSocSexo(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: 'white' }}
                      >
                        <option value="MIXTO">Mixto</option>
                        <option value="M">Hombres</option>
                        <option value="F">Mujeres</option>
                      </select>
                    </div>
                  </div>

                  {/* Horarios */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem', color: '#475569' }}>
                      Horarios de Servicios y Reuniones
                    </label>
                    <textarea
                      value={editingSocHorarios}
                      onChange={(e) => setEditingSocHorarios(e.target.value)}
                      placeholder="Ej: Domingos 9:00 AM (Servicio General)&#10;Miércoles 7:30 PM (Reunión Oración)"
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.9rem',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Galería de Fotos */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem', color: '#475569' }}>
                      Galería de Fotos (Máx. 5)
                    </label>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>
                      Sube fotos de actividades de la sociedad. Se comprimirán automáticamente.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {editingSocGaleria.length < 5 && (
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleSocGaleriaUpload}
                          style={{ fontSize: '0.85rem' }}
                        />
                      )}

                      {/* Cuadrícula de fotos cargadas */}
                      {editingSocGaleria.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginTop: '0.25rem' }}>
                          {editingSocGaleria.map((imgBase64, index) => (
                            <div key={index} style={{ position: 'relative', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                              <img
                                src={imgBase64}
                                alt={`Galería ${index + 1}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              <button
                                type="button"
                                onClick={() => setEditingSocGaleria((prev) => prev.filter((_, idx) => idx !== index))}
                                style={{
                                  position: 'absolute',
                                  top: '2px',
                                  right: '2px',
                                  background: 'rgba(239, 68, 68, 0.9)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '18px',
                                  height: '18px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: 0,
                                  lineHeight: 1
                                }}
                                title="Eliminar foto"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                    <button
                      type="button"
                      onClick={() => setEditingSoc(null)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: '#f1f5f9',
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        borderRadius: 'var(--radius-button)',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        transition: 'all 0.25s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#e2e8f0';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f1f5f9';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSocDetalles}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-button)',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-md)',
                        transition: 'all 0.25s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--color-primary-dark)';
                        e.currentTarget.style.transform = 'translateY(-1.5px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--color-primary)';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      }}
                    >
                      Guardar Cambios
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* TAB 10: FINANZAS */}
          {activeTab === 10 && (
            <FinanzasModule />
          )}

          {/* TAB 11: PASTORAL */}
          {activeTab === 11 && (
            <div>

              {/* Sub-tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0' }}>
                {(['peticiones', 'bitacora'] as const).map(t => (
                  <button key={t} onClick={() => setPastoralTab(t)} style={{ padding: '0.6rem 1.2rem', border: 'none', background: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', borderBottom: pastoralTab === t ? '2px solid #0284c7' : '2px solid transparent', color: pastoralTab === t ? '#0284c7' : '#64748b', marginBottom: '-2px' }}>
                    {t === 'peticiones' ? '🙏 Peticiones de Oración' : '📓 Bitácora de Visitas'}
                  </button>
                ))}
              </div>

              {pastoralLoading ? <p style={{ color: '#64748b' }}>Cargando...</p> : null}

              {pastoralTab === 'peticiones' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>Peticiones Recibidas ({peticiones.length})</h3>
                  </div>
                  {peticiones.length === 0 ? (
                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>No hay peticiones de oración registradas aún.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {peticiones.map((p: any) => (
                        <div key={p.id} style={{ background: p.es_confidencial ? '#fefce8' : '#f8fafc', border: `1px solid ${p.es_confidencial ? '#fef08a' : '#e2e8f0'}`, borderRadius: '10px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                              <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{p.nombre_solicitante}</strong>
                              {p.es_confidencial && <span style={{ fontSize: '0.72rem', background: '#fef9c3', color: '#854d0e', padding: '1px 6px', borderRadius: '8px', fontWeight: 700 }}>CONFIDENCIAL</span>}
                              <span style={{ fontSize: '0.72rem', padding: '1px 6px', borderRadius: '8px', fontWeight: 700, background: p.estado === 'ACTIVA' ? '#dbeafe' : p.estado === 'ORANDO' ? '#dcfce7' : '#f3f4f6', color: p.estado === 'ACTIVA' ? '#1d4ed8' : p.estado === 'ORANDO' ? '#15803d' : '#374151' }}>{p.estado}</span>
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(p.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p style={{ fontSize: '0.9rem', color: '#374151', margin: 0, lineHeight: '1.5' }}>{p.peticion}</p>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
                            {['ACTIVA','ORANDO','RESPONDIDA'].map(estado => (
                              <button key={estado} onClick={async () => {
                                await fetch('/api/oracion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'actualizarEstado', data: { id: p.id, estado } }) });
                                loadPastoral();
                              }} style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem', fontWeight: 700, borderRadius: '6px', border: 'none', cursor: 'pointer', background: p.estado === estado ? '#0284c7' : '#f1f5f9', color: p.estado === estado ? 'white' : '#374151' }}>
                                {estado === 'ACTIVA' ? 'Activa' : estado === 'ORANDO' ? '🙏 Orando' : '✓ Respondida'}
                              </button>
                            ))}
                            <button 
                              onClick={async () => {
                                if (!confirm('¿Eliminar esta petición?')) return;
                                await fetch('/api/oracion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'eliminar', data: { id: p.id } }) });
                                loadPastoral();
                              }} 
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
                              title="Eliminar petición"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {pastoralTab === 'bitacora' && (
                <div>
                  {/* Formulario bitácora */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem', color: '#0f172a' }}>Registrar Seguimiento Pastoral</h3>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (!bitPersonaId) { alert('Selecciona un miembro'); return; }
                      const res = await fetch('/api/bitacora', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'crear', data: { persona_id: bitPersonaId, tipo: bitTipo, notas: bitNotas, fecha: bitFecha } }) });
                      if (res.ok) { setBitNotas(''); loadPastoral(); }
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem', color: '#374151' }}>Miembro</label>
                          <select value={bitPersonaId} onChange={e => setBitPersonaId(e.target.value)} required style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }}>
                            <option value="">Seleccionar miembro...</option>
                            {miembros.map((m: any) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem', color: '#374151' }}>Tipo</label>
                          <select value={bitTipo} onChange={e => setBitTipo(e.target.value)} style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }}>
                            <option value="VISITA">🏠 Visita domiciliaria</option>
                            <option value="LLAMADA">📞 Llamada telefónica</option>
                            <option value="MENSAJE">💬 Mensaje / WhatsApp</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem', color: '#374151' }}>Fecha</label>
                          <input type="date" value={bitFecha} onChange={e => setBitFecha(e.target.value)} required style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem', color: '#374151' }}>Notas del seguimiento</label>
                        <textarea value={bitNotas} onChange={e => setBitNotas(e.target.value)} required rows={3} placeholder="Observaciones sobre la visita, estado del miembro, necesidades detectadas..." style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }} />
                      </div>
                      <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#0284c7', color: 'white', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>+ Registrar</button>
                    </form>
                  </div>

                  {/* Lista de registros */}
                  {bitacora.length === 0 ? (
                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>No hay registros de seguimiento pastoral aún.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {bitacora.map((b: any) => (
                        <div key={b.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{b.persona_nombre || b.persona_id}</strong>
                              <span style={{ fontSize: '0.78rem', padding: '1px 7px', borderRadius: '8px', fontWeight: 700, background: b.tipo === 'VISITA' ? '#dbeafe' : b.tipo === 'LLAMADA' ? '#dcfce7' : '#fef9c3', color: b.tipo === 'VISITA' ? '#1d4ed8' : b.tipo === 'LLAMADA' ? '#15803d' : '#854d0e' }}>{b.tipo === 'VISITA' ? '🏠 Visita' : b.tipo === 'LLAMADA' ? '📞 Llamada' : '💬 Mensaje'}</span>
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(b.fecha).toLocaleDateString()}</span>
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>por {b.lider_nombre || 'Pastor'}</span>
                            </div>
                            <p style={{ fontSize: '0.9rem', color: '#374151', margin: 0, lineHeight: '1.5' }}>{b.notas}</p>
                          </div>
                          <button 
                            onClick={async () => {
                              if (!confirm('¿Eliminar este registro?')) return;
                              await fetch('/api/bitacora', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'eliminar', data: { id: b.id } }) });
                              loadPastoral();
                            }} 
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
                              flexShrink: 0
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#e11d48'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#f43f5e'}
                            title="Eliminar registro"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 17: TEMPLO */}
          {activeTab === 17 && (
            <TemploModule />
          )}

          {/* TAB 12: DASHBOARD ANALÍTICO */}
          {activeTab === 12 && (
            <div id="print-section">
              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  body {
                    background: white !important;
                    color: black !important;
                    padding: 0 !important;
                    margin: 0 !important;
                  }
                  /* Ocultar todo menos el área de reporte */
                  body > *:not(#print-section) {
                    display: none !important;
                  }
                  #print-section {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    padding: 2rem !important;
                    box-shadow: none !important;
                    border: none !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                }
              `}} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div className="no-print" style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => window.print()}
                    style={{ 
                      padding: '0.6rem 1.2rem', 
                      background: '#0284c7', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '8px', 
                      fontWeight: 600, 
                      fontSize: '0.85rem', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    🖨️ Imprimir / Guardar PDF
                  </button>
                  <button 
                    onClick={loadAnalytics}
                    style={{ 
                      padding: '0.6rem 1.2rem', 
                      background: '#f1f5f9', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: '8px', 
                      fontWeight: 600, 
                      fontSize: '0.85rem', 
                      cursor: 'pointer',
                      color: '#374151'
                    }}
                  >
                    🔄 Actualizar
                  </button>
                </div>
              </div>

              {analyticsLoading ? (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '3rem' }}>Calculando datos...</p>
              ) : analyticsData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                  {/* Tarjetas de métricas clave */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                    {[
                      { label: 'Total Miembros', value: analyticsData.totalMiembros, icon: '👥', color: 'var(--color-primary)' },
                      { label: 'Familias Registradas', value: analyticsData.totalFamilias || 0, icon: '👨‍👩‍👧‍👦', color: 'var(--success)' },
                      { label: 'Líderes Activos', value: analyticsData.totalLideres || 0, icon: '👨‍💼', color: 'var(--color-spiritual)' },
                      { label: 'Grupos de Conexión', value: analyticsData.totalGrupos, icon: '🌐', color: '#0ea5e9' },
                      { label: 'Departamentos', value: analyticsData.totalDepartamentos || 0, icon: '🏢', color: 'var(--warning)' },
                      { label: 'Ministerios', value: analyticsData.totalMinisterios || 0, icon: '⛪', color: 'var(--color-event)' },
                      { label: 'Instituciones', value: analyticsData.totalInstituciones || 0, icon: '🏫', color: '#06b6d4' },
                      { label: 'Cobertura Pastoral', value: `${analyticsData.coberturaPastoral || 0} pers.`, icon: '🐑', color: '#10b981' },
                      { label: 'Oraciones Activas', value: analyticsData.totalOracionActivas || 0, icon: '🙏', color: 'var(--danger)' }
                    ].map(card => (
                      <div 
                        key={card.label} 
                        style={{ 
                          background: 'white', 
                          border: '1px solid rgba(226, 232, 240, 0.6)', 
                          borderRadius: '16px', 
                          padding: '0.75rem 1rem', 
                          boxShadow: 'var(--shadow-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                        }}
                      >
                        <div style={{ 
                          fontSize: '1.25rem', 
                          backgroundColor: `${card.color === 'var(--color-primary)' ? '#4f46e5' : card.color === 'var(--color-spiritual)' ? '#8b5cf6' : card.color === 'var(--success)' ? '#10b981' : card.color === 'var(--warning)' ? '#f59e0b' : card.color === 'var(--color-event)' ? '#f97316' : card.color === 'var(--danger)' ? '#f43f5e' : card.color}18`, 
                          borderRadius: '12px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          width: '38px', 
                          height: '38px',
                          flexShrink: 0
                        }}>
                          {card.icon}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: card.color, fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>{card.value}</div>
                          <div style={{ fontSize: '0.64rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{card.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Gráfico Crecimiento por Mes */}
                  <div style={{ background: 'white', border: '1px solid rgba(226, 232, 240, 0.6)', borderRadius: '24px', padding: '1.5rem', boxShadow: 'var(--shadow-xl)' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', marginBottom: '1.25rem' }}>📈 Nuevos Miembros — Últimos 6 Meses</h3>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '140px', paddingBottom: '0.5rem' }}>
                      {(() => {
                        const maxVal = Math.max(...analyticsData.miembrosPorMes.map((m: any) => m.count), 1);
                        return analyticsData.miembrosPorMes.map((m: any) => (
                          <div key={m.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7' }}>{m.count}</span>
                            <div style={{ width: '100%', height: `${Math.max((m.count / maxVal) * 100, 4)}%`, background: 'linear-gradient(to top, #0284c7, #38bdf8)', borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease' }} />
                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{m.mes.slice(5)}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {/* Etapas de Crecimiento */}
                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                      <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', marginBottom: '1rem' }}>🏆 Distribución y Avance por Etapa</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {analyticsData.distribucionEtapas.map((et: any, idx: number) => {
                          const pct = analyticsData.totalMiembros > 0 ? Math.round((et.count / analyticsData.totalMiembros) * 100) : 0;
                          const colors = ['#0284c7','#7c3aed','#059669','#d97706','#dc2626','#0891b2'];
                          return (
                            <div key={et.nombre_etapa} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.6rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>{et.nombre_etapa}</span>
                                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{et.count} personas ({pct}%)</span>
                              </div>
                              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${pct}%`, background: colors[idx % colors.length], borderRadius: '4px' }} />
                                  </div>
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>
                                  Avance: {et.completionRate || 0}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Asistencia por Grupo */}
                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                      <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', marginBottom: '1rem' }}>👥 Asistencia Promedio por Grupo de Conexión</h3>
                      {analyticsData.asistenciaGrupos.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Sin datos de asistencia registrados aún.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                          {analyticsData.asistenciaGrupos.map((g: any) => {
                            const pct = g.totalMiembros > 0 ? Math.round((g.promedio_asistencia / g.totalMiembros) * 100) : 0;
                            return (
                              <div key={g.nombre_grupo}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>{g.nombre_grupo}</span>
                                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{g.promedio_asistencia.toFixed(1)} / {g.totalMiembros} ({pct}%)</span>
                                </div>
                                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: 'linear-gradient(to right, #059669, #34d399)', borderRadius: '4px' }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {/* Resumen de Cuidado Pastoral */}
                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                      <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', marginBottom: '1rem' }}>🐑 Cobertura de Cuidado Pastoral (Últimos 30 días)</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center', padding: '0.5rem 0' }}>
                        <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 5px rgba(0,0,0,0.05)' }}>
                            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981' }}>
                              {analyticsData.totalMiembros > 0 ? Math.round((analyticsData.coberturaPastoral / analyticsData.totalMiembros) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.9rem', color: '#374151', fontWeight: 600, margin: 0 }}>
                            {analyticsData.coberturaPastoral || 0} de {analyticsData.totalMiembros} miembros contactados
                          </p>
                          <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                            Miembros que recibieron al menos un seguimiento pastoral registrado en la bitácora este mes.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Resumen Financiero Simplificado */}
                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                      <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', marginBottom: '1rem' }}>💵 Transacciones Financieras del Mes</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem' }}>
                            <span>Ingresos Registrados</span>
                            <span style={{ fontWeight: 700, color: '#059669' }}>+${(analyticsData.totalIngresosMes || 0).toLocaleString()}</span>
                          </div>
                          <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${analyticsData.totalIngresosMes > 0 ? 100 : 0}%`, background: '#059669', borderRadius: '4px' }} />
                          </div>
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem' }}>
                            <span>Egresos Registrados</span>
                            <span style={{ fontWeight: 700, color: '#dc2626' }}>-${(analyticsData.totalEgresosMes || 0).toLocaleString()}</span>
                          </div>
                          <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${analyticsData.totalIngresosMes > 0 ? Math.min((analyticsData.totalEgresosMes / analyticsData.totalIngresosMes) * 100, 100) : (analyticsData.totalEgresosMes > 0 ? 100 : 0)}%`, background: '#dc2626', borderRadius: '4px' }} />
                          </div>
                        </div>
                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Balance Neto:</span>
                          <span style={{ fontSize: '1rem', fontWeight: 800, color: (analyticsData.totalIngresosMes - analyticsData.totalEgresosMes) >= 0 ? '#059669' : '#dc2626' }}>
                            ${((analyticsData.totalIngresosMes || 0) - (analyticsData.totalEgresosMes || 0)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '3rem' }}>No hay datos suficientes aún. Agrega miembros y registra asistencias para ver analíticas.</p>
              )}
            </div>
          )}

          {/* TAB 13: VISION DEL AÑO (Trasladado a Tab 1: Mi Iglesia) */}

          {/* TAB 14: GESTOR DE EVENTOS */}
          {activeTab === 14 && (
            <GestorEventosModule />
          )}

          {/* TAB 16: FORMULARIOS */}
          {activeTab === 16 && (
            <GestorFormulariosModule />
          )}

        </div> {/* closes tabContent */}

        {/* 3. MOBILE MENU SLIDING DRAWER */}
        {mobileMenuOpen && (
          <div className={styles.mobileDrawerOverlay} onClick={() => setMobileMenuOpen(false)}>
            <div className={styles.mobileDrawerContent} onClick={e => e.stopPropagation()}>
              <div className={styles.mobileDrawerHeader}>
                <span className={styles.mobileDrawerTitle}>Menú de Configuración</span>
                <button type="button" className={styles.mobileDrawerClose} onClick={() => setMobileMenuOpen(false)}>✕</button>
              </div>
              <div className={styles.mobileDrawerBody}>
                {visibleTabs.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`${styles.mobileDrawerItem} ${activeTab === tab.id ? styles.mobileDrawerItemActive : ''}`}
                    onClick={() => {
                      trackTabVisit(tab.id);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <span style={{ fontSize: '1.4rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      {tab.icon.startsWith("/") ? (
                        <img src={tab.icon} alt={tab.label} style={{ width: 28, height: 28, objectFit: 'contain' }} />
                      ) : (
                        tab.icon
                      )}
                    </span>
                    <span style={{ fontWeight: 600 }}>{tab.label}</span>
                  </button>
                ))}
                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '1rem 0' }} />
                <button
                  type="button"
                  onClick={handleLogout}
                  className={styles.mobileDrawerItem}
                  style={{ color: '#ef4444' }}
                >
                  <img src="/Iconos SVG/salir.svg" alt="Salir" style={{ width: "22px", height: "22px", objectFit: "contain" }} />
                  <span style={{ fontWeight: 600 }}>Salir</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. MOBILE BOTTOM NAVIGATION BAR (Dynamic - recent tabs) */}
        <nav className={styles.mobileBottomBar}>
          {(() => {
            const maxVisible = 4;
            const recentVisible = recentTabs
              .filter(id => id !== activeTab && visibleTabs.some(t => t.id === id))
              .slice(0, maxVisible);
            const remaining = maxVisible - recentVisible.length;
            const fallbackTabs = visibleTabs
              .filter(t => !recentVisible.includes(t.id) && t.id !== activeTab)
              .slice(0, remaining);
            const bottomTabs = [...recentVisible.map(id => visibleTabs.find(t => t.id === id)!), ...fallbackTabs].filter(Boolean).slice(0, maxVisible);
            const hasMore = visibleTabs.length > maxVisible;

            return (
              <>
                {bottomTabs.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`${styles.mobileBottomBarItem} ${activeTab === tab.id ? styles.mobileBottomBarItemActive : ''}`}
                    onClick={() => trackTabVisit(tab.id)}
                  >
                    <span className={styles.mobileBottomBarIcon}>
                      <img src={tab.icon} alt={tab.label} style={{ width: 26, height: 26, objectFit: 'contain' }} />
                    </span>
                    <span className={styles.mobileBottomBarLabel}>{tab.label}</span>
                  </button>
                ))}
                {hasMore && (
                  <button
                    type="button"
                    className={styles.mobileBottomBarItem}
                    onClick={() => setMobileMenuOpen(true)}
                  >
                    <span className={styles.mobileBottomBarIcon}>☰</span>
                    <span className={styles.mobileBottomBarLabel}>Más</span>
                  </button>
                )}
              </>
            );
          })()}
        </nav>

      </div>
    </div>
  </div>
  );
}

function BulkImportSection({ gruposConexion, sociedades }: { gruposConexion: any[], sociedades: any[] }) {
  const [pastedText, setPastedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; count: number; errors: any[] } | null>(null);
  const [selectedImportGroupId, setSelectedImportGroupId] = useState("");

  const handleDownloadTemplate = () => {
    let csvContent = "\uFEFF"; // UTF-8 BOM para Excel
    if (selectedImportGroupId) {
      csvContent += "Nombre Completo,Correo,Teléfono\n";
      csvContent += "Juan Pérez,juan.perez@email.com,8095551234\n";
      csvContent += "María Gómez,maria.gomez@email.com,8095555678\n";
    } else {
      csvContent += "Sociedad,Grupo de Conexión,Nombre Completo,Correo,Teléfono,Sexo,Edad\n";
      if (gruposConexion && gruposConexion.length > 0) {
        gruposConexion.forEach((g: any) => {
          const socName = sociedades.find((s: any) => s.id === g.sociedad_id)?.nombre_sociedad || "Sociedad General";
          csvContent += `"${socName}","${g.nombre_grupo}","Ejemplo ${g.nombre_grupo}","ejemplo@email.com","8095550000","M","30"\n`;
        });
      } else {
        csvContent += `"Sociedad de Honor","Grupo Jóvenes","Juan Pérez","juan.perez@email.com","8095551234","M","25"\n`;
      }
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", selectedImportGroupId ? "plantilla_grupo_conexion.csv" : "plantilla_importacion_miembros.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const lines = text.split("\n");
        if (lines.length > 0 && (lines[0].toLowerCase().includes("nombre") || lines[0].toLowerCase().includes("sociedad"))) {
          setPastedText(lines.slice(1).join("\n"));
        } else {
          setPastedText(text);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!pastedText.trim()) {
      alert("Por favor copia y pega algunos datos primero o selecciona un archivo de Excel.");
      return;
    }
    setLoading(true);
    setResult(null);

    // Parsear el texto pegado (Separado por tabulaciones o comas)
    const lines = pastedText.split("\n");
    const rows = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      const separator = line.includes("\t") ? "\t" : ",";
      const parts = line.split(separator);

      let sociedadName = "";
      let grupoName = "";
      let nombre = "";
      let correo = "";
      let telefono = "";
      let sexo = "";
      let edad = "";

      if (selectedImportGroupId) {
        // Formato simple de grupo directo: Nombre | Correo | Teléfono
        nombre = parts[0]?.trim()?.replace(/^"|"$/g, '') || "";
        correo = parts[1]?.trim()?.replace(/^"|"$/g, '') || "";
        telefono = parts[2]?.trim()?.replace(/^"|"$/g, '') || "";
      } else {
        // Formato completo clasificado: Sociedad | Grupo | Nombre | Correo | Teléfono | Sexo | Edad
        sociedadName = parts[0]?.trim()?.replace(/^"|"$/g, '') || "";
        grupoName = parts[1]?.trim()?.replace(/^"|"$/g, '') || "";
        nombre = parts[2]?.trim()?.replace(/^"|"$/g, '') || "";
        correo = parts[3]?.trim()?.replace(/^"|"$/g, '') || "";
        telefono = parts[4]?.trim()?.replace(/^"|"$/g, '') || "";
        sexo = parts[5]?.trim()?.replace(/^"|"$/g, '') || "";
        edad = parts[6]?.trim()?.replace(/^"|"$/g, '') || "";
      }

      if (nombre) {
        rows.push({ sociedadName, grupoName, nombre, correo, telefono, sexo, edad });
      }
    }

    if (rows.length === 0) {
      alert("No se detectaron filas válidas. Revisa el formato.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "bulkImportMiembros", 
          data: { 
            rows,
            grupo_conexion_id: selectedImportGroupId || null
          } 
        }),
      });
      const resData = await res.json();
      if (resData.error) {
        alert("Error al importar: " + resData.error);
      } else {
        setResult({
          success: true,
          count: resData.count,
          errors: resData.errors || [],
        });
        setPastedText("");
      }
    } catch (e) {
      console.error(e);
      alert("Ocurrió un error en la conexión.");
    } finally {
      setLoading(false);
    }
  };

  const selectedGroup = gruposConexion.find(g => g.id === selectedImportGroupId);
  const selectedGroupSocName = selectedGroup ? (sociedades.find(s => s.id === selectedGroup.sociedad_id)?.nombre_sociedad || "") : "";

  return (
    <div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>📥 Carga Masiva de Miembros</h2>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
        Importa múltiples miembros al mismo tiempo descargando nuestra plantilla de Excel o cargando tu archivo directamente.
      </p>

      <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        {/* BOTONES DE DESCARGA DE PLANTILLA Y CARGA DE ARCHIVO */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <button
            onClick={handleDownloadTemplate}
            type="button"
            style={{ padding: '0.55rem 1.1rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 4px rgba(22,163,74,0.2)' }}
          >
            📥 Descargar Plantilla en Excel (.csv)
          </button>
          <label style={{ padding: '0.55rem 1.1rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 4px rgba(2,132,199,0.2)' }}>
            📁 Seleccionar Archivo Excel / CSV
            <input type="file" accept=".csv, .txt" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>
            Método de Importación:
          </label>
          <select 
            value={selectedImportGroupId} 
            onChange={(e) => setSelectedImportGroupId(e.target.value)}
            style={{ padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', width: '100%', maxWidth: '450px', fontSize: '0.85rem', outline: 'none' }}
          >
            <option value="">📋 Cargar un solo Excel clasificado por Sociedad y Grupo de Conexión</option>
            {gruposConexion.map(g => {
              const socName = sociedades.find(s => s.id === g.sociedad_id)?.nombre_sociedad || "";
              return (
                <option key={g.id} value={g.id}>
                  Directo al Grupo: {g.nombre_grupo} ({socName})
                </option>
              );
            })}
          </select>
        </div>

        <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>
          Instrucciones para las Columnas de tu Excel:
        </h3>
        
        {selectedImportGroupId ? (
          <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: '1.5', margin: 0 }}>
            Has elegido cargar directamente al grupo: <strong>{selectedGroup?.nombre_grupo} ({selectedGroupSocName})</strong>.<br />
            1. Copia y pega un listado simple de tu Excel con el siguiente orden de columnas:<br />
            <span style={{ display: 'inline-block', background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.5rem', borderRadius: '4px', margin: '0.25rem 0', fontFamily: 'monospace', fontWeight: 600 }}>
              Nombre Completo | Correo (Opcional) | Teléfono (Opcional)
            </span><br />
            2. Todos los miembros serán agregados a este grupo sin necesidad de registrar datos demográficos adicionales.
          </p>
        ) : (
          <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: '1.5', margin: 0 }}>
            1. Copia y pega las filas de tu Excel clasificado. Las columnas deben ir en el siguiente orden:<br />
            <span style={{ display: 'inline-block', background: '#f1f5f9', color: '#334155', padding: '0.2rem 0.5rem', borderRadius: '4px', margin: '0.25rem 0', fontFamily: 'monospace', fontWeight: 600 }}>
              Sociedad | Grupo de Conexión | Nombre Completo | Correo (Opcional) | Teléfono (Opcional) | Sexo (Opcional) | Edad (Opcional)
            </span><br />
            2. El sistema buscará automáticamente la sociedad y el grupo en base a los nombres que ingreses en las primeras dos columnas y vinculará a los miembros directamente a su grupo de conexión correspondiente.
          </p>
        )}

        <textarea
          rows={8}
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          placeholder={selectedImportGroupId ? `Ejemplo:\nAlexander Palacio Espiritusanto	alex.palacio@gmail.com	8095551234\nJuan Pérez` : `Ejemplo:\nCaballeros / Hombres de Honor	Caballeros Jóvenes	Alexander Palacio Espiritusanto	alex.palacio@gmail.com	8095551234	M	42\nSociedad de Damas	Damas de Honor	María Alejandra Pérez`}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontFamily: 'monospace',
            fontSize: '0.82rem',
            marginTop: '1rem',
            marginBottom: '1rem',
            outline: 'none',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
          {loading && <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Cargando listado...</span>}
          <button
            onClick={handleImport}
            disabled={loading}
            style={{
              padding: '0.55rem 1.5rem',
              background: '#0284c7',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            🚀 Procesar e Importar Listado
          </button>
        </div>

        {result && (
          <div style={{ marginTop: '1.25rem', padding: '1rem', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}>
            <h4 style={{ fontWeight: 'bold', fontSize: '0.88rem', marginBottom: '0.4rem' }}>
              ¡Carga masiva completada!
            </h4>
            <p style={{ fontSize: '0.82rem', margin: 0 }}>
              Se importaron/actualizaron con éxito <strong>{result.count}</strong> miembros.
            </p>
            {result.errors.length > 0 && (
              <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#991b1b' }}>
                <p style={{ fontWeight: 'bold', fontSize: '0.78rem', margin: '0 0 0.25rem 0' }}>Hubo errores en {result.errors.length} registros:</p>
                <ul style={{ fontSize: '0.75rem', margin: '0 0 0 1rem', paddingLeft: 0 }}>
                  {result.errors.map((err, i) => (
                    <li key={i}><strong>{err.name}</strong>: {err.error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          )}
      </div>
    </div>
  );
}

// ── COMPONENTE: GESTIÓN DE GRUPOS DE FAMILIAS (ADMIN) ──────────
function GruposFamiliaAdminSection({ miembros, lideres, etapas }: { miembros: any[]; lideres: any[]; etapas: any[] }) {
  const [gruposFamilia, setGruposFamilia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario nuevo grupo
  const [numGrupo, setNumGrupo] = useState("");
  const [nombreGrupo, setNombreGrupo] = useState("");
  const [iconoGrupo, setIconoGrupo] = useState("👨‍👩‍👧‍👦");
  const [descripcionGrupo, setDescripcionGrupo] = useState("");

  // Galería de Íconos Sugeridos
  const availableIcons = ["👨‍👩‍👧‍👦", "🏡", "🌳", "⚓", "🕊️", "🔥", "🛡️", "⭐", "⛰️", "💡", "❤️", "🙌"];

  // Modal Asignación de Integrante
  const [assignGrupoId, setAssignGrupoId] = useState<string | null>(null);
  const [selectedPersonaId, setSelectedPersonaId] = useState("");
  const [assignAllFamily, setAssignAllFamily] = useState(true);

  const fetchGruposFamilia = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/grupos-familia");
      const data = await res.json();
      if (data.grupos) setGruposFamilia(data.grupos);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGruposFamilia();
  }, []);

  const handleCreateGrupo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreGrupo.trim()) return;

    try {
      const res = await fetch("/api/grupos-familia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createGrupoFamilia",
          data: {
            numero_grupo: numGrupo ? parseInt(numGrupo) : gruposFamilia.length + 1,
            nombre_grupo: nombreGrupo.trim(),
            logo_url: iconoGrupo,
            descripcion: descripcionGrupo.trim()
          }
        })
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      else {
        setNumGrupo("");
        setNombreGrupo("");
        setIconoGrupo("👨‍👩‍👧‍👦");
        setDescripcionGrupo("");
        fetchGruposFamilia();
      }
    } catch (err) {
      alert("Error al crear Grupo de Familia.");
    }
  };

  const handleDeleteGrupo = async (id: string) => {
    if (!confirm("¿Eliminar este Grupo de Familia? Los integrantes pasarán a no tener grupo asignado.")) return;
    try {
      await fetch("/api/grupos-familia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteGrupoFamilia", data: { id } })
      });
      fetchGruposFamilia();
    } catch (e) {
      alert("Error al eliminar.");
    }
  };

  const handleAssignPersona = async () => {
    if (!assignGrupoId || !selectedPersonaId) return;
    try {
      const res = await fetch("/api/grupos-familia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assignPersonaToGrupoFamilia",
          data: {
            persona_id: selectedPersonaId,
            grupo_familia_id: assignGrupoId,
            assignFamilyCode: assignAllFamily
          }
        })
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      else {
        setAssignGrupoId(null);
        setSelectedPersonaId("");
        fetchGruposFamilia();
      }
    } catch (err) {
      alert("Error al asignar.");
    }
  };

  return (
    <div>
      {/* Formulario Crear Grupo de Familia */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #cbd5e1', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: 800 }}>
          🏡 Crear Nuevo Grupo de Familia
        </h3>
        <form onSubmit={handleCreateGrupo} style={{ display: 'grid', gridTemplateColumns: '80px 2fr 1fr 2fr', gap: '0.75rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.2rem' }}>No. Grupo</label>
            <input 
              type="number" 
              placeholder={`Ej: ${gruposFamilia.length + 1}`}
              value={numGrupo} 
              onChange={(e) => setNumGrupo(e.target.value)} 
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.2rem' }}>Nombre del Grupo *</label>
            <input 
              type="text" 
              required 
              placeholder="Ej: Familia de Fe" 
              value={nombreGrupo} 
              onChange={(e) => setNombreGrupo(e.target.value)} 
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.2rem' }}>Ícono / Emoji</label>
            <select 
              value={iconoGrupo}
              onChange={(e) => setIconoGrupo(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', backgroundColor: 'white' }}
            >
              {availableIcons.map((ic, i) => (
                <option key={i} value={ic}>{ic} {ic === "👨‍👩‍👧‍👦" ? "Familia" : ic === "🏡" ? "Hogar" : ic === "🌳" ? "Árbol" : ic === "⚓" ? "Ancla" : ic === "🕊️" ? "Paloma" : ic === "🔥" ? "Fuego" : ic === "🛡️" ? "Escudo" : ic}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.2rem' }}>Descripción breve</label>
            <input 
              type="text" 
              placeholder="Ej: Grupo de familias zona norte" 
              value={descripcionGrupo} 
              onChange={(e) => setDescripcionGrupo(e.target.value)} 
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
            />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="submit" style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', padding: '0.5rem 1.25rem', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}>
              + Registrar Grupo de Familia
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Grupos de Familias */}
      {loading ? (
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Cargando Grupos de Familias...</p>
      ) : gruposFamilia.length === 0 ? (
        <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', padding: '2rem', borderRadius: '8px', textAlign: 'center', color: '#64748b' }}>
          No hay Grupos de Familias configurados aún. Utiliza el formulario arriba para registrar el primero.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {gruposFamilia.map((gf) => (
            <div key={gf.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>{gf.logo_url || "👨‍👩‍👧‍👦"}</span>
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#dcfce7', color: '#166534', fontWeight: 800, padding: '2px 8px', borderRadius: '12px' }}>
                    Grupo #{gf.numero_grupo}
                  </span>
                  <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{gf.nombre_grupo}</strong>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button 
                    onClick={() => setAssignGrupoId(gf.id)}
                    style={{ background: '#0284c7', color: 'white', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    + Asignar Familia / Integrante
                  </button>
                  <button 
                    onClick={() => handleDeleteGrupo(gf.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}
                    title="Eliminar Grupo de Familia"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Directiva del Grupo */}
              <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem', padding: '0.6rem 0.85rem', background: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>👤 Directiva / Líderes:</span>
                {gf.directiva && gf.directiva.map((lid: any) => (
                  <span key={lid.id} style={{ fontSize: '0.78rem', backgroundColor: '#e2e8f0', color: '#0f172a', padding: '2px 8px', borderRadius: '6px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    {lid.nombre} ({lid.telefono})
                    <button 
                      onClick={async () => {
                        await fetch("/api/grupos-familia", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "removeLiderGrupoFamilia", data: { lider_id: lid.id } })
                        });
                        fetchGruposFamilia();
                      }}
                      style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}
                    >✕</button>
                  </span>
                ))}
                <select
                  value=""
                  onChange={async (e) => {
                    const val = e.target.value;
                    if (!val) return;
                    await fetch("/api/grupos-familia", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "addLiderGrupoFamilia",
                        data: { grupo_familia_id: gf.id, persona_id: val }
                      })
                    });
                    fetchGruposFamilia();
                  }}
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}
                >
                  <option value="">+ Añadir Líder al Grupo...</option>
                  {miembros.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Integrantes asignados */}
              <div style={{ marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                  👨‍👩‍👧‍👦 Integrantes Registrados ({gf.personas ? gf.personas.length : 0}):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
                  {gf.personas && gf.personas.map((p: any) => (
                    <span key={p.id} style={{ fontSize: '0.75rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', padding: '2px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      {p.nombre} {p.familia_codigo ? `(${p.familia_codigo})` : ''}
                      <button 
                        onClick={async () => {
                          await fetch("/api/grupos-familia", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              action: "assignPersonaToGrupoFamilia",
                              data: { persona_id: p.id, grupo_familia_id: null }
                            })
                          });
                          fetchGruposFamilia();
                        }}
                        style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px' }}
                        title="Desvincular del grupo"
                      >✕</button>
                    </span>
                  ))}
                  {(!gf.personas || gf.personas.length === 0) && (
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>No hay integrantes vinculados aún.</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Asignar Persona a Grupo de Familia */}
      {assignGrupoId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setAssignGrupoId(null)}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', width: '100%', maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: 800 }}>➕ Asignar Miembro a Grupo de Familia</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>Seleccionar Persona</label>
              <select 
                value={selectedPersonaId} 
                onChange={(e) => setSelectedPersonaId(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', background: 'white' }}
              >
                <option value="">Buscar persona...</option>
                {miembros.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} {m.familia_codigo ? `(Código Fam: ${m.familia_codigo})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.25rem', backgroundColor: '#f0fdf4', padding: '0.75rem', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#166534', fontWeight: 600, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={assignAllFamily} 
                  onChange={(e) => setAssignAllFamily(e.target.checked)} 
                  style={{ accentColor: '#16a34a' }}
                />
                Asignar también a toda su familia vinculada (mismo código)
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setAssignGrupoId(null)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleAssignPersona} style={{ background: '#0284c7', color: 'white', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Guardar Asignación</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
