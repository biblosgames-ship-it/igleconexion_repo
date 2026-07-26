"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function IngresosPage() {
  const [ingresos, setIngresos] = useState<any[]>([]);
  const [miembros, setMiembros] = useState<any[]>([]);
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [cajas, setCajas] = useState<any[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);

  // Form State
  const [clasificacion, setClasificacion] = useState('DIEZMO');
  const [categoria, setCategoria] = useState('DIEZMO');
  const [conceptoId, setConceptoId] = useState('DIEZMO');
  const [conceptos, setConceptos] = useState<any[]>([]);
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [descripcion, setDescripcion] = useState('');
  const [miembroId, setMiembroId] = useState('');
  const [bancoId, setBancoId] = useState('');
  const [cajaChicaId, setCajaChicaId] = useState('');
  const [proyectoId, setProyectoId] = useState('');
  const [facturaNo, setFacturaNo] = useState('');

  // Filters State
  const [search, setSearch] = useState('');
  const [filterClasificacion, setFilterClasificacion] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'registrar' | 'historial'>('registrar');

  useEffect(() => {
    loadData();
    loadSelectorData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (filterClasificacion) query.append('clasificacion', filterClasificacion);
      
      const res = await fetch(`/api/finanzas/ingresos?${query.toString()}`);
      const json = await res.json();
      if (!json.error) {
        setIngresos(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectorData = async () => {
    try {
      const [resM, resCB, resC] = await Promise.all([
        fetch('/api/miembros'),
        fetch('/api/finanzas/caja-bancos'),
        fetch('/api/finanzas/conceptos')
      ]);
      const jsonM = await resM.json();
      const jsonCB = await resCB.json();
      const jsonC = await resC.json();
      
      if (!jsonM.error) setMiembros(jsonM);
      if (!jsonCB.error) {
        setCuentas(jsonCB.cuentas || []);
        setCajas(jsonCB.cajas || []);
        setProyectos(jsonCB.proyectos || []);
        if (jsonCB.cajas?.length > 0) setCajaChicaId(jsonCB.cajas[0].id);
        if (jsonCB.cuentas?.length > 0) setBancoId(jsonCB.cuentas[0].id);
      }
      if (!jsonC.error) {
        setConceptos(jsonC.filter((c: any) => c.tipo === 'INGRESO'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monto || Number(monto) <= 0) {
      alert("Por favor ingresa un monto válido.");
      return;
    }

    const isStandard = ['DIEZMO', 'OFRENDA', 'PRIMICIA', 'PACTO', 'DONACION'].includes(conceptoId);
    const payload = {
      action: 'crear',
      data: {
        clasificacion: isStandard ? conceptoId : 'OTRO',
        categoria: isStandard ? (conceptoId === 'OFRENDA' ? categoria : conceptoId) : 'OTRO',
        concepto_id: isStandard ? null : conceptoId,
        monto: Number(monto),
        fecha,
        metodo_pago: metodoPago,
        descripcion,
        miembro_id: miembroId || null,
        banco_id: metodoPago === 'TRANSFERENCIA' ? bancoId : null,
        caja_chica_id: metodoPago === 'EFECTIVO' ? cajaChicaId : null,
        proyecto_id: proyectoId || null,
        factura_no: facturaNo || null
      }
    };

    try {
      const res = await fetch('/api/finanzas/ingresos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resJson = await res.json();
      if (resJson.success) {
        alert("Ingreso registrado exitosamente.");
        setMonto('');
        setDescripcion('');
        setFacturaNo('');
        loadData();
      } else {
        alert("Error: " + resJson.error);
      }
    } catch (err: any) {
      console.error(err);
      alert("Error de red");
    }
  };

  const handleAnular = async (id: string) => {
    if (!confirm("¿Está seguro que desea anular esta transacción? Esto revertirá los balances y no se puede deshacer.")) return;
    try {
      const res = await fetch('/api/finanzas/ingresos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'anular', data: { id } })
      });
      const resJson = await res.json();
      if (resJson.success) {
        alert("Transacción anulada.");
        loadData();
      } else {
        alert("Error: " + resJson.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em' }}>Entradas Financieras</h1>
        <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '0.15rem' }}>Administración de ingresos, diezmos, ofrendas y donaciones recibidas.</p>
      </div>

      {/* Sub-tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0', marginBottom: '1rem' }}>
        <button
          onClick={() => setActiveSubTab('registrar')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            borderBottom: activeSubTab === 'registrar' ? '2px solid #10b981' : '2px solid transparent',
            color: activeSubTab === 'registrar' ? '#10b981' : '#64748b',
            marginBottom: '-2px',
            transition: 'all 0.15s ease'
          }}
        >
          ➕ Registrar Nueva Entrada
        </button>
        <button
          onClick={() => setActiveSubTab('historial')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            borderBottom: activeSubTab === 'historial' ? '2px solid #10b981' : '2px solid transparent',
            color: activeSubTab === 'historial' ? '#10b981' : '#64748b',
            marginBottom: '-2px',
            transition: 'all 0.15s ease'
          }}
        >
          📋 Historial y Listados
        </button>
      </div>

      {activeSubTab === 'registrar' ? (
        /* Full-Width Spacious Form */
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Formulario de Registro de Entrada</h3>
            <p style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.15rem' }}>Por favor ingresa los datos de la transacción. El balance de la cuenta de destino se actualizará automáticamente.</p>
          </div>

          {/* Warning/Info about accounts creation */}
          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '1rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>💡</span>
            <div style={{ fontSize: '0.82rem', color: '#1e3a8a', lineHeight: '1.4' }}>
              <strong>¿Necesitas registrar en una cuenta que no ves en la lista?</strong> Puedes crear y gestionar todas tus cuentas bancarias y cajas chicas en la sección de <Link href="/admin/finanzas/caja-bancos" style={{ fontWeight: 700, color: '#0284c7', textDecoration: 'underline' }}>🏦 Cuentas (Bancos/Cajas)</Link>.
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            
            {/* Section 1: Detalles Básicos */}
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>1. Información General</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Concepto / Clasificación</label>
                  <select 
                    value={conceptoId} 
                    onChange={e => {
                      const val = e.target.value;
                      setConceptoId(val);
                      if (['DIEZMO', 'OFRENDA', 'PRIMICIA', 'PACTO', 'DONACION'].includes(val)) {
                        setClasificacion(val);
                        setCategoria(val);
                      } else {
                        setClasificacion('OTRO');
                        setCategoria('OTRO');
                      }
                    }}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                  >
                    <option value="DIEZMO">📖 Diezmo (Estándar)</option>
                    <option value="OFRENDA">🤝 Ofrenda (Estándar)</option>
                    <option value="PRIMICIA">🌾 Primicias (Estándar)</option>
                    <option value="PACTO">📜 Pacto (Estándar)</option>
                    <option value="DONACION">🎁 Donación (Estándar)</option>
                    
                    {conceptos.length > 0 && <option disabled>─── Conceptos Personalizados ───</option>}
                    {conceptos.map((c: any) => (
                      <option key={c.id} value={c.id}>🏷️ {c.nombre}</option>
                    ))}
                  </select>
                </div>

                {clasificacion === 'OFRENDA' && (
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Categoría de Ofrenda</label>
                    <select 
                      value={categoria} 
                      onChange={e => setCategoria(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                    >
                      <option value="OFRENDA_GENERAL">Ofrenda General</option>
                      <option value="OFRENDA_MISIONERA">Misiones</option>
                      <option value="OFRENDA_CONSTRUCCION">Construcción</option>
                      <option value="OFRENDA_JUVENIL">Juvenil</option>
                      <option value="OFRENDA_INFANTIL">Infantil</option>
                      <option value="OFRENDA_ESPECIAL">Especial / Campaña</option>
                    </select>
                  </div>
                )}

                {clasificacion === 'DONACION' && (
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Categoría de Donación</label>
                    <select 
                      value={categoria} 
                      onChange={e => setCategoria(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                    >
                      <option value="DONACION_ESPECIAL">Monetaria Especial</option>
                      <option value="DONACION_ESPECIE">En Especie</option>
                    </select>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Monto (USD)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0.01" 
                    value={monto} 
                    onChange={e => setMonto(e.target.value)}
                    required
                    placeholder="0.00" 
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Fecha</label>
                  <input 
                    type="date" 
                    value={fecha} 
                    onChange={e => setFecha(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Contribuyente y Cuentas */}
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>2. Contribuyente e Instrumento de Depósito</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Miembro / Contribuyente</label>
                  <select 
                    value={miembroId} 
                    onChange={e => setMiembroId(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                  >
                    <option value="">Anónimo / Otro</option>
                    {miembros.map((m: any) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Método de Pago</label>
                  <select 
                    value={metodoPago} 
                    onChange={e => setMetodoPago(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                  >
                    <option value="EFECTIVO">💵 Efectivo</option>
                    <option value="TRANSFERENCIA">🏦 Transferencia Bancaria</option>
                    <option value="TARJETA">💳 Tarjeta</option>
                    <option value="CHEQUE">📝 Cheque</option>
                  </select>
                </div>
                
                {metodoPago === 'TRANSFERENCIA' ? (
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Cuenta Bancaria Destino</label>
                    <select 
                      value={bancoId} 
                      onChange={e => setBancoId(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                    >
                      {cuentas.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.nombre_banco} - {c.numero_cuenta}</option>
                      ))}
                      {cuentas.length === 0 && <option value="">No hay cuentas bancarias</option>}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Caja Chica Destino</label>
                    <select 
                      value={cajaChicaId} 
                      onChange={e => setCajaChicaId(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                    >
                      {cajas.map((k: any) => (
                        <option key={k.id} value={k.id}>{k.nombre_caja}</option>
                      ))}
                      {cajas.length === 0 && <option value="">No hay cajas chicas</option>}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Destino y Notas */}
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>3. Asociación y Control</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Proyecto Vinculado</label>
                  <select 
                    value={proyectoId} 
                    onChange={e => setProyectoId(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                  >
                    <option value="">Ninguno / General</option>
                    {proyectos.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>N° de Comprobante / Recibo</label>
                  <input 
                    type="text" 
                    placeholder="Ej: REC-1002"
                    value={facturaNo} 
                    onChange={e => setFacturaNo(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Notas / Descripción</label>
                  <input 
                    type="text" 
                    placeholder="Notas internas adicionales..."
                    value={descripcion} 
                    onChange={e => setDescripcion(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              style={{
                padding: '0.9rem',
                backgroundColor: '#10b981',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.95rem',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                marginTop: '0.5rem',
                transition: 'background-color 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#059669'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = '#10b981'}
            >
              + Guardar y Procesar Entrada
            </button>
          </form>
        </div>
      ) : (
        /* Full-Width Spacious History Table */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Filters area */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="🔍 Buscar por descripción, registrado por, comprobante..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flexGrow: 1, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', outline: 'none' }}
            />
            <select 
              value={filterClasificacion}
              onChange={e => setFilterClasificacion(e.target.value)}
              style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', color: '#475569', outline: 'none' }}
            >
              <option value="">Todas las clasificaciones</option>
              <option value="DIEZMO">Diezmos</option>
              <option value="OFRENDA">Ofrendas</option>
              <option value="PRIMICIA">Primicias</option>
              <option value="PACTO">Pactos</option>
              <option value="DONACION">Donaciones</option>
            </select>
            <button 
              onClick={loadData}
              style={{
                padding: '0.65rem 1.25rem',
                backgroundColor: '#0284c7',
                color: 'white',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#0369a1'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = '#0284c7'}
            >
              Aplicar Filtros
            </button>
          </div>

          {/* Table container */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '1.25rem 1rem', color: '#475569', fontWeight: 700 }}>Fecha</th>
                  <th style={{ padding: '1.25rem 1rem', color: '#475569', fontWeight: 700 }}>Contribuyente / Miembro</th>
                  <th style={{ padding: '1rem', color: '#475569', fontWeight: 700 }}>Clasificación</th>
                  <th style={{ padding: '1rem', color: '#475569', fontWeight: 700 }}>Depósito Destino</th>
                  <th style={{ padding: '1rem', color: '#475569', fontWeight: 700 }}>Monto</th>
                  <th style={{ padding: '1rem', color: '#475569', fontWeight: 700 }}>Estado</th>
                  <th style={{ padding: '1rem', color: '#475569', fontWeight: 700, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', fontWeight: 600 }}>Cargando transacciones contables...</td>
                  </tr>
                ) : ingresos.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', fontWeight: 600 }}>No se encontraron transacciones en este período.</td>
                  </tr>
                ) : (
                  ingresos.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: t.estado === 'ANULADO' ? 0.55 : 1, transition: 'background-color 0.15s ease' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '1.25rem 1rem', color: '#1e293b', fontWeight: 600 }}>
                        {new Date(t.fecha).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1.25rem 1rem', color: '#475569' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{t.miembroNombre}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{t.descripcion || 'Sin descripción'}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: t.clasificacion === 'DIEZMO' ? '#e0f2fe' : t.clasificacion === 'OFRENDA' ? '#dcfce7' : '#fef9c3',
                          color: t.clasificacion === 'DIEZMO' ? '#0369a1' : t.clasificacion === 'OFRENDA' ? '#15803d' : '#854d0e'
                        }}>
                          {t.conceptoNombre || t.clasificacion}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: '#475569' }}>
                        <div style={{ fontWeight: 600 }}>{t.bancoNombre}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Método: {t.metodo_pago.toLowerCase()}</div>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 800, color: '#15803d', fontSize: '0.95rem' }}>
                        ${t.monto.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: t.estado === 'PAGADO' ? '#dcfce7' : '#fee2e2',
                          color: t.estado === 'PAGADO' ? '#15803d' : '#ef4444'
                        }}>
                          {t.estado}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        {t.estado !== 'ANULADO' && (
                          <button 
                            onClick={() => handleAnular(t.id)}
                            style={{
                              padding: '4px 10px',
                              background: '#fee2e2',
                              color: '#ef4444',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: '1px solid #fecaca',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = '#fca5a5'}
                            onMouseOut={e => e.currentTarget.style.background = '#fee2e2'}
                          >
                            Anular
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
}
