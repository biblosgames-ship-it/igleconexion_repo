"use client";

import { useState, useEffect } from "react";

interface InventarioModuloProps {
  contextId: string;
  contextType: "sociedad" | "grupo_trabajo";
}

export default function InventarioModulo({ contextId, contextType }: InventarioModuloProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [item, setItem] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [estado, setEstado] = useState("BUENO");
  const [notas, setNotas] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadItems();
  }, [contextId, contextType]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const url = `/api/inventario?${contextType}_id=${contextId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.error) {
        setItems(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/inventario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "crear",
          data: {
            [`${contextType}_id`]: contextId,
            item,
            cantidad,
            estado,
            notas
          }
        })
      });
      const data = await res.json();
      if (!data.error) {
        setItem("");
        setCantidad("1");
        setEstado("BUENO");
        setNotas("");
        loadItems();
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
    if (!confirm("¿Seguro que deseas eliminar este ítem del inventario?")) return;
    try {
      const res = await fetch("/api/inventario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "eliminar",
          data: { id }
        })
      });
      const data = await res.json();
      if (!data.error) {
        loadItems();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
        <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", color: "#0f172a" }}>📦 Registrar Nuevo Ítem</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Nombre del Ítem</label>
              <input 
                type="text" 
                value={item} 
                onChange={(e) => setItem(e.target.value)} 
                required 
                style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Cantidad</label>
              <input 
                type="number" 
                min="1"
                value={cantidad} 
                onChange={(e) => setCantidad(e.target.value)} 
                required 
                style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Estado</label>
              <select 
                value={estado} 
                onChange={(e) => setEstado(e.target.value)}
                style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "white" }}
              >
                <option value="BUENO">Bueno</option>
                <option value="REGULAR">Regular</option>
                <option value="MALO">Malo</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Notas (Opcional)</label>
            <input 
              type="text" 
              value={notas} 
              onChange={(e) => setNotas(e.target.value)} 
              placeholder="Ej: Guardado en el armario principal"
              style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
            />
          </div>
          <button 
            type="submit" 
            disabled={submitting} 
            style={{ padding: "0.6rem", background: "#2563eb", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", marginTop: "0.5rem" }}
          >
            {submitting ? "Guardando..." : "➕ Guardar Ítem"}
          </button>
        </form>
      </div>

      <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
        <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", color: "#0f172a" }}>📋 Listado de Inventario</h2>
        {loading ? (
          <p style={{ color: "#64748b", textAlign: "center" }}>Cargando inventario...</p>
        ) : items.length === 0 ? (
          <p style={{ color: "#64748b", textAlign: "center", fontStyle: "italic" }}>No hay ítems registrados en el inventario.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {items.map(it => (
              <div key={it.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                <div>
                  <div style={{ fontWeight: "bold", color: "#0f172a", marginBottom: "0.2rem" }}>{it.item} (x{it.cantidad})</div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Estado: <span style={{ fontWeight: 600, color: it.estado === "BUENO" ? "#16a34a" : it.estado === "MALO" ? "#dc2626" : "#d97706" }}>{it.estado}</span></div>
                  {it.notas && <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.2rem" }}>{it.notas}</div>}
                </div>
                <button onClick={() => handleDelete(it.id)} style={{ border: "none", background: "#fee2e2", color: "#dc2626", padding: "0.4rem 0.6rem", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.8rem" }}>
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
