import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
  useTLS: true,
});

declare global {
  interface Window {
    pusherClient?: PusherClient;
  }
}

// Client-side Pusher instance
export const getPusherClient = (): PusherClient | null => {
  if (typeof window !== 'undefined') {
    // Return existing instance or create a new one
    if (!window.pusherClient) {
      const key = process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '';
      const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1';
      window.pusherClient = new PusherClient(key, {
        cluster,
      });
    }
    return window.pusherClient;
  }
  return null;
};
