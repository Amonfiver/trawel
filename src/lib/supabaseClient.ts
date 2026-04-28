/**
 * Cliente Supabase para Trawel
 * 
 * Propósito:
 * Proveer una instancia reutilizable del cliente Supabase para conectar
 * con la base de datos en la nube.
 * 
 * Alcance:
 * - Lee credenciales desde variables de entorno (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
 * - Exporta cliente configurado y listo para usar
 * - Safe-fallback si faltan credenciales (no rompe la app si no se usa Supabase)
 * 
 * Decisiones técnicas:
 * - Usa import.meta.env para acceder a variables de entorno en Vite
 * - No lanza error si faltan credenciales, solo log warning
 * - El chequeo de credenciales se hace en quien use el cliente
 * 
 * Limitaciones / estado temporal:
 * - Solo lectura (RLS policies restrictivas)
 * - Sin autenticación de usuarios por ahora
 * - Sin manejo de errores global (cada query maneja sus errores)
 * 
 * Cambios recientes (2026-04-29):
 * - Creado cliente Supabase inicial
 * - Configurado para leer desde variables de entorno VITE_
 * 
 * Uso:
 *   import { supabase } from '@/lib/supabaseClient';
 *   const { data, error } = await supabase.from('countries').select('*');
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Solo crear cliente si tenemos ambas credenciales
export const supabase = 
  supabaseUrl && supabaseAnonKey 
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Helper para verificar si Supabase está configurado
export const isSupabaseConfigured = (): boolean => {
  return supabase !== null;
};

// Helper para obtener el cliente con chequeo de seguridad
export const getSupabase = () => {
  if (!supabase) {
    throw new Error(
      'Supabase no está configurado. ' +
      'Verifica que VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY estén definidos en .env'
    );
  }
  return supabase;
};