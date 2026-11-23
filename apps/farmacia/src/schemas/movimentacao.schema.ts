import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, Min } from 'class-validator';

export class CriarMovimentacaoDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  medicamentoId!: number;

  @ApiProperty({ enum: ['entrada', 'baixa'] })
  @IsIn(['entrada', 'baixa'])
  tipo!: 'entrada' | 'baixa';

  @ApiProperty({ example: 10, minimum: 1 })
  @IsInt()
  @Min(1)
  quantidade!: number;
}
