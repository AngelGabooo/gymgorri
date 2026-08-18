// src/offline/repositories/productRepository.js

import db, {
  openNexgymDatabase
} from '../db/nexgymDatabase.js';

import {
  addToSyncQueue,
  SYNC_OPERATIONS
} from '../sync/syncQueue.js';


// ======================================================
// EVENTO
// ======================================================

export const OFFLINE_PRODUCTS_UPDATE_EVENT =
  'nexgym-offline-products-update';


// ======================================================
// VALIDAR
// ======================================================

const validateProduct = (
  product
) => {

  if (!product) {

    throw new Error(
      'No se recibió el producto.'
    );

  }


  if (!product.id) {

    throw new Error(
      'El producto no contiene ID.'
    );

  }


  if (!product.gymId) {

    throw new Error(
      'El producto no contiene gymId.'
    );

  }


  return true;

};


// ======================================================
// EVENTO
// ======================================================

const dispatchUpdate =
  () => {

    window.dispatchEvent(
      new Event(
        OFFLINE_PRODUCTS_UPDATE_EVENT
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
// PREPARAR
// ======================================================

const prepareProduct = (
  product,
  syncStatus = 'pending'
) => {

  const now =
    new Date()
      .toISOString();


  return {

    ...product,

    id:
      String(
        product.id
      ),

    gymId:
      String(
        product.gymId
      ),

    name:
      String(
        product.name ||
        ''
      ).trim(),

    sku:
      String(
        product.sku ||
        ''
      ).trim(),

    barcode:
      String(
        product.barcode ||
        ''
      ).trim(),

    syncStatus,

    localUpdatedAt:
      now,

    updatedAt:
      product.updatedAt ||
      now

  };

};


// ======================================================
// GUARDAR
// ======================================================

export const saveOfflineProduct =
  async (
    product,
    options = {}
  ) => {

    const {

      queueSync =
        true,

      operation =
        SYNC_OPERATIONS.UPDATE

    } = options;


    validateProduct(
      product
    );


    await openNexgymDatabase();


    const gymId =
      String(
        product.gymId
      );


    const productId =
      String(
        product.id
      );


    const existing =
      await db.products.get([
        gymId,
        productId
      ]);


    const realOperation =
      existing
        ? operation
        : SYNC_OPERATIONS.CREATE;


    const prepared =
      prepareProduct(
        product,
        queueSync
          ? 'pending'
          : 'synced'
      );


    await db.products.put(
      prepared
    );


    if (
      queueSync
    ) {

      await addToSyncQueue({

        gymId,

        entity:
          'product',

        entityId:
          productId,

        operation:
          realOperation,

        payload:
          prepared,

        metadata: {

          source:
            'productRepository',

          local:
            true

        }

      });

    }


    dispatchUpdate();


    console.log(
      '📦 Producto guardado offline:',
      {

        gymId,

        productId,

        name:
          prepared.name,

        operation:
          realOperation

      }
    );


    return prepared;

  };


// ======================================================
// TODOS
// ======================================================

export const getOfflineProducts =
  async (
    gymId
  ) => {

    if (!gymId) {

      return [];

    }


    await openNexgymDatabase();


    return db.products
      .where(
        'gymId'
      )
      .equals(
        String(
          gymId
        )
      )
      .toArray();

  };


// ======================================================
// POR ID
// ======================================================

export const getOfflineProductById =
  async (
    gymId,
    productId
  ) => {

    if (
      !gymId ||
      !productId
    ) {

      return null;

    }


    await openNexgymDatabase();


    return (
      await db.products.get([
        String(
          gymId
        ),

        String(
          productId
        )
      ])
    ) || null;

  };


// ======================================================
// ACTUALIZAR
// ======================================================

export const updateOfflineProduct =
  async (
    gymId,
    productId,
    changes
  ) => {

    const current =
      await getOfflineProductById(
        gymId,
        productId
      );


    if (!current) {

      throw new Error(
        'No se encontró el producto en IndexedDB.'
      );

    }


    return saveOfflineProduct(
      {

        ...current,

        ...changes,

        id:
          current.id,

        gymId:
          current.gymId,

        updatedAt:
          new Date()
            .toISOString()

      },
      {

        queueSync:
          true,

        operation:
          SYNC_OPERATIONS.UPDATE

      }
    );

  };


// ======================================================
// ELIMINAR
// ======================================================

export const deleteOfflineProduct =
  async (
    gymId,
    productId,
    options = {}
  ) => {

    const {

      queueSync =
        true

    } = options;


    if (
      !gymId ||
      !productId
    ) {

      throw new Error(
        'gymId y productId son obligatorios.'
      );

    }


    await openNexgymDatabase();


    const cleanGymId =
      String(
        gymId
      );


    const cleanProductId =
      String(
        productId
      );


    const existing =
      await getOfflineProductById(
        cleanGymId,
        cleanProductId
      );


    if (!existing) {

      return {

        success:
          true,

        alreadyDeleted:
          true

      };

    }


    await db.products.delete([
      cleanGymId,
      cleanProductId
    ]);


    if (
      queueSync
    ) {

      await addToSyncQueue({

        gymId:
          cleanGymId,

        entity:
          'product',

        entityId:
          cleanProductId,

        operation:
          SYNC_OPERATIONS.DELETE,

        payload: {

          id:
            cleanProductId,

          gymId:
            cleanGymId

        },

        metadata: {

          source:
            'productRepository'

        }

      });

    }


    dispatchUpdate();


    console.log(
      '🗑️ Producto eliminado offline:',
      cleanProductId
    );


    return {

      success:
        true,

      product:
        existing

    };

  };


// ======================================================
// DESDE SERVIDOR
// ======================================================

export const saveProductFromServer =
  async (
    product
  ) => {

    validateProduct(
      product
    );


    await openNexgymDatabase();


    const prepared =
      prepareProduct(
        product,
        'synced'
      );


    await db.products.put(
      prepared
    );


    dispatchUpdate();


    return prepared;

  };


// ======================================================
// MUCHOS DESDE SERVIDOR
// ======================================================

export const saveProductsFromServer =
  async (
    products
  ) => {

    const safeProducts =
      Array.isArray(
        products
      )
        ? products
        : [];


    await openNexgymDatabase();


    const prepared =
      safeProducts
        .filter(
          product =>
            product?.id &&
            product?.gymId
        )
        .map(
          product =>
            prepareProduct(
              product,
              'synced'
            )
        );


    if (
      prepared.length >
      0
    ) {

      await db.products.bulkPut(
        prepared
      );

    }


    dispatchUpdate();


    return prepared;

  };


// ======================================================
// EXPORT
// ======================================================

const productRepository = {

  save:
    saveOfflineProduct,

  getAll:
    getOfflineProducts,

  getById:
    getOfflineProductById,

  update:
    updateOfflineProduct,

  delete:
    deleteOfflineProduct,

  saveFromServer:
    saveProductFromServer,

  saveManyFromServer:
    saveProductsFromServer

};


export default productRepository;