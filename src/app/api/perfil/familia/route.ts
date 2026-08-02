import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { linkFamily, generateFamilyCode } from '@/lib/family';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("session_user_id")?.value;

    if (!sessionUserId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: sessionUserId },
      select: { persona_id: true, email: true, iglesia_id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let personaId = user.persona_id;
    if (!personaId && user.email) {
      const found = await prisma.persona.findFirst({
        where: { correo: user.email }
      });
      if (found) personaId = found.id;
    }

    if (!personaId) {
      return NextResponse.json({ familia: [] });
    }

    const persona = await prisma.persona.findUnique({
      where: { id: personaId },
      select: { familia_codigo: true, iglesia_id: true }
    });

    if (!persona || !persona.familia_codigo) {
      return NextResponse.json({ familia: [] });
    }

    const familiares = await prisma.persona.findMany({
      where: {
        iglesia_id: persona.iglesia_id,
        familia_codigo: persona.familia_codigo
      },
      select: {
        id: true,
        nombre: true,
        rol_familiar: true,
        telefono: true,
        correo: true,
        familia_codigo: true
      }
    });

    return NextResponse.json({ familia: familiares });
  } catch (error) {
    console.error('Error fetching family:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("session_user_id")?.value;

    if (!sessionUserId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: sessionUserId },
      select: { persona_id: true }
    });

    if (!user || !user.persona_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { action, familiarId, rolFamiliar, telefono, correo } = body;

    const parentPersona = await prisma.persona.findUnique({
      where: { id: user.persona_id },
      select: { iglesia_id: true, familia_codigo: true }
    });

    if (!parentPersona) {
      return NextResponse.json({ error: 'Persona no encontrada' }, { status: 404 });
    }

    // Acción: Actualizar contacto de un familiar (hijo/a u otro miembro de la familia)
    if (action === "updateContact") {
      if (!familiarId) {
        return NextResponse.json({ error: 'Falta ID del familiar' }, { status: 400 });
      }

      // Validar que el familiar pertenece al mismo grupo familiar
      const targetChild = await prisma.persona.findFirst({
        where: {
          id: familiarId,
          iglesia_id: parentPersona.iglesia_id,
          familia_codigo: parentPersona.familia_codigo
        }
      });

      if (!targetChild) {
        return NextResponse.json({ error: 'El familiar no pertenece a tu núcleo familiar' }, { status: 403 });
      }

      const updatedChild = await prisma.persona.update({
        where: { id: targetChild.id },
        data: {
          telefono: telefono !== undefined ? (telefono?.trim() || null) : targetChild.telefono,
          correo: correo !== undefined ? (correo?.trim() || null) : targetChild.correo,
          whatsapp: telefono !== undefined ? (telefono?.trim() || null) : targetChild.whatsapp,
        }
      });

      // Si se asigna correo y no tiene usuario, crearlo o vincularlo
      const cleanCorreo = correo?.trim();
      if (cleanCorreo) {
        const existingUser = await prisma.usuario.findUnique({
          where: { email: cleanCorreo }
        });

        if (!existingUser) {
          await prisma.usuario.create({
            data: {
              iglesia_id: parentPersona.iglesia_id,
              email: cleanCorreo,
              password: "password123",
              rol: "MIEMBRO",
              persona_id: updatedChild.id,
            }
          });
        } else if (!existingUser.persona_id) {
          await prisma.usuario.update({
            where: { id: existingUser.id },
            data: { persona_id: updatedChild.id }
          });
        }
      }

      return NextResponse.json({ success: true, persona: updatedChild });
    }

    // Acción: Crear un hijo menor de 9 años directamente por los padres
    if (action === "createChild") {
      const { nombre, fechaNacimiento, sexo } = body;

      if (!nombre || !nombre.trim()) {
        return NextResponse.json({ error: 'El nombre del niño/a es obligatorio' }, { status: 400 });
      }

      if (!fechaNacimiento) {
        return NextResponse.json({ error: 'La fecha de nacimiento es obligatoria para verificar la edad del menor' }, { status: 400 });
      }

      const birthDate = new Date(fechaNacimiento);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age >= 9) {
        return NextResponse.json({ 
          error: `Solo se permite el registro directo de hijos menores de 9 años (el niño/a tiene ${age} años). Para niños de 9 años o más, regístralo mediante el formulario público o contacta al líder de tu iglesia.` 
        }, { status: 400 });
      }

      // Asegurar o generar código de familia usando la función estándar de la iglesia
      let familyCode = parentPersona.familia_codigo;
      if (!familyCode) {
        familyCode = await generateFamilyCode(parentPersona.iglesia_id);
        await prisma.persona.update({
          where: { id: user.persona_id },
          data: { familia_codigo: familyCode }
        });
      }

      // Buscar Etapa inicial (o crear si no existe)
      let etapa = await prisma.etapaConfig.findFirst({
        where: { iglesia_id: parentPersona.iglesia_id },
        orderBy: { orden_secuencial: 'asc' }
      });

      if (!etapa) {
        etapa = await prisma.etapaConfig.create({
          data: {
            iglesia_id: parentPersona.iglesia_id,
            nombre_etapa: "Etapa 1: Amigos / Oyentes",
            orden_secuencial: 1
          }
        });
      }

      // Auto-asignación de Grupo de Conexión según edad y sexo
      const churchGroups = await prisma.grupoConexion.findMany({
        where: { sociedad: { iglesia_id: parentPersona.iglesia_id } }
      });

      let autoGrupoId: string | null = null;
      const matchedGc = churchGroups.find((g) => {
        const minAge = g.rango_edad_min ?? 0;
        const maxAge = g.rango_edad_max ?? 99;
        const ageMatch = age >= minAge && age <= maxAge;

        const gSex = (g.sexo || "").toUpperCase();
        const pSex = (sexo || "").toUpperCase();
        const sexMatch = !gSex || gSex === "MIXTO" || gSex === "MIX" || gSex === pSex;

        return ageMatch && sexMatch;
      });

      if (matchedGc) {
        autoGrupoId = matchedGc.id;
      }

      // Crear el registro del niño
      const newChildData: any = {
        iglesia_id: parentPersona.iglesia_id,
        etapa_id: etapa.id,
        nombre: nombre.trim(),
        fecha_nacimiento: birthDate,
        sexo: sexo || "M",
        familia_codigo: familyCode,
        rol_familiar: "HIJO/A",
        grupo_conexion_id: autoGrupoId,
      };

      const newChild = await prisma.persona.create({
        data: newChildData
      });

      return NextResponse.json({ success: true, persona: newChild });
    }

    // Acción por defecto: Vincular nuevo familiar
    if (!familiarId || !rolFamiliar) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    await linkFamily(parentPersona.iglesia_id, user.persona_id, familiarId, rolFamiliar);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in POST /api/perfil/familia:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
