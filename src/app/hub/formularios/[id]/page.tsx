'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function FormularioPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [respuestas, setRespuestas] = useState<any>({});
  const [enviado, setEnviado] = useState(false);
  const [authData, setAuthData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    // Check if logged in
    const authRes = await fetch('/api/auth');
    if (authRes.ok) {
      const auth = await authRes.json();
      if (!auth.user || !auth.user.persona_id) {
        setError('Debes iniciar sesión para llenar este formulario.');
        setLoading(false);
        return;
      }
      setAuthData(auth);
      
      // Load form
      const formRes = await fetch(`/api/formularios/${id}`);
      if (formRes.ok) {
        const data = await formRes.json();
        if (data.estado !== 'PUBLICADO') {
          setError('Este formulario no está activo o ya fue cerrado.');
        } else {
          setForm(data);
        }
      } else {
        setError('No se pudo cargar el formulario. Es posible que no exista.');
      }
    } else {
      setError('Error de autenticación. Inicia sesión en Mi Iglesia primero.');
    }
    setLoading(false);
  };

  const handleChange = (preguntaId: string, valor: any, tipo: string) => {
    if (tipo === 'CASILLAS') {
      const actual = respuestas[preguntaId] || [];
      const index = actual.indexOf(valor);
      if (index === -1) actual.push(valor);
      else actual.splice(index, 1);
      setRespuestas({ ...respuestas, [preguntaId]: actual });
    } else {
      setRespuestas({ ...respuestas, [preguntaId]: valor });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    for (const p of form.preguntas) {
      if (p.obligatoria) {
        const resp = respuestas[p.id];
        if (p.tipo === 'CASILLAS') {
          if (!resp || resp.length === 0) return alert(`La pregunta "${p.pregunta}" es obligatoria.`);
        } else {
          if (!resp || String(resp).trim() === '') return alert(`La pregunta "${p.pregunta}" es obligatoria.`);
        }
      }
    }

    // Format for API
    const formattedResponses = Object.keys(respuestas).map(pregunta_id => {
      const p = form.preguntas.find((x:any) => x.id === pregunta_id);
      let valor = respuestas[pregunta_id];
      if (p.tipo === 'CASILLAS') valor = JSON.stringify(valor);
      return { pregunta_id, valor };
    });

    const res = await fetch(`/api/formularios/${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'enviar_respuesta', payload: { persona_id: authData.user.persona_id, respuestas: formattedResponses }})
    });

    if (res.ok) {
      setEnviado(true);
    } else {
      const err = await res.json();
      if (err.error?.includes('Unique constraint failed')) {
         alert('Ya has llenado este formulario anteriormente.');
      } else {
         alert('Ocurrió un error al enviar el formulario.');
      }
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando formulario...</div>;
  if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>{error}</div>;
  if (enviado) return (
    <div style={{ maxWidth: '600px', margin: '3rem auto', background: 'white', padding: '3rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      <h2 style={{ color: '#16a34a', margin: '0 0 1rem 0' }}>✅ ¡Formulario Enviado!</h2>
      <p style={{ color: '#64748b' }}>Tu respuesta ha sido registrada exitosamente.</p>
      <button onClick={() => router.push('/hub')} style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#334155' }}>Volver al Inicio</button>
    </div>
  );

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        
        {/* Form Header */}
        <div style={{ background: 'white', padding: '2.5rem', borderRadius: '8px', borderTop: '8px solid #8b5cf6', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
          <h1 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '2rem' }}>{form.titulo}</h1>
          <p style={{ margin: 0, color: '#475569', fontSize: '1.05rem', lineHeight: 1.6 }}>{form.descripcion}</p>
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem' }}>
            Registrando como: <strong style={{ color: '#0f172a' }}>{authData.user.email}</strong>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {form.preguntas.map((p: any) => (
            <div key={p.id} style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <label style={{ display: 'block', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem' }}>
                {p.pregunta} {p.obligatoria && <span style={{ color: '#ef4444' }}>*</span>}
              </label>

              {p.tipo === 'TEXTO_CORTO' && (
                <input required={p.obligatoria} value={respuestas[p.id] || ''} onChange={e=>handleChange(p.id, e.target.value, p.tipo)} style={{ width: '100%', padding: '0.75rem', border: 'none', borderBottom: '2px solid #cbd5e1', outline: 'none', transition: 'border-color 0.2s', fontSize: '1rem' }} placeholder="Tu respuesta" onFocus={(e)=>e.target.style.borderColor = '#8b5cf6'} onBlur={(e)=>e.target.style.borderColor = '#cbd5e1'} />
              )}

              {p.tipo === 'PARRAFO' && (
                <textarea required={p.obligatoria} value={respuestas[p.id] || ''} onChange={e=>handleChange(p.id, e.target.value, p.tipo)} style={{ width: '100%', padding: '0.75rem', border: 'none', borderBottom: '2px solid #cbd5e1', outline: 'none', transition: 'border-color 0.2s', fontSize: '1rem', minHeight: '100px', resize: 'vertical' }} placeholder="Tu respuesta" onFocus={(e)=>e.target.style.borderColor = '#8b5cf6'} onBlur={(e)=>e.target.style.borderColor = '#cbd5e1'} />
              )}

              {p.tipo === 'OPCION_MULTIPLE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {JSON.parse(p.opciones || '[]').map((opt:string, i:number) => (
                    <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '1rem', color: '#334155' }}>
                      <input type="radio" name={`pregunta_${p.id}`} value={opt} checked={respuestas[p.id] === opt} onChange={e=>handleChange(p.id, e.target.value, p.tipo)} style={{ width: '1.25rem', height: '1.25rem', accentColor: '#8b5cf6' }} />
                      {opt}
                    </label>
                  ))}
                </div>
              )}

              {p.tipo === 'CASILLAS' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {JSON.parse(p.opciones || '[]').map((opt:string, i:number) => (
                    <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '1rem', color: '#334155' }}>
                      <input type="checkbox" value={opt} checked={(respuestas[p.id] || []).includes(opt)} onChange={e=>handleChange(p.id, e.target.value, p.tipo)} style={{ width: '1.25rem', height: '1.25rem', accentColor: '#8b5cf6' }} />
                      {opt}
                    </label>
                  ))}
                </div>
              )}

            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Nunca compartas contraseñas a través de Formularios.</span>
            <button type="submit" style={{ padding: '0.75rem 2rem', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(139, 92, 246, 0.3)' }}>Enviar</button>
          </div>
        </form>

      </div>
    </div>
  );
}
