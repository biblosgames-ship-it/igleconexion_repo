"use client";
import { useState, useEffect } from 'react';

export default function CajaBancosPage() {
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [cajas, setCajas] = useState<any[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [conceptos, setConceptos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State Concepto
  const [nombreConcepto, setNombreConcepto] = useState('');
  const [tipoConcepto, setTipoConcepto] = useState('INGRESO');
  const [descConcepto, setDescConcepto] = useState('');

  // Form State Banco
  const [nombreBanco, setNombreBanco] = useState('');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [tipoCuenta, setTipoCuenta] = useState('AHORROS');
  const [balanceBanco, setBalanceBanco] = useState('');

  // Form State Caja Chica
  const [nombreCaja, setNombreCaja] = useState('');
  const [balanceCaja, setBalanceCaja] = useState('');
  const [limiteCaja, setLimiteCaja] = useState('200');

  // Form State Proyecto
  const [nombreProyecto, setNombreProyecto] = useState('');
  const [descProyecto, setDescProyecto] = useState('');
  const [metaProyecto, setMetaProyecto] = useState('');

  // Transfer Form State
  const [origenId, setOrigenId] = useState('');
  const [destinoId, setDestinoId] = useState('');
  const [montoTransferir, setMontoTransferir] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resCB, resC] = await Promise.all([
        fetch('/api/finanzas/caja-bancos'),
        fetch('/api/finanzas/conceptos')
      ]);
      const json = await resCB.json();
      const jsonC = await resC.json();

      if (!json.error) {
        setCuentas(json.cuentas || []);
        setCajas(json.cajas || []);
        setProyectos(json.proyectos || []);
        if (json.cuentas?.length > 0) {
          setOrigenId(json.cuentas[0].id);
          setDestinoId(json.cuentas[0].id);
        }
      }
      if (!jsonC.error) {
        setConceptos(jsonC);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearBanco = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreBanco || !numeroCuenta) {
      alert("Por favor rellena los datos del banco.");
      return;
    }

    try {
      const res = await fetch('/api/finanzas/caja-bancos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'crearBanco',
          data: {
            nombre_banco: nombreBanco,
            numero_cuenta: numeroCuenta,
            tipo_cuenta: tipoCuenta,
            balance: Number(balanceBanco) || 0
          }
        })
      });
      const resJson = await res.json();
      if (resJson.success) {
        alert("Cuenta bancaria registrada.");
        setNombreBanco('');
        setNumeroCuenta('');
        setBalanceBanco('');
        loadData();
      } else {
        alert("Error: " + resJson.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCrearCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCaja) return;
    try {
      const res = await fetch('/api/finanzas/caja-bancos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'crearCaja',
          data: {
            nombre_caja: nombreCaja,
            balance: Number(balanceCaja) || 0,
            limite: Number(limiteCaja) || 200
          }
        })
      });
      const resJson = await res.json();
      if (resJson.success) {
        alert("Caja chica registrada.");
        setNombreCaja('');
        setBalanceCaja('');
        loadData();
      } else {
        alert("Error: " + resJson.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCrearProyecto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreProyecto || !metaProyecto) return;
    try {
      const res = await fetch('/api/finanzas/caja-bancos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'crearProyecto',
          data: {
            nombre: nombreProyecto,
            descripcion: descProyecto,
            meta: Number(metaProyecto)
          }
        })
      });
      const resJson = await res.json();
      if (resJson.success) {
        alert("Proyecto especial registrado.");
        setNombreProyecto('');
        setDescProyecto('');
        setMetaProyecto('');
        loadData();
      } else {
        alert("Error: " + resJson.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCrearConcepto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreConcepto) return;
    try {
      const res = await fetch('/api/finanzas/conceptos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'crear',
          data: {
            nombre: nombreConcepto,
            tipo: tipoConcepto,
            descripcion: descConcepto
          }
        })
      });
      const resJson = await res.json();
      if (resJson.success) {
        alert("Concepto contable registrado con éxito.");
        setNombreConcepto('');
        setDescConcepto('');
        loadData();
      } else {
        alert("Error: " + resJson.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEliminarConcepto = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este concepto? Solo es posible si no tiene transacciones asociadas.")) return;
    try {
      const res = await fetch('/api/finanzas/conceptos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'eliminar',
          data: { id }
        })
      });
      const resJson = await res.json();
      if (resJson.success) {
        alert("Concepto eliminado.");
        loadData();
      } else {
        alert("Error: " + resJson.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origenId || !destinoId || !montoTransferir || Number(montoTransferir) <= 0) {
      alert("Introduce datos válidos de transferencia.");
      return;
    }
    if (origenId === destinoId) {
      alert("La cuenta de origen y destino no pueden ser la misma.");
      return;
    }

    try {
      const res = await fetch('/api/finanzas/caja-bancos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transferir',
          data: {
            origen_id: origenId,
            destino_id: destinoId,
            monto: Number(montoTransferir)
          }
        })
      });
      const resJson = await res.json();
      if (resJson.success) {
        alert("Transferencia bancaria realizada con éxito.");
        setMontoTransferir('');
        loadData();
      } else {
        alert("Error: " + resJson.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em' }}>Bancos y Caja Chica</h1>
        <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '0.15rem' }}>Administra múltiples cuentas bancarias, arqueos de caja chica diaria y transferencias de fondos.</p>
      </div>

      {/* Grid of Balances */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        {/* Bancos panel */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1rem' }}>🏦 Cuentas Bancarias</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {cuentas.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>{c.nombre_banco}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.numero_cuenta} ({c.tipo_cuenta})</div>
                </div>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0284c7' }}>
                  ${c.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
            {cuentas.length === 0 && <p style={{ color: '#94a3b8', fontSize: '0.82rem', textAlign: 'center' }}>No hay cuentas registradas.</p>}
          </div>

          <form onSubmit={handleCrearBanco} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Vincular Nueva Cuenta</h4>
            <input type="text" placeholder="Nombre Banco" value={nombreBanco} onChange={e => setNombreBanco(e.target.value)} required style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }} />
            <input type="text" placeholder="N° Cuenta" value={numeroCuenta} onChange={e => setNumeroCuenta(e.target.value)} required style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }} />
            <select value={tipoCuenta} onChange={e => setTipoCuenta(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}>
              <option value="AHORROS">Ahorros</option>
              <option value="CORRIENTE">Corriente</option>
            </select>
            <input type="number" placeholder="Balance Inicial ($)" value={balanceBanco} onChange={e => setBalanceBanco(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }} />
            <button type="submit" style={{ padding: '0.5rem', background: '#0284c7', color: 'white', borderRadius: '6px', fontWeight: 700, fontSize: '0.82rem', border: 'none', cursor: 'pointer' }}>Registrar Cuenta</button>
          </form>
        </div>

        {/* Caja Chica panel */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1rem' }}>🪙 Caja Chica</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {cajas.map(k => (
              <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>{k.nombre_caja}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Límite: ${k.limite.toFixed(2)} | Estado: {k.estado}</div>
                </div>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#d97706' }}>
                  ${k.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
            {cajas.length === 0 && <p style={{ color: '#94a3b8', fontSize: '0.82rem', textAlign: 'center' }}>No hay cajas registradas.</p>}
          </div>

          <form onSubmit={handleCrearCaja} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Crear Caja Chica</h4>
            <input type="text" placeholder="Nombre Caja" value={nombreCaja} onChange={e => setNombreCaja(e.target.value)} required style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }} />
            <input type="number" placeholder="Balance Inicial ($)" value={balanceCaja} onChange={e => setBalanceCaja(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }} />
            <input type="number" placeholder="Límite Máximo ($)" value={limiteCaja} onChange={e => setLimiteCaja(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }} />
            <button type="submit" style={{ padding: '0.5rem', background: '#d97706', color: 'white', borderRadius: '6px', fontWeight: 700, fontSize: '0.82rem', border: 'none', cursor: 'pointer' }}>Crear Caja</button>
          </form>
        </div>

        {/* Transfer & Projects panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Transfer Form */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1rem' }}>🔄 Transferencia entre Bancos</h3>
            <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.2rem' }}>Cuenta de Origen</label>
                <select value={origenId} onChange={e => setOrigenId(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}>
                  {cuentas.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre_banco} (${c.balance})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.2rem' }}>Cuenta de Destino</label>
                <select value={destinoId} onChange={e => setDestinoId(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}>
                  {cuentas.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre_banco} (${c.balance})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.2rem' }}>Monto a Transferir (USD)</label>
                <input type="number" placeholder="0.00" value={montoTransferir} onChange={e => setMontoTransferir(e.target.value)} required style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }} />
              </div>
              <button type="submit" style={{ padding: '0.65rem', background: '#6366f1', color: 'white', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', border: 'none', cursor: 'pointer', marginTop: '0.25rem' }}>Ejecutar Transferencia</button>
            </form>
          </div>

          {/* Project Form */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1rem' }}>🏗️ Registrar Nuevo Proyecto</h3>
            <form onSubmit={handleCrearProyecto} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input type="text" placeholder="Nombre del Proyecto" value={nombreProyecto} onChange={e => setNombreProyecto(e.target.value)} required style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }} />
              <input type="text" placeholder="Descripción" value={descProyecto} onChange={e => setDescProyecto(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }} />
              <input type="number" placeholder="Meta de Recaudación ($)" value={metaProyecto} onChange={e => setMetaProyecto(e.target.value)} required style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }} />
              <button type="submit" style={{ padding: '0.5rem', background: '#06b6d4', color: 'white', borderRadius: '6px', fontWeight: 700, fontSize: '0.82rem', border: 'none', cursor: 'pointer' }}>Registrar Proyecto</button>
            </form>
          </div>

        </div>

      </div>

      {/* Conceptos panel at the bottom */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>🏷️ Conceptos y Categorías Contables Personalizadas</h3>
        <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '-0.75rem', marginBottom: '1.5rem' }}>
          Define conceptos contables personalizados (como cuotas, venta de productos, retiros especiales, etc.) para clasificar tus entradas y salidas.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'flex-start' }}>
          {/* List of Concepts */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569', marginBottom: '1rem' }}>Conceptos Creados</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {conceptos.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '6px',
                        background: c.tipo === 'INGRESO' ? '#dcfce7' : '#fee2e2',
                        color: c.tipo === 'INGRESO' ? '#15803d' : '#ef4444'
                      }}>
                        {c.tipo}
                      </span>
                      <strong style={{ fontSize: '0.88rem', color: '#1e293b' }}>{c.nombre}</strong>
                    </div>
                    {c.descripcion && <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.15rem' }}>{c.descripcion}</span>}
                  </div>
                  <button
                    onClick={() => handleEliminarConcepto(c.id)}
                    style={{ padding: '2px 8px', background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              {conceptos.length === 0 && (
                <p style={{ color: '#94a3b8', fontSize: '0.82rem', textAlign: 'center', padding: '2rem' }}>No hay conceptos personalizados creados. Usa el formulario de la derecha para añadir uno.</p>
              )}
            </div>
          </div>

          {/* Form to create Concept */}
          <form onSubmit={handleCrearConcepto} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Crear Concepto Contable</h4>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Tipo de Movimiento</label>
              <select value={tipoConcepto} onChange={e => setTipoConcepto(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', outline: 'none' }}>
                <option value="INGRESO">🟢 Entrada (Ingreso)</option>
                <option value="GASTO">🔴 Salida (Gasto/Egreso)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Nombre del Concepto</label>
              <input type="text" placeholder="Ej: Venta de Producto, Cuotas, etc." value={nombreConcepto} onChange={e => setNombreConcepto(e.target.value)} required style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Descripción / Notas</label>
              <input type="text" placeholder="Descripción opcional..." value={descConcepto} onChange={e => setDescConcepto(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none' }} />
            </div>

            <button type="submit" style={{ padding: '0.65rem', background: '#0284c7', color: 'white', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', border: 'none', cursor: 'pointer', marginTop: '0.25rem' }}>Añadir Concepto</button>
          </form>
        </div>
      </div>

    </div>
  );
}
