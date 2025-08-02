
// This file is deprecated and its logic has been moved to /api/chat and /lib/chat.
// It is kept for posterity but is no longer used by the application.
// The new unified endpoint provides a cleaner, more robust interface for all chat modes.

import {type NextRequest, NextResponse} from 'next/server';

export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      error:
        'This endpoint is deprecated. Please use the unified /api/chat endpoint.',
    },
    {status: 410}
  );
}
