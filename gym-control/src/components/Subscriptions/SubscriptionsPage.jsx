// src/components/Subscriptions/SubscriptionsPage.jsx

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  Plus,
  Eye,
  RefreshCw,
  Download,
  User,
} from 'lucide-react';

import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import SubscriptionStatCard from './Cards/SubscriptionStatCard';
import WhatsAppButton from '../WhatsApp/WhatsAppButton';

import {
  getStoredMembers
} from '../../utils/memberId';


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
// PARSEAR FECHAS
// ======================================================

const parseGymDate = (value) => {

  if (!value) {
    return null;
  }


  // Primero intentar fecha normal/ISO
  const direct =
    new Date(value);


  if (
    !Number.isNaN(
      direct.getTime()
    )
  ) {

    return direct;

  }


  // Soporta:
  // 14 ago 2026
  // 13 sept 2026

  const cleaned =
    String(value)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');


  const parts =
    cleaned.split(' ');


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
    59,
    999
  );

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
    return String(value);
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
// DÍAS RESTANTES
// ======================================================

const getRemainingDays = (endDate) => {

  const expiration =
    parseGymDate(endDate);


  if (!expiration) {
    return null;
  }


  const today =
    new Date();


  today.setHours(
    0,
    0,
    0,
    0
  );


  expiration.setHours(
    23,
    59,
    59,
    999
  );


  const difference =
    expiration.getTime() -
    today.getTime();


  return Math.ceil(
    difference /
    (1000 * 60 * 60 * 24)
  );

};


// ======================================================
// ESTADO DE SUSCRIPCIÓN
// ======================================================

const getSubscriptionStatus = (member) => {

  if (
    member?.accessBlocked === true
  ) {

    return 'Bloqueada';

  }


  if (
    !member?.subscription
  ) {

    return 'Sin suscripción';

  }


  const remainingDays =
    getRemainingDays(
      member.subscription.endDate
    );


  // Si no podemos interpretar la fecha,
  // usamos el status guardado.
  if (
    remainingDays === null
  ) {

    if (
      member.subscription.status === 'active'
    ) {

      return 'Activa';

    }


    return 'Sin suscripción';

  }


  if (
    remainingDays < 0
  ) {

    return 'Vencida';

  }


  if (
    remainingDays <= 5
  ) {

    return 'Por vencer';

  }


  return 'Activa';

};


// ======================================================
// TEXTO TIEMPO RESTANTE
// ======================================================

const getRemainingText = (member) => {

  if (
    !member.subscription
  ) {

    return '—';

  }


  const days =
    getRemainingDays(
      member.subscription.endDate
    );


  if (
    days === null
  ) {

    return 'Sin calcular';

  }


  if (
    days < 0
  ) {

    const expiredDays =
      Math.abs(days);


    return expiredDays === 1
      ? 'Venció hace 1 día'
      : `Venció hace ${expiredDays} días`;

  }


  if (
    days === 0
  ) {

    return 'Vence hoy';

  }


  if (
    days === 1
  ) {

    return '1 día';

  }


  return `${days} días`;

};


// ======================================================
// ESTILOS SEGÚN ESTADO
// ======================================================

