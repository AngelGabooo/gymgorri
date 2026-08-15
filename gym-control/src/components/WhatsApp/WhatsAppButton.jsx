// src/components/WhatsApp/WhatsAppButton.jsx

import React, {
  useState
} from 'react';

import {
  MessageCircle
} from 'lucide-react';

import WhatsAppModal from './WhatsAppModal';


const WhatsAppButton = ({
  member,
  defaultType = 'renewal',
  extras = {},
  label = 'WhatsApp',
  compact = false,
  className = ''
}) => {

  const [
    open,
    setOpen
  ] = useState(false);


  if (!member) {
    return null;
  }


  return (

    <>

      <button
        type="button"
        onClick={() =>
          setOpen(
            true
          )
        }
        title="Contactar por WhatsApp"
        className={
          className ||
          (
            compact
              ? 'w-9 h-9 rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] hover:bg-[#00ff88]/15 flex items-center justify-center transition-colors'
              : 'px-4 py-2.5 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] font-bold hover:bg-[#00ff88]/15 flex items-center justify-center gap-2 transition-colors'
          )
        }
      >

        <MessageCircle
          size={
            compact
              ? 16
              : 18
          }
        />

        {
          !compact &&
          (
            <span>
              {label}
            </span>
          )
        }

      </button>


      <WhatsAppModal
        open={
          open
        }
        onClose={() =>
          setOpen(
            false
          )
        }
        member={
          member
        }
        defaultType={
          defaultType
        }
        extras={
          extras
        }
      />

    </>

  );

};


export default WhatsAppButton;
