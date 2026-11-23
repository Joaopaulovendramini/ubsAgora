import { Module } from '@nestjs/common';
import { FilaController } from './controllers/fila.controller';
import { MovimentoController } from './controllers/movimento.controller';
import { PrismaService } from './repositories/prisma.service';
import { SenhaRepository } from './repositories/senha.repository';
import { UbsRepository } from './repositories/ubs.repository';
import { FilaService } from './services/fila.service';
import { MovimentoService } from './services/movimento.service';
import { WebhookService } from './services/webhook.service';

@Module({
  controllers: [MovimentoController, FilaController],
  providers: [PrismaService, UbsRepository, SenhaRepository, MovimentoService, FilaService, WebhookService],
})
export class AppModule {}
