import { BadRequestException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Movimentacao } from '@prisma/client';
import { EstoqueRepository } from '../repositories/estoque.repository';
import { CriarMovimentacaoDto } from '../schemas/movimentacao.schema';
import { exigirUbs, hojeBrasilia, intervaloDoDia, UBS_CODIGOS } from '../ubs';

@Injectable()
export class EstoqueService {
  constructor(private readonly repo: EstoqueRepository) {}

  private async itens(nome?: string, ubs?: string) {
    const meds = await this.repo.medicamentos(nome?.trim() || undefined);
    const estoques = await this.repo.estoques(
      meds.map((m) => m.id),
      ubs,
    );
    const porUbs = new Map<string, Map<number, number>>();
    for (const e of estoques) {
      if (!porUbs.has(e.ubsCodigo)) porUbs.set(e.ubsCodigo, new Map());
      porUbs.get(e.ubsCodigo)!.set(e.medicamentoId, e.quantidade);
    }
    const montar = (codigos: readonly string[]) =>
      meds.map((m) => {
        const quantidade = codigos.reduce((s, c) => s + (porUbs.get(c)?.get(m.id) ?? 0), 0);
        return {
          id: m.id,
          nome: m.nome,
          concentracao: m.concentracao,
          forma: m.forma,
          estoqueMinimo: m.estoqueMinimo,
          quantidade,
          disponivel: quantidade > 0,
        };
      });
    return montar;
  }

  async medicamentos(nome?: string, ubs?: string) {
    if (ubs) exigirUbs(ubs);
    const montar = await this.itens(nome, ubs || undefined);
    return montar(ubs ? [ubs] : UBS_CODIGOS);
  }

  async estoque(nome?: string) {
    const montar = await this.itens(nome);
    return UBS_CODIGOS.map((ubs) => ({ ubs, medicamentos: montar([ubs]) }));
  }

  async registrar(ubs: string, dto: CriarMovimentacaoDto) {
    exigirUbs(ubs);
    if (!(await this.repo.medicamentoPorId(dto.medicamentoId))) {
      throw new NotFoundException('Medicamento não encontrado');
    }
    const r = await this.repo.registrar(ubs, dto.medicamentoId, dto.tipo, dto.quantidade);
    if (r.insuficiente) throw new UnprocessableEntityException(`Saldo insuficiente: há ${r.saldo} em estoque.`);
    return this.formatar(r.mov);
  }

  async movimentacoes(ubs: string, data?: string) {
    exigirUbs(ubs);
    const { inicio, fim } = this.dia(data);
    return (await this.repo.movimentacoes(ubs, inicio, fim)).map((m) => this.formatar(m));
  }

  async dispensacoes(data?: string) {
    const { inicio, fim } = this.dia(data);
    const grupos = await this.repo.baixasPorMedicamento(inicio, fim);
    const nomes = new Map((await this.repo.nomes(grupos.map((g) => g.medicamentoId))).map((m) => [m.id, m.nome]));
    return grupos
      .map((g) => ({ medicamentoId: g.medicamentoId, nome: nomes.get(g.medicamentoId)!, quantidade: g._sum.quantidade ?? 0 }))
      .sort((a, b) => b.quantidade - a.quantidade || a.nome.localeCompare(b.nome));
  }

  private dia(data?: string) {
    const intervalo = intervaloDoDia(data || hojeBrasilia());
    if (!intervalo) throw new BadRequestException('data inválida; use YYYY-MM-DD');
    return intervalo;
  }

  private formatar(m: Movimentacao) {
    return {
      id: m.id,
      ubs: m.ubsCodigo,
      medicamentoId: m.medicamentoId,
      tipo: m.tipo,
      quantidade: m.quantidade,
      saldo: m.saldo,
      criadaEm: m.criadaEm.toISOString(),
    };
  }
}
