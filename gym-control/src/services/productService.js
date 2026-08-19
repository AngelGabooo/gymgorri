// src/services/productService.js

import {
  getCurrentGymContext
} from '../utils/memberId.js';

import {
  saveOfflineProduct,
  deleteOfflineProduct
} from '../offline/repositories/productRepository.js';


// ======================================================
// STORAGE
// ======================================================

export const PRODUCTS_KEY =
  'gym_control_products';

export const PRODUCT_CATEGORIES_KEY =
  'gym_control_product_categories';


// ======================================================
// CATEGORÍAS PREDETERMINADAS
// ======================================================

export const DEFAULT_PRODUCT_CATEGORIES = [
  'Bebidas',
  'Proteínas',
  'Suplementos',
  'Alimentos',
  'Ropa',
  'Accesorios',
  'Otros'
];


// ======================================================
// LEER ARRAY
// ======================================================
//
// IMPORTANTE:
//
// Esta función SOLO LEE.
//
// No escribe.
// No dispara eventos.
// Puede usarse de forma segura durante render de React.
//
// ======================================================

const readArray = (
  key
) => {

  try {

    const raw =
      localStorage.getItem(
        key
      );


    if (!raw) {

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
      `Error leyendo ${key}:`,
      error
    );


    return [];

  }

};


// ======================================================
// GUARDAR ARRAY
// ======================================================
//
// Esta función SÍ modifica almacenamiento.
//
// Solamente debe llamarse desde acciones:
// crear, editar, eliminar, etc.
//
// ======================================================

const saveArray = (
  key,
  data,
  options = {}
) => {

  const {
    emit = true
  } = options;


  const safe =
    Array.isArray(
      data
    )
      ? data
      : [];


  localStorage.setItem(
    key,
    JSON.stringify(
      safe
    )
  );


  if (
    emit
  ) {

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

  }


  return safe;

};


// ======================================================
// CREAR ID
// ======================================================

const createId = (
  prefix = 'PRD'
) => {

  if (
    window.crypto?.randomUUID
  ) {

    return `${prefix}-${window.crypto.randomUUID()}`;

  }


  return (
    `${prefix}-${Date.now()}-` +
    Math.random()
      .toString(36)
      .substring(
        2,
        8
      )
  );

};


// ======================================================
// CONTEXTO DEL GIMNASIO
// ======================================================

const getProductGymContext =
  () => {

    try {

      return (
        getCurrentGymContext() ||
        {}
      );

    } catch (error) {

      console.error(
        'Error obteniendo contexto del gimnasio para productos:',
        error
      );


      return {};

    }

  };


// ======================================================
// TODOS LOS PRODUCTOS SIN FILTRAR
// ======================================================
//
// SOLO LECTURA.
//
// ======================================================

export const getAllStoredProducts =
  () => {

    return readArray(
      PRODUCTS_KEY
    );

  };


// ======================================================
// PRODUCTOS DEL GIMNASIO ACTUAL
// ======================================================
//
// MUY IMPORTANTE:
//
// Esta función ya NO:
// - migra
// - escribe
// - dispara eventos
//
// Por eso puede llamarse desde React sin provocar:
//
// Cannot update Sidebar while rendering ProductsPage
//
// Los registros antiguos sin gymId se conservan visibles
// temporalmente por compatibilidad.
//
// Cuando sean editados se vincularán al gym actual.
//
// ======================================================

export const getProducts =
  () => {

    const products =
      getAllStoredProducts();


    const {
      gymId
    } =
      getProductGymContext();


    if (
      !gymId
    ) {

      return products;

    }


    return products.filter(
      product =>
        !product?.gymId ||
        product.gymId ===
          gymId
    );

  };


// ======================================================
// PRODUCTO POR ID
// ======================================================

export const getProductById =
  (
    productId
  ) => {

    if (
      !productId
    ) {

      return null;

    }


    return (
      getProducts().find(
        product =>
          product.id ===
          productId
      ) ||
      null
    );

  };


// ======================================================
// KEY DE CATEGORÍAS
// ======================================================

