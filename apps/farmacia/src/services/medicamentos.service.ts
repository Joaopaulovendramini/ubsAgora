import { Injectable } from '@nestjs/common';
import { MedicamentoRepository } from '../repositories/medicamento.repository';

@Injectable()
export class MedicamentosService {
  constructor(private readonly repo: MedicamentoRepository) {}

  async listar(nome?: string) {
    const medicamentos = await this.repo.listar(nome?.trim());
    return medicamentos.map((m) => ({ ...m, disponivel: m.quantidade > 0 }));
  }
}
