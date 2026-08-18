// src/nexgym/services/nexgymGymService.js

import {
  getGymUsers,
  saveGymUsers,
  createGymUserId
} from '../../utils/gymSettings';

import {
  hashValue
} from '../../utils/memberId';

import {
  ALL_PERMISSIONS
} from '../../services/authService';


// ======================================================
// STORAGE
// ======================================================

export const NEXGYM_GYMS_KEY =
  'nexgym_gyms';

export const NEXGYM_ACTIVITY_KEY =
  'nexgym_activity';

const MEMBERS_STORAGE_KEY =
  'gym_control_members';


// ======================================================
// UTILIDADES
// ======================================================

const normalizeText = (
  value
) => {

  return String(
    value || ''
  ).trim();

};


const normalizeEmail = (
  value
) => {

  return normalizeText(
    value
  ).toLowerCase();

};


const createId = (
  prefix
) => {

  if (
    window.crypto?.randomUUID
  ) {

    return `${prefix}_${window.crypto.randomUUID()}`;

  }


  return (
    `${prefix}_${Date.now()}_` +
    Math.random()
      .toString(36)
      .substring(
        2,
        8
      )
  );

};


const toDateInputValue = (
  date
) => {

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      '0'
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      '0'
    );


  return `${year}-${month}-${day}`;

};


const parseDateValue = (
  value
) => {

  if (!value) {

    return null;

  }


  const date =
    new Date(
      `${value}T12:00:00`
    );


  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;

};


const addDays = (
  date,
  days
) => {

  const result =
    new Date(date);

  result.setDate(
    result.getDate() +
    Number(
      days || 0
    )
  );


  return result;

};


const addOneMonth = (
  date
) => {

  const result =
    new Date(date);

  result.setMonth(
    result.getMonth() + 1
  );


  return result;

};


// ======================================================
// LEER ARRAY
// ======================================================

const readArray = (
  key
) => {

  try {

    const raw =
      localStorage.getItem(
        key
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
      `Error leyendo ${key}:`,
      error
    );


    return [];

  }

};


// ======================================================
// GUARDAR ARRAY
// ======================================================

const saveArray = (
  key,
  data
) => {

  const safe =
    Array.isArray(
      data
    )
      ? data
      : [];


  localStorage.setItem(
    key,
    JSON.stringify(
      safe
    )
  );


  return safe;

};


// ======================================================
// ACTIVIDAD
// ======================================================

export const getNexgymActivity =
  () => {

    return readArray(
      NEXGYM_ACTIVITY_KEY
    );

  };


export const addNexgymActivity =
  ({
    gymId = null,
    gymName = '',
    type = 'system',
    title = '',
    description = ''
  }) => {

    const activity =
      getNexgymActivity();


    const record = {

      id:
        createId(
          'activity'
        ),

      gymId,

      gymName,

      type,

      title,

      description,

      date:
        new Date()
          .toISOString()

    };


    saveArray(
      NEXGYM_ACTIVITY_KEY,
      [
        record,
        ...activity
      ].slice(
        0,
        500
      )
    );


    window.dispatchEvent(
      new Event(
        'nexgym-activity-update'
      )
    );


    return record;

  };


// ======================================================
// OBTENER GIMNASIOS
// ======================================================

export const getNexgymGyms =
  () => {

    try {

      const raw =
        localStorage.getItem(
          NEXGYM_GYMS_KEY
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
        'Error leyendo gimnasios NEXGYM:',
        error
      );


      return [];

    }

  };


// ======================================================
// GUARDAR GIMNASIOS
// ======================================================

export const saveNexgymGyms =
  (
    gyms
  ) => {

    const safeGyms =
      Array.isArray(
        gyms
      )
        ? gyms
        : [];


    localStorage.setItem(
      NEXGYM_GYMS_KEY,
      JSON.stringify(
        safeGyms
      )
    );


    window.dispatchEvent(
      new Event(
        'nexgym-gyms-update'
      )
    );


    window.dispatchEvent(
      new Event(
        'gym-storage-update'
      )
    );


    return safeGyms;

  };


// ======================================================
// ACTUALIZAR VENCIDOS AUTOMÁTICAMENTE
// ======================================================