const getStatusStyle = (status) => {

  switch (status) {

    case 'Activa':

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


    case 'Vencida':

      return {
        badge:
          'bg-red-500/10 text-red-400 border-red-500/20',

        dot:
          'bg-red-400'
      };


    case 'Bloqueada':

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
// COMPONENTE
// ======================================================

const SubscriptionsPage = () => {

  const navigate =
    useNavigate();


  // ======================================================
  // ESTADOS
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
  ] = useState('Todas');


  // ======================================================
  // CARGAR DATOS
  // ======================================================

  const loadMembers = () => {

    const stored =
      getStoredMembers();


    console.log(
      '📅 Miembros cargados para suscripciones:',
      stored
    );


    setMembers(
      stored
    );

  };


  // ======================================================
  // CARGAR AL ABRIR LA PANTALLA
  // ======================================================

  useEffect(
    () => {

      loadMembers();


      const handleStorageChange =
        () => {

          loadMembers();

        };


      window.addEventListener(
        'storage',
        handleStorageChange
      );


      window.addEventListener(
        'gym-storage-update',
        handleStorageChange
      );


      return () => {

        window.removeEventListener(
          'storage',
          handleStorageChange
        );


        window.removeEventListener(
          'gym-storage-update',
          handleStorageChange
        );

      };

    },
    []
  );


  // ======================================================
  // CONSTRUIR FILAS
  // ======================================================

  const subscriptions =
    useMemo(
      () => {

        return members.map(
          member => {

            const subscription =
              member.subscription ||
              null;


            const status =
              getSubscriptionStatus(
                member
              );


            const remainingDays =
              subscription
                ? getRemainingDays(
                    subscription.endDate
                  )
                : null;


            return {

              memberId:
                member.id,

              firstName:
                member.firstName ||
                '',

              lastName:
                member.lastName ||
                '',

              phone:
                member.phone ||
                '',

              email:
                member.email ||
                '',

              profilePhoto:
                member.profilePhoto ||
                null,

              accessBlocked:
                member.accessBlocked ===
                true,

              plan:
                subscription?.plan ||
                null,

              days:
                subscription?.days ||
                null,

              startDate:
                subscription?.startDate ||
                null,

              endDate:
                subscription?.endDate ||
                null,

              paymentMethod:
                subscription?.paymentMethod ||
                null,

              amount:
                subscription?.amount ||
                null,

              subscriptionStatus:
                subscription?.status ||
                null,

              status,

              remainingDays,

              member,

            };

          }
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

        const active =
          subscriptions.filter(
            item =>
              item.status ===
              'Activa'
          ).length;


        const expiring =
          subscriptions.filter(
            item =>
              item.status ===
              'Por vencer'
          ).length;


        const expired =
          subscriptions.filter(
            item =>
              item.status ===
              'Vencida'
          ).length;


        // Por ahora será 0 hasta que conectemos
        // el historial real de renovaciones.
        const renewals = 0;


        return {
          active,
          expiring,
          expired,
          renewals
        };

      },
      [subscriptions]
    );


  // ======================================================
  // PORCENTAJE ACTIVOS
  // ======================================================

  const activePercentage =
    useMemo(
      () => {

        if (
          members.length === 0
        ) {

          return 0;

        }


        return Math.round(
          (
            stats.active /
            members.length
          ) *
          100
        );

      },
      [
        stats.active,
        members.length
      ]
    );


  // ======================================================
  // FILTROS CON CONTADORES
  // ======================================================

  const filters =
    useMemo(
      () => [

        {
          name: 'Todas',
          count:
            subscriptions.length
        },

        {
          name: 'Activas',
          count:
            subscriptions.filter(
              item =>
                item.status ===
                'Activa'
            ).length
        },

        {
          name: 'Por vencer',
          count:
            subscriptions.filter(
              item =>
                item.status ===
                'Por vencer'
            ).length
        },

        {
          name: 'Vencidas',
          count:
            subscriptions.filter(
              item =>
                item.status ===
                'Vencida'
            ).length
        },

        {
          name: 'Sin suscripción',
          count:
            subscriptions.filter(
              item =>
                item.status ===
                'Sin suscripción'
            ).length
        },

        {
          name: 'Bloqueadas',
          count:
            subscriptions.filter(
              item =>
                item.status ===
                'Bloqueada'
            ).length
        },

      ],
      [subscriptions]
    );


  // ======================================================
  // BUSCADOR Y FILTRO
  // ======================================================

  const filteredSubscriptions =
    useMemo(
      () => {

        const term =
          searchTerm
            .trim()
            .toLowerCase();


        return subscriptions.filter(
          item => {

            const fullName =
              `${item.firstName} ${item.lastName}`
                .trim()
                .toLowerCase();


            const matchesSearch =
              !term ||

              fullName.includes(
                term
              ) ||

              String(
                item.memberId ||
                ''
              )
                .toLowerCase()
                .includes(term) ||

              String(
                item.phone ||
                ''
              )
                .toLowerCase()
                .includes(term) ||

              String(
                item.email ||
                ''
              )
                .toLowerCase()
                .includes(term);


            let matchesFilter =
              true;


            if (
              activeFilter ===
              'Activas'
            ) {

              matchesFilter =
                item.status ===
                'Activa';

            }


            if (
              activeFilter ===
              'Por vencer'
            ) {

              matchesFilter =
                item.status ===
                'Por vencer';

            }


            if (
              activeFilter ===
              'Vencidas'
            ) {

              matchesFilter =
                item.status ===
                'Vencida';

            }


            if (
              activeFilter ===
              'Sin suscripción'
            ) {

              matchesFilter =
                item.status ===
                'Sin suscripción';

            }


            if (
              activeFilter ===
              'Bloqueadas'
            ) {

              matchesFilter =
                item.status ===
                'Bloqueada';

            }


            return (
              matchesSearch &&
              matchesFilter
            );

          }
        );

      },
      [
        subscriptions,
        searchTerm,
        activeFilter
      ]
    );


  // ======================================================
  // EXPORTAR CSV
  // ======================================================

  const handleExport = () => {

    if (
      subscriptions.length === 0
    ) {

      return;

    }


    const rows = [

      [
        'ID',
        'Nombre',
        'Telefono',
        'Plan',
        'Inicio',
        'Vencimiento',
        'Monto',
        'Metodo de pago',
        'Estado'
      ],

      ...subscriptions.map(
        item => [

          item.memberId,

          `${item.firstName} ${item.lastName}`.trim(),

          item.phone,

          item.plan ||
          'Sin suscripción',

          item.startDate ||
          '',

          item.endDate ||
          '',

          item.amount ||
          '',

          item.paymentMethod ||
          '',

          item.status

        ]
      )

    ];


    const csv =
      rows
        .map(
          row =>
            row
              .map(
                value =>
                  `"${String(
                    value ?? ''
                  ).replace(
                    /"/g,
                    '""'
                  )}"`
              )
              .join(',')
        )
        .join('\n');


    const blob =
      new Blob(
        [
          '\uFEFF',
          csv
        ],
        {
          type:
            'text/csv;charset=utf-8;'
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        'a'
      );


    link.href =
      url;


    link.download =
      `suscripciones-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;


    link.click();


    URL.revokeObjectURL(
      url
    );

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
        activePage="Suscripciones"
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
                Suscripciones
              </h1>


              <p className="text-gray-400">
                Administra, supervisa y renueva las suscripciones de los miembros.
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

            <SubscriptionStatCard
              title="Suscripciones activas"
              value={
                stats.active
              }
              subtitle="Miembros con acceso habilitado"
              icon={
                CheckCircle
              }
              color="green"
              trend={`${activePercentage}% del total`}
            />


            <SubscriptionStatCard
              title="Por vencer"
              value={
                stats.expiring
              }
              subtitle="Vencen en los próximos 5 días"
              icon={
                Clock
              }
              color="yellow"
              action="Revisar"
            />


            <SubscriptionStatCard
              title="Vencidas"
              value={
                stats.expired
              }
              subtitle="Requieren renovación"
              icon={
                XCircle
              }
              color="red"
              trend={
                stats.expired > 0
                  ? 'Requieren renovación'
                  : 'Sin vencidas'
              }
            />


            <SubscriptionStatCard
              title="Renovaciones del mes"
              value={
                stats.renewals
              }
              subtitle="Renovaciones realizadas"
              icon={
                RefreshCw
              }
              color="green"
              trend="Sin datos"
            />

          </div>


          {/* ================================================= */}
          {/* ALERTA */}
          {/* ================================================= */}

          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

              <div className="flex items-start gap-3">

                <AlertCircle
                  size={20}
                  className="text-yellow-500 mt-0.5 shrink-0"
                />


                <div>

                  <p className="text-white font-medium">

                    {
                      stats.expiring
                    }

                    {' '}

                    {
                      stats.expiring === 1
                        ? 'suscripción está próxima a vencer'
                        : 'suscripciones están próximas a vencer'
                    }

                  </p>


                  <p className="text-gray-400 text-sm">

                    {
                      stats.expiring > 0
                        ? 'Revisa los miembros que vencen en los próximos 5 días.'
                        : 'No hay suscripciones que vencen en los próximos 5 días.'
                    }

                  </p>

                </div>

              </div>


              <div className="flex gap-2">

                <button
                  type="button"
                  onClick={() => {

                    setActiveFilter(
                      'Por vencer'
                    );

                  }}
                  className="text-[#00ff88] text-sm hover:underline"
                >
                  Ver miembros
                </button>


                <button
                  type="button"
                  onClick={() => {

                    setActiveFilter(
                      'Por vencer'
                    );

                  }}
                  className="px-4 py-1.5 bg-[#00ff88] text-black rounded-lg text-sm font-medium hover:bg-[#00cc6a] transition-colors"
                >
                  Gestionar renovaciones
                </button>

              </div>

            </div>

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
                placeholder="Buscar miembro, ID o teléfono..."
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


            <div className="flex gap-2">

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
                onClick={
                  handleExport
                }
                disabled={
                  subscriptions.length === 0
                }
                className="px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >

                <Download
                  size={18}
                />

                Exportar

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

                Nueva suscripción

              </button>

            </div>

          </div>


          {/* ================================================= */}
          {/* FILTROS */}
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

                        <Calendar
                          size={48}
                          className="text-gray-600"
                        />

                      </div>

                    </div>


                    <h3 className="text-white text-xl font-bold mb-2">
                      Todavía no hay suscripciones
                    </h3>


                    <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
                      Las suscripciones activadas para los miembros aparecerán aquí.
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

                      <Plus
                        size={18}
                      />

                      Crear primera suscripción

                    </button>

                  </div>

                )
                : filteredSubscriptions.length ===
                    0
                  ? (

                    // ==================================================
                    // SIN RESULTADOS
                    // ==================================================

                    <div className="text-center py-16">

                      <Search
                        size={44}
                        className="text-gray-600 mx-auto mb-4"
                      />


                      <h3 className="text-white text-lg font-bold">
                        No encontramos resultados
                      </h3>


                      <p className="text-gray-500 text-sm mt-2">
                        Cambia la búsqueda o selecciona otro filtro.
                      </p>

                    </div>

                  )
                  : (

                    // ==================================================
                    // TABLA CON DATOS
                    // ==================================================

                    <div className="overflow-x-auto">

                      <table className="w-full">

                        <thead className="bg-[#0d0d0d] border-b border-[#1a1a1a]">

                          <tr>

                            <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">
                              Miembro
                            </th>


                            <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">
                              Plan
                            </th>


                            <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">
                              Inicio
                            </th>


                            <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">
                              Vencimiento
                            </th>


                            <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">
                              Tiempo restante
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
                            filteredSubscriptions.map(
                              item => {

                                const fullName =
                                  `${item.firstName} ${item.lastName}`
                                    .trim();


                                const styles =
                                  getStatusStyle(
                                    item.status
                                  );


                                return (

                                  <tr
                                    key={
                                      item.memberId
                                    }
                                    className="border-b border-[#1a1a1a] last:border-b-0 hover:bg-[#151515] transition-colors"
                                  >


                                    {/* ================================================= */}
                                    {/* MIEMBRO */}
                                    {/* ================================================= */}

                                    <td className="py-4 px-4">

                                      <div className="flex items-center gap-3">

                                        <div className="w-11 h-11 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center overflow-hidden shrink-0">

                                          {
                                            item.profilePhoto
                                              ? (

                                                <img
                                                  src={
                                                    item.profilePhoto
                                                  }
                                                  alt={
                                                    fullName
                                                  }
                                                  className="w-full h-full object-cover"
                                                />

                                              )
                                              : (

                                                <User
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
                                                `/members/${item.memberId}`
                                              )
                                            }
                                            className="text-white font-semibold hover:text-[#00ff88] transition-colors text-left"
                                          >

                                            {
                                              fullName ||
                                              'Sin nombre'
                                            }

                                          </button>


                                          <p className="text-gray-500 font-mono text-xs mt-1">
                                            {
                                              item.memberId
                                            }
                                          </p>


                                          <p className="text-gray-600 text-xs mt-0.5">
                                            {
                                              item.phone ||
                                              'Sin teléfono'
                                            }
                                          </p>

                                        </div>

                                      </div>

                                    </td>


                                    {/* ================================================= */}
                                    {/* PLAN */}
                                    {/* ================================================= */}

                                    <td className="py-4 px-4">

                                      {
                                        item.plan
                                          ? (

                                            <>

                                              <p className="text-white text-sm capitalize">
                                                {
                                                  item.plan
                                                }
                                              </p>


                                              <p className="text-gray-500 text-xs mt-1">

                                                {
                                                  item.days ||
                                                  30
                                                }

                                                {' '}días

                                              </p>


                                              {
                                                item.amount &&
                                                (

                                                  <p className="text-gray-600 text-xs mt-1">

                                                    $

                                                    {
                                                      item.amount
                                                    }

                                                    {' '}MXN

                                                  </p>

                                                )
                                              }

                                            </>

                                          )
                                          : (

                                            <span className="text-gray-500 text-sm">
                                              Sin plan
                                            </span>

                                          )
                                      }

                                    </td>


                                    {/* ================================================= */}
                                    {/* INICIO */}
                                    {/* ================================================= */}

                                    <td className="py-4 px-4">

                                      <span className="text-gray-300 text-sm">

                                        {
                                          item.startDate
                                            ? formatDate(
                                                item.startDate
                                              )
                                            : '—'
                                        }

                                      </span>

                                    </td>


                                    {/* ================================================= */}
                                    {/* VENCIMIENTO */}
                                    {/* ================================================= */}

                                    <td className="py-4 px-4">

                                      <span className="text-gray-300 text-sm">

                                        {
                                          item.endDate
                                            ? formatDate(
                                                item.endDate
                                              )
                                            : '—'
                                        }

                                      </span>

                                    </td>


                                    {/* ================================================= */}
                                    {/* TIEMPO RESTANTE */}
                                    {/* ================================================= */}

                                    <td className="py-4 px-4">

                                      <span
                                        className={
                                          item.status ===
                                          'Por vencer'

                                            ? 'text-yellow-400 text-sm font-medium'

                                            : item.status ===
                                              'Vencida'

                                              ? 'text-red-400 text-sm'

                                              : item.status ===
                                                'Activa'

                                                ? 'text-[#00ff88] text-sm'

                                                : 'text-gray-500 text-sm'
                                        }
                                      >

                                        {
                                          getRemainingText(
                                            item
                                          )
                                        }

                                      </span>

                                    </td>


                                    {/* ================================================= */}
                                    {/* ESTADO */}
                                    {/* ================================================= */}

                                    <td className="py-4 px-4">

                                      <span
                                        className={`
                                          inline-flex items-center gap-2
                                          px-2.5 py-1
                                          rounded-full
                                          border
                                          text-xs
                                          font-medium

                                          ${
                                            styles.badge
                                          }
                                        `}
                                      >

                                        <span
                                          className={`
                                            w-1.5 h-1.5
                                            rounded-full

                                            ${
                                              styles.dot
                                            }
                                          `}
                                        />


                                        {
                                          item.status
                                        }

                                      </span>

                                    </td>


                                    {/* ================================================= */}
                                    {/* ACCIONES */}
                                    {/* ================================================= */}

                                    <td className="py-4 px-4">

                                      <div className="flex items-center gap-2">


                                        <button
                                          type="button"
                                          title="Ver miembro"
                                          onClick={() =>
                                            navigate(
                                              `/members/${item.memberId}`
                                            )
                                          }
                                          className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-[#00ff88] hover:border-[#00ff88]/40 flex items-center justify-center transition-colors"
                                        >

                                          <Eye
                                            size={16}
                                          />

                                        </button>


                                        <WhatsAppButton
                                          member={
                                            item.member
                                          }
                                          compact
                                          defaultType={
                                            item.status === 'Vencida'
                                              ? 'expired'
                                              : item.status === 'Por vencer'
                                                ? 'expiring'
                                                : 'renewal'
                                          }
                                          extras={{
                                            daysRemaining:
                                              item.remainingDays
                                          }}
                                        />


                                        {
                                          item.status !==
                                          'Sin suscripción'
                                            ? (

                                              <button
                                                type="button"
                                                title="Renovar suscripción"
                                                onClick={() =>
                                                  navigate(
                                                    `/members/${item.memberId}/renew`
                                                  )
                                                }
                                                className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-[#00ff88] hover:border-[#00ff88]/40 flex items-center justify-center transition-colors"
                                              >

                                                <RefreshCw
                                                  size={16}
                                                />

                                              </button>

                                            )
                                            : (

                                              <button
                                                type="button"
                                                title="Crear suscripción"
                                                onClick={() =>
                                                  navigate(
                                                    `/members/${item.memberId}/renew`
                                                  )
                                                }
                                                className="px-3 h-9 rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] hover:bg-[#00ff88]/20 text-xs font-medium transition-colors"
                                              >
                                                Activar
                                              </button>

                                            )
                                        }

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
          {/* RESUMEN INFERIOR */}
          {/* ================================================= */}

          {
            !isEmpty &&
            (

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

                <p className="text-gray-400 text-sm">

                  Mostrando{' '}

                  <span className="text-white font-medium">

                    {
                      filteredSubscriptions.length
                    }

                  </span>

                  {' '}de{' '}

                  <span className="text-white font-medium">

                    {
                      subscriptions.length
                    }

                  </span>

                  {' '}miembros

                </p>


                <p className="text-gray-500 text-xs">

                  {
                    stats.active
                  }

                  {' '}activas ·{' '}

                  {
                    stats.expiring
                  }

                  {' '}por vencer ·{' '}

                  {
                    stats.expired
                  }

                  {' '}vencidas

                </p>

              </div>

            )
          }

        </main>

      </div>

    </div>

  );

};


export default SubscriptionsPage;