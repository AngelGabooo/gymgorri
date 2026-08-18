// src/nexgym/services/nexgymAdminAuthService.js

import {
  hashValue
} from '../../utils/memberId';


// ======================================================
// STORAGE
// ======================================================

const NEXGYM_ADMIN_USERS_KEY =
  'nexgym_admin_users';

const NEXGYM_ADMIN_SESSION_KEY =
  'nexgym_admin_session';

const NEXGYM_ADMIN_AUTH_KEY =
  'nexgym_admin_authenticated';


// ======================================================
// CREDENCIALES INICIALES
// ======================================================
//
// Para desarrollo.
//
// Si después agregas:
//
// VITE_NEXGYM_ADMIN_EMAIL
// VITE_NEXGYM_ADMIN_PASSWORD
//
// en tu .env, se usarán esos valores.
//
// ======================================================

const DEFAULT_ADMIN_EMAIL =
  import.meta.env
    .VITE_NEXGYM_ADMIN_EMAIL ||
  'admin@nexgym.local';


const DEFAULT_ADMIN_PASSWORD =
  import.meta.env
    .VITE_NEXGYM_ADMIN_PASSWORD ||
  'NexGym#2026';


const DEFAULT_ADMIN_NAME =
  'Angel García';


// ======================================================
// NORMALIZAR EMAIL
// ======================================================

const normalizeEmail = (
  value
) => {

  return String(
    value || ''
  )
    .trim()
    .toLowerCase();

};


// ======================================================
// CREAR ID
// ======================================================

const createAdminId = () => {

  if (
    window.crypto?.randomUUID
  ) {

    return `NEXADMIN-${window.crypto.randomUUID()}`;

  }


  return (
    `NEXADMIN-${Date.now()}-` +
    Math.random()
      .toString(36)
      .substring(
        2,
        8
      )
  );

};


// ======================================================
// OBTENER TODOS LOS ADMINISTRADORES
// ======================================================

export const getNexgymAdminUsers =
  () => {

    try {

      const raw =
        localStorage.getItem(
          NEXGYM_ADMIN_USERS_KEY
        );


      if (!raw) {

        return [];

      }


      const parsed =
        JSON.parse(
          raw
        );


      return Array.isArray(
        parsed
      )
        ? parsed
        : [];

    } catch (error) {

      console.error(
        'Error leyendo administradores NEXGYM:',
        error
      );


      return [];

    }

  };


// ======================================================
// GUARDAR ADMINISTRADORES
// ======================================================

export const saveNexgymAdminUsers =
  (
    users
  ) => {

    const safeUsers =
      Array.isArray(
        users
      )
        ? users
        : [];


    localStorage.setItem(
      NEXGYM_ADMIN_USERS_KEY,
      JSON.stringify(
        safeUsers
      )
    );


    window.dispatchEvent(
      new Event(
        'nexgym-admin-update'
      )
    );


    return safeUsers;

  };


// ======================================================
// CREAR SUPER ADMIN INICIAL
// ======================================================

