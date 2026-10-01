// src/offline/sync/supabaseRemoteHandlers.js

import {
  supabase
} from '../../lib/supabaseClient.js';

import db, {
  openNexgymDatabase
} from '../db/nexgymDatabase.js';

import {
  registerSyncHandler
} from './syncManager.js';


// ======================================================
// ENTIDADES
// ======================================================

export const SUPABASE_SYNC_ENTITIES = [
  'member',
  'payment',
  'subscription_history',
  'attendance',
  'access_log',
  'product',
  'inventory_movement',
  'sale',
  'cash_shift',
  'cash_movement'
];


// ======================================================
// HELPERS GENERALES
// ======================================================

const asText = (
  value,
  fallback = ''
) => {

  if (
    value === null ||
    value === undefined
  ) {

    return fallback;

  }


  return String(
    value
  ).trim();

};


const asNullableText = (
  value
) => {

  const text =
    asText(
      value
    );


  return text
    ? text
    : null;

};


const asNumber = (
  value,
  fallback = 0
) => {

  const number =
    Number(
      value
    );


  return Number.isFinite(
    number
  )
    ? number
    : fallback;

};


const asInteger = (
  value,
  fallback = 0
) => {

  const number =
    Number(
      value
    );


  return Number.isFinite(
    number
  )
    ? Math.trunc(
        number
      )
    : fallback;

};


const asBoolean = (
  value,
  fallback = false
) => {

  if (
    value === true ||
    value === false
  ) {

    return value;

  }


  if (
    value === 'true' ||
    value === 1 ||
    value === '1'
  ) {

    return true;

  }


  if (
    value === 'false' ||
    value === 0 ||
    value === '0'
  ) {

    return false;

  }


  return fallback;

};


const asObject = (
  value,
  fallback = {}
) => {

  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(
      value
    )
  ) {

    return value;

  }


  return fallback;

};


const asArray = (
  value
) => {

  return Array.isArray(
    value
  )
    ? value
    : [];

};


const firstValue = (
  ...values
) => {

  for (
    const value of
    values
  ) {

    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {

      return value;

    }

  }


  return null;

};


const toIso = (
  value
) => {

  if (!value) {

    return null;

  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return null;

  }


  return date.toISOString();

};


const toDateOnly = (
  value
) => {

  if (!value) {

    return null;

  }


  const text =
    String(
      value
    ).trim();


  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      text
    )
  ) {

    return text;

  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return null;

  }


  return date
    .toISOString()
    .slice(
      0,
      10
    );

};


const isUuid = (
  value
) => {

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(
      asText(
        value
      )
    );

};


const normalizeMetadata = (
  item,
  extra = {}
) => {

  const payload =
    asObject(
      item?.payload
    );


  const payloadMetadata =
    asObject(
      payload.metadata
    );


  const queueMetadata =
    asObject(
      item?.metadata
    );


  return {

    ...payloadMetadata,

    ...queueMetadata,

    ...extra,

    localId:
      asText(
        item?.entityId ||
        payload.id
      ),

    syncEntity:
      asText(
        item?.entity
      ),

    syncOperation:
      asText(
        item?.operation
      )

  };

};


// ======================================================
// ERROR SUPABASE
// ======================================================

const throwSupabaseError = (
  error,
  context
) => {

  if (!error) {

    return;

  }


  console.error(
    `❌ Supabase ${context}:`,
    error
  );


  throw new Error(
    error.message ||
    `Error de Supabase en ${context}.`
  );

};


// ======================================================
// VALIDAR SESIÓN Y GIMNASIO
// ======================================================
//
// Además de RLS, validamos que el usuario autenticado
// pertenezca al mismo gymId de la operación.
//
// ======================================================

const validateAuthenticatedGym =
  async (
    gymId
  ) => {

    const cleanGymId =
      asText(
        gymId
      );


    if (!cleanGymId) {

      throw new Error(
        'La operación no contiene gymId.'
      );

    }


    const {
      data:
        sessionData,

      error:
        sessionError
    } =
      await supabase.auth
        .getSession();


    throwSupabaseError(
      sessionError,
      'obteniendo sesión'
    );


    const user =
      sessionData
        ?.session
        ?.user ||
      null;


    if (!user?.id) {

      throw new Error(
        'No existe una sesión de Supabase activa.'
      );

    }


    const {
      data:
        gymUser,

      error:
        gymUserError
    } =
      await supabase

        .from(
          'gym_users'
        )

        .select(
          'gym_id,status'
        )

        .eq(
          'user_id',
          user.id
        )

        .maybeSingle();


    throwSupabaseError(
      gymUserError,
      'validando usuario del gimnasio'
    );


    if (!gymUser) {

      throw new Error(
        'El usuario autenticado no está vinculado a un gimnasio.'
      );

    }


    if (
      gymUser.status !==
      'active'
    ) {

      throw new Error(
        'El usuario del gimnasio no está activo.'
      );

    }


    if (
      String(
        gymUser.gym_id
      ) !==
      cleanGymId
    ) {

      throw new Error(
        'La operación pertenece a otro gimnasio y fue bloqueada.'
      );

    }


    return {

      userId:
        user.id,

      gymId:
        cleanGymId

    };

  };


// ======================================================
// BUSCAR REGISTRO REMOTO POR LOCAL_ID
// ======================================================

const getRemoteByLocalId =
  async (
    table,
    gymId,
    localId,
    select = '*'
  ) => {

    const cleanLocalId =
      asText(
        localId
      );


    if (!cleanLocalId) {

      return null;

    }


    const {
      data,
      error
    } =
      await supabase

        .from(
          table
        )

        .select(
          select
        )

        .eq(
          'gym_id',
          gymId
        )

        .eq(
          'local_id',
          cleanLocalId
        )

        .maybeSingle();


    throwSupabaseError(
      error,
      `buscando ${table}`
    );


    return data ||
      null;

  };


// ======================================================
// ACCESS_LOG NO TIENE LOCAL_ID
// ======================================================

const getRemoteAccessLog =
  async (
    gymId,
    localId
  ) => {

    const {
      data,
      error
    } =
      await supabase

        .from(
          'access_logs'
        )

        .select(
          '*'
        )

        .eq(
          'gym_id',
          gymId
        )

        .contains(
          'metadata',
          {
            localId:
              asText(
                localId
              )
          }
        )

        .limit(
          1
        );


    throwSupabaseError(
      error,
      'buscando access_log'
    );


    return Array.isArray(
      data
    ) &&
    data.length >
      0
      ? data[0]
      : null;

  };


// ======================================================
// CREAR / ACTUALIZAR POR LOCAL_ID
// ======================================================

