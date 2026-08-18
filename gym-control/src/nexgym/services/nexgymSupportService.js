// src/nexgym/services/nexgymSupportService.js

import {
  supabase
} from '../../lib/supabaseClient.js';


// ======================================================
// CONSTANTES
// ======================================================

export const VALID_TICKET_STATUSES = [
  'open',
  'in_progress',
  'waiting',
  'resolved',
  'closed'
];


export const VALID_TICKET_PRIORITIES = [
  'low',
  'medium',
  'high',
  'urgent'
];


export const VALID_TICKET_CATEGORIES = [
  'general',
  'access',
  'billing',
  'members',
  'technical'
];


// ======================================================
// NORMALIZAR TEXTO
// ======================================================

const normalizeText = (
  value
) => {

  return String(
    value ||
    ''
  ).trim();

};


// ======================================================
// EVENTO
// ======================================================

const emitSupportUpdate =
  () => {

    window.dispatchEvent(
      new Event(
        'nexgym-support-update'
      )
    );

  };


// ======================================================
// IDENTIDAD ACTUAL
// ======================================================

const getCurrentIdentity =
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


      const session =
        data?.session ||
        null;


      if (
        !session?.user?.id
      ) {

        return {

          userId:
            null,

          name:
            'Usuario',

          email:
            ''

        };

      }


      const userId =
        session.user.id;


      // ==================================================
      // INTENTAR COMO SUPER ADMIN
      // ==================================================

      const {
        data:
          admin
      } =
        await supabase

          .from(
            'nexgym_admins'
          )

          .select(
            `
              id,
              name,
              email,
              role,
              status
            `
          )

          .eq(
            'user_id',
            userId
          )

          .maybeSingle();


      if (
        admin?.name
      ) {

        return {

          userId,

          name:
            admin.name,

          email:
            admin.email ||
            session.user.email ||
            '',

          role:
            admin.role ||
            'super_admin'

        };

      }


      // ==================================================
      // INTENTAR COMO USUARIO DE GIMNASIO
      // ==================================================

      const {
        data:
          gymUser
      } =
        await supabase

          .from(
            'gym_users'
          )

          .select(
            `
              id,
              name,
              email,
              role,
              gym_id
            `
          )

          .eq(
            'user_id',
            userId
          )

          .maybeSingle();


      if (
        gymUser
      ) {

        return {

          userId,

          name:
            gymUser.name ||
            session.user.email ||
            'Usuario',

          email:
            gymUser.email ||
            session.user.email ||
            '',

          role:
            gymUser.role ||
            '',

          gymId:
            gymUser.gym_id ||
            null

        };

      }


      return {

        userId,

        name:
          session.user.user_metadata
            ?.name ||
          session.user.email ||
          'Usuario',

        email:
          session.user.email ||
          ''

      };

    } catch (
      error
    ) {

      console.warn(
        '⚠️ No se pudo obtener identidad de soporte:',
        error
      );


      return {

        userId:
          null,

        name:
          'Usuario',

        email:
          ''

      };

    }

  };


// ======================================================
// REGISTRAR ACTIVIDAD
// ======================================================

const addSupportActivity =
  async ({
    gymId,
    type,
    title,
    description,
    metadata = {}
  }) => {

    try {

      const {
        data:
          sessionData
      } =
        await supabase.auth
          .getSession();


      const userId =
        sessionData
          ?.session
          ?.user
          ?.id ||
        null;


      if (
        !userId
      ) {

        return null;

      }


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

        // Un usuario del gimnasio puede crear/comentar
        // tickets, pero no debe escribir en activity_logs
        // del Super Admin.

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
              gymId ||
              null,

            admin_id:
              admin.id,

            type,

            title,

            description,

            metadata:
              metadata &&
              typeof metadata ===
                'object'
                ? metadata
                : {}

          })

          .select()

          .single();


      if (
        error
      ) {

        console.warn(
          '⚠️ No se pudo registrar actividad de soporte:',
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
        '⚠️ Error registrando actividad de soporte:',
        error
      );


      return null;

    }

  };


