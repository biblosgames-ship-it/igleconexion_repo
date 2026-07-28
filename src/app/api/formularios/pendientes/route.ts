import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId } from '@/lib/active-church';
import { cookies } from 'next/headers';
import * as jose from 'jose';

export async function GET(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');
    
    if (!token) return NextResponse.json({ pending: null });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');
    const { payload } = await jose.jwtVerify(token.value, secret);
    
    const usuarioId = payload.id as string;

    const user = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        iglesia_id: true,
        rol: true,
        persona_id: true,
        persona: {
          select: {
            etapa_id: true,
            grupo_conexion: { select: { id: true, sociedad_id: true } },
            asistenteEventos: { select: { evento_id: true } }
          }
        }
      }
    });

    const formsPublicados = await prisma.formulario.findMany({
      where: { 
        iglesia_id: iglesiaId,
        estado: 'PUBLICADO'
      },
      orderBy: { createdAt: 'desc' }
    });

    const pendingForms: any[] = [];

    // Batch query: get all form IDs the user already responded to (fix N+1)
    const respondedFormIds = user?.persona_id
      ? new Set(
          (await prisma.respuestaFormulario.findMany({
            where: {
              persona_id: user.persona_id,
              formulario_id: { in: formsPublicados.map(f => f.id) },
            },
            select: { formulario_id: true },
          })).map(r => r.formulario_id)
        )
      : new Set();

    for (const form of formsPublicados) {
      if (respondedFormIds.has(form.id)) continue;

      // 2. Check Targeting criteria
      let matchesTarget = true;
      
      if (form.target_rol && form.target_rol !== user?.rol) {
        matchesTarget = false;
      }
      
      if (form.target_grupo_id && form.target_grupo_id !== user?.persona?.grupo_conexion?.id) {
        matchesTarget = false;
      }

      if (form.target_sociedad_id) {
         if (user?.persona?.grupo_conexion?.sociedad_id !== form.target_sociedad_id) {
           matchesTarget = false;
         }
      }

      if (form.target_evento_id) {
         const inscrito = user?.persona?.asistenteEventos.some(a => a.evento_id === form.target_evento_id);
         if (!inscrito) matchesTarget = false;
      }

      if (form.target_etapa_id && form.target_etapa_id !== user?.persona?.etapa_id) {
         matchesTarget = false;
      }

      if (matchesTarget) {
         pendingForms.push(form);
      }
    }

    const firstPending = pendingForms[0] || null;

    return NextResponse.json({ 
      pending: firstPending ? firstPending.id : null,
      pendingForm: firstPending,
      pendingForms: pendingForms
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
