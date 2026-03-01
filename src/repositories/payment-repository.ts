import { Payment } from '@/generated/prisma/browser';
import { Prisma } from '@/generated/prisma/client';

export interface PaymentRepository {
  create(data: Prisma.PaymentCreateInput): Promise<Payment>;
}
