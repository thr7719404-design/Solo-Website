import { Controller, Post, Req, Res, Headers, HttpCode, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { StripeWebhookService } from './stripe-webhook.service';

@Controller('stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(private readonly webhookService: StripeWebhookService) {}

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      this.logger.warn('Webhook received without stripe-signature header');
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    // Verify signature using raw body
    let event;
    try {
      const rawBody = (req as any).rawBody as Buffer;
      if (!rawBody) {
        this.logger.error('Raw body not available — ensure raw body middleware is configured');
        return res.status(400).json({ error: 'Raw body not available' });
      }
      event = this.webhookService.verifyWebhookSignature(rawBody, signature);
    } catch (err) {
      this.logger.warn(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).json({ error: `Signature verification failed: ${err.message}` });
    }

    // Idempotency: skip already-processed events
    const alreadyProcessed = await this.webhookService.isEventProcessed(event.id);
    if (alreadyProcessed) {
      this.logger.log(`Event ${event.id} already processed — skipping`);
      return res.status(200).json({ received: true, duplicate: true });
    }

    // Process the event
    try {
      await this.webhookService.processEvent(event);
      await this.webhookService.saveEventRecord(event.id, event.type, event, true);
      this.logger.log(`Event ${event.id} (${event.type}) processed successfully`);
      return res.status(200).json({ received: true });
    } catch (err) {
      this.logger.error(`Event ${event.id} processing failed: ${err.message}`, err.stack);
      await this.webhookService.saveEventRecord(event.id, event.type, event, false, err.message);
      return res.status(500).json({ error: 'Event processing failed' });
    }
  }
}
