
import React from 'react';


const DonutChart = ({
  data = [],
  total = 0,
  label = 'miembros'
}) => {

  const colors = {
    Activas: '#00ff88',
    'Por vencer': '#eab308',
    Vencidas: '#ef4444',
    Bloqueadas: '#6b7280'
  };


  const totalValue =
    data.reduce(
      (
        sum,
        item
      ) =>
        sum +
        Number(
          item.value ||
          0
        ),
      0
    );


  const radius =
    38;


  const circumference =
    2 *
    Math.PI *
    radius;


  let offset =
    0;


  return (

    <div className="relative w-52 h-52 mx-auto">

      <svg
        className="w-full h-full -rotate-90"
        viewBox="0 0 100 100"
      >

        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="10"
        />


        {
          totalValue >
          0 &&
          data.map(
            (
              item,
              index
            ) => {

              const value =
                Number(
                  item.value ||
                  0
                );


              if (
                value <=
                0
              ) {
                return null;
              }


              const length =
                (
                  value /
                  totalValue
                ) *
                circumference;


              const currentOffset =
                offset;


              offset +=
                length;


              return (

                <circle
                  key={`${item.label}-${index}`}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={
                    colors[item.label] ||
                    '#6b7280'
                  }
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.max(0, length - 1.5)} ${circumference}`}
                  strokeDashoffset={-currentOffset}
                  className="transition-all duration-500"
                />

              );

            }
          )
        }

      </svg>


      <div className="absolute inset-0 flex flex-col items-center justify-center">

        <span className="text-3xl font-bold text-white">
          {total}
        </span>

        <span className="text-[10px] uppercase tracking-[0.16em] text-gray-600 mt-1">
          {label}
        </span>

      </div>

    </div>

  );

};


export default DonutChart;