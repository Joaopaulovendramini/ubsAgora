import { Module } from '@nestjs/common';
import { EstoqueController } from './controllers/estoque.controller';
import { EstoqueRepository } from './repositories/estoque.repository';
import { PrismaService } from './repositories/prisma.service';
import { EstoqueService } from './services/estoque.service';

@Module({
  controllers: [EstoqueController],
  providers: [PrismaService, EstoqueRepository, EstoqueService],
})
export class AppModule {}
