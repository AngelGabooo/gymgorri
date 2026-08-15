// src/components/Sales/ProductFormModal.jsx

import React, {
  useEffect,
  useState
} from 'react';

import {
  PackagePlus,
  X,
  Save,
  AlertCircle
} from 'lucide-react';

import {
  createProduct,
  updateProduct,
  getProductCategories
} from '../../services/productService';

const EMPTY_FORM = {
  name: '',
  category: 'Bebidas',
  sku: '',
  barcode: '',
  cost: '',
  price: '',
  stock: '',
  minStock: '3',
  unit: 'pieza',
  status: 'active',
  description: ''
};

const ProductFormModal = ({
  open,
  onClose,
  product = null,
  onSaved
}) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const categories = getProductCategories();

  useEffect(() => {
    if (!open) return;

    if (product) {
      setForm({
        name: product.name || '',
        category: product.category || 'Otros',
        sku: product.sku || '',
        barcode: product.barcode || '',
        cost: String(product.cost ?? ''),
        price: String(product.price ?? ''),
        stock: String(product.stock ?? ''),
        minStock: String(product.minStock ?? 0),
        unit: product.unit || 'pieza',
        status: product.status || 'active',
        description: product.description || ''
      });
    } else {
      setForm(EMPTY_FORM);
    }

    setError('');
  }, [open, product]);

  if (!open) return null;

  const patch = (key, value) => {
    setForm(previous => ({
      ...previous,
      [key]: value
    }));
    setError('');
  };

  const save = () => {
    try {
      setSaving(true);
      setError('');

      const payload = {
        ...form,
        cost: Number(form.cost || 0),
        price: Number(form.price || 0),
        stock: Number(form.stock || 0),
        minStock: Number(form.minStock || 0)
      };

      const saved = product
        ? updateProduct(product.id, payload)
        : createProduct(payload);

      onSaved?.(saved);
      onClose?.();
    } catch (saveError) {
      setError(saveError?.message || 'No se pudo guardar el producto.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-[#111111] border border-[#242424] rounded-2xl shadow-2xl">
        <div className="p-6 border-b border-[#1f1f1f] flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center">
              <PackagePlus size={20} className="text-[#00ff88]" />
            </div>

            <div>
              <h2 className="text-white text-xl font-black">
                {product ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <p className="text-gray-500 text-sm">
                Información comercial e inventario.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#292929] text-gray-400 hover:text-white flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Nombre *"
              value={form.name}
              onChange={value => patch('name', value)}
              placeholder="Ej. Agua 1L"
            />

            <SelectField
              label="Categoría"
              value={form.category}
              onChange={value => patch('category', value)}
              options={categories}
            />

            <Field
              label="SKU"
              value={form.sku}
              onChange={value => patch('sku', value)}
              placeholder="AGUA-001"
            />

            <Field
              label="Código de barras"
              value={form.barcode}
              onChange={value => patch('barcode', value)}
              placeholder="7501234567890"
            />

            <Field
              label="Costo"
              value={form.cost}
              onChange={value => patch('cost', value)}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
            />

            <Field
              label="Precio de venta *"
              value={form.price}
              onChange={value => patch('price', value)}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
            />

            <Field
              label="Stock actual"
              value={form.stock}
              onChange={value => patch('stock', value)}
              type="number"
              min="0"
              step="1"
              placeholder="0"
            />

            <Field
              label="Stock mínimo"
              value={form.minStock}
              onChange={value => patch('minStock', value)}
              type="number"
              min="0"
              step="1"
              placeholder="3"
            />

            <SelectField
              label="Unidad"
              value={form.unit}
              onChange={value => patch('unit', value)}
              options={[
                'pieza',
                'botella',
                'porción',
                'bolsa',
                'caja'
              ]}
            />

            <SelectField
              label="Estado"
              value={form.status}
              onChange={value => patch('status', value)}
              options={[
                { value: 'active', label: 'Activo' },
                { value: 'inactive', label: 'Descontinuado' }
              ]}
            />
          </div>

          <div>
            <label className="text-white text-sm font-medium block mb-2">
              Descripción
            </label>
            <textarea
              rows="3"
              value={form.description}
              onChange={event => patch('description', event.target.value)}
              placeholder="Descripción opcional..."
              className="w-full bg-[#191919] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-600 resize-none focus:border-[#00ff88] focus:outline-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span>{error}</span>
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
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#00ff88] text-black font-black flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={17} />
            {saving ? 'Guardando...' : 'Guardar producto'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Field = ({
  label,
  value,
  onChange,
  type = 'text',
  ...props
}) => (
  <div>
    <label className="text-white text-sm font-medium block mb-2">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={event => onChange(event.target.value)}
      className="w-full bg-[#191919] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-[#00ff88] focus:outline-none"
      {...props}
    />
  </div>
);

const SelectField = ({
  label,
  value,
  onChange,
  options
}) => (
  <div>
    <label className="text-white text-sm font-medium block mb-2">
      {label}
    </label>
    <select
      value={value}
      onChange={event => onChange(event.target.value)}
      className="w-full bg-[#191919] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:border-[#00ff88] focus:outline-none"
    >
      {options.map(option => {
        const normalized =
          typeof option === 'string'
            ? {
                value: option,
                label:
                  option.charAt(0).toUpperCase() +
                  option.slice(1)
              }
            : option;

        return (
          <option
            key={normalized.value}
            value={normalized.value}
          >
            {normalized.label}
          </option>
        );
      })}
    </select>
  </div>
);

export default ProductFormModal;
