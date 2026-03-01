import { Router } from 'express';
import { webhookController } from '../controllers/webhook-controller';
import { createWebhookConfigController, listWebhookConfigsController } from '../controllers/webhook-config-controller';

const webhookRoute = Router();

// Incoming: Asaas payment confirmation
webhookRoute.post('/webhooks/asaas', webhookController);

// Manage outgoing webhook destinations
webhookRoute.post('/webhooks/configs', createWebhookConfigController);
webhookRoute.get('/webhooks/configs', listWebhookConfigsController);

export default webhookRoute;
