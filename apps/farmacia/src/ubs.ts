import { NotFoundException } from '@nestjs/common';

/** Rede de UBS (ordem fixa), igual em todas as APIs. */
export const UBS_CODIGOS = ['centro', 'vilanova', 'jardim', 'saojose', 'parqueflores'] as const;

export function exigirUbs(codigo: string): string {
  if (!(UBS_CODIGOS as readonly string[]).includes(codigo)) {
    throw new NotFoundException('UBS não encontrada');
  }
  return codigo;
}

const BRT_OFFSET_MS = 3 * 3600 * 1000;

/** "YYYY-MM-DD" de hoje no horário de Brasília. */
export function hojeBrasilia(): string {
  return new Date(Date.now() - BRT_OFFSET_MS).toISOString().slice(0, 10);
}

/** Intervalo UTC [inicio, fim) do dia `data` (Brasília). Retorna null se a data for inválida. */
export function intervaloDoDia(data: string): { inicio: Date; fim: Date } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;
  const [y, m, d] = data.split('-').map(Number);
  const inicio = new Date(Date.UTC(y, m - 1, d, 3));
  if (isNaN(inicio.getTime())) return null;
  // confere ida e volta (rejeita 2026-02-30)
  const volta = new Date(inicio.getTime() - BRT_OFFSET_MS).toISOString().slice(0, 10);
  if (volta !== data) return null;
  return { inicio, fim: new Date(inicio.getTime() + 24 * 3600 * 1000) };
}
