import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ESPECIALIDADES, nomeEspecialidade, nomeUbs } from '../common/catalogo';
import { AgendamentoRepository } from '../repositories/agendamento.repository';
import { CriarAgendamentoDto } from '../schemas/agendamento.schema';

type AgendamentoComHorario = Prisma.AgendamentoGetPayload<{ include: { horario: true } }>;

const dataValida = (d: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const t = new Date(`${d}T12:00:00Z`);
  return !Number.isNaN(t.getTime()) && t.toISOString().slice(0, 10) === d;
};

@Injectable()
export class AgendamentoService {
  constructor(private readonly repo: AgendamentoRepository) {}

  /** data no formato YYYY-MM-DD (horário de Brasília). Sem data, traz tudo a partir de agora. */
  horariosDisponiveis(data?: string, especialidade?: string, ubs?: string) {
    if (data && !dataValida(data)) throw new BadRequestException('data deve ser YYYY-MM-DD');
    const agora = new Date();
    const inicio = data ? new Date(`${data}T00:00:00-03:00`) : agora;
    const fim = data ? new Date(`${data}T23:59:59.999-03:00`) : undefined;

    return this.repo.horariosDisponiveis({
      dataHora: { gte: inicio > agora ? inicio : agora, lte: fim },
      ubsCodigo: ubs || undefined,
      OR: especialidade
        ? [{ especialidadeId: especialidade }, { especialidade: { contains: especialidade, mode: 'insensitive' } }]
        : undefined,
    });
  }

  async especialidades(ubs?: string) {
    const ids = new Set(await this.repo.especialidadesOferecidas(ubs || undefined));
    return ESPECIALIDADES.filter((e) => ids.has(e.id));
  }

  async agendar(dto: CriarAgendamentoDto) {
    const ag = await this.repo.agendar(dto);
    if (!ag) throw new ConflictException('Horário indisponível');
    // Comprovante (campos originais) + campos de Consulta
    return this.toConsulta(ag);
  }

  async consultas(pacienteCns?: string, ubs?: string, data?: string) {
    if (data && !dataValida(data)) throw new BadRequestException('data deve ser YYYY-MM-DD');
    const where: Prisma.AgendamentoWhereInput = {
      pacienteCns: pacienteCns || undefined,
      horario: {
        ubsCodigo: ubs || undefined,
        dataHora: data
          ? { gte: new Date(`${data}T00:00:00-03:00`), lte: new Date(`${data}T23:59:59.999-03:00`) }
          : undefined,
      },
    };
    return (await this.repo.consultas(where)).map((a) => this.toConsulta(a));
  }

  async consulta(id: number) {
    const ag = await this.repo.consulta(id);
    if (!ag) throw new NotFoundException('Consulta não encontrada');
    return this.toConsulta(ag);
  }

  confirmar(id: number) {
    return this.transicao(id, ['agendada'], 'confirmada');
  }
  concluir(id: number) {
    return this.transicao(id, ['agendada', 'confirmada'], 'atendida');
  }
  cancelar(id: number) {
    return this.transicao(id, ['agendada'], 'cancelada');
  }

  private async transicao(id: number, de: string[], para: string) {
    const r = await this.repo.mudarStatus(id, de, para);
    if (!r) throw new NotFoundException('Consulta não encontrada');
    if ('atual' in r) {
      throw new UnprocessableEntityException(`A consulta está ${r.atual} e não pode mudar para ${para}.`);
    }
    return this.toConsulta(r.consulta);
  }

  private toConsulta(ag: AgendamentoComHorario) {
    const h = ag.horario;
    const local = new Date(h.dataHora.getTime() - 3 * 3600_000).toISOString(); // Brasília (UTC-3)
    return {
      id: ag.id,
      protocolo: `UBS-${String(ag.id).padStart(6, '0')}`,
      status: ag.status,
      pacienteNome: ag.pacienteNome,
      pacienteCns: ag.pacienteCns,
      dataHora: h.dataHora,
      data: local.slice(0, 10),
      hora: local.slice(11, 16),
      ubs: h.ubs || nomeUbs(h.ubsCodigo),
      ubsCodigo: h.ubsCodigo,
      profissional: h.profissional,
      especialidade: h.especialidade || nomeEspecialidade(h.especialidadeId),
      especialidadeId: h.especialidadeId,
      horarioId: h.id,
      agendadoEm: ag.criadoEm,
    };
  }
}
