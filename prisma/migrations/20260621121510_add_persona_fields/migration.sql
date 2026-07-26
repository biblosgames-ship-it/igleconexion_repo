-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Persona" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "iglesia_id" TEXT NOT NULL,
    "etapa_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "whatsapp" TEXT,
    "fecha_nacimiento" DATETIME,
    "sexo" TEXT,
    "medio_relacion" TEXT,
    "foto_url" TEXT,
    "correo" TEXT,
    "estado_civil" TEXT,
    "tiene_hijos" BOOLEAN NOT NULL DEFAULT false,
    "nivel_academico" TEXT,
    "profesion_oficio" TEXT,
    "formacion_ministerial" BOOLEAN NOT NULL DEFAULT false,
    "sector" TEXT,
    "calle" TEXT,
    "numero_casa" TEXT,
    "grupo_conexion_id" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Persona_iglesia_id_fkey" FOREIGN KEY ("iglesia_id") REFERENCES "Iglesia" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Persona_etapa_id_fkey" FOREIGN KEY ("etapa_id") REFERENCES "EtapaConfig" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Persona_grupo_conexion_id_fkey" FOREIGN KEY ("grupo_conexion_id") REFERENCES "GrupoConexion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Persona" ("createdAt", "etapa_id", "fecha_nacimiento", "foto_url", "grupo_conexion_id", "id", "iglesia_id", "medio_relacion", "nombre", "sexo", "telefono", "updatedAt", "whatsapp") SELECT "createdAt", "etapa_id", "fecha_nacimiento", "foto_url", "grupo_conexion_id", "id", "iglesia_id", "medio_relacion", "nombre", "sexo", "telefono", "updatedAt", "whatsapp" FROM "Persona";
DROP TABLE "Persona";
ALTER TABLE "new_Persona" RENAME TO "Persona";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
