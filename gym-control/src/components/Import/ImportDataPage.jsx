// src/components/Import/ImportDataPage.jsx

import React, {
  useMemo,
  useState
} from 'react';

import {
  ArrowLeft,
  ShieldCheck,
  FileSpreadsheet,
  CircleHelp
} from 'lucide-react';

import {
  useNavigate
} from 'react-router-dom';

import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';

import ImportDropzone from './ImportDropzone';
import ImportPreview from './ImportPreview';
import ImportResultModal from './ImportResultModal';

import {
  parseExcelFile,
  importMembers
} from '../../services/importService';


import {
  useGymAlert
} from '../UI/GymAlertProvider';
// ======================================================
// IMPORT DATA PAGE
// ======================================================

const ImportDataPage = () => {

  const navigate =
    useNavigate();


  const {
    showAlert,
    showConfirm
  } =
    useGymAlert();


  const [
    file,
    setFile
  ] = useState(
    null
  );


  const [
    rows,
    setRows
  ] = useState(
    []
  );


  const [
    reading,
    setReading
  ] = useState(
    false
  );


  const [
    importing,
    setImporting
  ] = useState(
    false
  );


  const [
    error,
    setError
  ] = useState(
    ''
  );


  const [
    result,
    setResult
  ] = useState(
    null
  );


  const [
    resultOpen,
    setResultOpen
  ] = useState(
    false
  );


  // ====================================================
  // FILAS VÁLIDAS
  // ====================================================

  const validRows =
    useMemo(
      () =>
        rows.filter(
          row =>
            row
              ?.validation
              ?.valid
        ).length,
      [
        rows
      ]
    );


  // ====================================================
  // FILAS CON ERROR
  // ====================================================

  const invalidRows =
    useMemo(
      () =>
        Math.max(
          0,
          rows.length -
          validRows
        ),
      [
        rows.length,
        validRows
      ]
    );


  // ====================================================
  // SELECCIONAR ARCHIVO
  // ====================================================

  const handleFileSelect =
    async (
      selectedFile
    ) => {

      if (
        !selectedFile
      ) {

        return;

      }


      try {

        setReading(
          true
        );

        setError(
          ''
        );

        setResult(
          null
        );

        setResultOpen(
          false
        );


        const parsed =
          await parseExcelFile(
            selectedFile
          );


        setFile(
          selectedFile
        );


        setRows(
          parsed
        );


        if (
          parsed.length ===
          0
        ) {

          await showAlert({

            type:
              'warning',

            title:
              'Archivo sin miembros',

            message:
              'El archivo fue leído correctamente, pero no contiene miembros disponibles para importar.'

          });

        }

      } catch (fileError) {

        console.error(
          'Error leyendo archivo:',
          fileError
        );


        setFile(
          null
        );


        setRows(
          []
        );


        const message =
          fileError?.message ||
          'No fue posible leer el archivo.';


        setError(
          message
        );


        await showAlert({

          type:
            'error',

          title:
            'No se pudo leer el archivo',

          message

        });

      } finally {

        setReading(
          false
        );

      }

    };


  // ====================================================
  // QUITAR ARCHIVO
  // ====================================================

  const handleClearFile =
    () => {

      if (
        importing
      ) {

        return;

      }


      setFile(
        null
      );


      setRows(
        []
      );


      setError(
        ''
      );


      setResult(
        null
      );


      setResultOpen(
        false
      );

    };


  // ====================================================
  // IMPORTAR
  // ====================================================

  const handleImport =
    async () => {

      if (
        rows.length ===
          0 ||
        validRows ===
          0
      ) {

        await showAlert({

          type:
            'warning',

          title:
            'No hay registros disponibles',

          message:
            'Selecciona un archivo que contenga al menos un miembro válido antes de continuar.'

        });


        return;

      }


      // ==================================================
      // CONFIRMACIÓN PERSONALIZADA
      // ==================================================

      const confirmed =
        await showConfirm({

          type:
            'info',

          title:
            'Confirmar importación',

          message:
            `Se encontraron ${rows.length} registros.\n\n` +
            `${validRows} están listos para importar.` +
            (
              invalidRows >
              0
                ? `\n${invalidRows} presentan errores y serán omitidos.`
                : ''
            ) +
            '\n\nLos duplicados por teléfono o correo también serán omitidos automáticamente.',

          confirmText:
            `Importar ${validRows} miembros`,

          cancelText:
            'Cancelar'

        });


      if (
        !confirmed
      ) {

        return;

      }


      try {

        setImporting(
          true
        );


        setError(
          ''
        );


        const response =
          importMembers(
            rows,
            {

              skipDuplicates:
                true

            }
          );


        setResult(
          response
        );


        setResultOpen(
          true
        );

      } catch (importError) {

        console.error(
          'Error importando:',
          importError
        );


        const message =
          importError?.message ||
          'No fue posible completar la importación.';


        setError(
          message
        );


        await showAlert({

          type:
            'error',

          title:
            'No se pudo importar',

          message

        });

      } finally {

        setImporting(
          false
        );

      }

    };


  return (

    <div
      className="
        min-h-screen
        bg-[#0a0a0a]
        flex
      "
    >

      <Sidebar
        activePage="Miembros"
      />


      <div
        className="
          flex-1
          min-w-0
        "
      >

        <Header
          subtitle="Importación masiva de miembros"
        />


        <main
          className="
            p-4
            sm:p-6
            max-w-[1600px]
            mx-auto
            space-y-6
          "
        >

          {/* ================================================= */}
          {/* CABECERA */}
          {/* ================================================= */}

          <section
            className="
              flex
              flex-col
              lg:flex-row
              lg:items-center
              lg:justify-between
              gap-4
            "
          >

            <div>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/members'
                  )
                }
                className="
                  inline-flex
                  items-center
                  gap-2
                  text-gray-500
                  hover:text-white
                  text-sm
                  transition-colors
                "
              >

                <ArrowLeft
                  size={16}
                />

                Volver a miembros

              </button>


              <h1
                className="
                  text-white
                  text-2xl
                  sm:text-3xl
                  font-bold
                  mt-4
                "
              >

                Importar miembros

              </h1>


              <p
                className="
                  text-gray-500
                  text-sm
                  mt-2
                  max-w-2xl
                "
              >

                Migra información existente al sistema sin registrar cada miembro manualmente.

              </p>

            </div>


            <div
              className="
                flex
                items-center
                gap-2
                px-3
                py-2
                rounded-xl
                bg-[#00ff88]/5
                border
                border-[#00ff88]/15
              "
            >

              <ShieldCheck
                size={16}
                className="text-[#00ff88]"
              />


              <span
                className="
                  text-[#00ff88]
                  text-xs
                  font-medium
                "
              >

                Los datos se validan antes de guardarse

              </span>

            </div>

          </section>


          {/* ================================================= */}
          {/* INFORMACIÓN */}
          {/* ================================================= */}

          <section
            className="
              grid
              grid-cols-1
              lg:grid-cols-2
              gap-4
            "
          >

            <div
              className="
                bg-[#101010]
                border
                border-[#1d1d1d]
                rounded-2xl
                p-5
                flex
                gap-4
              "
            >

              <div
                className="
                  w-11
                  h-11
                  shrink-0
                  rounded-xl
                  bg-[#00ff88]/10
                  flex
                  items-center
                  justify-center
                "
              >

                <FileSpreadsheet
                  size={21}
                  className="text-[#00ff88]"
                />

              </div>


              <div>

                <h3
                  className="
                    text-white
                    font-semibold
                  "
                >

                  Formato Excel

                </h3>


                <p
                  className="
                    text-gray-500
                    text-xs
                    leading-5
                    mt-1
                  "
                >

                  El sistema reconoce nombres, teléfono, correo, plan, vigencia, estado, pagos y datos de asistencia.

                </p>

              </div>

            </div>


            <div
              className="
                bg-[#101010]
                border
                border-[#1d1d1d]
                rounded-2xl
                p-5
                flex
                gap-4
              "
            >

              <div
                className="
                  w-11
                  h-11
                  shrink-0
                  rounded-xl
                  bg-blue-500/10
                  flex
                  items-center
                  justify-center
                "
              >

                <CircleHelp
                  size={21}
                  className="text-blue-400"
                />

              </div>


              <div>

                <h3
                  className="
                    text-white
                    font-semibold
                  "
                >

                  Duplicados protegidos

                </h3>


                <p
                  className="
                    text-gray-500
                    text-xs
                    leading-5
                    mt-1
                  "
                >

                  Antes de crear un miembro se compara su teléfono y correo con los registros existentes.

                </p>

              </div>

            </div>

          </section>


          {/* ================================================= */}
          {/* ERROR INLINE */}
          {/* ================================================= */}

          {
            error &&
            (

              <div
                className="
                  bg-red-500/5
                  border
                  border-red-500/20
                  rounded-xl
                  px-4
                  py-3
                "
              >

                <p
                  className="
                    text-red-400
                    text-sm
                  "
                >

                  {error}

                </p>

              </div>

            )
          }


          {/* ================================================= */}
          {/* DROPZONE */}
          {/* ================================================= */}

          <ImportDropzone
            file={
              file
            }
            loading={
              reading
            }
            onFileSelect={
              handleFileSelect
            }
            onClear={
              handleClearFile
            }
          />


          {/* ================================================= */}
          {/* PREVIEW */}
          {/* ================================================= */}

          <ImportPreview
            rows={
              rows
            }
            loading={
              importing
            }
            onImport={
              handleImport
            }
          />

        </main>

      </div>


      {/* ================================================= */}
      {/* RESULTADO */}
      {/* ================================================= */}

      <ImportResultModal
        open={
          resultOpen
        }
        result={
          result
        }
        onClose={() =>
          setResultOpen(
            false
          )
        }
        onGoMembers={() =>
          navigate(
            '/members'
          )
        }
        onGoDashboard={() =>
          navigate(
            '/dashboard'
          )
        }
      />

    </div>

  );

};


export default ImportDataPage;