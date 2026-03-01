import { Payment } from '@/generated/prisma/browser';
import { Prisma } from '@/generated/prisma/client';

export interface PaymentRepository {
  create(data: Prisma.PaymentCreateInput): Promise<Payment>;
  findByExternalId(externalId: string): Promise<Payment | null>;
  updateStatus(id: string, data: Prisma.PaymentUpdateInput): Promise<Payment>;
}
