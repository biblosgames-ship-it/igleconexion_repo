-- CreateTable
CREATE TABLE "Iglesia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre_iglesia" TEXT NOT NULL,
    "subdominio_o_slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "iglesia_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'MIEMBRO',
    "persona_id" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Usuario_iglesia_id_fkey" FOREIGN KEY ("iglesia_id") REFERENCES "Iglesia" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Usuario_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "Persona" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LiderModulo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario_id" TEXT NOT NULL,
    "modulo_id" TEXT NOT NULL,
    CONSTRAINT "LiderModulo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LiderModulo_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "ModuloConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EtapaConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "iglesia_id" TEXT NOT NULL,
    "nombre_etapa" TEXT NOT NULL,
    "orden_secuencial" INTEGER NOT NULL,
    CONSTRAINT "EtapaConfig_iglesia_id_fkey" FOREIGN KEY ("iglesia_id") REFERENCES "Iglesia" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModuloConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "iglesia_id" TEXT NOT NULL,
    "nombre_modulo" TEXT NOT NULL,
    CONSTRAINT "ModuloConfig_iglesia_id_fkey" FOREIGN KEY ("iglesia_id") REFERENCES "Iglesia" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TareaConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "iglesia_id" TEXT NOT NULL,
    "etapa_id" TEXT NOT NULL,
    "modulo_id" TEXT NOT NULL,
    "nombre_tarea" TEXT NOT NULL,
    "es_obligatoria" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "TareaConfig_iglesia_id_fkey" FOREIGN KEY ("iglesia_id") REFERENCES "Iglesia" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TareaConfig_etapa_id_fkey" FOREIGN KEY ("etapa_id") REFERENCES "EtapaConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TareaConfig_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "ModuloConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Persona" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "iglesia_id" TEXT NOT NULL,
    "etapa_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "whatsapp" TEXT,
    "fecha_nacimiento" DATETIME,
    "medio_relacion" TEXT,
    "foto_url" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Persona_iglesia_id_fkey" FOREIGN KEY ("iglesia_id") REFERENCES "Iglesia" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Persona_etapa_id_fkey" FOREIGN KEY ("etapa_id") REFERENCES "EtapaConfig" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HistorialTarea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "persona_id" TEXT NOT NULL,
    "tarea_id" TEXT NOT NULL,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "fecha_completa" DATETIME,
    "aprobado_por" TEXT,
    CONSTRAINT "HistorialTarea_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "Persona" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HistorialTarea_tarea_id_fkey" FOREIGN KEY ("tarea_id") REFERENCES "TareaConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Iglesia_subdominio_o_slug_key" ON "Iglesia"("subdominio_o_slug");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_persona_id_key" ON "Usuario"("persona_id");

-- CreateIndex
CREATE UNIQUE INDEX "LiderModulo_usuario_id_modulo_id_key" ON "LiderModulo"("usuario_id", "modulo_id");

-- CreateIndex
CREATE UNIQUE INDEX "EtapaConfig_iglesia_id_orden_secuencial_key" ON "EtapaConfig"("iglesia_id", "orden_secuencial");

-- CreateIndex
CREATE UNIQUE INDEX "HistorialTarea_persona_id_tarea_id_key" ON "HistorialTarea"("persona_id", "tarea_id");
