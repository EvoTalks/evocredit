import { WebhookConfig } from '@/generated/prisma/browser';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { WebhookConfigRepository } from '../webhook-config-repository';

export class WebhookConfigPrismaRepository implements WebhookConfigRepository {
  async create(data: Prisma.WebhookConfigCreateInput): Promise<WebhookConfig> {
    return prisma.webhookConfig.create({ data });
  }

  async findAll(): Promise<WebhookConfig[]> {
    return prisma.webhookConfig.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findAllActive(): Promise<WebhookConfig[]> {
    return prisma.webhookConfig.findMany({ where: { isActive: true } });
  }
}