// ======================================================
// NORMALIZAR COMENTARIO
// ======================================================

const normalizeComment =
  (
    row
  ) => {

    if (
      !row
    ) {

      return null;

    }


    return {

      id:
        row.id,

      ticketId:
        row.ticket_id,

      authorId:
        row.author_id ||
        null,

      author:
        row.author ||
        'Usuario',

      content:
        row.content ||
        '',

      createdAt:
        row.created_at ||
        null

    };

  };


// ======================================================
// NORMALIZAR TICKET
// ======================================================

const normalizeTicket =
  (
    row,
    comments = []
  ) => {

    if (
      !row
    ) {

      return null;

    }


    return {

      id:
        row.id,

      ticketCode:
        row.ticket_code ||
        '',

      gymId:
        row.gym_id,

      gymCode:
        row.gym_code ||
        '',

      gymName:
        row.gym_name ||
        '',

      subject:
        row.subject ||
        '',

      description:
        row.description ||
        '',

      category:
        row.category ||
        'general',

      priority:
        row.priority ||
        'medium',

      status:
        row.status ||
        'open',

      createdBy:
        row.created_by_name ||
        'Usuario',

      createdById:
        row.created_by ||
        null,

      assignedTo:
        row.assigned_to ||
        'Super Administrador',

      resolution:
        row.resolution ||
        '',

      resolvedAt:
        row.resolved_at ||
        null,

      createdAt:
        row.created_at ||
        null,

      updatedAt:
        row.updated_at ||
        null,

      comments:
        Array.isArray(
          comments
        )
          ? comments
          : []

    };

  };


// ======================================================
// OBTENER TICKETS
// ======================================================

export const getNexgymSupportTickets =
  async () => {

    try {

      const {
        data:
          ticketRows,

        error:
          ticketsError
      } =
        await supabase

          .from(
            'nexgym_support_tickets'
          )

          .select(
            `
              id,
              ticket_code,
              gym_id,
              gym_code,
              gym_name,
              subject,
              description,
              category,
              priority,
              status,
              created_by,
              created_by_name,
              assigned_to,
              resolution,
              resolved_at,
              created_at,
              updated_at
            `
          )

          .order(
            'created_at',
            {
              ascending:
                false
            }
          );


      if (
        ticketsError
      ) {

        console.error(
          '❌ Error cargando tickets NEXGYM:',
          ticketsError
        );


        return {

          success:
            false,

          tickets:
            [],

          message:
            ticketsError.message ||
            'No se pudieron cargar los tickets.'

        };

      }


      const tickets =
        Array.isArray(
          ticketRows
        )
          ? ticketRows
          : [];


      if (
        tickets.length ===
        0
      ) {

        return {

          success:
            true,

          tickets:
            []

        };

      }


      const ticketIds =
        tickets.map(
          ticket =>
            ticket.id
        );


      const {
        data:
          commentRows,

        error:
          commentsError
      } =
        await supabase

          .from(
            'nexgym_support_comments'
          )

          .select(
            `
              id,
              ticket_id,
              author_id,
              author,
              content,
              created_at
            `
          )

          .in(
            'ticket_id',
            ticketIds
          )

          .order(
            'created_at',
            {
              ascending:
                true
            }
          );


      if (
        commentsError
      ) {

        console.warn(
          '⚠️ No se pudieron cargar comentarios:',
          commentsError
        );

      }


      const comments =
        Array.isArray(
          commentRows
        )
          ? commentRows
              .map(
                normalizeComment
              )
              .filter(
                Boolean
              )
          : [];


      const normalized =
        tickets.map(
          ticket => {

            const ticketComments =
              comments.filter(
                comment =>
                  comment.ticketId ===
                  ticket.id
              );


            return normalizeTicket(
              ticket,
              ticketComments
            );

          }
        );


      console.log(
        '☁️ Tickets NEXGYM cargados desde Supabase:',
        {
          total:
            normalized.length
        }
      );


      return {

        success:
          true,

        tickets:
          normalized

      };

    } catch (
      error
    ) {

      console.error(
        '❌ Error inesperado cargando soporte:',
        error
      );


      return {

        success:
          false,

        tickets:
          [],

        message:
          error?.message ||
          'No se pudieron cargar los tickets.'

      };

    }

  };


