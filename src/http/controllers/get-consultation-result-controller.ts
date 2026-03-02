import { env } from '@/env';
import { NeocrediClient } from '@/lib/neocredi-client';
import { ConsultationLogPrismaRepository } from '@/repositories/prisma/consultation-log-prisma-repository';
import { GetConsultationResultService } from '@/services/get-consultation-result-service';
import { Request, Response } from 'express';

export const getConsultationResultController = async (request: Request, response: Response) => {
  try {
    const { id } = request.params;

    const neocrediClient = new NeocrediClient(env.NEOCREDI_TOKEN, env.NEOCREDI_EMAIL_SOLICITANTE);

    const service = new GetConsultationResultService(
      new ConsultationLogPrismaRepository(),
      neocrediClient
    );

    const { consultationLog } = await service.handler(id);

    return response.status(200).json({ consultationLog });
  } catch (error: any) {
    if (error?.statusCode === 404) {
      return response.status(404).json({ error: 'Consultation not found' });
    }
    console.error('Error fetching consultation result:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
};
