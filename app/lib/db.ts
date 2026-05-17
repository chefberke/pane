import { init } from '@instantdb/react';
import schema from '../../instant.schema';

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;

if (!APP_ID && typeof window !== 'undefined') {
  console.warn(
    '[InstantDB] NEXT_PUBLIC_INSTANT_APP_ID is not set. Copy .env.example to .env.local and fill it in.',
  );
}

/**
 * InstantDB client singleton — used everywhere auth or db reads/writes are needed.
 * Falls back to a placeholder app ID so the build does not crash; real network
 * calls will fail until a valid `NEXT_PUBLIC_INSTANT_APP_ID` is provided.
 */
export const db = init({ appId: APP_ID || 'missing-instant-app-id', schema });
