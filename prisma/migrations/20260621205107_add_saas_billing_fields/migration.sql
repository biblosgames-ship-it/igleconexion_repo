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
    "limite_personas" INTEGER NOT NULL DEFAULT 50,
    "limite_usuarios" INTEGER NOT NULL DEFAULT 5,
    "precio_mensual" REAL NOT NULL DEFAULT 29.99,
    "fecha_vencimiento" DATETIME,
    "estado_pago" TEXT NOT NULL DEFAULT 'PAGADO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Iglesia" ("color_principal", "contacto_direccion", "contacto_email", "contacto_telefono", "createdAt", "descripcion", "estado", "eventos", "historia", "id", "link_google_maps", "link_waze", "logo_url", "mision", "nombre_iglesia", "plan", "quienes_somos", "recursos", "redes_sociales", "slogan", "subdominio_o_slug", "updatedAt", "valores", "vision") SELECT "color_principal", "contacto_direccion", "contacto_email", "contacto_telefono", "createdAt", "descripcion", "estado", "eventos", "historia", "id", "link_google_maps", "link_waze", "logo_url", "mision", "nombre_iglesia", "plan", "quienes_somos", "recursos", "redes_sociales", "slogan", "subdominio_o_slug", "updatedAt", "valores", "vision" FROM "Iglesia";
DROP TABLE "Iglesia";
ALTER TABLE "new_Iglesia" RENAME TO "Iglesia";
CREATE UNIQUE INDEX "Iglesia_subdominio_o_slug_key" ON "Iglesia"("subdominio_o_slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
