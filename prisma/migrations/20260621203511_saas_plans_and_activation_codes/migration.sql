-- CreateTable
CREATE TABLE "CodigoActivacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'BASICO',
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "iglesia_id" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Iglesia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre_iglesia" TEXT NOT NULL,
    "subdominio_o_slug" TEXT NOT NULL,
    "slogan" TEXT,
    "logo_url" TEXT,
    "color_principal" TEXT DEFAULT '#0284c7',
    "descripcion" TEXT,
    "quienes_somos" TEXT,
    "mision" TEXT,
    "vision" TEXT,
    "valores" TEXT,
    "historia" TEXT,
    "contacto_telefono" TEXT,
    "contacto_email" TEXT,
    "contacto_direccion" TEXT,
    "link_google_maps" TEXT,
    "link_waze" TEXT,
    "redes_sociales" TEXT,
    "recursos" TEXT,
    "eventos" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'BASICO',
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Iglesia" ("color_principal", "contacto_direccion", "contacto_email", "contacto_telefono", "createdAt", "descripcion", "eventos", "historia", "id", "link_google_maps", "link_waze", "logo_url", "mision", "nombre_iglesia", "quienes_somos", "recursos", "redes_sociales", "slogan", "subdominio_o_slug", "updatedAt", "valores", "vision") SELECT "color_principal", "contacto_direccion", "contacto_email", "contacto_telefono", "createdAt", "descripcion", "eventos", "historia", "id", "link_google_maps", "link_waze", "logo_url", "mision", "nombre_iglesia", "quienes_somos", "recursos", "redes_sociales", "slogan", "subdominio_o_slug", "updatedAt", "valores", "vision" FROM "Iglesia";
DROP TABLE "Iglesia";
ALTER TABLE "new_Iglesia" RENAME TO "Iglesia";
CREATE UNIQUE INDEX "Iglesia_subdominio_o_slug_key" ON "Iglesia"("subdominio_o_slug");
CREATE TABLE "new_Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "iglesia_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'MIEMBRO',
    "persona_id" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Usuario_iglesia_id_fkey" FOREIGN KEY ("iglesia_id") REFERENCES "Iglesia" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Usuario_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "Persona" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Usuario" ("createdAt", "email", "id", "iglesia_id", "password", "persona_id", "rol", "updatedAt") SELECT "createdAt", "email", "id", "iglesia_id", "password", "persona_id", "rol", "updatedAt" FROM "Usuario";
DROP TABLE "Usuario";
ALTER TABLE "new_Usuario" RENAME TO "Usuario";
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
CREATE UNIQUE INDEX "Usuario_persona_id_key" ON "Usuario"("persona_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CodigoActivacion_codigo_key" ON "CodigoActivacion"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "CodigoActivacion_iglesia_id_key" ON "CodigoActivacion"("iglesia_id");
