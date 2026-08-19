// src/nexgym/services/nexgymCloudGymService.js

import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError
} from '@supabase/supabase-js';

import {
  supabase
} from '../../lib/supabaseClient.js';


// ======================================================
// FECHA YYYY-MM-DD
// ======================================================

const toDateString = (
  date
) => {

  if (!date) {
    return null;
  }

  const value =
    date instanceof Date
      ? date
      : new Date(date);

  if (
    Number.isNaN(
      value.getTime()
    )
  ) {
    return null;
  }

  const year =
    value.getFullYear();

  const month =
    String(
      value.getMonth() + 1
    ).padStart(
      2,
      '0'
    );

  const day =
    String(
      value.getDate()
    ).padStart(
      2,
      '0'
    );

  return `${year}-${month}-${day}`;

};


// ======================================================
// PARSEAR FECHA LOCAL
// ======================================================

const parseDateValue = (
  value
) => {

  if (!value) {
    return null;
  }

  const date =
    String(value)
      .length === 10
      ? new Date(
          `${value}T12:00:00`
        )
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;

};


// ======================================================
// SUMAR DÍAS
// ======================================================

const addDays = (
  value,
  days
) => {

  const date =
    new Date(value);

  date.setDate(
    date.getDate() +
    Number(days || 0)
  );

  return date;

};


// ======================================================
// SUMAR MESES
// ======================================================

const addMonths = (
  value,
  months = 1
) => {

  const date =
    new Date(value);

  const originalDay =
    date.getDate();

  date.setDate(1);

  date.setMonth(
    date.getMonth() +
    Number(months || 1)
  );

  const lastDay =
    new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDate();

  date.setDate(
    Math.min(
      originalDay,
      lastDay
    )
  );

  return date;

};


// ======================================================
// SUMAR MES
// ======================================================

const addMonth = (
  value
) => {

  return addMonths(
    value,
    1
  );

};


// ======================================================
// NORMALIZAR TEXTO
// ======================================================

const cleanText = (
  value
) => {

  return String(
    value || ''
  ).trim();

};


// ======================================================
// NORMALIZAR EMAIL
// ======================================================

const normalizeEmail = (
  value
) => {

  return cleanText(
    value
  ).toLowerCase();

};


// ======================================================
// DINERO
// ======================================================

const normalizeMoney = (
  value
) => {

  const numeric =
    Number(
      value || 0
    );

  if (
    !Number.isFinite(
      numeric
    )
  ) {
    return 0;
  }

  return Math.max(
    0,
    numeric
  );

};


// ======================================================
// SESIÓN
// ======================================================

const getCurrentSession =
  async () => {

    const {
      data,
      error
    } =
      await supabase.auth
        .getSession();

    if (error) {

      console.error(
        '❌ Error obteniendo sesión Supabase:',
        error
      );

      return {
        success:
          false,

        session:
          null,

        message:
          'No se pudo comprobar la sesión.'
      };

    }

    const session =
      data?.session ||
      null;

    if (
      !session?.user?.id
    ) {

      return {
        success:
          false,

        session:
          null,

        message:
          'La sesión del Super Administrador expiró.'
      };

    }

    return {
      success:
        true,

      session
    };

  };


// ======================================================
// ERROR EDGE FUNCTION
// ======================================================

const parseFunctionError =
  async (
    error
  ) => {

    if (
      error instanceof
      FunctionsHttpError
    ) {

      try {

        const response =
          error.context;

        let body =
          null;

        try {

          body =
            await response
              .clone()
              .json();

        } catch {

          try {

            body =
              await response
                .clone()
                .text();

          } catch {

            body =
              null;

          }

        }

        console.error(
          '❌ Edge Function respondió con error HTTP:',
          {
            status:
              response?.status,

            statusText:
              response?.statusText,

            body
          }
        );

        if (
          body &&
          typeof body ===
            'object'
        ) {

          return {

            message:
              body.message ||
              body.error ||
              'La función rechazó la solicitud.',

            code:
              body.code ||
              'FUNCTION_HTTP_ERROR',

            details:
              body.details ||
              null,

            status:
              response?.status ||
              null

          };

        }

        if (
          typeof body ===
            'string' &&
          body.trim()
        ) {

          return {

            message:
              body,

            code:
              'FUNCTION_HTTP_ERROR',

            status:
              response?.status ||
              null

          };

        }

        return {

          message:
            `La función respondió con código ${response?.status || 'desconocido'}.`,

          code:
            'FUNCTION_HTTP_ERROR',

          status:
            response?.status ||
            null

        };

      } catch (
        parseError
      ) {

        console.error(
          '❌ No se pudo leer el error de la función:',
          parseError
        );

        return {

          message:
            error?.message ||
            'La función devolvió un error.',

          code:
            'FUNCTION_HTTP_ERROR'

        };

      }

    }


    if (
      error instanceof
      FunctionsRelayError
    ) {

      console.error(
        '❌ Error Relay Supabase:',
        error
      );

      return {

        message:
          'Supabase no pudo procesar correctamente la solicitud.',

        code:
          'FUNCTION_RELAY_ERROR'

      };

    }


    if (
      error instanceof
      FunctionsFetchError
    ) {

      console.error(
        '❌ Error conectando con Edge Function:',
        error
      );

      return {

        message:
          'No se pudo conectar con la función.',

        code:
          'FUNCTION_FETCH_ERROR'

      };

    }


    return {

      message:
        error?.message ||
        'Ocurrió un error inesperado.',

      code:
        'UNKNOWN_ERROR'

    };

  };


