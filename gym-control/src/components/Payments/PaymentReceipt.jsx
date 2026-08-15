// src/components/Payments/PaymentReceipt.jsx

import React from 'react';

import {
  BadgePercent,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  MapPin,
  Phone,
  ReceiptText,
  User,
  WalletCards
} from 'lucide-react';


// ======================================================
// MÉTODO DE PAGO
// ======================================================

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

    regalias:
      'Regalías',

    cortesia:
      'Cortesía'

  };


  return (
    labels[
      String(
        method ||
        ''
      ).toLowerCase()
    ] ||
    method ||
    'No registrado'
  );

};


// ======================================================
// MONEDA
// ======================================================

const normalizeCurrency = (
  currency
) => {

  return currency ===
    'USD'
    ? 'USD'
    : 'MXN';

};


const formatMoney = (
  value,
  currency =
    'MXN'
) => {

  const amount =
    Number(
      value ||
      0
    );


  return new Intl.NumberFormat(
    'es-MX',
    {
      style:
        'currency',

      currency:
        normalizeCurrency(
          currency
        ),

      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2
    }
  ).format(
    Number.isFinite(
      amount
    )
      ? amount
      : 0
  );

};


// ======================================================
// FECHAS
// ======================================================

const formatDate = (
  value
) => {

  const date =
    value
      ? new Date(
          value
        )
      : new Date();


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
      day:
        '2-digit',

      month:
        'long',

      year:
        'numeric'
    }
  ).format(
    date
  );

};


const formatTime = (
  value
) => {

  const date =
    value
      ? new Date(
          value
        )
      : new Date();


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return 'Hora no disponible';

  }


  return new Intl.DateTimeFormat(
    'es-MX',
    {
      hour:
        '2-digit',

      minute:
        '2-digit'
    }
  ).format(
    date
  );

};


// ======================================================
// FILA
// ======================================================

const Row = ({
  icon:
    Icon,

  label,

  value,

  emphasized =
    false
}) => (

  <div className="grid grid-cols-[34px_1fr_auto] items-center gap-3 py-3 border-b border-dashed border-black/15 last:border-b-0">

    <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center">

      <Icon
        size={16}
        className="text-black/70"
      />

    </div>


    <div>

      <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-black/45">
        {label}
      </p>

    </div>


    <p
      className={`
        text-right
        ${
          emphasized
            ? 'text-base font-black'
            : 'text-sm font-semibold'
        }
        text-black
        max-w-[210px]
        break-words
      `}
    >

      {value || '—'}

    </p>

  </div>

);


// ======================================================
// RECIBO
// ======================================================

