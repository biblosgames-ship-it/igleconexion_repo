"use client";

import { useState, useEffect } from "react";

interface AsistenciaModuloProps {
  contextId: string;
  contextType: "sociedad" | "grupo_trabajo";
  miembros: { id: string; nombre: string }[];
}

export default function AsistenciaModulo({ contextId, contextType, miembros }: AsistenciaModuloProps) {
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0]);
  const [titulo, setTitulo] = useState("Reunión General");
  const [presentes, setPresentes] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadHistorial();
  }, [contextId, contextType]);

  const loadHistorial = async () => {
    setLoading(true);
    try {
      const url = `/api/asistencia?${contextType}_id=${contextId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.error) {
        setHistorial(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePresente = (personaId: string) => {
    setPresentes(prev => ({
      ...prev,
      [personaId]: !prev[personaId]
    }));
  };

  const markAll = (present: boolean) => {
    const newObj: Record<string, boolean> = {};
    miembros.forEach(m => {
      newObj[m.id] = present;
    });
    setPresentes(newObj);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const presentesIds = Object.keys(presentes).filter(id => presentes[id]);
    if (presentesIds.length === 0 && !confirm("No has marcado a nadie como presente. ¿Guardar de todos modos?")) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/asistencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addAttendance",
          data: {
            [`${contextType}_id`]: contextId,
            fecha,
            titulo_reunion: titulo,
            presentes_ids: presentesIds
          }
        })
      });
      const data = await res.json();
      if (!data.error) {
        setPresentes({});
        loadHistorial();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este registro de asistencia?")) return;
    try {
      const res = await fetch("/api/asistencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteAttendance",
          data: { id }
        })
      });
      const data = await res.json();
      if (!data.error) {
        loadHistorial();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
        <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", color: "#0f172a" }}>📝 Tomar Asistencia</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", flex: 1 }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Fecha</label>
              <input 
                type="date" 
                value={fecha} 
                onChange={(e) => setFecha(e.target.value)} 
                required 
                style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", flex: 2 }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Título / Motivo de la Reunión</label>
              <input 
                type="text" 
                value={titulo} 
                onChange={(e) => setTitulo(e.target.value)} 
                required 
                style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              />
            </div>
          </div>
          
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ background: "#f8fafc", padding: "0.75rem 1rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: "bold", fontSize: "0.9rem", color: "#334155" }}>Miembros ({miembros.length})</span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="button" onClick={() => markAll(true)} style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", background: "#dcfce7", color: "#16a34a", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Marcar Todos</button>
                <button type="button" onClick={() => markAll(false)} style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Desmarcar Todos</button>
              </div>
            </div>
            <div style={{ maxHeight: "300px", overflowY: "auto", padding: "0.5rem" }}>
              {miembros.length === 0 ? (
                <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.85rem", margin: "1rem 0" }}>No hay miembros activos para mostrar.</p>
              ) : (
                miembros.map(m => (
                  <label key={m.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem", borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}>
                    <input 
                      type="checkbox" 
                      checked={!!presentes[m.id]} 
                      onChange={() => handleTogglePresente(m.id)} 
                      style={{ width: "1.2rem", height: "1.2rem", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "0.9rem", color: "#0f172a" }}>{m.nombre}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting || miembros.length === 0} 
            style={{ padding: "0.6rem", background: "#2563eb", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
          >
            {submitting ? "Guardando..." : "💾 Guardar Asistencia"}
          </button>
        </form>
      </div>

      <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
        <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", color: "#0f172a" }}>📋 Historial de Reuniones</h2>
        {loading ? (
          <p style={{ color: "#64748b", textAlign: "center" }}>Cargando historial...</p>
        ) : historial.length === 0 ? (
          <p style={{ color: "#64748b", textAlign: "center", fontStyle: "italic" }}>No hay reuniones registradas.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {historial.map(h => {
              const presentesIds = JSON.parse(h.presentes_ids || "[]");
              return (
                <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                  <div>
                    <div style={{ fontWeight: "bold", color: "#0f172a", marginBottom: "0.2rem" }}>{h.titulo_reunion}</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Fecha: <span style={{ fontWeight: 600 }}>{new Date(h.fecha).toLocaleDateString()}</span></div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.1rem" }}>Asistentes: <span style={{ fontWeight: 600, color: "#2563eb" }}>{presentesIds.length}</span></div>
                  </div>
                  <button onClick={() => handleDelete(h.id)} style={{ border: "none", background: "#fee2e2", color: "#dc2626", padding: "0.4rem 0.6rem", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.8rem" }}>
                    Eliminar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
