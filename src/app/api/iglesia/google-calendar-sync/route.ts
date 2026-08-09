import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveChurchId, getSessionUserId } from "@/lib/active-church";

function parseICalEvents(icsText: string) {
  const events: any[] = [];
  const vevents = icsText.split("BEGIN:VEVENT");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(today.getDate() + 30);
  thirtyDaysLater.setHours(23, 59, 59, 999);

  for (let i = 1; i < vevents.length; i++) {
    const block = vevents[i].split("END:VEVENT")[0];
    
    let summary = "";
    let description = "";
    let dtstart = "";
    let location = "";

    const lines = block.split(/\r?\n/);
    for (let line of lines) {
      if (line.startsWith("SUMMARY:")) {
        summary = line.replace("SUMMARY:", "").trim();
      } else if (line.startsWith("DESCRIPTION:")) {
        description = line.replace("DESCRIPTION:", "").trim();
      } else if (line.startsWith("DTSTART")) {
        const parts = line.split(":");
        dtstart = parts[parts.length - 1].trim();
      } else if (line.startsWith("LOCATION:")) {
        location = line.replace("LOCATION:", "").trim();
      }
    }

    if (summary && dtstart) {
      let year = 0, month = 0, day = 0, hour = 0, min = 0;

      if (dtstart.includes("T")) {
        year = parseInt(dtstart.substring(0, 4));
        month = parseInt(dtstart.substring(4, 6)) - 1;
        day = parseInt(dtstart.substring(6, 8));
        hour = parseInt(dtstart.substring(9, 11));
        min = parseInt(dtstart.substring(11, 13));
      } else if (dtstart.length >= 8) {
        year = parseInt(dtstart.substring(0, 4));
        month = parseInt(dtstart.substring(4, 6)) - 1;
        day = parseInt(dtstart.substring(6, 8));
      }

      if (!year || isNaN(year)) continue;

      const eventDate = new Date(year, month, day, hour, min);

      // FILTRO 1: Ignorar eventos pasados
      if (eventDate < today) continue;

      // FILTRO 2: Solo eventos en los próximos 30 días (1 mes de programación)
      if (eventDate > thirtyDaysLater) continue;

      const fechaFormatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const horaFormatted = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

      events.push({
        titulo: summary,
        descripcion: description || (location ? `Lugar: ${location}` : undefined),
        fecha: fechaFormatted,
        hora: horaFormatted || "00:00",
        tipo: "ESPECIAL"
      });
    }
  }

  // Ordenar cronológicamente por fecha
  events.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  // Deduplicar por título y fecha exacta
  const uniqueMap = new Map();
  for (const ev of events) {
    const key = `${ev.titulo.toLowerCase().trim()}_${ev.fecha}`;
    if (!uniqueMap.has(key)) uniqueMap.set(key, ev);
  }

  return Array.from(uniqueMap.values());
}

export async function POST(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const body = await request.json();
    const { calendarUrl, calendarId } = body;

    let targetUrl = calendarUrl?.trim();
    if (!targetUrl && calendarId?.trim()) {
      const cleanId = calendarId.trim();
      targetUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(cleanId)}/public/basic.ics`;
    }

    if (!targetUrl) {
      return NextResponse.json({ error: "Se requiere una URL de iCal (.ics) o ID de Google Calendar" }, { status: 400 });
    }

    if (targetUrl.includes("calendar.google.com/calendar/embed") || targetUrl.includes("calendar.google.com/calendar/u/")) {
      const match = targetUrl.match(/src=([^&]+)/);
      if (match && match[1]) {
        const cid = decodeURIComponent(match[1]);
        targetUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(cid)}/public/basic.ics`;
      }
    }

    const response = await fetch(targetUrl, { headers: { "User-Agent": "Mozilla/5.0 (Igleconet-Sync)" } });
    if (!response.ok) {
      return NextResponse.json({
        error: `No se pudo conectar con Google Calendar (Código HTTP ${response.status}). Verifica que el calendario esté configurado como Público en los ajustes de Google Calendar.`
      }, { status: 400 });
    }

    const icsText = await response.text();
    const parsedEvents = parseICalEvents(icsText);

    if (parsedEvents.length === 0) {
      return NextResponse.json({ error: "No se encontraron eventos futuros para los próximos 30 días en Google Calendar." }, { status: 404 });
    }

    // Cargar iglesia actual para combinar eventos
    const iglesia = await prisma.iglesia.findUnique({ where: { id: iglesiaId } });
    let existingEvents: any[] = [];
    if (iglesia?.eventos) {
      try { existingEvents = JSON.parse(iglesia.eventos); } catch (e) {}
    }

    // Filtrar duplicados con eventos semanales existentes
    const newEventsToAdd: any[] = [];
    let countImportados = 0;

    for (const gEv of parsedEvents) {
      const yaExisteEnAgenda = existingEvents.some(
        e => e.titulo?.toLowerCase().trim() === gEv.titulo?.toLowerCase().trim() && e.fecha === gEv.fecha
      );

      if (!yaExisteEnAgenda) {
        newEventsToAdd.push({
          id: "gcal-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
          titulo: gEv.titulo,
          descripcion: gEv.descripcion || "Sincronizado desde Google Calendar",
          tipo: "ESPECIAL",
          fecha: gEv.fecha,
          hora: gEv.hora,
          diaSemana: "Lunes",
          sociedadId: null
        });
        countImportados++;
      }
    }

    const updatedEventsList = [...existingEvents, ...newEventsToAdd];

    // Persistir directamente en la base de datos
    await prisma.iglesia.update({
      where: { id: iglesiaId },
      data: { eventos: JSON.stringify(updatedEventsList) }
    });

    return NextResponse.json({
      success: true,
      totalProximos30Dias: parsedEvents.length,
      nuevosImportados: countImportados,
      eventos: updatedEventsList
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
