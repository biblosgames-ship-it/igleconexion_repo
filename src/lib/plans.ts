import fs from "fs";
import path from "path";

export interface PlanLimit {
  limite_personas: number;
  limite_usuarios: number;
  precio_mensual: number;
}

const configPath = path.join(process.cwd(), "src/lib/plans-config.json");

const defaultConfigs: Record<string, PlanLimit> = {
  BASICO: {
    limite_personas: 50,
    limite_usuarios: 5,
    precio_mensual: 29.99
  },
  PREMIUM: {
    limite_personas: 250,
    limite_usuarios: 15,
    precio_mensual: 79.99
  },
  PRO: {
    limite_personas: 9999,
    limite_usuarios: 99,
    precio_mensual: 199.99
  }
};

export function getPlansConfig(): Record<string, PlanLimit> {
  try {
    if (!fs.existsSync(configPath)) {
      return defaultConfigs;
    }
    const data = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading plans config:", error);
    return defaultConfigs;
  }
}

// For backward compatibility
export const PLANS = {
  BASICO: { name: "BASICO", maxMembers: 50, label: "Básico" },
  PREMIUM: { name: "PREMIUM", maxMembers: 250, label: "Premium" },
  PRO: { name: "PRO", maxMembers: 999999, label: "Pro" }
};
