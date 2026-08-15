// src/components/Sales/InventoryMovementModal.jsx

import React, {
  useEffect,
  useState
} from 'react';

import {
  Boxes,
  X,
  Plus,
  Minus,
  AlertCircle
} from 'lucide-react';

import {
  registerInventoryMovement
} from '../../services/inventoryService';

const InventoryMovementModal = ({
  open,
  onClose,
  product,
  onSaved
}) => {
  const [mode, setMode] = useState('entry');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    setMode('entry');
    setQuantity('1');
    setReason('');
    setError('');
  }, [open, product]);

  if (!open || !product) return null;

  const save = () => {
    try {
      const movement = registerInventoryMovement({
        productId: product.id,
        type: mode,
        quantity: Number(quantity || 0),
        reason:
          reason.trim() ||
          (mode === 'entry'
            ? 'Entrada manual de inventario'
            : 'Salida manual de inventario')
      });

      onSaved?.(movement);
      onClose?.();
    } catch (saveError) {
      setError(saveError?.message || 'No se pudo actualizar el inventario.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-lg bg-[#111111] border border-[#242424] rounded-2xl shadow-2xl">
        <div className="p-6 border-b border-[#1f1f1f] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center">
              <Boxes size={20} className="text-[#00ff88]" />
            </div>

            <div>
              <h2 className="text-white font-black text-lg">
                Ajustar inventario
              </h2>
              <p className="text-gray-500 text-sm">
                {product.name} · Stock actual {product.stock || 0}
              </p>
            </div>
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
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode('entry')}
              className={`p-4 rounded-xl border flex items-center justify-center gap-2 font-bold ${
                mode === 'entry'
                  ? 'bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]'
                  : 'bg-[#191919] border-[#292929] text-gray-400'
              }`}
            >
              <Plus size={18} />
              Entrada
            </button>

            <button
              type="button"
              onClick={() => setMode('exit')}
              className={`p-4 rounded-xl border flex items-center justify-center gap-2 font-bold ${
                mode === 'exit'
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-[#191919] border-[#292929] text-gray-400'
              }`}
            >
              <Minus size={18} />
              Salida
            </button>
          </div>

          <div>
            <label className="text-white text-sm font-medium block mb-2">
              Cantidad
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={event => setQuantity(event.target.value)}
              className="w-full bg-[#191919] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:border-[#00ff88] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-white text-sm font-medium block mb-2">
              Motivo
            </label>
            <textarea
              rows="3"
              value={reason}
              onChange={event => setReason(event.target.value)}
              placeholder="Ej. Compra de mercancía, merma, consumo interno..."
              className="w-full bg-[#191919] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-600 resize-none focus:border-[#00ff88] focus:outline-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-[#1f1f1f] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#292929] text-gray-300"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={save}
            className="px-5 py-2.5 rounded-xl bg-[#00ff88] text-black font-black"
          >
            Guardar movimiento
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryMovementModal;
