import { Module } from '@nestjs/common';
import { MedicamentosController } from './controllers/medicamentos.controller';
import { MedicamentoRepository } from './repositories/medicamento.repository';
import { PrismaService } from './repositories/prisma.service';
import { MedicamentosService } from './services/medicamentos.service';

@Module({
  controllers: [MedicamentosController],
  providers: [PrismaService, MedicamentoRepository, MedicamentosService],
})
export class AppModule {}
