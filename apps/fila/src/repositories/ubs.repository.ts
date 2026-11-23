import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class UbsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.ubs.findMany({ orderBy: { id: 'asc' } });
  }

  buscar(id: number) {
    return this.prisma.ubs.findUnique({ where: { id } });
  }

  buscarPorCodigo(codigo: string) {
    return this.prisma.ubs.findUnique({ where: { codigo } });
  }

  /** Nº de senhas aguardando por UBS no intervalo (id da UBS -> total). */
  async aguardandoPorUbs(gte: Date, lt: Date): Promise<Map<number, number>> {
    const rows = await this.prisma.senha.groupBy({
      by: ['ubsId'],
      where: { status: 'aguardando', criadaEm: { gte, lt } },
      _count: { _all: true },
    });
    return new Map(rows.map((r) => [r.ubsId, r._count._all]));
  }
}
