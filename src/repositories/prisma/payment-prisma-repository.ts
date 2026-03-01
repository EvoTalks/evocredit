import { Payment } from '@/generated/prisma/browser';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { PaymentRepository } from '../payment-repository';

export class PaymentPrismaRepository implements PaymentRepository {
  async create(data: Prisma.PaymentCreateInput): Promise<Payment> {
    return prisma.payment.create({ data });
  }

  async findByExternalId(externalId: string): Promise<Payment | null> {
    return prisma.payment.findUnique({ where: { externalId } });
  }

  async updateStatus(id: string, data: Prisma.PaymentUpdateInput): Promise<Payment> {
    return prisma.payment.update({ where: { id }, data });
  }
}
