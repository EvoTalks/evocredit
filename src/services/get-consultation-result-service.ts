import { ConsultationLog } from '@/generated/prisma/browser';
import { NeocrediClient } from '@/lib/neocredi-client';
import { ConsultationLogRepository } from '@/repositories/consultation-log-repository';

const DONE_STATUSES = new Set(['SUCCESS', 'ERROR']);

interface GetConsultationResultResponse {
  consultationLog: ConsultationLog;
}

export class GetConsultationResultService {
  constructor(
    private consultationLogRepository: ConsultationLogRepository,
    private neocrediClient: NeocrediClient
  ) {}

  async handler(id: string): Promise<GetConsultationResultResponse> {
    const consultationLog = await this.consultationLogRepository.findById(id);

    if (!consultationLog) {
      throw Object.assign(new Error('Consultation not found'), { statusCode: 404 });
    }

    // Already resolved — return as-is
    if (DONE_STATUSES.has(consultationLog.status)) {
      return { consultationLog };
    }

    const outputData = consultationLog.outputData as Record<string, any>;
    const solicitacaoId: number = outputData?.id;

    if (!solicitacaoId) {
      throw Object.assign(new Error('solicitacaoId not found in consultation log'), { statusCode: 500 });
    }

    const resultado = await this.neocrediClient.getResult(solicitacaoId);

    const isError = resultado.status?.toUpperCase().includes('ERR');
    const isConcluido = resultado.status?.toUpperCase().includes('CONCLUI');

    let newStatus = 'PENDING';
    if (isConcluido) newStatus = 'SUCCESS';
    else if (isError) newStatus = 'ERROR';

    const updated = await this.consultationLogRepository.update(id, {
      outputData: resultado,
      status: newStatus,
      ...(isError ? { errorMessage: resultado.status } : {}),
    });

    return { consultationLog: updated };
  }
}
