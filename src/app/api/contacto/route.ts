import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, email, telefono, mensaje, sociedad_id } = body;

    if (!nombre || !email || !telefono || !mensaje) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios." },
        { status: 400 }
      );
    }

    const nuevoMensaje = await prisma.contactoMensaje.create({
      data: {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        telefono: telefono.trim(),
        mensaje: mensaje.trim(),
        sociedad_id: sociedad_id || null,
      },
    });

    return NextResponse.json({ success: true, message: nuevoMensaje });
  } catch (error: any) {
    console.error("Error al guardar mensaje de contacto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al procesar el mensaje." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Falta el ID del mensaje." }, { status: 400 });
    }

    await prisma.contactoMensaje.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error al eliminar mensaje de contacto:", error);
    return NextResponse.json(
      { error: "Error al eliminar el mensaje." },
      { status: 500 }
    );
  }
}
