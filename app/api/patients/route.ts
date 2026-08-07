import { NextResponse } from 'next/server';
import { getPatients } from '@/lib/store';

// We force dynamic because this route returns real-time data from a memory store
// Next.js App Router aggressively caches GET requests by default
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const patients = getPatients();
    return NextResponse.json({ patients });
  } catch (error) {
    console.error('Failed to fetch patients:', error);
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 });
  }
}
