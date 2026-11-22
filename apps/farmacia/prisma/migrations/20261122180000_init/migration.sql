-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "medicamentos" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "concentracao" TEXT NOT NULL,
    "forma" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "medicamentos_pkey" PRIMARY KEY ("id")
);