export const ensureDefaultNexgymAdmin =
  async () => {

    const users =
      getNexgymAdminUsers();


    if (
      users.length >
      0
    ) {

      return users;

    }


    const now =
      new Date()
        .toISOString();


    const passwordHash =
      await hashValue(
        DEFAULT_ADMIN_PASSWORD
      );


    const admin = {

      id:
        createAdminId(),

      name:
        DEFAULT_ADMIN_NAME,

      email:
        normalizeEmail(
          DEFAULT_ADMIN_EMAIL
        ),

      passwordHash,

      role:
        'super_admin',

      status:
        'active',

      createdAt:
        now,

      updatedAt:
        now,

      lastAccessAt:
        null,

      passwordUpdatedAt:
        null

    };


    saveNexgymAdminUsers([
      admin
    ]);


    return [
      admin
    ];

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

      await ensureDefaultNexgymAdmin();


      const normalizedEmail =
        normalizeEmail(
          email
        );


      const normalizedPassword =
        String(
          password || ''
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


      const users =
        getNexgymAdminUsers();


      const adminIndex =
        users.findIndex(
          user =>
            normalizeEmail(
              user.email
            ) ===
            normalizedEmail
        );


      if (
        adminIndex ===
        -1
      ) {

        return {

          success:
            false,

          code:
            'USER_NOT_FOUND',

          message:
            'No existe un administrador con este correo.'

        };

      }


      const admin =
        users[
          adminIndex
        ];


      if (
        admin.status !==
        'active'
      ) {

        return {

          success:
            false,

          code:
            'USER_INACTIVE',

          message:
            'Esta cuenta administrativa está desactivada.'

        };

      }


      const passwordHash =
        await hashValue(
          normalizedPassword
        );


      if (
        passwordHash !==
        admin.passwordHash
      ) {

        return {

          success:
            false,

          code:
            'INVALID_PASSWORD',

          message:
            'La contraseña es incorrecta.'

        };

      }


      const now =
        new Date()
          .toISOString();


      const session = {

        id:
          admin.id,

        name:
          admin.name,

        email:
          admin.email,

        role:
          'super_admin',

        loginAt:
          now

      };


      const updatedAdmin = {

        ...admin,

        lastAccessAt:
          now,

        updatedAt:
          now

      };


      const updatedUsers =
        users.map(
          (
            item,
            index
          ) =>
            index ===
            adminIndex
              ? updatedAdmin
              : item
        );


      saveNexgymAdminUsers(
        updatedUsers
      );


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


      window.dispatchEvent(
        new Event(
          'nexgym-admin-auth-update'
        )
      );


      return {

        success:
          true,

        admin:
          updatedAdmin,

        session

      };

    } catch (error) {

      console.error(
        'Error iniciando sesión NEXGYM:',
        error
      );


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


      if (!raw) {

        return null;

      }


      const session =
        JSON.parse(
          raw
        );


      if (
        !session?.id
      ) {

        logoutNexgymAdmin();

        return null;

      }


      const users =
        getNexgymAdminUsers();


      const admin =
        users.find(
          user =>
            user.id ===
            session.id
        );


      if (
        !admin ||
        admin.status !==
        'active'
      ) {

        logoutNexgymAdmin();

        return null;

      }


      return {

        ...session,

        name:
          admin.name,

        email:
          admin.email,

        role:
          'super_admin'

      };

    } catch (error) {

      console.error(
        'Error leyendo sesión NEXGYM:',
        error
      );


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

    localStorage.removeItem(
      NEXGYM_ADMIN_AUTH_KEY
    );


    localStorage.removeItem(
      NEXGYM_ADMIN_SESSION_KEY
    );


    window.dispatchEvent(
      new Event(
        'nexgym-admin-auth-update'
      )
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


      if (!session) {

        return {

          success:
            false,

          message:
            'No existe una sesión administrativa.'

        };

      }


      const current =
        String(
          currentPassword || ''
        );


      const next =
        String(
          newPassword || ''
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


      const users =
        getNexgymAdminUsers();


      const index =
        users.findIndex(
          user =>
            user.id ===
            session.id
        );


      if (
        index ===
        -1
      ) {

        return {

          success:
            false,

          message:
            'No se encontró el administrador.'

        };

      }


      const admin =
        users[
          index
        ];


      const currentHash =
        await hashValue(
          current
        );


      if (
        currentHash !==
        admin.passwordHash
      ) {

        return {

          success:
            false,

          message:
            'La contraseña actual es incorrecta.'

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
            'La nueva contraseña debe ser diferente.'

        };

      }


      const newHash =
        await hashValue(
          next
        );


      const now =
        new Date()
          .toISOString();


      const updated = {

        ...admin,

        passwordHash:
          newHash,

        passwordUpdatedAt:
          now,

        updatedAt:
          now

      };


      users[
        index
      ] =
        updated;


      saveNexgymAdminUsers(
        users
      );


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
          'No se pudo cambiar la contraseña.'

      };

    }

  };


// ======================================================
// DATOS DE DESARROLLO
// ======================================================

export const getDefaultNexgymAdminCredentials =
  () => {

    return {

      email:
        DEFAULT_ADMIN_EMAIL,

      password:
        DEFAULT_ADMIN_PASSWORD

    };

  };