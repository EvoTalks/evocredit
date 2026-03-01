import { WebhookConfigPrismaRepository } from '@/repositories/prisma/webhook-config-prisma-repository';
import { Request, Response } from 'express';
import z from 'zod';

const bodySchema = z.object({
  url: z.string().url(),
});

const repo = new WebhookConfigPrismaRepository();

export const createWebhookConfigController = async (request: Request, response: Response) => {
  try {
    const { url } = bodySchema.parse(request.body);
    const config = await repo.create({ url });
    return response.status(201).json({ webhookConfig: config });
  } catch (error) {
    console.error('Error creating webhook config:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
};

export const listWebhookConfigsController = async (_request: Request, response: Response) => {
  try {
    const configs = await repo.findAll();
    return response.status(200).json({ webhookConfigs: configs });
  } catch (error) {
    console.error('Error listing webhook configs:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
};
