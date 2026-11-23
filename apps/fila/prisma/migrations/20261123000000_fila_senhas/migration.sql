-- AlterTable: codigo da UBS (slug)
ALTER TABLE "ubs" ADD COLUMN "codigo" TEXT;
UPDATE "ubs" SET "codigo" = CASE "id"
  WHEN 1 THEN 'centro'
  WHEN 2 THEN 'vilanova'
  WHEN 3 THEN 'jardim'
  WHEN 4 THEN 'saojose'
  WHEN 5 THEN 'parqueflores'
  ELSE 'ubs' || "id"::text END;
ALTER TABLE "ubs" ALTER COLUMN "codigo" SET NOT NULL;
CREATE UNIQUE INDEX "ubs_codigo_key" ON "ubs"("codigo");

-- pessoas na fila passa a ser derivado das senhas aguardando
ALTER TABLE "ubs" DROP COLUMN "pessoas_na_fila";

-- CreateTable
CREATE TABLE "senhas" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "ubs_id" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aguardando',
    "criada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consulta_id" INTEGER,
    "paciente_cns" TEXT,
    "guiche" TEXT,

    CONSTRAINT "senhas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fluxo_horas" (
    "ubs_id" INTEGER NOT NULL,
    "hora" INTEGER NOT NULL,
    "chegadas" INTEGER NOT NULL,

    CONSTRAINT "fluxo_horas_pkey" PRIMARY KEY ("ubs_id","hora")
);

-- CreateIndex
CREATE INDEX "senhas_ubs_id_criada_em_idx" ON "senhas"("ubs_id", "criada_em");

-- AddForeignKey
ALTER TABLE "senhas" ADD CONSTRAINT "senhas_ubs_id_fkey" FOREIGN KEY ("ubs_id") REFERENCES "ubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fluxo_horas" ADD CONSTRAINT "fluxo_horas_ubs_id_fkey" FOREIGN KEY ("ubs_id") REFERENCES "ubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
