import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Matches } from 'class-validator';

export class CriarAgendamentoDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  horarioId: number;

  @ApiProperty({ example: 'Maria da Silva' })
  @IsString()
  @IsNotEmpty()
  pacienteNome: string;

  @ApiProperty({ example: '700000000000001', description: 'Cartão SUS (15 dígitos)' })
  @Matches(/^\d{15}$/, { message: 'pacienteCns deve ter 15 dígitos' })
  pacienteCns: string;
}
