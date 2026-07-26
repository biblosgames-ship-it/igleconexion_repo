"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./registro-iglesia.module.css";
import Link from "next/link";

export default function RegistroIglesiaPage() {
  const router = useRouter();
  
  // Form fields
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slogan, setSlogan] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/registro-iglesia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          name: name.trim(),
          slug: slug.trim(),
          slogan: slogan.trim(),
          adminEmail: adminEmail.trim(),
          adminPassword,
          phone: phone.trim(),
          contactMessage: contactMessage.trim(),
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(`¡Iglesia "${data.church.nombre}" (Plan ${data.church.plan}) registrada e inicializada con éxito! Redirigiendo a inicio de sesión...`);
        // Redirigir a login después de 3 segundos
        setTimeout(() => {
          router.push("/");
        }, 3500);
      }
    } catch (err) {
      setError("Error de red. No se pudo conectar con el servidor.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>⛪ Registrar Nueva Iglesia</h1>
          <p className={styles.subtitle}>
            Si has adquirido el sistema, ingresa tu código de activación prepagado para dar de alta a tu congregación y crear tu cuenta pastoral.
          </p>
        </div>

        {error && <div className={`${styles.alert} ${styles.alertError}`}>⚠️ {error}</div>}
        {success && <div className={`${styles.alert} ${styles.alertSuccess}`}>✅ {success}</div>}

        {!success && (
          <form onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Código de Activación Prepagado</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Ej: IGLE-ABCD-1234"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre de la Iglesia</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Ej: Iglesia Cristiana Torre Fuerte AD"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Código de URL (Slug)</label>
                <div className={styles.slugInputContainer}>
                  <span className={styles.slugPrefix}>/hub?iglesia=</span>
                  <input
                    type="text"
                    className={`${styles.input} ${styles.slugInput}`}
                    placeholder="torrefuerte"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                    required
                  />
                </div>
                <small style={{ color: "#64748b", display: "block", marginTop: "0.25rem", fontSize: "0.75rem" }}>
                  Este código servirá para que tus miembros ingresen directamente a tu portal web.
                </small>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Slogan de la Iglesia (Opcional)</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Ej: Conectando vidas con el propósito de Dios"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                />
              </div>

              <hr style={{ border: 0, borderTop: "1px solid #cbd5e1", margin: "0.5rem 0" }} />
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e1b4b", marginBottom: "0.25rem" }}>
                Cuenta del Pastor Administrador
              </h3>

              <div className={styles.formGroup}>
                <label className={styles.label}>Correo Electrónico</label>
                <input
                  type="email"
                  className={styles.input}
                  placeholder="pastor@miiglesia.com"
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

              {/* Phone field */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Teléfono de Contacto</label>
                <input
                  type="tel"
                  className={styles.input}
                  placeholder="Ej: +56912345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              {/* Mensaje de Contacto */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Mensaje de Contacto (opcional)</label>
                <textarea
                  className={styles.input}
                  placeholder="Escribe tu mensaje o consulta..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={3}
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? "Verificando e Inicializando..." : "Registrar e Inicializar Iglesia"}
              </button>
            </div>
          </form>
        )}

        <Link href="/" className={styles.backLink}>
          ← Cancelar y volver al inicio de sesión
        </Link>
        {/* Contact link for SaaS support */}
        <div className={styles.saasContact} style={{ marginTop: "1rem", textAlign: "center" }}>
          <a href="mailto:soporte@igleconexion.com?subject=Soporte%20Iglesia" style={{ color: "var(--accent-blue)" }}>
            📞 Contactar Igleconexion para soporte
          </a>
        </div>
      </div>
    </div>
  );
}
