import { Injectable, NotFoundException } from '@nestjs/common';
import { Ubs } from '@prisma/client';
import { UbsRepository } from '../repositories/ubs.repository';

/** Até 10 pessoas = Baixo, até 25 = Médio, acima disso = Alto. */
function nivel(pessoas: number) {
  if (pessoas <= 10) return 'Baixo';
  if (pessoas <= 25) return 'Médio';
  return 'Alto';
}

function comMovimento(ubs: Ubs) {
  return { ...ubs, movimento: nivel(ubs.pessoasNaFila) };
}

@Injectable()
export class MovimentoService {
  constructor(private readonly repo: UbsRepository) {}

  async listar() {
    return (await this.repo.listar()).map(comMovimento);
  }

  async buscar(id: number) {
    const ubs = await this.repo.buscar(id);
    if (!ubs) throw new NotFoundException('UBS não encontrada');
    return comMovimento(ubs);
  }
}
