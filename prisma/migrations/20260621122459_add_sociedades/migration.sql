/*
  Warnings:

  - You are about to drop the column `iglesia_id` on the `GrupoConexion` table. All the data in the column will be lost.
  - You are about to drop the column `sexo_requerido` on the `GrupoConexion` table. All the data in the column will be lost.
  - Added the required column `sociedad_id` to the `GrupoConexion` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Sociedad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "iglesia_id" TEXT NOT NULL,
    "nombre_sociedad" TEXT NOT NULL,
    "rango_edad_min" INTEGER,
    "rango_edad_max" INTEGER,
    "sexo_requerido" TEXT,
    CONSTRAINT "Sociedad_iglesia_id_fkey" FOREIGN KEY ("iglesia_id") REFERENCES "Iglesia" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GrupoConexion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sociedad_id" TEXT NOT NULL,
    "nombre_grupo" TEXT NOT NULL,
    "rango_edad_min" INTEGER,
    "rango_edad_max" INTEGER,
    CONSTRAINT "GrupoConexion_sociedad_id_fkey" FOREIGN KEY ("sociedad_id") REFERENCES "Sociedad" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GrupoConexion" ("id", "nombre_grupo", "rango_edad_max", "rango_edad_min") SELECT "id", "nombre_grupo", "rango_edad_max", "rango_edad_min" FROM "GrupoConexion";
DROP TABLE "GrupoConexion";
ALTER TABLE "new_GrupoConexion" RENAME TO "GrupoConexion";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
