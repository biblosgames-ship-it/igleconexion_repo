import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSessionUserId } from "@/lib/active-church";
import { prisma } from "@/lib/prisma";

const configPath = path.join(process.cwd(), "src/lib/plans-config.json");

const defaultConfigs = {
  BASICO: {
    limite_personas: 100,
    limite_usuarios: 15,
    precio_mensual: 15
  },
  PREMIUM: {
    limite_personas: 500,
    limite_usuarios: 50,
    precio_mensual: 30
  },
  PRO: {
    limite_personas: 9999,
    limite_usuarios: 100,
    precio_mensual: 50
  }
};

function readConfig() {
  try {
    if (!fs.existsSync(configPath)) {
      fs.writeFileSync(configPath, JSON.stringify(defaultConfigs, null, 2));
      return defaultConfigs;
    }
    const data = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading plans config:", error);
    return defaultConfigs;
  }
}

// Sincroniza automáticamente los límites y precios de todas las iglesias en la base de datos según su plan asignado
async function syncChurchesWithPlans(config: Record<string, any>) {
  try {
    for (const [planKey, cfg] of Object.entries(config)) {
      if (!cfg) continue;
      await prisma.iglesia.updateMany({
        where: { plan: planKey },
        data: {
          limite_personas: parseInt(cfg.limite_personas) || 100,
          limite_usuarios: parseInt(cfg.limite_usuarios) || 15,
          precio_mensual: parseFloat(cfg.precio_mensual) || 15
        }
      });
    }
  } catch (e) {
    console.error("Error syncing churches with plans:", e);
  }
}

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const userObj = await prisma.usuario.findUnique({
      where: { id: userId },
    });
    if (!userObj || userObj.rol !== "SUPERADMIN") {
      return NextResponse.json({ error: "Prohibido: Acceso restringido a SuperAdministrador" }, { status: 403 });
    }

    const config = readConfig();
    await syncChurchesWithPlans(config);
    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const userObj = await prisma.usuario.findUnique({
      where: { id: userId },
    });
    if (!userObj || userObj.rol !== "SUPERADMIN") {
      return NextResponse.json({ error: "Prohibido: Acceso restringido a SuperAdministrador" }, { status: 403 });
    }

    const newConfig = await request.json();
    
    if (!newConfig.BASICO || !newConfig.PREMIUM || !newConfig.PRO) {
      return NextResponse.json({ error: "Estructura de configuración inválida" }, { status: 400 });
    }

    const cleanedConfig = {
      BASICO: {
        limite_personas: parseInt(newConfig.BASICO.limite_personas) || 100,
        limite_usuarios: parseInt(newConfig.BASICO.limite_usuarios) || 15,
        precio_mensual: parseFloat(newConfig.BASICO.precio_mensual) || 15
      },
      PREMIUM: {
        limite_personas: parseInt(newConfig.PREMIUM.limite_personas) || 500,
        limite_usuarios: parseInt(newConfig.PREMIUM.limite_usuarios) || 50,
        precio_mensual: parseFloat(newConfig.PREMIUM.precio_mensual) || 30
      },
      PRO: {
        limite_personas: parseInt(newConfig.PRO.limite_personas) || 9999,
        limite_usuarios: parseInt(newConfig.PRO.limite_usuarios) || 100,
        precio_mensual: parseFloat(newConfig.PRO.precio_mensual) || 50
      }
    };

    fs.writeFileSync(configPath, JSON.stringify(cleanedConfig, null, 2));
    await syncChurchesWithPlans(cleanedConfig);

    return NextResponse.json({ success: true, config: cleanedConfig });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
