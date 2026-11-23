import { Injectable, NotFoundException } from '@nestjs/common';
import { Ubs } from '@prisma/client';
import { UbsRepository } from '../repositories/ubs.repository';
import { intervaloDoDia } from './tempo';

/** Até 10 pessoas = Baixo, até 25 = Médio, acima disso = Alto. */
function nivel(pessoas: number) {
  if (pessoas <= 10) return 'Baixo';
  if (pessoas <= 25) return 'Médio';
  return 'Alto';
}

function comMovimento(ubs: Ubs, pessoasNaFila: number) {
  return {
    id: ubs.id,
    codigo: ubs.codigo,
    nome: ubs.nome,
    endereco: ubs.endereco,
    pessoasNaFila,
    movimento: nivel(pessoasNaFila),
  };
}

@Injectable()
export class MovimentoService {
  constructor(private readonly repo: UbsRepository) {}

  async listar() {
    const { gte, lt } = intervaloDoDia();
    const [lista, contagem] = await Promise.all([this.repo.listar(), this.repo.aguardandoPorUbs(gte, lt)]);
    return lista.map((u) => comMovimento(u, contagem.get(u.id) ?? 0));
  }

  async buscar(id: number) {
    const ubs = await this.repo.buscar(id);
    if (!ubs) throw new NotFoundException('UBS não encontrada');
    const { gte, lt } = intervaloDoDia();
    const contagem = await this.repo.aguardandoPorUbs(gte, lt);
    return comMovimento(ubs, contagem.get(ubs.id) ?? 0);
  }
}
