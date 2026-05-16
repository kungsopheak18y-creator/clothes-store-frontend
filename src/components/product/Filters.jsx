import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { FilterX } from 'lucide-react';

export default function Filters({ filters, setFilters }) {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        // ✅ Fixed: Laravel uses /categories and /brands (not /products/categories)
        const [catRes, brandRes] = await Promise.all([
          api.get('/categories'),
          api.get('/brands'),
        ]);
        // ✅ Fixed: Laravel returns { categories: [...] } and { brands: [...] }
        setCategories(catRes.data.categories || []);
        setBrands(brandRes.data.brands || []);
      } catch (error) {
        console.error('Failed to load filters', error);
      }
    };
    fetchFilters();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    // ✅ Fixed: use snake_case keys matching Shop.jsx
    setFilters({ category_id: '', brand_id: '', size: '', minPrice: '', maxPrice: '' });
  };

  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        {/* ✅ Fixed: name="category_id" to match snake_case filter keys */}
        <select name="category_id" value={filters.category_id} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:border-gray-400 focus:outline-none">
          <option value="">All</option>
          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
        {/* ✅ Fixed: name="brand_id" */}
        <select name="brand_id" value={filters.brand_id} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:border-gray-400 focus:outline-none">
          <option value="">All</option>
          {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
        <div className="flex flex-wrap gap-2">
          {sizes.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setFilters(prev => ({ ...prev, size: prev.size === s ? '' : s }))}
              className={`px-3 py-1 rounded-full text-sm transition ${filters.size === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
        <div className="flex gap-2">
          <input type="number" name="minPrice" placeholder="Min" value={filters.minPrice} onChange={handleChange} className="w-1/2 border border-gray-200 rounded-lg px-3 py-2" />
          <input type="number" name="maxPrice" placeholder="Max" value={filters.maxPrice} onChange={handleChange} className="w-1/2 border border-gray-200 rounded-lg px-3 py-2" />
        </div>
      </div>

      <button onClick={clearFilters} className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition flex items-center justify-center gap-1">
        <FilterX className="w-4 h-4" /> Reset all
      </button>
    </div>
  );
}