import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CriarAgendamentoDto } from '../schemas/agendamento.schema';
import { PrismaService } from './prisma.service';

@Injectable()
export class AgendamentoRepository {
  constructor(private readonly prisma: PrismaService) {}

  horariosDisponiveis(where: Prisma.HorarioWhereInput) {
    return this.prisma.horario.findMany({
      where: { ...where, disponivel: true },
      orderBy: { dataHora: 'asc' },
      select: { id: true, dataHora: true, ubs: true, profissional: true, especialidade: true },
    });
  }

  /** Reserva o horário e cria o agendamento. Retorna null se o horário não estiver livre. */
  agendar(dto: CriarAgendamentoDto) {
    return this.prisma.$transaction(async (tx) => {
      const reservado = await tx.horario.updateMany({
        where: { id: dto.horarioId, disponivel: true, dataHora: { gt: new Date() } },
        data: { disponivel: false },
      });
      if (reservado.count === 0) return null;
      return tx.agendamento.create({ data: dto, include: { horario: true } });
    });
  }
}
