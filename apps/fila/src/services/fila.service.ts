import { Injectable, NotFoundException } from '@nestjs/common';
import { Senha } from '@prisma/client';
import { SenhaRepository } from '../repositories/senha.repository';
import { UbsRepository } from '../repositories/ubs.repository';
import { ChamarDto, CriarSenhaDto } from '../schemas/fila.schemas';
import { horaBrasilia, intervaloDoDia } from './tempo';
import { WebhookService } from './webhook.service';

@Injectable()
export class FilaService {
  constructor(
    private readonly ubsRepo: UbsRepository,
    private readonly senhas: SenhaRepository,
    private readonly webhook: WebhookService,
  ) {}

  private async ubs(codigo: string) {
    const ubs = await this.ubsRepo.buscarPorCodigo(codigo);
    if (!ubs) throw new NotFoundException('UBS não encontrada');
    return ubs;
  }

  private json(s: Senha, ubs: string) {
    return {
      codigo: s.codigo,
      ubs,
      tipo: s.tipo,
      status: s.status,
      criadaEm: s.criadaEm.toISOString(),
      consultaId: s.consultaId,
      pacienteCns: s.pacienteCns,
      guiche: s.guiche,
    };
  }

  async fila(codigo: string) {
    const ubs = await this.ubs(codigo);
    const { gte, lt } = intervaloDoDia();
    const [chamada, aguardando] = await Promise.all([
      this.senhas.chamada(ubs.id, gte, lt),
      this.senhas.aguardando(ubs.id, gte, lt),
    ]);
    return {
      chamada: chamada ? this.json(chamada, codigo) : null,
      aguardando: aguardando.map((s) => this.json(s, codigo)),
    };
  }

  async doDia(codigo: string, data?: string) {
    const ubs = await this.ubs(codigo);
    const { gte, lt } = intervaloDoDia(data);
    return (await this.senhas.doDia(ubs.id, gte, lt)).map((s) => this.json(s, codigo));
  }

  async criar(codigo: string, dto: CriarSenhaDto) {
    const ubs = await this.ubs(codigo);
    const { gte, lt } = intervaloDoDia();
    const senha = await this.senhas.transacao(async (tx) => {
      await this.senhas.lock(tx, ubs.id);
      const n = (await this.senhas.ultimoNumero(tx, ubs.id, dto.tipo, gte, lt)) + 1;
      return this.senhas.criar(tx, {
        codigo: `${dto.tipo}${String(n).padStart(3, '0')}`,
        ubsId: ubs.id,
        tipo: dto.tipo,
        status: 'aguardando',
        consultaId: dto.consultaId ?? null,
        pacienteCns: dto.pacienteCns ?? null,
      });
    });
    const out = this.json(senha, codigo);
    this.webhook.disparar('senha.criada', codigo, out);
    return out;
  }

  async chamar(codigo: string, dto: ChamarDto) {
    const ubs = await this.ubs(codigo);
    const { gte, lt } = intervaloDoDia();
    const guiche = dto.guiche?.trim() || 'Guichê 1';
    const { finalizada, chamada } = await this.senhas.transacao(async (tx) => {
      await this.senhas.lock(tx, ubs.id);
      const atual = await this.senhas.chamada(ubs.id, gte, lt, tx);
      const fin = atual ? await this.senhas.atualizar(tx, atual.id, { status: 'atendida' }) : null;
      const prox = await this.senhas.proxima(tx, ubs.id, gte, lt);
      const cham = prox ? await this.senhas.atualizar(tx, prox.id, { status: 'chamada', guiche }) : null;
      return { finalizada: fin, chamada: cham };
    });
    const out = {
      finalizada: finalizada ? this.json(finalizada, codigo) : null,
      chamada: chamada ? this.json(chamada, codigo) : null,
    };
    if (out.chamada) this.webhook.disparar('senha.chamada', codigo, out.chamada);
    else if (out.finalizada) this.webhook.disparar('senha.finalizada', codigo, out.finalizada);
    return out;
  }

  async movimento(codigo: string, data?: string) {
    const ubs = await this.ubs(codigo);
    const { gte, lt } = intervaloDoDia(data);
    const [fluxo, criadas] = await Promise.all([
      this.senhas.fluxo(ubs.id),
      this.senhas.horasDasSenhas(ubs.id, gte, lt),
    ]);
    const porHora = new Map<number, number>();
    for (const f of fluxo) porHora.set(f.hora, f.chegadas);
    for (const c of criadas) {
      const h = horaBrasilia(c.criadaEm);
      if (h >= 7 && h <= 17) porHora.set(h, (porHora.get(h) ?? 0) + 1);
    }
    return Array.from({ length: 11 }, (_, i) => ({ hora: 7 + i, chegadas: porHora.get(7 + i) ?? 0 }));
  }
}
