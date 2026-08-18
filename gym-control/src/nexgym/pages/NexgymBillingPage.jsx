// src/nexgym/pages/NexgymBillingPage.jsx

import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  useNavigate
} from 'react-router-dom';

import {
  Search,
  WalletCards,
  DollarSign,
  ReceiptText,
  Building2,
  CalendarDays,
  ChevronRight,
  CreditCard
} from 'lucide-react';

import {
  getAllNexgymPayments
} from '../services/nexgymGymService';


const NexgymBillingPage = () => {

  const navigate =
    useNavigate();


  const [
    payments,
    setPayments
  ] = useState([]);


  const [
    search,
    setSearch
  ] = useState('');


  const loadPayments =
    () => {

      setPayments(
        getAllNexgymPayments()
      );

    };


  useEffect(
    () => {

      loadPayments();


      window.addEventListener(
        'nexgym-gyms-update',
        loadPayments
      );


      window.addEventListener(
        'gym-storage-update',
        loadPayments
      );


      return () => {

        window.removeEventListener(
          'nexgym-gyms-update',
          loadPayments
        );


        window.removeEventListener(
          'gym-storage-update',
          loadPayments
        );

      };

    },
    []
  );


  const filtered =
    useMemo(
      () => {

        const query =
          search
            .trim()
            .toLowerCase();


        if (!query) {

          return payments;

        }


        return payments.filter(
          payment =>

            payment.gymName
              ?.toLowerCase()
              .includes(
                query
              ) ||

            payment.gymCode
              ?.toLowerCase()
              .includes(
                query
              ) ||

            payment.method
              ?.toLowerCase()
              .includes(
                query
              ) ||

            payment.reference
              ?.toLowerCase()
              .includes(
                query
              )

        );

      },
      [
        payments,
        search
      ]
    );


  const totals =
    useMemo(
      () => {

        const now =
          new Date();


        const currentMonth =
          now.getMonth();

        const currentYear =
          now.getFullYear();


        const totalHistoric =
          payments.reduce(
            (
              total,
              payment
            ) =>
              total +
              Number(
                payment.amount ||
                0
              ),
            0
          );


        const totalMonth =
          payments
            .filter(
              payment => {

                const date =
                  new Date(
                    payment.createdAt ||
                    `${payment.date}T12:00:00`
                  );


                return (
                  date.getMonth() ===
                    currentMonth &&
                  date.getFullYear() ===
                    currentYear
                );

              }
            )
            .reduce(
              (
                total,
                payment
              ) =>
                total +
                Number(
                  payment.amount ||
                  0
                ),
              0
            );


        return {

          totalHistoric,

          totalMonth,

          count:
            payments.length

        };

      },
      [
        payments
      ]
    );


  const formatDate =
    (
      value
    ) => {

      if (!value) {

        return 'Sin fecha';

      }


      return new Intl.DateTimeFormat(
        'es-MX',
        {
          day:
            '2-digit',
          month:
            'short',
          year:
            'numeric'
        }
      ).format(
        new Date(
          `${value}T12:00:00`
        )
      );

    };


  return (

    <div className="p-8">


      <div className="mb-7">

        <p className="text-gray-500 text-sm">
          Historial global de cobros de NEXGYM
        </p>

      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">

        <MetricCard
          icon={
            DollarSign
          }
          label="Cobrado este mes"
          value={`$${totals.totalMonth.toLocaleString(
            'es-MX',
            {
              minimumFractionDigits:
                2
            }
          )}`}
        />

        <MetricCard
          icon={
            WalletCards
          }
          label="Cobrado histórico"
          value={`$${totals.totalHistoric.toLocaleString(
            'es-MX',
            {
              minimumFractionDigits:
                2
            }
          )}`}
        />

        <MetricCard
          icon={
            ReceiptText
          }
          label="Pagos registrados"
          value={
            totals.count
          }
        />

      </div>


      <div className="bg-[#111111] border border-[#202020] rounded-2xl p-4 mb-5">

        <div className="relative">

          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600"
          />

          <input
            type="text"
            value={
              search
            }
            onChange={
              event =>
                setSearch(
                  event.target.value
                )
            }
            placeholder="Buscar gimnasio, método o referencia..."
            className="w-full h-11 bg-[#0c0c0c] border border-[#242424] rounded-xl pl-11 pr-4 text-white text-sm outline-none placeholder:text-gray-700"
          />

        </div>

      </div>


      <div className="bg-[#111111] border border-[#202020] rounded-2xl overflow-hidden">

        {
          filtered.length ===
          0
            ? (

              <div className="py-16 text-center">

                <ReceiptText
                  className="w-10 h-10 text-gray-800 mx-auto"
                />

                <p className="text-white mt-4">
                  No hay pagos registrados
                </p>

                <p className="text-gray-600 text-xs mt-1">
                  Los pagos que registres desde cada gimnasio aparecerán aquí.
                </p>

              </div>

            )
            : (

              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead>

                    <tr className="border-b border-[#202020]">

                      <TH>
                        Gimnasio
                      </TH>

                      <TH>
                        Fecha
                      </TH>

                      <TH>
                        Importe
                      </TH>

                      <TH>
                        Método
                      </TH>

                      <TH>
                        Referencia
                      </TH>

                      <TH>
                        Estado
                      </TH>

                      <TH>
                        Acción
                      </TH>

                    </tr>

                  </thead>


                  <tbody>

                    {
                      filtered.map(
                        payment => (

                          <tr
                            key={
                              payment.id
                            }
                            className="border-b border-[#1b1b1b] last:border-b-0 hover:bg-[#141414]"
                          >

                            <td className="px-5 py-4">

                              <div className="flex items-center gap-3">

                                <div className="w-10 h-10 rounded-xl bg-[#00ff88]/10 flex items-center justify-center">

                                  <Building2
                                    className="w-5 h-5 text-[#00ff88]"
                                  />

                                </div>

                                <div>

                                  <p className="text-white text-sm font-medium">
                                    {payment.gymName}
                                  </p>

                                  <p className="text-gray-600 text-xs mt-1">
                                    {payment.gymCode}
                                  </p>

                                </div>

                              </div>

                            </td>


                            <td className="px-5 py-4">

                              <div className="flex items-center gap-2">

                                <CalendarDays
                                  className="w-4 h-4 text-gray-600"
                                />

                                <span className="text-gray-300 text-sm">
                                  {
                                    formatDate(
                                      payment.date
                                    )
                                  }
                                </span>

                              </div>

                            </td>


                            <td className="px-5 py-4">

                              <p className="text-white font-semibold">
                                $
                                {
                                  Number(
                                    payment.amount ||
                                    0
                                  ).toFixed(
                                    2
                                  )
                                }
                                {' '}
                                MXN
                              </p>

                            </td>


                            <td className="px-5 py-4">

                              <div className="flex items-center gap-2">

                                <CreditCard
                                  className="w-4 h-4 text-gray-600"
                                />

                                <span className="text-gray-400 text-sm">
                                  {payment.method || '-'}
                                </span>

                              </div>

                            </td>


                            <td className="px-5 py-4 text-gray-500 text-sm">
                              {payment.reference || '-'}
                            </td>


                            <td className="px-5 py-4">

                              <span className="inline-flex bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] rounded-full px-2.5 py-1 text-xs">
                                Pagado
                              </span>

                            </td>


                            <td className="px-5 py-4">

                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/nexgym/gyms/${payment.gymId}`
                                  )
                                }
                                className="h-9 px-3 rounded-lg bg-[#171717] border border-[#282828] text-gray-300 text-xs flex items-center gap-2 hover:text-white"
                              >

                                Ver cliente

                                <ChevronRight
                                  className="w-4 h-4"
                                />

                              </button>

                            </td>

                          </tr>

                        )
                      )
                    }

                  </tbody>

                </table>

              </div>

            )
        }

      </div>

    </div>

  );

};


const MetricCard = ({
  icon: Icon,
  label,
  value
}) => (

  <div className="bg-[#111111] border border-[#202020] rounded-2xl p-5">

    <div className="w-10 h-10 rounded-xl bg-[#171717] flex items-center justify-center">

      <Icon
        className="w-5 h-5 text-[#00ff88]"
      />

    </div>

    <p className="text-gray-600 text-sm mt-4">
      {label}
    </p>

    <p className="text-white text-2xl font-semibold mt-1">
      {value}
    </p>

  </div>

);


const TH = ({
  children
}) => (

  <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider font-semibold text-gray-600 whitespace-nowrap">
    {children}
  </th>

);


export default NexgymBillingPage;