import { UserPrismaRepository } from '@/repositories/prisma/user-prisma-repository';
import { UserService } from '@/services/user-service';
import { AsaasClient } from '@/lib/asaas-client';
import { env } from '@/env';
import { Request, Response } from 'express';
import z from 'zod';

const bodySchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  whatsappId: z.string(),
  cpfCnpj: z.string(),
  asaasCustomerId: z.string().optional(),
  balance: z.number().optional().default(0),
});

export const userController = async (request: Request, response: Response) => {
  try {
    const body = bodySchema.parse(request.body);

    const asaasClient = new AsaasClient(env.ASAAS_API_KEY);

    const userService = new UserService(new UserPrismaRepository(), asaasClient);

    const { user } = await userService.handler({ ...body });

    return response.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
};
