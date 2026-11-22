import { Module } from '@nestjs/common';
import { MovimentoController } from './controllers/movimento.controller';
import { PrismaService } from './repositories/prisma.service';
import { UbsRepository } from './repositories/ubs.repository';
import { MovimentoService } from './services/movimento.service';

@Module({
  controllers: [MovimentoController],
  providers: [PrismaService, UbsRepository, MovimentoService],
})
export class AppModule {}
