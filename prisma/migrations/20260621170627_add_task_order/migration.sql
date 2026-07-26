-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TareaConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "iglesia_id" TEXT NOT NULL,
    "etapa_id" TEXT,
    "modulo_id" TEXT NOT NULL,
    "nombre_tarea" TEXT NOT NULL,
    "es_obligatoria" BOOLEAN NOT NULL DEFAULT true,
    "dias_limite" INTEGER,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TareaConfig_iglesia_id_fkey" FOREIGN KEY ("iglesia_id") REFERENCES "Iglesia" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TareaConfig_etapa_id_fkey" FOREIGN KEY ("etapa_id") REFERENCES "EtapaConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TareaConfig_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "ModuloConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TareaConfig" ("dias_limite", "es_obligatoria", "etapa_id", "id", "iglesia_id", "modulo_id", "nombre_tarea") SELECT "dias_limite", "es_obligatoria", "etapa_id", "id", "iglesia_id", "modulo_id", "nombre_tarea" FROM "TareaConfig";
DROP TABLE "TareaConfig";
ALTER TABLE "new_TareaConfig" RENAME TO "TareaConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
