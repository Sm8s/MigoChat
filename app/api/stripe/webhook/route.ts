import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Stripe Webhook API route
 *
 * This endpoint would normally handle Stripe events such as
 * `checkout.session.completed`, `invoice.paid`, etc., update
 * `aura_subscriptions` and `entitlements` tables accordingly and
 * perform idempotent upserts. In this placeholder implementation, we
 * simply return a 200 response to acknowledge the event so that Stripe
 * does not retry. You should replace this code with actual Stripe
 * webhook verification and database logic when integrating for real.
 */
export async function POST(request: NextRequest) {
  // Consume the raw request body in production to verify the signature
  return new NextResponse('OK', { status: 200 });
}