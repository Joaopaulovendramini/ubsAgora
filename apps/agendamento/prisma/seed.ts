/**
 * Dados mockados: horários dos próximos 30 dias úteis a partir de hoje.
 * `npm run seed` recria tudo; `--if-empty` só popula banco vazio.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROFISSIONAIS = [
  { profissional: 'Dra. Ana Souza', especialidade: 'Clínica Geral', ubs: 'UBS Centro' },
  { profissional: 'Dr. Bruno Lima', especialidade: 'Pediatria', ubs: 'UBS Centro' },
  { profissional: 'Dra. Carla Rocha', especialidade: 'Clínica Geral', ubs: 'UBS Vila Nova' },
  { profissional: 'Dr. Daniel Alves', especialidade: 'Odontologia', ubs: 'UBS Jardim América' },
  { profissional: 'Enf. Eduarda Melo', especialidade: 'Enfermagem', ubs: 'UBS São José' },
];
const HORAS = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30'];

async function main() {
  if (process.argv.includes('--if-empty') && (await prisma.horario.count()) > 0) return;

  await prisma.agendamento.deleteMany();
  await prisma.horario.deleteMany();

  const horarios = [];
  const hoje = new Date(Date.now() - 3 * 3600_000); // "agora" em Brasília
  for (let d = 0; d < 30; d++) {
    const dia = new Date(hoje.getTime() + d * 86400_000);
    if (dia.getUTCDay() === 0 || dia.getUTCDay() === 6) continue; // sem fim de semana
    const data = dia.toISOString().slice(0, 10);
    for (const p of PROFISSIONAIS) {
      for (const hora of HORAS) {
        horarios.push({ ...p, dataHora: new Date(`${data}T${hora}:00-03:00`), disponivel: Math.random() > 0.25 });
      }
    }
  }
  await prisma.horario.createMany({ data: horarios });
  console.log(`[agendamento] ${horarios.length} horários`);
}

main().finally(() => prisma.$disconnect());
