import { getStripeSync } from './stripeClient';
import { storage } from './storage';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    try {
      const eventData = JSON.parse(payload.toString());
      
      if (eventData.type === 'checkout.session.completed') {
        const session = eventData.data?.object;
        if (session) {
          await handleCheckoutCompleted(session);
        }
      }
    } catch (parseError) {
      console.error('Error parsing webhook payload:', parseError);
    }
  }
}

async function handleCheckoutCompleted(session: any) {
  try {
    const { templateId, buyerId } = session.metadata || {};
    
    if (!templateId || !buyerId) {
      console.log('Checkout completed but no template/buyer metadata found');
      return;
    }

    const template = await storage.getStyleTemplate(templateId);
    if (!template) {
      console.error(`Template ${templateId} not found for purchase`);
      return;
    }

    const alreadyPurchased = await storage.hasUserPurchasedTemplate(buyerId, templateId);
    if (alreadyPurchased) {
      console.log(`User ${buyerId} already owns template ${templateId}`);
      return;
    }

    const purchase = await storage.createTemplatePurchase({
      templateId,
      buyerId,
      sellerId: template.authorId || "platform",
      price: session.amount_total || template.price || 0,
      transactionId: session.payment_intent || session.id
    });

    await storage.updateStyleTemplate(templateId, {
      usageCount: (template.usageCount || 0) + 1
    });

    console.log(`Purchase created for template ${templateId} by user ${buyerId}`);
  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}
