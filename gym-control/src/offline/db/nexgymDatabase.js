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
// VERSIÓN 1
// ======================================================
//
// NO ELIMINAR.
// Ya existe en instalaciones anteriores.
//
// ======================================================

db.version(
  1
).stores({

  gyms:
    'id, gymCode, name, updatedAt, syncStatus',

  gymUsers:
    '[gymId+id], gymId, id, email, role, status, updatedAt, syncStatus, [gymId+email]',

  members:
    '[gymId+id], gymId, id, status, firstName, lastName, phone, updatedAt, syncStatus',

  memberSubscriptions:
    '[gymId+id], gymId, id, memberId, status, startDate, endDate, updatedAt, syncStatus, [gymId+memberId]',

  memberPayments:
    '[gymId+id], gymId, id, memberId, date, status, updatedAt, syncStatus, [gymId+memberId]',

  attendance:
    '[gymId+id], gymId, id, memberId, type, date, createdAt, syncStatus, [gymId+memberId]',

  accessLogs:
    '[gymId+id], gymId, id, memberId, method, status, createdAt, syncStatus, [gymId+memberId]',

  visits:
    '[gymId+id], gymId, id, status, createdAt, updatedAt, syncStatus',

  products:
    '[gymId+id], gymId, id, name, sku, status, updatedAt, syncStatus',

  sales:
    '[gymId+id], gymId, id, date, status, createdAt, updatedAt, syncStatus',

  cashMovements:
    '[gymId+id], gymId, id, type, date, createdAt, syncStatus',

  blacklist:
    '[gymId+id], gymId, id, memberId, createdAt, syncStatus, [gymId+memberId]',

  gymSettings:
    'gymId, updatedAt, syncStatus',

  memberAccess:
    '[gymId+id], gymId, id, memberId, type, updatedAt, syncStatus, [gymId+memberId]',

  biometrics:
    '[gymId+id], gymId, id, memberId, updatedAt, syncStatus, [gymId+memberId]',

  supportTickets:
    '[gymId+id], gymId, id, status, priority, createdAt, updatedAt, syncStatus',

  syncQueue:
    'id, gymId, entity, entityId, operation, status, createdAt, updatedAt, [gymId+status]',

  metadata:
    'key, updatedAt'

});


// ======================================================
// VERSIÓN 2
// ======================================================
//
// ASISTENCIA DE VISITAS.
//
// ======================================================

db.version(
  2
).stores({

  gyms:
    'id, gymCode, name, updatedAt, syncStatus',

  gymUsers:
    '[gymId+id], gymId, id, email, role, status, updatedAt, syncStatus, [gymId+email]',

  members:
    '[gymId+id], gymId, id, status, firstName, lastName, phone, updatedAt, syncStatus',

  memberSubscriptions:
    '[gymId+id], gymId, id, memberId, status, startDate, endDate, updatedAt, syncStatus, [gymId+memberId]',

  memberPayments:
    '[gymId+id], gymId, id, memberId, date, status, updatedAt, syncStatus, [gymId+memberId]',

  attendance:
    '[gymId+id], gymId, id, memberId, type, date, createdAt, syncStatus, [gymId+memberId]',

  accessLogs:
    '[gymId+id], gymId, id, memberId, method, status, createdAt, syncStatus, [gymId+memberId]',

  visits:
    '[gymId+id], gymId, id, status, createdAt, updatedAt, syncStatus',

  visitAttendance:
    '[gymId+id], gymId, id, visitId, visitorId, status, entryAt, exitAt, createdAt, updatedAt, syncStatus, [gymId+visitId]',

  products:
    '[gymId+id], gymId, id, name, sku, status, updatedAt, syncStatus',

  sales:
    '[gymId+id], gymId, id, date, status, createdAt, updatedAt, syncStatus',

  cashMovements:
    '[gymId+id], gymId, id, type, date, createdAt, syncStatus',

  blacklist:
    '[gymId+id], gymId, id, memberId, createdAt, syncStatus, [gymId+memberId]',

  gymSettings:
    'gymId, updatedAt, syncStatus',

  memberAccess:
    '[gymId+id], gymId, id, memberId, type, updatedAt, syncStatus, [gymId+memberId]',

  biometrics:
    '[gymId+id], gymId, id, memberId, updatedAt, syncStatus, [gymId+memberId]',

  supportTickets:
    '[gymId+id], gymId, id, status, priority, createdAt, updatedAt, syncStatus',

  syncQueue:
    'id, gymId, entity, entityId, operation, status, createdAt, updatedAt, [gymId+status]',

  metadata:
    'key, updatedAt'

});


// ======================================================
// VERSIÓN 3
// ======================================================
//
// PRODUCTOS + INVENTARIO.
//
// ======================================================