// ======================================================
// NORMALIZAR PAGO
// ======================================================

const normalizeRemotePayment = (
  payment
) => {

  if (!payment) {
    return null;
  }

  return {

    id:
      payment.id,

    gymId:
      payment.gym_id,

    amount:
      Number(
        payment.amount ||
        0
      ),

    currency:
      payment.currency ||
      'MXN',

    method:
      payment.method ||
      '',

    reference:
      payment.reference ||
      '',

    notes:
      payment.notes ||
      '',

    status:
      payment.status ||
      'paid',

    date:
      payment.payment_date ||
      null,

    paidAt:
      payment.paid_at ||
      null,

    createdBy:
      payment.created_by ||
      null,

    createdAt:
      payment.created_at ||
      null,

    updatedAt:
      payment.updated_at ||
      null

  };

};


// ======================================================
// NORMALIZAR GIMNASIO REMOTO
// ======================================================

const normalizeRemoteGym = (
  gym,
  gymUser = null,
  subscription = null,
  usersCount = 0,
  membersCount = 0,
  payments = []
) => {

  if (!gym) {
    return null;
  }

  const subscriptionStatus =
    subscription?.status ||
    gym.subscription_status ||
    gym.status ||
    'active';


  let accountStatus =
    'active';


  if (
    gym.status ===
    'inactive'
  ) {

    accountStatus =
      'inactive';

  } else if (
    gym.status ===
    'suspended'
  ) {

    accountStatus =
      'suspended';

  }


  return {

    id:
      gym.id,

    gymCode:
      gym.gym_code ||
      '',

    name:
      gym.name ||
      '',

    phone:
      gym.phone ||
      '',

    address:
      gym.address ||
      '',

    city:
      gym.city ||
      '',

    state:
      gym.state ||
      '',


    owner: {

      name:
        gym.owner_name ||
        gymUser?.name ||
        '',

      email:
        gym.owner_email ||
        '',

      phone:
        gym.owner_phone ||
        ''

    },


    access: {

      email:
        gymUser?.email ||
        '',

      accountStatus,

      mustChangePassword:
        Boolean(
          gymUser?.must_change_password
        ),

      lastLoginAt:
        gymUser?.last_access_at ||
        null

    },


    subscription: {

      id:
        subscription?.id ||
        null,

      status:
        subscriptionStatus,

      billingCycle:
        subscription?.billing_cycle ||
        'monthly',

      price:
        Number(
          subscription?.regular_price ??
          gym.subscription_price ??
          0
        ),

      discount:
        Number(
          subscription?.discount ??
          gym.subscription_discount ??
          0
        ),

      finalPrice:
        Number(
          subscription?.final_price ??
          gym.subscription_final_price ??
          0
        ),

      startDate:
        subscription?.start_date ||
        gym.subscription_start_date ||
        null,

      nextPaymentDate:
        subscription?.next_payment_date ||
        gym.subscription_next_payment_date ||
        null

    },


    trial: {

      active:
        Boolean(
          gym.trial_active
        ) ||
        subscriptionStatus ===
          'trial',

      startDate:
        subscription?.trial_start_date ||
        gym.trial_start_date ||
        null,

      endDate:
        subscription?.trial_end_date ||
        gym.trial_end_date ||
        null

    },


    payments:
      Array.isArray(
        payments
      )
        ? payments
        : [],


    usersCount:
      Number(
        usersCount ||
        0
      ),

    membersCount:
      Number(
        membersCount ||
        0
      ),

    lastConnectionAt:
      gymUser?.last_access_at ||
      null,

    storageMB:
      0,

    createdAt:
      gym.created_at ||
      null,

    updatedAt:
      gym.updated_at ||
      null

  };

};


// ======================================================
// CREAR GIMNASIO
// ======================================================

