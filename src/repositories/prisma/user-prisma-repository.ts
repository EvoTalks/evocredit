import { User } from '@/generated/prisma/browser';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { UserRepository } from '../user-repository';

export class UserPrismaRepository implements UserRepository {
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  async findAll(): Promise<User[]> {
    return prisma.user.findMany();
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findByAsaasCustomerId(asaasCustomerId: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { asaasCustomerId } });
  }

  async incrementBalance(userId: string, amount: number): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { balance: { increment: amount } },
    });
  }
}
