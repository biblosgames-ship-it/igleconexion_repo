"use client";
import { useState, useEffect } from "react";
import styles from "./registro.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegistroNuevoCreyente() {
  const router = useRouter();

  // Estados del formulario
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [sexo, setSexo] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [estadoCivil, setEstadoCivil] = useState("");
  const [tieneHijos, setTieneHijos] = useState("");
  const [nivelAcademico, setNivelAcademico] = useState("");
  const [profesion, setProfesion] = useState("");
  const [formacionMinisterial, setFormacionMinisterial] = useState("");
  const [sector, setSector] = useState("");
  const [calleNumero, setCalleNumero] = useState("");
  const [medioRelacion, setMedioRelacion] = useState("");
  const [fechaConversion, setFechaConversion] = useState("");
  const [esOyente, setEsOyente] = useState(false);
  const [googlePhoto, setGooglePhoto] = useState("");

  // Estados para vinculación familiar
  const [familiarSearch, setFamiliarSearch] = useState("");
  const [familiarResult, setFamiliarResult] = useState<any[]>([]);
  const [familiarId, setFamiliarId] = useState("");
  const [familiarNombre, setFamiliarNombre] = useState("");
  const [rolFamiliar, setRolFamiliar] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Catálogos cargados de localStorage
  const [sociedades, setSociedades] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [etapas, setEtapas] = useState<any[]>([]);
  const [selectedEtapaId, setSelectedEtapaId] = useState("");
  const [opcionesMedioRelacion, setOpcionesMedioRelacion] = useState<string[]>([
    "Evangelismo en la calle",
    "Invitado por un amigo/familiar",
    "Redes Sociales (Facebook / Instagram)",
    "Campaña Evangelística",
    "Visité el templo por mi cuenta"
  ]);

  // Cargar configuraciones
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch("/api/iglesia");
        const data = await res.json();
        if (!data.error) {
          setSociedades(data.sociedades || []);
          setGrupos(data.grupos || []);
          setEtapas(data.etapas || []);
          if (data.opciones_registro?.medio_relacion) {
            setOpcionesMedioRelacion(data.opciones_registro.medio_relacion);
          }
        }
      } catch (e) {
        console.error("Error loading config for registration", e);
      }
    };
    loadConfig();

    const params = new URLSearchParams(window.location.search);
    const googleName = params.get("google_name");
    const googleEmail = params.get("google_email");
    const googlePhoto = params.get("google_photo");
    if (googleName) setNombre(googleName);
    if (googleEmail) setCorreo(googleEmail);
    if (googlePhoto) setGooglePhoto(googlePhoto);
  }, []);

  // Búsqueda de familiares
  useEffect(() => {
    if (familiarSearch.length < 3) {
      setFamiliarResult([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/personas/search?q=${encodeURIComponent(familiarSearch)}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setFamiliarResult(data);
        }
      } catch (e) {
        console.error("Error searching familiar", e);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [familiarSearch]);

  // Calcular Edad
  const getEdad = () => {
    if (!fechaNacimiento) return null;
    const today = new Date();
    const birthDate = new Date(fechaNacimiento);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Calcular Asignación Automática
  const getAutoAssignment = () => {
    const edad = getEdad();
    if (edad === null || !sexo) return null;

    // Buscar directamente el grupo de conexión que coincida en rango de edad, sexo y estado civil
    const matchedGc = grupos.find(g => {
      const minAge = g.rango_edad_min ?? 0;
      const maxAge = g.rango_edad_max ?? 99;
      const ageMatch = edad >= minAge && edad <= maxAge;
      
      const gcSexStr = (g.sexo || "").toLowerCase();
      const userSexStr = sexo === "M" ? "masculino" : "femenino";
      const genderMatch = gcSexStr === "mixto" || gcSexStr === "mix" || gcSexStr === userSexStr || gcSexStr === sexo.toLowerCase();
      
      if (!ageMatch || !genderMatch) return false;

      // Validar Estado Civil requerido
      const isSoltero = ["Soltero/a", "Divorciado/a", "Viudo/a"].includes(estadoCivil);
      const isCasado = ["Casado/a", "Unión Libre"].includes(estadoCivil);

      if (g.estado_civil_requerido === "SOLTERO") {
        if (!isSoltero) return false;
      } else if (g.estado_civil_requerido === "CASADO") {
        if (!isCasado) return false;
      }
      
      return true;
    });

    if (matchedGc) {
      const matchedSoc = sociedades.find(soc => soc.id === matchedGc.sociedad_id);
      return {
        sociedadId: matchedSoc ? matchedSoc.id : "Sociedad General",
        sociedadName: matchedSoc ? matchedSoc.nombre_sociedad : "Sociedad General",
        grupoId: matchedGc.id,
        grupoName: matchedGc.nombre_grupo
      };
    }

    // Buscar al menos una sociedad que coincida si no hay grupo específico
    const matchedSoc = sociedades.find(soc => {
      const minAge = soc.rango_edad_min ?? 0;
      const maxAge = soc.rango_edad_max ?? 99;
      const ageMatch = edad >= minAge && edad <= maxAge;
      
      const genderMatch = !soc.sexo_requerido || 
                          soc.sexo_requerido === "MIXTO" || 
                          soc.sexo_requerido === sexo;
      return ageMatch && genderMatch;
    });

    if (matchedSoc) {
      return {
        sociedadId: matchedSoc.id,
        sociedadName: matchedSoc.nombre_sociedad,
        grupoId: null,
        grupoName: "Grupo por Asignar"
      };
    }

    return null;
  };

  const assignment = getAutoAssignment();
  const calculatedAge = getEdad();

  // Enviar formulario y guardar en base de datos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userData = {
      nombre,
      telefono,
      whatsapp: whatsapp || telefono,
      fechaNacimiento,
      calculatedAge,
      sexo,
      correo,
      password,
      estadoCivil,
      tieneHijos,
      nivelAcademico,
      profesion,
      formacionMinisterial,
      sector,
      calleNumero,
      medioRelacion,
      sociedadName: assignment ? assignment.sociedadName : "Sociedad General",
      grupoName: assignment ? assignment.grupoName : "Grupo General",
      etapaId: null,
      fechaConversion: esOyente ? null : (fechaConversion || null),
      esOyente: esOyente,
      familiarId,
      rolFamiliar,
      foto_url: googlePhoto || null,
    };

    try {
      // 1. Guardar Persona en Base de Datos
      const regRes = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const regData = await regRes.json();

      if (regData.error) {
        alert("Error de registro: " + regData.error);
        return;
      }

      // 2. Establecer el ID de la persona en sesión mock
      if (regData.miembro?.id) {
        await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: regData.miembro.id }),
        });
      }

      // Redireccionar al hub o perfil
      const params = new URLSearchParams(window.location.search);
      if (params.get("google_name")) {
        router.push("/hub");
      } else {
        router.push("/perfil");
      }
    } catch (e) {
      console.error("Error submitting registration form", e);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>🌱 Únete a la Familia</h1>
          <p className={styles.subtitle}>Completa tus datos para iniciar tu ruta de crecimiento con asignación automática.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Nombre Completo</label>
              <input type="text" className={styles.input} placeholder="Ej: Juan Pérez" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Teléfono Principal</label>
              <input type="tel" className={styles.input} placeholder="(809) 000-0000" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>WhatsApp</label>
              <input type="tel" className={styles.input} placeholder="(809) 000-0000" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Fecha de Nacimiento</label>
              <input type="date" className={styles.input} value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} required />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', margin: '0.25rem 0 0.75rem 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: 600, color: '#334155' }}>
                <input 
                  type="checkbox" 
                  checked={esOyente} 
                  onChange={(e) => {
                    setEsOyente(e.target.checked);
                    if (e.target.checked) setFechaConversion("");
                  }} 
                  style={{ width: '1.25rem', height: '1.25rem', accentColor: '#2563eb' }}
                />
                <div>
                  <span style={{ display: 'block', fontSize: '0.95rem', color: '#1e293b' }}>🎧 Solo soy oyente / visitante (Aún no he tomado una decisión de conversión)</span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 400 }}>Si marcas esta casilla, quedarás registrado como oyente en tu grupo correspondiente por edad.</span>
                </div>
              </label>

              {!esOyente && (
                <div style={{ marginTop: '0.85rem' }}>
                  <label className={styles.label}>Fecha de Conversión (Cuando aceptaste a Cristo)</label>
                  <input type="date" className={styles.input} value={fechaConversion} onChange={(e) => setFechaConversion(e.target.value)} />
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Sexo</label>
              <select className={styles.select} value={sexo} onChange={(e) => setSexo(e.target.value)} required>
                <option value="">Selecciona...</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>



            {/* PREVIEW DE ASIGNACIÓN AUTOMÁTICA EN TIEMPO REAL */}
            {assignment && (
              <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                <h4 style={{ color: '#16a34a', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.95rem' }}>
                  ⚡ Asignación de Red Sugerida (Edad: {calculatedAge} años)
                </h4>
                <p style={{ color: '#166534', margin: 0, fontSize: '0.9rem', lineHeight: '1.4' }}>
                  Basado en tu edad y sexo, pertenecerás a la macrorred <strong>{assignment.sociedadName}</strong> y se te asignará al Grupo de Conexión <strong>{assignment.grupoName}</strong> de forma automática.
                </p>
              </div>
            )}

            {/* SECCIÓN DE VINCULACIÓN FAMILIAR */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <hr style={{ borderTop: '1px solid #e2e8f0', margin: '1rem 0' }} />
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '1.25rem', borderRadius: '12px', marginBottom: '1rem' }}>
                <h3 style={{ color: '#b45309', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1.1rem' }}>
                  👨‍👩‍👧‍👦 Vincular a tu Familia
                </h3>
                <p style={{ color: '#92400e', margin: '0 0 1rem 0', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  Si tu cónyuge, padres o hijos ya están registrados en la plataforma, puedes buscarlos aquí para vincular tu perfil al de ellos. Esto nos ayuda a mantener un registro organizado de las familias de la iglesia.
                </p>

                {familiarId ? (
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: '#166534', display: 'block' }}>Familiar seleccionado:</span>
                      <strong style={{ color: '#15803d', fontSize: '1.05rem' }}>{familiarNombre}</strong>
                    </div>
                    <button type="button" onClick={() => { setFamiliarId(""); setFamiliarNombre(""); setFamiliarSearch(""); setRolFamiliar(""); }} style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }}>✕ Quitar</button>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <label className={styles.label} style={{ color: '#92400e' }}>Buscar Familiar por Nombre</label>
                    <input 
                      type="text" 
                      className={styles.input} 
                      placeholder="Ej: María Gómez" 
                      value={familiarSearch} 
                      onChange={(e) => setFamiliarSearch(e.target.value)} 
                      style={{ borderColor: '#fcd34d', backgroundColor: 'white' }}
                    />
                    {isSearching && <div style={{ fontSize: '0.8rem', color: '#b45309', marginTop: '0.25rem' }}>Buscando...</div>}
                    
                    {familiarResult.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '4px', zIndex: 10, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                        {familiarResult.map((fam) => (
                          <div 
                            key={fam.id} 
                            onClick={() => {
                              setFamiliarId(fam.id);
                              setFamiliarNombre(fam.nombre);
                              setFamiliarResult([]);
                            }}
                            style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <span style={{ fontWeight: 500 }}>{fam.nombre}</span>
                            {fam.familia_codigo && <span style={{ fontSize: '0.75rem', backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '2px 6px', borderRadius: '4px' }}>Fam: {fam.familia_codigo}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {familiarId && (
                  <div style={{ marginTop: '1rem' }}>
                    <label className={styles.label} style={{ color: '#92400e' }}>¿Qué parentesco tienes tú con {familiarNombre}?</label>
                    <select className={styles.select} value={rolFamiliar} onChange={(e) => setRolFamiliar(e.target.value)} required style={{ borderColor: '#fcd34d', backgroundColor: 'white' }}>
                      <option value="">Selecciona tu rol...</option>
                      <option value="ESPOSO">Soy su Esposo</option>
                      <option value="ESPOSA">Soy su Esposa</option>
                      <option value="PADRE">Soy su Padre</option>
                      <option value="MADRE">Soy su Madre</option>
                      <option value="HIJO">Soy su Hijo</option>
                      <option value="HIJA">Soy su Hija</option>
                      <option value="HERMANO">Soy su Hermano/a</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <hr style={{ borderTop: '1px solid #e2e8f0', margin: '1rem 0' }} />
              <h3 style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Datos Opcionales (Perfil)</h3>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Correo Electrónico</label>
              <input type="email" className={styles.input} placeholder="correo@ejemplo.com" value={correo} onChange={(e) => setCorreo(e.target.value)} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Crear Contraseña para mi Cuenta</label>
              <input type="password" className={styles.input} placeholder="•••••••• (Para iniciar sesión sin Google)" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Estado Civil</label>
              <select className={styles.select} value={estadoCivil} onChange={(e) => setEstadoCivil(e.target.value)}>
                <option value="">Selecciona...</option>
                <option value="Soltero/a">Soltero/a</option>
                <option value="Casado/a">Casado/a</option>
                <option value="Divorciado/a">Divorciado/a</option>
                <option value="Viudo/a">Viudo/a</option>
                <option value="Unión Libre">Unión Libre</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>¿Tienes Hijos?</label>
              <select className={styles.select} value={tieneHijos} onChange={(e) => setTieneHijos(e.target.value)}>
                <option value="">Selecciona...</option>
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Nivel Académico</label>
              <select className={styles.select} value={nivelAcademico} onChange={(e) => setNivelAcademico(e.target.value)}>
                <option value="">Selecciona...</option>
                <option value="Básico">Básico</option>
                <option value="Bachiller">Bachiller</option>
                <option value="Técnico">Técnico</option>
                <option value="Universitario">Universitario</option>
                <option value="Postgrado / Maestría">Postgrado / Maestría</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Profesión u Oficio</label>
              <input type="text" className={styles.input} placeholder="Ej: Maestro, Contable, Pintor..." value={profesion} onChange={(e) => setProfesion(e.target.value)} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>¿Formación Ministerial?</label>
              <select className={styles.select} value={formacionMinisterial} onChange={(e) => setFormacionMinisterial(e.target.value)}>
                <option value="">Selecciona...</option>
                <option value="si">Sí, tengo estudios teológicos</option>
                <option value="no">No</option>
              </select>
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <h3 style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '0.5rem' }}>Dirección</h3>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Sector / Barrio</label>
              <input type="text" className={styles.input} placeholder="Sector donde vives" value={sector} onChange={(e) => setSector(e.target.value)} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Calle y Número</label>
              <input type="text" className={styles.input} placeholder="Ej: C/ Duarte #45" value={calleNumero} onChange={(e) => setCalleNumero(e.target.value)} />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>¿Cómo nos conociste? / ¿Quién te invitó?</label>
              <select className={styles.select} value={medioRelacion} onChange={(e) => setMedioRelacion(e.target.value)} required>
                <option value="">Selecciona una opción...</option>
                {opcionesMedioRelacion.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <p className={styles.helpText}>Esta información ayuda a nuestros líderes a darte el mejor seguimiento.</p>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn}>
            Completar Registro
          </button>
        </form>

        <Link href="/hub" className={styles.backBtn}>
          ← Cancelar y volver al inicio
        </Link>
      </div>
    </div>
  );
}
