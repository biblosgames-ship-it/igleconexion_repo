"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function GastosPage() {
  const [gastos, setGastos] = useState<any[]>([]);
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [cajas, setCajas] = useState<any[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);

  // Form State
  const [categoria, setCategoria] = useState('SERVICIOS');
  const [conceptoId, setConceptoId] = useState('SERVICIOS');
  const [conceptos, setConceptos] = useState<any[]>([]);
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [descripcion, setDescripcion] = useState('');
  const [bancoId, setBancoId] = useState('');
  const [cajaChicaId, setCajaChicaId] = useState('');
  const [proyectoId, setProyectoId] = useState('');
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [facturaNo, setFacturaNo] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [ministerio, setMinisterio] = useState('');
  const [centroCosto, setCentroCosto] = useState('');

  // Filters State
  const [search, setSearch] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
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
      if (filterCategoria) query.append('categoria', filterCategoria);
      
      const res = await fetch(`/api/finanzas/gastos?${query.toString()}`);
      const json = await res.json();
      if (!json.error) {
        setGastos(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectorData = async () => {
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
        if (json.cajas?.length > 0) setCajaChicaId(json.cajas[0].id);
        if (json.cuentas?.length > 0) setBancoId(json.cuentas[0].id);
      }
      if (!jsonC.error) {
        setConceptos(jsonC.filter((c: any) => c.tipo === 'GASTO'));
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

    const isStandard = ['SERVICIOS', 'ALQUILER', 'SALARIO', 'BENEFICENCIA', 'MANTENIMIENTO', 'COMPRA_EQUIPOS', 'OTRO'].includes(conceptoId);
    const payload = {
      action: 'crear',
      data: {
        categoria: isStandard ? conceptoId : 'OTRO',
        concepto_id: isStandard ? null : conceptoId,
        monto: Number(monto),
        fecha,
        metodo_pago: metodoPago,
        descripcion,
        banco_id: metodoPago === 'TRANSFERENCIA' ? bancoId : null,
        caja_chica_id: metodoPago === 'EFECTIVO' ? cajaChicaId : null,
        proyecto_id: proyectoId || null,
        comprobante_url: comprobanteUrl || null,
        factura_no: facturaNo || null,
        proveedor: proveedor || null,
        departamento: departamento || null,
        ministerio: ministerio || null,
        centro_costo: centroCosto || null
      }
    };

    try {
      const res = await fetch('/api/finanzas/gastos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resJson = await res.json();
      if (resJson.success) {
        alert("Gasto registrado exitosamente.");
        setMonto('');
        setDescripcion('');
        setFacturaNo('');
        setProveedor('');
        setCentroCosto('');
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
    if (!confirm("¿Está seguro que desea anular esta transacción? Esto devolverá los balances e incrementará el presupuesto disponible.")) return;
    try {
      const res = await fetch('/api/finanzas/gastos', {
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
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em' }}>Salidas Financieras</h1>
        <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '0.15rem' }}>Administración de egresos, gastos operativos, facturas y pagos realizados.</p>
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
            borderBottom: activeSubTab === 'registrar' ? '2px solid #ef4444' : '2px solid transparent',
            color: activeSubTab === 'registrar' ? '#ef4444' : '#64748b',
            marginBottom: '-2px',
            transition: 'all 0.15s ease'
          }}
        >
          ➕ Registrar Nueva Salida
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
            borderBottom: activeSubTab === 'historial' ? '2px solid #ef4444' : '2px solid transparent',
            color: activeSubTab === 'historial' ? '#ef4444' : '#64748b',
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
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Formulario de Registro de Salida</h3>
            <p style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.15rem' }}>Por favor ingresa los datos de egreso. El monto se restará del balance de la cuenta seleccionada e incrementará el total del presupuesto ejecutado.</p>
          </div>

          {/* Warning/Info about accounts creation */}
          <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '1rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>💡</span>
            <div style={{ fontSize: '0.82rem', color: '#7c2d12', lineHeight: '1.4' }}>
              <strong>¿Necesitas debitar de una cuenta bancaria o caja chica nueva?</strong> Puedes crear y gestionar todas tus cuentas en la sección de <Link href="/admin/finanzas/caja-bancos" style={{ fontWeight: 700, color: '#ea580c', textDecoration: 'underline' }}>🏦 Cuentas (Bancos/Cajas)</Link>.
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            
            {/* Section 1: Detalles Básicos */}
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>1. Información General del Gasto</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Concepto / Categoría</label>
                  <select 
                    value={conceptoId} 
                    onChange={e => {
                      const val = e.target.value;
                      setConceptoId(val);
                      if (['SERVICIOS', 'ALQUILER', 'SALARIO', 'BENEFICENCIA', 'MANTENIMIENTO', 'COMPRA_EQUIPOS', 'OTRO'].includes(val)) {
                        setCategoria(val);
                      } else {
                        setCategoria('OTRO');
                      }
                    }}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                  >
                    <option value="SERVICIOS">🔌 Servicios Públicos (Estándar)</option>
                    <option value="ALQUILER">🏠 Alquiler / Hipoteca (Estándar)</option>
                    <option value="SALARIO">👥 Salarios Eclesiales (Estándar)</option>
                    <option value="BENEFICENCIA">❤️ Beneficencia / Ayuda Social (Estándar)</option>
                    <option value="MANTENIMIENTO">🛠️ Mantenimiento / Reparaciones (Estándar)</option>
                    <option value="COMPRA_EQUIPOS">💻 Compra de Equipos (Estándar)</option>
                    <option value="OTRO">📁 Otro Egreso (Estándar)</option>
                    
                    {conceptos.length > 0 && <option disabled>─── Conceptos Personalizados ───</option>}
                    {conceptos.map((c: any) => (
                      <option key={c.id} value={c.id}>🏷️ {c.nombre}</option>
                    ))}
                  </select>
                </div>

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

            {/* Section 2: Pago y Origen */}
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>2. Método de Pago y Cuenta Origen</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Método de Pago</label>
                  <select 
                    value={metodoPago} 
                    onChange={e => setMetodoPago(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                  >
                    <option value="EFECTIVO">💵 Efectivo</option>
                    <option value="TRANSFERENCIA">🏦 Transferencia Bancaria</option>
                    <option value="CHEQUE">📝 Cheque</option>
                  </select>
                </div>
                
                {metodoPago === 'TRANSFERENCIA' ? (
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Cuenta Origen (Banco)</label>
                    <select 
                      value={bancoId} 
                      onChange={e => setBancoId(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                    >
                      {cuentas.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.nombre_banco} - Saldo: ${c.balance.toFixed(2)}</option>
                      ))}
                      {cuentas.length === 0 && <option value="">No hay cuentas bancarias</option>}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Caja Chica Origen</label>
                    <select 
                      value={cajaChicaId} 
                      onChange={e => setCajaChicaId(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                    >
                      {cajas.map((k: any) => (
                        <option key={k.id} value={k.id}>{k.nombre_caja} - Saldo: ${k.balance.toFixed(2)}</option>
                      ))}
                      {cajas.length === 0 && <option value="">No hay cajas chicas</option>}
                    </select>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Proveedor / Receptor</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Distribuidora SRL"
                    value={proveedor} 
                    onChange={e => setProveedor(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Centros de Costo e Imputación */}
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>3. Destino, Centro de Costos e Imputación Presupuestal</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Ministerio Afectado</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Ministerio Juvenil"
                    value={ministerio} 
                    onChange={e => setMinisterio(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Departamento Afectado</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Educación / Administración"
                    value={departamento} 
                    onChange={e => setDepartamento(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Centro de Costo / Código</label>
                  <input 
                    type="text" 
                    placeholder="Ej: CC-SERVICIOS"
                    value={centroCosto} 
                    onChange={e => setCentroCosto(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Proyecto Especial</label>
                  <select 
                    value={proyectoId} 
                    onChange={e => setProyectoId(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                  >
                    <option value="">Ninguno / Gasto General</option>
                    {proyectos.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>N° Factura / Recibo</label>
                  <input 
                    type="text" 
                    placeholder="Ej: FAC-40293"
                    value={facturaNo} 
                    onChange={e => setFacturaNo(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Notas / Descripción del Gasto</label>
                  <input 
                    type="text" 
                    placeholder="Notas internas adicionales..."
                    value={descripcion} 
                    onChange={e => setDescripcion(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              style={{
                padding: '0.9rem',
                backgroundColor: '#ef4444',
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
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#dc2626'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = '#ef4444'}
            >
              + Guardar y Procesar Salida
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
              placeholder="🔍 Buscar por proveedor, descripción, factura, departamento..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flexGrow: 1, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', outline: 'none' }}
            />
            <select 
              value={filterCategoria}
              onChange={e => setFilterCategoria(e.target.value)}
              style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', color: '#475569', outline: 'none' }}
            >
              <option value="">Todas las categorías</option>
              <option value="SERVICIOS">Servicios Públicos</option>
              <option value="ALQUILER">Alquileres</option>
              <option value="SALARIO">Salarios</option>
              <option value="BENEFICENCIA">Ayudas</option>
              <option value="MANTENIMIENTO">Mantenimiento</option>
              <option value="COMPRA_EQUIPOS">Equipos</option>
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
                  <th style={{ padding: '1.25rem 1rem', color: '#475569', fontWeight: 700 }}>Proveedor / Concepto</th>
                  <th style={{ padding: '1rem', color: '#475569', fontWeight: 700 }}>Categoría</th>
                  <th style={{ padding: '1rem', color: '#475569', fontWeight: 700 }}>Débito Origen</th>
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
                ) : gastos.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', fontWeight: 600 }}>No se encontraron transacciones en este período.</td>
                  </tr>
                ) : (
                  gastos.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: t.estado === 'ANULADO' ? 0.55 : 1, transition: 'background-color 0.15s ease' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '1.25rem 1rem', color: '#1e293b', fontWeight: 600 }}>
                        {new Date(t.fecha).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1.25rem 1rem', color: '#475569' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{t.proveedor || 'Gasto General'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{t.descripcion || 'Sin descripción'}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: '#fee2e2',
                          color: '#dc2626'
                        }}>
                          {t.conceptoNombre || t.categoria}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: '#475569' }}>
                        <div style={{ fontWeight: 600 }}>{t.bancoNombre}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Método: {t.metodo_pago.toLowerCase()}</div>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 800, color: '#dc2626', fontSize: '0.95rem' }}>
                        -${t.monto.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: t.estado === 'PAGADO' ? '#fee2e2' : '#f3f4f6',
                          color: t.estado === 'PAGADO' ? '#ef4444' : '#475569'
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
