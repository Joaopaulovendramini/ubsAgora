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
      orderBy: [{ dataHora: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        dataHora: true,
        ubs: true,
        ubsCodigo: true,
        profissional: true,
        especialidade: true,
        especialidadeId: true,
      },
    });
  }

  async especialidadesOferecidas(ubsCodigo?: string): Promise<string[]> {
    const rows = await this.prisma.horario.groupBy({
      by: ['especialidadeId'],
      where: ubsCodigo ? { ubsCodigo } : undefined,
    });
    return rows.map((r) => r.especialidadeId);
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

  consultas(where: Prisma.AgendamentoWhereInput) {
    return this.prisma.agendamento.findMany({
      where,
      include: { horario: true },
      orderBy: [{ horario: { dataHora: 'asc' } }, { id: 'asc' }],
    });
  }

  consulta(id: number) {
    return this.prisma.agendamento.findUnique({ where: { id }, include: { horario: true } });
  }

  /**
   * Transição atômica de status. Retorna null se a consulta não existe;
   * { atual } se a transição é inválida; { consulta } se aplicada.
   */
  mudarStatus(id: number, de: string[], para: string) {
    return this.prisma.$transaction(async (tx) => {
      const r = await tx.agendamento.updateMany({ where: { id, status: { in: de } }, data: { status: para } });
      const ag = await tx.agendamento.findUnique({ where: { id }, include: { horario: true } });
      if (!ag) return null;
      if (r.count === 0) return { atual: ag.status } as const;
      if (para === 'cancelada') await tx.horario.update({ where: { id: ag.horarioId }, data: { disponivel: true } });
      return { consulta: ag } as const;
    });
  }
}
