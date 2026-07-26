import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId, getSessionUserId } from '@/lib/active-church';

const ALLOWED_ROLES = ['SUPERADMIN', 'TESORERO', 'ADMIN_IGLESIA'];

async function resolveAuthorizedUser(iglesiaId: string) {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
  if (!usuario) return null;
  if (!ALLOWED_ROLES.includes(usuario.rol)) return null;
  if (usuario.rol !== 'SUPERADMIN' && usuario.iglesia_id !== iglesiaId) return null;
  return usuario;
}

export async function GET(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    
    // Obtenemos todos los miembros marcados como es_empleado junto con su config de nómina
    const empleados = await prisma.persona.findMany({
      where: {
        iglesia_id: iglesiaId,
        es_empleado: true
      },
      include: {
        nomina: true
      }
    });

    return NextResponse.json(empleados);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    const usuario = await resolveAuthorizedUser(iglesiaId);
    if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const body = await request.json();
    const { action, data } = body;

    // Acción para configurar salario/cargo de un empleado
    if (action === 'configurar_empleado') {
      const { persona_id, cargo, salario, frecuencia, fecha_inicio } = data;
      
      const upsertedNomina = await prisma.nominaEmpleado.upsert({
        where: { persona_id },
        update: {
          cargo,
          salario: parseFloat(salario),
          frecuencia,
          fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : null
        },
        create: {
          iglesia_id: iglesiaId,
          persona_id,
          cargo,
          salario: parseFloat(salario),
          frecuencia,
          fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : null
        }
      });
      
      await prisma.persona.update({
        where: { id: persona_id },
        data: { es_empleado: true }
      });
      
      return NextResponse.json(upsertedNomina);
    }

    // Acción para ejecutar pago de nómina de varios empleados
    if (action === 'pagar_nomina') {
      const { empleadosIds, cuenta_fondo_id, fecha, descripcion } = data;
      // empleadosIds es un array de persona_id
      
      const empleados = await prisma.nominaEmpleado.findMany({
        where: { persona_id: { in: empleadosIds } },
        include: { persona: { select: { nombre: true } } }
      });

      const transacciones = [];
      let totalMonto = 0;

      for (const emp of empleados) {
        totalMonto += emp.salario;
        transacciones.push(
          prisma.transaccionFinanciera.create({
            data: {
              iglesia_id: iglesiaId,
              cuenta_fondo_id: cuenta_fondo_id || null,
              tipo: 'EGRESO',
              monto: emp.salario,
              descripcion: `${descripcion || 'Pago de nómina'} - ${emp.persona.nombre}`,
              fecha: new Date(fecha),
              categoria: 'SALARIO',
              clasificacion: 'GASTO',
              metodo_pago: 'TRANSFERENCIA',
              registrado_por: usuario.id,
              usuario_creo_id: usuario.id
            }
          })
        );
      }

      // Si hay una cuenta vinculada, descontamos el total del balance
      if (cuenta_fondo_id) {
        const cuenta = await prisma.cuentaFondo.findUnique({ where: { id: cuenta_fondo_id } });
        if (cuenta) {
          transacciones.push(
            prisma.cuentaFondo.update({
              where: { id: cuenta_fondo_id },
              data: { balance: cuenta.balance - totalMonto }
            })
          );
        }
      }

      await prisma.$transaction(transacciones);

      return NextResponse.json({ success: true, count: empleados.length, totalPagado: totalMonto });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