export const createNexgymGym =
  async (
    data = {}
  ) => {

    try {

      const sessionResult =
        await getCurrentSession();


      if (
        !sessionResult.success
      ) {

        return {

          success:
            false,

          code:
            'NO_SESSION',

          message:
            sessionResult.message

        };

      }


      const session =
        sessionResult.session;


      console.log(
        '🔐 Sesión Super Admin lista para create-gym:',
        {
          userId:
            session.user.id,

          email:
            session.user.email
        }
      );


      const trialDays =
        Math.max(
          0,
          Number(
            data.trialDays ||
            0
          )
        );


      const regularPrice =
        normalizeMoney(
          data.subscription
            ?.price
        );


      const discount =
        normalizeMoney(
          data.subscription
            ?.discount
        );


      const finalPrice =
        Number(
          Math.max(
            0,
            regularPrice -
            discount
          ).toFixed(
            2
          )
        );


      const today =
        new Date();


      const startDate =
        toDateString(
          today
        );


      const trialActive =
        trialDays >
        0;


      const trialEnd =
        trialActive
          ? addDays(
              today,
              trialDays
            )
          : null;


      const nextPayment =
        trialActive
          ? trialEnd
          : addMonth(
              today
            );


      const payload = {

        gym: {

          name:
            cleanText(
              data.name
            ),

          phone:
            cleanText(
              data.phone
            ),

          address:
            cleanText(
              data.address
            ),

          city:
            cleanText(
              data.city
            ),

          state:
            cleanText(
              data.state
            )

        },


        owner: {

          name:
            cleanText(
              data.owner
                ?.name
            ),

          email:
            normalizeEmail(
              data.owner
                ?.email
            ),

          phone:
            cleanText(
              data.owner
                ?.phone
            )

        },


        access: {

          email:
            normalizeEmail(
              data.access
                ?.email
            ),

          password:
            String(
              data.access
                ?.password ||
              ''
            )

        },


        subscription: {

          status:
            trialActive
              ? 'trial'
              : 'active',

          billingCycle:
            'monthly',

          regularPrice,

          discount,

          finalPrice,

          startDate,

          nextPaymentDate:
            nextPayment
              ? toDateString(
                  nextPayment
                )
              : null,

          trialStartDate:
            trialActive
              ? startDate
              : null,

          trialEndDate:
            trialEnd
              ? toDateString(
                  trialEnd
                )
              : null

        }

      };


      console.log(
        '☁️ Enviando gimnasio a create-gym:',
        {

          gym:
            payload.gym,

          owner:
            payload.owner,

          access: {

            email:
              payload.access.email,

            hasPassword:
              Boolean(
                payload.access.password
              )

          },

          subscription:
            payload.subscription

        }
      );


      const {
        data:
          response,

        error
      } =
        await supabase.functions
          .invoke(
            'create-gym',
            {
              body:
                payload
            }
          );


      if (
        error
      ) {

        const parsedError =
          await parseFunctionError(
            error
          );


        return {

          success:
            false,

          ...parsedError

        };

      }


      if (
        !response?.success
      ) {

        return {

          success:
            false,

          code:
            response?.code ||
            'CREATE_GYM_FAILED',

          message:
            response?.message ||
            'No se pudo registrar el gimnasio.',

          details:
            response?.details ||
            null

        };

      }


      const gym =
        normalizeRemoteGym(
          response.gym,
          response.gymUser,
          response.subscription,
          1,
          0,
          []
        );


      if (
        !gym?.id
      ) {

        return {

          success:
            false,

          code:
            'INVALID_FUNCTION_RESPONSE',

          message:
            'Supabase no devolvió correctamente el gimnasio creado.'

        };

      }


      window.dispatchEvent(
        new Event(
          'nexgym-gyms-update'
        )
      );


      window.dispatchEvent(
        new Event(
          'nexgym-activity-update'
        )
      );


      console.log(
        '✅ Gimnasio creado en Supabase:',
        {
          id:
            gym.id,

          gymCode:
            gym.gymCode,

          name:
            gym.name,

          accessEmail:
            gym.access.email
        }
      );


      return {

        success:
          true,

        message:
          response.message ||
          'Gimnasio registrado correctamente.',

        gym,

        access: {
          email:
            gym.access.email
        },

        gymUser:
          response.gymUser ||
          null,

        subscription:
          response.subscription ||
          null

      };

    } catch (
      error
    ) {

      console.error(
        '❌ Error inesperado creando gimnasio:',
        error
      );


      return {

        success:
          false,

        code:
          'UNEXPECTED_ERROR',

        message:
          error?.message ||
          'No se pudo registrar el gimnasio.'

      };

    }

  };


// ======================================================
// OBTENER PAGOS
// ======================================================

export const getNexgymCloudPayments =
  async (
    gymIds = null
  ) => {

    try {

      let query =
        supabase
          .from(
            'nexgym_payments'
          )
          .select(
            '*'
          )
          .order(
            'created_at',
            {
              ascending:
                false
            }
          );


      if (
        Array.isArray(
          gymIds
        ) &&
        gymIds.length >
          0
      ) {

        query =
          query.in(
            'gym_id',
            gymIds
          );

      }


      const {
        data,
        error
      } =
        await query;


      if (
        error
      ) {

        console.error(
          '❌ Error cargando pagos NEXGYM:',
          error
        );


        return {

          success:
            false,

          payments:
            [],

          message:
            error.message ||
            'No se pudieron cargar los pagos.'

        };

      }


      return {

        success:
          true,

        payments:
          (
            Array.isArray(
              data
            )
              ? data
              : []
          )
            .map(
              normalizeRemotePayment
            )
            .filter(
              Boolean
            )

      };

    } catch (
      error
    ) {

      console.error(
        '❌ Error inesperado cargando pagos:',
        error
      );


      return {

        success:
          false,

        payments:
          [],

        message:
          error?.message ||
          'No se pudieron cargar los pagos.'

      };

    }

  };


// ======================================================
// OBTENER TODOS LOS GIMNASIOS
// ======================================================