export const refreshNexgymSubscriptionStatuses =
  () => {

    const gyms =
      getNexgymGyms();


    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );


    let changed =
      false;


    const updated =
      gyms.map(
        gym => {

          const currentStatus =
            gym.subscription
              ?.status;


          const accountStatus =
            gym.access
              ?.accountStatus;


          // No tocar suspendidos o desactivados.
          if (
            currentStatus ===
              'suspended' ||
            accountStatus ===
              'inactive'
          ) {

            return gym;

          }


          // Periodo de prueba.
          if (
            currentStatus ===
            'trial'
          ) {

            const trialEnd =
              parseDateValue(
                gym.trial
                  ?.endDate
              );


            if (
              trialEnd &&
              trialEnd <
              today
            ) {

              changed =
                true;


              return {

                ...gym,

                trial: {

                  ...(gym.trial || {}),

                  active:
                    false

                },

                subscription: {

                  ...(gym.subscription || {}),

                  status:
                    'past_due'

                },

                updatedAt:
                  new Date()
                    .toISOString()

              };

            }


            return gym;

          }


          const nextPayment =
            parseDateValue(
              gym.subscription
                ?.nextPaymentDate
            );


          if (
            nextPayment &&
            nextPayment <
            today &&
            currentStatus ===
            'active'
          ) {

            changed =
              true;


            return {

              ...gym,

              subscription: {

                ...(gym.subscription || {}),

                status:
                  'past_due'

              },

              updatedAt:
                new Date()
                  .toISOString()

            };

          }


          return gym;

        }
      );


    if (changed) {

      saveNexgymGyms(
        updated
      );


      const users =
        getGymUsers();


      const updatedUsers =
        users.map(
          user => {

            const gym =
              updated.find(
                item =>
                  item.id ===
                  user.gymId
              );


            if (!gym) {

              return user;

            }


            return {

              ...user,

              gymStatus:
                gym.subscription
                  ?.status ||
                user.gymStatus

            };

          }
        );


      saveGymUsers(
        updatedUsers
      );

    }


    return updated;

  };


// ======================================================
// CÓDIGO SIGUIENTE
// ======================================================

export const createNextGymCode =
  () => {

    const gyms =
      getNexgymGyms();


    let highest =
      0;


    gyms.forEach(
      gym => {

        const match =
          String(
            gym.gymCode ||
            ''
          ).match(
            /^GYM-(\d{5})$/
          );


        if (match) {

          highest =
            Math.max(
              highest,
              Number(
                match[1]
              )
            );

        }

      }
    );


    return `GYM-${String(
      highest + 1
    ).padStart(
      5,
      '0'
    )}`;

  };


// ======================================================
// BUSCAR POR ID
// ======================================================

export const getNexgymGymById =
  (
    gymId
  ) => {

    refreshNexgymSubscriptionStatuses();


    return (
      getNexgymGyms().find(
        gym =>
          gym.id ===
          gymId
      ) ||
      null
    );

  };


// ======================================================
// BUSCAR POR CÓDIGO
// ======================================================

export const getNexgymGymByCode =
  (
    gymCode
  ) => {

    const normalized =
      normalizeText(
        gymCode
      ).toUpperCase();


    return (
      getNexgymGyms().find(
        gym =>
          String(
            gym.gymCode ||
            ''
          ).toUpperCase() ===
          normalized
      ) ||
      null
    );

  };


// ======================================================
// USUARIOS POR GIMNASIO
// ======================================================

export const getNexgymGymUsers =
  (
    gymId
  ) => {

    if (!gymId) {

      return [];

    }


    return getGymUsers().filter(
      user =>
        user.gymId ===
        gymId
    );

  };


// ======================================================
// MIEMBROS POR GIMNASIO
// ======================================================

export const getNexgymGymMembers =
  (
    gymId
  ) => {

    if (!gymId) {

      return [];

    }


    return readArray(
      MEMBERS_STORAGE_KEY
    ).filter(
      member =>
        member?.gymId ===
        gymId
    );

  };


// ======================================================
// ENRIQUECER
// ======================================================

export const enrichNexgymGym =
  (
    gym
  ) => {

    if (!gym) {

      return null;

    }


    const users =
      getNexgymGymUsers(
        gym.id
      );


    const members =
      getNexgymGymMembers(
        gym.id
      );


    return {

      ...gym,

      usersCount:
        users.length,

      membersCount:
        members.length,

      users,

      members

    };

  };


