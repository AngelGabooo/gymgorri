// src/nexgym/services/nexgymAdminAuthService.js

import {
  supabase
} from '../../lib/supabaseClient.js';


// ======================================================
// STORAGE
// ======================================================
//
// IMPORTANTE:
//
// La contraseña ya NO se guarda aquí.
//
// Supabase Auth administra:
// - correo
// - contraseña
// - sesión
// - token
//
// Este almacenamiento es solamente un cache ligero
// para que React Router pueda consultar la sesión
// de forma síncrona.
//
// ======================================================

const NEXGYM_ADMIN_SESSION_KEY =
  'nexgym_admin_session';

const NEXGYM_ADMIN_AUTH_KEY =
  'nexgym_admin_authenticated';

const NEXGYM_ADMIN_PROFILE_KEY =
  'nexgym_admin_profile';


// ======================================================
// NORMALIZAR EMAIL
// ======================================================

const normalizeEmail = (
  value
) => {

  return String(
    value ||
    ''
  )
    .trim()
    .toLowerCase();

};


// ======================================================
// DISPARAR CAMBIO DE AUTH
// ======================================================

const emitAuthUpdate =
  () => {

    window.dispatchEvent(
      new Event(
        'nexgym-admin-auth-update'
      )
    );

  };


// ======================================================
// LIMPIAR CACHE
// ======================================================

const clearAdminCache =
  () => {

    localStorage.removeItem(
      NEXGYM_ADMIN_AUTH_KEY
    );

    localStorage.removeItem(
      NEXGYM_ADMIN_SESSION_KEY
    );

    localStorage.removeItem(
      NEXGYM_ADMIN_PROFILE_KEY
    );

    emitAuthUpdate();

  };


// ======================================================
// GUARDAR SESIÓN LOCAL
// ======================================================

const saveAdminSession =
  (
    profile,
    authSession = null
  ) => {

    if (
      !profile?.id ||
      !profile?.user_id
    ) {

      clearAdminCache();

      return null;

    }


    const session = {

      id:
        profile.id,

      userId:
        profile.user_id,

      name:
        profile.name ||
        'Super Administrador',

      email:
        profile.email ||
        '',

      role:
        profile.role ||
        'super_admin',

      status:
        profile.status ||
        'active',

      loginAt:
        new Date()
          .toISOString(),

      expiresAt:
        authSession?.expires_at
          ? new Date(
              authSession.expires_at *
              1000
            ).toISOString()
          : null

    };


    localStorage.setItem(
      NEXGYM_ADMIN_AUTH_KEY,
      'true'
    );


    localStorage.setItem(
      NEXGYM_ADMIN_SESSION_KEY,
      JSON.stringify(
        session
      )
    );


    localStorage.setItem(
      NEXGYM_ADMIN_PROFILE_KEY,
      JSON.stringify(
        profile
      )
    );


    emitAuthUpdate();


    return session;

  };


// ======================================================
// LEER PERFIL DE SUPABASE
// ======================================================

const getRemoteNexgymAdminProfile =
  async (
    userId
  ) => {

    if (
      !userId
    ) {

      return {
        success:
          false,

        message:
          'No existe un usuario autenticado.'
      };

    }


    const {
      data,
      error
    } =
      await supabase

        .from(
          'nexgym_admins'
        )

        .select(
          `
            id,
            user_id,
            name,
            email,
            role,
            status,
            last_access_at,
            created_at,
            updated_at
          `
        )

        .eq(
          'user_id',
          userId
        )

        .maybeSingle();


    if (
      error
    ) {

      console.error(
        'Error consultando nexgym_admins:',
        error
      );


      return {
        success:
          false,

        message:
          'No se pudo validar la cuenta administrativa.',

        error
      };

    }


    if (
      !data
    ) {

      return {
        success:
          false,

        code:
          'NOT_NEXGYM_ADMIN',

        message:
          'Esta cuenta no tiene acceso al panel NEXGYM.'
      };

    }


    if (
      data.role !==
      'super_admin'
    ) {

      return {
        success:
          false,

        code:
          'INVALID_ROLE',

        message:
          'Esta cuenta no tiene permisos de Super Administrador.'
      };

    }


    if (
      data.status !==
      'active'
    ) {

      return {
        success:
          false,

        code:
          'ADMIN_INACTIVE',

        message:
          'Esta cuenta administrativa está desactivada.'
      };

    }


    return {
      success:
        true,

      admin:
        data
    };

  };


// ======================================================
// OBTENER ADMINISTRADORES
// ======================================================
//
// Se conserva esta función para no romper componentes
// antiguos que todavía puedan importarla.
//
// Ya NO devuelve contraseñas.
//
// ======================================================