const getCategoriesStorageKey =
  () => {

    const {
      gymId
    } =
      getProductGymContext();


    if (
      !gymId
    ) {

      return PRODUCT_CATEGORIES_KEY;

    }


    return `${PRODUCT_CATEGORIES_KEY}:${gymId}`;

  };


// ======================================================
// OBTENER CATEGORÍAS
// ======================================================
//
// SOLO LECTURA.
//
// Antes guardábamos categorías automáticamente aquí.
// Eso podía disparar gym-storage-update durante render.
//
// Ya no lo hacemos.
//
// ======================================================

export const getProductCategories =
  () => {

    const key =
      getCategoriesStorageKey();


    const stored =
      readArray(
        key
      );


    if (
      stored.length >
      0
    ) {

      return stored;

    }


    // ==================================================
    // COMPATIBILIDAD CON CATEGORÍAS ANTIGUAS
    // ==================================================

    if (
      key !==
      PRODUCT_CATEGORIES_KEY
    ) {

      const legacy =
        readArray(
          PRODUCT_CATEGORIES_KEY
        );


      if (
        legacy.length >
        0
      ) {

        return [
          ...legacy
        ];

      }

    }


    return [
      ...DEFAULT_PRODUCT_CATEGORIES
    ];

  };


// ======================================================
// GUARDAR CATEGORÍAS
// ======================================================

export const saveProductCategories =
  (
    categories
  ) => {

    const normalized = [

      ...new Set(

        (
          Array.isArray(
            categories
          )
            ? categories
            : []
        )
          .map(
            item =>
              String(
                item ||
                ''
              ).trim()
          )
          .filter(
            Boolean
          )

      )

    ];


    return saveArray(
      getCategoriesStorageKey(),
      normalized
    );

  };


// ======================================================
// VALIDAR CAMPOS ÚNICOS
// ======================================================

const validateUniqueFields =
  (
    products,
    {
      barcode,
      sku
    },
    ignoredId = null
  ) => {

    if (
      barcode &&
      products.some(
        item =>
          item.id !==
            ignoredId &&
          String(
            item.barcode ||
            ''
          ).trim() ===
            barcode
      )
    ) {

      throw new Error(
        'Ya existe un producto con ese código de barras.'
      );

    }


    if (
      sku &&
      products.some(
        item =>
          item.id !==
            ignoredId &&
          String(
            item.sku ||
            ''
          ).trim() ===
            sku
      )
    ) {

      throw new Error(
        'Ya existe un producto con ese SKU.'
      );

    }

  };


// ======================================================
// VALIDAR NÚMERO
// ======================================================

const validateNumber = (
  value,
  label
) => {

  if (
    !Number.isFinite(
      value
    ) ||
    value <
      0
  ) {

    throw new Error(
      `${label} no es válido.`
    );

  }

};


// ======================================================
// CREAR PRODUCTO
// ======================================================

