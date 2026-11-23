/** Dados mockados, relativos a hoje (Brasília). `npm run seed` recria tudo; `--if-empty` só popula banco vazio. */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const UBS = [
  { id: 1, codigo: 'centro', nome: 'UBS Centro', endereco: 'Rua XV de Novembro, 120' },
  { id: 2, codigo: 'vilanova', nome: 'UBS Vila Nova', endereco: 'Av. Brasil, 2450' },
  { id: 3, codigo: 'jardim', nome: 'UBS Jardim América', endereco: 'Rua das Palmeiras, 87' },
  { id: 4, codigo: 'saojose', nome: 'UBS São José', endereco: 'Rua Padre Anchieta, 501' },
  { id: 5, codigo: 'parqueflores', nome: 'UBS Parque das Flores', endereco: 'Av. das Hortênsias, 1300' },
];

// chegadas médias por hora (7..17)
const FLUXO: Record<number, number[]> = {
  1: [14, 22, 26, 19, 12, 8, 10, 15, 13, 9, 5],
  2: [6, 11, 12, 9, 7, 4, 6, 8, 7, 5, 3],
  3: [18, 27, 31, 24, 15, 9, 12, 17, 16, 11, 6],
  4: [4, 7, 9, 6, 5, 3, 4, 5, 5, 3, 2],
  5: [10, 16, 19, 15, 9, 6, 8, 12, 11, 7, 4],
};

const AGUARDANDO: Record<number, number> = { 1: 32, 2: 6, 3: 17, 4: 3, 5: 24 };
const ATENDIDAS: Record<number, number> = { 1: 0, 2: 4, 3: 6, 4: 2, 5: 5 };

const hoje = new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
const at = (hhmm: string, ss = 0) => new Date(`${hoje}T${hhmm}:${String(ss).padStart(2, '0')}-03:00`);

type S = {
  codigo: string; ubsId: number; tipo: string; status: string; criadaEm: Date;
  consultaId?: number; pacienteCns?: string; guiche?: string;
};

const mm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/** UBS genéricas: senhas em ordem de criação entre 07:30 e 09:40, ~1 P a cada 4. */
function gerarGenerica(ubsId: number): S[] {
  const total = ATENDIDAS[ubsId] + 1 + AGUARDANDO[ubsId];
  const cont = { N: 0, P: 0 };
  const out: S[] = [];
  for (let i = 0; i < total; i++) {
    const tipo = i % 4 === 3 ? 'P' : 'N';
    cont[tipo]++;
    const min = 450 + Math.round((i * 130) / Math.max(total - 1, 1)); // 07:30 .. 09:40
    const status = i < ATENDIDAS[ubsId] ? 'atendida' : i === ATENDIDAS[ubsId] ? 'chamada' : 'aguardando';
    out.push({
      codigo: `${tipo}${String(cont[tipo]).padStart(3, '0')}`,
      ubsId, tipo, status, criadaEm: at(mm(min), (i * 7) % 60),
      guiche: status === 'aguardando' ? undefined : 'Guichê 1',
    });
  }
  return out;
}

function gerarCentro(): S[] {
  const u = 1;
  const out: S[] = [];
  const n = (num: number) => `N${String(num).padStart(3, '0')}`;
  const p = (num: number) => `P${String(num).padStart(3, '0')}`;
  const base = { ubsId: u };
  // atendidas sintéticas antes da N007
  for (let i = 1; i <= 6; i++)
    out.push({ ...base, codigo: n(i), tipo: 'N', status: 'atendida', criadaEm: at(mm(450 + (i - 1) * 3)), guiche: 'Guichê 1' });
  out.push({ ...base, codigo: p(1), tipo: 'P', status: 'atendida', criadaEm: at('07:36'), guiche: 'Guichê 2' });
  out.push({ ...base, codigo: p(2), tipo: 'P', status: 'atendida', criadaEm: at('07:44'), guiche: 'Guichê 2' });
  out.push({ ...base, codigo: n(7), tipo: 'N', status: 'atendida', criadaEm: at('07:52'), consultaId: 101, pacienteCns: '700000000000002', guiche: 'Guichê 1' });
  out.push({ ...base, codigo: p(3), tipo: 'P', status: 'atendida', criadaEm: at('08:05'), pacienteCns: '700000000000008', guiche: 'Guichê 2' });
  out.push({ ...base, codigo: n(8), tipo: 'N', status: 'atendida', criadaEm: at('08:20'), pacienteCns: '700000000000009', guiche: 'Guichê 1' });
  out.push({ ...base, codigo: n(9), tipo: 'N', status: 'chamada', criadaEm: at('09:05'), pacienteCns: '700000000000010', guiche: 'Guichê 2' });
  out.push({ ...base, codigo: p(4), tipo: 'P', status: 'aguardando', criadaEm: at('09:18'), pacienteCns: '700000000000011' });
  out.push({ ...base, codigo: n(10), tipo: 'N', status: 'aguardando', criadaEm: at('09:24'), pacienteCns: '700000000000012' });
  out.push({ ...base, codigo: n(11), tipo: 'N', status: 'aguardando', criadaEm: at('09:30') });
  out.push({ ...base, codigo: n(12), tipo: 'N', status: 'aguardando', criadaEm: at('09:36'), pacienteCns: '700000000000013' });
  // 28 sintéticas (N013..N040): depois das 4 primeiras da ordem de chamada, até 09:40
  for (let i = 0; i < 28; i++)
    out.push({ ...base, codigo: n(13 + i), tipo: 'N', status: 'aguardando', criadaEm: at('09:37', Math.round((i * 59) / 27)) });
  return out;
}

async function main() {
  if (process.argv.includes('--if-empty') && (await prisma.ubs.count()) > 0) return;

  await prisma.senha.deleteMany();
  await prisma.fluxoHora.deleteMany();
  await prisma.ubs.deleteMany();
  await prisma.ubs.createMany({ data: UBS });

  await prisma.fluxoHora.createMany({
    data: UBS.flatMap((u) => FLUXO[u.id].map((chegadas, i) => ({ ubsId: u.id, hora: 7 + i, chegadas }))),
  });

  const senhas = [...gerarCentro(), ...[2, 3, 4, 5].flatMap(gerarGenerica)];
  await prisma.senha.createMany({ data: senhas });
  console.log(`[fila] ${UBS.length} UBS, ${senhas.length} senhas (hoje ${hoje})`);
}

main().finally(() => prisma.$disconnect());
