// src/components/Import/ImportResultModal.jsx

import React from 'react';

import {
  CheckCircle2,
  Users,
  Copy,
  AlertTriangle,
  CalendarCheck,
  WalletCards,
  X,
  LayoutDashboard,
  UserRoundSearch
} from 'lucide-react';


const ImportResultModal = ({
  open,
  result,
  onClose,
  onGoMembers,
  onGoDashboard
}) => {

  if (
    !open ||
    !result
  ) {

    return null;

  }


  return (

    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">

      {/* OVERLAY */}

      <button
        type="button"
        aria-label="Cerrar"
        onClick={
          onClose
        }
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />


      {/* MODAL */}

      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#101010] border border-[#242424] rounded-3xl shadow-2xl">

        <div className="p-6 md:p-8">

          <button
            type="button"
            onClick={
              onClose
            }
            className="absolute right-5 top-5 w-9 h-9 rounded-xl border border-[#292929] text-gray-500 hover:text-white flex items-center justify-center"
          >

            <X
              size={17}
            />

          </button>


          {/* SUCCESS */}

          <div className="flex flex-col items-center text-center">

            <div className="w-16 h-16 rounded-2xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center">

              <CheckCircle2
                size={32}
                className="text-[#00ff88]"
              />

            </div>


            <h2 className="text-white text-2xl font-bold mt-5">
              Importación completada
            </h2>


            <p className="text-gray-500 text-sm mt-2 max-w-lg">
              GYM CONTROL terminó de procesar el archivo y actualizó los datos locales del sistema.
            </p>

          </div>


          {/* RESULTADOS */}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-7">

            <ResultCard
              icon={
                Users
              }
              label="Miembros"
              value={
                result.imported
              }
            />


            <ResultCard
              icon={
                Copy
              }
              label="Duplicados"
              value={
                result.skipped
              }
            />


            <ResultCard
              icon={
                AlertTriangle
              }
              label="Errores"
              value={
                result.errors
              }
              warning={
                result.errors >
                0
              }
            />


            <ResultCard
              icon={
                CalendarCheck
              }
              label="Asistencias"
              value={
                result.attendance
              }
            />


            <ResultCard
              icon={
                WalletCards
              }
              label="Pagos"
              value={
                result.payments
              }
            />

          </div>


          {/* DETALLE */}

          {
            result
              ?.details
              ?.length >
            0 &&
            (

              <div className="mt-7">

                <h3 className="text-white font-semibold">
                  Detalle del proceso
                </h3>


                <div className="mt-3 max-h-[240px] overflow-y-auto border border-[#222222] rounded-xl">

                  {
                    result.details.map(
                      (
                        detail,
                        index
                      ) => (

                        <div
                          key={
                            `${detail.row}-${index}`
                          }
                          className="px-4 py-3 border-b last:border-b-0 border-[#1d1d1d] flex items-start justify-between gap-4"
                        >

                          <div>

                            <p className="text-gray-300 text-sm">
                              Fila {detail.row}
                            </p>

                            <p className="text-gray-600 text-xs mt-1">
                              {detail.message}
                            </p>

                          </div>


                          <DetailBadge
                            status={
                              detail.status
                            }
                          />

                        </div>

                      )
                    )
                  }

                </div>

              </div>

            )
          }


          {/* BOTONES */}

          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-7">

            <button
              type="button"
              onClick={
                onGoMembers
              }
              className="px-5 py-3 rounded-xl bg-[#171717] border border-[#292929] text-gray-300 hover:text-white text-sm font-medium flex items-center justify-center gap-2"
            >

              <UserRoundSearch
                size={17}
              />

              Ver miembros

            </button>


            <button
              type="button"
              onClick={
                onGoDashboard
              }
              className="px-5 py-3 rounded-xl bg-[#00ff88] hover:bg-[#00e87a] text-black text-sm font-bold flex items-center justify-center gap-2"
            >

              <LayoutDashboard
                size={17}
              />

              Ir al Dashboard

            </button>

          </div>

        </div>

      </div>

    </div>

  );

};


// ======================================================
// RESULT CARD
// ======================================================

const ResultCard = ({
  icon: Icon,
  label,
  value,
  warning = false
}) => (

  <div className="bg-[#171717] border border-[#242424] rounded-xl p-4">

    <Icon
      size={17}
      className={
        warning
          ? 'text-yellow-400'
          : 'text-[#00ff88]'
      }
    />


    <p className="text-white text-xl font-bold mt-3">
      {value || 0}
    </p>


    <p className="text-gray-600 text-[11px] mt-1">
      {label}
    </p>

  </div>

);


// ======================================================
// BADGE
// ======================================================

const DetailBadge = ({
  status
}) => {

  const styles = {

    success:
      'text-[#00ff88] bg-[#00ff88]/10',

    skipped:
      'text-yellow-400 bg-yellow-400/10',

    error:
      'text-red-400 bg-red-500/10'

  };


  const labels = {

    success:
      'Importado',

    skipped:
      'Omitido',

    error:
      'Error'

  };


  return (

    <span
      className={`
        shrink-0
        px-2.5
        py-1
        rounded-lg
        text-[11px]
        ${
          styles[status] ||
          styles.error
        }
      `}
    >

      {
        labels[status] ||
        'Error'
      }

    </span>

  );

};


export default ImportResultModal;