export const getNexgymCloudGyms =
  async () => {

    try {

      const sessionResult =
        await getCurrentSession();


      if (
        !sessionResult.success
      ) {

        return {

          success:
            false,

          gyms:
            [],

          code:
            'NO_SESSION',

          message:
            sessionResult.message

        };

      }


      const {
        data:
          gymsData,

        error:
          gymsError
      } =
        await supabase

          .from(
            'gyms'
          )

          .select(
            '*'
          )

          .order(
            'created_at',
            {
              ascending:
                false
            }
          );


      if (
        gymsError
      ) {

        console.error(
          '❌ Error cargando gyms:',
          gymsError
        );


        return {

          success:
            false,

          gyms:
            [],

          code:
            'GYMS_QUERY_ERROR',

          message:
            gymsError.message ||
            'No se pudieron cargar los gimnasios.'

        };

      }


      const remoteGyms =
        Array.isArray(
          gymsData
        )
          ? gymsData
          : [];


      if (
        remoteGyms.length ===
        0
      ) {

        console.log(
          '☁️ Gimnasios cargados desde Supabase:',
          {
            total:
              0
          }
        );


        return {

          success:
            true,

          gyms:
            []

        };

      }


      const gymIds =
        remoteGyms
          .map(
            gym =>
              gym.id
          )
          .filter(
            Boolean
          );


      const {
        data:
          gymUsersData,

        error:
          gymUsersError
      } =
        await supabase

          .from(
            'gym_users'
          )

          .select(
            `
              id,
              user_id,
              gym_id,
              name,
              email,
              role,
              status,
              must_change_password,
              last_access_at,
              created_at,
              updated_at
            `
          )

          .in(
            'gym_id',
            gymIds
          );


      if (
        gymUsersError
      ) {

        console.error(
          '❌ Error cargando gym_users:',
          gymUsersError
        );

      }


      const gymUsers =
        Array.isArray(
          gymUsersData
        )
          ? gymUsersData
          : [];


      const {
        data:
          subscriptionsData,

        error:
          subscriptionsError
      } =
        await supabase

          .from(
            'gym_subscriptions'
          )

          .select(
            '*'
          )

          .in(
            'gym_id',
            gymIds
          )

          .order(
            'created_at',
            {
              ascending:
                false
            }
          );


      if (
        subscriptionsError
      ) {

        console.error(
          '❌ Error cargando gym_subscriptions:',
          subscriptionsError
        );

      }


      const subscriptions =
        Array.isArray(
          subscriptionsData
        )
          ? subscriptionsData
          : [];


      const {
        data:
          membersData,

        error:
          membersError
      } =
        await supabase

          .from(
            'members'
          )

          .select(
            `
              id,
              gym_id
            `
          )

          .in(
            'gym_id',
            gymIds
          );


      if (
        membersError
      ) {

        console.error(
          '❌ Error cargando miembros:',
          membersError
        );

      }


      const members =
        Array.isArray(
          membersData
        )
          ? membersData
          : [];


      const paymentResult =
        await getNexgymCloudPayments(
          gymIds
        );


      const payments =
        paymentResult.success
          ? paymentResult.payments
          : [];


      const gyms =
        remoteGyms

          .map(
            gym => {

              const usersForGym =
                gymUsers.filter(
                  user =>
                    user.gym_id ===
                    gym.id
                );


              const ownerUser =
                usersForGym.find(
                  user =>
                    user.role ===
                    'owner'
                ) ||
                usersForGym[0] ||
                null;


              const subscriptionsForGym =
                subscriptions.filter(
                  item =>
                    item.gym_id ===
                    gym.id
                );


              const subscription =
                subscriptionsForGym[0] ||
                null;


              const membersCount =
                members.filter(
                  member =>
                    member.gym_id ===
                    gym.id
                ).length;


              const paymentsForGym =
                payments.filter(
                  payment =>
                    payment.gymId ===
                    gym.id
                );


              return normalizeRemoteGym(
                gym,
                ownerUser,
                subscription,
                usersForGym.length,
                membersCount,
                paymentsForGym
              );

            }
          )

          .filter(
            Boolean
          );


      console.log(
        '☁️ Gimnasios cargados desde Supabase:',
        {
          total:
            gyms.length
        }
      );


      return {

        success:
          true,

        gyms

      };

    } catch (
      error
    ) {

      console.error(
        '❌ Error inesperado cargando gimnasios:',
        error
      );


      return {

        success:
          false,

        gyms:
          [],

        code:
          'UNEXPECTED_ERROR',

        message:
          error?.message ||
          'No se pudieron cargar los gimnasios.'

      };

    }

  };


// ======================================================
// OBTENER GIMNASIO POR ID
// ======================================================

export const getNexgymCloudGymById =
  async (
    gymId
  ) => {

    try {

      if (
        !gymId
      ) {

        return {

          success:
            false,

          gym:
            null,

          message:
            'No se indicó el gimnasio.'

        };

      }


      const result =
        await getNexgymCloudGyms();


      if (
        !result.success
      ) {

        return {

          success:
            false,

          gym:
            null,

          message:
            result.message

        };

      }


      const gym =
        result.gyms.find(
          item =>
            item.id ===
            gymId
        ) ||
        null;


      if (
        !gym
      ) {

        return {

          success:
            false,

          gym:
            null,

          message:
            'Gimnasio no encontrado.'

        };

      }


      return {

        success:
          true,

        gym

      };

    } catch (
      error
    ) {

      return {

        success:
          false,

        gym:
          null,

        message:
          error?.message ||
          'No se pudo obtener el gimnasio.'

      };

    }

  };


// ======================================================
// ACTIVIDAD CLOUD
// ======================================================

