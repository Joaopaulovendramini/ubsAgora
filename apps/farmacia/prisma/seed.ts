/** Dados mockados. `npm run seed` recria tudo; `--if-empty` só popula banco vazio. */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// [nome, concentração, forma, estoque base (UBS Centro)]
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

const UBS = ['centro', 'vilanova', 'jardim', 'saojose', 'parqueflores'] as const;
type Ubs = (typeof UBS)[number];
const FATOR: Record<Ubs, number> = { centro: 1, vilanova: 0.6, jardim: 0.8, saojose: 0.35, parqueflores: 0.5 };
const SEM_ESTOQUE_NA_REDE = ['Azitromicina', 'Albendazol', 'Captopril'];
const ZERADOS_NO_CENTRO = ['Dipirona Gotas', 'Ibuprofeno', 'Salbutamol', 'Insulina NPH', 'Prednisona'];

/** Estoque final determinista de cada (UBS, medicamento). */
function estoqueFinal(nome: string, base: number, i: number, ubs: Ubs): number {
  if (SEM_ESTOQUE_NA_REDE.includes(nome)) return 0;
  if (ubs === 'centro') return ZERADOS_NO_CENTRO.includes(nome) ? 0 : base;
  const u = UBS.indexOf(ubs);
  const baseRede = ZERADOS_NO_CENTRO.includes(nome) ? Math.max(base, 60) : base;
  return Math.max(5, Math.round(baseRede * FATOR[ubs] * (0.7 + ((i * 3 + u * 5) % 7) / 10)));
}

// [ubs, medicamento, hora (Brasília), tipo, quantidade] -- movimentações de hoje
const MOVIMENTACOES: [Ubs, string, string, 'entrada' | 'baixa', number][] = [
  ['centro', 'Ibuprofeno', '08:05', 'baixa', 35],
  ['centro', 'Dipirona', '08:40', 'baixa', 100],
  ['centro', 'Paracetamol', '08:40', 'baixa', 80],
  ['centro', 'Losartana', '09:15', 'entrada', 300],
  ['vilanova', 'Metformina', '08:50', 'baixa', 120],
  ['vilanova', 'Amoxicilina', '09:30', 'baixa', 45],
  ['vilanova', 'Dipirona', '10:10', 'baixa', 50],
  ['vilanova', 'Omeprazol', '11:20', 'baixa', 70],
  ['jardim', 'Losartana', '09:00', 'baixa', 210],
  ['jardim', 'Enalapril', '09:45', 'baixa', 40],
  ['jardim', 'Paracetamol', '10:30', 'baixa', 110],
  ['saojose', 'Metformina', '08:30', 'baixa', 75],
  ['saojose', 'Sulfato Ferroso', '08:45', 'baixa', 140],
  ['saojose', 'Amoxicilina', '09:10', 'baixa', 30],
  ['saojose', 'Fluoxetina', '09:20', 'baixa', 18],
  ['saojose', 'Sinvastatina', '10:00', 'baixa', 55],
  ['parqueflores', 'Dipirona', '08:20', 'baixa', 60],
  ['parqueflores', 'Ácido Fólico', '08:55', 'baixa', 40],
  ['parqueflores', 'Omeprazol', '09:05', 'baixa', 130],
  ['parqueflores', 'Anlodipino', '09:40', 'baixa', 65],
  ['parqueflores', 'Hidroclorotiazida', '10:15', 'baixa', 70],
];

/** Hoje no horário de Brasília (UTC-3 fixo) como [ano, mês, dia]. */
function hojeBrasilia(): [number, number, number] {
  const d = new Date(Date.now() - 3 * 3600 * 1000);
  return [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()];
}

async function main() {
  if (process.argv.includes('--if-empty') && (await prisma.medicamento.count()) > 0) return;

  // zera também as sequences, para os ids dos medicamentos serem sempre 1..28
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "movimentacoes", "estoque", "medicamentos" RESTART IDENTITY CASCADE');
  await prisma.medicamento.createMany({
    data: MEDICAMENTOS.map(([nome, concentracao, forma]) => ({ nome, concentracao, forma })),
  });
  const meds = await prisma.medicamento.findMany();
  const idPorNome = new Map(meds.map((m) => [m.nome, m.id]));

  const final = new Map<string, number>(); // `${ubs}|${medId}` -> estoque final
  MEDICAMENTOS.forEach(([nome, , , base], i) => {
    for (const ubs of UBS) final.set(`${ubs}|${idPorNome.get(nome)}`, estoqueFinal(nome, base, i, ubs));
  });

  // Saldo inicial = final + baixas - entradas, para que os saldos das movimentações batam com o estoque.
  const inicial = new Map(final);
  for (const [ubs, nome, , tipo, qtd] of MOVIMENTACOES) {
    const k = `${ubs}|${idPorNome.get(nome)}`;
    inicial.set(k, inicial.get(k)! + (tipo === 'baixa' ? qtd : -qtd));
  }

  const [y, m, d] = hojeBrasilia();
  const ordenadas = [...MOVIMENTACOES].sort((a, b) => a[2].localeCompare(b[2]));
  const saldo = new Map(inicial);
  const movimentacoes = ordenadas.map(([ubs, nome, hora, tipo, quantidade]) => {
    const medicamentoId = idPorNome.get(nome)!;
    const k = `${ubs}|${medicamentoId}`;
    const novo = saldo.get(k)! + (tipo === 'baixa' ? -quantidade : quantidade);
    if (novo < 0) throw new Error(`saldo negativo no seed: ${k}`);
    saldo.set(k, novo);
    const [hh, mm] = hora.split(':').map(Number);
    return { ubsCodigo: ubs, medicamentoId, tipo, quantidade, saldo: novo, criadaEm: new Date(Date.UTC(y, m, d, hh + 3, mm)) };
  });
  for (const [k, v] of final) if (saldo.get(k) !== v) throw new Error(`seed inconsistente: ${k}`);

  await prisma.estoque.createMany({
    data: [...inicial.keys()].map((k) => {
      const [ubsCodigo, id] = k.split('|');
      return { ubsCodigo, medicamentoId: Number(id), quantidade: final.get(k)! };
    }),
  });
  await prisma.movimentacao.createMany({ data: movimentacoes });
  console.log(`[farmacia] ${MEDICAMENTOS.length} medicamentos, ${final.size} estoques, ${movimentacoes.length} movimentações`);
}

main().finally(() => prisma.$disconnect());
