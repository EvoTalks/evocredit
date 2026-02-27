import { User } from '@/generated/prisma/browser';
import { Prisma } from '@/generated/prisma/client';

export interface UserRepository {
  create(data: Prisma.UserCreateInput): Promise<User>;
  findAll(): Promise<User[]>;
  findByEmail(email: string): Promise<User | null>;
}
