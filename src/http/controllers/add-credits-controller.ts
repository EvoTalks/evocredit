import { env } from '@/env';
import { AsaasClient } from '@/lib/asaas-client';
import { PaymentPrismaRepository } from '@/repositories/prisma/payment-prisma-repository';
import { UserPrismaRepository } from '@/repositories/prisma/user-prisma-repository';
import { AddCreditsService } from '@/services/add-credits-service';
import { Request, Response } from 'express';
import z from 'zod';

const bodySchema = z.object({
  asaasCustomerId: z.string(),
  value: z.number().positive(),
});

export const addCreditsController = async (request: Request, response: Response) => {
  try {
    const { asaasCustomerId, value } = bodySchema.parse(request.body);

    const asaasClient = new AsaasClient(env.ASAAS_API_KEY);
    const service = new AddCreditsService(
      new UserPrismaRepository(),
      new PaymentPrismaRepository(),
      asaasClient
    );

    const { payment } = await service.handler({ asaasCustomerId, value });

    return response.status(201).json({ payment });
  } catch (error: any) {
    if (error?.statusCode === 404) {
      return response.status(404).json({ error: 'User not found' });
    }

    console.error('Error adding credits:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
};
