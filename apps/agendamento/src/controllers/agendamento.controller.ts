import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { CriarAgendamentoDto } from '../schemas/agendamento.schema';
import { AgendamentoService } from '../services/agendamento.service';

@Controller()
export class AgendamentoController {
  constructor(private readonly service: AgendamentoService) {}

  /** GET /v1/horarios?data=2026-11-23&especialidade=pediatria */
  @Get('horarios')
  @ApiQuery({ name: 'data', required: false, example: '2026-11-23' })
  @ApiQuery({ name: 'especialidade', required: false })
  horarios(@Query('data') data?: string, @Query('especialidade') especialidade?: string) {
    return this.service.horariosDisponiveis(data, especialidade);
  }

  /** POST /v1/agendamentos -> 201 com o comprovante / 409 se o horário já foi ocupado */
  @Post('agendamentos')
  agendar(@Body() dto: CriarAgendamentoDto) {
    return this.service.agendar(dto);
  }
}
