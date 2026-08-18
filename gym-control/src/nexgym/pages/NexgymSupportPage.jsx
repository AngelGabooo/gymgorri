// src/nexgym/pages/NexgymSupportPage.jsx

import React, {
  useCallback,
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
  CheckCircle2,
  Send,
  LoaderCircle,
  RefreshCcw,
  AlertCircle
} from 'lucide-react';

import {
  getNexgymCloudGyms
} from '../services/nexgymCloudGymService.js';

import {
  addNexgymTicketComment,
  createNexgymSupportTicket,
  getNexgymSupportTickets,
  resolveNexgymSupportTicket,
  updateNexgymTicketPriority,
  updateNexgymTicketStatus
} from '../services/nexgymSupportService.js';


// ======================================================
// PAGE
// ======================================================

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


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    error,
    setError
  ] = useState('');


  // ======================================================
  // CARGAR
  // ======================================================

  const loadData =
    useCallback(
      async () => {

        try {

          setLoading(
            true
          );


          setError(
            ''
          );


          const [
            ticketsResult,
            gymsResult
          ] =
            await Promise.all([

              getNexgymSupportTickets(),

              getNexgymCloudGyms()

            ]);


          if (
            !ticketsResult.success
          ) {

            setTickets(
              []
            );


            setError(
              ticketsResult.message ||
              'No se pudieron cargar los tickets.'
            );

          } else {

            setTickets(
              ticketsResult.tickets ||
              []
            );

          }


          if (
            gymsResult.success
          ) {

            setGyms(
              gymsResult.gyms ||
              []
            );

          }


          if (
            selectedTicket &&
            ticketsResult.success
          ) {

            const updated =
              (
                ticketsResult.tickets ||
                []
              ).find(
                ticket =>
                  ticket.id ===
                  selectedTicket.id
              );


            if (
              updated
            ) {

              setSelectedTicket(
                updated
              );

            } else {

              setSelectedTicket(
                null
              );

            }

          }


          console.log(
            '☁️ Soporte NEXGYM cargado desde Supabase:',
            {
              tickets:
                ticketsResult.tickets
                  ?.length ||
                0,

              gyms:
                gymsResult.gyms
                  ?.length ||
                0
            }
          );

        } catch (
          loadError
        ) {

          console.error(
            '❌ Error cargando soporte:',
            loadError
          );


          setError(
            loadError?.message ||
            'No se pudo cargar soporte.'
          );

        } finally {

          setLoading(
            false
          );

        }

      },
      [
        selectedTicket?.id
      ]
    );


  // ======================================================
  // INIT
  // ======================================================

  useEffect(
    () => {

      void loadData();


      const refresh =
        () => {

          void loadData();

        };


      window.addEventListener(
        'nexgym-support-update',
        refresh
      );


      window.addEventListener(
        'nexgym-gyms-update',
        refresh
      );


      return () => {

        window.removeEventListener(
          'nexgym-support-update',
          refresh
        );


        window.removeEventListener(
          'nexgym-gyms-update',
          refresh
        );

      };

    },
    [
      loadData
    ]
  );


  // ======================================================
  // FILTRAR
  // ======================================================

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

              ticket.gymCode
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
                ) ||

              ticket.description
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


  // ======================================================
  // STATS
  // ======================================================

  const stats =
    useMemo(
      () => ({

        total:
          tickets.length,

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


  // ======================================================
  // RENDER
  // ======================================================

  return (

    <div className="p-8">

      {/* ================================================== */}
      {/* STATS / HEADER */}
      {/* ================================================== */}

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-5">

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 flex-1">

          <Stat
            label="Total"
            value={
              stats.total
            }
          />


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


        <div className="flex items-center gap-2">

          <button
            type="button"
            onClick={
              loadData
            }
            disabled={
              loading
            }
            className="h-11 px-4 rounded-xl bg-[#171717] border border-[#292929] text-gray-300 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >

            <RefreshCcw
              className={`
                w-4
                h-4
                ${
                  loading
                    ? 'animate-spin'
                    : ''
                }
              `}
            />

            Actualizar

          </button>


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

      </div>


      {/* ================================================== */}
      {/* ERROR */}
      {/* ================================================== */}

      {
        error &&
        (

          <div className="mb-5 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">

            <AlertCircle
              className="w-5 h-5 text-red-400 shrink-0"
            />

            <div>

              <p className="text-red-400 text-sm font-medium">
                Error de soporte
              </p>

              <p className="text-red-400/70 text-xs mt-1">
                {error}
              </p>

            </div>

          </div>

        )
      }


      {/* ================================================== */}
      {/* FILTROS */}
      {/* ================================================== */}

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
              placeholder="Buscar ticket, gimnasio, código o asunto..."
              className="w-full h-11 bg-[#0c0c0c] border border-[#242424] rounded-xl pl-11 pr-4 text-white text-sm outline-none focus:border-[#00ff88]/40"
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
            className="h-11 bg-[#0c0c0c] border border-[#242424] rounded-xl px-4 text-gray-300 text-sm outline-none"
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


      {/* ================================================== */}
      {/* LISTADO */}
      {/* ================================================== */}

      <div className="bg-[#111111] border border-[#202020] rounded-2xl overflow-hidden">

        {
          loading
            ? (

              <div className="py-20 flex flex-col items-center justify-center">

                <LoaderCircle
                  className="w-10 h-10 text-[#00ff88] animate-spin"
                />

                <p className="text-gray-500 text-sm mt-4">
                  Cargando tickets...
                </p>

              </div>

            )
            : filtered.length ===
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

                        <div className="flex items-start gap-4 min-w-0">

                          <div className="w-11 h-11 rounded-xl bg-[#00ff88]/10 flex items-center justify-center shrink-0">

                            <Headphones
                              className="w-5 h-5 text-[#00ff88]"
                            />

                          </div>


                          <div className="min-w-0">

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

                              {
                                ticket.gymCode
                                  ? ` · ${ticket.gymCode}`
                                  : ''
                              }

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


      {/* ================================================== */}
      {/* CREAR */}
      {/* ================================================== */}

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
            onCreated={async () => {

              setShowCreate(
                false
              );

              await loadData();

            }}
          />

        )
      }


      {/* ================================================== */}
      {/* DETALLE */}
      {/* ================================================== */}

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
// CREATE MODAL
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


  const [
    saving,
    setSaving
  ] = useState(false);


  const createTicket =
    async () => {

      if (
        saving
      ) {

        return;

      }


      try {

        setSaving(
          true
        );

        setError(
          ''
        );


        const gym =
          gyms.find(
            item =>
              item.id ===
              gymId
          );


        const result =
          await createNexgymSupportTicket({

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


        await onCreated();

      } catch (
        createError
      ) {

        setError(
          createError?.message ||
          'No se pudo crear el ticket.'
        );

      } finally {

        setSaving(
          false
        );

      }

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
            className={
              inputClass
            }
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


        <Field
          label="Asunto"
        >

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


        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          <Field
            label="Categoría"
          >

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


          <Field
            label="Prioridad"
          >

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


        <Field
          label="Descripción"
        >

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
            disabled={
              saving
            }
            className="h-10 px-4 text-gray-400 disabled:opacity-50"
          >

            Cancelar

          </button>


          <button
            type="button"
            onClick={
              createTicket
            }
            disabled={
              saving
            }
            className="h-10 px-5 bg-[#00ff88] text-black rounded-xl font-semibold text-sm flex items-center gap-2 disabled:opacity-50"
          >

            {
              saving &&
              (
                <LoaderCircle
                  className="w-4 h-4 animate-spin"
                />
              )
            }

            {
              saving
                ? 'Creando...'
                : 'Crear ticket'
            }

          </button>

        </div>

      </div>

    </Modal>

  );

};


// ======================================================
// TICKET MODAL
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


  const [
    error,
    setError
  ] = useState('');


  const [
    working,
    setWorking
  ] = useState(false);


  // ====================================================
  // STATUS
  // ====================================================

  const changeStatus =
    async (
      value
    ) => {

      if (
        working
      ) {

        return;

      }


      try {

        setWorking(
          true
        );

        setError(
          ''
        );


        const result =
          await updateNexgymTicketStatus(
            ticket.id,
            value
          );


        if (
          !result.success
        ) {

          setError(
            result.message
          );


          return;

        }


        await onUpdate();

      } finally {

        setWorking(
          false
        );

      }

    };


  // ====================================================
  // PRIORIDAD
  // ====================================================

  const changePriority =
    async (
      value
    ) => {

      if (
        working
      ) {

        return;

      }


      try {

        setWorking(
          true
        );

        setError(
          ''
        );


        const result =
          await updateNexgymTicketPriority(
            ticket.id,
            value
          );


        if (
          !result.success
        ) {

          setError(
            result.message
          );


          return;

        }


        await onUpdate();

      } finally {

        setWorking(
          false
        );

      }

    };


  // ====================================================
  // COMMENT
  // ====================================================

  const addComment =
    async () => {

      if (
        working
      ) {

        return;

      }


      try {

        setWorking(
          true
        );

        setError(
          ''
        );


        const result =
          await addNexgymTicketComment(
            ticket.id,
            comment
          );


        if (
          !result.success
        ) {

          setError(
            result.message
          );


          return;

        }


        setComment(
          ''
        );


        await onUpdate();

      } finally {

        setWorking(
          false
        );

      }

    };


  // ====================================================
  // RESOLVE
  // ====================================================

  const resolveTicket =
    async () => {

      if (
        working
      ) {

        return;

      }


      try {

        setWorking(
          true
        );

        setError(
          ''
        );


        const result =
          await resolveNexgymSupportTicket(
            ticket.id,
            'Caso resuelto desde NEXGYM.'
          );


        if (
          !result.success
        ) {

          setError(
            result.message
          );


          return;

        }


        await onUpdate();

      } finally {

        setWorking(
          false
        );

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

        {/* ================================================== */}
        {/* IZQUIERDA */}
        {/* ================================================== */}

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


            {
              ticket.gymCode &&
              (

                <p className="text-gray-600 text-xs mt-1">
                  {ticket.gymCode}
                </p>

              )
            }


            <p className="text-gray-600 text-xs mt-5">
              Descripción
            </p>


            <p className="text-gray-300 text-sm mt-2 leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </p>


            <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-[#222222]">

              <div>

                <p className="text-gray-600 text-xs">
                  Categoría
                </p>

                <p className="text-gray-300 text-sm mt-1 capitalize">
                  {getCategoryLabel(ticket.category)}
                </p>

              </div>


              <div>

                <p className="text-gray-600 text-xs">
                  Creado por
                </p>

                <p className="text-gray-300 text-sm mt-1">
                  {ticket.createdBy}
                </p>

              </div>

            </div>

          </div>


          {/* ================================================== */}
          {/* COMENTARIOS */}
          {/* ================================================== */}

          <div className="mt-4">

            <p className="text-white text-sm font-medium mb-3">
              Comentarios
            </p>


            {
              !ticket.comments
                ?.length
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

                        <div className="flex justify-between gap-4">

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


                        <p className="text-gray-400 text-sm mt-2 whitespace-pre-wrap">
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
                onKeyDown={
                  event => {

                    if (
                      event.key ===
                      'Enter'
                    ) {

                      event.preventDefault();

                      void addComment();

                    }

                  }
                }
                placeholder="Agregar comentario..."
                disabled={
                  working
                }
                className={`${inputClass} flex-1 disabled:opacity-50`}
              />


              <button
                type="button"
                onClick={
                  addComment
                }
                disabled={
                  working ||
                  !comment.trim()
                }
                className="w-11 h-11 rounded-xl bg-[#00ff88] text-black flex items-center justify-center disabled:opacity-50"
              >

                {
                  working
                    ? (
                      <LoaderCircle
                        className="w-4 h-4 animate-spin"
                      />
                    )
                    : (
                      <Send
                        className="w-4 h-4"
                      />
                    )
                }

              </button>

            </div>


            {
              error &&
              (

                <p className="text-red-400 text-xs mt-3">
                  {error}
                </p>

              )
            }

          </div>

        </div>


        {/* ================================================== */}
        {/* DERECHA */}
        {/* ================================================== */}

        <div>

          <div className="bg-[#0c0c0c] border border-[#222222] rounded-xl p-4">

            <Field
              label="Estado"
            >

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
                disabled={
                  working
                }
                className={`${inputClass} disabled:opacity-50`}
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

              <Field
                label="Prioridad"
              >

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
                  disabled={
                    working
                  }
                  className={`${inputClass} disabled:opacity-50`}
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
                Última actualización
              </p>

              <p className="text-gray-300 text-xs mt-1">

                {
                  formatDate(
                    ticket.updatedAt
                  )
                }

              </p>


              <p className="text-gray-600 text-xs mt-4">
                Asignado
              </p>

              <p className="text-gray-300 text-xs mt-1">
                {ticket.assignedTo}
              </p>


              {
                ticket.resolvedAt &&
                (

                  <>
                    <p className="text-gray-600 text-xs mt-4">
                      Resuelto
                    </p>

                    <p className="text-[#00ff88] text-xs mt-1">

                      {
                        formatDate(
                          ticket.resolvedAt
                        )
                      }

                    </p>
                  </>

                )
              }

            </div>


            {
              ticket.status !==
                'resolved' &&
              ticket.status !==
                'closed' &&
              (

                <button
                  type="button"
                  onClick={
                    resolveTicket
                  }
                  disabled={
                    working
                  }
                  className="mt-5 w-full h-10 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] text-sm font-medium disabled:opacity-50"
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


// ======================================================
// FIELD
// ======================================================

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


// ======================================================
// MODAL
// ======================================================

const Modal = ({
  title,
  onClose,
  children,
  large = false
}) => (

  <div className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-sm flex items-center justify-center p-5">

    <button
      type="button"
      onClick={
        onClose
      }
      className="absolute inset-0 cursor-default"
      aria-label="Cerrar"
    />


    <div
      className={`
        relative
        w-full
        ${
          large
            ? 'max-w-5xl'
            : 'max-w-xl'
        }
        max-h-[92vh]
        overflow-y-auto
        bg-[#111111]
        border
        border-[#242424]
        rounded-2xl
        shadow-2xl
      `}
    >

      <div className="sticky top-0 z-10 bg-[#111111] px-6 py-5 border-b border-[#202020] flex items-center justify-between gap-4">

        <div>

          <p className="text-[#00ff88] text-[10px] uppercase tracking-wider">
            NEXGYM Soporte
          </p>

          <h2 className="text-white font-semibold mt-1">
            {title}
          </h2>

        </div>


        <button
          type="button"
          onClick={
            onClose
          }
          className="w-9 h-9 rounded-lg bg-[#181818] border border-[#292929] text-gray-400 flex items-center justify-center hover:text-white"
        >

          <X
            className="w-4 h-4"
          />

        </button>

      </div>


      <div className="p-6">
        {children}
      </div>

    </div>

  </div>

);


// ======================================================
// STAT
// ======================================================

const Stat = ({
  label,
  value
}) => (

  <div className="bg-[#111111] border border-[#202020] rounded-xl px-4 py-3">

    <p className="text-gray-600 text-xs">
      {label}
    </p>

    <p className="text-white text-xl font-semibold mt-1">
      {value}
    </p>

  </div>

);


// ======================================================
// STATUS BADGE
// ======================================================

const StatusBadge = ({
  status
}) => {

  const map = {

    open: [
      'Abierto',
      'text-blue-400 bg-blue-500/10 border-blue-500/20'
    ],

    in_progress: [
      'En proceso',
      'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
    ],

    waiting: [
      'Esperando',
      'text-orange-400 bg-orange-500/10 border-orange-500/20'
    ],

    resolved: [
      'Resuelto',
      'text-[#00ff88] bg-[#00ff88]/10 border-[#00ff88]/20'
    ],

    closed: [
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

    <span
      className={`border rounded-full px-2 py-0.5 text-[10px] ${data[1]}`}
    >
      {data[0]}
    </span>

  );

};


// ======================================================
// PRIORIDAD
// ======================================================

const PriorityBadge = ({
  priority
}) => {

  const map = {

    low: [
      'Baja',
      'text-gray-400'
    ],

    medium: [
      'Media',
      'text-blue-400'
    ],

    high: [
      'Alta',
      'text-yellow-400'
    ],

    urgent: [
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

    <span
      className={`text-[10px] font-medium ${data[1]}`}
    >
      {data[0]}
    </span>

  );

};


// ======================================================
// CATEGORÍA
// ======================================================

const getCategoryLabel = (
  category
) => {

  const labels = {

    general:
      'General',

    access:
      'Acceso',

    billing:
      'Facturación',

    members:
      'Miembros',

    technical:
      'Técnico'

  };


  return (
    labels[
      category
    ] ||
    category ||
    'General'
  );

};


// ======================================================
// FECHA
// ======================================================

const formatDate = (
  value
) => {

  if (
    !value
  ) {

    return '-';

  }


  try {

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

  } catch {

    return '-';

  }

};


export default NexgymSupportPage;