-- AlterTable
ALTER TABLE "horarios" ADD COLUMN "ubs_codigo" TEXT, ADD COLUMN "especialidade_id" TEXT;
ALTER TABLE "agendamentos" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'agendada';

-- Backfill dos dados existentes
UPDATE "horarios" SET "ubs_codigo" = CASE "ubs"
  WHEN 'UBS Centro' THEN 'centro'
  WHEN 'UBS Vila Nova' THEN 'vilanova'
  WHEN 'UBS Jardim América' THEN 'jardim'
  WHEN 'UBS São José' THEN 'saojose'
  WHEN 'UBS Parque das Flores' THEN 'parqueflores'
  ELSE lower(regexp_replace("ubs", '[^a-zA-Z0-9]', '', 'g')) END;

UPDATE "horarios" SET "especialidade_id" = CASE
  WHEN "especialidade" ILIKE 'Cl%nic%' THEN 'clinico'
  WHEN "especialidade" ILIKE 'Enfermagem%' THEN 'enfermagem'
  WHEN "especialidade" ILIKE 'Odonto%' THEN 'odonto'
  WHEN "especialidade" ILIKE 'Gineco%' THEN 'gineco'
  WHEN "especialidade" ILIKE 'Pediatria%' THEN 'pediatria'
  ELSE lower(regexp_replace("especialidade", '[^a-zA-Z0-9]', '', 'g')) END;

UPDATE "horarios" SET "especialidade" = CASE "especialidade_id"
  WHEN 'clinico' THEN 'Clínico geral'
  WHEN 'enfermagem' THEN 'Enfermagem'
  WHEN 'odonto' THEN 'Odontologia'
  WHEN 'gineco' THEN 'Ginecologia'
  WHEN 'pediatria' THEN 'Pediatria'
  ELSE "especialidade" END;

ALTER TABLE "horarios" ALTER COLUMN "ubs_codigo" SET NOT NULL, ALTER COLUMN "especialidade_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "horarios_ubs_codigo_especialidade_id_idx" ON "horarios"("ubs_codigo", "especialidade_id");
