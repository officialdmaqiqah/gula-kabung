import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useStoreWhatsapp() {
  const [whatsapp, setWhatsapp] = useState('');

  useEffect(() => {
    let active = true;
    supabase
      .from('kabung_settings')
      .select('whatsapp')
      .eq('id', 'main')
      .single()
      .then(({ data }) => {
        if (active) setWhatsapp(data?.whatsapp || '');
      });
    return () => { active = false; };
  }, []);

  return whatsapp;
}
