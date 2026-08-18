// src/services/inventoryService.js

import {
  getProductById,
  updateProduct
} from './productService.js';

import {
  getCurrentGymContext
} from '../utils/memberId.js';

import {
  saveOfflineInventoryMovement
} from '../offline/repositories/inventoryMovementRepository.js';


// ======================================================
// STORAGE
// ======================================================

export const INVENTORY_MOVEMENTS_KEY =
  'gym_control_inventory_movements';


// ======================================================
// SESIÓN
// ======================================================

const getSession =
  () => {

    try {

      const raw =
        localStorage.getItem(
          'gym_control_session'
        );


      return raw
        ? JSON.parse(
            raw
          )
        : null;

    } catch (error) {

      console.error(
        'Error leyendo sesión para inventario:',
        error
      );


      return null;

    }

  };


// ======================================================
// CONTEXTO GYM
// ======================================================

const getInventoryGymContext =
  () => {

    try {

      return (
        getCurrentGymContext() ||
        {}
      );

    } catch (error) {

      console.error(
        'Error obteniendo gimnasio de inventario:',
        error
      );


      return {};

    }

  };


// ======================================================
// CREAR ID
// ======================================================

const createId =
  () => {

    if (
      window.crypto?.randomUUID
    ) {

      return `INV-${window.crypto.randomUUID()}`;

    }


    return (
      `INV-${Date.now()}-` +
      Math.random()
        .toString(36)
        .substring(
          2,
          8
        )
    );

  };


// ======================================================
// LEER TODOS LOS MOVIMIENTOS
// ======================================================
//
// SOLO LECTURA.
//
// ======================================================

export const getAllInventoryMovements =
  () => {

    try {

      const raw =
        localStorage.getItem(
          INVENTORY_MOVEMENTS_KEY
        );


      if (
        !raw
      ) {

        return [];

      }


      const parsed =
        JSON.parse(
          raw
        );


      return Array.isArray(
        parsed
      )
        ? parsed
        : [];

    } catch (error) {

      console.error(
        'Error leyendo movimientos de inventario:',
        error
      );


      return [];

    }

  };


// ======================================================
// GUARDAR
// ======================================================

const saveMovements =
  (
    records
  ) => {

    localStorage.setItem(
      INVENTORY_MOVEMENTS_KEY,
      JSON.stringify(
        Array.isArray(
          records
        )
          ? records
          : []
      )
    );


    window.dispatchEvent(
      new Event(
        'gym-storage-update'
      )
    );


    window.dispatchEvent(
      new Event(
        'gym-sales-update'
      )
    );

  };


// ======================================================
// MOVIMIENTOS DEL GYM ACTUAL
// ======================================================
//
// SOLO LECTURA.
//
// Ya NO migra registros dentro de este getter.
//
// Esto es importante porque productAnalyticsService
// puede llamar esta función durante render.
//
// ======================================================

export const getInventoryMovements =
  () => {

    const movements =
      getAllInventoryMovements();


    const {
      gymId
    } =
      getInventoryGymContext();


    if (
      !gymId
    ) {

      return movements;

    }


    return movements.filter(
      movement =>
        !movement?.gymId ||
        movement.gymId ===
          gymId
    );

  };


// ======================================================
// MOVIMIENTOS POR PRODUCTO
// ======================================================

export const getInventoryMovementsByProduct =
  (
    productId
  ) => {

    if (
      !productId
    ) {

      return [];

    }


    return getInventoryMovements()
      .filter(
        movement =>
          movement.productId ===
          productId
      );

  };


// ======================================================
// NORMALIZAR ACTOR
// ======================================================

const normalizeActor =
  (
    actor
  ) => {

    if (
      !actor
    ) {

      return null;

    }


    return {

      id:
        actor.id ||
        actor.userId ||
        null,

      name:
        actor.name ||
        actor.fullName ||
        actor.email ||
        'Usuario',

      email:
        actor.email ||
        '',

      role:
        actor.role ||
        ''

    };

  };


// ======================================================
// REGISTRAR MOVIMIENTO
// ======================================================