const saveRemoteByLocalId =
  async (
    table,
    gymId,
    localId,
    payload
  ) => {

    const existing =
      await getRemoteByLocalId(
        table,
        gymId,
        localId,
        'id'
      );


    if (
      existing?.id
    ) {

      const {
        data,
        error
      } =
        await supabase

          .from(
            table
          )

          .update(
            payload
          )

          .eq(
            'id',
            existing.id
          )

          .eq(
            'gym_id',
            gymId
          )

          .select(
            '*'
          )

          .single();


      throwSupabaseError(
        error,
        `actualizando ${table}`
      );


      return data;

    }


    const {
      data,
      error
    } =
      await supabase

        .from(
          table
        )

        .insert(
          payload
        )

        .select(
          '*'
        )

        .single();


    throwSupabaseError(
      error,
      `insertando ${table}`
    );


    return data;

  };


// ======================================================
// ELIMINAR POR LOCAL_ID
// ======================================================

const deleteRemoteByLocalId =
  async (
    table,
    gymId,
    localId
  ) => {

    const existing =
      await getRemoteByLocalId(
        table,
        gymId,
        localId,
        'id'
      );


    if (
      !existing?.id
    ) {

      return {
        alreadyDeleted:
          true
      };

    }


    const {
      error
    } =
      await supabase

        .from(
          table
        )

        .delete()

        .eq(
          'id',
          existing.id
        )

        .eq(
          'gym_id',
          gymId
        );


    throwSupabaseError(
      error,
      `eliminando ${table}`
    );


    return {
      deleted:
        true,

      id:
        existing.id
    };

  };


// ======================================================
// RESOLVER UUID DE MIEMBRO
// ======================================================

const resolveMemberUuid =
  async (
    gymId,
    memberLocalId,
    {
      required = false
    } = {}
  ) => {

    const cleanLocalId =
      asText(
        memberLocalId
      );


    if (!cleanLocalId) {

      if (
        required
      ) {

        throw new Error(
          'La operación necesita memberId local.'
        );

      }


      return null;

    }


    const member =
      await getRemoteByLocalId(
        'members',
        gymId,
        cleanLocalId,
        'id,local_id'
      );


    if (
      !member?.id &&
      required
    ) {

      throw new Error(
        `No existe el miembro remoto ${cleanLocalId}. Sincroniza primero el miembro.`
      );

    }


    return member?.id ||
      null;

  };


// ======================================================
// RESOLVER UUID DE PRODUCTO
// ======================================================

const resolveProductUuid =
  async (
    gymId,
    productLocalId,
    {
      required = false
    } = {}
  ) => {

    const cleanLocalId =
      asText(
        productLocalId
      );


    if (!cleanLocalId) {

      if (
        required
      ) {

        throw new Error(
          'La operación necesita productId local.'
        );

      }


      return null;

    }


    const product =
      await getRemoteByLocalId(
        'products',
        gymId,
        cleanLocalId,
        'id,local_id'
      );


    if (
      !product?.id &&
      required
    ) {

      throw new Error(
        `No existe el producto remoto ${cleanLocalId}. Sincroniza primero el producto.`
      );

    }


    return product?.id ||
      null;

  };


// ======================================================
// RESOLVER UUID DE TURNO
// ======================================================

const resolveCashShiftUuid =
  async (
    gymId,
    cashShiftLocalId,
    {
      required = false
    } = {}
  ) => {

    const cleanLocalId =
      asText(
        cashShiftLocalId
      );


    if (!cleanLocalId) {

      if (
        required
      ) {

        throw new Error(
          'La operación necesita cashShiftId local.'
        );

      }


      return null;

    }


    const shift =
      await getRemoteByLocalId(
        'cash_shifts',
        gymId,
        cleanLocalId,
        'id,local_id'
      );


    if (
      !shift?.id &&
      required
    ) {

      throw new Error(
        `No existe el turno remoto ${cleanLocalId}.`
      );

    }


    return shift?.id ||
      null;

  };


// ======================================================
// RESOLVER UUID DE SUSCRIPCIÓN
// ======================================================

const resolveSubscriptionUuid =
  async (
    gymId,
    subscriptionLocalId
  ) => {

    const cleanLocalId =
      asText(
        subscriptionLocalId
      );


    if (!cleanLocalId) {

      return null;

    }


    const subscription =
      await getRemoteByLocalId(
        'member_subscriptions',
        gymId,
        cleanLocalId,
        'id,local_id'
      );


    return subscription?.id ||
      null;

  };


// ======================================================
// MARCAR ENTIDAD LOCAL COMO SINCRONIZADA
// ======================================================

const LOCAL_TABLES = {

  member:
    'members',

  payment:
    'memberPayments',

  subscription_history:
    'memberSubscriptions',

  attendance:
    'attendance',

  access_log:
    'accessLogs',

  product:
    'products',

  inventory_movement:
    'inventoryMovements',

  sale:
    'sales',

  cash_shift:
    'cashShifts',

  cash_movement:
    'cashMovements'

};


const markLocalEntitySynced =
  async (
    item
  ) => {

    if (
      item?.operation ===
      'delete'
    ) {

      return;

    }


    const tableName =
      LOCAL_TABLES[
        item?.entity
      ];


    if (!tableName) {

      return;

    }


    await openNexgymDatabase();


    const table =
      db[
        tableName
      ];


    if (!table) {

      return;

    }


    const key = [
      String(
        item.gymId
      ),
      String(
        item.entityId
      )
    ];


    const current =
      await table.get(
        key
      );


    if (!current) {

      return;

    }


    await table.put({

      ...current,

      syncStatus:
        'synced',

      syncedAt:
        new Date()
          .toISOString()

    });

  };


// ======================================================
// MEMBER
// ======================================================

