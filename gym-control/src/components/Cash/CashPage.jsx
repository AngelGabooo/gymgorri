// src/components/Cash/CashPage.jsx

import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Banknote,
  Calculator,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  DollarSign,
  Landmark,
  MinusCircle,
  PlusCircle,
  ReceiptText,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  UserRound,
  Wallet,
  X
} from 'lucide-react';

import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';

import {
  calculateCashShiftSummary,
  closeCashShift,
  createCashMovement,
  getCashShifts,
  getEmployeeCashSummary,
  getOpenCashShiftForCurrentUser,
  openCashShift
} from '../../services/cashService';

import {
  getCurrentSession
} from '../../services/authService';

import {
  useGymSettings
} from '../../context/GymSettingsContext';


// ======================================================
// FORMATO
// ======================================================

const formatMoney = (
  value,
  currency = 'MXN'
) => {

  return new Intl.NumberFormat(
    'es-MX',
    {
      style:
        'currency',

      currency:
        currency ===
          'USD'
          ? 'USD'
          : 'MXN',

      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2
    }
  ).format(
    Number(
      value ||
      0
    )
  );

};


const formatDateTime = (
  value
) => {

  if (!value) {
    return '—';
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '—';
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
    date
  );

};


const getMethodLabel = (
  method
) => {

  const labels = {
    efectivo:
      'Efectivo',

    tarjeta:
      'Tarjeta',

    transferencia:
      'Transferencia',

    otro:
      'Otro',

    cortesia:
      'Cortesía',

    regalias:
      'Regalías'
  };

  return (
    labels[
      String(
        method ||
        ''
      ).toLowerCase()
    ] ||
    method ||
    'Otro'
  );

};


const getMovementLabel = (
  type
) => {

  if (
    type ===
    'expense'
  ) {
    return 'Gasto';
  }

  if (
    type ===
    'withdrawal'
  ) {
    return 'Retiro';
  }

  return 'Otro ingreso';

};


// ======================================================
// COMPONENTE
// ======================================================

