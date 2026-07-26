-- CreateTable
CREATE TABLE "SubtareaConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tarea_config_id" TEXT NOT NULL,
    "nombre_subtarea" TEXT NOT NULL,
    CONSTRAINT "SubtareaConfig_tarea_config_id_fkey" FOREIGN KEY ("tarea_config_id") REFERENCES "TareaConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HistorialSubtarea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "persona_id" TEXT NOT NULL,
    "subtarea_id" TEXT NOT NULL,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "HistorialSubtarea_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "Persona" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HistorialSubtarea_subtarea_id_fkey" FOREIGN KEY ("subtarea_id") REFERENCES "SubtareaConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "HistorialSubtarea_persona_id_subtarea_id_key" ON "HistorialSubtarea"("persona_id", "subtarea_id");