export const createProduct =
  (
    data = {}
  ) => {

    const currentProducts =
      getProducts();


    const allProducts =
      getAllStoredProducts();


    const {
      gymId,
      gymCode,
      gymName
    } =
      getProductGymContext();


    if (
      !gymId
    ) {

      throw new Error(
        'No se pudo determinar el gimnasio actual.'
      );

    }


    const now =
      new Date()
        .toISOString();


    const name =
      String(
        data.name ||
        ''
      ).trim();


    const category =
      String(
        data.category ||
        'Otros'
      ).trim();


    const sku =
      String(
        data.sku ||
        ''
      ).trim();


    const barcode =
      String(
        data.barcode ||
        ''
      ).trim();


    const cost =
      Number(
        data.cost ||
        0
      );


    const price =
      Number(
        data.price ||
        0
      );


    const stock =
      Number(
        data.stock ||
        0
      );


    const minStock =
      Number(
        data.minStock ||
        0
      );


    // ==================================================
    // VALIDACIONES
    // ==================================================

    if (
      !name
    ) {

      throw new Error(
        'El nombre del producto es obligatorio.'
      );

    }


    validateNumber(
      price,
      'El precio de venta'
    );


    validateNumber(
      cost,
      'El costo del producto'
    );


    validateNumber(
      stock,
      'El stock inicial'
    );


    validateNumber(
      minStock,
      'El stock mínimo'
    );


    validateUniqueFields(
      currentProducts,
      {
        barcode,
        sku
      }
    );


    // ==================================================
    // PRODUCTO
    // ==================================================

    const product = {

      id:
        createId(
          'PRD'
        ),

      gymId,

      gymCode:
        gymCode ||
        null,

      gymName:
        gymName ||
        null,

      name,

      category,

      sku,

      barcode,

      cost,

      price,

      stock,

      minStock,

      unit:
        data.unit ||
        'pieza',

      status:
        data.status ||
        'active',

      image:
        data.image ||
        null,

      description:
        String(
          data.description ||
          ''
        ).trim(),

      createdAt:
        now,

      updatedAt:
        now

    };


    // ==================================================
    // LOCALSTORAGE
    // ==================================================

    allProducts.unshift(
      product
    );


    saveArray(
      PRODUCTS_KEY,
      allProducts
    );


    // ==================================================
    // CATEGORÍA
    // ==================================================

    const categories =
      getProductCategories();


    if (
      category &&
      !categories.includes(
        category
      )
    ) {

      saveProductCategories([
        ...categories,
        category
      ]);

    }


    // ==================================================
    // INDEXEDDB + SYNCQUEUE
    // ==================================================

    void saveOfflineProduct(
      product
    )
      .then(
        saved => {

          console.log(
            '✅ Producto respaldado en IndexedDB:',
            saved
          );

        }
      )
      .catch(
        error => {

          console.error(
            '❌ No se pudo respaldar el producto en IndexedDB:',
            error
          );

        }
      );


    return product;

  };


// ======================================================
// ACTUALIZAR PRODUCTO
// ======================================================

export const updateProduct =
  (
    productId,
    changes = {}
  ) => {

    const current =
      getProductById(
        productId
      );


    if (
      !current
    ) {

      throw new Error(
        'No se encontró el producto.'
      );

    }


    const {
      gymId,
      gymCode,
      gymName
    } =
      getProductGymContext();


    if (
      !gymId
    ) {

      throw new Error(
        'No se pudo determinar el gimnasio actual.'
      );

    }


    if (
      current.gymId &&
      current.gymId !==
        gymId
    ) {

      throw new Error(
        'El producto pertenece a otro gimnasio.'
      );

    }


    const allProducts =
      getAllStoredProducts();


    const index =
      allProducts.findIndex(
        product =>
          product.id ===
          productId &&
        (
          !product.gymId ||
          product.gymId ===
            gymId
        )
      );


    if (
      index <
      0
    ) {

      throw new Error(
        'No se encontró el producto almacenado.'
      );

    }


    const next = {

      ...current,

      ...changes,

      id:
        current.id,

      gymId,

      gymCode:
        current.gymCode ||
        gymCode ||
        null,

      gymName:
        current.gymName ||
        gymName ||
        null,

      name:
        String(
          changes.name ??
          current.name ??
          ''
        ).trim(),

      category:
        String(
          changes.category ??
          current.category ??
          'Otros'
        ).trim(),

      sku:
        String(
          changes.sku ??
          current.sku ??
          ''
        ).trim(),

      barcode:
        String(
          changes.barcode ??
          current.barcode ??
          ''
        ).trim(),

      price:
        Number(
          changes.price ??
          current.price ??
          0
        ),

      cost:
        Number(
          changes.cost ??
          current.cost ??
          0
        ),

      stock:
        Number(
          changes.stock ??
          current.stock ??
          0
        ),

      minStock:
        Number(
          changes.minStock ??
          current.minStock ??
          0
        ),

      updatedAt:
        new Date()
          .toISOString()

    };


    // ==================================================
    // VALIDACIONES
    // ==================================================

    if (
      !next.name
    ) {

      throw new Error(
        'El nombre del producto es obligatorio.'
      );

    }


    validateNumber(
      next.price,
      'El precio de venta'
    );


    validateNumber(
      next.cost,
      'El costo del producto'
    );


    validateNumber(
      next.stock,
      'El stock'
    );


    validateNumber(
      next.minStock,
      'El stock mínimo'
    );


    validateUniqueFields(
      getProducts(),
      {
        barcode:
          next.barcode,

        sku:
          next.sku
      },
      productId
    );


    // ==================================================
    // LOCALSTORAGE
    // ==================================================

    allProducts[
      index
    ] =
      next;


    saveArray(
      PRODUCTS_KEY,
      allProducts
    );


    // ==================================================
    // CATEGORÍA
    // ==================================================

    const categories =
      getProductCategories();


    if (
      next.category &&
      !categories.includes(
        next.category
      )
    ) {

      saveProductCategories([
        ...categories,
        next.category
      ]);

    }


    // ==================================================
    // INDEXEDDB + SYNCQUEUE
    // ==================================================

    void saveOfflineProduct(
      next
    )
      .then(
        saved => {

          console.log(
            '✅ Producto actualizado en IndexedDB:',
            saved
          );

        }
      )
      .catch(
        error => {

          console.error(
            '❌ No se pudo actualizar el producto en IndexedDB:',
            error
          );

        }
      );


    return next;

  };


