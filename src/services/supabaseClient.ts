/**
 * DemandX 2.0 — Supabase Client & Real-time Synchronization Service
 * ===================================================================
 * Connects directly to Supabase when VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY
 * are defined in .env, enabling:
 * 1. Supabase PostgreSQL real-time change stream subscriptions
 * 2. Supabase Auth sessions & Row-Level Security
 * 3. Graceful fallback to DemandX FastAPI REST Core (http://127.0.0.1:8001)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

let client: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('your_supabase_project_url')) {
  try {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    console.info(' DemandX 2.0 connected to Supabase Real-time Cloud:', SUPABASE_URL);
  } catch (err) {
    console.warn(' Supabase client initialization error:', err);
    client = null;
  }
} else {
  console.info(' DemandX 2.0 operating in Hybrid Local Engine mode (Supabase URL unconfigured). Using Enterprise FastAPI Persistence.');
}

export const supabase = client;

/**
 * Returns true if direct Supabase credentials are configured.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(client && SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Subscribes to real-time purchase order changes via Supabase Realtime channel.
 * Returns an unsubscribe callback.
 */
export function subscribeToSupabaseOrders(
  onUpdate: (payload: any) => void
): () => void {
  if (!client) {
    return () => {};
  }

  const channel = client
    .channel('public:purchase_orders')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'purchase_orders' },
      (payload) => {
        console.info('⚡ Supabase Realtime Order Update:', payload);
        onUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    client?.removeChannel(channel);
  };
}

/**
 * Fetch database connectivity info from DemandX Backend.
 */
export async function fetchDatabaseHealth(): Promise<any> {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001';
  try {
    const res = await fetch(`${apiBase}/api/database/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      status: 'offline',
      error: (err as Error).message,
      provider: 'Unavailable',
      is_supabase: false,
    };
  }
}
