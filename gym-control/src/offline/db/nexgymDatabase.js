// src/offline/db/nexgymDatabase.js

import Dexie from 'dexie';


// ======================================================
// NOMBRE
// ======================================================

export const NEXGYM_LOCAL_DB_NAME =
  'nexgym_local_db';


// ======================================================
// BASE
// ======================================================

export const db =
  new Dexie(
    NEXGYM_LOCAL_DB_NAME
  );


// ======================================================
// ESQUEMA
// ======================================================
//
// IMPORTANTE:
//
// La base anterior era únicamente de pruebas.
//
// Ahora la creamos directamente con claves adecuadas
// para arquitectura multi-gimnasio.
//
// Las tablas que pertenecen a un gimnasio utilizan:
//
// [gymId+id]
//
// como primary key.
//
// Esto permite:
//
// gym_a + GYM-00001
// gym_b + GYM-00001
//
// sin conflictos.
//
// ======================================================

db.version(
  1
).stores({

  // ====================================================
  // GIMNASIOS
  // ====================================================

  gyms:
    'id, gymCode, name, updatedAt, syncStatus',


  // ====================================================
  // USUARIOS
  // ====================================================

  gymUsers:
    '[gymId+id], gymId, id, email, role, status, updatedAt, syncStatus, [gymId+email]',


  // ====================================================
  // MIEMBROS
  // ====================================================

  members:
    '[gymId+id], gymId, id, status, firstName, lastName, phone, updatedAt, syncStatus',


  // ====================================================
  // SUSCRIPCIONES
  // ====================================================

  memberSubscriptions:
    '[gymId+id], gymId, id, memberId, status, startDate, endDate, updatedAt, syncStatus, [gymId+memberId]',


  // ====================================================
  // PAGOS
  // ====================================================

  memberPayments:
    '[gymId+id], gymId, id, memberId, date, status, updatedAt, syncStatus, [gymId+memberId]',


  // ====================================================
  // ASISTENCIAS
  // ====================================================

  attendance:
    '[gymId+id], gymId, id, memberId, type, date, createdAt, syncStatus, [gymId+memberId]',


  // ====================================================
  // ACCESOS
  // ====================================================

  accessLogs:
    '[gymId+id], gymId, id, memberId, method, status, createdAt, syncStatus, [gymId+memberId]',


  // ====================================================
  // VISITAS
  // ====================================================

  visits:
    '[gymId+id], gymId, id, status, createdAt, updatedAt, syncStatus',


  // ====================================================
  // PRODUCTOS
  // ====================================================

  products:
    '[gymId+id], gymId, id, name, sku, status, updatedAt, syncStatus',


  // ====================================================
  // VENTAS
  // ====================================================

  sales:
    '[gymId+id], gymId, id, date, status, createdAt, updatedAt, syncStatus',


  // ====================================================
  // CAJA
  // ====================================================

  cashMovements:
    '[gymId+id], gymId, id, type, date, createdAt, syncStatus',


  // ====================================================
  // LISTA NEGRA
  // ====================================================

  blacklist:
    '[gymId+id], gymId, id, memberId, createdAt, syncStatus, [gymId+memberId]',


  // ====================================================
  // CONFIGURACIÓN
  // ====================================================

  gymSettings:
    'gymId, updatedAt, syncStatus',


  // ====================================================
  // ACCESOS DE MIEMBROS
  // ====================================================

  memberAccess:
    '[gymId+id], gymId, id, memberId, type, updatedAt, syncStatus, [gymId+memberId]',


  // ====================================================
  // BIOMETRÍA
  // ====================================================

  biometrics:
    '[gymId+id], gymId, id, memberId, updatedAt, syncStatus, [gymId+memberId]',


  // ====================================================
  // SOPORTE
  // ====================================================

  supportTickets:
    '[gymId+id], gymId, id, status, priority, createdAt, updatedAt, syncStatus',


  // ====================================================
  // COLA
  // ====================================================

  syncQueue:
    'id, gymId, entity, entityId, operation, status, createdAt, updatedAt, [gymId+status]',


  // ====================================================
  // METADATA
  // ====================================================

  metadata:
    'key, updatedAt'

});


// ======================================================
// ABRIR
// ======================================================

export const openNexgymDatabase =
  async () => {

    try {

      if (
        db.isOpen()
      ) {

        return {

          success:
            true,

          database:
            db,

          message:
            'La base local ya está abierta.'

        };

      }


      await db.open();


      console.log(
        '✅ Base local NEXGYM abierta:',
        NEXGYM_LOCAL_DB_NAME
      );


      console.log(
        '📦 Versión IndexedDB:',
        db.verno
      );


      return {

        success:
          true,

        database:
          db,

        message:
          'Base local abierta correctamente.'

      };

    } catch (error) {

      console.error(
        '❌ Error abriendo la base local NEXGYM:',
        error
      );


      return {

        success:
          false,

        database:
          null,

        message:
          'No se pudo abrir la base local.',

        error

      };

    }

  };


// ======================================================
// CERRAR
// ======================================================

