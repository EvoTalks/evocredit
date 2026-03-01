import { PaymentRepository } from '@/repositories/payment-repository';
import { TransactionRepository } from '@/repositories/transaction-repository';
import { UserRepository } from '@/repositories/user-repository';
import { WebhookConfigRepository } from '@/repositories/webhook-config-repository';

interface ConfirmPaymentRequest {
  externalId: string;
  paidAt?: Date;
}

export class ConfirmPaymentService {
  constructor(
    private paymentRepository: PaymentRepository,
    private userRepository: UserRepository,
    private transactionRepository: TransactionRepository,
    private webhookConfigRepository: WebhookConfigRepository
  ) {}

  async handler({ externalId, paidAt }: ConfirmPaymentRequest): Promise<void> {
    const payment = await this.paymentRepository.findByExternalId(externalId);

    if (!payment) {
      throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
    }

    if (payment.status === 'PAID') {
      return;
    }

    const confirmedAt = paidAt ?? new Date();
    const amount = Number(payment.amount);

    // Dispatch outgoing webhooks BEFORE writing to DB.
    // If any call fails the error propagates and nothing is persisted.
    const webhookConfigs = await this.webhookConfigRepository.findAllActive();

    if (webhookConfigs.length > 0) {
      const outgoingPayload = {
        event: 'PAYMENT_CONFIRMED',
        payment: {
          id: payment.id,
          externalId: payment.externalId,
          amount,
          status: 'PAID',
          userId: payment.userId,
          paidAt: confirmedAt,
        },
      };

      await Promise.all(
        webhookConfigs.map(async (config) => {
          const res = await fetch(config.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(outgoingPayload),
          });

          if (!res.ok) {
            throw Object.assign(
              new Error(`Outgoing webhook failed for ${config.url}: ${res.status} ${res.statusText}`),
              { statusCode: 502 }
            );
          }
        })
      );
    }

    // All webhooks succeeded — now persist the confirmation.
    await this.paymentRepository.updateStatus(payment.id, {
      status: 'PAID',
      paidAt: confirmedAt,
    });

    await this.userRepository.incrementBalance(payment.userId, amount);

    await this.transactionRepository.create({
      amount,
      type: 'DEPOSIT',
      user: { connect: { id: payment.userId } },
      payment: { connect: { id: payment.id } },
    });
  }
}