const CashPage = () => {

  const session =
    getCurrentSession();

  const {
    settings
  } = useGymSettings();


  const currency =
    settings?.currency ===
      'USD'
      ? 'USD'
      : 'MXN';


  const [
    shifts,
    setShifts
  ] = useState([]);


  const [
    currentShift,
    setCurrentShift
  ] = useState(null);


  const [
    openingCash,
    setOpeningCash
  ] = useState('');


  const [
    openingNotes,
    setOpeningNotes
  ] = useState('');


  const [
    movementModal,
    setMovementModal
  ] = useState(null);


  const [
    movementForm,
    setMovementForm
  ] = useState({
    amount: '',
    concept: '',
    notes: ''
  });


  const [
    showCloseModal,
    setShowCloseModal
  ] = useState(false);


  const [
    countedCash,
    setCountedCash
  ] = useState('');


  const [
    closingNotes,
    setClosingNotes
  ] = useState('');


  const [
    error,
    setError
  ] = useState('');


  const load =
    () => {

      setShifts(
        getCashShifts()
      );

      setCurrentShift(
        getOpenCashShiftForCurrentUser()
      );

    };


  useEffect(
    () => {

      load();


      const refresh =
        () =>
          load();


      window.addEventListener(
        'gym-storage-update',
        refresh
      );

      window.addEventListener(
        'gym-cash-update',
        refresh
      );


      return () => {

        window.removeEventListener(
          'gym-storage-update',
          refresh
        );

        window.removeEventListener(
          'gym-cash-update',
          refresh
        );

      };

    },
    []
  );


  const liveSummary =
    useMemo(
      () =>
        currentShift
          ? calculateCashShiftSummary(
              currentShift
            )
          : null,
      [
        currentShift,
        shifts
      ]
    );


  const employeeHistory =
    useMemo(
      () => {

        if (
          session?.role ===
            'owner' ||
          session?.role ===
            'admin'
        ) {

          return shifts;

        }

        return shifts.filter(
          shift =>
            shift.employee?.id ===
            session?.id
        );

      },
      [
        shifts,
        session?.id,
        session?.role
      ]
    );


  const employeeStats =
    useMemo(
      () =>
        getEmployeeCashSummary(
          session?.role ===
              'owner' ||
            session?.role ===
              'admin'
            ? null
            : session?.id
        ),
      [
        shifts,
        session?.id,
        session?.role
      ]
    );


  const handleOpenShift =
    () => {

      setError(
        ''
      );


      try {

        const shift =
          openCashShift({
            openingCash:
              Number(
                openingCash ||
                0
              ),

            notes:
              openingNotes,

            actor:
              session
          });


        setCurrentShift(
          shift
        );

        setOpeningCash(
          ''
        );

        setOpeningNotes(
          ''
        );

        load();

      } catch (
        err
      ) {

        setError(
          err?.message ||
          'No se pudo abrir la caja.'
        );

      }

    };


  const openMovement =
    type => {

      setMovementModal(
        type
      );

      setMovementForm({
        amount: '',
        concept: '',
        notes: ''
      });

      setError(
        ''
      );

    };


  const saveMovement =
    () => {

      if (!currentShift) {
        return;
      }


      try {

        createCashMovement({
          shiftId:
            currentShift.id,

          type:
            movementModal,

          amount:
            Number(
              movementForm.amount ||
              0
            ),

          concept:
            movementForm.concept,

          notes:
            movementForm.notes,

          actor:
            session
        });


        setMovementModal(
          null
        );

        setMovementForm({
          amount: '',
          concept: '',
          notes: ''
        });

        load();

      } catch (
        err
      ) {

        setError(
          err?.message ||
          'No se pudo registrar el movimiento.'
        );

      }

    };


  const previewDifference =
    currentShift &&
    liveSummary
      ? (
          Number(
            countedCash ||
            0
          ) -
          Number(
            liveSummary.expectedCash ||
            0
          )
        )
      : 0;


  const handleCloseShift =
    () => {

      if (!currentShift) {
        return;
      }


      if (
        countedCash ===
        ''
      ) {

        setError(
          'Ingresa el efectivo contado antes de cerrar el turno.'
        );

        return;

      }


      try {

        closeCashShift({
          shiftId:
            currentShift.id,

          countedCash:
            Number(
              countedCash
            ),

          notes:
            closingNotes,

          actor:
            session
        });


        setShowCloseModal(
          false
        );

        setCountedCash(
          ''
        );

        setClosingNotes(
          ''
        );

        setError(
          ''
        );

        load();

      } catch (
        err
      ) {

        setError(
          err?.message ||
          'No se pudo cerrar el turno.'
        );

      }

    };


  return (

    <div className="min-h-screen bg-[#0a0a0a] flex">

      <Sidebar
        activePage="Caja"
      />


      <div className="flex-1 min-w-0">

        <Header />


        <main className="p-6 space-y-6">

          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">

            <div>

              <h1 className="text-white text-2xl font-black">
                Caja
              </h1>

              <p className="text-gray-500 mt-1">
                Apertura, movimientos, ventas, membresías y cierre por empleado.
              </p>

            </div>


            <div className="flex items-center gap-3">

              <div className="px-4 py-2 rounded-xl bg-[#111111] border border-[#1f1f1f]">

                <p className="text-gray-500 text-[10px] uppercase tracking-wider">
                  Responsable
                </p>

                <p className="text-white font-bold text-sm mt-1">
                  {
                    session?.name ||
                    'Usuario'
                  }
                </p>

              </div>


              <button
                type="button"
                onClick={
                  load
                }
                className="w-10 h-10 rounded-xl bg-[#111111] border border-[#1f1f1f] text-gray-400 hover:text-[#00ff88] flex items-center justify-center"
              >

                <RefreshCw
                  size={18}
                />

              </button>

            </div>

          </div>


          {
            error &&
            (

              <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-4">

                <p className="text-red-400 text-sm">
                  {error}
                </p>

              </div>

            )
          }


          {
            !currentShift
              ? (

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">

                  <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-7">

                    <div className="flex items-start gap-4">

                      <div className="w-12 h-12 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center">

                        <Wallet
                          size={24}
                          className="text-[#00ff88]"
                        />

                      </div>


                      <div>

                        <h2 className="text-white text-xl font-black">
                          Abrir turno de caja
                        </h2>

                        <p className="text-gray-500 text-sm mt-1">
                          El turno quedará asignado a {session?.name || 'este usuario'}.
                        </p>

                      </div>

                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-7">

                      <div>

                        <label className="text-white text-sm font-medium block mb-2">
                          Efectivo inicial
                        </label>

                        <div className="relative">

                          <DollarSign
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00ff88]"
                          />

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              openingCash
                            }
                            onChange={
                              event =>
                                setOpeningCash(
                                  event.target.value
                                )
                            }
                            placeholder="0.00"
                            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-3 text-white focus:border-[#00ff88] focus:outline-none"
                          />

                        </div>

                      </div>


                      <div>

                        <label className="text-white text-sm font-medium block mb-2">
                          Nota de apertura
                        </label>

                        <input
                          value={
                            openingNotes
                          }
                          onChange={
                            event =>
                              setOpeningNotes(
                                event.target.value
                              )
                          }
                          placeholder="Opcional"
                          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:border-[#00ff88] focus:outline-none"
                        />

                      </div>

                    </div>


                    <button
                      type="button"
                      onClick={
                        handleOpenShift
                      }
                      className="mt-6 px-5 py-3 rounded-xl bg-[#00ff88] text-black font-black hover:bg-[#00cc6a] flex items-center gap-2"
                    >

                      <PlusCircle
                        size={19}
                      />

                      Abrir caja

                    </button>

                  </div>


                  <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-6">

                    <UserRound
                      size={24}
                      className="text-[#00ff88]"
                    />

                    <h3 className="text-white font-black mt-4">
                      Resumen del empleado
                    </h3>

                    <div className="space-y-4 mt-5">

                      <SummaryLine
                        label="Turnos registrados"
                        value={
                          employeeStats.shiftCount
                        }
                      />

                      <SummaryLine
                        label="Turnos cerrados"
                        value={
                          employeeStats.closedCount
                        }
                      />

                      <SummaryLine
                        label="Dinero manejado"
                        value={
                          formatMoney(
                            employeeStats.handled,
                            currency
                          )
                        }
                      />

                      <SummaryLine
                        label="Diferencias acumuladas"
                        value={
                          formatMoney(
                            employeeStats.differences,
                            currency
                          )
                        }
                        tone={
                          employeeStats.differences ===
                            0
                            ? 'normal'
                            : employeeStats.differences >
                                0
                              ? 'positive'
                              : 'negative'
                        }
                      />

                    </div>

                  </div>

                </div>

              )
              : (

                <>

                  <div className="bg-[#111111] border border-[#00ff88]/20 rounded-2xl p-6">

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                      <div className="flex items-center gap-4">

                        <div className="w-12 h-12 rounded-xl bg-[#00ff88]/10 flex items-center justify-center">

                          <CheckCircle2
                            size={24}
                            className="text-[#00ff88]"
                          />

                        </div>


                        <div>

                          <p className="text-[#00ff88] text-xs font-black uppercase tracking-wider">
                            Caja abierta
                          </p>

                          <h2 className="text-white text-lg font-black mt-1">
                            {
                              currentShift.employee?.name ||
                              'Empleado'
                            }
                          </h2>

                          <p className="text-gray-500 text-xs mt-1">
                            Desde {formatDateTime(currentShift.openedAt)}
                          </p>

                        </div>

                      </div>


                      <button
                        type="button"
                        onClick={() => {

                          setCountedCash(
                            Number(
                              liveSummary?.expectedCash ||
                              0
                            ).toFixed(
                              2
                            )
                          );

                          setClosingNotes(
                            ''
                          );

                          setError(
                            ''
                          );

                          setShowCloseModal(
                            true
                          );

                        }}
                        className="px-5 py-2.5 bg-red-500 text-white rounded-xl font-black hover:bg-red-600"
                      >
                        Cerrar turno
                      </button>

                    </div>

                  </div>


                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">

                    <CashCard
                      icon={Banknote}
                      label="Efectivo inicial"
                      value={
                        formatMoney(
                          liveSummary?.openingCash,
                          currency
                        )
                      }
                    />

                    <CashCard
                      icon={CreditCard}
                      label="Membresías cobradas"
                      value={
                        formatMoney(
                          liveSummary?.memberships?.total,
                          currency
                        )
                      }
                      subtitle={`${liveSummary?.memberships?.count || 0} pagos · ${formatMoney(liveSummary?.memberships?.cash, currency)} efectivo`}
                    />

                    <CashCard
                      icon={ReceiptText}
                      label="Ventas"
                      value={
                        formatMoney(
                          liveSummary?.salesSummary?.total,
                          currency
                        )
                      }
                      subtitle={`${liveSummary?.salesSummary?.count || 0} ventas · ${liveSummary?.salesSummary?.itemCount || 0} productos · ${formatMoney(liveSummary?.salesSummary?.cashNet, currency)} efectivo neto`}
                    />

                    <CashCard
                      icon={Calculator}
                      label="Efectivo esperado"
                      value={
                        formatMoney(
                          liveSummary?.expectedCash,
                          currency
                        )
                      }
                      highlight
                    />

                  </div>


                  {/* ================================================== */}
                  {/* ARQUEO FÍSICO EN VIVO */}
                  {/* ================================================== */}

                  <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-5">

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">

                      <div>

                        <p className="text-[#00ff88] text-xs font-black uppercase tracking-[0.16em]">
                          Arqueo físico en vivo
                        </p>

                        <h3 className="text-white text-lg font-black mt-1">
                          Entradas y salidas reales de efectivo
                        </h3>

                        <p className="text-gray-500 text-sm mt-1">
                          Así puedes comprobar exactamente cuánto entró, cuánto salió en cambio y cuánto debe quedar en caja.
                        </p>

                      </div>

                      <div className="px-4 py-2 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20">

                        <p className="text-gray-500 text-[10px] uppercase tracking-wider">
                          Neto por ventas y membresías
                        </p>

                        <p className="text-[#00ff88] text-xl font-black mt-1">
                          {
                            formatMoney(
                              liveSummary?.cashFlow?.netSalesAndMemberships,
                              currency
                            )
                          }
                        </p>

                      </div>

                    </div>


                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">

                      <CloseMetric
                        label="Fondo inicial"
                        value={
                          formatMoney(
                            liveSummary?.openingCash,
                            currency
                          )
                        }
                      />

                      <CloseMetric
                        label="Efectivo recibido"
                        value={
                          formatMoney(
                            liveSummary?.cashFlow?.received,
                            currency
                          )
                        }
                      />

                      <CloseMetric
                        label="Cambio entregado"
                        value={
                          `-${formatMoney(
                            liveSummary?.cashFlow?.changeGiven,
                            currency
                          )}`
                        }
                      />

                      <CloseMetric
                        label="Efectivo esperado"
                        value={
                          formatMoney(
                            liveSummary?.expectedCash,
                            currency
                          )
                        }
                      />

                    </div>


                    <div className="mt-4 px-4 py-3 rounded-xl bg-[#0d0d0d] border border-[#1a1a1a]">

                      <p className="text-gray-500 text-xs">
                        Fórmula:
                        {' '}
                        <span className="text-white font-semibold">
                          inicial + recibido − cambio + otros ingresos − gastos − retiros
                        </span>
                      </p>

                    </div>

                  </div>


                  <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">

                    <div className="space-y-6">

                      <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl overflow-hidden">

                        <div className="p-6 border-b border-[#1a1a1a]">

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                            <div>

                              <h3 className="text-white font-black">
                                Ventas del turno
                              </h3>

                              <p className="text-gray-500 text-sm mt-1">
                                Productos cobrados por este empleado durante la caja actual.
                              </p>

                            </div>


                            <div className="text-left sm:text-right">

                              <p className="text-[#00ff88] text-xl font-black">
                                {
                                  formatMoney(
                                    liveSummary?.salesSummary?.total,
                                    currency
                                  )
                                }
                              </p>

                              <p className="text-gray-600 text-xs mt-1">
                                {liveSummary?.salesSummary?.count || 0} operaciones · {liveSummary?.salesSummary?.itemCount || 0} productos
                              </p>

                            </div>

                          </div>

                        </div>


                        {
                          liveSummary?.sales?.length >
                            0
                            ? (

                              <div className="divide-y divide-[#1a1a1a]">

                                {
                                  liveSummary.sales.map(
                                    sale => (

                                      <div
                                        key={
                                          sale.id
                                        }
                                        className="p-5"
                                      >

                                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                                          <div className="min-w-0">

                                            <div className="flex flex-wrap items-center gap-2">

                                              <p className="text-white font-bold">
                                                {
                                                  sale.folio ||
                                                  sale.id
                                                }
                                              </p>


                                              <span className="px-2 py-0.5 rounded-full bg-[#1a1a1a] text-gray-400 text-[10px] uppercase">
                                                {
                                                  getMethodLabel(
                                                    sale.paymentMethod
                                                  )
                                                }
                                              </span>

                                            </div>


                                            <p className="text-gray-500 text-xs mt-1">
                                              {
                                                sale.customer?.memberName ||
                                                'Venta general'
                                              }
                                              {' · '}
                                              {
                                                formatDateTime(
                                                  sale.createdAt
                                                )
                                              }
                                            </p>

                                            {
                                              String(
                                                sale.paymentMethod ||
                                                ''
                                              ).toLowerCase() ===
                                                'efectivo' &&
                                              (
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
                                                  <span className="text-gray-500">
                                                    Recibido:{' '}
                                                    <strong className="text-white">
                                                      {
                                                        formatMoney(
                                                          sale.received ??
                                                          sale.total,
                                                          currency
                                                        )
                                                      }
                                                    </strong>
                                                  </span>

                                                  <span className="text-gray-500">
                                                    Cambio:{' '}
                                                    <strong className="text-red-400">
                                                      -{
                                                        formatMoney(
                                                          sale.change ||
                                                          0,
                                                          currency
                                                        )
                                                      }
                                                    </strong>
                                                  </span>

                                                  <span className="text-gray-500">
                                                    Neto:{' '}
                                                    <strong className="text-[#00ff88]">
                                                      {
                                                        formatMoney(
                                                          Number(
                                                            sale.received ??
                                                            sale.total ??
                                                            0
                                                          ) -
                                                          Number(
                                                            sale.change ||
                                                            0
                                                          ),
                                                          currency
                                                        )
                                                      }
                                                    </strong>
                                                  </span>
                                                </div>
                                              )
                                            }

                                          </div>


                                          <p className="text-[#00ff88] text-lg font-black shrink-0">
                                            {
                                              formatMoney(
                                                sale.total,
                                                currency
                                              )
                                            }
                                          </p>

                                        </div>


                                        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-2">

                                          {
                                            (
                                              Array.isArray(
                                                sale.items
                                              )
                                                ? sale.items
                                                : []
                                            ).map(
                                              (
                                                item,
                                                index
                                              ) => (

                                                <div
                                                  key={`${sale.id}-${item.productId || index}`}
                                                  className="rounded-xl bg-[#0d0d0d] border border-[#202020] p-3 flex items-center justify-between gap-3"
                                                >

                                                  <div className="min-w-0">

                                                    <p className="text-white text-sm font-semibold truncate">
                                                      {
                                                        item.name ||
                                                        'Producto'
                                                      }
                                                    </p>

                                                    <p className="text-gray-600 text-xs mt-1">
                                                      {
                                                        Number(
                                                          item.quantity ||
                                                          0
                                                        )
                                                      } × {
                                                        formatMoney(
                                                          item.unitPrice,
                                                          currency
                                                        )
                                                      }
                                                    </p>

                                                  </div>


                                                  <p className="text-gray-300 text-sm font-bold shrink-0">
                                                    {
                                                      formatMoney(
                                                        item.subtotal ??
                                                        (
                                                          Number(
                                                            item.quantity ||
                                                            0
                                                          ) *
                                                          Number(
                                                            item.unitPrice ||
                                                            0
                                                          )
                                                        ),
                                                        currency
                                                      )
                                                    }
                                                  </p>

                                                </div>

                                              )
                                            )
                                          }

                                        </div>

                                      </div>

                                    )
                                  )
                                }

                              </div>

                            )
                            : (

                              <div className="py-12 text-center">

                                <ReceiptText
                                  size={34}
                                  className="text-gray-700 mx-auto"
                                />

                                <p className="text-gray-500 text-sm mt-2">
                                  Todavía no hay ventas vinculadas a este turno.
                                </p>

                                <p className="text-gray-700 text-xs mt-1">
                                  Las nuevas ventas aparecerán aquí automáticamente.
                                </p>

                              </div>

                            )
                        }

                      </div>


                      <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl overflow-hidden">

                        <div className="p-6 border-b border-[#1a1a1a] flex items-center justify-between gap-4">

                          <div>

                            <h3 className="text-white font-black">
                              Movimientos del turno
                            </h3>

                            <p className="text-gray-500 text-sm mt-1">
                              Gastos, retiros y otros ingresos en efectivo.
                            </p>

                          </div>


                          <div className="flex flex-wrap gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                openMovement(
                                  'other_income'
                                )
                              }
                              className="px-3 py-2 bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] rounded-lg text-xs font-bold flex items-center gap-1.5"
                            >
                              <PlusCircle size={14} />
                              Ingreso
                            </button>


                            <button
                              type="button"
                              onClick={() =>
                                openMovement(
                                  'expense'
                                )
                              }
                              className="px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-lg text-xs font-bold flex items-center gap-1.5"
                            >
                              <MinusCircle size={14} />
                              Gasto
                            </button>


                            <button
                              type="button"
                              onClick={() =>
                                openMovement(
                                  'withdrawal'
                                )
                              }
                              className="px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-bold flex items-center gap-1.5"
                            >
                              <TrendingDown size={14} />
                              Retiro
                            </button>

                          </div>

                        </div>


                        {
                          liveSummary?.movements?.length >
                            0
                            ? (

                              <div className="divide-y divide-[#1a1a1a]">

                                {
                                  liveSummary.movements.map(
                                    movement => (

                                      <div
                                        key={
                                          movement.id
                                        }
                                        className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                                      >

                                        <div>

                                          <p className="text-white font-semibold text-sm">
                                            {
                                              movement.concept
                                            }
                                          </p>

                                          <p className="text-gray-500 text-xs mt-1">
                                            {getMovementLabel(movement.type)} · {formatDateTime(movement.createdAt)}
                                          </p>

                                          {
                                            movement.notes &&
                                            (
                                              <p className="text-gray-600 text-xs mt-1">
                                                {movement.notes}
                                              </p>
                                            )
                                          }

                                        </div>


                                        <p className={`font-black ${
                                          movement.type ===
                                            'other_income'
                                            ? 'text-[#00ff88]'
                                            : 'text-red-400'
                                        }`}>
                                          {
                                            movement.type ===
                                              'other_income'
                                              ? '+'
                                              : '-'
                                          }
                                          {
                                            formatMoney(
                                              movement.amount,
                                              currency
                                            )
                                          }
                                        </p>

                                      </div>

                                    )
                                  )
                                }

                              </div>

                            )
                            : (

                              <div className="py-12 text-center">

                                <Wallet
                                  size={32}
                                  className="text-gray-700 mx-auto"
                                />

                                <p className="text-gray-500 text-sm mt-2">
                                  No hay movimientos manuales en este turno.
                                </p>

                              </div>

                            )
                        }

                      </div>


                      <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl overflow-hidden">

                        <div className="p-6 border-b border-[#1a1a1a]">

                          <h3 className="text-white font-black">
                            Métodos de cobro
                          </h3>

                          <p className="text-gray-500 text-sm mt-1">
                            Membresías y ventas separadas por método.
                          </p>

                        </div>


                        <div className="overflow-x-auto">

                          <table className="w-full">

                            <thead>

                              <tr className="border-b border-[#1a1a1a]">
                                <th className="text-left p-4 text-gray-500 text-xs">Método</th>
                                <th className="text-right p-4 text-gray-500 text-xs">Membresías</th>
                                <th className="text-right p-4 text-gray-500 text-xs">Ventas</th>
                                <th className="text-right p-4 text-gray-500 text-xs">Total</th>
                              </tr>

                            </thead>


                            <tbody>

                              {
                                Object.values(
                                  liveSummary?.paymentMethods ||
                                  {}
                                )
                                  .map(
                                    method => (

                                      <tr
                                        key={
                                          method.method
                                        }
                                        className="border-b border-[#1a1a1a] last:border-0"
                                      >
                                        <td className="p-4 text-white text-sm">
                                          {getMethodLabel(method.method)}
                                        </td>

                                        <td className="p-4 text-gray-300 text-sm text-right">
                                          {formatMoney(method.memberships, currency)}
                                        </td>

                                        <td className="p-4 text-gray-300 text-sm text-right">
                                          {formatMoney(method.sales, currency)}
                                        </td>

                                        <td className="p-4 text-[#00ff88] font-bold text-sm text-right">
                                          {formatMoney(method.total, currency)}
                                        </td>
                                      </tr>

                                    )
                                  )
                              }

                            </tbody>

                          </table>

                        </div>

                      </div>

                    </div>


                    <div className="space-y-4">

                      <CashSummaryBox
                        icon={Banknote}
                        label="Efectivo recibido"
                        value={
                          formatMoney(
                            liveSummary?.cashFlow?.received,
                            currency
                          )
                        }
                        tone="positive"
                      />

                      <CashSummaryBox
                        icon={TrendingDown}
                        label="Cambio entregado"
                        value={
                          formatMoney(
                            liveSummary?.cashFlow?.changeGiven,
                            currency
                          )
                        }
                        tone="negative"
                      />

                      <CashSummaryBox
                        icon={CircleDollarSign}
                        label="Ingreso neto en efectivo"
                        value={
                          formatMoney(
                            liveSummary?.cashFlow?.netSalesAndMemberships,
                            currency
                          )
                        }
                        tone="positive"
                      />

                      <CashSummaryBox
                        icon={PlusCircle}
                        label="Otros ingresos"
                        value={
                          formatMoney(
                            liveSummary?.otherIncome,
                            currency
                          )
                        }
                        tone="positive"
                      />

                      <CashSummaryBox
                        icon={TrendingDown}
                        label="Gastos"
                        value={
                          formatMoney(
                            liveSummary?.expenses,
                            currency
                          )
                        }
                        tone="negative"
                      />

                      <CashSummaryBox
                        icon={MinusCircle}
                        label="Retiros"
                        value={
                          formatMoney(
                            liveSummary?.withdrawals,
                            currency
                          )
                        }
                        tone="negative"
                      />


                      <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-5">

                        <p className="text-gray-500 text-xs uppercase tracking-wider">
                          Flujo de efectivo
                        </p>

                        <div className="space-y-3 mt-4">
                          <SummaryLine
                            label="Fondo inicial"
                            value={
                              formatMoney(
                                liveSummary?.openingCash,
                                currency
                              )
                            }
                          />

                          <SummaryLine
                            label="+ Recibido de clientes"
                            value={
                              formatMoney(
                                liveSummary?.cashFlow?.received,
                                currency
                              )
                            }
                            tone="positive"
                          />

                          <SummaryLine
                            label="- Cambio entregado"
                            value={`-${formatMoney(
                              liveSummary?.cashFlow?.changeGiven,
                              currency
                            )}`}
                            tone="negative"
                          />

                          <SummaryLine
                            label="+ Otros ingresos"
                            value={
                              formatMoney(
                                liveSummary?.otherIncome,
                                currency
                              )
                            }
                            tone="positive"
                          />

                          <SummaryLine
                            label="- Gastos"
                            value={`-${formatMoney(
                              liveSummary?.expenses,
                              currency
                            )}`}
                            tone="negative"
                          />

                          <SummaryLine
                            label="- Retiros"
                            value={`-${formatMoney(
                              liveSummary?.withdrawals,
                              currency
                            )}`}
                            tone="negative"
                          />
                        </div>

                      </div>


                      <div className="bg-[#00ff88]/5 border border-[#00ff88]/20 rounded-2xl p-5">

                        <p className="text-gray-500 text-xs uppercase tracking-wider">
                          Efectivo que debe haber
                        </p>

                        <p className="text-[#00ff88] text-3xl font-black mt-2">
                          {
                            formatMoney(
                              liveSummary?.expectedCash,
                              currency
                            )
                          }
                        </p>

                        <p className="text-gray-500 text-xs mt-2 leading-relaxed">
                          Inicial + efectivo recibido − cambio entregado + otros ingresos − gastos − retiros.
                        </p>

                      </div>

                    </div>

                  </div>

                </>

              )
          }


          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl overflow-hidden">

            <div className="p-6 border-b border-[#1a1a1a]">

              <h3 className="text-white font-black">
                Historial de turnos
              </h3>

              <p className="text-gray-500 text-sm mt-1">
                {
                  session?.role ===
                      'owner' ||
                    session?.role ===
                      'admin'
                    ? 'Turnos registrados por todos los empleados.'
                    : 'Tus aperturas y cierres de caja.'
                }
              </p>

            </div>


            {
              employeeHistory.length >
                0
                ? (

                  <div className="overflow-x-auto">

                    <table className="w-full">

                      <thead>

                        <tr className="border-b border-[#1a1a1a]">

                          <th className="text-left p-4 text-gray-500 text-xs">
                            Empleado
                          </th>

                          <th className="text-left p-4 text-gray-500 text-xs">
                            Apertura
                          </th>

                          <th className="text-left p-4 text-gray-500 text-xs">
                            Cierre
                          </th>

                          <th className="text-right p-4 text-gray-500 text-xs">
                            Manejado
                          </th>

                          <th className="text-right p-4 text-gray-500 text-xs">
                            Esperado
                          </th>

                          <th className="text-right p-4 text-gray-500 text-xs">
                            Contado
                          </th>

                          <th className="text-right p-4 text-gray-500 text-xs">
                            Diferencia
                          </th>

                          <th className="text-center p-4 text-gray-500 text-xs">
                            Estado
                          </th>

                        </tr>

                      </thead>


                      <tbody>

                        {
                          employeeHistory
                            .map(
                              shift => {

                                const snapshot =
                                  shift.status ===
                                    'closed'
                                    ? shift.closeSnapshot
                                    : calculateCashShiftSummary(
                                        shift
                                      );


                                return (

                                  <tr
                                    key={
                                      shift.id
                                    }
                                    className="border-b border-[#1a1a1a] last:border-0"
                                  >

                                    <td className="p-4">

                                      <p className="text-white text-sm font-semibold">
                                        {
                                          shift.employee?.name ||
                                          'Usuario'
                                        }
                                      </p>

                                      <p className="text-gray-600 text-xs mt-1">
                                        {shift.id}
                                      </p>

                                    </td>


                                    <td className="p-4 text-gray-300 text-sm">
                                      {formatDateTime(shift.openedAt)}
                                    </td>


                                    <td className="p-4 text-gray-300 text-sm">
                                      {formatDateTime(shift.closedAt)}
                                    </td>


                                    <td className="p-4 text-right text-gray-300 text-sm">
                                      {
                                        formatMoney(
                                          snapshot?.totalHandled ||
                                          0,
                                          currency
                                        )
                                      }
                                    </td>


                                    <td className="p-4 text-right text-gray-300 text-sm">
                                      {
                                        formatMoney(
                                          shift.status ===
                                            'closed'
                                            ? shift.expectedCash
                                            : snapshot?.expectedCash,
                                          currency
                                        )
                                      }
                                    </td>


                                    <td className="p-4 text-right text-gray-300 text-sm">
                                      {
                                        shift.status ===
                                          'closed'
                                          ? formatMoney(
                                              shift.countedCash,
                                              currency
                                            )
                                          : '—'
                                      }
                                    </td>


                                    <td className={`p-4 text-right font-bold text-sm ${
                                      shift.status !==
                                        'closed'
                                        ? 'text-gray-600'
                                        : Number(
                                            shift.difference ||
                                            0
                                          ) ===
                                            0
                                          ? 'text-[#00ff88]'
                                          : Number(
                                              shift.difference ||
                                              0
                                            ) >
                                              0
                                            ? 'text-blue-400'
                                            : 'text-red-400'
                                    }`}>
                                      {
                                        shift.status ===
                                          'closed'
                                          ? formatMoney(
                                              shift.difference,
                                              currency
                                            )
                                          : '—'
                                      }
                                    </td>


                                    <td className="p-4 text-center">

                                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                        shift.status ===
                                          'open'
                                          ? 'bg-[#00ff88]/10 text-[#00ff88]'
                                          : 'bg-gray-500/10 text-gray-400'
                                      }`}>
                                        {
                                          shift.status ===
                                            'open'
                                            ? 'ABIERTO'
                                            : 'CERRADO'
                                        }
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

                )
                : (

                  <div className="py-14 text-center">

                    <Clock3
                      size={34}
                      className="text-gray-700 mx-auto"
                    />

                    <p className="text-gray-500 text-sm mt-2">
                      Todavía no existen turnos de caja.
                    </p>

                  </div>

                )
            }

          </div>

        </main>

      </div>


      {
        movementModal &&
        (

          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">

            <button
              type="button"
              onClick={() =>
                setMovementModal(
                  null
                )
              }
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />


            <div className="relative w-full max-w-md bg-[#111111] border border-[#2a2a2a] rounded-2xl overflow-hidden">

              <div className="p-6 border-b border-[#1a1a1a] flex items-center justify-between">

                <div>

                  <h2 className="text-white text-xl font-black">
                    {
                      getMovementLabel(
                        movementModal
                      )
                    }
                  </h2>

                  <p className="text-gray-500 text-sm mt-1">
                    Se asociará al turno actual.
                  </p>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    setMovementModal(
                      null
                    )
                  }
                  className="text-gray-500 hover:text-white"
                >
                  <X size={20} />
                </button>

              </div>


              <div className="p-6 space-y-4">

                <div>

                  <label className="text-white text-sm font-medium block mb-2">
                    Monto
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      movementForm.amount
                    }
                    onChange={
                      event =>
                        setMovementForm(
                          previous => ({
                            ...previous,
                            amount:
                              event.target.value
                          })
                        )
                    }
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:border-[#00ff88] focus:outline-none"
                  />

                </div>


                <div>

                  <label className="text-white text-sm font-medium block mb-2">
                    Concepto
                  </label>

                  <input
                    value={
                      movementForm.concept
                    }
                    onChange={
                      event =>
                        setMovementForm(
                          previous => ({
                            ...previous,
                            concept:
                              event.target.value
                          })
                        )
                    }
                    placeholder="Ej. compra de agua, retiro del dueño..."
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:border-[#00ff88] focus:outline-none"
                  />

                </div>


                <div>

                  <label className="text-white text-sm font-medium block mb-2">
                    Notas
                  </label>

                  <textarea
                    value={
                      movementForm.notes
                    }
                    onChange={
                      event =>
                        setMovementForm(
                          previous => ({
                            ...previous,
                            notes:
                              event.target.value
                          })
                        )
                    }
                    rows={3}
                    placeholder="Opcional"
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:border-[#00ff88] focus:outline-none resize-none"
                  />

                </div>


                <button
                  type="button"
                  onClick={
                    saveMovement
                  }
                  className="w-full py-3 rounded-xl bg-[#00ff88] text-black font-black"
                >
                  Registrar movimiento
                </button>

              </div>

            </div>

          </div>

        )
      }


      {
        showCloseModal &&
        currentShift &&
        liveSummary &&
        (

          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">

            <button
              type="button"
              onClick={() =>
                setShowCloseModal(
                  false
                )
              }
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />


            <div className="relative w-full max-w-lg bg-[#111111] border border-[#2a2a2a] rounded-2xl overflow-hidden">

              <div className="p-6 border-b border-[#1a1a1a] flex items-center justify-between">

                <div>

                  <h2 className="text-white text-xl font-black">
                    Cierre de turno
                  </h2>

                  <p className="text-gray-500 text-sm mt-1">
                    Cuenta el efectivo físico antes de confirmar.
                  </p>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    setShowCloseModal(
                      false
                    )
                  }
                  className="text-gray-500 hover:text-white"
                >
                  <X size={20} />
                </button>

              </div>


              <div className="p-6">

                <div className="grid grid-cols-2 gap-3">

                  <CloseMetric
                    label="Esperado"
                    value={
                      formatMoney(
                        liveSummary.expectedCash,
                        currency
                      )
                    }
                  />

                  <CloseMetric
                    label="Manejado"
                    value={
                      formatMoney(
                        liveSummary.totalHandled,
                        currency
                      )
                    }
                  />

                  <CloseMetric
                    label="Efectivo recibido"
                    value={
                      formatMoney(
                        liveSummary.cashFlow?.received,
                        currency
                      )
                    }
                  />

                  <CloseMetric
                    label="Cambio entregado"
                    value={
                      formatMoney(
                        liveSummary.cashFlow?.changeGiven,
                        currency
                      )
                    }
                  />

                  <CloseMetric
                    label="Fondo inicial"
                    value={
                      formatMoney(
                        liveSummary.openingCash,
                        currency
                      )
                    }
                  />

                  <CloseMetric
                    label="Neto en efectivo"
                    value={
                      formatMoney(
                        liveSummary.cashFlow?.netSalesAndMemberships,
                        currency
                      )
                    }
                  />

                </div>


                <div className="mt-5">

                  <label className="text-white text-sm font-medium block mb-2">
                    Efectivo contado
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      countedCash
                    }
                    onChange={
                      event => {

                        setCountedCash(
                          event.target.value
                        );

                        setError(
                          ''
                        );

                      }
                    }
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-lg font-black focus:border-[#00ff88] focus:outline-none"
                  />

                </div>


                <div className={`mt-4 rounded-xl p-4 border ${
                  previewDifference ===
                    0
                    ? 'bg-[#00ff88]/5 border-[#00ff88]/20'
                    : previewDifference >
                        0
                      ? 'bg-blue-500/5 border-blue-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                }`}>

                  <p className="text-gray-500 text-xs uppercase tracking-wider">
                    Diferencia
                  </p>

                  <p className={`text-2xl font-black mt-1 ${
                    previewDifference ===
                      0
                      ? 'text-[#00ff88]'
                      : previewDifference >
                          0
                        ? 'text-blue-400'
                        : 'text-red-400'
                  }`}>
                    {
                      formatMoney(
                        previewDifference,
                        currency
                      )
                    }
                  </p>

                  <p className="text-gray-500 text-xs mt-1">
                    {
                      previewDifference ===
                        0
                        ? 'La caja cuadra correctamente.'
                        : previewDifference >
                            0
                          ? 'Hay efectivo sobrante.'
                          : 'Hay efectivo faltante.'
                    }
                  </p>

                </div>


                <div className="mt-4">

                  <label className="text-white text-sm font-medium block mb-2">
                    Notas de cierre
                  </label>

                  <textarea
                    value={
                      closingNotes
                    }
                    onChange={
                      event =>
                        setClosingNotes(
                          event.target.value
                        )
                    }
                    rows={3}
                    placeholder="Explica cualquier diferencia si es necesario..."
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:border-[#00ff88] focus:outline-none resize-none"
                  />

                </div>


                <div className="flex gap-3 mt-6">

                  <button
                    type="button"
                    onClick={() =>
                      setShowCloseModal(
                        false
                      )
                    }
                    className="flex-1 py-3 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-white"
                  >
                    Cancelar
                  </button>


                  <button
                    type="button"
                    onClick={
                      handleCloseShift
                    }
                    className="flex-1 py-3 rounded-xl bg-red-500 text-white font-black hover:bg-red-600"
                  >
                    Cerrar turno
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


// ======================================================
// SUBCOMPONENTES
// ======================================================

const CashCard = ({
  icon:
    Icon,
  label,
  value,
  subtitle,
  highlight = false
}) => (

  <div className={`rounded-2xl p-5 border ${
    highlight
      ? 'bg-[#00ff88]/5 border-[#00ff88]/20'
      : 'bg-[#111111] border-[#1a1a1a]'
  }`}>

    <div className="flex items-center justify-between gap-3">

      <p className="text-gray-500 text-xs uppercase tracking-wider">
        {label}
      </p>

      <Icon
        size={19}
        className={
          highlight
            ? 'text-[#00ff88]'
            : 'text-gray-500'
        }
      />

    </div>

    <p className={`text-2xl font-black mt-3 ${
      highlight
        ? 'text-[#00ff88]'
        : 'text-white'
    }`}>
      {value}
    </p>

    {
      subtitle &&
      (
        <p className="text-gray-600 text-xs mt-2">
          {subtitle}
        </p>
      )
    }

  </div>

);


const CashSummaryBox = ({
  icon:
    Icon,
  label,
  value,
  tone
}) => (

  <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-5">

    <div className="flex items-center gap-3">

      <Icon
        size={19}
        className={
          tone ===
            'positive'
            ? 'text-[#00ff88]'
            : 'text-red-400'
        }
      />

      <p className="text-gray-500 text-sm">
        {label}
      </p>

    </div>

    <p className={`text-xl font-black mt-3 ${
      tone ===
        'positive'
        ? 'text-[#00ff88]'
        : 'text-red-400'
    }`}>
      {value}
    </p>

  </div>

);


const SummaryLine = ({
  label,
  value,
  tone = 'normal'
}) => (

  <div className="flex items-center justify-between gap-4">

    <span className="text-gray-500 text-sm">
      {label}
    </span>

    <span className={`font-bold text-sm ${
      tone ===
        'positive'
        ? 'text-[#00ff88]'
        : tone ===
            'negative'
          ? 'text-red-400'
          : 'text-white'
    }`}>
      {value}
    </span>

  </div>

);


const CloseMetric = ({
  label,
  value
}) => (

  <div className="rounded-xl bg-[#0d0d0d] border border-[#202020] p-4">

    <p className="text-gray-500 text-xs uppercase tracking-wider">
      {label}
    </p>

    <p className="text-white font-black text-lg mt-1">
      {value}
    </p>

  </div>

);


export default CashPage;
