// src/nexgym/pages/NexgymSupportPage.jsx

import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Headphones,
  Search,
  Plus,
  X,
  Building2,
  AlertTriangle,
  Clock3,
  CheckCircle2,
  MessageSquare,
  Send
} from 'lucide-react';

import {
  getNexgymGyms
} from '../services/nexgymGymService';

import {
  addNexgymTicketComment,
  createNexgymSupportTicket,
  getNexgymSupportTickets,
  resolveNexgymSupportTicket,
  updateNexgymTicketPriority,
  updateNexgymTicketStatus
} from '../services/nexgymSupportService';


const NexgymSupportPage = () => {

  const [
    tickets,
    setTickets
  ] = useState([]);


  const [
    gyms,
    setGyms
  ] = useState([]);


  const [
    search,
    setSearch
  ] = useState('');


  const [
    status,
    setStatus
  ] = useState('all');


  const [
    selectedTicket,
    setSelectedTicket
  ] = useState(null);


  const [
    showCreate,
    setShowCreate
  ] = useState(false);


  const loadData =
    () => {

      setTickets(
        getNexgymSupportTickets()
      );


      setGyms(
        getNexgymGyms()
      );


      if (
        selectedTicket
      ) {

        const updated =
          getNexgymSupportTickets()
            .find(
              ticket =>
                ticket.id ===
                selectedTicket.id
            );


        if (updated) {

          setSelectedTicket(
            updated
          );

        }

      }

    };


  useEffect(
    () => {

      loadData();


      window.addEventListener(
        'nexgym-support-update',
        loadData
      );


      return () => {

        window.removeEventListener(
          'nexgym-support-update',
          loadData
        );

      };

    },
    // eslint-disable-next-line
    []
  );


  const filtered =
    useMemo(
      () => {

        const query =
          search
            .trim()
            .toLowerCase();


        return tickets.filter(
          ticket => {

            const matchesSearch =
              !query ||
              ticket.gymName
                ?.toLowerCase()
                .includes(
                  query
                ) ||
              ticket.subject
                ?.toLowerCase()
                .includes(
                  query
                ) ||
              ticket.ticketCode
                ?.toLowerCase()
                .includes(
                  query
                );


            const matchesStatus =
              status ===
              'all'
                ? true
                : ticket.status ===
                  status;


            return (
              matchesSearch &&
              matchesStatus
            );

          }
        );

      },
      [
        tickets,
        search,
        status
      ]
    );


  const stats =
    useMemo(
      () => ({

        open:
          tickets.filter(
            ticket =>
              ticket.status ===
              'open'
          ).length,

        progress:
          tickets.filter(
            ticket =>
              ticket.status ===
              'in_progress'
          ).length,

        waiting:
          tickets.filter(
            ticket =>
              ticket.status ===
              'waiting'
          ).length,

        resolved:
          tickets.filter(
            ticket =>
              ticket.status ===
                'resolved' ||
              ticket.status ===
                'closed'
          ).length

      }),
      [
        tickets
      ]
    );


  return (

    <div className="p-8">


      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1">

          <Stat
            label="Abiertos"
            value={
              stats.open
            }
          />

          <Stat
            label="En proceso"
            value={
              stats.progress
            }
          />

          <Stat
            label="Esperando"
            value={
              stats.waiting
            }
          />

          <Stat
            label="Resueltos"
            value={
              stats.resolved
            }
          />

        </div>


        <button
          type="button"
          onClick={() =>
            setShowCreate(
              true
            )
          }
          className="h-11 px-5 rounded-xl bg-[#00ff88] text-black font-semibold text-sm flex items-center justify-center gap-2"
        >

          <Plus
            className="w-4 h-4"
          />

          Nuevo ticket

        </button>

      </div>


      <div className="bg-[#111111] border border-[#202020] rounded-2xl p-4 mb-5">

        <div className="flex flex-col lg:flex-row gap-3">

          <div className="relative flex-1">

            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600"
            />

            <input
              value={
                search
              }
              onChange={
                event =>
                  setSearch(
                    event.target.value
                  )
              }
              placeholder="Buscar ticket, gimnasio o asunto..."
              className="w-full h-11 bg-[#0c0c0c] border border-[#242424] rounded-xl pl-11 pr-4 text-white text-sm outline-none"
            />

          </div>


          <select
            value={
              status
            }
            onChange={
              event =>
                setStatus(
                  event.target.value
                )
            }
            className="h-11 bg-[#0c0c0c] border border-[#242424] rounded-xl px-4 text-gray-300 text-sm"
          >

            <option value="all">
              Todos
            </option>

            <option value="open">
              Abiertos
            </option>

            <option value="in_progress">
              En proceso
            </option>

            <option value="waiting">
              Esperando
            </option>

            <option value="resolved">
              Resueltos
            </option>

            <option value="closed">
              Cerrados
            </option>

          </select>

        </div>

      </div>


      <div className="bg-[#111111] border border-[#202020] rounded-2xl overflow-hidden">

        {
          filtered.length ===
          0
            ? (

              <div className="py-20 text-center">

                <Headphones
                  className="w-12 h-12 text-gray-800 mx-auto"
                />

                <p className="text-white mt-4">
                  Sin tickets
                </p>

                <p className="text-gray-600 text-sm mt-1">
                  No existen solicitudes de soporte.
                </p>

              </div>

            )
            : (

              filtered.map(
                ticket => (

                  <button
                    type="button"
                    key={
                      ticket.id
                    }
                    onClick={() =>
                      setSelectedTicket(
                        ticket
                      )
                    }
                    className="w-full text-left px-6 py-5 border-b border-[#1d1d1d] last:border-b-0 hover:bg-[#141414]"
                  >

                    <div className="flex items-start justify-between gap-5">

                      <div className="flex items-start gap-4">

                        <div className="w-11 h-11 rounded-xl bg-[#00ff88]/10 flex items-center justify-center">

                          <Headphones
                            className="w-5 h-5 text-[#00ff88]"
                          />

                        </div>


                        <div>

                          <div className="flex flex-wrap items-center gap-2">

                            <p className="text-white text-sm font-medium">
                              {ticket.subject}
                            </p>

                            <StatusBadge
                              status={
                                ticket.status
                              }
                            />

                            <PriorityBadge
                              priority={
                                ticket.priority
                              }
                            />

                          </div>


                          <p className="text-gray-600 text-xs mt-2">
                            {ticket.ticketCode}
                            {' · '}
                            {ticket.gymName}
                          </p>


                          <p className="text-gray-400 text-sm mt-3 line-clamp-2">
                            {ticket.description}
                          </p>

                        </div>

                      </div>


                      <p className="text-gray-700 text-xs whitespace-nowrap">
                        {
                          formatDate(
                            ticket.createdAt
                          )
                        }
                      </p>

                    </div>

                  </button>

                )
              )

            )
        }

      </div>


      {
        showCreate &&
        (

          <CreateTicketModal
            gyms={
              gyms
            }
            onClose={() =>
              setShowCreate(
                false
              )
            }
            onCreated={() => {

              setShowCreate(
                false
              );

              loadData();

            }}
          />

        )
      }


      {
        selectedTicket &&
        (

          <TicketModal
            ticket={
              selectedTicket
            }
            onClose={() =>
              setSelectedTicket(
                null
              )
            }
            onUpdate={
              loadData
            }
          />

        )
      }

    </div>

  );

};


