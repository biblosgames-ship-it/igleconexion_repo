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

  // Estados para Restablecer Contraseña
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetPasswordVal, setResetPasswordVal] = useState("");
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(null);
    setResetError(null);
    setResetLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset-password",
          slug,
          email: resetEmail || email,
          newPassword: resetPasswordVal
        }),
      });
      const data = await res.json();
      if (data.error) {
        setResetError(data.error);
      } else {
        setResetMessage(data.message || "¡Contraseña actualizada con éxito!");
        setPassword(resetPasswordVal);
        setEmail(resetEmail || email);
        setTimeout(() => {
          setShowResetModal(false);
          setResetMessage(null);
        }, 2000);
      }
    } catch (err) {
      setResetError("Error al intentar restablecer la contraseña.");
    } finally {
      setResetLoading(false);
    }
  };

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
                <img src="/Iconos SVG/iglesia.png" alt="Iglesia" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
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
                <img src="/Iconos SVG/perfil.svg" alt="Usuario" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
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
                <img src="/Iconos SVG/contrasena.png" alt="Contraseña" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
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

          <div style={{ marginTop: '1.25rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={() => {
                setResetEmail(email);
                setShowResetModal(true);
              }}
              style={{ background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
            >
              🔑 ¿Olvidaste o deseas restablecer tu contraseña?
            </button>

            <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.9)' }}>
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
          </div>
        </form>

        {showResetModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', width: '100%', maxWidth: '420px', padding: '1.75rem', color: 'white', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'white' }}>🔑 Restablecer Contraseña</h3>
                <button onClick={() => setShowResetModal(false)} style={{ border: 'none', background: 'transparent', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
              </div>

              {resetError && (
                <div style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#fecaca', padding: '0.75rem', borderRadius: '10px', fontSize: '0.82rem', marginBottom: '1rem' }}>
                  ⚠️ {resetError}
                </div>
              )}

              {resetMessage && (
                <div style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)', color: '#bbf7d0', padding: '0.75rem', borderRadius: '10px', fontSize: '0.82rem', marginBottom: '1rem' }}>
                  ✅ {resetMessage}
                </div>
              )}

              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    placeholder="tu.correo@ejemplo.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Nueva Contraseña</label>
                  <input
                    type="password"
                    required
                    placeholder="Ingresa tu nueva contraseña"
                    value={resetPasswordVal}
                    onChange={(e) => setResetPasswordVal(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setShowResetModal(false)} style={{ padding: '0.55rem 1.1rem', borderRadius: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#94a3b8', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={resetLoading} style={{ padding: '0.55rem 1.3rem', borderRadius: '10px', background: '#0284c7', color: 'white', border: 'none', fontWeight: 700, cursor: resetLoading ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>
                    {resetLoading ? "Guardando..." : "💾 Cambiar Contraseña"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
