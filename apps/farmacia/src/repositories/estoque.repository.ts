import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class EstoqueRepository {
  constructor(private readonly prisma: PrismaService) {}

  medicamentos(nome?: string) {
    return this.prisma.medicamento.findMany({
      where: nome ? { nome: { contains: nome, mode: 'insensitive' } } : undefined,
      orderBy: { nome: 'asc' },
    });
  }

  /** Estoque (ubs, medicamentoId, quantidade) dos medicamentos informados; todas as UBS se `ubs` omitido. */
  estoques(medicamentoIds: number[], ubs?: string) {
    return this.prisma.estoque.findMany({
      where: { medicamentoId: { in: medicamentoIds }, ...(ubs ? { ubsCodigo: ubs } : {}) },
    });
  }

  medicamentoPorId(id: number) {
    return this.prisma.medicamento.findUnique({ where: { id } });
  }

  movimentacoes(ubs: string, inicio: Date, fim: Date) {
    return this.prisma.movimentacao.findMany({
      where: { ubsCodigo: ubs, criadaEm: { gte: inicio, lt: fim } },
      orderBy: [{ criadaEm: 'desc' }, { id: 'desc' }],
    });
  }

  /** Soma das baixas da rede no intervalo, agrupadas por medicamento. */
  baixasPorMedicamento(inicio: Date, fim: Date) {
    return this.prisma.movimentacao.groupBy({
      by: ['medicamentoId'],
      where: { tipo: 'baixa', criadaEm: { gte: inicio, lt: fim } },
      _sum: { quantidade: true },
    });
  }

  nomes(ids: number[]) {
    return this.prisma.medicamento.findMany({ where: { id: { in: ids } }, select: { id: true, nome: true } });
  }

  /** Aplica a movimentação e atualiza o estoque na mesma transação. Retorna null se faltar saldo (com o saldo atual). */
  registrar(ubs: string, medicamentoId: number, tipo: 'entrada' | 'baixa', quantidade: number) {
    return this.prisma.$transaction(async (tx) => {
      await tx.estoque.createMany({ data: [{ ubsCodigo: ubs, medicamentoId, quantidade: 0 }], skipDuplicates: true });
      const where = { ubsCodigo: ubs, medicamentoId, ...(tipo === 'baixa' ? { quantidade: { gte: quantidade } } : {}) };
      const data = { quantidade: tipo === 'baixa' ? { decrement: quantidade } : { increment: quantidade } };
      const { count } = await tx.estoque.updateMany({ where, data });
      const atual = await tx.estoque.findUniqueOrThrow({
        where: { ubsCodigo_medicamentoId: { ubsCodigo: ubs, medicamentoId } },
      });
      if (count === 0) return { insuficiente: true as const, saldo: atual.quantidade };
      const mov = await tx.movimentacao.create({
        data: { ubsCodigo: ubs, medicamentoId, tipo, quantidade, saldo: atual.quantidade },
      });
      return { insuficiente: false as const, mov };
    });
  }
}
