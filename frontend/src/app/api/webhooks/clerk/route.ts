import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-fcfcb.up.railway.app';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    );
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const eventType = evt.type;
  console.log(`Received webhook: ${eventType}`);

  try {
    switch (eventType) {
      // When a subscription is created or updated (payment success)
      case 'user.updated': {
        const { id: userId } = evt.data;
        // Check if the user now has an active subscription
        // In a real implementation, you'd check Clerk's subscription status
        // For now, we'll handle this through Clerk Billing webhooks
        console.log(`User updated: ${userId}`);
        break;
      }

      // Handle subscription events (Clerk Billing)
      // These events would come when using Clerk's built-in billing
      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Helper to suspend user's API keys
async function suspendUserKeys(userId: string) {
  try {
    await fetch(`${API_URL}/api/keys/suspend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': INTERNAL_API_KEY || '',
      },
      body: JSON.stringify({ userId }),
    });
    console.log(`Suspended API keys for user: ${userId}`);
  } catch (error) {
    console.error(`Failed to suspend keys for user ${userId}:`, error);
  }
}

// Helper to reactivate user's API keys
async function reactivateUserKeys(userId: string) {
  try {
    await fetch(`${API_URL}/api/keys/reactivate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': INTERNAL_API_KEY || '',
      },
      body: JSON.stringify({ userId }),
    });
    console.log(`Reactivated API keys for user: ${userId}`);
  } catch (error) {
    console.error(`Failed to reactivate keys for user ${userId}:`, error);
  }
}