// ======================================================
// CREATE
// ======================================================

const CreateTicketModal = ({
  gyms,
  onClose,
  onCreated
}) => {

  const [
    gymId,
    setGymId
  ] = useState('');


  const [
    subject,
    setSubject
  ] = useState('');


  const [
    description,
    setDescription
  ] = useState('');


  const [
    priority,
    setPriority
  ] = useState('medium');


  const [
    category,
    setCategory
  ] = useState('general');


  const [
    error,
    setError
  ] = useState('');


  const createTicket =
    () => {

      const gym =
        gyms.find(
          item =>
            item.id ===
            gymId
        );


      const result =
        createNexgymSupportTicket({

          gymId,

          gymCode:
            gym?.gymCode,

          gymName:
            gym?.name,

          subject,

          description,

          priority,

          category

        });


      if (
        !result.success
      ) {

        setError(
          result.message
        );

        return;

      }


      onCreated();

    };


  return (

    <Modal
      title="Nuevo ticket"
      onClose={
        onClose
      }
    >

      <div className="space-y-4">

        <Field
          label="Gimnasio"
        >

          <select
            value={
              gymId
            }
            onChange={
              event =>
                setGymId(
                  event.target.value
                )
            }
            className={inputClass}
          >

            <option value="">
              Selecciona un gimnasio
            </option>

            {
              gyms.map(
                gym => (

                  <option
                    key={
                      gym.id
                    }
                    value={
                      gym.id
                    }
                  >
                    {gym.name} - {gym.gymCode}
                  </option>

                )
              )
            }

          </select>

        </Field>


        <Field label="Asunto">

          <input
            value={
              subject
            }
            onChange={
              event =>
                setSubject(
                  event.target.value
                )
            }
            className={
              inputClass
            }
          />

        </Field>


        <div className="grid grid-cols-2 gap-3">

          <Field label="Categoría">

            <select
              value={
                category
              }
              onChange={
                event =>
                  setCategory(
                    event.target.value
                  )
              }
              className={
                inputClass
              }
            >

              <option value="general">
                General
              </option>

              <option value="access">
                Acceso
              </option>

              <option value="billing">
                Facturación
              </option>

              <option value="members">
                Miembros
              </option>

              <option value="technical">
                Técnico
              </option>

            </select>

          </Field>


          <Field label="Prioridad">

            <select
              value={
                priority
              }
              onChange={
                event =>
                  setPriority(
                    event.target.value
                  )
              }
              className={
                inputClass
              }
            >

              <option value="low">
                Baja
              </option>

              <option value="medium">
                Media
              </option>

              <option value="high">
                Alta
              </option>

              <option value="urgent">
                Urgente
              </option>

            </select>

          </Field>

        </div>


        <Field label="Descripción">

          <textarea
            rows={5}
            value={
              description
            }
            onChange={
              event =>
                setDescription(
                  event.target.value
                )
            }
            className={`${inputClass} h-auto py-3 resize-none`}
          />

        </Field>


        {
          error &&
          (

            <p className="text-red-400 text-xs">
              {error}
            </p>

          )
        }


        <div className="flex justify-end gap-2 pt-2">

          <button
            type="button"
            onClick={
              onClose
            }
            className="h-10 px-4 text-gray-400"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={
              createTicket
            }
            className="h-10 px-5 bg-[#00ff88] text-black rounded-xl font-semibold text-sm"
          >
            Crear ticket
          </button>

        </div>

      </div>

    </Modal>

  );

};


