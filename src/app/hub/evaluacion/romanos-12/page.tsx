'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  SECCIONES_EVALUACION,
  DONES_ROMANOS_12,
  calcularResultadoBiblosTest,
  ResultadoEvaluacion,
  DonEspiritual,
  SeccionEvaluacion
} from '@/lib/biblostest-romanos12';

export default function BiblosTestRomanos12Page() {
  const router = useRouter();

  // Estados de carga y auth
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authData, setAuthData] = useState<any>(null);
  const [iglesiaColor, setIglesiaColor] = useState('#0284c7');
  const [secciones, setSecciones] = useState<SeccionEvaluacion[]>(SECCIONES_EVALUACION);

  // Estado del paso actual (0: Introducción, 1 a 11: Secciones bíblicas, 12: Resultados)
  const [pasoActual, setPasoActual] = useState(0);

  const STORAGE_KEY_PROGRESO = 'biblostest_romanos12_progreso';
  const STORAGE_KEY_RESULTADO = 'biblostest_romanos12_ultimo_resultado';

  // Estados del formulario
  const [respuestasEscala, setRespuestasEscala] = useState<Record<string, number>>({});
  const [rankingDones, setRankingDones] = useState<Record<number, number>>({
    1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4, 7: 4
  });
  const [donSeleccionadoId, setDonSeleccionadoId] = useState<number | null>(null);
  const [diligenciasJesus, setDiligenciasJesus] = useState<string[]>(['', '', '', '', '']);

  // Estado del resultado final y aviso de restauración
  const [resultadoFinal, setResultadoFinal] = useState<ResultadoEvaluacion | null>(null);
  const [avisoRestaurado, setAvisoRestaurado] = useState(false);

  // Estados de compartir con acceso directo a la iglesia
  const [churchSlug, setChurchSlug] = useState('demo');
  const [churchNombre, setChurchNombre] = useState('Mi Iglesia');
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const getShareUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/api/auth/quick-access?slug=${encodeURIComponent(churchSlug)}&redirect=/hub/evaluacion/romanos-12`;
  };

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      // 1. Restaurar progreso guardado de inmediato desde localStorage para no perder avance
      if (typeof window !== 'undefined') {
        try {
          const guardadoStr = localStorage.getItem(STORAGE_KEY_PROGRESO);
          if (guardadoStr) {
            const guardado = JSON.parse(guardadoStr);
            if (guardado.respuestasEscala && Object.keys(guardado.respuestasEscala).length > 0) {
              setRespuestasEscala(guardado.respuestasEscala);
            }
            if (guardado.rankingDones) {
              setRankingDones(guardado.rankingDones);
            }
            if (guardado.donSeleccionadoId !== undefined) {
              setDonSeleccionadoId(guardado.donSeleccionadoId);
            }
            if (guardado.diligenciasJesus && Array.isArray(guardado.diligenciasJesus)) {
              setDiligenciasJesus(guardado.diligenciasJesus);
            }
            if (guardado.pasoActual && guardado.pasoActual > 0 && guardado.pasoActual < 12) {
              setPasoActual(guardado.pasoActual);
              setAvisoRestaurado(true);
            }
          }
        } catch (storageErr) {
          console.error('Error al restaurar progreso local:', storageErr);
        }
      }

      const [authRes, iglRes, evalRes, pregRes] = await Promise.all([
        fetch('/api/auth').catch(() => null),
        fetch('/api/iglesia').catch(() => null),
        fetch('/api/evaluaciones/romanos-12').catch(() => null),
        fetch('/api/evaluaciones/romanos-12/preguntas').catch(() => null)
      ]);

      if (authRes && authRes.ok) {
        const aData = await authRes.json();
        setAuthData(aData);
      }

      if (iglRes && iglRes.ok) {
        const iData = await iglRes.json();
        if (iData.color_principal) {
          setIglesiaColor(iData.color_principal);
        }
        if (iData.subdominio_o_slug) {
          setChurchSlug(iData.subdominio_o_slug);
        }
        if (iData.nombre_iglesia) {
          setChurchNombre(iData.nombre_iglesia);
        }
      }

      if (evalRes && evalRes.ok) {
        const eData = await evalRes.json();
        if (eData.miResultado) {
          setResultadoFinal(eData.miResultado);
        }
      }

      if (pregRes && pregRes.ok) {
        const pData = await pregRes.json();
        if (pData.secciones && Array.isArray(pData.secciones) && pData.secciones.length > 0) {
          setSecciones(pData.secciones);
        }
      }
    } catch (err) {
      console.error('Error al inicializar formulario BiblosTest:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-guardado en tiempo real en localStorage en cada cambio
  useEffect(() => {
    if (typeof window !== 'undefined' && !loading && pasoActual > 0 && pasoActual < 12) {
      try {
        const dataGuardar = {
          pasoActual,
          respuestasEscala,
          rankingDones,
          donSeleccionadoId,
          diligenciasJesus,
          updatedAt: Date.now()
        };
        localStorage.setItem(STORAGE_KEY_PROGRESO, JSON.stringify(dataGuardar));
      } catch (e) {}
    }
  }, [pasoActual, respuestasEscala, rankingDones, donSeleccionadoId, diligenciasJesus, loading]);

  const handleReiniciarProgreso = () => {
    if (confirm('¿Deseas reiniciar la evaluación y borrar tus respuestas guardadas para comenzar desde cero?')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY_PROGRESO);
      }
      setRespuestasEscala({});
      setRankingDones({ 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4, 7: 4 });
      setDonSeleccionadoId(null);
      setDiligenciasJesus(['', '', '', '', '']);
      setPasoActual(0);
      setAvisoRestaurado(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleEscalaChange = (preguntaId: string, valor: number) => {
    setRespuestasEscala(prev => ({ ...prev, [preguntaId]: valor }));
  };

  const handleRankingDonChange = (numDon: number, valor: number) => {
    setRankingDones(prev => ({ ...prev, [numDon]: valor }));
  };

  const handleDiligenciaChange = (index: number, texto: string) => {
    setDiligenciasJesus(prev => {
      const copy = [...prev];
      copy[index] = texto;
      return copy;
    });
  };

  // Validar antes de avanzar al siguiente paso
  const validarPaso = (paso: number): boolean => {
    if (paso === 0) return true;

    const seccionIndex = paso - 1;
    const seccion = secciones[seccionIndex];
    if (!seccion) return true;

    if (seccion.esDones) {
      // Validar que se haya seleccionado o punteado los dones
      const valores = Object.values(rankingDones);
      if (valores.some(v => !v || v < 1 || v > 7)) {
        alert('Por favor asigna un puntaje del 1 al 7 a cada uno de los 7 párrafos de dones.');
        return false;
      }
      return true;
    }

    if (seccion.esDiligenciaTexto) {
      const vacias = diligenciasJesus.filter(d => d.trim().length > 0).length;
      if (vacias < 2) {
        alert('Por favor escribe al menos 2 o 3 cosas que Jesús consideraría de mayor diligencia.');
        return false;
      }
    }

    if (seccion.preguntas) {
      for (const p of seccion.preguntas) {
        if (!respuestasEscala[p.id]) {
          alert(`Por favor responde la pregunta: "${p.pregunta}"`);
          return false;
        }
      }
    }

    return true;
  };

  const irSiguientePaso = () => {
    if (validarPaso(pasoActual)) {
      setPasoActual(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const irPasoAnterior = () => {
    setPasoActual(prev => Math.max(0, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalizar = async () => {
    if (!validarPaso(pasoActual)) return;

    setSubmitting(true);
    try {
      // Calcular localmente de inmediato para no hacer esperar al creyente
      const resultadoCalculado = calcularResultadoBiblosTest(
        respuestasEscala,
        rankingDones,
        donSeleccionadoId,
        diligenciasJesus,
        secciones
      );

      setResultadoFinal(resultadoCalculado);
      setPasoActual(12); // Pantalla de resultados
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Limpiar progreso de borrador y guardar ultimo resultado local
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(STORAGE_KEY_PROGRESO);
          localStorage.setItem(STORAGE_KEY_RESULTADO, JSON.stringify(resultadoCalculado));
        } catch (e) {}
      }

      // Persistir en servidor
      await fetch('/api/evaluaciones/romanos-12', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respuestasEscala,
          rankingDones,
          donSeleccionadoId,
          diligenciasJesus
        })
      });
    } catch (err) {
      console.error('Error al procesar evaluación:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDescargarDirecta = () => {
    if (!resultadoFinal) return;

    const fechaHoy = new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const nombreUsuario = authData?.user?.persona?.nombre 
      ? `${authData.user.persona.nombre} ${authData.user.persona.apellido || ''}`.trim()
      : (authData?.user?.email || 'Creyente');

    const htmlDoc = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BiblosTest: Romanos 12 - Resumen Oficial</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 20px; line-height: 1.5; }
    .container { max-width: 720px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .header { text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }
    .badge { display: inline-block; background: #e0f2fe; color: #0284c7; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 800; text-transform: uppercase; }
    h1 { margin: 8px 0 4px 0; font-size: 24px; color: #0f172a; }
    .meta { font-size: 13px; color: #64748b; }
    .score-card { background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; border: 1px solid #e2e8f0; }
    .score-num { font-size: 48px; font-weight: 900; color: #0f172a; }
    .don-card { border-left: 6px solid ${resultadoFinal.donPrincipal.color || '#8b5cf6'}; background: #faf5ff; padding: 20px; border-radius: 8px; margin-bottom: 24px; }
    .prio-item { border-left: 4px solid #ef4444; background: #fff1f2; padding: 12px; border-radius: 6px; margin-bottom: 10px; }
    .progress-bar-bg { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-top: 4px; }
    .progress-bar-fill { height: 100%; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">📖 Reporte Oficial BiblosTest: Romanos 12</span>
      <h1>Evaluación Espiritual y Dones</h1>
      <div class="meta">Creyente: <strong>${nombreUsuario}</strong> • Fecha: ${fechaHoy}</div>
    </div>

    <div class="score-card">
      <div style="font-size: 32px; margin-bottom: 4px;">${resultadoFinal.categoriaEspiritual.insignia}</div>
      <div style="font-size: 13px; font-weight: 800; color: ${resultadoFinal.categoriaEspiritual.color}; text-transform: uppercase;">
        ${resultadoFinal.categoriaEspiritual.titulo}
      </div>
      <div class="score-num">${resultadoFinal.promedioGeneral} <span style="font-size: 18px; color: #64748b;">/ 10</span> (${resultadoFinal.porcentajeGeneral}%)</div>
      <p style="margin: 8px 0 0 0; font-size: 14px; color: #475569;">${resultadoFinal.categoriaEspiritual.descripcion}</p>
    </div>

    <div class="don-card">
      <div style="font-size: 12px; font-weight: 800; color: ${resultadoFinal.donPrincipal.color || '#8b5cf6'}; text-transform: uppercase;">
        Tu Principal Don Espiritual (Romanos 12:6-8)
      </div>
      <h2 style="margin: 4px 0 10px 0; font-size: 22px; color: #0f172a;">${resultadoFinal.donPrincipal.icono} ${resultadoFinal.donPrincipal.nombre}</h2>
      <p style="margin: 0 0 14px 0; font-size: 14px; color: #334155; font-style: italic;">"${resultadoFinal.donPrincipal.parrafo}"</p>
      
      <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 8px; border: 1px solid #e2e8f0;">
        <strong style="color: #166534; font-size: 13px;">🏛️ Ministerios Recomendados en la Iglesia:</strong>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #15803d;">${resultadoFinal.donPrincipal.ministeriosRecomendados}</p>
      </div>

      <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 8px; border: 1px solid #e2e8f0;">
        <strong style="color: #1e40af; font-size: 13px;">📖 Estudio Bíblico Recomendado:</strong>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #1d4ed8;">${resultadoFinal.donPrincipal.estudioBiblicoRecomendado}</p>
      </div>

      <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <strong style="color: #92400e; font-size: 13px;">💡 Consejo de Mayordomía:</strong>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #b45309;">${resultadoFinal.donPrincipal.consejosPracticos}</p>
      </div>
    </div>

    <h3 style="color: #0f172a; margin: 24px 0 12px 0;">🎯 Cosas que Debes Priorizar para Crecer</h3>
    ${resultadoFinal.prioridades.map((prio, idx) => `
      <div class="prio-item">
        <div style="font-size: 11px; font-weight: 800; color: #be123c; text-transform: uppercase;">Prioridad ${idx + 1} • ${prio.versiculo} (Puntaje: ${prio.puntaje}/10)</div>
        <div style="font-weight: 700; color: #881337; margin: 4px 0; font-size: 13px;">${prio.pregunta}</div>
        <div style="font-size: 12px; color: #4c0519; margin-bottom: 4px;">📖 <strong>Principio Bíblico:</strong> ${prio.motivoBiblico}</div>
        <div style="font-size: 12px; color: #0f172a; background: white; padding: 6px; border-radius: 4px;">🚀 <strong>Paso Práctico:</strong> ${prio.planAccion}</div>
      </div>
    `).join('')}

    ${resultadoFinal.diligenciasJesus && resultadoFinal.diligenciasJesus.length > 0 ? `
      <h3 style="color: #0f172a; margin: 24px 0 12px 0;">🔥 Tus 5 Diligencias de Jesús (Romanos 12:11)</h3>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
        ${resultadoFinal.diligenciasJesus.map((d, i) => `
          <div style="margin-bottom: 6px; font-size: 13px; color: #334155;"><strong>${i + 1}.</strong> ${d}</div>
        `).join('')}
      </div>
    ` : ''}

    <h3 style="color: #0f172a; margin: 24px 0 12px 0;">📊 Desglose por Áreas Evaluadas</h3>
    ${resultadoFinal.desgloseSecciones.map((sec) => `
      <div style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700;">
          <span>${sec.titulo}</span>
          <span>${sec.promedio} / 10</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${sec.porcentaje}%; background: ${sec.promedio >= 7.5 ? '#16a34a' : sec.promedio >= 5 ? '#f59e0b' : '#ef4444'};"></div>
        </div>
      </div>
    `).join('')}

    <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 14px;">
      Documento generado por IgleConexión • BiblosTest: Romanos 12
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BiblosTest_Romanos12_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#64748b', fontSize: '1.1rem' }}>
        ⏳ Cargando BiblosTest: Romanos 12...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)', padding: '1.5rem 1rem 4rem' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>

        {/* Encabezado Superior */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <Link href="/hub" style={{ textDecoration: 'none' }}>
            <button
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'white',
                border: '1px solid #cbd5e1',
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                color: '#334155',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              ← Volver al Hub
            </button>
          </Link>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#f5f3ff',
                border: '1px solid #ddd6fe',
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                color: '#6d28d9',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(109, 40, 217, 0.08)'
              }}
              title="Compartir evaluación con enlace directo a nuestra iglesia"
            >
              <span>📲</span> Compartir
            </button>

            {resultadoFinal && pasoActual < 12 && (
              <button
                type="button"
                onClick={() => setPasoActual(12)}
                style={{
                  background: '#e0f2fe',
                  border: '1px solid #7dd3fc',
                  padding: '0.5rem 1rem',
                  borderRadius: '10px',
                  color: '#0284c7',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                🏆 Ver Mi Último Resultado
              </button>
            )}
          </div>
        </div>

        {/* Banner Principal del Test */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: '20px',
            padding: '2rem',
            color: 'white',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
            marginBottom: '1.5rem',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span style={{ background: `${iglesiaColor}33`, color: '#38bdf8', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              📖 Evaluación Espiritual • Romanos 12
            </span>
          </div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
            BiblosTest: Romanos 12
          </h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Evalúa tu vida cristiana y consagración a la luz del capítulo 12 de Romanos, descubre tu principal don espiritual según la gracia de Dios y recibe recomendaciones pastorales para servir con excelencia en la iglesia.
          </p>

          {/* Barra de Progreso */}
          {pasoActual > 0 && pasoActual <= 11 && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                <span>Paso {pasoActual} de {secciones.length}: {secciones[pasoActual - 1]?.versiculoRef}</span>
                <span>{Math.round((pasoActual / (secciones.length || 11)) * 100)}% Completado</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.15)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(pasoActual / 11) * 100}%`,
                    background: `linear-gradient(90deg, #38bdf8, ${iglesiaColor})`,
                    borderRadius: '999px',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* PASO 0: INTRODUCCIÓN Y GUÍA */}
        {/* ======================================================== */}
        {pasoActual === 0 && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ color: '#0f172a', fontSize: '1.35rem', fontWeight: 800, marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🧭</span> ¿Cómo funciona esta evaluación?
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: '#475569', fontSize: '0.95rem', lineHeight: '1.6' }}>
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <div style={{ background: '#e0f2fe', color: '#0284c7', width: '2rem', height: '2rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                  1
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>Escala del 1 al 10:</strong> La mayoría de preguntas se evalúan en una escala donde <strong style={{ color: '#ef4444' }}>1</strong> representa la menor afinidad o un área descuidada, y <strong style={{ color: '#16a34a' }}>10</strong> representa máxima convicción, consagración y compromiso. Responde con total honestidad.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <div style={{ background: '#fef3c7', color: '#d97706', width: '2rem', height: '2rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                  2
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>Dones Espirituales (Versículos 6-8):</strong> Evaluarás los 7 dones detallados en Romanos 12 asignando valores del 1 al 7 a cada descripción para identificar cuál es el don que Dios ha impartido en ti.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <div style={{ background: '#dcfce7', color: '#16a34a', width: '2rem', height: '2rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                  3
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>Diligencia y Servicio (Versículo 11):</strong> Podrás escribir las 5 cosas que Jesús requeriría con mayor diligencia y evaluar tu propio fervor espiritual.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <div style={{ background: '#f3e8ff', color: '#7c3aed', width: '2rem', height: '2rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                  4
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>Resultados y Recomendaciones Personalizadas:</strong> Al finalizar obtendrás tu promedio general, tu principal don espiritual con los ministerios donde puedes servir en la iglesia, y las prioridades bíblicas que debes trabajar según tus respuestas.
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setPasoActual(1)}
                style={{
                  background: iglesiaColor,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.85rem 2rem',
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: `0 4px 12px ${iglesiaColor}40`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>Comenzar Evaluación</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PASOS 1 A 11: SECCIONES BÍBLICAS */}
        {/* ======================================================== */}
        {pasoActual >= 1 && pasoActual <= 11 && (() => {
          const seccion = secciones[pasoActual - 1];
          if (!seccion) return null;

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Banner de Progreso Guardado Automáticamente */}
              <div 
                style={{ 
                  background: '#fef3c7', 
                  border: '1px solid #fde68a', 
                  borderRadius: '12px', 
                  padding: '0.65rem 1rem', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  flexWrap: 'wrap', 
                  gap: '0.5rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#92400e', fontSize: '0.86rem', fontWeight: 600 }}>
                  <span>💾</span>
                  <span>Progreso guardado automáticamente. Si sales de la app, continuarás en el <strong>Paso {pasoActual} de {secciones.length}</strong>.</span>
                </div>
                <button
                  type="button"
                  onClick={handleReiniciarProgreso}
                  style={{ background: 'none', border: 'none', color: '#b45309', fontSize: '0.78rem', textDecoration: 'underline', cursor: 'pointer', fontWeight: 700 }}
                >
                  Reiniciar desde cero
                </button>
              </div>

              {/* Tarjeta de Versículo Base */}
              <div
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem 1.75rem',
                  borderLeft: `5px solid ${iglesiaColor}`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: iglesiaColor, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  {seccion.versiculoRef}
                </div>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  {seccion.titulo}
                </h2>
                <blockquote
                  style={{
                    margin: 0,
                    fontStyle: 'italic',
                    color: '#334155',
                    fontSize: '1.02rem',
                    lineHeight: '1.6',
                    background: '#f8fafc',
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #f1f5f9'
                  }}
                >
                  "{seccion.textoBiblico}"
                </blockquote>
              </div>

              {/* Si es la sección de Dones Espirituales (Versículos 6-8) */}
              {seccion.esDones && (
                <div style={{ background: 'white', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ marginBottom: '1.5rem', background: '#f0fdf4', padding: '1rem', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                    <strong style={{ color: '#166534', fontSize: '0.95rem', display: 'block', marginBottom: '0.3rem' }}>
                      📋 Instrucción:
                    </strong>
                    <p style={{ margin: 0, color: '#15803d', fontSize: '0.9rem', lineHeight: '1.5' }}>
                      Lee detenidamente cada párrafo a continuación y ponle un valor del <strong>1 al 7</strong> considerando qué tanto te identificas con el párrafo (pon <strong>7</strong> al párrafo con el que más te identifiques y <strong>1</strong> con el que menos).
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {Object.values(DONES_ROMANOS_12).map((don: DonEspiritual) => {
                      const valorActual = rankingDones[don.numero] || 4;
                      return (
                        <div
                          key={don.numero}
                          style={{
                            border: `1px solid ${rankingDones[don.numero] === 7 ? don.color : '#e2e8f0'}`,
                            borderRadius: '12px',
                            padding: '1.25rem',
                            background: rankingDones[don.numero] === 7 ? `${don.color}08` : '#f8fafc',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span>{don.icono}</span> Párrafo {don.numero} • {don.nombre}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Identificación:</span>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                                  <button
                                    key={num}
                                    type="button"
                                    onClick={() => handleRankingDonChange(don.numero, num)}
                                    style={{
                                      width: '28px',
                                      height: '28px',
                                      borderRadius: '6px',
                                      border: valorActual === num ? `2px solid ${don.color}` : '1px solid #cbd5e1',
                                      background: valorActual === num ? don.color : 'white',
                                      color: valorActual === num ? 'white' : '#334155',
                                      fontWeight: 800,
                                      fontSize: '0.8rem',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s'
                                    }}
                                  >
                                    {num}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <p style={{ margin: 0, color: '#475569', fontSize: '0.92rem', lineHeight: '1.5' }}>
                            {don.parrafo}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Elección directa de don principal */}
                  <div style={{ marginTop: '2rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'block', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                      ✨ Encierra o selecciona el número de párrafo con el que MÁS te identificaste:
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                        const don = DONES_ROMANOS_12[num];
                        const seleccionado = donSeleccionadoId === num;
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setDonSeleccionadoId(num)}
                            style={{
                              flex: '1 1 80px',
                              padding: '0.6rem 0.5rem',
                              borderRadius: '10px',
                              border: seleccionado ? `2px solid ${don.color}` : '1px solid #cbd5e1',
                              background: seleccionado ? `${don.color}15` : 'white',
                              color: seleccionado ? don.color : '#334155',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.2rem'
                            }}
                          >
                            <span>{don.icono} Párrafo {num}</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{don.nombre.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Si es la sección de Diligencia (Versículo 11) con los 5 campos de texto */}
              {seccion.esDiligenciaTexto && (
                <div style={{ background: 'white', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                      ✍️ Si Jesús fuera a llenar este formulario, ¿Cuáles 5 cosas crees que él escribiría que requieren la mayor diligencia?
                    </label>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                      Escribe de 1 a 5 aspectos prácticos de la vida cristiana y el servicio que consideres que demandan máxima diligencia:
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ width: '1.5rem', fontWeight: 700, color: '#94a3b8', fontSize: '0.9rem' }}>{i + 1}.</span>
                        <input
                          type="text"
                          value={diligenciasJesus[i] || ''}
                          onChange={(e) => handleDiligenciaChange(i, e.target.value)}
                          placeholder={`Diligencia ${i + 1} (ej. ${i === 0 ? 'Oración íntima diaria y ayuno' : i === 1 ? 'Amar y perdonar al prójimo' : i === 2 ? 'Predicar el evangelio a los perdidos' : i === 3 ? 'Cuidar de los pobres y afligidos' : 'Estudiar y obedecer las Escrituras'})`}
                          style={{
                            flex: 1,
                            padding: '0.65rem 0.85rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.92rem',
                            outline: 'none',
                            color: '#1e293b'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preguntas de Escala del 1 al 10 */}
              {seccion.preguntas && seccion.preguntas.map((p: any) => {
                const valorSeleccionado = respuestasEscala[p.id] || null;
                return (
                  <div
                    key={p.id}
                    style={{
                      background: 'white',
                      borderRadius: '16px',
                      padding: '1.5rem 1.75rem',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                      border: valorSeleccionado ? `1px solid ${iglesiaColor}40` : '1px solid #e2e8f0'
                    }}
                  >
                    <p style={{ margin: '0 0 1rem 0', fontSize: '1.02rem', fontWeight: 700, color: '#1e293b', lineHeight: '1.5' }}>
                      {p.pregunta}
                    </p>

                    {/* Escala de botones del 1 al 10 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '6px' }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                          const activo = valorSeleccionado === num;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => handleEscalaChange(p.id, num)}
                              style={{
                                padding: '0.6rem 0',
                                borderRadius: '8px',
                                border: activo ? `2px solid ${iglesiaColor}` : '1px solid #cbd5e1',
                                background: activo ? iglesiaColor : 'white',
                                color: activo ? 'white' : '#334155',
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                boxShadow: activo ? `0 2px 6px ${iglesiaColor}40` : 'none'
                              }}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>

                      {/* Etiquetas de los extremos */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem', padding: '0 2px' }}>
                        <span>{p.minLabel || '1 = Mínimo'}</span>
                        <span>{p.maxLabel || '10 = Máximo'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Botones de Navegación */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={irPasoAnterior}
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '0.75rem 1.5rem',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: 'pointer'
                  }}
                >
                  ← Anterior
                </button>

                {pasoActual < 11 ? (
                  <button
                    type="button"
                    onClick={irSiguientePaso}
                    style={{
                      background: iglesiaColor,
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.75rem 2rem',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      boxShadow: `0 4px 10px ${iglesiaColor}33`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <span>Siguiente</span>
                    <span>→</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinalizar}
                    disabled={submitting}
                    style={{
                      background: '#16a34a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.75rem 2rem',
                      fontWeight: 800,
                      fontSize: '1rem',
                      cursor: submitting ? 'wait' : 'pointer',
                      boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {submitting ? 'Procesando Resultados...' : '✅ Finalizar y Ver Resultados'}
                  </button>
                )}
              </div>

            </div>
          );
        })()}

        {/* ======================================================== */}
        {/* PANTALLA DE RESULTADOS FINALES */}
        {/* ======================================================== */}
        {pasoActual === 12 && resultadoFinal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }} id="seccion-resultados-print">

            {/* Tarjeta de Resumen General */}
            <div
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: '2rem',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.06)',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                {resultadoFinal.categoriaEspiritual.insignia}
              </div>
              <span
                style={{
                  background: `${resultadoFinal.categoriaEspiritual.color}15`,
                  color: resultadoFinal.categoriaEspiritual.color,
                  padding: '4px 14px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {resultadoFinal.categoriaEspiritual.titulo}
              </span>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '0.3rem', margin: '1rem 0 0.5rem 0' }}>
                <span style={{ fontSize: '3.5rem', fontWeight: 900, color: '#0f172a' }}>
                  {resultadoFinal.promedioGeneral}
                </span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#64748b' }}>/ 10</span>
                <span style={{ marginLeft: '0.5rem', fontSize: '1.1rem', fontWeight: 700, color: resultadoFinal.categoriaEspiritual.color }}>
                  ({resultadoFinal.porcentajeGeneral}%)
                </span>
              </div>

              <p style={{ margin: '0 auto', maxWidth: '580px', color: '#475569', fontSize: '0.98rem', lineHeight: '1.6' }}>
                {resultadoFinal.categoriaEspiritual.descripcion}
              </p>
            </div>

            {/* Tarjeta del Don Principal */}
            <div
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: '2rem',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.06)',
                borderTop: `6px solid ${resultadoFinal.donPrincipal.color}`,
                border: '1px solid #e2e8f0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '2rem' }}>{resultadoFinal.donPrincipal.icono}</span>
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: resultadoFinal.donPrincipal.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Tu Principal Don Espiritual (Romanos 12:6-8)
                  </span>
                  <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>
                    {resultadoFinal.donPrincipal.nombre}
                  </h2>
                </div>
              </div>

              <p style={{ color: '#334155', fontSize: '0.96rem', lineHeight: '1.6', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #f1f5f9', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                "{resultadoFinal.donPrincipal.parrafo}"
              </p>

              {/* Recomendaciones Pastorales para el Don */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: '#f0fdf4', padding: '1.1rem', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                  <strong style={{ color: '#166534', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                    🏛️ Ministerios Recomendados para Servir en la Iglesia:
                  </strong>
                  <p style={{ margin: 0, color: '#15803d', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    {resultadoFinal.donPrincipal.ministeriosRecomendados}
                  </p>
                </div>

                <div style={{ background: '#eff6ff', padding: '1.1rem', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                  <strong style={{ color: '#1e40af', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                    📖 Estudio Bíblico y Formación Recomendada:
                  </strong>
                  <p style={{ margin: 0, color: '#1d4ed8', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    {resultadoFinal.donPrincipal.estudioBiblicoRecomendado}
                  </p>
                </div>

                <div style={{ background: '#fef3c7', padding: '1.1rem', borderRadius: '12px', border: '1px solid #fde68a' }}>
                  <strong style={{ color: '#92400e', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                    💡 Consejo Práctico de Mayordomía:
                  </strong>
                  <p style={{ margin: 0, color: '#b45309', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    {resultadoFinal.donPrincipal.consejosPracticos}
                  </p>
                </div>
              </div>

              {resultadoFinal.donSecundario && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '1.3rem' }}>{resultadoFinal.donSecundario.icono}</span>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Don Secundario de Apoyo:</span>
                    <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.95rem' }}>{resultadoFinal.donSecundario.nombre}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Cosas que Debe Priorizar según sus Respuestas */}
            <div
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: '2rem',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.06)',
                border: '1px solid #e2e8f0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🎯</span>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
                  Cosas que Debes Priorizar para Crecer
                </h3>
              </div>
              <p style={{ margin: '0 0 1.25rem 0', color: '#64748b', fontSize: '0.88rem' }}>
                Con base en tus respuestas con menor puntaje, estas son las áreas clave de Romanos 12 donde el Señor te invita a enfocarte intencionalmente:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {resultadoFinal.prioridades.map((prio, idx) => (
                  <div
                    key={idx}
                    style={{
                      borderLeft: '4px solid #ef4444',
                      background: '#fff1f2',
                      borderRadius: '0 12px 12px 0',
                      padding: '1.1rem 1.25rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#be123c', textTransform: 'uppercase' }}>
                        Prioridad {idx + 1} • {prio.versiculo}
                      </span>
                      <span style={{ background: '#fecdd3', color: '#9f1239', padding: '2px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>
                        Puntaje: {prio.puntaje}/10
                      </span>
                    </div>

                    <strong style={{ display: 'block', color: '#881337', fontSize: '0.95rem', marginBottom: '0.4rem' }}>
                      {prio.pregunta}
                    </strong>

                    <p style={{ margin: '0 0 0.5rem 0', color: '#4c0519', fontSize: '0.88rem', lineHeight: '1.45' }}>
                      📖 <strong>Principio Bíblico:</strong> {prio.motivoBiblico}
                    </p>

                    <div style={{ background: 'white', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.85rem', color: '#0f172a', fontWeight: 600 }}>
                      🚀 <strong>Paso Práctico:</strong> {prio.planAccion}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tus 5 Diligencias de Jesús */}
            {resultadoFinal.diligenciasJesus && resultadoFinal.diligenciasJesus.length > 0 && (
              <div
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '2rem',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.06)',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🔥</span>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
                    Tus 5 Diligencias para Servir al Señor (v. 11)
                  </h3>
                </div>
                <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.88rem' }}>
                  Estas son las prioridades que escribiste que Jesús demandaría con mayor diligencia:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {resultadoFinal.diligenciasJesus.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        background: '#f8fafc',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <span style={{ background: '#e0f2fe', color: '#0369a1', width: '1.8rem', height: '1.8rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                        {idx + 1}
                      </span>
                      <span style={{ color: '#1e293b', fontWeight: 600, fontSize: '0.92rem' }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Desglose por Áreas de Romanos 12 */}
            <div
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: '2rem',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.06)',
                border: '1px solid #e2e8f0'
              }}
            >
              <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📊</span> Desglose por Áreas de Romanos 12
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {resultadoFinal.desgloseSecciones.map((sec) => (
                  <div key={sec.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', fontSize: '0.88rem' }}>
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>
                        {sec.titulo}
                      </span>
                      <span style={{ fontWeight: 800, color: sec.promedio >= 7.5 ? '#16a34a' : sec.promedio >= 5 ? '#d97706' : '#dc2626' }}>
                        {sec.promedio} / 10
                      </span>
                    </div>
                    <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${sec.porcentaje}%`,
                          background: sec.promedio >= 7.5 ? '#16a34a' : sec.promedio >= 5 ? '#f59e0b' : '#ef4444',
                          borderRadius: '999px',
                          transition: 'width 0.4s'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones de Acción Final */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              {/* Opción 1: Descarga Directa del Resumen */}
              <button
                type="button"
                onClick={handleDescargarDirecta}
                style={{
                  background: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.85rem 1.6rem',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(5, 150, 105, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                title="Descarga directamente un archivo con todo tu resultado sin pasar por opciones de impresora"
              >
                <span>📥</span> Descargar Resumen Directo
              </button>

              {/* Opción 2: Imprimir en Papel */}
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  background: 'white',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '0.85rem 1.5rem',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                title="Abre la ventana de la impresora para imprimir en papel"
              >
                <span>🖨️</span> Imprimir en Papel
              </button>

              {/* Opción 3: Compartir con Hermanos / Amigos */}
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                style={{
                  background: '#6d28d9',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.85rem 1.6rem',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(109, 40, 217, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                title="Comparte la evaluación vinculada directamente al perfil de tu iglesia"
              >
                <span>📲</span> Compartir con Hermanos
              </button>

              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem(STORAGE_KEY_PROGRESO);
                  }
                  setRespuestasEscala({});
                  setRankingDones({ 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4, 7: 4 });
                  setDonSeleccionadoId(null);
                  setDiligenciasJesus(['', '', '', '', '']);
                  setPasoActual(0);
                  setAvisoRestaurado(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '0.85rem 1.75rem',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer'
                }}
              >
                🔄 Repetir Evaluación
              </button>

              <button
                type="button"
                onClick={() => router.push('/hub')}
                style={{
                  background: iglesiaColor,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.85rem 2rem',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: `0 4px 12px ${iglesiaColor}40`
                }}
              >
                Volver al Hub Principal
              </button>
            </div>

          </div>
        )}

        {/* MODAL PARA COMPARTIR EVALUACIÓN DE LA IGLESIA */}
        {showShareModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
            onClick={() => setShowShareModal(false)}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '16px',
                maxWidth: '520px',
                width: '100%',
                padding: '1.75rem',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>📲</span>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 800 }}>
                    Compartir BiblosTest
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#94a3b8', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Comparte este enlace para que cualquier hermano o visitante ingrese <strong>directamente al perfil de {churchNombre}</strong> y complete su evaluación sin tener que registrarse previamente ni ingresar códigos.
              </p>

              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Enlace directo de tu iglesia:</span>
                <input
                  type="text"
                  readOnly
                  value={getShareUrl()}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', color: '#0f172a', background: 'white', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(getShareUrl());
                    setCopiedShareLink(true);
                    setTimeout(() => setCopiedShareLink(false), 2500);
                  }}
                  style={{
                    flex: '1 1 140px',
                    padding: '0.75rem 1rem',
                    background: copiedShareLink ? '#16a34a' : iglesiaColor,
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    boxShadow: `0 2px 6px ${iglesiaColor}33`
                  }}
                >
                  <span>{copiedShareLink ? '✅' : '📋'}</span>
                  <span>{copiedShareLink ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
                </button>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`¡Hola! Te invito a realizar la evaluación espiritual y descubrir tus dones según Romanos 12 en nuestra iglesia ${churchNombre}. Puedes completarla aquí: ${getShareUrl()}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: '1 1 140px',
                    padding: '0.75rem 1rem',
                    background: '#25D366',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 2px 6px rgba(37, 211, 102, 0.3)'
                  }}
                >
                  <span>💬</span> WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
