// src/components/Members/MembersPage.jsx

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Users,
  UserCheck,
  Clock,
  UserX,
  Search,
  Filter,
  Plus,
  MoreVertical,
  QrCode,
  Eye,
  RefreshCw,
  Edit,
  Lock,
  LockOpen,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Upload,
  X
} from 'lucide-react';

import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import MemberStatCard from './Cards/MemberStatCard';

import {
  getStoredMembers,
  saveMember
} from '../../utils/memberId';

import {
  deleteMemberPermanently
} from '../../utils/deleteMemberPermanently';

import {
  addMemberToBlacklist,
  clearBlacklistByMember
} from '../../services/blacklistService';

// ======================================================
// MESES EN ESPAÑOL
// ======================================================

const MONTHS = {
  ene: 0,
  enero: 0,

  feb: 1,
  febrero: 1,

  mar: 2,
  marzo: 2,

  abr: 3,
  abril: 3,

  may: 4,
  mayo: 4,

  jun: 5,
  junio: 5,

  jul: 6,
  julio: 6,

  ago: 7,
  agosto: 7,

  sep: 8,
  sept: 8,
  septiembre: 8,

  oct: 9,
  octubre: 9,

  nov: 10,
  noviembre: 10,

  dic: 11,
  diciembre: 11,
};


// ======================================================
// CONVERTIR FECHA
// ======================================================

const parseGymDate = (value) => {

  if (!value) {
    return null;
  }


  // Intentar fecha normal / ISO
  const directDate =
    new Date(value);


  if (
    !Number.isNaN(
      directDate.getTime()
    )
  ) {
    return directDate;
  }


  // Ejemplo:
  // 13 sept 2026

  const cleanValue =
    String(value)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');


  const parts =
    cleanValue.split(' ');


  if (
    parts.length !== 3
  ) {
    return null;
  }


  const day =
    Number(parts[0]);

  const month =
    MONTHS[parts[1]];

  const year =
    Number(parts[2]);


  if (
    Number.isNaN(day) ||
    month === undefined ||
    Number.isNaN(year)
  ) {
    return null;
  }


  return new Date(
    year,
    month,
    day,
    23,
    59,
    59
  );

};


// ======================================================
// OBTENER ESTADO DEL MIEMBRO
// ======================================================

const getMemberStatus = (member) => {

  if (
    member?.accessBlocked === true
  ) {
    return 'Bloqueado';
  }


  if (
    !member?.subscription
  ) {
    return 'Sin suscripción';
  }


  const endDate =
    parseGymDate(
      member.subscription.endDate
    );


  // Si no podemos interpretar la fecha,
  // usamos el status almacenado.
  if (!endDate) {

    if (
      member.subscription.status === 'active'
    ) {
      return 'Activo';
    }

    return 'Sin suscripción';
  }


  const today =
    new Date();


  today.setHours(
    0,
    0,
    0,
    0
  );


  const expiration =
    new Date(endDate);


  expiration.setHours(
    23,
    59,
    59,
    999
  );


  const differenceMs =
    expiration.getTime() -
    today.getTime();


  const differenceDays =
    Math.ceil(
      differenceMs /
      (1000 * 60 * 60 * 24)
    );


  if (
    differenceDays < 0
  ) {
    return 'Vencido';
  }


  if (
    differenceDays <= 5
  ) {
    return 'Por vencer';
  }


  return 'Activo';

};


// ======================================================
// FORMATEAR FECHA
// ======================================================

const formatDate = (value) => {

  if (!value) {
    return '—';
  }


  const date =
    parseGymDate(value);


  if (!date) {
    return value;
  }


  return new Intl.DateTimeFormat(
    'es-MX',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }
  ).format(date);

};


// ======================================================
// MEMBERS PAGE
// ======================================================