export const getNexgymCloudActivity =
  async (
    limit = 20
  ) => {

    try {

      const {
        data,
        error
      } =
        await supabase

          .from(
            'nexgym_activity_logs'
          )

          .select(
            '*'
          )

          .order(
            'created_at',
            {
              ascending:
                false
            }
          )

          .limit(
            Number(
              limit ||
              20
            )
          );


      if (
        error
      ) {

        console.error(
          '❌ Error cargando actividad NEXGYM:',
          error
        );


        return {

          success:
            false,

          activity:
            [],

          message:
            error.message

        };

      }


      const activity =
        (
          Array.isArray(
            data
          )
            ? data
            : []
        ).map(
          item => ({

            id:
              item.id,

            gymId:
              item.gym_id,

            adminId:
              item.admin_id,

            type:
              item.type,

            title:
              item.title,

            description:
              item.description,

            metadata:
              item.metadata ||
              {},

            createdAt:
              item.created_at

          })
        );


      return {

        success:
          true,

        activity

      };

    } catch (
      error
    ) {

      return {

        success:
          false,

        activity:
          [],

        message:
          error?.message ||
          'No se pudo cargar la actividad.'

      };

    }

  };


// ======================================================
// REGISTRAR ACTIVIDAD
// ======================================================

const addCloudActivity =
  async ({
    gymId,
    type,
    title,
    description,
    metadata = {}
  }) => {

    try {

      const sessionResult =
        await getCurrentSession();


      if (
        !sessionResult.success
      ) {

        return null;

      }


      const userId =
        sessionResult.session
          .user
          .id;


      const {
        data:
          admin
      } =
        await supabase

          .from(
            'nexgym_admins'
          )

          .select(
            'id'
          )

          .eq(
            'user_id',
            userId
          )

          .maybeSingle();


      if (
        !admin?.id
      ) {

        return null;

      }


      const {
        data,
        error
      } =
        await supabase

          .from(
            'nexgym_activity_logs'
          )

          .insert({

            gym_id:
              gymId,

            admin_id:
              admin.id,

            type:
              type,

            title:
              title,

            description:
              description,

            metadata:
              metadata

          })

          .select()

          .single();


      if (
        error
      ) {

        console.warn(
          '⚠️ No se pudo registrar actividad:',
          error
        );

        return null;

      }


      window.dispatchEvent(
        new Event(
          'nexgym-activity-update'
        )
      );


      return data;

    } catch (
      error
    ) {

      console.warn(
        '⚠️ Error registrando actividad:',
        error
      );

      return null;

    }

  };


// ======================================================
// REGISTRAR PAGO CLOUD
// ======================================================

export const registerNexgymCloudPayment =
  async (
    gymId,
    paymentData = {}
  ) => {

    try {

      const gymResult =
        await getNexgymCloudGymById(
          gymId
        );


      if (
        !gymResult.success ||
        !gymResult.gym
      ) {

        return {

          success:
            false,

          message:
            'Gimnasio no encontrado.'

        };

      }


      const gym =
        gymResult.gym;


      const amount =
        normalizeMoney(
          paymentData.amount ||
          gym.subscription
            ?.finalPrice ||
          0
        );


      if (
        amount <=
        0
      ) {

        return {

          success:
            false,

          message:
            'Ingresa un importe válido.'

        };

      }


      const now =
        new Date();


      const paymentDate =
        paymentData.date ||
        toDateString(
          now
        );


      const currentNext =
        parseDateValue(
          gym.subscription
            ?.nextPaymentDate
        );


      const baseDate =
        currentNext &&
        currentNext >
          now
          ? currentNext
          : now;


      const nextPaymentDate =
        toDateString(
          addMonths(
            baseDate,
            1
          )
        );


      const sessionResult =
        await getCurrentSession();


      const createdBy =
        sessionResult.success
          ? sessionResult.session
              .user.id
          : null;


      const {
        data:
          payment,

        error:
          paymentError
      } =
        await supabase

          .from(
            'nexgym_payments'
          )

          .insert({

            gym_id:
              gymId,

            amount,

            currency:
              'MXN',

            method:
              cleanText(
                paymentData.method ||
                'Efectivo'
              ),

            reference:
              cleanText(
                paymentData.reference
              ) ||
              null,

            notes:
              cleanText(
                paymentData.notes
              ) ||
              null,

            status:
              'paid',

            payment_date:
              paymentDate,

            paid_at:
              now.toISOString(),

            created_by:
              createdBy

          })

          .select()

          .single();


      if (
        paymentError
      ) {

        console.error(
          '❌ Error registrando pago:',
          paymentError
        );


        return {

          success:
            false,

          message:
            paymentError.message ||
            'No se pudo registrar el pago.'

        };

      }


      const {
        error:
          subscriptionError
      } =
        await supabase

          .from(
            'gym_subscriptions'
          )

          .update({

            status:
              'active',

            next_payment_date:
              nextPaymentDate,

            trial_start_date:
              null,

            trial_end_date:
              null

          })

          .eq(
            'gym_id',
            gymId
          );


      if (
        subscriptionError
      ) {

        console.error(
          '❌ Error actualizando suscripción:',
          subscriptionError
        );

      }


      if (
        gym.access
          ?.accountStatus !==
        'inactive'
      ) {

        const {
          error:
            gymError
        } =
          await supabase

            .from(
              'gyms'
            )

            .update({

              subscription_status:
                'active',

              subscription_next_payment_date:
                nextPaymentDate,

              trial_active:
                false,

              trial_start_date:
                null,

              trial_end_date:
                null

            })

            .eq(
              'id',
              gymId
            );


        if (
          gymError
        ) {

          console.error(
            '❌ Error actualizando gym:',
            gymError
          );

        }

      }


      await addCloudActivity({

        gymId,

        type:
          'payment',

        title:
          'Pago recibido',

        description:
          `${gym.name} pagó $${amount.toFixed(2)} MXN.`,

        metadata: {

          paymentId:
            payment.id,

          amount,

          method:
            paymentData.method ||
            'Efectivo',

          nextPaymentDate

        }

      });


      window.dispatchEvent(
        new Event(
          'nexgym-gyms-update'
        )
      );


      window.dispatchEvent(
        new Event(
          'nexgym-payments-update'
        )
      );


      const refreshed =
        await getNexgymCloudGymById(
          gymId
        );


      console.log(
        '✅ Pago NEXGYM registrado en Supabase:',
        {
          gymId,

          paymentId:
            payment.id,

          amount,

          nextPaymentDate
        }
      );


      return {

        success:
          true,

        payment:
          normalizeRemotePayment(
            payment
          ),

        nextPaymentDate,

        gym:
          refreshed.gym ||
          null

      };

    } catch (
      error
    ) {

      console.error(
        '❌ Error inesperado registrando pago:',
        error
      );


      return {

        success:
          false,

        message:
          error?.message ||
          'No se pudo registrar el pago.'

      };

    }

  };


