"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './biblioteca.module.css';

export default function BibliotecaPage() {
  const [recursos, setRecursos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('TODOS');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewerItem, setViewerItem] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Formulario nuevo recurso
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoria: 'Estudios Bíblicos',
    tipo: 'PDF',
    url_recurso: '',
    url_miniatura: '',
    tags: '',
  });

  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string>("MIEMBRO");

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const res = await fetch("/api/auth");
        const data = await res.json();
        if (data?.user?.rol) {
          setUserRole(data.user.rol);
        }
      } catch (e) {
        console.error("Error al obtener rol del usuario:", e);
      }
    };
    fetchUserRole();
  }, []);

  const isAdmin = ["ADMIN_IGLESIA", "SUPERADMIN", "LIDER"].includes(userRole);

  useEffect(() => {
    fetchRecursos();
  }, [selectedType, selectedCategory]);

  const fetchRecursos = async () => {
    setLoading(true);
    try {
      let url = `/api/biblioteca?tipo=${selectedType}&categoria=${selectedCategory}`;
      if (searchQuery) url += `&query=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRecursos(data);
      }
    } catch (e) {
      console.error("Error al cargar biblioteca:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecursos();
  };

  const handleCreateRecurso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo || !formData.url_recurso) {
      alert("Por favor completa el título y la URL del recurso.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/biblioteca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowAddModal(false);
        setFormData({
          titulo: '',
          descripcion: '',
          categoria: 'Estudios Bíblicos',
          tipo: 'PDF',
          url_recurso: '',
          url_miniatura: '',
          tags: '',
        });
        fetchRecursos();
        alert("¡Recurso añadido con éxito a la biblioteca!");
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'No se pudo guardar'}`);
      }
    } catch (e: any) {
      alert(`Error al guardar: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecurso = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("¿Seguro que deseas eliminar este recurso de la biblioteca?")) return;

    try {
      const res = await fetch(`/api/biblioteca/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRecursos(prev => prev.filter(item => item.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Ayudantes de formateo de YouTube e iFrames
  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match && match[1] ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : url;
  };

  const getPdfViewUrl = (url: string) => {
    if (url.includes('drive.google.com') && url.includes('/view')) {
      return url.replace('/view', '/preview');
    }
    return url;
  };

  return (
    <div className={styles.container}>
      {/* Encabezado Principal */}
      <header className={styles.header}>
        <div style={{ marginBottom: '0.75rem' }}>
          <Link href="/hub" style={{ textDecoration: 'none' }}>
            <button
              type="button"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: 'white',
                padding: '0.45rem 0.9rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backdropFilter: 'blur(4px)'
              }}
            >
              <span>🏠 ← Volver al Hub</span>
            </button>
          </Link>
        </div>

        <div className={styles.headerContent}>
          <div className={styles.titleGroup}>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img src="/Iconos SVG/biblioteca.svg" alt="Biblioteca" style={{ width: 36, height: 36, objectFit: 'contain' }} />
              Biblioteca Digital de Recursos
            </h1>
            <p className={styles.subtitle}>
              Explora nuestra colección digital: Guías en PDF, enseñanzas en Video y galerías de fotos ministeriales.
            </p>
          </div>
          {isAdmin && (
            <button className={styles.primaryBtn} onClick={() => setShowAddModal(true)}>
              <span>➕ Publicar Recurso</span>
            </button>
          )}
        </div>
      </header>

      {/* Contenido Principal */}
      <main className={styles.mainContent}>
        {/* Barra de Filtros y Búsqueda */}
        <div className={styles.topBarCard}>
          {/* BOTÓN DESPLEGABLE CON ICONOS ESTILO HUB */}
          <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.9rem 1.25rem',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '16px',
                cursor: 'pointer',
                fontSize: '0.98rem',
                fontWeight: 700,
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.3rem' }}>
                  {selectedType === 'TODOS' ? '📂' : selectedType === 'PDF' ? '📄' : selectedType === 'VIDEO' ? '📺' : selectedType === 'GALERIA' ? '🖼️' : selectedType === 'AUDIO' ? '🎧' : '✍️'}
                </span>
                <span>
                  Categoría / Formato: {selectedType === 'TODOS' ? 'Todos los Recursos' : selectedType === 'PDF' ? 'Documentos PDF' : selectedType === 'VIDEO' ? 'Videos y Prédicas' : selectedType === 'GALERIA' ? 'Fotografías y Galerías' : selectedType === 'AUDIO' ? 'Audios y Podcasts' : 'Artículos y Reflexiones'}
                </span>
              </div>
              <span style={{ fontSize: '1.1rem', color: '#38bdf8', transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
            </button>

            {/* MENÚ FLOTANTE CON ICONOS ESTILO HUB */}
            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  left: 0,
                  right: 0,
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '18px',
                  padding: '1rem',
                  zIndex: 200,
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.75rem'
                }}
              >
                {[
                  { type: 'TODOS', label: 'Todos los Recursos', desc: 'Explorar todo', icon: '📂', color: '#0284c7' },
                  { type: 'PDF', label: 'Documentos PDF', desc: 'Guías y manuales', icon: '📄', color: '#ef4444' },
                  { type: 'VIDEO', label: 'Videos y Prédicas', desc: 'Canal de YouTube', icon: '📺', color: '#f59e0b' },
                  { type: 'GALERIA', label: 'Fotos y Galerías', desc: 'Enlaces externos (URL)', icon: '🖼️', color: '#10b981' },
                  { type: 'AUDIO', label: 'Audios y Podcasts', desc: 'Predicas en audio', icon: '🎧', color: '#8b5cf6' },
                  { type: 'BLOG', label: 'Artículos y Blogs', desc: 'Reflexiones de texto', icon: '✍️', color: '#ec4899' },
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      setSelectedType(item.type);
                      setMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.85rem',
                      background: selectedType === item.type ? `${item.color}25` : 'rgba(255,255,255,0.04)',
                      border: selectedType === item.type ? `2px solid ${item.color}` : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span style={{ fontSize: '1.6rem' }}>{item.icon}</span>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.88rem', color: selectedType === item.type ? '#38bdf8' : 'white' }}>{item.label}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Buscador y Categorías */}
          <div className={styles.filterControls}>
            <form onSubmit={handleSearchSubmit} className={styles.searchBox}>
              <span>🔍</span>
              <input
                type="text"
                placeholder="Buscar por título, tema o etiquetas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </form>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.categorySelect}
            >
              <option value="TODOS">Todas las Categorías</option>
              <option value="Estudios Bíblicos">Estudios Bíblicos</option>
              <option value="Sermones y Predicas">Sermones y Prédicas</option>
              <option value="Manuales y Guías">Manuales y Guías</option>
              <option value="Jóvenes y Niños">Jóvenes y Niños</option>
              <option value="Eventos Especiales">Eventos Especiales</option>
              <option value="General">General</option>
            </select>
          </div>
        </div>

        {/* Grilla de Recursos */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b' }}>
            <span style={{ fontSize: '2rem' }}>🔄</span>
            <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>Cargando recursos de la biblioteca...</p>
          </div>
        ) : recursos.length === 0 ? (
          <div className={styles.emptyState}>
            <span style={{ fontSize: '3rem' }}>📂</span>
            <h3 style={{ margin: '0.75rem 0 0.25rem 0', color: '#0f172a', fontWeight: 800 }}>No se encontraron recursos</h3>
            <p style={{ fontSize: '0.9rem', margin: 0 }}>
              No hay archivos guardados en esta categoría. {isAdmin ? '¡Haz clic en "Publicar Recurso" para añadir el primero!' : 'Vuelve pronto para nuevos contenidos.'}
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {recursos.map((item) => {
              const isPdf = item.tipo === 'PDF';
              const isVideo = item.tipo === 'VIDEO';
              const isFoto = item.tipo === 'GALERIA';

              // Imagen de miniatura predeterminada si no hay una explicita
              let defaultCover = item.url_miniatura;
              if (!defaultCover) {
                if (isPdf) defaultCover = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=60";
                else if (isFoto) defaultCover = "https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?w=600&auto=format&fit=crop&q=60";
                else defaultCover = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=60";
              }

              return (
                <div key={item.id} className={styles.card} onClick={() => setViewerItem(item)}>
                  <div className={styles.cardMediaContainer}>
                    <img src={defaultCover} alt={item.titulo} className={styles.cardCoverImage} loading="lazy" decoding="async" />
                    <span className={`${styles.badgeType} ${isPdf ? styles.badgePdf : isVideo ? styles.badgeVideo : styles.badgeGaleria}`}>
                      {isPdf ? '📄 PDF' : isVideo ? '📺 VIDEO' : '🖼️ FOTOS'}
                    </span>
                  </div>

                  <div className={styles.cardBody}>
                    <span className={styles.categoryTag}>{item.categoria || 'General'}</span>
                    <h3 className={styles.cardTitle}>{item.titulo}</h3>
                    <p className={styles.cardDesc}>{item.descripcion || 'Sin descripción adicional.'}</p>
                  </div>

                  <div className={styles.cardFooter}>
                    <button className={styles.viewBtn}>
                      {isVideo ? '▶️ Ver Video' : isPdf ? '📖 Leer Documento' : '👁️ Ver Galería'}
                    </button>
                    {isAdmin && (
                      <button className={styles.deleteBtn} onClick={(e) => handleDeleteRecurso(item.id, e)} title="Eliminar">
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL 1: AGREGAR NUEVO RECURSO */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>➕ Publicar Nuevo Recurso</h3>
              <button className={styles.closeBtn} onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateRecurso} className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tipo de Recurso *</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className={styles.formSelect}
                  required
                >
                  <option value="PDF">📄 Documento PDF (Lectura y Descarga)</option>
                  <option value="VIDEO">📺 Video de YouTube (Reproducción integrada)</option>
                  <option value="GALERIA">🖼️ Fotos / Galería Externa por URL (Sin ocupar espacio en BD)</option>
                  <option value="AUDIO">🎧 Audio / Podcast / Prédica</option>
                  <option value="BLOG">✍️ Artículo / Blog / Reflexión Escrita</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Título del Recurso *</label>
                <input
                  type="text"
                  placeholder="Ej: Manual de Estudio de Discipulado 2026"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Categoría *</label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className={styles.formSelect}
                >
                  <option value="Estudios Bíblicos">Estudios Bíblicos</option>
                  <option value="Sermones y Predicas">Sermones y Prédicas</option>
                  <option value="Manuales y Guías">Manuales y Guías</option>
                  <option value="Jóvenes y Niños">Jóvenes y Niños</option>
                  <option value="Eventos Especiales">Eventos Especiales</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  {formData.tipo === 'PDF' && 'Link o URL del Documento PDF * (Google Drive, Dropbox, Enlace directo)'}
                  {formData.tipo === 'VIDEO' && 'Link o URL del Video de YouTube * (Ej: https://www.youtube.com/watch?v=...)'}
                  {formData.tipo === 'GALERIA' && 'Link o URL de la Foto / Galería Externa * (Instagram, Flickr, Imgur, etc.)'}
                </label>
                <input
                  type="url"
                  placeholder={
                    formData.tipo === 'PDF'
                      ? 'https://ejemplo.com/documento.pdf'
                      : formData.tipo === 'VIDEO'
                      ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                      : 'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27'
                  }
                  value={formData.url_recurso}
                  onChange={(e) => setFormData({ ...formData, url_recurso: e.target.value })}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>URL de Portada / Miniatura (Opcional)</label>
                <input
                  type="url"
                  placeholder="https://ejemplo.com/portada.jpg (Se genera auto para YouTube si se omite)"
                  value={formData.url_miniatura}
                  onChange={(e) => setFormData({ ...formData, url_miniatura: e.target.value })}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Descripción</label>
                <textarea
                  placeholder="Escribe un breve resumen de lo que trata este material..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className={styles.formTextarea}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={styles.primaryBtn}
                >
                  {saving ? 'Guardando...' : '🚀 Guardar Recurso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VISUALIZADOR DE RECURSOS INTEGRADO */}
      {viewerItem && (
        <div className={styles.modalOverlay} onClick={() => setViewerItem(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.categoryTag}>{viewerItem.categoria}</span>
                <h3 className={styles.modalTitle}>{viewerItem.titulo}</h3>
              </div>
              <button className={styles.closeBtn} onClick={() => setViewerItem(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              {/* REPRODUCTOR DE VIDEO DE YOUTUBE SIN SALIR DE LA APP */}
              {viewerItem.tipo === 'VIDEO' && (
                <div className={styles.playerWrapper}>
                  <iframe
                    src={getYouTubeEmbedUrl(viewerItem.url_recurso)}
                    title={viewerItem.titulo}
                    className={styles.playerIframe}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {/* VISUALIZADOR DE DOCUMENTOS PDF */}
              {viewerItem.tipo === 'PDF' && (
                <div>
                  <iframe
                    src={getPdfViewUrl(viewerItem.url_recurso)}
                    title={viewerItem.titulo}
                    className={styles.pdfIframe}
                  />
                  <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <a
                      href={viewerItem.url_recurso}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.primaryBtn}
                      style={{ textDecoration: 'none' }}
                    >
                      📥 Abrir / Descargar PDF Original
                    </a>
                  </div>
                </div>
              )}

              {/* VISUALIZADOR DE GALERÍA Y FOTOS EXTERNAS */}
              {viewerItem.tipo === 'GALERIA' && (
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={viewerItem.url_recurso}
                    alt={viewerItem.titulo}
                    className={styles.galleryImagePreview}
                    onError={(e: any) => {
                      e.target.src = viewerItem.url_miniatura || "https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?w=600&auto=format&fit=crop&q=60";
                    }}
                  />
                  <div style={{ margin: '1rem 0' }}>
                    <a
                      href={viewerItem.url_recurso}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.primaryBtn}
                      style={{ textDecoration: 'none', background: '#8b5cf6' }}
                    >
                      🔗 Abrir Galería en Fuente Externa (Instagram/Drive/Flickr)
                    </a>
                  </div>
                </div>
              )}

              {/* VISUALIZADOR DE ARTÍCULOS Y BLOGS DE TEXTO */}
              {viewerItem.tipo === 'BLOG' && (
                <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem', display: 'flex', gap: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    <span>✍️ Autor: <strong>{viewerItem.creado_por || 'Administración'}</strong></span>
                    <span>📅 Publicado: {new Date(viewerItem.createdAt).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div style={{ fontSize: '1.02rem', lineHeight: '1.75', color: '#1e293b', whiteSpace: 'pre-line' }}>
                    {viewerItem.descripcion || 'Sin contenido en esta reflexión.'}
                  </div>
                  {viewerItem.url_recurso && viewerItem.url_recurso !== '#blog' && (
                    <div style={{ marginTop: '1.5rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
                      <a href={viewerItem.url_recurso} target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', fontWeight: 700, fontSize: '0.9rem' }}>
                        🔗 Ver fuente o lectura extendida externa →
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* DESCRIPCIÓN DEL RECURSO */}
              {viewerItem.descripcion && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '12px', marginTop: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.4rem 0', color: '#0f172a', fontSize: '0.95rem', fontWeight: 800 }}>
                    📌 Descripción del Material
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: '1.5' }}>
                    {viewerItem.descripcion}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
