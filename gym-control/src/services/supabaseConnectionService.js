// src/services/supabaseConnectionService.js

import {
  supabase,
  getSupabaseClientStatus
} from '../lib/supabaseClient.js';


// ======================================================
// ESTADO DEL CLIENTE
// ======================================================

export const getSupabaseStatus =
  () => {

    return getSupabaseClientStatus();

  };


// ======================================================
// PRUEBA BÁSICA
// ======================================================
//
// Todavía NO tenemos tablas.
//
// Por eso no hacemos:
//
// .from('members').select()
//
// Primero simplemente comprobamos que:
// - las variables existen
// - el cliente se inicializó
//
// ======================================================

export const testSupabaseConfiguration =
  async () => {

    try {

      const status =
        getSupabaseClientStatus();


      if (
        !status.configured
      ) {

        return {

          success:
            false,

          message:
            'Supabase todavía no está configurado correctamente.'

        };

      }


      // ==================================================
      // CONSULTAR SESIÓN
      // ==================================================
      //
      // Esto no requiere que nosotros creemos ninguna
      // tabla todavía.
      //
      // Si el proyecto responde, sabremos que el cliente
      // puede comunicarse con Supabase.
      //
      // ==================================================

      const {
        data,
        error
      } =
        await supabase.auth
          .getSession();


      if (
        error
      ) {

        throw error;

      }


      return {

        success:
          true,

        message:
          'NEXGYM pudo comunicarse correctamente con Supabase.',

        configured:
          true,

        hasSession:
          Boolean(
            data?.session
          ),

        session:
          data?.session ||
          null

      };

    } catch (error) {

      console.error(
        '❌ Error conectando NEXGYM con Supabase:',
        error
      );


      return {

        success:
          false,

        message:
          error?.message ||
          'No se pudo conectar con Supabase.',

        error

      };

    }

  };


// ======================================================
// EXPORT
// ======================================================

export default {

  getSupabaseStatus,

  testSupabaseConfiguration

};