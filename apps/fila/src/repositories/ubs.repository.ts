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
}