const syncMember =
  async (
    item
  ) => {

    const {
      gymId
    } =
      await validateAuthenticatedGym(
        item.gymId
      );


    if (
      item.operation ===
      'delete'
    ) {

      const result =
        await deleteRemoteByLocalId(
          'members',
          gymId,
          item.entityId
        );


      return {
        success:
          true,

        data:
          result
      };

    }


    const p =
      asObject(
        item.payload
      );


    const firstName =
      asText(
        firstValue(
          p.firstName,
          p.first_name
        )
      );


    if (!firstName) {

      throw new Error(
        `El miembro ${item.entityId} no tiene nombre.`
      );

    }


    const lastName =
      asNullableText(
        firstValue(
          p.lastName,
          p.last_name
        )
      );


    const fullName =
      asNullableText(
        firstValue(
          p.fullName,
          p.full_name,
          `${firstName} ${lastName || ''}`.trim()
        )
      );


    const payload = {

      gym_id:
        gymId,

      local_id:
        asText(
          item.entityId ||
          p.id
        ),

      first_name:
        firstName,

      last_name:
        lastName,

      full_name:
        fullName,

      phone:
        asNullableText(
          p.phone
        ),

      email:
        asNullableText(
          p.email
        ),

      birth_date:
        toDateOnly(
          firstValue(
            p.birthDate,
            p.birth_date
          )
        ),

      gender:
        asNullableText(
          p.gender
        ),

      address:
        asNullableText(
          p.address
        ),

      emergency_contact:
        firstValue(
          p.emergencyContact,
          p.emergency_contact
        ) ||
        null,

      profile_photo:
        asNullableText(
          firstValue(
            p.profilePhoto,
            p.profile_photo
          )
        ),

      registration_category:
        asNullableText(
          firstValue(
            p.registrationCategory,
            p.registration_category
          )
        ),

      status:
        asText(
          p.status,
          'active'
        ) ||
        'active',

      access_blocked:
        asBoolean(
          firstValue(
            p.accessBlocked,
            p.access_blocked
          ),
          false
        ),

      is_inside:
        asBoolean(
          firstValue(
            p.isInside,
            p.is_inside
          ),
          false
        ),

      notes:
        asNullableText(
          p.notes
        ),

      access:
        asObject(
          p.access
        ),

      subscription:
        asObject(
          p.subscription
        ),

      metadata:
        normalizeMetadata(
          item,
          {
            registrationDate:
              firstValue(
                p.registrationDate,
                p.createdAt
              )
          }
        ),

      source_created_at:
        toIso(
          firstValue(
            p.sourceCreatedAt,
            p.createdAt,
            p.registrationDate
          )
        ),

      source_updated_at:
        toIso(
          firstValue(
            p.sourceUpdatedAt,
            p.updatedAt
          )
        )

    };


    const data =
      await saveRemoteByLocalId(
        'members',
        gymId,
        payload.local_id,
        payload
      );


    await markLocalEntitySynced(
      item
    );


    console.log(
      '☁️ Miembro sincronizado con Supabase:',
      {
        localId:
          payload.local_id,

        remoteId:
          data?.id
      }
    );


    return {
      success:
        true,

      data
    };

  };


// ======================================================
// NORMALIZAR ESTADO DE PAGO PARA SUPABASE
// ======================================================
//
// La app local usa "completed".
// La tabla member_payments usa "paid" como estado pagado.
//
// ======================================================

const normalizeRemotePaymentStatus =
  value => {

    const status =
      asText(
        value
      ).toLowerCase();


    if (
      !status ||
      status ===
        'completed' ||
      status ===
        'complete' ||
      status ===
        'paid'
    ) {

      return 'paid';

    }


    if (
      status ===
        'canceled' ||
      status ===
        'cancelled'
    ) {

      return 'cancelled';

    }


    if (
      status ===
        'refunded'
    ) {

      return 'refunded';

    }


    // Para valores no reconocidos no mandamos un estado
    // arbitrario que pueda violar el CHECK de PostgreSQL.
    return 'paid';

  };


// ======================================================
// PAYMENT
// ======================================================

const syncPayment =
  async (
    item
  ) => {

    const {
      gymId
    } =
      await validateAuthenticatedGym(
        item.gymId
      );


    if (
      item.operation ===
      'delete'
    ) {

      const result =
        await deleteRemoteByLocalId(
          'member_payments',
          gymId,
          item.entityId
        );


      return {
        success:
          true,

        data:
          result
      };

    }


    const p =
      asObject(
        item.payload
      );


    const memberLocalId =
      asText(
        firstValue(
          p.memberId,
          p.memberLocalId,
          p.member_local_id
        )
      );


    const memberUuid =
      await resolveMemberUuid(
        gymId,
        memberLocalId,
        {
          required:
            Boolean(
              memberLocalId
            )
        }
      );


    const subscriptionLocalId =
      asText(
        firstValue(
          p.subscriptionId,
          p.subscriptionLocalId
        )
      );


    const subscriptionUuid =
      await resolveSubscriptionUuid(
        gymId,
        subscriptionLocalId
      );


    const payload = {

      gym_id:
        gymId,

      member_id:
        memberUuid,

      subscription_id:
        subscriptionUuid,

      local_id:
        asText(
          item.entityId ||
          p.id
        ),

      member_local_id:
        memberLocalId ||
        null,

      amount:
        asNumber(
          p.amount,
          0
        ),

      payment_method:
        asNullableText(
          firstValue(
            p.paymentMethod,
            p.method
          )
        ),

      reference:
        asNullableText(
          p.reference
        ),

      status:
        normalizeRemotePaymentStatus(
          p.status
        ),

      cash_shift_local_id:
        asNullableText(
          firstValue(
            p.cashShiftId,
            p.cashShiftLocalId,
            p.cash_shift_local_id
          )
        ),

      notes:
        asNullableText(
          p.notes
        ),

      source_created_at:
        toIso(
          firstValue(
            p.sourceCreatedAt,
            p.createdAt,
            p.date
          )
        ),

      source_updated_at:
        toIso(
          firstValue(
            p.sourceUpdatedAt,
            p.updatedAt
          )
        ),

      metadata:
        normalizeMetadata(
          item,
          {
            concept:
              p.concept ||
              null,

            type:
              p.type ||
              null,

            source:
              p.source ||
              null,

            plan:
              p.plan ||
              null,

            planLabel:
              p.planLabel ||
              null,

            days:
              p.days ??
              null,

            period:
              p.period ||
              null,

            originalAmount:
              p.originalAmount ??
              null,

            discountAmount:
              p.discountAmount ??
              null,

            promotion:
              p.promotion ||
              null,

            receivedAmount:
              p.receivedAmount ??
              null,

            change:
              p.change ??
              null,

            currency:
              p.currency ||
              null
          }
        )

    };


    const data =
      await saveRemoteByLocalId(
        'member_payments',
        gymId,
        payload.local_id,
        payload
      );


    await markLocalEntitySynced(
      item
    );


    console.log(
      '☁️ Pago sincronizado con Supabase:',
      payload.local_id
    );


    return {
      success:
        true,

      data
    };

  };


// ======================================================
// SUBSCRIPTION HISTORY -> MEMBER_SUBSCRIPTIONS
// ======================================================

