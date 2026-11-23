import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class CriarSenhaDto {
  @ApiProperty({ enum: ['N', 'P'] })
  @IsIn(['N', 'P'])
  tipo!: 'N' | 'P';

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  consultaId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pacienteCns?: string;
}

export class ChamarDto {
  @ApiPropertyOptional({ default: 'Guichê 1' })
  @IsOptional()
  @IsString()
  guiche?: string;
}
