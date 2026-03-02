import { ConsultationLog } from '@/generated/prisma/browser';
import { ConsultationLogRepository } from '@/repositories/consultation-log-repository';

interface ListConsultationsResponse {
  consultationLogs: ConsultationLog[];
}

export class ListConsultationsService {
  constructor(private consultationLogRepository: ConsultationLogRepository) {}

  async handler(userId: string): Promise<ListConsultationsResponse> {
    const consultationLogs = await this.consultationLogRepository.findByUserId(userId);
    return { consultationLogs };
  }
}