const syncSubscription =
  async (
    item
  ) => {

    const {
      gymId
    } =
      await validateAuthenticatedGym(
        item.gymId
      );


    if (
      item.operation ===
      'delete'
    ) {

      const result =
        await deleteRemoteByLocalId(
          'member_subscriptions',
          gymId,
          item.entityId
        );


      return {
        success:
          true,

        data:
          result
      };

    }


    const p =
      asObject(
        item.payload
      );


    const s =
      Object.keys(
        asObject(
          p.subscription
        )
      ).length >
      0
        ? asObject(
            p.subscription
          )
        : p;


    const memberLocalId =
      asText(
        firstValue(
          p.memberId,
          p.memberLocalId,
          p.member_local_id
        )
      );


    const memberUuid =
      await resolveMemberUuid(
        gymId,
        memberLocalId,
        {
          required:
            true
        }
      );


    const baseAmount =
      asNumber(
        firstValue(
          s.originalAmount,
          s.price,
          s.amount,
          p.amount
        ),
        0
      );


    const discount =
      asNumber(
        firstValue(
          s.discountAmount,
          s.discount,
          p.discount
        ),
        0
      );


    const finalAmount =
      asNumber(
        firstValue(
          s.finalAmount,
          s.finalPrice,
          s.amount,
          s.price,
          p.finalAmount,
          baseAmount -
            discount
        ),
        0
      );


    const payload = {

      gym_id:
        gymId,

      member_id:
        memberUuid,

      local_id:
        asText(
          item.entityId ||
          p.id
        ),

      plan_name:
        asText(
          firstValue(
            s.planLabel,
            s.planName,
            s.plan,
            p.planName,
            'Suscripción'
          )
        ) ||
        'Suscripción',

      status:
        asText(
          firstValue(
            s.status,
            p.status,
            'active'
          )
        ) ||
        'active',

      start_date:
        toDateOnly(
          firstValue(
            s.startDate,
            s.start_date,
            p.startDate
          )
        ),

      end_date:
        toDateOnly(
          firstValue(
            s.endDate,
            s.end_date,
            p.endDate
          )
        ),

      amount:
        baseAmount,

      discount,

      final_amount:
        finalAmount,

      payment_method:
        asNullableText(
          firstValue(
            s.paymentMethod,
            s.method,
            p.paymentMethod
          )
        ),

      source_created_at:
        toIso(
          firstValue(
            p.sourceCreatedAt,
            p.createdAt
          )
        ),

      source_updated_at:
        toIso(
          firstValue(
            p.sourceUpdatedAt,
            p.updatedAt
          )
        ),

      metadata:
        normalizeMetadata(
          item,
          {
            memberLocalId,

            historyType:
              p.type ||
              null,

            historySource:
              p.source ||
              null,

            previousSubscription:
              p.previousSubscription ||
              null,

            paymentId:
              p.paymentId ||
              null,

            notes:
              p.notes ||
              null,

            promotion:
              s.promotion ||
              p.promotion ||
              null
          }
        )

    };


    const data =
      await saveRemoteByLocalId(
        'member_subscriptions',
        gymId,
        payload.local_id,
        payload
      );


    await markLocalEntitySynced(
      item
    );


    console.log(
      '☁️ Suscripción sincronizada con Supabase:',
      payload.local_id
    );


    return {
      success:
        true,

      data
    };

  };


// ======================================================
// ATTENDANCE
// ======================================================

const syncAttendance =
  async (
    item
  ) => {

    const {
      gymId
    } =
      await validateAuthenticatedGym(
        item.gymId
      );


    if (
      item.operation ===
      'delete'
    ) {

      const result =
        await deleteRemoteByLocalId(
          'attendance',
          gymId,
          item.entityId
        );


      return {
        success:
          true,

        data:
          result
      };

    }


    const p =
      asObject(
        item.payload
      );


    const memberLocalId =
      asText(
        firstValue(
          p.memberId,
          p.memberLocalId,
          p.member_local_id
        )
      );


    const memberUuid =
      await resolveMemberUuid(
        gymId,
        memberLocalId,
        {
          required:
            Boolean(
              memberLocalId
            )
        }
      );


    const payload = {

      gym_id:
        gymId,

      member_id:
        memberUuid,

      local_id:
        asText(
          item.entityId ||
          p.id
        ),

      member_local_id:
        memberLocalId ||
        null,

      type:
        asNullableText(
          p.type
        ),

      entry_method:
        asNullableText(
          firstValue(
            p.entryMethod,
            p.entry_method,
            p.method
          )
        ),

      exit_method:
        asNullableText(
          firstValue(
            p.exitMethod,
            p.exit_method
          )
        ),

      entry_at:
        toIso(
          firstValue(
            p.entryAt,
            p.entry_at
          )
        ),

      exit_at:
        toIso(
          firstValue(
            p.exitAt,
            p.exit_at
          )
        ),

      duration_minutes:
        asInteger(
          firstValue(
            p.durationMinutes,
            p.duration_minutes
          ),
          0
        ),

      status:
        asText(
          p.status,
          p.exitAt
            ? 'completed'
            : 'inside'
        ),

      source_created_at:
        toIso(
          firstValue(
            p.sourceCreatedAt,
            p.createdAt,
            p.entryAt
          )
        ),

      source_updated_at:
        toIso(
          firstValue(
            p.sourceUpdatedAt,
            p.updatedAt
          )
        ),

      metadata:
        normalizeMetadata(
          item,
          {
            memberName:
              p.memberName ||
              null
          }
        )

    };


    const data =
      await saveRemoteByLocalId(
        'attendance',
        gymId,
        payload.local_id,
        payload
      );


    await markLocalEntitySynced(
      item
    );


    console.log(
      '☁️ Asistencia sincronizada con Supabase:',
      payload.local_id
    );


    return {
      success:
        true,

      data
    };

  };


// ======================================================
// ACCESS LOG
// ======================================================

const syncAccessLog =
  async (
    item
  ) => {

    const {
      gymId
    } =
      await validateAuthenticatedGym(
        item.gymId
      );


    if (
      item.operation ===
      'delete'
    ) {

      const existing =
        await getRemoteAccessLog(
          gymId,
          item.entityId
        );


      if (
        existing?.id
      ) {

        const {
          error
        } =
          await supabase

            .from(
              'access_logs'
            )

            .delete()

            .eq(
              'id',
              existing.id
            )

            .eq(
              'gym_id',
              gymId
            );


        throwSupabaseError(
          error,
          'eliminando access_log'
        );

      }


      return {
        success:
          true
      };

    }


    const p =
      asObject(
        item.payload
      );


    const memberLocalId =
      asText(
        firstValue(
          p.memberId,
          p.memberLocalId,
          p.member_local_id
        )
      );


    const memberUuid =
      await resolveMemberUuid(
        gymId,
        memberLocalId
      );


    const payload = {

      gym_id:
        gymId,

      member_id:
        memberUuid,

      member_local_id:
        memberLocalId ||
        null,

      method:
        asNullableText(
          p.method
        ),

      result:
        asNullableText(
          p.result
        ),

      status:
        asNullableText(
          p.status
        ),

      reason:
        asNullableText(
          p.reason
        ),

      evidence:
        firstValue(
          p.evidence,
          null
        ),

      metadata:
        normalizeMetadata(
          item,
          {
            memberName:
              p.memberName ||
              null
          }
        ),

      source_created_at:
        toIso(
          firstValue(
            p.sourceCreatedAt,
            p.createdAt
          )
        )

    };


    const existing =
      await getRemoteAccessLog(
        gymId,
        item.entityId
      );


    let data;


    if (
      existing?.id
    ) {

      const {
        data:
          updated,

        error
      } =
        await supabase

          .from(
            'access_logs'
          )

          .update(
            payload
          )

          .eq(
            'id',
            existing.id
          )

          .eq(
            'gym_id',
            gymId
          )

          .select(
            '*'
          )

          .single();


      throwSupabaseError(
        error,
        'actualizando access_log'
      );


      data =
        updated;

    } else {

      const {
        data:
          inserted,

        error
      } =
        await supabase

          .from(
            'access_logs'
          )

          .insert(
            payload
          )

          .select(
            '*'
          )

          .single();


      throwSupabaseError(
        error,
        'insertando access_log'
      );


      data =
        inserted;

    }


    await markLocalEntitySynced(
      item
    );


    console.log(
      '☁️ Log de acceso sincronizado con Supabase:',
      item.entityId
    );


    return {
      success:
        true,

      data
    };

  };