// ======================================================
// OBTENER POR ID
// ======================================================

export const getNexgymSupportTicketById =
  async (
    ticketId
  ) => {

    if (
      !ticketId
    ) {

      return {

        success:
          false,

        ticket:
          null,

        message:
          'No se indicó el ticket.'

      };

    }


    const result =
      await getNexgymSupportTickets();


    if (
      !result.success
    ) {

      return {

        success:
          false,

        ticket:
          null,

        message:
          result.message

      };

    }


    const ticket =
      result.tickets.find(
        item =>
          item.id ===
          ticketId
      ) ||
      null;


    return {

      success:
        Boolean(
          ticket
        ),

      ticket,

      message:
        ticket
          ? ''
          : 'Ticket no encontrado.'

    };

  };


// ======================================================
// CREAR TICKET
// ======================================================

export const createNexgymSupportTicket =
  async ({
    gymId,
    gymCode = '',
    gymName,
    subject,
    description,
    priority = 'medium',
    category = 'general'
  }) => {

    try {

      const cleanGymName =
        normalizeText(
          gymName
        );


      const cleanGymCode =
        normalizeText(
          gymCode
        );


      const cleanSubject =
        normalizeText(
          subject
        );


      const cleanDescription =
        normalizeText(
          description
        );


      if (
        !gymId
      ) {

        return {

          success:
            false,

          message:
            'Selecciona un gimnasio.'

        };

      }


      if (
        !cleanGymName
      ) {

        return {

          success:
            false,

          message:
            'No se encontró el gimnasio.'

        };

      }


      if (
        !cleanSubject
      ) {

        return {

          success:
            false,

          message:
            'Ingresa el asunto del ticket.'

        };

      }


      if (
        !cleanDescription
      ) {

        return {

          success:
            false,

          message:
            'Describe el problema o solicitud.'

        };

      }


      if (
        !VALID_TICKET_PRIORITIES
          .includes(
            priority
          )
      ) {

        return {

          success:
            false,

          message:
            'Prioridad inválida.'

        };

      }


      if (
        !VALID_TICKET_CATEGORIES
          .includes(
            category
          )
      ) {

        return {

          success:
            false,

          message:
            'Categoría inválida.'

        };

      }


      const identity =
        await getCurrentIdentity();


      const {
        data:
          row,

        error
      } =
        await supabase

          .from(
            'nexgym_support_tickets'
          )

          .insert({

            gym_id:
              gymId,

            gym_code:
              cleanGymCode ||
              null,

            gym_name:
              cleanGymName,

            subject:
              cleanSubject,

            description:
              cleanDescription,

            category,

            priority,

            status:
              'open',

            created_by:
              identity.userId ||
              null,

            created_by_name:
              identity.name ||
              'Usuario',

            assigned_to:
              'Super Administrador'

          })

          .select()

          .single();


      if (
        error
      ) {

        console.error(
          '❌ Error creando ticket:',
          error
        );


        return {

          success:
            false,

          message:
            error.message ||
            'No se pudo crear el ticket.'

        };

      }


      const ticket =
        normalizeTicket(
          row,
          []
        );


      await addSupportActivity({

        gymId,

        type:
          'support_ticket',

        title:
          'Ticket de soporte creado',

        description:
          `${ticket.ticketCode}: ${cleanSubject}`,

        metadata: {

          ticketId:
            ticket.id,

          ticketCode:
            ticket.ticketCode,

          category,

          priority

        }

      });


      emitSupportUpdate();


      console.log(
        '✅ Ticket NEXGYM creado en Supabase:',
        {
          id:
            ticket.id,

          ticketCode:
            ticket.ticketCode,

          gymId
        }
      );


      return {

        success:
          true,

        ticket

      };

    } catch (
      error
    ) {

      console.error(
        '❌ Error inesperado creando ticket:',
        error
      );


      return {

        success:
          false,

        message:
          error?.message ||
          'No se pudo crear el ticket.'

      };

    }

  };