// ======================================================
// TICKET
// ======================================================

const TicketModal = ({
  ticket,
  onClose,
  onUpdate
}) => {

  const [
    comment,
    setComment
  ] = useState('');


  const changeStatus =
    (
      value
    ) => {

      updateNexgymTicketStatus(
        ticket.id,
        value
      );


      onUpdate();

    };


  const changePriority =
    (
      value
    ) => {

      updateNexgymTicketPriority(
        ticket.id,
        value
      );


      onUpdate();

    };


  const addComment =
    () => {

      const result =
        addNexgymTicketComment(
          ticket.id,
          comment
        );


      if (
        result.success
      ) {

        setComment('');

        onUpdate();

      }

    };


  return (

    <Modal
      title={`${ticket.ticketCode} · ${ticket.subject}`}
      onClose={
        onClose
      }
      large
    >

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <div className="lg:col-span-2">

          <div className="bg-[#0c0c0c] border border-[#222222] rounded-xl p-4">

            <p className="text-gray-600 text-xs">
              Gimnasio
            </p>

            <p className="text-white mt-1 flex items-center gap-2">

              <Building2
                className="w-4 h-4 text-[#00ff88]"
              />

              {ticket.gymName}

            </p>


            <p className="text-gray-600 text-xs mt-5">
              Descripción
            </p>

            <p className="text-gray-300 text-sm mt-2 leading-relaxed">
              {ticket.description}
            </p>

          </div>


          <div className="mt-4">

            <p className="text-white text-sm font-medium mb-3">
              Comentarios
            </p>


            {
              !ticket.comments?.length
                ? (

                  <p className="text-gray-700 text-sm py-5">
                    Sin comentarios todavía.
                  </p>

                )
                : (

                  ticket.comments.map(
                    item => (

                      <div
                        key={
                          item.id
                        }
                        className="bg-[#0c0c0c] border border-[#222222] rounded-xl p-4 mb-2"
                      >

                        <div className="flex justify-between">

                          <p className="text-white text-xs font-medium">
                            {item.author}
                          </p>

                          <p className="text-gray-700 text-xs">
                            {
                              formatDate(
                                item.createdAt
                              )
                            }
                          </p>

                        </div>

                        <p className="text-gray-400 text-sm mt-2">
                          {item.content}
                        </p>

                      </div>

                    )
                  )

                )
            }


            <div className="flex gap-2 mt-3">

              <input
                value={
                  comment
                }
                onChange={
                  event =>
                    setComment(
                      event.target.value
                    )
                }
                placeholder="Agregar comentario..."
                className={`${inputClass} flex-1`}
              />

              <button
                type="button"
                onClick={
                  addComment
                }
                className="w-11 h-11 rounded-xl bg-[#00ff88] text-black flex items-center justify-center"
              >

                <Send
                  className="w-4 h-4"
                />

              </button>

            </div>

          </div>

        </div>


        <div>

          <div className="bg-[#0c0c0c] border border-[#222222] rounded-xl p-4">

            <Field label="Estado">

              <select
                value={
                  ticket.status
                }
                onChange={
                  event =>
                    changeStatus(
                      event.target.value
                    )
                }
                className={
                  inputClass
                }
              >

                <option value="open">
                  Abierto
                </option>

                <option value="in_progress">
                  En proceso
                </option>

                <option value="waiting">
                  Esperando cliente
                </option>

                <option value="resolved">
                  Resuelto
                </option>

                <option value="closed">
                  Cerrado
                </option>

              </select>

            </Field>


            <div className="mt-4">

              <Field label="Prioridad">

                <select
                  value={
                    ticket.priority
                  }
                  onChange={
                    event =>
                      changePriority(
                        event.target.value
                      )
                  }
                  className={
                    inputClass
                  }
                >

                  <option value="low">
                    Baja
                  </option>

                  <option value="medium">
                    Media
                  </option>

                  <option value="high">
                    Alta
                  </option>

                  <option value="urgent">
                    Urgente
                  </option>

                </select>

              </Field>

            </div>


            <div className="mt-5 border-t border-[#222222] pt-4">

              <p className="text-gray-600 text-xs">
                Creado
              </p>

              <p className="text-gray-300 text-xs mt-1">
                {
                  formatDate(
                    ticket.createdAt
                  )
                }
              </p>


              <p className="text-gray-600 text-xs mt-4">
                Asignado
              </p>

              <p className="text-gray-300 text-xs mt-1">
                {ticket.assignedTo}
              </p>

            </div>


            {
              ticket.status !==
                'resolved' &&
              ticket.status !==
                'closed' &&
              (

                <button
                  type="button"
                  onClick={() => {

                    resolveNexgymSupportTicket(
                      ticket.id,
                      'Caso resuelto desde NEXGYM.'
                    );

                    onUpdate();

                  }}
                  className="mt-5 w-full h-10 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] text-sm font-medium"
                >

                  <CheckCircle2
                    className="inline w-4 h-4 mr-2"
                  />

                  Marcar resuelto

                </button>

              )
            }

          </div>

        </div>

      </div>

    </Modal>

  );

};


