import { env } from '@/env';
import { PaymentPrismaRepository } from '@/repositories/prisma/payment-prisma-repository';
import { TransactionPrismaRepository } from '@/repositories/prisma/transaction-prisma-repository';
import { UserPrismaRepository } from '@/repositories/prisma/user-prisma-repository';
import { WebhookConfigPrismaRepository } from '@/repositories/prisma/webhook-config-prisma-repository';
import { ConfirmPaymentService } from '@/services/confirm-payment-service';
import { Request, Response } from 'express';
import z from 'zod';

const CONFIRMATION_EVENTS = new Set(['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED']);

const bodySchema = z.object({
  event: z.string(),
  payment: z.object({
    id: z.string(),
    paymentDate: z.string().nullish(),
  }),
});

export const webhookController = async (request: Request, response: Response) => {
  const token = request.headers['asaas-access-token'];

  if (token !== env.ASAAS_WEBHOOK_TOKEN) {
    console.warn('[webhook:asaas] unauthorized request - invalid token');
    return response.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { event, payment } = bodySchema.parse(request.body);

    console.log(`[webhook:asaas] event=${event} paymentId=${payment.id}`);

    if (!CONFIRMATION_EVENTS.has(event)) {
      console.log(`[webhook:asaas] event ignored`);
      return response.status(200).json({ ignored: true });
    }

    const service = new ConfirmPaymentService(
      new PaymentPrismaRepository(),
      new UserPrismaRepository(),
      new TransactionPrismaRepository(),
      new WebhookConfigPrismaRepository()
    );

    await service.handler({
      externalId: payment.id,
      paidAt: payment.paymentDate ? new Date(payment.paymentDate) : undefined,
    });

    console.log(`[webhook:asaas] payment ${payment.id} confirmed successfully`);
    return response.status(200).json({ ok: true });
  } catch (error: any) {
    if (error?.statusCode === 404) {
      return response.status(404).json({ error: 'Payment not found' });
    }

    if (error?.statusCode === 502) {
      console.error('[webhook:asaas] outgoing webhook delivery failed:', error.message);
      return response.status(502).json({ error: error.message });
    }

    console.error('[webhook:asaas] unhandled error:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
};