db.version(
  3
).stores({

  gyms:
    'id, gymCode, name, updatedAt, syncStatus',

  gymUsers:
    '[gymId+id], gymId, id, email, role, status, updatedAt, syncStatus, [gymId+email]',

  members:
    '[gymId+id], gymId, id, status, firstName, lastName, phone, updatedAt, syncStatus',

  memberSubscriptions:
    '[gymId+id], gymId, id, memberId, status, startDate, endDate, updatedAt, syncStatus, [gymId+memberId]',

  memberPayments:
    '[gymId+id], gymId, id, memberId, date, status, updatedAt, syncStatus, [gymId+memberId]',

  attendance:
    '[gymId+id], gymId, id, memberId, type, date, createdAt, syncStatus, [gymId+memberId]',

  accessLogs:
    '[gymId+id], gymId, id, memberId, method, status, createdAt, syncStatus, [gymId+memberId]',

  visits:
    '[gymId+id], gymId, id, status, createdAt, updatedAt, syncStatus',

  visitAttendance:
    '[gymId+id], gymId, id, visitId, visitorId, status, entryAt, exitAt, createdAt, updatedAt, syncStatus, [gymId+visitId]',

  products:
    '[gymId+id], gymId, id, name, sku, barcode, status, updatedAt, syncStatus',

  inventoryMovements:
    '[gymId+id], gymId, id, productId, type, referenceId, createdAt, updatedAt, syncStatus, [gymId+productId]',

  sales:
    '[gymId+id], gymId, id, date, status, createdAt, updatedAt, syncStatus',

  cashMovements:
    '[gymId+id], gymId, id, type, date, createdAt, syncStatus',

  blacklist:
    '[gymId+id], gymId, id, memberId, createdAt, syncStatus, [gymId+memberId]',

  gymSettings:
    'gymId, updatedAt, syncStatus',

  memberAccess:
    '[gymId+id], gymId, id, memberId, type, updatedAt, syncStatus, [gymId+memberId]',

  biometrics:
    '[gymId+id], gymId, id, memberId, updatedAt, syncStatus, [gymId+memberId]',

  supportTickets:
    '[gymId+id], gymId, id, status, priority, createdAt, updatedAt, syncStatus',

  syncQueue:
    'id, gymId, entity, entityId, operation, status, createdAt, updatedAt, [gymId+status]',

  metadata:
    'key, updatedAt'

});


// ======================================================
// VERSIÓN 4
// ======================================================
//
// NUEVO:
//
// cashShifts
//
// También añadimos índices útiles para:
// - ventas por turno
// - movimientos por turno
//
// NO SE CAMBIA NINGUNA PRIMARY KEY.
//
// ======================================================

db.version(
  4
).stores({

  gyms:
    'id, gymCode, name, updatedAt, syncStatus',

  gymUsers:
    '[gymId+id], gymId, id, email, role, status, updatedAt, syncStatus, [gymId+email]',

  members:
    '[gymId+id], gymId, id, status, firstName, lastName, phone, updatedAt, syncStatus',

  memberSubscriptions:
    '[gymId+id], gymId, id, memberId, status, startDate, endDate, updatedAt, syncStatus, [gymId+memberId]',

  memberPayments:
    '[gymId+id], gymId, id, memberId, date, status, updatedAt, syncStatus, [gymId+memberId]',

  attendance:
    '[gymId+id], gymId, id, memberId, type, date, createdAt, syncStatus, [gymId+memberId]',

  accessLogs:
    '[gymId+id], gymId, id, memberId, method, status, createdAt, syncStatus, [gymId+memberId]',

  visits:
    '[gymId+id], gymId, id, status, createdAt, updatedAt, syncStatus',

  visitAttendance:
    '[gymId+id], gymId, id, visitId, visitorId, status, entryAt, exitAt, createdAt, updatedAt, syncStatus, [gymId+visitId]',

  products:
    '[gymId+id], gymId, id, name, sku, barcode, status, updatedAt, syncStatus',

  inventoryMovements:
    '[gymId+id], gymId, id, productId, type, referenceId, createdAt, updatedAt, syncStatus, [gymId+productId]',

  sales:
    '[gymId+id], gymId, id, cashShiftId, status, paymentMethod, createdAt, updatedAt, syncStatus, [gymId+cashShiftId]',

  cashShifts:
    '[gymId+id], gymId, id, status, openedAt, closedAt, updatedAt, syncStatus, [gymId+status]',

  cashMovements:
    '[gymId+id], gymId, id, shiftId, type, createdAt, updatedAt, syncStatus, [gymId+shiftId]',

  blacklist:
    '[gymId+id], gymId, id, memberId, createdAt, syncStatus, [gymId+memberId]',

  gymSettings:
    'gymId, updatedAt, syncStatus',

  memberAccess:
    '[gymId+id], gymId, id, memberId, type, updatedAt, syncStatus, [gymId+memberId]',

  biometrics:
    '[gymId+id], gymId, id, memberId, updatedAt, syncStatus, [gymId+memberId]',

  supportTickets:
    '[gymId+id], gymId, id, status, priority, createdAt, updatedAt, syncStatus',

  syncQueue:
    'id, gymId, entity, entityId, operation, status, createdAt, updatedAt, [gymId+status]',

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


      await db.members.put(
        memberA
      );


      await db.members.put(
        memberB
      );


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