// ======================================================
// UI
// ======================================================

const inputClass =
  'w-full h-11 bg-[#0c0c0c] border border-[#282828] rounded-xl px-4 text-white text-sm outline-none focus:border-[#00ff88]/40';


const Field = ({
  label,
  children
}) => (

  <div>

    <label className="text-gray-500 text-xs">
      {label}
    </label>

    <div className="mt-2">
      {children}
    </div>

  </div>

);


const Modal = ({
  title,
  onClose,
  children,
  large = false
}) => (

  <div className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-sm flex items-center justify-center p-5">

    <div
      className={`
        w-full
        ${large
          ? 'max-w-5xl'
          : 'max-w-xl'}
        bg-[#111111]
        border
        border-[#292929]
        rounded-2xl
        max-h-[90vh]
        overflow-y-auto
      `}
    >

      <div className="sticky top-0 bg-[#111111] p-5 border-b border-[#202020] flex items-center justify-between z-10">

        <h3 className="text-white font-semibold">
          {title}
        </h3>

        <button
          type="button"
          onClick={
            onClose
          }
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#1c1c1c]"
        >

          <X
            className="w-4 h-4"
          />

        </button>

      </div>

      <div className="p-5">
        {children}
      </div>

    </div>

  </div>

);


const Stat = ({
  label,
  value
}) => (

  <div className="bg-[#111111] border border-[#202020] rounded-xl p-4">

    <p className="text-gray-600 text-xs">
      {label}
    </p>

    <p className="text-white text-2xl font-semibold mt-1">
      {value}
    </p>

  </div>

);


