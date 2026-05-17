import { useEffect, useState } from 'react';
import {
  Package, ShoppingBag, TrendingUp, Plus, Edit2, Trash2, X,
  Upload, Calendar, AlertTriangle
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

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

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes, brandsRes, ordersRes, lowStockRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
        api.get('/brands'),
        api.get('/admin/orders'),
        api.get('/admin/low-stock?threshold=5'),
      ]);
      setProducts(productsRes.data.products?.data || productsRes.data.products || []);
      setCategories(categoriesRes.data.categories || []);
      setBrands(brandsRes.data.brands || []);
      setAllOrders(ordersRes.data.orders || []);
      setLowStockVariants(lowStockRes.data.variants || []);
      setStats(prev => ({ ...prev, products: (productsRes.data.products?.data || productsRes.data.products || []).length }));
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
    const filtered = allOrders.filter(order => new Date(order.createdAt) >= startDate);
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
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  const openProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name:        product.name,
        description: product.description || '',
        price:       product.price,
        categoryId:  product.categoryId,
        brandId:     product.brandId,
        variants:    product.variants,
      });
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
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
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
        setImagePreviewUrls(prev => {
          URL.revokeObjectURL(prev[index]);
          return prev.filter((_, i) => i !== index);
        });
        return prevExisting;
      }
    });
  };

  const saveProduct = async () => {
    try {
      let parsedVariants;
      try { parsedVariants = JSON.parse(variantsInput); } catch (e) { toast.error('Invalid JSON for variants'); return; }

      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('description', productForm.description);
      formData.append('price', productForm.price);
      formData.append('category_id', productForm.categoryId);
      formData.append('brand_id', productForm.brandId);
      formData.append('variants', JSON.stringify(parsedVariants));
      formData.append('existing_images', JSON.stringify(existingImages));
      if (removedImageUrls.length) {
        formData.append('removed_images', JSON.stringify(removedImageUrls));
      }
      newImageFiles.forEach(file => formData.append('images[]', file));

      if (editingProduct) {
        await api.post('/products/' + editingProduct.id + '?_method=PUT', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Product updated');
      } else {
        await api.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Product created');
      }
      setShowProductModal(false);
      fetchAllData();
    } catch (err) {
      console.error(err);
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
        toast.success((catBrandType === 'category' ? 'Category' : 'Brand') + ' updated');
      } else {
        await api.post(base, { name: catBrandName });
        toast.success((catBrandType === 'category' ? 'Category' : 'Brand') + ' created');
      }
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
    } catch (err) {
      toast.error('Failed to update order status');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending:   'bg-yellow-100 text-yellow-800',
      paid:      'bg-green-100 text-green-800',
      shipped:   'bg-blue-100 text-blue-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  const periodOptions = [
    { value: '7days',   label: 'Last 7 days' },
    { value: '30days',  label: 'Last 30 days' },
    { value: '3months', label: 'Last 3 months' },
    { value: '1year',   label: 'Last 1 year' },
    { value: 'all',     label: 'All time' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/40 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-light text-gray-900">Admin Dashboard</h1>
            <div className="w-32 h-10 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border p-5 animate-pulse">
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/40 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-light text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center gap-2 bg-white rounded-full pl-3 pr-2 py-1 shadow-sm border border-gray-200">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select value={period} onChange={e => setPeriod(e.target.value)} className="text-sm bg-transparent border-0 focus:ring-0 py-1.5">
              {periodOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border p-5 flex justify-between items-center">
            <div><p className="text-sm text-gray-500">Products</p><p className="text-3xl font-semibold">{stats.products}</p></div>
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border p-5 flex justify-between items-center">
            <div><p className="text-sm text-gray-500">Orders</p><p className="text-3xl font-semibold">{stats.orders}</p></div>
            <ShoppingBag className="w-10 h-10 text-gray-400" />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border p-5 flex justify-between items-center">
            <div><p className="text-sm text-gray-500">Revenue</p><p className="text-3xl font-semibold">${stats.revenue.toFixed(2)}</p></div>
            <TrendingUp className="w-10 h-10 text-gray-400" />
          </div>
        </div>

        {/* Charts */}
        {(dailyRevenue.length > 0 || topProducts.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl shadow-sm border p-5">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Revenue over time</h3>
              {dailyRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => '$' + v} />
                    <Tooltip formatter={v => ['$' + v, 'Revenue']} />
                    <Line type="monotone" dataKey="revenue" stroke="#111827" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-400 text-center py-10">No revenue data yet</p>
              )}
            </div>
            <div className="bg-white rounded-2xl shadow-sm border p-5">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Top products by quantity sold</h3>
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip formatter={v => [v, 'Qty sold']} />
                    <Bar dataKey="qty" fill="#111827" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-400 text-center py-10">No sales data yet</p>
              )}
            </div>
          </div>
        )}

        {/* Low Stock Alert Banner */}
        {lowStockVariants.length > 0 && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-2xl p-4">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowLowStock(!showLowStock)}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <span className="font-medium text-orange-800">
                  Low Stock Alert — {lowStockVariants.length} variant{lowStockVariants.length > 1 ? 's' : ''} running low
                </span>
              </div>
              <span className="text-sm text-orange-600">{showLowStock ? 'Hide ▲' : 'Show ▼'}</span>
            </div>
            {showLowStock && (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-orange-700 border-b border-orange-200">
                      <th className="pb-2 pr-6">Product</th>
                      <th className="pb-2 pr-6">Size</th>
                      <th className="pb-2 pr-6">Color</th>
                      <th className="pb-2 pr-6">SKU</th>
                      <th className="pb-2">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-100">
                    {lowStockVariants.map(v => (
                      <tr key={v.id}>
                        <td className="py-2 pr-6 text-gray-800 font-medium">{v.product?.name || '—'}</td>
                        <td className="py-2 pr-6 text-gray-600">{v.size || '—'}</td>
                        <td className="py-2 pr-6 text-gray-600">{v.color || '—'}</td>
                        <td className="py-2 pr-6 text-gray-500 font-mono text-xs">{v.sku || '—'}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${v.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
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

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6 flex gap-6">
          {['products', 'categories', 'brands', 'orders'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={'pb-2 text-sm font-medium capitalize ' + (activeTab === tab ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-500')}>
              {tab}
            </button>
          ))}
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => openProductModal()} className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm flex items-center gap-1">
                <Plus size={16} /> Add Product
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map(p => (
                    <tr key={p.id}>
                      <td className="px-4 py-4">
                        <img src={p.images?.[0] || 'https://via.placeholder.com/40'} alt={p.name} className="w-10 h-10 object-cover rounded" />
                      </td>
                      <td className="px-4 py-4 text-sm">{p.name}</td>
                      <td className="px-4 py-4 text-sm">${p.price}</td>
                      <td className="px-4 py-4 text-sm">{p.category?.name}</td>
                      <td className="px-4 py-4 text-right">
                        <button onClick={() => openProductModal(p)} className="text-indigo-600 hover:text-indigo-900 mr-3"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No products</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => openCatBrandModal('category')} className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm flex items-center gap-1">
                <Plus size={16} /> Add Category
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map(cat => (
                    <tr key={cat.id}>
                      <td className="px-6 py-4 text-sm">{cat.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{cat.productsCount ?? 0} products</td>
                      <td className="px-6 py-4 text-right flex justify-end gap-3">
                        <button onClick={() => openCatBrandModal('category', cat)} className="text-indigo-600 hover:text-indigo-900"><Edit2 size={16} /></button>
                        <button onClick={() => deleteCatBrand('category', cat.id)} className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-500">No categories</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Brands Tab */}
        {activeTab === 'brands' && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => openCatBrandModal('brand')} className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm flex items-center gap-1">
                <Plus size={16} /> Add Brand
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {brands.map(b => (
                    <tr key={b.id}>
                      <td className="px-6 py-4 text-sm">{b.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{b.productsCount ?? 0} products</td>
                      <td className="px-6 py-4 text-right flex justify-end gap-3">
                        <button onClick={() => openCatBrandModal('brand', b)} className="text-indigo-600 hover:text-indigo-900"><Edit2 size={16} /></button>
                        <button onClick={() => deleteCatBrand('brand', b.id)} className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                  {brands.length === 0 && (
                    <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-500">No brands</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border p-8 text-center text-gray-500">No orders in this period.</div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border p-5">
                  <div className="flex flex-wrap justify-between items-start gap-3">
                    <div>
                      <p className="text-sm text-gray-500">Order #{order.id}</p>
                      <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                      <p className="text-sm mt-1">Customer: {order.user?.firstName} {order.user?.lastName} ({order.user?.phone})</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        className={'text-sm rounded-full px-3 py-1 border-0 focus:ring-1 ' + getStatusBadge(order.status)}
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
                      <span className="font-semibold text-lg">${parseFloat(order.totalAmount).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Items: {order.items?.map(i => i.product?.name + ' (' + i.variant?.size + '/' + i.variant?.color + ') x' + i.quantity).join(', ') || 'No items'}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Product Modal */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
                <button onClick={() => setShowProductModal(false)}><X /></button>
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="Product name" className="w-full border rounded-lg px-3 py-2" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} />
                <textarea placeholder="Description" className="w-full border rounded-lg px-3 py-2" rows="3" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} />
                <input type="number" placeholder="Price" className="w-full border rounded-lg px-3 py-2" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} />
                <select className="w-full border rounded-lg px-3 py-2" value={productForm.categoryId} onChange={e => setProductForm({ ...productForm, categoryId: e.target.value })}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className="w-full border rounded-lg px-3 py-2" value={productForm.brandId} onChange={e => setProductForm({ ...productForm, brandId: e.target.value })}>
                  <option value="">Select brand</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <div>
                  <label className="block text-sm font-medium mb-1">Variants (JSON array)</label>
                  <textarea rows="5" className="w-full font-mono text-sm border rounded-lg px-3 py-2" value={variantsInput} onChange={e => setVariantsInput(e.target.value)} />
                  <p className="text-xs text-gray-500 mt-1">Example: {`[{"size":"M","color":"Black","stock":10,"sku":"SKU123"}]`}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Images</label>
                  <div className="flex flex-wrap gap-3 mb-3">
                    {imagePreviewUrls.map((url, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                        <img src={url} className="w-full h-full object-cover" alt="" />
                        <button type="button" onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                      </div>
                    ))}
                    <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400">
                      <Upload className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-500">Add</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageSelect} />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">Click + to add images. Click x to remove.</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowProductModal(false)} className="px-4 py-2 border rounded-full">Cancel</button>
                <button onClick={saveProduct} className="px-4 py-2 bg-gray-900 text-white rounded-full">Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Category/Brand Modal */}
        {showCatBrandModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium">
                  {editingCatBrand ? 'Edit' : 'Add'} {catBrandType === 'category' ? 'Category' : 'Brand'}
                </h2>
                <button onClick={() => setShowCatBrandModal(false)}><X /></button>
              </div>
              <input
                type="text"
                placeholder="Name"
                className="w-full border rounded-lg px-3 py-2 mb-4"
                value={catBrandName}
                onChange={e => setCatBrandName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveCatBrand()}
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowCatBrandModal(false)} className="px-4 py-2 border rounded-full">Cancel</button>
                <button onClick={saveCatBrand} className="px-4 py-2 bg-gray-900 text-white rounded-full">Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}