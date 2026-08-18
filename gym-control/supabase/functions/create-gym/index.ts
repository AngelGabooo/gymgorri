// supabase/functions/create-gym/index.ts

import "@supabase/functions-js/edge-runtime.d.ts";

import {
  withSupabase
} from "@supabase/server";


// ======================================================
// TIPOS
// ======================================================

type BillingCycle =
  | "monthly"
  | "quarterly"
  | "semiannual"
  | "annual";


type SubscriptionStatus =
  | "trial"
  | "active"
  | "past_due"
  | "suspended"
  | "cancelled"
  | "expired";


type CreateGymBody = {

  gym?: {

    name?: string;

    phone?: string;

    address?: string;

    city?: string;

    state?: string;

  };


  owner?: {

    name?: string;

    email?: string;

    phone?: string;

  };


  access?: {

    email?: string;

    password?: string;

  };


  subscription?: {

    status?: SubscriptionStatus;

    billingCycle?: BillingCycle;

    regularPrice?: number;

    discount?: number;

    finalPrice?: number;

    startDate?: string | null;

    nextPaymentDate?: string | null;

    trialStartDate?: string | null;

    trialEndDate?: string | null;

  };

};


// ======================================================
// CONSTANTES
// ======================================================

const BILLING_CYCLES:
  BillingCycle[] = [

    "monthly",

    "quarterly",

    "semiannual",

    "annual"

  ];


const SUBSCRIPTION_STATUSES:
  SubscriptionStatus[] = [

    "trial",

    "active",

    "past_due",

    "suspended",

    "cancelled",

    "expired"

  ];


// ======================================================
// HELPERS
// ======================================================

const cleanText =
  (
    value: unknown
  ) => {

    return String(
      value ??
      ""
    ).trim();

  };


// ======================================================
// NORMALIZAR EMAIL
// ======================================================

const normalizeEmail =
  (
    value: unknown
  ) => {

    return cleanText(
      value
    ).toLowerCase();

  };


// ======================================================
// DINERO
// ======================================================

