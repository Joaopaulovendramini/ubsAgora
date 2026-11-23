import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { CriarAgendamentoDto } from '../schemas/agendamento.schema';
import { AgendamentoService } from '../services/agendamento.service';

@Controller()
export class AgendamentoController {
  constructor(private readonly service: AgendamentoService) {}

  /** GET /v1/horarios?data=2026-11-23&especialidade=pediatria&ubs=centro */
  @Get('horarios')
  @ApiQuery({ name: 'data', required: false, example: '2026-11-23' })
  @ApiQuery({ name: 'especialidade', required: false })
  @ApiQuery({ name: 'ubs', required: false, example: 'centro' })
  horarios(
    @Query('data') data?: string,
    @Query('especialidade') especialidade?: string,
    @Query('ubs') ubs?: string,
  ) {
    return this.service.horariosDisponiveis(data, especialidade, ubs);
  }

  /** GET /v1/especialidades?ubs=centro */
  @Get('especialidades')
  @ApiQuery({ name: 'ubs', required: false, example: 'centro' })
  especialidades(@Query('ubs') ubs?: string) {
    return this.service.especialidades(ubs);
  }

  /** POST /v1/agendamentos -> 201 com o comprovante / 409 se o horário já foi ocupado */
  @Post('agendamentos')
  agendar(@Body() dto: CriarAgendamentoDto) {
    return this.service.agendar(dto);
  }

  /** GET /v1/consultas?pacienteCns=&ubs=&data= */
  @Get('consultas')
  @ApiQuery({ name: 'pacienteCns', required: false })
  @ApiQuery({ name: 'ubs', required: false })
  @ApiQuery({ name: 'data', required: false, example: '2026-11-23' })
  consultas(@Query('pacienteCns') pacienteCns?: string, @Query('ubs') ubs?: string, @Query('data') data?: string) {
    return this.service.consultas(pacienteCns, ubs, data);
  }

  @Get('consultas/:id')
  consulta(@Param('id', ParseIntPipe) id: number) {
    return this.service.consulta(id);
  }

  @Patch('consultas/:id/confirmar')
  confirmar(@Param('id', ParseIntPipe) id: number) {
    return this.service.confirmar(id);
  }

  @Patch('consultas/:id/concluir')
  concluir(@Param('id', ParseIntPipe) id: number) {
    return this.service.concluir(id);
  }

  @Patch('consultas/:id/cancelar')
  cancelar(@Param('id', ParseIntPipe) id: number) {
    return this.service.cancelar(id);
  }
}