// ======================================================
// MARCAR AVISO DE RENOVACIÓN
// ======================================================
//
// Usa el estado existente "past_due". No suspende el
// acceso y no necesita columnas nuevas en Supabase.
// ======================================================

export const markNexgymCloudRenewalNotice =
  async (
    gymId
  ) => {

    try {

      const gymResult =
        await getNexgymCloudGymById(
          gymId
        );


      if (
        !gymResult.success ||
        !gymResult.gym
      ) {

        return {
          success: false,
          message: 'Gimnasio no encontrado.'
        };

      }


      const gym =
        gymResult.gym;


      if (
        gym.access?.accountStatus ===
          'inactive' ||
        gym.subscription?.status ===
          'suspended'
      ) {

        return {
          success: false,
          message: 'No puedes marcar un aviso de renovación mientras el servicio está suspendido o desactivado.'
        };

      }


      const {
        error: subscriptionError
      } =
        await supabase
          .from(
            'gym_subscriptions'
          )
          .update({
            status: 'past_due'
          })
          .eq(
            'gym_id',
            gymId
          );


      if (
        subscriptionError
      ) {

        return {
          success: false,
          message:
            subscriptionError.message ||
            'No se pudo marcar el aviso de renovación.'
        };

      }


      const {
        error: gymError
      } =
        await supabase
          .from(
            'gyms'
          )
          .update({
            subscription_status: 'past_due'
          })
          .eq(
            'id',
            gymId
          );


      if (
        gymError
      ) {

        return {
          success: false,
          message:
            gymError.message ||
            'No se pudo actualizar el gimnasio.'
        };

      }


      await addCloudActivity({
        gymId,
        type: 'renewal_notice',
        title: 'Aviso de renovación activado',
        description:
          `${gym.name} fue marcado para mostrar aviso de renovación al iniciar sesión.`
      });


      window.dispatchEvent(
        new Event(
          'nexgym-gyms-update'
        )
      );


      return {
        success: true
      };

    } catch (error) {

      return {
        success: false,
        message:
          error?.message ||
          'No se pudo marcar el aviso de renovación.'
      };

    }

  };


// ======================================================
// QUITAR AVISO MANUAL DE RENOVACIÓN
// ======================================================

export const clearNexgymCloudRenewalNotice =
  async (
    gymId
  ) => {

    try {

      const gymResult =
        await getNexgymCloudGymById(
          gymId
        );


      if (
        !gymResult.success ||
        !gymResult.gym
      ) {

        return {
          success: false,
          message: 'Gimnasio no encontrado.'
        };

      }


      const gym =
        gymResult.gym;


      if (
        gym.access?.accountStatus ===
          'inactive' ||
        gym.subscription?.status ===
          'suspended'
      ) {

        return {
          success: false,
          message: 'Reactiva primero el servicio antes de quitar el aviso de renovación.'
        };

      }


      const {
        error: subscriptionError
      } =
        await supabase
          .from(
            'gym_subscriptions'
          )
          .update({
            status: 'active'
          })
          .eq(
            'gym_id',
            gymId
          );


      if (
        subscriptionError
      ) {

        return {
          success: false,
          message:
            subscriptionError.message ||
            'No se pudo quitar el aviso de renovación.'
        };

      }


      const {
        error: gymError
      } =
        await supabase
          .from(
            'gyms'
          )
          .update({
            subscription_status: 'active'
          })
          .eq(
            'id',
            gymId
          );


      if (
        gymError
      ) {

        return {
          success: false,
          message:
            gymError.message ||
            'No se pudo actualizar el gimnasio.'
        };

      }


      await addCloudActivity({
        gymId,
        type: 'renewal_notice_cleared',
        title: 'Aviso de renovación retirado',
        description:
          `Se retiró el aviso manual de renovación de ${gym.name}.`
      });


      window.dispatchEvent(
        new Event(
          'nexgym-gyms-update'
        )
      );


      return {
        success: true
      };

    } catch (error) {

      return {
        success: false,
        message:
          error?.message ||
          'No se pudo quitar el aviso de renovación.'
      };

    }

  };


