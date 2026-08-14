import React, { useState } from 'react';

import {
  Mail,
  LockKeyhole,
  Eye,
  EyeOff
} from 'lucide-react';

const Input = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  error,
  icon,
  ...props
}) => {

  const [showPassword, setShowPassword] =
    useState(false);

  const [isFocused, setIsFocused] =
    useState(false);

  const isPassword =
    type === 'password';


  const IconComponent =
    icon === 'email'
      ? Mail
      : icon === 'password'
      ? LockKeyhole
      : null;


  return (

    <div className="mb-5">

      {/* LABEL */}

      {label && (
        <label
          className="
            text-gray-200
            text-sm
            font-medium
            mb-2.5
            block
          "
        >
          {label}
        </label>
      )}


      {/* INPUT */}

      <div
        className={`
          relative
          flex
          items-center
          bg-white/[0.035]
          border
          rounded-xl
          transition-all
          duration-300

          ${
            error
              ? 'border-red-500/70'
              : isFocused
              ? 'border-[#00ff88]/70 shadow-[0_0_25px_rgba(0,255,136,0.08)]'
              : 'border-white/[0.09] hover:border-white/[0.16]'
          }
        `}
      >

        {/* ICONO */}

        {IconComponent && (
          <div
            className="
              absolute
              left-4
              pointer-events-none
            "
          >
            <IconComponent
              size={19}
              strokeWidth={1.7}
              className={`
                transition-colors
                ${
                  isFocused
                    ? 'text-[#00ff88]'
                    : 'text-gray-500'
                }
              `}
            />
          </div>
        )}


        {/* CAMPO */}

        <input
          type={
            isPassword
              ? showPassword
                ? 'text'
                : 'password'
              : type
          }
          className={`
            w-full
            h-[54px]
            bg-transparent
            outline-none
            text-white
            text-sm
            placeholder:text-gray-600

            ${IconComponent ? 'pl-12' : 'pl-4'}

            ${isPassword ? 'pr-12' : 'pr-4'}
          `}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() =>
            setIsFocused(true)
          }
          onBlur={() =>
            setIsFocused(false)
          }
          {...props}
        />


        {/* VER PASSWORD */}

        {isPassword && (

          <button
            type="button"
            onClick={() =>
              setShowPassword(
                !showPassword
              )
            }
            className="
              absolute
              right-4
              text-gray-500
              hover:text-[#00ff88]
              transition
            "
          >

            {showPassword ? (
              <EyeOff size={19} />
            ) : (
              <Eye size={19} />
            )}

          </button>

        )}

      </div>


      {/* ERROR */}

      {error && (
        <p
          className="
            text-red-400
            text-xs
            mt-2
          "
        >
          {error}
        </p>
      )}

    </div>

  );
};

export default Input;