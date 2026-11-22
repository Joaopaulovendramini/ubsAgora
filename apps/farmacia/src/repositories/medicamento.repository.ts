import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class MedicamentoRepository {
  constructor(private readonly prisma: PrismaService) {}

  listar(nome?: string) {
    return this.prisma.medicamento.findMany({
      where: nome ? { nome: { contains: nome, mode: 'insensitive' } } : undefined,
      orderBy: { nome: 'asc' },
    });
  }
}
