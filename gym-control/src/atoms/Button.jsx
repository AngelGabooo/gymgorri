import React from 'react';

import {
  ArrowRight
} from 'lucide-react';

const Button = ({
  children,
  onClick,
  loading = false,
  className = '',
  ...props
}) => {

  return (

    <button
      onClick={onClick}
      disabled={loading}
      className={`
        group
        relative
        overflow-hidden

        w-full
        h-[56px]

        rounded-xl

        bg-[#00ff88]
        text-[#03110a]

        font-black
        text-sm

        flex
        items-center
        justify-center

        transition-all
        duration-300

        hover:bg-[#38ff9f]

        hover:shadow-[0_0_35px_rgba(0,255,136,0.3)]

        hover:-translate-y-[1px]

        active:translate-y-0

        disabled:opacity-50
        disabled:cursor-not-allowed

        ${className}
      `}
      {...props}
    >

      {/* EFECTO BRILLO */}

      <div
        className="
          absolute
          inset-0
          bg-gradient-to-r
          from-transparent
          via-white/20
          to-transparent
          -translate-x-full
          group-hover:translate-x-full
          transition-transform
          duration-700
        "
      />


      {loading ? (

        <div
          className="
            w-5
            h-5
            border-2
            border-black/30
            border-t-black
            rounded-full
            animate-spin
          "
        />

      ) : (

        <div
          className="
            relative
            flex
            items-center
            gap-3
          "
        >

          <span>
            {children}
          </span>

          <ArrowRight
            size={18}
            className="
              transition-transform
              duration-300
              group-hover:translate-x-1
            "
          />

        </div>

      )}

    </button>

  );
};

export default Button;