import { Transaction } from '@/generated/prisma/browser';
import { Prisma } from '@/generated/prisma/client';

export interface TransactionRepository {
  create(data: Prisma.TransactionCreateInput): Promise<Transaction>;
}
