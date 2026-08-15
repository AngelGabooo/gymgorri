// src/components/WhatsApp/WhatsAppSettingsPanel.jsx

import React, {
  useMemo,
  useState
} from 'react';

import {
  MessageCircle,
  Info,
  RotateCcw
} from 'lucide-react';

import {
  WHATSAPP_TEMPLATE_TYPES,
  renderWhatsAppTemplate
} from '../../services/whatsappService';


const VARIABLES = [
  '{nombre}',
  '{apellido}',
  '{nombreCompleto}',
  '{gimnasio}',
  '{plan}',
  '{precio}',
  '{fechaVencimiento}',
  '{diasRestantes}',
  '{promocion}',
  '{idMiembro}',
  '{telefono}',
  '{saldoPendiente}',
  '{pareja}',
  '{diasInactivo}'
];


const DEMO_CONTEXT = {
  nombre: 'Juan',
  apellido: 'Pérez',
  nombreCompleto: 'Juan Pérez',
  gimnasio: 'GYM CONTROL',
  plan: 'Mensual',
  precio: '$500.00',
  fechaVencimiento: '30 de agosto de 2026',
  diasRestantes: '5',
  promocion: 'Estudiante',
  idMiembro: 'GYM-00025',
  telefono: '9611234567',
  saldoPendiente: '$200.00',
  pareja: 'María López',
  diasInactivo: '16'
};


