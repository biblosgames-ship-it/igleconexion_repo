"use client";
import { useState, useEffect, use } from "react";
import styles from "../perfil.module.css";
import { useRouter } from "next/navigation";

export default function PerfilLectura({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/perfil/${id}`);
        const data = await res.json();
        if (res.ok) {
          setProfile(data);
        } else {
          setError(data.error || "Error al cargar perfil");
        }
      } catch (err) {
        setError("Error de conexión");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return <div className={styles.container}><div className={styles.main}>Cargando perfil...</div></div>;
  }

  if (error || !profile) {
    return (
      <div className={styles.container}>
        <div className={styles.main}>
          <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px' }}>
            <h2>No se pudo cargar el perfil</h2>
            <p>{error}</p>
            <button onClick={() => router.back()} className={styles.backBtn} style={{ marginTop: '1rem', display: 'inline-flex', cursor: 'pointer' }}>Volver</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", color: "var(--text-primary)" }}>
          Perfil de Usuario
        </h1>
        <button onClick={() => router.back()} className={styles.backBtn} style={{ cursor: 'pointer' }}>
          ⬅️ Volver
        </button>
      </header>

      <main className={styles.main}>
        <div className={styles.profileCard}>
          <div className={styles.avatarContainer}>
            <div className={styles.avatar} style={{ backgroundColor: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", overflow: 'hidden' }}>
              {profile.foto_url ? (
                <img src={profile.foto_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: "3rem", color: "#94a3b8" }}>👤</span>
              )}
            </div>
          </div>
          
          <div className={styles.userInfo} style={{ width: '100%' }}>
            <div className={styles.userInfoHeader}>
              <div>
                <h1 style={{ marginBottom: '0.25rem', fontSize: '1.8rem', color: 'var(--text-primary)' }}>{profile.nombre}</h1>
                <p className={styles.userSubtitle}>
                  {profile.grupo_conexion_nombre !== "Sin grupo" ? `Grupo: ${profile.grupo_conexion_nombre}` : 'Sin grupo asignado'}
                </p>
              </div>
            </div>

            <div className={styles.contactInfo} style={{ marginTop: '1rem' }}>
              {profile.telefono && (
                <div className={styles.contactItem}>
                  <span>📞</span>
                  <span>{profile.telefono}</span>
                </div>
              )}
              {profile.fechaNacimiento && (
                <div className={styles.contactItem}>
                  <span>🎂</span>
                  <span>{profile.fechaNacimiento}</span>
                </div>
              )}
              {profile.sexo && (
                <div className={styles.contactItem}>
                  <span>👤</span>
                  <span>{profile.sexo === 'M' ? 'Masculino' : profile.sexo === 'F' ? 'Femenino' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sección de Etapa */}
        <div className={styles.timelineCard}>
          <h2 className={styles.sectionTitle}>Progreso de Consolidación</h2>
          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
              Etapa Actual: <span style={{ color: 'var(--accent-blue)' }}>{profile.etapa_nombre}</span>
            </p>
          </div>
        </div>

        {/* Sección de Familia */}
        {profile.familia && profile.familia.length > 0 && (
          <div className={styles.timelineCard}>
            <h2 className={styles.sectionTitle}>Familia</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {profile.familia.map((f: any) => (
                <div key={f.id} style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                      👤
                    </div>
                    <div>
                      <h4 style={{ margin: 0, color: '#0f172a' }}>{f.nombre}</h4>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', background: '#e2e8f0', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>
                        {f.rol}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
