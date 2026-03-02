import { User } from '@/generated/prisma/browser';
import { Prisma } from '@/generated/prisma/client';

export interface UserRepository {
  create(data: Prisma.UserCreateInput): Promise<User>;
  findAll(): Promise<User[]>;
  findByEmail(email: string): Promise<User | null>;
  findByWhatsappId(whatsappId: string): Promise<User | null>;
  findByAsaasCustomerId(asaasCustomerId: string): Promise<User | null>;
  incrementBalance(userId: string, amount: number): Promise<User>;
  decrementBalance(userId: string, amount: number): Promise<User>;
}
