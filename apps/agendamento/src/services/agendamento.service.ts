import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { AgendamentoRepository } from '../repositories/agendamento.repository';
import { CriarAgendamentoDto } from '../schemas/agendamento.schema';

@Injectable()
export class AgendamentoService {
  constructor(private readonly repo: AgendamentoRepository) {}

  /** data no formato YYYY-MM-DD (horário de Brasília). Sem data, traz tudo a partir de agora. */
  horariosDisponiveis(data?: string, especialidade?: string) {
    if (data && !/^\d{4}-\d{2}-\d{2}$/.test(data)) throw new BadRequestException('data deve ser YYYY-MM-DD');
    const agora = new Date();
    const inicio = data ? new Date(`${data}T00:00:00-03:00`) : agora;
    const fim = data ? new Date(`${data}T23:59:59-03:00`) : undefined;

    return this.repo.horariosDisponiveis({
      dataHora: { gte: inicio > agora ? inicio : agora, lte: fim },
      especialidade: especialidade ? { contains: especialidade, mode: 'insensitive' } : undefined,
    });
  }

  async agendar(dto: CriarAgendamentoDto) {
    const ag = await this.repo.agendar(dto);
    if (!ag) throw new ConflictException('Horário indisponível');

    // Comprovante para exibir na tela
    return {
      protocolo: `UBS-${String(ag.id).padStart(6, '0')}`,
      pacienteNome: ag.pacienteNome,
      pacienteCns: ag.pacienteCns,
      dataHora: ag.horario.dataHora,
      ubs: ag.horario.ubs,
      profissional: ag.horario.profissional,
      especialidade: ag.horario.especialidade,
      agendadoEm: ag.criadoEm,
    };
  }
}
