import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveChurchId, getSessionUserId } from "@/lib/active-church";

function parseICalEvents(icsText: string) {
  const events: any[] = [];
  const vevents = icsText.split("BEGIN:VEVENT");

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
      // Parse YYYYMMDDTHHMMSSZ or YYYYMMDD
      let fechaFormatted = "";
      let horaFormatted = "";

      if (dtstart.includes("T")) {
        const year = dtstart.substring(0, 4);
        const month = dtstart.substring(4, 6);
        const day = dtstart.substring(6, 8);
        const hour = dtstart.substring(9, 11);
        const min = dtstart.substring(11, 13);
        
        fechaFormatted = `${year}-${month}-${day}`;
        horaFormatted = `${hour}:${min}`;
      } else if (dtstart.length >= 8) {
        const year = dtstart.substring(0, 4);
        const month = dtstart.substring(4, 6);
        const day = dtstart.substring(6, 8);
        fechaFormatted = `${year}-${month}-${day}`;
      }

      events.push({
        titulo: summary,
        descripcion: description || location ? `${description} ${location ? '(Lugar: ' + location + ')' : ''}` : undefined,
        fecha: fechaFormatted,
        hora: horaFormatted || "00:00",
        tipo: "ESPECIAL"
      });
    }
  }

  return events;
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

    // Si es una URL de Google Calendar visual pero no .ics, intentar convertirla
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
        error: `No se pudo obtener el calendario de Google (Código HTTP ${response.status}). Verifica que el calendario esté configurado como Público en Google Calendar.`
      }, { status: 400 });
    }

    const icsText = await response.text();
    const parsedEvents = parseICalEvents(icsText);

    if (parsedEvents.length === 0) {
      return NextResponse.json({ error: "No se encontraron eventos agendados en el archivo iCal de Google Calendar." }, { status: 404 });
    }



    return NextResponse.json({
      success: true,
      totalEncontrados: parsedEvents.length,
      eventos: parsedEvents
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
