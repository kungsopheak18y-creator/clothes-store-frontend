import { useEffect, useState } from 'react';
import api from '../lib/api';
import ProductCard from '../components/product/ProductCard';
import Filters from '../components/product/Filters';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { ChevronDown, Search, X } from 'lucide-react';

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(''); // ✅ what user types
  const [search, setSearch] = useState('');           // ✅ debounced value sent to API
  const [filters, setFilters] = useState({
    category_id: '', brand_id: '', size: '', minPrice: '', maxPrice: '',
  });
  const [sortBy, setSortBy] = useState('default');

  // ✅ Debounce — wait 400ms after user stops typing before searching
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ✅ Re-fetch whenever filters, sort, or search changes
  useEffect(() => {
    fetchProducts();
  }, [filters, sortBy, search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.brand_id) params.append('brand_id', filters.brand_id);
      if (filters.size) params.append('size', filters.size);
      if (filters.minPrice) params.append('min_price', filters.minPrice);
      if (filters.maxPrice) params.append('max_price', filters.maxPrice);
      if (search) params.append('search', search); // ✅ send search to Laravel

      if (sortBy === 'price_asc') { params.append('sort_by', 'price'); params.append('sort_order', 'asc'); }
      if (sortBy === 'price_desc') { params.append('sort_by', 'price'); params.append('sort_order', 'desc'); }
      if (sortBy === 'name_asc') { params.append('sort_by', 'name'); params.append('sort_order', 'asc'); }

      params.append('per_page', 50);

      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data.products?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
  };

  const resetAll = () => {
    setFilters({ category_id: '', brand_id: '', size: '', minPrice: '', maxPrice: '' });
    setSearchInput('');
    setSearch('');
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-24">
      <div className="container-premium py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-light text-brand-800">Our Collection</h1>
          <p className="text-brand-500 mt-2">Timeless pieces for every occasion</p>
        </div>

        {/* ✅ Search Bar */}
        <div className="max-w-xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products or brands..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-white border border-brand-200 rounded-full py-3 pl-11 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent shadow-sm transition"
            />
            {/* ✅ Clear button appears when user typed something */}
            {searchInput && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {/* ✅ Show active search label */}
          {search && (
            <p className="text-center text-sm text-brand-400 mt-2">
              Results for <span className="font-medium text-brand-700">"{search}"</span>
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-1/4">
            <div className="sticky top-32 bg-white rounded-2xl shadow-premium border border-brand-100 p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-brand-800">Filters</h3>
                <button onClick={resetAll} className="text-sm text-brand-500 hover:text-brand-700 underline">
                  Reset all
                </button>
              </div>
              <Filters filters={filters} setFilters={setFilters} />
            </div>
          </aside>

          <main className="lg:w-3/4">
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-brand-500">{products.length} products</p>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-brand-200 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                >
                  <option value="default">Sort by: Featured</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name_asc">Name: A to Z</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400 pointer-events-none" />
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                {[...Array(6)].map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-brand-100">
                <Search className="w-10 h-10 text-brand-200 mx-auto mb-3" />
                <p className="text-brand-500 text-lg">
                  {search ? `No products found for "${search}"` : 'No products match your filters.'}
                </p>
                <button onClick={resetAll} className="mt-4 text-brand-600 underline hover:text-brand-800">
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                {products.map(product => <ProductCard key={product.id} product={product} />)}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}