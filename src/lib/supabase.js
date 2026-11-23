import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Check your .env file.');
}

export const NETWORK_READ_ERROR_EVENT = 'gula-kabung:network-read-error';

const fetchWithReadErrorSignal = async (input, init) => {
  try {
    return await fetch(input, init);
  } catch (error) {
    const method = (init?.method || input?.method || 'GET').toUpperCase();
    if (error.name !== 'AbortError' && (method === 'GET' || method === 'HEAD')) {
      window.dispatchEvent(new Event(NETWORK_READ_ERROR_EVENT));
    }
    throw error;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: fetchWithReadErrorSignal }
});
