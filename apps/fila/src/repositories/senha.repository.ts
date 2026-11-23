import { Injectable } from '@nestjs/common';
import { Prisma, Senha } from '@prisma/client';
import { PrismaService } from './prisma.service';

export type Tx = Prisma.TransactionClient;

/** Ordem de chamada: preferenciais (P) primeiro, depois por criadaEm. */
export const ORDEM_CHAMADA: Prisma.SenhaOrderByWithRelationInput[] = [
  { tipo: 'desc' },
  { criadaEm: 'asc' },
  { id: 'asc' },
];

@Injectable()
export class SenhaRepository {
  constructor(private readonly prisma: PrismaService) {}

  transacao<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  /** Serializa operações por UBS dentro da transação. */
  lock(tx: Tx, ubsId: number) {
    return tx.$executeRaw`SELECT pg_advisory_xact_lock(${ubsId})`;
  }

  chamada(ubsId: number, gte: Date, lt: Date, db: Tx | PrismaService = this.prisma) {
    return db.senha.findFirst({
      where: { ubsId, status: 'chamada', criadaEm: { gte, lt } },
      orderBy: { id: 'desc' },
    });
  }

  aguardando(ubsId: number, gte: Date, lt: Date, db: Tx | PrismaService = this.prisma) {
    return db.senha.findMany({
      where: { ubsId, status: 'aguardando', criadaEm: { gte, lt } },
      orderBy: ORDEM_CHAMADA,
    });
  }

  proxima(tx: Tx, ubsId: number, gte: Date, lt: Date) {
    return tx.senha.findFirst({
      where: { ubsId, status: 'aguardando', criadaEm: { gte, lt } },
      orderBy: ORDEM_CHAMADA,
    });
  }

  doDia(ubsId: number, gte: Date, lt: Date) {
    return this.prisma.senha.findMany({
      where: { ubsId, criadaEm: { gte, lt } },
      orderBy: [{ criadaEm: 'asc' }, { id: 'asc' }],
    });
  }

  async ultimoNumero(tx: Tx, ubsId: number, tipo: string, gte: Date, lt: Date): Promise<number> {
    const rows = await tx.senha.findMany({
      where: { ubsId, tipo, criadaEm: { gte, lt } },
      select: { codigo: true },
    });
    return rows.reduce((m, r) => Math.max(m, parseInt(r.codigo.slice(1), 10) || 0), 0);
  }

  criar(tx: Tx, data: Prisma.SenhaUncheckedCreateInput): Promise<Senha> {
    return tx.senha.create({ data });
  }

  atualizar(tx: Tx, id: number, data: Prisma.SenhaUpdateInput): Promise<Senha> {
    return tx.senha.update({ where: { id }, data });
  }

  fluxo(ubsId: number) {
    return this.prisma.fluxoHora.findMany({ where: { ubsId } });
  }

  horasDasSenhas(ubsId: number, gte: Date, lt: Date) {
    return this.prisma.senha.findMany({
      where: { ubsId, criadaEm: { gte, lt } },
      select: { criadaEm: true },
    });
  }
}
