
import React from 'react';

import {
  ArrowUpRight
} from 'lucide-react';


const QuickAction = ({
  icon: Icon,
  label,
  description,
  color = 'green',
  onClick
}) => {

  const styles = {
    green: {
      icon: 'text-[#00ff88]',
      iconBg: 'bg-[#00ff88]/10 border-[#00ff88]/15'
    },

    blue: {
      icon: 'text-blue-400',
      iconBg: 'bg-blue-500/10 border-blue-500/15'
    },

    yellow: {
      icon: 'text-yellow-400',
      iconBg: 'bg-yellow-500/10 border-yellow-500/15'
    }
  };


  const current =
    styles[color] ||
    styles.green;


  return (

    <button
      type="button"
      onClick={
        onClick
      }
      className="
        group
        relative
        overflow-hidden
        min-h-[112px]
        bg-[#111111]
        border
        border-[#1d1d1d]
        rounded-2xl
        p-4
        text-left
        transition-all
        duration-300
        hover:border-[#00ff88]/25
        hover:-translate-y-0.5
        hover:bg-[#131313]
      "
    >

      <div className="flex items-start justify-between gap-3">

        <div
          className={`
            w-10
            h-10
            rounded-xl
            border
            flex
            items-center
            justify-center
            ${current.iconBg}
          `}
        >

          <Icon
            size={18}
            className={
              current.icon
            }
          />

        </div>


        <ArrowUpRight
          size={16}
          className="text-gray-700 group-hover:text-[#00ff88] transition-colors"
        />

      </div>


      <p className="text-white text-sm font-semibold mt-4">
        {label}
      </p>


      {
        description &&
        (

          <p className="text-gray-600 text-[10px] mt-1">
            {description}
          </p>

        )
      }

    </button>

  );

};


export default QuickAction;