const toMoney =
  (
    value: unknown
  ) => {

    const numeric =
      Number(
        value ??
        0
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
// EMAIL VÁLIDO
// ======================================================

const isValidEmail =
  (
    email: string
  ) => {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(
        email
      );

  };


// ======================================================
// PASSWORD VÁLIDO
// ======================================================

const isValidPassword =
  (
    password: string
  ) => {

    return password.length >=
      8;

  };


// ======================================================
// GENERAR CÓDIGO DE GIMNASIO
// ======================================================
//
// Ejemplo:
//
// NXG-A1B2C3D4
//
// ======================================================

const createGymCode =
  () => {

    const random =
      crypto
        .randomUUID()
        .replaceAll(
          "-",
          ""
        )
        .slice(
          0,
          8
        )
        .toUpperCase();


    return `NXG-${random}`;

  };


// ======================================================
// RESPUESTA DE ERROR
// ======================================================

const errorResponse =
  (
    message: string,
    status = 400,
    code = "ERROR",
    details?: unknown
  ) => {

    return Response.json(
      {

        success:
          false,

        code,

        message,

        details:
          details ??
          null

      },
      {
        status
      }
    );

  };


// ======================================================
// FUNCIÓN
// ======================================================

export default {

  fetch:
    withSupabase(
      {

        auth:
          "user"

      },

      async (
        req,
        ctx
      ) => {

        // ==================================================
        // 1. SOLO POST
        // ==================================================

        if (
          req.method !==
          "POST"
        ) {

          return errorResponse(
            "Método no permitido.",
            405,
            "METHOD_NOT_ALLOWED"
          );

        }


// ==================================================
// 2. USUARIO AUTENTICADO
// ==================================================
//
// @supabase/server ya validó el JWT porque usamos:
//
// auth: "user"
//
// userClaims.id contiene el UUID del usuario
// autenticado.
//
// jwtClaims.sub queda como respaldo.
//
// ==================================================

const authUserId =
  ctx.userClaims?.id ||
  ctx.jwtClaims?.sub ||
  null;


if (
  !authUserId
) {

  console.error(
    "❌ No se pudo obtener authUserId:",
    {
      userClaims:
        ctx.userClaims,

      jwtClaims:
        ctx.jwtClaims,

      authMode:
        ctx.authMode
    }
  );


  return errorResponse(
    "No se pudo identificar al usuario autenticado.",
    401,
    "NOT_AUTHENTICATED"
  );

}


        // ==================================================
        // 3. VALIDAR SUPER ADMIN NEXGYM
        // ==================================================

        const {
          data:
            nexgymAdmin,

          error:
            nexgymAdminError
        } =
          await ctx.supabaseAdmin

            .from(
              "nexgym_admins"
            )

            .select(
              `
                id,
                user_id,
                name,
                email,
                role,
                status
              `
            )

            .eq(
              "user_id",
              authUserId
            )

            .maybeSingle();


        if (
          nexgymAdminError
        ) {

          console.error(
            "❌ Error consultando nexgym_admins:",
            nexgymAdminError
          );


          return errorResponse(
            "No se pudo validar al administrador NEXGYM.",
            500,
            "ADMIN_VALIDATION_ERROR"
          );

        }


        if (
          !nexgymAdmin
        ) {

          return errorResponse(
            "Tu cuenta no pertenece a los administradores de NEXGYM.",
            403,
            "NOT_NEXGYM_ADMIN"
          );

        }


        if (
          nexgymAdmin.role !==
            "super_admin" ||
          nexgymAdmin.status !==
            "active"
        ) {

          return errorResponse(
            "Tu cuenta no tiene permisos para registrar gimnasios.",
            403,
            "FORBIDDEN"
          );

        }


        // ==================================================
        // 4. LEER BODY
        // ==================================================

        let body:
          CreateGymBody;


        try {

          body =
            await req.json();

        } catch {

          return errorResponse(
            "El cuerpo de la solicitud no es válido.",
            400,
            "INVALID_BODY"
          );

        }


        // ==================================================
        // 5. DATOS DEL GIMNASIO
        // ==================================================

        const gymName =
          cleanText(
            body?.gym?.name
          );


        const gymPhone =
          cleanText(
            body?.gym?.phone
          );


        const gymAddress =
          cleanText(
            body?.gym?.address
          );


        const gymCity =
          cleanText(
            body?.gym?.city
          );


        const gymState =
          cleanText(
            body?.gym?.state
          );


        // ==================================================
        // 6. DATOS DEL PROPIETARIO
        // ==================================================

        const ownerName =
          cleanText(
            body?.owner?.name
          );


        const ownerEmail =
          normalizeEmail(
            body?.owner?.email
          );


        const ownerPhone =
          cleanText(
            body?.owner?.phone
          );


        // ==================================================
        // 7. DATOS DE ACCESO
        // ==================================================

        const accessEmail =
          normalizeEmail(
            body?.access?.email
          );


        const accessPassword =
          cleanText(
            body?.access?.password
          );


        // ==================================================
        // 8. VALIDACIONES
        // ==================================================

        if (
          !gymName
        ) {

          return errorResponse(
            "El nombre del gimnasio es obligatorio.",
            400,
            "GYM_NAME_REQUIRED"
          );

        }


        if (
          !ownerName
        ) {

          return errorResponse(
            "El nombre del propietario es obligatorio.",
            400,
            "OWNER_NAME_REQUIRED"
          );

        }


        // ==================================================
        // CORREO DEL PROPIETARIO
        // ==================================================
        //
        // Puede quedar vacío.
        //
        // Solamente validamos formato cuando fue enviado.
        //
        // ==================================================

        if (
          ownerEmail &&
          !isValidEmail(
            ownerEmail
          )
        ) {

          return errorResponse(
            "El correo del propietario no es válido.",
            400,
            "OWNER_EMAIL_INVALID"
          );

        }


        // ==================================================
        // CORREO DE ACCESO
        // ==================================================

        if (
          !accessEmail ||
          !isValidEmail(
            accessEmail
          )
        ) {

          return errorResponse(
            "El correo de acceso no es válido.",
            400,
            "ACCESS_EMAIL_INVALID"
          );

        }


        // ==================================================
        // CONTRASEÑA
        // ==================================================

        if (
          !accessPassword ||
          !isValidPassword(
            accessPassword
          )
        ) {

          return errorResponse(
            "La contraseña temporal debe tener al menos 8 caracteres.",
            400,
            "ACCESS_PASSWORD_INVALID"
          );

        }


        // ==================================================
        // 9. SUSCRIPCIÓN
        // ==================================================

        const requestedStatus =
          body?.subscription
            ?.status ||
          "active";


        const requestedBillingCycle =
          body?.subscription
            ?.billingCycle ||
          "monthly";


        if (
          !SUBSCRIPTION_STATUSES
            .includes(
              requestedStatus
            )
        ) {

          return errorResponse(
            "El estado de la suscripción no es válido.",
            400,
            "INVALID_SUBSCRIPTION_STATUS"
          );

        }


        if (
          !BILLING_CYCLES
            .includes(
              requestedBillingCycle
            )
        ) {

          return errorResponse(
            "El ciclo de facturación no es válido.",
            400,
            "INVALID_BILLING_CYCLE"
          );

        }


        const regularPrice =
          toMoney(
            body?.subscription
              ?.regularPrice
          );


        const discount =
          toMoney(
            body?.subscription
              ?.discount
          );


        let finalPrice =
          body?.subscription
            ?.finalPrice !==
            undefined

            ? toMoney(
                body.subscription
                  .finalPrice
              )

            : Math.max(
                0,
                regularPrice -
                discount
              );


        finalPrice =
          Number(
            finalPrice.toFixed(
              2
            )
          );


        // ==================================================
        // 10. EVITAR CORREO DE ACCESO DUPLICADO
        // ==================================================

        const {
          data:
            existingGymUser,

          error:
            existingGymUserError
        } =
          await ctx.supabaseAdmin

            .from(
              "gym_users"
            )

            .select(
              `
                id,
                email,
                gym_id
              `
            )

            .ilike(
              "email",
              accessEmail
            )

            .maybeSingle();


        if (
          existingGymUserError
        ) {

          console.error(
            "❌ Error verificando correo existente:",
            existingGymUserError
          );


          return errorResponse(
            "No se pudo validar si el correo de acceso ya está registrado.",
            500,
            "ACCESS_EMAIL_CHECK_FAILED"
          );

        }


        if (
          existingGymUser
        ) {

          return errorResponse(
            "Ya existe un usuario de gimnasio con ese correo de acceso.",
            409,
            "ACCESS_EMAIL_EXISTS"
          );

        }


        // ==================================================
        // 11. GENERAR CÓDIGO
        // ==================================================

        let gymCode =
          createGymCode();


        let validGymCode =
          false;


        for (
          let attempt = 0;
          attempt < 5;
          attempt++
        ) {

          const {
            data:
              existingGymCode,

            error:
              gymCodeCheckError
          } =
            await ctx.supabaseAdmin

              .from(
                "gyms"
              )

              .select(
                "id"
              )

              .eq(
                "gym_code",
                gymCode
              )

              .maybeSingle();


          if (
            gymCodeCheckError
          ) {

            console.error(
              "❌ Error comprobando gym_code:",
              gymCodeCheckError
            );


            return errorResponse(
              "No se pudo generar el código del gimnasio.",
              500,
              "GYM_CODE_CHECK_FAILED"
            );

          }


          if (
            !existingGymCode
          ) {

            validGymCode =
              true;

            break;

          }


          gymCode =
            createGymCode();

        }


        if (
          !validGymCode
        ) {

          return errorResponse(
            "No se pudo generar un código único para el gimnasio.",
            500,
            "GYM_CODE_GENERATION_FAILED"
          );

        }


        // ==================================================
        // 12. VARIABLES PARA ROLLBACK
        // ==================================================

        let createdAuthUserId:
          string |
          null =
          null;


        let createdGymId:
          string |
          null =
          null;


        try {

          // ==================================================
          // 13. CREAR USUARIO EN SUPABASE AUTH
          // ==================================================
          //
          // IMPORTANTE:
          //
          // Utilizamos accessEmail.
          //
          // NO ownerEmail.
          //
          // ==================================================

          const {
            data:
              authUserData,

            error:
              authUserError
          } =
            await ctx.supabaseAdmin
              .auth
              .admin
              .createUser({

                email:
                  accessEmail,

                password:
                  accessPassword,

                email_confirm:
                  true,

                user_metadata: {

                  name:
                    ownerName,

                  ownerEmail:
                    ownerEmail ||
                    null,

                  phone:
                    ownerPhone ||
                    null,

                  gymName,

                  gymCode,

                  source:
                    "nexgym_create_gym"

                }

              });


          if (
            authUserError
          ) {

            console.error(
              "❌ Error creando usuario Auth:",
              authUserError
            );


            return errorResponse(
              authUserError.message ||
              "No se pudo crear el usuario de acceso.",
              409,
              "AUTH_USER_CREATE_FAILED"
            );

          }


          const authUser =
            authUserData?.user;


          if (
            !authUser?.id
          ) {

            return errorResponse(
              "Supabase Auth no devolvió el usuario creado.",
              500,
              "AUTH_USER_NOT_RETURNED"
            );

          }


          createdAuthUserId =
            authUser.id;


          // ==================================================
          // 14. CREAR GIMNASIO
          // ==================================================

          const isTrial =
            requestedStatus ===
            "trial";


          const {
            data:
              gym,

            error:
              gymError
          } =
            await ctx.supabaseAdmin

              .from(
                "gyms"
              )

              .insert({

                gym_code:
                  gymCode,

                name:
                  gymName,

                phone:
                  gymPhone ||
                  null,

                address:
                  gymAddress ||
                  null,

                city:
                  gymCity ||
                  null,

                state:
                  gymState ||
                  null,

                status:
                  isTrial
                    ? "trial"
                    : "active",

                owner_name:
                  ownerName,

                owner_email:
                  ownerEmail ||
                  null,

                owner_phone:
                  ownerPhone ||
                  null,

                subscription_status:
                  requestedStatus,

                subscription_price:
                  regularPrice,

                subscription_discount:
                  discount,

                subscription_final_price:
                  finalPrice,

                subscription_start_date:
                  body?.subscription
                    ?.startDate ||
                  null,

                subscription_next_payment_date:
                  body?.subscription
                    ?.nextPaymentDate ||
                  null,

                trial_active:
                  isTrial,

                trial_start_date:
                  body?.subscription
                    ?.trialStartDate ||
                  null,

                trial_end_date:
                  body?.subscription
                    ?.trialEndDate ||
                  null

              })

              .select(
                `
                  id,
                  gym_code,
                  name,
                  phone,
                  address,
                  city,
                  state,
                  status,
                  owner_name,
                  owner_email,
                  owner_phone,
                  subscription_status,
                  subscription_price,
                  subscription_discount,
                  subscription_final_price,
                  subscription_start_date,
                  subscription_next_payment_date,
                  trial_active,
                  trial_start_date,
                  trial_end_date,
                  created_at,
                  updated_at
                `
              )

              .single();


          if (
            gymError
          ) {

            throw new Error(
              `No se pudo crear el gimnasio: ${gymError.message}`
            );

          }


          createdGymId =
            gym.id;


          // ==================================================
          // 15. CREAR GYM USER
          // ==================================================

          const {
            data:
              gymUser,

            error:
              gymUserError
          } =
            await ctx.supabaseAdmin

              .from(
                "gym_users"
              )

              .insert({

                user_id:
                  createdAuthUserId,

                gym_id:
                  createdGymId,

                name:
                  ownerName,

                // ==========================================
                // ESTE ES EL EMAIL PARA LOGIN
                // ==========================================

                email:
                  accessEmail,

                role:
                  "owner",

                status:
                  "active",

                permissions:
                  [],

                must_change_password:
                  true

              })

              .select(
                `
                  id,
                  user_id,
                  gym_id,
                  name,
                  email,
                  role,
                  status,
                  permissions,
                  must_change_password,
                  last_access_at,
                  created_at,
                  updated_at
                `
              )

              .single();


          if (
            gymUserError
          ) {

            throw new Error(
              `No se pudo vincular el propietario al gimnasio: ${gymUserError.message}`
            );

          }


          // ==================================================
          // 16. CREAR SUSCRIPCIÓN
          // ==================================================

          const {
            data:
              subscription,

            error:
              subscriptionError
          } =
            await ctx.supabaseAdmin

              .from(
                "gym_subscriptions"
              )

              .insert({

                gym_id:
                  createdGymId,

                status:
                  requestedStatus,

                billing_cycle:
                  requestedBillingCycle,

                regular_price:
                  regularPrice,

                discount,

                final_price:
                  finalPrice,

                currency:
                  "MXN",

                start_date:
                  body?.subscription
                    ?.startDate ||
                  null,

                next_payment_date:
                  body?.subscription
                    ?.nextPaymentDate ||
                  null,

                trial_start_date:
                  body?.subscription
                    ?.trialStartDate ||
                  null,

                trial_end_date:
                  body?.subscription
                    ?.trialEndDate ||
                  null

              })

              .select(
                `
                  id,
                  gym_id,
                  status,
                  billing_cycle,
                  regular_price,
                  discount,
                  final_price,
                  currency,
                  start_date,
                  next_payment_date,
                  trial_start_date,
                  trial_end_date,
                  cancelled_at,
                  cancellation_reason,
                  created_at,
                  updated_at
                `
              )

              .single();


          if (
            subscriptionError
          ) {

            throw new Error(
              `No se pudo crear la suscripción: ${subscriptionError.message}`
            );

          }


          // ==================================================
          // 17. REGISTRAR ACTIVIDAD NEXGYM
          // ==================================================
          //
          // Si falla el log NO cancelamos la creación.
          //
          // ==================================================

          const {
            error:
              activityError
          } =
            await ctx.supabaseAdmin

              .from(
                "nexgym_activity_logs"
              )

              .insert({

                gym_id:
                  createdGymId,

                admin_id:
                  nexgymAdmin.id,

                type:
                  "gym_created",

                title:
                  "Gimnasio registrado",

                description:
                  `Se registró el gimnasio ${gymName}.`,

                metadata: {

                  gymCode,

                  ownerName,

                  ownerEmail:
                    ownerEmail ||
                    null,

                  accessEmail,

                  subscriptionStatus:
                    requestedStatus,

                  billingCycle:
                    requestedBillingCycle,

                  regularPrice,

                  discount,

                  finalPrice

                }

              });


          if (
            activityError
          ) {

            console.warn(
              "⚠️ No se pudo registrar activity log:",
              activityError
            );

          }


          // ==================================================
          // 18. ACTUALIZAR LAST ACCESS DEL ADMIN
          // ==================================================

          const {
            error:
              adminUpdateError
          } =
            await ctx.supabaseAdmin

              .from(
                "nexgym_admins"
              )

              .update({

                last_access_at:
                  new Date()
                    .toISOString()

              })

              .eq(
                "id",
                nexgymAdmin.id
              );


          if (
            adminUpdateError
          ) {

            console.warn(
              "⚠️ No se pudo actualizar last_access_at:",
              adminUpdateError
            );

          }


          // ==================================================
          // 19. RESPUESTA
          // ==================================================

          console.log(
            "✅ Gimnasio creado correctamente:",
            {
              gymId:
                gym.id,

              gymCode:
                gym.gym_code,

              accessEmail
            }
          );


          return Response.json(
            {

              success:
                true,

              message:
                "Gimnasio registrado correctamente.",


              gym,


              owner: {

                name:
                  ownerName,

                email:
                  ownerEmail ||
                  null,

                phone:
                  ownerPhone ||
                  null

              },


              access: {

                authUserId:
                  createdAuthUserId,

                email:
                  accessEmail

              },


              gymUser,


              subscription

            },
            {

              status:
                201

            }
          );

        } catch (error) {

          // ==================================================
          // 20. ERROR
          // ==================================================

          console.error(
            "❌ Error creando gimnasio:",
            error
          );


          // ==================================================
          // ROLLBACK DEL GYM
          // ==================================================
          //
          // gym_users y gym_subscriptions deberían
          // desaparecer mediante ON DELETE CASCADE.
          //
          // ==================================================

          if (
            createdGymId
          ) {

            const {
              error:
                deleteGymError
            } =
              await ctx.supabaseAdmin

                .from(
                  "gyms"
                )

                .delete()

                .eq(
                  "id",
                  createdGymId
                );


            if (
              deleteGymError
            ) {

              console.error(
                "❌ Error limpiando gimnasio tras rollback:",
                deleteGymError
              );

            }

          }


          // ==================================================
          // ROLLBACK AUTH
          // ==================================================

          if (
            createdAuthUserId
          ) {

            const {
              error:
                deleteUserError
            } =
              await ctx.supabaseAdmin
                .auth
                .admin
                .deleteUser(
                  createdAuthUserId
                );


            if (
              deleteUserError
            ) {

              console.error(
                "❌ Error limpiando usuario Auth tras rollback:",
                deleteUserError
              );

            }

          }


          // ==================================================
          // RESPUESTA ERROR
          // ==================================================

          return errorResponse(

            error instanceof
            Error

              ? error.message

              : "No se pudo registrar el gimnasio.",

            500,

            "CREATE_GYM_FAILED"

          );

        }

      }

    )

};