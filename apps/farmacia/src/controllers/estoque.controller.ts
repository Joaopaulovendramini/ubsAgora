import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { CriarMovimentacaoDto } from '../schemas/movimentacao.schema';
import { EstoqueService } from '../services/estoque.service';

@Controller()
export class EstoqueController {
  constructor(private readonly service: EstoqueService) {}

  /** GET /v1/medicamentos?nome=amox&ubs=centro */
  @Get('medicamentos')
  @ApiQuery({ name: 'nome', required: false, description: 'Busca por parte do nome' })
  @ApiQuery({ name: 'ubs', required: false, description: 'Código da UBS (padrão: soma da rede)' })
  medicamentos(@Query('nome') nome?: string, @Query('ubs') ubs?: string) {
    return this.service.medicamentos(nome, ubs);
  }

  /** GET /v1/estoque?nome= */
  @Get('estoque')
  @ApiQuery({ name: 'nome', required: false })
  estoque(@Query('nome') nome?: string) {
    return this.service.estoque(nome);
  }

  /** POST /v1/ubs/:ubs/movimentacoes */
  @Post('ubs/:ubs/movimentacoes')
  registrar(@Param('ubs') ubs: string, @Body() dto: CriarMovimentacaoDto) {
    return this.service.registrar(ubs, dto);
  }

  /** GET /v1/ubs/:ubs/movimentacoes?data=YYYY-MM-DD */
  @Get('ubs/:ubs/movimentacoes')
  @ApiQuery({ name: 'data', required: false, description: 'YYYY-MM-DD (padrão hoje, Brasília)' })
  movimentacoes(@Param('ubs') ubs: string, @Query('data') data?: string) {
    return this.service.movimentacoes(ubs, data);
  }

  /** GET /v1/dispensacoes?data= */
  @Get('dispensacoes')
  @ApiQuery({ name: 'data', required: false, description: 'YYYY-MM-DD (padrão hoje, Brasília)' })
  dispensacoes(@Query('data') data?: string) {
    return this.service.dispensacoes(data);
  }
}
