"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./superadmin.module.css";

export default function SuperAdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0); // 0 = Iglesias, 1 = Usuarios, 2 = Códigos

  // Data states
  const [churches, setChurches] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [codes, setCodes] = useState<any[]>([]);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Status states
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Direct Church Creation states
  const [churchName, setChurchName] = useState("");
  const [churchSlug, setChurchSlug] = useState("");
  const [churchSlogan, setChurchSlogan] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // Code Generation states
  const [codePlan, setCodePlan] = useState("BASICO");

  // Billing and limits states for churches
  const [selectedChurchForBilling, setSelectedChurchForBilling] = useState<any | null>(null);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [editPlan, setEditPlan] = useState("BASICO");
  const [editLimitePersonas, setEditLimitePersonas] = useState(50);
  const [editLimiteUsuarios, setEditLimiteUsuarios] = useState(5);
  const [editPrecioMensual, setEditPrecioMensual] = useState(29.99);
  const [editFechaVencimiento, setEditFechaVencimiento] = useState("");
  const [editEstadoPago, setEditEstadoPago] = useState("PAGADO");

  // Global Plan Configs
  const [plansConfig, setPlansConfig] = useState<any>({
    BASICO: { limite_personas: 50, limite_usuarios: 5, precio_mensual: 29.99 },
    PREMIUM: { limite_personas: 250, limite_usuarios: 15, precio_mensual: 79.99 },
    PRO: { limite_personas: 9999, limite_usuarios: 99, precio_mensual: 199.99 }
  });

  // Support ticket states
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [ticketFilterEstado, setTicketFilterEstado] = useState("all");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/superadmin");
      if (res.status === 401 || res.status === 403) {
        window.location.href = "/";
        return;
      }
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        window.location.href = "/";
        return;
      }
      setChurches(data.churches || []);
      setUsers(data.users || []);
      setCodes(data.codes || []);
      setContactMessages(data.contactMessages || []);

      // Load global plan configurations
      const resPlans = await fetch("/api/superadmin/plans");
      const dataPlans = await resPlans.json();
      if (!dataPlans.error) {
        setPlansConfig(dataPlans);
      }
    } catch (err: any) {
      setError("Error al cargar la información del servidor.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSupportTickets = async () => {
    try {
      const res = await fetch("/api/soporte");
      const data = await res.json();
      if (!data.error) {
        setSupportTickets(data);
      }
    } catch (err) {
      console.error("Error al cargar tickets:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 5) {
      loadSupportTickets();
    }
  }, [activeTab]);

  // direct church creation
  const handleCreateChurch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitLoading(true);

    try {
      const res = await fetch("/api/superadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: churchName,
          slug: churchSlug,
          slogan: churchSlogan,
          adminEmail,
          adminPassword,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(`¡Iglesia "${data.church.nombre}" creada con éxito junto con sus configuraciones y cuenta administrador!`);
        setChurchName("");
        setChurchSlug("");
        setChurchSlogan("");
        setAdminEmail("");
        setAdminPassword("");
        loadData();
      }
    } catch (err) {
      setError("Error al registrar la iglesia.");
      console.error(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  // delete church
  const handleDeleteChurch = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la iglesia "${name}"? Esta acción borrará permanentemente todos sus miembros, usuarios y configuraciones.`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/superadmin?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(`Iglesia "${name}" eliminada exitosamente.`);
        loadData();
      }
    } catch (err) {
      setError("Error al eliminar la iglesia.");
      console.error(err);
    }
  };

  // switch to manage church (keep superadmin session, only change active church)
  const handleManageChurch = async (church: any) => {
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set-active-church", churchId: church.id }),
      });
    } catch (err) {
      console.error("Error setting active church via API:", err);
    }
    document.cookie = `active_iglesia_id=${church.id}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.href = "/admin";
  };

  // Toggle church status (Suspend/Activate)
  const handleToggleChurchStatus = async (churchId: string, currentStatus: string, name: string) => {
    setError(null);
    setSuccess(null);
    const newStatus = currentStatus === "ACTIVO" ? "SUSPENDIDO" : "ACTIVO";

    try {
      const res = await fetch("/api/superadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggleChurchStatus",
          data: { churchId, status: newStatus },
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(`La iglesia "${name}" ha sido ${newStatus === "ACTIVO" ? "activada" : "suspendida"} correctamente.`);
        loadData();
      }
    } catch (err) {
      setError("Error al cambiar el estado de la iglesia.");
      console.error(err);
    }
  };

  // Change church subscription plan
  const handleChangeChurchPlan = async (churchId: string, newPlan: string, name: string) => {
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/superadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "changeChurchPlan",
          data: { churchId, plan: newPlan },
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(`El plan de la iglesia "${name}" se cambió a ${newPlan}.`);
        loadData();
      }
    } catch (err) {
      setError("Error al cambiar el plan de la iglesia.");
      console.error(err);
    }
  };

  const formatDateForInput = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  };

  const handleEditBilling = (church: any) => {
    setSelectedChurchForBilling(church);
    setEditPlan(church.plan);
    setEditLimitePersonas(church.limitePersonas ?? 50);
    setEditLimiteUsuarios(church.limiteUsuarios ?? 5);
    setEditPrecioMensual(church.precioMensual ?? 29.99);
    setEditFechaVencimiento(formatDateForInput(church.fechaVencimiento));
    setEditEstadoPago(church.estadoPago || "PAGADO");
    setShowBillingModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleSaveBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChurchForBilling) return;

    setError(null);
    setSuccess(null);
    setSubmitLoading(true);

    try {
      const res = await fetch("/api/superadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateChurchBilling",
          data: {
            churchId: selectedChurchForBilling.id,
            plan: editPlan,
            limitePersonas: editLimitePersonas,
            limiteUsuarios: editLimiteUsuarios,
            precioMensual: editPrecioMensual,
            fechaVencimiento: editFechaVencimiento ? new Date(editFechaVencimiento + "T12:00:00").toISOString() : null,
            estadoPago: editEstadoPago,
          },
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(`Facturación y límites de la iglesia "${selectedChurchForBilling.nombre}" actualizados correctamente.`);
        setShowBillingModal(false);
        loadData();
      }
    } catch (err) {
      setError("Error al actualizar la facturación de la iglesia.");
      console.error(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSavePlansConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitLoading(true);

    try {
      const res = await fetch("/api/superadmin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plansConfig),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess("¡Configuración global de planes guardada exitosamente!");
        setPlansConfig(data.config);
      }
    } catch (err) {
      setError("Error al guardar la configuración de planes.");
      console.error(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Toggle user status (Suspend/Activate)
  const handleToggleUserStatus = async (userId: string, currentStatus: string, email: string) => {
    setError(null);
    setSuccess(null);
    const newStatus = currentStatus === "ACTIVO" ? "SUSPENDIDO" : "ACTIVO";

    try {
      const res = await fetch("/api/superadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggleUserStatus",
          data: { userId, status: newStatus },
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(`El usuario "${email}" ha sido ${newStatus === "ACTIVO" ? "activado" : "suspendido"}.`);
        loadData();
      }
    } catch (err) {
      setError("Error al cambiar el estado del usuario.");
      console.error(err);
    }
  };

  // Change user role
  const handleChangeUserRole = async (userId: string, newRole: string, email: string) => {
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/superadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "changeUserRole",
          data: { userId, role: newRole },
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(`El rol del usuario "${email}" se actualizó a ${newRole}.`);
        loadData();
      }
    } catch (err) {
      setError("Error al cambiar el rol del usuario.");
      console.error(err);
    }
  };

  // Generate prepaid activation code
  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitLoading(true);

    try {
      const res = await fetch("/api/superadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generateCode",
          data: { plan: codePlan },
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(`¡Código prepagado generado con éxito para el plan ${codePlan}: "${data.code.codigo}"!`);
        loadData();
      }
    } catch (err) {
      setError("Error al generar el código prepagado.");
      console.error(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Delete activation code
  const handleDeleteCode = async (codeId: string, codeStr: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el código "${codeStr}"?`)) {
      return;
    }
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/superadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteCode",
          data: { codeId },
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(`Código "${codeStr}" eliminado exitosamente.`);
        loadData();
      }
    } catch (err) {
      setError("Error al eliminar el código.");
      console.error(err);
    }
  };

  // Delete contact message
  const handleDeleteContactMessage = async (messageId: string, clientName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el mensaje de "${clientName}"?`)) {
      return;
    }
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/superadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteContactMessage",
          data: { messageId },
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(`Mensaje de "${clientName}" eliminado exitosamente.`);
        loadData();
      }
    } catch (err) {
      setError("Error al eliminar el mensaje.");
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      router.push("/");
    } catch (err) {
      console.error("Error logging out", err);
    }
  };

  // Calculations for stats
  const totalChurches = churches.length;
  const activeChurches = churches.filter(c => c.estado === "ACTIVO").length;
  const totalMiembros = churches.reduce((sum, c) => sum + (c.miembrosCount || 0), 0);
  const totalUsersCount = users.length;
  const unusedCodesCount = codes.filter(c => !c.usado).length;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>✝_ Igleconexion SaaS</h1>
          <p>Consola de Administración del Core del Sistema</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <img src="/Iconos SVG/salir.svg" alt="Salir" style={{ width: "18px", height: "18px", objectFit: "contain", verticalAlign: "middle", marginRight: "0.4rem" }} /> Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Metrics Cards */}
      <section className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <h3>Iglesias Activas</h3>
            <div className={styles.metricNumber}>{activeChurches} <span style={{ fontSize: "1rem", color: "#64748b", fontWeight: "normal" }}>/ {totalChurches} total</span></div>
          </div>
          <div className={styles.metricIcon}>🏢</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <h3>Cuentas de Usuarios</h3>
            <div className={styles.metricNumber}>{totalUsersCount}</div>
          </div>
          <div className={styles.metricIcon}>🔑</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <h3>Códigos Libres</h3>
            <div className={styles.metricNumber}>{unusedCodesCount}</div>
          </div>
          <div className={styles.metricIcon}>🏷️</div>
        </div>
      </section>

      {/* Tab Navigation */}
      <nav className={styles.tabsContainer}>
        <button
          className={`${styles.tabBtn} ${activeTab === 0 ? styles.activeTabBtn : ""}`}
          onClick={() => { setActiveTab(0); setError(null); setSuccess(null); }}
        >
          ⛪ Iglesias (Suscripciones)
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 1 ? styles.activeTabBtn : ""}`}
          onClick={() => { setActiveTab(1); setError(null); setSuccess(null); }}
        >
          👥 Cuentas de Usuarios
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 2 ? styles.activeTabBtn : ""}`}
          onClick={() => { setActiveTab(2); setError(null); setSuccess(null); }}
        >
          🎟️ Códigos de Pago / Activación
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 3 ? styles.activeTabBtn : ""}`}
          onClick={() => { setActiveTab(3); setError(null); setSuccess(null); }}
        >
          ⚙️ Configuración de Planes
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 4 ? styles.activeTabBtn : ""}`}
          onClick={() => { setActiveTab(4); setError(null); setSuccess(null); }}
        >
          📬 Buzón de Contacto
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 5 ? styles.activeTabBtn : ""}`}
          onClick={() => { setActiveTab(5); setError(null); setSuccess(null); }}
        >
          🎫 Soporte Técnico
        </button>
      </nav>

      {/* Alerts */}
      {error && <div className={`${styles.alert} ${styles.alertError}`}>⚠️ {error}</div>}
      {success && <div className={`${styles.alert} ${styles.alertSuccess}`}>✅ {success}</div>}

      {/* Tab Content Rendering */}
      {loading ? (
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner} />
          Cargando consola SaaS...
        </div>
      ) : (
        <div className={`${styles.mainGrid} ${(activeTab === 1 || activeTab === 3 || activeTab === 4 || activeTab === 5) ? styles.fullWidthGrid : ""}`}>
          
          {/* TAB 0: IGLESIAS */}
          {activeTab === 0 && (
            <>
              {/* Left Column: Direct creation */}
              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2>➕ Registrar Iglesia Directa</h2>
                </div>
                <div className={styles.cardBody}>
                  <form onSubmit={handleCreateChurch}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Nombre de la Iglesia</label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Ej: Torre Fuerte AD"
                        value={churchName}
                        onChange={(e) => setChurchName(e.target.value)}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Slug de URL (Código de URL)</label>
                      <div className={styles.slugInputContainer}>
                        <span className={styles.slugPrefix}>/hub?iglesia=</span>
                        <input
                          type="text"
                          className={`${styles.input} ${styles.slugInput}`}
                          placeholder="torrefuerte"
                          value={churchSlug}
                          onChange={(e) => setChurchSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                          required
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Slogan de la Iglesia</label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Ej: Un lugar para ti"
                        value={churchSlogan}
                        onChange={(e) => setChurchSlogan(e.target.value)}
                      />
                    </div>

                    <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", margin: "1.5rem 0" }} />
                    <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#475569", marginBottom: "0.75rem" }}>
                      Cuenta del Pastor (Administrador)
                    </h3>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Correo del Pastor</label>
                      <input
                        type="email"
                        className={styles.input}
                        placeholder="pastor@torrefuerte.com"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Contraseña</label>
                      <input
                        type="password"
                        className={styles.input}
                        placeholder="••••••••"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        required
                      />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={submitLoading}>
                      {submitLoading ? "Creando..." : "Registrar Iglesia"}
                    </button>
                  </form>
                </div>
              </section>

              {/* Right Column: Church list */}
              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2>🏢 Iglesias y Suscripciones</h2>
                </div>
                <div className={styles.cardBody} style={{ padding: 0 }}>
                  <div className={styles.tableContainer}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Iglesia</th>
                          <th>Plan</th>
                          <th>Estado</th>
                          <th>Métricas</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {churches.map((church) => (
                          <tr key={church.id}>
                            <td>
                              <div className={styles.churchInfo}>
                                <div className={styles.churchLogoPlaceholder}>
                                  {church.logo ? (
                                    <img src={church.logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
                                  ) : (
                                    "⛪"
                                  )}
                                </div>
                                <div>
                                  <div className={styles.churchNameText}>{church.nombre}</div>
                                  <div className={styles.churchSlugText}>Código: <strong>{church.slug}</strong></div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                <span className={`${styles.badge} ${church.plan === "PRO" ? styles.badgePlanPro : church.plan === "PREMIUM" ? styles.badgePlanPremium : styles.badgePlan}`}>
                                  {church.plan}
                                </span>
                                <span style={{ fontSize: "0.8rem", color: "#475569", fontWeight: 600 }}>
                                  US$ {church.precioMensual?.toFixed(2)}/mes
                                </span>
                                <span className={`${styles.badge} ${
                                  church.estadoPago === "PAGADO" ? styles.badgeActive : 
                                  church.estadoPago === "PENDIENTE" ? styles.badgePaymentPending : 
                                  styles.badgeSuspended
                                }`} style={{ alignSelf: "flex-start", marginTop: "2px" }}>
                                  {church.estadoPago}
                                </span>
                                {church.fechaVencimiento && (
                                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontStyle: "italic" }}>
                                    Vence: {new Date(church.fechaVencimiento).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className={`${styles.badge} ${church.estado === "ACTIVO" ? styles.badgeActive : styles.badgeSuspended}`}>
                                {church.estado}
                              </span>
                            </td>
                            <td>
                              <div className={styles.statsText}>
                                👥 Miembros: <strong style={{ color: church.miembrosCount >= church.limitePersonas ? "#ef4444" : "inherit" }}>{church.miembrosCount}</strong> / {church.limitePersonas}<br />
                                👑 Líderes: <strong style={{ color: church.usuariosCount >= church.limiteUsuarios ? "#ef4444" : "inherit" }}>{church.usuariosCount}</strong> / {church.limiteUsuarios}
                              </div>
                            </td>
                            <td>
                              <div className={styles.actionsCell}>
                                <button
                                  className={`${styles.actionBtn} ${styles.manageBtn}`}
                                  onClick={() => handleManageChurch(church)}
                                  title="Iniciar sesión en esta iglesia"
                                >
                                  ⚙️
                                </button>
                                <button
                                  className={`${styles.actionBtn} ${styles.billingBtn}`}
                                  onClick={() => handleEditBilling(church)}
                                  title="Editar facturación y límites"
                                >
                                  💳
                                </button>
                                <button
                                  className={`${styles.actionBtn} ${church.estado === "ACTIVO" ? styles.suspendBtn : styles.activateBtn}`}
                                  onClick={() => handleToggleChurchStatus(church.id, church.estado, church.nombre)}
                                  title={church.estado === "ACTIVO" ? "Suspender acceso" : "Activar acceso"}
                                >
                                  {church.estado === "ACTIVO" ? "⏸️" : "▶️"}
                                </button>
                                {church.id !== "iglesia-default" && (
                                  <button
                                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                    onClick={() => handleDeleteChurch(church.id, church.nombre)}
                                    title="Eliminar iglesia"
                                  >
                                    🗑️
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* TAB 1: USUARIOS */}
          {activeTab === 1 && (
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>🔑 Administración de Usuarios y Permisos</h2>
              </div>
              <div className={styles.cardBody} style={{ padding: 0 }}>
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Correo Electrónico</th>
                        <th>Iglesia</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Fecha Registro</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td style={{ fontWeight: 600, color: "#1e293b" }}>{user.email}</td>
                          <td>{user.iglesiaNombre}</td>
                          <td>
                            {user.rol === "SUPERADMIN" ? (
                              <span className={styles.badge} style={{ backgroundColor: "#e0e7ff", color: "#4338ca", fontWeight: "bold" }}>
                                SuperAdmin 👑
                              </span>
                            ) : (
                              <select
                                className={styles.tableSelect}
                                value={user.rol}
                                onChange={(e) => handleChangeUserRole(user.id, e.target.value, user.email)}
                              >
                                <option value="ADMIN_IGLESIA">Administrador Pastor</option>
                                <option value="LIDER">Líder de Proceso</option>
                                <option value="MIEMBRO">Miembro Común</option>
                              </select>
                            )}
                          </td>
                          <td>
                            <span className={`${styles.badge} ${user.estado === "ACTIVO" ? styles.badgeActive : styles.badgeSuspended}`}>
                              {user.estado}
                            </span>
                          </td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td>
                            {user.rol !== "SUPERADMIN" && (
                              <button
                                className={`${styles.actionBtn} ${user.estado === "ACTIVO" ? styles.suspendBtn : styles.activateBtn}`}
                                onClick={() => handleToggleUserStatus(user.id, user.estado, user.email)}
                                title={user.estado === "ACTIVO" ? "Suspender cuenta" : "Activar cuenta"}
                              >
                                {user.estado === "ACTIVO" ? "Suspender" : "Activar"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* TAB 2: CÓDIGOS DE ACTIVACIÓN */}
          {activeTab === 2 && (
            <>
              {/* Left Column: Generate Code */}
              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2>🎟️ Generar Código Prepagado</h2>
                </div>
                <div className={styles.cardBody}>
                  <form onSubmit={handleGenerateCode}>
                    <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1.25rem", lineHeight: "1.4" }}>
                      Genera un código único que puedes entregar a los clientes que hayan pagado por la plataforma. Ellos podrán registrarse solos ingresando este código en <strong>/registro-iglesia</strong>.
                    </p>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Plan a Licenciar</label>
                      <select
                        className={styles.select}
                        value={codePlan}
                        onChange={(e) => setCodePlan(e.target.value)}
                      >
                        <option value="BASICO">Plan BÁSICO 🥉</option>
                        <option value="PREMIUM">Plan PREMIUM 🥈</option>
                        <option value="PRO">Plan PRO 🥇</option>
                      </select>
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={submitLoading}>
                      {submitLoading ? "Generando..." : "Generar Código Único"}
                    </button>
                  </form>
                </div>
              </section>

              {/* Right Column: Code List */}
              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2>📋 Códigos Registrados</h2>
                </div>
                <div className={styles.cardBody} style={{ padding: 0 }}>
                  <div className={styles.tableContainer}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Código Único</th>
                          <th>Plan Licenciado</th>
                          <th>Estado de Uso</th>
                          <th>Iglesia Beneficiaria</th>
                          <th>Fecha Creación</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {codes.map((code) => (
                          <tr key={code.id}>
                            <td style={{ fontFamily: "monospace", fontSize: "1.1rem", fontWeight: "bold", color: "#4f46e5" }}>
                              {code.codigo}
                            </td>
                            <td>
                              <span className={`${styles.badge} ${code.plan === "PRO" ? styles.badgePlanPro : code.plan === "PREMIUM" ? styles.badgePlanPremium : styles.badgePlan}`}>
                                {code.plan}
                              </span>
                            </td>
                            <td>
                              <span className={`${styles.badge} ${code.usado ? styles.badgeSuspended : styles.badgeActive}`}>
                                {code.usado ? "USADO" : "LIBRE"}
                              </span>
                            </td>
                            <td>
                              {code.usado ? (
                                <span style={{ fontWeight: 600, color: "#1e293b" }}>{code.iglesiaNombre}</span>
                              ) : (
                                <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Ninguna</span>
                              )}
                            </td>
                            <td>{new Date(code.createdAt).toLocaleDateString()}</td>
                            <td>
                              {!code.usado ? (
                                <button
                                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                  onClick={() => handleDeleteCode(code.id, code.codigo)}
                                  title="Eliminar código libre"
                                >
                                  Eliminar
                                </button>
                              ) : (
                                <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Sin acciones</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* TAB 3: CONFIGURACIÓN DE PLANES GLOBALES */}
          {activeTab === 3 && (
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>⚙️ Configuración Global de Planes (Límites por Defecto)</h2>
              </div>
              <div className={styles.cardBody}>
                <p style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "1.5rem", lineHeight: "1.5" }}>
                  Aquí puedes definir los límites de miembros, límites de líderes únicos y el precio mensual predeterminado para cada uno de los tres planes. Estos límites se aplicarán automáticamente a todas las nuevas iglesias que se registren en la plataforma y servirán como valores por defecto al cambiar planes.
                </p>
                <form onSubmit={handleSavePlansConfig}>
                  <div className={styles.plansConfigGrid}>
                    
                    {/* PLAN BASICO */}
                    <div className={styles.planConfigCard}>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1e293b", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        🥉 Plan BÁSICO
                      </h3>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Límite de Miembros (Personas)</label>
                        <input
                          type="number"
                          className={styles.input}
                          value={plansConfig.BASICO.limite_personas}
                          onChange={(e) => setPlansConfig({
                            ...plansConfig,
                            BASICO: { ...plansConfig.BASICO, limite_personas: parseInt(e.target.value) || 0 }
                          })}
                          min="1"
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Límite de Líderes Únicos</label>
                        <input
                          type="number"
                          className={styles.input}
                          value={plansConfig.BASICO.limite_usuarios}
                          onChange={(e) => setPlansConfig({
                            ...plansConfig,
                            BASICO: { ...plansConfig.BASICO, limite_usuarios: parseInt(e.target.value) || 0 }
                          })}
                          min="1"
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Precio Mensual (USD)</label>
                        <input
                          type="number"
                          step="0.01"
                          className={styles.input}
                          value={plansConfig.BASICO.precio_mensual}
                          onChange={(e) => setPlansConfig({
                            ...plansConfig,
                            BASICO: { ...plansConfig.BASICO, precio_mensual: parseFloat(e.target.value) || 0 }
                          })}
                          min="0"
                          required
                        />
                      </div>
                    </div>

                    {/* PLAN PREMIUM */}
                    <div className={styles.planConfigCard}>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1e293b", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        🥈 Plan PREMIUM
                      </h3>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Límite de Miembros (Personas)</label>
                        <input
                          type="number"
                          className={styles.input}
                          value={plansConfig.PREMIUM.limite_personas}
                          onChange={(e) => setPlansConfig({
                            ...plansConfig,
                            PREMIUM: { ...plansConfig.PREMIUM, limite_personas: parseInt(e.target.value) || 0 }
                          })}
                          min="1"
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Límite de Líderes Únicos</label>
                        <input
                          type="number"
                          className={styles.input}
                          value={plansConfig.PREMIUM.limite_usuarios}
                          onChange={(e) => setPlansConfig({
                            ...plansConfig,
                            PREMIUM: { ...plansConfig.PREMIUM, limite_usuarios: parseInt(e.target.value) || 0 }
                          })}
                          min="1"
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Precio Mensual (USD)</label>
                        <input
                          type="number"
                          step="0.01"
                          className={styles.input}
                          value={plansConfig.PREMIUM.precio_mensual}
                          onChange={(e) => setPlansConfig({
                            ...plansConfig,
                            PREMIUM: { ...plansConfig.PREMIUM, precio_mensual: parseFloat(e.target.value) || 0 }
                          })}
                          min="0"
                          required
                        />
                      </div>
                    </div>

                    {/* PLAN PRO */}
                    <div className={styles.planConfigCard}>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1e293b", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        🥇 Plan PRO
                      </h3>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Límite de Miembros (Personas)</label>
                        <input
                          type="number"
                          className={styles.input}
                          value={plansConfig.PRO.limite_personas}
                          onChange={(e) => setPlansConfig({
                            ...plansConfig,
                            PRO: { ...plansConfig.PRO, limite_personas: parseInt(e.target.value) || 0 }
                          })}
                          min="1"
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Límite de Líderes Únicos</label>
                        <input
                          type="number"
                          className={styles.input}
                          value={plansConfig.PRO.limite_usuarios}
                          onChange={(e) => setPlansConfig({
                            ...plansConfig,
                            PRO: { ...plansConfig.PRO, limite_usuarios: parseInt(e.target.value) || 0 }
                          })}
                          min="1"
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Precio Mensual (USD)</label>
                        <input
                          type="number"
                          step="0.01"
                          className={styles.input}
                          value={plansConfig.PRO.precio_mensual}
                          onChange={(e) => setPlansConfig({
                            ...plansConfig,
                            PRO: { ...plansConfig.PRO, precio_mensual: parseFloat(e.target.value) || 0 }
                          })}
                          min="0"
                          required
                        />
                      </div>
                    </div>

                  </div>

                  <button type="submit" className={styles.savePlansBtn} disabled={submitLoading}>
                    {submitLoading ? "Guardando..." : "💾 Guardar Configuración de Planes"}
                  </button>
                </form>
              </div>
            </section>
          )}

          {/* TAB 4: BUZÓN DE CONTACTO */}
          {activeTab === 4 && (
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>📬 Buzón de Solicitudes y Mensajes de Contacto</h2>
              </div>
              <div className={styles.cardBody}>
                {contactMessages.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#64748b", padding: "2rem" }}>
                    No hay solicitudes ni mensajes de contacto en el buzón actualmente.
                  </p>
                ) : (
                  <div className={styles.tableContainer}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Nombre</th>
                          <th>Email</th>
                          <th>Teléfono</th>
                          <th>Mensaje</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contactMessages.map((msg) => (
                          <tr key={msg.id}>
                            <td style={{ whiteSpace: "nowrap", fontSize: "0.85rem" }}>
                              {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td style={{ fontWeight: 600 }}>{msg.nombre}</td>
                            <td>
                              <a href={`mailto:${msg.email}`} style={{ color: "var(--accent-blue)", textDecoration: "underline" }}>
                                {msg.email}
                              </a>
                            </td>
                            <td>
                              <a
                                href={`https://wa.me/1${msg.telefono.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "#166534", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                              >
                                💬 {msg.telefono}
                              </a>
                            </td>
                            <td style={{ maxWidth: "300px", wordBreak: "break-word", fontSize: "0.9rem" }}>{msg.mensaje}</td>
                            <td>
                              <button
                                className={styles.deleteBtn}
                                onClick={() => handleDeleteContactMessage(msg.id, msg.nombre)}
                                style={{
                                  backgroundColor: "#fee2e2",
                                  color: "#991b1b",
                                  padding: "0.4rem 0.8rem",
                                  borderRadius: "6px",
                                  fontSize: "0.85rem",
                                  fontWeight: 600,
                                  border: "none",
                                  cursor: "pointer"
                                }}
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === 5 && (
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>🎫 Consola de Soporte y Tickets</h2>
                  <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>Responde consultas y conversa en tiempo real con los administradores de las iglesias.</p>
                </div>
                
                {/* Filtro rápido por estado */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Filtrar Estado:</span>
                  <select
                    value={ticketFilterEstado}
                    onChange={(e) => setTicketFilterEstado(e.target.value)}
                    style={{ padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', fontSize: '0.85rem' }}
                  >
                    <option value="all">Todos los Tickets</option>
                    <option value="ABIERTO">Abiertos</option>
                    <option value="EN_PROCESO">En Proceso</option>
                    <option value="RESUELTO">Resueltos</option>
                    <option value="CERRADO">Cerrados</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', minHeight: '600px' }}>
                {/* LISTA DE TICKETS DE TODAS LAS IGLESIAS */}
                <div className={styles.card} style={{ display: 'flex', flexDirection: 'column', padding: '1rem', gap: '1rem', maxHeight: '650px', overflowY: 'auto' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', margin: 0, color: '#1e293b' }}>
                    Tickets Recibidos
                  </h3>

                  {supportTickets.filter(t => ticketFilterEstado === "all" || t.estado === ticketFilterEstado).length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', color: '#94a3b8', textAlign: 'center', gap: '0.5rem', flex: 1 }}>
                      <span style={{ fontSize: '2.5rem' }}>🎫</span>
                      <p style={{ fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>No hay tickets con este estado.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                      {supportTickets
                        .filter(t => ticketFilterEstado === "all" || t.estado === ticketFilterEstado)
                        .map((t) => {
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
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1', marginBottom: '2px' }}>
                                ⛪ {t.iglesia?.nombre_iglesia}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', wordBreak: 'break-word' }}>
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

                {/* VENTANA DE CHAT Y GESTIÓN */}
                <div className={styles.card} style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', height: '650px', border: '1px solid #e2e8f0' }}>
                  {activeTicketId ? (() => {
                    const ticket = supportTickets.find(t => t.id === activeTicketId);
                    if (!ticket) return null;

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {/* Header de Gestión del Chat */}
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>{ticket.asunto}</h3>
                              <span style={{ fontSize: '0.8rem', background: '#bae6fd', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                {ticket.iglesia?.nombre_iglesia}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              Contacto: <strong>{ticket.contactoNom}</strong> ({ticket.contactoEml}) {ticket.contactoTel && `• Tel: ${ticket.contactoTel}`}
                            </span>
                          </div>

                          {/* Control de Estado y Prioridad */}
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Estado</span>
                              <select
                                value={ticket.estado}
                                onChange={async (e) => {
                                  const nextState = e.target.value;
                                  try {
                                    await fetch("/api/soporte", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        action: "updateTicketStatus",
                                        data: { ticketId: ticket.id, estado: nextState }
                                      })
                                    });
                                    loadSupportTickets();
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}
                                style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.75rem', backgroundColor: 'white' }}
                              >
                                <option value="ABIERTO">Abierto</option>
                                <option value="EN_PROCESO">En Proceso</option>
                                <option value="RESUELTO">Resueltos</option>
                                <option value="CERRADO">Cerrados</option>
                              </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Prioridad</span>
                              <select
                                value={ticket.prioridad}
                                onChange={async (e) => {
                                  const nextPriority = e.target.value;
                                  try {
                                    await fetch("/api/soporte", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        action: "updateTicketStatus",
                                        data: { ticketId: ticket.id, prioridad: nextPriority }
                                      })
                                    });
                                    loadSupportTickets();
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}
                                style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.75rem', backgroundColor: 'white' }}
                              >
                                <option value="BAJA">Baja</option>
                                <option value="MEDIA">Media</option>
                                <option value="ALTA">Alta</option>
                                <option value="URGENTE">Urgente</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Mensajes del Chat */}
                        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f8fafc' }}>
                          {ticket.mensajes?.map((m: any) => {
                            const isMe = m.remitente === "SOPORTE";
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
                            placeholder="Escribe la respuesta del soporte técnico aquí..."
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            style={{ flex: 1, padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                          />
                          <button 
                            type="submit" 
                            className={styles.btnPrimary}
                            style={{ padding: '0.65rem 1.5rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Enviar Respuesta ⚡
                          </button>
                        </form>
                      </div>
                    );
                  })() : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', padding: '2rem', textAlign: 'center', gap: '0.75rem', background: '#f8fafc' }}>
                      <span style={{ fontSize: '3.5rem' }}>💬</span>
                      <h3 style={{ margin: 0, color: '#475569' }}>Consola de Conversación</h3>
                      <p style={{ fontSize: '0.88rem', margin: 0, maxWidth: '350px' }}>Selecciona un ticket de la lista para gestionar su estado y chatear con el administrador de la iglesia.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {showBillingModal && selectedChurchForBilling && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>💳 Configurar Facturación: {selectedChurchForBilling.nombre}</h2>
              <button className={styles.closeModalBtn} onClick={() => setShowBillingModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveBilling}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label className={styles.label} style={{ margin: 0 }}>Plan de Suscripción</label>
                      <button
                        type="button"
                        onClick={() => {
                          const cfg = plansConfig[editPlan];
                          if (cfg) {
                            setEditLimitePersonas(cfg.limite_personas);
                            setEditLimiteUsuarios(cfg.limite_usuarios);
                            setEditPrecioMensual(cfg.precio_mensual);
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0284c7',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: 0
                        }}
                      >
                        🔄 Aplicar límites de plan
                      </button>
                    </div>
                    <select
                      className={styles.select}
                      value={editPlan}
                      onChange={(e) => {
                        const plan = e.target.value;
                        setEditPlan(plan);
                        const cfg = plansConfig[plan];
                        if (cfg) {
                          setEditLimitePersonas(cfg.limite_personas);
                          setEditLimiteUsuarios(cfg.limite_usuarios);
                          setEditPrecioMensual(cfg.precio_mensual);
                        }
                      }}
                    >
                      <option value="BASICO">BÁSICO 🥉</option>
                      <option value="PREMIUM">PREMIUM 🥈</option>
                      <option value="PRO">PRO 🥇</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Estado de Pago</label>
                    <select
                      className={styles.select}
                      value={editEstadoPago}
                      onChange={(e) => setEditEstadoPago(e.target.value)}
                    >
                      <option value="PAGADO">PAGADO ✅</option>
                      <option value="PENDIENTE">PENDIENTE ⏳</option>
                      <option value="VENCIDO">VENCIDO ❌ (Bloqueado)</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Límite de Miembros (Personas)</label>
                    <input
                      type="number"
                      className={styles.input}
                      value={editLimitePersonas}
                      onChange={(e) => setEditLimitePersonas(parseInt(e.target.value) || 0)}
                      min="1"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Límite de Líderes Únicos</label>
                    <input
                      type="number"
                      className={styles.input}
                      value={editLimiteUsuarios}
                      onChange={(e) => setEditLimiteUsuarios(parseInt(e.target.value) || 0)}
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Precio Mensual (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={styles.input}
                      value={editPrecioMensual}
                      onChange={(e) => setEditPrecioMensual(parseFloat(e.target.value) || 0)}
                      min="0"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Fecha de Vencimiento de Licencia</label>
                    <input
                      type="date"
                      className={styles.input}
                      value={editFechaVencimiento}
                      onChange={(e) => setEditFechaVencimiento(e.target.value)}
                    />
                    <small style={{ color: "#64748b", marginTop: "4px", display: "block" }}>
                      Dejar en blanco para que no tenga vencimiento.
                    </small>
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowBillingModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveBtn} disabled={submitLoading}>
                  {submitLoading ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
