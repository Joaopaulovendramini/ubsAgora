import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { MovimentoService } from '../services/movimento.service';

@Controller('movimento')
export class MovimentoController {
  constructor(private readonly service: MovimentoService) {}

  /** GET /v1/movimento -> todas as UBS com o indicador */
  @Get()
  listar() {
    return this.service.listar();
  }

  /** GET /v1/movimento/:ubsId */
  @Get(':ubsId')
  buscar(@Param('ubsId', ParseIntPipe) ubsId: number) {
    return this.service.buscar(ubsId);
  }
}