const WhatsAppSettingsPanel = ({
  settings,
  onChange
}) => {

  const whatsapp =
    settings?.whatsappSettings ||
    {};


  const [
    previewType,
    setPreviewType
  ] = useState(
    'renewal'
  );


  const templateTypes =
    useMemo(
      () =>
        WHATSAPP_TEMPLATE_TYPES.filter(
          item =>
            item.id !==
            'custom'
        ),
      []
    );


  const patchRoot = (
    changes
  ) => {

    onChange?.({
      ...settings,

      whatsappSettings: {
        ...whatsapp,
        ...changes
      }
    });

  };


  const patchTemplate = (
    type,
    changes
  ) => {

    onChange?.({
      ...settings,

      whatsappSettings: {
        ...whatsapp,

        templates: {
          ...(whatsapp.templates || {}),

          [type]: {
            ...(whatsapp.templates?.[type] || {}),
            ...changes
          }
        }
      }
    });

  };


  const previewTemplate =
    whatsapp
      ?.templates
      ?.[previewType]
      ?.message ||
    '';


  return (

    <div className="space-y-6">

      <div className="bg-[#111111] border border-[#1d1d1d] rounded-xl p-6">

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

          <div>

            <div className="flex items-center gap-2">

              <MessageCircle
                size={20}
                className="text-[#00ff88]"
              />

              <h2 className="text-white font-black text-lg">
                WhatsApp y plantillas
              </h2>

            </div>

            <p className="text-gray-500 text-sm mt-2 max-w-2xl">
              Configura los mensajes que utilizará el sistema al contactar miembros. El sistema abre WhatsApp con el texto preparado; no envía mensajes automáticamente.
            </p>

          </div>


          <button
            type="button"
            onClick={() =>
              patchRoot({
                enabled:
                  !whatsapp.enabled
              })
            }
            className={`px-4 py-2 rounded-xl border text-sm font-bold ${
              whatsapp.enabled !== false
                ? 'bg-[#00ff88]/10 border-[#00ff88]/20 text-[#00ff88]'
                : 'bg-[#1a1a1a] border-[#292929] text-gray-400'
            }`}
          >
            {
              whatsapp.enabled !==
              false
                ? 'WhatsApp activo'
                : 'WhatsApp desactivado'
            }
          </button>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">

          <div>

            <label className="text-white text-sm font-medium block mb-2">
              Código de país predeterminado
            </label>

            <input
              type="text"
              value={
                whatsapp.defaultCountryCode ||
                '52'
              }
              onChange={
                event =>
                  patchRoot({
                    defaultCountryCode:
                      event.target.value
                  })
              }
              placeholder="52"
              className="w-full bg-[#191919] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:border-[#00ff88] focus:outline-none"
            />

            <p className="text-gray-600 text-xs mt-2">
              Se utilizará cuando el teléfono guardado tenga 10 dígitos y no incluya prefijo internacional.
            </p>

          </div>


          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/15 flex gap-3">

            <Info
              size={18}
              className="text-blue-400 shrink-0 mt-0.5"
            />

            <p className="text-gray-400 text-xs leading-5">
              Para México utiliza 52. Si guardas un número que ya contiene código de país, el sistema no vuelve a agregarlo.
            </p>

          </div>

        </div>

      </div>


      <div className="grid grid-cols-1 2xl:grid-cols-[1.4fr_0.6fr] gap-6">

        <div className="space-y-4">

          {
            templateTypes.map(
              templateType => {

                const template =
                  whatsapp
                    ?.templates
                    ?.[templateType.id] ||
                  {};


                return (

                  <div
                    key={
                      templateType.id
                    }
                    className="bg-[#111111] border border-[#1d1d1d] rounded-xl p-5"
                  >

                    <div className="flex items-center justify-between gap-4 mb-4">

                      <div>

                        <p className="text-white font-bold">
                          {templateType.label}
                        </p>

                        <p className="text-gray-600 text-xs mt-1">
                          Plantilla editable
                        </p>

                      </div>


                      <button
                        type="button"
                        onClick={() =>
                          patchTemplate(
                            templateType.id,
                            {
                              enabled:
                                template.enabled ===
                                false
                            }
                          )
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                          template.enabled !== false
                            ? 'bg-[#00ff88]/10 border-[#00ff88]/20 text-[#00ff88]'
                            : 'bg-[#1a1a1a] border-[#292929] text-gray-500'
                        }`}
                      >
                        {
                          template.enabled !==
                          false
                            ? 'Activa'
                            : 'Desactivada'
                        }
                      </button>

                    </div>


                    <textarea
                      rows="6"
                      value={
                        template.message ||
                        ''
                      }
                      onFocus={() =>
                        setPreviewType(
                          templateType.id
                        )
                      }
                      onChange={
                        event =>
                          patchTemplate(
                            templateType.id,
                            {
                              message:
                                event.target.value
                            }
                          )
                      }
                      className="w-full bg-[#191919] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white resize-y focus:border-[#00ff88] focus:outline-none leading-6"
                    />

                  </div>

                );

              }
            )
          }

        </div>


        <div className="space-y-4">

          <div className="bg-[#111111] border border-[#1d1d1d] rounded-xl p-5 sticky top-6">

            <p className="text-white font-black">
              Variables disponibles
            </p>

            <p className="text-gray-500 text-xs mt-1">
              Puedes copiarlas dentro de cualquier plantilla.
            </p>


            <div className="flex flex-wrap gap-2 mt-4">

              {
                VARIABLES.map(
                  variable => (

                    <button
                      type="button"
                      key={
                        variable
                      }
                      onClick={() => {
                        navigator
                          ?.clipboard
                          ?.writeText(
                            variable
                          );
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#292929] text-[#00ff88] text-xs font-mono hover:border-[#00ff88]/40"
                    >
                      {variable}
                    </button>

                  )
                )
              }

            </div>


            <div className="border-t border-[#1d1d1d] my-5" />


            <div className="flex items-center justify-between gap-3">

              <p className="text-white font-black">
                Vista previa
              </p>

              <select
                value={
                  previewType
                }
                onChange={
                  event =>
                    setPreviewType(
                      event.target.value
                    )
                }
                className="bg-[#191919] border border-[#292929] rounded-lg px-2 py-1.5 text-gray-300 text-xs"
              >

                {
                  templateTypes.map(
                    item => (

                      <option
                        key={
                          item.id
                        }
                        value={
                          item.id
                        }
                      >
                        {item.label}
                      </option>

                    )
                  )
                }

              </select>

            </div>


            <div className="mt-4 rounded-xl bg-[#0b0b0b] border border-[#202020] p-4">

              <p className="text-gray-300 text-sm whitespace-pre-line leading-6">
                {
                  renderWhatsAppTemplate(
                    previewTemplate,
                    DEMO_CONTEXT
                  ) ||
                  'Escribe una plantilla para ver la vista previa.'
                }
              </p>

            </div>


            <div className="mt-4 flex items-start gap-2 text-gray-600 text-xs">

              <RotateCcw
                size={14}
                className="shrink-0 mt-0.5"
              />

              <span>
                Los cambios se guardan con el botón general “Guardar cambios” de Configuración.
              </span>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

};


export default WhatsAppSettingsPanel;