const StatusBadge = ({
  status
}) => {

  const map = {

    open:
      [
        'Abierto',
        'text-blue-400 bg-blue-500/10 border-blue-500/20'
      ],

    in_progress:
      [
        'En proceso',
        'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      ],

    waiting:
      [
        'Esperando',
        'text-orange-400 bg-orange-500/10 border-orange-500/20'
      ],

    resolved:
      [
        'Resuelto',
        'text-[#00ff88] bg-[#00ff88]/10 border-[#00ff88]/20'
      ],

    closed:
      [
        'Cerrado',
        'text-gray-400 bg-gray-500/10 border-gray-500/20'
      ]

  };


  const data =
    map[
      status
    ] ||
    map.open;


  return (

    <span className={`border rounded-full px-2 py-0.5 text-[10px] ${data[1]}`}>
      {data[0]}
    </span>

  );

};


const PriorityBadge = ({
  priority
}) => {

  const map = {

    low:
      [
        'Baja',
        'text-gray-400'
      ],

    medium:
      [
        'Media',
        'text-blue-400'
      ],

    high:
      [
        'Alta',
        'text-yellow-400'
      ],

    urgent:
      [
        'Urgente',
        'text-red-400'
      ]

  };


  const data =
    map[
      priority
    ] ||
    map.medium;


  return (

    <span className={`text-[10px] font-medium ${data[1]}`}>
      {data[0]}
    </span>

  );

};


const formatDate = (
  value
) => {

  if (!value) {

    return '-';

  }


  return new Intl.DateTimeFormat(
    'es-MX',
    {
      day:
        '2-digit',
      month:
        'short',
      year:
        'numeric',
      hour:
        '2-digit',
      minute:
        '2-digit'
    }
  ).format(
    new Date(
      value
    )
  );

};


export default NexgymSupportPage;