// ======================================================
// CAMBIAR ESTADO
// ======================================================

export const updateNexgymTicketStatus =
  async (
    ticketId,
    status
  ) => {

    try {

      if (
        !VALID_TICKET_STATUSES
          .includes(
            status
          )
      ) {

        return {

          success:
            false,

          message:
            'Estado inválido.'

        };

      }


      const currentResult =
        await getNexgymSupportTicketById(
          ticketId
        );


      if (
        !currentResult.success ||
        !currentResult.ticket
      ) {

        return {

          success:
            false,

          message:
            'Ticket no encontrado.'

        };

      }


      const current =
        currentResult.ticket;


      const resolved =
        status ===
          'resolved' ||
        status ===
          'closed';


      const payload = {

        status,

        resolved_at:
          resolved
            ? new Date()
                .toISOString()
            : null

      };


      const {
        data:
          row,

        error
      } =
        await supabase

          .from(
            'nexgym_support_tickets'
          )

          .update(
            payload
          )

          .eq(
            'id',
            ticketId
          )

          .select()

          .single();


      if (
        error
      ) {

        console.error(
          '❌ Error actualizando estado del ticket:',
          error
        );


        return {

          success:
            false,

          message:
            error.message ||
            'No se pudo actualizar el ticket.'

        };

      }


      await addSupportActivity({

        gymId:
          current.gymId,

        type:
          'support_status',

        title:
          'Estado de soporte actualizado',

        description:
          `${current.ticketCode} cambió a ${status}.`,

        metadata: {

          ticketId,

          ticketCode:
            current.ticketCode,

          previousStatus:
            current.status,

          status

        }

      });


      emitSupportUpdate();


      return {

        success:
          true,

        ticket:
          normalizeTicket(
            row,
            current.comments
          )

      };

    } catch (
      error
    ) {

      console.error(
        '❌ Error cambiando estado:',
        error
      );


      return {

        success:
          false,

        message:
          error?.message ||
          'No se pudo actualizar el estado.'

      };

    }

  };


// ======================================================
// CAMBIAR PRIORIDAD
// ======================================================

export const updateNexgymTicketPriority =
  async (
    ticketId,
    priority
  ) => {

    try {

      if (
        !VALID_TICKET_PRIORITIES
          .includes(
            priority
          )
      ) {

        return {

          success:
            false,

          message:
            'Prioridad inválida.'

        };

      }


      const currentResult =
        await getNexgymSupportTicketById(
          ticketId
        );


      if (
        !currentResult.success ||
        !currentResult.ticket
      ) {

        return {

          success:
            false,

          message:
            'Ticket no encontrado.'

        };

      }


      const current =
        currentResult.ticket;


      const {
        data:
          row,

        error
      } =
        await supabase

          .from(
            'nexgym_support_tickets'
          )

          .update({

            priority

          })

          .eq(
            'id',
            ticketId
          )

          .select()

          .single();


      if (
        error
      ) {

        return {

          success:
            false,

          message:
            error.message ||
            'No se pudo actualizar la prioridad.'

        };

      }


      await addSupportActivity({

        gymId:
          current.gymId,

        type:
          'support_priority',

        title:
          'Prioridad de ticket actualizada',

        description:
          `${current.ticketCode} cambió de ${current.priority} a ${priority}.`,

        metadata: {

          ticketId,

          ticketCode:
            current.ticketCode,

          previousPriority:
            current.priority,

          priority

        }

      });


      emitSupportUpdate();


      return {

        success:
          true,

        ticket:
          normalizeTicket(
            row,
            current.comments
          )

      };

    } catch (
      error
    ) {

      return {

        success:
          false,

        message:
          error?.message ||
          'No se pudo actualizar la prioridad.'

      };

    }

  };


