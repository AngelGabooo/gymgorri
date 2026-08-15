// src/components/Sales/SaleDetailModal.jsx

import React from 'react';

import {
  X,
  ReceiptText,
  User,
  CreditCard,
  Package
} from 'lucide-react';

const methodLabel = method => {
  const labels = {
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    transferencia: 'Transferencia',
    otro: 'Otro'
  };

  return labels[method] || method || 'Otro';
};

const SaleDetailModal = ({
  open,
  onClose,
  sale
}) => {
  if (!open || !sale) return null;

  const money = value =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(Number(value || 0));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#111111] border border-[#242424] rounded-2xl shadow-2xl">
        <div className="p-6 border-b border-[#1f1f1f] flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ReceiptText size={20} className="text-[#00ff88]" />
              <h2 className="text-white text-xl font-black">
                {sale.folio}
              </h2>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              {new Date(sale.createdAt).toLocaleString('es-MX')}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#292929] text-gray-400 flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <InfoBox
              icon={User}
              label="Cliente"
              value={sale.customer?.memberName || 'Venta general'}
            />
            <InfoBox
              icon={CreditCard}
              label="Método"
              value={methodLabel(sale.paymentMethod)}
            />
            <InfoBox
              icon={Package}
              label="Productos"
              value={`${sale.itemCount || 0}`}
            />
          </div>

          <div className="rounded-xl border border-[#242424] overflow-hidden">
            {sale.items?.map(item => (
              <div
                key={`${sale.id}-${item.productId}`}
                className="p-4 border-b border-[#242424] last:border-b-0 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-white font-semibold">
                    {item.name}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    {item.quantity} × {money(item.unitPrice)}
                  </p>
                </div>

                <p className="text-white font-black">
                  {money(item.subtotal)}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-[#171717] border border-[#242424] p-5 space-y-2">
            <Row label="Subtotal" value={money(sale.subtotal)} />
            <Row label="Descuento" value={`-${money(sale.discount)}`} />

            <div className="border-t border-[#292929] pt-3 mt-3">
              <Row
                label="TOTAL"
                value={money(sale.total)}
                strong
              />
            </div>

            {sale.paymentMethod === 'efectivo' && (
              <>
                <Row label="Recibido" value={money(sale.received)} />
                <Row label="Cambio" value={money(sale.change)} />
              </>
            )}
          </div>

          {sale.createdBy?.name && (
            <p className="text-gray-600 text-xs">
              Registró: {sale.createdBy.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoBox = ({
  icon: Icon,
  label,
  value
}) => (
  <div className="rounded-xl bg-[#171717] border border-[#242424] p-4">
    <Icon size={16} className="text-[#00ff88] mb-3" />
    <p className="text-gray-600 text-[10px] uppercase tracking-wider">
      {label}
    </p>
    <p className="text-white font-bold text-sm mt-1">
      {value}
    </p>
  </div>
);

const Row = ({
  label,
  value,
  strong = false
}) => (
  <div className="flex items-center justify-between gap-4">
    <span className={strong ? 'text-white font-black' : 'text-gray-500'}>
      {label}
    </span>
    <span
      className={
        strong
          ? 'text-[#00ff88] text-xl font-black'
          : 'text-white font-semibold'
      }
    >
      {value}
    </span>
  </div>
);

export default SaleDetailModal;
