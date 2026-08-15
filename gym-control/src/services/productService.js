// src/services/productService.js

export const PRODUCTS_KEY = 'gym_control_products';
export const PRODUCT_CATEGORIES_KEY = 'gym_control_product_categories';

export const DEFAULT_PRODUCT_CATEGORIES = [
  'Bebidas',
  'Proteínas',
  'Suplementos',
  'Alimentos',
  'Ropa',
  'Accesorios',
  'Otros'
];

const readArray = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Error leyendo ${key}:`, error);
    return [];
  }
};

const saveArray = (key, data) => {
  const safe = Array.isArray(data) ? data : [];
  localStorage.setItem(key, JSON.stringify(safe));
  window.dispatchEvent(new Event('gym-storage-update'));
  window.dispatchEvent(new Event('gym-sales-update'));
  return safe;
};

const createId = (prefix = 'PRD') => {
  if (window.crypto?.randomUUID) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)}`;
};

export const getProducts = () => readArray(PRODUCTS_KEY);

export const getProductById = (productId) =>
  getProducts().find(product => product.id === productId) || null;

export const getProductCategories = () => {
  const stored = readArray(PRODUCT_CATEGORIES_KEY);

  if (stored.length > 0) {
    return stored;
  }

  saveArray(PRODUCT_CATEGORIES_KEY, DEFAULT_PRODUCT_CATEGORIES);
  return [...DEFAULT_PRODUCT_CATEGORIES];
};

export const saveProductCategories = (categories) => {
  const normalized = [
    ...new Set(
      (Array.isArray(categories) ? categories : [])
        .map(item => String(item || '').trim())
        .filter(Boolean)
    )
  ];

  return saveArray(PRODUCT_CATEGORIES_KEY, normalized);
};

export const createProduct = (data = {}) => {
  const products = getProducts();
  const now = new Date().toISOString();

  const name = String(data.name || '').trim();
  const category = String(data.category || 'Otros').trim();
  const price = Number(data.price || 0);
  const cost = Number(data.cost || 0);
  const stock = Number(data.stock || 0);
  const minStock = Number(data.minStock || 0);
  const barcode = String(data.barcode || '').trim();
  const sku = String(data.sku || '').trim();

  if (!name) {
    throw new Error('El nombre del producto es obligatorio.');
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error('El precio de venta no es válido.');
  }

  if (!Number.isFinite(cost) || cost < 0) {
    throw new Error('El costo del producto no es válido.');
  }

  if (!Number.isFinite(stock) || stock < 0) {
    throw new Error('El stock inicial no es válido.');
  }

  if (barcode && products.some(item => item.barcode === barcode)) {
    throw new Error('Ya existe un producto con ese código de barras.');
  }

  if (sku && products.some(item => item.sku === sku)) {
    throw new Error('Ya existe un producto con ese SKU.');
  }

  const product = {
    id: createId('PRD'),
    name,
    category,
    sku,
    barcode,
    cost,
    price,
    stock,
    minStock,
    unit: data.unit || 'pieza',
    status: data.status || 'active',
    image: data.image || null,
    description: String(data.description || '').trim(),
    createdAt: now,
    updatedAt: now
  };

  products.unshift(product);
  saveArray(PRODUCTS_KEY, products);

  const categories = getProductCategories();
  if (category && !categories.includes(category)) {
    saveProductCategories([...categories, category]);
  }

  return product;
};

export const updateProduct = (productId, changes = {}) => {
  const products = getProducts();
  const index = products.findIndex(product => product.id === productId);

  if (index < 0) {
    throw new Error('No se encontró el producto.');
  }

  const next = {
    ...products[index],
    ...changes,
    id: products[index].id,
    price: Number(changes.price ?? products[index].price ?? 0),
    cost: Number(changes.cost ?? products[index].cost ?? 0),
    stock: Number(changes.stock ?? products[index].stock ?? 0),
    minStock: Number(changes.minStock ?? products[index].minStock ?? 0),
    updatedAt: new Date().toISOString()
  };

  const barcode = String(next.barcode || '').trim();
  const sku = String(next.sku || '').trim();

  if (
    barcode &&
    products.some(
      product => product.id !== productId && product.barcode === barcode
    )
  ) {
    throw new Error('Ya existe otro producto con ese código de barras.');
  }

  if (
    sku &&
    products.some(product => product.id !== productId && product.sku === sku)
  ) {
    throw new Error('Ya existe otro producto con ese SKU.');
  }

  products[index] = next;
  saveArray(PRODUCTS_KEY, products);

  return next;
};

export const deleteProduct = (productId) => {
  const products = getProducts();
  const exists = products.some(product => product.id === productId);

  if (!exists) {
    throw new Error('El producto ya no existe.');
  }

  const remaining = products.filter(product => product.id !== productId);
  saveArray(PRODUCTS_KEY, remaining);

  return {
    success: true,
    productId
  };
};

export const findProductByBarcode = (barcode) => {
  const normalized = String(barcode || '').trim();

  if (!normalized) {
    return null;
  }

  return (
    getProducts().find(
      product =>
        product.status !== 'inactive' &&
        String(product.barcode || '').trim() === normalized
    ) || null
  );
};

export const searchProducts = (query = '') => {
  const term = String(query || '').trim().toLowerCase();

  if (!term) {
    return getProducts();
  }

  return getProducts().filter(product => {
    const text = [
      product.name,
      product.category,
      product.sku,
      product.barcode
    ]
      .join(' ')
      .toLowerCase();

    return text.includes(term);
  });
};

export const getLowStockProducts = () =>
  getProducts().filter(
    product =>
      product.status !== 'inactive' &&
      Number(product.stock || 0) <= Number(product.minStock || 0)
  );
