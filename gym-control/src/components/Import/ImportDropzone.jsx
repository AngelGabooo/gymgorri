// src/components/Import/ImportDropzone.jsx

import React, {
  useRef,
  useState
} from 'react';

import {
  UploadCloud,
  FileSpreadsheet,
  X,
  Loader2,
  ShieldCheck
} from 'lucide-react';


const ImportDropzone = ({
  file,
  loading = false,
  onFileSelect,
  onClear
}) => {

  const inputRef =
    useRef(
      null
    );


  const [
    dragging,
    setDragging
  ] = useState(
    false
  );


  const processFile = (
    selectedFile
  ) => {

    if (
      !selectedFile ||
      loading
    ) {

      return;

    }


    onFileSelect?.(
      selectedFile
    );

  };


  const handleInputChange = (
    event
  ) => {

    const selected =
      event
        .target
        .files?.[0];


    processFile(
      selected
    );


    /*
     * Permite volver a seleccionar
     * el mismo archivo.
     */
    event.target.value =
      '';

  };


  const handleDrop = (
    event
  ) => {

    event.preventDefault();

    setDragging(
      false
    );


    const selected =
      event
        .dataTransfer
        .files?.[0];


    processFile(
      selected
    );

  };


  const handleDragOver = (
    event
  ) => {

    event.preventDefault();

    setDragging(
      true
    );

  };


  const handleDragLeave = (
    event
  ) => {

    event.preventDefault();

    setDragging(
      false
    );

  };


  const openPicker = () => {

    if (
      loading
    ) {

      return;

    }


    inputRef
      .current
      ?.click();

  };


  return (

    <div className="bg-[#101010] border border-[#1d1d1d] rounded-2xl p-6">

      <div className="flex items-center justify-between gap-3 mb-5">

        <div>

          <h2 className="text-white font-bold">
            Archivo de importación
          </h2>

          <p className="text-gray-500 text-sm mt-1">
            Selecciona o arrastra un archivo Excel.
          </p>

        </div>


        <div className="hidden sm:flex items-center gap-2 text-[#00ff88] text-xs">

          <ShieldCheck
            size={15}
          />

          Validación antes de guardar

        </div>

      </div>


      <input
        ref={
          inputRef
        }
        type="file"
        accept=".xlsx,.xls"
        onChange={
          handleInputChange
        }
        className="hidden"
      />


      {
        !file
          ? (

            <button
              type="button"
              onClick={
                openPicker
              }
              onDrop={
                handleDrop
              }
              onDragOver={
                handleDragOver
              }
              onDragLeave={
                handleDragLeave
              }
              className={`
                w-full
                min-h-[260px]
                rounded-2xl
                border
                border-dashed
                flex
                flex-col
                items-center
                justify-center
                px-6
                transition-all
                ${
                  dragging
                    ? 'border-[#00ff88] bg-[#00ff88]/5'
                    : 'border-[#333333] hover:border-[#00ff88]/50 bg-[#0d0d0d]'
                }
              `}
            >

              {
                loading
                  ? (

                    <Loader2
                      size={38}
                      className="text-[#00ff88] animate-spin"
                    />

                  )
                  : (

                    <div className="w-16 h-16 rounded-2xl bg-[#00ff88]/10 border border-[#00ff88]/10 flex items-center justify-center">

                      <UploadCloud
                        size={30}
                        className="text-[#00ff88]"
                      />

                    </div>

                  )
              }


              <p className="text-white font-semibold mt-5">
                {
                  loading
                    ? 'Leyendo archivo...'
                    : 'Arrastra tu Excel aquí'
                }
              </p>


              <p className="text-gray-500 text-sm mt-2">
                o haz clic para buscarlo en tu computadora
              </p>


              <span className="mt-5 px-3 py-1.5 rounded-lg bg-[#171717] border border-[#292929] text-gray-500 text-xs">
                XLSX · XLS
              </span>

            </button>

          )
          : (

            <div className="bg-[#0d0d0d] border border-[#292929] rounded-2xl p-5">

              <div className="flex items-center gap-4">

                <div className="w-14 h-14 shrink-0 rounded-xl bg-[#00ff88]/10 flex items-center justify-center">

                  <FileSpreadsheet
                    size={26}
                    className="text-[#00ff88]"
                  />

                </div>


                <div className="min-w-0 flex-1">

                  <p className="text-white font-medium truncate">
                    {file.name}
                  </p>


                  <p className="text-gray-600 text-xs mt-1">

                    {
                      (
                        file.size /
                        1024
                      ).toFixed(
                        1
                      )
                    } KB

                  </p>

                </div>


                <button
                  type="button"
                  disabled={
                    loading
                  }
                  onClick={
                    onClear
                  }
                  className="w-9 h-9 rounded-lg border border-[#292929] flex items-center justify-center text-gray-500 hover:text-red-400 hover:border-red-500/30 disabled:opacity-40"
                  title="Quitar archivo"
                >

                  <X
                    size={17}
                  />

                </button>

              </div>


              <button
                type="button"
                disabled={
                  loading
                }
                onClick={
                  openPicker
                }
                className="mt-4 text-[#00ff88] text-xs hover:underline disabled:opacity-40"
              >
                Seleccionar otro archivo
              </button>

            </div>

          )
      }

    </div>

  );

};


export default ImportDropzone;