export const getNexgymAdminUsers =
  () => {

    try {

      const raw =
        localStorage.getItem(
          NEXGYM_ADMIN_PROFILE_KEY
        );


      if (
        !raw
      ) {

        return [];

      }


      const profile =
        JSON.parse(
          raw
        );


      return profile
        ? [
            profile
          ]
        : [];

    } catch (error) {

      console.error(
        'Error leyendo cache del administrador NEXGYM:',
        error
      );


      return [];

    }

  };


// ======================================================
// GUARDAR ADMINISTRADORES
// ======================================================
//
// Compatibilidad.
//
// Ya no utilizaremos esta función para almacenar
// credenciales.
//
// ======================================================

export const saveNexgymAdminUsers =
  (
    users
  ) => {

    const list =
      Array.isArray(
        users
      )
        ? users
        : [];


    const admin =
      list[
        0
      ] ||
      null;


    if (
      admin
    ) {

      localStorage.setItem(
        NEXGYM_ADMIN_PROFILE_KEY,
        JSON.stringify(
          admin
        )
      );

    }


    return list;

  };


// ======================================================
// PREPARAR / RESTAURAR ADMIN
// ======================================================
//
// Antes esta función CREABA un administrador local.
//
// AHORA:
// - consulta la sesión Supabase existente
// - valida nexgym_admins
// - reconstruye el cache
//
// ======================================================

export const ensureDefaultNexgymAdmin =
  async () => {

    try {

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


      const authSession =
        data?.session ||
        null;


      if (
        !authSession?.user?.id
      ) {

        clearAdminCache();

        return [];

      }


      const profileResult =
        await getRemoteNexgymAdminProfile(
          authSession.user.id
        );


      if (
        !profileResult.success
      ) {

        await supabase.auth
          .signOut();

        clearAdminCache();

        return [];

      }


      saveAdminSession(
        profileResult.admin,
        authSession
      );


      return [
        profileResult.admin
      ];

    } catch (error) {

      console.error(
        'Error restaurando sesión NEXGYM:',
        error
      );


      clearAdminCache();


      return [];

    }

  };


// ======================================================
// AUTENTICAR SUPER ADMIN
// ======================================================

export const authenticateNexgymAdmin =
  async (
    email,
    password
  ) => {

    try {

      const normalizedEmail =
        normalizeEmail(
          email
        );


      const normalizedPassword =
        String(
          password ||
          ''
        );


      if (
        !normalizedEmail ||
        !normalizedPassword
      ) {

        return {
          success:
            false,

          code:
            'EMPTY_FIELDS',

          message:
            'Ingresa tu correo y contraseña.'
        };

      }


      // ==================================================
      // SUPABASE AUTH
      // ==================================================

      const {
        data,
        error
      } =
        await supabase.auth
          .signInWithPassword({

            email:
              normalizedEmail,

            password:
              normalizedPassword

          });


      if (
        error
      ) {

        console.error(
          'Supabase Auth login:',
          error
        );


        clearAdminCache();


        return {
          success:
            false,

          code:
            'INVALID_CREDENTIALS',

          message:
            'Correo o contraseña incorrectos.'
        };

      }


      const authUser =
        data?.user;


      const authSession =
        data?.session;


      if (
        !authUser?.id ||
        !authSession
      ) {

        clearAdminCache();


        return {
          success:
            false,

          code:
            'SESSION_ERROR',

          message:
            'Supabase no pudo crear una sesión.'
        };

      }


      // ==================================================
      // VALIDAR QUE SEA SUPER ADMIN
      // ==================================================

      const profileResult =
        await getRemoteNexgymAdminProfile(
          authUser.id
        );


      if (
        !profileResult.success
      ) {

        await supabase.auth
          .signOut();


        clearAdminCache();


        return profileResult;

      }


      const session =
        saveAdminSession(
          profileResult.admin,
          authSession
        );


      console.log(
        '✅ Super Admin NEXGYM autenticado con Supabase:',
        {
          id:
            profileResult.admin.id,

          email:
            profileResult.admin.email,

          role:
            profileResult.admin.role
        }
      );


      return {
        success:
          true,

        admin:
          profileResult.admin,

        session
      };

    } catch (error) {

      console.error(
        'Error iniciando sesión NEXGYM:',
        error
      );


      clearAdminCache();


      return {
        success:
          false,

        code:
          'LOGIN_ERROR',

        message:
          'No se pudo iniciar sesión.'
      };

    }

  };


