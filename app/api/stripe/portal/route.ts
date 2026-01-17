import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Stripe Customer Portal API route
 *
 * In production this route would create a customer portal session via
 * Stripe and return its URL. This placeholder simply redirects to
 * the Aura page.
 */
export async function POST(request: NextRequest) {
  return NextResponse.json({ url: '/aura' });
}