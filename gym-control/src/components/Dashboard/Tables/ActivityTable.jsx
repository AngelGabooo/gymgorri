
import React from 'react';

import {
  ArrowDownLeft,
  ArrowUpRight,
  ScanFace,
  QrCode,
  KeyRound,
  UserRound
} from 'lucide-react';


const getStatusClasses = (
  status
) => {

  const colors = {
    'Acceso permitido':
      'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/15',

    'Acceso bloqueado':
      'bg-red-500/10 text-red-400 border-red-500/15',

    'Salida registrada':
      'bg-blue-500/10 text-blue-400 border-blue-500/15',

    'Pase de visita':
      'bg-purple-500/10 text-purple-400 border-purple-500/15'
  };


  return colors[status] ||
    'bg-gray-500/10 text-gray-400 border-gray-500/15';

};


const getMethodIcon = (
  method
) => {

  const value =
    String(
      method || ''
    )
      .toLowerCase();


  if (
    value.includes(
      'rostro'
    ) ||
    value.includes(
      'face'
    ) ||
    value.includes(
      'biometr'
    )
  ) {
    return ScanFace;
  }


  if (
    value.includes(
      'pin'
    )
  ) {
    return KeyRound;
  }


  return QrCode;

};


const getInitials = (
  name
) => {

  return String(
    name ||
    'M'
  )
    .trim()
    .split(/\s+/)
    .slice(
      0,
      2
    )
    .map(
      part =>
        part[0]
    )
    .join('')
    .toUpperCase();

};


const ActivityTable = ({
  activities = [],
  onMemberClick
}) => {

  return (

    <div className="overflow-x-auto">

      <table className="w-full">

        <thead>

          <tr className="border-b border-[#1d1d1d]">

            <th className="text-left py-3 px-3 text-gray-600 text-[10px] font-semibold uppercase tracking-[0.14em]">
              Miembro
            </th>

            <th className="text-left py-3 px-3 text-gray-600 text-[10px] font-semibold uppercase tracking-[0.14em]">
              Movimiento
            </th>

            <th className="text-left py-3 px-3 text-gray-600 text-[10px] font-semibold uppercase tracking-[0.14em]">
              Método
            </th>

            <th className="text-left py-3 px-3 text-gray-600 text-[10px] font-semibold uppercase tracking-[0.14em]">
              Suscripción
            </th>

            <th className="text-right py-3 px-3 text-gray-600 text-[10px] font-semibold uppercase tracking-[0.14em]">
              Hora
            </th>

          </tr>

        </thead>


        <tbody>

          {
            activities.map(
              (
                activity,
                index
              ) => {

                const MethodIcon =
                  getMethodIcon(
                    activity.method
                  );


                const isEntry =
                  activity.movement ===
                  'Entrada';


                const MovementIcon =
                  isEntry
                    ? ArrowDownLeft
                    : ArrowUpRight;


                return (

                  <tr
                    key={`${activity.id}-${activity.timestamp || index}`}
                    className="border-b border-[#171717] last:border-0 hover:bg-[#151515] transition-colors"
                  >

                    <td className="py-3.5 px-3">

                      <button
                        type="button"
                        onClick={() =>
                          onMemberClick?.(
                            activity
                          )
                        }
                        className="flex items-center gap-3 text-left group"
                      >

                        <div className="w-9 h-9 rounded-xl bg-[#1a1a1a] border border-[#242424] flex items-center justify-center overflow-hidden shrink-0">

                          {
                            activity.photo
                              ? (

                                <img
                                  src={
                                    activity.photo
                                  }
                                  alt={
                                    activity.name
                                  }
                                  className="w-full h-full object-cover"
                                />

                              )
                              : activity.name
                                ? (

                                  <span className="text-white text-[10px] font-bold">
                                    {
                                      getInitials(
                                        activity.name
                                      )
                                    }
                                  </span>

                                )
                                : (

                                  <UserRound
                                    size={16}
                                    className="text-gray-600"
                                  />

                                )
                          }

                        </div>


                        <div className="min-w-0">

                          <p className="text-white text-sm font-medium truncate max-w-[180px] group-hover:text-[#00ff88] transition-colors">
                            {activity.name}
                          </p>

                          <p className="text-gray-600 text-[10px] font-mono mt-0.5">
                            {activity.id}
                          </p>

                        </div>

                      </button>

                    </td>


                    <td className="py-3.5 px-3">

                      <div
                        className={`
                          inline-flex
                          items-center
                          gap-1.5
                          px-2.5
                          py-1.5
                          rounded-lg
                          text-[10px]
                          font-semibold
                          border
                          ${getStatusClasses(
                            activity.status
                          )}
                        `}
                      >

                        <MovementIcon size={12} />

                        {activity.movement}

                      </div>

                    </td>


                    <td className="py-3.5 px-3">

                      <div className="flex items-center gap-2 text-gray-400 text-xs">

                        <MethodIcon
                          size={14}
                          className="text-gray-600"
                        />

                        <span className="capitalize">
                          {activity.method || 'Acceso'}
                        </span>

                      </div>

                    </td>


                    <td className="py-3.5 px-3">

                      <span
                        className={`
                          text-xs

                          ${
                            activity.subscription ===
                            'Activa'
                              ? 'text-[#00ff88]'
                              : activity.subscription ===
                                'Por vencer'
                                ? 'text-yellow-400'
                                : 'text-gray-500'
                          }
                        `}
                      >
                        {activity.subscription}
                      </span>

                    </td>


                    <td className="py-3.5 px-3 text-right">

                      <span className="text-gray-300 text-xs font-mono">
                        {activity.time}
                      </span>

                    </td>

                  </tr>

                );

              }
            )
          }

        </tbody>

      </table>

    </div>

  );

};


export default ActivityTable;