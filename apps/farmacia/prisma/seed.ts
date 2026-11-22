/** Dados mockados. `npm run seed` recria tudo; `--if-empty` só popula banco vazio. */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// [nome, concentração, forma, quantidade em estoque]
const MEDICAMENTOS: [string, string, string, number][] = [
  ['Dipirona', '500 mg', 'Comprimido', 820],
  ['Dipirona Gotas', '500 mg/mL', 'Solução oral', 0],
  ['Paracetamol', '500 mg', 'Comprimido', 640],
  ['Ibuprofeno', '600 mg', 'Comprimido', 35],
  ['Amoxicilina', '500 mg', 'Cápsula', 410],
  ['Amoxicilina Suspensão', '250 mg/5 mL', 'Suspensão oral', 12],
  ['Azitromicina', '500 mg', 'Comprimido', 0],
  ['Cefalexina', '500 mg', 'Cápsula', 230],
  ['Losartana', '50 mg', 'Comprimido', 1500],
  ['Enalapril', '10 mg', 'Comprimido', 300],
  ['Captopril', '25 mg', 'Comprimido', 0],
  ['Anlodipino', '5 mg', 'Comprimido', 720],
  ['Hidroclorotiazida', '25 mg', 'Comprimido', 540],
  ['Metformina', '850 mg', 'Comprimido', 980],
  ['Glibenclamida', '5 mg', 'Comprimido', 260],
  ['Insulina NPH', '100 UI/mL', 'Suspensão injetável', 40],
  ['Sinvastatina', '20 mg', 'Comprimido', 610],
  ['Omeprazol', '20 mg', 'Cápsula', 1200],
  ['Loratadina', '10 mg', 'Comprimido', 150],
  ['Prednisona', '20 mg', 'Comprimido', 90],
  ['Salbutamol', '100 mcg/dose', 'Aerossol', 18],
  ['Levotiroxina', '50 mcg', 'Comprimido', 330],
  ['Sulfato Ferroso', '40 mg', 'Comprimido', 700],
  ['Ácido Fólico', '5 mg', 'Comprimido', 450],
  ['Albendazol', '400 mg', 'Comprimido', 0],
  ['Fluconazol', '150 mg', 'Cápsula', 75],
  ['Fluoxetina', '20 mg', 'Cápsula', 200],
  ['Sertralina', '50 mg', 'Comprimido', 140],
];

async function main() {
  if (process.argv.includes('--if-empty') && (await prisma.medicamento.count()) > 0) return;

  await prisma.medicamento.deleteMany();
  await prisma.medicamento.createMany({
    data: MEDICAMENTOS.map(([nome, concentracao, forma, quantidade]) => ({ nome, concentracao, forma, quantidade })),
  });
  console.log(`[farmacia] ${MEDICAMENTOS.length} medicamentos`);
}

main().finally(() => prisma.$disconnect());
