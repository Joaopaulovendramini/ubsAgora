import { Module } from '@nestjs/common';
import { AgendamentoController } from './controllers/agendamento.controller';
import { AgendamentoRepository } from './repositories/agendamento.repository';
import { PrismaService } from './repositories/prisma.service';
import { AgendamentoService } from './services/agendamento.service';

@Module({
  controllers: [AgendamentoController],
  providers: [PrismaService, AgendamentoRepository, AgendamentoService],
})
export class AppModule {}