// ======================================================
// AGREGAR COMENTARIO
// ======================================================

export const addNexgymTicketComment =
  async (
    ticketId,
    content
  ) => {

    try {

      const cleanContent =
        normalizeText(
          content
        );


      if (
        !cleanContent
      ) {

        return {

          success:
            false,

          message:
            'Escribe un comentario.'

        };

      }


      const ticketResult =
        await getNexgymSupportTicketById(
          ticketId
        );


      if (
        !ticketResult.success ||
        !ticketResult.ticket
      ) {

        return {

          success:
            false,

          message:
            'Ticket no encontrado.'

        };

      }


      const identity =
        await getCurrentIdentity();


      const {
        data:
          row,

        error
      } =
        await supabase

          .from(
            'nexgym_support_comments'
          )

          .insert({

            ticket_id:
              ticketId,

            author_id:
              identity.userId ||
              null,

            author:
              identity.name ||
              'Usuario',

            content:
              cleanContent

          })

          .select()

          .single();


      if (
        error
      ) {

        console.error(
          '❌ Error agregando comentario:',
          error
        );


        return {

          success:
            false,

          message:
            error.message ||
            'No se pudo agregar el comentario.'

        };

      }


      const comment =
        normalizeComment(
          row
        );


      emitSupportUpdate();


      return {

        success:
          true,

        comment

      };

    } catch (
      error
    ) {

      return {

        success:
          false,

        message:
          error?.message ||
          'No se pudo agregar el comentario.'

      };

    }

  };


// ======================================================
// RESOLVER TICKET
// ======================================================

export const resolveNexgymSupportTicket =
  async (
    ticketId,
    resolution = ''
  ) => {

    try {

      const currentResult =
        await getNexgymSupportTicketById(
          ticketId
        );


      if (
        !currentResult.success ||
        !currentResult.ticket
      ) {

        return {

          success:
            false,

          message:
            'Ticket no encontrado.'

        };

      }


      const current =
        currentResult.ticket;


      const now =
        new Date()
          .toISOString();


      const cleanResolution =
        normalizeText(
          resolution
        );


      const {
        data:
          row,

        error
      } =
        await supabase

          .from(
            'nexgym_support_tickets'
          )

          .update({

            status:
              'resolved',

            resolution:
              cleanResolution,

            resolved_at:
              now

          })

          .eq(
            'id',
            ticketId
          )

          .select()

          .single();


      if (
        error
      ) {

        console.error(
          '❌ Error resolviendo ticket:',
          error
        );


        return {

          success:
            false,

          message:
            error.message ||
            'No se pudo resolver el ticket.'

        };

      }


      await addSupportActivity({

        gymId:
          current.gymId,

        type:
          'support_resolved',

        title:
          'Ticket resuelto',

        description:
          `${current.ticketCode}: ${current.subject}`,

        metadata: {

          ticketId,

          ticketCode:
            current.ticketCode,

          resolution:
            cleanResolution

        }

      });


      emitSupportUpdate();


      return {

        success:
          true,

        ticket:
          normalizeTicket(
            row,
            current.comments
          )

      };

    } catch (
      error
    ) {

      return {

        success:
          false,

        message:
          error?.message ||
          'No se pudo resolver el ticket.'

      };

    }

  };


// ======================================================
// EXPORT DEFAULT
// ======================================================

export default {

  getNexgymSupportTickets,

  getNexgymSupportTicketById,

  createNexgymSupportTicket,

  updateNexgymTicketStatus,

  updateNexgymTicketPriority,

  addNexgymTicketComment,

  resolveNexgymSupportTicket

};