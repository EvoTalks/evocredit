import { ConsultationLogPrismaRepository } from '@/repositories/prisma/consultation-log-prisma-repository';
import { ListConsultationsService } from '@/services/list-consultations-service';
import { Request, Response } from 'express';
import z from 'zod';

const querySchema = z.object({
  userId: z.string(),
});

export const listConsultationsController = async (request: Request, response: Response) => {
  try {
    const { userId } = querySchema.parse(request.query);

    const service = new ListConsultationsService(new ConsultationLogPrismaRepository());
    const { consultationLogs } = await service.handler(userId);

    return response.status(200).json({ consultationLogs });
  } catch (error) {
    console.error('Error listing consultations:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
};
