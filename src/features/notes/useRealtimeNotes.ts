import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import { logError } from '@/lib/logger';
import { notesKeys } from './queryKeys';

/**
 * Subscribes to Realtime changes on the user's notes and invalidates the list
 * cache so other devices' edits propagate. No-op while disabled.
 */
export function useRealtimeNotes(enabled: boolean): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let channel: RealtimeChannel;
    try {
      channel = getSupabase()
        .channel('public:notes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => {
          void queryClient.invalidateQueries({ queryKey: notesKeys.list() });
        })
        .subscribe();
    } catch (error) {
      logError(error, { scope: 'useRealtimeNotes' });
      return;
    }

    return () => {
      void getSupabase().removeChannel(channel);
    };
  }, [enabled, queryClient]);
}
