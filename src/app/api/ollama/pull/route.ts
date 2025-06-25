import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST() {
  return NextResponse.json(
    { error: 'Model management is not supported via the UI when using MCP.', details: 'Please manage your models in the MCP server configuration file.' },
    { status: 400 }
  );
}
