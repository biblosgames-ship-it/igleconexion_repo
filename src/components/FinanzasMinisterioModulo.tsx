"use client";

import { useState, useEffect } from 'react';

interface Props {
  grupoId?: string;
  nombreGrupo?: string;
  tipoGrupo?: string;
}

export default function FinanzasMinisterioModulo({ grupoId, nombreGrupo, tipoGrupo }: Props) {
  const [loading, setLoading] = useState(true);
  const [cuentaFondo, setCuentaFondo] = useState<any>(null);
  const [cuentasMinisteriales, setCuentasMinisteriales] = useState<any[]>([]);
  const [selectedCuentaId, setSelectedCuentaId] = useState<string>('');
  
  // Data States
  const [subcuentas, setSubcuentas] = useState<any[]>([]);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [cajaChica, setCajaChica] = useState<any>(null);
  const [cajasFisicas, setCajasFisicas] = useState<any[]>([]);

  // Active Tab: 'subcuentas' | 'solicitudes' | 'caja_chica'
  const [activeTab, setActiveTab] = useState<'subcuentas' | 'solicitudes' | 'caja_chica'>('subcuentas');

  // Form States - Subcuenta
  const [showSubcuentaModal, setShowSubcuentaModal] = useState(false);
  const [scNombre, setScNombre] = useState('');
  const [scTipo, setScTipo] = useState<'INGRESO' | 'GASTO'>('INGRESO');
  const [scDesc, setScDesc] = useState('');

  // Form States - Solicitud Aprobación
  const [showSolicitudModal, setShowSolicitudModal] = useState(false);
  const [solTipo, setSolTipo] = useState<'INGRESO' | 'EGRESO'>('INGRESO');
  const [solSubcuentaId, setSolSubcuentaId] = useState('');
  const [solCajaFisicaId, setSolCajaFisicaId] = useState('');
  const [solMonto, setSolMonto] = useState('');
  const [solFecha, setSolFecha] = useState(new Date().toISOString().substring(0, 10));
  const [solMetodo, setSolMetodo] = useState('EFECTIVO');
  const [solDesc, setSolDesc] = useState('');

  // Form States - Caja Chica Ministerial
  const [gastoMenorMonto, setGastoMenorMonto] = useState('');
  const [gastoMenorDesc, setGastoMenorDesc] = useState('');

  // Cargar Cuentas y Cajas Físicas
  const loadCuentasPrincipales = async () => {
    try {
      const res = await fetch('/api/finanzas/cuentas');
      const data = await res.json();
      if (Array.isArray(data)) {
        const ministerios = data.filter((c: any) => c.tipo !== 'CAJA_CHICA' && c.tipo !== 'CAJA_GENERAL' && c.tipo !== 'BANCO' && c.tipo !== 'GASTO' && c.tipo !== 'OFRENDA');
        const cajas = data.filter((c: any) => c.tipo === 'CAJA_CHICA' || c.tipo === 'CAJA_GENERAL' || c.tipo === 'BANCO');
        setCuentasMinisteriales(ministerios);
        setCajasFisicas(cajas);

        // Buscar coincidencia por nombre de grupo si aplica
        if (nombreGrupo) {
          const match = ministerios.find((m: any) => m.nombre.toLowerCase().includes(nombreGrupo.toLowerCase()) || nombreGrupo.toLowerCase().includes(m.nombre.toLowerCase()));
          if (match) {
            setCuentaFondo(match);
            setSelectedCuentaId(match.id);
          } else if (ministerios.length > 0 && !selectedCuentaId) {
            setCuentaFondo(ministerios[0]);
            setSelectedCuentaId(ministerios[0].id);
          }
        } else if (ministerios.length > 0 && !selectedCuentaId) {
          setCuentaFondo(ministerios[0]);
          setSelectedCuentaId(ministerios[0].id);
        }
      }
    } catch (e) {
      console.error("Error al cargar cuentas principales", e);
    }
  };

  const loadDetallesCuenta = async (cuentaId: string) => {
    if (!cuentaId) return;
    setLoading(true);
    try {
      // 1. Cargar subcuentas
      const subRes = await fetch(`/api/finanzas/subcuentas?cuenta_fondo_id=${cuentaId}`);
      const subData = await subRes.json();
      if (Array.isArray(subData)) setSubcuentas(subData);

      // 2. Cargar solicitudes
      const solRes = await fetch(`/api/finanzas/solicitudes?cuenta_fondo_id=${cuentaId}`);
      const solData = await solRes.json();
      if (Array.isArray(solData)) setSolicitudes(solData);

      // 3. Cargar caja chica ministerial
      const cajaRes = await fetch(`/api/finanzas/caja-ministerial?cuenta_fondo_id=${cuentaId}`);
      const cajaData = await cajaRes.json();
      if (!cajaData.error) setCajaChica(cajaData);
    } catch (e) {
      console.error("Error al cargar detalles de la cuenta ministerial", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCuentasPrincipales();
  }, [nombreGrupo]);

  useEffect(() => {
    if (selectedCuentaId) {
      const selected = cuentasMinisteriales.find(c => c.id === selectedCuentaId);
      if (selected) setCuentaFondo(selected);
      loadDetallesCuenta(selectedCuentaId);
    }
  }, [selectedCuentaId]);

  // Handlers
  const handleCrearSubcuenta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCuentaId || !scNombre) return alert("Completa el nombre de la subcuenta");

    try {
      const res = await fetch('/api/finanzas/subcuentas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'crear_subcuenta',
          data: { cuenta_fondo_id: selectedCuentaId, nombre: scNombre, tipo: scTipo, descripcion: scDesc }
        })
      });
      if (res.ok) {
        setScNombre(''); setScDesc(''); setShowSubcuentaModal(false);
        loadDetallesCuenta(selectedCuentaId);
      } else {
        const err = await res.json();
        alert("Error: " + (err.error || 'No se pudo crear la subcuenta'));
      }
    } catch (e) {
      alert("Error de conexión");
    }
  };

  const handleEliminarSubcuenta = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta subcuenta?")) return;
    try {
      const res = await fetch('/api/finanzas/subcuentas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'eliminar_subcuenta', data: { id } })
      });
      if (res.ok) loadDetallesCuenta(selectedCuentaId);
    } catch (e) {
      alert("Error al eliminar subcuenta");
    }
  };

  const handleCrearSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCuentaId || !solMonto || !solDesc) return alert("Completa el monto y la descripción");

    try {
      const res = await fetch('/api/finanzas/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'crear_solicitud',
          data: {
            cuenta_fondo_id: selectedCuentaId,
            subcuenta_fondo_id: solSubcuentaId || null,
            caja_fisica_id: solCajaFisicaId || null,
            tipo: solTipo,
            monto: solMonto,
            fecha: solFecha,
            metodo_pago: solMetodo,
            descripcion: solDesc
          }
        })
      });
      if (res.ok) {
        setSolMonto(''); setSolDesc(''); setSolSubcuentaId(''); setShowSolicitudModal(false);
        alert("⏳ Solicitud registrada con éxito. Ha sido enviada a Tesorería para su aprobación.");
        loadDetallesCuenta(selectedCuentaId);
      } else {
        const err = await res.json();
        alert("Error: " + (err.error || 'No se pudo registrar la solicitud'));
      }
    } catch (e) {
      alert("Error de conexión");
    }
  };

  const handleRegistrarGastoMenor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCuentaId || !gastoMenorMonto || !gastoMenorDesc) return alert("Completa el monto y la descripción del gasto menor");

    try {
      const res = await fetch('/api/finanzas/caja-ministerial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'registrar_gasto_menor',
          data: { cuenta_fondo_id: selectedCuentaId, monto: gastoMenorMonto, descripcion: gastoMenorDesc }
        })
      });
      if (res.ok) {
        setGastoMenorMonto(''); setGastoMenorDesc('');
        loadDetallesCuenta(selectedCuentaId);
      } else {
        const err = await res.json();
        alert("Aviso: " + (err.error || 'No se pudo registrar el gasto menor'));
      }
    } catch (e) {
      alert("Error de conexión");
    }
  };

  return (
    <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
      
      {/* Encabezado y Selector de Fondo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            💰 Control Financiero Ministerial
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
            Administra las subcuentas, envía solicitudes a Tesorería y gestiona el fondo menor interno.
          </p>
        </div>

        {cuentasMinisteriales.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Fondo Ministerial:</span>
            <select
              value={selectedCuentaId}
              onChange={e => setSelectedCuentaId(e.target.value)}
              style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, backgroundColor: 'white', color: '#0284c7' }}
            >
              {cuentasMinisteriales.map(c => (
                <option key={c.id} value={c.id}>
                  🏛️ {c.nombre} (${(c.balance || 0).toFixed(2)})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Resumen del Fondo Principal */}
      {cuentaFondo && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: 'white', borderRadius: '12px', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', opacity: 0.9, letterSpacing: '0.5px' }}>Fondo Principal Acumulado</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.3rem 0 0 0' }}>${(cuentaFondo.balance || 0).toFixed(2)}</h3>
            <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>{cuentaFondo.nombre}</span>
          </div>

          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Subcuentas Creadas</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '0.3rem 0 0 0' }}>{subcuentas.length}</h3>
            <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>Categorías de ingresos y gastos</span>
          </div>

          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Caja Chica Interna</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#7c3aed', margin: '0.3rem 0 0 0' }}>${(cajaChica?.balance || 0).toFixed(2)}</h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Gastos menores sin aprobación previa</span>
          </div>
        </div>
      )}

      {/* Navegación por Sub-pestañas */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('subcuentas')}
          style={{
            padding: '0.65rem 1.25rem', border: 'none', background: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
            color: activeTab === 'subcuentas' ? '#0284c7' : '#64748b',
            borderBottom: activeTab === 'subcuentas' ? '3px solid #0284c7' : '3px solid transparent'
          }}
        >
          📂 Subcuentas ({subcuentas.length})
        </button>
        <button
          onClick={() => setActiveTab('solicitudes')}
          style={{
            padding: '0.65rem 1.25rem', border: 'none', background: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
            color: activeTab === 'solicitudes' ? '#0284c7' : '#64748b',
            borderBottom: activeTab === 'solicitudes' ? '3px solid #0284c7' : '3px solid transparent'
          }}
        >
          ⏳ Solicitudes a Tesorería ({solicitudes.length})
        </button>
        <button
          onClick={() => setActiveTab('caja_chica')}
          style={{
            padding: '0.65rem 1.25rem', border: 'none', background: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
            color: activeTab === 'caja_chica' ? '#0284c7' : '#64748b',
            borderBottom: activeTab === 'caja_chica' ? '3px solid #0284c7' : '3px solid transparent'
          }}
        >
          💵 Caja Chica Interna (${(cajaChica?.balance || 0).toFixed(2)})
        </button>
      </div>

      {/* 1. SECCIÓN SUBCUENTAS */}
      {activeTab === 'subcuentas' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Categorías y Subcuentas del Ministerio
            </h3>
            <button
              onClick={() => setShowSubcuentaModal(true)}
              style={{ padding: '0.5rem 1rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              + Crear Subcuenta
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {subcuentas.map(sc => (
              <div key={sc.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '4px', background: sc.tipo === 'INGRESO' ? '#dcfce7' : '#fee2e2', color: sc.tipo === 'INGRESO' ? '#166534' : '#991b1b' }}>
                      {sc.tipo}
                    </span>
                    <h4 style={{ margin: '0.5rem 0 0.2rem 0', fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>{sc.nombre}</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{sc.descripcion || 'Sin descripción'}</p>
                  </div>
                  <button onClick={() => handleEliminarSubcuenta(sc.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem' }} title="Borrar">
                    🗑️
                  </button>
                </div>
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Saldo Acumulado</span>
                  <strong style={{ fontSize: '1.2rem', color: sc.balance >= 0 ? '#15803d' : '#dc2626' }}>${(sc.balance || 0).toFixed(2)}</strong>
                </div>
              </div>
            ))}
            {subcuentas.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', background: 'white', border: '1px dashed #cbd5e1', borderRadius: '12px', color: '#94a3b8' }}>
                No hay subcuentas creadas aún. Haz clic en "+ Crear Subcuenta" para registrar conceptos como *Ofrendas*, *Cuotas*, *Ingresos Campamento*, *Kermés*, etc.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. SECCIÓN SOLICITUDES A TESORERÍA */}
      {activeTab === 'solicitudes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Solicitudes de Movimientos Financieros
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                Todos los movimientos ingresados se envían a Tesorería para su aprobación formal.
              </p>
            </div>
            <button
              onClick={() => setShowSolicitudModal(true)}
              style={{ padding: '0.5rem 1rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              + Registrar Movimiento
            </button>
          </div>

          <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#475569' }}>Fecha</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#475569' }}>Tipo</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#475569' }}>Subcuenta / Concepto</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#475569' }}>Descripción</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', color: '#475569' }}>Monto</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', color: '#475569' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map(sol => (
                  <tr key={sol.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem' }}>{new Date(sol.fecha).toLocaleDateString()}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ fontWeight: 700, color: sol.tipo === 'INGRESO' ? '#16a34a' : '#dc2626' }}>
                        {sol.tipo === 'INGRESO' ? '🟢 Ingreso' : '🔴 Egreso'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{sol.subcuenta_fondo?.nombre || 'General'}</td>
                    <td style={{ padding: '0.75rem', color: '#475569' }}>{sol.descripcion}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: sol.tipo === 'INGRESO' ? '#16a34a' : '#dc2626' }}>
                      ${sol.monto.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                        background: sol.estado === 'PENDIENTE' ? '#fef3c7' : sol.estado === 'APROBADO' ? '#dcfce7' : '#fee2e2',
                        color: sol.estado === 'PENDIENTE' ? '#d97706' : sol.estado === 'APROBADO' ? '#15803d' : '#b91c1c'
                      }}>
                        {sol.estado === 'PENDIENTE' ? '⏳ Pendiente' : sol.estado === 'APROBADO' ? '✅ Aprobado' : '❌ Rechazado'}
                      </span>
                    </td>
                  </tr>
                ))}
                {solicitudes.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                      No hay solicitudes registradas recientemente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. SECCIÓN CAJA CHICA INTERNA */}
      {activeTab === 'caja_chica' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              💵 Registrar Gasto Menor Autónomo
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '1rem' }}>
              Para gastos cotidianos menores (hasta <strong>${(cajaChica?.limite_gasto_menor || 50).toFixed(2)}</strong>) sin necesidad de aprobación previa en tiempo real.
            </p>
            <form onSubmit={handleRegistrarGastoMenor} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Monto ($)</label>
              <input
                required
                type="number"
                step="0.01"
                placeholder="0.00"
                value={gastoMenorMonto}
                onChange={e => setGastoMenorMonto(e.target.value)}
                style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}
              />
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Descripción / Concepto</label>
              <input
                required
                placeholder="Ej. Vasos desechables para reunión"
                value={gastoMenorDesc}
                onChange={e => setGastoMenorDesc(e.target.value)}
                style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}
              />
              <button
                type="submit"
                style={{ padding: '0.65rem', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
              >
                Registrar Gasto Menor
              </button>
            </form>
          </div>

          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
              Historial de Caja Chica Interna
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '0.65rem', textAlign: 'left', color: '#475569' }}>Fecha</th>
                    <th style={{ padding: '0.65rem', textAlign: 'left', color: '#475569' }}>Descripción</th>
                    <th style={{ padding: '0.65rem', textAlign: 'left', color: '#475569' }}>Registrado por</th>
                    <th style={{ padding: '0.65rem', textAlign: 'right', color: '#475569' }}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {cajaChica?.transacciones_menores?.map((tm: any) => (
                    <tr key={tm.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.65rem' }}>{new Date(tm.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '0.65rem', color: '#0f172a' }}>{tm.descripcion}</td>
                      <td style={{ padding: '0.65rem', color: '#64748b' }}>{tm.registrado_por_nombre}</td>
                      <td style={{ padding: '0.65rem', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                        -${tm.monto.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {(!cajaChica?.transacciones_menores || cajaChica.transacciones_menores.length === 0) && (
                    <tr>
                      <td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>
                        No hay gastos menores registrados aún en esta caja chica.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR SUBCUENTA */}
      {showSubcuentaModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '420px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: 700 }}>+ Crear Subcuenta Ministerial</h3>
            <form onSubmit={handleCrearSubcuenta} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Nombre de la Subcuenta</label>
              <input required placeholder="Ej: Ofrendas, Cuotas, Kermés, Campamento..." value={scNombre} onChange={e=>setScNombre(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
              
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Tipo de Subcuenta</label>
              <select value={scTipo} onChange={e=>setScTipo(e.target.value as any)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                <option value="INGRESO">🟢 Ingresos (Ofrendas, Cuotas, Entradas)</option>
                <option value="GASTO">🔴 Gastos (Salidas, Compras, Eventos)</option>
              </select>

              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Descripción (Opcional)</label>
              <input placeholder="Detalles o propósito de la subcuenta" value={scDesc} onChange={e=>setScDesc(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowSubcuentaModal(false)} style={{ flex: 1, padding: '0.65rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '0.65rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Guardar Subcuenta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR SOLICITUD A TESORERÍA */}
      {showSolicitudModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: 700 }}>+ Registrar Movimiento Financiero</h3>
            <form onSubmit={handleCrearSolicitud} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSolTipo('INGRESO')}
                  style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', background: solTipo === 'INGRESO' ? '#16a34a' : '#f1f5f9', color: solTipo === 'INGRESO' ? 'white' : '#475569' }}
                >
                  🟢 Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => setSolTipo('EGRESO')}
                  style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', background: solTipo === 'EGRESO' ? '#dc2626' : '#f1f5f9', color: solTipo === 'EGRESO' ? 'white' : '#475569' }}
                >
                  🔴 Egreso
                </button>
              </div>

              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Subcuenta Afectada</label>
              <select value={solSubcuentaId} onChange={e=>setSolSubcuentaId(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                <option value="">-- General (Fondo Principal) --</option>
                {subcuentas.filter(s => solTipo === 'INGRESO' ? s.tipo === 'INGRESO' : s.tipo === 'GASTO').map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>

              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Caja Contable Física (Destino/Origen)</label>
              <select value={solCajaFisicaId} onChange={e=>setSolCajaFisicaId(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                <option value="">-- Auto según Método --</option>
                {cajasFisicas.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} (${(c.balance || 0).toFixed(2)})</option>
                ))}
              </select>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Monto ($)</label>
                  <input required type="number" step="0.01" placeholder="0.00" value={solMonto} onChange={e=>setSolMonto(e.target.value)} style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Fecha</label>
                  <input required type="date" value={solFecha} onChange={e=>setSolFecha(e.target.value)} style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                </div>
              </div>

              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Método de Pago</label>
              <select value={solMetodo} onChange={e=>setSolMetodo(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                <option value="EFECTIVO">💵 Efectivo</option>
                <option value="TRANSFERENCIA">🏦 Transferencia Banco</option>
                <option value="CHEQUE">📜 Cheque</option>
              </select>

              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Descripción / Detalle</label>
              <input required placeholder="Ej: Ofrenda Culto de Jóvenes del Sábado" value={solDesc} onChange={e=>setSolDesc(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowSolicitudModal(false)} style={{ flex: 1, padding: '0.65rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '0.65rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Enviar a Tesorería</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
