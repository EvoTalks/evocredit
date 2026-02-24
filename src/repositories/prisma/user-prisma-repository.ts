import { User } from '@/generated/prisma/browser';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { UserRepository } from '../user-repository';

export class UserPrismaRepository implements UserRepository {
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  findByEmail(email: string): Promise<User | null> {
    throw new Error('Method not implemented.');
  }
}
