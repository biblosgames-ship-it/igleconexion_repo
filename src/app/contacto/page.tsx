"use client";

import { useState } from "react";
import styles from "./contacto.module.css";
import Link from "next/link";

export default function ContactoPage() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, telefono, mensaje }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setSuccess("¡Tu mensaje ha sido enviado exitosamente al buzón del administrador!");
        setNombre("");
        setEmail("");
        setTelefono("");
        setMensaje("");
      }
    } catch (err) {
      setError("Error de red. No se pudo enviar el mensaje.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>📩 Contacta a Igleconexion</h1>
          <p className={styles.subtitle}>
            ¿Quieres implementar el sistema en tu iglesia o tienes alguna consulta? Elige tu canal preferido o déjanos un mensaje directo.
          </p>
        </div>

        {/* Contact Channels */}
        <div className={styles.contactChannels}>
          <a
            href="https://wa.me/18294108036?text=Hola,%20me%20gustar%C3%ADa%20obtener%20m%C3%A1s%20informaci%C3%B3n%20sobre%20Igleconexion"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.channelCard}
          >
            <span className={styles.channelIcon}>💬</span>
            <span className={styles.channelTitle}>WhatsApp</span>
            <span className={styles.channelDesc}>Escríbenos al 829-410-8036</span>
          </a>

          <a
            href="mailto:biblosgames@gmail.com?subject=Interesado%20en%20Igleconexion"
            className={styles.channelCard}
          >
            <span className={styles.channelIcon}>✉️</span>
            <span className={styles.channelTitle}>Correo</span>
            <span className={styles.channelDesc}>biblosgames@gmail.com</span>
          </a>
        </div>

        <div className={styles.formSectionTitle}>
          <span>O envía un mensaje directo</span>
        </div>

        {error && <div className={`${styles.alert} ${styles.alertError}`}>⚠️ {error}</div>}
        {success && <div className={`${styles.alert} ${styles.alertSuccess}`}>✅ {success}</div>}

        <form onSubmit={handleSubmit} className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Nombre completo</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Tu nombre y apellido"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Correo Electrónico</label>
            <input
              type="email"
              className={styles.input}
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Teléfono de Contacto</label>
            <input
              type="tel"
              className={styles.input}
              placeholder="Ej: 829-410-8036"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Mensaje / Consulta</label>
            <textarea
              className={styles.textarea}
              placeholder="Cuéntanos sobre tu iglesia o consulta..."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={4}
              required
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Enviando..." : "Enviar Mensaje Directo"}
          </button>
        </form>

        <Link href="/" className={styles.backLink}>
          ← Cancelar y volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
