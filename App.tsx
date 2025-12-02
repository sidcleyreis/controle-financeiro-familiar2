import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import MainLayout from './MainLayout'; // Alterado de Dashboard para MainLayout
import type { Session } from '@supabase/supabase-js';

// Component to handle the live authentication flow
const LiveApp = () => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // This effect should only run if supabase client is available
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  return !session ? <Auth /> : <MainLayout session={session} />; // Alterado de Dashboard para MainLayout
}


export default function App() {
  // Check if supabase is configured.
  // If not, run in 'demo mode' by rendering the Dashboard directly.
  // If it is configured, run the normal authentication flow.
  return (
    <div>
      {supabase ? <LiveApp /> : <MainLayout />} 
    </div>
  );
}
