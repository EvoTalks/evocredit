import { env } from '@/env';
import { NeocrediClient } from '@/lib/neocredi-client';
import { ConsultationLogPrismaRepository } from '@/repositories/prisma/consultation-log-prisma-repository';
import { TransactionPrismaRepository } from '@/repositories/prisma/transaction-prisma-repository';
import { UserPrismaRepository } from '@/repositories/prisma/user-prisma-repository';
import { CreateConsultationService } from '@/services/create-consultation-service';
import { Request, Response } from 'express';
import z from 'zod';

const bodySchema = z.object({
  whatsappId: z.string(),
  type: z.enum(['cpf', 'cnpj']),
  document: z.string(),
  emailSolicitante: z.string().email(),
});

export const createConsultationController = async (request: Request, response: Response) => {
  try {
    const body = bodySchema.parse(request.body);

    const neocrediClient = new NeocrediClient(env.NEOCREDI_TOKEN);

    const service = new CreateConsultationService(
      new UserPrismaRepository(),
      new ConsultationLogPrismaRepository(),
      new TransactionPrismaRepository(),
      neocrediClient
    );

    const { consultationLog } = await service.handler(body);

    return response.status(201).json({ consultationLog });
  } catch (error: any) {
    if (error?.statusCode === 404) {
      return response.status(404).json({ error: 'User not found' });
    }
    if (error?.statusCode === 422) {
      return response.status(422).json({ error: 'Insufficient balance' });
    }
    console.error('Error creating consultation:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
};
