// src/components/Dashboard/RetentionPanel.jsx

import React, {
  useMemo
} from 'react';

import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  MessageCircle,
  ShieldAlert,
  UserRoundCheck
} from 'lucide-react';

import {
  useNavigate
} from 'react-router-dom';

import {
  canAccess
} from '../../services/authService';

import {
  useGymSettings
} from '../../context/GymSettingsContext';

import {
  buildRetentionMembers,
  createRetentionWhatsAppUrl,
  getRetentionStats
} from '../../services/retentionService';


const RetentionPanel = ({
  members = [],
  attendance = []
}) => {

  const navigate =
    useNavigate();


  const {
    settings
  } = useGymSettings();


  const canView =
    canAccess(
      'retention'
    );


  const candidates =
    useMemo(
      () =>
        buildRetentionMembers({
          members,
          attendance,
          settings
        })
          .filter(
            member =>
              member.retention.level !==
              'frequent'
          )
          .slice(
            0,
            5
          ),
      [
        members,
        attendance,
        settings
      ]
    );


  const stats =
    useMemo(
      () =>
        getRetentionStats({
          members,
          attendance,
          settings
        }),
      [
        members,
        attendance,
        settings
      ]
    );


  if (
    !canView ||
    settings?.retention?.enabled ===
      false
  ) {

    return null;

  }


  const openWhatsApp =
    member => {

      const url =
        createRetentionWhatsAppUrl(
          member,
          settings?.shortName ||
          settings?.gymName ||
          'el gimnasio'
        );


      if (!url) {
        return;
      }


      window.open(
        url,
        '_blank',
        'noopener,noreferrer'
      );

    };


  return (

    <section className="bg-[#101010] border border-[#1d1d1d] rounded-2xl overflow-hidden">

      <div className="p-5 border-b border-[#1d1d1d] flex items-center justify-between flex-wrap gap-3">

        <div>

          <p className="text-[#00ff88] text-[10px] uppercase tracking-[0.18em] font-bold">
            Retención
          </p>

          <h2 className="text-white text-lg font-bold mt-1">
            Miembros que requieren atención
          </h2>

          <p className="text-gray-600 text-xs mt-1">
            Suscripción activa, pero llevan varios días sin asistir.
          </p>

        </div>


        <button
          type="button"
          onClick={() =>
            navigate(
              '/retention'
            )
          }
          className="px-3 py-2 rounded-xl bg-[#171717] border border-[#272727] text-gray-300 text-xs hover:border-[#00ff88]/40 flex items-center gap-2"
        >
          Ver todos

          <ArrowRight
            size={14}
          />
        </button>

      </div>


      <div className="grid grid-cols-3 border-b border-[#1d1d1d]">

        <div className="p-4 border-r border-[#1d1d1d]">
          <Clock3
            size={16}
            className="text-yellow-400"
          />
          <p className="text-xl font-black text-white mt-2">
            {stats.followup}
          </p>
          <p className="text-gray-600 text-[10px]">
            Seguimiento
          </p>
        </div>


        <div className="p-4 border-r border-[#1d1d1d]">
          <AlertTriangle
            size={16}
            className="text-orange-400"
          />
          <p className="text-xl font-black text-white mt-2">
            {stats.risk}
          </p>
          <p className="text-gray-600 text-[10px]">
            En riesgo
          </p>
        </div>


        <div className="p-4">
          <ShieldAlert
            size={16}
            className="text-red-400"
          />
          <p className="text-xl font-black text-white mt-2">
            {stats.inactive}
          </p>
          <p className="text-gray-600 text-[10px]">
            Inactivos
          </p>
        </div>

      </div>


      {
        candidates.length ===
        0
          ? (

            <div className="py-12 text-center">

              <UserRoundCheck
                size={36}
                className="text-[#00ff88] mx-auto"
              />

              <p className="text-white text-sm font-semibold mt-3">
                Todo en orden
              </p>

              <p className="text-gray-600 text-xs mt-1">
                No hay miembros con señales de inactividad.
              </p>

            </div>

          )
          : (

            <div>

              {candidates.map(
                member => (

                  <div
                    key={
                      member.id
                    }
                    className="p-4 border-b border-[#181818] last:border-0 flex items-center gap-3"
                  >

                    <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-[#292929] overflow-hidden flex items-center justify-center shrink-0">

                      {
                        member.profilePhoto
                          ? (

                            <img
                              src={
                                member.profilePhoto
                              }
                              alt=""
                              className="w-full h-full object-cover"
                            />

                          )
                          : (

                            <span className="text-[#00ff88] text-xs font-bold">
                              {
                                `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`
                                  .toUpperCase()
                              }
                            </span>

                          )
                      }

                    </div>


                    <div className="flex-1 min-w-0">

                      <p className="text-white text-sm font-medium truncate">
                        {`${member.firstName || ''} ${member.lastName || ''}`.trim()}
                      </p>

                      <p className="text-gray-600 text-[10px]">
                        {member.retention.daysWithoutAttendance} días sin asistir · {member.retention.label}
                      </p>

                    </div>


                    <button
                      type="button"
                      onClick={() =>
                        openWhatsApp(
                          member
                        )
                      }
                      disabled={
                        !member.phone
                      }
                      className="w-9 h-9 rounded-lg bg-[#00ff88]/10 text-[#00ff88] flex items-center justify-center disabled:opacity-30"
                      title="Contactar por WhatsApp"
                    >
                      <MessageCircle
                        size={16}
                      />
                    </button>

                  </div>

                )
              )}

            </div>

          )
      }

    </section>

  );

};


export default RetentionPanel;