// ======================================================
// EXTENDER SERVICIO CLOUD
// ======================================================

export const extendNexgymCloudService =
  async (
    gymId,
    months = 1
  ) => {

    try {

      const monthsToAdd =
        Math.max(
          1,
          Math.floor(
            Number(
              months ||
              1
            )
          )
        );


      const gymResult =
        await getNexgymCloudGymById(
          gymId
        );


      if (
        !gymResult.success ||
        !gymResult.gym
      ) {

        return {

          success:
            false,

          message:
            'Gimnasio no encontrado.'

        };

      }


      const gym =
        gymResult.gym;


      // ==================================================
      // FECHA BASE
      // ==================================================
      //
      // Si la fecha actual todavía está vigente:
      // extendemos desde esa fecha.
      //
      // Si ya venció:
      // extendemos desde hoy.
      //
      // ==================================================

      const now =
        new Date();


      const currentNextPayment =
        parseDateValue(
          gym.subscription
            ?.nextPaymentDate
        );


      const baseDate =
        currentNextPayment &&
        currentNextPayment >
          now
          ? currentNextPayment
          : now;


      const nextPaymentDate =
        toDateString(
          addMonths(
            baseDate,
            monthsToAdd
          )
        );


      // ==================================================
      // ACTUALIZAR SUSCRIPCIÓN
      // ==================================================

      const {
        error:
          subscriptionError
      } =
        await supabase

          .from(
            'gym_subscriptions'
          )

          .update({

            status:
              gym.access
                ?.accountStatus ===
                'inactive'
                ? gym.subscription
                    ?.status ||
                  'active'
                : 'active',

            next_payment_date:
              nextPaymentDate,

            trial_start_date:
              null,

            trial_end_date:
              null

          })

          .eq(
            'gym_id',
            gymId
          );


      if (
        subscriptionError
      ) {

        console.error(
          '❌ Error extendiendo gym_subscriptions:',
          subscriptionError
        );


        return {

          success:
            false,

          message:
            subscriptionError.message ||
            'No se pudo extender la suscripción.'

        };

      }


      // ==================================================
      // ACTUALIZAR GYM
      // ==================================================

      const gymUpdate = {

        subscription_next_payment_date:
          nextPaymentDate,

        trial_active:
          false,

        trial_start_date:
          null,

        trial_end_date:
          null

      };


      // ==================================================
      // SI NO ESTÁ DESACTIVADO, LO DEJAMOS ACTIVO
      // ==================================================

      if (
        gym.access
          ?.accountStatus !==
        'inactive'
      ) {

        gymUpdate.subscription_status =
          'active';

      }


      const {
        error:
          gymError
      } =
        await supabase

          .from(
            'gyms'
          )

          .update(
            gymUpdate
          )

          .eq(
            'id',
            gymId
          );


      if (
        gymError
      ) {

        console.error(
          '❌ Error extendiendo gyms:',
          gymError
        );


        return {

          success:
            false,

          message:
            gymError.message ||
            'No se pudo actualizar el gimnasio.'

        };

      }


      // ==================================================
      // REACTIVAR USUARIOS SI NO ESTÁ DESACTIVADO
      // ==================================================

      if (
        gym.access
          ?.accountStatus !==
        'inactive'
      ) {

        const {
          error:
            usersError
        } =
          await supabase

            .from(
              'gym_users'
            )

            .update({

              status:
                'active'

            })

            .eq(
              'gym_id',
              gymId
            );


        if (
          usersError
        ) {

          console.warn(
            '⚠️ No se pudieron reactivar usuarios:',
            usersError
          );

        }

      }


      // ==================================================
      // ACTIVIDAD
      // ==================================================

      await addCloudActivity({

        gymId,

        type:
          'service_extended',

        title:
          'Servicio extendido',

        description:
          `${gym.name} fue extendido ${monthsToAdd} mes(es).`,

        metadata: {

          months:
            monthsToAdd,

          previousNextPaymentDate:
            gym.subscription
              ?.nextPaymentDate ||
            null,

          nextPaymentDate

        }

      });


      // ==================================================
      // EVENTOS
      // ==================================================

      window.dispatchEvent(
        new Event(
          'nexgym-gyms-update'
        )
      );


      window.dispatchEvent(
        new Event(
          'nexgym-subscriptions-update'
        )
      );


      // ==================================================
      // RECARGAR
      // ==================================================

      const refreshed =
        await getNexgymCloudGymById(
          gymId
        );


      console.log(
        '✅ Servicio NEXGYM extendido en Supabase:',
        {

          gymId,

          months:
            monthsToAdd,

          nextPaymentDate

        }
      );


      return {

        success:
          true,

        months:
          monthsToAdd,

        nextPaymentDate,

        gym:
          refreshed.gym ||
          null

      };

    } catch (
      error
    ) {

      console.error(
        '❌ Error extendiendo servicio NEXGYM:',
        error
      );


      return {

        success:
          false,

        message:
          error?.message ||
          'No se pudo extender el servicio.'

      };

    }

  };


