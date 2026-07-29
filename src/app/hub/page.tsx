"use client";
import { useState, useEffect } from "react";
import styles from "./hub.module.css";
import Link from "next/link";

export default function Hub() {
  const [churchData, setChurchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null); // "info" | "agenda" | "contacto" | "recursos"
  const [selectedSociety, setSelectedSociety] = useState<any | null>(null);
  const [activeSocTab, setActiveSocTab] = useState<"info" | "grupos">("info");
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [infoTab, setInfoTab] = useState("nosotros"); // "nosotros" | "mision" | "valores" | "historia"
  const [currentSlide, setCurrentSlide] = useState(0);


  // Estados para Comunicados Oficiales
  const [comunicadosList, setComunicadosList] = useState<any[]>([]);
  const [mandatoryAnnouncements, setMandatoryAnnouncements] = useState<any[]>([]);
  const [currentMandatoryIndex, setCurrentMandatoryIndex] = useState(0);

  // Estados para Notificaciones In-App
  const [notificacionesList, setNotificacionesList] = useState<any[]>([]);

  // Estados para Peticiones de Oración
  const [showOracionModal, setShowOracionModal] = useState(false);
  const [oracionPeticion, setOracionPeticion] = useState("");
  const [oracionNombre, setOracionNombre] = useState("");
  const [oracionConfidencial, setOracionConfidencial] = useState(false);
  const [oracionEnviando, setOracionEnviando] = useState(false);
  const [oracionEnviado, setOracionEnviado] = useState(false);
  const [showAllMonths, setShowAllMonths] = useState(false);

  const [promoEvent, setPromoEvent] = useState<any>(null);
  const [showPromo, setShowPromo] = useState(false);
  const [isPromoRegistered, setIsPromoRegistered] = useState(false);
  
  const [promoProyecto, setPromoProyecto] = useState<any>(null);
  const [showPromoProyecto, setShowPromoProyecto] = useState(false);
  const [promesaMonto, setPromesaMonto] = useState("");
  const [promesaEnviando, setPromesaEnviando] = useState(false);

  const [userId, setUserId] = useState<string|null>(null);
  const [userPersonaId, setUserPersonaId] = useState<string|null>(null);
  const [userRole, setUserRole] = useState<string|null>(null);
  const [canSwitchRole, setCanSwitchRole] = useState(false);
  const [viewingAs, setViewingAs] = useState<string|null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [hasPledgedPromo, setHasPledgedPromo] = useState(false);
  const [pendingFormId, setPendingFormId] = useState<string|null>(null);
  const [pendingFormObj, setPendingFormObj] = useState<any|null>(null);
  const [pendingFormsList, setPendingFormsList] = useState<any[]>([]);
  const [showFormFloatingModal, setShowFormFloatingModal] = useState(false);

  const fetchComunicados = async () => {
    try {
      const res = await fetch("/api/comunicados");
      const data = await res.json();
      if (!data.error) {
        setComunicadosList(data);
        const unreadMandatory = data.filter((c: any) => c.esObligatorio && !c.leido);
        setMandatoryAnnouncements(unreadMandatory);
      }
    } catch (e) {
      console.error("Error al cargar comunicados", e);
    }
  };

  const fetchNotificaciones = async () => {
    try {
      const res = await fetch("/api/notificaciones");
      const data = await res.json();
      if (!data.error) {
        setNotificacionesList(data);
      }
    } catch (e) {
      console.error("Error al cargar notificaciones", e);
    }
  };

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const authRes = await fetch("/api/auth");
        if (authRes.status === 401) {
          window.location.href = "/";
          return;
        }
        
        const dataAuth = await authRes.json();
        if (dataAuth.error) {
          window.location.href = "/";
          return;
        }

        setUserId(dataAuth.id);
        setUserPersonaId(dataAuth.persona_id);
        setUserRole(dataAuth.rol);
        setCanSwitchRole(dataAuth.canSwitchRole || false);
        setViewingAs(dataAuth.viewingAs || dataAuth.rol);

        // Todas las llamadas en paralelo después del auth
        const [iglesiaRes, evRes, proyRes, formRes] = await Promise.all([
          fetch("/api/iglesia").catch(() => null),
          fetch("/api/eventos").catch(() => null),
          fetch("/api/finanzas/proyectos").catch(() => null),
          fetch("/api/formularios/pendientes").catch(() => null),
        ]);

        // Iglesia
        if (iglesiaRes?.ok) {
          const data = await iglesiaRes.json();
          if (!data.error) setChurchData(data);
        }

        // Eventos
        if (evRes?.ok) {
          const eventos = await evRes.json();
          const userEtapaId = dataAuth.persona?.etapa_id;
          const promo = eventos.find((e: any) => e.estado === 'PROMOCION' && (!e.target_etapa_id || e.target_etapa_id === userEtapaId));
          if (promo) {
             setPromoEvent(promo);
             const isRegistered = promo.asistentes?.some((a:any) => a.persona_id === dataAuth.persona_id);
             setIsPromoRegistered(isRegistered);
          }
        }

        // Proyectos (Promesas de Fe) para promoción
        if (proyRes?.ok) {
          const proyectos = await proyRes.json();
          const promoP = proyectos.find((p: any) => p.promocionar_hub && p.estado === 'ACTIVO');
          if (promoP) {
             setPromoProyecto(promoP);
             const resProm = await fetch("/api/finanzas/promesas").catch(() => null);
             if (resProm?.ok) {
               const allProm = await resProm.json();
               const hasPledged = Array.isArray(allProm) && allProm.some((p:any) => p.proyecto_id === promoP.id && p.persona_id === dataAuth.persona_id);
               setHasPledgedPromo(hasPledged);
             }
          }
        }

        // Comunicados y notificaciones en paralelo
        Promise.all([
          fetch("/api/comunicados").then(r => r.json()).then(data => {
            if (!data.error) {
              setComunicadosList(data);
              setMandatoryAnnouncements(data.filter((c: any) => c.esObligatorio && !c.leido));
            }
          }).catch(() => {}),
          fetch("/api/notificaciones").then(r => r.json()).then(data => {
            if (!data.error) setNotificacionesList(data);
          }).catch(() => {}),
        ]);

        // Formularios pendientes
        if (formRes?.ok) {
          const formData = await formRes.json();
          if (formData.pending) {
             setPendingFormId(formData.pending);
             setPendingFormObj(formData.pendingForm || null);
             setPendingFormsList(formData.pendingForms || []);
             if (typeof window !== 'undefined' && !sessionStorage.getItem('dismissed_form_' + formData.pending)) {
               setShowFormFloatingModal(true);
             }
          }
        }

      } catch (err) {
        console.error("Error verifying authentication", err);
        window.location.href = "/";
      } finally {
        setLoading(false);
      }
    };
    checkAuthAndLoad();
  }, []);

  useEffect(() => {
    if (selectedSociety) {
      setActiveSocTab("info");
      setShowContactForm(false);
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setContactMessage("");
      setContactSuccess(false);
      setContactError(null);
    }
  }, [selectedSociety]);

  // Estados para Formulario de Contacto de Directiva
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  const handleContactDirectivaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim() || !contactMessage.trim()) {
      setContactError("Todos los campos son obligatorios.");
      return;
    }
    setContactLoading(true);
    setContactError(null);
    setContactSuccess(false);

    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: contactName.trim(),
          email: contactEmail.trim(),
          telefono: contactPhone.trim(),
          mensaje: contactMessage.trim(),
          sociedad_id: selectedSociety.id
        })
      });
      const data = await res.json();
      if (data.error) {
        setContactError(data.error);
      } else {
        setContactSuccess(true);
        setContactName("");
        setContactEmail("");
        setContactPhone("");
        setContactMessage("");
      }
    } catch (err) {
      console.error(err);
      setContactError("Error de conexión al servidor.");
    } finally {
      setContactLoading(false);
    }
  };


  const sliderImages = churchData?.imagenes_slider || [];

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

  useEffect(() => {
    if (sliderImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [sliderImages.length]);

  const getSocietyEmoji = (name: string) => {
    const lowercase = name.toLowerCase();
    if (lowercase.includes("joven") || lowercase.includes("juvenil")) return "⚡";
    if (lowercase.includes("caballero") || lowercase.includes("hombre")) return "👑";
    if (lowercase.includes("dama") || lowercase.includes("mujer") || lowercase.includes("madre")) return "🌹";
    if (lowercase.includes("pareja") || lowercase.includes("matrimonio") || lowercase.includes("familia")) return "💑";
    if (lowercase.includes("niño") || lowercase.includes("infantil") || lowercase.includes("cuna")) return "🎒";
    return "👥";
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <div style={{ border: '4px solid #e2e8f0', borderTop: '4px solid #0284c7', borderRadius: '50%', width: '50px', height: '50px', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', color: '#64748b', fontWeight: 600 }}>Cargando portal...</p>
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Fallback defaults if no database entries
  const name = churchData?.nombre_iglesia || "Mi Iglesia Local";
  const slogan = churchData?.slogan || "Conectando Vidas con el Propósito de Dios";
  const color = churchData?.color_principal || "#0284c7";
  const logo = churchData?.logo_url;
  const description = churchData?.descripcion || "Somos una iglesia local dedicada a la edificación espiritual y el servicio a nuestra comunidad.";
  const quienes_somos = churchData?.quienes_somos || "";
  const mision = churchData?.mision || "";
  const vision = churchData?.vision || "";
  const valores = churchData?.valores || "";
  const historia = churchData?.historia || "";
  const phone = churchData?.contacto_telefono || "No especificado";
  const email = churchData?.contacto_email || "No especificado";
  const address = churchData?.contacto_direccion || "";
  const link_google_maps = churchData?.link_google_maps;
  const link_waze = churchData?.link_waze;
  const googleMapsUrl = link_google_maps || (address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : "");
  const wazeUrl = link_waze || (address ? `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes` : "");
  const socials = churchData?.redes_sociales || { facebook: "", instagram: "", youtube: "" };
  const events = churchData?.eventos || [];
  const resources = churchData?.recursos || [];
  const sociedades = churchData?.sociedades || [];
  const temaAnual = churchData?.tema_anual || null;
  const currentMonthNum = new Date().getMonth() + 1;
  const currentTheme = temaAnual?.meses?.find((m: any) => m.mes === currentMonthNum);

  // Obtener actividades de hoy y el evento próximo de forma dinámica
  const getEventosDeHoyYProximo = () => {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    const fechaHoyStr = `${yyyy}-${mm}-${dd}`;

    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const diaSemanaHoy = dias[hoy.getDay()];

    const deHoy: any[] = [];
    const futuros: { event: any; nextDate: Date; displayDateText: string }[] = [];

    events.forEach((ev: any) => {
      const tipo = ev.tipo || "ESPECIAL";

      if (tipo === "ESPECIAL") {
        if (ev.fecha === fechaHoyStr) {
          deHoy.push(ev);
        } else if (ev.fecha && ev.fecha > fechaHoyStr) {
          const dateObj = new Date(`${ev.fecha}T${ev.hora || "00:00"}:00`);
          futuros.push({ 
            event: ev, 
            nextDate: dateObj, 
            displayDateText: `${ev.fecha}`
          });
        }
      } else if (tipo === "REGULAR") {
        if (ev.diaSemana === diaSemanaHoy) {
          if (ev.hora) {
            const [h, m] = ev.hora.split(":");
            const evH = parseInt(h) || 0;
            const evM = parseInt(m) || 0;
            const nowH = hoy.getHours();
            const nowM = hoy.getMinutes();

            if (nowH < evH || (nowH === evH && nowM < evM)) {
              deHoy.push(ev);
            } else {
              const nextDate = new Date();
              nextDate.setDate(hoy.getDate() + 7);
              nextDate.setHours(evH, evM, 0, 0);
              futuros.push({ 
                event: ev, 
                nextDate, 
                displayDateText: `Próximo ${ev.diaSemana}`
              });
            }
          } else {
            deHoy.push(ev);
          }
        } else {
          const targetIdx = dias.indexOf(ev.diaSemana);
          if (targetIdx !== -1) {
            let diff = targetIdx - hoy.getDay();
            if (diff < 0) diff += 7;
            const nextDate = new Date();
            nextDate.setDate(hoy.getDate() + diff);
            if (ev.hora) {
              const [h, m] = ev.hora.split(":");
              nextDate.setHours(parseInt(h) || 0, parseInt(m) || 0, 0, 0);
            } else {
              nextDate.setHours(0, 0, 0, 0);
            }
            futuros.push({ 
              event: ev, 
              nextDate, 
              displayDateText: `Próximo ${ev.diaSemana}`
            });
          }
        }
      }
    });

    futuros.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
    const proximo = futuros.length > 0 ? futuros[0] : null;

    return { deHoy, proximo };
  };

  const { deHoy: eventosDeHoy, proximo: eventoProximo } = getEventosDeHoyYProximo();

  const formatFriendlyDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      };
      const dateObj = new Date(dateStr.replace(/-/g, '\/'));
      return dateObj.toLocaleDateString('es-ES', options);
    } catch (e) {
      return dateStr;
    }
  };

  const regularEvents = events.filter((ev: any) => ev.tipo === "REGULAR");
  
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - 30);
  const fechaLimiteStr = fechaLimite.toISOString().split("T")[0];

  const specialEvents = events
    .filter((ev: any) => ev.tipo === "ESPECIAL" && ev.fecha >= fechaLimiteStr)
    .sort((a: any, b: any) => a.fecha.localeCompare(b.fecha));

  const diasOrden = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const regularEventsSorted = [...regularEvents].sort((a: any, b: any) => {
    return diasOrden.indexOf(a.diaSemana) - diasOrden.indexOf(b.diaSemana);
  });

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


  return (
    <div className={styles.container} style={{ '--accent-blue': color } as React.CSSProperties}>
      {/* Header específico de la Iglesia */}
      <header className={styles.header}>
        <div className={styles.brandBox}>
          <div className={styles.logoGroup}>
            {logo ? (
              <img src={logo} alt={name} className={styles.logoImg} />
            ) : (
              <span className={styles.churchEmoji}>⛪</span>
            )}
            <h1 className={styles.logoName}>{name}</h1>
          </div>
          {slogan && (
            <div className={styles.logoSloganContainer}>
              <p className={styles.logoSlogan}>“{slogan}”</p>
            </div>
          )}
        </div>
        <button
          className={styles.hamburgerBtn}
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          aria-label="Menú"
        >
          {mobileNavOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" /><line x1="6" y1="18" x2="18" y2="6" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
        <div className={`${styles.navWrapper} ${mobileNavOpen ? styles.navOpen : ''}`}>
          <button
            className={styles.quienesSomosBtn}
            onClick={() => { setActiveModal("info"); setMobileNavOpen(false); }}
            title="Quiénes Somos"
          >
            {logo ? (
              <img src={logo} alt="Logo" style={{ width: '18px', height: '18px', objectFit: 'contain', borderRadius: '50%' }} />
            ) : (
              <img src="/Iconos SVG/Identidad-2.svg" alt="Quiénes Somos" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
            )}
            <span>Quiénes Somos</span>
          </button>
          <nav className={styles.navIcons} style={{ alignItems: 'center' }}>
            <button className={styles.navIcon} onClick={() => { setActiveModal("contacto"); setMobileNavOpen(false); }} title="Contacto y Redes">
              <img src="/Iconos SVG/contacto.svg" alt="Contacto" style={{ width: 22, height: 22, objectFit: 'contain' }} />
              <span className={styles.navIconLabel}>Contacto</span>
            </button>
            <button
              className={styles.navIcon}
              onClick={() => { setActiveModal("comunicados"); setMobileNavOpen(false); }}
              title="Comunicados Oficiales"
              style={{ position: 'relative' }}
            >
              <img src="/Iconos SVG/comunicado.png" alt="Comunicados" style={{ width: 22, height: 22, objectFit: 'contain' }} />
              {comunicadosList.some(c => !c.leido) && (
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '8px',
                  width: '10px',
                  height: '10px',
                  backgroundColor: '#ef4444',
                  borderRadius: '50%',
                  border: '2px solid white'
                }} />
              )}
              <span className={styles.navIconLabel}>Comunicados</span>
            </button>
            <button
              className={styles.navIcon}
              onClick={() => { setActiveModal("notifications"); setMobileNavOpen(false); }}
              title="Notificaciones"
              style={{ position: 'relative' }}
            >
              <img src="/Iconos SVG/notificaciones.svg" alt="Notificaciones" style={{ width: 22, height: 22, objectFit: 'contain' }} />
              {notificacionesList.some(n => !n.leido) && (
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '8px',
                  width: '10px',
                  height: '10px',
                  backgroundColor: '#ef4444',
                  borderRadius: '50%',
                  border: '2px solid white'
                }} />
              )}
              <span className={styles.navIconLabel}>Notif.</span>
            </button>
            <button className={styles.navIcon} onClick={() => { setActiveModal("agenda"); setMobileNavOpen(false); }} title="Agenda y Eventos">
              <img src="/Iconos SVG/Agenda.svg" alt="Agenda" style={{ width: 22, height: 22, objectFit: 'contain' }} />
              <span className={styles.navIconLabel}>Agenda</span>
            </button>
            <Link href="/biblioteca" title="Biblioteca Digital (PDF, Videos, Galerías)">
              <button className={styles.navIcon} type="button" onClick={() => setMobileNavOpen(false)}>
                <img src="/Iconos SVG/biblioteca.svg" alt="Biblioteca Digital" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                <span className={styles.navIconLabel}>Biblioteca</span>
              </button>
            </Link>
            <button className={styles.navIcon} onClick={() => { setShowOracionModal(true); setOracionEnviado(false); setMobileNavOpen(false); }} title="Petición de Oración">
              <img src="/Iconos SVG/Peticiones.svg" alt="Oración" style={{ width: 22, height: 22, objectFit: 'contain' }} />
              <span className={styles.navIconLabel}>Oración</span>
            </button>
            {(userRole === "SUPERADMIN" || userRole === "ADMIN_IGLESIA" || userRole === "LIDER") && (
              <Link href={userRole === "SUPERADMIN" ? "/superadmin" : "/admin"} title="Configuración">
                <button className={styles.navIcon} type="button" onClick={() => setMobileNavOpen(false)}>
                  <img src="/Iconos SVG/dashboard.png" alt="Configuración" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                  <span className={styles.navIconLabel}>Config</span>
                </button>
              </Link>
            )}
            <Link href="/perfil" title="Mi Perfil">
              <button className={styles.navIcon} type="button" onClick={() => setMobileNavOpen(false)}>
                <img src="/Iconos SVG/perfil.svg" alt="Mi Perfil" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                <span className={styles.navIconLabel}>Perfil</span>
              </button>
            </Link>
          </nav>
        </div>
      </header>

      {/* MODAL PETICIÓN DE ORACIÓN */}
      {showOracionModal && (
        <div className={styles.modalOverlay} onClick={() => setShowOracionModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src="/Iconos SVG/Peticiones.svg" alt="Oración" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                Petición de Oración
              </span>
              <button className={styles.modalCloseBtn} onClick={() => setShowOracionModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              {oracionEnviado ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🙏</div>
                  <h3 style={{ color: '#0f172a', fontWeight: 800, marginBottom: '0.5rem' }}>¡Tu petición fue enviada!</h3>
                  <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Nuestros pastores y líderes orarán por ti. Que Dios te bendiga.</p>
                  <button
                    onClick={() => setShowOracionModal(false)}
                    style={{ marginTop: '1.5rem', padding: '0.75rem 2rem', background: '#0284c7', color: 'white', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!oracionPeticion.trim()) return;
                  setOracionEnviando(true);
                  try {
                    const res = await fetch('/api/oracion', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'crear', data: { peticion: oracionPeticion, nombre_solicitante: oracionNombre || 'Anónimo', es_confidencial: oracionConfidencial } })
                    });
                    if (res.ok) { setOracionEnviado(true); setOracionPeticion(''); setOracionNombre(''); setOracionConfidencial(false); }
                  } catch(err) { console.error(err); }
                  finally { setOracionEnviando(false); }
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Tu nombre (opcional)</label>
                      <input
                        type="text"
                        value={oracionNombre}
                        onChange={e => setOracionNombre(e.target.value)}
                        placeholder="Dejar en blanco para enviar anónimamente"
                        style={{ width: '100%', padding: '0.7rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Tu petición de oración *</label>
                      <textarea
                        value={oracionPeticion}
                        onChange={e => setOracionPeticion(e.target.value)}
                        placeholder="Escribe aquí tu petición..."
                        rows={4}
                        required
                        style={{ width: '100%', padding: '0.7rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                      />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={oracionConfidencial}
                        onChange={e => setOracionConfidencial(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#0284c7' }}
                      />
                      <span>Petición confidencial <span style={{ color: '#64748b', fontSize: '0.8rem' }}>(solo visible para pastores)</span></span>
                    </label>
                    <button
                      type="submit"
                      disabled={oracionEnviando || !oracionPeticion.trim()}
                      style={{ padding: '0.85rem', background: '#0284c7', color: 'white', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '1rem', opacity: oracionEnviando ? 0.7 : 1, transition: 'opacity 0.2s' }}
                    >
                      {oracionEnviando ? 'Enviando...' : '🙏 Enviar Petición'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <main className={styles.main}>
        {/* Slider Promocional de la Iglesia o Carrusel de Imágenes */}
        {sliderImages.length > 0 ? (
          <section className={styles.heroSliderContainer}>
            <div className={styles.heroSliderTrack}>
              {sliderImages.map((imgSrc: string, idx: number) => (
                <div
                  key={idx}
                  className={`${styles.heroSlide} ${idx === currentSlide ? styles.activeSlide : ""}`}
                  style={{ backgroundImage: `url("${imgSrc}")` }}
                />
              ))}
            </div>
            
            {/* Slide Navigation Dots */}
            {sliderImages.length > 1 && (
              <div className={styles.sliderDots}>
                {sliderImages.map((_: any, idx: number) => (
                  <button
                    key={idx}
                    className={`${styles.sliderDot} ${idx === currentSlide ? styles.activeDot : ""}`}
                    onClick={() => setCurrentSlide(idx)}
                    style={{ backgroundColor: idx === currentSlide ? color : 'rgba(255, 255, 255, 0.4)' }}
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className={styles.heroSlider} style={{ background: `linear-gradient(135deg, ${color}15 0%, ${color}35 100%)` }}>
            <div className={styles.heroContent} style={{ borderColor: `${color}40` }}>
              <h1 className={styles.heroTitle} style={{ color: color }}>
                {name}
              </h1>
              <p className={styles.heroSubtitle}>
                {slogan}
              </p>
            </div>
          </section>
        )}

        {/* 🌟 SECCIÓN VISIÓN DEL AÑO */}
        {temaAnual && (temaAnual.vision_anual || temaAnual.lema_anual) && (
          <section style={{ marginBottom: '2rem' }}>
            <div style={{
              background: `linear-gradient(135deg, ${color} 0%, #0f172a 100%)`,
              borderRadius: '16px',
              color: 'white',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Encabezado Anual */}
              <div style={{ padding: '2rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {temaAnual.logo_url && (
                  <img src={temaAnual.logo_url} alt="Logo de la Visión" style={{ width: '120px', height: '120px', objectFit: 'contain', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.5rem' }} />
                )}
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Visión {temaAnual.anio}
                  </span>
                  <h2 style={{ fontSize: '2.2rem', fontWeight: 900, margin: '0.5rem 0', lineHeight: '1.1' }}>
                    {temaAnual.vision_anual || temaAnual.lema_anual}
                  </h2>
                  {temaAnual.eslogan && (
                    <h3 style={{ fontSize: '1.25rem', color: '#bae6fd', margin: '0 0 0.5rem 0', fontWeight: 700 }}>
                      {temaAnual.eslogan}
                    </h3>
                  )}
                  {(temaAnual.base_biblica || temaAnual.versiculo_clave) && (
                    <p style={{ fontStyle: 'italic', color: '#cbd5e1', margin: '0 0 0.5rem 0', fontSize: '1.05rem' }}>
                      "{temaAnual.base_biblica || temaAnual.versiculo_clave}"
                    </p>
                  )}
                  {temaAnual.descripcion && (
                    <p style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: '1.5', margin: 0, opacity: 0.9 }}>
                      {temaAnual.descripcion}
                    </p>
                  )}
                </div>
              </div>

              {/* Tema del Mes Actual */}
              {currentTheme && currentTheme.tema && (
                <div style={{ padding: '1.5rem 2rem', background: 'rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>📌</span>
                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#bae6fd' }}>
                      Enfoque de {new Date(2024, currentMonthNum - 1).toLocaleString('es', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())}: {currentTheme.tema}
                    </h3>
                  </div>
                  {currentTheme.descripcion && (
                    <p style={{ margin: '0 0 0 2.25rem', color: '#e2e8f0', fontSize: '0.95rem' }}>
                      {currentTheme.descripcion}
                    </p>
                  )}
                </div>
              )}

              {/* Botón para ver todos los meses */}
              <div style={{ padding: '0 2rem 1rem 2rem', display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={() => setShowAllMonths(!showAllMonths)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#cbd5e1',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {showAllMonths ? 'Ocultar Temas Mensuales ▴' : 'Ver Temas Mensuales ▾'}
                </button>
              </div>
              
              {/* Desplegable de Meses */}
              {showAllMonths && (
                <div style={{ padding: '0 2rem 2rem 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                  {temaAnual.meses?.filter((m: any) => m.tema).map((m: any) => (
                    <div key={m.mes} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', borderLeft: m.mes === currentMonthNum ? `4px solid #bae6fd` : '4px solid transparent' }}>
                      <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, marginBottom: '0.25rem' }}>
                        {new Date(2024, m.mes - 1).toLocaleString('es', { month: 'long' })}
                      </span>
                      <strong style={{ display: 'block', color: m.mes === currentMonthNum ? '#bae6fd' : 'white', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                        {m.tema}
                      </strong>
                      {m.descripcion && (
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                          {m.descripcion}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 📋 SECCIÓN ACCIONES PENDIENTES / DESTACADAS (PARA TI - SIDE BY SIDE STRIPS) */}
        {((promoEvent && !isPromoRegistered) || (promoProyecto && !hasPledgedPromo) || pendingFormId || (pendingFormsList && pendingFormsList.length > 0)) && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '-0.5rem', marginBottom: '2rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
              ✨ Para ti (Acciones Destacadas)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              
              {/* Tarjeta Promesa de Fe */}
              {promoProyecto && !hasPledgedPromo && (
                <div 
                  onClick={() => setShowPromoProyecto(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1.15rem',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = color}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ fontSize: '1.5rem', background: '#fef3c7', padding: '0.4rem 0.6rem', borderRadius: '10px', color: '#d97706' }}>🌟</div>
                    <div>
                      <strong style={{ display: 'block', color: '#1e293b', fontSize: '0.95rem', marginBottom: '0.1rem' }}>Promesa de Fe: {promoProyecto.nombre}</strong>
                      <span style={{ color: '#64748b', fontSize: '0.82rem' }}>Participa en este proyecto especial.</span>
                    </div>
                  </div>
                  <span style={{ color: color, fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>Participar →</span>
                </div>
              )}

              {/* Tarjeta Eventos / Cursos */}
              {promoEvent && !isPromoRegistered && (
                <div 
                  onClick={() => setShowPromo(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1.15rem',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = color}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ fontSize: '1.5rem', background: '#e0f2fe', padding: '0.4rem 0.6rem', borderRadius: '10px', color: '#0284c7' }}>
                      {promoEvent.tipo === 'CLASE' ? '🎓' : '🎟️'}
                    </div>
                    <div>
                      <strong style={{ display: 'block', color: '#1e293b', fontSize: '0.95rem', marginBottom: '0.1rem' }}>
                        {promoEvent.tipo === 'CLASE' ? 'Curso:' : 'Evento:'} {promoEvent.nombre}
                      </strong>
                      <span style={{ color: '#64748b', fontSize: '0.82rem' }}>Inscríbete para asegurar tu lugar.</span>
                    </div>
                  </div>
                  <span style={{ color: color, fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>Ver más →</span>
                </div>
              )}

              {/* Tarjetas Formularios / Encuestas */}
              {pendingFormsList && pendingFormsList.length > 0 ? (
                pendingFormsList.map((f: any) => (
                  <Link 
                    key={f.id}
                    href={`/hub/formularios/${f.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1.15rem',
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = color}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{ fontSize: '1.5rem', background: '#dcfce7', padding: '0.4rem 0.6rem', borderRadius: '10px', color: '#16a34a' }}>📝</div>
                        <div>
                          <strong style={{ display: 'block', color: '#1e293b', fontSize: '0.95rem', marginBottom: '0.1rem' }}>{f.titulo || "Encuesta Pendiente"}</strong>
                          <span style={{ color: '#64748b', fontSize: '0.82rem' }}>{f.descripcion ? f.descripcion : 'Completa este formulario.'}</span>
                        </div>
                      </div>
                      <span style={{ color: color, fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>Completar →</span>
                    </div>
                  </Link>
                ))
              ) : pendingFormId ? (
                <Link 
                  href={`/hub/formularios/${pendingFormId}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1.15rem',
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = color}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{ fontSize: '1.5rem', background: '#dcfce7', padding: '0.4rem 0.6rem', borderRadius: '10px', color: '#16a34a' }}>📝</div>
                      <div>
                        <strong style={{ display: 'block', color: '#1e293b', fontSize: '0.95rem', marginBottom: '0.1rem' }}>Formulario Pendiente</strong>
                        <span style={{ color: '#64748b', fontSize: '0.82rem' }}>Información pendiente por responder.</span>
                      </div>
                    </div>
                    <span style={{ color: color, fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>Completar →</span>
                  </div>
                </Link>
              ) : null}

            </div>
          </section>
        )}

        {/* Widget de Agenda Destacada: Agenda Semanal vs Eventos Especiales */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1rem' }}>
          
          {/* Agenda Semanal Regular */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🔄 Agenda Semanal Regular
            </h3>

            {regularEventsSorted.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 0', color: '#94a3b8', textAlign: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '2rem' }}>🕊️</span>
                <p style={{ fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>No hay reuniones semanales configuradas.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {regularEventsSorted.map((ev: any) => {
                  const linkedSoc = sociedades.find((s: any) => s.id === ev.sociedadId);
                  return (
                    <div key={ev.id} style={{ borderLeft: `3px solid ${color}`, paddingLeft: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <strong style={{ color: '#1e293b', fontSize: '0.9rem' }}>{ev.titulo}</strong>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: color, background: `${color}15`, padding: '1px 5px', borderRadius: '4px' }}>
                          {ev.diaSemana} {ev.hora ? `@ ${ev.hora}` : ''}
                        </span>
                        {linkedSoc && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0369a1', background: '#e0f2fe', padding: '1px 5px', borderRadius: '4px' }}>
                            👥 {linkedSoc.nombre_sociedad.slice(0, 18)}
                          </span>
                        )}
                      </div>
                      {ev.descripcion && <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>{ev.descripcion}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Eventos Especiales */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              ✨ Eventos Especiales
            </h3>

            {specialEvents.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 0', color: '#94a3b8', textAlign: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '2rem' }}>📅</span>
                <p style={{ fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>No hay eventos especiales programados.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {specialEvents.map((ev: any) => {
                  const linkedSoc = sociedades.find((s: any) => s.id === ev.sociedadId);
                  return (
                    <div key={ev.id} style={{ borderLeft: `3px solid #f59e0b`, paddingLeft: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <strong style={{ color: '#1e293b', fontSize: '0.9rem' }}>{ev.titulo}</strong>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', background: '#fef3c7', padding: '1px 5px', borderRadius: '4px' }}>
                          🗓️ {formatFriendlyDate(ev.fecha)} {ev.hora ? `@ ${ev.hora}` : ''}
                        </span>
                        {linkedSoc && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0369a1', background: '#e0f2fe', padding: '1px 5px', borderRadius: '4px' }}>
                            👥 {linkedSoc.nombre_sociedad.slice(0, 18)}
                          </span>
                        )}
                      </div>
                      {ev.descripcion && <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>{ev.descripcion}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </section>


        {/* Sociedades (Configurables) */}
        <section>
          <h2 className={styles.sectionTitle}>Sociedades y Ministerios</h2>
          {sociedades.length === 0 ? (
            <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No se han configurado sociedades aún.</p>
          ) : (
            <div className={styles.societiesGrid}>
              {sociedades.map((soc: any) => (
                <button 
                  key={soc.id} 
                  className={styles.societyCard} 
                  onClick={() => setSelectedSociety(soc)}
                >
                  <span className={styles.societyIcon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '3.6rem', height: '3.6rem', padding: soc.logo_url ? '0' : '0.8rem', overflow: 'hidden', flexShrink: 0 }}>
                    {soc.logo_url ? (
                      <img src={soc.logo_url} alt={soc.nombre_sociedad} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : (
                      getSocietyEmoji(soc.nombre_sociedad)
                    )}
                  </span>
                  <span className={styles.societyName}>{soc.nombre_sociedad}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Banner Nuevo Creyente */}
        <section className={styles.registerBanner}>
          <div className={styles.registerText}>
            <h3>¿Eres nuevo en nuestra iglesia?</h3>
            <p>Únete y comienza tu ruta de crecimiento espiritual.</p>
          </div>
          <Link href="/registro">
            <button className={styles.btnPrimary} style={{ backgroundColor: color, boxShadow: `0 4px 14px ${color}40` }}>
              🌱 Iniciar Auto-Registro
            </button>
          </Link>
        </section>
      </main>

      <footer className={styles.footer} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem' }}>
        <div className={styles.footerCopyright} style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>
          © 2026 Torre Fuerte AD
        </div>
        
        <div className={styles.footerSocials} style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', justifyContent: 'center' }}>
          {socials.facebook && (
            <a 
              href={socials.facebook} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#1877f2'; e.currentTarget.style.transform = 'scale(1.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.transform = 'scale(1)'; }}
              title="Facebook"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
          )}
          {socials.instagram && (
            <a 
              href={socials.instagram} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#e1306c'; e.currentTarget.style.transform = 'scale(1.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.transform = 'scale(1)'; }}
              title="Instagram"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
          )}
          {socials.youtube && (
            <a 
              href={socials.youtube} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ff0000'; e.currentTarget.style.transform = 'scale(1.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.transform = 'scale(1)'; }}
              title="YouTube"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.163c-.272-1.016-1.07-1.815-2.085-2.087C19.578 3.5 12 3.5 12 3.5s-7.578 0-9.413.576c-1.015.272-1.813 1.071-2.085 2.087C0 8.002 0 12 0 12s0 3.998.576 5.837c.272 1.016 1.07 1.815 2.085 2.087C4.42 20.5 12 20.5 12 20.5s7.578 0 9.413-.576c1.015-.272 1.813-1.07 2.085-2.087C24 15.998 24 12 24 12s0-3.998-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          )}
        </div>

        <div className={styles.footerActions} style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {canSwitchRole && (
            <button 
              className={styles.btnProfile}
              onClick={handleSwitchRole}
              style={{ 
                background: viewingAs === "MIEMBRO" ? "#f0fdf4" : "#eff6ff", 
                color: viewingAs === "MIEMBRO" ? "#166534" : "#1d4ed8",
                border: `1px solid ${viewingAs === "MIEMBRO" ? "#bbf7d0" : "#bfdbfe"}`,
              }}
              title={viewingAs === "MIEMBRO" ? "Vista actual: Miembro. Cambiar a Admin" : "Vista actual: Admin. Cambiar a Miembro"}
            >
              {viewingAs === "MIEMBRO" ? "👤 Miembro" : "👑 Admin"}
            </button>
          )}
          <Link href="/perfil">
            <button className={styles.btnProfile}>
              <img src="/Iconos SVG/perfil.svg" alt="Perfil" style={{ width: '16px', height: '16px', objectFit: 'contain' }} /> Mi Perfil
            </button>
          </Link>
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
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fee2e2";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fef2f2";
            }}
          >
            <img src="/Iconos SVG/salir.svg" alt="Salir" style={{ width: "18px", height: "18px", objectFit: "contain" }} />
          </button>
        </div>
      </footer>

      {/* --- MODALES INTERACTIVOS --- */}

      {/* 1. Modal Información */}
      {activeModal === "info" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>ℹ️ Sobre {name}</h3>
              <button className={styles.modalCloseBtn} onClick={() => setActiveModal(null)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              {logo && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                  <img src={logo} alt="Logo" style={{ maxHeight: '90px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }} />
                </div>
              )}
              <p style={{ fontWeight: 600, color: color, marginBottom: '1.25rem', fontStyle: 'italic', textAlign: 'center' }}>
                "{slogan}"
              </p>

              {/* Sub Pestañas del Modal */}
              <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1.25rem', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                <button 
                  onClick={() => setInfoTab("nosotros")} 
                  style={{ background: infoTab === "nosotros" ? color : 'transparent', color: infoTab === "nosotros" ? 'white' : '#475569', border: '1px solid ' + (infoTab === "nosotros" ? color : '#cbd5e1'), borderRadius: '20px', padding: '0.35rem 0.85rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  Quiénes Somos
                </button>
                <button 
                  onClick={() => setInfoTab("mision")} 
                  style={{ background: infoTab === "mision" ? color : 'transparent', color: infoTab === "mision" ? 'white' : '#475569', border: '1px solid ' + (infoTab === "mision" ? color : '#cbd5e1'), borderRadius: '20px', padding: '0.35rem 0.85rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  Misión y Visión
                </button>
                <button 
                  onClick={() => setInfoTab("valores")} 
                  style={{ background: infoTab === "valores" ? color : 'transparent', color: infoTab === "valores" ? 'white' : '#475569', border: '1px solid ' + (infoTab === "valores" ? color : '#cbd5e1'), borderRadius: '20px', padding: '0.35rem 0.85rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  Valores
                </button>
                <button 
                  onClick={() => setInfoTab("historia")} 
                  style={{ background: infoTab === "historia" ? color : 'transparent', color: infoTab === "historia" ? 'white' : '#475569', border: '1px solid ' + (infoTab === "historia" ? color : '#cbd5e1'), borderRadius: '20px', padding: '0.35rem 0.85rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  Historia
                </button>
              </div>

              {/* Contenido según la pestaña */}
              {infoTab === "nosotros" && (
                <div>
                  <h4 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', marginBottom: '0.5rem' }}>Quiénes Somos</h4>
                  <p style={{ lineHeight: '1.6', color: '#334155', whiteSpace: 'pre-line', fontSize: '0.92rem' }}>
                    {quienes_somos || description}
                  </p>
                  <div style={{ marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                    <h5 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.25rem' }}>📍 Nuestra Ubicación</h5>
                    <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0, marginBottom: '1rem' }}>{address}</p>
                    
                    {address && (
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                        {googleMapsUrl && (
                          <a 
                            href={googleMapsUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem', borderRadius: '20px', backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', border: '1px solid #bae6fd', transition: 'all 0.2s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 2px 5px rgba(3,105,161,0.15)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                          >
                            🗺️ Google Maps
                          </a>
                        )}
                        {wazeUrl && (
                          <a 
                            href={wazeUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem', borderRadius: '20px', backgroundColor: '#fef3c7', color: '#b45309', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', border: '1px solid #fde68a', transition: 'all 0.2s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 2px 5px rgba(180,83,9,0.15)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                          >
                            🚗 Waze
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {infoTab === "mision" && (
                <div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      🎯 Nuestra Misión
                    </h4>
                    <p style={{ lineHeight: '1.6', color: '#334155', whiteSpace: 'pre-line', fontSize: '0.92rem' }}>
                      {mision || "No configurada aún en el panel de administración."}
                    </p>
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      👁️ Nuestra Visión
                    </h4>
                    <p style={{ lineHeight: '1.6', color: '#334155', whiteSpace: 'pre-line', fontSize: '0.92rem' }}>
                      {vision || "No configurada aún en el panel de administración."}
                    </p>
                  </div>
                </div>
              )}

              {infoTab === "valores" && (
                <div>
                  <h4 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', marginBottom: '0.75rem' }}>Valores Fundamentales</h4>
                  {valores ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {valores.split("\n").filter((line: string) => line.trim().length > 0).map((val: string, idx: number) => (
                        <div key={idx} style={{ padding: '0.6rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', borderLeft: `3px solid ${color}`, fontSize: '0.9rem', color: '#334155', fontWeight: 500 }}>
                          {val.replace(/^[•\-\*]\s*/, "")}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.88rem' }}>No se han configurado los valores de la iglesia.</p>
                  )}
                </div>
              )}

              {infoTab === "historia" && (
                <div>
                  <h4 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', marginBottom: '0.5rem' }}>
                    📖 Nuestra Historia
                  </h4>
                  <p style={{ lineHeight: '1.6', color: '#334155', whiteSpace: 'pre-line', fontSize: '0.92rem' }}>
                    {historia || "Nuestra historia local se escribe a diario..."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Agenda */}
      {activeModal === "agenda" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div 
            className={styles.modalContent} 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '850px' }}
          >
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>📅 Agenda y Eventos</h3>
              <button className={styles.modalCloseBtn} onClick={() => setActiveModal(null)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              {events.length === 0 ? (
                <p style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>
                  No hay actividades programadas por el momento. ¡Vuelve pronto!
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                  
                  {/* Columna Izquierda: Agenda Semanal Regular */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: color, display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', margin: 0 }}>
                      🔄 Agenda Semanal Regular
                    </h4>
                    {regularEventsSorted.length === 0 ? (
                      <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>No hay reuniones semanales configuradas.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {regularEventsSorted.map((ev: any) => {
                          const linkedSoc = sociedades.find((s: any) => s.id === ev.sociedadId);
                          return (
                            <div key={ev.id} style={{ borderLeft: `3px solid ${color}`, paddingLeft: '0.75rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.15rem' }}>
                                <strong style={{ color: '#1e293b', fontSize: '0.88rem' }}>{ev.titulo}</strong>
                                {linkedSoc && (
                                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#0369a1', background: '#e0f2fe', padding: '1px 4px', borderRadius: '4px' }}>
                                    {linkedSoc.nombre_sociedad.slice(0, 15)}
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: '0.78rem', color: color, fontWeight: 700, display: 'block', marginBottom: '0.15rem' }}>
                                Todos los {ev.diaSemana} {ev.hora ? `@ ${ev.hora}` : ''}
                              </span>
                              {ev.descripcion && <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>{ev.descripcion}</p>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Columna Derecha: Eventos Especiales */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', margin: 0 }}>
                      ✨ Eventos Especiales
                    </h4>
                    {specialEvents.length === 0 ? (
                      <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>No hay eventos especiales programados.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {specialEvents.map((ev: any) => {
                          const linkedSoc = sociedades.find((s: any) => s.id === ev.sociedadId);
                          return (
                            <div key={ev.id} style={{ borderLeft: '3px solid #f59e0b', paddingLeft: '0.75rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.15rem' }}>
                                <strong style={{ color: '#1e293b', fontSize: '0.88rem' }}>{ev.titulo}</strong>
                                {linkedSoc && (
                                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#0369a1', background: '#e0f2fe', padding: '1px 4px', borderRadius: '4px' }}>
                                    {linkedSoc.nombre_sociedad.slice(0, 15)}
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: '0.78rem', color: '#d97706', fontWeight: 700, display: 'block', marginBottom: '0.15rem' }}>
                                🗓️ {formatFriendlyDate(ev.fecha)} {ev.hora ? `@ ${ev.hora}` : ''}
                              </span>
                              {ev.descripcion && <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>{ev.descripcion}</p>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* 3. Modal Contacto y Redes */}
      {activeModal === "contacto" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>📞 Canales de Comunicación</h3>
              <button className={styles.modalCloseBtn} onClick={() => setActiveModal(null)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Conéctate con nosotros a través de nuestras vías directas y redes oficiales:</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <a href={`tel:${phone.replace(/[^0-9]/g, "")}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 600, textDecoration: 'none' }}>
                  📞 Llamar por teléfono: {phone}
                </a>
                <a href={`mailto:${email}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 600, textDecoration: 'none' }}>
                  ✉️ Enviar correo electrónico: {email}
                </a>
              </div>

              <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem', color: '#0f172a', textAlign: 'center' }}>Redes Sociales Oficiales</h4>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', marginTop: '0.5rem' }}>
                {socials.facebook && (
                  <a 
                    href={socials.facebook} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#e7f0ff', color: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(24,119,242,0.15)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(24,119,242,0.3)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(24,119,242,0.15)'; }}
                    title="Facebook"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}
                {socials.instagram && (
                  <a 
                    href={socials.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fdf0f5', color: '#e1306c', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(225,48,108,0.15)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(225,48,108,0.3)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(225,48,108,0.15)'; }}
                    title="Instagram"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </a>
                )}
                {socials.youtube && (
                  <a 
                    href={socials.youtube} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fff0f0', color: '#ff0000', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(255,0,0,0.15)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,0,0,0.3)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(255,0,0,0.15)'; }}
                    title="YouTube"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.163c-.272-1.016-1.07-1.815-2.085-2.087C19.578 3.5 12 3.5 12 3.5s-7.578 0-9.413.576c-1.015.272-1.813 1.071-2.085 2.087C0 8.002 0 12 0 12s0 3.998.576 5.837c.272 1.016 1.07 1.815 2.085 2.087C4.42 20.5 12 20.5 12 20.5s7.578 0 9.413-.576c1.015-.272 1.813-1.07 2.085-2.087C24 15.998 24 12 24 12s0-3.998-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                )}
                {!socials.facebook && !socials.instagram && !socials.youtube && (
                  <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>No se han configurado redes sociales.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal Comunicados Oficiales */}
      {activeModal === "comunicados" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>📢 Comunicados Oficiales</h3>
              <button className={styles.modalCloseBtn} onClick={() => setActiveModal(null)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              {comunicadosList.length === 0 ? (
                <p style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>
                  No hay comunicados oficiales por el momento. ¡Vuelve pronto!
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {comunicadosList.map((c: any) => (
                    <div 
                      key={c.id} 
                      style={{ 
                        padding: '1.25rem', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '10px', 
                        backgroundColor: c.leido ? '#ffffff' : '#f0f9ff',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div>
                          <h4 style={{ fontWeight: 800, color: '#0f172a', margin: 0, fontSize: '0.95rem' }}>{c.titulo}</h4>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {!c.leido && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, backgroundColor: '#0284c7', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>
                              Nuevo ⚡
                            </span>
                          )}
                          {c.esObligatorio && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, backgroundColor: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px' }}>
                              Obligatorio ⚠️
                            </span>
                          )}
                        </div>
                      </div>
                      {c.imagen && (
                        <div style={{ marginBottom: '0.75rem', maxWidth: '100%', maxHeight: '250px', overflow: 'hidden', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                          <img src={c.imagen} alt="Comunicado" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                      )}

                      <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0 0 1rem 0', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                        {c.contenido}
                      </p>
                      {!c.leido && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch("/api/comunicados", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  action: "markAsRead",
                                  data: { comunicadoId: c.id }
                                })
                              });
                              if (res.ok) {
                                fetchComunicados();
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          style={{
                            backgroundColor: '#0284c7',
                            color: 'white',
                            border: 'none',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Marcar como Leído ✓
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Notificaciones */}
      {activeModal === "notifications" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>🔔 Mis Notificaciones</h3>
              <button className={styles.modalCloseBtn} onClick={() => setActiveModal(null)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              {notificacionesList.length > 0 && notificacionesList.some(n => !n.leido) && (
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/notificaciones", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "markAllAsRead" })
                      });
                      if (res.ok) {
                        fetchNotificaciones();
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginBottom: '1rem',
                    transition: 'all 0.2s'
                  }}
                >
                  Marcar todas como leídas ✓
                </button>
              )}
              {notificacionesList.length === 0 ? (
                <p style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>
                  No tienes notificaciones por el momento. ¡Vuelve pronto!
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {notificacionesList.map((n: any) => (
                    <div 
                      key={n.id} 
                      style={{ 
                        padding: '1.25rem', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '10px', 
                        backgroundColor: n.leido ? '#ffffff' : '#f0f9ff',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div>
                          <h4 style={{ fontWeight: 800, color: '#0f172a', margin: 0, fontSize: '0.95rem' }}>
                            {n.titulo} {n.tipo === "ASISTENCIA" && "⛪"}
                          </h4>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {!n.leido && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, backgroundColor: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>
                            Nueva
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0 0 1rem 0', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                        {n.mensaje}
                      </p>
                      {!n.leido && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch("/api/notificaciones", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  action: "markAsRead",
                                  data: { notificacionId: n.id }
                                })
                              });
                              if (res.ok) {
                                fetchNotificaciones();
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          style={{
                            backgroundColor: '#0284c7',
                            color: 'white',
                            border: 'none',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Marcar como Leída ✓
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Recursos */}
      {activeModal === "recursos" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>📚 Biblioteca de Recursos</h3>
              <button className={styles.modalCloseBtn} onClick={() => setActiveModal(null)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              {resources.length === 0 ? (
                <p style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>
                  No hay recursos ni manuales cargados por el momento. ¡Vuelve pronto!
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {resources.map((rec: any) => (
                    <div key={rec.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: '#f8fafc' }}>
                      <div style={{ flex: 1, paddingRight: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#cbd5e1', color: '#1e293b', padding: '2px 6px', borderRadius: '4px' }}>
                            {rec.tipo}
                          </span>
                          <h4 style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>{rec.titulo}</h4>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>{rec.descripcion}</p>
                      </div>
                      <a href={rec.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', backgroundColor: color, color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                        Descargar 📥
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Detalle de Sociedad */}
      {selectedSociety && (
        <div className={styles.modalOverlay} onClick={() => setSelectedSociety(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {selectedSociety.logo_url ? (
                  <img src={selectedSociety.logo_url} alt={selectedSociety.nombre_sociedad} style={{ width: '2.5rem', height: '2.5rem', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  <span style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', padding: '0.4rem', borderRadius: '50%', width: '2.5rem', height: '2.5rem' }}>
                    {getSocietyEmoji(selectedSociety.nombre_sociedad)}
                  </span>
                )}
                <span>{selectedSociety.nombre_sociedad}</span>
              </h3>
              <button className={styles.modalCloseBtn} onClick={() => setSelectedSociety(null)}>&times;</button>
            </div>
            <div className={styles.modalBody} style={{ padding: '1.25rem 1.5rem' }}>
              
              {/* Selector de Pestañas */}
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                <button 
                  onClick={() => setActiveSocTab("info")} 
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: activeSocTab === "info" ? '#0284c7' : '#64748b',
                    borderBottom: activeSocTab === "info" ? '2px solid #0284c7' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                >
                  ℹ️ Info y Actividades
                </button>
                <button 
                  onClick={() => setActiveSocTab("grupos")} 
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: activeSocTab === "grupos" ? '#0284c7' : '#64748b',
                    borderBottom: activeSocTab === "grupos" ? '2px solid #0284c7' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                >
                  👥 Grupos de Conexión
                </button>
              </div>

              {activeSocTab === "info" ? (
                <div>
                  <div style={{ marginBottom: '1.25rem', backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: '#475569' }}>
                    <div><strong>Edades:</strong> {selectedSociety.rango_edad_min || 0} a {selectedSociety.rango_edad_max || 99} años</div>
                    <div><strong>Público:</strong> {selectedSociety.sexo_requerido === "M" ? "Hombres" : selectedSociety.sexo_requerido === "F" ? "Mujeres" : "Mixto"}</div>
                  </div>

                  {/* Descripción */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginBottom: '0.5rem' }}>Sobre la Sociedad</h4>
                    <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.5', margin: 0, whiteSpace: 'pre-wrap' }}>
                      {selectedSociety.descripcion || "Esta sociedad representa una parte vital de nuestra congregación, enfocada en la edificación y compañerismo mutuo."}
                    </p>
                  </div>

                  {/* Horarios */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginBottom: '0.5rem' }}>📍 Horarios de Reuniones</h4>
                    <div style={{ fontSize: '0.9rem', color: '#166534', lineHeight: '1.5', backgroundColor: '#f0fdf4', borderLeft: '4px solid #22c55e', padding: '0.75rem 1rem', borderRadius: '4px', whiteSpace: 'pre-wrap', fontWeight: 500 }}>
                      {(() => {
                        if (selectedSociety.horarios) {
                          return selectedSociety.horarios;
                        }
                        const socEvents = events.filter((ev: any) => ev.sociedadId === selectedSociety.id);
                        if (socEvents.length > 0) {
                          return socEvents.map((ev: any) => {
                            const timeStr = ev.hora ? ` @ ${ev.hora}` : '';
                            const dateStr = ev.tipo === "ESPECIAL" ? ev.fecha : `Todos los ${ev.diaSemana}`;
                            return `• ${ev.titulo}: ${dateStr}${timeStr}`;
                          }).join("\n");
                        }
                        return "Reuniones periódicas según agenda. Consulta con los líderes.";
                      })()}
                    </div>
                  </div>

                   {/* Actividades Programadas (Globales y Directivas) */}
                  {(() => {
                    const socEvents = events.filter((ev: any) => ev.sociedadId === selectedSociety.id);
                    const directivaEvents = selectedSociety.agenda || [];
                    
                    if (socEvents.length === 0 && directivaEvents.length === 0) return null;
                    
                    return (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginBottom: '0.75rem' }}>📅 Agenda y Actividades de la Sociedad</h4>
                        
                        {/* Actividades de la Agenda de la Iglesia */}
                        {socEvents.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            {socEvents.map((ev: any) => (
                              <div key={ev.id} style={{ padding: '0.6rem 0.75rem', backgroundColor: '#f0f9ff', borderLeft: '3px solid #0284c7', borderRadius: '4px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                                  <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{ev.titulo}</strong>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0284c7' }}>
                                    {ev.tipo === "ESPECIAL" ? ev.fecha : `Todos los ${ev.diaSemana}`} {ev.hora ? `@ ${ev.hora}` : ''}
                                  </span>
                                </div>
                                {ev.descripcion && (
                                  <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0 }}>{ev.descripcion}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Actividades Programadas por la Directiva */}
                        {directivaEvents.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {directivaEvents.map((ev: any) => (
                              <div key={ev.id} style={{ display: "flex", gap: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.6rem" }}>
                                <div style={{ backgroundColor: "#f0f9ff", color: color, borderRadius: "6px", padding: "0.35rem 0.65rem", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: "65px", fontWeight: "bold", fontSize: "0.85rem" }}>
                                  <span style={{ fontSize: "0.65rem", textTransform: "uppercase", opacity: 0.8 }}>
                                    {new Date(ev.fecha.replace(/-/g, '\/')).toLocaleDateString("es-ES", { month: "short" })}
                                  </span>
                                  <span style={{ fontSize: "1.05rem" }}>
                                    {new Date(ev.fecha.replace(/-/g, '\/')).getDate()}
                                  </span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                                  <strong style={{ fontSize: "0.85rem", color: "#1e293b" }}>{ev.titulo}</strong>
                                  {ev.hora && <span style={{ fontSize: "0.72rem", color: "#64748b" }}>⏰ Hora: {ev.hora}</span>}
                                  {ev.descripcion && <p style={{ fontSize: "0.75rem", color: "#475569", margin: "0.1rem 0 0 0" }}>{ev.descripcion}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}


                  {/* Galería */}
                  {(() => {
                    let photos: string[] = [];
                    if (selectedSociety.galeria) {
                      try {
                        photos = JSON.parse(selectedSociety.galeria);
                      } catch (e) {
                        console.error(e);
                      }
                    }
                    if (photos.length === 0) return null;
                    return (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginBottom: '0.75rem' }}>📸 Galería de Actividades</h4>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: photos.length === 1 ? '1fr' : photos.length === 2 ? '1fr 1fr' : 'repeat(3, 1fr)',
                          gap: '0.5rem'
                        }}>
                          {photos.map((img, idx) => (
                            <div 
                              key={idx} 
                              style={{
                                aspectRatio: '4/3',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                border: '1px solid #e2e8f0',
                                cursor: 'zoom-in',
                                position: 'relative',
                                transition: 'all 0.2s',
                              }}
                              onClick={() => setLightboxImg(img)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.04)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <img 
                                src={img} 
                                alt={`Actividad ${idx + 1}`} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Contactar a la Directiva Form */}
                  <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
                    {!showContactForm ? (
                      <button 
                        onClick={() => setShowContactForm(true)}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          backgroundColor: '#f8fafc',
                          color: '#64748b',
                          border: '1px dashed #cbd5e1',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f1f5f9';
                          e.currentTarget.style.color = '#475569';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                          e.currentTarget.style.color = '#64748b';
                        }}
                      >
                        📧 Contactar a la Directiva
                      </button>
                    ) : (
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          📬 Enviar Mensaje a la Directiva
                        </h4>
                        
                        {contactSuccess ? (
                          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <span>✅ ¡Mensaje enviado con éxito a la directiva! Se pondrán en contacto contigo pronto.</span>
                            <button 
                              onClick={() => {
                                setShowContactForm(false);
                                setContactSuccess(false);
                              }}
                              style={{ alignSelf: 'flex-end', background: 'none', border: 'none', color: '#166534', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                            >
                              Entendido
                            </button>
                          </div>
                        ) : (
                          <form onSubmit={handleContactDirectivaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {contactError && (
                              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.6rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                                ⚠️ {contactError}
                              </div>
                            )}
                            
                            <div>
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Tu Nombre</label>
                              <input 
                                type="text" 
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                                placeholder="Ej. Juan Pérez"
                                value={contactName}
                                onChange={(e) => setContactName(e.target.value)}
                                required
                              />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Correo Electrónico</label>
                                <input 
                                  type="email" 
                                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                                  placeholder="tu@correo.com"
                                  value={contactEmail}
                                  onChange={(e) => setContactEmail(e.target.value)}
                                  required
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Teléfono / WhatsApp</label>
                                <input 
                                  type="tel" 
                                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                                  placeholder="Ej. 809-555-0100"
                                  value={contactPhone}
                                  onChange={(e) => setContactPhone(e.target.value)}
                                  required
                                />
                              </div>
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Mensaje</label>
                              <textarea 
                                rows={3}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', resize: 'none', fontFamily: 'inherit' }} 
                                placeholder="Escribe tu mensaje o consulta para la directiva..."
                                value={contactMessage}
                                onChange={(e) => setContactMessage(e.target.value)}
                                required
                              />
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                              <button 
                                type="button" 
                                onClick={() => setShowContactForm(false)} 
                                style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                              >
                                Cancelar
                              </button>
                              <button 
                                type="submit" 
                                disabled={contactLoading}
                                style={{ padding: '0.45rem 1rem', borderRadius: '6px', border: 'none', background: color, color: 'white', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', opacity: contactLoading ? 0.7 : 1 }}
                              >
                                {contactLoading ? 'Enviando...' : 'Enviar Mensaje 🚀'}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginBottom: '0.75rem' }}>📍 Grupos de Conexión (Grupos Pequeños)</h4>
                  
                  {!selectedSociety.grupos_conexion || selectedSociety.grupos_conexion.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>
                      No se han registrado grupos pequeños en esta sociedad todavía.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {selectedSociety.grupos_conexion.map((g: any) => (
                        <Link key={g.id} href={`/grupo?id=${g.id}`} style={{ textDecoration: 'none' }}>
                          <div
                            style={{
                              padding: '0.75rem 1rem',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = color;
                              e.currentTarget.style.backgroundColor = '#f8fafc';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#e2e8f0';
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <div>
                              <strong style={{ color: '#1e293b' }}>{g.nombre_grupo}</strong>
                              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                                Edades sugeridas: {g.rango_edad_min || 0} a {g.rango_edad_max || 99} años
                              </div>
                            </div>
                            <span style={{ color: color, fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              Ver Grupo ➔
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox para fotos de galería */}
      {lightboxImg && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            cursor: 'zoom-out',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setLightboxImg(null)}
        >
          <img 
            src={lightboxImg} 
            alt="Foto ampliada" 
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }} 
          />
          <button 
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              fontSize: '2rem',
              width: '3rem',
              height: '3rem',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none'
            }}
            onClick={() => setLightboxImg(null)}
          >
            &times;
          </button>
        </div>
      )}
      {/* PANTALLA OBLIGATORIA DE COMUNICADO DE BIENVENIDA */}
      {mandatoryAnnouncements.length > 0 && currentMandatoryIndex < mandatoryAnnouncements.length && (() => {
        const c = mandatoryAnnouncements[currentMandatoryIndex];
        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '2.5rem',
              maxWidth: '550px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}>
              <div>
                <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '0.5rem' }}>📢</span>
                <span style={{ fontSize: '0.72rem', backgroundColor: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Comunicado Oficial Obligatorio
                </span>
              </div>
              
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                  {c.titulo}
                </h2>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Publicado el {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </div>

              {c.imagen && (
                <div style={{ width: '100%', maxHeight: '200px', overflow: 'hidden', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '0.25rem' }}>
                  <img src={c.imagen} alt="Comunicado" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              )}
              
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                padding: '1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: '#f8fafc',
                textAlign: 'left',
                fontSize: '0.9rem',
                color: '#334155',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap'
              }}>
                {c.contenido}
              </div>

              <button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/comunicados", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "markAsRead",
                        data: { comunicadoId: c.id }
                      })
                    });
                    if (res.ok) {
                      setCurrentMandatoryIndex((prev) => prev + 1);
                      fetchComunicados();
                    }
                  } catch (err) {
                    console.error(err);
                  }
                }}
                style={{
                  backgroundColor: '#0284c7',
                  color: 'white',
                  border: 'none',
                  padding: '0.85rem 1.5rem',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.3)',
                  transition: 'all 0.2s'
                }}
              >
                Entendido y Leído ✓
              </button>
            </div>
          </div>
        );
      })()}

      {/* MODAL PROMO EVENTO */}
      {showPromo && promoEvent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '450px', overflow: 'hidden', animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎟️</div>
              <span style={{ background: '#fef08a', color: '#b45309', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>¡NO TE LO PIERDAS!</span>
              <h2 style={{ margin: '1rem 0 0.5rem 0', color: '#0f172a', fontSize: '1.5rem' }}>{promoEvent.nombre}</h2>
              <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '0.95rem' }}>{promoEvent.descripcion}</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-around', background: '#f8fafc', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Fecha</span><span style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.9rem' }}>{new Date(promoEvent.fecha_inicio).toLocaleDateString()}</span></div>
                <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Costo</span><span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.9rem' }}>{promoEvent.precio > 0 ? `$${promoEvent.precio}` : 'Gratis'}</span></div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => setShowPromo(false)}
                  style={{ flex: 1, padding: '0.85rem', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                  Quizás luego
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/eventos/${promoEvent.id}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'agregar_asistente',
                          payload: { persona_id: userPersonaId }
                        })
                      });
                      if (res.ok) {
                        alert("¡Inscrito con éxito en la lección / evento!");
                        setIsPromoRegistered(true);
                        setShowPromo(false);
                      }
                    } catch (e) { console.error(e); }
                  }}
                  style={{ flex: 2, padding: '0.85rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' }}>
                  Inscribirme Ahora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PROMO PROYECTO */}
      {showPromoProyecto && promoProyecto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '450px', overflow: 'hidden', animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌟</div>
              <span style={{ background: '#fef08a', color: '#b45309', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>AYÚDANOS A LOGRARLO</span>
              <h2 style={{ margin: '1rem 0 0.5rem 0', color: '#0f172a', fontSize: '1.5rem' }}>{promoProyecto.nombre}</h2>
              <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '0.95rem' }}>{promoProyecto.descripcion}</p>
              
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>¿Con cuánto te gustaría comprometerte? ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={promesaMonto} 
                  onChange={e => setPromesaMonto(e.target.value)}
                  placeholder="Ej. 100.00"
                  style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1.1rem', fontWeight: 600, color: '#0284c7' }} 
                />
                <div style={{ margin: '0.75rem 0 0 0', fontSize: '0.75rem', color: '#64748b', lineHeight: '1.4' }}>
                  <p style={{ margin: '0 0 0.5rem 0' }}>💡 <strong>¿Cómo hacer tu aporte?</strong></p>
                  {promoProyecto.instrucciones_pago ? (
                    <div style={{ whiteSpace: 'pre-line' }}>{promoProyecto.instrucciones_pago}</div>
                  ) : (
                    <>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                        <li>Vía transferencia (indica en el concepto que es para tu Promesa de Fe).</li>
                        <li>En efectivo directamente en la oficina de finanzas de la iglesia.</li>
                      </ul>
                      <p style={{ marginTop: '0.5rem' }}>Podrás ir abonando a esta promesa poco a poco. Cuando hagas el pago, administración buscará tu nombre y registrará tu aporte automáticamente.</p>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => setShowPromoProyecto(false)}
                  style={{ flex: 1, padding: '0.85rem', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                  Quizás luego
                </button>
                <button 
                  disabled={promesaEnviando || !promesaMonto}
                  onClick={async () => {
                    if (!promesaMonto) return;
                    setPromesaEnviando(true);
                    try {
                      const res = await fetch(`/api/finanzas/promesas`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          persona_id: userPersonaId, 
                          proyecto_id: promoProyecto.id,
                          monto_promesa: promesaMonto,
                          fecha_inicio: new Date().toISOString()
                        })
                      });
                      if (res.ok) {
                        alert("¡Gracias por tu compromiso!");
                        setShowPromoProyecto(false);
                      }
                    } catch (e) { 
                      console.error(e); 
                    } finally {
                      setPromesaEnviando(false);
                    }
                  }}
                  style={{ flex: 2, padding: '0.85rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: (promesaEnviando || !promesaMonto) ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)', opacity: (promesaEnviando || !promesaMonto) ? 0.7 : 1 }}>
                  {promesaEnviando ? 'Guardando...' : 'Hacer Promesa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FLOTANTE DE FORMULARIO / ENCUESTA PENDIENTE */}
      {showFormFloatingModal && pendingFormId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: '460px', width: '100%', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', background: '#dcfce7', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', color: '#16a34a' }}>📝</div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              {pendingFormObj?.titulo || "Nueva Encuesta Disponible"}
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 1.5rem 0', lineHeight: '1.5' }}>
              {pendingFormObj?.descripcion || "Tu opinión y respuesta son muy importantes para nuestra congregación. Por favor tómate un momento para responderla."}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link 
                href={`/hub/formularios/${pendingFormId}`}
                style={{ textDecoration: 'none', padding: '0.75rem', fontSize: '0.95rem', fontWeight: 700, borderRadius: '10px', textAlign: 'center', background: '#16a34a', color: 'white', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)' }}
              >
                ✍️ Responder Encuesta Ahora
              </Link>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('dismissed_form_' + pendingFormId, 'true');
                  }
                  setShowFormFloatingModal(false);
                }}
                style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer', padding: '0.4rem', fontWeight: 600 }}
              >
                Ver en el Hub más tarde
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
