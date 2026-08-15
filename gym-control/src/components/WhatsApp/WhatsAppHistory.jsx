// src/components/WhatsApp/WhatsAppHistory.jsx

import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  MessageCircle,
  Clock3
} from 'lucide-react';

import {
  getMemberWhatsAppHistory,
  WHATSAPP_TEMPLATE_TYPES
} from '../../services/whatsappService';


const formatDateTime = (
  value
) => {

  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Fecha no disponible';
  }


  return new Intl.DateTimeFormat(
    'es-MX',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  ).format(
    date
  );

};


const WhatsAppHistory = ({
  memberId
}) => {

  const [
    refreshToken,
    setRefreshToken
  ] = useState(0);


  useEffect(
    () => {

      const refresh =
        () =>
          setRefreshToken(
            previous =>
              previous + 1
          );


      window.addEventListener(
        'gym-whatsapp-update',
        refresh
      );


      window.addEventListener(
        'gym-storage-update',
        refresh
      );


      return () => {

        window.removeEventListener(
          'gym-whatsapp-update',
          refresh
        );


        window.removeEventListener(
          'gym-storage-update',
          refresh
        );

      };

    },
    []
  );


  const history =
    useMemo(
      () =>
        memberId
          ? getMemberWhatsAppHistory(
              memberId
            )
          : [],
      [
        memberId,
        refreshToken
      ]
    );


  const labels =
    useMemo(
      () =>
        Object.fromEntries(
          WHATSAPP_TEMPLATE_TYPES.map(
            item => [
              item.id,
              item.label
            ]
          )
        ),
      []
    );


  return (

    <div className="bg-[#111111] border border-[#1d1d1d] rounded-xl overflow-hidden">

      <div className="px-5 py-4 border-b border-[#1d1d1d]">

        <div className="flex items-center gap-2">

          <MessageCircle
            size={18}
            className="text-[#00ff88]"
          />

          <h3 className="text-white font-black">
            Historial de WhatsApp
          </h3>

        </div>

        <p className="text-gray-500 text-xs mt-1">
          Registra cuándo el sistema abrió una conversación preparada para este miembro.
        </p>

      </div>


      {
        history.length ===
        0
          ? (

            <div className="py-12 text-center">

              <MessageCircle
                size={36}
                className="text-gray-700 mx-auto mb-3"
              />

              <p className="text-gray-400 text-sm">
                Todavía no hay contactos por WhatsApp.
              </p>

            </div>

          )
          : (

            <div className="divide-y divide-[#1d1d1d]">

              {
                history.map(
                  item => (

                    <div
                      key={
                        item.id
                      }
                      className="p-5 hover:bg-white/[0.015] transition-colors"
                    >

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

                        <div>

                          <p className="text-white font-semibold text-sm">
                            {
                              labels[
                                item.type
                              ] ||
                              item.type
                            }
                          </p>

                          <p className="text-gray-500 text-xs mt-1 flex items-center gap-1.5">

                            <Clock3
                              size={12}
                            />

                            {
                              formatDateTime(
                                item.createdAt
                              )
                            }

                          </p>

                        </div>


                        {
                          item.sentBy?.name &&
                          (
                            <span className="text-gray-600 text-xs">
                              Por {item.sentBy.name}
                            </span>
                          )
                        }

                      </div>


                      <p className="text-gray-400 text-sm mt-3 whitespace-pre-line line-clamp-3">
                        {item.message}
                      </p>

                    </div>

                  )
                )
              }

            </div>

          )
      }

    </div>

  );

};


export default WhatsAppHistory;
