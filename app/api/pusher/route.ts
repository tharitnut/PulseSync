import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { updatePatient } from '@/lib/store';

export async function POST(req: Request) {
  try {
    // sendBeacon sends as text/plain, so handle both content types
    const contentType = req.headers.get('content-type') || '';
    let body;
    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      const text = await req.text();
      body = JSON.parse(text);
    }
    const { event, data } = body;

    if (!event || !data) {
      return NextResponse.json({ error: 'Missing event or data' }, { status: 400 });
    }

    // Save state to our memory store
    if (data.sessionId) {
      updatePatient(data.sessionId, {
        status: event as 'typing' | 'submitted' | 'abandoned',
        name: data.name,
        timestamp: data.timestamp || new Date().toISOString(),
        details: data.details,
        id: data.id
      });
    }

    // Broadcast to the 'patient-updates' channel
    await pusherServer.trigger('patient-updates', event, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Pusher error:', error);
    return NextResponse.json({ error: 'Failed to broadcast event' }, { status: 500 });
  }
}
