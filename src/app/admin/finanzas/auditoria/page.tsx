"use client";
import { useState, useEffect } from 'react';

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finanzas/auditoria');
      const json = await res.json();
      if (!json.error) {
        setLogs(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em' }}>Auditoría Financiera</h1>
        <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '0.15rem' }}>Bitácora de cambios y auditoría completa. Los registros contables no se pueden eliminar, solo anular.</p>
      </div>

      {/* Table container */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '1rem', color: '#475569', fontWeight: 700, width: '180px' }}>Fecha y Hora</th>
              <th style={{ padding: '1rem', color: '#475569', fontWeight: 700, width: '150px' }}>Usuario</th>
              <th style={{ padding: '1rem', color: '#475569', fontWeight: 700, width: '100px' }}>Acción</th>
              <th style={{ padding: '1rem', color: '#475569', fontWeight: 700, width: '180px' }}>Módulo Afectado</th>
              <th style={{ padding: '1rem', color: '#475569', fontWeight: 700 }}>Detalles del Cambio</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Cargando bitácora de auditoría...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No hay registros de auditoría aún.</td>
              </tr>
            ) : (
              logs.map((log) => {
                let parsedDetalles = '';
                try {
                  const detailsObj = JSON.parse(log.detalles);
                  if (detailsObj.nuevoRegistro) {
                    const r = detailsObj.nuevoRegistro;
                    parsedDetalles = `Creación de ${r.tipo === 'INGRESO' ? 'ingreso' : 'gasto'} por $${r.monto.toFixed(2)} (${r.clasificacion || r.categoria}) - Método: ${r.metodo_pago}`;
                  } else if (detailsObj.nuevoBanco) {
                    parsedDetalles = `Registro de cuenta bancaria: ${detailsObj.nuevoBanco.nombre_banco} con saldo $${detailsObj.nuevoBanco.balance}`;
                  } else if (detailsObj.nuevaCajaChica) {
                    parsedDetalles = `Creación de caja chica: ${detailsObj.nuevaCajaChica.nombre_caja} ($${detailsObj.nuevaCajaChica.balance})`;
                  } else if (detailsObj.nuevoProyecto) {
                    parsedDetalles = `Apertura de proyecto especial: ${detailsObj.nuevoProyecto.nombre} (Meta: $${detailsObj.nuevoProyecto.meta})`;
                  } else if (detailsObj.nuevoPresupuesto) {
                    parsedDetalles = `Asignación de presupuesto anual para ${detailsObj.nuevoPresupuesto.ministerio || detailsObj.nuevoPresupuesto.departamento || 'proyecto'}: $${detailsObj.nuevoPresupuesto.monto_asignado}`;
                  } else if (detailsObj.antes && detailsObj.despues) {
                    const before = detailsObj.antes;
                    const after = detailsObj.despues;
                    parsedDetalles = `Anulación de registro ID ${before.id}. Estado cambiado de ${before.estado} a ${after.estado}. Monto: $${before.monto}`;
                  } else {
                    parsedDetalles = log.detalles;
                  }
                } catch {
                  parsedDetalles = log.detalles;
                }

                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem', color: '#1e293b' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '1rem', color: '#475569', fontWeight: 600 }}>
                      {log.usuario_nombre}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: log.accion === 'CREAR' ? '#dcfce7' : log.accion === 'TRANSFERENCIA' ? '#e0f2fe' : '#fee2e2',
                        color: log.accion === 'CREAR' ? '#15803d' : log.accion === 'TRANSFERENCIA' ? '#0369a1' : '#ef4444'
                      }}>
                        {log.accion}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: '#475569', fontWeight: 500 }}>
                      {log.tabla_afectada}
                    </td>
                    <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.8rem', lineHeight: '1.4' }}>
                      {parsedDetalles}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
