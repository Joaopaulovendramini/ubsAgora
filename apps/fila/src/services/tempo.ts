import { BadRequestException } from '@nestjs/common';

const BRT_MS = 3 * 3600 * 1000;

/** "YYYY-MM-DD" de hoje em Brasília (UTC-3 fixo). */
export function hojeBrasilia(): string {
  return new Date(Date.now() - BRT_MS).toISOString().slice(0, 10);
}

/** Intervalo [inicio, fim) em UTC do dia (Brasília). Padrão: hoje. */
export function intervaloDoDia(data?: string): { gte: Date; lt: Date } {
  const d = data ?? hojeBrasilia();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) throw new BadRequestException('data inválida (use YYYY-MM-DD)');
  const gte = new Date(`${d}T00:00:00-03:00`);
  if (Number.isNaN(gte.getTime())) throw new BadRequestException('data inválida (use YYYY-MM-DD)');
  // rejeita datas como 2026-02-31 que o JS normaliza
  if (new Date(gte.getTime() - BRT_MS).toISOString().slice(0, 10) !== d) throw new BadRequestException('data inválida (use YYYY-MM-DD)');
  return { gte, lt: new Date(gte.getTime() + 24 * 3600 * 1000) };
}

/** Hora (0..23) de Brasília de um instante. */
export function horaBrasilia(d: Date): number {
  return new Date(d.getTime() - BRT_MS).getUTCHours();
}
