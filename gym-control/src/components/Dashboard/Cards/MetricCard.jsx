
import React from 'react';

import {
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';


const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'green',
  trend,
  trendValue,
  action,
  onActionClick,
  onClick,
  badge,
  pulse = false,
  compact = false
}) => {

  const colorClasses = {
    green: 'text-[#00ff88]',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    gray: 'text-gray-400',
  };


  const bgClasses = {
    green: 'bg-[#00ff88]/10 border-[#00ff88]/15',
    yellow: 'bg-yellow-500/10 border-yellow-500/15',
    red: 'bg-red-500/10 border-red-500/15',
    blue: 'bg-blue-500/10 border-blue-500/15',
    gray: 'bg-[#1a1a1a] border-[#2a2a2a]',
  };


  const isEmpty =
    value === null ||
    value === undefined ||
    value === '';


  const numericTrend =
    Number(
      trendValue
    );


  const hasNumericTrend =
    Number.isFinite(
      numericTrend
    );


  return (

    <div
      onClick={
        onClick
      }
      className={`
        group
        relative
        overflow-hidden
        bg-[#111111]
        border
        border-[#1d1d1d]
        rounded-2xl
        ${compact ? 'p-5' : 'p-6'}
        transition-all
        duration-300
        hover:border-[#00ff88]/25
        hover:-translate-y-0.5
        hover:shadow-[0_18px_45px_rgba(0,0,0,0.28)]
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >

      <div className="absolute -right-10 -top-10 w-28 h-28 rounded-full bg-white/[0.015] group-hover:bg-[#00ff88]/[0.025] transition-colors" />


      <div className="relative flex items-start justify-between gap-4">

        <div className="min-w-0">

          <div className="flex items-center gap-2 mb-2">

            <p className="text-gray-500 text-xs font-medium">
              {title}
            </p>


            {
              badge &&
              (

                <span
                  className={`
                    px-2
                    py-0.5
                    rounded-full
                    text-[8px]
                    font-bold
                    tracking-[0.12em]

                    ${
                      color === 'yellow'
                        ? 'bg-yellow-500/10 text-yellow-400'
                        : color === 'red'
                          ? 'bg-red-500/10 text-red-400'
                          : color === 'blue'
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-[#00ff88]/10 text-[#00ff88]'
                    }
                  `}
                >
                  {badge}
                </span>

              )
            }

          </div>


          <p
            className={`
              font-bold
              tracking-tight
              truncate
              ${compact ? 'text-2xl' : 'text-3xl'}
              ${
                isEmpty
                  ? 'text-gray-600'
                  : colorClasses[color]
              }
            `}
          >
            {
              isEmpty
                ? '0'
                : value
            }
          </p>


          {
            subtitle &&
            (

              <p className="text-gray-600 text-xs mt-1.5 truncate">
                {subtitle}
              </p>

            )
          }


          {
            hasNumericTrend &&
            (

              <div
                className={`
                  inline-flex
                  items-center
                  gap-1
                  mt-3
                  text-[10px]
                  font-semibold

                  ${
                    numericTrend >=
                    0
                      ? 'text-[#00ff88]'
                      : 'text-red-400'
                  }
                `}
              >

                {
                  numericTrend >=
                  0
                    ? (
                      <ArrowUpRight size={13} />
                    )
                    : (
                      <ArrowDownRight size={13} />
                    )
                }


                {
                  numericTrend >=
                  0
                    ? '+'
                    : ''
                }
                {numericTrend.toFixed(1)}%

                <span className="text-gray-600 font-normal ml-1">
                  vs. mes anterior
                </span>

              </div>

            )
          }


          {
            trend &&
            !hasNumericTrend &&
            (

              <p
                className={`
                  text-[10px]
                  mt-3
                  ${
                    trend === 'Sin datos' ||
                    trend === 'En tiempo real'
                      ? 'text-gray-600'
                      : String(trend).startsWith('+')
                        ? 'text-[#00ff88]'
                        : 'text-red-400'
                  }
                `}
              >
                {trend}
              </p>

            )
          }

        </div>


        <div
          className={`
            relative
            w-12
            h-12
            rounded-2xl
            border
            flex
            items-center
            justify-center
            shrink-0

            ${
              isEmpty
                ? 'bg-[#171717] border-[#222222]'
                : bgClasses[color]
            }
          `}
        >

          {
            pulse &&
            (

              <span className="absolute inset-0 rounded-2xl border border-blue-400/20 animate-ping" />

            )
          }


          <Icon
            size={22}
            className={
              isEmpty
                ? 'text-gray-700'
                : colorClasses[color]
            }
          />

        </div>

      </div>


      {
        action &&
        (

          <button
            type="button"
            onClick={
              event => {

                event.stopPropagation();

                onActionClick?.();

              }
            }
            className="relative mt-4 text-[11px] text-[#00ff88] hover:underline"
          >
            {action}
          </button>

        )
      }

    </div>

  );

};


export default MetricCard;