// ======================================================
// PRODUCT
// ======================================================

const syncProduct =
  async (
    item
  ) => {

    const {
      gymId
    } =
      await validateAuthenticatedGym(
        item.gymId
      );


    if (
      item.operation ===
      'delete'
    ) {

      const result =
        await deleteRemoteByLocalId(
          'products',
          gymId,
          item.entityId
        );


      return {
        success:
          true,

        data:
          result
      };

    }


    const p =
      asObject(
        item.payload
      );


    const name =
      asText(
        p.name
      );


    if (!name) {

      throw new Error(
        `El producto ${item.entityId} no tiene nombre.`
      );

    }


    const payload = {

      gym_id:
        gymId,

      local_id:
        asText(
          item.entityId ||
          p.id
        ),

      name,

      category:
        asNullableText(
          p.category
        ),

      sku:
        asNullableText(
          p.sku
        ),

      barcode:
        asNullableText(
          p.barcode
        ),

      cost:
        asNumber(
          p.cost,
          0
        ),

      price:
        asNumber(
          p.price,
          0
        ),

      stock:
        asNumber(
          p.stock,
          0
        ),

      min_stock:
        asNumber(
          firstValue(
            p.minStock,
            p.min_stock
          ),
          0
        ),

      unit:
        asNullableText(
          p.unit
        ),

      status:
        asText(
          p.status,
          'active'
        ) ||
        'active',

      image:
        asNullableText(
          p.image
        ),

      description:
        asNullableText(
          p.description
        ),

      source_created_at:
        toIso(
          firstValue(
            p.sourceCreatedAt,
            p.createdAt
          )
        ),

      source_updated_at:
        toIso(
          firstValue(
            p.sourceUpdatedAt,
            p.updatedAt
          )
        ),

      metadata:
        normalizeMetadata(
          item
        )

    };


    const data =
      await saveRemoteByLocalId(
        'products',
        gymId,
        payload.local_id,
        payload
      );


    await markLocalEntitySynced(
      item
    );


    console.log(
      '☁️ Producto sincronizado con Supabase:',
      payload.local_id
    );


    return {
      success:
        true,

      data
    };

  };


// ======================================================
// INVENTORY MOVEMENT
// ======================================================

const syncInventoryMovement =
  async (
    item
  ) => {

    const {
      gymId
    } =
      await validateAuthenticatedGym(
        item.gymId
      );


    if (
      item.operation ===
      'delete'
    ) {

      const result =
        await deleteRemoteByLocalId(
          'inventory_movements',
          gymId,
          item.entityId
        );


      return {
        success:
          true,

        data:
          result
      };

    }


    const p =
      asObject(
        item.payload
      );


    const productLocalId =
      asText(
        firstValue(
          p.productId,
          p.productLocalId,
          p.product_local_id
        )
      );


    const productUuid =
      await resolveProductUuid(
        gymId,
        productLocalId,
        {
          required:
            true
        }
      );


    const payload = {

      gym_id:
        gymId,

      product_id:
        productUuid,

      local_id:
        asText(
          item.entityId ||
          p.id
        ),

      product_local_id:
        productLocalId,

      type:
        asText(
          p.type,
          'adjustment'
        ) ||
        'adjustment',

      quantity:
        asNumber(
          p.quantity,
          0
        ),

      previous_stock:
        asNumber(
          firstValue(
            p.previousStock,
            p.previous_stock
          ),
          0
        ),

      new_stock:
        asNumber(
          firstValue(
            p.newStock,
            p.new_stock
          ),
          0
        ),

      reason:
        asNullableText(
          p.reason
        ),

      reference_id:
        asNullableText(
          firstValue(
            p.referenceId,
            p.reference_id
          )
        ),

      actor:
        firstValue(
          p.actor,
          null
        ),

      metadata:
        normalizeMetadata(
          item
        ),

      source_created_at:
        toIso(
          firstValue(
            p.sourceCreatedAt,
            p.createdAt
          )
        )

    };


    const data =
      await saveRemoteByLocalId(
        'inventory_movements',
        gymId,
        payload.local_id,
        payload
      );


    await markLocalEntitySynced(
      item
    );


    console.log(
      '☁️ Movimiento de inventario sincronizado:',
      payload.local_id
    );


    return {
      success:
        true,

      data
    };

  };


// ======================================================
// CASH SHIFT
// ======================================================

const syncCashShift =
  async (
    item
  ) => {

    const {
      userId,
      gymId
    } =
      await validateAuthenticatedGym(
        item.gymId
      );


    if (
      item.operation ===
      'delete'
    ) {

      const result =
        await deleteRemoteByLocalId(
          'cash_shifts',
          gymId,
          item.entityId
        );


      return {
        success:
          true,

        data:
          result
      };

    }


    const p =
      asObject(
        item.payload
      );


    const employeeUserId =
      firstValue(
        p.employeeUserId,
        p.employee_user_id
      );


    const payload = {

      gym_id:
        gymId,

      local_id:
        asText(
          item.entityId ||
          p.id
        ),

      employee_user_id:
        isUuid(
          employeeUserId
        )
          ? employeeUserId
          : userId,

      employee:
        firstValue(
          p.employee,
          null
        ),

      opening_cash:
        asNumber(
          firstValue(
            p.openingCash,
            p.opening_cash
          ),
          0
        ),

      expected_cash:
        firstValue(
          p.expectedCash,
          p.expected_cash
        ) === null
          ? null
          : asNumber(
              firstValue(
                p.expectedCash,
                p.expected_cash
              ),
              0
            ),

      counted_cash:
        firstValue(
          p.countedCash,
          p.counted_cash
        ) === null
          ? null
          : asNumber(
              firstValue(
                p.countedCash,
                p.counted_cash
              ),
              0
            ),

      difference:
        firstValue(
          p.difference
        ) === null
          ? null
          : asNumber(
              p.difference,
              0
            ),

      status:
        asText(
          p.status,
          'open'
        ) ||
        'open',

      opened_at:
        toIso(
          firstValue(
            p.openedAt,
            p.opened_at,
            p.createdAt
          )
        ),

      closed_at:
        toIso(
          firstValue(
            p.closedAt,
            p.closed_at
          )
        ),

      notes:
        asNullableText(
          p.notes
        ),

      closing_notes:
        asNullableText(
          firstValue(
            p.closingNotes,
            p.closing_notes
          )
        ),

      close_snapshot:
        firstValue(
          p.closeSnapshot,
          p.close_snapshot,
          null
        ),

      source_created_at:
        toIso(
          firstValue(
            p.sourceCreatedAt,
            p.createdAt,
            p.openedAt
          )
        ),

      source_updated_at:
        toIso(
          firstValue(
            p.sourceUpdatedAt,
            p.updatedAt
          )
        )

    };


    const data =
      await saveRemoteByLocalId(
        'cash_shifts',
        gymId,
        payload.local_id,
        payload
      );


    await markLocalEntitySynced(
      item
    );


    console.log(
      '☁️ Turno de caja sincronizado:',
      payload.local_id
    );


    return {
      success:
        true,

      data
    };

  };


