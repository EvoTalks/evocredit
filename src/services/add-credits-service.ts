import { Payment } from '@/generated/prisma/browser';
import { AsaasClient } from '@/lib/asaas-client';
import { PaymentRepository } from '@/repositories/payment-repository';
import { UserRepository } from '@/repositories/user-repository';

interface AddCreditsRequest {
  asaasCustomerId: string;
  value: number;
}

interface AddCreditsResponse {
  payment: Payment;
}

export class AddCreditsService {
  constructor(
    private userRepository: UserRepository,
    private paymentRepository: PaymentRepository,
    private asaasClient: AsaasClient
  ) {}

  async handler({ asaasCustomerId, value }: AddCreditsRequest): Promise<AddCreditsResponse> {
    const user = await this.userRepository.findByAsaasCustomerId(asaasCustomerId);

    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    const today = new Date().toISOString().split('T')[0];

    const asaasPayment = await this.asaasClient.createPayment({
      customer: asaasCustomerId,
      billingType: 'PIX',
      value,
      dueDate: today,
    });

    const pixQrCode = await this.asaasClient.getPixQrCode(asaasPayment.id);

    const payment = await this.paymentRepository.create({
      externalId: asaasPayment.id,
      amount: value,
      status: 'PENDING',
      pixCode: pixQrCode.payload,
      qrCodeImage: pixQrCode.encodedImage,
      user: { connect: { id: user.id } },
    });

    return { payment };
  }
}
