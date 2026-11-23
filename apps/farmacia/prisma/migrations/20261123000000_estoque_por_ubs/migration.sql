-- AlterTable
ALTER TABLE "medicamentos" ADD COLUMN "estoqueMinimo" INTEGER NOT NULL DEFAULT 50;

-- CreateTable
CREATE TABLE "estoque" (
    "ubsCodigo" TEXT NOT NULL,
    "medicamentoId" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "estoque_pkey" PRIMARY KEY ("ubsCodigo","medicamentoId")
);

-- CreateTable
CREATE TABLE "movimentacoes" (
    "id" SERIAL NOT NULL,
    "ubsCodigo" TEXT NOT NULL,
    "medicamentoId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "saldo" INTEGER NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "movimentacoes_ubsCodigo_criadaEm_idx" ON "movimentacoes"("ubsCodigo", "criadaEm");

-- CreateIndex
CREATE INDEX "movimentacoes_criadaEm_idx" ON "movimentacoes"("criadaEm");

-- AddForeignKey
ALTER TABLE "estoque" ADD CONSTRAINT "estoque_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "medicamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes" ADD CONSTRAINT "movimentacoes_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "medicamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migra o estoque antigo (único) para a UBS Centro
INSERT INTO "estoque" ("ubsCodigo", "medicamentoId", "quantidade")
SELECT 'centro', "id", "quantidade" FROM "medicamentos";

-- DropColumn
ALTER TABLE "medicamentos" DROP COLUMN "quantidade";
