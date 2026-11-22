import { Controller, Get, Query } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { MedicamentosService } from '../services/medicamentos.service';

@Controller('medicamentos')
export class MedicamentosController {
  constructor(private readonly service: MedicamentosService) {}

  /** GET /v1/medicamentos?nome=amox */
  @Get()
  @ApiQuery({ name: 'nome', required: false, description: 'Busca por parte do nome' })
  listar(@Query('nome') nome?: string) {
    return this.service.listar(nome);
  }
}
