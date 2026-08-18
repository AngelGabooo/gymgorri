// src/utils/resetLocalOperationalData.js

// ======================================================
// NEXGYM - LIMPIEZA LOCAL DE DATOS DE PRUEBA
// ======================================================
//
// ÚSALO UNA SOLA VEZ para comenzar desde cero.
//
// NO borra:
// - Supabase Auth;
// - URL/keys;
// - sesión actual del gimnasio;
// - configuración visual.
//
// SÍ borra:
// - miembros;
// - pagos;
// - suscripciones;
// - asistencias;
// - accesos;
// - productos;
// - ventas;
// - inventario;
// - caja;
// - visitas;
// - lista negra;
// - credenciales;
// - cola offline / IndexedDB.
//
// Después de ejecutar:
//   window.location.reload()
//
// ======================================================

const LOCAL_KEYS_TO_REMOVE = [
  'gym_control_members',
  'gym_control_member_counter',
  'gym_control_attendance',
  'gym_control_payments',
  'gym_control_subscription_history',
  'gym_control_products',
  'gym_control_inventory_movements',
  'gym_control_sales',
  'gym_control_cash_shifts',
  'gym_control_cash_movements',
  'gym_control_visits',
  'gym_control_visit_attendance',
  'gym_control_access_logs',
  'gym_control_blacklist',
  'gym_control_credential_history',
  'gym_control_admin_security_audit'
];

const INDEXED_DB_NAME =
  'nexgym_local_db';


// ======================================================
// BORRAR INDEXEDDB
// ======================================================

const deleteIndexedDatabase =
  () => {

    return new Promise(
      (
        resolve,
        reject
      ) => {

        const request =
          indexedDB.deleteDatabase(
            INDEXED_DB_NAME
          );


        request.onsuccess =
          () => {

            resolve(
              true
            );

          };


        request.onerror =
          () => {

            reject(
              request.error ||
              new Error(
                'No se pudo borrar IndexedDB.'
              )
            );

          };


        request.onblocked =
          () => {

            console.warn(
              '⚠️ IndexedDB está bloqueada por otra pestaña. Cierra otras pestañas de NEXGYM y vuelve a intentar.'
            );

          };

      }
    );

  };


// ======================================================
// LIMPIAR
// ======================================================

export const resetLocalOperationalData =
  async ({
    reload = true
  } = {}) => {

    console.warn(
      '🧹 Iniciando limpieza local de datos operativos NEXGYM...'
    );


    LOCAL_KEYS_TO_REMOVE.forEach(
      key => {

        localStorage.removeItem(
          key
        );

      }
    );


    // Algunas versiones anteriores usaron nombres
    // alternativos. Eliminamos únicamente llaves
    // claramente operativas.
    Object.keys(
      localStorage
    )
      .filter(
        key => {

          const lower =
            String(
              key
            ).toLowerCase();


          return (
            lower.startsWith(
              'gym_control_'
            ) &&
            (
              lower.includes(
                'attendance'
              ) ||
              lower.includes(
                'payment'
              ) ||
              lower.includes(
                'subscription_history'
              ) ||
              lower.includes(
                'product'
              ) ||
              lower.includes(
                'inventory'
              ) ||
              lower.includes(
                'sale'
              ) ||
              lower.includes(
                'cash_shift'
              ) ||
              lower.includes(
                'cash_movement'
              ) ||
              lower.includes(
                'visit'
              ) ||
              lower.includes(
                'access_log'
              ) ||
              lower.includes(
                'blacklist'
              ) ||
              lower.includes(
                'credential_history'
              ) ||
              lower.includes(
                'security_audit'
              ) ||
              lower ===
                'gym_control_members' ||
              lower ===
                'gym_control_member_counter'
            )
          );

        }
      )
      .forEach(
        key => {

          localStorage.removeItem(
            key
          );

        }
      );


    await deleteIndexedDatabase();


    console.log(
      '✅ Datos locales operativos eliminados.'
    );


    if (
      reload
    ) {

      window.location.reload();

    }


    return {
      success:
        true
    };

  };


// ======================================================
// SOLO PARA DESARROLLO / LIMPIEZA MANUAL
// ======================================================
//
// Después de importar este archivo una vez, puedes usar:
// await window.resetNexgymLocalOperationalData();
//
// ======================================================

if (
  typeof window !==
  'undefined'
) {

  window.resetNexgymLocalOperationalData =
    resetLocalOperationalData;

}


export default resetLocalOperationalData;
