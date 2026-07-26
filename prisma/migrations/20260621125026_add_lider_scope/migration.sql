-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LiderModulo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario_id" TEXT NOT NULL,
    "modulo_id" TEXT NOT NULL,
    "alcance_tipo" TEXT NOT NULL DEFAULT 'GRUPO_CONEXION',
    "sociedad_id" TEXT,
    "grupo_conexion_id" TEXT,
    CONSTRAINT "LiderModulo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LiderModulo_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "ModuloConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LiderModulo_sociedad_id_fkey" FOREIGN KEY ("sociedad_id") REFERENCES "Sociedad" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LiderModulo_grupo_conexion_id_fkey" FOREIGN KEY ("grupo_conexion_id") REFERENCES "GrupoConexion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_LiderModulo" ("id", "modulo_id", "usuario_id") SELECT "id", "modulo_id", "usuario_id" FROM "LiderModulo";
DROP TABLE "LiderModulo";
ALTER TABLE "new_LiderModulo" RENAME TO "LiderModulo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