export const closeNexgymDatabase =
  () => {

    try {

      if (
        db.isOpen()
      ) {

        db.close();

      }


      return true;

    } catch (error) {

      console.error(
        'Error cerrando IndexedDB:',
        error
      );


      return false;

    }

  };


// ======================================================
// ESTADO
// ======================================================

export const getNexgymDatabaseStatus =
  () => {

    return {

      name:
        NEXGYM_LOCAL_DB_NAME,

      version:
        db.verno,

      isOpen:
        db.isOpen(),

      tables:
        db.tables.map(
          table =>
            table.name
        )

    };

  };


// ======================================================
// ESQUEMA
// ======================================================

export const getNexgymDatabaseSchema =
  () => {

    return db.tables.map(
      table => ({

        name:
          table.name,

        primaryKey:
          table.schema
            ?.primKey
            ?.name ||
          null,

        compoundPrimaryKey:
          Boolean(
            table.schema
              ?.primKey
              ?.compound
          ),

        indexes:
          (
            table.schema
              ?.indexes ||
            []
          ).map(
            index =>
              index.name
          )

      })
    );

  };


// ======================================================
// CONTAR
// ======================================================

export const getNexgymDatabaseCounts =
  async () => {

    try {

      await openNexgymDatabase();


      const counts = {};


      for (
        const table of
        db.tables
      ) {

        counts[
          table.name
        ] =
          await table.count();

      }


      return {

        success:
          true,

        counts

      };

    } catch (error) {

      console.error(
        'Error contando registros IndexedDB:',
        error
      );


      return {

        success:
          false,

        counts:
          {},

        error

      };

    }

  };


// ======================================================
// DISPONIBILIDAD
// ======================================================

export const isIndexedDBAvailable =
  () => {

    return Boolean(
      typeof window !==
        'undefined' &&
      window.indexedDB
    );

  };


// ======================================================
// PRUEBA BÁSICA
// ======================================================

export const testNexgymDatabase =
  async () => {

    try {

      if (
        !isIndexedDBAvailable()
      ) {

        return {

          success:
            false,

          message:
            'IndexedDB no está disponible.'

        };

      }


      await openNexgymDatabase();


      const testKey =
        'nexgym_database_test';


      const now =
        new Date()
          .toISOString();


      // ==================================================
      // ESCRIBIR
      // ==================================================

      await db.metadata.put({

        key:
          testKey,

        value:
          'ok',

        createdAt:
          now,

        updatedAt:
          now

      });


      // ==================================================
      // LEER
      // ==================================================

      const record =
        await db.metadata.get(
          testKey
        );


      if (
        record?.value !==
        'ok'
      ) {

        throw new Error(
          'IndexedDB no devolvió el valor esperado.'
        );

      }


      // ==================================================
      // BORRAR
      // ==================================================

      await db.metadata.delete(
        testKey
      );


      console.log(
        '✅ IndexedDB + Dexie funcionando correctamente.'
      );


      return {

        success:
          true,

        message:
          'IndexedDB funciona correctamente.'

      };

    } catch (error) {

      console.error(
        '❌ Prueba IndexedDB fallida:',
        error
      );


      return {

        success:
          false,

        message:
          'La prueba de IndexedDB falló.',

        error

      };

    }

  };


// ======================================================
// PRUEBA MULTI-GYM
// ======================================================

export const testCompoundMemberKeys =
  async () => {

    try {

      await openNexgymDatabase();


      const now =
        new Date()
          .toISOString();


      const memberA = {

        gymId:
          '__nexgym_test_a__',

        id:
          'GYM-00001',

        firstName:
          'Miembro A',

        lastName:
          'Prueba',

        status:
          'active',

        syncStatus:
          'test',

        createdAt:
          now,

        updatedAt:
          now

      };


      const memberB = {

        gymId:
          '__nexgym_test_b__',

        id:
          'GYM-00001',

        firstName:
          'Miembro B',

        lastName:
          'Prueba',

        status:
          'active',

        syncStatus:
          'test',

        createdAt:
          now,

        updatedAt:
          now

      };


      // ==================================================
      // GUARDAR
      // ==================================================

      await db.members.put(
        memberA
      );


      await db.members.put(
        memberB
      );


      // ==================================================
      // LEER
      // ==================================================

      const resultA =
        await db.members.get([
          memberA.gymId,
          memberA.id
        ]);


      const resultB =
        await db.members.get([
          memberB.gymId,
          memberB.id
        ]);


      if (
        !resultA ||
        !resultB
      ) {

        throw new Error(
          'No se pudieron guardar IDs repetidos en gimnasios diferentes.'
        );

      }


      // ==================================================
      // LIMPIAR
      // ==================================================

      await db.members.delete([
        memberA.gymId,
        memberA.id
      ]);


      await db.members.delete([
        memberB.gymId,
        memberB.id
      ]);


      console.log(
        '✅ Multi-gimnasio: claves compuestas funcionando.'
      );


      return {

        success:
          true

      };

    } catch (error) {

      console.error(
        '❌ Error probando claves multi-gym:',
        error
      );


      return {

        success:
          false,

        error

      };

    }

  };


// ======================================================
// EXPORT
// ======================================================

export default db;