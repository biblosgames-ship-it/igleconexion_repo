import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId, getSessionUserId } from '@/lib/active-church';

export async function POST(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    const userId = await getSessionUserId();
    if (!iglesiaId || !userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await request.json();
    const { promesa_id, monto, metodo_pago, cuenta_fondo_id, descripcion } = body;

    if (!promesa_id || !monto) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    }

    const promesa = await prisma.promesaFe.findUnique({
      where: { id: promesa_id },
      include: { proyecto: true }
    });

    if (!promesa || promesa.iglesia_id !== iglesiaId) {
      return NextResponse.json({ error: 'Promesa no encontrada' }, { status: 404 });
    }

    // Usar transacción para consistencia
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear TransaccionFinanciera
      const abono = await tx.transaccionFinanciera.create({
        data: {
          iglesia_id: iglesiaId,
          tipo: 'INGRESO',
          clasificacion: 'OFRENDA',
          categoria: 'DONACION_ESPECIAL',
          descripcion: descripcion || `Abono a Promesa: ${promesa.proyecto?.nombre}`,
          monto: parseFloat(monto),
          fecha: new Date(),
          metodo_pago: metodo_pago || 'EFECTIVO',
          registrado_por: userId,
          usuario_creo_id: userId,
          miembro_id: promesa.persona_id,
          cuenta_fondo_id: cuenta_fondo_id || null,
          promesa_fe_id: promesa.id
        }
      });

      // 2. Actualizar monto_aportado
      const nuevoAportado = promesa.monto_aportado + parseFloat(monto);
      let estado = promesa.estado;
      if (nuevoAportado >= promesa.monto_promesa) {
        estado = 'COMPLETADA';
      }

      const promesaActualizada = await tx.promesaFe.update({
        where: { id: promesa.id },
        data: {
          monto_aportado: nuevoAportado,
          estado
        }
      });

      return { abono, promesaActualizada };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
