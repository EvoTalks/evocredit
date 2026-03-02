import { ConsultationLog } from '@/generated/prisma/browser';
import { Prisma } from '@/generated/prisma/client';

export interface ConsultationLogRepository {
  create(data: Prisma.ConsultationLogCreateInput): Promise<ConsultationLog>;
  findByUserId(userId: string): Promise<ConsultationLog[]>;
  findById(id: string): Promise<ConsultationLog | null>;
  update(id: string, data: Prisma.ConsultationLogUpdateInput): Promise<ConsultationLog>;
}