export const getNexgymGymsWithStats =
  () => {

    refreshNexgymSubscriptionStatuses();


    return getNexgymGyms()
      .map(
        gym =>
          enrichNexgymGym(
            gym
          )
      );

  };


export const getNexgymGymDetails =
  (
    gymId
  ) => {

    return enrichNexgymGym(
      getNexgymGymById(
        gymId
      )
    );

  };


// ======================================================
// SUSCRIPCIONES GLOBALES
// ======================================================

export const getNexgymSubscriptions =
  () => {

    return getNexgymGymsWithStats()
      .map(
        gym => {

          const nextPayment =
            parseDateValue(
              gym.subscription
                ?.nextPaymentDate
            );


          const today =
            new Date();

          today.setHours(
            0,
            0,
            0,
            0
          );


          let daysDifference =
            null;


          if (nextPayment) {

            nextPayment.setHours(
              0,
              0,
              0,
              0
            );


            daysDifference =
              Math.ceil(
                (
                  nextPayment -
                  today
                ) /
                (
                  1000 *
                  60 *
                  60 *
                  24
                )
              );

          }


          return {

            gymId:
              gym.id,

            gymCode:
              gym.gymCode,

            gymName:
              gym.name,

            ownerName:
              gym.owner?.name ||
              '',

            accessEmail:
              gym.access?.email ||
              '',

            accountStatus:
              gym.access
                ?.accountStatus ||
              'active',

            status:
              gym.access
                  ?.accountStatus ===
                'inactive'
                ? 'inactive'
                : gym.subscription
                    ?.status ||
                  'active',

            price:
              Number(
                gym.subscription
                  ?.price ||
                0
              ),

            discount:
              Number(
                gym.subscription
                  ?.discount ||
                0
              ),

            finalPrice:
              Number(
                gym.subscription
                  ?.finalPrice ||
                0
              ),

            startDate:
              gym.subscription
                ?.startDate ||
              null,

            nextPaymentDate:
              gym.subscription
                ?.nextPaymentDate ||
              null,

            trialEndDate:
              gym.trial?.endDate ||
              null,

            daysDifference,

            membersCount:
              gym.membersCount ||
              0,

            usersCount:
              gym.usersCount ||
              0

          };

        }
      );

  };


// ======================================================
// PAGOS GLOBALES
// ======================================================

export const getAllNexgymPayments =
  () => {

    const gyms =
      getNexgymGyms();


    const payments =
      [];


    gyms.forEach(
      gym => {

        const gymPayments =
          Array.isArray(
            gym.payments
          )
            ? gym.payments
            : [];


        gymPayments.forEach(
          payment => {

            payments.push({

              ...payment,

              gymId:
                gym.id,

              gymCode:
                gym.gymCode,

              gymName:
                gym.name,

              ownerName:
                gym.owner?.name ||
                ''

            });

          }
        );

      }
    );


    return payments.sort(
      (
        a,
        b
      ) => {

        const dateA =
          new Date(
            a.createdAt ||
            `${a.date}T12:00:00`
          ).getTime();


        const dateB =
          new Date(
            b.createdAt ||
            `${b.date}T12:00:00`
          ).getTime();


        return (
          dateB -
          dateA
        );

      }
    );

  };


// ======================================================
// CREAR GIMNASIO
// ======================================================

