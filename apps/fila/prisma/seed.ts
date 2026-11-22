/** Dados mockados. `npm run seed` recria tudo; `--if-empty` só popula banco vazio. */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const UBS = [
  { id: 1, nome: 'UBS Centro', endereco: 'Rua XV de Novembro, 120', pessoasNaFila: 32 },
  { id: 2, nome: 'UBS Vila Nova', endereco: 'Av. Brasil, 2450', pessoasNaFila: 6 },
  { id: 3, nome: 'UBS Jardim América', endereco: 'Rua das Palmeiras, 87', pessoasNaFila: 17 },
  { id: 4, nome: 'UBS São José', endereco: 'Rua Padre Anchieta, 501', pessoasNaFila: 3 },
  { id: 5, nome: 'UBS Parque das Flores', endereco: 'Av. das Hortênsias, 1300', pessoasNaFila: 24 },
];

async function main() {
  if (process.argv.includes('--if-empty') && (await prisma.ubs.count()) > 0) return;

  await prisma.ubs.deleteMany();
  await prisma.ubs.createMany({ data: UBS });
  console.log(`[fila] ${UBS.length} UBS`);
}

main().finally(() => prisma.$disconnect());
