// src/services/inventoryService.js

import {
  getProductById,
  updateProduct
} from './productService';

export const INVENTORY_MOVEMENTS_KEY =
  'gym_control_inventory_movements';

const getSession = () => {
  try {
    const raw = localStorage.getItem('gym_control_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const createId = () => {
  if (window.crypto?.randomUUID) {
    return `INV-${window.crypto.randomUUID()}`;
  }

  return `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
};

export const getInventoryMovements = () => {
  try {
    const raw = localStorage.getItem(INVENTORY_MOVEMENTS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error leyendo movimientos de inventario:', error);
    return [];
  }
};

const saveMovements = (records) => {
  localStorage.setItem(
    INVENTORY_MOVEMENTS_KEY,
    JSON.stringify(Array.isArray(records) ? records : [])
  );

  window.dispatchEvent(new Event('gym-storage-update'));
  window.dispatchEvent(new Event('gym-sales-update'));
};

export const registerInventoryMovement = ({
  productId,
  type,
  quantity,
  reason = '',
  referenceId = null,
  actor = null
}) => {
  const product = getProductById(productId);

  if (!product) {
    throw new Error('No se encontró el producto.');
  }

  const qty = Math.abs(Number(quantity || 0));

  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error('La cantidad debe ser mayor a cero.');
  }

  const currentStock = Number(product.stock || 0);

  let delta = 0;

  if (type === 'entry' || type === 'return') {
    delta = qty;
  } else if (type === 'sale' || type === 'exit') {
    delta = -qty;
  } else if (type === 'adjustment') {
    delta = Number(quantity || 0);
  } else {
    throw new Error('Tipo de movimiento de inventario no válido.');
  }

  const newStock = currentStock + delta;

  if (newStock < 0) {
    throw new Error(
      `Stock insuficiente. Disponible: ${currentStock} ${product.unit || 'pieza(s)'}.`
    );
  }

  updateProduct(productId, {
    stock: newStock
  });

  const session = actor || getSession();
  const movement = {
    id: createId(),
    productId,
    productName: product.name,
    type,
    quantity: delta,
    previousStock: currentStock,
    newStock,
    reason: String(reason || '').trim(),
    referenceId,
    createdAt: new Date().toISOString(),
    actor: session
      ? {
          id: session.id || null,
          name: session.name || session.email || 'Usuario',
          email: session.email || '',
          role: session.role || ''
        }
      : null
  };

  const movements = getInventoryMovements();
  movements.unshift(movement);
  saveMovements(movements);

  return movement;
};

export const addStock = (productId, quantity, reason = 'Entrada de inventario') =>
  registerInventoryMovement({
    productId,
    type: 'entry',
    quantity,
    reason
  });

export const removeStock = (
  productId,
  quantity,
  reason = 'Salida manual de inventario'
) =>
  registerInventoryMovement({
    productId,
    type: 'exit',
    quantity,
    reason
  });
