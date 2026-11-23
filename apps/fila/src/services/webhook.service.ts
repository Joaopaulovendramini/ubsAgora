import { Injectable } from '@nestjs/common';
import { createHmac } from 'node:crypto';

export type EventoWebhook = 'senha.criada' | 'senha.chamada' | 'senha.finalizada';

@Injectable()
export class WebhookService {
  /** Fire and forget: nunca lança nem atrasa a requisição. */
  disparar(tipo: EventoWebhook, ubs: string, senha: unknown): void {
    const url = process.env.WEBHOOK_URL;
    if (!url) return;
    try {
      const corpo = JSON.stringify({ tipo, ubs, senha });
      const segredo = process.env.WEBHOOK_SECRET ?? 'dev-webhook-secret-troque-em-producao';
      const assinatura = 'sha256=' + createHmac('sha256', segredo).update(corpo).digest('hex');
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Ubs-Signature': assinatura },
        body: corpo,
        signal: AbortSignal.timeout(2000),
      }).catch(() => undefined);
    } catch {
      /* ignora */
    }
  }
}