// ======================================================
// CASH MOVEMENT
// ======================================================

const syncCashMovement =
  async (
    item
  ) => {

    const {
      gymId
    } =
      await validateAuthenticatedGym(
        item.gymId
      );


    if (
      item.operation ===
      'delete'
    ) {

      const result =
        await deleteRemoteByLocalId(
          'cash_movements',
          gymId,
          item.entityId
        );


      return {
        success:
          true,

        data:
          result
      };

    }


    const p =
      asObject(
        item.payload
      );


    const cashShiftLocalId =
      asText(
        firstValue(
          p.shiftId,
          p.cashShiftId,
          p.cashShiftLocalId
        )
      );


    const cashShiftUuid =
      await resolveCashShiftUuid(
        gymId,
        cashShiftLocalId,
        {
          required:
            true
        }
      );


    const payload = {

      gym_id:
        gymId,

      cash_shift_id:
        cashShiftUuid,

      local_id:
        asText(
          item.entityId ||
          p.id
        ),

      type:
        asText(
          p.type,
          'expense'
        ) ||
        'expense',

      amount:
        asNumber(
          p.amount,
          0
        ),

      concept:
        asNullableText(
          p.concept
        ),

      notes:
        asNullableText(
          p.notes
        ),

      employee:
        firstValue(
          p.employee,
          p.actor,
          null
        ),

      source_created_at:
        toIso(
          firstValue(
            p.sourceCreatedAt,
            p.createdAt
          )
        ),

      metadata:
        normalizeMetadata(
          item,
          {
            cashShiftLocalId
          }
        )

    };


    const data =
      await saveRemoteByLocalId(
        'cash_movements',
        gymId,
        payload.local_id,
        payload
      );


    await markLocalEntitySynced(
      item
    );


    console.log(
      '☁️ Movimiento de caja sincronizado:',
      payload.local_id
    );


    return {
      success:
        true,

      data
    };

  };


// ======================================================
// SALE
// ======================================================

const syncSale =
  async (
    item
  ) => {

    const {
      gymId
    } =
      await validateAuthenticatedGym(
        item.gymId
      );


    if (
      item.operation ===
      'delete'
    ) {

      const result =
        await deleteRemoteByLocalId(
          'sales',
          gymId,
          item.entityId
        );


      return {
        success:
          true,

        data:
          result
      };

    }


    const p =
      asObject(
        item.payload
      );


    const cashShiftLocalId =
      asText(
        firstValue(
          p.cashShiftId,
          p.cashShiftLocalId
        )
      );


    const cashShiftUuid =
      await resolveCashShiftUuid(
        gymId,
        cashShiftLocalId
      );


    const items =
      asArray(
        p.items
      );


    const payload = {

      gym_id:
        gymId,

      cash_shift_id:
        cashShiftUuid,

      local_id:
        asText(
          item.entityId ||
          p.id
        ),

      folio:
        asNullableText(
          p.folio
        ),

      customer:
        firstValue(
          p.customer,
          null
        ),

      items,

      item_count:
        asInteger(
          firstValue(
            p.itemCount,
            p.item_count,
            items.reduce(
              (
                total,
                product
              ) =>
                total +
                asNumber(
                  product?.quantity,
                  0
                ),
              0
            )
          ),
          0
        ),

      subtotal:
        asNumber(
          p.subtotal,
          0
        ),

      discount:
        asNumber(
          p.discount,
          0
        ),

      total:
        asNumber(
          p.total,
          0
        ),

      estimated_cost:
        asNumber(
          firstValue(
            p.estimatedCost,
            p.estimated_cost
          ),
          0
        ),

      estimated_profit:
        asNumber(
          firstValue(
            p.estimatedProfit,
            p.estimated_profit
          ),
          0
        ),

      payment_method:
        asNullableText(
          p.paymentMethod
        ),

      received:
        asNumber(
          p.received,
          0
        ),

      change_amount:
        asNumber(
          firstValue(
            p.change,
            p.changeAmount,
            p.change_amount
          ),
          0
        ),

      reference:
        asNullableText(
          p.reference
        ),

      notes:
        asNullableText(
          p.notes
        ),

      status:
        asText(
          p.status,
          'completed'
        ) ||
        'completed',

      created_by:
        firstValue(
          p.createdBy,
          null
        ),

      cancelled_at:
        toIso(
          firstValue(
            p.cancelledAt,
            p.cancelled_at
          )
        ),

      cancellation_reason:
        asNullableText(
          firstValue(
            p.cancellationReason,
            p.cancellation_reason
          )
        ),

      source_created_at:
        toIso(
          firstValue(
            p.sourceCreatedAt,
            p.createdAt
          )
        ),

      source_updated_at:
        toIso(
          firstValue(
            p.sourceUpdatedAt,
            p.updatedAt
          )
        ),

      metadata:
        normalizeMetadata(
          item,
          {
            cashShiftLocalId
          }
        )

    };


    const data =
      await saveRemoteByLocalId(
        'sales',
        gymId,
        payload.local_id,
        payload
      );


    await markLocalEntitySynced(
      item
    );


    console.log(
      '☁️ Venta sincronizada con Supabase:',
      payload.local_id
    );


    return {
      success:
        true,

      data
    };

  };


// ======================================================
// PULL (DESCARGA) DESDE SUPABASE
// ======================================================
//
// Trae registros de Supabase y los escribe en IndexedDB
// con syncStatus: 'synced'.
//
// Estrategia: "remote wins" para registros synced,
// pero NO sobreescribe registros locales con cambios
// pendientes (syncStatus !== 'synced').
//
// ======================================================

