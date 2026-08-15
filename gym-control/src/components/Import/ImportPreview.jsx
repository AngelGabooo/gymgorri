// src/components/Import/ImportPreview.jsx

import React, {
  useMemo,
  useState
} from 'react';

import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Search,
  Database,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';


const PAGE_SIZE =
  10;


const ImportPreview = ({
  rows = [],
  loading = false,
  onImport
}) => {

  const [
    search,
    setSearch
  ] = useState(
    ''
  );


  const [
    page,
    setPage
  ] = useState(
    1
  );


  const validRows =
    useMemo(
      () =>
        rows.filter(
          row =>
            row
              ?.validation
              ?.valid
        ).length,
      [rows]
    );


  const invalidRows =
    rows.length -
    validRows;


  const filteredRows =
    useMemo(
      () => {

        const query =
          search
            .trim()
            .toLowerCase();


        if (!query) {

          return rows;

        }


        return rows.filter(
          row => {

            const text =
              [
                row.firstName,
                row.lastName,
                row.phone,
                row.email,
                row.plan,
                row.status
              ]
                .join(
                  ' '
                )
                .toLowerCase();


            return text.includes(
              query
            );

          }
        );

      },
      [
        rows,
        search
      ]
    );


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredRows.length /
        PAGE_SIZE
      )
    );


  const safePage =
    Math.min(
      page,
      totalPages
    );


  const visibleRows =
    filteredRows.slice(
      (
        safePage -
        1
      ) *
      PAGE_SIZE,
      safePage *
      PAGE_SIZE
    );


  const handleSearch = (
    event
  ) => {

    setSearch(
      event.target.value
    );

    setPage(
      1
    );

  };


  if (
    rows.length ===
    0
  ) {

    return null;

  }


  return (

    <div className="space-y-4">

      {/* MÉTRICAS */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <SummaryCard
          icon={
            Users
          }
          label="Registros encontrados"
          value={
            rows.length
          }
        />


        <SummaryCard
          icon={
            CheckCircle2
          }
          label="Listos para importar"
          value={
            validRows
          }
          type="success"
        />


        <SummaryCard
          icon={
            AlertTriangle
          }
          label="Con errores"
          value={
            invalidRows
          }
          type="warning"
        />

      </div>


      {/* TABLA */}

      <div className="bg-[#101010] border border-[#1d1d1d] rounded-2xl overflow-hidden">

        <div className="p-5 border-b border-[#1d1d1d] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <div>

            <h2 className="text-white font-bold">
              Vista previa
            </h2>

            <p className="text-gray-500 text-xs mt-1">
              Confirma los datos antes de agregarlos al sistema.
            </p>

          </div>


          <div className="relative w-full lg:w-[300px]">

            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
            />

            <input
              type="text"
              value={
                search
              }
              onChange={
                handleSearch
              }
              placeholder="Buscar en la importación..."
              className="
                w-full
                bg-[#171717]
                border
                border-[#292929]
                rounded-xl
                pl-10
                pr-4
                py-2.5
                text-sm
                text-white
                placeholder:text-gray-600
                outline-none
                focus:border-[#00ff88]/50
              "
            />

          </div>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full min-w-[950px]">

            <thead>

              <tr className="border-b border-[#1d1d1d] bg-[#0d0d0d]">

                <TableHeader>
                  Fila
                </TableHeader>

                <TableHeader>
                  Miembro
                </TableHeader>

                <TableHeader>
                  Teléfono
                </TableHeader>

                <TableHeader>
                  Plan
                </TableHeader>

                <TableHeader>
                  Vencimiento
                </TableHeader>

                <TableHeader>
                  Estado
                </TableHeader>

                <TableHeader>
                  Validación
                </TableHeader>

              </tr>

            </thead>


            <tbody>

              {
                visibleRows.map(
                  row => (

                    <tr
                      key={
                        row.rowNumber
                      }
                      className="border-b border-[#191919] hover:bg-[#141414] transition-colors"
                    >

                      <TableCell muted>
                        {row.rowNumber}
                      </TableCell>


                      <TableCell>

                        <p className="text-white font-medium">
                          {row.firstName} {row.lastName}
                        </p>

                        <p className="text-gray-600 text-xs mt-1">
                          {
                            row.email ||
                            'Sin correo'
                          }
                        </p>

                      </TableCell>


                      <TableCell>
                        {
                          row.phone ||
                          '—'
                        }
                      </TableCell>


                      <TableCell>
                        {
                          row.plan ||
                          'Mensual'
                        }
                      </TableCell>


                      <TableCell>
                        {
                          row.endDate ||
                          '—'
                        }
                      </TableCell>


                      <TableCell>

                        <StatusBadge
                          status={
                            row.status
                          }
                        />

                      </TableCell>


                      <TableCell>

                        {
                          row
                            ?.validation
                            ?.valid
                            ? (

                              <span className="inline-flex items-center gap-1.5 text-[#00ff88] text-xs">

                                <CheckCircle2
                                  size={14}
                                />

                                Correcto

                              </span>

                            )
                            : (

                              <div className="max-w-[220px]">

                                <span className="inline-flex items-center gap-1.5 text-red-400 text-xs">

                                  <AlertTriangle
                                    size={14}
                                  />

                                  Revisar

                                </span>


                                <p className="text-red-400/70 text-[11px] mt-1">

                                  {
                                    row
                                      ?.validation
                                      ?.errors
                                      ?.join(
                                        ', '
                                      ) ||
                                    'Registro inválido'
                                  }

                                </p>

                              </div>

                            )
                        }

                      </TableCell>

                    </tr>

                  )
                )
              }

            </tbody>

          </table>

        </div>


        {/* FOOTER */}

        <div className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div className="flex items-center gap-3">

            <p className="text-gray-600 text-xs">
              Mostrando {
                visibleRows.length
              } de {
                filteredRows.length
              } registros
            </p>


            {
              invalidRows >
              0 &&
              (

                <span className="text-yellow-400 text-xs">
                  {invalidRows} no se importarán
                </span>

              )
            }

          </div>


          <div className="flex flex-wrap items-center gap-3">

            {
              totalPages >
              1 &&
              (

                <div className="flex items-center gap-2">

                  <button
                    type="button"
                    disabled={
                      safePage <=
                      1
                    }
                    onClick={() =>
                      setPage(
                        current =>
                          Math.max(
                            1,
                            current -
                            1
                          )
                      )
                    }
                    className="w-9 h-9 rounded-lg border border-[#292929] text-gray-400 flex items-center justify-center disabled:opacity-30"
                  >

                    <ChevronLeft
                      size={16}
                    />

                  </button>


                  <span className="text-gray-500 text-xs">
                    {safePage} / {totalPages}
                  </span>


                  <button
                    type="button"
                    disabled={
                      safePage >=
                      totalPages
                    }
                    onClick={() =>
                      setPage(
                        current =>
                          Math.min(
                            totalPages,
                            current +
                            1
                          )
                      )
                    }
                    className="w-9 h-9 rounded-lg border border-[#292929] text-gray-400 flex items-center justify-center disabled:opacity-30"
                  >

                    <ChevronRight
                      size={16}
                    />

                  </button>

                </div>

              )
            }


            <button
              type="button"
              disabled={
                loading ||
                validRows ===
                0
              }
              onClick={
                onImport
              }
              className="
                px-5
                py-2.5
                rounded-xl
                bg-[#00ff88]
                hover:bg-[#00e87a]
                disabled:opacity-40
                disabled:cursor-not-allowed
                text-black
                font-bold
                text-sm
                flex
                items-center
                gap-2
              "
            >

              {
                loading
                  ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )
                  : (
                    <Database
                      size={17}
                    />
                  )
              }

              {
                loading
                  ? 'Importando...'
                  : `Importar ${validRows} miembros`
              }

            </button>

          </div>

        </div>

      </div>

    </div>

  );

};


// ======================================================
// COMPONENTES
// ======================================================

const SummaryCard = ({
  icon: Icon,
  label,
  value,
  type = 'default'
}) => {

  const styles = {

    default: {
      icon:
        'text-gray-400',

      background:
        'bg-[#171717]'
    },

    success: {
      icon:
        'text-[#00ff88]',

      background:
        'bg-[#00ff88]/10'
    },

    warning: {
      icon:
        'text-yellow-400',

      background:
        'bg-yellow-400/10'
    }

  };


  const current =
    styles[type] ||
    styles.default;


  return (

    <div className="bg-[#101010] border border-[#1d1d1d] rounded-2xl p-5">

      <div className="flex items-center justify-between gap-4">

        <div>

          <p className="text-gray-500 text-xs">
            {label}
          </p>

          <p className="text-white text-2xl font-bold mt-1">
            {value}
          </p>

        </div>


        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${current.background}`}>

          <Icon
            size={20}
            className={
              current.icon
            }
          />

        </div>

      </div>

    </div>

  );

};


const TableHeader = ({
  children
}) => (

  <th className="px-4 py-3 text-left text-gray-600 text-[11px] font-semibold uppercase tracking-wider">
    {children}
  </th>

);


const TableCell = ({
  children,
  muted = false
}) => (

  <td
    className={`
      px-4
      py-4
      text-sm
      ${
        muted
          ? 'text-gray-600'
          : 'text-gray-400'
      }
    `}
  >
    {children}
  </td>

);


const StatusBadge = ({
  status
}) => {

  const normalized =
    String(
      status ||
      'Activo'
    )
      .trim()
      .toLowerCase();


  let style =
    'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20';


  if (
    normalized.includes(
      'venc'
    )
  ) {

    style =
      'bg-red-500/10 text-red-400 border-red-500/20';

  } else if (
    normalized.includes(
      'bloq'
    )
  ) {

    style =
      'bg-orange-500/10 text-orange-400 border-orange-500/20';

  } else if (
    normalized.includes(
      'sin'
    )
  ) {

    style =
      'bg-gray-500/10 text-gray-400 border-gray-500/20';

  }


  return (

    <span className={`inline-flex px-2.5 py-1 rounded-lg border text-xs ${style}`}>
      {
        status ||
        'Activo'
      }
    </span>

  );

};


export default ImportPreview;