// ======================================================
// SUSPENDER GYM
// ======================================================

export const suspendNexgymCloudGym =
  async (
    gymId,
    reason = ''
  ) => {

    try {

      const gymResult =
        await getNexgymCloudGymById(
          gymId
        );


      if (
        !gymResult.success ||
        !gymResult.gym
      ) {

        return {

          success:
            false,

          message:
            'Gimnasio no encontrado.'

        };

      }


      const gym =
        gymResult.gym;


      const {
        error:
          gymError
      } =
        await supabase

          .from(
            'gyms'
          )

          .update({

            status:
              'suspended',

            subscription_status:
              'suspended'

          })

          .eq(
            'id',
            gymId
          );


      if (
        gymError
      ) {

        return {

          success:
            false,

          message:
            gymError.message

        };

      }


      const {
        error:
          subscriptionError
      } =
        await supabase

          .from(
            'gym_subscriptions'
          )

          .update({

            status:
              'suspended'

          })

          .eq(
            'gym_id',
            gymId
          );


      if (
        subscriptionError
      ) {

        console.warn(
          subscriptionError
        );

      }


      await addCloudActivity({

        gymId,

        type:
          'suspended',

        title:
          'Gimnasio suspendido',

        description:
          cleanText(
            reason
          )
            ? `${gym.name} fue suspendido. Motivo: ${cleanText(reason)}`
            : `${gym.name} fue suspendido.`

      });


      window.dispatchEvent(
        new Event(
          'nexgym-gyms-update'
        )
      );


      return {

        success:
          true

      };

    } catch (
      error
    ) {

      return {

        success:
          false,

        message:
          error?.message ||
          'No se pudo suspender el gimnasio.'

      };

    }

  };


// ======================================================
// REACTIVAR GYM
// ======================================================

export const reactivateNexgymCloudGym =
  async (
    gymId
  ) => {

    try {

      const gymResult =
        await getNexgymCloudGymById(
          gymId
        );


      if (
        !gymResult.success ||
        !gymResult.gym
      ) {

        return {

          success:
            false,

          message:
            'Gimnasio no encontrado.'

        };

      }


      const gym =
        gymResult.gym;


      const {
        error:
          gymError
      } =
        await supabase

          .from(
            'gyms'
          )

          .update({

            status:
              'active',

            subscription_status:
              'active'

          })

          .eq(
            'id',
            gymId
          );


      if (
        gymError
      ) {

        return {

          success:
            false,

          message:
            gymError.message

        };

      }


      await supabase

        .from(
          'gym_subscriptions'
        )

        .update({

          status:
            'active'

        })

        .eq(
          'gym_id',
          gymId
        );


      await addCloudActivity({

        gymId,

        type:
          'reactivated',

        title:
          'Gimnasio reactivado',

        description:
          `${gym.name} fue reactivado.`

      });


      window.dispatchEvent(
        new Event(
          'nexgym-gyms-update'
        )
      );


      return {

        success:
          true

      };

    } catch (
      error
    ) {

      return {

        success:
          false,

        message:
          error?.message ||
          'No se pudo reactivar el gimnasio.'

      };

    }

  };


// ======================================================
// DESACTIVAR GYM
// ======================================================

export const deactivateNexgymCloudGym =
  async (
    gymId,
    reason = ''
  ) => {

    try {

      const gymResult =
        await getNexgymCloudGymById(
          gymId
        );


      if (
        !gymResult.success ||
        !gymResult.gym
      ) {

        return {

          success:
            false,

          message:
            'Gimnasio no encontrado.'

        };

      }


      const gym =
        gymResult.gym;


      const {
        error:
          gymError
      } =
        await supabase

          .from(
            'gyms'
          )

          .update({

            status:
              'inactive',

            subscription_status:
              'suspended'

          })

          .eq(
            'id',
            gymId
          );


      if (
        gymError
      ) {

        return {

          success:
            false,

          message:
            gymError.message

        };

      }


      await supabase

        .from(
          'gym_subscriptions'
        )

        .update({

          status:
            'suspended'

        })

        .eq(
          'gym_id',
          gymId
        );


      await addCloudActivity({

        gymId,

        type:
          'deactivated',

        title:
          'Gimnasio desactivado',

        description:
          cleanText(
            reason
          )
            ? `${gym.name} fue desactivado. Motivo: ${cleanText(reason)}`
            : `${gym.name} fue desactivado.`

      });


      window.dispatchEvent(
        new Event(
          'nexgym-gyms-update'
        )
      );


      return {

        success:
          true

      };

    } catch (
      error
    ) {

      return {

        success:
          false,

        message:
          error?.message ||
          'No se pudo desactivar el gimnasio.'

      };

    }

  };


// ======================================================
// EXPORT
// ======================================================

export default {

  createNexgymGym,

  getNexgymCloudGyms,

  getNexgymCloudPayments,

  getNexgymCloudGymById,

  getNexgymCloudActivity,

  registerNexgymCloudPayment,

  extendNexgymCloudService,

  suspendNexgymCloudGym,

  reactivateNexgymCloudGym,

  deactivateNexgymCloudGym

};