const PaymentReceipt =
  React.forwardRef(
    (
      {
        settings,
        payment,
        member,
        subscription
      },
      ref
    ) => {

      const gymName =
        settings?.shortName ||
        settings?.gymName ||
        'GYM CONTROL';


      const commercialName =
        settings?.gymName ||
        gymName;


      const currency =
        normalizeCurrency(
          payment?.currency ||
          settings?.currency ||
          'MXN'
        );


      const planLabel =
        payment?.planLabel ||
        subscription?.planLabel ||
        subscription?.plan ||
        'Suscripción';


      const paidAt =
        payment?.createdAt ||
        payment?.date ||
        new Date()
          .toISOString();


      const memberName =
        payment?.memberName ||
        `${member?.firstName || ''} ${member?.lastName || ''}`
          .trim() ||
        'Miembro';


      const paymentId =
        payment?.id ||
        `${settings?.receiptPrefix || 'PAY'}-PENDIENTE`;


      const promotion =
        payment?.promotion ||
        subscription?.promotion ||
        null;


      const originalAmount =
        Number(
          payment?.originalAmount ??
          subscription?.originalAmount ??
          payment?.amount ??
          0
        );


      const finalAmount =
        Number(
          payment?.amount ??
          subscription?.amount ??
          0
        );


      const discountAmount =
        Number(
          payment?.discountAmount ??
          subscription?.discountAmount ??
          (
            originalAmount -
            finalAmount
          ) ??
          0
        );


      const hasDiscount =
        discountAmount >
        0;


      const isCourtesy =
        promotion?.id ===
          'courtesy' ||
        String(
          payment?.paymentMethod ||
          payment?.method ||
          subscription?.paymentMethod ||
          ''
        ).toLowerCase() ===
          'cortesia' ||
        (
          finalAmount ===
            0 &&
          hasDiscount
        );


      const promotionLabel =
        promotion?.label ||
        (
          isCourtesy
            ? 'Cortesía'
            : ''
        );


      const promotionDescription =
        promotion
          ? (
              promotion.type ===
                'percentage'
                ? `${promotion.label} · ${Number(promotion.value || 0)}%`
                : `${promotion.label} · precio especial`
            )
          : (
              isCourtesy
                ? 'Cortesía'
                : ''
            );


      const headerTitle =
        isCourtesy
          ? 'Cortesía aplicada'
          : 'Suscripción pagada';


      return (

        <div
          ref={ref}
          className="w-full max-w-[430px] bg-[#f8f8f6] text-black rounded-[28px] overflow-hidden shadow-2xl border border-black/10"
        >

          {/* ================================================= */}
          {/* ENCABEZADO */}
          {/* ================================================= */}

          <div className="px-8 pt-8 pb-6 text-center relative overflow-hidden">

            <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-black/[0.035]" />

            <div className="absolute -bottom-20 -left-20 w-52 h-52 rounded-full bg-black/[0.025]" />


            {
              settings?.logo
                ? (

                  <div className="w-20 h-20 rounded-2xl bg-white border border-black/10 mx-auto mb-4 flex items-center justify-center overflow-hidden shadow-sm">

                    <img
                      src={
                        settings.logo
                      }
                      alt={
                        gymName
                      }
                      className="w-full h-full object-contain p-2"
                    />

                  </div>

                )
                : (

                  <div className="w-16 h-16 rounded-2xl bg-black text-white mx-auto mb-4 flex items-center justify-center">

                    <ReceiptText
                      size={30}
                    />

                  </div>

                )
            }


            <p className="text-2xl font-black tracking-tight uppercase">
              {gymName}
            </p>


            {
              commercialName !==
                gymName &&
              (

                <p className="text-xs text-black/50 mt-1">
                  {commercialName}
                </p>

              )
            }


            <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1 mt-3 text-[11px] text-black/55">

              {
                settings?.address &&
                (

                  <span className="flex items-center gap-1">

                    <MapPin
                      size={12}
                    />

                    {
                      settings.address
                    }

                  </span>

                )
              }


              {
                settings?.phone &&
                (

                  <span className="flex items-center gap-1">

                    <Phone
                      size={12}
                    />

                    {
                      settings.phone
                    }

                  </span>

                )
              }

            </div>

          </div>


          <div className="px-8">

            {/* ================================================= */}
            {/* ESTADO */}
            {/* ================================================= */}

            <div className="border-y-2 border-black py-5 text-center">

              <div className="flex items-center justify-center gap-2">

                <CheckCircle2
                  size={21}
                />

                <p className="text-xl font-black tracking-[0.08em] uppercase">
                  {headerTitle}
                </p>

              </div>


              <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mt-1">

                {
                  isCourtesy
                    ? 'Registro de beneficio'
                    : 'Comprobante de compra'
                }

              </p>

            </div>


            {/* ================================================= */}
            {/* DATOS */}
            {/* ================================================= */}

            <div className="py-4">

              <Row
                icon={User}
                label="Miembro"
                value={
                  memberName
                }
              />


              <Row
                icon={WalletCards}
                label="Plan adquirido"
                value={
                  planLabel
                }
                emphasized
              />


              {
                promotionLabel &&
                (

                  <Row
                    icon={BadgePercent}
                    label="Promoción"
                    value={
                      promotionDescription
                    }
                  />

                )
              }


              {
                promotion?.reference &&
                (

                  <Row
                    icon={BadgePercent}
                    label={
                      isCourtesy
                        ? 'Autorización'
                        : 'Referencia'
                    }
                    value={
                      promotion.reference
                    }
                  />

                )
              }


              <Row
                icon={ReceiptText}
                label="Folio de pago"
                value={
                  paymentId
                }
              />


              <Row
                icon={CalendarDays}
                label="Fecha"
                value={
                  formatDate(
                    paidAt
                  )
                }
              />


              <Row
                icon={Clock3}
                label="Hora"
                value={
                  formatTime(
                    paidAt
                  )
                }
              />


              <Row
                icon={CreditCard}
                label="Método de pago"
                value={
                  getMethodLabel(
                    payment?.paymentMethod ||
                    payment?.method ||
                    subscription?.paymentMethod
                  )
                }
              />

            </div>


            {/* ================================================= */}
            {/* DESGLOSE */}
            {/* ================================================= */}

            {
              hasDiscount &&
              (

                <div className="rounded-2xl bg-black/[0.035] border border-black/10 px-5 py-4 mb-4">

                  <div className="flex items-center justify-between gap-4">

                    <span className="text-xs font-semibold text-black/60">
                      Precio normal
                    </span>

                    <span className="text-sm font-bold">
                      {
                        formatMoney(
                          originalAmount,
                          currency
                        )
                      }
                    </span>

                  </div>


                  <div className="flex items-center justify-between gap-4 mt-2">

                    <span className="text-xs font-semibold text-black/60">
                      {
                        promotionLabel ||
                        'Descuento'
                      }
                    </span>

                    <span className="text-sm font-black">
                      -
                      {
                        formatMoney(
                          discountAmount,
                          currency
                        )
                      }
                    </span>

                  </div>

                </div>

              )
            }


            {/* ================================================= */}
            {/* TOTAL */}
            {/* ================================================= */}

            <div className="rounded-2xl border-2 border-black px-5 py-5 mb-6 flex items-center justify-between gap-4">

              <div>

                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-black/50">

                  {
                    isCourtesy
                      ? 'Total de cortesía'
                      : 'Total pagado'
                  }

                </p>


                <p className="text-sm font-bold mt-1">

                  {
                    isCourtesy
                      ? 'Sin cobro'
                      : 'Pago confirmado'
                  }

                </p>

              </div>


              <p className="text-2xl font-black whitespace-nowrap">

                {
                  formatMoney(
                    finalAmount,
                    currency
                  )
                }

              </p>

            </div>


            {/* ================================================= */}
            {/* MENSAJE */}
            {/* ================================================= */}

            <div className="rounded-2xl bg-black text-white px-5 py-4 text-center mb-6">

              <p className="text-sm font-black uppercase tracking-[0.08em]">

                {
                  isCourtesy
                    ? '¡Beneficio registrado!'
                    : '¡Gracias por tu compra!'
                }

              </p>


              <p className="text-xs text-white/70 mt-1 leading-relaxed">

                {
                  settings?.receiptMessage ||
                  `Gracias por elegir ${gymName}. Disfruta tu ${String(planLabel).toLowerCase()}.`
                }

              </p>

            </div>


            {/* ================================================= */}
            {/* VIGENCIA */}
            {/* ================================================= */}

            <div className="text-center pb-7">

              <p className="text-[10px] uppercase tracking-[0.18em] text-black/40">
                Vigencia de la suscripción
              </p>


              <p className="text-xs font-bold mt-1">

                {
                  subscription?.startDate ||
                  payment?.period
                    ?.split(
                      ' - '
                    )
                    ?.[0] ||
                  '—'
                }

                {'  —  '}

                {
                  subscription?.endDate ||
                  payment?.period
                    ?.split(
                      ' - '
                    )
                    ?.[1] ||
                  '—'
                }

              </p>


              <p className="text-[10px] text-black/35 mt-4">
                Conserva este comprobante para cualquier aclaración.
              </p>

            </div>

          </div>

        </div>

      );

    }
  );


PaymentReceipt.displayName =
  'PaymentReceipt';


export default PaymentReceipt;
