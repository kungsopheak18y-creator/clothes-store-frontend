import { useEffect, useState, useMemo } from 'react';
import {
  Package, ShoppingBag, TrendingUp, Plus, Edit2, Trash2, X,
  Upload, Calendar, AlertTriangle, Search, Filter, ChevronDown
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart, Cell
} from 'recharts';

// ── Custom Tooltip for Revenue Chart ─────────────────────────
const RevenueTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
      <p className="font-medium">{label}</p>
      <p className="text-green-400 mt-0.5">${payload[0].value.toFixed(2)}</p>
    </div>
  );
};

const TopProductTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
      <p className="font-medium">{label}</p>
      <p className="text-blue-400 mt-0.5">{payload[0].value} sold</p>
    </div>
  );
};

const BAR_COLORS = ['#111827', '#374151', '#4B5563', '#6B7280', '#9CA3AF'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('products');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 });
  const [period, setPeriod] = useState('7days');

  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockVariants, setLowStockVariants] = useState([]);
  const [showLowStock, setShowLowStock] = useState(false);

  // ── Product filters ───────────────────────────────────────
  const [productSearch, setProductSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [sortBy, setSortBy] = useState('name');

  // ── Modals ────────────────────────────────────────────────
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', categoryId: '', brandId: '', variants: []
  });
  const [variantsInput, setVariantsInput] = useState('[]');
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [removedImageUrls, setRemovedImageUrls] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);

  const [showCatBrandModal, setShowCatBrandModal] = useState(false);
  const [catBrandType, setCatBrandType] = useState('category');
  const [editingCatBrand, setEditingCatBrand] = useState(null);
  const [catBrandName, setCatBrandName] = useState('');

  useEffect(() => { fetchAllData(); }, []);
  useEffect(() => { if (allOrders.length) filterAndComputeStats(); }, [period, allOrders]);

  // ── Filtered + sorted products ────────────────────────────
  const displayedProducts = useMemo(() => {
    let list = [...products];
    if (productSearch) list = list.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
    if (filterCategory) list = list.filter(p => String(p.categoryId ?? p.category?.id) === filterCategory);
    if (filterBrand)    list = list.filter(p => String(p.brandId    ?? p.brand?.id)    === filterBrand);
    if (sortBy === 'name')       list.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'price_asc')  list.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    if (sortBy === 'price_desc') list.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    return list;
  }, [products, productSearch, filterCategory, filterBrand, sortBy]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes, brandsRes, ordersRes, lowStockRes] = await Promise.all([
        api.get('/products?per_page=100'),
        api.get('/categories'),
        api.get('/brands'),
        api.get('/admin/orders'),
        api.get('/admin/low-stock?threshold=5'),
      ]);
      const prods = productsRes.data.products?.data || productsRes.data.products || [];
      setProducts(prods);
      setCategories(categoriesRes.data.categories || []);
      setBrands(brandsRes.data.brands || []);
      setAllOrders(ordersRes.data.orders || []);
      setLowStockVariants(lowStockRes.data.variants || []);
      setStats(prev => ({ ...prev, products: prods.length }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const filterAndComputeStats = () => {
    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case '7days':   startDate.setDate(now.getDate() - 7);         break;
      case '30days':  startDate.setDate(now.getDate() - 30);        break;
      case '3months': startDate.setMonth(now.getMonth() - 3);       break;
      case '1year':   startDate.setFullYear(now.getFullYear() - 1); break;
      default:        startDate = new Date(0);
    }
    const filtered = allOrders.filter(o => new Date(o.createdAt) >= startDate);
    setFilteredOrders(filtered);

    const revenue = filtered
      .filter(o => ['paid','shipped','delivered'].includes(o.status))
      .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
    setStats(prev => ({ ...prev, orders: filtered.length, revenue }));

    const revenueMap = {};
    filtered
      .filter(o => ['paid','shipped','delivered'].includes(o.status))
      .forEach(o => {
        const day = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        revenueMap[day] = (revenueMap[day] || 0) + parseFloat(o.totalAmount);
      });
    setDailyRevenue(Object.entries(revenueMap).map(([date, rev]) => ({ date, revenue: parseFloat(rev.toFixed(2)) })));

    const productMap = {};
    filtered.forEach(o => {
      o.items?.forEach(item => {
        const name = item.product?.name || 'Unknown';
        productMap[name] = (productMap[name] || 0) + item.quantity;
      });
    });
    setTopProducts(
      Object.entries(productMap)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5)
    );
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete('/products/' + id);
      toast.success('Product deleted');
      fetchAllData();
    } catch { toast.error('Failed to delete product'); }
  };

  const openProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({ name: product.name, description: product.description || '', price: product.price, categoryId: product.categoryId, brandId: product.brandId, variants: product.variants });
      setVariantsInput(JSON.stringify(product.variants, null, 2));
      setExistingImages(product.images || []);
      setImagePreviewUrls(product.images || []);
      setNewImageFiles([]);
      setRemovedImageUrls([]);
    } else {
      setEditingProduct(null);
      setProductForm({ name: '', description: '', price: '', categoryId: '', brandId: '', variants: [] });
      setVariantsInput('[]');
      setExistingImages([]);
      setImagePreviewUrls([]);
      setNewImageFiles([]);
      setRemovedImageUrls([]);
    }
    setShowProductModal(true);
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const newPreviewUrls = files.map(f => URL.createObjectURL(f));
    setNewImageFiles(prev => [...prev, ...files]);
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
    e.target.value = '';
  };

  const removeImage = (index) => {
    setExistingImages(prevExisting => {
      const isExisting = index < prevExisting.length;
      if (isExisting) {
        const toRemove = prevExisting[index];
        setRemovedImageUrls(prev => [...prev, toRemove]);
        setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
        return prevExisting.filter((_, i) => i !== index);
      } else {
        const newIndex = index - prevExisting.length;
        setNewImageFiles(prev => prev.filter((_, i) => i !== newIndex));
        setImagePreviewUrls(prev => { URL.revokeObjectURL(prev[index]); return prev.filter((_, i) => i !== index); });
        return prevExisting;
      }
    });
  };

  const saveProduct = async () => {
    try {
      let parsedVariants;
      try { parsedVariants = JSON.parse(variantsInput); } catch { toast.error('Invalid JSON for variants'); return; }
      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('description', productForm.description);
      formData.append('price', productForm.price);
      formData.append('category_id', productForm.categoryId);
      formData.append('brand_id', productForm.brandId);
      formData.append('variants', JSON.stringify(parsedVariants));
      formData.append('existing_images', JSON.stringify(existingImages));
      if (removedImageUrls.length) formData.append('removed_images', JSON.stringify(removedImageUrls));
      newImageFiles.forEach(f => formData.append('images[]', f));
      if (editingProduct) {
        await api.post('/products/' + editingProduct.id + '?_method=PUT', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product updated');
      } else {
        await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product created');
      }
      setShowProductModal(false);
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    }
  };

  const openCatBrandModal = (type, item = null) => {
    setCatBrandType(type);
    setEditingCatBrand(item);
    setCatBrandName(item ? item.name : '');
    setShowCatBrandModal(true);
  };

  const saveCatBrand = async () => {
    if (!catBrandName.trim()) { toast.error('Name is required'); return; }
    const base = catBrandType === 'category' ? '/categories' : '/brands';
    try {
      if (editingCatBrand) {
        await api.put(base + '/' + editingCatBrand.id, { name: catBrandName });
      } else {
        await api.post(base, { name: catBrandName });
      }
      toast.success((catBrandType === 'category' ? 'Category' : 'Brand') + (editingCatBrand ? ' updated' : ' created'));
      setShowCatBrandModal(false);
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    }
  };

  const deleteCatBrand = async (type, id) => {
    if (!confirm('Delete this ' + type + '?')) return;
    const base = type === 'category' ? '/categories' : '/brands';
    try {
      await api.delete(base + '/' + id);
      toast.success((type === 'category' ? 'Category' : 'Brand') + ' deleted');
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch('/orders/' + orderId + '/status', { status: newStatus });
      const res = await api.get('/admin/orders');
      setAllOrders(res.data.orders || []);
      toast.success('Order status updated');
    } catch { toast.error('Failed to update order status'); }
  };

  const statusStyles = {
    pending:   'bg-amber-50 text-amber-700 border border-amber-200',
    paid:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
    shipped:   'bg-blue-50 text-blue-700 border border-blue-200',
    delivered: 'bg-gray-100 text-gray-600 border border-gray-200',
    cancelled: 'bg-red-50 text-red-600 border border-red-200',
  };

  const periodOptions = [
    { value: '7days', label: 'Last 7 days' },
    { value: '30days', label: 'Last 30 days' },
    { value: '3months', label: 'Last 3 months' },
    { value: '1year', label: 'Last 1 year' },
    { value: 'all', label: 'All time' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-8" />
          <div className="grid grid-cols-3 gap-5 mb-8">
            {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl border animate-pulse" />)}
          </div>
          <div className="grid grid-cols-2 gap-5">
            {[...Array(2)].map((_, i) => <div key={i} className="h-64 bg-white rounded-2xl border animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your store</p>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-200">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select value={period} onChange={e => setPeriod(e.target.value)} className="text-sm bg-transparent border-0 focus:ring-0 text-gray-700 pr-6">
              {periodOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between group hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Products</p>
              <p className="text-4xl font-bold text-gray-900 mt-1">{stats.products}</p>
            </div>
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-gray-100 transition-colors">
              <Package className="w-6 h-6 text-gray-500" />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between group hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Orders</p>
              <p className="text-4xl font-bold text-gray-900 mt-1">{stats.orders}</p>
            </div>
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-gray-100 transition-colors">
              <ShoppingBag className="w-6 h-6 text-gray-500" />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between group hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Revenue</p>
              <p className="text-4xl font-bold text-gray-900 mt-1">${stats.revenue.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Revenue over time</h3>
                <p className="text-xs text-gray-400 mt-0.5">Total earnings per day</p>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-medium border border-emerald-100">
                ${stats.revenue.toFixed(2)} total
              </span>
            </div>
            {dailyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dailyRevenue} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#111827" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => '$' + v} axisLine={false} tickLine={false} width={45} />
                  <Tooltip content={<RevenueTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#111827" strokeWidth={2} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 4, fill: '#111827' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-56 flex items-center justify-center">
                <p className="text-sm text-gray-400">No revenue data for this period</p>
              </div>
            )}
          </div>

          {/* Top Products Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Top products</h3>
                <p className="text-xs text-gray-400 mt-0.5">By quantity sold</p>
              </div>
              <span className="text-xs bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full font-medium border border-gray-100">
                Top {topProducts.length}
              </span>
            </div>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} width={110} axisLine={false} tickLine={false} />
                  <Tooltip content={<TopProductTooltip />} />
                  <Bar dataKey="qty" radius={[0, 6, 6, 0]} maxBarSize={28}>
                    {topProducts.map((_, idx) => (
                      <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-56 flex items-center justify-center">
                <p className="text-sm text-gray-400">No sales data for this period</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Low Stock Alert ── */}
        {lowStockVariants.length > 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 cursor-pointer" onClick={() => setShowLowStock(!showLowStock)}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Low Stock Alert</p>
                  <p className="text-xs text-amber-600">{lowStockVariants.length} variant{lowStockVariants.length > 1 ? 's' : ''} running low</p>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-amber-500 transition-transform ${showLowStock ? 'rotate-180' : ''}`} />
            </div>
            {showLowStock && (
              <div className="border-t border-amber-200 px-5 py-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-amber-600 uppercase tracking-wide">
                      <th className="pb-2 pr-6 font-medium">Product</th>
                      <th className="pb-2 pr-6 font-medium">Size</th>
                      <th className="pb-2 pr-6 font-medium">Color</th>
                      <th className="pb-2 pr-6 font-medium">SKU</th>
                      <th className="pb-2 font-medium">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {lowStockVariants.map(v => (
                      <tr key={v.id}>
                        <td className="py-2.5 pr-6 text-gray-800 font-medium">{v.product?.name || '—'}</td>
                        <td className="py-2.5 pr-6 text-gray-600">{v.size || '—'}</td>
                        <td className="py-2.5 pr-6 text-gray-600">{v.color || '—'}</td>
                        <td className="py-2.5 pr-6 text-gray-400 font-mono text-xs">{v.sku || '—'}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${v.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {v.stock === 0 ? 'Out of stock' : `${v.stock} left`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {['products', 'categories', 'brands', 'orders'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── Products Tab ── */}
        {activeTab === 'products' && (
          <div>
            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>
              {/* Category Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="pl-9 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 appearance-none cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                </select>
              </div>
              {/* Brand Filter */}
              <div className="relative">
                <select
                  value={filterBrand}
                  onChange={e => setFilterBrand(e.target.value)}
                  className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 appearance-none cursor-pointer"
                >
                  <option value="">All Brands</option>
                  {brands.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
                </select>
              </div>
              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 appearance-none cursor-pointer"
                >
                  <option value="name">Sort: Name</option>
                  <option value="price_asc">Sort: Price ↑</option>
                  <option value="price_desc">Sort: Price ↓</option>
                </select>
              </div>
              {/* Clear Filters */}
              {(productSearch || filterCategory || filterBrand) && (
                <button
                  onClick={() => { setProductSearch(''); setFilterCategory(''); setFilterBrand(''); }}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-800 bg-white border border-gray-200 rounded-xl transition-colors"
                >
                  Clear filters
                </button>
              )}
              <div className="ml-auto">
                <button onClick={() => openProductModal()} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-1.5 hover:bg-gray-800 transition-colors">
                  <Plus size={15} /> Add Product
                </button>
              </div>
            </div>

            {/* Results count */}
            <p className="text-xs text-gray-400 mb-3">{displayedProducts.length} product{displayedProducts.length !== 1 ? 's' : ''} found</p>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-50">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Image</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Name</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Price</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Category</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Brand</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayedProducts.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <img src={p.images?.[0] || 'https://via.placeholder.com/40'} alt={p.name} className="w-11 h-11 object-cover rounded-lg border border-gray-100" />
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-gray-900">{p.name}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-700">${parseFloat(p.price).toFixed(2)}</td>
                      <td className="px-5 py-4">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">{p.category?.name || '—'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">{p.brand?.name || '—'}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openProductModal(p)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {displayedProducts.length === 0 && (
                    <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-400 text-sm">No products match your filters</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Categories Tab ── */}
        {activeTab === 'categories' && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => openCatBrandModal('category')} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-1.5 hover:bg-gray-800 transition-colors">
                <Plus size={15} /> Add Category
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-50">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Name</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Products</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {categories.map(cat => (
                    <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 text-sm font-medium text-gray-900">{cat.name}</td>
                      <td className="px-5 py-4">
                        <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">{cat.productsCount ?? 0} products</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openCatBrandModal('category', cat)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 size={15} /></button>
                          <button onClick={() => deleteCatBrand('category', cat.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && <tr><td colSpan="3" className="px-6 py-12 text-center text-gray-400 text-sm">No categories yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Brands Tab ── */}
        {activeTab === 'brands' && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => openCatBrandModal('brand')} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-1.5 hover:bg-gray-800 transition-colors">
                <Plus size={15} /> Add Brand
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-50">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Name</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Products</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {brands.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 text-sm font-medium text-gray-900">{b.name}</td>
                      <td className="px-5 py-4">
                        <span className="text-xs bg-blue-50 text-blue-500 px-2.5 py-1 rounded-full">{b.productsCount ?? 0} products</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openCatBrandModal('brand', b)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 size={15} /></button>
                          <button onClick={() => deleteCatBrand('brand', b.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {brands.length === 0 && <tr><td colSpan="3" className="px-6 py-12 text-center text-gray-400 text-sm">No brands yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Orders Tab ── */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">No orders in this period.</div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap justify-between items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">Order #{order.id}</p>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusStyles[order.status] || 'bg-gray-100 text-gray-600'}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {order.user?.firstName} {order.user?.lastName}
                        {order.user?.phone && <span className="text-gray-400"> · {order.user.phone}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        className={`text-xs rounded-xl px-3 py-1.5 border-0 focus:ring-1 focus:ring-gray-300 font-medium cursor-pointer ${statusStyles[order.status] || 'bg-gray-100 text-gray-600'}`}
                        value={order.status}
                        onChange={e => handleUpdateOrderStatus(order.id, e.target.value)}
                        disabled={order.status === 'delivered' || order.status === 'cancelled'}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <span className="text-lg font-bold text-gray-900">${parseFloat(order.totalAmount).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <p className="text-xs text-gray-400">
                      {order.items?.map(i => `${i.product?.name} (${i.variant?.size}/${i.variant?.color}) ×${i.quantity}`).join(' · ') || 'No items'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Product Modal ── */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
                <button onClick={() => setShowProductModal(false)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4">
                <input type="text" placeholder="Product name" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} />
                <textarea placeholder="Description" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" rows="3" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} />
                <input type="number" placeholder="Price" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <select className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" value={productForm.categoryId} onChange={e => setProductForm({ ...productForm, categoryId: e.target.value })}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" value={productForm.brandId} onChange={e => setProductForm({ ...productForm, brandId: e.target.value })}>
                    <option value="">Select brand</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Variants <span className="text-gray-400 font-normal">(JSON)</span></label>
                  <textarea rows="5" className="w-full font-mono text-xs border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200" value={variantsInput} onChange={e => setVariantsInput(e.target.value)} />
                  <p className="text-xs text-gray-400 mt-1">e.g. {`[{"size":"M","color":"Black","stock":10,"sku":"SKU123"}]`}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                  <div className="flex flex-wrap gap-3">
                    {imagePreviewUrls.map((url, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                        <img src={url} className="w-full h-full object-cover" alt="" />
                        <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow">×</button>
                      </div>
                    ))}
                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-xs text-gray-400 mt-1">Add</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageSelect} />
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
                <button onClick={() => setShowProductModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={saveProduct} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors">Save Product</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Category/Brand Modal ── */}
        {showCatBrandModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
              <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingCatBrand ? 'Edit' : 'Add'} {catBrandType === 'category' ? 'Category' : 'Brand'}
                </h2>
                <button onClick={() => setShowCatBrandModal(false)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><X size={18} /></button>
              </div>
              <div className="p-6">
                <input
                  type="text"
                  placeholder="Name"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                  value={catBrandName}
                  onChange={e => setCatBrandName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveCatBrand()}
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
                <button onClick={() => setShowCatBrandModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={saveCatBrand} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors">Save</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}