export const createNexgymGym =
  async (
    data
  ) => {

    try {

      const name =
        normalizeText(
          data?.name
        );

      const phone =
        normalizeText(
          data?.phone
        );

      const address =
        normalizeText(
          data?.address
        );

      const city =
        normalizeText(
          data?.city
        );

      const state =
        normalizeText(
          data?.state
        );


      const ownerName =
        normalizeText(
          data?.owner
            ?.name
        );

      const ownerEmail =
        normalizeEmail(
          data?.owner
            ?.email
        );

      const ownerPhone =
        normalizeText(
          data?.owner
            ?.phone
        );


      const accessEmail =
        normalizeEmail(
          data?.access
            ?.email
        );

      const accessPassword =
        String(
          data?.access
            ?.password ||
          ''
        );


      if (!name) {

        return {
          success: false,
          code: 'GYM_NAME_REQUIRED',
          message:
            'Ingresa el nombre del gimnasio.'
        };

      }


      if (!ownerName) {

        return {
          success: false,
          code: 'OWNER_REQUIRED',
          message:
            'Ingresa el nombre del propietario.'
        };

      }


      if (!accessEmail) {

        return {
          success: false,
          code: 'ACCESS_EMAIL_REQUIRED',
          message:
            'Ingresa el correo de acceso.'
        };

      }


      if (
        accessPassword.length <
        8
      ) {

        return {
          success: false,
          code: 'PASSWORD_TOO_SHORT',
          message:
            'La contraseña debe tener al menos 8 caracteres.'
        };

      }


      const users =
        getGymUsers();


      const emailExists =
        users.some(
          user =>
            normalizeEmail(
              user.email
            ) ===
            accessEmail
        );


      if (emailExists) {

        return {
          success: false,
          code: 'EMAIL_EXISTS',
          message:
            'Ese correo ya está registrado como usuario del sistema.'
        };

      }


      const gymId =
        createId(
          'gym'
        );

      const gymCode =
        createNextGymCode();


      const now =
        new Date();

      const nowISO =
        now.toISOString();


      const normalPrice =
        Math.max(
          0,
          Number(
            data?.subscription
              ?.price ||
            0
          )
        );


      const discount =
        Math.max(
          0,
          Number(
            data?.subscription
              ?.discount ||
            0
          )
        );


      const finalPrice =
        Math.max(
          0,
          normalPrice -
          discount
        );


      const trialDays =
        Math.max(
          0,
          Number(
            data?.trialDays ||
            0
          )
        );


      const hasTrial =
        trialDays >
        0;


      const trialEnd =
        hasTrial
          ? addDays(
              now,
              trialDays
            )
          : null;


      const subscriptionStatus =
        hasTrial
          ? 'trial'
          : 'active';


      const gym = {

        id:
          gymId,

        gymCode,

        name,

        phone,

        address,

        city,

        state,


        owner: {

          name:
            ownerName,

          email:
            ownerEmail,

          phone:
            ownerPhone

        },


        access: {

          email:
            accessEmail,

          accountStatus:
            'active',

          mustChangePassword:
            true,

          lastLoginAt:
            null,

          suspendedAt:
            null,

          suspendedReason:
            '',

          deactivatedAt:
            null,

          deactivatedReason:
            ''

        },


        subscription: {

          price:
            normalPrice,

          billingCycle:
            'monthly',

          status:
            subscriptionStatus,

          startDate:
            hasTrial
              ? null
              : toDateInputValue(
                  now
                ),

          nextPaymentDate:
            hasTrial
              ? toDateInputValue(
                  trialEnd
                )
              : toDateInputValue(
                  addOneMonth(
                    now
                  )
                ),

          discount,

          finalPrice

        },


        trial: {

          active:
            hasTrial,

          startDate:
            hasTrial
              ? toDateInputValue(
                  now
                )
              : null,

          endDate:
            hasTrial
              ? toDateInputValue(
                  trialEnd
                )
              : null

        },


        storageMB:
          0,

        lastConnectionAt:
          null,

        createdAt:
          nowISO,

        updatedAt:
          nowISO,

        payments:
          [],

        notes:
          []

      };


      const passwordHash =
        await hashValue(
          accessPassword
        );


      const ownerUser = {

        id:
          createGymUserId(),

        gymId,

        gymCode,

        gymName:
          name,

        name:
          ownerName,

        email:
          accessEmail,

        passwordHash,

        role:
          'owner',

        permissions: [
          ...ALL_PERMISSIONS
        ],

        status:
          'active',

        gymStatus:
          subscriptionStatus,

        mustChangePassword:
          true,

        createdAt:
          nowISO,

        updatedAt:
          nowISO,

        lastAccessAt:
          null,

        passwordUpdatedAt:
          null

      };


      saveNexgymGyms([
        ...getNexgymGyms(),
        gym
      ]);


      saveGymUsers([
        ...users,
        ownerUser
      ]);


      addNexgymActivity({

        gymId,

        gymName:
          name,

        type:
          'gym_created',

        title:
          'Nuevo gimnasio',

        description:
          `${name} fue registrado en NEXGYM.`

      });


      return {

        success:
          true,

        code:
          'GYM_CREATED',

        message:
          'Gimnasio creado correctamente.',

        gym,

        user: {

          ...ownerUser,

          passwordHash:
            undefined

        }

      };

    } catch (error) {

      console.error(
        'Error creando gimnasio:',
        error
      );


      return {

        success:
          false,

        code:
          'CREATE_GYM_ERROR',

        message:
          'No se pudo crear el gimnasio.'

      };

    }

  };