const MembersPage = () => {

  const navigate =
    useNavigate();


  // ======================================================
  // MIEMBROS
  // ======================================================

  const [
    members,
    setMembers
  ] = useState([]);


  const [
    searchTerm,
    setSearchTerm
  ] = useState('');


  const [
    activeFilter,
    setActiveFilter
  ] = useState('Todos');


  const [
    selectedMembers,
    setSelectedMembers
  ] = useState([]);


  // ======================================================
  // PAGINACIÓN
  // ======================================================

  const ITEMS_PER_PAGE = 10;

  const [
    currentPage,
    setCurrentPage
  ] = useState(1);


  // ======================================================
  // BLOQUEO / DESBLOQUEO
  // ======================================================

  const [
    selectedAccessMember,
    setSelectedAccessMember
  ] = useState(null);


  const [
    showAccessModal,
    setShowAccessModal
  ] = useState(false);


  const [
    blockReason,
    setBlockReason
  ] = useState('');


  const [
    isSavingAccess,
    setIsSavingAccess
  ] = useState(false);


  const [
    accessError,
    setAccessError
  ] = useState('');



  // ======================================================
  // ELIMINACIÓN PERMANENTE
  // ======================================================

  const [
    memberToDelete,
    setMemberToDelete
  ] = useState(null);


  const [
    showDeleteModal,
    setShowDeleteModal
  ] = useState(false);


  const [
    deleteConfirmation,
    setDeleteConfirmation
  ] = useState('');

  const [
  deleteReason,
  setDeleteReason
] = useState('');


  const [
    isDeletingMember,
    setIsDeletingMember
  ] = useState(false);


  const [
    deleteError,
    setDeleteError
  ] = useState('');




  // ======================================================
  // CARGAR MIEMBROS
  // ======================================================

  const loadMembers =
    () => {

      const storedMembers =
        getStoredMembers();


      console.log(
        '👥 Miembros cargados:',
        storedMembers
      );


      setMembers(
        storedMembers
      );

    };


  // ======================================================
  // CARGAR AL ENTRAR
  // ======================================================

  useEffect(
    () => {

      loadMembers();


      // Escuchar cambios en localStorage
      const handleStorage =
        () => {

          loadMembers();

        };


      window.addEventListener(
        'storage',
        handleStorage
      );


      window.addEventListener(
        'gym-storage-update',
        handleStorage
      );


      return () => {

        window.removeEventListener(
          'storage',
          handleStorage
        );


        window.removeEventListener(
          'gym-storage-update',
          handleStorage
        );

      };

    },
    []
  );


  // ======================================================
  // MIEMBROS CON ESTADO CALCULADO
  // ======================================================

  const membersWithStatus =
    useMemo(
      () => {

        return members.map(
          member => ({
            ...member,

            calculatedStatus:
              getMemberStatus(
                member
              )
          })
        );

      },
      [members]
    );


  // ======================================================
  // ESTADÍSTICAS
  // ======================================================

  const stats =
    useMemo(
      () => {

        return {

          total:
            membersWithStatus.length,


          active:
            membersWithStatus.filter(
              member =>
                member.calculatedStatus ===
                'Activo'
            ).length,


          expiring:
            membersWithStatus.filter(
              member =>
                member.calculatedStatus ===
                'Por vencer'
            ).length,


          expired:
            membersWithStatus.filter(
              member =>
                member.calculatedStatus ===
                'Vencido'
            ).length,

        };

      },
      [membersWithStatus]
    );


  // ======================================================
  // FILTROS
  // ======================================================

  const filters =
    useMemo(
      () => [

        {
          name: 'Todos',
          count:
            membersWithStatus.length
        },

        {
          name: 'Activos',
          count:
            membersWithStatus.filter(
              member =>
                member.calculatedStatus ===
                'Activo'
            ).length
        },

        {
          name: 'Por vencer',
          count:
            membersWithStatus.filter(
              member =>
                member.calculatedStatus ===
                'Por vencer'
            ).length
        },

        {
          name: 'Vencidos',
          count:
            membersWithStatus.filter(
              member =>
                member.calculatedStatus ===
                'Vencido'
            ).length
        },

        {
          name: 'Bloqueados',
          count:
            membersWithStatus.filter(
              member =>
                member.calculatedStatus ===
                'Bloqueado'
            ).length
        },

        {
          name: 'Sin suscripción',
          count:
            membersWithStatus.filter(
              member =>
                member.calculatedStatus ===
                'Sin suscripción'
            ).length
        },

      ],
      [membersWithStatus]
    );


  // ======================================================
  // BUSCADOR + FILTRO
  // ======================================================

  const filteredMembers =
    useMemo(
      () => {

        const term =
          searchTerm
            .trim()
            .toLowerCase();


        return membersWithStatus.filter(
          member => {

            const fullName =
              `${member.firstName || ''} ${member.lastName || ''}`
                .trim()
                .toLowerCase();


            const matchesSearch =
              !term ||

              fullName.includes(
                term
              ) ||

              String(
                member.phone || ''
              )
                .toLowerCase()
                .includes(term) ||

              String(
                member.email || ''
              )
                .toLowerCase()
                .includes(term) ||

              String(
                member.id || ''
              )
                .toLowerCase()
                .includes(term);


            let matchesFilter =
              true;


            if (
              activeFilter ===
              'Activos'
            ) {

              matchesFilter =
                member.calculatedStatus ===
                'Activo';

            }


            if (
              activeFilter ===
              'Por vencer'
            ) {

              matchesFilter =
                member.calculatedStatus ===
                'Por vencer';

            }


            if (
              activeFilter ===
              'Vencidos'
            ) {

              matchesFilter =
                member.calculatedStatus ===
                'Vencido';

            }


            if (
              activeFilter ===
              'Bloqueados'
            ) {

              matchesFilter =
                member.calculatedStatus ===
                'Bloqueado';

            }


            if (
              activeFilter ===
              'Sin suscripción'
            ) {

              matchesFilter =
                member.calculatedStatus ===
                'Sin suscripción';

            }


            return (
              matchesSearch &&
              matchesFilter
            );

          }
        );

      },
      [
        membersWithStatus,
        searchTerm,
        activeFilter
      ]
    );



  // ======================================================
  // PAGINACIÓN DE MIEMBROS
  // ======================================================

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredMembers.length /
        ITEMS_PER_PAGE
      )
    );


  const paginatedMembers =
    useMemo(
      () => {

        const start =
          (currentPage - 1) *
          ITEMS_PER_PAGE;


        return filteredMembers.slice(
          start,
          start + ITEMS_PER_PAGE
        );

      },
      [
        filteredMembers,
        currentPage
      ]
    );


  const pageStart =
    filteredMembers.length === 0
      ? 0
      : (
          (currentPage - 1) *
          ITEMS_PER_PAGE
        ) + 1;


  const pageEnd =
    Math.min(
      currentPage * ITEMS_PER_PAGE,
      filteredMembers.length
    );


  // Si cambia búsqueda/filtro, regresar a página 1.
  useEffect(
    () => {

      setCurrentPage(1);

    },
    [
      searchTerm,
      activeFilter
    ]
  );


  // Si eliminamos miembros y la página actual deja de existir,
  // regresar automáticamente a la última página válida.
  useEffect(
    () => {

      if (
        currentPage > totalPages
      ) {

        setCurrentPage(
          totalPages
        );

      }

    },
    [
      currentPage,
      totalPages
    ]
  );


  // ======================================================
  // SELECCIONAR MIEMBRO
  // ======================================================

  const toggleMemberSelection =
    memberId => {

      setSelectedMembers(
        previous => {

          if (
            previous.includes(
              memberId
            )
          ) {

            return previous.filter(
              id =>
                id !== memberId
            );

          }


          return [
            ...previous,
            memberId
          ];

        }
      );

    };


  // ======================================================
  // SELECCIONAR TODOS
  // ======================================================

  const toggleSelectAll =
    () => {

      const visibleIds =
        paginatedMembers.map(
          member =>
            member.id
        );


      const allSelected =
        visibleIds.length > 0 &&
        visibleIds.every(
          id =>
            selectedMembers.includes(
              id
            )
        );


      if (allSelected) {

        setSelectedMembers(
          previous =>
            previous.filter(
              id =>
                !visibleIds.includes(
                  id
                )
            )
        );

      } else {

        setSelectedMembers(
          previous => [
            ...new Set([
              ...previous,
              ...visibleIds
            ])
          ]
        );

      }

    };


  // ======================================================
  // COLOR DEL ESTADO
  // ======================================================

  const getStatusStyles =
    status => {

      switch (status) {

        case 'Activo':

          return {
            badge:
              'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20',

            dot:
              'bg-[#00ff88]'
          };


        case 'Por vencer':

          return {
            badge:
              'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',

            dot:
              'bg-yellow-400'
          };


        case 'Vencido':

          return {
            badge:
              'bg-red-500/10 text-red-400 border-red-500/20',

            dot:
              'bg-red-400'
          };


        case 'Bloqueado':

          return {
            badge:
              'bg-red-500/10 text-red-400 border-red-500/20',

            dot:
              'bg-red-500'
          };


        default:

          return {
            badge:
              'bg-gray-500/10 text-gray-400 border-gray-500/20',

            dot:
              'bg-gray-500'
          };

      }

    };



  // ======================================================
  // ABRIR MODAL DE BLOQUEO / DESBLOQUEO
  // ======================================================

  const openAccessModal = (
    member
  ) => {

    setSelectedAccessMember(
      member
    );


    setBlockReason(
      ''
    );


    setAccessError(
      ''
    );


    setShowAccessModal(
      true
    );

  };


  // ======================================================
  // CERRAR MODAL
  // ======================================================

  const closeAccessModal =
    () => {

      if (
        isSavingAccess
      ) {
        return;
      }


      setShowAccessModal(
        false
      );


      setSelectedAccessMember(
        null
      );


      setBlockReason(
        ''
      );


      setAccessError(
        ''
      );

    };


  // ======================================================
  // CONFIRMAR BLOQUEO / DESBLOQUEO
  // ======================================================

  const handleAccessChange =
  async () => {

    if (
      !selectedAccessMember
    ) {
      return;
    }


    const currentlyBlocked =
      selectedAccessMember
        .accessBlocked ===
      true;


    if (
      !currentlyBlocked &&
      !blockReason.trim()
    ) {

      setAccessError(
        'Debes escribir el motivo del bloqueo.'
      );

      return;

    }


    try {

      setIsSavingAccess(
        true
      );


      setAccessError(
        ''
      );


      const now =
        new Date()
          .toISOString();


      // ==================================================
      // DESBLOQUEAR
      // ==================================================

      if (
        currentlyBlocked
      ) {

        const updatedMember = {

          ...selectedAccessMember,

          accessBlocked:
            false,

          blockReason:
            '',

          unblockedAt:
            now,

          updatedAt:
            now,

          blockHistory: [
            ...(
              selectedAccessMember
                .blockHistory ||
              []
            ),

            {
              type:
                'unblocked',

              date:
                now
            }
          ]

        };


        saveMember(
          updatedMember
        );


        // El antecedente NO se borra.
        // Solamente cambia a resuelto.

        clearBlacklistByMember({

          member:
            selectedAccessMember,

          note:
            'Bloqueo de acceso retirado desde la administración de miembros.'

        });

      }

      // ==================================================
      // BLOQUEAR
      // ==================================================

      else {

        const cleanReason =
          blockReason.trim();


        const updatedMember = {

          ...selectedAccessMember,

          accessBlocked:
            true,

          blockReason:
            cleanReason,

          blockedAt:
            now,

          updatedAt:
            now,

          blockHistory: [
            ...(
              selectedAccessMember
                .blockHistory ||
              []
            ),

            {
              type:
                'blocked',

              reason:
                cleanReason,

              date:
                now
            }
          ]

        };


        // Primero guardamos el miembro.

        saveMember(
          updatedMember
        );


        // Después creamos su antecedente
        // en lista negra.

        addMemberToBlacklist({

          member:
            updatedMember,

          reason:
            cleanReason,

          source:
            'blocked',

          notes:
            'Bloqueo realizado desde la administración de miembros.'

        });

      }


      loadMembers();


      window.dispatchEvent(
        new Event(
          'gym-storage-update'
        )
      );


      setShowAccessModal(
        false
      );


      setSelectedAccessMember(
        null
      );


      setBlockReason(
        ''
      );


      setAccessError(
        ''
      );


      window.alert(
        currentlyBlocked
          ? 'Acceso desbloqueado correctamente. El antecedente quedó registrado como resuelto.'
          : 'Acceso bloqueado correctamente y agregado a la lista negra.'
      );

    } catch (error) {

      console.error(
        'Error cambiando el estado de acceso:',
        error
      );


      setAccessError(
        error?.message ||
        'No se pudo actualizar el acceso del miembro.'
      );

    } finally {

      setIsSavingAccess(
        false
      );

    }

  };



  // ======================================================
  // ABRIR ELIMINACIÓN PERMANENTE
  // ======================================================

  const openDeleteModal = (
  member
) => {

  setMemberToDelete(
    member
  );

  setDeleteConfirmation(
    ''
  );

  setDeleteReason(
    ''
  );

  setDeleteError(
    ''
  );

  setShowDeleteModal(
    true
  );

};


  // ======================================================
  // CERRAR ELIMINACIÓN PERMANENTE
  // ======================================================

