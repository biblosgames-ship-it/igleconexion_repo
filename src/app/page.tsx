"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";
import NextImage from 'next/image';
import Link from "next/link";

export default function GlobalLogin() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSlug = localStorage.getItem("iglesia_slug");
      if (savedSlug) setSlug(savedSlug);

      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err) {
        setUrlError(decodeURIComponent(err));
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUrlError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, email, password }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        localStorage.setItem("iglesia_slug", slug);
        if (data.rol === "SUPERADMIN") {
          router.push("/superadmin");
        } else if (data.rol === "ADMIN_IGLESIA") {
          router.push("/admin");
        } else if (data.rol === "LIDER") {
          router.push("/lider");
        } else {
          router.push("/hub");
        }
      }
    } catch (err) {
      setError("Error de conexión al servidor.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMemberRegister = async () => {
    if (!slug) {
      setError("Por favor, ingresa primero el Código de la Iglesia para poder registrarte.");
      return;
    }
    setError(null);
    setUrlError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set-active-church", slug }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        router.push("/registro");
      }
    } catch (err) {
      setError("Error de conexión al servidor.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!slug) {
      setError("Por favor, ingresa primero el Código de la Iglesia para poder continuar.");
      return;
    }
    setError(null);
    setUrlError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set-active-church", slug }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setLoading(false);
      } else {
        window.location.href = "/api/auth/google";
      }
    } catch (err) {
      setError("Error de conexión al servidor.");
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.brandLogo}>
          <NextImage src="/Igleconexion logo 2.png" alt="Igleconexion" width={180} height={135} style={{ objectFit: 'contain' }} />
        </div>
        
        <h1 className={styles.title}>IGLECONEXION</h1>
        <p className={styles.brandSubtitle}>Conecta - Gestiona - Transforma</p>

        {(error || urlError) && (
          <div style={{ backgroundColor: "rgba(239, 68, 68, 0.2)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#fecaca", padding: "0.85rem", borderRadius: "12px", fontSize: "0.88rem", marginBottom: "1.25rem", textAlign: "left", lineHeight: "1.4", backdropFilter: "blur(8px)" }}>
            ⚠️ {error || urlError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Código de la Iglesia</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>
                <img src="/Iconos/Iglesia.png" alt="Iglesia" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
              </span>
              <input 
                type="text" 
                className={styles.input} 
                placeholder="Ej: primerahiguey o torrefuerterd" 
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().trim())}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Correo / Usuario</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>
                <img src="/iconos svg/perfil.svg" alt="Usuario" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
              </span>
              <input 
                type="email" 
                className={styles.input} 
                placeholder="tu.correo@ejemplo.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Contraseña</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>
                <img src="/Iconos/contrasena.png" alt="Contraseña" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
              </span>
              <input 
                type="password" 
                className={styles.input} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar a mi Iglesia"}
          </button>

          <button
            type="button"
            className={styles.btnGoogle}
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <img 
              src="https://www.svgrepo.com/show/475656/google-color.svg" 
              alt="Google" 
              style={{ width: "18px", height: "18px" }} 
            />
            Iniciar sesión con Google
          </button>

          <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.9)' }}>
            ¿Eres nuevo en la iglesia?{' '}
            <button 
              type="button" 
              onClick={handleNewMemberRegister} 
              className={styles.footerLink}
              style={{ background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '0.88rem' }}
            >
              Registrarme como nuevo miembro
            </button>
          </p>
        </form>

        <div className={styles.footerInfo}>
          <div className={styles.divider}>¿Iglesia Nueva?</div>
          <p style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "0.88rem", marginBottom: "0.4rem" }}>
            ¿Tienes un código de activación?{' '}
            <Link href="/registro-iglesia" className={styles.footerLink}>Registrar mi Iglesia</Link>
          </p>
          <p style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "0.88rem", marginBottom: "0.4rem" }}>
            ¿Quieres usar igleconexion en tu iglesia?{' '}
            <Link href="/contacto" className={styles.footerLink}>Contáctanos</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
