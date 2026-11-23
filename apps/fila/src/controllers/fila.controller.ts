import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ChamarDto, CriarSenhaDto } from '../schemas/fila.schemas';
import { FilaService } from '../services/fila.service';

@Controller('filas/:ubs')
export class FilaController {
  constructor(private readonly service: FilaService) {}

  @Get()
  fila(@Param('ubs') ubs: string) {
    return this.service.fila(ubs);
  }

  @Get('senhas')
  senhas(@Param('ubs') ubs: string, @Query('data') data?: string) {
    return this.service.doDia(ubs, data);
  }

  @Post('senhas')
  criar(@Param('ubs') ubs: string, @Body() dto: CriarSenhaDto) {
    return this.service.criar(ubs, dto);
  }

  @Post('chamar')
  @HttpCode(200)
  chamar(@Param('ubs') ubs: string, @Body() dto: ChamarDto) {
    return this.service.chamar(ubs, dto);
  }

  @Get('movimento')
  movimento(@Param('ubs') ubs: string, @Query('data') data?: string) {
    return this.service.movimento(ubs, data);
  }
}
