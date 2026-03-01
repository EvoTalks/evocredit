import { Transaction } from '@/generated/prisma/browser';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { TransactionRepository } from '../transaction-repository';

export class TransactionPrismaRepository implements TransactionRepository {
  async create(data: Prisma.TransactionCreateInput): Promise<Transaction> {
    return prisma.transaction.create({ data });
  }
}
