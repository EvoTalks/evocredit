import { ConsultationLog } from '@/generated/prisma/browser';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { ConsultationLogRepository } from '../consultation-log-repository';

export class ConsultationLogPrismaRepository implements ConsultationLogRepository {
  async create(data: Prisma.ConsultationLogCreateInput): Promise<ConsultationLog> {
    return prisma.consultationLog.create({ data });
  }

  async findByUserId(userId: string): Promise<ConsultationLog[]> {
    return prisma.consultationLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<ConsultationLog | null> {
    return prisma.consultationLog.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.ConsultationLogUpdateInput): Promise<ConsultationLog> {
    return prisma.consultationLog.update({ where: { id }, data });
  }
}
