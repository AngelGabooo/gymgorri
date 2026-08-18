// src/nexgym/services/nexgymSupportService.js

import {
  addNexgymActivity
} from './nexgymGymService';


// ======================================================
// STORAGE
// ======================================================

export const NEXGYM_SUPPORT_KEY =
  'nexgym_support_tickets';


// ======================================================
// CREAR ID
// ======================================================

const createId = () => {

  if (
    window.crypto?.randomUUID
  ) {

    return `ticket_${window.crypto.randomUUID()}`;

  }


  return (
    `ticket_${Date.now()}_` +
    Math.random()
      .toString(36)
      .substring(
        2,
        8
      )
  );

};


// ======================================================
// NORMALIZAR
// ======================================================

const normalizeText = (
  value
) => {

  return String(
    value || ''
  ).trim();

};


// ======================================================
// OBTENER TICKETS
// ======================================================

export const getNexgymSupportTickets =
  () => {

    try {

      const raw =
        localStorage.getItem(
          NEXGYM_SUPPORT_KEY
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
        'Error leyendo tickets NEXGYM:',
        error
      );


      return [];

    }

  };


// ======================================================
// GUARDAR TICKETS
// ======================================================

export const saveNexgymSupportTickets =
  (
    tickets
  ) => {

    const safeTickets =
      Array.isArray(
        tickets
      )
        ? tickets
        : [];


    localStorage.setItem(
      NEXGYM_SUPPORT_KEY,
      JSON.stringify(
        safeTickets
      )
    );


    window.dispatchEvent(
      new Event(
        'nexgym-support-update'
      )
    );


    return safeTickets;

  };


// ======================================================
// CREAR TICKET
// ======================================================

export const createNexgymSupportTicket =
  ({
    gymId,
    gymCode = '',
    gymName,
    subject,
    description,
    priority = 'medium',
    category = 'general',
    createdBy = 'Super Administrador'
  }) => {

    const cleanGymName =
      normalizeText(
        gymName
      );


    const cleanSubject =
      normalizeText(
        subject
      );


    const cleanDescription =
      normalizeText(
        description
      );


    if (!gymId) {

      return {
        success: false,
        message:
          'Selecciona un gimnasio.'
      };

    }


    if (!cleanSubject) {

      return {
        success: false,
        message:
          'Ingresa el asunto del ticket.'
      };

    }


    if (!cleanDescription) {

      return {
        success: false,
        message:
          'Describe el problema o solicitud.'
      };

    }


    const now =
      new Date()
        .toISOString();


    const ticket = {

      id:
        createId(),

      ticketCode:
        `SUP-${String(
          Date.now()
        ).slice(
          -7
        )}`,

      gymId,

      gymCode:
        normalizeText(
          gymCode
        ),

      gymName:
        cleanGymName,

      subject:
        cleanSubject,

      description:
        cleanDescription,

      category,

      priority,

      status:
        'open',

      createdBy,

      assignedTo:
        'Angel García',

      createdAt:
        now,

      updatedAt:
        now,

      resolvedAt:
        null,

      resolution:
        '',

      comments:
        []

    };


    const tickets =
      getNexgymSupportTickets();


    saveNexgymSupportTickets([
      ticket,
      ...tickets
    ]);


    addNexgymActivity({

      gymId,

      gymName:
        cleanGymName,

      type:
        'support_ticket',

      title:
        'Ticket de soporte creado',

      description:
        `${ticket.ticketCode}: ${cleanSubject}`

    });


    return {

      success: true,

      ticket

    };

  };


// ======================================================
// OBTENER POR ID
// ======================================================

export const getNexgymSupportTicketById =
  (
    ticketId
  ) => {

    return (
      getNexgymSupportTickets()
        .find(
          ticket =>
            ticket.id ===
            ticketId
        ) ||
      null
    );

  };


// ======================================================
// CAMBIAR ESTADO
// ======================================================

