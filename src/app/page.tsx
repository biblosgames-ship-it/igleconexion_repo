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
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGoogleMockModal, setShowGoogleMockModal] = useState(false);
  const [mockEmail, setMockEmail] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
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
    setError(null);
    setUrlError(null);

    // Si GOOGLE_CLIENT_ID de Next.js está expuesta, usamos OAuth real
    const clientId = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID : undefined;

    if (clientId) {
      window.location.href = "/api/auth/google";
      return;
    }

    setShowGoogleMockModal(true);
  };

  return (
    <>
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
                  placeholder="Ej: primerahiguey o torrefuerte" 
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().trim())}
                  disabled={email === "alexpalacio29@gmail.com"}
                  required={email !== "alexpalacio29@gmail.com"}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Correo / Usuario</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>
                  <img src="/Iconos/ID.png" alt="Usuario" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
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

          {/* Footer info below the login card */}
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
      {showGoogleMockModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          padding: "1rem"
        }}>
          <div style={{
            background: "white",
            padding: "1.75rem",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "380px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid #e2e8f0"
          }}>
            <h3 style={{ margin: "0 0 0.5rem 0", color: "#0f172a", fontSize: "1.15rem", fontWeight: 700 }}>
              Simulador Google Sign-In
            </h3>
            <p style={{ margin: "0 0 1.25rem 0", color: "#64748b", fontSize: "0.85rem", lineHeight: "1.5" }}>
              Ingresa el correo registrado para simular el acceso directo con Google:
            </p>
            
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={mockEmail}
              onChange={(e) => setMockEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1.5px solid #cbd5e1",
                borderRadius: "8px",
                fontSize: "0.95rem",
                marginBottom: "1.25rem",
                outline: "none",
                color: "#1e293b"
              }}
              autoFocus
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  const btn = document.getElementById('btn-submit-mock-google');
                  if (btn) btn.click();
                }
              }}
            />
            
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
              <button
                type="button"
                onClick={() => {
                  setShowGoogleMockModal(false);
                  setMockEmail("");
                }}
                style={{
                  padding: "0.55rem 1.1rem",
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#475569",
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
              >
                Cancelar
              </button>
              <button
                id="btn-submit-mock-google"
                type="button"
                onClick={async () => {
                  if (!mockEmail || !mockEmail.trim()) return;
                  setShowGoogleMockModal(false);
                  setLoading(true);
                  try {
                    const res = await fetch("/api/auth/google/mock", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: mockEmail.trim() }),
                    });
                    const data = await res.json();
                    if (data.error) {
                      setError(data.error);
                    } else if (data.redirect) {
                      router.push(data.redirect);
                    }
                  } catch (err) {
                    setError("Error al conectar con el simulador de Google.");
                    console.error(err);
                  } finally {
                    setLoading(false);
                    setMockEmail("");
                  }
                }}
                style={{
                  padding: "0.55rem 1.1rem",
                  background: "#0ea5e9",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "white",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(14, 165, 233, 0.2)",
                  transition: "background 0.2s"
                }}
              >
                Ingresar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
