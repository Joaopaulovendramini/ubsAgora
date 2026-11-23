/**
 * Dados mockados: horários dos próximos ~30 dias úteis (5 UBS x especialidades), disponibilidade
 * determinística (hash), mais consultas de pacientes do app.
 * `npm run seed` recria tudo; `--if-empty` só popula banco vazio.
 */
import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

const UBS: Record<string, string> = {
  centro: 'UBS Centro',
  vilanova: 'UBS Vila Nova',
  jardim: 'UBS Jardim América',
  saojose: 'UBS São José',
  parqueflores: 'UBS Parque das Flores',
};
const ESP: Record<string, string> = {
  clinico: 'Clínico geral',
  enfermagem: 'Enfermagem',
  odonto: 'Odontologia',
  gineco: 'Ginecologia',
  pediatria: 'Pediatria',
};

// ubs -> especialidade -> profissional
const PROF: Record<string, Record<string, string>> = {
  centro: {
    clinico: 'Dra. Helena Prado',
    enfermagem: 'Enf. Lucas Martins',
    odonto: 'Dra. Fernanda Kato',
    gineco: 'Dra. Patrícia Gomes',
    pediatria: 'Dr. Otávio Lemos',
  },
  vilanova: {
    clinico: 'Dr. Marcos Vieira',
    enfermagem: 'Enf. Tânia Duarte',
    odonto: 'Dr. Rui Albuquerque',
    gineco: 'Dra. Patrícia Gomes',
    pediatria: 'Dra. Camila Reis',
  },
  jardim: {
    clinico: 'Dra. Sílvia Nunes',
    enfermagem: 'Enf. Rosa Lima',
    odonto: 'Dra. Fernanda Kato',
    gineco: 'Dra. Renata Dias',
    pediatria: 'Dr. Otávio Lemos',
  },
  saojose: {
    clinico: 'Dr. Paulo Menezes',
    enfermagem: 'Enf. Cíntia Barros',
    odonto: 'Dra. Alice Tavares',
  },
  parqueflores: {
    clinico: 'Dra. Beatriz Siqueira',
    enfermagem: 'Enf. Gustavo Ramos',
    odonto: 'Dr. Henrique Moraes',
  },
};

const HORAS = [
  '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00',
  '13:30', '14:00', '14:30', '15:00', '15:30', '16:00',
];

const livre = (chave: string) => createHash('sha256').update(chave).digest().readUInt32BE(0) % 100 < 60;

const BRT = 3 * 3600_000;
const dia = (offsetDias: number) => new Date(Date.now() - BRT + offsetDias * 86400_000).toISOString().slice(0, 10);
const proximoDiaUtil = (offsetDias: number) => {
  let d = new Date(`${dia(offsetDias)}T12:00:00Z`);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d = new Date(d.getTime() + 86400_000);
  return d.toISOString().slice(0, 10);
};

type Consulta = { data: string; hora: string; ubs: string; esp: string; nome: string; cns: string; status: string };

async function main() {
  if (process.argv.includes('--if-empty') && (await prisma.horario.count()) > 0) return;

  await prisma.agendamento.deleteMany();
  await prisma.horario.deleteMany();

  // Consultas do app (horário indisponível). Chave data|hora|ubs|esp.
  const cns = (n: number) => `70000000000${String(n).padStart(4, '0')}`;
  const consultas: Consulta[] = [
    { data: dia(0), hora: '08:00', ubs: 'centro', esp: 'clinico', nome: 'Ana Beatriz Lima', cns: cns(2), status: 'atendida' },
    { data: dia(0), hora: '09:30', ubs: 'centro', esp: 'enfermagem', nome: 'José Carlos Ribeiro', cns: cns(3), status: 'agendada' },
    { data: dia(0), hora: '10:00', ubs: 'centro', esp: 'odonto', nome: 'Pedro Henrique Costa', cns: cns(4), status: 'agendada' },
    { data: dia(0), hora: '10:30', ubs: 'centro', esp: 'clinico', nome: 'Maria Aparecida Souza', cns: cns(1), status: 'agendada' },
    { data: dia(0), hora: '11:00', ubs: 'centro', esp: 'gineco', nome: 'Luíza Fernandes', cns: cns(5), status: 'agendada' },
    { data: dia(0), hora: '13:30', ubs: 'centro', esp: 'clinico', nome: 'Rafael Mendes', cns: cns(6), status: 'agendada' },
    { data: dia(0), hora: '14:00', ubs: 'centro', esp: 'clinico', nome: 'Teresa Campos', cns: cns(7), status: 'agendada' },
    { data: proximoDiaUtil(4), hora: '08:30', ubs: 'centro', esp: 'odonto', nome: 'Maria Aparecida Souza', cns: cns(1), status: 'agendada' },
    { data: dia(-36), hora: '09:00', ubs: 'centro', esp: 'clinico', nome: 'Maria Aparecida Souza', cns: cns(1), status: 'atendida' },
    { data: dia(-79), hora: '14:00', ubs: 'centro', esp: 'enfermagem', nome: 'Maria Aparecida Souza', cns: cns(1), status: 'cancelada' },
  ];
  const reservadas = new Set(consultas.map((c) => `${c.data}|${c.hora}|${c.ubs}|${c.esp}`));

  const mk = (data: string, hora: string, ubs: string, esp: string, disponivel: boolean) => ({
    dataHora: new Date(`${data}T${hora}:00-03:00`),
    ubs: UBS[ubs],
    ubsCodigo: ubs,
    profissional: PROF[ubs][esp],
    especialidade: ESP[esp],
    especialidadeId: esp,
    disponivel,
  });

  const horarios = [];
  const hoje = new Date(`${dia(0)}T12:00:00Z`);
  for (let d = 0; d < 30; d++) {
    const dt = new Date(hoje.getTime() + d * 86400_000);
    if (dt.getUTCDay() === 0 || dt.getUTCDay() === 6) continue; // sem fim de semana
    const data = dt.toISOString().slice(0, 10);
    for (const ubs of Object.keys(PROF)) {
      for (const esp of Object.keys(PROF[ubs])) {
        for (const hora of HORAS) {
          const chave = `${data}|${hora}|${ubs}|${esp}`;
          if (reservadas.has(chave)) continue; // criados abaixo, com agendamento
          horarios.push(mk(data, hora, ubs, esp, livre(`${ubs}|${esp}|${data}|${hora}`)));
        }
      }
    }
  }
  await prisma.horario.createMany({ data: horarios });

  for (const c of consultas) {
    const h = await prisma.horario.create({ data: mk(c.data, c.hora, c.ubs, c.esp, false) });
    await prisma.agendamento.create({
      data: { horarioId: h.id, pacienteNome: c.nome, pacienteCns: c.cns, status: c.status },
    });
  }
  console.log(`[agendamento] ${horarios.length + consultas.length} horários, ${consultas.length} consultas`);
}

main().finally(() => prisma.$disconnect());