const closeDeleteModal =
  () => {

    if (
      isDeletingMember
    ) {
      return;
    }


    setShowDeleteModal(
      false
    );


    setMemberToDelete(
      null
    );


    setDeleteConfirmation(
      ''
    );


    setDeleteReason(
      ''
    );


    setDeleteError(
      ''
    );

  };


  // ======================================================
  // ELIMINAR MIEMBRO DEFINITIVAMENTE
  // ======================================================

  const handlePermanentDelete =
  () => {

    if (
      !memberToDelete
    ) {
      return;
    }


    // ==================================================
    // VALIDAR MOTIVO
    // ==================================================

    if (
      !deleteReason.trim()
    ) {

      setDeleteError(
        'Debes escribir el motivo de la eliminación.'
      );

      return;

    }


    // ==================================================
    // VALIDAR PALABRA ELIMINAR
    // ==================================================

    if (
      deleteConfirmation
        .trim()
        .toUpperCase() !==
      'ELIMINAR'
    ) {

      setDeleteError(
        'Escribe ELIMINAR para confirmar la eliminación permanente.'
      );

      return;

    }


    try {

      setIsDeletingMember(
        true
      );


      setDeleteError(
        ''
      );


      const deletedMemberName =
        `${memberToDelete.firstName || ''} ${memberToDelete.lastName || ''}`
          .trim() ||
        memberToDelete.id;


      // ==================================================
      // ELIMINAR + LISTA NEGRA
      // ==================================================

      deleteMemberPermanently(
        memberToDelete.id,
        {

          reason:
            deleteReason.trim(),

          addToBlacklist:
            true,

          blacklistNotes:
            'Miembro eliminado permanentemente desde la administración de miembros.'

        }
      );


      setSelectedMembers(
        previous =>
          previous.filter(
            id =>
              id !==
              memberToDelete.id
          )
      );


      loadMembers();


      window.dispatchEvent(
        new Event(
          'gym-storage-update'
        )
      );


      window.dispatchEvent(
        new Event(
          'gym-blacklist-update'
        )
      );


      setShowDeleteModal(
        false
      );


      setMemberToDelete(
        null
      );


      setDeleteConfirmation(
        ''
      );


      setDeleteReason(
        ''
      );


      setDeleteError(
        ''
      );


      window.alert(
        `${deletedMemberName} fue eliminado permanentemente y su antecedente quedó registrado en la lista negra.`
      );

    } catch (error) {

      console.error(
        'Error eliminando miembro:',
        error
      );


      setDeleteError(
        error?.message ||
        'No se pudo eliminar permanentemente al miembro.'
      );

    } finally {

      setIsDeletingMember(
        false
      );

    }

  };

  // ======================================================
  // ESTADO VACÍO
  // ======================================================

  const isEmpty =
    members.length === 0;


  // ======================================================
  // RENDER
  // ======================================================

  return (

    <div className="min-h-screen bg-[#0a0a0a] flex">

      <Sidebar
        activePage="Miembros"
      />


      <div className="flex-1 lg:ml-0">

        <Header />


        <main className="p-6 space-y-6">


          {/* ================================================= */}
          {/* TÍTULO */}
          {/* ================================================= */}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div>

              <h1 className="text-2xl font-bold text-white">
                Miembros
              </h1>


              <p className="text-gray-400">
                Administra las personas registradas en el gimnasio.
              </p>

            </div>


            <button
              type="button"
              onClick={
                loadMembers
              }
              className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-400 hover:text-white hover:border-[#00ff88] transition-colors flex items-center gap-2 w-fit"
            >

              <RefreshCw
                size={17}
              />

              Actualizar

            </button>

          </div>


          {/* ================================================= */}
          {/* ESTADÍSTICAS */}
          {/* ================================================= */}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

            <MemberStatCard
              title="Total de miembros"
              value={
                stats.total
              }
              subtitle="Personas registradas"
              icon={
                Users
              }
              color="gray"
            />


            <MemberStatCard
              title="Activos"
              value={
                stats.active
              }
              subtitle="Suscripción activa"
              icon={
                UserCheck
              }
              color="green"
            />


            <MemberStatCard
              title="Por vencer"
              value={
                stats.expiring
              }
              subtitle="Próximos 5 días"
              icon={
                Clock
              }
              color="yellow"
            />


            <MemberStatCard
              title="Vencidos"
              value={
                stats.expired
              }
              subtitle="Requieren renovación"
              icon={
                UserX
              }
              color="red"
            />

          </div>


          {/* ================================================= */}
          {/* BARRA DE ACCIONES */}
          {/* ================================================= */}

          <div className="flex flex-col sm:flex-row gap-3">

            <div className="flex-1 relative">

              <Search
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              />


              <input
                type="text"
                placeholder="Buscar por nombre, teléfono, correo o ID..."
                value={
                  searchTerm
                }
                onChange={
                  e =>
                    setSearchTerm(
                      e.target.value
                    )
                }
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-10 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors"
              />

            </div>


            <div className="flex flex-wrap gap-2">

              <button
                type="button"
                className="px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors flex items-center gap-2"
              >

                <Filter
                  size={18}
                />

                Filtros

              </button>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/members/import'
                  )
                }
                className="px-4 py-2.5 bg-[#151515] border border-[#2a2a2a] text-gray-300 rounded-xl font-semibold hover:text-white hover:border-[#00ff88]/50 hover:bg-[#00ff88]/5 transition-all duration-300 flex items-center gap-2"
              >

                <Upload
                  size={18}
                />

                Importar miembros

              </button>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/members/register'
                  )
                }
                className="px-4 py-2.5 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] flex items-center gap-2"
              >

                <Plus
                  size={18}
                />

                Registrar miembro

              </button>

            </div>

          </div>


          {/* ================================================= */}
          {/* FILTROS RÁPIDOS */}
          {/* ================================================= */}

          <div className="flex flex-wrap gap-2">

            {
              filters.map(
                filter => (

                  <button
                    key={
                      filter.name
                    }
                    type="button"
                    onClick={() =>
                      setActiveFilter(
                        filter.name
                      )
                    }
                    className={`
                      px-4 py-1.5 rounded-full text-sm transition-all duration-200

                      ${
                        activeFilter ===
                        filter.name

                          ? 'bg-[#00ff88] text-black font-bold'

                          : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                      }
                    `}
                  >

                    {
                      filter.name
                    }

                    {' '}

                    <span className="text-xs opacity-70">
                      (
                      {
                        filter.count
                      }
                      )
                    </span>

                  </button>

                )
              )
            }

          </div>


          {/* ================================================= */}
          {/* TABLA */}
          {/* ================================================= */}

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">


            {
              isEmpty
                ? (

                  // ==================================================
                  // SIN MIEMBROS
                  // ==================================================

                  <div className="text-center py-16">

                    <div className="flex justify-center mb-4">

                      <div className="p-4 bg-[#1a1a1a] rounded-full">

                        <Users
                          size={48}
                          className="text-gray-600"
                        />

                      </div>

                    </div>


                    <h3 className="text-white text-xl font-bold mb-2">
                      Todavía no hay miembros registrados
                    </h3>


                    <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
                      Registra tu primer miembro para comenzar a gestionar sus suscripciones y accesos.
                    </p>


                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          '/members/register'
                        )
                      }
                      className="px-6 py-2.5 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] flex items-center gap-2 mx-auto"
                    >

                      <UserPlus
                        size={18}
                      />

                      Registrar primer miembro

                    </button>

                  </div>

                )
                : filteredMembers.length === 0
                  ? (

                    // ==================================================
                    // SIN RESULTADOS
                    // ==================================================

                    <div className="text-center py-16">

                      <Search
                        size={42}
                        className="text-gray-600 mx-auto mb-4"
                      />


                      <h3 className="text-white text-lg font-bold">
                        No encontramos miembros
                      </h3>


                      <p className="text-gray-500 text-sm mt-2">
                        Cambia la búsqueda o selecciona otro filtro.
                      </p>

                    </div>

                  )
                  : (

                    // ==================================================
                    // TABLA CON MIEMBROS
                    // ==================================================

                    <div className="overflow-x-auto">

                      <table className="w-full">

                        <thead className="bg-[#0d0d0d] border-b border-[#1a1a1a]">

                          <tr>

                            <th className="py-3 px-4 text-left">

                              <input
                                type="checkbox"
                                checked={
                                  paginatedMembers.length >
                                    0 &&
                                  paginatedMembers.every(
                                    member =>
                                      selectedMembers.includes(
                                        member.id
                                      )
                                  )
                                }
                                onChange={
                                  toggleSelectAll
                                }
                                className="w-4 h-4 bg-[#1a1a1a] border-[#2a2a2a] rounded accent-[#00ff88]"
                              />

                            </th>


                            <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">
                              Miembro
                            </th>


                            <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">
                              Contacto
                            </th>


                            <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">
                              Suscripción
                            </th>


                            <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">
                              Vencimiento
                            </th>


                            <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">
                              Última visita
                            </th>


                            <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">
                              Estado
                            </th>


                            <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">
                              Acciones
                            </th>

                          </tr>

                        </thead>


                        <tbody>

                          {
                            paginatedMembers.map(
                              member => {

                                const statusStyles =
                                  getStatusStyles(
                                    member.calculatedStatus
                                  );


                                const fullName =
                                  `${member.firstName || ''} ${member.lastName || ''}`
                                    .trim();


                                return (

                                  <tr
                                    key={
                                      member.id
                                    }
                                    className="border-b border-[#1a1a1a] last:border-b-0 hover:bg-[#151515] transition-colors"
                                  >


                                    {/* CHECK */}

                                    <td className="py-4 px-4">

                                      <input
                                        type="checkbox"
                                        checked={
                                          selectedMembers.includes(
                                            member.id
                                          )
                                        }
                                        onChange={() =>
                                          toggleMemberSelection(
                                            member.id
                                          )
                                        }
                                        className="w-4 h-4 rounded accent-[#00ff88]"
                                      />

                                    </td>


                                    {/* MIEMBRO */}

                                    <td className="py-4 px-4">

                                      <div className="flex items-center gap-3">

                                        <div className="w-11 h-11 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center overflow-hidden shrink-0">

                                          {
                                            member.profilePhoto
                                              ? (

                                                <img
                                                  src={
                                                    member.profilePhoto
                                                  }
                                                  alt={
                                                    fullName
                                                  }
                                                  className="w-full h-full object-cover"
                                                />

                                              )
                                              : (

                                                <Users
                                                  size={20}
                                                  className="text-gray-500"
                                                />

                                              )
                                          }

                                        </div>


                                        <div>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              navigate(
                                                `/members/${member.id}`
                                              )
                                            }
                                            className="text-white font-semibold hover:text-[#00ff88] transition-colors text-left"
                                          >
                                            {
                                              fullName ||
                                              'Sin nombre'
                                            }
                                          </button>


                                          <p className="text-gray-500 text-xs font-mono mt-1">
                                            {
                                              member.id
                                            }
                                          </p>

                                        </div>

                                      </div>

                                    </td>


                                    {/* CONTACTO */}

                                    <td className="py-4 px-4">

                                      <p className="text-gray-300 text-sm">
                                        {
                                          member.phone ||
                                          '—'
                                        }
                                      </p>


                                      <p className="text-gray-500 text-xs mt-1 max-w-[180px] truncate">
                                        {
                                          member.email ||
                                          'Sin correo'
                                        }
                                      </p>

                                    </td>


                                    {/* SUSCRIPCIÓN */}

                                    <td className="py-4 px-4">

                                      {
                                        member.subscription
                                          ? (

                                            <>

                                              <p className="text-white text-sm capitalize">
                                                {
                                                  member.subscription.plan ||
                                                  'Mensual'
                                                }
                                              </p>


                                              <p className="text-gray-500 text-xs mt-1">
                                                {
                                                  member.subscription.days ||
                                                  30
                                                } días
                                              </p>

                                            </>

                                          )
                                          : (

                                            <span className="text-gray-500 text-sm">
                                              Sin suscripción
                                            </span>

                                          )
                                      }

                                    </td>


                                    {/* VENCIMIENTO */}

                                    <td className="py-4 px-4">

                                      <span className="text-gray-300 text-sm">
                                        {
                                          member.subscription?.endDate
                                            ? formatDate(
                                                member.subscription.endDate
                                              )
                                            : '—'
                                        }
                                      </span>

                                    </td>


                                    {/* ÚLTIMA VISITA */}

                                    <td className="py-4 px-4">

                                      <span className="text-gray-500 text-sm">
                                        {
                                          member.lastVisit
                                            ? formatDate(
                                                member.lastVisit
                                              )
                                            : 'Sin visitas'
                                        }
                                      </span>

                                    </td>


                                    {/* ESTADO */}

                                    <td className="py-4 px-4">

                                      <span
                                        className={`
                                          inline-flex items-center gap-2
                                          px-2.5 py-1 rounded-full
                                          border text-xs font-medium

                                          ${
                                            statusStyles.badge
                                          }
                                        `}
                                      >

                                        <span
                                          className={`
                                            w-1.5 h-1.5 rounded-full

                                            ${
                                              statusStyles.dot
                                            }
                                          `}
                                        />


                                        {
                                          member.calculatedStatus
                                        }

                                      </span>

                                    </td>


                                    {/* ACCIONES */}

                                    <td className="py-4 px-4">

                                      <div className="flex items-center gap-1">


                                        <button
                                          type="button"
                                          title="Ver perfil"
                                          onClick={() =>
                                            navigate(
                                              `/members/${member.id}`
                                            )
                                          }
                                          className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-[#00ff88] hover:border-[#00ff88]/40 flex items-center justify-center transition-colors"
                                        >

                                          <Eye
                                            size={16}
                                          />

                                        </button>


                                        <button
                                          type="button"
                                          title="Editar"
                                          onClick={() =>
                                            navigate(
                                              `/members/${member.id}/edit`
                                            )
                                          }
                                          className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-[#00ff88] hover:border-[#00ff88]/40 flex items-center justify-center transition-colors"
                                        >

                                          <Edit
                                            size={16}
                                          />

                                        </button>


                                        <button
                                          type="button"
                                          title="Renovar suscripción"
                                          onClick={() =>
                                            navigate(
                                              `/members/${member.id}/renew`
                                            )
                                          }
                                          className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-[#00ff88] hover:border-[#00ff88]/40 flex items-center justify-center transition-colors"
                                        >

                                          <RefreshCw
                                            size={16}
                                          />

                                        </button>


                                        <button
                                          type="button"
                                          title="Ver QR"
                                          onClick={() =>
                                            navigate(
                                              `/members/${member.id}`
                                            )
                                          }
                                          className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-[#00ff88] hover:border-[#00ff88]/40 flex items-center justify-center transition-colors"
                                        >

                                          <QrCode
                                            size={16}
                                          />

                                        </button>


                                        <button
                                          type="button"
                                          title={
                                            member.accessBlocked
                                              ? 'Desbloquear acceso'
                                              : 'Bloquear acceso'
                                          }
                                          onClick={() =>
                                            openAccessModal(
                                              member
                                            )
                                          }
                                          className={`
                                            w-9
                                            h-9
                                            rounded-lg
                                            bg-[#1a1a1a]
                                            border
                                            flex
                                            items-center
                                            justify-center
                                            transition-colors

                                            ${
                                              member.accessBlocked
                                                ? 'border-red-500/30 text-red-400 hover:text-[#00ff88] hover:border-[#00ff88]/40'
                                                : 'border-[#2a2a2a] text-gray-400 hover:text-red-400 hover:border-red-500/30'
                                            }
                                          `}
                                        >

                                          {
                                            member.accessBlocked
                                              ? (

                                                <LockOpen
                                                  size={16}
                                                />

                                              )
                                              : (

                                                <Lock
                                                  size={16}
                                                />

                                              )
                                          }

                                        </button>


                                        <button
                                          type="button"
                                          title="Eliminar permanentemente"
                                          onClick={() =>
                                            openDeleteModal(
                                              member
                                            )
                                          }
                                          className="w-9 h-9 rounded-lg bg-red-500/5 border border-red-500/10 text-gray-500 hover:text-red-400 hover:border-red-500/30 flex items-center justify-center transition-colors"
                                        >

                                          <Trash2
                                            size={16}
                                          />

                                        </button>

                                      </div>

                                    </td>

                                  </tr>

                                );

                              }
                            )
                          }

                        </tbody>

                      </table>

                    </div>

                  )
            }

          </div>


          {/* ================================================= */}
          {/* INFORMACIÓN INFERIOR + PAGINACIÓN */}
          {/* ================================================= */}

          {
            !isEmpty &&
            (

              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5">

                  <p className="text-gray-400 text-sm">

                    Mostrando{' '}

                    <span className="text-white font-medium">
                      {pageStart}
                    </span>

                    {' '}–{' '}

                    <span className="text-white font-medium">
                      {pageEnd}
                    </span>

                    {' '}de{' '}

                    <span className="text-white font-medium">
                      {filteredMembers.length}
                    </span>

                    {' '}miembros

                  </p>


                  {
                    selectedMembers.length >
                    0 &&
                    (

                      <p className="text-[#00ff88] text-sm">

                        {selectedMembers.length}

                        {' '}seleccionado

                        {
                          selectedMembers.length !==
                          1
                            ? 's'
                            : ''
                        }

                      </p>

                    )
                  }

                </div>


                {
                  totalPages >
                  1 &&
                  (

                    <div className="flex items-center gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage(
                            previous =>
                              Math.max(
                                1,
                                previous - 1
                              )
                          )
                        }
                        disabled={
                          currentPage === 1
                        }
                        className="h-9 px-3 rounded-lg bg-[#151515] border border-[#2a2a2a] text-gray-300 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#00ff88]/40 hover:text-white transition-colors"
                      >
                        Anterior
                      </button>


                      <div className="flex items-center gap-1">

                        {
                          Array.from(
                            {
                              length:
                                totalPages
                            },
                            (
                              _,
                              index
                            ) =>
                              index + 1
                          ).map(
                            page => (

                              <button
                                key={page}
                                type="button"
                                onClick={() =>
                                  setCurrentPage(
                                    page
                                  )
                                }
                                className={`
                                  min-w-9
                                  h-9
                                  px-2
                                  rounded-lg
                                  border
                                  text-sm
                                  font-medium
                                  transition-colors

                                  ${
                                    currentPage === page
                                      ? 'bg-[#00ff88] border-[#00ff88] text-black'
                                      : 'bg-[#151515] border-[#2a2a2a] text-gray-400 hover:text-white hover:border-[#00ff88]/40'
                                  }
                                `}
                              >
                                {page}
                              </button>

                            )
                          )
                        }

                      </div>


                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage(
                            previous =>
                              Math.min(
                                totalPages,
                                previous + 1
                              )
                          )
                        }
                        disabled={
                          currentPage === totalPages
                        }
                        className="h-9 px-3 rounded-lg bg-[#151515] border border-[#2a2a2a] text-gray-300 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#00ff88]/40 hover:text-white transition-colors"
                      >
                        Siguiente
                      </button>

                    </div>

                  )
                }

              </div>

            )
          }

        </main>

      </div>


      {/* ================================================= */}
      {/* MODAL BLOQUEAR / DESBLOQUEAR ACCESO */}
      {/* ================================================= */}

      {
        showAccessModal &&
        selectedAccessMember &&
        (

          <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4">

            <button
              type="button"
              aria-label="Cerrar"
              onClick={
                closeAccessModal
              }
              className="absolute inset-0 bg-black/80 backdrop-blur-[3px]"
            />


            <div className="relative w-full max-w-xl bg-[#101010] border border-[#242424] rounded-[26px] shadow-[0_35px_120px_rgba(0,0,0,0.75)] overflow-hidden">

              <div
                className={`
                  absolute
                  inset-x-0
                  top-0
                  h-px
                  bg-gradient-to-r
                  from-transparent

                  ${
                    selectedAccessMember.accessBlocked
                      ? 'via-[#00ff88]/60'
                      : 'via-red-500/60'
                  }

                  to-transparent
                `}
              />


              <button
                type="button"
                onClick={
                  closeAccessModal
                }
                className="absolute right-5 top-5 w-10 h-10 rounded-xl bg-[#191919] border border-[#292929] flex items-center justify-center text-gray-500 hover:text-white transition-colors"
              >

                <X
                  size={18}
                />

              </button>


              <div className="p-8">

                <div
                  className={`
                    w-16
                    h-16
                    rounded-2xl
                    flex
                    items-center
                    justify-center
                    mb-5

                    ${
                      selectedAccessMember.accessBlocked
                        ? 'bg-[#00ff88]/10'
                        : 'bg-red-500/10'
                    }
                  `}
                >

                  {
                    selectedAccessMember.accessBlocked
                      ? (

                        <LockOpen
                          size={30}
                          className="text-[#00ff88]"
                        />

                      )
                      : (

                        <Lock
                          size={30}
                          className="text-red-400"
                        />

                      )
                  }

                </div>


                <h2 className="text-white text-2xl font-bold">

                  {
                    selectedAccessMember.accessBlocked
                      ? 'Desbloquear acceso'
                      : 'Bloquear acceso'
                  }

                </h2>


                <p className="text-gray-400 text-sm leading-6 mt-2">

                  {
                    selectedAccessMember.accessBlocked
                      ? (
                          <>
                            Al desbloquear a{' '}
                            <span className="text-white font-medium">
                              {selectedAccessMember.firstName} {selectedAccessMember.lastName}
                            </span>
                            , podrá volver a ingresar utilizando QR, PIN o reconocimiento facial, siempre que su suscripción esté vigente.
                          </>
                        )
                      : (
                          <>
                            <span className="text-white font-medium">
                              {selectedAccessMember.firstName} {selectedAccessMember.lastName}
                            </span>
                            {' '}no podrá ingresar utilizando QR, PIN o reconocimiento facial hasta que un administrador retire el bloqueo.
                          </>
                        )
                  }

                </p>


                {
                  !selectedAccessMember.accessBlocked &&
                  (

                    <div className="mt-6">

                      <label className="text-white text-sm font-medium block mb-2">
                        Motivo del bloqueo <span className="text-red-400">*</span>
                      </label>


                      <textarea
                        value={
                          blockReason
                        }
                        onChange={
                          event => {

                            setBlockReason(
                              event.target.value
                            );


                            if (
                              accessError
                            ) {

                              setAccessError(
                                ''
                              );

                            }

                          }
                        }
                        placeholder="Ej. Pago pendiente, suspensión administrativa, solicitud del gimnasio..."
                        rows="4"
                        className={`
                          w-full
                          bg-[#191919]
                          border
                          rounded-xl
                          px-4
                          py-3
                          text-white
                          placeholder-gray-600
                          resize-none
                          focus:outline-none
                          transition-colors

                          ${
                            accessError
                              ? 'border-red-500'
                              : 'border-[#2a2a2a] focus:border-red-500/60'
                          }
                        `}
                      />


                      {
                        accessError &&
                        (

                          <div className="flex items-center gap-2 mt-2 text-red-400 text-xs">

                            <AlertCircle
                              size={14}
                            />

                            {accessError}

                          </div>

                        )
                      }

                    </div>

                  )
                }


                {
                  selectedAccessMember.accessBlocked &&
                  selectedAccessMember.blockReason &&
                  (

                    <div className="mt-6 bg-red-500/5 border border-red-500/15 rounded-xl p-4">

                      <p className="text-gray-500 text-xs uppercase tracking-wider">
                        Motivo registrado
                      </p>

                      <p className="text-gray-300 text-sm mt-1">
                        {selectedAccessMember.blockReason}
                      </p>

                    </div>

                  )
                }


                <div className="flex flex-col sm:flex-row gap-3 mt-7">

                  <button
                    type="button"
                    onClick={
                      closeAccessModal
                    }
                    disabled={
                      isSavingAccess
                    }
                    className="flex-1 px-5 py-3 bg-[#191919] border border-[#2a2a2a] rounded-xl text-white font-medium hover:border-[#3a3a3a] transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>


                  <button
                    type="button"
                    onClick={
                      handleAccessChange
                    }
                    disabled={
                      isSavingAccess
                    }
                    className={`
                      flex-1
                      px-5
                      py-3
                      rounded-xl
                      font-bold
                      flex
                      items-center
                      justify-center
                      gap-2
                      transition-all
                      disabled:opacity-50
                      disabled:cursor-not-allowed

                      ${
                        selectedAccessMember.accessBlocked
                          ? 'bg-[#00ff88] text-black hover:bg-[#00d977]'
                          : 'bg-red-500/15 border border-red-500/20 text-red-400 hover:bg-red-500/20'
                      }
                    `}
                  >

                    {
                      isSavingAccess
                        ? (

                          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />

                        )
                        : selectedAccessMember.accessBlocked
                          ? (

                            <CheckCircle2
                              size={18}
                            />

                          )
                          : (

                            <Lock
                              size={18}
                            />

                          )
                    }


                    {
                      selectedAccessMember.accessBlocked
                        ? 'Desbloquear acceso'
                        : 'Bloquear acceso'
                    }

                  </button>

                </div>

              </div>

            </div>

          </div>

        )
      }


      {/* ================================================= */}
      {/* MODAL ELIMINACIÓN PERMANENTE */}
      {/* ================================================= */}

      {
        showDeleteModal &&
        memberToDelete &&
        (

          <div className="fixed inset-0 z-[9100] flex items-center justify-center p-4">

            <button
              type="button"
              aria-label="Cerrar"
              onClick={
                closeDeleteModal
              }
              className="absolute inset-0 bg-black/85 backdrop-blur-[4px]"
            />


            <div className="relative w-full max-w-xl bg-[#101010] border border-red-500/20 rounded-[26px] shadow-[0_35px_120px_rgba(0,0,0,0.8)] overflow-hidden">

              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />


              <button
                type="button"
                onClick={
                  closeDeleteModal
                }
                disabled={
                  isDeletingMember
                }
                className="absolute right-5 top-5 w-10 h-10 rounded-xl bg-[#191919] border border-[#292929] flex items-center justify-center text-gray-500 hover:text-white disabled:opacity-50"
              >

                <X
                  size={18}
                />

              </button>


              <div className="p-8">

                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-5">

                  <Trash2
                    size={30}
                    className="text-red-400"
                  />

                </div>


                <h2 className="text-white text-2xl font-bold">
                  Eliminar miembro permanentemente
                </h2>


                <p className="text-gray-400 text-sm leading-6 mt-2">

                  Estás a punto de eliminar a{' '}

                  <span className="text-white font-semibold">
                    {memberToDelete.firstName} {memberToDelete.lastName}
                  </span>

                  {' '}(
                  <span className="font-mono text-red-400">
                    {memberToDelete.id}
                  </span>
                  ).

                </p>


                <div className="mt-5 p-4 rounded-xl bg-red-500/5 border border-red-500/15">

                  <p className="text-red-400 text-sm font-semibold">
                    Esta acción no se puede deshacer.
                  </p>


                  <p className="text-gray-400 text-xs leading-5 mt-2">
                    Se borrarán sus datos personales, fotografía, QR, PIN, biometría, suscripción, pagos, asistencias e historial de suscripciones almacenados localmente.
                  </p>


                  <p className="text-gray-500 text-xs leading-5 mt-2">
                    El contador de IDs no se retrocede. Si esta persona vuelve en el futuro, deberá registrarse desde cero y recibirá un nuevo ID.
                  </p>

                </div>


                <div className="mt-6">
                  <div className="mt-6">

  <label className="text-white text-sm font-medium block mb-2">
    Motivo de eliminación
    <span className="text-red-400">
      {' '}*
    </span>
  </label>


  <textarea

    value={
      deleteReason
    }

    onChange={
      event => {

        setDeleteReason(
          event.target.value
        );


        if (
          deleteError
        ) {

          setDeleteError(
            ''
          );

        }

      }
    }

    rows="4"

    placeholder="Ej. Incumplimiento de reglamento, solicitud del cliente, adeudo, comportamiento inapropiado..."

    className={`
      w-full
      bg-[#191919]
      border
      rounded-xl
      px-4
      py-3
      text-white
      placeholder-gray-600
      resize-none
      focus:outline-none
      transition-colors

      ${
        deleteError &&
        !deleteReason.trim()
          ? 'border-red-500'
          : 'border-[#2a2a2a] focus:border-red-500/60'
      }
    `}
  />


  <p className="text-gray-500 text-xs mt-2 leading-5">
    Este motivo se conservará como antecedente en la lista negra aunque los datos operativos del miembro sean eliminados.
  </p>

</div>

                  <label className="text-white text-sm font-medium block mb-2">
                    Para confirmar escribe <span className="text-red-400 font-bold">ELIMINAR</span>
                  </label>


                  <input
                    type="text"
                    value={
                      deleteConfirmation
                    }
                    onChange={
                      event => {

                        setDeleteConfirmation(
                          event.target.value
                        );


                        if (
                          deleteError
                        ) {

                          setDeleteError(
                            ''
                          );

                        }

                      }
                    }
                    autoComplete="off"
                    placeholder="ELIMINAR"
                    className={`
                      w-full
                      bg-[#191919]
                      border
                      rounded-xl
                      px-4
                      py-3
                      text-white
                      placeholder-gray-600
                      focus:outline-none
                      transition-colors

                      ${
                        deleteError
                          ? 'border-red-500'
                          : 'border-[#2a2a2a] focus:border-red-500/60'
                      }
                    `}
                  />


                  {
                    deleteError &&
                    (

                      <div className="flex items-center gap-2 mt-2 text-red-400 text-xs">

                        <AlertCircle
                          size={14}
                        />

                        {deleteError}

                      </div>

                    )
                  }

                </div>


                <div className="flex flex-col sm:flex-row gap-3 mt-7">

                  <button
                    type="button"
                    onClick={
                      closeDeleteModal
                    }
                    disabled={
                      isDeletingMember
                    }
                    className="flex-1 px-5 py-3 bg-[#191919] border border-[#2a2a2a] rounded-xl text-white font-medium hover:border-[#3a3a3a] disabled:opacity-50"
                  >
                    Cancelar
                  </button>


                  <button
                    type="button"
                    onClick={
                      handlePermanentDelete
                    }
                    disabled={
  isDeletingMember ||
  !deleteReason.trim() ||
  deleteConfirmation
    .trim()
    .toUpperCase() !==
  'ELIMINAR'
}
                    className="flex-1 px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-red-500/15 border border-red-500/20 text-red-400 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  >

                    {
                      isDeletingMember
                        ? (

                          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />

                        )
                        : (

                          <Trash2
                            size={18}
                          />

                        )
                    }

                    Eliminar definitivamente

                  </button>

                </div>

              </div>

            </div>

          </div>

        )
      }

    </div>

  );

};


export default MembersPage;