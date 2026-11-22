-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "ubs" (
    "id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "pessoas_na_fila" INTEGER NOT NULL,

    CONSTRAINT "ubs_pkey" PRIMARY KEY ("id")
);

