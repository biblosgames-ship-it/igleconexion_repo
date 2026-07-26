"use client";
import { useState, useEffect } from "react";
import styles from "@/app/sociedad/sociedad.module.css";

export default function PresupuestoModulo({ entidadId, entidadTipo = 'SOCIEDAD' }: { entidadId: string, entidadTipo?: 'SOCIEDAD' | 'GRUPO_TRABAJO' }) {
  const [presupuestos, setPresupuestos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [anio, setAnio] = useState(new Date().getFullYear().toString());
  const [periodo, setPeriodo] = useState("ANUAL");
  
  const [items, setItems] = useState<{ categoria: string; monto_estimado: string }[]>([
    { categoria: "", monto_estimado: "" }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    loadPresupuestos();
  }, [entidadId, entidadTipo]);

  const loadPresupuestos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/presupuestos?entidadId=${entidadId}&entidadTipo=${entidadTipo}`);
      const data = await res.json();
      if (!data.error) setPresupuestos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { categoria: "", monto_estimado: "" }]);
  };

  const removeItem = (idx: number) => {
    const newItems = [...items];
    newItems.splice(idx, 1);
    setItems(newItems);
  };

  const handleItemChange = (idx: number, field: string, value: string) => {
    const newItems: any = [...items];
    newItems[idx][field] = value;
    setItems(newItems);
  };

  const totalEstimado = items.reduce((acc, cur) => acc + (parseFloat(cur.monto_estimado) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter(i => i.categoria.trim() && parseFloat(i.monto_estimado) > 0);
    if (validItems.length === 0) {
      alert("Debes agregar al menos una categoría con monto válido.");
      return;
    }

    setSubmitting(true);
    try {
      const url = "/api/presupuestos";
      const method = editId ? "PATCH" : "POST";
      const bodyPayload = editId ? {
        id: editId,
        items: validItems
      } : {
        sociedad_id: entidadTipo === 'SOCIEDAD' ? entidadId : null,
        grupo_trabajo_id: entidadTipo === 'GRUPO_TRABAJO' ? entidadId : null,
        anio: parseInt(anio),
        periodo,
        items: validItems
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload)
      });
      if (res.ok) {
        setShowModal(false);
        setEditId(null);
        setItems([{ categoria: "", monto_estimado: "" }]);
        loadPresupuestos();
      } else {
        const error = await res.json();
        alert(error.error || "Error al enviar");
      }
    } catch (error) {
      alert("Error de red");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (p: any) => {
    setEditId(p.id);
    setAnio(p.anio.toString());
    setPeriodo(p.periodo);
    setItems(p.items?.map((i: any) => ({ categoria: i.categoria, monto_estimado: i.monto_estimado.toString() })) || [{ categoria: "", monto_estimado: "" }]);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este presupuesto?")) return;
    try {
      await fetch(`/api/presupuestos?id=${id}`, { method: "DELETE" });
      loadPresupuestos();
    } catch (e) {
      alert("Error al eliminar");
    }
  };

  if (loading) return <p>Cargando presupuestos...</p>;

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Presupuestos</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Gestiona los fondos requeridos por tu ministerio.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
          + Crear Presupuesto
        </button>
      </div>

      {presupuestos.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <p style={{ margin: 0, color: '#64748b' }}>No hay presupuestos registrados aún.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {presupuestos.map(p => (
            <div key={p.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.2rem 0', color: '#0f172a', fontSize: '1.1rem' }}>
                    {p.periodo} {p.anio}
                  </h3>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '4px', 
                    background: p.estado === 'APROBADO' ? '#dcfce7' : p.estado === 'ENVIADO' ? '#e0f2fe' : '#fef9c3',
                    color: p.estado === 'APROBADO' ? '#166534' : p.estado === 'ENVIADO' ? '#0369a1' : '#854d0e',
                    fontWeight: 600
                  }}>
                    {p.estado}
                  </span>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', gap: '1.5rem' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Solicitado</p>
                    <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                      ${p.monto_asignado.toFixed(2)}
                    </p>
                  </div>
                  {p.monto_aprobado !== null && (
                    <div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Aprobado</p>
                      <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#16a34a' }}>
                        ${p.monto_aprobado.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Desglose de Gastos:</p>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {p.items?.map((item: any) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px', fontSize: '0.9rem' }}>
                      <span style={{ color: '#334155' }}>{item.categoria}</span>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>${item.monto_estimado.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {p.comentarios_finanzas && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#fffbeb', borderLeft: '4px solid #f59e0b', borderRadius: '4px' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e' }}><strong>Comentario de Finanzas:</strong> {p.comentarios_finanzas}</p>
                </div>
              )}

              {(p.estado === 'ENVIADO' || p.estado === 'EN_REVISION') && (
                <div style={{ marginTop: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  {p.estado === 'EN_REVISION' && (
                    <button onClick={() => openEditModal(p)} style={{ background: '#0284c7', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                      ✏️ Ajustar y Reenviar
                    </button>
                  )}
                  {p.estado === 'ENVIADO' && (
                    <button onClick={() => handleDelete(p.id)} style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                      Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem', color: '#0f172a' }}>Crear Nuevo Presupuesto</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Año</label>
                  <input type="number" value={anio} onChange={e=>setAnio(e.target.value)} required disabled={!!editId} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', background: editId ? '#f1f5f9' : 'white' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Período</label>
                  <select value={periodo} onChange={e=>setPeriodo(e.target.value)} disabled={!!editId} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', background: editId ? '#f1f5f9' : 'white' }}>
                    <option value="ANUAL">Anual</option>
                    <option value="Q1">Trimestre 1 (Ene-Mar)</option>
                    <option value="Q2">Trimestre 2 (Abr-Jun)</option>
                    <option value="Q3">Trimestre 3 (Jul-Sep)</option>
                    <option value="Q4">Trimestre 4 (Oct-Dic)</option>
                    <option value="ENERO">Enero</option>
                    <option value="FEBRERO">Febrero</option>
                    <option value="MARZO">Marzo</option>
                    {/* Añadir más según necesidad */}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Categorías de Gastos</label>
                  <button type="button" onClick={addItem} style={{ background: '#f1f5f9', color: '#0284c7', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>+ Agregar</button>
                </div>
                
                {items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input 
                      type="text" 
                      placeholder="Ej. Materiales de enseñanza" 
                      value={item.categoria} 
                      onChange={e => handleItemChange(idx, 'categoria', e.target.value)}
                      style={{ flex: 2, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      required
                    />
                    <input 
                      type="number" 
                      placeholder="$ Monto" 
                      value={item.monto_estimado} 
                      onChange={e => handleItemChange(idx, 'monto_estimado', e.target.value)}
                      style={{ flex: 1, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      required
                      step="0.01"
                      min="1"
                    />
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} style={{ padding: '0.65rem', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>X</button>
                    )}
                  </div>
                ))}
                <div style={{ textAlign: 'right', marginTop: '0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  Total: ${totalEstimado.toFixed(2)}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => { setShowModal(false); setEditId(null); setItems([{ categoria: "", monto_estimado: "" }]); }} style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: '0.75rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>{submitting ? 'Enviando...' : (editId ? 'Guardar Cambios' : 'Guardar y Enviar')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