export const updateNexgymTicketStatus =
  (
    ticketId,
    status
  ) => {

    const validStatuses = [
      'open',
      'in_progress',
      'waiting',
      'resolved',
      'closed'
    ];


    if (
      !validStatuses.includes(
        status
      )
    ) {

      return {
        success: false,
        message:
          'Estado inválido.'
      };

    }


    const tickets =
      getNexgymSupportTickets();


    let updatedTicket =
      null;


    const now =
      new Date()
        .toISOString();


    const updated =
      tickets.map(
        ticket => {

          if (
            ticket.id !==
            ticketId
          ) {

            return ticket;

          }


          updatedTicket = {

            ...ticket,

            status,

            updatedAt:
              now,

            resolvedAt:
              status ===
                'resolved' ||
              status ===
                'closed'
                ? now
                : null

          };


          return updatedTicket;

        }
      );


    if (!updatedTicket) {

      return {
        success: false,
        message:
          'Ticket no encontrado.'
      };

    }


    saveNexgymSupportTickets(
      updated
    );


    addNexgymActivity({

      gymId:
        updatedTicket.gymId,

      gymName:
        updatedTicket.gymName,

      type:
        'support_status',

      title:
        'Estado de soporte actualizado',

      description:
        `${updatedTicket.ticketCode} cambió a ${status}.`

    });


    return {

      success: true,

      ticket:
        updatedTicket

    };

  };


// ======================================================
// CAMBIAR PRIORIDAD
// ======================================================

export const updateNexgymTicketPriority =
  (
    ticketId,
    priority
  ) => {

    const valid = [
      'low',
      'medium',
      'high',
      'urgent'
    ];


    if (
      !valid.includes(
        priority
      )
    ) {

      return {
        success: false,
        message:
          'Prioridad inválida.'
      };

    }


    const tickets =
      getNexgymSupportTickets();


    let updatedTicket =
      null;


    const updated =
      tickets.map(
        ticket => {

          if (
            ticket.id !==
            ticketId
          ) {

            return ticket;

          }


          updatedTicket = {

            ...ticket,

            priority,

            updatedAt:
              new Date()
                .toISOString()

          };


          return updatedTicket;

        }
      );


    if (!updatedTicket) {

      return {
        success: false,
        message:
          'Ticket no encontrado.'
      };

    }


    saveNexgymSupportTickets(
      updated
    );


    return {

      success: true,

      ticket:
        updatedTicket

    };

  };


// ======================================================
// AGREGAR COMENTARIO
// ======================================================

export const addNexgymTicketComment =
  (
    ticketId,
    content,
    author =
      'Angel García'
  ) => {

    const cleanContent =
      normalizeText(
        content
      );


    if (!cleanContent) {

      return {
        success: false,
        message:
          'Escribe un comentario.'
      };

    }


    const tickets =
      getNexgymSupportTickets();


    let updatedTicket =
      null;


    const now =
      new Date()
        .toISOString();


    const updated =
      tickets.map(
        ticket => {

          if (
            ticket.id !==
            ticketId
          ) {

            return ticket;

          }


          const comment = {

            id:
              createId(),

            author,

            content:
              cleanContent,

            createdAt:
              now

          };


          updatedTicket = {

            ...ticket,

            updatedAt:
              now,

            comments: [
              ...(
                Array.isArray(
                  ticket.comments
                )
                  ? ticket.comments
                  : []
              ),
              comment
            ]

          };


          return updatedTicket;

        }
      );


    if (!updatedTicket) {

      return {
        success: false,
        message:
          'Ticket no encontrado.'
      };

    }


    saveNexgymSupportTickets(
      updated
    );


    return {

      success: true,

      ticket:
        updatedTicket

    };

  };


// ======================================================
// RESOLVER
// ======================================================

export const resolveNexgymSupportTicket =
  (
    ticketId,
    resolution = ''
  ) => {

    const tickets =
      getNexgymSupportTickets();


    let updatedTicket =
      null;


    const now =
      new Date()
        .toISOString();


    const updated =
      tickets.map(
        ticket => {

          if (
            ticket.id !==
            ticketId
          ) {

            return ticket;

          }


          updatedTicket = {

            ...ticket,

            status:
              'resolved',

            resolution:
              normalizeText(
                resolution
              ),

            resolvedAt:
              now,

            updatedAt:
              now

          };


          return updatedTicket;

        }
      );


    if (!updatedTicket) {

      return {
        success: false,
        message:
          'Ticket no encontrado.'
      };

    }


    saveNexgymSupportTickets(
      updated
    );


    addNexgymActivity({

      gymId:
        updatedTicket.gymId,

      gymName:
        updatedTicket.gymName,

      type:
        'support_resolved',

      title:
        'Ticket resuelto',

      description:
        `${updatedTicket.ticketCode}: ${updatedTicket.subject}`

    });


    return {

      success: true,

      ticket:
        updatedTicket

    };

  };