// ======================================================
// ELIMINAR PRODUCTO
// ======================================================

export const deleteProduct =
  (
    productId
  ) => {

    const current =
      getProductById(
        productId
      );


    if (
      !current
    ) {

      throw new Error(
        'El producto ya no existe.'
      );

    }


    const {
      gymId
    } =
      getProductGymContext();


    if (
      !gymId
    ) {

      throw new Error(
        'No se pudo determinar el gimnasio actual.'
      );

    }


    const allProducts =
      getAllStoredProducts();


    const remaining =
      allProducts.filter(
        product =>
          !(
            product.id ===
              productId &&
            (
              !product.gymId ||
              product.gymId ===
                gymId
            )
          )
      );


    saveArray(
      PRODUCTS_KEY,
      remaining
    );


    void deleteOfflineProduct(
      gymId,
      productId
    )
      .then(
        result => {

          console.log(
            '✅ Eliminación de producto respaldada offline:',
            result
          );

        }
      )
      .catch(
        error => {

          console.error(
            '❌ No se pudo registrar la eliminación offline:',
            error
          );

        }
      );


    return {

      success:
        true,

      productId

    };

  };


// ======================================================
// BUSCAR POR CÓDIGO DE BARRAS
// ======================================================

export const findProductByBarcode =
  (
    barcode
  ) => {

    const normalized =
      String(
        barcode ||
        ''
      ).trim();


    if (
      !normalized
    ) {

      return null;

    }


    return (
      getProducts().find(
        product =>
          product.status !==
            'inactive' &&
          String(
            product.barcode ||
            ''
          ).trim() ===
            normalized
      ) ||
      null
    );

  };


// ======================================================
// BUSCAR PRODUCTOS
// ======================================================

export const searchProducts =
  (
    query = ''
  ) => {

    const term =
      String(
        query ||
        ''
      )
        .trim()
        .toLowerCase();


    if (
      !term
    ) {

      return getProducts();

    }


    return getProducts().filter(
      product => {

        const text = [

          product.name,

          product.category,

          product.sku,

          product.barcode

        ]
          .join(
            ' '
          )
          .toLowerCase();


        return text.includes(
          term
        );

      }
    );

  };


// ======================================================
// STOCK BAJO
// ======================================================

export const getLowStockProducts =
  () => {

    return getProducts().filter(
      product =>
        product.status !==
          'inactive' &&
        Number(
          product.stock ||
          0
        ) <=
        Number(
          product.minStock ||
          0
        )
    );

  };


// ======================================================
// DEFAULT
// ======================================================

const productService = {

  getProducts,

  getAllStoredProducts,

  getProductById,

  getProductCategories,

  saveProductCategories,

  createProduct,

  updateProduct,

  deleteProduct,

  findProductByBarcode,

  searchProducts,

  getLowStockProducts

};
export default productService;