const LOCAL_TABLES_FOR_PULL = {
  member: 'members',
  payment: 'memberPayments',
  subscription_history: 'memberSubscriptions',
  attendance: 'attendance',
  access_log: 'accessLogs',
  product: 'products',
  inventory_movement: 'inventoryMovements',
  cash_shift: 'cashShifts',
  cash_movement: 'cashMovements',
  sale: 'sales'
};


const REMOTE_TABLES_FOR_PULL = {
  member: 'members',
  payment: 'member_payments',
  subscription_history: 'member_subscriptions',
  attendance: 'attendance',
  access_log: 'access_logs',
  product: 'products',
  inventory_movement: 'inventory_movements',
  cash_shift: 'cash_shifts',
  cash_movement: 'cash_movements',
  sale: 'sales'
};


// ======================================================
// MAPEAR FILA REMOTA -> REGISTRO LOCAL
// ======================================================

const mapRemoteMemberToLocal = (row) => ({
  id: row.local_id,
  gymId: row.gym_id,
  firstName: row.first_name,
  lastName: row.last_name,
  fullName: row.full_name,
  phone: row.phone,
  email: row.email,
  birthDate: row.birth_date,
  gender: row.gender,
  address: row.address,
  emergencyContact: row.emergency_contact,
  profilePhoto: row.profile_photo,
  registrationCategory: row.registration_category,
  status: row.status || 'active',
  accessBlocked: row.access_blocked === true,
  isInside: row.is_inside === true,
  notes: row.notes,
  access: row.access || {},
  subscription: row.subscription || {},
  registrationDate: row.source_created_at,
  createdAt: row.source_created_at,
  updatedAt: row.source_updated_at,
  syncStatus: 'synced',
  remoteId: row.id
});


const mapRemotePaymentToLocal = (row) => ({
  id: row.local_id,
  gymId: row.gym_id,
  memberId: row.member_local_id,
  subscriptionId: row.metadata?.subscriptionLocalId || null,
  amount: Number(row.amount || 0),
  paymentMethod: row.payment_method,
  method: row.payment_method,
  reference: row.reference,
  status: row.status === 'paid' ? 'completed' : row.status,
  notes: row.notes,
  concept: row.metadata?.concept || null,
  type: row.metadata?.type || null,
  source: row.metadata?.source || null,
  plan: row.metadata?.plan || null,
  planLabel: row.metadata?.planLabel || null,
  days: row.metadata?.days ?? null,
  period: row.metadata?.period || null,
  originalAmount: row.metadata?.originalAmount ?? null,
  discountAmount: row.metadata?.discountAmount ?? null,
  promotion: row.metadata?.promotion || null,
  receivedAmount: row.metadata?.receivedAmount ?? null,
  change: row.metadata?.change ?? null,
  currency: row.metadata?.currency || null,
  cashShiftId: row.cash_shift_local_id || null,
  date: row.source_created_at,
  createdAt: row.source_created_at,
  updatedAt: row.source_updated_at,
  syncStatus: 'synced',
  remoteId: row.id
});


const mapRemoteSubscriptionToLocal = (row) => ({
  id: row.local_id,
  gymId: row.gym_id,
  memberId: row.metadata?.memberLocalId || null,
  planName: row.plan_name,
  plan: row.plan_name,
  planLabel: row.plan_name,
  status: row.status,
  startDate: row.start_date,
  endDate: row.end_date,
  originalAmount: Number(row.amount || 0),
  discountAmount: Number(row.discount || 0),
  finalAmount: Number(row.final_amount || 0),
  paymentMethod: row.payment_method,
  promotion: row.metadata?.promotion || null,
  notes: row.metadata?.notes || null,
  type: row.metadata?.historyType || null,
  source: row.metadata?.historySource || null,
  paymentId: row.metadata?.paymentId || null,
  previousSubscription: row.metadata?.previousSubscription || null,
  createdAt: row.source_created_at,
  updatedAt: row.source_updated_at,
  syncStatus: 'synced',
  remoteId: row.id
});


const mapRemoteGeneric = (entity) => (row) => ({
  id: row.local_id,
  gymId: row.gym_id,
  ...row,
  syncStatus: 'synced',
  remoteId: row.id
});


const REMOTE_MAPPERS = {
  member: mapRemoteMemberToLocal,
  payment: mapRemotePaymentToLocal,
  subscription_history: mapRemoteSubscriptionToLocal,
  attendance: mapRemoteGeneric('attendance'),
  access_log: mapRemoteGeneric('access_log'),
  product: mapRemoteGeneric('product'),
  inventory_movement: mapRemoteGeneric('inventory_movement'),
  cash_shift: mapRemoteGeneric('cash_shift'),
  cash_movement: mapRemoteGeneric('cash_movement'),
  sale: mapRemoteGeneric('sale')
};


// ======================================================
// PULL DE UNA ENTIDAD
// ======================================================

const pullEntityFromSupabase = async (entity, gymId) => {
  const remoteTable = REMOTE_TABLES_FOR_PULL[entity];
  const localTable = LOCAL_TABLES_FOR_PULL[entity];
  const mapper = REMOTE_MAPPERS[entity];

  if (!remoteTable || !localTable || !mapper) {
    return { entity, skipped: true, reason: 'no_mapping' };
  }

  await openNexgymDatabase();

  // ==================================================
  // NUEVO: Obtener IDs con operaciones pendientes
  // ==================================================
  // Si hay un DELETE pendiente para un entityId, NO
  // lo traemos de Supabase aunque exista remotamente.
  //

  const pendingItems = await db.syncQueue
    .where('[gymId+status]')
    .equals([String(gymId), 'pending'])
    .filter((item) => item.entity === entity)
    .toArray();

  const processingItems = await db.syncQueue
    .where('[gymId+status]')
    .equals([String(gymId), 'processing'])
    .filter((item) => item.entity === entity)
    .toArray();

  const pendingDeletes = new Set();
  const pendingOthers = new Set();

  for (const item of [...pendingItems, ...processingItems]) {
    const id = String(item.entityId || '');
    if (!id) continue;

    if (item.operation === 'delete') {
      pendingDeletes.add(id);
    } else {
      pendingOthers.add(id);
    }
  }

  // 1. Traer TODO lo remoto de este gimnasio
  const { data, error } = await supabase
    .from(remoteTable)
    .select('*')
    .eq('gym_id', gymId);

  throwSupabaseError(error, `pull ${remoteTable}`);

  const rows = Array.isArray(data) ? data : [];

  // 2. Filtrar deletes pendientes
  const filteredRows = rows.filter((row) => {
    const localId = String(row.local_id || '');
    if (!localId) return true;

    if (pendingDeletes.has(localId)) {
      // Hay un DELETE pendiente: NO traer de remoto.
      return false;
    }

    return true;
  });

  if (filteredRows.length === 0) {
    return {
      entity,
      pulled: rows.length,
      inserted: 0,
      updated: 0,
      skippedLocal: 0,
      skippedPendingDeletes: rows.length - filteredRows.length
    };
  }

  // 3. Traer TODOS los locales de este gimnasio
  const localRows = await db[localTable]
    .where('gymId')
    .equals(gymId)
    .toArray();

  const localById = new Map(
    localRows.map((row) => [String(row.id), row])
  );

  // 4. Merge: no sobreescribir cambios locales pendientes
  let inserted = 0;
  let updated = 0;
  let skippedLocal = 0;

  const toPut = [];

  for (const remote of filteredRows) {
    const mapped = mapper(remote);
    if (!mapped?.id) continue;

    const local = localById.get(String(mapped.id));

    if (local && local.syncStatus && local.syncStatus !== 'synced') {
      skippedLocal += 1;
      continue;
    }

    if (pendingOthers.has(String(mapped.id))) {
      // Hay un update/create pendiente: no pisar
      skippedLocal += 1;
      continue;
    }

    toPut.push(mapped);

    if (local) updated += 1;
    else inserted += 1;
  }

  if (toPut.length > 0) {
    await db[localTable].bulkPut(toPut);
  }

  console.log(
    `📥 Pull ${entity}: ${rows.length} remotos → ${inserted} nuevos, ${updated} actualizados, ${skippedLocal} locales pendientes preservados, ${rows.length - filteredRows.length} deletes pendientes omitidos.`
  );

  return {
    entity,
    pulled: rows.length,
    inserted,
    updated,
    skippedLocal,
    skippedPendingDeletes: rows.length - filteredRows.length
  };
};