// ======================================================
// ACTUALIZAR USUARIOS DEL GIMNASIO
// ======================================================

const updateUsersGymStatus =
  (
    gymId,
    gymStatus
  ) => {

    const users =
      getGymUsers();


    const now =
      new Date()
        .toISOString();


    const updated =
      users.map(
        user => {

          if (
            user.gymId !==
            gymId
          ) {

            return user;

          }


          return {

            ...user,

            gymStatus,

            updatedAt:
              now

          };

        }
      );


    saveGymUsers(
      updated
    );


    return updated;

  };


// ======================================================
// SUSPENDER
// ======================================================

export const suspendNexgymGym =
  (
    gymId,
    reason = ''
  ) => {

    const gym =
      getNexgymGymById(
        gymId
      );


    if (!gym) {

      return {
        success: false,
        message:
          'Gimnasio no encontrado.'
      };

    }


    const now =
      new Date()
        .toISOString();


    const updated = {

      ...gym,

      access: {

        ...(gym.access || {}),

        accountStatus:
          'suspended',

        suspendedAt:
          now,

        suspendedReason:
          normalizeText(
            reason
          )

      },

      subscription: {

        ...(gym.subscription || {}),

        status:
          'suspended'

      },

      updatedAt:
        now

    };


    saveNexgymGyms(
      getNexgymGyms().map(
        item =>
          item.id ===
          gymId
            ? updated
            : item
      )
    );


    updateUsersGymStatus(
      gymId,
      'suspended'
    );


    addNexgymActivity({

      gymId,

      gymName:
        gym.name,

      type:
        'suspended',

      title:
        'Servicio suspendido',

      description:
        reason
          ? `${gym.name}: ${reason}`
          : `${gym.name} fue suspendido.`

    });


    return {
      success: true,
      gym: updated
    };

  };


// ======================================================
// REACTIVAR
// ======================================================

export const reactivateNexgymGym =
  (
    gymId
  ) => {

    const gym =
      getNexgymGymById(
        gymId
      );


    if (!gym) {

      return {
        success: false,
        message:
          'Gimnasio no encontrado.'
      };

    }


    const now =
      new Date()
        .toISOString();


    const updated = {

      ...gym,

      access: {

        ...(gym.access || {}),

        accountStatus:
          'active',

        suspendedAt:
          null,

        suspendedReason:
          '',

        deactivatedAt:
          null,

        deactivatedReason:
          ''

      },

      subscription: {

        ...(gym.subscription || {}),

        status:
          'active'

      },

      trial: {

        ...(gym.trial || {}),

        active:
          false

      },

      updatedAt:
        now

    };


    saveNexgymGyms(
      getNexgymGyms().map(
        item =>
          item.id ===
          gymId
            ? updated
            : item
      )
    );


    updateUsersGymStatus(
      gymId,
      'active'
    );


    addNexgymActivity({

      gymId,

      gymName:
        gym.name,

      type:
        'reactivated',

      title:
        'Servicio reactivado',

      description:
        `${gym.name} volvió a estar activo.`

    });


    return {
      success: true,
      gym: updated
    };

  };


// ======================================================
// DESACTIVAR
// ======================================================