export const registerInventoryMovement =
  ({
    productId,
    type,
    quantity,
    reason = '',
    referenceId = null,
    actor = null
  }) => {

    // ==================================================
    // PRODUCTO
    // ==================================================

    const product =
      getProductById(
        productId
      );


    if (
      !product
    ) {

      throw new Error(
        'No se encontró el producto.'
      );

    }


    // ==================================================
    // GYM
    // ==================================================

    const {
      gymId,
      gymCode,
      gymName
    } =
      getInventoryGymContext();


    if (
      !gymId
    ) {

      throw new Error(
        'No se pudo determinar el gimnasio actual.'
      );

    }


    if (
      product.gymId &&
      product.gymId !==
        gymId
    ) {

      throw new Error(
        'El producto pertenece a otro gimnasio.'
      );

    }


    // ==================================================
    // CANTIDAD
    // ==================================================

    const numericQuantity =
      Number(
        quantity ||
        0
      );


    if (
      !Number.isFinite(
        numericQuantity
      ) ||
      numericQuantity ===
        0
    ) {

      throw new Error(
        'La cantidad debe ser mayor a cero.'
      );

    }


    const qty =
      Math.abs(
        numericQuantity
      );


    const currentStock =
      Number(
        product.stock ||
        0
      );


    if (
      !Number.isFinite(
        currentStock
      )
    ) {

      throw new Error(
        'El stock actual del producto no es válido.'
      );

    }


    // ==================================================
    // DELTA
    // ==================================================

    let delta =
      0;


    if (
      type ===
        'entry' ||
      type ===
        'return'
    ) {

      delta =
        qty;

    } else if (
      type ===
        'sale' ||
      type ===
        'exit'
    ) {

      delta =
        -qty;

    } else if (
      type ===
        'adjustment'
    ) {

      delta =
        numericQuantity;

    } else {

      throw new Error(
        'Tipo de movimiento de inventario no válido.'
      );

    }


    // ==================================================
    // NUEVO STOCK
    // ==================================================

    const newStock =
      currentStock +
      delta;


    if (
      newStock <
      0
    ) {

      throw new Error(
        `Stock insuficiente. Disponible: ${currentStock} ${product.unit || 'pieza(s)'}.`
      );

    }


    // ==================================================
    // ACTUALIZAR PRODUCTO
    // ==================================================
    //
    // updateProduct ya hace:
    //
    // localStorage
    // IndexedDB
    // syncQueue
    //
    // ==================================================

    updateProduct(
      productId,
      {
        stock:
          newStock
      }
    );


    // ==================================================
    // ACTOR
    // ==================================================

    const session =
      actor ||
      getSession();


    const now =
      new Date()
        .toISOString();


    // ==================================================
    // MOVIMIENTO
    // ==================================================

    const movement = {

      id:
        createId(),

      gymId,

      gymCode:
        gymCode ||
        product.gymCode ||
        null,

      gymName:
        gymName ||
        product.gymName ||
        null,

      productId,

      productName:
        product.name,

      productSku:
        product.sku ||
        '',

      productBarcode:
        product.barcode ||
        '',

      type,

      quantity:
        delta,

      absoluteQuantity:
        qty,

      previousStock:
        currentStock,

      newStock,

      reason:
        String(
          reason ||
          ''
        ).trim(),

      referenceId,

      unit:
        product.unit ||
        'pieza',

      cost:
        Number(
          product.cost ||
          0
        ),

      price:
        Number(
          product.price ||
          0
        ),

      createdAt:
        now,

      updatedAt:
        now,

      actor:
        normalizeActor(
          session
        )

    };


    // ==================================================
    // LOCALSTORAGE
    // ==================================================

    const allMovements =
      getAllInventoryMovements();


    allMovements.unshift(
      movement
    );


    saveMovements(
      allMovements
    );


    // ==================================================
    // INDEXEDDB + SYNCQUEUE
    // ==================================================

    void saveOfflineInventoryMovement(
      movement
    )
      .then(
        saved => {

          console.log(
            '✅ Movimiento de inventario respaldado en IndexedDB:',
            saved
          );

        }
      )
      .catch(
        error => {

          console.error(
            '❌ No se pudo respaldar el movimiento de inventario:',
            error
          );

        }
      );


    return movement;

  };


// ======================================================
// ENTRADA
// ======================================================

export const addStock =
  (
    productId,
    quantity,
    reason =
      'Entrada de inventario'
  ) => {

    return registerInventoryMovement({

      productId,

      type:
        'entry',

      quantity,

      reason

    });

  };


// ======================================================
// SALIDA
// ======================================================

export const removeStock =
  (
    productId,
    quantity,
    reason =
      'Salida manual de inventario'
  ) => {

    return registerInventoryMovement({

      productId,

      type:
        'exit',

      quantity,

      reason

    });

  };


// ======================================================
// DEVOLUCIÓN
// ======================================================

export const returnStock =
  (
    productId,
    quantity,
    reason =
      'Devolución de inventario',
    referenceId =
      null
  ) => {

    return registerInventoryMovement({

      productId,

      type:
        'return',

      quantity,

      reason,

      referenceId

    });

  };


// ======================================================
// AJUSTE
// ======================================================

export const adjustStock =
  (
    productId,
    quantity,
    reason =
      'Ajuste manual de inventario'
  ) => {

    return registerInventoryMovement({

      productId,

      type:
        'adjustment',

      quantity,

      reason

    });

  };


// ======================================================
// MOVIMIENTO POR VENTA
// ======================================================

export const registerSaleInventoryMovement =
  ({
    productId,
    quantity,
    saleId,
    actor = null
  }) => {

    return registerInventoryMovement({

      productId,

      type:
        'sale',

      quantity,

      reason:
        'Venta de producto',

      referenceId:
        saleId ||
        null,

      actor

    });

  };


// ======================================================
// DEFAULT
// ======================================================

const inventoryService = {

  getAllInventoryMovements,

  getInventoryMovements,

  getInventoryMovementsByProduct,

  registerInventoryMovement,

  addStock,

  removeStock,

  returnStock,

  adjustStock,

  registerSaleInventoryMovement

};


export default inventoryService;