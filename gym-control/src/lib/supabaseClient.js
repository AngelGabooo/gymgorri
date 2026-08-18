// src/lib/supabaseClient.js

import {
  createClient
} from '@supabase/supabase-js';


// ======================================================
// VARIABLES DE ENTORNO
// ======================================================

const supabaseUrl =
  import.meta.env
    .VITE_SUPABASE_URL;


const supabasePublishableKey =
  import.meta.env
    .VITE_SUPABASE_PUBLISHABLE_KEY;


// ======================================================
// VALIDACIONES
// ======================================================

if (
  !supabaseUrl
) {

  throw new Error(
    'Falta VITE_SUPABASE_URL en el archivo .env.local'
  );

}


if (
  !supabasePublishableKey
) {

  throw new Error(
    'Falta VITE_SUPABASE_PUBLISHABLE_KEY en el archivo .env.local'
  );

}


// ======================================================
// CLIENTE SUPABASE
// ======================================================

export const supabase =
  createClient(
    supabaseUrl,
    supabasePublishableKey,
    {

      auth: {

        persistSession:
          true,

        autoRefreshToken:
          true,

        detectSessionInUrl:
          true

      }

    }
  );


// ======================================================
// INFORMACIÓN SEGURA DE CONFIGURACIÓN
// ======================================================

export const getSupabaseClientStatus =
  () => {

    return {

      configured:
        Boolean(
          supabaseUrl &&
          supabasePublishableKey
        ),

      projectUrl:
        supabaseUrl,

      hasPublishableKey:
        Boolean(
          supabasePublishableKey
        )

    };

  };


// ======================================================
// EXPORT DEFAULT
// ======================================================

export default supabase;