export const deactivateNexgymGym =
  (
    gymId,
    reason = ''
  ) => {

    const gym =
      getNexgymGymById(
        gymId
      );


    if (!gym) {

      return {
        success: false,
        message:
          'Gimnasio no encontrado.'
      };

    }


    const now =
      new Date()
        .toISOString();


    const updated = {

      ...gym,

      access: {

        ...(gym.access || {}),

        accountStatus:
          'inactive',

        deactivatedAt:
          now,

        deactivatedReason:
          normalizeText(
            reason
          )

      },

      subscription: {

        ...(gym.subscription || {}),

        status:
          'suspended'

      },

      updatedAt:
        now

    };


    saveNexgymGyms(
      getNexgymGyms().map(
        item =>
          item.id ===
          gymId
            ? updated
            : item
      )
    );


    updateUsersGymStatus(
      gymId,
      'suspended'
    );


    addNexgymActivity({

      gymId,

      gymName:
        gym.name,

      type:
        'deactivated',

      title:
        'Cliente desactivado',

      description:
        reason
          ? `${gym.name}: ${reason}`
          : `${gym.name} fue desactivado.`

    });


    return {
      success: true,
      gym: updated
    };

  };


// ======================================================
// PASSWORD
// ======================================================

export const resetNexgymGymPassword =
  async (
    gymId,
    newPassword
  ) => {

    try {

      const gym =
        getNexgymGymById(
          gymId
        );


      if (!gym) {

        return {
          success: false,
          message:
            'Gimnasio no encontrado.'
        };

      }


      const password =
        String(
          newPassword ||
          ''
        );


      if (
        password.length <
        8
      ) {

        return {
          success: false,
          message:
            'La contraseña debe tener al menos 8 caracteres.'
        };

      }


      const users =
        getGymUsers();


      const passwordHash =
        await hashValue(
          password
        );


      let ownerFound =
        false;


      const now =
        new Date()
          .toISOString();


      const updatedUsers =
        users.map(
          user => {

            if (
              user.gymId !==
                gymId ||
              user.role !==
                'owner'
            ) {

              return user;

            }


            ownerFound =
              true;


            return {

              ...user,

              passwordHash,

              mustChangePassword:
                true,

              passwordUpdatedAt:
                now,

              updatedAt:
                now

            };

          }
        );


      if (!ownerFound) {

        return {
          success: false,
          message:
            'No se encontró al propietario.'
        };

      }


      saveGymUsers(
        updatedUsers
      );


      saveNexgymGyms(
        getNexgymGyms().map(
          item =>
            item.id ===
            gymId
              ? {
                  ...item,

                  access: {

                    ...(item.access || {}),

                    mustChangePassword:
                      true

                  },

                  updatedAt:
                    now

                }
              : item
        )
      );


      addNexgymActivity({

        gymId,

        gymName:
          gym.name,

        type:
          'password_reset',

        title:
          'Contraseña restablecida',

        description:
          `Se asignó una nueva contraseña temporal a ${gym.name}.`

      });


      return {
        success: true
      };

    } catch (error) {

      console.error(
        error
      );


      return {
        success: false,
        message:
          'No se pudo restablecer la contraseña.'
      };

    }

  };


// ======================================================
// REGISTRAR PAGO
// ======================================================

export const registerNexgymPayment =
  (
    gymId,
    paymentData = {}
  ) => {

    const gym =
      getNexgymGymById(
        gymId
      );


    if (!gym) {

      return {
        success: false,
        message:
          'Gimnasio no encontrado.'
      };

    }


    const amount =
      Math.max(
        0,
        Number(
          paymentData.amount ||
          gym.subscription
            ?.finalPrice ||
          0
        )
      );


    if (
      amount <=
      0
    ) {

      return {
        success: false,
        message:
          'Ingresa un importe válido.'
      };

    }


    const now =
      new Date();


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
      toDateInputValue(
        addOneMonth(
          baseDate
        )
      );


    const payment = {

      id:
        createId(
          'payment'
        ),

      date:
        paymentData.date ||
        toDateInputValue(
          now
        ),

      amount,

      status:
        'paid',

      method:
        normalizeText(
          paymentData.method ||
          'Efectivo'
        ),

      reference:
        normalizeText(
          paymentData.reference
        ),

      notes:
        normalizeText(
          paymentData.notes
        ),

      createdAt:
        now.toISOString()

    };


    const wasInactive =
      gym.access
        ?.accountStatus ===
      'inactive';


    const updated = {

      ...gym,

      payments: [
        payment,
        ...(
          Array.isArray(
            gym.payments
          )
            ? gym.payments
            : []
        )
      ],

      subscription: {

        ...(gym.subscription || {}),

        status:
          wasInactive
            ? 'suspended'
            : 'active',

        startDate:
          gym.subscription
            ?.startDate ||
          toDateInputValue(
            now
          ),

        nextPaymentDate

      },

      trial: {

        ...(gym.trial || {}),

        active:
          false

      },

      access: {

        ...(gym.access || {}),

        accountStatus:
          wasInactive
            ? 'inactive'
            : 'active'

      },

      updatedAt:
        now.toISOString()

    };


    saveNexgymGyms(
      getNexgymGyms().map(
        item =>
          item.id ===
          gymId
            ? updated
            : item
      )
    );


    if (!wasInactive) {

      updateUsersGymStatus(
        gymId,
        'active'
      );

    }


    addNexgymActivity({

      gymId,

      gymName:
        gym.name,

      type:
        'payment',

      title:
        'Pago recibido',

      description:
        `${gym.name} pagó $${amount.toFixed(2)} MXN.`

    });


    return {

      success: true,

      payment,

      gym: updated

    };

  };


