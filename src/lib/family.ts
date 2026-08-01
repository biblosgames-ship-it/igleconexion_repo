import { prisma } from '@/lib/prisma';

export async function getIglesiaPrefix(iglesiaId: string): Promise<string> {
  const iglesia = await prisma.iglesia.findUnique({
    where: { id: iglesiaId },
    select: { nombre_iglesia: true }
  });

  if (!iglesia || !iglesia.nombre_iglesia) {
    return 'FAM';
  }

  // Extraer las iniciales de la iglesia (ej: Torre Fuerte -> TF)
  const palabras = iglesia.nombre_iglesia.trim().split(/\s+/);
  if (palabras.length === 1) {
    return palabras[0].substring(0, 2).toUpperCase();
  }
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
}

export async function generateFamilyCode(iglesiaId: string): Promise<string> {
  const prefix = await getIglesiaPrefix(iglesiaId);
  
  // Buscar todos los códigos de familia actuales de esta iglesia que comiencen con el prefijo
  const personas = await prisma.persona.findMany({
    where: { 
      iglesia_id: iglesiaId,
      familia_codigo: { startsWith: prefix }
    },
    select: { familia_codigo: true }
  });

  // Extraer los números y encontrar el primero libre
  const usedNumbers = personas
    .map(p => p.familia_codigo)
    .filter(Boolean)
    .map(c => parseInt(c!.substring(prefix.length), 10))
    .filter(n => !isNaN(n));

  const uniqueNumbers = Array.from(new Set(usedNumbers)).sort((a, b) => a - b);
  
  let nextNumber = 1;
  for (const num of uniqueNumbers) {
    if (num === nextNumber) {
      nextNumber++;
    } else if (num > nextNumber) {
      break; // Encontramos un hueco!
    }
  }

  // Formatear a 4 dígitos (ej: 0001)
  const codeSuffix = nextNumber.toString().padStart(4, '0');
  return `${prefix}${codeSuffix}`;
}

const INVERSE_ROL: Record<string, string> = {
  ESPOSO:  'ESPOSA',
  ESPOSA:  'ESPOSO',
  PADRE:   'HIJO',
  MADRE:   'HIJA',
  HIJO:    'PADRE',
  HIJA:    'MADRE',
};

export async function linkFamily(iglesiaId: string, sourcePersonaId: string, targetPersonaId: string, sourceRol: string) {
  // 1. Obtener la persona origen y destino
  const source = await prisma.persona.findUnique({
    where: { id: sourcePersonaId }
  });
  const target = await prisma.persona.findUnique({
    where: { id: targetPersonaId }
  });

  if (!target || target.iglesia_id !== iglesiaId) {
    throw new Error("El familiar seleccionado no es válido o pertenece a otra iglesia.");
  }

  // Usar el código de familia de cualquiera de los dos que ya lo tenga
  let finalFamilyCode = source?.familia_codigo || target.familia_codigo;

  // 2. Si ninguno de los dos tiene código aún, se genera un único código nuevo para ambos
  if (!finalFamilyCode) {
    finalFamilyCode = await generateFamilyCode(iglesiaId);
  }

  const inverseRol = INVERSE_ROL[sourceRol] || sourceRol;

  // 3. Actualizar origen con su rol y código de familia
  const updatedSource = await prisma.persona.update({
    where: { id: sourcePersonaId },
    data: {
      familia_codigo: finalFamilyCode,
      rol_familiar: sourceRol
    }
  });

  // 4. Actualizar destino con rol inverso y código de familia
  await prisma.persona.update({
    where: { id: targetPersonaId },
    data: {
      familia_codigo: finalFamilyCode,
      // Solo asignar rol inverso si el destino aún no tiene uno
      ...(target.rol_familiar ? {} : { rol_familiar: inverseRol })
    }
  });

  return updatedSource;
}

