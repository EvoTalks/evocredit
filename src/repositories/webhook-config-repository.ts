import { WebhookConfig } from '@/generated/prisma/browser';
import { Prisma } from '@/generated/prisma/client';

export interface WebhookConfigRepository {
  create(data: Prisma.WebhookConfigCreateInput): Promise<WebhookConfig>;
  findAll(): Promise<WebhookConfig[]>;
  findAllActive(): Promise<WebhookConfig[]>;
}