// ======================================================
// EXTENDER
// ======================================================

export const extendNexgymService =
  (
    gymId,
    months = 1
  ) => {

    const gym =
      getNexgymGymById(
        gymId
      );


    if (!gym) {

      return {
        success: false,
        message:
          'Gimnasio no encontrado.'
      };

    }


    const quantity =
      Math.max(
        1,
        Number(
          months ||
          1
        )
      );


    const now =
      new Date();


    const currentNext =
      parseDateValue(
        gym.subscription
          ?.nextPaymentDate
      );


    let date =
      currentNext &&
      currentNext >
      now
        ? currentNext
        : now;


    for (
      let index = 0;
      index < quantity;
      index += 1
    ) {

      date =
        addOneMonth(
          date
        );

    }


    const updated = {

      ...gym,

      subscription: {

        ...(gym.subscription || {}),

        nextPaymentDate:
          toDateInputValue(
            date
          )

      },

      updatedAt:
        now.toISOString()

    };


    saveNexgymGyms(
      getNexgymGyms().map(
        item =>
          item.id ===
          gymId
            ? updated
            : item
      )
    );


    addNexgymActivity({

      gymId,

      gymName:
        gym.name,

      type:
        'service_extended',

      title:
        'Servicio extendido',

      description:
        `Se extendió el servicio de ${gym.name} por ${quantity} mes(es).`

    });


    return {
      success: true,
      gym: updated
    };

  };


// ======================================================
// NOTA
// ======================================================

export const addNexgymGymNote =
  (
    gymId,
    content,
    author =
      'Super Administrador'
  ) => {

    const gym =
      getNexgymGymById(
        gymId
      );


    if (!gym) {

      return {
        success: false,
        message:
          'Gimnasio no encontrado.'
      };

    }


    const cleanContent =
      normalizeText(
        content
      );


    if (!cleanContent) {

      return {
        success: false,
        message:
          'Escribe una nota.'
      };

    }


    const note = {

      id:
        createId(
          'note'
        ),

      date:
        new Date()
          .toISOString(),

      author:
        normalizeText(
          author
        ) ||
        'Super Administrador',

      content:
        cleanContent

    };


    const updated = {

      ...gym,

      notes: [
        note,
        ...(
          Array.isArray(
            gym.notes
          )
            ? gym.notes
            : []
        )
      ],

      updatedAt:
        new Date()
          .toISOString()

    };


    saveNexgymGyms(
      getNexgymGyms().map(
        item =>
          item.id ===
          gymId
            ? updated
            : item
      )
    );


    return {

      success: true,

      note,

      gym: updated

    };

  };


// ======================================================
// ÚLTIMA CONEXIÓN
// ======================================================

export const updateGymLastConnection =
  (
    gymId,
    date =
      new Date()
        .toISOString()
  ) => {

    const gym =
      getNexgymGymById(
        gymId
      );


    if (!gym) {

      return null;

    }


    const updated = {

      ...gym,

      lastConnectionAt:
        date,

      access: {

        ...(gym.access || {}),

        lastLoginAt:
          date

      },

      updatedAt:
        date

    };


    saveNexgymGyms(
      getNexgymGyms().map(
        item =>
          item.id ===
          gymId
            ? updated
            : item
      )
    );


    return updated;

  };