// ======================================================
// OBTENER SESIÓN
// ======================================================
//
// Esta función sigue siendo SÍNCRONA.
//
// Eso permite conservar:
// - NexgymProtectedRoute
// - NexgymAdminLayout
// - NexgymSidebar
//
// ======================================================

export const getCurrentNexgymAdminSession =
  () => {

    try {

      const authenticated =
        localStorage.getItem(
          NEXGYM_ADMIN_AUTH_KEY
        );


      if (
        authenticated !==
        'true'
      ) {

        return null;

      }


      const raw =
        localStorage.getItem(
          NEXGYM_ADMIN_SESSION_KEY
        );


      if (
        !raw
      ) {

        return null;

      }


      const session =
        JSON.parse(
          raw
        );


      if (
        !session?.id ||
        !session?.userId
      ) {

        clearAdminCache();

        return null;

      }


      if (
        session.role !==
        'super_admin'
      ) {

        clearAdminCache();

        return null;

      }


      if (
        session.status !==
        'active'
      ) {

        clearAdminCache();

        return null;

      }


      return session;

    } catch (error) {

      console.error(
        'Error leyendo sesión NEXGYM:',
        error
      );


      clearAdminCache();


      return null;

    }

  };


// ======================================================
// ESTÁ AUTENTICADO
// ======================================================

export const isNexgymAdminAuthenticated =
  () => {

    return Boolean(
      getCurrentNexgymAdminSession()
    );

  };


// ======================================================
// CERRAR SESIÓN
// ======================================================

export const logoutNexgymAdmin =
  () => {

    // Limpiamos inmediatamente para que React Router
    // pueda reaccionar sin esperar la petición.

    clearAdminCache();


    void supabase.auth
      .signOut()
      .catch(
        error => {

          console.error(
            'Error cerrando sesión Supabase:',
            error
          );

        }
      );

  };


// ======================================================
// CAMBIAR CONTRASEÑA
// ======================================================

export const changeNexgymAdminPassword =
  async (
    currentPassword,
    newPassword
  ) => {

    try {

      const session =
        getCurrentNexgymAdminSession();


      if (
        !session
      ) {

        return {
          success:
            false,

          message:
            'No existe una sesión administrativa.'
        };

      }


      const current =
        String(
          currentPassword ||
          ''
        );


      const next =
        String(
          newPassword ||
          ''
        );


      if (
        !current ||
        !next
      ) {

        return {
          success:
            false,

          message:
            'Completa todos los campos.'
        };

      }


      if (
        next.length <
        8
      ) {

        return {
          success:
            false,

          message:
            'La nueva contraseña debe tener al menos 8 caracteres.'
        };

      }


      if (
        current ===
        next
      ) {

        return {
          success:
            false,

          message:
            'La nueva contraseña debe ser diferente a la actual.'
        };

      }


      // ==================================================
      // CONFIRMAR CONTRASEÑA ACTUAL
      // ==================================================

      const {
        error:
          verifyError
      } =
        await supabase.auth
          .signInWithPassword({

            email:
              session.email,

            password:
              current

          });


      if (
        verifyError
      ) {

        return {
          success:
            false,

          message:
            'La contraseña actual es incorrecta.'
        };

      }


      // ==================================================
      // CAMBIAR EN SUPABASE AUTH
      // ==================================================

      const {
        error:
          updateError
      } =
        await supabase.auth
          .updateUser({

            password:
              next

          });


      if (
        updateError
      ) {

        console.error(
          'Error actualizando contraseña:',
          updateError
        );


        return {
          success:
            false,

          message:
            updateError.message ||
            'No se pudo actualizar la contraseña.'
        };

      }


      return {
        success:
          true,

        message:
          'Contraseña actualizada correctamente.'
      };

    } catch (error) {

      console.error(
        'Error cambiando contraseña NEXGYM:',
        error
      );


      return {
        success:
          false,

        message:
          'No se pudo actualizar la contraseña.'
      };

    }

  };


// ======================================================
// CREDENCIALES DEFAULT
// ======================================================
//
// Se conserva por compatibilidad.
//
// Ya NO existen credenciales de desarrollo
// predeterminadas.
//
// ======================================================

export const getDefaultNexgymAdminCredentials =
  () => {

    return {
      email:
        '',
      password:
        ''
    };

  };


// ======================================================
// ESCUCHAR LOGOUT DE SUPABASE
// ======================================================

supabase.auth.onAuthStateChange(
  (
    event
  ) => {

    if (
      event ===
      'SIGNED_OUT'
    ) {

      clearAdminCache();

    }

  }
);