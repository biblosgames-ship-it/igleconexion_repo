"use client";

import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
const PIE_COLORS = ['#0284c7', '#16a34a', '#dc2626', '#eab308', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#0ea5e9', '#84cc16'];
import styles from './admin.module.css'; // Mismo estilo base

export default function FinanzasModule() {
  const [activeSubTab, setActiveSubTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Dashboard Periodo
  const [dashPeriodoValor, setDashPeriodoValor] = useState(new Date().getFullYear().toString()); // Por defecto el año actual
  
  // Data States
  const [finData, setFinData] = useState<any>(null); // Dashboard
  const [diezmos, setDiezmos] = useState<any[]>([]);
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [miembros, setMiembros] = useState<any[]>([]); // Para selector
  const [reportes, setReportes] = useState<any>(null);

  // Form States - Diezmos
  const [dPersonaId, setDPersonaId] = useState('');
  const [dMonto, setDMonto] = useState('');
  const [dMetodo, setDMetodo] = useState('EFECTIVO');
  const [dFecha, setDFecha] = useState(new Date().toISOString().split('T')[0]);
  const [dCuentaId, setDCuentaId] = useState('');

  // Form States - Cuentas (Ofrendas/Gastos/Ministerios)
  const [cNombre, setCNombre] = useState('');
  const [cTipo, setCTipo] = useState('OFRENDA');
  const [cDesc, setCDesc] = useState('');

  // Form States - Transacciones Generales
  const [tCuentaId, setTCuentaId] = useState('');
  const [tTipoTransaccion, setTTipoTransaccion] = useState('INGRESO');
  const [tMonto, setTMonto] = useState('');
  const [tFecha, setTFecha] = useState(new Date().toISOString().split('T')[0]);
  const [tMetodoPago, setTMetodoPago] = useState('EFECTIVO');
  const [tDesc, setTDesc] = useState('');
  
  // Form States - Reportes
  const [rFuente, setRFuente] = useState('TODAS'); // 'TODAS', 'DIEZMOS', or cuentaId
  const [rFormato, setRFormato] = useState('DETALLADO'); // 'DETALLADO' or 'CONSOLIDADO'
  const today = new Date();
  const [rFechaInicio, setRFechaInicio] = useState(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().substring(0, 10));
  const [rFechaFin, setRFechaFin] = useState(today.toISOString().substring(0, 10));

  // Conciliación Bancaria
  const [pendientesConciliar, setPendientesConciliar] = useState<any[]>([]);
  const [historialConciliacion, setHistorialConciliacion] = useState<any[]>([]);
  const [selectedConciliarIds, setSelectedConciliarIds] = useState<Set<string>>(new Set());
  const [referenciaBancaria, setReferenciaBancaria] = useState('');
  const [cSubTab, setCSubTab] = useState<'PENDIENTES' | 'HISTORIAL'>('PENDIENTES');

  // Promesas de Fe y Proyectos
  const [proyectosPromesa, setProyectosPromesa] = useState<any[]>([]);
  const [promesas, setPromesas] = useState<any[]>([]);
  const [showProyectoModal, setShowProyectoModal] = useState(false);
  const [showPromesaModal, setShowPromesaModal] = useState(false);
  const [showAbonoModal, setShowAbonoModal] = useState<string | null>(null);
  
  // Proyecto Form
  const [prId, setPrId] = useState<string | null>(null);
  const [prNombre, setPrNombre] = useState('');
  const [prDesc, setPrDesc] = useState('');
  const [prInstrucciones, setPrInstrucciones] = useState('');
  const [prMeta, setPrMeta] = useState('');
  const [prPromo, setPrPromo] = useState(false);
  const [prInicio, setPrInicio] = useState(new Date().toISOString().substring(0, 10));

  // Presupuestos Ministeriales
  const [presupuestosMin, setPresupuestosMin] = useState<any[]>([]);
  const [pmPeriodoFiltro, setPmPeriodoFiltro] = useState('ANUAL');
  const [pmAnioFiltro, setPmAnioFiltro] = useState(new Date().getFullYear().toString());
  const [presupuestoUpdates, setPresupuestoUpdates] = useState<Record<string, { monto: string, comentarios: string }>>({});

  // Promesa Form
  const [pPersonaId, setPPersonaId] = useState('');
  const [pProyectoId, setPProyectoId] = useState('');
  const [pMonto, setPMonto] = useState('');
  const [pFechaInicio, setPFechaInicio] = useState(new Date().toISOString().substring(0, 10));
  const [pFechaLimite, setPFechaLimite] = useState('');
  const [aMonto, setAMonto] = useState('');
  const [aMetodo, setAMetodo] = useState('EFECTIVO');

  // Contador de Billetes
  const [showContador, setShowContador] = useState(false);
  const [contadorValores, setContadorValores] = useState<Record<number, number>>({
    2000: 0, 1000: 0, 500: 0, 200: 0, 100: 0, 50: 0, 25: 0, 10: 0, 5: 0, 1: 0
  });
  const denominaciones = [2000, 1000, 500, 200, 100, 50, 25, 10, 5, 1];
  const totalContador = denominaciones.reduce((acc, den) => acc + (contadorValores[den] * den), 0);

  // Cajas Principales & Transferencias
  const [diezmoOfrendaSubTab, setDiezmoOfrendaSubTab] = useState<'diezmos' | 'ofrendas'>('diezmos');
  const [ingresoGastoSubTab, setIngresoGastoSubTab] = useState<'ingreso' | 'gasto'>('ingreso');
  const [ministeriosSubTab, setMinisteriosSubTab] = useState<'fondos' | 'presupuestos'>('fondos');
  const [tOfrendaCuentaId, setTOfrendaCuentaId] = useState('');
  const [tCategoria, setTCategoria] = useState('OFRENDA_GENERAL');
  const [showMovimientoModal, setShowMovimientoModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [trOrigenId, setTrOrigenId] = useState('');
  const [trDestinoId, setTrDestinoId] = useState('');
  const [trMonto, setTrMonto] = useState('');
  const [trFecha, setTrFecha] = useState(new Date().toISOString().substring(0, 10));
  const [trDesc, setTrDesc] = useState('');

  const ejecutarTransferencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trOrigenId || !trDestinoId || !trMonto || parseFloat(trMonto) <= 0) {
      alert("Ingresa origen, destino y un monto válido.");
      return;
    }
    if (trOrigenId === trDestinoId) {
      alert("La cuenta de origen y destino no pueden ser iguales.");
      return;
    }

    try {
      const res = await fetch('/api/finanzas/cuentas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transferir_fondos',
          data: {
            cuenta_origen_id: trOrigenId,
            cuenta_destino_id: trDestinoId,
            monto: trMonto,
            fecha: trFecha,
            descripcion: trDesc
          }
        })
      });

      if (res.ok) {
        alert("Transferencia realizada exitosamente.");
        setShowTransferModal(false);
        setTrMonto('');
        setTrDesc('');
        loadCuentas();
        loadDashboard();
      } else {
        const err = await res.json();
        alert(err.error || "Error al transferir");
      }
    } catch (e) {
      alert("Error de conexión");
    }
  };

  useEffect(() => {
    loadDashboard();
    loadMiembros();
  }, []);

  useEffect(() => {
    if (['diezmos', 'diezmos_ofrendas'].includes(activeSubTab)) loadDiezmos();
    if (['ofrendas', 'gastos', 'ministerios', 'diezmos_ofrendas', 'ingresos_gastos', 'reportes'].includes(activeSubTab)) loadCuentas();
    if (activeSubTab === 'nomina') loadEmpleados();
    if (activeSubTab === 'reportes') loadReportes();
    if (activeSubTab === 'conciliacion') loadConciliacion();
    if (activeSubTab === 'promesas') { loadMiembros(); loadPromesas(); loadCuentas(); }
  }, [activeSubTab, rFuente, rFormato, rFechaInicio, rFechaFin]);

  useEffect(() => {
    if (activeSubTab === 'dashboard') loadDashboard();
  }, [activeSubTab, dashPeriodoValor]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finanzas?periodo=${dashPeriodoValor}`);
      const data = await res.json();
      setFinData(data);
      if (data.cuentas) setCuentas(data.cuentas);

      await loadPresupuestosMin(pmPeriodoFiltro, pmAnioFiltro);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadPresupuestosMin = async (periodo: string, anio: string) => {
    try {
      const res = await fetch(`/api/finanzas/presupuestos?periodo=${periodo}&anio=${anio}`);
      const data = await res.json();
      if (!data.error) {
        setPresupuestosMin(data);
        // Inicializar updates state
        const initialUpdates: any = {};
        data.forEach((p: any) => {
          initialUpdates[p.id] = {
            monto: p.monto_aprobado ? p.monto_aprobado.toString() : p.monto_asignado.toString(),
            comentarios: p.comentarios_finanzas || ''
          };
        });
        setPresupuestoUpdates(initialUpdates);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdatePresupuesto = async (id: string, estado: string) => {
    const updateData = presupuestoUpdates[id];
    try {
      const res = await fetch('/api/finanzas/presupuestos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          estado,
          monto_aprobado: parseFloat(updateData.monto) || 0,
          comentarios_finanzas: updateData.comentarios
        })
      });
      if (res.ok) {
        alert(estado === 'APROBADO' ? 'Presupuesto Aprobado' : 'Devuelto para Ajuste');
        loadPresupuestosMin(pmPeriodoFiltro, pmAnioFiltro);
      } else {
        const error = await res.json();
        alert(error.error || 'Error al actualizar');
      }
    } catch (e) {
      alert('Error de red');
    }
  };

  const loadMiembros = async () => {
    try {
      const res = await fetch('/api/miembros');
      const data = await res.json();
      setMiembros(data);
    } catch (e) { console.error(e); }
  };

  const loadDiezmos = async () => {
    try {
      const res = await fetch('/api/finanzas/diezmos');
      setDiezmos(await res.json());
    } catch (e) { console.error(e); }
  };

  const loadCuentas = async () => {
    try {
      const res = await fetch('/api/finanzas/cuentas');
      setCuentas(await res.json());
    } catch (e) { console.error(e); }
  };

  const loadEmpleados = async () => {
    try {
      const res = await fetch('/api/finanzas/nomina');
      setEmpleados(await res.json());
    } catch (e) { console.error(e); }
  };

  const loadReportes = async () => {
    try {
      const res = await fetch(`/api/finanzas/reportes?fuente=${rFuente}&fechaInicio=${rFechaInicio}&fechaFin=${rFechaFin}`);
      setReportes(await res.json());
    } catch (e) { console.error(e); }
  };

  const loadConciliacion = async () => {
    try {
      const res = await fetch('/api/finanzas/conciliacion');
      const data = await res.json();
      if (!data.error) {
        setPendientesConciliar(data.pendientes || []);
        setHistorialConciliacion(data.historial || []);
        setSelectedConciliarIds(new Set());
        setReferenciaBancaria('');
      }
    } catch (e) { console.error(e); }
  };

  const loadPromesas = async () => {
    try {
      const res = await fetch('/api/finanzas/promesas');
      const data = await res.json();
      if (!data.error) setPromesas(data);
    } catch (e) { console.error(e); }
  };

  const loadProyectosPromesa = async () => {
    try {
      const res = await fetch('/api/finanzas/proyectos');
      const data = await res.json();
      if (!data.error) setProyectosPromesa(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (activeSubTab === 'promesas') loadProyectosPromesa();
  }, [activeSubTab]);

  const registrarProyecto = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = prId ? 'PUT' : 'POST';
    const body: any = { nombre: prNombre, descripcion: prDesc, meta_financiera: prMeta, promocionar_hub: prPromo, instrucciones_pago: prInstrucciones, fecha_inicio: prInicio };
    if (prId) body.id = prId;

    const res = await fetch('/api/finanzas/proyectos', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      alert(prId ? "Proyecto actualizado" : "Proyecto registrado");
      setShowProyectoModal(false);
      setPrId(null); setPrNombre(''); setPrDesc(''); setPrInstrucciones(''); setPrMeta(''); setPrPromo(false);
      loadProyectosPromesa();
    }
  };

  const registrarPromesa = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/finanzas/promesas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona_id: pPersonaId, proyecto_id: pProyectoId, monto_promesa: pMonto, fecha_inicio: pFechaInicio, fecha_limite: pFechaLimite })
    });
    if (res.ok) {
      alert("Promesa registrada");
      setShowPromesaModal(false);
      setPProyectoId(''); setPMonto('');
      loadPromesas();
      loadProyectosPromesa();
    }
  };

  const registrarAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAbonoModal) return;
    const res = await fetch('/api/finanzas/promesas/abonos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promesa_id: showAbonoModal, monto: aMonto, metodo_pago: aMetodo, cuenta_fondo_id: tCuentaId })
    });
    if (res.ok) {
      const data = await res.json();
      setShowAbonoModal(null);
      setAMonto('');
      loadPromesas();
      loadDashboard();
      if (confirm("Abono registrado con éxito. ¿Deseas imprimir el recibo ahora?")) {
        imprimirRecibo({...data, tipo: 'INGRESO', descripcion: 'Abono a Promesa'});
      }
    }
  };

  const descargarCSV = () => {
    if (!reportes || (!reportes.transacciones?.length && !reportes.diezmos?.length)) return alert("No hay datos para descargar");
    
    let baseData = [
      ...(reportes.transacciones || []),
      ...(reportes.diezmos || []).map((d: any) => ({
        ...d,
        tipo: 'INGRESO',
        cuenta_fondo: { nombre: 'Diezmo' },
        descripcion: `Diezmo - ${d.persona?.nombre || 'Anónimo'}`
      }))
    ];

    const dataToExport = baseData.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    const headers = ['Fecha', 'Cuenta/Origen', 'Detalle', 'Método Pago', 'Monto', 'Tipo'];
    const rows = dataToExport.map(r => {
      const fecha = new Date(r.fecha).toLocaleDateString();
      const origen = r.cuenta_fondo?.nombre || 'General';
      const detalle = r.descripcion || '-';
      const metodo = r.metodo_pago || 'EFECTIVO';
      const monto = r.monto || 0;
      const tTipo = r.tipo || 'INGRESO';
      return `"${fecha}","${origen}","${detalle}","${metodo}","${monto}","${tTipo}"`;
    });

    let csvHeader = `"${finData?.iglesia?.nombre_iglesia || 'Iglesia Local'}"\n`;
    csvHeader += `""\n"REPORTE FINANCIERO - Desde ${rFechaInicio} Hasta ${rFechaFin} (Formato: ${rFormato})"\n""\n`;

    descargarArchivo(csvHeader + headers.join(',') + '\n' + rows.join('\n'), `Reporte_${rFuente}_${rFechaInicio}_${rFechaFin}.csv`);
  };

  const descargarArchivo = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const imprimirRecibo = (t: any) => {
    const printWindow = window.open('', '_blank', 'width=800,height=800');
    if (!printWindow) return;
    
    const iglesiaNombre = finData?.iglesia?.nombre_iglesia || 'Iglesia Local';
    const iglesiaDireccion = finData?.iglesia?.contacto_direccion || '';
    const iglesiaTel = finData?.iglesia?.contacto_telefono || '';
    const iglesiaLogo = finData?.iglesia?.logo_url || '';

    const html = `
      <html>
        <head>
          <title>Recibo de Transacción</title>
          <style>
            body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 2rem; display: flex; flex-direction: column; align-items: center; }
            .controls { margin-bottom: 2rem; display: flex; gap: 1rem; }
            .btn { padding: 0.75rem 1.5rem; background: #0284c7; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
            
            .ticket-container { background: #fff; border: 1px solid #e2e8f0; padding: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
            
            /* TICKET DE VERIFONE (80mm / aprox 300px) */
            .format-ticket .ticket-container { width: 300px; padding: 1rem; border-radius: 0; font-family: 'Courier New', monospace; font-size: 0.85rem; }
            .format-ticket .header { border-bottom: 1px dashed #000; padding-bottom: 0.5rem; margin-bottom: 1rem; }
            .format-ticket .row.total { border-top: 1px dashed #000; }
            
            /* TAMAÑO CARTA (Letter) */
            .format-carta .ticket-container { width: 100%; max-width: 800px; padding: 3rem; border-radius: 12px; }
            .format-carta .header h1 { font-size: 2rem; }
            
            .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 1rem; margin-bottom: 1.5rem; }
            .header img { max-width: 80px; margin-bottom: 0.5rem; }
            .header h1 { margin: 0 0 0.5rem 0; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 0; color: #64748b; font-size: 0.9rem; }
            .row { display: flex; justify-content: space-between; margin-bottom: 0.8rem; font-size: 0.95rem; }
            .row.total { font-weight: bold; font-size: 1.2rem; border-top: 2px dashed #cbd5e1; padding-top: 1rem; margin-top: 1rem; }
            .footer { text-align: center; margin-top: 2rem; font-size: 0.85rem; color: #64748b; }
            
            @media print {
              body { background: white; padding: 0; display: block; }
              .controls { display: none; }
              .ticket-container { border: none; box-shadow: none; margin: 0; padding: 0; }
              .format-ticket .ticket-container { width: 100%; max-width: 80mm; }
            }
          </style>
        </head>
        <body class="format-ticket">
          <div class="controls">
            <button class="btn" onclick="document.body.className='format-ticket'; window.print()">🖨️ Imprimir Ticket (POS)</button>
            <button class="btn" onclick="document.body.className='format-carta'; window.print()">🖨️ Imprimir Tamaño Carta</button>
          </div>
          <div class="ticket-container">
            <div class="header">
              ${iglesiaLogo ? '<img src="' + iglesiaLogo + '" alt="Logo">' : ''}
              <h1>${iglesiaNombre}</h1>
              ${iglesiaDireccion ? '<p>' + iglesiaDireccion + '</p>' : ''}
              ${iglesiaTel ? '<p>Tel: ' + iglesiaTel + '</p>' : ''}
              <p style="margin-top:0.5rem; font-weight:bold;">Comprobante de ${t.tipo === 'INGRESO' ? 'Ingreso' : 'Egreso'}</p>
            </div>
            <div class="content">
              <div class="row"><span>ID:</span> <span style="font-size: 0.8rem; color: #64748b;">${t.id ? t.id.split('-')[0].toUpperCase() : 'N/A'}</span></div>
              <div class="row"><span>Fecha:</span> <span>${new Date(t.fecha).toLocaleDateString()}</span></div>
              <div class="row"><span>Concepto:</span> <span>${t.descripcion || t.categoria || 'Transacción'}</span></div>
              <div class="row"><span>Método:</span> <span>${t.metodo_pago || 'EFECTIVO'}</span></div>
              <div class="row total">
                <span>TOTAL:</span>
                <span>$${Number(t.monto).toFixed(2)}</span>
              </div>
            </div>
            <div class="footer">
              <p>¡Gracias por su contribución!</p>
              <p>Este documento es un comprobante interno.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const imprimirReporteHtml = (titulo: string, containerId: string) => {
    const el = document.getElementById(containerId);
    if (!el) return alert("No se encontró el contenido a imprimir.");
    
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) return;
    
    const iglesiaNombre = finData?.iglesia?.nombre_iglesia || 'Iglesia Local';
    const iglesiaDireccion = finData?.iglesia?.contacto_direccion || '';
    const iglesiaTel = finData?.iglesia?.contacto_telefono || '';
    const iglesiaLogo = finData?.iglesia?.logo_url || '';

    // Clonar para limpiar botones
    const clone = el.cloneNode(true) as HTMLElement;
    const hideElements = clone.querySelectorAll('button, .no-print');
    hideElements.forEach(e => e.parentNode?.removeChild(e));

    const html = `
      <html>
        <head>
          <title>Reporte - ${titulo}</title>
          <style>
            body { font-family: 'Inter', sans-serif; background: white; color: #0f172a; margin: 0; padding: 2rem; }
            .header { text-align: center; border-bottom: 2px solid #cbd5e1; padding-bottom: 1rem; margin-bottom: 2rem; }
            .header img { max-width: 80px; margin-bottom: 0.5rem; }
            .header h1 { margin: 0 0 0.5rem 0; text-transform: uppercase; letter-spacing: 1px; font-size: 1.5rem; }
            .header p { margin: 0; color: #64748b; font-size: 0.9rem; }
            .report-title { text-align: center; font-size: 1.25rem; font-weight: bold; margin-bottom: 1.5rem; text-transform: uppercase; color: #0284c7; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; font-size: 0.9rem; }
            th, td { border: 1px solid #cbd5e1; padding: 0.75rem; text-align: left; }
            th { background: #f8fafc; font-weight: bold; color: #334155; }
            
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${iglesiaLogo ? '<img src="' + iglesiaLogo + '" alt="Logo">' : ''}
            <h1>${iglesiaNombre}</h1>
            ${iglesiaDireccion ? '<p>' + iglesiaDireccion + '</p>' : ''}
            ${iglesiaTel ? '<p>Tel: ' + iglesiaTel + '</p>' : ''}
          </div>
          <div class="report-title">${titulo}</div>
          <div class="content">
            ${clone.outerHTML}
          </div>
          <script>
            window.onload = () => { window.print(); window.setTimeout(() => window.close(), 500); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const descargarCSVPromesas = (proyectoId?: string) => {
    let dataExport = promesas;
    let nombreArchivo = 'reporte_promesas_todas.csv';
    let tituloReporte = 'REPORTE GENERAL DE PROMESAS DE FE';
    
    if (proyectoId) {
      dataExport = promesas.filter(p => p.proyecto_id === proyectoId);
      const proyecto = proyectosPromesa.find(p => p.id === proyectoId);
      if (proyecto) {
        nombreArchivo = `reporte_promesas_${proyecto.nombre.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;
        tituloReporte = `REPORTE DE PROMESAS - PROYECTO: ${proyecto.nombre.toUpperCase()}`;
      }
    }
    
    if (dataExport.length === 0) return alert("No hay promesas para exportar.");
    
    const headers = ['Proyecto', 'Miembro', 'Fecha Promesa', 'Monto Prometido', 'Monto Aportado', 'Estado'];
    const rows = dataExport.map(p => [
      `"${p.proyecto?.nombre || 'General'}"`,
      `"${p.persona?.nombre || 'Desconocido'}"`,
      new Date(p.fecha_promesa).toLocaleDateString(),
      p.monto_promesa.toFixed(2),
      p.monto_aportado.toFixed(2),
      p.estado
    ]);

    const iglesiaNombre = finData?.iglesia?.nombre_iglesia || 'Iglesia Local';
    const iglesiaDireccion = finData?.iglesia?.contacto_direccion || '';
    const iglesiaTel = finData?.iglesia?.contacto_telefono || '';
    
    let csvHeader = `"${iglesiaNombre}"\n`;
    if (iglesiaDireccion) csvHeader += `"${iglesiaDireccion}"\n`;
    if (iglesiaTel) csvHeader += `"Tel: ${iglesiaTel}"\n`;
    csvHeader += `""\n"${tituloReporte}"\n""\n`;
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + csvHeader
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Actions
  const registrarDiezmo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dPersonaId || !dMonto) return alert("Faltan datos.");
    const res = await fetch('/api/finanzas/diezmos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona_id: dPersonaId, monto: dMonto, fecha: dFecha, metodo_pago: dMetodo, cuenta_fondo_id: dCuentaId || null })
    });
    if (res.ok) {
      const data = await res.json();
      setDMonto('');
      loadDiezmos();
      loadCuentas();
      loadDashboard();
      if (confirm("Diezmo registrado con éxito. ¿Deseas imprimir el recibo ahora?")) {
        imprimirRecibo({...data, tipo: 'INGRESO', descripcion: 'Diezmo - ' + (miembros.find(m => m.id === dPersonaId)?.nombre || 'Anónimo')});
      }
    }
  };

  const crearCuenta = async (e: React.FormEvent, tipoForzada: string) => {
    e.preventDefault();
    if (!cNombre) return;
    const res = await fetch('/api/finanzas/cuentas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'crear_cuenta', data: { nombre: cNombre, tipo: tipoForzada, descripcion: cDesc, balanceInicial: 0 } })
    });
    if (res.ok) {
      setCNombre(''); setCDesc(''); loadCuentas();
    }
  };

  const editarCuenta = async (cuenta: any) => {
    const nuevoNombre = prompt("Nombre de la cuenta:", cuenta.nombre);
    if (nuevoNombre === null || !nuevoNombre.trim()) return;
    const nuevaDesc = prompt("Descripción:", cuenta.descripcion || '');
    if (nuevaDesc === null) return;

    let nuevoTipo = cuenta.tipo;
    if (!['CAJA_CHICA', 'CAJA_GENERAL', 'BANCO'].includes(cuenta.tipo)) {
      const tipoOpt = prompt("Categoría de la cuenta:\n1 = Ofrenda\n2 = Gasto / Egreso\n3 = Fondo Ministerial", cuenta.tipo === 'OFRENDA' ? '1' : cuenta.tipo === 'GASTO' ? '2' : '3');
      if (tipoOpt === '1') nuevoTipo = 'OFRENDA';
      else if (tipoOpt === '2') nuevoTipo = 'GASTO';
      else if (tipoOpt === '3') nuevoTipo = 'DEPARTAMENTO';
    }

    const res = await fetch('/api/finanzas/cuentas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'editar_cuenta', data: { id: cuenta.id, nombre: nuevoNombre.trim(), descripcion: nuevaDesc, tipo: nuevoTipo } })
    });
    if (res.ok) {
      loadCuentas();
    }
  };

  const eliminarCuenta = async (cuenta: any) => {
    if (['CAJA_CHICA', 'CAJA_GENERAL', 'BANCO'].includes(cuenta.tipo) ||
        ['caja chica', 'caja general', 'caja de banco'].includes(cuenta.nombre.toLowerCase())) {
      return alert("No se pueden eliminar las Cajas Contables principales.");
    }
    if (!confirm(`¿Seguro que deseas eliminar la cuenta "${cuenta.nombre}"? Se borrará la cuenta y sus transacciones.`)) return;

    const res = await fetch('/api/finanzas/cuentas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'eliminar_cuenta', data: { id: cuenta.id } })
    });
    if (res.ok) {
      loadCuentas();
      loadDashboard();
    } else {
      const err = await res.json();
      alert("Error al eliminar la cuenta: " + (err.error || 'Desconocido'));
    }
  };

  const registrarTransaccion = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetCuentaId = tOfrendaCuentaId || tCuentaId;
    if (!targetCuentaId || !tMonto) return alert("Selecciona la cuenta y el monto");

    const res = await fetch('/api/finanzas/cuentas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'registrar_transaccion',
        data: {
          cuenta_fondo_id: targetCuentaId,
          caja_fisica_id: tCuentaId,
          tipo: tTipoTransaccion,
          monto: parseFloat(tMonto),
          fecha: tFecha,
          descripcion: tDesc,
          metodo_pago: tMetodoPago
        }
      })
    });
    if (res.ok) {
      const data = await res.json();
      setTMonto(''); setTDesc(''); setTOfrendaCuentaId(''); loadCuentas(); loadDashboard();
      if (confirm("Transacción registrada con éxito. ¿Deseas imprimir el recibo ahora?")) {
        imprimirRecibo(data[0] || data);
      }
    }
  };

  const eliminarTransaccion = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta transacción? Se revertirá el balance de la cuenta.")) return;
    const res = await fetch('/api/finanzas/cuentas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'eliminar_transaccion', data: { id } })
    });
    if (res.ok) {
      loadCuentas(); loadDashboard();
    } else {
      alert("Error al eliminar");
    }
  };

  const pagarNomina = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("¿Ejecutar pago de nómina para todos los empleados activos?")) return;
    const empleadosIds = empleados.map(e => e.id);
    const res = await fetch('/api/finanzas/nomina', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'pagar_nomina',
        data: { empleadosIds, cuenta_fondo_id: tCuentaId || null, fecha: new Date().toISOString() }
      })
    });
    if (res.ok) {
      alert("Nómina pagada con éxito.");
      loadDashboard();
    }
  };
  const totalSeleccionadoConciliacion = pendientesConciliar
    .filter(t => selectedConciliarIds.has(t.id))
    .reduce((acc, t) => acc + (t.tipo === 'INGRESO' ? t.monto : -t.monto), 0);

  const aplicarConciliacion = async () => {
    if (selectedConciliarIds.size === 0) return alert("Selecciona al menos una transacción");
    if (!confirm(`¿Confirmas que el monto neto de $${totalSeleccionadoConciliacion.toFixed(2)} ya está en la cuenta del banco?`)) return;

    try {
      const res = await fetch('/api/finanzas/conciliacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transaccionesIds: Array.from(selectedConciliarIds),
          referencia_bancaria: referenciaBancaria
        })
      });
      if (res.ok) {
        alert("Transacciones conciliadas exitosamente");
        loadConciliacion();
        loadDashboard();
      } else {
        alert("Error al conciliar");
      }
    } catch (e) {
      console.error(e);
      alert("Error al conciliar");
    }
  };
  // Calculos Dashboard Consolidado
  const { chartData, consolidadoData, totalIngresos, totalEgresos, granBalance } = useMemo(() => {
    if (!finData || !finData.transaccionesPeriodo) return { chartData: [], consolidadoData: [], totalIngresos: 0, totalEgresos: 0, granBalance: 0 };
    
    const trx = finData.transaccionesPeriodo || [];
    const diezmos = finData.diezmosPeriodo || [];
    
    // CHART DATA
    const isMes = dashPeriodoValor.includes('-') && dashPeriodoValor.split('-').length === 2 && !dashPeriodoValor.includes('Q') && !dashPeriodoValor.includes('S');
    const chartMap = new Map();
    
    const allData = [
      ...trx,
      ...diezmos.map((d: any) => ({ ...d, tipo: 'INGRESO' }))
    ];

    allData.forEach(item => {
      const d = new Date(item.fecha);
      let key = '';
      if (isMes) {
        key = d.getDate().toString().padStart(2, '0');
      } else {
        key = (d.getMonth() + 1).toString().padStart(2, '0');
      }
      
      if (!chartMap.has(key)) {
        chartMap.set(key, { name: key, ingresos: 0, egresos: 0 });
      }
      
      const val = chartMap.get(key);
      if (item.tipo === 'INGRESO') val.ingresos += item.monto;
      else if (item.tipo === 'EGRESO') val.egresos += item.monto;
    });

    const finalChartData = Array.from(chartMap.values()).sort((a, b) => a.name.localeCompare(b.name)).map(d => {
      if (!isMes) {
        const m = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        return { ...d, name: m[parseInt(d.name) - 1] };
      }
      return d;
    });

    // TABLE DATA (Consolidado)
    const tableMap = new Map();
    tableMap.set('Diezmos', { cuenta: 'Diezmos', ingresos: 0, egresos: 0, balance: 0, tipo: 'DIEZMO' });
    
    diezmos.forEach((d: any) => {
      const val = tableMap.get('Diezmos');
      val.ingresos += d.monto;
      val.balance += d.monto;
    });

    trx.forEach((t: any) => {
      const nombreCuenta = t.cuenta_fondo?.nombre || 'General';
      const tipoCuenta = t.cuenta_fondo?.tipo || 'GENERAL';
      
      if (!tableMap.has(nombreCuenta)) {
        tableMap.set(nombreCuenta, { cuenta: nombreCuenta, ingresos: 0, egresos: 0, balance: 0, tipo: tipoCuenta });
      }
      
      const val = tableMap.get(nombreCuenta);
      if (t.tipo === 'INGRESO') {
        val.ingresos += t.monto;
        val.balance += t.monto;
      } else {
        val.egresos += t.monto;
        val.balance -= t.monto;
      }
    });

    const finalTableData = Array.from(tableMap.values()).sort((a, b) => {
      if (a.tipo === 'DIEZMO') return -1;
      if (b.tipo === 'DIEZMO') return 1;
      return b.balance - a.balance;
    });
    
    const tIngresos = finalTableData.reduce((acc, row) => acc + row.ingresos, 0);
    const tEgresos = finalTableData.reduce((acc, row) => acc + row.egresos, 0);
    const gBalance = finalTableData.reduce((acc, row) => acc + row.balance, 0);

    return { chartData: finalChartData, consolidadoData: finalTableData, totalIngresos: tIngresos, totalEgresos: tEgresos, granBalance: gBalance };
  }, [finData, dashPeriodoValor]);

  if (loading && !finData) return <p style={{ color: '#64748b' }}>Cargando módulo de finanzas...</p>;
  if (finData?.error) return <div style={{ color: 'red', padding: '2rem' }}>{finData.error}</div>;

  return (
    <div style={{ padding: '0' }}>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem', borderBottom: '2px solid #e2e8f0' }}>
        {[
          { id: 'dashboard', label: '📊 Dashboard' },
          { id: 'diezmos_ofrendas', label: '🤲 Diezmos y Ofrendas' },
          { id: 'ingresos_gastos', label: '⚖️ Ingresos y Gastos' },
          { id: 'ministerios', label: '🏛️ Fondos Ministeriales' },
          { id: 'nomina', label: '👥 Nómina' },
          { id: 'promesas', label: '🌟 Promesas de Fe' },
          { id: 'conciliacion', label: '🏦 Conciliación Bancaria' },
          { id: 'reportes', label: '📑 Reportes' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => {
              setActiveSubTab(tab.id);
              if (tab.id === 'diezmos_ofrendas') {
                loadDiezmos();
                loadCuentas();
              } else if (tab.id === 'ingresos_gastos') {
                loadCuentas();
                if (ingresoGastoSubTab === 'gasto') setTTipoTransaccion('EGRESO');
                else setTTipoTransaccion('INGRESO');
              } else if (tab.id === 'ministerios') {
                loadCuentas();
                loadPresupuestosMin(pmPeriodoFiltro, pmAnioFiltro);
              }
            }}
            style={{
              padding: '0.5rem 1rem', border: 'none',
              background: activeSubTab === tab.id ? '#0284c7' : 'transparent',
              color: activeSubTab === tab.id ? 'white' : '#64748b',
              borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DASHBOARD */}
      {activeSubTab === 'dashboard' && (
        <div id="dashboard-reporte">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              #dashboard-reporte, #dashboard-reporte * { visibility: visible; }
              #dashboard-reporte { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
              .no-print { display: none !important; }
              .print-only { display: block !important; }
              .print-card-green { background-color: #f0fdf4 !important; border-color: #bbf7d0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .print-card-red { background-color: #fef2f2 !important; border-color: #fecaca !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .print-card-blue { background-color: #f0f9ff !important; border-color: #bae6fd !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          `}</style>
          
          <div className="print-only" style={{ display: 'none', textAlign: 'center', borderBottom: '2px solid #cbd5e1', paddingBottom: '1rem', marginBottom: '2rem' }}>
            {finData?.iglesia?.logo_url && <img src={finData.iglesia.logo_url} alt="Logo" style={{ maxWidth: '80px', marginBottom: '0.5rem' }} />}
            <h1 style={{ margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '1.5rem', color: '#0f172a' }}>{finData?.iglesia?.nombre_iglesia || 'Iglesia Local'}</h1>
            {finData?.iglesia?.contacto_direccion && <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{finData.iglesia.contacto_direccion}</p>}
            {finData?.iglesia?.contacto_telefono && <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Tel: {finData.iglesia.contacto_telefono}</p>}
            <h2 style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold', margin: '1.5rem 0 0 0', textTransform: 'uppercase', color: '#0284c7' }}>
              Reporte Consolidado ({dashPeriodoValor})
            </h2>
          </div>

          {/* Filtros de Periodo */}
          <div className="no-print" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Ver Datos Por:</label>
              <select value={dashPeriodoValor} onChange={(e) => setDashPeriodoValor(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <optgroup label="Anual">
                  <option value="2026">Año 2026</option>
                  <option value="2025">Año 2025</option>
                </optgroup>
                <optgroup label="Trimestres 2026">
                  <option value="2026-Q1">Q1 (Ene-Mar)</option>
                  <option value="2026-Q2">Q2 (Abr-Jun)</option>
                  <option value="2026-Q3">Q3 (Jul-Sep)</option>
                  <option value="2026-Q4">Q4 (Oct-Dic)</option>
                </optgroup>
                <optgroup label="Semestres 2026">
                  <option value="2026-S1">Semestre 1</option>
                  <option value="2026-S2">Semestre 2</option>
                </optgroup>
                <optgroup label="Meses 2026">
                  <option value="2026-01">Enero</option>
                  <option value="2026-02">Febrero</option>
                  <option value="2026-03">Marzo</option>
                  <option value="2026-04">Abril</option>
                  <option value="2026-05">Mayo</option>
                  <option value="2026-06">Junio</option>
                  <option value="2026-07">Julio</option>
                  <option value="2026-08">Agosto</option>
                  <option value="2026-09">Septiembre</option>
                  <option value="2026-10">Octubre</option>
                  <option value="2026-11">Noviembre</option>
                  <option value="2026-12">Diciembre</option>
                </optgroup>
              </select>
            </div>
            <button onClick={loadDashboard} style={{ padding: '0.5rem 1rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
              Actualizar
            </button>
            <button onClick={() => window.print()} style={{ padding: '0.5rem 1rem', background: 'white', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🖨️ Imprimir
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="print-card-green" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1.5rem' }}>
              <h3 style={{ color: '#166534', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Ingresos del Periodo</h3>
              <p style={{ fontSize: '2.2rem', fontWeight: 800, color: '#15803d', margin: 0 }}>${finData?.ingresosMes?.toFixed(2)}</p>
            </div>
            <div className="print-card-red" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '1.5rem' }}>
              <h3 style={{ color: '#991b1b', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Egresos del Periodo</h3>
              <p style={{ fontSize: '2.2rem', fontWeight: 800, color: '#dc2626', margin: 0 }}>${finData?.egresosMes?.toFixed(2)}</p>
            </div>
            <div className="print-card-blue" style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '1.5rem' }}>
              <h3 style={{ color: '#075985', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Balance Cuentas Total</h3>
              <p style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0369a1', margin: 0 }}>${finData?.balanceGeneral?.toFixed(2)}</p>
            </div>
          </div>

          {/* SECCIÓN DE TRES CAJAS CONTABLES PRINCIPALES */}
          {(() => {
            const listaCuentas = finData?.cuentas || cuentas || [];
            const cajaChica = listaCuentas.find((c: any) => c.nombre.toLowerCase().includes('chica') || c.tipo === 'CAJA_CHICA');
            const cajaGeneral = listaCuentas.find((c: any) => c.nombre.toLowerCase().includes('general') || c.tipo === 'CAJA_GENERAL');
            const cajaBanco = listaCuentas.find((c: any) => c.nombre.toLowerCase().includes('banco') || c.tipo === 'BANCO');

            return (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    🏛️ Cuentas y Cajas Contables Principales
                  </h3>
                  <button
                    onClick={() => {
                      setTrOrigenId(cajaChica?.id || '');
                      setTrDestinoId(cajaGeneral?.id || '');
                      setShowTransferModal(true);
                    }}
                    style={{ background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: '8px', padding: '0.4rem 0.85rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    🔄 Nueva Transferencia Entre Cajas
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  
                  {/* CAJA CHICA */}
                  <div style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 800, color: '#0369a1', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          💵 Caja Chica
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: '#e0f2fe', color: '#0284c7' }}>
                          Entradas / Salidas Diarias
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>
                        Para entradas diarias, asignaciones rápidas y gastos menores.
                      </p>
                      <p style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        ${(cajaChica?.balance || 0).toFixed(2)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => {
                          setTCuentaId(cajaChica?.id || '');
                          setTTipoTransaccion('INGRESO');
                          setShowMovimientoModal(true);
                        }}
                        style={{ flex: 1, padding: '0.45rem 0.5rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        + Ingreso
                      </button>
                      <button
                        onClick={() => {
                          setTCuentaId(cajaChica?.id || '');
                          setTTipoTransaccion('EGRESO');
                          setShowMovimientoModal(true);
                        }}
                        style={{ flex: 1, padding: '0.45rem 0.5rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        - Gasto
                      </button>
                      <button
                        onClick={() => {
                          setTrOrigenId(cajaChica?.id || '');
                          setTrDestinoId(cajaGeneral?.id || '');
                          setShowTransferModal(true);
                        }}
                        style={{ width: '100%', padding: '0.45rem 0.5rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        🔄 Transferir a Caja General / Banco
                      </button>
                    </div>
                  </div>

                  {/* CAJA GENERAL */}
                  <div style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 800, color: '#15803d', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          🏛️ Caja General
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: '#dcfce7', color: '#166534' }}>
                          Fondo Central
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>
                        Resguardo central de fondos recolectados y traslados.
                      </p>
                      <p style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        ${(cajaGeneral?.balance || 0).toFixed(2)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => {
                          setTCuentaId(cajaGeneral?.id || '');
                          setTTipoTransaccion('INGRESO');
                          setShowMovimientoModal(true);
                        }}
                        style={{ flex: 1, padding: '0.45rem 0.5rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        + Ingreso
                      </button>
                      <button
                        onClick={() => {
                          setTCuentaId(cajaGeneral?.id || '');
                          setTTipoTransaccion('EGRESO');
                          setShowMovimientoModal(true);
                        }}
                        style={{ flex: 1, padding: '0.45rem 0.5rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        - Gasto
                      </button>
                      <button
                        onClick={() => {
                          setTrOrigenId(cajaGeneral?.id || '');
                          setTrDestinoId(cajaBanco?.id || '');
                          setShowTransferModal(true);
                        }}
                        style={{ width: '100%', padding: '0.45rem 0.5rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        🔄 Depósito a Banco / Caja Chica
                      </button>
                    </div>
                  </div>

                  {/* CAJA DE BANCO */}
                  <div style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 800, color: '#6b21a8', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          🏦 Caja de Banco
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: '#f3e8ff', color: '#7e22ce' }}>
                          Banco & Transferencias
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>
                        Recepción de depósitos bancarios y transferencias.
                      </p>
                      <p style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        ${(cajaBanco?.balance || 0).toFixed(2)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => {
                          setTCuentaId(cajaBanco?.id || '');
                          setTTipoTransaccion('INGRESO');
                          setTMetodoPago('TRANSFERENCIA');
                          setShowMovimientoModal(true);
                        }}
                        style={{ flex: 1, padding: '0.45rem 0.5rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        + Depósito
                      </button>
                      <button
                        onClick={() => {
                          setTCuentaId(cajaBanco?.id || '');
                          setTTipoTransaccion('EGRESO');
                          setTMetodoPago('TRANSFERENCIA');
                          setShowMovimientoModal(true);
                        }}
                        style={{ flex: 1, padding: '0.45rem 0.5rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        - Pago Banco
                      </button>
                      <button
                        onClick={() => {
                          setTrOrigenId(cajaBanco?.id || '');
                          setTrDestinoId(cajaGeneral?.id || '');
                          setShowTransferModal(true);
                        }}
                        style={{ width: '100%', padding: '0.45rem 0.5rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        🔄 Transferir a Caja General / Chica
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })()}

          {/* GRÁFICOS */}
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#0f172a' }}>Evolución Financiera</h3>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `$${val}`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <Tooltip 
                    formatter={(value: any) => [`$${Number(value || 0).toFixed(2)}`, '']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" fillOpacity={1} fill="url(#colorIngresos)" />
                  <Area type="monotone" dataKey="egresos" name="Egresos" stroke="#ef4444" fillOpacity={1} fill="url(#colorEgresos)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRÁFICOS DE PASTEL */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#15803d', textTransform: 'uppercase', fontSize: '0.9rem' }}>Distribución de Ingresos</h4>
              <div style={{ width: '100%', height: 250 }}>
                {(() => {
                  const pieIngresos = consolidadoData.filter((r:any) => r.ingresos > 0).map((r:any) => ({ name: r.cuenta, value: r.ingresos }));
                  if (pieIngresos.length === 0) return <div style={{ paddingTop: '100px', color: '#94a3b8' }}>Sin datos de ingresos</div>;
                  return (
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={pieIngresos} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {pieIngresos.map((entry:any, index:number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value: any) => `$${Number(value || 0).toFixed(2)}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#dc2626', textTransform: 'uppercase', fontSize: '0.9rem' }}>Distribución de Egresos</h4>
              <div style={{ width: '100%', height: 250 }}>
                {(() => {
                  const pieEgresos = consolidadoData.filter((r:any) => r.egresos > 0).map((r:any) => ({ name: r.cuenta, value: r.egresos }));
                  if (pieEgresos.length === 0) return <div style={{ paddingTop: '100px', color: '#94a3b8' }}>Sin datos de egresos</div>;
                  return (
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={pieEgresos} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {pieEgresos.map((entry:any, index:number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value: any) => `$${Number(value || 0).toFixed(2)}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* TABLA CONSOLIDADA */}
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#0f172a' }}>Consolidado por Cuentas</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#64748b' }}>Cuenta / Categoría</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', color: '#64748b' }}>Ingresos</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', color: '#64748b' }}>Egresos</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', color: '#64748b' }}>Balance del Periodo</th>
                </tr>
              </thead>
              <tbody>
                {consolidadoData.map((row: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600, color: row.tipo === 'DIEZMO' ? '#0284c7' : '#0f172a' }}>
                      {row.cuenta}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#15803d', fontWeight: 500 }}>
                      ${row.ingresos.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#dc2626', fontWeight: 500 }}>
                      ${row.egresos.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: row.balance >= 0 ? '#0f172a' : '#ef4444' }}>
                      ${row.balance.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {consolidadoData.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>No hay transacciones en este periodo.</td>
                  </tr>
                )}
              </tbody>
              {consolidadoData.length > 0 && (
                <tfoot>
                  <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1' }}>
                    <td style={{ padding: '1rem 0.75rem', fontWeight: 800, color: '#0f172a' }}>GRAN TOTAL</td>
                    <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: 800, color: '#15803d' }}>${totalIngresos.toFixed(2)}</td>
                    <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>${totalEgresos.toFixed(2)}</td>
                    <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: 800, color: granBalance >= 0 ? '#0f172a' : '#ef4444' }}>${granBalance.toFixed(2)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          
          <div className="no-print" style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#0f172a' }}>Últimos Movimientos Históricos</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#64748b' }}>Fecha</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#64748b' }}>Tipo</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#64748b' }}>Descripción</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', color: '#64748b' }}>Monto</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', color: '#64748b' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {finData?.transaccionesRecientes?.map((t: any) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem' }}>{new Date(t.fecha).toLocaleDateString()}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: t.tipo === 'INGRESO' ? '#dcfce7' : '#fee2e2', color: t.tipo === 'INGRESO' ? '#15803d' : '#dc2626' }}>
                        {t.tipo}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{t.descripcion || 'Sin descripción'} <span style={{color: '#94a3b8', fontSize: '0.8rem'}}>({t.cuenta_fondo?.nombre})</span></td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: t.tipo === 'INGRESO' ? '#16a34a' : '#dc2626' }}>${t.monto.toFixed(2)}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button onClick={() => imprimirRecibo(t)} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }} title="Imprimir Recibo">
                        🖨️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!finData?.transaccionesRecientes || finData.transaccionesRecientes.length === 0) && <p style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem' }}>No hay transacciones recientes.</p>}
          </div>
        </div>
      )}

      {/* PESTAÑA COMBINADA: DIEZMOS Y OFRENDAS */}
      {activeSubTab === 'diezmos_ofrendas' && (() => {
        const listaCuentas = finData?.cuentas || cuentas || [];
        const cajasFisicas = listaCuentas.filter((c: any) => 
          c.tipo === 'CAJA_CHICA' || c.tipo === 'CAJA_GENERAL' || c.tipo === 'BANCO' ||
          c.nombre.toLowerCase() === 'caja chica' || c.nombre.toLowerCase() === 'caja general' || c.nombre.toLowerCase() === 'caja de banco'
        );
        const cuentasOfrendas = cuentas.filter(c => c.tipo === 'OFRENDA');

        return (
          <div>
            {/* BOTONES DE ALTERNANCIA SUPERIOR */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', background: '#f1f5f9', padding: '0.4rem', borderRadius: '12px', width: 'fit-content' }}>
              <button
                type="button"
                onClick={() => setDiezmoOfrendaSubTab('diezmos')}
                style={{
                  padding: '0.5rem 1.25rem', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                  background: diezmoOfrendaSubTab === 'diezmos' ? '#0284c7' : 'transparent',
                  color: diezmoOfrendaSubTab === 'diezmos' ? 'white' : '#475569',
                  boxShadow: diezmoOfrendaSubTab === 'diezmos' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                💵 Registro de Diezmos
              </button>
              <button
                type="button"
                onClick={() => {
                  setDiezmoOfrendaSubTab('ofrendas');
                  setTTipoTransaccion('INGRESO');
                }}
                style={{
                  padding: '0.5rem 1.25rem', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                  background: diezmoOfrendaSubTab === 'ofrendas' ? '#16a34a' : 'transparent',
                  color: diezmoOfrendaSubTab === 'ofrendas' ? 'white' : '#475569',
                  boxShadow: diezmoOfrendaSubTab === 'ofrendas' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                🎁 Registro de Ofrendas
              </button>
            </div>

            {/* SECCIÓN DIEZMOS */}
            {diezmoOfrendaSubTab === 'diezmos' && (
              <div>
                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', color: '#0f172a' }}>Registrar Diezmo</h3>
                  <form onSubmit={registrarDiezmo} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1 1 200px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Miembro</label>
                      <select required value={dPersonaId} onChange={e=>setDPersonaId(e.target.value)} style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                        <option value="">Seleccionar...</option>
                        {miembros.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: '1 1 120px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Monto</label>
                      <div style={{ display: 'flex', gap: '0.2rem' }}>
                        <input required type="number" step="0.01" value={dMonto} onChange={e=>setDMonto(e.target.value)} style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px 0 0 8px' }} />
                        <button type="button" onClick={() => setShowContador(true)} style={{ padding: '0 0.75rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: '0 8px 8px 0', cursor: 'pointer', fontWeight: 'bold' }} title="Contador de Dinero">
                          🧮
                        </button>
                      </div>
                    </div>
                    <div style={{ flex: '1 1 140px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>📅 Fecha</label>
                      <input required type="date" value={dFecha} onChange={e=>setDFecha(e.target.value)} style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                    </div>
                    <div style={{ flex: '1 1 200px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Caja Destino (Acreditar)</label>
                      <select 
                        value={dCuentaId} 
                        onChange={e => setDCuentaId(e.target.value)} 
                        style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white' }}
                      >
                        <option value="">-- Auto según Método --</option>
                        {cajasFisicas.map((c: any) => {
                          const icon = c.nombre.toLowerCase().includes('chica') ? '💵 ' : c.nombre.toLowerCase().includes('general') ? '🏛️ ' : '🏦 ';
                          return (
                            <option key={c.id} value={c.id}>
                              {icon}{c.nombre} (${c.balance.toFixed(2)})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div style={{ flex: '1 1 140px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Método de Pago</label>
                      <select 
                        value={dMetodo} 
                        onChange={e => {
                          const val = e.target.value;
                          setDMetodo(val);
                          if (val === 'TRANSFERENCIA') {
                            const banco = cajasFisicas.find((c: any) => c.nombre.toLowerCase().includes('banco') || c.tipo === 'BANCO');
                            if (banco) setDCuentaId(banco.id);
                          }
                        }} 
                        style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                      >
                        <option value="EFECTIVO">💵 Efectivo</option>
                        <option value="TRANSFERENCIA">🏦 Transferencia (Ir a Banco)</option>
                        <option value="CHEQUE">📜 Cheque</option>
                      </select>
                    </div>
                    <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Registrar Diezmo</button>
                  </form>
                </div>
              
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
                  <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#475569' }}>Fecha</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#475569' }}>Miembro</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#475569' }}>Monto</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#475569' }}>Método</th>
                      <th style={{ padding: '1rem', textAlign: 'center', color: '#475569' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diezmos.map(d => (
                      <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem' }}>{new Date(d.fecha).toLocaleDateString()}</td>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>{d.persona?.nombre || 'Anónimo'}</td>
                        <td style={{ padding: '1rem', color: '#0284c7', fontWeight: 700 }}>${d.monto.toFixed(2)}</td>
                        <td style={{ padding: '1rem' }}>{d.metodo_pago}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <button onClick={() => imprimirRecibo({...d, tipo: 'INGRESO', descripcion: 'Diezmo - ' + (d.persona?.nombre || 'Anónimo')})} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }} title="Imprimir Recibo">
                            🖨️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SECCIÓN OFRENDAS */}
            {diezmoOfrendaSubTab === 'ofrendas' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Registrar Ofrenda</h3>
                    <form onSubmit={registrarTransaccion} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Cuenta de Ofrenda (Concepto)</label>
                      <select required value={tOfrendaCuentaId} onChange={e=>setTOfrendaCuentaId(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white', fontWeight: 600 }}>
                        <option value="">-- Seleccionar Cuenta de Ofrenda --</option>
                        {cuentasOfrendas.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            🎁 {c.nombre} (${c.balance.toFixed(2)})
                          </option>
                        ))}
                      </select>

                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Caja Contable (Destino Físico)</label>
                      <select required value={tCuentaId} onChange={e=>setTCuentaId(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white', fontWeight: 600 }}>
                        <option value="">-- Seleccionar Caja Contable --</option>
                        {cajasFisicas.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre.toLowerCase().includes('chica') ? '💵 ' : c.nombre.toLowerCase().includes('general') ? '🏛️ ' : '🏦 '}
                            {c.nombre} (${c.balance.toFixed(2)})
                          </option>
                        ))}
                      </select>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <div style={{ flex: 1, display: 'flex', gap: '0.2rem' }}>
                          <input required type="number" step="0.01" placeholder="Monto ($)" value={tMonto} onChange={e=>setTMonto(e.target.value)} style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px 0 0 8px' }} />
                          <button type="button" onClick={() => setShowContador(true)} style={{ padding: '0 0.75rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: '0 8px 8px 0', cursor: 'pointer', fontWeight: 'bold' }} title="Contador de Dinero">
                            🧮
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select required value={tMetodoPago} onChange={e=>{
                          const val = e.target.value;
                          setTMetodoPago(val);
                          if (val === 'TRANSFERENCIA') {
                            const banco = cajasFisicas.find((c: any) => c.nombre.toLowerCase().includes('banco') || c.tipo === 'BANCO');
                            if (banco) setTCuentaId(banco.id);
                          }
                        }} style={{ flex: 1, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                          <option value="EFECTIVO">💵 Efectivo</option>
                          <option value="TRANSFERENCIA">🏦 Transferencia (Ir a Banco)</option>
                          <option value="TARJETA">💳 Tarjeta</option>
                          <option value="CHEQUE">📜 Cheque</option>
                        </select>
                        <input required type="date" value={tFecha} onChange={e=>setTFecha(e.target.value)} style={{ flex: 1, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                      </div>

                      <input placeholder="Descripción / Detalle (Ej: Ofrenda Culto Dominical...)" value={tDesc} onChange={e=>setTDesc(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                      <button type="submit" style={{ padding: '0.65rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700 }}>Registrar Ofrenda</button>
                    </form>
                  </div>

                  <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Crear Nueva Cuenta de Ofrenda</h3>
                    <form onSubmit={e => crearCuenta(e, 'OFRENDA')} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <input required placeholder="Nombre (Ej: Ofrenda Misionera, Pro-Templo...)" value={cNombre} onChange={e=>setCNombre(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                      <input placeholder="Descripción breve" value={cDesc} onChange={e=>setCDesc(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                      <button type="submit" style={{ padding: '0.65rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700 }}>+ Crear Cuenta de Ofrenda</button>
                    </form>
                  </div>
                </div>

                {/* Lista de Cuentas de Ofrenda */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {cuentasOfrendas.map(c => (
                    <div key={c.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          🎁 {c.nombre}
                          <button onClick={() => editarCuenta(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#0284c7' }}>✏️ Editar</button>
                          <button onClick={() => eliminarCuenta(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#dc2626' }}>🗑️ Borrar</button>
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{c.descripcion || 'Sin descripción'}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Balance Recaudado</p>
                        <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: c.balance >= 0 ? '#16a34a' : '#dc2626' }}>${c.balance.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                  {cuentasOfrendas.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', border: '1px dashed #cbd5e1', borderRadius: '12px', background: 'white' }}>
                      No hay cuentas de ofrenda creadas aún. Puedes crear una a la izquierda.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* PESTAÑA COMBINADA: INGRESOS Y GASTOS */}
      {activeSubTab === 'ingresos_gastos' && (() => {
        const listaCuentas = finData?.cuentas || cuentas || [];
        const cajasFisicas = listaCuentas.filter((c: any) => 
          c.tipo === 'CAJA_CHICA' || c.tipo === 'CAJA_GENERAL' || c.tipo === 'BANCO' ||
          c.nombre.toLowerCase() === 'caja chica' || c.nombre.toLowerCase() === 'caja general' || c.nombre.toLowerCase() === 'caja de banco'
        );

        const tipoFiltrado = ingresoGastoSubTab === 'ingreso' ? 'OFRENDA' : 'GASTO';
        const filtradas = cuentas.filter(c => c.tipo === tipoFiltrado);

        return (
          <div>
            {/* BOTONES DE ALTERNANCIA SUPERIOR */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', background: '#f1f5f9', padding: '0.4rem', borderRadius: '12px', width: 'fit-content' }}>
              <button
                type="button"
                onClick={() => {
                  setIngresoGastoSubTab('ingreso');
                  setTTipoTransaccion('INGRESO');
                }}
                style={{
                  padding: '0.5rem 1.25rem', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                  background: ingresoGastoSubTab === 'ingreso' ? '#16a34a' : 'transparent',
                  color: ingresoGastoSubTab === 'ingreso' ? 'white' : '#475569',
                  boxShadow: ingresoGastoSubTab === 'ingreso' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                💰 Registro de Ingresos / Entradas
              </button>
              <button
                type="button"
                onClick={() => {
                  setIngresoGastoSubTab('gasto');
                  setTTipoTransaccion('EGRESO');
                }}
                style={{
                  padding: '0.5rem 1.25rem', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                  background: ingresoGastoSubTab === 'gasto' ? '#dc2626' : 'transparent',
                  color: ingresoGastoSubTab === 'gasto' ? 'white' : '#475569',
                  boxShadow: ingresoGastoSubTab === 'gasto' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                📉 Registro de Gastos / Salidas
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
              {/* Panel Izquierdo: Registrar Transacción / Crear Cuenta */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: ingresoGastoSubTab === 'ingreso' ? '#15803d' : '#b91c1c' }}>
                    {ingresoGastoSubTab === 'ingreso' ? '💰 Registrar Nuevo Ingreso' : '📉 Registrar Nuevo Gasto'}
                  </h3>
                  <form onSubmit={registrarTransaccion} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Caja Contable (Origen/Destino)</label>
                    <select required value={tCuentaId} onChange={e=>setTCuentaId(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white', fontWeight: 600 }}>
                      <option value="">-- Seleccionar Caja Contable --</option>
                      {cajasFisicas.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre.toLowerCase().includes('chica') ? '💵 ' : c.nombre.toLowerCase().includes('general') ? '🏛️ ' : '🏦 '}
                          {c.nombre} (${c.balance.toFixed(2)})
                        </option>
                      ))}
                    </select>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div style={{ flex: 1, display: 'flex', gap: '0.2rem' }}>
                        <input required type="number" step="0.01" placeholder="Monto ($)" value={tMonto} onChange={e=>setTMonto(e.target.value)} style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px 0 0 8px' }} />
                        <button type="button" onClick={() => setShowContador(true)} style={{ padding: '0 0.75rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: '0 8px 8px 0', cursor: 'pointer', fontWeight: 'bold' }} title="Contador de Dinero">
                          🧮
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select required value={tMetodoPago} onChange={e=>{
                        const val = e.target.value;
                        setTMetodoPago(val);
                        if (val === 'TRANSFERENCIA') {
                          const banco = cajasFisicas.find((c: any) => c.nombre.toLowerCase().includes('banco') || c.tipo === 'BANCO');
                          if (banco) setTCuentaId(banco.id);
                        }
                      }} style={{ flex: 1, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                        <option value="EFECTIVO">💵 Efectivo</option>
                        <option value="TRANSFERENCIA">🏦 Transferencia (Ir a Banco)</option>
                        <option value="TARJETA">💳 Tarjeta</option>
                        <option value="CHEQUE">📜 Cheque</option>
                      </select>
                      <input required type="date" value={tFecha} onChange={e=>setTFecha(e.target.value)} style={{ flex: 1, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                    </div>

                    <input placeholder="Descripción / Detalle del movimiento..." value={tDesc} onChange={e=>setTDesc(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                    <button type="submit" style={{ padding: '0.65rem', background: ingresoGastoSubTab === 'ingreso' ? '#16a34a' : '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700 }}>
                      {ingresoGastoSubTab === 'ingreso' ? 'Guardar Ingreso' : 'Guardar Gasto'}
                    </button>
                  </form>
                </div>

                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>
                    Crear Cuenta de {ingresoGastoSubTab === 'ingreso' ? 'Ingreso / Concepto' : 'Gasto / Egreso'}
                  </h3>
                  <form onSubmit={e => crearCuenta(e, tipoFiltrado)} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input required placeholder={`Nombre (Ej: ${ingresoGastoSubTab === 'ingreso' ? 'Eventos Especiales' : 'Luz y Agua'})`} value={cNombre} onChange={e=>setCNombre(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                    <input placeholder="Descripción breve" value={cDesc} onChange={e=>setCDesc(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                    <button type="submit" style={{ padding: '0.65rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700 }}>+ Crear Cuenta de {ingresoGastoSubTab === 'ingreso' ? 'Ingreso' : 'Gasto'}</button>
                  </form>
                </div>
              </div>

              {/* Panel Derecho: Lista de Cuentas del Tipo Seleccionado */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#0f172a' }}>
                  Cuentas Registradas ({ingresoGastoSubTab === 'ingreso' ? 'Ingresos' : 'Gastos'})
                </h3>
                {filtradas.map(c => (
                  <div key={c.id} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {c.nombre}
                          <button onClick={() => editarCuenta(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#0284c7' }}>✏️ Editar</button>
                          <button onClick={() => eliminarCuenta(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#dc2626' }}>🗑️ Borrar</button>
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{c.descripcion || 'Sin descripción'}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Balance Acumulado</p>
                        <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: c.balance >= 0 ? '#0284c7' : '#dc2626' }}>${c.balance.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {filtradas.length === 0 && <p style={{ color: '#94a3b8' }}>No hay cuentas creadas para esta categoría.</p>}
              </div>
            </div>
          </div>
        );
      })()}

      {/* PESTAÑA: FONDOS MINISTERIALES */}
      {activeSubTab === 'ministerios' && (() => {
        const listaCuentas = finData?.cuentas || cuentas || [];
        const cajasFisicas = listaCuentas.filter((c: any) => 
          c.tipo === 'CAJA_CHICA' || c.tipo === 'CAJA_GENERAL' || c.tipo === 'BANCO' ||
          c.nombre.toLowerCase() === 'caja chica' || c.nombre.toLowerCase() === 'caja general' || c.nombre.toLowerCase() === 'caja de banco'
        );

        const filtradas = cuentas.filter(c => c.tipo === 'DEPARTAMENTO');

        return (
          <div>
            {/* BOTONES DE ALTERNANCIA SUPERIOR EN FONDOS MINISTERIALES */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', background: '#f1f5f9', padding: '0.4rem', borderRadius: '12px', width: 'fit-content' }}>
              <button
                type="button"
                onClick={() => setMinisteriosSubTab('fondos')}
                style={{
                  padding: '0.5rem 1.25rem', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                  background: ministeriosSubTab === 'fondos' ? '#0284c7' : 'transparent',
                  color: ministeriosSubTab === 'fondos' ? 'white' : '#475569',
                  boxShadow: ministeriosSubTab === 'fondos' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                🏛️ Fondos por Ministerio
              </button>
              <button
                type="button"
                onClick={() => {
                  setMinisteriosSubTab('presupuestos');
                  loadPresupuestosMin(pmPeriodoFiltro, pmAnioFiltro);
                }}
                style={{
                  padding: '0.5rem 1.25rem', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                  background: ministeriosSubTab === 'presupuestos' ? '#0284c7' : 'transparent',
                  color: ministeriosSubTab === 'presupuestos' ? 'white' : '#475569',
                  boxShadow: ministeriosSubTab === 'presupuestos' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                📋 Presupuestos Ministeriales
              </button>
            </div>

            {ministeriosSubTab === 'fondos' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
                {/* Panel Izquierdo */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {filtradas.length > 0 && (
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
                      <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Registrar Movimiento Ministerial</h3>
                      <form onSubmit={registrarTransaccion} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Fondo / Cuenta Ministerial</label>
                        <select required value={tOfrendaCuentaId} onChange={e=>setTOfrendaCuentaId(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white', fontWeight: 600 }}>
                          <option value="">-- Seleccionar Fondo Ministerial --</option>
                          {filtradas.map((c: any) => (
                            <option key={c.id} value={c.id}>
                              🏛️ {c.nombre} (${c.balance.toFixed(2)})
                            </option>
                          ))}
                        </select>

                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Caja Contable (Origen/Destino Físico)</label>
                        <select required value={tCuentaId} onChange={e=>setTCuentaId(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white', fontWeight: 600 }}>
                          <option value="">-- Seleccionar Caja Contable --</option>
                          {cajasFisicas.map((c: any) => (
                            <option key={c.id} value={c.id}>
                              {c.nombre.toLowerCase().includes('chica') ? '💵 ' : c.nombre.toLowerCase().includes('general') ? '🏛️ ' : '🏦 '}
                              {c.nombre} (${c.balance.toFixed(2)})
                            </option>
                          ))}
                        </select>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <select required value={tTipoTransaccion} onChange={e=>setTTipoTransaccion(e.target.value)} style={{ flex: 1, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', background: tTipoTransaccion === 'INGRESO' ? '#dcfce7' : '#fee2e2', color: tTipoTransaccion === 'INGRESO' ? '#15803d' : '#991b1b', fontWeight: 600 }}>
                            <option value="INGRESO">Ingreso (+)</option>
                            <option value="EGRESO">Egreso (-)</option>
                          </select>
                          <div style={{ flex: 1, display: 'flex', gap: '0.2rem' }}>
                            <input required type="number" step="0.01" placeholder="Monto" value={tMonto} onChange={e=>setTMonto(e.target.value)} style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px 0 0 8px' }} />
                            <button type="button" onClick={() => setShowContador(true)} style={{ padding: '0 0.75rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: '0 8px 8px 0', cursor: 'pointer', fontWeight: 'bold' }} title="Contador de Dinero">
                              🧮
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <select required value={tMetodoPago} onChange={e=>{
                            const val = e.target.value;
                            setTMetodoPago(val);
                            if (val === 'TRANSFERENCIA') {
                              const banco = cajasFisicas.find((c: any) => c.nombre.toLowerCase().includes('banco') || c.tipo === 'BANCO');
                              if (banco) setTCuentaId(banco.id);
                            }
                          }} style={{ flex: 1, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                            <option value="EFECTIVO">💵 Efectivo</option>
                            <option value="TRANSFERENCIA">🏦 Transferencia (Ir a Banco)</option>
                            <option value="TARJETA">💳 Tarjeta</option>
                            <option value="CHEQUE">📜 Cheque</option>
                          </select>
                          <input required type="date" value={tFecha} onChange={e=>setTFecha(e.target.value)} style={{ flex: 1, padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                        </div>
                        <input placeholder="Descripción (Ej: Presupuesto Actividad Jóvenes...)" value={tDesc} onChange={e=>setTDesc(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                        <button type="submit" style={{ padding: '0.65rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700 }}>Registrar Movimiento</button>
                      </form>
                    </div>
                  )}

                  <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Crear Fondo Departamental / Ministerial</h3>
                    <form onSubmit={e => crearCuenta(e, 'DEPARTAMENTO')} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <input required placeholder="Nombre (Ej: Ministerio de Jóvenes, Damas...)" value={cNombre} onChange={e=>setCNombre(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                      <input placeholder="Descripción breve" value={cDesc} onChange={e=>setCDesc(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                      <button type="submit" style={{ padding: '0.65rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700 }}>+ Crear Fondo Ministerial</button>
                    </form>
                  </div>
                </div>

                {/* Panel Derecho */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#0f172a' }}>Fondos Ministeriales Registrados</h3>
                  {filtradas.map(c => (
                    <div key={c.id} style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🏛️ {c.nombre}
                            <button onClick={() => editarCuenta(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#0284c7' }}>✏️ Editar</button>
                            <button onClick={() => eliminarCuenta(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#dc2626' }}>🗑️ Borrar</button>
                          </h4>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{c.descripcion || 'Sin descripción'}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Balance Disponible</p>
                          <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: c.balance >= 0 ? '#0284c7' : '#dc2626' }}>${c.balance.toFixed(2)}</p>
                        </div>
                      </div>
                      {c.transacciones && c.transacciones.length > 0 && (
                        <div style={{ background: '#f8fafc', padding: '1rem', borderTop: 'none', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                          <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#64748b' }}>Últimos registros</h5>
                          <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            {c.transacciones.map((tr: any) => (
                              <li key={tr.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.2rem', alignItems: 'center' }}>
                                <span style={{ color: '#475569' }}>{new Date(tr.fecha).toLocaleDateString()} - {tr.descripcion || tr.categoria}</span>
                                <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontWeight: 700, color: tr.tipo === 'INGRESO' ? '#16a34a' : '#dc2626' }}>
                                    {tr.tipo === 'INGRESO' ? '+' : '-'}${tr.monto.toFixed(2)}
                                  </span>
                                  <button onClick={() => imprimirRecibo(tr)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#0284c7', padding: '0 0.2rem' }} title="Imprimir Recibo">
                                    🖨️
                                  </button>
                                  <button 
                                    onClick={() => eliminarTransaccion(tr.id)} 
                                    style={{ 
                                      background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '4px',
                                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#e11d48'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#f43f5e'}
                                    title="Eliminar transacción"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                  {filtradas.length === 0 && <p style={{ color: '#94a3b8' }}>No hay fondos ministeriales creados aún.</p>}
                </div>
              </div>
            )}

            {ministeriosSubTab === 'presupuestos' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, color: '#0f172a' }}>Presupuestos Recibidos de Ministerios</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select value={pmPeriodoFiltro} onChange={e=>setPmPeriodoFiltro(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <option value="ANUAL">Anual</option>
                      <option value="Q1">Trimestre 1 (Ene-Mar)</option>
                      <option value="Q2">Trimestre 2 (Abr-Jun)</option>
                      <option value="Q3">Trimestre 3 (Jul-Sep)</option>
                      <option value="Q4">Trimestre 4 (Oct-Dic)</option>
                      <option value="ENERO">Enero</option>
                      <option value="FEBRERO">Febrero</option>
                      <option value="MARZO">Marzo</option>
                    </select>
                    <input type="number" value={pmAnioFiltro} onChange={e=>setPmAnioFiltro(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '80px' }} />
                    <button onClick={() => loadPresupuestosMin(pmPeriodoFiltro, pmAnioFiltro)} style={{ padding: '0.5rem 1rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Buscar</button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', flex: 1, textAlign: 'center' }}>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Total Solicitado</p>
                    <p style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
                      ${presupuestosMin.reduce((acc, p) => acc + (p.monto_asignado || 0), 0).toFixed(2)}
                    </p>
                  </div>
                  <div style={{ background: '#f0fdf4', padding: '1.5rem', borderRadius: '12px', border: '1px solid #bbf7d0', flex: 1, textAlign: 'center' }}>
                    <p style={{ margin: 0, color: '#166534', fontSize: '0.9rem' }}>Total Aprobado</p>
                    <p style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#15803d' }}>
                      ${presupuestosMin.filter(p => p.estado === 'APROBADO').reduce((acc, p) => acc + (p.monto_aprobado || 0), 0).toFixed(2)}
                    </p>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <button 
                      onClick={() => imprimirReporteHtml('Reporte de Presupuestos de Ministerios', 'reporte-presupuestos')}
                      style={{ padding: '0.75rem 1.5rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      🖨️ Imprimir Reporte
                    </button>
                  </div>
                </div>

                <div id="reporte-presupuestos" style={{ display: 'grid', gap: '1rem' }}>
                  {presupuestosMin.length === 0 && <p style={{ color: '#64748b' }}>No hay presupuestos para este período.</p>}
                  {presupuestosMin.map(p => (
                    <div key={p.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: p.estado === 'APROBADO' ? '2px solid #22c55e' : (p.estado === 'EN_REVISION' ? '2px solid #eab308' : '1px solid #e2e8f0') }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>
                            {p.sociedad ? p.sociedad.nombre_sociedad : (p.grupo_trabajo ? p.grupo_trabajo.nombre_grupo : 'Ministerio General')}
                          </h4>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: p.estado === 'APROBADO' ? '#dcfce7' : (p.estado === 'EN_REVISION' ? '#fef9c3' : '#e0f2fe'), color: p.estado === 'APROBADO' ? '#166534' : (p.estado === 'EN_REVISION' ? '#854d0e' : '#075985') }}>
                            {p.estado}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'right' }}>
                          <div>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Solicitado:</p>
                            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                              ${p.monto_asignado.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
                        {p.items?.map((item: any) => (
                          <div key={item.id} style={{ background: '#f1f5f9', padding: '0.5rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.85rem', color: '#475569' }}>{item.categoria}</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>${item.monto_estimado.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start' }}>
                        <div style={{ flex: '1 1 200px' }}>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Monto Aprobado ($)</label>
                          <input 
                            type="number" 
                            value={presupuestoUpdates[p.id]?.monto || ''} 
                            onChange={e => setPresupuestoUpdates({...presupuestoUpdates, [p.id]: { ...presupuestoUpdates[p.id], monto: e.target.value }})}
                            style={{ padding: '0.5rem', width: '100%', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 600 }}
                            disabled={p.estado === 'APROBADO'}
                          />
                        </div>
                        <div style={{ flex: '2 1 300px' }}>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Comentarios de Finanzas</label>
                          <input 
                            type="text" 
                            value={presupuestoUpdates[p.id]?.comentarios || ''} 
                            onChange={e => setPresupuestoUpdates({...presupuestoUpdates, [p.id]: { ...presupuestoUpdates[p.id], comentarios: e.target.value }})}
                            placeholder="Nota opcional para el ministerio..."
                            style={{ padding: '0.5rem', width: '100%', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            disabled={p.estado === 'APROBADO'}
                          />
                        </div>
                        {p.estado !== 'APROBADO' && (
                          <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end', width: '100%', justifyContent: 'flex-end' }}>
                            <button onClick={() => handleUpdatePresupuesto(p.id, 'EN_REVISION')} style={{ padding: '0.6rem 1rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                              ↩️ Devolver para Ajuste
                            </button>
                            <button onClick={() => handleUpdatePresupuesto(p.id, 'APROBADO')} style={{ padding: '0.6rem 1rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                              ✅ Aprobar Presupuesto
                            </button>
                          </div>
                        )}
                        {p.estado === 'APROBADO' && (
                          <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end', width: '100%', justifyContent: 'flex-end' }}>
                            <button onClick={() => handleUpdatePresupuesto(p.id, 'ENVIADO')} style={{ padding: '0.4rem 0.8rem', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                              ❌ Deshacer Aprobación
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* NÓMINA */}
      {activeSubTab === 'nomina' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
          {/* Panel Izquierdo: Configurar Empleado */}
          <div>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Configurar Empleado</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!dPersonaId || !dMonto || !cNombre) return alert("Faltan datos");
                const res = await fetch('/api/finanzas/nomina', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'configurar_empleado',
                    data: { persona_id: dPersonaId, cargo: cNombre, salario: dMonto, frecuencia: 'MENSUAL', fecha_inicio: dFecha }
                  })
                });
                if (res.ok) {
                  alert("Empleado configurado");
                  loadEmpleados();
                  setDPersonaId(''); setDMonto(''); setCNombre('');
                }
              }} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <select required value={dPersonaId} onChange={e=>setDPersonaId(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                  <option value="">Seleccionar Miembro...</option>
                  {miembros.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
                <input required placeholder="Cargo (Ej: Pastor, Músico, Aseo)" value={cNombre} onChange={e=>setCNombre(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                <input required type="number" step="0.01" placeholder="Salario (USD)" value={dMonto} onChange={e=>setDMonto(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                <button type="submit" style={{ padding: '0.65rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700 }}>+ Añadir a Nómina</button>
              </form>
            </div>
          </div>

          {/* Panel Derecho: Lista y Pago */}
          <div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Ejecutar Pago de Nómina Masivo</span>
                <button onClick={() => imprimirReporteHtml('Reporte de Nómina Activa', 'reporte-nomina')} className="no-print" style={{ background: 'white', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                  🖨️ Imprimir Nómina
                </button>
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>El pago generará egresos automáticos por el salario configurado de cada empleado.</p>
              <form onSubmit={pagarNomina} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <select value={tCuentaId} onChange={e=>setTCuentaId(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', minWidth: '250px' }}>
                  <option value="">(Opcional) Deducir de cuenta ministerial/gasto...</option>
                  {cuentas.filter(c => c.tipo !== 'OFRENDA').map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Ejecutar Pago a Todos</button>
              </form>
            </div>

            <div id="reporte-nomina">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Empleado</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Cargo</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Salario</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Estado</th>
                  </tr>
                </thead>
              <tbody>
                {empleados.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{e.nombre}</td>
                    <td style={{ padding: '1rem' }}>{e.nomina?.cargo || 'Sin asignar'}</td>
                    <td style={{ padding: '1rem', color: '#0284c7', fontWeight: 700 }}>${e.nomina?.salario?.toFixed(2) || '0.00'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ background: '#dcfce7', color: '#166534', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600 }}>Activo</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {empleados.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No hay empleados en nómina.</p>}
          </div>
        </div>
      </div>
      )}

      {/* REPORTES */}
      {activeSubTab === 'reportes' && (
        <div id="reportes-container">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              #print-area, #print-area * { visibility: visible; }
              #print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
              .no-print { display: none !important; }
              .print-only { display: block !important; }
              .print-card-green { background-color: #f0fdf4 !important; border-color: #bbf7d0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .print-card-red { background-color: #fef2f2 !important; border-color: #fecaca !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .print-card-blue { background-color: #f0f9ff !important; border-color: #bae6fd !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          `}</style>

          <div className="no-print" style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <select value={rFuente} onChange={e=>setRFuente(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', minWidth: '200px' }}>
                  <option value="TODAS">Balance General (Todo)</option>
                  <option value="DIEZMOS">Diezmos</option>
                  {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                <select value={rFormato} onChange={e=>setRFormato(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                  <option value="DETALLADO">Reporte Detallado</option>
                  <option value="CONSOLIDADO">Reporte Consolidado</option>
                </select>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Desde:</span>
                  <input type="date" value={rFechaInicio} onChange={e=>setRFechaInicio(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Hasta:</span>
                  <input type="date" value={rFechaFin} onChange={e=>setRFechaFin(e.target.value)} style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={descargarCSV} style={{ padding: '0.65rem 1rem', background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  📥 Descargar CSV
                </button>
                <button onClick={() => window.print()} style={{ padding: '0.65rem 1rem', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  🖨️ Imprimir
                </button>
              </div>
            </div>
          </div>

          {/* Wrapper for print styling */}
          <div id="print-area">
            <div className="print-only" style={{ display: 'none', textAlign: 'center', borderBottom: '2px solid #cbd5e1', paddingBottom: '1rem', marginBottom: '2rem' }}>
              {finData?.iglesia?.logo_url && <img src={finData.iglesia.logo_url} alt="Logo" style={{ maxWidth: '80px', marginBottom: '0.5rem' }} />}
              <h1 style={{ margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '1.5rem', color: '#0f172a' }}>{finData?.iglesia?.nombre_iglesia || 'Iglesia Local'}</h1>
              {finData?.iglesia?.contacto_direccion && <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{finData.iglesia.contacto_direccion}</p>}
              {finData?.iglesia?.contacto_telefono && <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Tel: {finData.iglesia.contacto_telefono}</p>}
              <h2 style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold', margin: '1.5rem 0 0 0', textTransform: 'uppercase', color: '#0284c7' }}>
                Reporte {rFormato === 'CONSOLIDADO' ? 'Consolidado' : 'Detallado'} (Desde {new Date(rFechaInicio + 'T00:00:00').toLocaleDateString()} Hasta {new Date(rFechaFin + 'T00:00:00').toLocaleDateString()}) {rFuente !== 'TODAS' ? '- ' + (rFuente === 'DIEZMOS' ? 'Diezmos' : cuentas.find(c=>c.id===rFuente)?.nombre) : ''}
              </h2>
            </div>

            {(() => {
              let baseData = [
                ...(reportes?.transacciones || []),
                ...(reportes?.diezmos || []).map((d: any) => ({
                  ...d,
                  tipo: 'INGRESO',
                  esDiezmo: true,
                  cuenta_fondo: { nombre: 'Diezmo' },
                  descripcion: `Diezmo - ${d.persona?.nombre || 'Anónimo'}`
                }))
              ];

              const reportData = baseData.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
              
              if (rFormato === 'CONSOLIDADO') {
                const rChartMap = new Map();
                reportData.forEach((t: any) => {
                  const dStr = new Date(t.fecha || new Date()).toISOString().split('T')[0];
                  if (!rChartMap.has(dStr)) rChartMap.set(dStr, { name: dStr, ingresos: 0, egresos: 0 });
                  const c = rChartMap.get(dStr);
                  if (t.tipo === 'INGRESO') c.ingresos += (t.monto || 0);
                  else c.egresos += (t.monto || 0);
                });
                const rChart = Array.from(rChartMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));

                const rAccMap = new Map();
                reportData.forEach((t: any) => {
                  const cName = t.esDiezmo ? 'Diezmos' : (t.cuenta_fondo?.nombre || 'General');
                  if (!rAccMap.has(cName)) rAccMap.set(cName, { cuenta: cName, tipo: t.esDiezmo ? 'DIEZMO' : 'GENERAL', ingresos: 0, egresos: 0 });
                  const c = rAccMap.get(cName);
                  if (t.tipo === 'INGRESO') c.ingresos += (t.monto || 0);
                  else c.egresos += (t.monto || 0);
                });
                const rConsolidado = Array.from(rAccMap.values())
                  .map((r: any) => ({ ...r, balance: r.ingresos - r.egresos }))
                  .sort((a: any, b: any) => b.balance - a.balance);

                const totalIngresos = rConsolidado.reduce((acc, curr) => acc + curr.ingresos, 0);
                const totalEgresos = rConsolidado.reduce((acc, curr) => acc + curr.egresos, 0);
                const neto = totalIngresos - totalEgresos;

                return (
                  <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div className="print-card-green" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1.5rem' }}>
                        <h3 style={{ color: '#166534', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Ingresos del Mes</h3>
                        <p style={{ fontSize: '2.2rem', fontWeight: 800, color: '#15803d', margin: 0 }}>${totalIngresos.toFixed(2)}</p>
                      </div>
                      <div className="print-card-red" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '1.5rem' }}>
                        <h3 style={{ color: '#991b1b', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Egresos del Mes</h3>
                        <p style={{ fontSize: '2.2rem', fontWeight: 800, color: '#dc2626', margin: 0 }}>${totalEgresos.toFixed(2)}</p>
                      </div>
                      <div className="print-card-blue" style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '1.5rem' }}>
                        <h3 style={{ color: '#075985', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Balance Neto</h3>
                        <p style={{ fontSize: '2.2rem', fontWeight: 800, color: neto >= 0 ? '#0369a1' : '#dc2626', margin: 0 }}>${neto.toFixed(2)}</p>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#0f172a' }}>Evolución Financiera</h3>
                    <div style={{ width: '100%', height: 250, marginBottom: '2rem' }}>
                      <ResponsiveContainer>
                        <AreaChart data={rChart} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="rColorIngresos" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="rColorEgresos" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                          <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `$${val}`} />
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <Tooltip 
                            formatter={(value: any) => [`$${Number(value || 0).toFixed(2)}`, '']}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend verticalAlign="top" height={36}/>
                          <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" fillOpacity={1} fill="url(#rColorIngresos)" />
                          <Area type="monotone" dataKey="egresos" name="Egresos" stroke="#ef4444" fillOpacity={1} fill="url(#rColorEgresos)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#15803d', textTransform: 'uppercase', fontSize: '0.9rem' }}>Distribución de Ingresos</h4>
                        <div style={{ width: '100%', height: 250 }}>
                          {(() => {
                            const pieIngresos = rConsolidado.filter((r:any) => r.ingresos > 0).map((r:any) => ({ name: r.cuenta, value: r.ingresos }));
                            if (pieIngresos.length === 0) return <div style={{ paddingTop: '100px', color: '#94a3b8' }}>Sin datos de ingresos</div>;
                            return (
                              <ResponsiveContainer>
                                <PieChart>
                                  <Pie data={pieIngresos} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {pieIngresos.map((entry:any, index:number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                  </Pie>
                                  <Tooltip formatter={(value: any) => `$${Number(value || 0).toFixed(2)}`} />
                                  <Legend />
                                </PieChart>
                              </ResponsiveContainer>
                            );
                          })()}
                        </div>
                      </div>
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#dc2626', textTransform: 'uppercase', fontSize: '0.9rem' }}>Distribución de Egresos</h4>
                        <div style={{ width: '100%', height: 250 }}>
                          {(() => {
                            const pieEgresos = rConsolidado.filter((r:any) => r.egresos > 0).map((r:any) => ({ name: r.cuenta, value: r.egresos }));
                            if (pieEgresos.length === 0) return <div style={{ paddingTop: '100px', color: '#94a3b8' }}>Sin datos de egresos</div>;
                            return (
                              <ResponsiveContainer>
                                <PieChart>
                                  <Pie data={pieEgresos} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {pieEgresos.map((entry:any, index:number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                  </Pie>
                                  <Tooltip formatter={(value: any) => `$${Number(value || 0).toFixed(2)}`} />
                                  <Legend />
                                </PieChart>
                              </ResponsiveContainer>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', color: '#0f172a' }}>Consolidado por Cuentas</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left', color: '#64748b' }}>Cuenta / Categoría</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right', color: '#64748b' }}>Ingresos</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right', color: '#64748b' }}>Egresos</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right', color: '#64748b' }}>Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rConsolidado.map((row: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.75rem', fontWeight: 600, color: row.tipo === 'DIEZMO' ? '#0284c7' : '#0f172a' }}>
                              {row.cuenta}
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'right', color: '#15803d', fontWeight: 500 }}>
                              ${row.ingresos.toFixed(2)}
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'right', color: '#dc2626', fontWeight: 500 }}>
                              ${row.egresos.toFixed(2)}
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: row.balance >= 0 ? '#0f172a' : '#ef4444' }}>
                              ${row.balance.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        {rConsolidado.length === 0 && (
                          <tr>
                            <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>No hay transacciones en este periodo.</td>
                          </tr>
                        )}
                      </tbody>
                      {rConsolidado.length > 0 && (
                        <tfoot>
                          <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1' }}>
                            <td style={{ padding: '1rem 0.75rem', fontWeight: 800, color: '#0f172a' }}>GRAN TOTAL</td>
                            <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: 800, color: '#15803d' }}>${totalIngresos.toFixed(2)}</td>
                            <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>${totalEgresos.toFixed(2)}</td>
                            <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: 800, color: neto >= 0 ? '#0f172a' : '#ef4444' }}>${neto.toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                );
              }

              return (
                <>
                  <div className="print-only">
                    <h2 style={{ display: 'none' }}>Reporte Financiero Detallado (Desde {new Date(rFechaInicio + 'T00:00:00').toLocaleDateString()} Hasta {new Date(rFechaFin + 'T00:00:00').toLocaleDateString()})</h2>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <tr>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Fecha</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Cuenta/Origen</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Detalle</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Método</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Monto</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((r: any, i: number) => (
                        <tr key={r.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.75rem' }}>{new Date(r.fecha || new Date()).toLocaleDateString()}</td>
                          <td style={{ padding: '0.75rem' }}>
                            {r.cuenta_fondo?.nombre || 'General'}
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: r.tipo === 'INGRESO' ? '#16a34a' : '#dc2626' }}>
                              [{r.tipo || '-'}]
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem', color: '#64748b' }}>{r.descripcion || '-'}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>{r.metodo_pago || 'EFECTIVO'}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: r.tipo === 'EGRESO' ? '#dc2626' : '#16a34a' }}>
                            ${(r.monto || 0).toFixed(2)}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <button onClick={() => imprimirRecibo(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#0284c7', padding: '0 0.2rem' }} title="Imprimir Recibo">
                              🖨️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {reportData.length > 0 && (
                    <div style={{ textAlign: 'right', padding: '1rem 0.75rem', fontWeight: 800, fontSize: '1.2rem', borderTop: '2px solid #e2e8f0' }}>
                      Balance Neto: ${reportData.reduce((acc: number, curr: any) => curr.tipo === 'INGRESO' ? acc + (curr.monto||0) : acc - (curr.monto||0), 0).toFixed(2)}
                    </div>
                  )}
                  {reportData.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No hay datos para este período.</p>}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* CONCILIACIÓN BANCARIA */}
      {activeSubTab === 'conciliacion' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            <button onClick={() => setCSubTab('PENDIENTES')} style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', color: cSubTab === 'PENDIENTES' ? '#0284c7' : '#64748b', borderBottom: cSubTab === 'PENDIENTES' ? '3px solid #0284c7' : '3px solid transparent' }}>Pendientes de Conciliar ({pendientesConciliar.length})</button>
            <button onClick={() => setCSubTab('HISTORIAL')} style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', color: cSubTab === 'HISTORIAL' ? '#0284c7' : '#64748b', borderBottom: cSubTab === 'HISTORIAL' ? '3px solid #0284c7' : '3px solid transparent' }}>Historial Conciliado</button>
          </div>

          {cSubTab === 'PENDIENTES' && (
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div style={{ flex: 2 }}>
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <tr>
                        <th style={{ padding: '1rem', textAlign: 'center', width: '50px' }}>
                          <input type="checkbox" 
                            checked={selectedConciliarIds.size === pendientesConciliar.length && pendientesConciliar.length > 0} 
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedConciliarIds(new Set(pendientesConciliar.map(t => t.id)));
                              } else {
                                setSelectedConciliarIds(new Set());
                              }
                            }}
                            style={{ width: '1rem', height: '1rem', accentColor: '#0284c7' }}
                          />
                        </th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#475569' }}>Fecha</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#475569' }}>Descripción</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#475569' }}>Método</th>
                        <th style={{ padding: '1rem', textAlign: 'right', color: '#475569' }}>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendientesConciliar.map(t => (
                        <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9', background: selectedConciliarIds.has(t.id) ? '#f0f9ff' : 'transparent', cursor: 'pointer' }} onClick={() => {
                          const newSet = new Set(selectedConciliarIds);
                          if (newSet.has(t.id)) newSet.delete(t.id);
                          else newSet.add(t.id);
                          setSelectedConciliarIds(newSet);
                        }}>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <input type="checkbox" checked={selectedConciliarIds.has(t.id)} readOnly style={{ width: '1rem', height: '1rem', accentColor: '#0284c7' }} />
                          </td>
                          <td style={{ padding: '1rem' }}>{new Date(t.fecha).toLocaleDateString()}</td>
                          <td style={{ padding: '1rem' }}>{t.descripcion || t.clasificacion} <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginLeft: '0.5rem' }}>({t.cuenta_fondo?.nombre || 'General'})</span></td>
                          <td style={{ padding: '1rem' }}>{t.metodo_pago}</td>
                          <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: t.tipo === 'INGRESO' ? '#16a34a' : '#dc2626' }}>{t.tipo === 'INGRESO' ? '+' : '-'}${t.monto.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {pendientesConciliar.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No hay transacciones pendientes de conciliar.</div>}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', position: 'sticky', top: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', color: '#0f172a' }}>Resumen a Conciliar</h3>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px dashed #cbd5e1' }}>
                    <span style={{ color: '#64748b' }}>Registros seleccionados:</span>
                    <strong style={{ fontSize: '1.1rem' }}>{selectedConciliarIds.size}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                    <span style={{ color: '#64748b' }}>Neto Calculado:</span>
                    <strong style={{ fontSize: '2rem', color: totalSeleccionadoConciliacion >= 0 ? '#16a34a' : '#dc2626' }}>${totalSeleccionadoConciliacion.toFixed(2)}</strong>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>No. de Referencia (Opcional)</label>
                    <input type="text" placeholder="Ej: DEP-123456" value={referenciaBancaria} onChange={e=>setReferenciaBancaria(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                  </div>

                  <button 
                    onClick={aplicarConciliacion} 
                    disabled={selectedConciliarIds.size === 0}
                    style={{ width: '100%', padding: '1rem', background: selectedConciliarIds.size > 0 ? '#0284c7' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: selectedConciliarIds.size > 0 ? 'pointer' : 'not-allowed', fontSize: '1rem', transition: 'background 0.2s' }}
                  >
                    ✔ Marcar como Conciliado
                  </button>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', marginTop: '1rem' }}>Comprueba que el "Neto Calculado" coincida con tu depósito en el banco.</p>
                </div>
              </div>
            </div>
          )}

          {cSubTab === 'HISTORIAL' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button onClick={() => imprimirReporteHtml('Historial de Conciliaciones Bancarias', 'reporte-conciliacion')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#0f172a', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                  🖨️ Imprimir Historial
                </button>
              </div>
              <div id="reporte-conciliacion" style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#475569' }}>Fecha de Trx.</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#475569' }}>Conciliado El</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#475569' }}>Referencia</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#475569' }}>Descripción</th>
                      <th style={{ padding: '1rem', textAlign: 'right', color: '#475569' }}>Monto</th>
                      <th className="no-print" style={{ padding: '1rem', textAlign: 'center', color: '#475569' }}>Acción</th>
                    </tr>
                  </thead>
                <tbody>
                  {historialConciliacion.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem' }}>{new Date(t.fecha).toLocaleDateString()}</td>
                      <td style={{ padding: '1rem', color: '#15803d', fontWeight: 600 }}>{t.fecha_conciliacion ? new Date(t.fecha_conciliacion).toLocaleDateString() : 'Sí'}</td>
                      <td style={{ padding: '1rem' }}>{t.referencia_bancaria || <span style={{color: '#cbd5e1'}}>N/A</span>}</td>
                      <td style={{ padding: '1rem' }}>{t.descripcion || t.clasificacion} <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginLeft: '0.5rem' }}>({t.cuenta_fondo?.nombre || 'General'})</span></td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: t.tipo === 'INGRESO' ? '#16a34a' : '#dc2626' }}>{t.tipo === 'INGRESO' ? '+' : '-'}${t.monto.toFixed(2)}</td>
                      <td className="no-print" style={{ padding: '1rem', textAlign: 'center' }}>
                        <button onClick={() => imprimirRecibo({...t, descripcion: (t.descripcion || t.clasificacion) + (t.referencia_bancaria ? ' (Ref: '+t.referencia_bancaria+')' : '')})} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }} title="Imprimir Recibo">
                          🖨️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {historialConciliacion.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No hay historial de conciliaciones.</div>}
            </div>
            </div>
          )}

        </div>
      )}

      {/* PROMESAS DE FE */}
      {activeSubTab === 'promesas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* SECCIÓN: PROYECTOS */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ margin: 0, color: '#0f172a' }}>Causas y Proyectos</h3>
                <button onClick={() => descargarCSVPromesas()} style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }} title="Descargar reporte de todos los proyectos">
                  📥 CSV General
                </button>
                <button onClick={() => imprimirReporteHtml('Reporte de Proyectos y Promesas', 'reporte-proyectos')} style={{ background: 'white', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.4rem 0.8rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>
                  🖨️ Imprimir
                </button>
              </div>
              <button onClick={() => setShowProyectoModal(true)} style={{ background: '#0284c7', color: 'white', border: 'none', padding: '0.65rem 1rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                + Crear Causa
              </button>
            </div>
            
            <div id="reporte-proyectos" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {proyectosPromesa.map(pr => {
                const pct = pr.meta_financiera ? Math.min(100, Math.round((pr.totalAportado / pr.meta_financiera) * 100)) : 0;
                return (
                  <div key={pr.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                      {pr.promocionar_hub && (
                        <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 700 }}>
                          EN EL HUB ⭐
                        </span>
                      )}
                      <button onClick={() => descargarCSVPromesas(pr.id)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#0284c7' }} title="Descargar CSV del proyecto">
                        📥
                      </button>
                      <button 
                        onClick={() => {
                          setPrId(pr.id);
                          setPrNombre(pr.nombre);
                          setPrDesc(pr.descripcion || '');
                          setPrInstrucciones(pr.instrucciones_pago || '');
                          setPrMeta(pr.meta_financiera || '');
                          setPrPromo(pr.promocionar_hub);
                          setShowProyectoModal(true);
                        }}
                        style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
                        title="Editar Proyecto"
                      >
                        ✏️
                      </button>
                    </div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', paddingRight: '4rem' }}>{pr.nombre}</h4>
                    <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.85rem', minHeight: '40px' }}>{pr.descripcion || 'Sin descripción'}</p>
                    
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                        <span style={{ color: '#0284c7' }}>Recaudado: ${pr.totalAportado.toFixed(2)}</span>
                        {pr.meta_financiera && <span style={{ color: '#64748b' }}>Meta: ${pr.meta_financiera.toFixed(2)}</span>}
                      </div>
                      {pr.meta_financiera && (
                        <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: '#0284c7' }} />
                        </div>
                      )}
                      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                        Total Prometido: ${pr.totalPrometido.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
              {proyectosPromesa.length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: '#94a3b8', border: '1px dashed #cbd5e1', borderRadius: '12px', background: 'white' }}>
                  No hay proyectos activos. Crea uno para empezar a registrar promesas.
                </div>
              )}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0' }} />

          {/* SECCIÓN: LISTADO DE PROMESAS */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>Promesas Individuales</h3>
              <button 
                onClick={() => setShowPromesaModal(true)} 
                disabled={proyectosPromesa.length === 0}
                style={{ background: '#16a34a', color: 'white', border: 'none', padding: '0.65rem 1rem', borderRadius: '8px', fontWeight: 600, cursor: proyectosPromesa.length === 0 ? 'not-allowed' : 'pointer', fontSize: '0.9rem', opacity: proyectosPromesa.length === 0 ? 0.5 : 1 }}
              >
                + Registrar Promesa
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {promesas.map(p => {
                const porcentaje = Math.min(100, Math.round((p.monto_aportado / p.monto_promesa) * 100));
                return (
                  <div key={p.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', overflow: 'hidden' }}>
                    {p.estado === 'COMPLETADA' && (
                      <div style={{ position: 'absolute', top: 0, right: 0, background: '#16a34a', color: 'white', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 1rem', borderBottomLeftRadius: '12px' }}>
                        COMPLETADA 🎉
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem' }}>
                        {p.persona?.nombre?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', color: '#0f172a' }}>{p.persona?.nombre}</h4>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Causa: <strong>{p.proyecto?.nombre}</strong></p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
                      <span>${p.monto_aportado.toFixed(2)} aportado</span>
                      <span>Meta: ${p.monto_promesa.toFixed(2)}</span>
                    </div>

                    <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${porcentaje}%`, height: '100%', background: p.estado === 'COMPLETADA' ? '#16a34a' : '#0284c7', transition: 'width 0.5s ease' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {p.fecha_limite ? `Límite: ${new Date(p.fecha_limite).toLocaleDateString()}` : 'Sin límite'}
                      </span>
                      <button 
                        onClick={() => setShowAbonoModal(p.id)}
                        disabled={p.estado === 'COMPLETADA'}
                        style={{ background: p.estado === 'COMPLETADA' ? '#f1f5f9' : '#f0f9ff', color: p.estado === 'COMPLETADA' ? '#94a3b8' : '#0284c7', border: p.estado === 'COMPLETADA' ? '1px solid #e2e8f0' : '1px solid #bae6fd', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, cursor: p.estado === 'COMPLETADA' ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}
                      >
                        Abonar
                      </button>
                    </div>
                  </div>
                );
              })}
              {promesas.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#94a3b8', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>No hay promesas individuales registradas.</div>}
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Proyecto */}
      {showProyectoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>{prId ? 'Editar Proyecto / Causa' : 'Crear Proyecto / Causa'}</h3>
            <form onSubmit={registrarProyecto} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Nombre de la Causa</label>
                <input required type="text" placeholder="Ej: Construcción del Templo" value={prNombre} onChange={e=>setPrNombre(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Descripción Corta</label>
                <textarea value={prDesc} onChange={e=>setPrDesc(e.target.value)} rows={2} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Instrucciones de Pago (Para Mi Iglesia)</label>
                <textarea value={prInstrucciones} onChange={e=>setPrInstrucciones(e.target.value)} rows={3} placeholder="Ej: Depositar a la cuenta 123 del Banco XYZ indicando que es para esta causa." style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Meta Financiera Global ($)</label>
                <input type="number" step="0.01" value={prMeta} onChange={e=>setPrMeta(e.target.value)} placeholder="Opcional" style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <input type="checkbox" checked={prPromo} onChange={e=>setPrPromo(e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                <span style={{ fontWeight: 600, color: '#0f172a' }}>Promocionar en Mi Iglesia (Hacer Público)</span>
              </label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => { setShowProyectoModal(false); setPrId(null); setPrNombre(''); setPrDesc(''); setPrInstrucciones(''); setPrMeta(''); setPrPromo(false); }} style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '0.75rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>{prId ? 'Guardar Cambios' : 'Crear Causa'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva Promesa */}
      {showPromesaModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Registrar Nueva Promesa</h3>
            <form onSubmit={registrarPromesa} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Miembro</label>
                <select required value={pPersonaId} onChange={e=>setPPersonaId(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                  <option value="">-- Seleccionar Miembro --</option>
                  {miembros.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Causa / Proyecto</label>
                <select required value={pProyectoId} onChange={e=>setPProyectoId(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                  <option value="">-- Seleccionar Proyecto --</option>
                  {proyectosPromesa.map(pr => <option key={pr.id} value={pr.id}>{pr.nombre}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Monto a Prometer ($)</label>
                  <input required type="number" step="0.01" value={pMonto} onChange={e=>setPMonto(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Fecha Límite (Opcional)</label>
                  <input type="date" value={pFechaLimite} onChange={e=>setPFechaLimite(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowPromesaModal(false)} style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '0.75rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Guardar Promesa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Abono */}
      {showAbonoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Registrar Abono a Promesa</h3>
            <form onSubmit={registrarAbono} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Monto del Abono ($)</label>
                <input required type="number" step="0.01" value={aMonto} onChange={e=>setAMonto(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Método de Pago</label>
                <select required value={aMetodo} onChange={e=>setAMetodo(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="TARJETA">Tarjeta</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Destinar a Cuenta / Fondo</label>
                <select value={tCuentaId} onChange={e=>setTCuentaId(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                  <option value="">Fondo General (Sin especificar)</option>
                  {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAbonoModal(null)} style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '0.75rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Confirmar Abono</button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* MODAL CONTADOR DE DINERO */}
      {showContador && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>🧮 Contador de Dinero</h3>
              <button onClick={() => setShowContador(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✖</button>
            </div>
            
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 700 }}>Total Calculado</p>
              <h2 style={{ margin: '0.2rem 0 0 0', color: '#16a34a', fontSize: '2.5rem' }}>${totalContador.toFixed(2)}</h2>
            </div>

            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {denominaciones.map(den => (
                <div key={den} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ flex: 1, fontSize: '1.1rem', fontWeight: 600, color: '#334155' }}>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', marginRight: '0.5rem' }}>$</span>
                    {den}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button type="button" onClick={() => setContadorValores(prev => ({ ...prev, [den]: Math.max(0, prev[den] - 1) }))} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                    <input type="number" min="0" value={contadorValores[den] || ''} onChange={(e) => setContadorValores(prev => ({ ...prev, [den]: parseInt(e.target.value) || 0 }))} style={{ width: '60px', textAlign: 'center', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                    <button type="button" onClick={() => setContadorValores(prev => ({ ...prev, [den]: prev[den] + 1 }))} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                  </div>
                  <div style={{ width: '80px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    ${(contadorValores[den] * den).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button 
                onClick={() => setContadorValores({ 2000: 0, 1000: 0, 500: 0, 200: 0, 100: 0, 50: 0, 25: 0, 10: 0, 5: 0, 1: 0 })}
                style={{ flex: 1, padding: '0.8rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
              >
                Limpiar
              </button>
              <button 
                onClick={() => {
                  setTMonto(totalContador.toString());
                  setDMonto(totalContador.toString());
                  setShowContador(false);
                }}
                style={{ flex: 2, padding: '0.8rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
              >
                Usar este total
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR MOVIMIENTO (INGRESO / GASTO) CON FECHA SELECCIONABLE */}
      {showMovimientoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowMovimientoModal(false)}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '520px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: tTipoTransaccion === 'INGRESO' ? '#15803d' : '#b91c1c' }}>
                {tTipoTransaccion === 'INGRESO' ? '💰 Registrar Nuevo Ingreso' : '📉 Registrar Nuevo Gasto'}
              </h3>
              <button onClick={() => setShowMovimientoModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <form onSubmit={async (e) => {
              await registrarTransaccion(e);
              setShowMovimientoModal(false);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem' }}>Tipo de Movimiento</label>
                <select value={tTipoTransaccion} onChange={e => setTTipoTransaccion(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                  <option value="INGRESO">💰 Ingreso / Entrada</option>
                  <option value="EGRESO">📉 Gasto / Salida</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem' }}>Caja Contable (Origen / Destino Físico)</label>
                <select value={tCuentaId} onChange={e => setTCuentaId(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }} required>
                  <option value="">-- Selecciona Caja Contable --</option>
                  {(finData?.cuentas || cuentas || [])
                    .filter((c: any) => c.tipo === 'CAJA_CHICA' || c.tipo === 'CAJA_GENERAL' || c.tipo === 'BANCO' || c.nombre.toLowerCase() === 'caja chica' || c.nombre.toLowerCase() === 'caja general' || c.nombre.toLowerCase() === 'caja de banco')
                    .map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre.toLowerCase().includes('chica') ? '💵 ' : c.nombre.toLowerCase().includes('general') ? '🏛️ ' : '🏦 '}
                        {c.nombre} (Balance: ${c.balance.toFixed(2)})
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem' }}>Monto ($)</label>
                  <input type="number" step="0.01" min="0.01" placeholder="0.00" value={tMonto} onChange={e => setTMonto(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 700 }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem' }}>📅 Fecha Deseada</label>
                  <input type="date" value={tFecha} onChange={e => setTFecha(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem' }}>
                  {tTipoTransaccion === 'INGRESO' ? 'Concepto / Cuenta de Ingreso (Acreditar)' : 'Concepto / Cuenta de Gasto (Debitar)'}
                </label>
                <select value={tCategoria} onChange={e => setTCategoria(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  {tTipoTransaccion === 'INGRESO' ? (
                    <>
                      <option value="OFRENDA_GENERAL">Ofrenda General</option>
                      <option value="DIEZMO">Diezmo</option>
                      <option value="OFRENDA_MISIONERA">Ofrenda Misionera</option>
                      <option value="DONACION_ESPECIAL">Pro-Templo / Proyectos</option>
                      <option value="INGRESO_MINISTERIAL">Ingreso Ministerial / Eventos</option>
                      <option value="OTRO">Otro Ingreso</option>
                    </>
                  ) : (
                    <>
                      <option value="GASTO_MINISTERIAL">Gasto Ministerial / Actividades</option>
                      <option value="SERVICIOS">Servicios Públicos / Mantenimiento</option>
                      <option value="SALARIO">Nómina / Salarios</option>
                      <option value="BENEFICENCIA">Ayuda Social / Beneficencia</option>
                      <option value="ALQUILER">Alquiler / Arrendamiento</option>
                      <option value="OTRO">Otro Egreso</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem' }}>Método de Pago</label>
                <select value={tMetodoPago} onChange={e => setTMetodoPago(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <option value="EFECTIVO">💵 Efectivo</option>
                  <option value="TRANSFERENCIA">🏦 Transferencia Bancaria</option>
                  <option value="CHEQUE">📜 Cheque</option>
                  <option value="TARJETA">💳 Tarjeta / POS</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem' }}>Descripción / Detalle</label>
                <input type="text" placeholder="Ej: Registro diario ofrenda de servicio..." value={tDesc} onChange={e => setTDesc(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowMovimientoModal(false)} style={{ padding: '0.5rem 1rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                <button type="submit" style={{ padding: '0.5rem 1.25rem', background: tTipoTransaccion === 'INGRESO' ? '#16a34a' : '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
                  Guardar Movimiento
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL TRANSFERENCIA ENTRE CAJAS CON FECHA SELECCIONABLE */}
      {showTransferModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowTransferModal(false)}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '520px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0284c7' }}>
                🔄 Traslado / Transferencia Entre Cajas
              </h3>
              <button onClick={() => setShowTransferModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <form onSubmit={ejecutarTransferencia} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem' }}>Caja / Cuenta Origen (Desde)</label>
                <select value={trOrigenId} onChange={e => setTrOrigenId(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} required>
                  <option value="">-- Selecciona Origen --</option>
                  {(finData?.cuentas || cuentas || []).map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} (Balance: ${c.balance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem' }}>Caja / Cuenta Destino (Hacia)</label>
                <select value={trDestinoId} onChange={e => setTrDestinoId(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} required>
                  <option value="">-- Selecciona Destino --</option>
                  {(finData?.cuentas || cuentas || []).map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} (Balance: ${c.balance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem' }}>Monto a Trasladar ($)</label>
                  <input type="number" step="0.01" min="0.01" placeholder="0.00" value={trMonto} onChange={e => setTrMonto(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 700 }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem' }}>📅 Fecha de Transferencia</label>
                  <input type="date" value={trFecha} onChange={e => setTrFecha(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem' }}>Motivo / Referencia</label>
                <input type="text" placeholder="Ej: Depósito diario de Caja Chica a Caja General..." value={trDesc} onChange={e => setTrDesc(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowTransferModal(false)} style={{ padding: '0.5rem 1rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                <button type="submit" style={{ padding: '0.5rem 1.25rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
                  Confirmar Transferencia
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