// ======================================================
// HIDRATAR LOCALSTORAGE DESDE INDEXEDDB
// ======================================================
//
// El Dashboard lee de localStorage (getStoredMembers).
// Aquí copiamos los miembros desde IndexedDB a localStorage
// para que las pantallas existentes sigan funcionando.
//
// ======================================================

const hydrateLocalStorageFromIndexedDB = async (gymId) => {
  await openNexgymDatabase();

  // ----- MIEMBROS -----
  const members = await db.members
    .where('gymId')
    .equals(gymId)
    .toArray();

  const ALL_MEMBERS_KEY = 'gym_control_members';
  let currentAllMembers = [];
  try {
    const raw = localStorage.getItem(ALL_MEMBERS_KEY);
    currentAllMembers = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(currentAllMembers)) currentAllMembers = [];
  } catch {
    currentAllMembers = [];
  }

  const otherGymsMembers = currentAllMembers.filter(
    (m) => String(m?.gymId || '') !== String(gymId)
  );

  const mergedMembers = [...otherGymsMembers, ...members];

  localStorage.setItem(ALL_MEMBERS_KEY, JSON.stringify(mergedMembers));

  // ----- PAGOS -----
  const PAYMENTS_KEY = 'gym_control_payments';
  const payments = await db.memberPayments
    .where('gymId')
    .equals(gymId)
    .toArray();

  let currentAllPayments = [];
  try {
    const raw = localStorage.getItem(PAYMENTS_KEY);
    currentAllPayments = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(currentAllPayments)) currentAllPayments = [];
  } catch {
    currentAllPayments = [];
  }

  const otherGymsPayments = currentAllPayments.filter(
    (p) => String(p?.gymId || '') !== String(gymId)
  );

  const mergedPayments = [...otherGymsPayments, ...payments];
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(mergedPayments));

  // ----- ASISTENCIA -----
  const ATTENDANCE_KEY = 'gym_control_attendance';
  const attendance = await db.attendance
    .where('gymId')
    .equals(gymId)
    .toArray();

  let currentAllAttendance = [];
  try {
    const raw = localStorage.getItem(ATTENDANCE_KEY);
    currentAllAttendance = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(currentAllAttendance)) currentAllAttendance = [];
  } catch {
    currentAllAttendance = [];
  }

  const otherGymsAttendance = currentAllAttendance.filter(
    (a) => String(a?.gymId || '') !== String(gymId)
  );

  const mergedAttendance = [...otherGymsAttendance, ...attendance];
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(mergedAttendance));

  console.log(
    `💾 LocalStorage hidratado para gym ${gymId}:`,
    {
      members: members.length,
      payments: payments.length,
      attendance: attendance.length
    }
  );
};


// ======================================================
// PULL GLOBAL DE TODAS LAS ENTIDADES
// ======================================================

export const pullAllFromSupabase = async (gymId) => {
  const cleanGymId = asText(gymId);
  if (!cleanGymId) {
    return { success: false, reason: 'no_gym_id' };
  }

  await validateAuthenticatedGym(cleanGymId);

  const results = [];

  for (const entity of SUPABASE_SYNC_ENTITIES) {
    try {
      const result = await pullEntityFromSupabase(entity, cleanGymId);
      results.push(result);
    } catch (error) {
      console.error(`❌ Pull ${entity} falló:`, error);
      results.push({ entity, error: error?.message || String(error) });
    }
  }

  // Refrescar localStorage desde IndexedDB para que el Dashboard vea los datos
  await hydrateLocalStorageFromIndexedDB(cleanGymId);

  window.dispatchEvent(new Event('gym-storage-update'));

  return {
    success: true,
    gymId: cleanGymId,
    results
  };
};


// ======================================================
// REGISTRAR HANDLERS
// ======================================================

let handlersRegistered =
  false;


export const registerSupabaseRemoteHandlers =
  () => {

    if (
      handlersRegistered
    ) {

      return {
        success:
          true,

        alreadyRegistered:
          true,

        entities:
          SUPABASE_SYNC_ENTITIES
      };

    }


    registerSyncHandler(
      'member',
      syncMember
    );


    registerSyncHandler(
      'payment',
      syncPayment
    );


    registerSyncHandler(
      'subscription_history',
      syncSubscription
    );


    registerSyncHandler(
      'attendance',
      syncAttendance
    );


    registerSyncHandler(
      'access_log',
      syncAccessLog
    );


    registerSyncHandler(
      'product',
      syncProduct
    );


    registerSyncHandler(
      'inventory_movement',
      syncInventoryMovement
    );


    registerSyncHandler(
      'cash_shift',
      syncCashShift
    );


    registerSyncHandler(
      'cash_movement',
      syncCashMovement
    );


    registerSyncHandler(
      'sale',
      syncSale
    );


    handlersRegistered =
      true;


    console.log(
      '☁️ Handlers Supabase registrados:',
      SUPABASE_SYNC_ENTITIES
    );


    return {
      success:
        true,

      entities:
        SUPABASE_SYNC_ENTITIES
    };

  };


// ======================================================
// EXPORT DEFAULT
// ======================================================

export default {

  register:
    registerSupabaseRemoteHandlers,

  entities:
    SUPABASE_SYNC_ENTITIES,

  pullAll:
    pullAllFromSupabase

};